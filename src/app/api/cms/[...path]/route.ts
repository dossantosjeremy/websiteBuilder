import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN ?? '';

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const segment = path.join('/');
  const search = request.nextUrl.searchParams.toString();
  const target = `${STRAPI_URL}/api/${segment}${search ? `?${search}` : ''}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (STRAPI_API_TOKEN) headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : undefined;

  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Strapi unreachable', url: target },
      { status: 503 }
    );
  }
}

type RouteContext = { params: { path: string[] } };

export async function GET(req: NextRequest, ctx: RouteContext) { return proxy(req, ctx.params.path); }
export async function POST(req: NextRequest, ctx: RouteContext) { return proxy(req, ctx.params.path); }
export async function PUT(req: NextRequest, ctx: RouteContext) { return proxy(req, ctx.params.path); }
export async function PATCH(req: NextRequest, ctx: RouteContext) { return proxy(req, ctx.params.path); }
export async function DELETE(req: NextRequest, ctx: RouteContext) { return proxy(req, ctx.params.path); }
