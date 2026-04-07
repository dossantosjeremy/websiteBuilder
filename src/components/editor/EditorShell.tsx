'use client';

import { useEffect, useState } from 'react';
import type { Project } from '@/types';
import { EditorProvider, useEditorContext } from './EditorContext';
import EditorTopBar from './EditorTopBar';
import EditorLayout from './EditorLayout';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import { useKeyboardShortcutsV2 } from '@/hooks/useKeyboardShortcuts';

function AutosaveEffect() {
  const { saveProject, editor } = useEditorContext();

  useEffect(() => {
    const interval = setInterval(() => {
      if (editor) {
        saveProject(); // no version snapshot — just updates grapesjs_json + pages
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [editor, saveProject]);

  return null;
}

function KeyboardShortcutsManager() {
  const { saveProject, editor } = useEditorContext();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcutsV2([
    {
      key: 's',
      metaKey: true,
      action: () => saveProject({ createVersion: false }),
      description: 'Save project',
    },
    {
      key: '?',
      action: () => setShortcutsOpen(true),
      description: 'Show keyboard shortcuts',
    },
    {
      key: 'z',
      metaKey: true,
      action: () => editor?.UndoManager?.undo(),
      description: 'Undo',
    },
    {
      key: 'z',
      metaKey: true,
      shiftKey: true,
      action: () => editor?.UndoManager?.redo(),
      description: 'Redo',
    },
  ]);

  return (
    <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
  );
}

interface EditorShellProps {
  project: Project;
}

export default function EditorShell({ project }: EditorShellProps) {
  return (
    <EditorProvider project={project}>
      <AutosaveEffect />
      <KeyboardShortcutsManager />
      <div className="flex flex-col h-screen overflow-hidden bg-[hsl(0,0%,8%)] text-[hsl(0,0%,95%)]">
        <EditorTopBar />
        <EditorLayout />
      </div>
    </EditorProvider>
  );
}
