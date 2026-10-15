// src/components/ui/StatCard.tsx

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: number;           // +/- percent change
  deltaLabel?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  glow?: 'brand' | 'cyan' | 'green' | 'purple';
}

const GLOW_MAP = {
  brand:  'border-brand-600/40 hover:shadow-glow-brand',
  cyan:   'border-neon-cyan/30 hover:shadow-glow-cyan',
  green:  'border-neon-green/30 hover:shadow-glow-green',
  purple: 'border-neon-purple/30 hover:shadow-glow-purple',
};

export const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, delta, deltaLabel, icon,
  iconBg = 'bg-brand-600/20', trend, loading, glow,
}) => {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton w-10 h-10 rounded-xl" />
        </div>
        <div className="skeleton h-8 w-32 rounded mt-2" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  const isPositive = trend === 'up' || (delta !== undefined && delta > 0);
  const isNegative = trend === 'down' || (delta !== undefined && delta < 0);

  return (
    <div className={cn('stat-card', glow && GLOW_MAP[glow])}>
      <div className="flex items-center justify-between">
        <span className="stat-label">{title}</span>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>

      <div>
        <div className="stat-value">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {delta !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-xs',
          isPositive && 'text-neon-green',
          isNegative && 'text-neon-red',
          !isPositive && !isNegative && 'text-slate-500',
        )}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> :
           isNegative ? <TrendingDown className="w-3.5 h-3.5" /> :
           <Minus className="w-3.5 h-3.5" />}
          <span>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
          {deltaLabel && <span className="text-slate-600">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
};
