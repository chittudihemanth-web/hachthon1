// src/lib/mockData.ts — Comprehensive mock data generator for PulseFlow AI

import type {
  Workflow, Execution, ExecutionStep, HitlReviewItem,
  DashboardStats, MetricPoint, WorkflowHealthMetric, ExecutionStatus,
} from '../types/index.js';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(3));
const past = (ms: number) => new Date(Date.now() - ms).toISOString();
const future = (ms: number) => new Date(Date.now() + ms).toISOString();

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ─────────────────────────────────────────────
// Workflows
// ─────────────────────────────────────────────

export const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-001',
    name: 'Invoice Extraction Pipeline',
    description: 'Ingests PDF invoices via webhook, extracts line items with Gemini Pro, routes to AP or HITL review based on confidence.',
    status: 'active',
    triggerType: 'document',
    nodes: [
      { id: 'n1', type: 'trigger',    label: 'Document Upload', description: 'PDF/PNG ingestion', config: { acceptedTypes: ['pdf', 'png'] }, position: { x: 0, y: 0 }, next: ['n2'] },
      { id: 'n2', type: 'extractor',  label: 'Gemini Extractor', description: 'Structured extraction with gemini-2.5-pro', config: { model: 'gemini-2.5-pro', schema: 'InvoiceSchema' }, position: { x: 0, y: 1 }, next: ['n3'] },
      { id: 'n3', type: 'classifier', label: 'Confidence Router', description: 'Routes on confidence threshold', config: { threshold: 0.85 }, position: { x: 0, y: 2 }, next: ['n4', 'n5'] },
      { id: 'n4', type: 'hitl',       label: 'Human Review', description: 'HITL inbox for low-confidence results', config: { expirationHours: 24 }, position: { x: -1, y: 3 } },
      { id: 'n5', type: 'dispatcher', label: 'CRM Update', description: 'Push validated invoice to ERP', config: { target: 'crm_update' }, position: { x: 1, y: 3 } },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' }, { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4', label: 'confidence < 0.85' },
      { id: 'e4', from: 'n3', to: 'n5', label: 'confidence ≥ 0.85' },
    ],
    confidenceThreshold: 0.85,
    modelTier: 'pro',
    retryLimit: 3,
    createdAt: past(30 * 86400000),
    updatedAt: past(2 * 86400000),
    ownerId: 'user-001',
    executionCount: 1248,
    successRate: 94.2,
    lastExecutedAt: past(18 * 60000),
    tags: ['finance', 'document', 'erp'],
  },
  {
    id: 'wf-002',
    name: 'Support Ticket Classifier',
    description: 'Classifies inbound support emails into priority buckets, auto-routes to Slack channels or creates CRM tickets.',
    status: 'active',
    triggerType: 'email',
    nodes: [
      { id: 'n1', type: 'trigger',    label: 'Email Ingest', description: 'Inbound email trigger', config: {}, position: { x: 0, y: 0 }, next: ['n2'] },
      { id: 'n2', type: 'classifier', label: 'Sentiment & Priority', description: 'gemini-2.5-flash classification', config: { model: 'gemini-2.5-flash' }, position: { x: 0, y: 1 }, next: ['n3'] },
      { id: 'n3', type: 'router',     label: 'Priority Router', description: 'Routes P1/P2/P3/P4', config: {}, position: { x: 0, y: 2 }, next: ['n4', 'n5'] },
      { id: 'n4', type: 'dispatcher', label: 'Slack Alert', description: 'Send Slack notification', config: { target: 'slack' }, position: { x: -1, y: 3 } },
      { id: 'n5', type: 'dispatcher', label: 'CRM Ticket', description: 'Create CRM ticket', config: { target: 'crm_update' }, position: { x: 1, y: 3 } },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' }, { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4', label: 'P1/P2' },
      { id: 'e4', from: 'n3', to: 'n5', label: 'P3/P4' },
    ],
    confidenceThreshold: 0.80,
    modelTier: 'flash',
    retryLimit: 2,
    createdAt: past(20 * 86400000),
    updatedAt: past(1 * 86400000),
    ownerId: 'user-001',
    executionCount: 8432,
    successRate: 97.8,
    lastExecutedAt: past(5 * 60000),
    tags: ['support', 'email', 'classification'],
  },
  {
    id: 'wf-003',
    name: 'Contract Risk Analyzer',
    description: 'Extracts risk clauses from legal contracts, scores risk level, and routes high-risk items to Legal team HITL review.',
    status: 'active',
    triggerType: 'document',
    nodes: [
      { id: 'n1', type: 'trigger',    label: 'PDF Upload', description: 'Contract upload trigger', config: {}, position: { x: 0, y: 0 }, next: ['n2'] },
      { id: 'n2', type: 'extractor',  label: 'Clause Extractor', description: 'Deep legal context parsing', config: { model: 'gemini-2.5-pro' }, position: { x: 0, y: 1 }, next: ['n3'] },
      { id: 'n3', type: 'classifier', label: 'Risk Scorer', description: 'Scores risk 0-100', config: {}, position: { x: 0, y: 2 }, next: ['n4', 'n5'] },
      { id: 'n4', type: 'hitl',       label: 'Legal Review', description: 'High-risk routing to legal', config: {}, position: { x: -1, y: 3 } },
      { id: 'n5', type: 'dispatcher', label: 'Auto-Approve', description: 'Low-risk auto-approve', config: {}, position: { x: 1, y: 3 } },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' }, { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4', label: 'risk > 70' },
      { id: 'e4', from: 'n3', to: 'n5', label: 'risk ≤ 70' },
    ],
    confidenceThreshold: 0.90,
    modelTier: 'pro',
    retryLimit: 3,
    createdAt: past(15 * 86400000),
    updatedAt: past(3 * 86400000),
    ownerId: 'user-002',
    executionCount: 342,
    successRate: 91.5,
    lastExecutedAt: past(2 * 3600000),
    tags: ['legal', 'risk', 'contracts'],
  },
  {
    id: 'wf-004',
    name: 'Lead Enrichment Automation',
    description: 'Processes inbound form webhooks, enriches lead data with AI context parsing, routes to CRM with qualification score.',
    status: 'active',
    triggerType: 'webhook',
    nodes: [
      { id: 'n1', type: 'trigger',    label: 'Form Webhook', description: 'HTTP POST trigger', config: { method: 'POST' }, position: { x: 0, y: 0 }, next: ['n2'] },
      { id: 'n2', type: 'extractor',  label: 'Lead Enricher', description: 'Intent + ICP matching', config: {}, position: { x: 0, y: 1 }, next: ['n3'] },
      { id: 'n3', type: 'dispatcher', label: 'CRM Write', description: 'Write enriched lead to CRM', config: {}, position: { x: 0, y: 2 } },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' }, { id: 'e2', from: 'n2', to: 'n3' },
    ],
    confidenceThreshold: 0.75,
    modelTier: 'flash',
    retryLimit: 2,
    createdAt: past(10 * 86400000),
    updatedAt: past(1 * 86400000),
    ownerId: 'user-001',
    executionCount: 5621,
    successRate: 98.9,
    lastExecutedAt: past(12 * 60000),
    tags: ['sales', 'leads', 'crm'],
  },
  {
    id: 'wf-005',
    name: 'Telemetry Anomaly Detector',
    description: 'Processes telemetry event streams, uses Gemini Flash for real-time anomaly classification, fires alerts on detected incidents.',
    status: 'paused',
    triggerType: 'scheduled',
    nodes: [
      { id: 'n1', type: 'trigger',    label: 'Scheduled Poll', description: 'Every 5 minutes', config: { cron: '*/5 * * * *' }, position: { x: 0, y: 0 }, next: ['n2'] },
      { id: 'n2', type: 'extractor',  label: 'Log Parser', description: 'Structured log extraction', config: {}, position: { x: 0, y: 1 }, next: ['n3'] },
      { id: 'n3', type: 'classifier', label: 'Anomaly Classifier', description: 'Real-time anomaly scoring', config: {}, position: { x: 0, y: 2 }, next: ['n4'] },
      { id: 'n4', type: 'dispatcher', label: 'Alert Dispatch', description: 'Slack + PagerDuty relay', config: {}, position: { x: 0, y: 3 } },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' }, { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
    ],
    confidenceThreshold: 0.70,
    modelTier: 'flash',
    retryLimit: 1,
    createdAt: past(8 * 86400000),
    updatedAt: past(5 * 86400000),
    ownerId: 'user-002',
    executionCount: 2180,
    successRate: 88.3,
    lastExecutedAt: past(6 * 3600000),
    tags: ['devops', 'monitoring', 'anomaly'],
  },
  {
    id: 'wf-006',
    name: 'HR Onboarding Workflow',
    description: 'Automates new hire onboarding: parses offer letters, provisions system access requests, and sends welcome packages.',
    status: 'draft',
    triggerType: 'manual',
    nodes: [
      { id: 'n1', type: 'trigger',    label: 'Manual Trigger', description: 'HR initiates manually', config: {}, position: { x: 0, y: 0 }, next: ['n2'] },
      { id: 'n2', type: 'extractor',  label: 'Offer Letter Parser', description: 'Parse role, comp, start date', config: {}, position: { x: 0, y: 1 }, next: ['n3'] },
      { id: 'n3', type: 'dispatcher', label: 'Provisioning Request', description: 'Create access tickets', config: {}, position: { x: 0, y: 2 } },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' }, { id: 'e2', from: 'n2', to: 'n3' },
    ],
    confidenceThreshold: 0.85,
    modelTier: 'pro',
    retryLimit: 2,
    createdAt: past(3 * 86400000),
    updatedAt: past(1 * 86400000),
    ownerId: 'user-003',
    executionCount: 0,
    successRate: 0,
    tags: ['hr', 'onboarding', 'draft'],
  },
];

// ─────────────────────────────────────────────
// Executions
// ─────────────────────────────────────────────

const STEP_TEMPLATES: Omit<ExecutionStep, 'id' | 'executionId'>[] = [
  {
    nodeId: 'n1', nodeType: 'trigger', nodeLabel: 'Webhook Trigger', status: 'success',
    startedAt: past(5 * 60000), completedAt: past(5 * 60000 - 45),
    latencyMs: 45, tokensIn: 0, tokensOut: 0,
    inputPayload: { method: 'POST', headers: { 'content-type': 'application/json' }, body: { invoice_id: 'INV-2024-0928', vendor: 'Acme Corp', amount: 12450.00 } },
    outputPayload: { parsed: true, triggerData: { source: 'webhook', ts: new Date().toISOString() } },
    retryCount: 0,
  },
  {
    nodeId: 'n2', nodeType: 'extractor', nodeLabel: 'Gemini Extractor', status: 'success',
    startedAt: past(5 * 60000 - 50), completedAt: past(5 * 60000 - 2800),
    latencyMs: 2750, tokensIn: 1240, tokensOut: 420, model: 'gemini-2.5-pro',
    confidence: 0.923,
    inputPayload: { document: 'base64_pdf_content...', schema: 'InvoiceSchema' },
    outputPayload: {
      invoice_number: 'INV-2024-0928', vendor_name: 'Acme Corp', amount: 12450.00,
      line_items: [{ description: 'Professional Services', qty: 1, unit_price: 12450 }],
      due_date: '2024-11-15', confidence: 0.923,
    },
    retryCount: 0,
  },
  {
    nodeId: 'n3', nodeType: 'classifier', nodeLabel: 'Confidence Router', status: 'success',
    startedAt: past(5 * 60000 - 2900), completedAt: past(5 * 60000 - 2940),
    latencyMs: 40, tokensIn: 120, tokensOut: 80, model: 'gemini-2.5-flash',
    confidence: 0.923,
    inputPayload: { confidence: 0.923, threshold: 0.85 },
    outputPayload: { route: 'auto_approve', reason: 'Confidence 0.923 exceeds threshold 0.85' },
    retryCount: 0,
  },
  {
    nodeId: 'n5', nodeType: 'dispatcher', nodeLabel: 'CRM Update', status: 'success',
    startedAt: past(5 * 60000 - 3000), completedAt: past(5 * 60000 - 3380),
    latencyMs: 380, tokensIn: 0, tokensOut: 0,
    inputPayload: { endpoint: 'https://crm.example.com/api/invoices', payload: { invoice_number: 'INV-2024-0928' } },
    outputPayload: { statusCode: 201, recordId: 'crm-inv-88421', message: 'Invoice created successfully' },
    retryCount: 0,
  },
];

export const MOCK_EXECUTIONS: Execution[] = Array.from({ length: 40 }, (_, i) => {
  const statuses: ExecutionStatus[] = ['success', 'success', 'success', 'success', 'failed', 'pending_review', 'running', 'retrying'];
  const status = i === 0 ? 'running' : i === 1 ? 'pending_review' : pick(statuses);
  const wf = pick(MOCK_WORKFLOWS.slice(0, 4));
  const duration = rand(800, 8000);
  const started = past(rand(0, 72 * 3600000));

  return {
    id: `exec-${String(i + 1).padStart(4, '0')}`,
    workflowId: wf.id,
    workflowName: wf.name,
    status,
    triggerType: wf.triggerType,
    startedAt: started,
    completedAt: status !== 'running' ? new Date(new Date(started).getTime() + duration).toISOString() : undefined,
    durationMs: duration,
    totalTokensIn: rand(200, 3000),
    totalTokensOut: rand(100, 1000),
    steps: STEP_TEMPLATES.map((s, si) => ({
      ...s,
      id: `step-${i}-${si}`,
      executionId: `exec-${String(i + 1).padStart(4, '0')}`,
    })),
    inputPayload: { source: 'webhook', data: { id: `INV-2024-${1000 + i}` } },
    outputPayload: status === 'success' ? { result: 'processed', recordId: `crm-${1000 + i}` } : undefined,
    errorMessage: status === 'failed' ? 'LLM output failed schema validation after 3 retries. Field "amount" expected number, got string.' : undefined,
    hitlRequired: status === 'pending_review',
    hitlStatus: status === 'pending_review' ? 'pending' : undefined,
    retryCount: status === 'failed' ? 3 : status === 'retrying' ? 1 : 0,
    triggeredBy: pick(['webhook', 'scheduler', 'manual:user@company.com']),
  };
});

// ─────────────────────────────────────────────
// HITL Review Items
// ─────────────────────────────────────────────

export const MOCK_HITL_ITEMS: HitlReviewItem[] = [
  {
    id: 'hitl-001', executionId: 'exec-0002',
    workflowId: 'wf-001', workflowName: 'Invoice Extraction Pipeline',
    status: 'pending', confidence: 0.718,
    reasoning: 'Vendor name "ACME CORP LTD" did not match any known vendor alias. Amount currency ambiguous — could be USD or EUR. Line item descriptions are abbreviated and may not map to correct GL codes.',
    extractedPayload: { vendor_name: 'ACME CORP LTD', amount: 8250, currency: '?', line_items: [{ desc: 'SVC-Q4', qty: 3, unit_price: 2750 }] },
    proposedPayload:  { vendor_name: 'Acme Corporation', amount: 8250.00, currency: 'USD', line_items: [{ description: 'Q4 Managed Services', qty: 3, unit_price: 2750.00 }] },
    createdAt: past(2 * 3600000),
    expiresAt: future(22 * 3600000),
    priority: 'high',
    tags: ['vendor-mismatch', 'currency-ambiguous'],
  },
  {
    id: 'hitl-002', executionId: 'exec-0012',
    workflowId: 'wf-003', workflowName: 'Contract Risk Analyzer',
    status: 'pending', confidence: 0.641,
    reasoning: 'Identified 3 potentially high-risk clauses: (1) Force Majeure clause missing, (2) Indemnification scope is unusually broad, (3) IP ownership clause favors counterparty. Risk score 82/100 exceeds threshold.',
    extractedPayload: { contract_type: 'MSA', parties: ['CorpA', 'VendorX'], risk_score: 82, risk_flags: ['missing_force_majeure', 'broad_indemnification', 'ip_risk'] },
    proposedPayload:  { contract_type: 'Master Services Agreement', parties: ['Acme Corporation', 'VendorX Inc.'], risk_score: 82, risk_level: 'HIGH', recommended_action: 'Legal review required before signing' },
    createdAt: past(4 * 3600000),
    expiresAt: future(20 * 3600000),
    priority: 'critical',
    tags: ['legal', 'high-risk', 'ip'],
  },
  {
    id: 'hitl-003', executionId: 'exec-0021',
    workflowId: 'wf-001', workflowName: 'Invoice Extraction Pipeline',
    status: 'pending', confidence: 0.793,
    reasoning: 'Invoice total ($47,200) exceeds the automatic approval limit of $25,000. Routing to human review per configured policy regardless of confidence score.',
    extractedPayload: { vendor_name: 'TechSolutions Inc.', amount: 47200, currency: 'USD', invoice_date: '2024-10-01', due_date: '2024-10-31' },
    proposedPayload:  { vendor_name: 'TechSolutions Inc.', amount: 47200.00, currency: 'USD', requires_vp_approval: true, approval_reason: 'Amount exceeds $25k threshold' },
    createdAt: past(1 * 3600000),
    expiresAt: future(23 * 3600000),
    priority: 'medium',
    tags: ['high-value', 'approval-required'],
  },
  {
    id: 'hitl-004', executionId: 'exec-0035',
    workflowId: 'wf-002', workflowName: 'Support Ticket Classifier',
    status: 'approved', confidence: 0.762,
    reasoning: 'Customer sentiment classified as "critical" but ticket topic is ambiguous — could be billing dispute or technical outage. Routed for verification.',
    extractedPayload: { subject: 'URGENT: System completely down!!!', sentiment: 'critical', category: 'unknown', priority: 'P1' },
    proposedPayload:  { category: 'Technical Outage', priority: 'P1', assignTeam: 'Infrastructure', slackChannel: '#incidents' },
    editedPayload:    { category: 'Billing Dispute', priority: 'P2', assignTeam: 'Billing Support', slackChannel: '#billing-support' },
    reviewedBy: 'sarah.ops@company.com',
    reviewedAt: past(30 * 60000),
    createdAt: past(3 * 3600000),
    expiresAt: future(21 * 3600000),
    priority: 'high',
    tags: ['sentiment-conflict', 'priority-mismatch'],
  },
  {
    id: 'hitl-005', executionId: 'exec-0028',
    workflowId: 'wf-003', workflowName: 'Contract Risk Analyzer',
    status: 'rejected', confidence: 0.534,
    reasoning: 'Extraction quality extremely low — document appears to be a scanned handwritten note, not a typed contract. OCR quality insufficient for reliable parsing.',
    extractedPayload: { contract_type: 'unknown', parties: [], risk_score: null, ocr_quality: 0.31 },
    proposedPayload:  { action: 'request_resubmission', reason: 'Document quality insufficient' },
    reviewedBy: 'legal.ops@company.com',
    reviewedAt: past(1 * 3600000),
    createdAt: past(5 * 3600000),
    expiresAt: future(19 * 3600000),
    priority: 'low',
    tags: ['poor-ocr', 'resubmit'],
  },
];

// ─────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────

const generateTrend = (points: number, base: number, variance: number): MetricPoint[] =>
  Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(Date.now() - (points - i) * 3600000).toISOString(),
    value: Math.max(0, base + (Math.random() - 0.5) * variance),
  }));

const WORKFLOW_HEALTH: WorkflowHealthMetric[] = MOCK_WORKFLOWS.slice(0, 5).map(wf => ({
  workflowId: wf.id,
  workflowName: wf.name,
  successRate: wf.successRate,
  totalExecutions: wf.executionCount,
  failureCount: Math.round(wf.executionCount * (1 - wf.successRate / 100)),
  avgDurationMs: rand(1200, 6000),
  totalTokensConsumed: rand(100000, 5000000),
  estimatedCostUsd: randFloat(2.5, 180),
}));

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalWorkflows: MOCK_WORKFLOWS.length,
  activeWorkflows: MOCK_WORKFLOWS.filter(w => w.status === 'active').length,
  totalExecutions: 17823,
  successRate: 95.4,
  pendingReviews: MOCK_HITL_ITEMS.filter(h => h.status === 'pending').length,
  totalTokensConsumed: 8_420_000,
  estimatedCostUsd: 421.00,
  avgExecutionMs: 3240,
  executionTrend:  generateTrend(24, 85, 40),
  tokenSpendTrend: generateTrend(24, 18000, 8000),
  workflowHealth: WORKFLOW_HEALTH,
  recentExecutions: MOCK_EXECUTIONS.slice(0, 10),
};
