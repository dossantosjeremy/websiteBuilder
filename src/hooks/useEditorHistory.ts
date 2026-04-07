'use client';

import { useEffect, useState, useCallback } from 'react';

export function useEditorHistory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any | null
) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const refresh = useCallback(() => {
    if (!editor) return;
    try {
      const um = editor.UndoManager;
      if (!um) return;
      setCanUndo(um.hasUndo ? um.hasUndo() : false);
      setCanRedo(um.hasRedo ? um.hasRedo() : false);
      setUndoCount(um.getStack ? um.getStack().filter((s: unknown, i: number) => i < um.getPointer?.() + 1).length : 0);
      setRedoCount(um.getStack ? um.getStack().filter((s: unknown, i: number) => i > (um.getPointer?.() ?? 0)).length : 0);
    } catch {
      // ignore
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.on('component:add', refresh);
    editor.on('component:remove', refresh);
    editor.on('component:update', refresh);
    editor.on('style:change', refresh);
    editor.on('undo', refresh);
    editor.on('redo', refresh);

    return () => {
      editor.off('component:add', refresh);
      editor.off('component:remove', refresh);
      editor.off('component:update', refresh);
      editor.off('style:change', refresh);
      editor.off('undo', refresh);
      editor.off('redo', refresh);
    };
  }, [editor, refresh]);

  const undo = useCallback(() => {
    if (editor) {
      editor.UndoManager?.undo();
      refresh();
    }
  }, [editor, refresh]);

  const redo = useCallback(() => {
    if (editor) {
      editor.UndoManager?.redo();
      refresh();
    }
  }, [editor, refresh]);

  return { canUndo, canRedo, undoCount, redoCount, undo, redo };
}
