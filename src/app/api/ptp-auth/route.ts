import { NextRequest, NextResponse } from 'next/server';
import { PTP_SESSION_COOKIE, computePtpSessionToken } from '@/lib/ptpAuth';

export async function POST(req: NextRequest) {
  const expectedPassword = process.env.PTP_BUILDER_PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json({ error: 'PTP_BUILDER_PASSWORD belum diatur di server.' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== 'string' || password !== expectedPassword) {
    return NextResponse.json({ error: 'Password salah.' }, { status: 401 });
  }

  const token = await computePtpSessionToken(expectedPassword);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PTP_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PTP_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
