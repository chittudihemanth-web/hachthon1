// src/pages/HitlReview.tsx — Human-in-the-Loop Approval Inbox

import React, { useState } from 'react';
import {
  Clock, CheckCircle, XCircle,
  RefreshCw, ChevronDown, ChevronUp, Edit3,
  Shield, Tag, Brain,
} from 'lucide-react';

import { useHitlItems, useReviewHitl } from '../hooks/useApi';
import { StatusBadge } from '../components/ui/Badge';
import { PayloadDiff } from '../components/ui/JsonViewer';
import { formatRelative, formatDate, confidenceColor } from '../lib/utils';
import type { HitlReviewItem, HitlStatus } from '../types';

// ─── Confidence Meter ──────────────────────────────────────────

const ConfidenceMeter: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = score >= 0.9 ? 'bg-neon-green' :
                score >= 0.75 ? 'bg-neon-amber' : 'bg-neon-red';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">AI Confidence</span>
        <span className={confidenceColor(score) + ' font-semibold font-mono'}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Priority Badge ────────────────────────────────────────────

const PRIORITY_STYLES = {
  critical: 'bg-neon-red/15 text-neon-red border-neon-red/40',
  high:     'bg-neon-amber/15 text-neon-amber border-neon-amber/40',
  medium:   'bg-brand-600/20 text-brand-300 border-brand-600/40',
  low:      'bg-surface-3 text-slate-400 border-surface-border',
};

// ─── HITL Item Card ────────────────────────────────────────────

const HitlCard: React.FC<{ item: HitlReviewItem }> = ({ item }) => {
  const [expanded, setExpanded]   = useState(item.status === 'pending');
  const [editing, setEditing]     = useState(false);
  const [editedPayload, setEditedPayload] = useState<string>(
    JSON.stringify(item.proposedPayload, null, 2)
  );
  const [editError, setEditError] = useState('');
  const reviewHitl = useReviewHitl();

  const handleApprove = () => {
    let payload = item.proposedPayload;
    if (editing) {
      try {
        payload = JSON.parse(editedPayload);
      } catch {
        setEditError('Invalid JSON — fix before approving');
        return;
      }
    }
    reviewHitl.mutate({ id: item.id, action: 'approve', editedPayload: editing ? payload : undefined });
  };

  const handleReject = () => {
    reviewHitl.mutate({ id: item.id, action: 'reject' });
  };

  const timeLeft = () => {
    const diff = new Date(item.expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m left`;
  };

  const isPending = item.status === 'pending';

  return (
    <div className={`glass-card overflow-hidden border-l-4 ${
      item.status === 'approved' ? 'border-l-neon-green' :
      item.status === 'rejected' ? 'border-l-neon-red'   :
      item.priority === 'critical' ? 'border-l-neon-red' :
      item.priority === 'high' ? 'border-l-neon-amber'   :
      'border-l-brand-600'
    }`}>
      {/* Card Header */}
      <div
        className="px-6 py-4 cursor-pointer hover:bg-surface-3/30 transition-colors duration-200"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`badge border text-[11px] ${PRIORITY_STYLES[item.priority]}`}>
                {item.priority.toUpperCase()}
              </span>
              <StatusBadge status={item.status} />
              <span className="text-xs text-slate-600 font-mono">{item.id}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100">{item.workflowName}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Execution: <span className="font-mono text-brand-300">{item.executionId}</span>
            </p>
          </div>

          <div className="flex-shrink-0 text-right space-y-1">
            <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {isPending ? timeLeft() : `Reviewed ${formatRelative(item.reviewedAt ?? item.createdAt)}`}
            </div>
            <p className="text-[11px] text-slate-600">Created {formatRelative(item.createdAt)}</p>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-slate-600 ml-auto" />
              : <ChevronDown className="w-4 h-4 text-slate-600 ml-auto" />
            }
          </div>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.tags.map(tag => (
              <span key={tag} className="badge-neutral badge text-[10px]">
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-surface-border">
          {/* Confidence + Reasoning */}
          <div className="px-6 py-4 bg-surface-2/50 space-y-4">
            <ConfidenceMeter score={item.confidence} />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  AI Reasoning
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed bg-surface-2 rounded-xl p-3 border border-surface-border">
                {item.reasoning}
              </p>
            </div>
          </div>

          {/* Payload Diff Inspector */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-semibold text-slate-200">Payload Diff Inspector</span>
              </div>
              {isPending && (
                <button
                  onClick={() => setEditing(!editing)}
                  className={`btn btn-sm ${editing ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {editing ? 'Preview Mode' : 'Edit Payload'}
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-slate-500">Editing proposed payload — valid JSON required</span>
                </div>
                <textarea
                  className="textarea font-mono text-xs h-48"
                  value={editedPayload}
                  onChange={e => { setEditedPayload(e.target.value); setEditError(''); }}
                />
                {editError && (
                  <p className="text-xs text-neon-red flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />{editError}
                  </p>
                )}
              </div>
            ) : (
              <PayloadDiff
                original={item.extractedPayload}
                proposed={item.proposedPayload}
                edited={item.editedPayload}
              />
            )}
          </div>

          {/* Reviewer Info (if reviewed) */}
          {!isPending && item.reviewedBy && (
            <div className="px-6 py-3 bg-surface-2/50 border-t border-surface-border">
              <p className="text-xs text-slate-500">
                {item.status === 'approved' ? '✅ Approved' : '❌ Rejected'} by{' '}
                <span className="text-slate-300">{item.reviewedBy}</span>
                {' '}· {formatDate(item.reviewedAt ?? '')}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-3 px-6 py-4 border-t border-surface-border bg-surface-2/30">
              <button
                onClick={handleReject}
                disabled={reviewHitl.isPending}
                className="btn-danger btn flex-1"
              >
                <XCircle className="w-4 h-4" />
                Reject Execution
              </button>
              <button
                onClick={handleApprove}
                disabled={reviewHitl.isPending}
                className="btn-success btn flex-1"
              >
                <CheckCircle className="w-4 h-4" />
                {reviewHitl.isPending ? 'Processing...' :
                  editing ? 'Approve with Edits' : 'Approve & Continue'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────

export const HitlReview: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<HitlStatus | 'all'>('pending');
  const { data: items, isLoading, refetch, isFetching } = useHitlItems(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const filters: Array<{ value: HitlStatus | 'all'; label: string }> = [
    { value: 'pending',  label: 'Pending Review' },
    { value: 'approved', label: 'Approved'       },
    { value: 'rejected', label: 'Rejected'       },
    { value: 'all',      label: 'All'            },
  ];

  const pendingCount = (items ?? []).filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-[960px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-gradient-brand text-3xl font-bold tracking-tight">HITL Review</h2>
          <p className="text-slate-500 text-sm mt-1">
            Human-in-the-loop approval queue for low-confidence AI decisions
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className={`btn-secondary btn ${isFetching ? 'opacity-60' : ''}`}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: (items ?? []).filter(i => i.status === 'pending').length, color: 'text-neon-amber', icon: <Clock className="w-4 h-4 text-neon-amber" /> },
          { label: 'Approved',       value: (items ?? []).filter(i => i.status === 'approved').length, color: 'text-neon-green', icon: <CheckCircle className="w-4 h-4 text-neon-green" /> },
          { label: 'Rejected',       value: (items ?? []).filter(i => i.status === 'rejected').length, color: 'text-neon-red', icon: <XCircle className="w-4 h-4 text-neon-red" /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-card px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-600/10 border border-brand-600/30">
        <Shield className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300 leading-relaxed">
          <span className="font-semibold text-brand-300">HITL Guardrail Active</span>
          {' '}— Executions with AI confidence below the configured threshold are automatically
          paused and routed here for human verification before downstream dispatch continues.
          {pendingCount > 0 && (
            <span className="ml-2 font-semibold text-neon-amber">
              {pendingCount} item{pendingCount !== 1 ? 's' : ''} require your attention.
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`btn btn-sm capitalize ${
              statusFilter === f.value ? 'btn-primary' : 'btn-secondary text-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-3">
              <div className="skeleton h-5 w-1/3 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : (items ?? []).length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center gap-4 text-center">
          <CheckCircle className="w-12 h-12 text-neon-green" />
          <div>
            <p className="text-slate-300 font-medium">Review queue is clear</p>
            <p className="text-slate-500 text-sm mt-1">
              No {statusFilter !== 'all' ? statusFilter : ''} items require human review
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(items ?? []).map(item => (
            <HitlCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};
