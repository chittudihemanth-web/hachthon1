// src/pages/Executions.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, flexRender,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import {
  Search, RefreshCw, ChevronUp, ChevronDown,
  ChevronsLeft, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronsRight,
  Play, AlertCircle, Clock, Activity,
} from 'lucide-react';

import { useExecutions } from '../hooks/useApi';
import { StatusBadge } from '../components/ui/Badge';
import {
  formatRelative, formatDuration, formatTokens, truncate,
} from '../lib/utils';
import type { Execution, ExecutionStatus } from '../types';

const STATUS_FILTERS: Array<{ value: ExecutionStatus | 'all'; label: string }> = [
  { value: 'all',            label: 'All'           },
  { value: 'success',        label: 'Success'       },
  { value: 'failed',         label: 'Failed'        },
  { value: 'running',        label: 'Running'       },
  { value: 'pending_review', label: 'HITL Review'   },
  { value: 'retrying',       label: 'Retrying'      },
];

export const Executions: React.FC = () => {
  const navigate = useNavigate();
  const { data: executions, isLoading, refetch, isFetching } = useExecutions();

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');
  const [sorting, setSorting]           = useState<SortingState>([{ id: 'startedAt', desc: true }]);

  const filtered = useMemo(() => {
    return (executions ?? []).filter(e => {
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchSearch = search === '' ||
        e.id.toLowerCase().includes(search.toLowerCase()) ||
        e.workflowName.toLowerCase().includes(search.toLowerCase()) ||
        e.triggeredBy.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [executions, statusFilter, search]);

  const columns = useMemo<ColumnDef<Execution>[]>(() => [
    {
      id: 'id',
      header: 'Execution ID',
      accessorKey: 'id',
      cell: ({ row }) => (
        <button
          className="font-mono text-xs text-brand-300 hover:text-brand-200 hover:underline"
          onClick={() => navigate(`/executions/${row.original.id}`)}
        >
          {row.original.id}
        </button>
      ),
    },
    {
      id: 'workflowName',
      header: 'Workflow',
      accessorKey: 'workflowName',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-300">{truncate(getValue<string>(), 32)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
    },
    {
      id: 'triggerType',
      header: 'Trigger',
      accessorKey: 'triggerType',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-500 capitalize">{getValue<string>().replace('_', ' ')}</span>
      ),
    },
    {
      id: 'durationMs',
      header: 'Duration',
      accessorKey: 'durationMs',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono text-slate-400">{formatDuration(getValue<number>())}</span>
      ),
    },
    {
      id: 'tokens',
      header: 'Tokens',
      accessorKey: 'totalTokensIn',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-500">
          {formatTokens(row.original.totalTokensIn + row.original.totalTokensOut)}
        </span>
      ),
    },
    {
      id: 'retryCount',
      header: 'Retries',
      accessorKey: 'retryCount',
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return (
          <span className={`text-xs font-mono ${v > 0 ? 'text-neon-amber' : 'text-slate-600'}`}>
            {v}
          </span>
        );
      },
    },
    {
      id: 'triggeredBy',
      header: 'Triggered By',
      accessorKey: 'triggeredBy',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-500">{truncate(getValue<string>(), 24)}</span>
      ),
    },
    {
      id: 'startedAt',
      header: 'Started',
      accessorKey: 'startedAt',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-500">{formatRelative(getValue<string>())}</span>
      ),
      sortingFn: 'datetime',
    },
  ], [navigate]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel:       getCoreRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  // Summary counts
  const counts = useMemo(() => {
    const all = executions ?? [];
    return {
      total:   all.length,
      running: all.filter(e => e.status === 'running').length,
      failed:  all.filter(e => e.status === 'failed').length,
      hitl:    all.filter(e => e.status === 'pending_review').length,
    };
  }, [executions]);

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-gradient-brand text-3xl font-bold tracking-tight">Executions</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time audit log of all pipeline runs</p>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, icon: <Activity className="w-4 h-4 text-brand-400" />, color: 'text-slate-100' },
          { label: 'Running', value: counts.running, icon: <Play className="w-4 h-4 text-neon-cyan" />, color: 'text-neon-cyan' },
          { label: 'Failed', value: counts.failed, icon: <AlertCircle className="w-4 h-4 text-neon-red" />, color: 'text-neon-red' },
          { label: 'HITL Pending', value: counts.hitl, icon: <Clock className="w-4 h-4 text-neon-purple" />, color: 'text-neon-purple' },
        ].map(({ label, value, icon, color }) => (
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="input pl-11"
            placeholder="Search by ID, workflow name, or trigger..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.value}
              onClick={() => setStatusFilter(sf.value)}
              className={`btn btn-sm capitalize ${
                statusFilter === sf.value ? 'btn-primary' : 'btn-secondary text-slate-400'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ChevronUp className="w-3 h-3" />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown className="w-3 h-3" />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {columns.map((_, j) => (
                        <td key={j}><div className="skeleton h-4 rounded" /></td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/executions/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} onClick={e => e.stopPropagation()}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
              }
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-slate-500">
                    No executions found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
          <div className="text-xs text-slate-500">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filtered.length
            )} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            {[
              { icon: <ChevronsLeft className="w-3.5 h-3.5" />, action: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage() },
              { icon: <ChevronLeft className="w-3.5 h-3.5" />, action: () => table.previousPage(), disabled: !table.getCanPreviousPage() },
              { icon: <ChevronRightIcon className="w-3.5 h-3.5" />, action: () => table.nextPage(), disabled: !table.getCanNextPage() },
              { icon: <ChevronsRight className="w-3.5 h-3.5" />, action: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage() },
            ].map(({ icon, action, disabled }, i) => (
              <button
                key={i}
                onClick={action}
                disabled={disabled}
                className="btn-secondary btn p-1.5 rounded-lg disabled:opacity-30"
              >
                {icon}
              </button>
            ))}
            <span className="text-xs text-slate-500 ml-2">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
