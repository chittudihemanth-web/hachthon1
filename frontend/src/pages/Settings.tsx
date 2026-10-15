// src/pages/Settings.tsx

import React, { useState } from 'react';
import {
  Database, Globe, Bell, Shield, Cpu, Save,
  Eye, EyeOff, CheckCircle, AlertTriangle, Info, RefreshCw,
  Zap, MessageSquare,
} from 'lucide-react';

import { useSettingsStore } from '../store';
import { useUIStore } from '../store';

type SettingsSection = 'ai' | 'database' | 'integrations' | 'thresholds' | 'notifications' | 'advanced';

const SECTIONS: Array<{ id: SettingsSection; label: string; icon: React.ReactNode; description: string }> = [
  { id: 'ai',            label: 'AI Engine',       icon: <Cpu className="w-4 h-4" />,    description: 'Gemini API keys and model configuration' },
  { id: 'database',      label: 'Database',        icon: <Database className="w-4 h-4" />, description: 'Supabase connection and storage settings' },
  { id: 'integrations',  label: 'Integrations',    icon: <Globe className="w-4 h-4" />,  description: 'Slack, CRM, and webhook relay endpoints' },
  { id: 'thresholds',    label: 'AI Thresholds',   icon: <Shield className="w-4 h-4" />, description: 'Confidence thresholds and HITL policy' },
  { id: 'notifications', label: 'Notifications',   icon: <Bell className="w-4 h-4" />,   description: 'Alert preferences and notification channels' },
  { id: 'advanced',      label: 'Advanced',        icon: <Zap className="w-4 h-4" />,    description: 'Rate limits, concurrency, and experimental features' },
];

const SecretInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}> = ({ label, value, onChange, placeholder, hint }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          className="input pr-10"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••••••••••'}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-slate-600 mt-1.5">{hint}</p>}
      {value && (
        <p className="text-[11px] text-neon-green mt-1 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Key configured
        </p>
      )}
    </div>
  );
};

const SliderInput: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
}> = ({ label, value, min, max, step, onChange, format, hint }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="label mb-0">{label}</label>
      <span className="text-sm font-semibold font-mono text-brand-300">
        {format ? format(value) : value}
      </span>
    </div>
    <input
      type="range" min={min} max={max} step={step}
      value={value}
      onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
      className="w-full accent-brand-500"
    />
    <div className="flex justify-between text-[10px] text-slate-600 mt-1">
      <span>{format ? format(min) : min}</span>
      <span>{format ? format(max) : max}</span>
    </div>
    {hint && <p className="text-[11px] text-slate-600 mt-1">{hint}</p>}
  </div>
);

const ToggleInput: React.FC<{
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, value, onChange }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div>
      <p className="text-sm font-medium text-slate-200">{label}</p>
      {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
        value ? 'bg-brand-600' : 'bg-surface-3'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
        value ? 'left-6' : 'left-1'
      }`} />
    </button>
  </div>
);

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const addNotification = useUIStore(s => s.addNotification);
  const [activeSection, setActiveSection] = useState<SettingsSection>('ai');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    addNotification({ type: 'success', title: 'Settings saved', message: 'Platform configuration updated.' });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    addNotification({ type: 'info', title: 'Settings reset', message: 'All settings restored to defaults.' });
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-gradient-brand text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-slate-500 text-sm mt-1">Platform configuration & integration management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary btn">
            <RefreshCw className="w-4 h-4" /> Reset Defaults
          </button>
          <button onClick={handleSave} className="btn-primary btn">
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full nav-item ${activeSection === section.id ? 'active' : ''}`}
            >
              <span className={activeSection === section.id ? 'text-brand-400' : 'text-slate-500'}>
                {section.icon}
              </span>
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 glass-card p-6 space-y-6 animate-fade-in">
          {/* Section Header */}
          {(() => {
            const s = SECTIONS.find(s => s.id === activeSection)!;
            return (
              <div className="pb-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center text-brand-400">
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="section-title">{s.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* AI Engine */}
          {activeSection === 'ai' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-brand-600/10 border border-brand-600/30 flex items-start gap-3">
                <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  PulseFlow AI uses Google Gemini models. Obtain your API key from{' '}
                  <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer"
                     className="text-brand-300 underline">
                    Google AI Studio
                  </a>. Both gemini-2.5-flash and gemini-2.5-pro are supported.
                </p>
              </div>

              <SecretInput
                label="Gemini API Key"
                value={settings.geminiApiKey}
                onChange={v => updateSettings({ geminiApiKey: v })}
                placeholder="AIza..."
                hint="Required for all AI extraction, classification, and routing operations."
              />

              <div>
                <label className="label">Default Model Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'flash', label: 'gemini-2.5-flash', desc: 'Fast classification & routing (lower cost)', icon: '⚡' },
                    { value: 'pro',   label: 'gemini-2.5-pro',   desc: 'Deep context parsing & document extraction (higher accuracy)', icon: '🧠' },
                  ].map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => updateSettings({ defaultModelTier: opt.value as 'flash' | 'pro' })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        settings.defaultModelTier === opt.value
                          ? 'border-brand-500 bg-brand-600/15 shadow-glow-brand'
                          : 'border-surface-border hover:border-surface-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span>{opt.icon}</span>
                        <span className="text-xs font-semibold text-slate-200">{opt.label}</span>
                        {settings.defaultModelTier === opt.value && (
                          <CheckCircle className="w-3.5 h-3.5 text-brand-400 ml-auto" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Database */}
          {activeSection === 'database' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-neon-amber/10 border border-neon-amber/30 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-neon-amber flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  Supabase credentials are stored locally. In production, use environment variables and never expose
                  the service role key on the frontend.
                </p>
              </div>

              <div>
                <label className="label">Supabase Project URL</label>
                <input
                  className="input"
                  value={settings.supabaseUrl}
                  onChange={e => updateSettings({ supabaseUrl: e.target.value })}
                  placeholder="https://xxxx.supabase.co"
                />
              </div>

              <SecretInput
                label="Supabase Anon Key"
                value={settings.supabaseAnonKey}
                onChange={v => updateSettings({ supabaseAnonKey: v })}
                hint="The public anon key from your Supabase project API settings."
              />

              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-2 border border-surface-border">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  settings.supabaseUrl && settings.supabaseAnonKey ? 'bg-neon-green' : 'bg-surface-border'
                }`} />
                <span className="text-sm text-slate-400">
                  {settings.supabaseUrl && settings.supabaseAnonKey ? 'Connected to Supabase' : 'Not configured — using mock data'}
                </span>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeSection === 'integrations' && (
            <div className="space-y-5">
              <div>
                <label className="label">Slack Webhook URL</label>
                <input
                  className="input"
                  value={settings.slackWebhookUrl}
                  onChange={e => updateSettings({ slackWebhookUrl: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                />
                <p className="text-[11px] text-slate-600 mt-1.5">Used for Slack notification dispatch actions.</p>
              </div>

              <div>
                <label className="label">CRM Webhook URL</label>
                <input
                  className="input"
                  value={settings.crmWebhookUrl}
                  onChange={e => updateSettings({ crmWebhookUrl: e.target.value })}
                  placeholder="https://crm.example.com/api/webhooks/..."
                />
                <p className="text-[11px] text-slate-600 mt-1.5">Target endpoint for CRM record creation/update actions.</p>
              </div>

              <div className="divider" />

              <div className="space-y-1">
                {[
                  { label: 'Slack', connected: !!settings.slackWebhookUrl, icon: <MessageSquare className="w-4 h-4" /> },
                  { label: 'CRM Webhook', connected: !!settings.crmWebhookUrl, icon: <Globe className="w-4 h-4" /> },
                  { label: 'Email Draft', connected: false, icon: <Bell className="w-4 h-4" /> },
                ].map(({ label, connected, icon }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-slate-400">
                        {icon}
                      </div>
                      <span className="text-slate-300">{label}</span>
                    </div>
                    <span className={`badge text-[11px] ${connected ? 'badge-success' : 'badge-neutral'}`}>
                      {connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thresholds */}
          {activeSection === 'thresholds' && (
            <div className="space-y-6">
              <SliderInput
                label="Default Confidence Threshold"
                value={settings.defaultConfidenceThreshold}
                min={0.5} max={1.0} step={0.01}
                onChange={v => updateSettings({ defaultConfidenceThreshold: v })}
                format={v => `${(v * 100).toFixed(0)}%`}
                hint="Executions with confidence below this value are routed to HITL review queue."
              />

              <SliderInput
                label="Default Retry Limit"
                value={settings.defaultRetryLimit}
                min={0} max={5} step={1}
                onChange={v => updateSettings({ defaultRetryLimit: v })}
                hint="Maximum number of LLM re-prompts on schema validation failure before marking as failed."
              />

              <SliderInput
                label="HITL Review Expiration (hours)"
                value={settings.hitlExpirationHours}
                min={1} max={168} step={1}
                onChange={v => updateSettings({ hitlExpirationHours: v })}
                format={v => `${v}h`}
                hint="HITL items not reviewed within this window are automatically expired."
              />
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="divide-y divide-surface-border">
              <ToggleInput
                label="Notify on HITL Trigger"
                description="Receive alerts when executions are routed to human review."
                value={settings.notifyOnHitl}
                onChange={v => updateSettings({ notifyOnHitl: v })}
              />
              <ToggleInput
                label="Notify on Execution Failure"
                description="Receive alerts when a pipeline execution fails after all retries."
                value={settings.notifyOnFailure}
                onChange={v => updateSettings({ notifyOnFailure: v })}
              />
            </div>
          )}

          {/* Advanced */}
          {activeSection === 'advanced' && (
            <div className="space-y-6">
              <SliderInput
                label="Max Concurrent Executions"
                value={settings.maxConcurrentExecutions}
                min={1} max={50} step={1}
                onChange={v => updateSettings({ maxConcurrentExecutions: v })}
                hint="Maximum parallel pipeline executions. Exceeding this triggers queue throttling."
              />

              <SliderInput
                label="API Rate Limit (RPM)"
                value={settings.rateLimitRpm}
                min={10} max={300} step={10}
                onChange={v => updateSettings({ rateLimitRpm: v })}
                format={v => `${v} RPM`}
                hint="Requests per minute limit applied to the PulseFlow API surface."
              />

              <div className="p-4 rounded-xl bg-neon-red/5 border border-neon-red/20">
                <p className="text-xs font-semibold text-neon-red mb-1.5">Danger Zone</p>
                <p className="text-[11px] text-slate-500 mb-3">
                  These actions are irreversible. Proceed with caution.
                </p>
                <div className="flex gap-3">
                  <button className="btn-danger btn btn-sm">Clear Execution Log</button>
                  <button className="btn-danger btn btn-sm">Reset All Workflows</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
