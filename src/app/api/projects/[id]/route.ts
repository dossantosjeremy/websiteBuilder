import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { projects, projectVersions, deployments, aiChatHistory } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getLocalUser } from '@/lib/auth';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  grapejsJson: z.record(z.unknown()).optional(),
  pages: z.array(z.unknown()).optional(),
  meta: z.record(z.unknown()).optional(),
});

async function getProjectForUser(projectId: number) {
  const dbUser = await getLocalUser();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, dbUser.id)));
  return { project, dbUser };
}

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

    const { project } = await getProjectForUser(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const [versionsCount] = await db
      .select({ count: count() })
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId));

    return NextResponse.json({ project, versionsCount: versionsCount?.count ?? 0 });
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // no auth check needed — local mode
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { project } = await getProjectForUser(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.grapejsJson !== undefined) updateData.grapejsJson = parsed.data.grapejsJson;
    if (parsed.data.pages !== undefined) updateData.pages = parsed.data.pages;
    if (parsed.data.meta !== undefined) updateData.meta = parsed.data.meta;

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('PUT /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // no auth check needed — local mode
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { project } = await getProjectForUser(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Cascade delete
    await db.delete(aiChatHistory).where(eq(aiChatHistory.projectId, projectId));
    await db.delete(deployments).where(eq(deployments.projectId, projectId));
    await db.delete(projectVersions).where(eq(projectVersions.projectId, projectId));
    await db.delete(projects).where(eq(projects.id, projectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
