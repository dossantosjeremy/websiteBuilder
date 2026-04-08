'use client';
import BlocksPanel from './BlocksPanel';

export default function LeftPanel() {
  return (
    <div className="flex flex-col bg-white border-r border-slate-200" style={{ width: 240 }}>
      <div className="px-3 py-2.5 border-b border-slate-200 shrink-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Blocks</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <BlocksPanel />
      </div>
    </div>
  );
}
