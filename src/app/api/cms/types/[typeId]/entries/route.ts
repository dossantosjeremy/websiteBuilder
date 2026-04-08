import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cmsEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Ctx = { params: Promise<{ typeId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { typeId } = await ctx.params;
  const entries = await db
    .select()
    .from(cmsEntries)
    .where(eq(cmsEntries.typeId, Number(typeId)))
    .orderBy(cmsEntries.createdAt);
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { typeId } = await ctx.params;
  const { data } = await req.json() as { data: Record<string, unknown> };
  const [entry] = await db
    .insert(cmsEntries)
    .values({ typeId: Number(typeId), data })
    .returning();
  return NextResponse.json(entry, { status: 201 });
}
