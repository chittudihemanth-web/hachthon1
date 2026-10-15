// src/components/layout/TopBar.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell, CheckCircle, AlertTriangle, XCircle, Info, X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../store';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':           { title: 'Dashboard',    subtitle: 'Real-time automation health & metrics' },
  '/workflows':  { title: 'Workflows',    subtitle: 'Configure & manage automation pipelines' },
  '/executions': { title: 'Executions',   subtitle: 'Monitor and audit pipeline runs' },
  '/hitl':       { title: 'HITL Review',  subtitle: 'Human-in-the-loop approval queue' },
  '/analytics':  { title: 'Analytics',    subtitle: 'Token spend, success rates & performance' },
  '/settings':   { title: 'Settings',     subtitle: 'Platform configuration & integrations' },
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const notifications = useUIStore(s => s.notifications);
  const removeNotification = useUIStore(s => s.removeNotification);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const latest = notifications[notifications.length - 1];
    if (!latest) return;
    const timer = setTimeout(() => removeNotification(latest.id), latest.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [notifications, removeNotification]);

  const currentPage = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  );
  const pageInfo = currentPage?.[1] ?? { title: 'PulseFlow AI', subtitle: '' };

  const notifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" />;
      case 'error':   return <XCircle     className="w-4 h-4 text-neon-red flex-shrink-0" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-neon-amber flex-shrink-0" />;
      default:        return <Info        className="w-4 h-4 text-brand-400 flex-shrink-0" />;
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-surface-1/80
                       backdrop-blur-xl border-b border-surface-border relative z-10">
      {/* Left: Page Title */}
      <div className="flex flex-col">
        <h1 className="page-title leading-tight">{pageInfo.title}</h1>
        <p className="text-xs text-slate-500 leading-tight">{pageInfo.subtitle}</p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg
                        bg-surface-2 border border-surface-border">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs font-mono text-slate-400">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative btn-ghost btn p-2 rounded-xl"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white
                               text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifPanel && (
            <div className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl shadow-card-hover
                            border border-surface-border overflow-hidden animate-scale-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                <span className="text-sm font-semibold text-slate-200">Notifications</span>
                <button
                  onClick={() => setShowNotifPanel(false)}
                  className="btn-ghost btn-sm btn p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 px-4 py-6 text-center">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-surface-3/50
                                 border-b border-surface-border/50 last:border-0"
                    >
                      {notifIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200">{n.title}</p>
                        {n.message && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.message}</p>}
                      </div>
                      <button
                        onClick={() => removeNotification(n.id)}
                        className="text-slate-600 hover:text-slate-400 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-neon-purple
                        flex items-center justify-center text-white text-sm font-semibold
                        cursor-pointer hover:shadow-glow-brand transition-all duration-200">
          OP
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {notifications.slice(-3).map(n => (
          <div
            key={n.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card-hover',
              'animate-slide-in-right pointer-events-auto max-w-sm',
              n.type === 'success' && 'bg-neon-green/10 border-neon-green/30',
              n.type === 'error'   && 'bg-neon-red/10 border-neon-red/30',
              n.type === 'warning' && 'bg-neon-amber/10 border-neon-amber/30',
              n.type === 'info'    && 'bg-brand-600/10 border-brand-600/30',
            )}
          >
            {notifIcon(n.type)}
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-100">{n.title}</p>
              {n.message && <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>}
            </div>
            <button onClick={() => removeNotification(n.id)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </header>
  );
};
