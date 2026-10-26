import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Harap masuk (login) untuk melihat pesanan Anda.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const userEmail = (user.email || '').trim().toLowerCase();

    // Query orders by user's email directly
    const { data: emailData, error: emailErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .ilike('customer_email', userEmail)
      .order('created_at', { ascending: false });

    if (emailErr) {
      console.error('Fetch user orders error:', emailErr.message);
      return NextResponse.json(
        { success: false, error: 'Gagal memuat riwayat pesanan.' },
        { status: 500 }
      );
    }

    let orders: any[] = emailData || [];

    // Auto-cancel pending orders older than 10 minutes
    const now = Date.now();
    for (const o of orders) {
      if (
        (o.status === 'pending' || o.status === 'pending_payment' || o.status === 'unpaid') &&
        o.created_at &&
        now - new Date(o.created_at).getTime() > 10 * 60 * 1000
      ) {
        o.status = 'cancelled';
        supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', o.id)
          .then(() => {});
      }
    }

    // Apply status filter in memory if needed
    if (statusFilter && statusFilter !== 'all') {
      orders = orders.filter((o) => o.status === statusFilter);
    }

    const mappedOrders = orders.map((o) => {
      let parsedItems = [];
      try {
        parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [];
      } catch {
        parsedItems = [];
      }

      return {
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        customer_phone: o.customer_phone,
        customer_address: o.customer_address,
        destination_area: o.destination_area,
        items: parsedItems,
        subtotal: o.subtotal,
        discount: o.discount,
        shipping_cost: o.shipping_cost,
        gift_fee: o.gift_fee,
        grand_total: o.grand_total,
        payment_method: o.payment_method,
        courier_name: o.courier_name,
        courier_service: o.courier_service,
        courier_duration: o.courier_duration,
        tracking_number: o.tracking_number,
        biteship_order_id: o.biteship_order_id,
        biteship_status: o.biteship_status,
        status: o.status,
        created_at: o.created_at,
        updated_at: o.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      orders: mappedOrders,
      count: mappedOrders.length,
    });
  } catch (err: unknown) {
    console.error('User orders API error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat memuat riwayat pesanan.' },
      { status: 500 }
    );
  }
}
