'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import type { Project, ProjectVersion } from '@/types';
import toast from 'react-hot-toast';

export interface PageData {
  id: string;
  name: string;
  path: string;
  components: unknown;
  styles: unknown;
  meta: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
    robots?: string;
  };
}

export interface EditorContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setEditor: (e: any) => void;
  project: Project;
  currentPageIndex: number;
  setCurrentPageIndex: (i: number) => void;
  pages: PageData[];
  setPages: (pages: PageData[]) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  versions: ProjectVersion[];
  setVersions: (v: ProjectVersion[]) => void;
  saveProject: (opts?: { createVersion?: boolean; versionLabel?: string; triggeredBy?: string }) => Promise<void>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  children,
  project: initialProject,
}: {
  children: React.ReactNode;
  project: Project;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editor, setEditorState] = useState<any | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const editorRef = useRef(editor);

  // Initialize pages from project data
  const initPages = (): PageData[] => {
    const rawPages = initialProject.pages as PageData[] | null;
    if (rawPages && Array.isArray(rawPages) && rawPages.length > 0) {
      return rawPages;
    }
    return [
      {
        id: 'home',
        name: 'Home',
        path: '/',
        components: [],
        styles: [],
        meta: {
          title: initialProject.name,
          description: '',
          ogImage: '',
          canonical: '',
          robots: 'index, follow',
        },
      },
    ];
  };

  const [pages, setPages] = useState<PageData[]>(initPages);

  const setEditor = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      editorRef.current = e;
      setEditorState(e);
    },
    []
  );

  const saveProject = useCallback(
    async (opts?: { createVersion?: boolean; versionLabel?: string; triggeredBy?: string }) => {
      const currentEditor = editorRef.current;
      setIsSaving(true);
      try {
        // Get the current page's JSON from GrapesJS
        let currentPages = pages;
        if (currentEditor) {
          const components = currentEditor.getComponents().toJSON();
          const styles = currentEditor.getCss
            ? currentEditor.getCss()
            : currentEditor.getStyle?.().toJSON() ?? [];
          currentPages = pages.map((p, i) =>
            i === currentPageIndex
              ? { ...p, components, styles }
              : p
          );
        }

        // Build grapejsJson from current page
        const grapejsJson =
          currentPages[currentPageIndex]
            ? {
                components: currentPages[currentPageIndex].components,
                styles: currentPages[currentPageIndex].styles,
              }
            : {};

        const res = await fetch(`/api/projects/${initialProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grapejsJson,
            pages: currentPages,
          }),
        });

        if (!res.ok) {
          throw new Error('Save failed');
        }

        if (opts?.createVersion) {
          const versionRes = await fetch(
            `/api/projects/${initialProject.id}/versions`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                grapejsJson,
                pages: currentPages,
                label: opts.versionLabel ?? undefined,
                triggeredBy: opts.triggeredBy ?? 'manual',
              }),
            }
          );
          if (!versionRes.ok) {
            throw new Error('Version creation failed');
          }
          const versionData = await versionRes.json();
          if (versionData.version) {
            setVersions((prev) => [versionData.version, ...prev].slice(0, 50));
          }
          toast.success('Version saved!');
        }

        setLastSaved(new Date());
        setPages(currentPages);
      } catch (err) {
        console.error('Save error:', err);
        toast.error('Failed to save project');
      } finally {
        setIsSaving(false);
      }
    },
    [initialProject.id, pages, currentPageIndex]
  );

  const value: EditorContextValue = {
    editor,
    setEditor,
    project: initialProject,
    currentPageIndex,
    setCurrentPageIndex,
    pages,
    setPages,
    isSaving,
    lastSaved,
    versions,
    setVersions,
    saveProject,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorContext() {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditorContext must be used within EditorProvider');
  }
  return ctx;
}
