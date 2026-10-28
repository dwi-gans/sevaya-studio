import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { sendEmail } from '@/lib/resend';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const ipCheck = checkRateLimit('fp_' + clientIp, 5, 15 * 60 * 1000);
    if (!ipCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan reset kata sandi dari perangkat Anda. Harap tunggu 15 menit.' },
        { status: 429 }
      );
    }
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Harap masukkan alamat email yang valid.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Generate a password reset link via Supabase Admin
    // This creates a secure, time-limited token (valid 1 hour)
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${origin}/reset-password`,
      },
    });

    if (error) {
      // Don't reveal whether email exists or not (security best practice)
      console.error('[Forgot Password] Generate link error:', error.message);
      // Still return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    const resetLink = data?.properties?.action_link;
    if (!resetLink) {
      console.error('[Forgot Password] No action_link returned');
      return NextResponse.json({ success: true });
    }

    // Extract user name from profiles table if available
    let userName = 'Pelanggan Sevaya';
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', data.user?.id)
        .maybeSingle();
      if (profile?.full_name) userName = profile.full_name.split(' ')[0];
    } catch {
      // non-critical — continue
    }

    const emailHtml = buildResetEmailHtml({ userName, resetLink, email: normalizedEmail });

    await sendEmail({
      to: normalizedEmail,
      subject: 'Reset Kata Sandi — SEVAYA Studio',
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Forgot Password] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

// ── Email Template ────────────────────────────────────────────────────────────
function buildResetEmailHtml({
  userName,
  resetLink,
  email,
}: {
  userName: string;
  resetLink: string;
  email: string;
}) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Kata Sandi — SEVAYA Studio</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#000000;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:500;color:#FFFFFF;letter-spacing:0.34em;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans','Inter','Century Gothic',Futura,sans-serif;text-transform:uppercase;">
                SEVAYA
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#6b1d2f;text-transform:uppercase;font-family:Arial,sans-serif;">
                KEAMANAN AKUN
              </p>
              <h2 style="margin:0 0 20px;font-size:22px;font-weight:400;color:#000000;font-family:'Georgia',serif;">
                Reset Kata Sandi Anda
              </h2>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(0,0,0,0.64);font-family:Arial,sans-serif;">
                Halo, <strong style="color:#000000;">${userName}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:rgba(0,0,0,0.64);font-family:Arial,sans-serif;">
                Kami menerima permintaan untuk mereset kata sandi akun SEVAYA yang terhubung dengan alamat email
                <strong style="color:#000000;">${email}</strong>.
                Klik tombol di bawah untuk membuat kata sandi baru.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetLink}"
                      style="display:inline-block;background-color:#000000;color:#FFFFFF;padding:16px 40px;font-size:11px;letter-spacing:3px;text-decoration:none;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:600;">
                      RESET KATA SANDI
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <tr>
                <td style="padding:0 40px;">
                  <div style="height:1px;background-color:rgba(0,0,0,0.12);margin-bottom:24px;"></div>
                </td>
              </tr>

              <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:rgba(0,0,0,0.64);font-family:Arial,sans-serif;">
                Tautan ini hanya berlaku selama <strong>1 jam</strong> dan hanya dapat digunakan sekali.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:rgba(0,0,0,0.64);font-family:Arial,sans-serif;">
                Jika tombol di atas tidak berfungsi, salin dan tempel tautan ini ke browser Anda:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${resetLink}" style="font-size:12px;color:#6b1d2f;font-family:Arial,sans-serif;">${resetLink}</a>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#B8A99A;font-family:Arial,sans-serif;">
                Jika Anda tidak meminta reset kata sandi, abaikan email ini. Akun Anda tetap aman.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#FFFFFF;border-top:1px solid rgba(0,0,0,0.12);padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#B8A99A;text-transform:uppercase;font-family:Arial,sans-serif;">
                SEVAYA STUDIO — Abaya &amp; Modest Fashion
              </p>
              <p style="margin:0;font-size:11px;color:#B8A99A;font-family:Arial,sans-serif;">
                Email ini dikirim oleh sistem otomatis. Jangan membalas email ini.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
