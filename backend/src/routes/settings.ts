// backend/src/routes/settings.ts
import { Router } from 'express';
import { db } from '../db/database.js';

export const settingsRouter = Router();

// GET settings
settingsRouter.get('/', async (req, res, next) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// PUT update settings
settingsRouter.put('/', async (req, res, next) => {
  try {
    const updated = await db.updateSettings(req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
