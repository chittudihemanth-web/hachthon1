// src/components/layout/Sidebar.tsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Zap, LayoutDashboard, Workflow, Play, UserCheck,
  BarChart3, Settings, ChevronLeft, ChevronRight,
  Cpu,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../store';
import { useHitlItems } from '../../hooks/useApi';

const NAV_ITEMS = [
  { path: '/',            icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { path: '/workflows',   icon: Workflow,         label: 'Workflows'              },
  { path: '/executions',  icon: Play,             label: 'Executions'             },
  { path: '/hitl',        icon: UserCheck,        label: 'HITL Review',    badge: true },
  { path: '/analytics',   icon: BarChart3,        label: 'Analytics'              },
  { path: '/settings',    icon: Settings,         label: 'Settings'               },
];

export const Sidebar: React.FC = () => {
  const collapsed = useUIStore(s => s.sidebarCollapsed);
  const toggle = useUIStore(s => s.toggleSidebar);
  const { data: hitlItems } = useHitlItems('pending');
  const pendingCount = hitlItems?.length ?? 0;

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-surface-1 border-r border-surface-border',
        'transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 h-16 border-b border-surface-border',
        collapsed && 'justify-center px-2'
      )}>
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-neon-purple
                          flex items-center justify-center shadow-glow-brand">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-neon-green rounded-full
                          border-2 border-surface-1 animate-pulse-slow" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in min-w-0">
            <p className="font-bold text-slate-50 text-sm leading-tight tracking-tight">PulseFlow AI</p>
            <p className="text-[10px] text-slate-500 leading-tight">Automation Orchestrator</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(({ path, icon: Icon, label, end, badge }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'active', collapsed && 'justify-center px-2')
            }
          >
            <div className="relative flex-shrink-0">
              <Icon className="w-5 h-5" />
              {badge && pendingCount > 0 && collapsed && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-amber text-surface
                                  text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-sm">{label}</span>
                {badge && pendingCount > 0 && (
                  <span className="badge badge-warning text-[10px] px-1.5 py-0.5 min-w-[20px] justify-center">
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-3 border-t border-surface-border space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 rounded-xl bg-surface-2/50 border border-surface-border mb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[11px] font-medium text-slate-400">AI Engine</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neon-green">● Online</span>
              <span className="text-[10px] text-slate-500">gemini-2.5-flash</span>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={toggle}
          className={cn(
            'w-full nav-item text-slate-500 hover:text-slate-300',
            collapsed && 'justify-center px-2'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-5 h-5" />
            : <><ChevronLeft className="w-5 h-5" /><span className="text-sm">Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
};
