'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorContext } from './EditorContext';
import toast from 'react-hot-toast';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'page';
}

function buildHtmlDoc(title: string, html: string, css: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

export default function ExportButton() {
  const { editor, project, pages, currentPageIndex } = useEditorContext();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!editor) { toast.error('Editor not ready'); return; }
    setLoading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const zip = new JSZip();

      // Current page — use live editor data (always accurate)
      const liveHtml = editor.getHtml() as string;
      const liveCss = editor.getCss() as string;
      const currentPage = pages[currentPageIndex];
      const currentName = currentPage?.name ?? 'Home';

      zip.file(
        currentPageIndex === 0 ? 'index.html' : `${slugify(currentName)}/index.html`,
        buildHtmlDoc(currentName, liveHtml, liveCss)
      );

      // Other pages — use stored rendered HTML if available, else placeholder
      pages.forEach((page, i) => {
        if (i === currentPageIndex) return;
        const name = page.name ?? `page-${i}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storedHtml = (page as any).htmlContent ?? '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storedCss = (page as any).cssContent ?? '';
        const bodyHtml = storedHtml ||
          `<div style="font-family:sans-serif;padding:2rem;color:#64748b;">
  <h1 style="margin:0 0 .5rem">${name}</h1>
  <p>Switch to this page in the editor and re-export for full HTML.</p>
</div>`;
        zip.file(
          i === 0 ? 'index.html' : `${slugify(name)}/index.html`,
          buildHtmlDoc(name, bodyHtml, storedCss)
        );
      });

      // Standalone CSS for the current page
      zip.file('styles.css', liveCss);

      zip.file('README.md',
        `# ${project.name}\n\nExported ${new Date().toLocaleDateString()}.\n\n` +
        `## Pages\n${pages.map((p, i) => `- ${p.name ?? `page-${i}`}`).join('\n')}\n\n` +
        `> Tip: Switch to each page in the editor and export again for fully rendered HTML per page.\n`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${slugify(project.name)}.zip`);
      toast.success(`Exported ${pages.length} page${pages.length !== 1 ? 's' : ''} ✓`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed — check console');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
          onClick={handleExport} disabled={loading || !editor}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Export as ZIP (HTML + CSS)</TooltipContent>
    </Tooltip>
  );
}
