// src/store/index.ts — Zustand global state management

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Workflow, PlatformSettings, Execution } from '../types';

// ─────────────────────────────────────────────
// UI Store (ephemeral — not persisted)
// ─────────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;

  activeWorkflowId: string | null;
  setActiveWorkflowId: (id: string | null) => void;

  selectedExecutionId: string | null;
  setSelectedExecutionId: (id: string | null) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;

  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  createdAt: string;
  duration?: number;
}

let notifCounter = 0;

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      activeWorkflowId: null,
      setActiveWorkflowId: (id) => set({ activeWorkflowId: id }),

      selectedExecutionId: null,
      setSelectedExecutionId: (id) => set({ selectedExecutionId: id }),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),

      notifications: [],
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            ...s.notifications,
            { ...n, id: `notif-${++notifCounter}`, createdAt: new Date().toISOString() },
          ].slice(-5), // max 5 notifications
        })),
      removeNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    { name: 'pulseflow-ui' }
  )
);

// ─────────────────────────────────────────────
// Workflow Builder Store
// ─────────────────────────────────────────────

interface WorkflowBuilderState {
  draft: Workflow | null;
  isDirty: boolean;
  selectedNodeId: string | null;

  initDraft: (wf: Workflow) => void;
  clearDraft: () => void;
  updateDraft: (patch: Partial<Workflow>) => void;
  setSelectedNodeId: (id: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
}

export const useWorkflowBuilderStore = create<WorkflowBuilderState>()(
  devtools(
    (set) => ({
      draft: null,
      isDirty: false,
      selectedNodeId: null,

      initDraft: (wf) => set({ draft: wf, isDirty: false }),
      clearDraft: () => set({ draft: null, isDirty: false, selectedNodeId: null }),
      updateDraft: (patch) =>
        set((s) => ({
          draft: s.draft ? { ...s.draft, ...patch, updatedAt: new Date().toISOString() } : null,
          isDirty: true,
        })),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),
    }),
    { name: 'pulseflow-builder' }
  )
);

// ─────────────────────────────────────────────
// Settings Store (persisted to localStorage)
// ─────────────────────────────────────────────

interface SettingsState {
  settings: PlatformSettings;
  updateSettings: (patch: Partial<PlatformSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  geminiApiKey: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  defaultConfidenceThreshold: 0.85,
  defaultRetryLimit: 3,
  defaultModelTier: 'flash',
  slackWebhookUrl: '',
  crmWebhookUrl: '',
  hitlExpirationHours: 24,
  notifyOnHitl: true,
  notifyOnFailure: true,
  maxConcurrentExecutions: 10,
  rateLimitRpm: 60,
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        settings: DEFAULT_SETTINGS,
        updateSettings: (patch) =>
          set((s) => ({ settings: { ...s.settings, ...patch } })),
        resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      }),
      { name: 'pulseflow-settings' }
    ),
    { name: 'pulseflow-settings' }
  )
);

// ─────────────────────────────────────────────
// Execution Monitor Store
// ─────────────────────────────────────────────

interface ExecutionMonitorState {
  liveExecutions: Execution[];
  addLiveExecution: (e: Execution) => void;
  updateLiveExecution: (id: string, patch: Partial<Execution>) => void;
  removeLiveExecution: (id: string) => void;
}

export const useExecutionStore = create<ExecutionMonitorState>()(
  devtools(
    (set) => ({
      liveExecutions: [],
      addLiveExecution: (e) =>
        set((s) => ({ liveExecutions: [e, ...s.liveExecutions].slice(0, 20) })),
      updateLiveExecution: (id, patch) =>
        set((s) => ({
          liveExecutions: s.liveExecutions.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          ),
        })),
      removeLiveExecution: (id) =>
        set((s) => ({ liveExecutions: s.liveExecutions.filter((e) => e.id !== id) })),
    }),
    { name: 'pulseflow-executions' }
  )
);
