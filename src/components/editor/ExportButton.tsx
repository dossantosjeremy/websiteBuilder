'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorContext } from './EditorContext';
import toast from 'react-hot-toast';

export default function ExportButton() {
  const { project } = useEditorContext();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: String(project.id) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error((err as { error?: string }).error ?? 'Export failed');
      }

      const blob = await res.blob();

      // Use file-saver to trigger download
      const { saveAs } = await import('file-saver');
      saveAs(blob, `${project.slug}.zip`);

      toast.success('Export downloaded!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Export ZIP</TooltipContent>
    </Tooltip>
  );
}
