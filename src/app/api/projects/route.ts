import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { slugify, generateId } from '@/lib/utils';
import { getOrCreateDbUser } from '@/lib/auth';
import { isValidProjectName, isValidSlug } from '@/lib/sanitize';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
});

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const dbUser = await getOrCreateDbUser(userId);
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, dbUser.id))
      .orderBy(projects.updatedAt);

    return NextResponse.json({ projects: userProjects });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, slug: providedSlug } = parsed.data;

    // Additional validation
    if (!isValidProjectName(name)) {
      return NextResponse.json({ error: 'Invalid project name. Must be 1-100 characters.' }, { status: 400 });
    }
    if (providedSlug && !isValidSlug(providedSlug)) {
      return NextResponse.json({ error: 'Invalid slug. Use only lowercase letters, numbers, and hyphens (max 100 chars).' }, { status: 400 });
    }

    const dbUser = await getOrCreateDbUser(userId);

    // Generate slug from name if not provided
    let slug = providedSlug ? slugify(providedSlug) : slugify(name);
    // Append random ID to ensure uniqueness
    slug = `${slug}-${generateId()}`;

    const [project] = await db
      .insert(projects)
      .values({
        userId: dbUser.id,
        name,
        slug,
        grapejsJson: {},
        pages: [],
        meta: {},
      })
      .returning();

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
