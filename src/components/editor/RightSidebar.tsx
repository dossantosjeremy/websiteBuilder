'use client';

import { useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Palette, Settings, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useEditorContext } from './EditorContext';

const tabs = [
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'traits', label: 'Traits', icon: Settings },
  { id: 'seo', label: 'SEO', icon: Globe },
] as const;

const ROBOTS_OPTIONS = [
  'index, follow',
  'noindex, follow',
  'index, nofollow',
  'noindex, nofollow',
];

export default function RightSidebar() {
  const [activeTab, setActiveTab] = useState<string>('style');
  const { pages, setPages, currentPageIndex } = useEditorContext();

  const currentPage = pages[currentPageIndex];
  const meta = currentPage?.meta ?? {};

  const updateMeta = (key: string, value: string) => {
    const updatedPages = pages.map((p, i) =>
      i === currentPageIndex ? { ...p, meta: { ...p.meta, [key]: value } } : p
    );
    setPages(updatedPages);
  };

  return (
    <TabsPrimitive.Root
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col h-full bg-[hsl(0,0%,8%)] border-l border-[hsl(0,0%,18%)]"
      style={{ width: 280 }}
    >
      {/* Tab bar */}
      <TabsPrimitive.List className="flex border-b border-[hsl(0,0%,18%)] shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <TabsPrimitive.Trigger
            key={id}
            value={id}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              'text-[hsl(0,0%,45%)] hover:text-[hsl(0,0%,75%)]',
              'data-[state=active]:text-[hsl(221,83%,65%)] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(221,83%,53%)]'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {/* Tab content — absolute positioning keeps GrapesJS containers always sized */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div
          id="styles-container"
          className="absolute inset-0 overflow-y-auto"
          style={{
            visibility: activeTab === 'style' ? 'visible' : 'hidden',
            pointerEvents: activeTab === 'style' ? 'auto' : 'none',
            zIndex: activeTab === 'style' ? 1 : 0,
          }}
        />
        <div
          id="traits-container"
          className="absolute inset-0 overflow-y-auto"
          style={{
            visibility: activeTab === 'traits' ? 'visible' : 'hidden',
            pointerEvents: activeTab === 'traits' ? 'auto' : 'none',
            zIndex: activeTab === 'traits' ? 1 : 0,
          }}
        />
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{
            visibility: activeTab === 'seo' ? 'visible' : 'hidden',
            pointerEvents: activeTab === 'seo' ? 'auto' : 'none',
            zIndex: activeTab === 'seo' ? 1 : 0,
          }}
        >
          <div className="p-4 space-y-4">
            <h3 className="text-xs font-semibold text-[hsl(0,0%,55%)] uppercase tracking-wide">
              Page SEO Settings
            </h3>
            {currentPage && (
              <>
                <div>
                  <label className="block text-xs text-[hsl(0,0%,60%)] mb-1">Page Title</label>
                  <Input
                    value={meta.title ?? ''}
                    onChange={(e) => updateMeta('title', e.target.value)}
                    placeholder="My awesome page"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[hsl(0,0%,60%)] mb-1">Meta Description</label>
                  <textarea
                    value={meta.description ?? ''}
                    onChange={(e) => updateMeta('description', e.target.value)}
                    placeholder="A brief description of this page..."
                    rows={3}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[hsl(0,0%,60%)] mb-1">OG Image URL</label>
                  <Input
                    value={meta.ogImage ?? ''}
                    onChange={(e) => updateMeta('ogImage', e.target.value)}
                    placeholder="https://example.com/og.png"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[hsl(0,0%,60%)] mb-1">Canonical URL</label>
                  <Input
                    value={meta.canonical ?? ''}
                    onChange={(e) => updateMeta('canonical', e.target.value)}
                    placeholder="https://example.com/page"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[hsl(0,0%,60%)] mb-1">Robots</label>
                  <select
                    value={meta.robots ?? 'index, follow'}
                    onChange={(e) => updateMeta('robots', e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  >
                    {ROBOTS_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </TabsPrimitive.Root>
  );
}
