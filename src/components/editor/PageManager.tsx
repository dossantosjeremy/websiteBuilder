'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useEditorContext, type PageData } from './EditorContext';
import { v4 as uuidv4 } from 'uuid';

export default function PageManager() {
  const { editor, pages, setPages, currentPageIndex, setCurrentPageIndex } = useEditorContext();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPagePath, setNewPagePath] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const saveCurrentPageToContext = () => {
    if (!editor) return pages;
    const components = editor.getComponents().toJSON();
    const styles = editor.getStyle().toJSON();
    return pages.map((p, i) =>
      i === currentPageIndex ? { ...p, components, styles } : p
    );
  };

  const handleSwitchPage = (index: number) => {
    if (index === currentPageIndex) return;
    const updatedPages = saveCurrentPageToContext();
    setPages(updatedPages);

    const targetPage = updatedPages[index];
    if (editor && targetPage) {
      editor.setComponents(targetPage.components ?? []);
      editor.setStyle(targetPage.styles ?? []);
    }
    setCurrentPageIndex(index);
  };

  const handleAddPage = () => {
    if (!newPageName.trim()) return;
    const path = newPagePath.trim() || `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`;
    const newPage: PageData = {
      id: uuidv4(),
      name: newPageName.trim(),
      path,
      components: [],
      styles: [],
      meta: { title: newPageName.trim(), robots: 'index, follow' },
    };
    const updatedPages = saveCurrentPageToContext();
    setPages([...updatedPages, newPage]);
    setNewPageName('');
    setNewPagePath('');
    setAddDialogOpen(false);
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    const updatedPages = pages.filter((_, i) => i !== index);
    setPages(updatedPages);
    if (currentPageIndex >= updatedPages.length) {
      const newIndex = updatedPages.length - 1;
      setCurrentPageIndex(newIndex);
      if (editor) {
        editor.setComponents(updatedPages[newIndex]?.components ?? []);
        editor.setStyle(updatedPages[newIndex]?.styles ?? []);
      }
    } else if (currentPageIndex === index) {
      const newIndex = Math.max(0, index - 1);
      setCurrentPageIndex(newIndex);
      if (editor) {
        editor.setComponents(updatedPages[newIndex]?.components ?? []);
        editor.setStyle(updatedPages[newIndex]?.styles ?? []);
      }
    }
    setDeleteConfirmIndex(null);
  };

  const handleRenameStart = (index: number) => {
    setEditingIndex(index);
    setEditingName(pages[index].name);
  };

  const handleRenameCommit = (index: number) => {
    if (!editingName.trim()) {
      setEditingIndex(null);
      return;
    }
    const updated = pages.map((p, i) =>
      i === index ? { ...p, name: editingName.trim() } : p
    );
    setPages(updated);
    setEditingIndex(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= pages.length) return;
    const updated = [...pages];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setPages(updated);
    if (currentPageIndex === index) setCurrentPageIndex(swapIndex);
    else if (currentPageIndex === swapIndex) setCurrentPageIndex(index);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(0,0%,18%)]">
        <span className="text-xs font-medium text-[hsl(0,0%,55%)] uppercase tracking-wide">
          Pages
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`group flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors ${
              index === currentPageIndex
                ? 'bg-[hsl(221,83%,53%)]/15 text-[hsl(221,83%,65%)]'
                : 'hover:bg-[hsl(0,0%,13%)] text-[hsl(0,0%,75%)]'
            }`}
            onClick={() => handleSwitchPage(index)}
          >
            {/* Move buttons */}
            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="h-3 w-3 flex items-center justify-center hover:text-white"
                onClick={(e) => { e.stopPropagation(); handleMove(index, 'up'); }}
                disabled={index === 0}
              >
                <ChevronUp className="h-2.5 w-2.5" />
              </button>
              <button
                className="h-3 w-3 flex items-center justify-center hover:text-white"
                onClick={(e) => { e.stopPropagation(); handleMove(index, 'down'); }}
                disabled={index === pages.length - 1}
              >
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </div>

            {/* Name (editable on double-click) */}
            <div className="flex-1 min-w-0" onDoubleClick={(e) => { e.stopPropagation(); handleRenameStart(index); }}>
              {editingIndex === index ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleRenameCommit(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameCommit(index);
                    if (e.key === 'Escape') setEditingIndex(null);
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-[hsl(0,0%,14%)] border border-[hsl(221,83%,53%)] rounded px-1 py-0 text-xs outline-none"
                  autoFocus
                />
              ) : (
                <div>
                  <div className="text-xs font-medium truncate">{page.name}</div>
                  <div className="text-[10px] text-[hsl(0,0%,40%)] truncate">{page.path}</div>
                </div>
              )}
            </div>

            {/* Delete or confirm */}
            {deleteConfirmIndex === index ? (
              <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                <button
                  className="h-5 w-5 flex items-center justify-center text-red-400 hover:text-red-300"
                  onClick={() => handleDeletePage(index)}
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  className="h-5 w-5 flex items-center justify-center text-[hsl(0,0%,45%)] hover:text-white"
                  onClick={() => setDeleteConfirmIndex(null)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              pages.length > 1 && (
                <button
                  className="h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(0,0%,45%)] hover:text-red-400"
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmIndex(index); }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {/* Add Page Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs text-[hsl(0,0%,55%)] mb-1">Page Name</label>
              <Input
                placeholder="e.g. About"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-[hsl(0,0%,55%)] mb-1">
                Path <span className="text-[hsl(0,0%,40%)]">(optional)</span>
              </label>
              <Input
                placeholder="e.g. /about"
                value={newPagePath}
                onChange={(e) => setNewPagePath(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddPage(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" onClick={handleAddPage} disabled={!newPageName.trim()}>
              Add Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
