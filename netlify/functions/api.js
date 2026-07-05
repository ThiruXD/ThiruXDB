/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import serverless from 'serverless-http';
import app from '../../server/app.js';
import { connectDb } from '../../server/db.js';

// Connect to MongoDB before handling the request
// Netlify functions reuse the execution context between invocations,
// so connectDb() will cache the connection instance.
let dbPromise = null;

const handler = serverless(app, {
  request: async (req, event, context) => {
    // Ensure DB connection is established before processing the route
    if (!dbPromise) {
      dbPromise = connectDb();
    }
    await dbPromise;
    // Tell Netlify to wait for the event loop to empty before freezing the container
    context.callbackWaitsForEmptyEventLoop = false;
  }
});

export { handler };
