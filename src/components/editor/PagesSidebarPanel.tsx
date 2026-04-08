'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Check, X, FileText } from 'lucide-react';
import { useEditorContext, type PageData } from './EditorContext';
import { v4 as uuidv4 } from 'uuid';

export default function PagesSidebarPanel() {
  const { editor, pages, setPages, currentPageIndex, setCurrentPageIndex } = useEditorContext();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const saveCurrentPage = () => {
    if (!editor) return pages;
    const components = editor.getComponents().toJSON();
    const styles = editor.getStyle().toJSON();
    return pages.map((p, i) => i === currentPageIndex ? { ...p, components, styles } : p);
  };

  const switchPage = (idx: number) => {
    if (idx === currentPageIndex) return;
    const updated = saveCurrentPage();
    setPages(updated);
    const target = updated[idx];
    if (editor && target) {
      editor.setComponents(target.components ?? []);
      editor.setStyle(target.styles ?? []);
    }
    setCurrentPageIndex(idx);
  };

  const addPage = () => {
    if (!newName.trim()) return;
    const path = `/${newName.trim().toLowerCase().replace(/\s+/g, '-')}`;
    const newPage: PageData = {
      id: uuidv4(),
      name: newName.trim(),
      path,
      components: [],
      styles: [],
      meta: { title: newName.trim(), robots: 'index, follow' },
    };
    const updated = saveCurrentPage();
    setPages([...updated, newPage]);
    setNewName('');
    setAdding(false);
  };

  const deletePage = (idx: number) => {
    if (pages.length <= 1) return;
    const updated = pages.filter((_, i) => i !== idx);
    setPages(updated);
    const newIdx = currentPageIndex >= updated.length ? updated.length - 1
      : currentPageIndex === idx ? Math.max(0, idx - 1)
      : currentPageIndex;
    setCurrentPageIndex(newIdx);
    if (editor) {
      editor.setComponents(updated[newIdx]?.components ?? []);
      editor.setStyle(updated[newIdx]?.styles ?? []);
    }
    setDeleteConfirmIndex(null);
  };

  const commitRename = (idx: number) => {
    if (editingName.trim()) {
      setPages(pages.map((p, i) => i === idx ? { ...p, name: editingName.trim() } : p));
    }
    setEditingIndex(null);
  };

  const movePage = (idx: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= pages.length) return;
    const updated = [...pages];
    [updated[idx], updated[swap]] = [updated[swap], updated[idx]];
    setPages(updated);
    if (currentPageIndex === idx) setCurrentPageIndex(swap);
    else if (currentPageIndex === swap) setCurrentPageIndex(idx);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 shrink-0">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pages</span>
        <button
          onClick={() => { setAdding(true); setNewName(''); }}
          className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          title="Add page"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {pages.map((page, idx) => (
          <div
            key={page.id}
            onClick={() => switchPage(idx)}
            className={`group flex items-center gap-1.5 px-2 py-2 cursor-pointer transition-colors border-b border-slate-100 ${
              idx === currentPageIndex
                ? 'bg-teal-50 border-l-2 border-l-teal-500'
                : 'hover:bg-slate-50 border-l-2 border-l-transparent'
            }`}
          >
            {/* Reorder */}
            <div className="flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={e => { e.stopPropagation(); movePage(idx, 'up'); }} disabled={idx === 0}
                className="h-3 w-3 flex items-center justify-center text-slate-400 hover:text-teal-600 disabled:opacity-20">
                <ChevronUp className="h-2.5 w-2.5" />
              </button>
              <button onClick={e => { e.stopPropagation(); movePage(idx, 'down'); }} disabled={idx === pages.length - 1}
                className="h-3 w-3 flex items-center justify-center text-slate-400 hover:text-teal-600 disabled:opacity-20">
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </div>

            <FileText className={`w-3.5 h-3.5 shrink-0 ${idx === currentPageIndex ? 'text-teal-600' : 'text-slate-400'}`} />

            {/* Name */}
            <div className="flex-1 min-w-0" onDoubleClick={e => { e.stopPropagation(); setEditingIndex(idx); setEditingName(page.name); }}>
              {editingIndex === idx ? (
                <input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={() => commitRename(idx)}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(idx); if (e.key === 'Escape') setEditingIndex(null); e.stopPropagation(); }}
                  onClick={e => e.stopPropagation()}
                  className="w-full border border-teal-400 rounded px-1 py-0 text-xs text-slate-800 outline-none bg-white"
                  autoFocus
                />
              ) : (
                <div>
                  <div className={`text-xs font-medium truncate ${idx === currentPageIndex ? 'text-teal-700' : 'text-slate-700'}`}>{page.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{page.path}</div>
                </div>
              )}
            </div>

            {/* Delete */}
            {deleteConfirmIndex === idx ? (
              <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => deletePage(idx)} className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setDeleteConfirmIndex(null)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : pages.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); setDeleteConfirmIndex(idx); }}
                className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Inline add form */}
        {adding && (
          <div className="px-2 py-2 border-b border-slate-100">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addPage(); if (e.key === 'Escape') setAdding(false); }}
              placeholder="Page name"
              className="w-full border border-teal-400 rounded px-2 py-1 text-xs text-slate-800 outline-none bg-white mb-1.5 focus:ring-1 focus:ring-teal-100"
              autoFocus
            />
            <div className="flex gap-1">
              <button onClick={addPage} disabled={!newName.trim()}
                className="flex-1 text-[10px] bg-teal-600 hover:bg-teal-700 text-white rounded py-1 disabled:opacity-40 transition-colors">
                Add
              </button>
              <button onClick={() => setAdding(false)}
                className="flex-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded py-1 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
