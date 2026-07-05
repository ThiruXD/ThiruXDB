/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
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
      recordsThisWeek,
      recentRecords,
      recentLogs,
    ] = await Promise.all([
      // All endpoints
      db.collection('api_endpoints').find({}).sort({ created_at: -1 }).toArray(),

      // Records this week from fetch_logs
      db.collection('fetch_logs').aggregate([
        { $match: { created_at: { $gte: weekAgo } } },
        { $group: { _id: null, count: { $sum: '$records_created' } } }
      ]).toArray(),

      // 5 most recent records
      // Note: we fetch recent logs for the dashboard instead of scanning across all collections for recent records
      db.collection('fetch_logs').find({}).sort({ created_at: -1 }).limit(5).toArray(),

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
    ]);

    // Build perEndpoint count map and totalRecords
    const perEndpoint = {};
    let totalRecords = 0;
    for (const ep of endpoints) {
      const count = ep.record_count || 0;
      perEndpoint[ep._id.toString()] = count;
      totalRecords += count;
    }

    const recordsThisWeekCount = recordsThisWeek[0] ? recordsThisWeek[0].count : 0;

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
        recordsThisWeek: recordsThisWeekCount,
        lastFetchTime: lastFetchTime instanceof Date ? lastFetchTime.toISOString() : lastFetchTime,
        errors: endpointsWithErrors.length,
      },
      endpoints: endpoints.map(endpointToClient),
      recentRecords: [], // Removing recent records to prevent heavy multi-collection scans
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
