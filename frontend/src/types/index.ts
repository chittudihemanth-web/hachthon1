// src/types/index.ts — Central type definitions for PulseFlow AI

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type WorkflowStatus = 'active' | 'paused' | 'draft' | 'archived';
export type ExecutionStatus = 'success' | 'failed' | 'running' | 'pending_review' | 'retrying' | 'cancelled';
export type NodeType = 'trigger' | 'extractor' | 'classifier' | 'router' | 'hitl' | 'dispatcher';
export type TriggerType = 'webhook' | 'manual' | 'document' | 'scheduled' | 'crm_event' | 'email';
export type ActionType = 'slack' | 'crm_update' | 'webhook_relay' | 'email_draft' | 'database_write';
export type HitlStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type ModelTier = 'flash' | 'pro';

// ─────────────────────────────────────────────
// Workflow Builder
// ─────────────────────────────────────────────

export interface WorkflowNodeConfig {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  next?: string[];
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  nodes: WorkflowNodeConfig[];
  edges: WorkflowEdge[];
  confidenceThreshold: number;    // 0.0 – 1.0
  modelTier: ModelTier;
  retryLimit: number;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  executionCount: number;
  successRate: number;            // 0 – 100
  lastExecutedAt?: string;
  tags: string[];
}

// ─────────────────────────────────────────────
// Executions
// ─────────────────────────────────────────────

export interface ExecutionStep {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: NodeType;
  nodeLabel: string;
  status: 'success' | 'failed' | 'skipped' | 'running';
  startedAt: string;
  completedAt?: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
  model?: string;
  confidence?: number;
  errorMessage?: string;
  retryCount: number;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  triggerType: TriggerType;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  totalTokensIn: number;
  totalTokensOut: number;
  steps: ExecutionStep[];
  inputPayload: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  errorMessage?: string;
  hitlRequired: boolean;
  hitlStatus?: HitlStatus;
  retryCount: number;
  triggeredBy: string;
}

// ─────────────────────────────────────────────
// HITL Review
// ─────────────────────────────────────────────

export interface HitlReviewItem {
  id: string;
  executionId: string;
  workflowId: string;
  workflowName: string;
  status: HitlStatus;
  confidence: number;
  reasoning: string;
  extractedPayload: Record<string, unknown>;
  proposedPayload: Record<string, unknown>;
  editedPayload?: Record<string, unknown>;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  expiresAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

// ─────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface WorkflowHealthMetric {
  workflowId: string;
  workflowName: string;
  successRate: number;
  totalExecutions: number;
  failureCount: number;
  avgDurationMs: number;
  totalTokensConsumed: number;
  estimatedCostUsd: number;
}

export interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  pendingReviews: number;
  totalTokensConsumed: number;
  estimatedCostUsd: number;
  avgExecutionMs: number;
  executionTrend: MetricPoint[];
  tokenSpendTrend: MetricPoint[];
  workflowHealth: WorkflowHealthMetric[];
  recentExecutions: Execution[];
}

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

export interface PlatformSettings {
  geminiApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  defaultConfidenceThreshold: number;
  defaultRetryLimit: number;
  defaultModelTier: ModelTier;
  slackWebhookUrl: string;
  crmWebhookUrl: string;
  hitlExpirationHours: number;
  notifyOnHitl: boolean;
  notifyOnFailure: boolean;
  maxConcurrentExecutions: number;
  rateLimitRpm: number;
}
