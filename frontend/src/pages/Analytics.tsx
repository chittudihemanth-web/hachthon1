// src/pages/Analytics.tsx

import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { format } from 'date-fns';
import {
  TrendingUp, TrendingDown, DollarSign, Zap, CheckCircle,
  Activity, BarChart3,
} from 'lucide-react';

import { useAnalytics } from '../hooks/useApi';
import { useDashboardStats } from '../hooks/useApi';
import {
  formatTokens, formatCost, formatPercent, formatNumber, formatDuration,
} from '../lib/utils';

type TimeRange = '24h' | '7d' | '30d';

const CHART_COLORS = {
  brand:  '#3d56f5',
  cyan:   '#00f5ff',
  green:  '#22c55e',
  amber:  '#f59e0b',
  purple: '#a855f7',
  red:    '#ef4444',
};

const CustomTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string; suffix?: string }> =
  ({ active, payload, label, suffix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-xl px-3 py-2 border border-surface-border shadow-card">
        <p className="text-[11px] text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number'
              ? p.value.toLocaleString('en-US', { maximumFractionDigits: 1 })
              : p.value}{suffix}
          </p>
        ))}
      </div>
    );
  };

export const Analytics: React.FC = () => {
  const [range, setRange] = useState<TimeRange>('7d');
  const { data: analytics, isLoading } = useAnalytics(range);
  const { data: stats } = useDashboardStats();

  const reducedExec  = reduceToRange(analytics?.execTrend ?? [], range);
  const reducedToken = reduceToRange(analytics?.tokenTrend ?? [], range);
  const reducedSucc  = reduceToRange(analytics?.successTrend ?? [], range);

  const modelUsageData = [
    { name: 'gemini-2.5-flash', tokens: 5_820_000, cost: 0.44, executions: 12400 },
    { name: 'gemini-2.5-pro',   tokens: 2_600_000, cost: 9.47, executions: 5200  },
  ];

  const workflowHealth = stats?.workflowHealth ?? [];

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-gradient-brand text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Token spend, success rates & performance trends</p>
        </div>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-secondary text-slate-400'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Executions',
            value: formatNumber(stats?.totalExecutions ?? 0),
            delta: +12.4,
            icon: <Activity className="w-5 h-5 text-brand-400" />,
            bg: 'bg-brand-600/20',
          },
          {
            label: 'Avg Success Rate',
            value: formatPercent(stats?.successRate ?? 0),
            delta: +1.2,
            icon: <CheckCircle className="w-5 h-5 text-neon-green" />,
            bg: 'bg-neon-green/10',
          },
          {
            label: 'Total Token Spend',
            value: formatTokens(stats?.totalTokensConsumed ?? 0),
            delta: -3.1,
            icon: <Zap className="w-5 h-5 text-neon-amber" />,
            bg: 'bg-neon-amber/10',
          },
          {
            label: 'Estimated Cost',
            value: formatCost(stats?.estimatedCostUsd ?? 0),
            delta: -5.8,
            icon: <DollarSign className="w-5 h-5 text-neon-cyan" />,
            bg: 'bg-neon-cyan/10',
          },
        ].map(({ label, value, delta, icon, bg }) => (
          <div key={label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">{label}</span>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                {icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-50 mb-1">{value}</p>
            <div className={`flex items-center gap-1 text-xs ${delta > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs prior period
            </div>
          </div>
        ))}
      </div>

      {/* Execution Volume Over Time */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="section-title">Execution Volume</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pipeline runs over {range}</p>
          </div>
          <BarChart3 className="w-4 h-4 text-slate-600" />
        </div>
        {isLoading ? (
          <div className="skeleton h-48 rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={reducedExec}>
              <defs>
                <linearGradient id="execGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.brand} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d40" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix=" runs" />} />
              <Area type="monotone" dataKey="value" name="Executions"
                    stroke={CHART_COLORS.brand} strokeWidth={2} fill="url(#execGrad2)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Token Spend + Success Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Spend */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Token Spend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tokens consumed per period</p>
            </div>
            <Zap className="w-4 h-4 text-neon-amber" />
          </div>
          {isLoading ? (
            <div className="skeleton h-40 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={reducedToken}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d40" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                       tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip suffix=" tokens" />} />
                <Bar dataKey="value" name="Tokens" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Success Rate Trend */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Success Rate Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">% successful executions over time</p>
            </div>
            <CheckCircle className="w-4 h-4 text-neon-green" />
          </div>
          {isLoading ? (
            <div className="skeleton h-40 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={reducedSucc}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d40" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                       tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Line type="monotone" dataKey="value" name="Success Rate"
                      stroke={CHART_COLORS.green} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Model Usage Breakdown */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-4">Model Usage Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Executions</th>
                <th>Tokens Consumed</th>
                <th>Est. Cost (USD)</th>
                <th>Cost/Execution</th>
                <th>Usage Share</th>
              </tr>
            </thead>
            <tbody>
              {modelUsageData.map(row => {
                const total = modelUsageData.reduce((s, r) => s + r.executions, 0);
                const share = (row.executions / total) * 100;
                return (
                  <tr key={row.name}>
                    <td>
                      <span className="badge-info badge font-mono text-[11px]">{row.name}</span>
                    </td>
                    <td className="font-mono text-slate-300">{formatNumber(row.executions)}</td>
                    <td className="font-mono text-neon-amber">{formatTokens(row.tokens)}</td>
                    <td className="font-mono text-neon-green">{formatCost(row.cost)}</td>
                    <td className="font-mono text-slate-400">${(row.cost / row.executions * 1000).toFixed(3)}/k</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden max-w-[80px]">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Performance Table */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-4">Workflow Performance Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Total Runs</th>
                <th>Success Rate</th>
                <th>Failures</th>
                <th>Avg Duration</th>
                <th>Token Spend</th>
                <th>Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {workflowHealth.map(wh => (
                <tr key={wh.workflowId}>
                  <td className="text-slate-300 font-medium">{wh.workflowName}</td>
                  <td className="font-mono text-slate-400">{formatNumber(wh.totalExecutions)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden max-w-[60px]">
                        <div
                          className={`h-full rounded-full ${
                            wh.successRate >= 95 ? 'bg-neon-green' :
                            wh.successRate >= 80 ? 'bg-neon-amber' : 'bg-neon-red'
                          }`}
                          style={{ width: `${wh.successRate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold font-mono ${
                        wh.successRate >= 95 ? 'text-neon-green' :
                        wh.successRate >= 80 ? 'text-neon-amber' : 'text-neon-red'
                      }`}>{formatPercent(wh.successRate)}</span>
                    </div>
                  </td>
                  <td className="font-mono text-neon-red">{formatNumber(wh.failureCount)}</td>
                  <td className="font-mono text-slate-400">{formatDuration(wh.avgDurationMs)}</td>
                  <td className="font-mono text-neon-amber">{formatTokens(wh.totalTokensConsumed)}</td>
                  <td className="font-mono text-neon-green">{formatCost(wh.estimatedCostUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ───────────────────────────────────────────────────

function reduceToRange(
  points: Array<{ timestamp: string; value: number }>,
  range: TimeRange
): Array<{ label: string; value: number }> {
  const buckets = range === '24h' ? 24 : range === '7d' ? 7 : 30;
  const step    = range === '24h' ? 1 : range === '7d' ? 24 : 24;

  const result: Array<{ label: string; value: number }> = [];
  for (let i = 0; i < buckets; i++) {
    const slice = points.slice(i * step, (i + 1) * step);
    const avg   = slice.length > 0
      ? slice.reduce((s, p) => s + p.value, 0) / slice.length
      : 0;
    const ts    = slice[0]?.timestamp ?? new Date().toISOString();
    result.push({
      label: range === '24h'
        ? format(new Date(ts), 'HH:mm')
        : format(new Date(ts), 'MMM d'),
      value: Math.round(avg),
    });
  }
  return result;
}
