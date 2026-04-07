import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOrCreateDbUser } from '@/lib/auth';
import EditorShell from '@/components/editor/EditorShell';
import '../editor.css';

interface EditorPageProps {
  params: { projectId: string };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const projectId = parseInt(params.projectId, 10);
  if (isNaN(projectId)) {
    notFound();
  }

  const dbUser = await getOrCreateDbUser(user.id, user.email);
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, dbUser.id)));

  if (!project) {
    notFound();
  }

  return <EditorShell project={project} />;
}
