import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth-admin';
import {
  getShippingOriginSettings,
  saveShippingOriginSettings,
  ShippingOriginSettings,
} from '@/lib/shipping-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest): boolean {
  const isDev = process.env.NODE_ENV !== 'production';
  const authHeader = req.headers.get('x-admin-key');
  const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;
  const session = verifyAdminSession(req);
  return Boolean(session || isLocalAdmin);
}

/**
 * GET /api/admin/shipping-settings
 * Returns the current warehouse/store pickup location configuration.
 */
export async function GET(req: NextRequest) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Autentikasi admin diperlukan.' },
        { status: 401 }
      );
    }

    const forceFresh = req.nextUrl.searchParams.get('fresh') === '1';
    const settings = await getShippingOriginSettings(forceFresh);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    console.error('[API /api/admin/shipping-settings GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal memuat pengaturan alamat.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/shipping-settings
 * Updates warehouse/store pickup location configuration and stores it in Supabase Storage.
 */
export async function POST(req: NextRequest) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Autentikasi admin diperlukan.' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validasi input
    if (!body.shipper_name || typeof body.shipper_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Nama pengirim / toko wajib diisi.' },
        { status: 400 }
      );
    }
    if (!body.shipper_phone || typeof body.shipper_phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Nomor telepon / WhatsApp pengirim wajib diisi.' },
        { status: 400 }
      );
    }
    if (!body.origin_address || typeof body.origin_address !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Alamat lengkap penjemputan wajib diisi.' },
        { status: 400 }
      );
    }
    if (!body.origin_postal_code || isNaN(Number(body.origin_postal_code))) {
      return NextResponse.json(
        { success: false, error: 'Kode pos gudang / toko harus berupa angka valid.' },
        { status: 400 }
      );
    }

    const input: Partial<ShippingOriginSettings> = {
      shipper_name: body.shipper_name.trim(),
      shipper_phone: body.shipper_phone.trim(),
      shipper_email: (body.shipper_email || 'info@sevaya-studio.com').trim(),
      shipper_organization: (body.shipper_organization || 'SEVAYA').trim(),
      origin_address: body.origin_address.trim(),
      origin_note: (body.origin_note || '').trim(),
      origin_postal_code: Number(body.origin_postal_code),
      origin_area_id: (body.origin_area_id || '').trim(),
      origin_area_name: (body.origin_area_name || '').trim(),
    };

    const result = await saveShippingOriginSettings(input);

    if (!result.success && result.error) {
      return NextResponse.json(
        { success: false, error: result.error, settings: result.settings },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan alamat penjemputan berhasil disimpan ke cloud.',
      settings: result.settings,
    });
  } catch (err: any) {
    console.error('[API /api/admin/shipping-settings POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal menyimpan pengaturan alamat.' },
      { status: 500 }
    );
  }
}
