import { NextResponse, type NextRequest } from 'next/server';

// Auth disabled for local use — all requests pass through
export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
