'use client';
import { useState } from 'react';
import { LayoutGrid, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import BlocksPanel from './BlocksPanel';
import LayersPanel from './LayersPanel';

type Tab = 'blocks' | 'layers';

export default function LeftPanel() {
  const [tab, setTab] = useState<Tab>('blocks');

  return (
    <div className="flex flex-col bg-[#111] border-r border-[#222]" style={{ width: 260 }}>
      {/* Tab strip */}
      <div className="flex shrink-0 border-b border-[#222]">
        {([['blocks', 'Blocks', LayoutGrid], ['layers', 'Layers', Layers]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
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

      {/* Content — visibility swap (not display:none so GrapesJS containers stay sized) */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto" style={{ visibility: tab === 'blocks' ? 'visible' : 'hidden' }}>
          <BlocksPanel />
        </div>
        <div className="absolute inset-0" style={{ visibility: tab === 'layers' ? 'visible' : 'hidden' }}>
          <LayersPanel />
        </div>
      </div>
    </div>
  );
}
