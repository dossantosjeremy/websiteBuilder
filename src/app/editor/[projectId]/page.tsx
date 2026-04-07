import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getLocalUser } from '@/lib/auth';
import EditorShell from '@/components/editor/EditorShell';
import '../editor.css';

interface EditorPageProps {
  params: { projectId: string };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const projectId = parseInt(params.projectId, 10);
  if (isNaN(projectId)) notFound();

  const localUser = await getLocalUser();

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, localUser.id)));

  if (!project) notFound();

  return <EditorShell project={project} />;
}
