'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import type { SettingsData } from '@/app/api/settings/route';

interface Props { open: boolean; onClose: () => void; }

export default function SettingsModal({ open, onClose }: Props) {
  const [data, setData] = useState<SettingsData>({});
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setData(d ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const set = (key: keyof SettingsData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      toast.success('Settings saved');
      onClose();
    } catch (err) {
      toast.error(`Failed to save: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Settings className="w-4 h-4 text-teal-600" /> Settings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="space-y-5 py-2">

            {/* ── AI Provider ─────────────────────────────────── */}
            <section>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">AI Provider</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Provider</label>
                  <select
                    value={data.aiProvider ?? 'anthropic'}
                    onChange={(e) => set('aiProvider', e.target.value as 'anthropic' | 'openai')}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="openai">OpenAI (GPT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    API Key
                    <span className="ml-1 text-xs text-slate-400">
                      {data.aiProvider === 'openai' ? '(starts with sk-)' : '(starts with sk-ant-)'}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAiKey ? 'text' : 'password'}
                      value={data.aiApiKey ?? ''}
                      onChange={(e) => set('aiApiKey', e.target.value)}
                      placeholder={data.aiProvider === 'openai' ? 'sk-...' : 'sk-ant-api03-...'}
                      className="w-full border border-slate-200 rounded-md px-3 py-2 pr-10 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiKey((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Overrides the server-side environment variable for AI chat.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* ── Vercel ─────────────────────────────────────── */}
            <section>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vercel Deploy</p>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Vercel Token</label>
                <div className="relative">
                  <input
                    type={showVercelToken ? 'text' : 'password'}
                    value={data.vercelToken ?? ''}
                    onChange={(e) => set('vercelToken', e.target.value)}
                    placeholder="vcp_..."
                    className="w-full border border-slate-200 rounded-md px-3 py-2 pr-10 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVercelToken((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showVercelToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Get yours at{' '}
                  <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer"
                    className="text-teal-600 hover:underline">
                    vercel.com/account/tokens
                  </a>
                </p>
              </div>
            </section>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
