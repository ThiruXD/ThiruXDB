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
      
      db.collection('sync_jobs').findOneAndUpdate(
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
    const endpoint = await db.collection('api_endpoints').findOne({ _id: endpointId });
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
    const targetCol = endpoint.collection_name || 'data_records';

    const isMultiUrl = urls.length > 1;
    if (isMultiUrl) {
      if (skipOffset > 0) urls = urls.slice(skipOffset);
      jobState.total = urls.length;
    } else {
      jobState.total = 1;
    }
    flushState(true);

    let urlIndex = 0;
    for (const url of urls) {
      flushState();
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
        jobState.download_speed = 0;
        flushState(true);

        const response = await fetch(url, { headers });
        if (!response.ok) {
          console.error(`Failed to fetch ${url}: HTTP ${response.status}`);
          urlIndex++;
          if (isMultiUrl) jobState.current = urlIndex;
          jobState.status = 'running';
          flushState(true);
          continue;
        }

        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          jobState.download_total = parseInt(contentLength, 10);
        }

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
            const bytesDiff = loaded - lastLoaded;
            jobState.download_speed = bytesDiff / timeDiff;
            lastSpeedTime = nowTime;
            lastLoaded = loaded;
          }
        }

        if (jobState.cancelled) {
          jobState.status = 'partial';
          errorMessage = 'Cancelled by user';
          break;
        }

        jobState.status = 'running';
        flushState(true);

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
          flushState(true);
        }
      } catch (err) {
        console.error(`Error fetching ${url}: ${err.message}`);
        urlIndex++;
        if (isMultiUrl) jobState.current = urlIndex;
        flushState(true);
        continue;
      }

      recordsFetched += items.length;

      for (let i = 0; i < items.length; i++) {
        flushState();
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
        }

        if (!isMultiUrl && i % 10 === 0) {
          jobState.current = i;
        }
      }

      urlIndex++;
      if (isMultiUrl) {
        jobState.current = urlIndex;
      } else {
        jobState.current = items.length;
      }
      flushState(true);

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
    const url = process.env.NETLIFY ? `https://${process.env.URL || 'localhost:3001'}/api/logs` : `http://localhost:${process.env.PORT || 3001}/api/logs`;
    await fetch(url, {
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
    await db.collection('api_endpoints').updateOne(
      { _id: endpointId },
      { $set: { last_fetched_at: new Date(), last_error: errorMessage } }
    );
  } catch (e) {
    console.error('Failed to update endpoint status', e.message);
  }

  setTimeout(async () => {
    try {
      await db.collection('sync_jobs').deleteOne({ endpoint_id: endpointIdStr });
    } catch (e) { }
  }, 10000);
}
