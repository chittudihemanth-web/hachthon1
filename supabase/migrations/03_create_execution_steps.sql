-- ==============================================================================
-- Migration: 03_create_execution_steps.sql
-- Description: Creates the `execution_steps` table for granular node-by-node traces.
-- Pre-requisites: 02_create_executions.sql
-- ==============================================================================

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

-- Indexes for step queries
CREATE INDEX IF NOT EXISTS idx_execution_steps_execution_id ON public.execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_steps_node_type ON public.execution_steps(node_type);
CREATE INDEX IF NOT EXISTS idx_execution_steps_started_at ON public.execution_steps(started_at ASC);

COMMENT ON TABLE public.execution_steps IS 'Individual node execution steps, timings, payloads, and token consumption.';
