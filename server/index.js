/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import { connectDb } from './db.js';
import app from './app.js';

const PORT = process.env.PORT || 3001;

// Start local server after connecting to DB
connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ThiruXDB API server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
