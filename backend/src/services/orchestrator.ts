// backend/src/services/orchestrator.ts
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { geminiService } from './gemini.js';
import { dispatcherService } from './dispatcher.js';
import type {
  Execution,
  ExecutionStep,
  Workflow,
  HitlReviewItem,
  TriggerType,
  ActionType,
} from '../types/index.js';

export class WorkflowOrchestrator {
  /**
   * Execute a workflow end-to-end
   */
  async execute(
    workflowId: string,
    initialPayload: Record<string, unknown> = {},
    triggerType: TriggerType = 'manual',
    triggeredBy: string = 'api'
  ): Promise<Execution> {
    const workflow = await db.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found.`);
    }

    const executionId = `exec-${uuidv4().slice(0, 8)}`;
    const startedAt = new Date().toISOString();

    const execution: Execution = {
      id: executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: 'running',
      triggerType,
      startedAt,
      durationMs: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      steps: [],
      inputPayload: initialPayload,
      hitlRequired: false,
      retryCount: 0,
      triggeredBy,
    };

    await db.createExecution(execution);

    let currentPayload = { ...initialPayload };
    let hitlRequired = false;
    let pipelineHalted = false;

    // Execute nodes sequentially
    for (const node of workflow.nodes) {
      if (pipelineHalted) break;

      const stepId = `step-${uuidv4().slice(0, 8)}`;
      const stepStartTime = Date.now();
      const stepStartIso = new Date().toISOString();

      let stepOutput: Record<string, unknown> = {};
      let stepTokensIn = 0;
      let stepTokensOut = 0;
      let stepConfidence: number | undefined;
      let stepModel: string | undefined;
      let stepError: string | undefined;

      try {
        switch (node.type) {
          case 'trigger': {
            stepOutput = {
              receivedPayload: currentPayload,
              triggerType,
              timestamp: stepStartIso,
            };
            break;
          }

          case 'extractor': {
            const result = await geminiService.extractEntities(currentPayload, workflow.modelTier);
            stepOutput = result.outputPayload;
            stepTokensIn = result.tokensIn;
            stepTokensOut = result.tokensOut;
            stepConfidence = result.confidence;
            stepModel = result.model;
            currentPayload = { ...currentPayload, ...stepOutput };
            break;
          }

          case 'classifier': {
            const result = await geminiService.classify(currentPayload, workflow.modelTier);
            stepOutput = {
              classification: result.category,
              confidence: result.confidence,
              reasoning: result.reasoning,
            };
            stepTokensIn = result.tokensIn;
            stepTokensOut = result.tokensOut;
            stepConfidence = result.confidence;
            stepModel = result.model;
            currentPayload = { ...currentPayload, ...stepOutput };
            break;
          }

          case 'router': {
            const threshold = workflow.confidenceThreshold || 0.85;
            const currentConf = stepConfidence ?? (currentPayload.confidence as number) ?? 0.9;
            const routesToHitl = currentConf < threshold;

            stepOutput = {
              evaluatedConfidence: currentConf,
              threshold,
              routedBranch: routesToHitl ? 'hitl_review_branch' : 'auto_dispatch_branch',
            };
            break;
          }

          case 'hitl': {
            const threshold = workflow.confidenceThreshold || 0.85;
            const conf = (currentPayload.confidence as number) ?? 0.80;

            if (conf < threshold || node.config.forceReview) {
              hitlRequired = true;
              pipelineHalted = true;

              const hitlItem: HitlReviewItem = {
                id: `hitl-${uuidv4().slice(0, 8)}`,
                executionId: execution.id,
                workflowId: workflow.id,
                workflowName: workflow.name,
                status: 'pending',
                confidence: conf,
                reasoning: `AI confidence score (${(conf * 100).toFixed(1)}%) is below required threshold (${(threshold * 100).toFixed(1)}%). Routing for human approval.`,
                extractedPayload: currentPayload,
                proposedPayload: { ...currentPayload, validated: true },
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
                priority: conf < 0.7 ? 'critical' : 'medium',
                tags: workflow.tags,
              };

              await db.createHitlItem(hitlItem);
              stepOutput = {
                status: 'enqueued_for_human_review',
                hitlItemId: hitlItem.id,
                reasoning: hitlItem.reasoning,
              };
            } else {
              stepOutput = {
                status: 'auto_approved_by_policy',
                confidence: conf,
              };
            }
            break;
          }

          case 'dispatcher': {
            const actionType = (node.config.target || 'slack') as ActionType;
            const result = await dispatcherService.dispatch(
              actionType,
              currentPayload,
              node.config.endpoint as string | undefined
            );
            stepOutput = result;
            break;
          }
        }
      } catch (err: any) {
        stepError = err.message || 'Node execution failed.';
        pipelineHalted = true;
      }

      const stepDuration = Date.now() - stepStartTime;
      const step: ExecutionStep = {
        id: stepId,
        executionId: execution.id,
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: node.label,
        status: stepError ? 'failed' : 'success',
        startedAt: stepStartIso,
        completedAt: new Date().toISOString(),
        latencyMs: stepDuration,
        tokensIn: stepTokensIn,
        tokensOut: stepTokensOut,
        inputPayload: currentPayload,
        outputPayload: stepOutput,
        confidence: stepConfidence,
        model: stepModel,
        errorMessage: stepError,
        retryCount: 0,
      };

      execution.steps.push(step);
      execution.totalTokensIn += stepTokensIn;
      execution.totalTokensOut += stepTokensOut;
    }

    const completedAt = new Date().toISOString();
    execution.completedAt = completedAt;
    execution.durationMs = Date.now() - new Date(startedAt).getTime();
    execution.outputPayload = currentPayload;
    execution.hitlRequired = hitlRequired;

    if (pipelineHalted && hitlRequired) {
      execution.status = 'pending_review';
      execution.hitlStatus = 'pending';
    } else if (execution.steps.some(s => s.status === 'failed')) {
      execution.status = 'failed';
      execution.errorMessage = execution.steps.find(s => s.status === 'failed')?.errorMessage;
    } else {
      execution.status = 'success';
    }

    await db.updateExecution(execution.id, execution);
    return execution;
  }
}

export const orchestrator = new WorkflowOrchestrator();
