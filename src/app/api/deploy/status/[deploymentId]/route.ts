import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { deploymentId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { deploymentId } = params;
    if (!deploymentId) {
      return NextResponse.json({ error: 'Missing deploymentId' }, { status: 400 });
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      return NextResponse.json({ error: 'VERCEL_TOKEN not configured' }, { status: 500 });
    }

    const vercelRes = await fetch(
      `https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}`,
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      }
    );

    if (!vercelRes.ok) {
      const err = await vercelRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { error?: { message?: string } })?.error?.message ?? 'Failed to fetch deployment status' },
        { status: vercelRes.status }
      );
    }

    const data = await vercelRes.json() as {
      status?: string;
      readyState?: string;
      url?: string;
    };

    // Vercel uses `readyState` in some API versions and `status` in others
    const status = data.readyState ?? data.status ?? 'UNKNOWN';
    const url = data.url ? `https://${data.url}` : null;

    return NextResponse.json({ status, url });
  } catch (error) {
    console.error('GET /api/deploy/status error:', error);
    return NextResponse.json({ error: 'Failed to check deployment status' }, { status: 500 });
  }
}
