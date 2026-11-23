import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth-admin';

const BITESHIP_BASE_URL = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com';

function getBiteshipKey(): string {
  const live = process.env.BITESHIP_API_KEY || '';
  const test = process.env.BITESHIP_TEST_API_KEY || '';
  if (live && live.startsWith('biteship_live')) return live;
  return test || live;
}

/**
 * GET /api/admin/orders/tracking
 * Query:
 *   biteship_id — Biteship order ID (fetch order detail + courier.history)
 *   waybill_id  — Resi/waybill number
 *   courier_code — e.g. jne, sicepat (required when using waybill_id)
 */
export async function GET(req: NextRequest) {
  const adminSession = verifyAdminSession(req);
  if (!adminSession) {
    return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 401 });
  }

  const key = getBiteshipKey();
  if (!key) {
    return NextResponse.json({ success: false, error: 'Biteship API key not set' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const biteshipId = searchParams.get('biteship_id');
  const waybillId  = searchParams.get('waybill_id');
  const courierCode = searchParams.get('courier_code');

  try {
    // === Strategy 1: Use Biteship Order ID ===
    if (biteshipId) {
      const res = await fetch(`${BITESHIP_BASE_URL}/v1/orders/${biteshipId}`, {
        headers: { Authorization: key },
        cache: 'no-store',
      });
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: `Biteship ${res.status}` },
          { status: res.status },
        );
      }
      const order = await res.json();
      const history: Array<{ datetime: string; note: string; status?: string }> =
        order?.courier?.history ?? [];

      return NextResponse.json({
        success: true,
        source: 'biteship_order',
        order_status: order.status ?? null,
        waybill_id: order?.courier?.waybill_id ?? order?.courier?.tracking_id ?? null,
        courier_name: order?.courier?.company ?? null,
        history,
      });
    }

    // === Strategy 2: Use waybill_id + courier_code ===
    if (waybillId && courierCode) {
      const url = `${BITESHIP_BASE_URL}/v1/trackings/${waybillId}?courier_code=${encodeURIComponent(courierCode)}`;
      const res = await fetch(url, {
        headers: { Authorization: key },
        cache: 'no-store',
      });
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: `Biteship tracking ${res.status}` },
          { status: res.status },
        );
      }
      const tracking = await res.json();
      const history: Array<{ datetime: string; note: string; status?: string }> =
        tracking?.history ?? tracking?.data?.history ?? [];

      return NextResponse.json({
        success: true,
        source: 'biteship_tracking',
        order_status: tracking?.status ?? tracking?.data?.status ?? null,
        waybill_id: waybillId,
        courier_name: tracking?.courier?.company ?? courierCode,
        history,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Butuh biteship_id, atau waybill_id+courier_code' },
      { status: 400 },
    );
  } catch (err) {
    console.error('[Tracking API]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 },
    );
  }
}
