'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorContext } from './EditorContext';
import type { PageData } from './EditorContext';
import toast from 'react-hot-toast';

export default function ImportButton() {
  const { project, editor, setPages } = useEditorContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', String(project.id));

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Import failed' }));
        throw new Error((err as { error?: string }).error ?? 'Import failed');
      }

      const data = await res.json() as { pages: PageData[] };
      const importedPages = data.pages;

      // Update editor context with imported pages
      setPages(importedPages);

      // Reload GrapesJS canvas with the first page content
      if (editor && importedPages.length > 0) {
        const firstPage = importedPages[0];
        const content = firstPage.components;
        if (typeof content === 'string' && content.trim()) {
          editor.setComponents(content);
        } else if (Array.isArray(content)) {
          editor.setComponents(content);
        }
        const styles = firstPage.styles;
        if (typeof styles === 'string' && styles.trim()) {
          editor.setCss(styles);
        }
      }

      toast.success('Import successful');
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Import failed');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <input
            ref={inputRef}
            type="file"
            accept=".zip,.html,.htm"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Import HTML / ZIP</TooltipContent>
    </Tooltip>
  );
}
