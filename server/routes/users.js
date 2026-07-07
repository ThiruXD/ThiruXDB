/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { authenticateToken, requireRole } from '../authMiddleware.js';

const router = express.Router();

// Apply auth to all user routes
router.use(authenticateToken);
// Only admins can manage users
router.use(requireRole(['admin']));

// GET /api/users - List users
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const users = await db.collection('thiruxdb_users').find({}).project({ password_hash: 0 }).toArray();
    res.json(users.map(u => ({ ...u, id: u._id.toString(), _id: undefined })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users - Create user
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await db.collection('thiruxdb_users').findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.collection('thiruxdb_users').insertOne({
      username,
      password_hash,
      role,
      is_active: true,
      restricted_pages: req.body.restricted_pages || [],
      created_at: new Date()
    });

    res.json({ id: result.insertedId.toString(), username, role, is_active: true, restricted_pages: req.body.restricted_pages || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id - Update user (role, status, password)
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const _id = new ObjectId(req.params.id);
    const { role, is_active, password, restricted_pages } = req.body;

    const update = { $set: { updated_at: new Date() } };
    if (role) update.$set.role = role;
    if (is_active !== undefined) update.$set.is_active = is_active;
    if (restricted_pages !== undefined) update.$set.restricted_pages = restricted_pages;
    if (password) update.$set.password_hash = await bcrypt.hash(password, 10);

    // Prevent removing last admin
    if (role !== 'admin' || is_active === false) {
      const user = await db.collection('thiruxdb_users').findOne({ _id });
      if (user && user.role === 'admin') {
        const adminCount = await db.collection('thiruxdb_users').countDocuments({ role: 'admin', is_active: true });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot disable or demote the last active admin' });
        }
      }
    }

    const result = await db.collection('thiruxdb_users').findOneAndUpdate(
      { _id },
      update,
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'User not found' });

    const { password_hash, ...safeUser } = result;
    res.json({ ...safeUser, id: safeUser._id.toString(), _id: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const _id = new ObjectId(req.params.id);

    const user = await db.collection('thiruxdb_users').findOne({ _id });
    if (user && user.role === 'admin') {
      const adminCount = await db.collection('thiruxdb_users').countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    await db.collection('thiruxdb_users').deleteOne({ _id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/activity - Get logs
router.get('/activity', async (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const pipeline = [];
    if (req.query.user_id) {
      pipeline.push({ $match: { user_id: new ObjectId(req.query.user_id) } });
    }

    pipeline.push(
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'thiruxdb_users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    );

    const logs = await db.collection('thiruxdb_user_activity_logs').aggregate(pipeline, { allowDiskUse: true }).toArray();
    const totalQuery = req.query.user_id ? { user_id: new ObjectId(req.query.user_id) } : {};
    const total = await db.collection('thiruxdb_user_activity_logs').countDocuments(totalQuery);

    res.json({
      logs: logs.map(l => ({
        id: l._id.toString(),
        username: l.user ? l.user.username : 'System/Unknown',
        action: l.action,
        ip_address: l.ip_address,
        device_info: l.device_info,
        location_data: l.location_data,
        created_at: l.created_at
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/settings - Get system settings
router.get('/settings', async (req, res) => {
  try {
    const db = getDb();
    const settings = await db.collection('thiruxdb_settings').findOne({ _id: 'general' });
    res.json(settings || { session_timeout: '24h' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/settings - Update system settings
router.post('/settings', async (req, res) => {
  try {
    const db = getDb();
    const { session_timeout } = req.body;
    
    await db.collection('thiruxdb_settings').updateOne(
      { _id: 'general' },
      { $set: { session_timeout: session_timeout || '24h', updated_at: new Date() } },
      { upsert: true }
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/ip-lookup/:ip - Proxy IP lookup to avoid frontend CORS/CSP issues
router.get('/ip-lookup/:ip', async (req, res) => {
  try {
    const { ip } = req.params;
    // We use ip-api.com since it's reliable and has a free tier without strict CORS for server-to-server calls
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    // Normalize format to match what the frontend expects (which was originally designed for ipapi.co)
    if (data.status === 'success') {
      res.json({
        ip: data.query,
        city: data.city,
        region: data.regionName,
        country_name: data.country,
        org: data.org,
        asn: data.as,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone
      });
    } else {
      res.status(400).json({ error: data.message || 'Lookup failed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
