// backend/src/routes/webhooks.ts
import { Router } from 'express';
import { orchestrator } from '../services/orchestrator.js';

export const webhooksRouter = Router();

// Ingest inbound webhook for a workflow
webhooksRouter.post('/:workflowId', async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const payload = req.body || {};

    const execution = await orchestrator.execute(
      workflowId,
      payload,
      'webhook',
      req.ip || 'webhook-sender'
    );

    res.status(202).json({
      success: true,
      executionId: execution.id,
      status: execution.status,
      message: 'Webhook received and workflow execution initiated.',
    });
  } catch (err: any) {
    next(err);
  }
});
