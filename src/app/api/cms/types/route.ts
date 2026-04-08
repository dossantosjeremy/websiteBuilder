import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cmsContentTypes, cmsEntries } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  const types = await db
    .select({
      id: cmsContentTypes.id,
      name: cmsContentTypes.name,
      slug: cmsContentTypes.slug,
      fields: cmsContentTypes.fields,
      createdAt: cmsContentTypes.createdAt,
      entryCount: sql<number>`(SELECT COUNT(*) FROM cms_entries WHERE type_id = ${cmsContentTypes.id})::int`,
    })
    .from(cmsContentTypes)
    .orderBy(cmsContentTypes.createdAt);

  return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
  const { name, fields } = await req.json() as { name: string; fields: unknown[] };
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const [type] = await db
    .insert(cmsContentTypes)
    .values({ name, slug, fields })
    .returning();
  return NextResponse.json(type, { status: 201 });
}
