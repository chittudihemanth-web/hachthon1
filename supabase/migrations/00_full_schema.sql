-- ==============================================================================
-- PulseFlow AI — Complete Single-File Supabase Database Schema
-- Description: Complete schema migration containing all tables, indexes, 
--              triggers, Row Level Security (RLS) policies, and seed data.
-- Safe to run in Supabase SQL Editor (100% Idempotent with IF NOT EXISTS guards).
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS & UTILITY FUNCTIONS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. WORKFLOWS TABLE
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('active', 'paused', 'draft', 'archived')),
    trigger_type TEXT NOT NULL DEFAULT 'webhook' 
        CHECK (trigger_type IN ('webhook', 'manual', 'document', 'scheduled', 'crm_event', 'email')),
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_threshold NUMERIC(4, 3) NOT NULL DEFAULT 0.850 
        CHECK (confidence_threshold >= 0.0 AND confidence_threshold <= 1.0),
    model_tier TEXT NOT NULL DEFAULT 'flash' 
        CHECK (model_tier IN ('flash', 'pro')),
    retry_limit INTEGER NOT NULL DEFAULT 3 
        CHECK (retry_limit >= 0 AND retry_limit <= 10),
    execution_count INTEGER NOT NULL DEFAULT 0,
    success_rate NUMERIC(5, 2) NOT NULL DEFAULT 100.00 
        CHECK (success_rate >= 0.0 AND success_rate <= 100.0),
    last_executed_at TIMESTAMPTZ,
    tags TEXT[] NOT NULL DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON public.workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_owner_id ON public.workflows(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON public.workflows(created_at DESC);

DROP TRIGGER IF EXISTS set_workflows_updated_at ON public.workflows;
CREATE TRIGGER set_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. EXECUTIONS TABLE
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running'
        CHECK (status IN ('success', 'failed', 'running', 'pending_review', 'retrying', 'cancelled')),
    trigger_type TEXT NOT NULL DEFAULT 'manual'
        CHECK (trigger_type IN ('webhook', 'manual', 'document', 'scheduled', 'crm_event', 'email')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    total_tokens_in INTEGER NOT NULL DEFAULT 0,
    total_tokens_out INTEGER NOT NULL DEFAULT 0,
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    hitl_required BOOLEAN NOT NULL DEFAULT FALSE,
    hitl_status TEXT
        CHECK (hitl_status IS NULL OR hitl_status IN ('pending', 'approved', 'rejected', 'expired')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    triggered_by TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON public.executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON public.executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON public.executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_hitl_status ON public.executions(hitl_status) WHERE hitl_required = TRUE;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. EXECUTION STEPS TABLE (Node Traces)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.execution_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES public.executions(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    node_type TEXT NOT NULL
        CHECK (node_type IN ('trigger', 'extractor', 'classifier', 'router', 'hitl', 'dispatcher')),
    node_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running'
        CHECK (status IN ('success', 'failed', 'skipped', 'running')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    tokens_in INTEGER NOT NULL DEFAULT 0,
    tokens_out INTEGER NOT NULL DEFAULT 0,
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    model TEXT,
    confidence NUMERIC(4, 3)
        CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_steps_execution_id ON public.execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_steps_node_type ON public.execution_steps(node_type);
CREATE INDEX IF NOT EXISTS idx_execution_steps_started_at ON public.execution_steps(started_at ASC);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. HUMAN-IN-THE-LOOP (HITL) REVIEWS TABLE
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hitl_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES public.executions(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    confidence NUMERIC(4, 3) NOT NULL
        CHECK (confidence >= 0.0 AND confidence <= 1.0),
    reasoning TEXT NOT NULL,
    extracted_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    proposed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    edited_payload JSONB,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hitl_reviews_status ON public.hitl_reviews(status);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_execution_id ON public.hitl_reviews(execution_id);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_priority ON public.hitl_reviews(priority);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_created_at ON public.hitl_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_expires_at ON public.hitl_reviews(expires_at ASC) WHERE status = 'pending';

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. PLATFORM SETTINGS TABLE
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    default_confidence_threshold NUMERIC(4, 3) NOT NULL DEFAULT 0.850
        CHECK (default_confidence_threshold >= 0.0 AND default_confidence_threshold <= 1.0),
    default_retry_limit INTEGER NOT NULL DEFAULT 3
        CHECK (default_retry_limit >= 0 AND default_retry_limit <= 10),
    default_model_tier TEXT NOT NULL DEFAULT 'flash'
        CHECK (default_model_tier IN ('flash', 'pro')),
    slack_webhook_url TEXT DEFAULT '',
    crm_webhook_url TEXT DEFAULT '',
    hitl_expiration_hours INTEGER NOT NULL DEFAULT 24
        CHECK (hitl_expiration_hours >= 1 AND hitl_expiration_hours <= 168),
    notify_on_hitl BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_failure BOOLEAN NOT NULL DEFAULT TRUE,
    max_concurrent_executions INTEGER NOT NULL DEFAULT 10
        CHECK (max_concurrent_executions >= 1 AND max_concurrent_executions <= 100),
    rate_limit_rpm INTEGER NOT NULL DEFAULT 120
        CHECK (rate_limit_rpm >= 10 AND rate_limit_rpm <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER set_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hitl_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Workflows
DROP POLICY IF EXISTS "Workflows select policy" ON public.workflows;
CREATE POLICY "Workflows select policy"
    ON public.workflows FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Workflows insert policy" ON public.workflows;
CREATE POLICY "Workflows insert policy"
    ON public.workflows FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "Workflows update policy" ON public.workflows;
CREATE POLICY "Workflows update policy"
    ON public.workflows FOR UPDATE
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Workflows delete policy" ON public.workflows;
CREATE POLICY "Workflows delete policy"
    ON public.workflows FOR DELETE
    TO anon, authenticated, service_role
    USING (true);

-- Executions
DROP POLICY IF EXISTS "Executions read policy" ON public.executions;
CREATE POLICY "Executions read policy"
    ON public.executions FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Executions write policy" ON public.executions;
CREATE POLICY "Executions write policy"
    ON public.executions FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- Execution Steps
DROP POLICY IF EXISTS "Execution steps read policy" ON public.execution_steps;
CREATE POLICY "Execution steps read policy"
    ON public.execution_steps FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Execution steps write policy" ON public.execution_steps;
CREATE POLICY "Execution steps write policy"
    ON public.execution_steps FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- HITL Reviews
DROP POLICY IF EXISTS "HITL reviews read policy" ON public.hitl_reviews;
CREATE POLICY "HITL reviews read policy"
    ON public.hitl_reviews FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "HITL reviews update policy" ON public.hitl_reviews;
CREATE POLICY "HITL reviews update policy"
    ON public.hitl_reviews FOR UPDATE
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "HITL reviews insert policy" ON public.hitl_reviews;
CREATE POLICY "HITL reviews insert policy"
    ON public.hitl_reviews FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

-- Platform Settings
DROP POLICY IF EXISTS "Platform settings access policy" ON public.platform_settings;
CREATE POLICY "Platform settings access policy"
    ON public.platform_settings FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. INITIAL SEED DATA (Templates for Immediate Testing)
-- ──────────────────────────────────────────────────────────────────────────────

-- Workflow 1: Invoice Extraction Pipeline
INSERT INTO public.workflows (
    id, name, description, status, trigger_type, nodes, edges,
    confidence_threshold, model_tier, retry_limit, execution_count, success_rate, tags
)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Invoice Extraction Pipeline',
    'Ingests PDF invoices via webhook, extracts line items with Gemini Pro, routes to AP or HITL review based on confidence.',
    'active',
    'document',
    '[
      {"id": "n1", "type": "trigger", "label": "Document Upload", "description": "PDF/PNG ingestion", "config": {"acceptedTypes": ["pdf", "png"]}, "position": {"x": 0, "y": 0}, "next": ["n2"]},
      {"id": "n2", "type": "extractor", "label": "Gemini Extractor", "description": "Structured extraction with gemini-2.5-pro", "config": {"model": "gemini-2.5-pro", "schema": "InvoiceSchema"}, "position": {"x": 0, "y": 1}, "next": ["n3"]},
      {"id": "n3", "type": "classifier", "label": "Confidence Router", "description": "Routes on confidence threshold", "config": {"threshold": 0.85}, "position": {"x": 0, "y": 2}, "next": ["n4", "n5"]},
      {"id": "n4", "type": "hitl", "label": "Human Review", "description": "HITL inbox for low-confidence results", "config": {"expirationHours": 24}, "position": {"x": -1, "y": 3}},
      {"id": "n5", "type": "dispatcher", "label": "CRM Update", "description": "Push validated invoice to ERP", "config": {"target": "crm_update"}, "position": {"x": 1, "y": 3}}
    ]'::jsonb,
    '[
      {"id": "e1", "from": "n1", "to": "n2"},
      {"id": "e2", "from": "n2", "to": "n3"},
      {"id": "e3", "from": "n3", "to": "n4", "label": "confidence < 0.85"},
      {"id": "e4", "from": "n3", "to": "n5", "label": "confidence >= 0.85"}
    ]'::jsonb,
    0.850,
    'pro',
    3,
    1248,
    94.20,
    ARRAY['finance', 'document', 'erp']
)
ON CONFLICT (id) DO NOTHING;

-- Workflow 2: Support Ticket Classifier
INSERT INTO public.workflows (
    id, name, description, status, trigger_type, nodes, edges,
    confidence_threshold, model_tier, retry_limit, execution_count, success_rate, tags
)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Support Ticket Classifier',
    'Classifies inbound support emails into priority buckets, auto-routes to Slack channels or creates CRM tickets.',
    'active',
    'email',
    '[
      {"id": "n1", "type": "trigger", "label": "Incoming Email", "description": "support@company.com webhook", "config": {"mailbox": "support"}, "position": {"x": 0, "y": 0}, "next": ["n2"]},
      {"id": "n2", "type": "classifier", "label": "Intent & Sentiment", "description": "Classifies urgency, category, sentiment", "config": {"categories": ["billing", "tech", "feature", "churn"]}, "position": {"x": 0, "y": 1}, "next": ["n3"]},
      {"id": "n3", "type": "router", "label": "Priority Router", "description": "P1 to Slack, P2-P4 to CRM", "config": {"p1Action": "slack", "otherAction": "crm"}, "position": {"x": 0, "y": 2}, "next": ["n4", "n5"]},
      {"id": "n4", "type": "dispatcher", "label": "Slack Alert", "description": "Post to #on-call-emergency", "config": {"channel": "#incidents"}, "position": {"x": -1, "y": 3}},
      {"id": "n5", "type": "dispatcher", "label": "Zendesk Ticket", "description": "Create ticket with tags", "config": {"target": "crm_update"}, "position": {"x": 1, "y": 3}}
    ]'::jsonb,
    '[
      {"id": "e1", "from": "n1", "to": "n2"},
      {"id": "e2", "from": "n2", "to": "n3"},
      {"id": "e3", "from": "n3", "to": "n4", "label": "priority = P1"},
      {"id": "e4", "from": "n3", "to": "n5", "label": "priority in (P2, P3, P4)"}
    ]'::jsonb,
    0.800,
    'flash',
    2,
    4891,
    98.70,
    ARRAY['support', 'email', 'slack']
)
ON CONFLICT (id) DO NOTHING;
