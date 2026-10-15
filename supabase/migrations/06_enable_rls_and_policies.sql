-- ==============================================================================
-- Migration: 06_enable_rls_and_policies.sql
-- Description: Enables Row Level Security (RLS) and configures security policies.
-- Fixed: 
--   1. Added DROP POLICY IF EXISTS before all policy creations (100% idempotent).
--   2. Replaced non-existent `auth.role()` with native Supabase roles `TO anon, authenticated, service_role`.
--   3. Added WITH CHECK clauses alongside USING to satisfy both read and write rules.
-- Pre-requisites: 01, 02, 03, 04, 05 migrations.
-- ==============================================================================

-- 1. Enable RLS on all public tables
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hitl_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Workflows Policies
-- ──────────────────────────────────────────────────────────────────────────────
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

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Executions Policies
-- ──────────────────────────────────────────────────────────────────────────────
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

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Execution Steps Policies
-- ──────────────────────────────────────────────────────────────────────────────
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

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. HITL Reviews Policies
-- ──────────────────────────────────────────────────────────────────────────────
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

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. Platform Settings Policies
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Platform settings access policy" ON public.platform_settings;
CREATE POLICY "Platform settings access policy"
    ON public.platform_settings FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);
