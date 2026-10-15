// backend/src/routes/executions.ts
import { Router } from 'express';
import { db } from '../db/database.js';
import { orchestrator } from '../services/orchestrator.js';

export const executionsRouter = Router();

// GET executions with status filter
executionsRouter.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const executions = await db.getExecutions(status);
    res.json(executions);
  } catch (err) {
    next(err);
  }
});

// GET single execution by ID
executionsRouter.get('/:id', async (req, res, next) => {
  try {
    const execution = await db.getExecution(req.params.id);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    res.json(execution);
  } catch (err) {
    next(err);
  }
});

// POST trigger execution directly
executionsRouter.post('/', async (req, res, next) => {
  try {
    const { workflowId, payload, triggerType } = req.body;
    if (!workflowId) {
      return res.status(400).json({ error: 'workflowId is required' });
    }
    const execution = await orchestrator.execute(
      workflowId,
      payload || {},
      triggerType || 'manual',
      'api'
    );
    res.status(201).json(execution);
  } catch (err) {
    next(err);
  }
});
