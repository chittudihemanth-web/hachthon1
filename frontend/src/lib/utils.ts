// src/lib/utils.ts

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy HH:mm');
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}m ${sec}s`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatCost(usd: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function confidenceColor(score: number): string {
  if (score >= 0.9) return 'text-neon-green';
  if (score >= 0.75) return 'text-neon-amber';
  return 'text-neon-red';
}

export function confidenceBadgeClass(score: number): string {
  if (score >= 0.9) return 'badge-success';
  if (score >= 0.75) return 'badge-warning';
  return 'badge-error';
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    success: 'badge-success',
    active: 'badge-success',
    approved: 'badge-success',
    failed: 'badge-error',
    rejected: 'badge-error',
    error: 'badge-error',
    running: 'badge-info',
    retrying: 'badge-warning',
    pending: 'badge-warning',
    pending_review: 'badge-pending',
    paused: 'badge-neutral',
    draft: 'badge-neutral',
    archived: 'badge-neutral',
    cancelled: 'badge-neutral',
    expired: 'badge-neutral',
    skipped: 'badge-neutral',
    critical: 'badge-error',
    high: 'badge-warning',
    medium: 'badge-info',
    low: 'badge-neutral',
  };
  return map[status] ?? 'badge-neutral';
}

export function truncate(str: string, maxLen = 60): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function estimateCost(tokensIn: number, tokensOut: number, model: 'flash' | 'pro'): number {
  // Approximate Gemini pricing per million tokens
  const pricing = {
    flash: { input: 0.075, output: 0.30 },
    pro:   { input: 3.50,  output: 10.50 },
  };
  const p = pricing[model];
  return (tokensIn / 1_000_000) * p.input + (tokensOut / 1_000_000) * p.output;
}
