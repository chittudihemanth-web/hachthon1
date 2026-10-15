-- ==============================================================================
-- Migration: 05_create_platform_settings.sql
-- Description: Creates the `platform_settings` table for platform configuration.
-- Pre-requisites: 01_create_extensions_and_workflows.sql
-- ==============================================================================

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

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER set_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.platform_settings IS 'User and tenant level automation settings and thresholds.';
