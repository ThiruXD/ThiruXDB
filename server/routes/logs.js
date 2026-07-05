/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = Router();
const COL = 'fetch_logs';

// GET /api/logs — list with optional endpoint filter
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const limit = Math.min(200, parseInt(req.query.limit) || 100);

    const filter = {};
    if (req.query.endpoint_id && req.query.endpoint_id !== 'all') {
      filter.endpoint_id = new ObjectId(req.query.endpoint_id);
    }

    const logs = await db.collection(COL)
      .find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    // Join with endpoint names
    const endpointIds = [...new Set(logs.map((l) => l.endpoint_id?.toString()).filter(Boolean))];
    let endpointNames = {};
    if (endpointIds.length > 0) {
      const endpoints = await db.collection('api_endpoints')
        .find({ _id: { $in: endpointIds.map((id) => new ObjectId(id)) } })
        .project({ name: 1 })
        .toArray();
      endpointNames = Object.fromEntries(endpoints.map((e) => [e._id.toString(), e.name]));
    }

    res.json(
      logs.map((log) => ({
        ...toClient(log),
        endpoint_name: endpointNames[log.endpoint_id?.toString()] || 'Unknown',
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/logs — create a fetch log entry
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const doc = {
      endpoint_id: new ObjectId(req.body.endpoint_id),
      status: req.body.status,
      records_fetched: req.body.records_fetched || 0,
      records_created: req.body.records_created || 0,
      records_updated: req.body.records_updated || 0,
      error_message: req.body.error_message || null,
      duration_ms: req.body.duration_ms || null,
      created_at: new Date(),
    };
    const result = await db.collection(COL).insertOne(doc);
    res.status(201).json(toClient({ ...doc, _id: result.insertedId }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function toClient(doc) {
  if (!doc) return null;
  const { _id, endpoint_id, ...rest } = doc;
  return {
    id: _id.toString(),
    endpoint_id: endpoint_id ? endpoint_id.toString() : null,
    ...rest,
    created_at: rest.created_at instanceof Date ? rest.created_at.toISOString() : rest.created_at,
  };
}

export default router;
