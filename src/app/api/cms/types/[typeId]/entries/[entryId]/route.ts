import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cmsEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

type Ctx = { params: Promise<{ typeId: string; entryId: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { entryId } = await ctx.params;
  const { data } = await req.json() as { data: Record<string, unknown> };
  const [entry] = await db
    .update(cmsEntries)
    .set({ data, updatedAt: sql`NOW()` })
    .where(eq(cmsEntries.id, Number(entryId)))
    .returning();
  return NextResponse.json(entry);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { entryId } = await ctx.params;
  await db.delete(cmsEntries).where(eq(cmsEntries.id, Number(entryId)));
  return NextResponse.json({ ok: true });
}
