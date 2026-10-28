import { NextRequest, NextResponse } from 'next/server';
import {
  checkAdminCredentials,
  generateAdminToken,
  attachAdminCookie,
  clearAdminCookie,
  verifyAdminSession,
} from '@/lib/auth-admin';

/**
 * GET /api/admin/auth — Check current admin session
 */
export async function GET(req: NextRequest) {
  const session = verifyAdminSession(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    username: session.username,
    expiresAt: session.expiresAt,
  });
}

/**
 * POST /api/admin/auth — Login admin
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const isValid = checkAdminCredentials(String(username), String(password));
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Username atau password admin salah.' },
        { status: 401 }
      );
    }

    const token = generateAdminToken(username);
    const res = NextResponse.json({
      success: true,
      message: 'Login Admin Berhasil.',
      username,
    });

    attachAdminCookie(res, token);
    return res;
  } catch (err) {
    console.error('[Admin Auth Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server saat login admin.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth — Logout admin
 */
export async function DELETE() {
  const res = NextResponse.json({
    success: true,
    message: 'Admin berhasil logout.',
  });
  clearAdminCookie(res);
  return res;
}
