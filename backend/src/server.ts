// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { requestLogger } from './middlewares/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';

import { workflowsRouter } from './routes/workflows.js';
import { executionsRouter } from './routes/executions.js';
import { hitlRouter } from './routes/hitl.js';
import { analyticsRouter } from './routes/analytics.js';
import { settingsRouter } from './routes/settings.js';
import { webhooksRouter } from './routes/webhooks.js';

const app = express();

// Security & Core Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Rate Limiting (120 req / min per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'PulseFlow AI Orchestration Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Mount Routes
app.use('/api/workflows', workflowsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/hitl', hitlRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/webhooks', webhooksRouter);

// Fallback & Error Handling
app.use(errorHandler);

const server = app.listen(ENV.PORT, () => {
  console.log(`
  ⚡ ────────────────────────────────────────────────────────── ⚡
  PulseFlow AI Backend Orchestration Server
  ──────────────────────────────────────────────────────────────
  ➜ API Server:   http://localhost:${ENV.PORT}
  ➜ Health Check: http://localhost:${ENV.PORT}/health
  ➜ Environment:  ${ENV.NODE_ENV}
  ➜ Gemini Model: ${ENV.GEMINI_DEFAULT_MODEL}
  ⚡ ────────────────────────────────────────────────────────── ⚡
  `);
});

export default app;
