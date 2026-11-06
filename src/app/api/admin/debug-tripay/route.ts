import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth-admin';

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY!;
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE!;
const IS_PRODUCTION = process.env.TRIPAY_IS_PRODUCTION !== 'false';
const TRIPAY_BASE_URL = IS_PRODUCTION
  ? 'https://tripay.co.id/api'
  : 'https://tripay.co.id/api-sandbox';

export async function GET(req: NextRequest) {
  // Only allow verified admin session
  const adminSession = verifyAdminSession(req);
  if (!adminSession) {
    return NextResponse.json({ error: 'Akses ditolak: Autentikasi admin diperlukan.' }, { status: 401 });
  }

  // Test koneksi TriPay: ambil daftar channel pembayaran
  const res = await fetch(`${TRIPAY_BASE_URL}/merchant/payment-channel`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${TRIPAY_API_KEY}`,
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));

  return NextResponse.json({
    status: res.status,
    ok: res.ok,
    env: {
      merchant_code: TRIPAY_MERCHANT_CODE,
      is_production: IS_PRODUCTION,
      base_url: TRIPAY_BASE_URL,
      has_api_key: !!TRIPAY_API_KEY,
    },
    tripay_response: json,
    channels: json.data?.map((ch: any) => ({
      code: ch.code,
      name: ch.name,
      active: ch.active,
      minimum_fee: ch.minimum_fee,
    })) || [],
  });
}
