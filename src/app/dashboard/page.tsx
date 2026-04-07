import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getLocalUser } from '@/lib/auth';
import type { Project } from '@/types';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const localUser = await getLocalUser();

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, localUser.id))
    .orderBy(projects.updatedAt);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,8%)] text-[hsl(0,0%,95%)]">
      <header className="border-b border-[hsl(0,0%,18%)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-[hsl(221,83%,53%)] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <span className="font-semibold text-lg">WebBuilder</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">My Websites</h1>
          <p className="text-[hsl(0,0%,55%)]">Manage and create your website projects</p>
        </div>
        <DashboardClient initialProjects={userProjects as Project[]} />
      </main>
    </div>
  );
}
