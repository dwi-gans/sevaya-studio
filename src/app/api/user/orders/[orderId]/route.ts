import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Harap login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const rawOrderId = (await params).orderId;
    if (!rawOrderId) {
      return NextResponse.json(
        { success: false, error: 'ID pesanan diperlukan.' },
        { status: 400 }
      );
    }

    const cleanedOrderId = decodeURIComponent(rawOrderId).replace(/^#/, '').trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanedOrderId);

    let order: any = null;
    let fetchErr: any = null;

    if (isUUID) {
      const res = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', cleanedOrderId)
        .maybeSingle();
      order = res.data;
      fetchErr = res.error;
    } else {
      const res = await supabaseAdmin
        .from('orders')
        .select('*')
        .ilike('order_number', cleanedOrderId)
        .maybeSingle();
      order = res.data;
      fetchErr = res.error;

      // Fallback: try with partial match if exact match returned nothing
      if (!order && !fetchErr) {
        const fallbackRes = await supabaseAdmin
          .from('orders')
          .select('*')
          .ilike('order_number', `%${cleanedOrderId}%`)
          .maybeSingle();
        order = fallbackRes.data;
      }
    }

    if (fetchErr || !order) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // STRICT AUTHORIZATION CHECK (IDOR Protection)
    const userEmail = (user.email || '').trim().toLowerCase();
    const orderEmail = (order.customer_email || '').trim().toLowerCase();
    const isOwner =
      Boolean(order.user_id && order.user_id === user.id) ||
      Boolean(orderEmail && userEmail && orderEmail === userEmail);

    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat detail pesanan ini.',
        },
        { status: 403 }
      );
    }

    // Auto-cancel if pending and older than 10 minutes (600,000 ms)
    if (
      (order.status === 'pending' || order.status === 'pending_payment' || order.status === 'unpaid') &&
      order.created_at &&
      Date.now() - new Date(order.created_at).getTime() > 10 * 60 * 1000
    ) {
      order.status = 'cancelled';
      supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .then(() => {});
    }

    let parsedItems = [];
    try {
      parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    } catch {
      parsedItems = [];
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        destination_area: order.destination_area,
        items: parsedItems,
        subtotal: order.subtotal,
        discount: order.discount,
        shipping_cost: order.shipping_cost,
        gift_fee: order.gift_fee,
        grand_total: order.grand_total,
        payment_method: order.payment_method,
        courier_name: order.courier_name,
        courier_service: order.courier_service,
        courier_duration: order.courier_duration,
        tracking_number: order.tracking_number,
        biteship_order_id: order.biteship_order_id,
        biteship_status: order.biteship_status,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
    });
  } catch (err: unknown) {
    console.error('User order detail API error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat detail pesanan.' },
      { status: 500 }
    );
  }
}
