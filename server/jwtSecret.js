import * as jose from 'jose';
import { getDb } from './db.js';

let cachedSecret = null;

export async function getJwtSecret() {
  if (cachedSecret) return cachedSecret;

  // First, check if there is an explicit environment variable override
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'thiruxdb_super_secret_key_change_me') {
    cachedSecret = new TextEncoder().encode(process.env.JWT_SECRET);
    return cachedSecret;
  }

  const db = getDb();
  const settingsCol = db.collection('thiruxdb_settings');

  // Try to find an existing key in the database
  const existingDoc = await settingsCol.findOne({ _id: 'jwt_secret_key' });
  
  if (existingDoc && existingDoc.jwk) {
    cachedSecret = await jose.importJWK(existingDoc.jwk, 'HS256');
    console.log('[SECURITY] Loaded dynamic JWT secret from database.');
    return cachedSecret;
  }

  // If no key exists, generate a highly secure one dynamically
  console.log('[SECURITY] Generating new dynamic JWT secret via jose library...');
  const newSecret = await jose.generateSecret('HS256');
  
  // Export it to a JWK (JSON Web Key) so it can be safely stored in MongoDB
  const jwk = await jose.exportJWK(newSecret);
  
  await settingsCol.updateOne(
    { _id: 'jwt_secret_key' },
    { $set: { jwk, updated_at: new Date() } },
    { upsert: true }
  );

  cachedSecret = newSecret;
  console.log('[SECURITY] Dynamic JWT secret generated and saved to database securely.');
  
  return cachedSecret;
}
