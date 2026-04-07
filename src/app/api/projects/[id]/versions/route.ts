import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { projects, projectVersions } from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { getLocalUser } from '@/lib/auth';

const createVersionSchema = z.object({
  grapejsJson: z.record(z.unknown()),
  pages: z.array(z.unknown()).optional(),
  label: z.string().optional(),
  triggeredBy: z.string().optional(),
});

const MAX_VERSIONS = 50;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // no auth check needed — local mode
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const dbUser = await getLocalUser();
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, dbUser.id)));

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const versions = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId))
      .orderBy(desc(projectVersions.createdAt))
      .limit(MAX_VERSIONS);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('GET /api/projects/[id]/versions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // no auth check needed — local mode
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const dbUser = await getLocalUser();
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, dbUser.id)));

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createVersionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }

    const { grapejsJson, pages, label, triggeredBy } = parsed.data;

    const [version] = await db
      .insert(projectVersions)
      .values({
        projectId,
        userId: dbUser.id,
        grapejsJson,
        pages: pages ?? [],
        label: label ?? null,
        triggeredBy: triggeredBy ?? 'manual',
      })
      .returning();

    // Prune to MAX_VERSIONS per project (keep most recent)
    const allVersions = await db
      .select({ id: projectVersions.id })
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId))
      .orderBy(asc(projectVersions.createdAt));

    if (allVersions.length > MAX_VERSIONS) {
      const toDelete = allVersions.slice(0, allVersions.length - MAX_VERSIONS);
      for (const v of toDelete) {
        await db.delete(projectVersions).where(eq(projectVersions.id, v.id));
      }
    }

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/versions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
