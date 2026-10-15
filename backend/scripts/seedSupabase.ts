// backend/scripts/seedSupabase.ts
import { db } from '../src/db/database.js';
import { supabase, isSupabaseConfigured } from '../src/db/supabase.js';
import { MOCK_WORKFLOWS } from '../src/db/seedData.js';

async function runSeed() {
  console.log('🚀 Running initial seed data insertion...');

  if (!isSupabaseConfigured() || !supabase) {
    console.log(`
⚠️  Supabase credentials not configured in backend/.env:
    SUPABASE_URL=${process.env.SUPABASE_URL || '(empty)'}
    SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY ? '(configured)' : '(empty)'}

👉 To execute this against your remote Supabase database:
   1. Open Supabase Dashboard: https://supabase.com/dashboard
   2. Go to: SQL Editor -> New Query
   3. Paste the contents of "supabase/full_schema.sql" (or "07_seed_initial_data.sql")
   4. Click "Run" (or Ctrl + Enter)
    `);
    process.exit(0);
  }

  try {
    for (const wf of MOCK_WORKFLOWS) {
      console.log(`Seeding workflow: ${wf.name} (${wf.id})...`);
      const { error } = await supabase.from('workflows').upsert({
        id: wf.id,
        name: wf.name,
        description: wf.description,
        status: wf.status,
        trigger_type: wf.triggerType,
        nodes: wf.nodes,
        edges: wf.edges,
        confidence_threshold: wf.confidenceThreshold,
        model_tier: wf.modelTier,
        retry_limit: wf.retryLimit,
        execution_count: wf.executionCount,
        success_rate: wf.successRate,
        tags: wf.tags,
      }, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error inserting ${wf.name}:`, error.message);
      } else {
        console.log(`✅ Workflow '${wf.name}' inserted/updated.`);
      }
    }
    console.log('🎉 Seed operation completed successfully!');
  } catch (err: any) {
    console.error('❌ Failed to run seed:', err.message);
  }
}

runSeed();
