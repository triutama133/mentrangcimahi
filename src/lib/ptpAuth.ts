// Shared by the middleware (Edge runtime) and the login API route (Node runtime),
// so this can only use Web Crypto (available in both), not Node's `crypto` module.
export const PTP_SESSION_COOKIE = 'ptp_session';

export async function computePtpSessionToken(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('ptp-builder-session-v1'));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
