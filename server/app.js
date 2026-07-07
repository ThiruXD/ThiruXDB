/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import endpointsRouter from './routes/endpoints.js';
import recordsRouter from './routes/records.js';
import logsRouter from './routes/logs.js';
import dashboardRouter from './routes/dashboard.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import apikeysRouter from './routes/apikeys.js';
import gatewayRouter from './routes/gateway.js';
import { authenticateToken } from './authMiddleware.js';

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://ipapi.co", "http://ip-api.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// CORS
app.use(cors());

// Global Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15000, // Limit each IP to 15000 requests per window (accommodates high-frequency polling)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Specific Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));

// Prevent NoSQL Injection
app.use(mongoSanitize());

// Mount routes
// Note: We use /api prefix because Netlify redirects /api/* to the serverless function
// but the function receives the path with /api intact.
// Mount auth route without auth requirement
app.use('/api/auth', authLimiter, authRouter);

// Protect all other API routes
app.use('/api/endpoints', authenticateToken, endpointsRouter);
app.use('/api/records', authenticateToken, recordsRouter);
app.use('/api/logs', authenticateToken, logsRouter);
app.use('/api/dashboard', authenticateToken, dashboardRouter);
app.use('/api/users', usersRouter); // auth is applied inside the router
app.use('/api/apikeys', apikeysRouter); // auth is applied inside the router

// Public API Gateway (Auth is handled internally via API Keys)
app.use('/api/v1/public', gatewayRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Serve frontend static files in production (Render/Railway/VPS)
// Skip this on Netlify because Netlify's CDN serves the static files directly.
if (!process.env.NETLIFY) {
  let dir = process.cwd();
  try {
    dir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url || `file://${process.cwd()}/app.js`));
  } catch (e) {
    // Fallback to process.cwd() if path resolution fails in bundled environments
  }
  
  const distPath = path.join(dir, '../dist');
  app.use(express.static(distPath));

  // Fallback to index.html for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
