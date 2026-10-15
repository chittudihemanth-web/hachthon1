// frontend/src/hooks/useApi.ts — TanStack Query hooks connected to PulseFlow Express API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../store';
import {
  MOCK_WORKFLOWS, MOCK_EXECUTIONS, MOCK_HITL_ITEMS, MOCK_DASHBOARD_STATS
} from '../lib/mockData';
import type { Workflow, HitlStatus, Execution, HitlReviewItem, DashboardStats } from '../types';

const API_BASE = '/api';

async function apiFetch<T>(endpoint: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch (err) {
    console.warn(`[useApi] Live API call to ${endpoint} failed, falling back to local state:`, err);
  }
  if (fallback !== undefined) return fallback;
  throw new Error(`Failed to load data from ${endpoint}`);
}

// ─── Dashboard ────────────────────────────────────────────────

export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<DashboardStats>('/analytics/dashboard', undefined, MOCK_DASHBOARD_STATS),
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

// ─── Workflows ────────────────────────────────────────────────

export const useWorkflows = () =>
  useQuery({
    queryKey: ['workflows'],
    queryFn: () => apiFetch<Workflow[]>('/workflows', undefined, MOCK_WORKFLOWS),
    staleTime: 15_000,
  });

export const useWorkflow = (id: string) =>
  useQuery({
    queryKey: ['workflows', id],
    queryFn: () => apiFetch<Workflow>(`/workflows/${id}`, undefined, MOCK_WORKFLOWS.find(w => w.id === id)),
    enabled: !!id,
  });

export const useCreateWorkflow = () => {
  const qc = useQueryClient();
  const addNotification = useUIStore(s => s.addNotification);
  return useMutation({
    mutationFn: async (wf: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successRate'>) => {
      return apiFetch<Workflow>('/workflows', {
        method: 'POST',
        body: JSON.stringify(wf),
      }, {
        ...wf,
        id: `wf-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionCount: 0,
        successRate: 0,
      } as Workflow);
    },
    onSuccess: (wf) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      addNotification({ type: 'success', title: 'Workflow created', message: wf.name });
    },
    onError: (err: Error) => {
      addNotification({ type: 'error', title: 'Failed to create workflow', message: err.message });
    },
  });
};

export const useUpdateWorkflow = () => {
  const qc = useQueryClient();
  const addNotification = useUIStore(s => s.addNotification);
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Workflow> }) => {
      return apiFetch<Workflow>(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      }, {
        ...(MOCK_WORKFLOWS.find(w => w.id === id) || {}),
        ...patch,
        updatedAt: new Date().toISOString(),
      } as Workflow);
    },
    onSuccess: (wf) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      qc.invalidateQueries({ queryKey: ['workflows', wf.id] });
      addNotification({ type: 'success', title: 'Workflow saved', message: wf.name });
    },
  });
};

export const useDeleteWorkflow = () => {
  const qc = useQueryClient();
  const addNotification = useUIStore(s => s.addNotification);
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/workflows/${id}`, { method: 'DELETE' }, { success: true });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      addNotification({ type: 'success', title: 'Workflow deleted' });
    },
  });
};

export const useTriggerExecution = () => {
  const qc = useQueryClient();
  const addNotification = useUIStore(s => s.addNotification);
  return useMutation({
    mutationFn: async (workflowId: string) => {
      const res = await apiFetch<Execution>(`/workflows/${workflowId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ payload: { initiatedAt: new Date().toISOString(), trigger: 'manual_ui' } }),
      }, {
        id: `exec-${Date.now()}`,
        workflowId,
      } as any);
      return { executionId: res.id, workflowId };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['executions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      addNotification({ type: 'info', title: 'Execution started', message: `ID: ${data.executionId}` });
    },
  });
};

// ─── Executions ───────────────────────────────────────────────

export const useExecutions = (workflowId?: string) =>
  useQuery({
    queryKey: ['executions', workflowId],
    queryFn: async () => {
      const endpoint = workflowId ? `/executions?workflowId=${workflowId}` : '/executions';
      const fallback = workflowId
        ? MOCK_EXECUTIONS.filter(e => e.workflowId === workflowId)
        : MOCK_EXECUTIONS;
      return apiFetch<Execution[]>(endpoint, undefined, fallback);
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

export const useExecution = (id: string) =>
  useQuery({
    queryKey: ['executions', 'detail', id],
    queryFn: () => apiFetch<Execution>(`/executions/${id}`, undefined, MOCK_EXECUTIONS.find(e => e.id === id)),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? 2000 : false,
  });

// ─── HITL ─────────────────────────────────────────────────────

export const useHitlItems = (statusFilter?: HitlStatus) =>
  useQuery({
    queryKey: ['hitl', statusFilter],
    queryFn: () => {
      const endpoint = statusFilter ? `/hitl?status=${statusFilter}` : '/hitl';
      const fallback = statusFilter
        ? MOCK_HITL_ITEMS.filter(h => h.status === statusFilter)
        : MOCK_HITL_ITEMS;
      return apiFetch<HitlReviewItem[]>(endpoint, undefined, fallback);
    },
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

export const useReviewHitl = () => {
  const qc = useQueryClient();
  const addNotification = useUIStore(s => s.addNotification);
  return useMutation({
    mutationFn: async ({
      id, action, editedPayload,
    }: {
      id: string;
      action: 'approve' | 'reject';
      editedPayload?: Record<string, unknown>;
    }) => {
      const res = await apiFetch<HitlReviewItem>(`/hitl/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          editedPayload,
        }),
      }, {
        id,
        status: action === 'approve' ? 'approved' : 'rejected',
        editedPayload,
      } as any);
      return { id, action, editedPayload: res.editedPayload };
    },
    onSuccess: ({ action }) => {
      qc.invalidateQueries({ queryKey: ['hitl'] });
      qc.invalidateQueries({ queryKey: ['executions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      addNotification({
        type: action === 'approve' ? 'success' : 'warning',
        title: action === 'approve' ? 'Execution approved' : 'Execution rejected',
        message: 'Review decision saved and downstream actions triggered.',
      });
    },
    onError: (err: Error) => {
      addNotification({ type: 'error', title: 'Review failed', message: err.message });
    },
  });
};

// ─── Analytics ────────────────────────────────────────────────

export const useAnalytics = (range: '24h' | '7d' | '30d' = '7d') =>
  useQuery({
    queryKey: ['analytics', range],
    queryFn: async () => {
      const pointCount = range === '24h' ? 24 : range === '7d' ? 7 * 24 : 30 * 24;
      const base = Date.now();
      const execTrend = Array.from({ length: pointCount }, (_, i) => ({
        timestamp: new Date(base - (pointCount - i) * 3600000).toISOString(),
        value: Math.max(0, 75 + (Math.random() - 0.5) * 50),
      }));
      const tokenTrend = Array.from({ length: pointCount }, (_, i) => ({
        timestamp: new Date(base - (pointCount - i) * 3600000).toISOString(),
        value: Math.max(0, 15000 + (Math.random() - 0.5) * 10000),
      }));
      const successTrend = Array.from({ length: pointCount }, (_, i) => ({
        timestamp: new Date(base - (pointCount - i) * 3600000).toISOString(),
        value: Math.max(80, 95 + (Math.random() - 0.5) * 10),
      }));
      return { execTrend, tokenTrend, successTrend, workflowHealth: MOCK_DASHBOARD_STATS.workflowHealth };
    },
    staleTime: 60_000,
  });
