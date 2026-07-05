const fs = require('fs');
let code = fs.readFileSync('server/routes/endpoints.js', 'utf8');

// 1. Remove activeSyncJobs = new Map()
code = code.replace('const activeSyncJobs = new Map();\n', '');

// 2. Rewrite sync routes
const syncRoutesRegex = /\/\/ --- BACKGROUND SYNC ENGINE ---[\s\S]*/;

const newCode = `// --- BACKGROUND SYNC ENGINE ---

async function runSyncJob(endpointIdStr, skipOffset) {
  const db = require('../db.js').getDb();
  const { ObjectId } = require('mongodb');
  const endpointId = new ObjectId(endpointIdStr);
  
  let jobState = {
    status: 'running',
    current: 0,
    total: 0,
    download_loaded: 0,
    download_total: 0,
    error: null,
    cancelled: false
  };
  let lastFlush = 0;

  const flushState = async (force = false) => {
    const now = Date.now();
    if (force || now - lastFlush > 500) {
      lastFlush = now;
      const updatePayload = {
        status: jobState.status,
        current: jobState.current,
        total: jobState.total,
        download_loaded: jobState.download_loaded,
        download_total: jobState.download_total,
        error: jobState.error,
        updated_at: new Date()
      };
      
      const result = await db.collection('thiruxdb_sync_jobs').findOneAndUpdate(
        { endpoint_id: endpointIdStr },
        { $set: updatePayload },
        { returnDocument: 'after' }
      );
      
      if (result && result.cancelled) {
        jobState.cancelled = true;
      }
    }
  };

  const startTime = Date.now();
  let status = 'success';
  let errorMessage = null;
  let recordsFetched = 0, recordsCreated = 0, recordsUpdated = 0;

  try {
    const endpoint = await db.collection('thiruxdb_api_endpoints').findOne({ _id: endpointId });
    if (!endpoint) throw new Error('Endpoint not found');

    const headers = { 'Content-Type': 'application/json' };
    const authConfig = endpoint.auth_config || {};
    if (endpoint.auth_type === 'bearer' && authConfig.token) {
      headers['Authorization'] = \`Bearer \${authConfig.token}\`;
    } else if (endpoint.auth_type === 'api_key') {
      const ha = authConfig.headers;
      if (ha) Object.assign(headers, ha);
    } else if (endpoint.auth_type === 'basic') {
      const { username, password } = authConfig;
      if (username && password) headers['Authorization'] = \`Basic \${Buffer.from(\`\${username}:\${password}\`).toString('base64')}\`;
    }

    let urls = [endpoint.base_url];

    // Generate URLs from path variables
    if (endpoint.path_variables && endpoint.path_variables.length > 0) {
      for (const pv of endpoint.path_variables) {
        if (!pv.variable || !pv.source_collection || !pv.source_field) continue;
        const values = await db.collection(pv.source_collection).distinct(pv.source_field);
        const newUrls = [];
        for (const url of urls) {
          for (const val of values) {
            if (val !== undefined && val !== null) {
              newUrls.push(url.replace(pv.variable, encodeURIComponent(String(val))));
            }
          }
        }
        urls = newUrls;
      }
    }

    const mappings = endpoint.field_mappings || [];
    const targetCol = endpoint.collection_name || 'thiruxdb_data_records';

    const isMultiUrl = urls.length > 1;
    if (isMultiUrl) {
      if (skipOffset > 0) urls = urls.slice(skipOffset);
      jobState.total = urls.length;
    } else {
      jobState.total = 1; // placeholder, updated after fetch
    }
    await flushState(true);

    let urlIndex = 0;
    for (const url of urls) {
      await flushState();
      if (jobState.cancelled) {
        errorMessage = 'Cancelled by user';
        status = 'partial';
        break;
      }

      let items = [];
      try {
        jobState.status = 'downloading';
        jobState.download_loaded = 0;
        jobState.download_total = 0;
        await flushState(true);

        const response = await fetch(url, { headers });
        if (!response.ok) {
           console.error(\`Failed to fetch \${url}: HTTP \${response.status}\`);
           urlIndex++;
           if (isMultiUrl) jobState.current = urlIndex;
           jobState.status = 'running';
           await flushState(true);
           continue; 
        }

        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          jobState.download_total = parseInt(contentLength, 10);
        }

        const reader = response.body.getReader();
        const chunks = [];
        let loaded = 0;

        while (true) {
          await flushState();
          if (jobState.cancelled) break;
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          jobState.download_loaded = loaded;
        }

        if (jobState.cancelled) {
          jobState.status = 'partial';
          errorMessage = 'Cancelled by user';
          break;
        }

        jobState.status = 'running';
        await flushState(true);

        const bodyStr = Buffer.concat(chunks).toString('utf-8');
        const jsonData = JSON.parse(bodyStr);
        let data = jsonData;
        if (endpoint.response_path) {
          for (const path of endpoint.response_path.split('.')) data = data?.[path];
        }
        items = Array.isArray(data) ? data : [data].filter(Boolean);
        
        if (!isMultiUrl && skipOffset > 0) {
           items = items.slice(skipOffset);
        }
        if (!isMultiUrl) {
           jobState.total = items.length;
           await flushState(true);
        }
      } catch (err) {
        console.error(\`Error fetching \${url}: \${err.message}\`);
        urlIndex++;
        if (isMultiUrl) jobState.current = urlIndex;
        await flushState(true);
        continue;
      }

      recordsFetched += items.length;

      for (let i = 0; i < items.length; i++) {
        await flushState();
        if (jobState.cancelled) {
          errorMessage = 'Cancelled by user';
          status = 'partial';
          break;
        }

        const item = items[i];
        let externalId = null;
        if (endpoint.id_field) externalId = item?.[endpoint.id_field]?.toString() || null;
        else externalId = item?.id?.toString() || item?._id?.toString() || null;

        let mappedData = {};
        for (const mapping of mappings) {
          const value = item?.[mapping.sourceField];
          if (value !== undefined) {
            let tv = value;
            if (mapping.transform === 'number') tv = Number(value);
            else if (mapping.transform === 'boolean') tv = Boolean(value);
            else if (mapping.transform === 'date') tv = new Date(value).toISOString();
            else tv = String(value);
            mappedData[mapping.targetField] = tv;
          }
        }

        const now = new Date();
        const searchText = JSON.stringify(item);

        if (externalId) {
          const filter = { endpoint_id: endpointIdStr, external_id: externalId };
          const existing = await db.collection(targetCol).findOne(filter);
          if (existing) {
            await db.collection(targetCol).updateOne(filter, {
              $set: {
                raw_data: item,
                mapped_data: mappedData,
                fetched_at: now,
                updated_at: now,
                _search_text: searchText,
              },
            });
            recordsUpdated++;
          } else {
            await db.collection(targetCol).insertOne({
              endpoint_id: endpointIdStr,
              external_id: externalId,
              raw_data: item,
              mapped_data: mappedData,
              _search_text: searchText,
              fetched_at: now,
              created_at: now,
              updated_at: now,
            });
            recordsCreated++;
          }
        } else {
          await db.collection(targetCol).insertOne({
            endpoint_id: endpointIdStr,
            external_id: null,
            raw_data: item,
            mapped_data: mappedData,
            _search_text: searchText,
            fetched_at: now,
            created_at: now,
            updated_at: now,
          });
          recordsCreated++;
        } // end if externalId

        if (!isMultiUrl && i % 10 === 0) {
          jobState.current = i;
        }
      } // end for items

      urlIndex++;
      if (isMultiUrl) {
        jobState.current = urlIndex;
      } else {
        jobState.current = items.length;
      }
      await flushState(true);

    } // end for urls

  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    jobState.error = err.message;
  }

  // Finalize
  if (status !== 'partial') {
    status = errorMessage ? 'error' : 'completed';
  }
  jobState.status = status;
  await flushState(true);

  try {
    const db = require('../db.js').getDb();
    await fetch(\`http://localhost:\${process.env.PORT || 3001}/api/logs\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint_id: endpointIdStr,
        status,
        records_fetched: recordsFetched,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        error_message: errorMessage,
        duration_ms: Date.now() - startTime,
      }),
    });
  } catch (err) {
    console.error('Failed to write log via API', err.message);
  }

  try {
    const db = require('../db.js').getDb();
    await db.collection('thiruxdb_api_endpoints').updateOne(
      { _id: endpointId },
      { $set: { last_fetched_at: new Date(), last_error: errorMessage } }
    );
  } catch (e) {
    console.error('Failed to update endpoint status', e.message);
  }
  
  // Cleanup job from DB after 10s
  setTimeout(async () => {
    try {
      const db = require('../db.js').getDb();
      await db.collection('thiruxdb_sync_jobs').deleteOne({ endpoint_id: endpointIdStr });
    } catch(e) {}
  }, 10000);
}

router.post('/:id/sync', async (req, res) => {
  const endpointId = req.params.id;
  const skipOffset = req.body.skipOffset || 0;

  try {
    const db = require('../db.js').getDb();
    const existing = await db.collection('thiruxdb_sync_jobs').findOne({ endpoint_id: endpointId });
    if (existing && existing.status !== 'completed' && existing.status !== 'error') {
      return res.status(400).json({ error: 'Sync already in progress' });
    }

    await db.collection('thiruxdb_sync_jobs').updateOne(
      { endpoint_id: endpointId },
      {
        $set: {
          endpoint_id: endpointId,
          status: 'running',
          current: 0,
          total: 0,
          download_loaded: 0,
          download_total: 0,
          error: null,
          cancelled: false,
          updated_at: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ message: 'Sync started' });

    // Start background process detached
    runSyncJob(endpointId, skipOffset).catch(err => console.error('Background job error:', err));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/active-syncs', async (req, res) => {
  try {
    const db = require('../db.js').getDb();
    const activeJobs = await db.collection('thiruxdb_sync_jobs').find({
      status: { $in: ['running', 'downloading'] },
      cancelled: { $ne: true }
    }).toArray();
    
    const activeIds = activeJobs.map(j => j.endpoint_id);
    res.json({ activeIds });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/sync-status', async (req, res) => {
  try {
    const db = require('../db.js').getDb();
    const job = await db.collection('thiruxdb_sync_jobs').findOne({ endpoint_id: req.params.id });
    if (!job) return res.json({ status: 'idle', current: 0, total: 0 });
    res.json(job);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/cancel-sync', async (req, res) => {
  try {
    const db = require('../db.js').getDb();
    const result = await db.collection('thiruxdb_sync_jobs').findOneAndUpdate(
      { endpoint_id: req.params.id },
      { $set: { cancelled: true, updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    if (result) {
      res.json({ message: 'Cancellation requested' });
    } else {
      res.json({ message: 'No active job to cancel' });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sync-stats', async (req, res) => {
  try {
    const db = require('../db.js').getDb();
    const endpoints = await db.collection('thiruxdb_api_endpoints').find({}).toArray();
    for (const ep of endpoints) {
      let count = 0;
      if (ep.collection_name) {
        count = await db.collection(ep.collection_name).countDocuments({});
      } else {
        count = await db.collection('thiruxdb_data_records').countDocuments({ endpoint_id: ep._id.toString() });
      }
      await db.collection('thiruxdb_api_endpoints').updateOne({ _id: ep._id }, { $set: { record_count: count } });
    }
    res.json({ success: true, message: 'Stats synced successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Convert MongoDB doc to client shape (rename _id → id, format dates)
function toClient(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
    last_fetched_at: rest.last_fetched_at ? rest.last_fetched_at.toISOString() : null,
    created_at: rest.created_at instanceof Date ? rest.created_at.toISOString() : rest.created_at,
    updated_at: rest.updated_at instanceof Date ? rest.updated_at.toISOString() : rest.updated_at,
  };
}

export default router;
`;
code = code.replace(syncRoutesRegex, newCode);

fs.writeFileSync('server/routes/endpoints.js', code);
console.log('Successfully updated endpoints.js');
