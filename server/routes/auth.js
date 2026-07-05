/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import { authenticateToken } from '../authMiddleware.js';
import requestIp from 'request-ip';
import { UAParser } from 'ua-parser-js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'thiruxdb_super_secret_key_change_me';
const JWT_EXPIRES_IN = '24h';

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
        const response = await fetch(`http://ip-api.com/json/${clientIp}`);
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
    } catch (e) {
      console.error('IP lookup failed', e.message);
    }

    await db.collection('user_activity_logs').insertOne({
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
      await db.collection('users').updateOne(
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
    const user = await db.collection('users').findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await logUserActivity(user._id, 'failed_login_attempt', req);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logUserActivity(user._id, 'login', req);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role
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
    const user = await db.collection('users').findOne({ username: req.user.username });
    if (!user || !user.is_active) return res.status(401).json({ error: 'User not found or disabled' });

    res.json({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      last_seen: user.last_seen
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
