/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import { connectDb } from '../../server/db.js';
import { runSyncJob } from '../../server/syncEngine.js';

let dbPromise = null;

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    if (!dbPromise) {
      dbPromise = connectDb();
    }
    await dbPromise;

    const body = JSON.parse(event.body || '{}');
    const { endpointIdStr, skipOffset } = body;

    if (!endpointIdStr) {
      return { statusCode: 400, body: 'Missing endpointIdStr' };
    }

    // Run the sync job in the background (allowed up to 15m in Netlify Background Functions)
    await runSyncJob(endpointIdStr, skipOffset || 0);

    return { statusCode: 200, body: 'Sync Background Job Completed' };
  } catch (error) {
    console.error('Background function error:', error);
    return { statusCode: 500, body: error.message };
  }
};
