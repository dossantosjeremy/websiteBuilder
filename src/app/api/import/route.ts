import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { projects, projectVersions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOrCreateDbUser } from '@/lib/auth';
import JSZip from 'jszip';
import { parse } from 'parse5';
import type { PageData } from '@/components/editor/EditorContext';
import { randomUUID } from 'crypto';

function extractBodyAndStyles(htmlString: string): { htmlContent: string; cssContent: string } {
  const document = parse(htmlString);

  let htmlContent = '';
  let cssContent = '';

  // Recursively walk the parse5 tree
  function walk(node: ReturnType<typeof parse> & { childNodes?: unknown[] }) {
    const childNodes = node.childNodes as Array<{
      nodeName: string;
      tagName?: string;
      childNodes?: unknown[];
      value?: string;
      attrs?: Array<{ name: string; value: string }>;
    }> | undefined;

    if (!childNodes) return;

    for (const child of childNodes) {
      if (child.tagName === 'body') {
        // Serialize body inner HTML (parse5 does not have a built-in serializer for a fragment)
        // We'll use a simple recursive serializer
        htmlContent = serializeChildren(
          child.childNodes as Array<{
            nodeName: string;
            tagName?: string;
            childNodes?: unknown[];
            value?: string;
            attrs?: Array<{ name: string; value: string }>;
          }> ?? []
        );
      } else if (child.tagName === 'style') {
        const textNode = (child.childNodes ?? []) as Array<{ nodeName: string; value?: string }>;
        for (const t of textNode) {
          if (t.nodeName === '#text' && t.value) {
            cssContent += t.value;
          }
        }
      } else {
        walk(child as ReturnType<typeof parse> & { childNodes?: unknown[] });
      }
    }
  }

  walk(document as ReturnType<typeof parse> & { childNodes?: unknown[] });

  return { htmlContent, cssContent };
}

type SerializableNode = {
  nodeName: string;
  tagName?: string;
  childNodes?: unknown[];
  value?: string;
  attrs?: Array<{ name: string; value: string }>;
};

function serializeChildren(nodes: SerializableNode[]): string {
  return nodes.map(serializeNode).join('');
}

function serializeNode(node: SerializableNode): string {
  if (node.nodeName === '#text') return node.value ?? '';
  if (node.nodeName === '#comment') return `<!--${node.value ?? ''}-->`;
  if (!node.tagName) return '';

  const attrs = (node.attrs ?? [])
    .map((a) => ` ${a.name}="${a.value}"`)
    .join('');

  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);

  if (voidElements.has(node.tagName)) {
    return `<${node.tagName}${attrs}>`;
  }

  const inner = serializeChildren(
    (node.childNodes ?? []) as SerializableNode[]
  );
  return `<${node.tagName}${attrs}>${inner}</${node.tagName}>`;
}

function fileNameToPageName(filename: string): string {
  return filename
    .replace(/\/index\.html$/, '')
    .replace(/\.html$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Home';
}

function fileNameToSlug(filename: string): string {
  return filename
    .replace(/\/index\.html$/, '')
    .replace(/\.html$/, '')
    .replace(/\//g, '-') || 'home';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectIdRaw = formData.get('projectId') as string | null;

    if (!file || !projectIdRaw) {
      return NextResponse.json({ error: 'file and projectId are required' }, { status: 400 });
    }

    const projectId = parseInt(projectIdRaw);
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let newPages: PageData[] = [];

    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      // Single HTML file
      const htmlString = buffer.toString('utf-8');
      const { htmlContent, cssContent } = extractBodyAndStyles(htmlString);
      newPages = [
        {
          id: randomUUID(),
          name: 'Home',
          path: '/',
          components: htmlContent,
          styles: cssContent,
          meta: { title: 'Home', description: '', robots: 'index, follow' },
        } as PageData & { htmlContent: string; cssContent: string },
      ] as unknown as PageData[];
    } else if (fileName.endsWith('.zip')) {
      // ZIP file
      const zip = await JSZip.loadAsync(buffer);
      const htmlFiles: { path: string; content: string }[] = [];

      for (const [filePath, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir && (filePath.endsWith('.html') || filePath.endsWith('.htm'))) {
          const content = await zipEntry.async('string');
          htmlFiles.push({ path: filePath, content });
        }
      }

      // Sort so index.html comes first
      htmlFiles.sort((a, b) => {
        if (a.path === 'index.html') return -1;
        if (b.path === 'index.html') return 1;
        return a.path.localeCompare(b.path);
      });

      newPages = htmlFiles.map((f, i) => {
        const { htmlContent, cssContent } = extractBodyAndStyles(f.content);
        const isHome = f.path === 'index.html' || i === 0;
        return {
          id: randomUUID(),
          name: fileNameToPageName(f.path),
          path: isHome ? '/' : `/${fileNameToSlug(f.path)}`,
          components: htmlContent,
          styles: cssContent,
          meta: {
            title: fileNameToPageName(f.path),
            description: '',
            robots: 'index, follow',
          },
          isHome,
        } as PageData;
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a .html or .zip file.' },
        { status: 400 }
      );
    }

    // Persist snapshot before overwriting
    await db.insert(projectVersions).values({
      projectId: project.id,
      userId: dbUser.id,
      grapejsJson: project.grapejsJson as object,
      pages: project.pages as object[],
      label: 'Import',
      triggeredBy: 'import',
    });

    // Update project pages
    const [updatedProject] = await db
      .update(projects)
      .set({ pages: newPages as unknown as object[], updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({ project: updatedProject, pages: newPages });
  } catch (error) {
    console.error('POST /api/import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
