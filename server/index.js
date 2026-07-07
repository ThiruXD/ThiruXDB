/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import { connectDb } from './db.js';
import app from './app.js';

const PORT = process.env.PORT || 3001;

// Start local server after connecting to DB
connectDb()
  .then(async () => {
    // Clean up zombie jobs from abrupt server restarts
    try {
      const { getDb } = await import('./db.js');
      const db = getDb();
      await db.collection('thiruxdb_sync_jobs').updateMany(
        { status: { $in: ['running', 'downloading'] } },
        { $set: { status: 'error', error: 'Server restarted unexpectedly during sync', updated_at: new Date() } }
      );
      console.log('Cleaned up any dangling sync jobs.');
    } catch (e) {
      console.error('Failed to cleanup dangling sync jobs:', e.message);
    }

    // Anti-Sleep Self-Ping for Free Tier Hosting (like Render.com)
    // Render automatically sets RENDER_EXTERNAL_URL
    const publicUrl = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
    if (publicUrl) {
      console.log(`Starting anti-sleep self-ping for: ${publicUrl}`);
      setInterval(() => {
        fetch(`${publicUrl}/api/health`)
          .then(res => console.log(`[Anti-Sleep] Pinged ${publicUrl}/api/health - Status: ${res.status}`))
          .catch(err => console.error(`[Anti-Sleep] Ping failed:`, err.message));
      }, 14 * 60 * 1000); // Ping every 14 minutes (Render sleeps after 15m)
    }

    app.listen(PORT, () => {
      console.log(`ThiruXDB API server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
