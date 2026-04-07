'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from 'react';
import { StudioEditor as StudioEditorBase } from '@grapesjs/studio-sdk/react';
import { useEditorContext } from './EditorContext';
import '@grapesjs/studio-sdk/style';

// Cast to avoid nested @types/react version mismatch between studio-sdk and project
const StudioEditor = StudioEditorBase as any;

export default function StudioWrapper() {
  const { setEditor, project } = useEditorContext();
  const initialProjectData = useRef(
    (project.grapejsJson as any) ?? undefined
  );

  return (
    <StudioEditor
      style={{ flex: 1, height: '100%', minWidth: 0 }}
      options={{
        licenseKey: process.env.NEXT_PUBLIC_GRAPESJS_LICENSE_KEY ?? '',
        storage: {
          type: 'self',
          autosaveChanges: 10,
          autosaveIntervalMs: 30000,
          // Pass existing project data directly (skips onLoad call)
          project: initialProjectData.current,
          onSave: async ({ project: projectData }: { project: any }) => {
            await fetch(`/api/projects/${project.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ grapejsJson: projectData }),
            });
          },
          onLoad: async () => {
            // Fallback: fetch from API
            const res = await fetch(`/api/projects/${project.id}`);
            if (!res.ok) return { project: {} };
            const data = await res.json();
            return { project: data.grapejsJson ?? {} };
          },
        },
        assets: {
          storageType: 'self',
          onUpload: async ({ files }: { files: File[] }) => {
            const results = await Promise.all(
              files.map(async (file: File) => {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Upload failed');
                const json = await res.json();
                return {
                  id: json.url ?? crypto.randomUUID(),
                  src: json.url,
                  name: file.name,
                  mimeType: file.type,
                  size: file.size,
                };
              })
            );
            return results;
          },
        },
      }}
      onEditor={(editor: any) => {
        setEditor(editor);
      }}
    />
  );
}
