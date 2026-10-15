// src/pages/Workflows.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Play, Trash2, Eye,
  Workflow as WorkflowIcon, Clock,
  Zap, MoreHorizontal, Tag, ChevronRight,
} from 'lucide-react';

import { useWorkflows, useTriggerExecution, useDeleteWorkflow } from '../hooks/useApi';
import { StatusBadge } from '../components/ui/Badge';
import {
  formatRelative, formatNumber, formatPercent,
} from '../lib/utils';
import type { Workflow, WorkflowStatus } from '../types';

const TRIGGER_ICON: Record<string, React.ReactNode> = {
  webhook:   <Zap className="w-3.5 h-3.5" />,
  email:     <span className="text-[11px]">✉</span>,
  document:  <span className="text-[11px]">📄</span>,
  scheduled: <Clock className="w-3.5 h-3.5" />,
  manual:    <Play className="w-3.5 h-3.5" />,
  crm_event: <span className="text-[11px]">🔗</span>,
};

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger:    'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan',
  extractor:  'bg-brand-600/20 border-brand-600/40 text-brand-300',
  classifier: 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple',
  router:     'bg-neon-amber/20 border-neon-amber/40 text-neon-amber',
  hitl:       'bg-neon-pink/20 border-neon-pink/40 text-neon-pink',
  dispatcher: 'bg-neon-green/20 border-neon-green/40 text-neon-green',
};

export const Workflows: React.FC = () => {
  const navigate = useNavigate();
  const { data: workflows, isLoading } = useWorkflows();
  const triggerExecution = useTriggerExecution();
  const deleteWorkflow = useDeleteWorkflow();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');

  const filtered = (workflows ?? []).filter(wf => {
    const matchSearch = search === '' ||
      wf.name.toLowerCase().includes(search.toLowerCase()) ||
      wf.description.toLowerCase().includes(search.toLowerCase()) ||
      wf.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || wf.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = (workflows ?? []).reduce((acc, wf) => {
    acc[wf.status] = (acc[wf.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-gradient-brand text-3xl font-bold tracking-tight">Workflows</h2>
          <p className="text-slate-500 text-sm mt-1">Design and manage your automation pipelines</p>
        </div>
        <button
          onClick={() => navigate('/workflows/new')}
          className="btn-primary btn btn-lg flex-shrink-0"
        >
          <Plus className="w-5 h-5" /> New Workflow
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'paused', 'draft', 'archived'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`btn btn-sm capitalize transition-all ${
              statusFilter === status
                ? 'btn-primary'
                : 'btn-secondary text-slate-400'
            }`}
          >
            {status === 'all' ? 'All' : status}
            <span className="ml-1 text-[10px] opacity-70">
              ({status === 'all' ? (workflows?.length ?? 0) : (statusCounts[status] ?? 0)})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="input pl-11"
          placeholder="Search by name, description, or tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Workflow Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
              <div className="flex gap-2">
                <div className="skeleton h-6 w-16 rounded-full" />
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center gap-4 text-center">
          <WorkflowIcon className="w-12 h-12 text-slate-600" />
          <div>
            <p className="text-slate-300 font-medium">No workflows found</p>
            <p className="text-slate-500 text-sm mt-1">
              {search ? 'Try adjusting your search filters' : 'Create your first automation pipeline'}
            </p>
          </div>
          <button onClick={() => navigate('/workflows/new')} className="btn-primary btn">
            <Plus className="w-4 h-4" /> Create Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(wf => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onRun={() => triggerExecution.mutate(wf.id)}
              onDelete={() => deleteWorkflow.mutate(wf.id)}
              onView={() => navigate(`/workflows/${wf.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Workflow Card ─────────────────────────────────────────────

interface WorkflowCardProps {
  workflow: Workflow;
  onRun: () => void;
  onDelete: () => void;
  onView: () => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow: wf, onRun, onDelete, onView }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const successColor = wf.successRate >= 95 ? 'text-neon-green' :
                       wf.successRate >= 80 ? 'text-neon-amber' : 'text-neon-red';

  return (
    <div className="glass-card p-5 flex flex-col gap-4 group relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <StatusBadge status={wf.status} />
            <span className="text-[10px] text-slate-600 capitalize flex items-center gap-1">
              {TRIGGER_ICON[wf.triggerType]}
              {wf.triggerType.replace('_', ' ')}
            </span>
          </div>
          <h3 className="font-semibold text-slate-100 text-sm leading-tight group-hover:text-brand-300
                         transition-colors duration-200 cursor-pointer" onClick={onView}>
            {wf.name}
          </h3>
        </div>

        {/* Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="btn-ghost btn p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 glass rounded-xl border border-surface-border
                            shadow-card-hover z-10 overflow-hidden animate-scale-in">
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-3 flex items-center gap-2"
                onClick={() => { onView(); setMenuOpen(false); }}
              >
                <Eye className="w-4 h-4" /> View Details
              </button>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-3 flex items-center gap-2"
                onClick={() => { onRun(); setMenuOpen(false); }}
                disabled={wf.status !== 'active'}
              >
                <Play className="w-4 h-4" /> Run Now
              </button>
              <div className="h-px bg-surface-border mx-2" />
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-neon-red/80 hover:bg-neon-red/10 flex items-center gap-2"
                onClick={() => { onDelete(); setMenuOpen(false); }}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{wf.description}</p>

      {/* Node Pipeline Preview */}
      <div className="flex items-center gap-1 flex-wrap">
        {wf.nodes.slice(0, 4).map((node, i) => (
          <React.Fragment key={node.id}>
            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium
                              ${NODE_TYPE_COLORS[node.type] ?? 'bg-surface-3 text-slate-400'}`}>
              {node.type}
            </span>
            {i < Math.min(wf.nodes.length - 1, 3) && (
              <ChevronRight className="w-3 h-3 text-slate-700" />
            )}
          </React.Fragment>
        ))}
        {wf.nodes.length > 4 && (
          <span className="text-[10px] text-slate-600">+{wf.nodes.length - 4} more</span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-surface-border">
        <div>
          <p className="text-[10px] text-slate-600 mb-0.5">Executions</p>
          <p className="text-sm font-semibold text-slate-200">{formatNumber(wf.executionCount)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600 mb-0.5">Success Rate</p>
          <p className={`text-sm font-semibold ${successColor}`}>{formatPercent(wf.successRate)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600 mb-0.5">Last Run</p>
          <p className="text-[11px] text-slate-400">{wf.lastExecutedAt ? formatRelative(wf.lastExecutedAt) : 'Never'}</p>
        </div>
      </div>

      {/* Tags */}
      {wf.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {wf.tags.map(tag => (
            <span key={tag} className="badge-neutral badge text-[10px]">
              <Tag className="w-2.5 h-2.5" />{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onView}
          className="btn-secondary btn btn-sm flex-1"
        >
          <Eye className="w-3.5 h-3.5" /> Details
        </button>
        <button
          onClick={onRun}
          className="btn-primary btn btn-sm flex-1"
          disabled={wf.status !== 'active'}
        >
          <Play className="w-3.5 h-3.5" /> Run
        </button>
      </div>
    </div>
  );
};
