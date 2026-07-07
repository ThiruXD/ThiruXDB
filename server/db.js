/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'thiruXDB';

let client;
let db;

export async function connectDb() {
  if (db) return db;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set or not being loaded by the host platform');
  }
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  await ensureIndexes(db);
  console.log(`Connected to MongoDB: ${dbName}`);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not connected. Call connectDb() first.');
  return db;
}

async function ensureIndexes(db) {
  // api_endpoints indexes
  const endpoints = db.collection('thiruxdb_api_endpoints');
  await endpoints.createIndex({ is_active: 1 });
  await endpoints.createIndex({ created_at: -1 });

  // data_records indexes
  const records = db.collection('thiruxdb_data_records');
  await records.createIndex({ endpoint_id: 1 });
  await records.createIndex({ fetched_at: -1 });
  await records.createIndex({ endpoint_id: 1, external_id: 1 }, { unique: true, sparse: true });
  // Text index for full-text search on raw_data (stored as string field)
  try {
    await records.createIndex({ _search_text: 'text' });
  } catch {
    // Index may already exist
  }

  // fetch_logs indexes
  const logs = db.collection('thiruxdb_fetch_logs');
  await logs.createIndex({ endpoint_id: 1, created_at: -1 });
  await logs.createIndex({ created_at: -1 });

  // Users indexes
  const users = db.collection('thiruxdb_users');
  await users.createIndex({ username: 1 }, { unique: true });

  // Activity logs indexes
  const activityLogs = db.collection('thiruxdb_user_activity_logs');
  await activityLogs.createIndex({ user_id: 1, created_at: -1 });
  await activityLogs.createIndex({ created_at: -1 });

  // Initialize Default Admin if needed
  const adminCount = await users.countDocuments();
  if (adminCount === 0) {
    const defaultUser = process.env.VITE_ADMIN_USERNAME || 'admin';
    const defaultPass = process.env.VITE_ADMIN_PASS || 'changeme123!';
    const password_hash = await bcrypt.hash(defaultPass, 10);

    await users.insertOne({
      username: defaultUser,
      password_hash,
      role: 'admin',
      is_active: true,
      created_at: new Date()
    });
    console.log(`Initialized default admin user: ${defaultUser}`);
  }
}
