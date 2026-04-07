'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Bookmark,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorContext } from './EditorContext';
import VersionHistoryDrawer from './VersionHistoryDrawer';
import SaveVersionDialog from './SaveVersionDialog';
import AutosaveIndicator from './AutosaveIndicator';
import UndoRedoButtons from './UndoRedoButtons';
import ExportButton from './ExportButton';
import ImportButton from './ImportButton';
import DeployButton from './DeployButton';
import PagesModal from './PagesModal';

export default function EditorTopBar() {
  const { editor, project, isSaving, lastSaved, saveProject } = useEditorContext();
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pagesModalOpen, setPagesModalOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Suppress unused variable warning — editor is kept for potential future use
  void editor;

  const handleNameBlur = async () => {
    setEditingName(false);
    if (projectName !== project.name && projectName.trim()) {
      try {
        await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: projectName.trim() }),
        });
      } catch {
        // ignore
      }
    }
  };

  const handleSaveVersion = async (label: string) => {
    setSaveDialogOpen(false);
    await saveProject({ createVersion: true, versionLabel: label });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-[60px] bg-[hsl(0,0%,8%)] border-b border-[hsl(0,0%,18%)] flex items-center px-3 gap-2 shrink-0">
        {/* Left section */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Back to Dashboard</TooltipContent>
          </Tooltip>

          <div className="w-6 h-6 bg-[hsl(221,83%,53%)] rounded flex items-center justify-center text-white font-bold text-xs shrink-0">
            W
          </div>

          {editingName ? (
            <input
              ref={nameInputRef}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') nameInputRef.current?.blur();
                if (e.key === 'Escape') {
                  setProjectName(project.name);
                  setEditingName(false);
                }
              }}
              className="bg-[hsl(0,0%,14%)] border border-[hsl(0,0%,25%)] rounded px-2 py-1 text-sm text-[hsl(0,0%,95%)] outline-none focus:ring-1 focus:ring-[hsl(221,83%,53%)] max-w-[200px]"
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-medium truncate cursor-pointer hover:text-[hsl(221,83%,65%)] transition-colors max-w-[200px]"
              onClick={() => setEditingName(true)}
              title="Click to rename"
            >
              {projectName}
            </span>
          )}

          {/* Pages button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1"
                onClick={() => setPagesModalOpen(true)}
              >
                <FileText className="h-4 w-4" />
                <span className="text-xs">Pages</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage Pages</TooltipContent>
          </Tooltip>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 flex-1 justify-end">
          {/* Undo/Redo */}
          <UndoRedoButtons editor={editor} />

          <div className="h-4 w-px bg-[hsl(0,0%,20%)] mx-1" />

          {/* Version History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setVersionDrawerOpen(true)}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Version History</TooltipContent>
          </Tooltip>

          {/* Save Version */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save Version</TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-[hsl(0,0%,20%)] mx-1" />

          {/* Export */}
          <ExportButton />

          {/* Import */}
          <ImportButton />

          <div className="h-4 w-px bg-[hsl(0,0%,20%)] mx-1" />

          {/* Deploy */}
          <DeployButton />

          <div className="h-4 w-px bg-[hsl(0,0%,20%)] mx-1" />

          {/* Autosave status */}
          <AutosaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
        </div>
      </header>

      <VersionHistoryDrawer
        open={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
      />

      <SaveVersionDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveVersion}
        isSaving={isSaving}
      />

      <PagesModal
        open={pagesModalOpen}
        onClose={() => setPagesModalOpen(false)}
      />
    </TooltipProvider>
  );
}
