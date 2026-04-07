import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOrCreateDbUser } from '@/lib/auth';
import JSZip from 'jszip';
import type { PageData } from '@/components/editor/EditorContext';

function buildPageHtml(page: PageData): string {
  const meta = page.meta ?? {};
  const title = meta.title || page.name || 'Untitled';
  const description = meta.description ?? '';
  const canonical = (meta as { canonical?: string }).canonical ?? '';
  const robots = (meta as { robots?: string }).robots ?? 'index, follow';
  const ogImage = meta.ogImage ?? '';

  // Use pre-rendered HTML/CSS strings when available, otherwise serialize JSON
  const htmlContent =
    (page as PageData & { htmlContent?: string }).htmlContent ??
    (typeof page.components === 'string' ? page.components : JSON.stringify(page.components ?? []));
  const cssContent =
    (page as PageData & { cssContent?: string }).cssContent ??
    (typeof page.styles === 'string' ? page.styles : '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ''}
  <meta name="robots" content="${escapeHtml(robots)}">
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ''}
  <style>${cssContent}</style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const body = await request.json();
    const projectId = parseInt(body.projectId);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
    }

    const dbUser = await getOrCreateDbUser(userId);
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, dbUser.id)));

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const pages = (project.pages as PageData[] | null) ?? [];
    const zip = new JSZip();

    if (pages.length === 0) {
      // Export grapejsJson as a single index.html if no pages are defined
      zip.file(
        'index.html',
        `<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(project.name)}</title></head><body></body></html>`
      );
    } else {
      pages.forEach((page, index) => {
        const html = buildPageHtml(page);
        if (index === 0 || page.path === '/' || (page as PageData & { isHome?: boolean }).isHome) {
          zip.file('index.html', html);
        } else {
          const folderName = slugify(page.name || `page-${index}`);
          zip.file(`${folderName}/index.html`, html);
        }
      });
    }

    // Add a README
    zip.file(
      'README.md',
      `# ${project.name}\n\nExported from Website Builder on ${new Date().toISOString().split('T')[0]}.\n\n## Structure\n\n- \`index.html\` — Home page\n- \`<page-name>/index.html\` — Additional pages\n\nAll styles are inlined. Images reference their original URLs.\n`
    );

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    return new NextResponse(zipBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project.slug}.zip"`,
      },
    });
  } catch (error) {
    console.error('POST /api/export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
