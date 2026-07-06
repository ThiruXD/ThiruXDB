/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import { ObjectId } from 'mongodb';
import { getDb } from './db.js';

export async function runSyncJob(endpointIdStr, skipOffset) {
  const db = getDb();
  const endpointId = new ObjectId(endpointIdStr);

  let jobState = {
    status: 'running',
    current: 0,
    total: 0,
    download_loaded: 0,
    download_total: 0,
    download_speed: 0,
    error: null,
    cancelled: false
  };
  let lastFlush = 0;

  const flushState = (force = false) => {
    const now = Date.now();
    if (force || now - lastFlush > 500) {
      lastFlush = now;
      const updatePayload = {
        status: jobState.status,
        current: jobState.current,
        total: jobState.total,
        download_loaded: jobState.download_loaded,
        download_total: jobState.download_total,
        download_speed: jobState.download_speed,
        error: jobState.error,
        updated_at: new Date()
      };

      db.collection('thiruxdb_sync_jobs').findOneAndUpdate(
        { endpoint_id: endpointIdStr },
        { $set: updatePayload },
        { returnDocument: 'after' }
      ).then(result => {
        if (result && result.cancelled) {
          jobState.cancelled = true;
        }
      }).catch(err => console.error('Background flush error:', err));
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
      headers['Authorization'] = `Bearer ${authConfig.token}`;
    } else if (endpoint.auth_type === 'api_key') {
      const ha = authConfig.headers;
      if (ha) Object.assign(headers, ha);
    } else if (endpoint.auth_type === 'basic') {
      const { username, password } = authConfig;
      if (username && password) headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }

    let urls = [endpoint.base_url];

    if (endpoint.path_variables && endpoint.path_variables.length > 0) {
      for (const pv of endpoint.path_variables) {
        if (!pv.variable || !pv.source_collection || !pv.source_field) continue;
        const s = pv.source_field;
        const [v1, v2, v3] = await Promise.all([
          db.collection(pv.source_collection).distinct(s),
          db.collection(pv.source_collection).distinct(`mapped_data.${s}`),
          db.collection(pv.source_collection).distinct(`raw_data.${s}`)
        ]);
        const values = Array.from(new Set([...v1, ...v2, ...v3]));
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
      jobState.total = 1;
    }
    flushState(true);

    let urlIndex = 0;

    function createBulkOp(item) {
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
        return {
          updateOne: {
            filter: { endpoint_id: endpointIdStr, external_id: externalId },
            update: {
              $set: { raw_data: item, mapped_data: mappedData, _search_text: searchText, updated_at: now, fetched_at: now },
              $setOnInsert: { created_at: now }
            },
            upsert: true
          }
        };
      } else {
        return {
          insertOne: {
            document: { endpoint_id: endpointIdStr, external_id: null, raw_data: item, mapped_data: mappedData, _search_text: searchText, fetched_at: now, created_at: now, updated_at: now }
          }
        };
      }
    }

    if (isMultiUrl) {
      jobState.status = 'running';
      flushState(true);
      const CONCURRENCY = 5;

      for (let i = 0; i < urls.length; i += CONCURRENCY) {
        if (jobState.cancelled) {
          errorMessage = 'Cancelled by user';
          status = 'partial';
          break;
        }

        const batchUrls = urls.slice(i, i + CONCURRENCY);
        const batchPromises = batchUrls.map(async (url) => {
          let attempt = 0;
          while (attempt < 3) {
            try {
              const response = await fetch(url, { headers });
              if (response.status === 429) {
                // Rate limited, wait and retry
                await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
                attempt++;
                continue;
              }
              if (!response.ok) {
                console.error(`Error fetching ${url}: HTTP ${response.status}`);
                return null;
              }
              const data = await response.json();
              return data;
            } catch (err) {
              console.error(`Error fetching ${url}: ${err.message}`);
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              attempt++;
            }
          }
          return null;
        });

        const results = await Promise.all(batchPromises);
        let bulkOps = [];

        for (const resData of results) {
          if (!resData) continue;
          let data = resData;
          if (endpoint.response_path) {
            for (const path of endpoint.response_path.split('.')) data = data?.[path];
          }
          const items = Array.isArray(data) ? data : [data].filter(Boolean);
          recordsFetched += items.length;

          for (const item of items) {
            bulkOps.push(createBulkOp(item));
          }
        }

        if (bulkOps.length > 0 && !jobState.cancelled) {
          const result = await db.collection(targetCol).bulkWrite(bulkOps, { ordered: false });
          recordsUpdated += result.modifiedCount || 0;
          recordsCreated += (result.upsertedCount || 0) + (result.insertedCount || 0);
        }

        urlIndex += batchUrls.length;
        jobState.current = urlIndex;
        flushState(true);
      }
    } else {
      // Single URL Streaming Logic
      const url = urls[0];
      flushState();
      if (!jobState.cancelled) {
        let items = [];
        try {
          jobState.status = 'downloading';
          jobState.download_loaded = 0;
          jobState.download_total = 0;
          jobState.download_speed = 0;
          flushState(true);

          const response = await fetch(url, { headers });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const contentLength = response.headers.get('content-length');
          if (contentLength) jobState.download_total = parseInt(contentLength, 10);

          const reader = response.body.getReader();
          const chunks = [];
          let loaded = 0;
          let lastSpeedTime = Date.now();
          let lastLoaded = 0;

          while (true) {
            flushState();
            if (jobState.cancelled) break;
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            jobState.download_loaded = loaded;

            const nowTime = Date.now();
            if (nowTime - lastSpeedTime > 500) {
              const timeDiff = (nowTime - lastSpeedTime) / 1000;
              jobState.download_speed = (loaded - lastLoaded) / timeDiff;
              lastSpeedTime = nowTime;
              lastLoaded = loaded;
            }
          }

          if (jobState.cancelled) {
            jobState.status = 'partial';
            errorMessage = 'Cancelled by user';
          } else {
            jobState.status = 'running';
            flushState(true);

            const bodyStr = Buffer.concat(chunks).toString('utf-8');
            let data = JSON.parse(bodyStr);
            if (endpoint.response_path) {
              for (const path of endpoint.response_path.split('.')) data = data?.[path];
            }
            items = Array.isArray(data) ? data : [data].filter(Boolean);

            if (skipOffset > 0) items = items.slice(skipOffset);
            jobState.total = items.length;
            flushState(true);
          }
        } catch (err) {
          console.error(`Error fetching ${url}: ${err.message}`);
          status = 'error';
          errorMessage = err.message;
        }

        if (status !== 'error' && status !== 'partial') {
          recordsFetched += items.length;
          const bulkOps = [];
          for (let i = 0; i < items.length; i++) {
            flushState();
            if (jobState.cancelled) {
              errorMessage = 'Cancelled by user';
              status = 'partial';
              break;
            }

            bulkOps.push(createBulkOp(items[i]));

            if (bulkOps.length >= 1000) {
              const result = await db.collection(targetCol).bulkWrite(bulkOps, { ordered: false });
              recordsUpdated += result.modifiedCount || 0;
              recordsCreated += (result.upsertedCount || 0) + (result.insertedCount || 0);
              bulkOps.length = 0;
              jobState.current = i;
            }
          }

          if (bulkOps.length > 0 && !jobState.cancelled) {
            const result = await db.collection(targetCol).bulkWrite(bulkOps, { ordered: false });
            recordsUpdated += result.modifiedCount || 0;
            recordsCreated += (result.upsertedCount || 0) + (result.insertedCount || 0);
          }

          jobState.current = items.length;
          flushState(true);
        }
      }
    }

  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    jobState.error = err.message;
  }

  if (status !== 'partial') {
    status = errorMessage ? 'error' : 'completed';
  }
  jobState.status = status;
  flushState(true);

  try {
    const doc = {
      endpoint_id: new ObjectId(endpointIdStr),
      status,
      records_fetched: recordsFetched,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      error_message: errorMessage,
      duration_ms: Date.now() - startTime,
      created_at: new Date(),
    };
    await db.collection('thiruxdb_fetch_logs').insertOne(doc);
  } catch (err) {
    console.error('Failed to write log to database:', err.message);
  }

  try {
    await db.collection('thiruxdb_api_endpoints').updateOne(
      { _id: endpointId },
      { $set: { last_fetched_at: new Date(), last_error: errorMessage } }
    );
  } catch (e) {
    console.error('Failed to update endpoint status', e.message);
  }

  setTimeout(async () => {
    try {
      await db.collection('thiruxdb_sync_jobs').deleteOne({ endpoint_id: endpointIdStr });
    } catch (e) { }
  }, 10000);
}
