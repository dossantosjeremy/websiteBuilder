import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { projects, projectVersions, deployments } from '@/lib/db/schema';
import { deployLimiter } from '@/lib/rate-limit';
import { eq, and } from 'drizzle-orm';
import { getOrCreateDbUser } from '@/lib/auth';
import type { PageData } from '@/components/editor/EditorContext';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildPageHtml(page: PageData, projectName: string): string {
  const meta = page.meta ?? {};
  const title = meta.title || page.name || projectName;
  const description = meta.description ?? '';
  const canonical = (meta as { canonical?: string }).canonical ?? '';
  const robots = (meta as { robots?: string }).robots ?? 'index, follow';
  const ogImage = meta.ogImage ?? '';

  const htmlContent =
    (page as PageData & { htmlContent?: string }).htmlContent ??
    (typeof page.components === 'string'
      ? page.components
      : JSON.stringify(page.components ?? []));
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

    // Rate limiting: 10 req/min per user
    const rateCheck = deployLimiter(userId);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many deploy requests. Please try again later.' },
        {
          status: 429,
          headers: { 'X-RateLimit-Reset': rateCheck.reset.toISOString() },
        }
      );
    }

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

    // Step 2: Write pre-deploy version snapshot
    await db.insert(projectVersions).values({
      projectId: project.id,
      userId: dbUser.id,
      grapejsJson: project.grapejsJson as object,
      pages: project.pages as object[],
      label: 'Pre-deploy snapshot',
      triggeredBy: 'deploy',
    });

    // Step 3: Build static site files
    const pages = (project.pages as PageData[] | null) ?? [];
    const files: Record<string, string> = {};

    if (pages.length === 0) {
      files['index.html'] = `<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(project.name)}</title></head><body></body></html>`;
    } else {
      pages.forEach((page, index) => {
        const html = buildPageHtml(page, project.name);
        if (index === 0 || page.path === '/' || (page as PageData & { isHome?: boolean }).isHome) {
          files['index.html'] = html;
        } else {
          const folderName = slugify(page.name || `page-${index}`);
          files[`${folderName}/index.html`] = html;
        }
      });
    }

    // Step 4: Call Vercel Deploy API
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      return NextResponse.json(
        { error: 'VERCEL_TOKEN is not configured. Set it in your environment variables.' },
        { status: 500 }
      );
    }

    const deployPayload = {
      name: project.slug,
      files: Object.entries(files).map(([file, data]) => ({
        file,
        data,
        encoding: 'utf-8',
      })),
      projectSettings: {
        framework: null,
        buildCommand: null,
        outputDirectory: null,
      },
      target: 'production',
    };

    const vercelRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deployPayload),
    });

    // Step 5: Surface Vercel errors
    if (!vercelRes.ok) {
      const vercelError = await vercelRes.json().catch(() => ({ error: { message: 'Unknown Vercel error' } }));
      const msg =
        (vercelError as { error?: { message?: string } })?.error?.message ??
        `Vercel API error (${vercelRes.status})`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const vercelData = await vercelRes.json() as {
      id: string;
      url: string;
      status?: string;
    };

    const deploymentUrl = vercelData.url ? `https://${vercelData.url}` : null;

    // Step 6: Save deployment record
    const [deployment] = await db
      .insert(deployments)
      .values({
        projectId: project.id,
        vercelDeploymentId: vercelData.id,
        url: deploymentUrl,
        status: 'deploying',
      })
      .returning();

    // Step 7: Return deployment info
    return NextResponse.json({
      deploymentId: vercelData.id,
      url: deploymentUrl,
      status: 'deploying',
      dbDeploymentId: deployment.id,
    });
  } catch (error) {
    console.error('POST /api/deploy error:', error);
    return NextResponse.json({ error: 'Deploy failed' }, { status: 500 });
  }
}
