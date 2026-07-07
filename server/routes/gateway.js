import express from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Middleware to verify Public API Keys
async function verifyApiKey(req, res, next) {
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!apiKeyHeader) {
    return res.status(401).json({ error: 'Missing API Key. Provide it via X-API-Key or Authorization Bearer header.' });
  }

  // Extract key if it uses Bearer token format
  let providedKey = apiKeyHeader;
  if (providedKey.toLowerCase().startsWith('bearer ')) {
    providedKey = providedKey.slice(7).trim();
  }

  if (!providedKey.startsWith('txdb_key_')) {
    return res.status(401).json({ error: 'Invalid API Key format.' });
  }

  // Hash the provided key to match the database
  const hashedProvidedKey = crypto.createHash('sha256').update(providedKey).digest('hex');

  try {
    const db = getDb();
    const keyDoc = await db.collection('thiruxdb_api_keys').findOne({ key_hash: hashedProvidedKey });

    if (!keyDoc) {
      return res.status(401).json({ error: 'Invalid or revoked API Key.' });
    }

    if (!keyDoc.is_active) {
      return res.status(403).json({ error: 'API Key is disabled.' });
    }

    // Update last_used timestamp (fire and forget to avoid blocking the response)
    db.collection('thiruxdb_api_keys').updateOne(
      { _id: keyDoc._id },
      { $set: { last_used: new Date() } }
    ).catch(err => console.error('Failed to update API key last_used:', err));

    // Attach to request
    req.apiKey = keyDoc;
    next();
  } catch (err) {
    console.error('API Gateway Auth Error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

// Apply authentication middleware to all gateway routes
router.use(verifyApiKey);

// GET /api/v1/public/:collection - Query data from ANY collection dynamically
router.get('/:collection', async (req, res) => {
  try {
    const db = getDb();
    const collectionName = req.params.collection;
    
    // Prevent accessing internal system collections
    if (collectionName.startsWith('thiruxdb_')) {
      return res.status(403).json({ error: 'Access to internal system collections is forbidden.' });
    }

    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query._page as string || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(req.query._limit as string || '20'))); // Max 100 per request
    const skip = (page - 1) * limit;

    // Parse query filters
    // Exclude special query parameters that start with an underscore (like _page, _limit, _sort)
    const filter = {};
    Object.keys(req.query).forEach(key => {
      if (!key.startsWith('_')) {
        // Attempt to parse numbers and booleans
        const val = req.query[key];
        if (val === 'true') filter[key] = true;
        else if (val === 'false') filter[key] = false;
        else if (!isNaN(val) && val !== '') filter[key] = Number(val);
        else filter[key] = val;
      }
    });

    const collection = db.collection(collectionName);
    
    // Execute query
    const total = await collection.countDocuments(filter);
    const data = await collection.find(filter)
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/public/:collection/:id - Get a specific document by ID
router.get('/:collection/:id', async (req, res) => {
  try {
    const db = getDb();
    const collectionName = req.params.collection;
    
    if (collectionName.startsWith('thiruxdb_')) {
      return res.status(403).json({ error: 'Access to internal system collections is forbidden.' });
    }

    let queryId = req.params.id;
    // Attempt to convert to ObjectId if it looks like one, otherwise query by raw string ID
    let filter = { _id: queryId };
    if (queryId.length === 24) {
      try {
        filter = { $or: [{ _id: queryId }, { _id: new ObjectId(queryId) }] };
      } catch (e) { }
    }

    const doc = await db.collection(collectionName).findOne(filter);
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
