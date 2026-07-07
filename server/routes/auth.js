/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { getDb } from '../db.js';
import { authenticateToken } from '../authMiddleware.js';
import requestIp from 'request-ip';
import { UAParser } from 'ua-parser-js';

import { getJwtSecret } from '../jwtSecret.js';

const router = express.Router();

// Generate a security fingerprint for the session
export function generateFingerprint(req) {
  const ua = req.headers['user-agent'] || 'unknown';
  // We use a hash of User-Agent. Even if token is stolen, 
  // it can't be used from a different browser profile.
  return bcrypt.hashSync(ua, 1); // Cost 1 is fast enough for fingerprinting
}

// Helper to log user activity
export async function logUserActivity(userId, action, req, extraData = {}) {
  try {
    const db = getDb();
    const clientIp = requestIp.getClientIp(req);
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const deviceName = `${browser.name || 'Unknown Browser'} on ${os.name || 'Unknown OS'}`;

    let locationData = null;
    try {
      // Don't lookup localhost IPs
      if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

        const response = await fetch(`http://ip-api.com/json/${clientIp}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            locationData = {
              country: data.country,
              city: data.city,
              isp: data.isp,
              org: data.org
            };
          }
        }
      }
    } catch (e) {
      console.error('IP lookup failed', e.message);
    }

    await db.collection('thiruxdb_user_activity_logs').insertOne({
      user_id: userId,
      action,
      ip_address: clientIp,
      device_info: deviceName,
      user_agent: req.headers['user-agent'],
      location_data: locationData,
      extra_data: extraData,
      created_at: new Date()
    });

    // Update last seen on user document
    if (userId) {
      await db.collection('thiruxdb_users').updateOne(
        { _id: userId },
        {
          $set: {
            last_seen: new Date(),
            last_ip: clientIp,
            last_device: deviceName
          }
        }
      );
    }
  } catch (err) {
    console.error('Failed to log user activity:', err);
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const db = getDb();
    let user = await db.collection('thiruxdb_users').findOne({ username });

    const envAdminUsername = process.env.VITE_ADMIN_USERNAME;
    const envAdminPass = process.env.VITE_ADMIN_PASS;

    if (username === envAdminUsername) {
      if (password !== envAdminPass) {
        if (user) await logUserActivity(user._id, 'failed_login_attempt', req);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Upsert main admin if they don't exist
      if (!user) {
        const result = await db.collection('thiruxdb_users').insertOne({
          username,
          role: 'admin',
          is_active: true,
          created_at: new Date()
        });
        user = await db.collection('thiruxdb_users').findOne({ _id: result.insertedId });
      }
    } else {
      if (!user) return res.status(401).json({ error: 'Invalid username or password' });

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        await logUserActivity(user._id, 'failed_login_attempt', req);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is disabled' });
      }
    }

    const fingerprint = generateFingerprint(req);
    const secret = await getJwtSecret();
    
    // Fetch dynamic session timeout from settings
    const settingsDoc = await db.collection('thiruxdb_settings').findOne({ _id: 'general' });
    const expiresIn = settingsDoc?.session_timeout || '24h';

    const token = await new jose.SignJWT({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      restricted_pages: user.restricted_pages || [],
      fingerprint // Embed the fingerprint into the token!
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expiresIn)
      .sign(secret);

    await logUserActivity(user._id, 'login', req);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        restricted_pages: user.restricted_pages || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const user = await db.collection('thiruxdb_users').findOne({ username: req.user.username });
    if (!user || !user.is_active) return res.status(401).json({ error: 'User not found or disabled' });

    res.json({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      restricted_pages: user.restricted_pages || [],
      last_seen: user.last_seen
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
