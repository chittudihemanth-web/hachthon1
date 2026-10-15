// backend/src/db/database.ts
import { MOCK_WORKFLOWS, MOCK_EXECUTIONS, MOCK_HITL_ITEMS, MOCK_DASHBOARD_STATS } from './seedData.js';
import { supabase, isSupabaseConfigured } from './supabase.js';
import type { Workflow, Execution, HitlReviewItem, DashboardStats, PlatformSettings } from '../types/index.js';

class DatabaseManager {
  private memoryWorkflows: Map<string, Workflow> = new Map();
  private memoryExecutions: Map<string, Execution> = new Map();
  private memoryHitlItems: Map<string, HitlReviewItem> = new Map();
  private memorySettings: PlatformSettings = {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    defaultConfidenceThreshold: 0.85,
    defaultRetryLimit: 3,
    defaultModelTier: 'flash',
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    crmWebhookUrl: process.env.CRM_WEBHOOK_URL || '',
    hitlExpirationHours: 24,
    notifyOnHitl: true,
    notifyOnFailure: true,
    maxConcurrentExecutions: 10,
    rateLimitRpm: 120,
  };

  constructor() {
    this.seedMemory();
    if (isSupabaseConfigured()) {
      console.log('⚡ [Database] Supabase credentials detected — PostgreSQL connection active.');
    } else {
      console.log('ℹ️ [Database] Running in in-memory simulation mode (Supabase credentials not configured).');
    }
  }

  private seedMemory() {
    for (const wf of MOCK_WORKFLOWS) {
      this.memoryWorkflows.set(wf.id, { ...wf });
    }
    for (const ex of MOCK_EXECUTIONS) {
      this.memoryExecutions.set(ex.id, { ...ex });
    }
    for (const item of MOCK_HITL_ITEMS) {
      this.memoryHitlItems.set(item.id, { ...item });
    }
  }

  // ── Workflows ──────────────────────────────────────────────────

  async getWorkflows(): Promise<Workflow[]> {
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('workflows')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(this.mapDbWorkflow);
        }
      } catch (err) {
        console.warn('[Database] Supabase getWorkflows failed, falling back to cache:', err);
      }
    }
    return Array.from(this.memoryWorkflows.values());
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return this.mapDbWorkflow(data);
        }
      } catch (err) {
        console.warn(`[Database] Supabase getWorkflow(${id}) failed, falling back to cache:`, err);
      }
    }
    return this.memoryWorkflows.get(id) || null;
  }

  async createWorkflow(wf: Workflow): Promise<Workflow> {
    this.memoryWorkflows.set(wf.id, wf);

    if (supabase && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('workflows').insert({
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
          created_at: wf.createdAt,
          updated_at: wf.updatedAt,
        });
        if (error) console.warn('[Database] Supabase createWorkflow insert warning:', error.message);
      } catch (err) {
        console.warn('[Database] Supabase createWorkflow failed:', err);
      }
    }
    return wf;
  }

  async updateWorkflow(id: string, patch: Partial<Workflow>): Promise<Workflow | null> {
    const existing = this.memoryWorkflows.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.memoryWorkflows.set(id, updated);

    if (supabase && isSupabaseConfigured()) {
      try {
        const dbPatch: Record<string, unknown> = {};
        if (patch.name !== undefined) dbPatch.name = patch.name;
        if (patch.description !== undefined) dbPatch.description = patch.description;
        if (patch.status !== undefined) dbPatch.status = patch.status;
        if (patch.nodes !== undefined) dbPatch.nodes = patch.nodes;
        if (patch.edges !== undefined) dbPatch.edges = patch.edges;
        if (patch.confidenceThreshold !== undefined) dbPatch.confidence_threshold = patch.confidenceThreshold;
        if (patch.modelTier !== undefined) dbPatch.model_tier = patch.modelTier;
        if (patch.retryLimit !== undefined) dbPatch.retry_limit = patch.retryLimit;
        if (patch.tags !== undefined) dbPatch.tags = patch.tags;
        dbPatch.updated_at = updated.updatedAt;

        await supabase.from('workflows').update(dbPatch).eq('id', id);
      } catch (err) {
        console.warn(`[Database] Supabase updateWorkflow(${id}) failed:`, err);
      }
    }
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const deleted = this.memoryWorkflows.delete(id);
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('workflows').delete().eq('id', id);
      } catch (err) {
        console.warn(`[Database] Supabase deleteWorkflow(${id}) failed:`, err);
      }
    }
    return deleted;
  }

  // ── Executions ─────────────────────────────────────────────────

  async getExecutions(status?: string): Promise<Execution[]> {
    if (supabase && isSupabaseConfigured()) {
      try {
        let query = supabase.from('executions').select('*').order('started_at', { ascending: false });
        if (status && status !== 'all') {
          query = query.eq('status', status);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(this.mapDbExecution);
        }
      } catch (err) {
        console.warn('[Database] Supabase getExecutions failed, falling back to cache:', err);
      }
    }
    const all = Array.from(this.memoryExecutions.values());
    if (!status || status === 'all') return all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return all.filter(e => e.status === status).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async getExecution(id: string): Promise<Execution | null> {
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: exData, error: exError } = await supabase
          .from('executions')
          .select('*')
          .eq('id', id)
          .single();

        if (!exError && exData) {
          const { data: stepsData } = await supabase
            .from('execution_steps')
            .select('*')
            .eq('execution_id', id)
            .order('started_at', { ascending: true });

          const ex = this.mapDbExecution(exData);
          if (stepsData) {
            ex.steps = stepsData.map(this.mapDbStep);
          }
          return ex;
        }
      } catch (err) {
        console.warn(`[Database] Supabase getExecution(${id}) failed:`, err);
      }
    }
    return this.memoryExecutions.get(id) || null;
  }

  async createExecution(execution: Execution): Promise<Execution> {
    this.memoryExecutions.set(execution.id, execution);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('executions').insert({
          id: execution.id,
          workflow_id: execution.workflowId,
          workflow_name: execution.workflowName,
          status: execution.status,
          trigger_type: execution.triggerType,
          started_at: execution.startedAt,
          duration_ms: execution.durationMs,
          total_tokens_in: execution.totalTokensIn,
          total_tokens_out: execution.totalTokensOut,
          input_payload: execution.inputPayload,
          output_payload: execution.outputPayload,
          hitl_required: execution.hitlRequired,
          retry_count: execution.retryCount,
          triggered_by: execution.triggeredBy,
        });

        if (execution.steps && execution.steps.length > 0) {
          const dbSteps = execution.steps.map(s => ({
            id: s.id,
            execution_id: execution.id,
            node_id: s.nodeId,
            node_type: s.nodeType,
            node_label: s.nodeLabel,
            status: s.status,
            started_at: s.startedAt,
            completed_at: s.completedAt,
            latency_ms: s.latencyMs,
            tokens_in: s.tokensIn,
            tokens_out: s.tokensOut,
            input_payload: s.inputPayload,
            output_payload: s.outputPayload,
            confidence: s.confidence,
            model: s.model,
            error_message: s.errorMessage,
            retry_count: s.retryCount,
          }));
          await supabase.from('execution_steps').insert(dbSteps);
        }
      } catch (err) {
        console.warn('[Database] Supabase createExecution failed:', err);
      }
    }
    return execution;
  }

  async updateExecution(id: string, patch: Partial<Execution>): Promise<Execution | null> {
    const existing = this.memoryExecutions.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.memoryExecutions.set(id, updated);

    if (supabase && isSupabaseConfigured()) {
      try {
        const dbPatch: Record<string, unknown> = {};
        if (patch.status !== undefined) dbPatch.status = patch.status;
        if (patch.completedAt !== undefined) dbPatch.completed_at = patch.completedAt;
        if (patch.durationMs !== undefined) dbPatch.duration_ms = patch.durationMs;
        if (patch.totalTokensIn !== undefined) dbPatch.total_tokens_in = patch.totalTokensIn;
        if (patch.totalTokensOut !== undefined) dbPatch.total_tokens_out = patch.totalTokensOut;
        if (patch.outputPayload !== undefined) dbPatch.output_payload = patch.outputPayload;
        if (patch.hitlRequired !== undefined) dbPatch.hitl_required = patch.hitlRequired;
        if (patch.hitlStatus !== undefined) dbPatch.hitl_status = patch.hitlStatus;
        if (patch.errorMessage !== undefined) dbPatch.error_message = patch.errorMessage;

        await supabase.from('executions').update(dbPatch).eq('id', id);
      } catch (err) {
        console.warn(`[Database] Supabase updateExecution(${id}) failed:`, err);
      }
    }
    return updated;
  }

  // ── HITL Review ────────────────────────────────────────────────

  async getHitlItems(status?: string): Promise<HitlReviewItem[]> {
    if (supabase && isSupabaseConfigured()) {
      try {
        let query = supabase.from('hitl_reviews').select('*').order('created_at', { ascending: false });
        if (status && status !== 'all') {
          query = query.eq('status', status);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(this.mapDbHitl);
        }
      } catch (err) {
        console.warn('[Database] Supabase getHitlItems failed:', err);
      }
    }
    const all = Array.from(this.memoryHitlItems.values());
    if (!status || status === 'all') return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all.filter(h => h.status === status).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getHitlItem(id: string): Promise<HitlReviewItem | null> {
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('hitl_reviews').select('*').eq('id', id).single();
        if (!error && data) {
          return this.mapDbHitl(data);
        }
      } catch (err) {
        console.warn(`[Database] Supabase getHitlItem(${id}) failed:`, err);
      }
    }
    return this.memoryHitlItems.get(id) || null;
  }

  async createHitlItem(item: HitlReviewItem): Promise<HitlReviewItem> {
    this.memoryHitlItems.set(item.id, item);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('hitl_reviews').insert({
          id: item.id,
          execution_id: item.executionId,
          workflow_id: item.workflowId,
          workflow_name: item.workflowName,
          status: item.status,
          confidence: item.confidence,
          reasoning: item.reasoning,
          extracted_payload: item.extractedPayload,
          proposed_payload: item.proposedPayload,
          expires_at: item.expiresAt,
          priority: item.priority,
          tags: item.tags,
          created_at: item.createdAt,
        });
      } catch (err) {
        console.warn('[Database] Supabase createHitlItem failed:', err);
      }
    }
    return item;
  }

  async reviewHitlItem(
    id: string,
    decision: 'approved' | 'rejected',
    editedPayload?: Record<string, unknown>,
    reviewedBy: string = 'admin@pulseflow.ai'
  ): Promise<HitlReviewItem | null> {
    const item = this.memoryHitlItems.get(id);
    if (!item) return null;

    const updated: HitlReviewItem = {
      ...item,
      status: decision,
      editedPayload: editedPayload || item.proposedPayload,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    };
    this.memoryHitlItems.set(id, updated);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('hitl_reviews').update({
          status: decision,
          edited_payload: updated.editedPayload,
          reviewed_by: reviewedBy,
          reviewed_at: updated.reviewedAt,
        }).eq('id', id);

        await supabase.from('executions').update({
          status: decision === 'approved' ? 'success' : 'failed',
          hitl_status: decision,
          output_payload: decision === 'approved' ? updated.editedPayload : undefined,
        }).eq('id', item.executionId);
      } catch (err) {
        console.warn(`[Database] Supabase reviewHitlItem(${id}) failed:`, err);
      }
    }

    return updated;
  }

  // ── Dashboard Stats ────────────────────────────────────────────

  async getDashboardStats(): Promise<DashboardStats> {
    const wfs = await this.getWorkflows();
    const execs = await this.getExecutions();
    const hitls = await this.getHitlItems();

    const successfulExecs = execs.filter(e => e.status === 'success');
    const successRate = execs.length > 0 ? (successfulExecs.length / execs.length) * 100 : 100;
    const totalTokens = execs.reduce((sum, e) => sum + e.totalTokensIn + e.totalTokensOut, 0);

    return {
      ...MOCK_DASHBOARD_STATS,
      totalWorkflows: wfs.length,
      activeWorkflows: wfs.filter(w => w.status === 'active').length,
      totalExecutions: execs.length,
      successRate: parseFloat(successRate.toFixed(1)),
      pendingReviews: hitls.filter(h => h.status === 'pending').length,
      totalTokensConsumed: totalTokens > 0 ? totalTokens : MOCK_DASHBOARD_STATS.totalTokensConsumed,
      recentExecutions: execs.slice(0, 10),
    };
  }

  // ── Platform Settings ──────────────────────────────────────────

  async getSettings(): Promise<PlatformSettings> {
    return { ...this.memorySettings };
  }

  async updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
    this.memorySettings = { ...this.memorySettings, ...patch };
    return { ...this.memorySettings };
  }

  // ── Schema Mappers ─────────────────────────────────────────────

  private mapDbWorkflow(dbRow: any): Workflow {
    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description || '',
      status: dbRow.status,
      triggerType: dbRow.trigger_type,
      nodes: dbRow.nodes || [],
      edges: dbRow.edges || [],
      confidenceThreshold: dbRow.confidence_threshold,
      modelTier: dbRow.model_tier,
      retryLimit: dbRow.retry_limit,
      executionCount: dbRow.execution_count || 0,
      successRate: dbRow.success_rate || 100,
      lastExecutedAt: dbRow.last_executed_at,
      tags: dbRow.tags || [],
      ownerId: dbRow.owner_id || 'system',
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  private mapDbExecution(dbRow: any): Execution {
    return {
      id: dbRow.id,
      workflowId: dbRow.workflow_id,
      workflowName: dbRow.workflow_name,
      status: dbRow.status,
      triggerType: dbRow.trigger_type,
      startedAt: dbRow.started_at,
      completedAt: dbRow.completed_at,
      durationMs: dbRow.duration_ms || 0,
      totalTokensIn: dbRow.total_tokens_in || 0,
      totalTokensOut: dbRow.total_tokens_out || 0,
      steps: [],
      inputPayload: dbRow.input_payload || {},
      outputPayload: dbRow.output_payload || {},
      errorMessage: dbRow.error_message,
      hitlRequired: dbRow.hitl_required || false,
      hitlStatus: dbRow.hitl_status,
      retryCount: dbRow.retry_count || 0,
      triggeredBy: dbRow.triggered_by || 'system',
    };
  }

  private mapDbStep(dbRow: any) {
    return {
      id: dbRow.id,
      executionId: dbRow.execution_id,
      nodeId: dbRow.node_id,
      nodeType: dbRow.node_type,
      nodeLabel: dbRow.node_label,
      status: dbRow.status,
      startedAt: dbRow.started_at,
      completedAt: dbRow.completed_at,
      latencyMs: dbRow.latency_ms || 0,
      tokensIn: dbRow.tokens_in || 0,
      tokensOut: dbRow.tokens_out || 0,
      inputPayload: dbRow.input_payload || {},
      outputPayload: dbRow.output_payload || {},
      confidence: dbRow.confidence,
      model: dbRow.model,
      errorMessage: dbRow.error_message,
      retryCount: dbRow.retry_count || 0,
    };
  }

  private mapDbHitl(dbRow: any): HitlReviewItem {
    return {
      id: dbRow.id,
      executionId: dbRow.execution_id,
      workflowId: dbRow.workflow_id,
      workflowName: dbRow.workflow_name,
      status: dbRow.status,
      confidence: dbRow.confidence,
      reasoning: dbRow.reasoning,
      extractedPayload: dbRow.extracted_payload || {},
      proposedPayload: dbRow.proposed_payload || {},
      editedPayload: dbRow.edited_payload,
      reviewedBy: dbRow.reviewed_by,
      reviewedAt: dbRow.reviewed_at,
      createdAt: dbRow.created_at,
      expiresAt: dbRow.expires_at,
      priority: dbRow.priority,
      tags: dbRow.tags || [],
    };
  }
}

export const db = new DatabaseManager();
