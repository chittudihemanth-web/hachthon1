// backend/src/routes/workflows.ts
import { Router } from 'express';
import { db } from '../db/database.js';
import { orchestrator } from '../services/orchestrator.js';
import { v4 as uuidv4 } from 'uuid';
import type { Workflow } from '../types/index.js';

export const workflowsRouter = Router();

// GET all workflows
workflowsRouter.get('/', async (req, res, next) => {
  try {
    const workflows = await db.getWorkflows();
    res.json(workflows);
  } catch (err) {
    next(err);
  }
});

// GET single workflow
workflowsRouter.get('/:id', async (req, res, next) => {
  try {
    const workflow = await db.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (err) {
    next(err);
  }
});

// POST create workflow
workflowsRouter.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    const newWorkflow: Workflow = {
      id: `wf-${uuidv4().slice(0, 8)}`,
      name: data.name || 'Untitled Workflow',
      description: data.description || '',
      status: data.status || 'draft',
      triggerType: data.triggerType || 'webhook',
      nodes: data.nodes || [],
      edges: data.edges || [],
      confidenceThreshold: data.confidenceThreshold ?? 0.85,
      modelTier: data.modelTier || 'flash',
      retryLimit: data.retryLimit ?? 3,
      createdAt: now,
      updatedAt: now,
      ownerId: 'user-001',
      executionCount: 0,
      successRate: 100,
      tags: data.tags || ['custom'],
    };
    const created = await db.createWorkflow(newWorkflow);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT update workflow
workflowsRouter.put('/:id', async (req, res, next) => {
  try {
    const updated = await db.updateWorkflow(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE workflow
workflowsRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await db.deleteWorkflow(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (err) {
    next(err);
  }
});

// POST trigger execution for workflow
workflowsRouter.post('/:id/execute', async (req, res, next) => {
  try {
    const execution = await orchestrator.execute(
      req.params.id,
      req.body.payload || {},
      req.body.triggerType || 'manual',
      'api-user'
    );
    res.json(execution);
  } catch (err) {
    next(err);
  }
});
