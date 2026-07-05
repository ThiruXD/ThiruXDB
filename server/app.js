/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import express from 'express';
import cors from 'cors';
import endpointsRouter from './routes/endpoints.js';
import recordsRouter from './routes/records.js';
import logsRouter from './routes/logs.js';
import dashboardRouter from './routes/dashboard.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import { authenticateToken } from './authMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount routes
// Note: We use /api prefix because Netlify redirects /api/* to the serverless function
// but the function receives the path with /api intact.
// Mount auth route without auth requirement
app.use('/api/auth', authRouter);

// Protect all other API routes
app.use('/api/endpoints', authenticateToken, endpointsRouter);
app.use('/api/records', authenticateToken, recordsRouter);
app.use('/api/logs', authenticateToken, logsRouter);
app.use('/api/dashboard', authenticateToken, dashboardRouter);
app.use('/api/users', usersRouter); // auth is applied inside the router

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
