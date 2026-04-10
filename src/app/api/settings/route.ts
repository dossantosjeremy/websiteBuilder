import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getLocalUser } from '@/lib/auth';

export interface SettingsData {
  vercelToken?: string;
  aiProvider?: 'anthropic' | 'openai';
  aiApiKey?: string;
}

async function ensureTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      data       JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET() {
  try {
    await ensureTable();
    const user = await getLocalUser();
    const [row] = await db.select().from(appSettings).where(eq(appSettings.userId, user.id));
    return NextResponse.json((row?.data ?? {}) as SettingsData);
  } catch (e) {
    return NextResponse.json({}, { status: 200 }); // always return an object even on error
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureTable();
    const user = await getLocalUser();
    const data = await req.json() as SettingsData;
    await db
      .insert(appSettings)
      .values({ userId: user.id, data })
      .onConflictDoUpdate({ target: appSettings.userId, set: { data, updatedAt: sql`NOW()` } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
