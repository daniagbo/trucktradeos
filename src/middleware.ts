import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get('auth_session')?.value);

  // Keep middleware lightweight and cookie-presence based.
  // Full session validation/role enforcement happens in route handlers and server components.
  if (!hasSessionCookie) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/dashboard/:path*', '/profile', '/rfq/new'],
};
