-- ==============================================================================
-- Migration: 01_create_extensions_and_workflows.sql
-- Description: Enables required extensions and creates the `workflows` table.
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger function to automatically update `updated_at` timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Workflows Table
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

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON public.workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_owner_id ON public.workflows(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON public.workflows(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_workflows_updated_at ON public.workflows;
CREATE TRIGGER set_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.workflows IS 'Stores autonomous pipeline definitions, DAG nodes, and trigger configs.';
