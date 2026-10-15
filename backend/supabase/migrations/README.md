# PulseFlow AI — Supabase Database Migrations

To avoid single-run failure bottlenecks, migrations are decoupled into sequential, isolated files. Each file can be applied individually in the Supabase SQL Editor or automatically via the Supabase CLI.

---

## 📋 Migration Sequence

| Step | File | Purpose |
| :--- | :--- | :--- |
| **01** | [`01_create_extensions_and_workflows.sql`](./01_create_extensions_and_workflows.sql) | Enables `uuid-ossp`, `pgcrypto`, creates `workflows` table, indexes, and updated_at trigger |
| **02** | [`02_create_executions.sql`](./02_create_executions.sql) | Creates `executions` table for recording pipeline runs and audit trails |
| **03** | [`03_create_execution_steps.sql`](./03_create_execution_steps.sql) | Creates `execution_steps` table for node-level traces, payload diffs, and latency telemetry |
| **04** | [`04_create_hitl_reviews.sql`](./04_create_hitl_reviews.sql) | Creates `hitl_reviews` table for Human-In-The-Loop approval inbox & manual overrides |
| **05** | [`05_create_platform_settings.sql`](./05_create_platform_settings.sql) | Creates `platform_settings` table for rate limits, API keys, and notification toggles |
| **06** | [`06_enable_rls_and_policies.sql`](./06_enable_rls_and_policies.sql) | Enables Row Level Security (RLS) on all tables and applies authenticated access rules |
| **07** | [`07_seed_initial_data.sql`](./07_seed_initial_data.sql) | *(Optional)* Injects starter workflow templates (Invoice Extractor & Support Ticket Classifier) |

---

## 🛠️ How to Apply

### Option A: Via Supabase Dashboard (Web UI)
1. Open your Supabase Project: **Dashboard -> SQL Editor**.
2. Open each migration file from `01` to `06` (or `07`).
3. Paste the contents of one file and click **Run**.
4. Confirm success before proceeding to the next file.

### Option B: Via Supabase CLI
```bash
# Push migrations sequentially
npx supabase db push
```
