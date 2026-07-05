/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = Router();

// Helper to get dynamic collection names
async function getTargetCollections(db) {
  const endpoints = await db.collection('thiruxdb_api_endpoints').find({}).toArray();
  const cols = new Set();
  for (const ep of endpoints) {
    if (ep.collection_name) {
      cols.add(ep.collection_name);
    }
  }
  cols.add('thiruxdb_data_records'); // Fallback for uncategorized
  return Array.from(cols);
}

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
    }

    if (req.query.date_from) {
      filter.fetched_at = { ...filter.fetched_at, $gte: new Date(req.query.date_from) };
    }
    if (req.query.date_to) {
      const to = new Date(req.query.date_to);
      to.setHours(23, 59, 59, 999);
      filter.fetched_at = { ...filter.fetched_at, $lte: to };
    }

    let targetCols = [];
    if (req.query.collection_name && req.query.collection_name !== 'all') {
      if (req.query.collection_name === 'uncategorized') {
        targetCols = ['thiruxdb_data_records'];
      } else {
        targetCols = [req.query.collection_name];
      }
    } else {
      targetCols = await getTargetCollections(db);
    }

    let docs = [];
    let total = 0;

    if (targetCols.length === 1) {
      const col = targetCols[0];
      [docs, total] = await Promise.all([
        db.collection(col).find(filter).sort({ fetched_at: -1 }).skip(skip).limit(pageSize).toArray(),
        db.collection(col).countDocuments(filter),
      ]);
    } else {
      const baseCol = targetCols[0];
      const unionPipeline = [];
      for (let i = 1; i < targetCols.length; i++) {
        unionPipeline.push({ $unionWith: { coll: targetCols[i] } });
      }

      const fullPipeline = [
        ...unionPipeline,
        ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
        { $sort: { fetched_at: -1 } }
      ];

      const countPipeline = [...fullPipeline, { $count: 'total' }];

      const dataPipeline = [
        ...fullPipeline,
        { $skip: skip },
        { $limit: pageSize }
      ];

      const [dataRes, countRes] = await Promise.all([
        db.collection(baseCol).aggregate(dataPipeline, { allowDiskUse: true }).toArray(),
        db.collection(baseCol).aggregate(countPipeline, { allowDiskUse: true }).toArray(),
      ]);
      docs = dataRes;
      total = countRes[0] ? countRes[0].total : 0;
    }

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

    let targetCols = [];
    if (req.query.collection_name && req.query.collection_name !== 'all') {
      if (req.query.collection_name === 'uncategorized') targetCols = ['thiruxdb_data_records'];
      else targetCols = [req.query.collection_name];
    } else {
      targetCols = await getTargetCollections(db);
    }

    const filter = {};
    if (req.query.endpoint_id && req.query.endpoint_id !== 'all') {
      filter.endpoint_id = new ObjectId(req.query.endpoint_id);
    } else if (req.query.collection_name && req.query.collection_name !== 'all' && req.query.collection_name !== 'uncategorized') {
      const endpoints = await db.collection('thiruxdb_api_endpoints').find({ collection_name: req.query.collection_name }).toArray();
      const endpointIds = endpoints.map(e => e._id);
      filter.endpoint_id = { $in: endpointIds };
    }

    let docs = [];
    let total = 0;

    // Use a regex fallback because text index might not exist on dynamically created collections
    const regexFilter = { _search_text: { $regex: q, $options: 'i' } };
    if (filter.endpoint_id) regexFilter.endpoint_id = filter.endpoint_id;

    if (targetCols.length === 1) {
      const col = targetCols[0];
      [docs, total] = await Promise.all([
        db.collection(col).find(regexFilter).sort({ fetched_at: -1 }).skip(skip).limit(pageSize).toArray(),
        db.collection(col).countDocuments(regexFilter),
      ]);
    } else {
      const baseCol = targetCols[0];
      const fullPipeline = [];
      for (let i = 1; i < targetCols.length; i++) fullPipeline.push({ $unionWith: { coll: targetCols[i] } });
      fullPipeline.push({ $match: regexFilter });
      fullPipeline.push({ $sort: { fetched_at: -1 } });

      const countPipeline = [...fullPipeline, { $count: 'total' }];
      const dataPipeline = [...fullPipeline, { $skip: skip }, { $limit: pageSize }];

      const [dataRes, countRes] = await Promise.all([
        db.collection(baseCol).aggregate(dataPipeline, { allowDiskUse: true }).toArray(),
        db.collection(baseCol).aggregate(countPipeline, { allowDiskUse: true }).toArray(),
      ]);
      docs = dataRes;
      total = countRes[0] ? countRes[0].total : 0;
    }

    res.json({ data: docs.map(toClient), count: total });
  } catch (err) {
    res.json({ data: [], count: 0 });
  }
});

// GET /api/records/counts — per-endpoint record counts + total
router.get('/counts', async (req, res) => {
  try {
    const db = getDb();
    const targetCols = await getTargetCollections(db);

    if (targetCols.length === 0) return res.json({ total: 0, perEndpoint: {} });

    const baseCol = targetCols[0];
    const fullPipeline = [];
    for (let i = 1; i < targetCols.length; i++) fullPipeline.push({ $unionWith: { coll: targetCols[i] } });
    fullPipeline.push({
      $group: {
        _id: '$endpoint_id',
        count: { $sum: 1 },
      },
    });

    const results = await db.collection(baseCol).aggregate(fullPipeline, { allowDiskUse: true }).toArray();
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

    const searchText = JSON.stringify(req.body.raw_data);
    const targetCol = req.body.collection_name || 'thiruxdb_data_records';

    if (externalId) {
      const filter = { endpoint_id: endpointId, external_id: externalId };
      const existing = await db.collection(targetCol).findOne(filter);
      if (existing) {
        await db.collection(targetCol).updateOne(filter, {
          $set: {
            raw_data: req.body.raw_data,
            mapped_data: req.body.mapped_data || {},
            fetched_at: now,
            updated_at: now,
            _search_text: searchText,
          },
        });
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
    await db.collection(targetCol).insertOne(doc);
    await db.collection('thiruxdb_api_endpoints').updateOne({ _id: endpointId }, { $inc: { record_count: 1 } });

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
    const targetCols = await getTargetCollections(db);

    let result = null;
    for (const col of targetCols) {
      result = await db.collection(col).findOneAndUpdate(
        { _id },
        { $set: { mapped_data: req.body.mapped_data, updated_at: new Date() } },
        { returnDocument: 'after' }
      );
      if (result) break;
    }

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
    const targetCols = await getTargetCollections(db);

    for (const col of targetCols) {
      const deletedDoc = await db.collection(col).findOneAndDelete({ _id });
      if (deletedDoc) {
        if (deletedDoc.endpoint_id) {
          await db.collection('thiruxdb_api_endpoints').updateOne({ _id: deletedDoc.endpoint_id }, { $inc: { record_count: -1 } });
        } else if (col !== 'thiruxdb_data_records') {
          // If no endpoint_id but it's in a dedicated collection, find the endpoint that owns this collection
          const ep = await db.collection('thiruxdb_api_endpoints').findOne({ collection_name: col });
          if (ep) await db.collection('thiruxdb_api_endpoints').updateOne({ _id: ep._id }, { $inc: { record_count: -1 } });
        }
        break;
      }
    }

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
    const targetCols = await getTargetCollections(db);

    let deletedCount = 0;
    for (const col of targetCols) {
      const docsToDelete = await db.collection(col).find({ _id: { $in: ids } }).toArray();
      if (docsToDelete.length > 0) {
        const endpointCounts = {};
        for (const doc of docsToDelete) {
          if (doc.endpoint_id) {
            const epIdStr = doc.endpoint_id.toString();
            endpointCounts[epIdStr] = (endpointCounts[epIdStr] || 0) + 1;
          } else if (col !== 'thiruxdb_data_records') {
            const ep = await db.collection('thiruxdb_api_endpoints').findOne({ collection_name: col });
            if (ep) {
              const epIdStr = ep._id.toString();
              endpointCounts[epIdStr] = (endpointCounts[epIdStr] || 0) + 1;
            }
          }
        }

        const resDb = await db.collection(col).deleteMany({ _id: { $in: ids } });
        deletedCount += resDb.deletedCount;

        for (const [epIdStr, count] of Object.entries(endpointCounts)) {
          await db.collection('thiruxdb_api_endpoints').updateOne({ _id: new ObjectId(epIdStr) }, { $inc: { record_count: -count } });
        }
      }
    }

    res.json({ success: true, deletedCount });
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
