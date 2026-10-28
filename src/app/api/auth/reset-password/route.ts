import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { access_token, refresh_token, new_password } = await req.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid atau telah kedaluwarsa.' },
        { status: 400 }
      );
    }

    if (!new_password || new_password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi minimal 8 karakter.' },
        { status: 400 }
      );
    }

    // Create a client and set the session from the recovery tokens
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Set session using the tokens from the reset link
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) {
      console.error('[Reset Password] Set session error:', sessionError.message);
      return NextResponse.json(
        { success: false, error: 'Tautan reset tidak valid atau telah kedaluwarsa. Minta ulang tautan baru.' },
        { status: 401 }
      );
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      console.error('[Reset Password] Update password error:', updateError.message);
      return NextResponse.json(
        { success: false, error: updateError.message || 'Gagal memperbarui kata sandi.' },
        { status: 400 }
      );
    }

    // Sign out after successful reset (force re-login with new password)
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Reset Password] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
