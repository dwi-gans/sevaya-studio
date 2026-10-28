import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi baru harus minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // If current password was provided, verify it first
    if (currentPassword) {
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: verifyErr } = await anonClient.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyErr) {
        return NextResponse.json(
          { success: false, error: 'Kata sandi saat ini tidak sesuai.' },
          { status: 400 }
        );
      }
    }

    // Update password securely via Admin API
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: `Gagal memperbarui kata sandi: ${updateErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui.',
    });
  } catch (err: unknown) {
    console.error('Change password API error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat memperbarui kata sandi.' },
      { status: 500 }
    );
  }
}
