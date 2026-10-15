// src/pages/ExecutionDetail.tsx

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, XCircle, Clock, Zap, Brain,
  ChevronDown, ChevronUp, AlertTriangle, Cpu, Copy, Check,
  ArrowRight,
} from 'lucide-react';

import { useExecution } from '../hooks/useApi';
import { StatusBadge } from '../components/ui/Badge';
import { JsonViewer } from '../components/ui/JsonViewer';
import {
  formatDate, formatDuration, formatTokens, formatRelative,
  copyToClipboard, estimateCost, confidenceColor,
} from '../lib/utils';
import type { ExecutionStep, NodeType } from '../types';

// ─── Step Node Icon ─────────────────────────────────────────────

const NODE_ICONS: Record<NodeType, React.ReactNode> = {
  trigger:    <Zap       className="w-4 h-4" />,
  extractor:  <Brain     className="w-4 h-4" />,
  classifier: <Cpu       className="w-4 h-4" />,
  router:     <ArrowRight className="w-4 h-4" />,
  hitl:       <AlertTriangle className="w-4 h-4" />,
  dispatcher: <CheckCircle className="w-4 h-4" />,
};

const NODE_COLORS: Record<string, string> = {
  trigger:    'text-neon-cyan   bg-neon-cyan/10   border-neon-cyan/30',
  extractor:  'text-brand-300   bg-brand-600/10   border-brand-600/30',
  classifier: 'text-neon-purple bg-neon-purple/10 border-neon-purple/30',
  router:     'text-neon-amber  bg-neon-amber/10  border-neon-amber/30',
  hitl:       'text-neon-pink   bg-neon-pink/10   border-neon-pink/30',
  dispatcher: 'text-neon-green  bg-neon-green/10  border-neon-green/30',
};

// ─── Step Card ──────────────────────────────────────────────────

const StepCard: React.FC<{ step: ExecutionStep; index: number }> = ({ step, index }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const [copied, setCopied] = useState(false);
  const colorClass = NODE_COLORS[step.nodeType] ?? NODE_COLORS.trigger;
  const cost = step.model
    ? estimateCost(step.tokensIn, step.tokensOut, step.model.includes('pro') ? 'pro' : 'flash')
    : null;

  const handleCopy = async () => {
    await copyToClipboard(step.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative glass rounded-2xl border overflow-hidden ${
      step.status === 'success' ? 'border-surface-border' :
      step.status === 'failed'  ? 'border-neon-red/30'   :
      step.status === 'running' ? 'border-brand-500/50'  :
      'border-surface-border'
    }`}>
      {/* Step Header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-surface-3/30
                   transition-colors duration-200"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Step Number */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-surface-3 border border-surface-border
                        flex items-center justify-center text-[11px] font-bold text-slate-400">
          {index + 1}
        </div>

        {/* Node Icon + Label */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold
                         flex-shrink-0 ${colorClass}`}>
          {NODE_ICONS[step.nodeType]}
          {step.nodeLabel}
        </div>

        {/* Status */}
        <StatusBadge status={step.status} />

        {/* Running Animation */}
        {step.status === 'running' && (
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {/* Metrics */}
        <div className="flex items-center gap-4 ml-auto text-xs text-slate-500">
          <span className="font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />{formatDuration(step.latencyMs)}
          </span>
          {step.tokensIn + step.tokensOut > 0 && (
            <span className="font-mono flex items-center gap-1">
              <Zap className="w-3 h-3 text-neon-amber" />
              {formatTokens(step.tokensIn + step.tokensOut)} tok
            </span>
          )}
          {step.confidence !== undefined && (
            <span className={`font-mono font-semibold ${confidenceColor(step.confidence)}`}>
              {(step.confidence * 100).toFixed(1)}% conf
            </span>
          )}
          {step.model && (
            <span className="badge-info badge text-[10px]">{step.model}</span>
          )}
        </div>

        {/* Expand Toggle */}
        <div className="ml-2 flex-shrink-0 text-slate-600">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-surface-border">
          {/* Timing Bar */}
          <div className="flex items-center gap-6 px-5 py-3 bg-surface-2/50 text-xs text-slate-500">
            <span>Started: <span className="text-slate-300">{formatDate(step.startedAt)}</span></span>
            {step.completedAt && (
              <span>Completed: <span className="text-slate-300">{formatDate(step.completedAt)}</span></span>
            )}
            {cost !== null && (
              <span>Est. cost: <span className="text-neon-amber">${cost.toFixed(6)}</span></span>
            )}
            {step.retryCount > 0 && (
              <span className="text-neon-amber">↺ {step.retryCount} retr{step.retryCount === 1 ? 'y' : 'ies'}</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy Step ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="font-mono">{copied ? 'Copied' : step.id}</span>
            </button>
          </div>

          {/* Error Message */}
          {step.errorMessage && (
            <div className="mx-5 my-3 flex items-start gap-3 px-4 py-3 rounded-xl
                            bg-neon-red/5 border border-neon-red/30">
              <XCircle className="w-4 h-4 text-neon-red flex-shrink-0 mt-0.5" />
              <p className="text-xs text-neon-red/90 font-mono">{step.errorMessage}</p>
            </div>
          )}

          {/* Payload I/O */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            <JsonViewer
              data={step.inputPayload}
              title="Input Payload"
              maxHeight="200px"
            />
            <JsonViewer
              data={step.outputPayload}
              title="Output Payload"
              maxHeight="200px"
            />
          </div>

          {/* Token breakdown */}
          {(step.tokensIn + step.tokensOut) > 0 && (
            <div className="flex items-center gap-6 px-5 pb-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-400" />
                <span>{formatTokens(step.tokensIn)} input tokens</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                <span>{formatTokens(step.tokensOut)} output tokens</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────

export const ExecutionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: exec, isLoading, error } = useExecution(id ?? '');
  const [idCopied, setIdCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading execution trace...</p>
        </div>
      </div>
    );
  }

  if (error || !exec) {
    return (
      <div className="glass-card p-16 text-center">
        <XCircle className="w-10 h-10 text-neon-red mx-auto mb-3" />
        <p className="text-slate-300">Execution not found</p>
      </div>
    );
  }

  const totalTokens = exec.totalTokensIn + exec.totalTokensOut;
  const totalCost = exec.steps.reduce((sum, s) => {
    if (!s.model) return sum;
    return sum + estimateCost(s.tokensIn, s.tokensOut, s.model.includes('pro') ? 'pro' : 'flash');
  }, 0);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <button onClick={() => navigate('/executions')} className="hover:text-slate-300">
            Executions
          </button>
          <span>/</span>
          <span className="text-slate-400 font-mono">{exec.id}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-50">{exec.workflowName}</h2>
              <StatusBadge status={exec.status} />
              {exec.hitlRequired && (
                <span className="badge-pending badge">HITL Required</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                className="flex items-center gap-1.5 font-mono text-xs text-brand-300 hover:text-brand-200"
                onClick={async () => {
                  await copyToClipboard(exec.id);
                  setIdCopied(true);
                  setTimeout(() => setIdCopied(false), 2000);
                }}
              >
                {idCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {exec.id}
              </button>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-500">
                Started {formatRelative(exec.startedAt)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-500 capitalize">
                via {exec.triggeredBy}
              </span>
            </div>
          </div>

          {exec.hitlRequired && exec.hitlStatus === 'pending' && (
            <Link
              to="/hitl"
              className="btn-warning btn flex-shrink-0"
              style={{ backgroundColor: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.4)', color: '#a855f7' }}
            >
              Review in HITL Inbox →
            </Link>
          )}
        </div>
      </div>

      {/* Execution Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Duration',    value: formatDuration(exec.durationMs), icon: <Clock className="w-4 h-4 text-brand-400" /> },
          { label: 'Total Tokens',      value: formatTokens(totalTokens),        icon: <Zap className="w-4 h-4 text-neon-amber" /> },
          { label: 'Estimated Cost',    value: `$${totalCost.toFixed(5)}`,       icon: <Cpu className="w-4 h-4 text-neon-green" /> },
          { label: 'Pipeline Steps',    value: exec.steps.length.toString(),     icon: <CheckCircle className="w-4 h-4 text-neon-cyan" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="glass-card px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-100 font-mono">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {exec.status === 'failed' && exec.errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-neon-red/5 border border-neon-red/30">
          <XCircle className="w-5 h-5 text-neon-red flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-neon-red">Execution Failed</p>
            <p className="text-xs text-neon-red/80 mt-1 font-mono">{exec.errorMessage}</p>
            {exec.retryCount > 0 && (
              <p className="text-xs text-slate-500 mt-1">Retried {exec.retryCount} time(s)</p>
            )}
          </div>
        </div>
      )}

      {/* Input / Output Payloads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Trigger Input Payload</h3>
          <JsonViewer data={exec.inputPayload} maxHeight="180px" />
        </div>
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Final Output Payload</h3>
          <JsonViewer
            data={exec.outputPayload ?? { status: exec.status, error: exec.errorMessage }}
            maxHeight="180px"
          />
        </div>
      </div>

      {/* Step Trace */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Execution Trace</h3>
            <p className="text-xs text-slate-500 mt-0.5">Step-by-step pipeline run log</p>
          </div>
          <span className="badge-info badge">{exec.steps.length} steps</span>
        </div>
        <div className="space-y-3">
          {exec.steps.map((step, idx) => (
            <StepCard key={step.id} step={step} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};
