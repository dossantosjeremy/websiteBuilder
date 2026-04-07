import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { projects, deployments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getOrCreateDbUser } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const dbUser = await getOrCreateDbUser(userId);

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, dbUser.id)));

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectDeployments = await db
      .select()
      .from(deployments)
      .where(eq(deployments.projectId, projectId))
      .orderBy(desc(deployments.deployedAt));

    return NextResponse.json({ deployments: projectDeployments });
  } catch (error) {
    console.error('GET /api/projects/[id]/deployments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
