import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cmsContentTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Ctx = { params: Promise<{ typeId: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { typeId } = await ctx.params;
  await db.delete(cmsContentTypes).where(eq(cmsContentTypes.id, Number(typeId)));
  return NextResponse.json({ ok: true });
}
