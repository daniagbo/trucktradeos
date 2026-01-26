import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export async function middleware(request: NextRequest) {
    // 1. Strict protection for /admin routes
    // Matcher handles the path check, so we are guaranteed to be on /admin* here 
    // BUT typically middleware runs on everything unless matcher is very specific. 
    // The previous matcher was broad. The new matcher is specific.
    // However, we should still check path to be safe if we expand matcher later.

    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/admin')) {
        const cookie = request.cookies.get('auth_session')?.value;
        const session = await decrypt(cookie);

        if (!session?.userId) {
            const url = new URL('/login', request.url);
            url.searchParams.set('next', pathname);
            return NextResponse.redirect(url);
        }

        if (session.role !== 'admin') {
            // Stealth mode: Redirect to 404/Home or clean 404 rewrite
            return NextResponse.rewrite(new URL('/404', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
