import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, phone } = body;

    // 1. Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nama lengkap wajib diisi minimal 2 karakter.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Format email tidak valid.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, '').trim() : '';

    // 2. Create user with auto-confirmation via Supabase Admin API
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: fullName.trim(),
        full_name: fullName.trim(),
        phone: cleanPhone,
      },
    });

    if (createError) {
      const msg = createError.message.toLowerCase();
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return NextResponse.json(
          { success: false, error: 'Alamat email ini sudah terdaftar. Silakan masuk (login).' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Gagal mendaftar: ${createError.message}` },
        { status: 400 }
      );
    }

    const newUser = createData.user;

    // 3. Sync to public.profiles table if exists
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: newUser.id,
        full_name: fullName.trim(),
        phone: cleanPhone,
        updated_at: new Date().toISOString(),
      });
    } catch (profileErr) {
      console.warn('Profiles table sync notice:', profileErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: fullName.trim(),
        phone: cleanPhone,
      },
    });
  } catch (err: unknown) {
    console.error('Register API error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server saat pendaftaran akun.' },
      { status: 500 }
    );
  }
}
