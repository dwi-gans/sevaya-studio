import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth-admin';

const BITESHIP_BASE_URL = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com';

function getBiteshipKey(): string {
  const live = process.env.BITESHIP_API_KEY || '';
  const test = process.env.BITESHIP_TEST_API_KEY || '';
  if (live && live.startsWith('biteship_live')) return live;
  return test || live;
}

interface BiteshipHistoryEvent {
  datetime?: string;
  updated_at?: string;
  timestamp?: string;
  note?: string;
  status?: string;
  images?: Array<{ type: string; images_urls: string[] }>;
  images_urls?: string[];
  image_urls?: string[];
  image_url?: string;
  photo_url?: string;
  pod_url?: string;
}

function normalizeHistoryEvents(rawHistory: BiteshipHistoryEvent[]) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory.map((ev) => {
    const rawImages = Array.isArray(ev.images) ? ev.images : [];
    const imageUrls: string[] = [];

    // Format 1: ev.images = [{ type: 'proof_of_pickup', images_urls: ['...'] }]
    rawImages.forEach((imgObj) => {
      if (Array.isArray(imgObj?.images_urls)) {
        imgObj.images_urls.forEach((url: string) => {
          if (typeof url === 'string' && url.trim()) {
            imageUrls.push(url.trim());
          }
        });
      }
    });

    // Format 2: Direct images_urls / image_urls / photo_url / pod_url
    if (Array.isArray(ev.images_urls)) {
      ev.images_urls.forEach((url) => typeof url === 'string' && url.trim() && imageUrls.push(url.trim()));
    }
    if (Array.isArray(ev.image_urls)) {
      ev.image_urls.forEach((url) => typeof url === 'string' && url.trim() && imageUrls.push(url.trim()));
    }
    if (typeof ev.image_url === 'string' && ev.image_url.trim()) imageUrls.push(ev.image_url.trim());
    if (typeof ev.photo_url === 'string' && ev.photo_url.trim()) imageUrls.push(ev.photo_url.trim());
    if (typeof ev.pod_url === 'string' && ev.pod_url.trim()) imageUrls.push(ev.pod_url.trim());

    return {
      datetime: ev.updated_at || ev.datetime || ev.timestamp || '',
      note: ev.note || '',
      status: ev.status || '',
      images: rawImages,
      image_urls: Array.from(new Set(imageUrls)),
    };
  });
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
      const rawHistory = order?.courier?.history ?? [];
      const history = normalizeHistoryEvents(rawHistory);

      return NextResponse.json({
        success: true,
        source: 'biteship_order',
        order_status: order.status ?? null,
        waybill_id: order?.courier?.waybill_id ?? order?.courier?.tracking_id ?? null,
        courier_name: order?.courier?.company ?? null,
        driver_name: order?.courier?.driver_name ?? null,
        driver_phone: order?.courier?.driver_phone ?? null,
        driver_photo_url: order?.courier?.driver_photo_url ?? null,
        tracking_link: order?.courier?.link ?? null,
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
      let rawHistory = tracking?.history ?? tracking?.data?.history ?? [];
      let orderDetail: any = null;

      // Jika tracking memberikan order_id, tarik detail order untuk mendapatkan foto resolusi tinggi kurir
      const linkedOrderId = tracking?.order_id ?? tracking?.data?.order_id;
      if (linkedOrderId) {
        try {
          const orderRes = await fetch(`${BITESHIP_BASE_URL}/v1/orders/${linkedOrderId}`, {
            headers: { Authorization: key },
            cache: 'no-store',
          });
          if (orderRes.ok) {
            orderDetail = await orderRes.json();
            if (Array.isArray(orderDetail?.courier?.history) && orderDetail.courier.history.length > 0) {
              rawHistory = orderDetail.courier.history;
            }
          }
        } catch {
          // ignore error, fallback to tracking
        }
      }

      const history = normalizeHistoryEvents(rawHistory);

      return NextResponse.json({
        success: true,
        source: 'biteship_tracking',
        order_status: tracking?.status ?? tracking?.data?.status ?? orderDetail?.status ?? null,
        waybill_id: waybillId,
        courier_name: tracking?.courier?.company ?? courierCode,
        driver_name: tracking?.courier?.driver_name ?? orderDetail?.courier?.driver_name ?? null,
        driver_phone: tracking?.courier?.driver_phone ?? orderDetail?.courier?.driver_phone ?? null,
        driver_photo_url: tracking?.courier?.driver_photo_url ?? orderDetail?.courier?.driver_photo_url ?? null,
        tracking_link: tracking?.link ?? orderDetail?.courier?.link ?? null,
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
