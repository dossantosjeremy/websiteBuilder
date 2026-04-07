'use client';

import { useState } from 'react';
import { Layers, LayoutGrid, FileText, Component } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageManager from './PageManager';

const tabs = [
  { id: 'blocks', label: 'Blocks', icon: LayoutGrid },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'components', label: 'Components', icon: Component },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<TabId>('blocks');

  return (
    <div
      className="flex flex-col h-full bg-[hsl(0,0%,8%)] border-r border-[hsl(0,0%,18%)]"
      style={{ width: 280 }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-[hsl(0,0%,18%)] shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              'text-[hsl(0,0%,45%)] hover:text-[hsl(0,0%,75%)]',
              activeTab === id &&
                'text-[hsl(221,83%,65%)] border-b-2 border-[hsl(221,83%,53%)]'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/*
        IMPORTANT: All GrapesJS containers must ALWAYS be in the DOM with non-zero
        dimensions so GrapesJS can render into them at init time.
        We use absolute positioning + visibility to show/hide tabs without
        ever using display:none, which would prevent GrapesJS from rendering.
      */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {/* Blocks panel — GrapesJS renders blocks here */}
        <div
          id="blocks-container"
          className="absolute inset-0 overflow-y-auto"
          style={{
            visibility: activeTab === 'blocks' ? 'visible' : 'hidden',
            pointerEvents: activeTab === 'blocks' ? 'auto' : 'none',
            zIndex: activeTab === 'blocks' ? 1 : 0,
          }}
        />

        {/* Layers panel — GrapesJS renders layer tree here */}
        <div
          id="layers-container"
          className="absolute inset-0 overflow-y-auto"
          style={{
            visibility: activeTab === 'layers' ? 'visible' : 'hidden',
            pointerEvents: activeTab === 'layers' ? 'auto' : 'none',
            zIndex: activeTab === 'layers' ? 1 : 0,
          }}
        />

        {/* Pages panel — custom React page manager */}
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{
            visibility: activeTab === 'pages' ? 'visible' : 'hidden',
            pointerEvents: activeTab === 'pages' ? 'auto' : 'none',
            zIndex: activeTab === 'pages' ? 1 : 0,
          }}
        >
          <PageManager />
        </div>

        {/* Components panel */}
        <div
          id="components-container"
          className="absolute inset-0 overflow-y-auto p-2 text-xs text-[hsl(0,0%,45%)]"
          style={{
            visibility: activeTab === 'components' ? 'visible' : 'hidden',
            pointerEvents: activeTab === 'components' ? 'auto' : 'none',
            zIndex: activeTab === 'components' ? 1 : 0,
          }}
        >
          Select a component on the canvas to see its tree.
        </div>
      </div>
    </div>
  );
}
