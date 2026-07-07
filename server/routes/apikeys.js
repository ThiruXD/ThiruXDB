import express from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db.js';
import { authenticateToken, requireRole } from '../authMiddleware.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// All API key management requires admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/apikeys - List all API keys
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const keys = await db.collection('thiruxdb_api_keys').find().sort({ created_at: -1 }).toArray();
    // Never return the full key in the list, only the prefix/suffix for identification
    const sanitizedKeys = keys.map(k => ({
      _id: k._id,
      name: k.name,
      prefix: k.prefix,
      created_at: k.created_at,
      created_by: k.created_by,
      is_active: k.is_active,
      last_used: k.last_used
    }));
    res.json(sanitizedKeys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/apikeys - Generate a new API key
router.post('/', async (req, res) => {
  try {
    const { name, rate_limit, quota } = req.body;
    if (!name) return res.status(400).json({ error: 'Key name is required' });

    const db = getDb();
    
    // Generate a secure random key
    // Format: txdb_key_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const fullKey = `txdb_key_${randomBytes}`;
    
    // Store the prefix for identification
    const prefix = `txdb_key_${randomBytes.substring(0, 6)}...${randomBytes.substring(randomBytes.length - 4)}`;

    // Hash the full key for storage so even DB access doesn't expose keys
    const hashedKey = crypto.createHash('sha256').update(fullKey).digest('hex');

    // Initialize quota usage
    const now = new Date();
    // Start of current day/week/month
    const reset_at = new Date(now);
    if (quota.window === 'day') {
      reset_at.setHours(24, 0, 0, 0); // Start of tomorrow
    } else if (quota.window === 'week') {
      const daysToNextMonday = (8 - reset_at.getDay()) % 7 || 7;
      reset_at.setDate(reset_at.getDate() + daysToNextMonday);
      reset_at.setHours(0, 0, 0, 0);
    } else if (quota.window === 'month') {
      reset_at.setMonth(reset_at.getMonth() + 1, 1);
      reset_at.setHours(0, 0, 0, 0);
    }

    const newKey = {
      name,
      prefix,
      key_hash: hashedKey, // We ONLY store the hash!
      rate_limit,
      quota,
      usage: {
        quota_used: 0,
        reset_at
      },
      created_at: now,
      created_by: req.user.username,
      is_active: true,
      last_used: null
    };

    const result = await db.collection('thiruxdb_api_keys').insertOne(newKey);
    
    // We only return the full key ONCE upon creation!
    res.json({ 
      success: true, 
      key: {
        _id: result.insertedId,
        name: newKey.name,
        prefix: newKey.prefix,
        created_at: newKey.created_at,
      },
      full_key: fullKey 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/apikeys/:id - Revoke/Delete an API key
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('thiruxdb_api_keys').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'API key not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
