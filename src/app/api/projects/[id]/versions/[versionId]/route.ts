import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { projects, projectVersions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOrCreateDbUser } from '@/lib/auth';

export async function GET(
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

    return NextResponse.json({ version });
  } catch (error) {
    console.error('GET /api/projects/[id]/versions/[versionId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
