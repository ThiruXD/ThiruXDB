/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import { runSyncJob } from '../syncEngine.js';
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = Router();
const COL = 'thiruxdb_api_endpoints';


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
      pagination_config: req.body.pagination_config || {},
      path_variables: Array.isArray(req.body.path_variables) ? req.body.path_variables : [],
      is_active: req.body.is_active !== undefined ? req.body.is_active : true,
      record_count: 0,
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

// POST /api/endpoints/test — test connection
router.post('/test', async (req, res) => {
  try {
    const { base_url, auth_type, auth_config, path_variables } = req.body;
    const headers = { 'Content-Type': 'application/json' };
    let finalUrl = base_url;

    if (path_variables && path_variables.length > 0) {
      const db = getDb();
      for (const pv of path_variables) {
        if (pv.variable && pv.source_collection && pv.source_field) {
          const s = pv.source_field;
          const sampleDoc = await db.collection(pv.source_collection).findOne({
            $or: [
              { [s]: { $exists: true, $ne: null } },
              { [`mapped_data.${s}`]: { $exists: true, $ne: null } },
              { [`raw_data.${s}`]: { $exists: true, $ne: null } }
            ]
          });
          let val = '1';
          if (sampleDoc) {
            const resolveDotPath = (obj, path) => path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
            const rootVal = resolveDotPath(sampleDoc, s);
            const mappedVal = sampleDoc.mapped_data ? resolveDotPath(sampleDoc.mapped_data, s) : undefined;
            const rawVal = sampleDoc.raw_data ? resolveDotPath(sampleDoc.raw_data, s) : undefined;

            if (rootVal !== undefined && rootVal !== null) val = rootVal;
            else if (mappedVal !== undefined && mappedVal !== null) val = mappedVal;
            else if (rawVal !== undefined && rawVal !== null) val = rawVal;
          }
          finalUrl = finalUrl.replace(new RegExp(pv.variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), encodeURIComponent(String(val)));
        }
      }
    }

    // fallback for any remaining untranslated variables so it doesn't cause a 400 Bad Request
    finalUrl = finalUrl.replace(/\{[^}]+\}/g, '1');
    console.log("TEST CONNECTION FINAL URL:", finalUrl);

    if (auth_type === 'bearer' && auth_config?.token) {
      headers['Authorization'] = `Bearer ${auth_config.token}`;
    } else if (auth_type === 'api_key' && auth_config?.headers) {
      Object.assign(headers, auth_config.headers);
    } else if (auth_type === 'basic' && auth_config?.username && auth_config?.password) {
      const b64 = Buffer.from(`${auth_config.username}:${auth_config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${b64}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(finalUrl, {
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errText = `HTTP ${response.status}: ${response.statusText}`;
      if (path_variables && path_variables.length > 0) {
        errText += ` (Attempted URL: ${finalUrl})`;
      }
      return res.status(400).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
        path_variables: Array.isArray(req.body.path_variables) ? req.body.path_variables : [],
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
    await db.collection('thiruxdb_data_records').deleteMany({ endpoint_id: _id });
    await db.collection('thiruxdb_fetch_logs').deleteMany({ endpoint_id: _id });
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
    await db.collection('thiruxdb_data_records').deleteMany({ endpoint_id: { $in: ids } });
    await db.collection('thiruxdb_fetch_logs').deleteMany({ endpoint_id: { $in: ids } });
    res.json({ success: true, deletedCount: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BACKGROUND SYNC ENGINE ---

router.post('/:id/sync', async (req, res) => {
  const endpointId = req.params.id;
  const skipOffset = req.body.skipOffset || 0;

  try {
    const db = getDb();
    const existing = await db.collection('thiruxdb_sync_jobs').findOne({ endpoint_id: endpointId });
    if (existing && existing.status !== 'completed' && existing.status !== 'error' && existing.status !== 'partial') {
      const lastUpdate = existing.updated_at ? new Date(existing.updated_at) : new Date(0);
      const isStale = (new Date() - lastUpdate) / 1000 > 30;
      if (!isStale) {
        return res.status(400).json({ error: 'Sync already in progress' });
      }
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

    // Netlify Background Function handling
    if (process.env.NETLIFY) {
      const host = req.headers.host || 'localhost:8888';
      const proto = req.headers['x-forwarded-proto'] || req.protocol;
      fetch(`${proto}://${host}/.netlify/functions/sync-background`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointIdStr: endpointId, skipOffset })
      }).catch(err => console.error('Failed to trigger background function', err));
    } else {
      // For VPS, Vercel, etc., run the job as a detached promise.
      // Note: On standard Serverless platforms (Vercel) without dedicated background workers,
      // this may freeze between poll requests or hit platform execution timeouts.
      // On a VPS, this will run cleanly and uninterrupted in the background.
      runSyncJob(endpointId.toString(), skipOffset).catch(err => console.error('Background job error:', err));
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/active-syncs', async (req, res) => {
  try {
    const db = getDb();
    const activeJobs = await db.collection('thiruxdb_sync_jobs').find({
      status: { $in: ['running', 'downloading'] },
      cancelled: { $ne: true }
    }).toArray();

    const activeIds = activeJobs.map(j => j.endpoint_id);
    res.json({ activeIds });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/sync-status', async (req, res) => {
  try {
    const db = getDb();
    const job = await db.collection('thiruxdb_sync_jobs').findOne({ endpoint_id: req.params.id });
    if (!job) return res.json({ status: 'idle', current: 0, total: 0 });
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/live-logs', async (req, res) => {
  try {
    const db = getDb();
    const logs = await db.collection('thiruxdb_live_logs')
      .find({ endpoint_id: req.params.id })
      .sort({ timestamp: 1 })
      .toArray();
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id/live-logs', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('thiruxdb_live_logs').deleteMany({ endpoint_id: req.params.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/cancel-sync', async (req, res) => {
  try {
    const db = getDb();
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sync-stats', async (req, res) => {
  try {
    const db = getDb();
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
