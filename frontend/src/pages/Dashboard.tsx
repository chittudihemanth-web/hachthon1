// src/pages/Dashboard.tsx

import React from 'react';
import {
  Workflow, Play, CheckCircle, AlertTriangle, Zap,
  DollarSign, Clock, Activity, ArrowRight,
  RefreshCw, UserCheck,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { useDashboardStats } from '../hooks/useApi';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/Badge';
import {
  formatNumber, formatTokens, formatCost, formatDuration,
  formatRelative, truncate,
} from '../lib/utils';

const CHART_COLORS = {
  brand:  '#3d56f5',
  cyan:   '#00f5ff',
  green:  '#22c55e',
  amber:  '#f59e0b',
  purple: '#a855f7',
  red:    '#ef4444',
};

const CustomTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string; prefix?: string; suffix?: string }> =
  ({ active, payload, label, prefix = '', suffix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-xl px-3 py-2 border border-surface-border shadow-card">
        <p className="text-[11px] text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-slate-100">
          {prefix}{typeof payload[0]?.value === 'number' ? payload[0].value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : payload[0]?.value}{suffix}
        </p>
      </div>
    );
  };

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading, refetch, isFetching } = useDashboardStats();
  const navigate = useNavigate();

  const execTrendData = (stats?.executionTrend ?? []).map(p => ({
    time: format(new Date(p.timestamp), 'HH:mm'),
    value: Math.round(p.value),
  }));

  const tokenTrendData = (stats?.tokenSpendTrend ?? []).map(p => ({
    time: format(new Date(p.timestamp), 'HH:mm'),
    value: Math.round(p.value),
  }));

  const pieData = [
    { name: 'Success', value: stats ? stats.successRate : 0,            color: CHART_COLORS.green },
    { name: 'Failed',  value: stats ? 100 - stats.successRate - 2 : 0,  color: CHART_COLORS.red   },
    { name: 'Review',  value: 2,                                         color: CHART_COLORS.amber },
  ];

  const healthData = (stats?.workflowHealth ?? []).map(wh => ({
    name: truncate(wh.workflowName, 18),
    successRate: Math.round(wh.successRate),
    failures: wh.failureCount,
  }));

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gradient-brand text-3xl font-bold tracking-tight">
            Automation Health
          </h2>
          <p className="text-slate-500 text-sm mt-1">Live pipeline metrics & execution insights</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Workflows"
          value={isLoading ? '—' : formatNumber(stats!.activeWorkflows)}
          subtitle={`of ${stats?.totalWorkflows ?? '—'} total`}
          delta={8.2}
          deltaLabel="vs last week"
          icon={<Workflow className="w-5 h-5 text-brand-400" />}
          iconBg="bg-brand-600/20"
          glow="brand"
          loading={isLoading}
        />
        <StatCard
          title="Total Executions"
          value={isLoading ? '—' : formatNumber(stats!.totalExecutions)}
          subtitle="last 30 days"
          delta={12.4}
          deltaLabel="vs prior period"
          icon={<Play className="w-5 h-5 text-neon-cyan" />}
          iconBg="bg-neon-cyan/10"
          glow="cyan"
          loading={isLoading}
        />
        <StatCard
          title="Success Rate"
          value={isLoading ? '—' : `${stats!.successRate.toFixed(1)}%`}
          subtitle={`${stats?.pendingReviews ?? 0} pending HITL review`}
          delta={1.2}
          deltaLabel="improvement"
          icon={<CheckCircle className="w-5 h-5 text-neon-green" />}
          iconBg="bg-neon-green/10"
          glow="green"
          loading={isLoading}
        />
        <StatCard
          title="Token Spend (Est.)"
          value={isLoading ? '—' : formatCost(stats!.estimatedCostUsd)}
          subtitle={`${formatTokens(stats?.totalTokensConsumed ?? 0)} tokens total`}
          delta={-3.1}
          deltaLabel="vs last period"
          icon={<DollarSign className="w-5 h-5 text-neon-amber" />}
          iconBg="bg-neon-amber/10"
          loading={isLoading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Execution Time', value: isLoading ? '—' : formatDuration(stats!.avgExecutionMs), icon: <Clock className="w-4 h-4 text-slate-400" /> },
          { label: 'HITL Pending', value: isLoading ? '—' : (stats?.pendingReviews ?? 0).toString(), icon: <UserCheck className="w-4 h-4 text-neon-purple" /> },
          { label: 'Draft Workflows', value: isLoading ? '—' : '1', icon: <Activity className="w-4 h-4 text-slate-400" /> },
          { label: 'Paused Workflows', value: isLoading ? '—' : '1', icon: <AlertTriangle className="w-4 h-4 text-neon-amber" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="glass-card px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution Volume Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Execution Volume</h3>
              <p className="text-xs text-slate-500 mt-0.5">Executions per hour (last 24h)</p>
            </div>
            <span className="badge-info badge text-[11px]">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={execTrendData}>
              <defs>
                <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.brand} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d40" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix=" runs" />} />
              <Area
                type="monotone" dataKey="value" stroke={CHART_COLORS.brand}
                strokeWidth={2} fill="url(#execGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate Pie */}
        <div className="glass-card p-6">
          <div className="mb-5">
            <h3 className="section-title">Outcome Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">All-time execution results</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData} cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                paddingAngle={3} dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any) => [
                typeof val === 'number' ? `${val.toFixed(1)}%` : String(val), ''
              ]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-slate-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Token Spend + Workflow Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Spend Trend */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Token Spend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tokens consumed per hour</p>
            </div>
            <div className="flex items-center gap-1.5 text-neon-amber">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{formatTokens(stats?.totalTokensConsumed ?? 0)}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={tokenTrendData}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d40" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={5} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip suffix=" tokens" />} />
              <Area type="monotone" dataKey="value" stroke={CHART_COLORS.amber} strokeWidth={2} fill="url(#tokenGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Workflow Health Bar */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Workflow Health</h3>
              <p className="text-xs text-slate-500 mt-0.5">Success rate by pipeline</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={healthData} layout="vertical" barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d40" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip suffix="%" />} />
              <Bar dataKey="successRate" fill={CHART_COLORS.brand} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Executions */}
      <div className="glass-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div>
            <h3 className="section-title">Recent Executions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest pipeline runs</p>
          </div>
          <button
            onClick={() => navigate('/executions')}
            className="btn-ghost btn btn-sm text-brand-400"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Execution ID</th>
                <th>Workflow</th>
                <th>Status</th>
                <th>Trigger</th>
                <th>Duration</th>
                <th>Tokens</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                : stats?.recentExecutions.map(exec => (
                    <tr
                      key={exec.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/executions/${exec.id}`)}
                    >
                      <td>
                        <span className="font-mono text-xs text-brand-300">{exec.id}</span>
                      </td>
                      <td>
                        <span className="text-slate-300 text-sm">{truncate(exec.workflowName, 28)}</span>
                      </td>
                      <td><StatusBadge status={exec.status} /></td>
                      <td>
                        <span className="text-xs text-slate-500 capitalize">{exec.triggerType.replace('_', ' ')}</span>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-slate-400">{formatDuration(exec.durationMs)}</span>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-slate-500">
                          {formatTokens(exec.totalTokensIn + exec.totalTokensOut)}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-500">{formatRelative(exec.startedAt)}</span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
