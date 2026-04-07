import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/lib/db/schema';

const LOCAL_USER_ID = 'local';
const LOCAL_USER_EMAIL = 'local@localhost';

// Single local user — no Supabase auth required
export async function getLocalUser(): Promise<User> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, LOCAL_USER_ID));

  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({ authUserId: LOCAL_USER_ID, email: LOCAL_USER_EMAIL })
    .returning();

  return created;
}

// Keep for any legacy callsites
export async function getOrCreateDbUser(supabaseUserId: string, email?: string): Promise<User> {
  return getLocalUser();
}
