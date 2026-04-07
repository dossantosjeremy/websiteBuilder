import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateDbUser } from '@/lib/auth';
import type { Project } from '@/types';
import DashboardClient from './DashboardClient';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const dbUser = await getOrCreateDbUser(user.id, user.email);

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, dbUser.id))
    .orderBy(projects.updatedAt);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,8%)] text-[hsl(0,0%,95%)]">
      {/* Header */}
      <header className="border-b border-[hsl(0,0%,18%)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[hsl(221,83%,53%)] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              W
            </div>
            <span className="font-semibold text-lg">WebBuilder</span>
          </div>
          <div className="flex items-center gap-4">
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-[hsl(0,0%,55%)]">Manage and create your website projects</p>
          </div>
        </div>

        <DashboardClient initialProjects={userProjects as Project[]} />
      </main>
    </div>
  );
}
