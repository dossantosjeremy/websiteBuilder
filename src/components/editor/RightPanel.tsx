'use client';
import { useState } from 'react';
import { Palette, Settings, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import StylesPanel from './StylesPanel';
import TraitsPanel from './TraitsPanel';
import { useEditorContext } from './EditorContext';

type Tab = 'style' | 'traits' | 'seo';

export default function RightPanel() {
  const [tab, setTab] = useState<Tab>('style');
  const { pages, setPages, currentPageIndex } = useEditorContext();
  const currentPage = pages[currentPageIndex];
  const meta = currentPage?.meta ?? {};

  const updateMeta = (key: string, value: string) => {
    setPages(pages.map((p, i) => i === currentPageIndex ? { ...p, meta: { ...p.meta, [key]: value } } : p));
  };

  return (
    <div className="flex flex-col bg-[#111] border-l border-[#222]" style={{ width: 260 }}>
      {/* Tab strip */}
      <div className="flex shrink-0 border-b border-[#222]">
        {([['style', 'Style', Palette], ['traits', 'Traits', Settings], ['seo', 'SEO', Globe]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors border-b-2',
              tab === id
                ? 'text-blue-400 border-blue-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0" style={{ visibility: tab === 'style' ? 'visible' : 'hidden' }}>
          <StylesPanel />
        </div>
        <div className="absolute inset-0" style={{ visibility: tab === 'traits' ? 'visible' : 'hidden' }}>
          <TraitsPanel />
        </div>
        <div className="absolute inset-0 overflow-y-auto p-3 space-y-3" style={{ visibility: tab === 'seo' ? 'visible' : 'hidden' }}>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Page SEO</p>
          {[
            { key: 'title', label: 'Title', placeholder: 'Page title' },
            { key: 'description', label: 'Description', placeholder: 'Meta description' },
            { key: 'ogImage', label: 'OG Image URL', placeholder: 'https://...' },
            { key: 'canonical', label: 'Canonical URL', placeholder: 'https://...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
              <input
                type="text"
                value={(meta as Record<string, string>)[key] ?? ''}
                onChange={e => updateMeta(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Robots</label>
            <select
              value={(meta as Record<string, string>).robots ?? 'index, follow'}
              onChange={e => updateMeta('robots', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
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
