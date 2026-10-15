-- ==============================================================================
-- Migration: 07_seed_initial_data.sql
-- Description: Optional starter seed data for immediate workflow testing.
-- Pre-requisites: All previous migrations.
-- ==============================================================================

-- Seed 1: Invoice Extraction Pipeline
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

-- Seed 2: Support Ticket Classifier
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
