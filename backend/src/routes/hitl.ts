// backend/src/routes/hitl.ts
import { Router } from 'express';
import { db } from '../db/database.js';

export const hitlRouter = Router();

// GET HITL queue with status filter
hitlRouter.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const items = await db.getHitlItems(status);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET single HITL item
hitlRouter.get('/:id', async (req, res, next) => {
  try {
    const item = await db.getHitlItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'HITL item not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST review decision (approve, reject, or edit payload)
hitlRouter.post('/:id/review', async (req, res, next) => {
  try {
    const { status, editedPayload, reviewer } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    }

    const reviewed = await db.reviewHitlItem(
      req.params.id,
      status,
      editedPayload,
      reviewer || 'admin@pulseflow.ai'
    );

    if (!reviewed) {
      return res.status(404).json({ error: 'HITL item not found' });
    }

    res.json(reviewed);
  } catch (err) {
    next(err);
  }
});
