// src/pages/WorkflowDetail.tsx — Visual Workflow Builder

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Play, Plus,
  Zap, Brain, GitBranch, UserCheck, Radio,
  AlertCircle, CheckCircle, X,
} from 'lucide-react';

import { useWorkflow, useUpdateWorkflow, useTriggerExecution } from '../hooks/useApi';
import { useWorkflowBuilderStore } from '../store';
import { StatusBadge } from '../components/ui/Badge';
import { JsonViewer } from '../components/ui/JsonViewer';
import { formatNumber, formatPercent } from '../lib/utils';
import type { WorkflowNodeConfig, NodeType } from '../types';

// ─── Node Type Config ──────────────────────────────────────────

const NODE_CONFIGS: Record<NodeType, {
  label: string; icon: React.ReactNode; color: string; borderColor: string;
  description: string;
}> = {
  trigger:    { label: 'Trigger',     icon: <Zap className="w-4 h-4" />,        color: 'text-neon-cyan',   borderColor: 'border-neon-cyan/50',   description: 'Pipeline entry point — defines how automation is initiated' },
  extractor:  { label: 'Extractor',   icon: <Brain className="w-4 h-4" />,       color: 'text-brand-300',   borderColor: 'border-brand-500/50',   description: 'AI-powered structured data extraction from raw payloads' },
  classifier: { label: 'Classifier',  icon: <Radio className="w-4 h-4" />,       color: 'text-neon-purple', borderColor: 'border-neon-purple/50', description: 'Multi-label semantic classification with confidence scoring' },
  router:     { label: 'Router',      icon: <GitBranch className="w-4 h-4" />,   color: 'text-neon-amber',  borderColor: 'border-neon-amber/50',  description: 'Multi-criteria conditional branching node' },
  hitl:       { label: 'HITL Review', icon: <UserCheck className="w-4 h-4" />,   color: 'text-neon-pink',   borderColor: 'border-neon-pink/50',   description: 'Human-in-the-loop approval gate with configurable expiration' },
  dispatcher: { label: 'Dispatcher',  icon: <CheckCircle className="w-4 h-4" />, color: 'text-neon-green',  borderColor: 'border-neon-green/50',  description: 'External integration dispatch — Slack, CRM, webhooks, email' },
};

// ─── Node Palette Draggable Item ───────────────────────────────

const NodePaletteItem: React.FC<{ type: NodeType }> = ({ type }) => {
  const cfg = NODE_CONFIGS[type];
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.borderColor} bg-surface-2/50
                  cursor-pointer hover:bg-surface-3 transition-all duration-200 group`}
      draggable
    >
      <div className={`${cfg.color} mt-0.5 flex-shrink-0`}>{cfg.icon}</div>
      <div>
        <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
        <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">{cfg.description}</p>
      </div>
    </div>
  );
};

// ─── Pipeline Node ─────────────────────────────────────────────

const PipelineNode: React.FC<{
  node: WorkflowNodeConfig;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}> = ({ node, selected, onClick, onDelete }) => {
  const cfg = NODE_CONFIGS[node.type];

  return (
    <div
      className={`workflow-node ${node.type} ${selected ? 'selected' : ''} min-w-[220px] group`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-2 ${cfg.color}`}>
          {cfg.icon}
          <span className="text-xs font-semibold uppercase tracking-wider">{cfg.label}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-neon-red
                     transition-all duration-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm font-medium text-slate-100">{node.label}</p>
      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{node.description}</p>
    </div>
  );
};

// ─── Connector ─────────────────────────────────────────────────

const Connector: React.FC<{ label?: string }> = ({ label }) => (
  <div className="connector flex-col py-1">
    <div className="connector-line" />
    {label && (
      <span className="text-[10px] text-slate-600 bg-surface-2 border border-surface-border
                       rounded-md px-2 py-0.5 my-1 self-center max-w-[140px] text-center">
        {label}
      </span>
    )}
    <div className="connector-line" />
    <div className="w-2 h-2 rounded-full bg-brand-500/60 self-center" />
  </div>
);

// ─── Node Config Panel ─────────────────────────────────────────

const NodeConfigPanel: React.FC<{
  node: WorkflowNodeConfig;
  onClose: () => void;
  onUpdate: (patch: Partial<WorkflowNodeConfig>) => void;
}> = ({ node, onClose, onUpdate }) => {
  const cfg = NODE_CONFIGS[node.type];

  return (
    <div className="w-72 glass border-l border-surface-border flex flex-col h-full animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <span className={cfg.color}>{cfg.icon}</span>
          <span className="text-sm font-semibold text-slate-200">Configure Node</span>
        </div>
        <button onClick={onClose} className="btn-ghost btn p-1 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <div>
          <label className="label">Node Label</label>
          <input
            className="input"
            value={node.label}
            onChange={e => onUpdate({ label: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="textarea"
            rows={3}
            value={node.description}
            onChange={e => onUpdate({ description: e.target.value })}
          />
        </div>

        {/* Type-specific config */}
        {node.type === 'extractor' && (
          <>
            <div>
              <label className="label">AI Model</label>
              <select className="select" defaultValue={(node.config?.model as string) ?? 'gemini-2.5-flash'}>
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Deep)</option>
              </select>
            </div>
            <div>
              <label className="label">Output Schema</label>
              <input className="input" placeholder="e.g. InvoiceSchema" defaultValue={(node.config?.schema as string) ?? ''} />
            </div>
          </>
        )}

        {node.type === 'classifier' && (
          <div>
            <label className="label">Confidence Threshold</label>
            <input
              type="range" min="0.5" max="1.0" step="0.01"
              defaultValue={(node.config?.threshold as number) ?? 0.85}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>0.50</span>
              <span className="text-brand-400 font-medium">
                {((node.config?.threshold as number) ?? 0.85).toFixed(2)}
              </span>
              <span>1.00</span>
            </div>
          </div>
        )}

        {node.type === 'hitl' && (
          <div>
            <label className="label">Review Expiration (hours)</label>
            <input
              className="input" type="number" min="1" max="168"
              defaultValue={(node.config?.expirationHours as number) ?? 24}
            />
          </div>
        )}

        {node.type === 'dispatcher' && (
          <div>
            <label className="label">Dispatch Target</label>
            <select className="select" defaultValue={(node.config?.target as string) ?? 'slack'}>
              <option value="slack">Slack Notification</option>
              <option value="crm_update">CRM Record Update</option>
              <option value="webhook_relay">Webhook Relay</option>
              <option value="email_draft">Email Draft</option>
              <option value="database_write">Database Write</option>
            </select>
          </div>
        )}

        {node.type === 'trigger' && (
          <div>
            <label className="label">Trigger Type</label>
            <select className="select">
              <option value="webhook">Inbound Webhook (HTTP POST)</option>
              <option value="manual">Manual Ingestion</option>
              <option value="document">Document Upload (PDF/PNG/TIFF)</option>
              <option value="scheduled">Scheduled Polling</option>
              <option value="email">Email Inbound</option>
              <option value="crm_event">CRM Event</option>
            </select>
          </div>
        )}

        <div>
          <label className="label">Raw Config (JSON)</label>
          <JsonViewer data={node.config} maxHeight="120px" />
        </div>
      </div>
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────

export const WorkflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data: workflow, isLoading } = useWorkflow(id ?? '', );
  const updateWorkflow = useUpdateWorkflow();
  const triggerExecution = useTriggerExecution();
  const { draft, isDirty, initDraft, updateDraft, selectedNodeId, setSelectedNodeId } =
    useWorkflowBuilderStore();

  useEffect(() => {
    if (workflow) initDraft(workflow);
  }, [workflow]);

  const handleSave = () => {
    if (!draft) return;
    updateWorkflow.mutate({ id: draft.id, patch: draft });
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!draft) return;
    updateDraft({ nodes: draft.nodes.filter(n => n.id !== nodeId) });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const selectedNode = draft?.nodes.find(n => n.id === selectedNodeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading workflow...</p>
        </div>
      </div>
    );
  }

  const wf = draft ?? workflow;
  if (!wf && !isNew) {
    return (
      <div className="glass-card p-16 text-center">
        <AlertCircle className="w-10 h-10 text-neon-red mx-auto mb-3" />
        <p className="text-slate-300">Workflow not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-128px)] -m-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-surface-1/90 backdrop-blur-xl
                      border-b border-surface-border flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/workflows')} className="btn-ghost btn btn-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">{wf?.name ?? 'New Workflow'}</h3>
              {wf && <StatusBadge status={wf.status} />}
              {isDirty && <span className="text-[10px] text-neon-amber">● Unsaved</span>}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {wf?.nodes.length ?? 0} nodes · {wf?.edges.length ?? 0} connections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wf && (
            <>
              <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 mr-4">
                <span>{formatNumber(wf.executionCount)} runs</span>
                <span className="text-neon-green">{formatPercent(wf.successRate)} success</span>
                <span>Threshold: {(wf.confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <button
                onClick={() => triggerExecution.mutate(wf.id)}
                className="btn-success btn btn-sm"
                disabled={wf.status !== 'active' || triggerExecution.isPending}
              >
                <Play className="w-3.5 h-3.5" />
                {triggerExecution.isPending ? 'Running...' : 'Run Now'}
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            className="btn-primary btn"
            disabled={!isDirty || updateWorkflow.isPending}
          >
            <Save className="w-4 h-4" />
            {updateWorkflow.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <div className="w-64 glass border-r border-surface-border flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-3 border-b border-surface-border">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Node Library</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Drag nodes to canvas</p>
          </div>
          <div className="p-3 space-y-2">
            {(Object.keys(NODE_CONFIGS) as NodeType[]).map(type => (
              <NodePaletteItem key={type} type={type} />
            ))}
          </div>

          {/* Workflow Settings */}
          {wf && (
            <div className="mt-auto border-t border-surface-border p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settings</p>
              <div>
                <label className="label">Confidence Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min="0.5" max="1.0" step="0.01"
                    value={wf.confidenceThreshold}
                    onChange={e => updateDraft({ confidenceThreshold: parseFloat(e.target.value) })}
                    className="flex-1 accent-brand-500"
                  />
                  <span className="text-xs font-mono text-brand-300 w-10 text-right">
                    {(wf.confidenceThreshold * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="label">Model Tier</label>
                <select
                  className="select input-sm"
                  value={wf.modelTier}
                  onChange={e => updateDraft({ modelTier: e.target.value as 'flash' | 'pro' })}
                >
                  <option value="flash">Flash (Fast)</option>
                  <option value="pro">Pro (Deep)</option>
                </select>
              </div>
              <div>
                <label className="label">Retry Limit</label>
                <input
                  type="number" min="0" max="5"
                  className="input input-sm"
                  value={wf.retryLimit}
                  onChange={e => updateDraft({ retryLimit: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-surface/60 grid-pattern relative">
          <div className="min-h-full p-12 flex flex-col items-center gap-0">
            {(wf?.nodes ?? []).map((node, idx) => {
              const nextEdge = wf?.edges.find(e => e.from === node.id);
              const branches = wf?.edges.filter(e => e.from === node.id) ?? [];

              return (
                <React.Fragment key={node.id}>
                  <PipelineNode
                    node={node}
                    selected={selectedNodeId === node.id}
                    onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                    onDelete={() => handleDeleteNode(node.id)}
                  />
                  {idx < (wf?.nodes.length ?? 0) - 1 && (
                    <div className="flex flex-col items-center">
                      {branches.length <= 1 ? (
                        <Connector label={nextEdge?.label} />
                      ) : (
                        <div className="flex items-start gap-8 mt-2">
                          {branches.map((edge, bi) => (
                            <div key={edge.id} className="flex flex-col items-center gap-1">
                              <div className="connector-line" />
                              <span className="text-[10px] text-slate-600 bg-surface-2 border border-surface-border
                                               rounded-md px-2 py-0.5 text-center max-w-[120px]">
                                {edge.label ?? `branch ${bi + 1}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Add Node CTA */}
            <button
              className="mt-4 btn-secondary btn border-dashed border-2 border-surface-border
                         hover:border-brand-600/60 text-slate-500 hover:text-slate-300 px-8 py-4"
              onClick={() => {
                // Add placeholder node
                updateDraft({
                  nodes: [...(wf?.nodes ?? []), {
                    id: `n${Date.now()}`,
                    type: 'dispatcher',
                    label: 'New Node',
                    description: 'Configure this node',
                    config: {},
                    position: { x: 0, y: (wf?.nodes.length ?? 0) },
                  }],
                });
              }}
            >
              <Plus className="w-4 h-4" /> Add Node
            </button>
          </div>

          {/* Canvas Legend */}
          <div className="absolute bottom-4 left-4 glass rounded-xl p-3 text-[10px] text-slate-600">
            <p className="text-slate-500 font-medium mb-1.5">Node Types</p>
            <div className="space-y-1">
              {(Object.entries(NODE_CONFIGS) as [NodeType, typeof NODE_CONFIGS[NodeType]][]).map(([type, cfg]) => (
                <div key={type} className={`flex items-center gap-1.5 ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Node Config Panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onUpdate={(patch) => {
              updateDraft({
                nodes: draft!.nodes.map(n =>
                  n.id === selectedNode.id ? { ...n, ...patch } : n
                ),
              });
            }}
          />
        )}
      </div>
    </div>
  );
};
