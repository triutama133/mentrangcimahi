import { NextRequest, NextResponse } from 'next/server';
import { PTP_SESSION_COOKIE, computePtpSessionToken } from '@/lib/ptpAuth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/ptp-builder/login') {
    return NextResponse.next();
  }

  const password = process.env.PTP_BUILDER_PASSWORD;
  if (!password) {
    // No password configured server-side: refuse access rather than fail open.
    const loginUrl = new URL('/ptp-builder/login', req.url);
    loginUrl.searchParams.set('unconfigured', '1');
    return NextResponse.redirect(loginUrl);
  }

  const expected = await computePtpSessionToken(password);
  const cookie = req.cookies.get(PTP_SESSION_COOKIE)?.value;

  if (cookie !== expected) {
    const loginUrl = new URL('/ptp-builder/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ptp-builder/:path*'],
};
