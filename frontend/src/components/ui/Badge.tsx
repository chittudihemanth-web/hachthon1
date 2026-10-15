// src/components/ui/Badge.tsx

import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral';
  className?: string;
  dot?: boolean;
}

const VARIANT_MAP = {
  success: 'badge-success',
  warning: 'badge-warning',
  error:   'badge-error',
  info:    'badge-info',
  pending: 'badge-pending',
  neutral: 'badge-neutral',
};

const DOT_COLOR_MAP = {
  success: 'bg-neon-green',
  warning: 'bg-neon-amber',
  error:   'bg-neon-red',
  info:    'bg-brand-400',
  pending: 'bg-neon-purple',
  neutral: 'bg-slate-500',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className, dot }) => (
  <span className={cn(VARIANT_MAP[variant], className)}>
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', DOT_COLOR_MAP[variant])} />}
    {children}
  </span>
);

// ─── Status Badge ──────────────────────────────────────────────

import { statusBadgeClass } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  success:        'Success',
  failed:         'Failed',
  running:        'Running',
  pending_review: 'Pending Review',
  retrying:       'Retrying',
  cancelled:      'Cancelled',
  active:         'Active',
  paused:         'Paused',
  draft:          'Draft',
  archived:       'Archived',
  pending:        'Pending',
  approved:       'Approved',
  rejected:       'Rejected',
  expired:        'Expired',
  skipped:        'Skipped',
  critical:       'Critical',
  high:           'High',
  medium:         'Medium',
  low:            'Low',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => (
  <span className={cn(statusBadgeClass(status), className)}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
    {STATUS_LABELS[status] ?? status}
  </span>
);
