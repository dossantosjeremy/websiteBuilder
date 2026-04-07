import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { uploadLimiter } from '@/lib/rate-limit';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? 'bin';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    // Rate limiting: 10 req/min per user
    const rateCheck = uploadLimiter(userId);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'X-RateLimit-Reset': rateCheck.reset.toISOString() },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const ext = getExtension(file.type);
    // Never trust the user-supplied filename — always generate a UUID-based name
    const filename = `${randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use Vercel Blob if token is available, otherwise fall back to local storage
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`uploads/${filename}`, buffer, {
        access: 'public',
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url, filename });
    } else {
      // Local dev fallback: save to /public/uploads/
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      const url = `/uploads/${filename}`;
      return NextResponse.json({ url, filename });
    }
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
