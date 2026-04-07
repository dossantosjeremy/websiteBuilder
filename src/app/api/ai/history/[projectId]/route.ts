import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { projects, aiChatHistory } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getOrCreateDbUser } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const projectId = parseInt(params.projectId);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const dbUser = await getOrCreateDbUser(userId);
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, dbUser.id)));

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(aiChatHistory)
      .where(eq(aiChatHistory.projectId, projectId))
      .orderBy(asc(aiChatHistory.createdAt))
      .limit(50);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('GET /api/ai/history/[projectId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
