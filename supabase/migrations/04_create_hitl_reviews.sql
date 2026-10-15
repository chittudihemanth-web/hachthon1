-- ==============================================================================
-- Migration: 04_create_hitl_reviews.sql
-- Description: Creates the `hitl_reviews` table for Human-In-The-Loop approval items.
-- Pre-requisites: 01_create_extensions_and_workflows.sql, 02_create_executions.sql
-- ==============================================================================

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

-- Indexes for HITL inbox lookups and filters
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_status ON public.hitl_reviews(status);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_execution_id ON public.hitl_reviews(execution_id);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_priority ON public.hitl_reviews(priority);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_created_at ON public.hitl_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hitl_reviews_expires_at ON public.hitl_reviews(expires_at ASC) WHERE status = 'pending';

COMMENT ON TABLE public.hitl_reviews IS 'Human-in-the-loop review inbox for low-confidence or high-risk actions.';
