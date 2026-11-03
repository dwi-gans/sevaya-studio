import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

interface OrdersCacheEntry {
  orders: any[];
  count: number;
  expiresAt: number;
}

// In-memory cache for user orders per user ID (20s TTL)
// Avoids repeated expensive queries when user refreshes or toggles tabs
const userOrdersCache = new Map<string, OrdersCacheEntry>();
const USER_ORDERS_CACHE_TTL = 20 * 1000;

function invalidateUserOrdersCache(userId?: string) {
  if (userId) {
    userOrdersCache.delete(userId);
  } else {
    userOrdersCache.clear();
  }
}
// Suppress unused warning — available for internal route use
void invalidateUserOrdersCache;

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
    const cacheKey = `${user.id}_${statusFilter || 'all'}`;

    // 1. Check in-memory cache
    const now = Date.now();
    const cached = userOrdersCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(
        {
          success: true,
          orders: cached.orders,
          count: cached.count,
          cached: true,
        },
        {
          headers: {
            'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
          },
        }
      );
    }

    // 2. Query orders by user's ID or email directly
    let query = supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name, customer_email, customer_phone, customer_address, destination_area, items, subtotal, discount, shipping_cost, gift_fee, grand_total, payment_method, courier_name, courier_service, courier_duration, tracking_number, biteship_order_id, biteship_status, status, created_at, updated_at')
      .ilike('customer_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(50);

    // Filter in DB directly to avoid loading unneeded rows
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: emailData, error: emailErr } = await query;

    if (emailErr) {
      console.error('Fetch user orders error:', emailErr.message);
      return NextResponse.json(
        { success: false, error: 'Gagal memuat riwayat pesanan.' },
        { status: 500 }
      );
    }

    const orders: any[] = emailData || [];
    const expiredIds: string[] = [];

    const mappedOrders = orders.map((o) => {
      let isExpired = false;
      // Auto-cancel only after 60 minutes (1 hour) of pending payment
      if (
        (o.status === 'pending' || o.status === 'pending_payment' || o.status === 'unpaid') &&
        o.created_at &&
        now - new Date(o.created_at).getTime() > 60 * 60 * 1000
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

    // Save to in-memory cache
    userOrdersCache.set(cacheKey, {
      orders: mappedOrders,
      count: mappedOrders.length,
      expiresAt: now + USER_ORDERS_CACHE_TTL,
    });

    // Asynchronously update expired orders in bulk without blocking API response
    if (expiredIds.length > 0) {
      supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .in('id', expiredIds)
        .then(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        orders: mappedOrders,
        count: mappedOrders.length,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (err: unknown) {
    console.error('User orders API error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
