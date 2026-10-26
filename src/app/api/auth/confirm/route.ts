import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/confirm
 *
 * Supabase email links point to this route (via redirectTo parameter).
 * This route handles the token verification and redirects to /reset-password
 * with the session tokens in the URL hash (safe for client-side consumption).
 *
 * Handles:
 *  - ?token_hash=...&type=recovery   (Supabase email OTP format)
 *  - ?code=...                       (PKCE format)
 *  - #access_token=...               (legacy hash format — browser only, not needed here)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/reset-password';

  // If type is recovery and we have token_hash or code, forward to reset-password
  if (type === 'recovery' || code) {
    const redirectUrl = new URL('/reset-password', req.url);

    if (code) redirectUrl.searchParams.set('code', code);
    if (tokenHash) redirectUrl.searchParams.set('token_hash', tokenHash);
    if (type) redirectUrl.searchParams.set('type', type);

    return NextResponse.redirect(redirectUrl.toString());
  }

  // Unknown type — redirect to home
  return NextResponse.redirect(new URL('/', req.url));
}
