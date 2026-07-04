import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = Router();

// GET /api/dashboard — aggregate all dashboard data in one round-trip
router.get('/', async (req, res) => {
  try {
    const db = getDb();

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      endpoints,
      totalRecords,
      recordsThisWeek,
      recentRecords,
      recentLogs,
      recordCounts,
    ] = await Promise.all([
      // All endpoints
      db.collection('api_endpoints').find({}).sort({ created_at: -1 }).toArray(),

      // Total record count
      db.collection('data_records').countDocuments({}),

      // Records this week
      db.collection('data_records').countDocuments({ created_at: { $gte: weekAgo } }),

      // 5 most recent records
      db.collection('data_records').find({}).sort({ fetched_at: -1 }).limit(5).toArray(),

      // 5 most recent logs with endpoint names (via lookup)
      db.collection('fetch_logs').aggregate([
        { $sort: { created_at: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'api_endpoints',
            localField: 'endpoint_id',
            foreignField: '_id',
            as: 'endpoint',
          },
        },
        { $unwind: { path: '$endpoint', preserveNullAndEmptyArrays: true } },
      ]).toArray(),

      // Per-endpoint record counts
      db.collection('data_records').aggregate([
        { $group: { _id: '$endpoint_id', count: { $sum: 1 } } },
      ]).toArray(),
    ]);

    // Build perEndpoint count map
    const perEndpoint = {};
    for (const r of recordCounts) {
      perEndpoint[r._id ? r._id.toString() : 'null'] = r.count;
    }

    // Compute stats
    const activeEndpoints = endpoints.filter((e) => e.is_active);
    const endpointsWithErrors = endpoints.filter((e) => e.last_error);

    const lastFetchTime = endpoints
      .filter((e) => e.last_fetched_at)
      .sort((a, b) => new Date(b.last_fetched_at) - new Date(a.last_fetched_at))[0]?.last_fetched_at || null;

    const uri = process.env.MONGODB_URI || '';
    const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');

    res.json({
      system: {
        mongoUri: maskedUri,
        mongoStatus: db ? 'Connected' : 'Disconnected',
        databaseName: process.env.MONGODB_DB || 'thiruXDB'
      },
      stats: {
        totalEndpoints: endpoints.length,
        activeEndpoints: activeEndpoints.length,
        totalRecords,
        recordsThisWeek,
        lastFetchTime: lastFetchTime instanceof Date ? lastFetchTime.toISOString() : lastFetchTime,
        errors: endpointsWithErrors.length,
      },
      endpoints: endpoints.map(endpointToClient),
      recentRecords: recentRecords.map(recordToClient),
      recentLogs: recentLogs.map((log) => ({
        id: log._id.toString(),
        endpoint_id: log.endpoint_id ? log.endpoint_id.toString() : null,
        endpoint_name: log.endpoint?.name || 'Unknown',
        status: log.status,
        records_fetched: log.records_fetched,
        records_created: log.records_created,
        records_updated: log.records_updated,
        error_message: log.error_message,
        duration_ms: log.duration_ms,
        created_at: log.created_at instanceof Date ? log.created_at.toISOString() : log.created_at,
      })),
      perEndpoint,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function endpointToClient(doc) {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
    last_fetched_at: rest.last_fetched_at instanceof Date ? rest.last_fetched_at.toISOString() : rest.last_fetched_at,
    created_at: rest.created_at instanceof Date ? rest.created_at.toISOString() : rest.created_at,
    updated_at: rest.updated_at instanceof Date ? rest.updated_at.toISOString() : rest.updated_at,
  };
}

function recordToClient(doc) {
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
