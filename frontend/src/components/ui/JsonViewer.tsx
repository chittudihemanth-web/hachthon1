// src/components/ui/JsonViewer.tsx

import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { copyToClipboard } from '../../lib/utils';

interface JsonViewerProps {
  data: Record<string, unknown> | unknown;
  title?: string;
  maxHeight?: string;
  collapsed?: boolean;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data, title, maxHeight = '240px', collapsed = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const json = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await copyToClipboard(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-surface-border overflow-hidden">
      {title && (
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-surface-2
                     border-b border-surface-border cursor-pointer hover:bg-surface-3"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            {isCollapsed
              ? <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              : <ChevronDown  className="w-3.5 h-3.5 text-slate-500" />
            }
            <span className="text-xs font-medium text-slate-400">{title}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300
                       transition-colors duration-200"
          >
            {copied
              ? <><Check className="w-3 h-3 text-neon-green" /><span className="text-neon-green">Copied</span></>
              : <><Copy className="w-3 h-3" /><span>Copy</span></>
            }
          </button>
        </div>
      )}

      {!isCollapsed && (
        <div
          className="bg-surface-2/80 overflow-auto custom-scrollbar"
          style={{ maxHeight }}
        >
          <pre className="p-4 text-[11px] font-mono text-slate-300 leading-relaxed">
            <SyntaxHighlight json={json} />
          </pre>
        </div>
      )}
    </div>
  );
};

// Simple JSON syntax highlighting
const SyntaxHighlight: React.FC<{ json: string }> = ({ json }) => {
  const highlighted = json
    .replace(/("([^"]+)"\s*:)/g, '<span class="text-brand-300">$1</span>')
    .replace(/:\s*("([^"]*)")/g, ': <span class="text-neon-green">$2</span>')
    .replace(/:\s*(true|false)/g, ': <span class="text-neon-amber">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="text-slate-500">$1</span>')
    .replace(/:\s*(-?\d+(?:\.\d+)?)/g, ': <span class="text-neon-cyan">$1</span>');

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

// ─── Payload Diff Inspector ────────────────────────────────────

interface PayloadDiffProps {
  original: Record<string, unknown>;
  proposed: Record<string, unknown>;
  edited?: Record<string, unknown>;
}

export const PayloadDiff: React.FC<PayloadDiffProps> = ({ original, proposed, edited }) => {
  const allKeys = Array.from(new Set([
    ...Object.keys(original),
    ...Object.keys(proposed),
  ]));

  return (
    <div className="space-y-2">
      {allKeys.map(key => {
        const origVal = original[key];
        const propVal = proposed[key];
        const editVal = edited?.[key];
        const hasChange = JSON.stringify(origVal) !== JSON.stringify(propVal);
        const wasEdited = edited && JSON.stringify(editVal) !== JSON.stringify(propVal);

        return (
          <div key={key} className={`rounded-xl border px-4 py-3 ${
            wasEdited ? 'border-neon-purple/30 bg-neon-purple/5' :
            hasChange ? 'border-neon-amber/30 bg-neon-amber/5' :
            'border-surface-border bg-surface-2/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-medium text-brand-300">{key}</span>
              {wasEdited && <span className="text-[10px] badge-pending badge">Human Edited</span>}
              {hasChange && !wasEdited && <span className="text-[10px] badge-warning badge">AI Proposed</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-600 mb-1">Extracted</p>
                <p className="text-xs font-mono text-slate-400 bg-surface-2 rounded-lg px-2 py-1">
                  {origVal !== undefined ? JSON.stringify(origVal) : <span className="text-slate-600">—</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-600 mb-1">{wasEdited ? 'Human Override' : 'Proposed'}</p>
                <p className={`text-xs font-mono rounded-lg px-2 py-1 ${
                  wasEdited ? 'text-neon-purple bg-neon-purple/10' :
                  hasChange ? 'text-neon-amber bg-neon-amber/10' :
                  'text-slate-400 bg-surface-2'
                }`}>
                  {(wasEdited ? editVal : propVal) !== undefined
                    ? JSON.stringify(wasEdited ? editVal : propVal)
                    : <span className="text-slate-600">—</span>
                  }
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
