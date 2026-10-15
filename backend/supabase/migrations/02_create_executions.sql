-- ==============================================================================
-- Migration: 02_create_executions.sql
-- Description: Creates the `executions` table for pipeline runs.
-- Pre-requisites: 01_create_extensions_and_workflows.sql
-- ==============================================================================

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

-- Indexes for execution logs and filters
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON public.executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON public.executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON public.executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_hitl_status ON public.executions(hitl_status) WHERE hitl_required = TRUE;

COMMENT ON TABLE public.executions IS 'Historical execution runs and audit trails for workflows.';
