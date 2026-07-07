/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import serverless from 'serverless-http';
import app from '../../server/app.js';
import { connectDb } from '../../server/db.js';

// Connect to MongoDB before handling the request
// Netlify functions reuse the execution context between invocations,
// so connectDb() will cache the connection instance.
let dbPromise = null;

const handler = serverless(app, {
  basePath: '/.netlify/functions',
  request: async (req, event, context) => {
    try {
      // Ensure DB connection is established before processing the route
      if (!dbPromise) {
        dbPromise = connectDb();
      }
      await dbPromise;
      // Tell Netlify to wait for the event loop to empty before freezing the container
      context.callbackWaitsForEmptyEventLoop = false;
    } catch (err) {
      console.error('Fatal Initialization Error:', err);
      // We can't easily return a custom response here because serverless-http takes over, 
      // but throwing a clear error will at least show up in Netlify logs.
      throw err; 
    }
  }
});

export { handler };
