import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

const BITESHIP_BASE_URL = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com';

function getBiteshipKey(): string {
  const live = process.env.BITESHIP_API_KEY || '';
  const test = process.env.BITESHIP_TEST_API_KEY || '';
  if (live && live.startsWith('biteship_live')) return live;
  return test || live;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { user, error: authErr } = await getAuthenticatedUser(req);
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Harap login.' }, { status: 401 });
    }

    const rawOrderId = decodeURIComponent((await params).orderId).replace(/^#/, '').trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawOrderId);

    const { data: order } = isUUID
      ? await supabaseAdmin.from('orders').select('id,user_id,customer_email,biteship_order_id,tracking_number,courier_name').eq('id', rawOrderId).maybeSingle()
      : await supabaseAdmin.from('orders').select('id,user_id,customer_email,biteship_order_id,tracking_number,courier_name').eq('order_number', rawOrderId).maybeSingle();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    const isOwner =
      (order.user_id && order.user_id === user.id) ||
      (order.customer_email && order.customer_email.toLowerCase() === user.email?.toLowerCase()) ||
      user.email === 'sevayaofficial@gmail.com';

    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
    }

    const key = getBiteshipKey();
    if (!key) {
      return NextResponse.json({ success: false, error: 'Tracking tidak tersedia.' }, { status: 503 });
    }

    if (order.biteship_order_id) {
      const res = await fetch(`${BITESHIP_BASE_URL}/v1/orders/${order.biteship_order_id}`, {
        headers: { Authorization: key },
        cache: 'no-store',
      });
      if (res.ok) {
        const bsOrder = await res.json();
        const rawHistory = bsOrder?.courier?.history ?? [];
        const history = rawHistory.map((ev: any) => {
          const rawImages = Array.isArray(ev.images) ? ev.images : [];
          const imageUrls: string[] = [];
          rawImages.forEach((imgObj: any) => {
            if (Array.isArray(imgObj?.images_urls)) {
              imgObj.images_urls.forEach((url: string) => {
                if (typeof url === 'string' && url.trim()) imageUrls.push(url.trim());
              });
            }
          });
          if (Array.isArray(ev.image_urls)) {
            ev.image_urls.forEach((url: string) => typeof url === 'string' && url.trim() && imageUrls.push(url.trim()));
          }
          if (typeof ev.image_url === 'string' && ev.image_url.trim()) imageUrls.push(ev.image_url.trim());
          return {
            datetime: ev.updated_at || ev.datetime || ev.timestamp || '',
            note: ev.note || '',
            status: ev.status || '',
            images: rawImages,
            image_urls: Array.from(new Set(imageUrls)),
          };
        });

        return NextResponse.json({
          success: true,
          waybill_id: bsOrder?.courier?.waybill_id ?? bsOrder?.courier?.tracking_id ?? order.tracking_number ?? null,
          courier_name: bsOrder?.courier?.company ?? order.courier_name ?? null,
          order_status: bsOrder?.status ?? null,
          driver_name: bsOrder?.courier?.driver_name ?? null,
          driver_phone: bsOrder?.courier?.driver_phone ?? null,
          driver_photo_url: bsOrder?.courier?.driver_photo_url ?? null,
          tracking_link: bsOrder?.courier?.link ?? null,
          history,
        }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } });
      }
    }

    if (order.tracking_number) {
      const courierCode = (order.courier_name || 'jne').toLowerCase().split(' ')[0];
      const url = `${BITESHIP_BASE_URL}/v1/trackings/${order.tracking_number}?courier_code=${encodeURIComponent(courierCode)}`;
      const res = await fetch(url, { headers: { Authorization: key }, cache: 'no-store' });
      if (res.ok) {
        const tracking = await res.json();
        let rawHistory = tracking?.history ?? tracking?.data?.history ?? [];
        let orderDetail: any = null;

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
            // ignore
          }
        }

        const history = rawHistory.map((ev: any) => {
          const rawImages = Array.isArray(ev.images) ? ev.images : [];
          const imageUrls: string[] = [];
          rawImages.forEach((imgObj: any) => {
            if (Array.isArray(imgObj?.images_urls)) {
              imgObj.images_urls.forEach((url: string) => {
                if (typeof url === 'string' && url.trim()) imageUrls.push(url.trim());
              });
            }
          });
          if (Array.isArray(ev.image_urls)) {
            ev.image_urls.forEach((url: string) => typeof url === 'string' && url.trim() && imageUrls.push(url.trim()));
          }
          if (typeof ev.image_url === 'string' && ev.image_url.trim()) imageUrls.push(ev.image_url.trim());
          return {
            datetime: ev.updated_at || ev.datetime || ev.timestamp || '',
            note: ev.note || '',
            status: ev.status || '',
            images: rawImages,
            image_urls: Array.from(new Set(imageUrls)),
          };
        });

        return NextResponse.json({
          success: true,
          waybill_id: order.tracking_number,
          courier_name: tracking?.courier?.company ?? order.courier_name ?? null,
          order_status: tracking?.status ?? orderDetail?.status ?? null,
          driver_name: tracking?.courier?.driver_name ?? orderDetail?.courier?.driver_name ?? null,
          driver_phone: tracking?.courier?.driver_phone ?? orderDetail?.courier?.driver_phone ?? null,
          driver_photo_url: tracking?.courier?.driver_photo_url ?? orderDetail?.courier?.driver_photo_url ?? null,
          tracking_link: tracking?.link ?? orderDetail?.courier?.link ?? null,
          history,
        }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } });
      }
    }

    return NextResponse.json({ success: false, error: 'Belum ada data tracking.' }, { status: 404 });
  } catch (err) {
    console.error('[User Tracking API]', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat tracking.' }, { status: 500 });
  }
}