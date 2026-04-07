'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useEditorContext } from './EditorContext';

export default function BlocksPanel() {
  // BlocksPanel is superseded by Studio SDK's built-in block manager
  const { editor } = useEditorContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks: any[] = [];
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['Basic', 'Layout', 'Forms', 'Extra']));

  const filtered = useMemo(() => {
    if (!search) return blocks;
    return blocks.filter(b =>
      b.label.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [blocks, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof blocks>();
    filtered.forEach(block => {
      const cat = block.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(block);
    });
    return map;
  }, [filtered]);

  const addBlock = (block: (typeof blocks)[0]) => {
    if (!editor) return;
    try {
      const selected = editor.getSelected();
      if (selected) {
        selected.append(block.content);
      } else {
        editor.addComponents(block.content);
      }
    } catch {
      editor.addComponents(block.content);
    }
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (!editor || blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs p-4">
        <div className="animate-pulse">Loading blocks...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b border-[#222] shrink-0">
        <div className="flex items-center gap-2 bg-[#111] border border-[#2a2a2a] rounded-md px-2 py-1.5">
          <Search className="w-3 h-3 text-gray-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search blocks..."
            className="flex-1 bg-transparent text-xs text-gray-200 placeholder-gray-600 outline-none"
          />
        </div>
      </div>

      {/* Block categories */}
      <div className="flex-1 overflow-y-auto">
        {Array.from(grouped.entries()).map(([category, catBlocks]) => (
          <div key={category}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#141414] border-b border-[#222] text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:bg-[#1a1a1a] transition-colors"
            >
              <span>{category}</span>
              <span className="text-gray-600">{openCategories.has(category) ? '▲' : '▼'}</span>
            </button>

            {/* Blocks grid */}
            {openCategories.has(category) && (
              <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#1a1a1a]">
                {catBlocks.map(block => (
                  <button
                    key={block.id}
                    onClick={() => addBlock(block)}
                    title={`Add ${block.label}`}
                    className="flex flex-col items-center justify-center gap-1 p-2 bg-[#222] border border-[#2a2a2a] rounded-md hover:border-blue-500 hover:bg-[#1e2a3a] transition-all text-center group min-h-[64px] cursor-pointer"
                  >
                    {block.media ? (
                      <div
                        className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-blue-400 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-current"
                        dangerouslySetInnerHTML={{ __html: block.media }}
                      />
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center bg-[#333] rounded text-gray-500 text-xs">
                        {block.label.charAt(0)}
                      </div>
                    )}
                    <span className="text-[10px] text-gray-300 group-hover:text-white leading-tight">
                      {block.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && search && (
          <div className="text-center text-gray-600 text-xs p-8">
            No blocks matching &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
