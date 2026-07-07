/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import * as jose from 'jose';
import { getDb } from './db.js';
import { getJwtSecret } from './jwtSecret.js';

import requestIp from 'request-ip';
import bcrypt from 'bcryptjs';

// Verify the fingerprint matches the current request
function verifyFingerprint(req, tokenFingerprint) {
  if (!tokenFingerprint) return true; // Backwards compatibility for old tokens
  const ip = requestIp.getClientIp(req) || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  return bcrypt.compareSync(`${ip}-${ua}`, tokenFingerprint);
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const secret = await getJwtSecret();
    const { payload: decodedUser } = await jose.jwtVerify(token, secret);
    
    // Anti-Hijacking Check!
    if (decodedUser.fingerprint && !verifyFingerprint(req, decodedUser.fingerprint)) {
      console.warn(`[SECURITY] Session Hijacking Prevented for user: ${decodedUser.username}`);
      return res.status(403).json({ error: 'Session hijacking detected. Token invalidated.' });
    }
    
    const envAdminUsername = process.env.VITE_ADMIN_USERNAME;
    if (decodedUser.username === envAdminUsername) {
      req.user = decodedUser;
      return next();
    }

    const db = getDb();
    const userDoc = await db.collection('thiruxdb_users').findOne({ username: decodedUser.username });
    
    if (!userDoc) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    
    if (!userDoc.is_active) {
      return res.status(403).json({ error: 'User account is disabled.' });
    }

    req.user = {
      id: userDoc._id.toString(),
      username: userDoc.username,
      role: userDoc.role,
      is_active: userDoc.is_active,
      restricted_pages: userDoc.restricted_pages || []
    };
    next();
  } catch (err) {
    if (err.code === 'ERR_JWT_EXPIRED') {
      return res.status(403).json({ error: 'Token expired.' });
    }
    if (err.code === 'ERR_JWS_INVALID' || err.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    console.error('Auth Error:', err);
    return res.status(500).json({ error: 'Database error during authentication.' });
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Requires one of: ${roles.join(', ')}` });
    }
    next();
  };
}
