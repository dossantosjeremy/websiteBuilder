import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { projects, projectVersions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOrCreateDbUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const projectId = parseInt(params.id);
    const versionId = parseInt(params.versionId);
    if (isNaN(projectId) || isNaN(versionId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const dbUser = await getOrCreateDbUser(userId);
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, dbUser.id)));

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const [version] = await db
      .select()
      .from(projectVersions)
      .where(and(eq(projectVersions.id, versionId), eq(projectVersions.projectId, projectId)));

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Save a snapshot of the CURRENT state before restoring
    await db.insert(projectVersions).values({
      projectId,
      userId: dbUser.id,
      grapejsJson: project.grapejsJson as Record<string, unknown>,
      pages: project.pages as unknown[],
      label: 'Pre-restore snapshot',
      triggeredBy: 'restore',
    });

    // Restore the project to the target version
    const [restoredProject] = await db
      .update(projects)
      .set({
        grapejsJson: version.grapejsJson as Record<string, unknown>,
        pages: version.pages as unknown[],
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({ project: restoredProject, restoredVersion: version });
  } catch (error) {
    console.error('POST /api/projects/[id]/versions/[versionId]/restore error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
