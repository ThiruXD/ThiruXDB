import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = Router();
const COL = 'api_endpoints';

const activeSyncJobs = new Map();

// GET /api/endpoints — list all, newest first
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const docs = await db.collection(COL)
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    res.json(docs.map(toClient));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/endpoints — create
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const now = new Date();
    const doc = {
      name: req.body.name,
      description: req.body.description || null,
      collection_name: req.body.collection_name || null,
      id_field: req.body.id_field || null,
      base_url: req.body.base_url,
      auth_type: req.body.auth_type || 'none',
      auth_config: req.body.auth_config || {},
      field_mappings: req.body.field_mappings || [],
      response_path: req.body.response_path || '',
      pagination_type: req.body.pagination_type || 'none',
      pagination_config: req.body.pagination_config || {},
      is_active: req.body.is_active !== undefined ? req.body.is_active : true,
      last_fetched_at: null,
      last_error: null,
      created_at: now,
      updated_at: now,
    };
    const result = await db.collection(COL).insertOne(doc);
    res.status(201).json(toClient({ ...doc, _id: result.insertedId }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/endpoints/:id — update
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const _id = new ObjectId(req.params.id);
    const update = {
      $set: {
        name: req.body.name,
        description: req.body.description || null,
        collection_name: req.body.collection_name || null,
        id_field: req.body.id_field || null,
        base_url: req.body.base_url,
        auth_type: req.body.auth_type,
        auth_config: req.body.auth_config || {},
        field_mappings: req.body.field_mappings || [],
        response_path: req.body.response_path || '',
        pagination_type: req.body.pagination_type,
        pagination_config: req.body.pagination_config || {},
        is_active: req.body.is_active,
        updated_at: new Date(),
      },
    };
    const result = await db.collection(COL).findOneAndUpdate(
      { _id },
      update,
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(toClient(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/endpoints/:id/toggle — toggle is_active
router.patch('/:id/toggle', async (req, res) => {
  try {
    const db = getDb();
    const _id = new ObjectId(req.params.id);
    const doc = await db.collection(COL).findOne({ _id });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const result = await db.collection(COL).findOneAndUpdate(
      { _id },
      { $set: { is_active: !doc.is_active, updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    res.json(toClient(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/endpoints/:id/status — update last_fetched_at / last_error
router.patch('/:id/status', async (req, res) => {
  try {
    const db = getDb();
    const _id = new ObjectId(req.params.id);
    const $set = { updated_at: new Date() };
    if (req.body.last_fetched_at !== undefined) $set.last_fetched_at = req.body.last_fetched_at ? new Date(req.body.last_fetched_at) : null;
    if (req.body.last_error !== undefined) $set.last_error = req.body.last_error;

    const result = await db.collection(COL).findOneAndUpdate(
      { _id },
      { $set },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(toClient(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/endpoints/:id — delete endpoint + cascade records + logs
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const _id = new ObjectId(req.params.id);
    await db.collection(COL).deleteOne({ _id });
    await db.collection('data_records').deleteMany({ endpoint_id: _id });
    await db.collection('fetch_logs').deleteMany({ endpoint_id: _id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/endpoints/bulk-delete — delete multiple endpoints + cascade records + logs
router.post('/bulk-delete', async (req, res) => {
  try {
    const db = getDb();
    const ids = req.body.ids.map(id => new ObjectId(id));
    await db.collection(COL).deleteMany({ _id: { $in: ids } });
    await db.collection('data_records').deleteMany({ endpoint_id: { $in: ids } });
    await db.collection('fetch_logs').deleteMany({ endpoint_id: { $in: ids } });
    res.json({ success: true, deletedCount: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BACKGROUND SYNC ENGINE ---

async function runSyncJob(endpointIdStr, skipOffset) {
  const db = getDb();
  const endpointId = new ObjectId(endpointIdStr);
  const job = activeSyncJobs.get(endpointIdStr);
  const startTime = Date.now();
  let status = 'success';
  let errorMessage = null;
  let recordsFetched = 0, recordsCreated = 0, recordsUpdated = 0;

  try {
    const endpoint = await db.collection(COL).findOne({ _id: endpointId });
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

    const response = await fetch(endpoint.base_url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const jsonData = await response.json();
    let data = jsonData;
    if (endpoint.response_path) {
      for (const path of endpoint.response_path.split('.')) data = data?.[path];
    }

    let items = Array.isArray(data) ? data : [data].filter(Boolean);
    if (skipOffset > 0) items = items.slice(skipOffset);

    recordsFetched = items.length;
    job.total = items.length;

    const mappings = endpoint.field_mappings || [];
    const targetCol = endpoint.collection_name || 'data_records';

    for (let i = 0; i < items.length; i++) {
      if (job.cancelled) {
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
        const filter = { endpoint_id: endpointId, external_id: externalId };
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
            endpoint_id: endpointId,
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
          endpoint_id: endpointId,
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

      job.current = i + 1;
    }

    await db.collection(COL).updateOne({ _id: endpointId }, { $set: { last_fetched_at: new Date(), last_error: null, updated_at: new Date() } });
  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    job.error = errorMessage;
    await db.collection(COL).updateOne({ _id: endpointId }, { $set: { last_error: errorMessage, updated_at: new Date() } });
  }

  await db.collection('fetch_logs').insertOne({
    endpoint_id: endpointId,
    status,
    records_fetched: recordsFetched,
    records_created: recordsCreated,
    records_updated: recordsUpdated,
    error_message: errorMessage,
    duration_ms: Date.now() - startTime,
    created_at: new Date()
  });

  job.status = 'completed';
  setTimeout(() => activeSyncJobs.delete(endpointIdStr), 10000);
}

router.post('/:id/sync', async (req, res) => {
  const endpointId = req.params.id;
  const skipOffset = req.body.skipOffset || 0;

  if (activeSyncJobs.has(endpointId)) {
    return res.status(400).json({ error: 'Sync already in progress' });
  }

  activeSyncJobs.set(endpointId, {
    status: 'running',
    current: 0,
    total: 0,
    error: null,
    cancelled: false
  });

  res.json({ message: 'Sync started' });

  // Start background process detached
  runSyncJob(endpointId, skipOffset).catch(err => console.error('Background job error:', err));
});

router.get('/:id/sync-status', (req, res) => {
  const job = activeSyncJobs.get(req.params.id);
  if (!job) return res.json({ status: 'idle', current: 0, total: 0 });
  res.json(job);
});

router.post('/:id/cancel-sync', (req, res) => {
  const job = activeSyncJobs.get(req.params.id);
  if (job) {
    job.cancelled = true;
    res.json({ message: 'Cancellation requested' });
  } else {
    res.json({ message: 'No active job to cancel' });
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
