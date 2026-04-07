import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/lib/db/schema';

export async function getCurrentUser(): Promise<{ supabaseUser: any; dbUser: User }> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated');
  }

  const dbUser = await getOrCreateDbUser(user.id, user.email);
  return { supabaseUser: user, dbUser };
}

export async function getOrCreateDbUser(supabaseUserId: string, email?: string): Promise<User> {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, supabaseUserId));

  if (existingUser) return existingUser;

  const [newUser] = await db
    .insert(users)
    .values({ authUserId: supabaseUserId, email: email ?? null })
    .returning();

  return newUser;
}
