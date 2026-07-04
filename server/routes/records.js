import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = Router();
const COL = 'data_records';

// GET /api/records — paginated list with filters
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 25);
    const skip = (page - 1) * pageSize;

    const filter = {};
    if (req.query.endpoint_id && req.query.endpoint_id !== 'all') {
      filter.endpoint_id = new ObjectId(req.query.endpoint_id);
    } else if (req.query.collection_name && req.query.collection_name !== 'all') {
      const endpoints = await db.collection('api_endpoints').find({ collection_name: req.query.collection_name }).toArray();
      const endpointIds = endpoints.map(e => e._id);
      filter.endpoint_id = { $in: endpointIds };
    }
    if (req.query.date_from) {
      filter.fetched_at = { ...filter.fetched_at, $gte: new Date(req.query.date_from) };
    }
    if (req.query.date_to) {
      const to = new Date(req.query.date_to);
      to.setHours(23, 59, 59, 999);
      filter.fetched_at = { ...filter.fetched_at, $lte: to };
    }

    const [docs, total] = await Promise.all([
      db.collection(COL).find(filter).sort({ fetched_at: -1 }).skip(skip).limit(pageSize).toArray(),
      db.collection(COL).countDocuments(filter),
    ]);

    res.json({ data: docs.map(toClient), count: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/records/search — full-text search
router.get('/search', async (req, res) => {
  try {
    const db = getDb();
    const q = req.query.q;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 25);
    const skip = (page - 1) * pageSize;

    if (!q) return res.json({ data: [], count: 0 });

    const filter = { $text: { $search: q } };
    if (req.query.endpoint_id && req.query.endpoint_id !== 'all') {
      filter.endpoint_id = new ObjectId(req.query.endpoint_id);
    } else if (req.query.collection_name && req.query.collection_name !== 'all') {
      const endpoints = await db.collection('api_endpoints').find({ collection_name: req.query.collection_name }).toArray();
      const endpointIds = endpoints.map(e => e._id);
      filter.endpoint_id = { $in: endpointIds };
    }

    const [docs, total] = await Promise.all([
      db.collection(COL).find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip).limit(pageSize).toArray(),
      db.collection(COL).countDocuments(filter),
    ]);

    res.json({ data: docs.map(toClient), count: total });
  } catch (err) {
    // If text index doesn't exist yet, fall back to empty results
    res.json({ data: [], count: 0 });
  }
});

// GET /api/records/counts — per-endpoint record counts + total
router.get('/counts', async (req, res) => {
  try {
    const db = getDb();
    const pipeline = [
      {
        $group: {
          _id: '$endpoint_id',
          count: { $sum: 1 },
        },
      },
    ];
    const results = await db.collection(COL).aggregate(pipeline).toArray();
    const total = results.reduce((sum, r) => sum + r.count, 0);
    const perEndpoint = {};
    for (const r of results) {
      perEndpoint[r._id ? r._id.toString() : 'null'] = r.count;
    }
    res.json({ total, perEndpoint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/records — create or upsert
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const now = new Date();
    const endpointId = new ObjectId(req.body.endpoint_id);
    const externalId = req.body.external_id || null;

    // Build search text from raw_data for full-text index
    const searchText = JSON.stringify(req.body.raw_data);

    if (externalId) {
      // Upsert by (endpoint_id, external_id)
      const filter = { endpoint_id: endpointId, external_id: externalId };
      const existing = await db.collection(COL).findOne(filter);
      if (existing) {
        await db.collection(COL).updateOne(filter, {
          $set: {
            raw_data: req.body.raw_data,
            mapped_data: req.body.mapped_data || {},
            fetched_at: now,
            updated_at: now,
            _search_text: searchText,
          },
        });
        
        if (req.body.collection_name) {
          await db.collection(req.body.collection_name).updateOne(
            { external_id: externalId },
            { $set: { raw_data: req.body.raw_data, mapped_data: req.body.mapped_data || {}, updated_at: now, fetched_at: now, endpoint_id: endpointId } },
            { upsert: true }
          );
        }
        
        return res.json({ action: 'updated' });
      }
    }

    const doc = {
      endpoint_id: endpointId,
      external_id: externalId,
      raw_data: req.body.raw_data,
      mapped_data: req.body.mapped_data || {},
      _search_text: searchText,
      fetched_at: now,
      created_at: now,
      updated_at: now,
    };
    await db.collection(COL).insertOne(doc);

    if (req.body.collection_name) {
      await db.collection(req.body.collection_name).insertOne({
        endpoint_id: endpointId,
        external_id: externalId,
        raw_data: req.body.raw_data,
        mapped_data: req.body.mapped_data || {},
        fetched_at: now,
        created_at: now,
        updated_at: now,
      });
    }

    res.status(201).json({ action: 'created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/records/:id — update mapped_data
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const _id = new ObjectId(req.params.id);
    const result = await db.collection(COL).findOneAndUpdate(
      { _id },
      { $set: { mapped_data: req.body.mapped_data, updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(toClient(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/records/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const _id = new ObjectId(req.params.id);
    await db.collection(COL).deleteOne({ _id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/records/bulk-delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const db = getDb();
    const ids = req.body.ids.map(id => new ObjectId(id));
    await db.collection(COL).deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deletedCount: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function toClient(doc) {
  if (!doc) return null;
  const { _id, _search_text, endpoint_id, ...rest } = doc;
  return {
    id: _id.toString(),
    endpoint_id: endpoint_id ? endpoint_id.toString() : null,
    ...rest,
    fetched_at: rest.fetched_at instanceof Date ? rest.fetched_at.toISOString() : rest.fetched_at,
    created_at: rest.created_at instanceof Date ? rest.created_at.toISOString() : rest.created_at,
    updated_at: rest.updated_at instanceof Date ? rest.updated_at.toISOString() : rest.updated_at,
  };
}

export default router;
