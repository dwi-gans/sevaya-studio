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

    // Query orders by user's email directly - with fast timeout & limit
    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .ilike('customer_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: emailData, error: emailErr } = await query;

    if (emailErr) {
      console.error('Fetch user orders error:', emailErr.message);
      return NextResponse.json(
        { success: false, error: 'Gagal memuat riwayat pesanan.' },
        { status: 500 }
      );
    }

    let orders: any[] = emailData || [];

    // Filter in memory if filter query exists
    if (statusFilter && statusFilter !== 'all') {
      orders = orders.filter((o) => o.status === statusFilter);
    }

    const now = Date.now();
    const expiredIds: string[] = [];

    const mappedOrders = orders.map((o) => {
      let isExpired = false;
      if (
        (o.status === 'pending' || o.status === 'pending_payment' || o.status === 'unpaid') &&
        o.created_at &&
        now - new Date(o.created_at).getTime() > 10 * 60 * 1000
      ) {
        isExpired = true;
        expiredIds.push(o.id);
      }

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
        status: isExpired ? 'cancelled' : o.status,
        created_at: o.created_at,
        updated_at: o.updated_at,
      };
    });

    // Asynchronously update expired orders in bulk without blocking API response
    if (expiredIds.length > 0) {
      supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .in('id', expiredIds)
        .then(() => {});
    }

    return NextResponse.json({
      success: true,
      orders: mappedOrders,
      count: mappedOrders.length,
    });
  } catch (err: unknown) {
    console.error('User orders API error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
