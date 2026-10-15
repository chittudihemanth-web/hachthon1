// backend/src/routes/analytics.ts
import { Router } from 'express';
import { db } from '../db/database.js';

export const analyticsRouter = Router();

// GET dashboard metrics and aggregates
analyticsRouter.get('/dashboard', async (req, res, next) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});
