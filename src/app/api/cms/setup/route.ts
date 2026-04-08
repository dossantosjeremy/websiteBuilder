import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cms_content_types (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        slug       TEXT UNIQUE NOT NULL,
        fields     JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cms_entries (
        id           SERIAL PRIMARY KEY,
        type_id      INTEGER REFERENCES cms_content_types(id) ON DELETE CASCADE,
        data         JSONB NOT NULL DEFAULT '{}',
        published_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
