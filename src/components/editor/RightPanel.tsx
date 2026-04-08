'use client';
import { useState } from 'react';
import { Palette, Settings, Globe, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import StylesPanel from './StylesPanel';
import TraitsPanel from './TraitsPanel';
import LayersPanel from './LayersPanel';
import { useEditorContext } from './EditorContext';

type Tab = 'style' | 'traits' | 'layers' | 'seo';

export default function RightPanel() {
  const [tab, setTab] = useState<Tab>('style');
  const { pages, setPages, currentPageIndex } = useEditorContext();
  const currentPage = pages[currentPageIndex];
  const meta = currentPage?.meta ?? {};

  const updateMeta = (key: string, value: string) => {
    setPages(pages.map((p, i) => i === currentPageIndex ? { ...p, meta: { ...p.meta, [key]: value } } : p));
  };

  const tabs = [
    ['style',  'Style',  Palette],
    ['traits', 'Traits', Settings],
    ['layers', 'Layers', Layers],
    ['seo',    'SEO',    Globe],
  ] as const;

  return (
    <div className="flex flex-col bg-white border-l border-slate-200" style={{ width: 260 }}>
      {/* Tab strip */}
      <div className="flex shrink-0 border-b border-slate-200">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors border-b-2',
              tab === id
                ? 'text-teal-600 border-teal-500 bg-teal-50'
                : 'text-slate-400 border-transparent hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0" style={{ visibility: tab === 'style'  ? 'visible' : 'hidden' }}>
          <StylesPanel />
        </div>
        <div className="absolute inset-0" style={{ visibility: tab === 'traits' ? 'visible' : 'hidden' }}>
          <TraitsPanel />
        </div>
        <div className="absolute inset-0 overflow-y-auto" style={{ visibility: tab === 'layers' ? 'visible' : 'hidden' }}>
          <LayersPanel />
        </div>
        <div className="absolute inset-0 overflow-y-auto p-3 space-y-3" style={{ visibility: tab === 'seo' ? 'visible' : 'hidden' }}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Page SEO</p>
          {[
            { key: 'title',       label: 'Title',       placeholder: 'Page title' },
            { key: 'description', label: 'Description', placeholder: 'Meta description' },
            { key: 'ogImage',     label: 'OG Image URL', placeholder: 'https://...' },
            { key: 'canonical',   label: 'Canonical URL', placeholder: 'https://...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-[10px] text-slate-500 mb-1">{label}</label>
              <input
                type="text"
                value={(meta as Record<string, string>)[key] ?? ''}
                onChange={e => updateMeta(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100"
              />
            </div>
          ))}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Robots</label>
            <select
              value={(meta as Record<string, string>).robots ?? 'index, follow'}
              onChange={e => updateMeta('robots', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            >
              {['index, follow', 'noindex, follow', 'index, nofollow', 'noindex, nofollow'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
