import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkMidtransStatus } from '@/integrations/midtrans';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BITESHIP_BASE_URL = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com';

// Dynamically select Biteship API key: prefers live if active, otherwise fallback to sandbox
function getBiteshipAuthHeader(): { key: string; isLive: boolean } {
  // If sandbox key is explicitly provided, use it for sandbox operations
  if (process.env.BITESHIP_TEST_API_KEY) {
    return { key: process.env.BITESHIP_TEST_API_KEY, isLive: false };
  }
  // Otherwise use default key
  const liveKey = process.env.BITESHIP_API_KEY || '';
  const isLive = liveKey.startsWith('biteship_live');
  return { key: liveKey, isLive };
}

const { key: BITESHIP_TEST_KEY, isLive: IS_BITESHIP_LIVE } = getBiteshipAuthHeader();

/**
 * GET /api/admin/orders — fetch all orders from Supabase with AUTO-SYNC to Biteship API
 * - Automatically checks live status from Biteship for each order
 * - Automatically updates Supabase if status changed
 * - Automatically deletes order if status in Biteship is 'cancelled'
 */
export async function GET() {
  try {
    const { data: rawOrders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const orders = rawOrders ?? [];

    // Auto-sync every order that has biteship_order_id with Biteship API
    if (BITESHIP_TEST_KEY && orders.length > 0) {
      const activeBiteshipOrders = orders.filter(
        (o) => !!o.biteship_order_id && o.biteship_status !== 'delivered' && o.biteship_status !== 'cancelled'
      );

      await Promise.all(
        activeBiteshipOrders.map(async (ord) => {
          try {
            const res = await fetch(`${BITESHIP_BASE_URL}/v1/orders/${ord.biteship_order_id}`, {
              method: 'GET',
              headers: { Authorization: BITESHIP_TEST_KEY },
              cache: 'no-store',
            });

            if (!res.ok) return;

            const json = await res.json();
            const bsStatus = json.status || ord.biteship_status;
            const waybillId = json.courier?.waybill_id || json.courier?.tracking_id || ord.tracking_number;

            // If CANCELLED in Biteship -> Update status to cancelled (do NOT delete)
            if (bsStatus === 'cancelled') {
              ord.biteship_status = 'cancelled';
              ord.status = 'cancelled';
              await supabaseAdmin
                .from('orders')
                .update({ status: 'cancelled', biteship_status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', ord.id);
              return;
            }

            // CRITICAL: Prevent auto-sync from downgrading an order that was marked 'shipped' or 'delivered' by Admin
            if (ord.status === 'shipped' || ord.status === 'delivered') {
              if (['confirmed', 'allocated', 'picking_up', 'picked'].includes(bsStatus)) {
                // Keep the admin's advanced status. Only update tracking number if a new waybill was found.
                if (waybillId && waybillId !== ord.tracking_number) {
                  ord.tracking_number = waybillId;
                  await supabaseAdmin
                    .from('orders')
                    .update({ tracking_number: waybillId, updated_at: new Date().toISOString() })
                    .eq('id', ord.id);
                }
                return;
              }
            }

            // Map to internal status (progresses forward or cancels)
            let internalStatus = ord.status;
            if (bsStatus === 'dropping_off') {
              if (ord.status !== 'delivered') {
                internalStatus = 'shipped';
              }
            } else if (bsStatus === 'delivered') {
              internalStatus = 'delivered';
            } else if (['confirmed', 'allocated', 'picking_up', 'picked'].includes(bsStatus)) {
              if (ord.status !== 'shipped' && ord.status !== 'delivered' && ord.status !== 'cancelled') {
                internalStatus = 'processing';
              }
            }

            // If there is any change, update Supabase in background
            if (bsStatus !== ord.biteship_status || internalStatus !== ord.status || (waybillId && waybillId !== ord.tracking_number)) {
              ord.biteship_status = bsStatus;
              ord.status = internalStatus;
              if (waybillId) ord.tracking_number = waybillId;
              ord.updated_at = new Date().toISOString();

              await supabaseAdmin
                .from('orders')
                .update({
                  biteship_status: bsStatus,
                  status: internalStatus,
                  tracking_number: waybillId,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', ord.id);
            }
          } catch (syncErr) {
            console.warn(`[Auto-Sync] Error checking order ${ord.biteship_order_id}:`, syncErr);
          }
        })
      );
    }

    // Auto-check Midtrans payment status for pending Midtrans orders
    const pendingMidtransOrders = orders.filter(
      (o) => o.payment_method === 'midtrans' && o.status === 'pending_payment'
    );
    if (pendingMidtransOrders.length > 0) {
      await Promise.all(
        pendingMidtransOrders.map(async (ord) => {
          try {
            const midtrans = await checkMidtransStatus(ord.order_number);
            const ts = midtrans?.transaction_status;
            if (ts === 'settlement' || ts === 'capture') {
              ord.status = ord.biteship_order_id ? 'processing' : 'paid';
              await supabaseAdmin
                .from('orders')
                .update({ status: ord.status, updated_at: new Date().toISOString() })
                .eq('id', ord.id);
            }
          } catch (e) {
            // ignore
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      data: orders,
      mode: IS_BITESHIP_LIVE ? 'live' : 'sandbox',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/orders — update order status manually
 * Body: { id, status, tracking_number?, courier_name?, biteship_order_id? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, tracking_number, courier_name, biteship_order_id, biteship_status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (tracking_number !== undefined) updatePayload.tracking_number = tracking_number;
    if (courier_name !== undefined) updatePayload.courier_name = courier_name;
    if (biteship_order_id !== undefined) updatePayload.biteship_order_id = biteship_order_id;
    if (biteship_status !== undefined) {
      updatePayload.biteship_status = biteship_status;
    } else {
      // Auto-align biteship_status if not explicitly provided
      if (status === 'shipped') {
        updatePayload.biteship_status = 'dropping_off';
      } else if (status === 'delivered') {
        updatePayload.biteship_status = 'delivered';
      } else if (status === 'processing') {
        updatePayload.biteship_status = 'picking_up';
      } else if (status === 'cancelled') {
        updatePayload.biteship_status = 'cancelled';
      }
    }

    // If changing status to 'cancelled', also cancel on Biteship
    if (status === 'cancelled' && BITESHIP_TEST_KEY) {
      const { data: currentOrder } = await supabaseAdmin
        .from('orders')
        .select('biteship_order_id, biteship_status')
        .eq('id', id)
        .single();

      if (currentOrder?.biteship_order_id && currentOrder.biteship_status !== 'cancelled') {
        try {
          await fetch(`${BITESHIP_BASE_URL}/v1/orders/${currentOrder.biteship_order_id}/cancel`, {
            method: 'POST',
            headers: {
              Authorization: BITESHIP_TEST_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cancellation_reason: 'Dibatalkan oleh Admin Toko SEVAYA',
            }),
          });
          updatePayload.biteship_status = 'cancelled';
        } catch (cErr) {
          console.warn('[PATCH Cancel Biteship Error]:', cErr);
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/orders — create a Biteship test order linked to a SEVAYA order
 * Body: { order_id, courier_company, courier_type, destination_* }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, courier_company, courier_type, destination_address, destination_postal_code, destination_name, destination_phone, items } = body;

    if (!BITESHIP_TEST_KEY) {
      return NextResponse.json({ success: false, error: 'BITESHIP_TEST_API_KEY not set' }, { status: 500 });
    }

    // Get the SEVAYA order
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const payload = {
      shipper_contact_name: 'SEVAYA Store',
      shipper_contact_phone: '08123456789',
      shipper_contact_email: 'store@sevaya.id',
      shipper_organization: 'SEVAYA',
      origin_contact_name: 'SEVAYA Store',
      origin_contact_phone: '08123456789',
      origin_address: 'Jl. Kebon Jeruk No. 10, Jakarta Barat',
      origin_note: 'Toko SEVAYA',
      origin_postal_code: Number(process.env.BITESHIP_ORIGIN_POSTAL_CODE) || 11450,
      destination_contact_name: destination_name || order.customer_name || 'Customer',
      destination_contact_phone: destination_phone || order.customer_phone || '08000000000',
      destination_address: destination_address || order.customer_address || 'Jakarta',
      destination_postal_code: destination_postal_code || 12190,
      destination_note: `Order #${order.order_number}`,
      courier_company: courier_company || 'jne',
      courier_type: courier_type || 'reg',
      delivery_type: 'now',
      reference_id: order.order_number,
      order_note: `SEVAYA Order #${order.order_number}`,
      items: items || [
        {
          name: 'SEVAYA Abaya',
          description: order.order_number,
          category: 'fashion',
          value: order.grand_total || order.subtotal || 350000,
          quantity: 1,
          weight: 1000,
          length: 30,
          width: 20,
          height: 5,
        },
      ],
    };

    const res = await fetch(`${BITESHIP_BASE_URL}/v1/orders`, {
      method: 'POST',
      headers: {
        Authorization: BITESHIP_TEST_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: json.error || json.message || 'Biteship error', detail: json },
        { status: res.status },
      );
    }

    // Link the Biteship order ID back to our Supabase order
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        biteship_order_id: json.id,
        biteship_status: json.status,
        status: 'processing',
        courier_name: `${courier_company?.toUpperCase() || 'JNE'} ${courier_type?.toUpperCase() || 'REG'}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateErr) {
      console.error('Failed to link Biteship ID:', updateErr.message);
    }

    return NextResponse.json({
      success: true,
      biteship_order_id: json.id,
      biteship_status: json.status,
      order: json,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/orders — Sync latest status from Biteship API for a specific order or all orders
 * Body: { biteship_order_id, deleteIfCancelled?: boolean }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { biteship_order_id, deleteIfCancelled = false } = body;

    if (!BITESHIP_TEST_KEY) {
      return NextResponse.json({ success: false, error: 'BITESHIP_TEST_API_KEY not configured' }, { status: 500 });
    }

    if (!biteship_order_id) {
      return NextResponse.json({ success: false, error: 'Missing biteship_order_id' }, { status: 400 });
    }

    // Call Biteship GET order
    const res = await fetch(`${BITESHIP_BASE_URL}/v1/orders/${biteship_order_id}`, {
      method: 'GET',
      headers: { Authorization: BITESHIP_TEST_KEY },
      cache: 'no-store',
    });

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, error: json.error || 'Failed to fetch from Biteship' }, { status: res.status });
    }

    const bsStatus = json.status || 'confirmed';
    const waybillId = json.courier?.waybill_id || json.courier?.tracking_id;

    // Map to internal status
    let internalStatus = 'processing';
    if (bsStatus === 'confirmed' || bsStatus === 'allocated' || bsStatus === 'picking_up' || bsStatus === 'picked') {
      internalStatus = 'processing';
    } else if (bsStatus === 'dropping_off') {
      internalStatus = 'shipped';
    } else if (bsStatus === 'delivered') {
      internalStatus = 'delivered';
    } else if (bsStatus === 'cancelled') {
      internalStatus = 'cancelled';
    }

    // If cancelled and user wants it deleted, remove from Supabase
    if (bsStatus === 'cancelled' && deleteIfCancelled) {
      await supabaseAdmin.from('orders').delete().eq('biteship_order_id', biteship_order_id);
      return NextResponse.json({
        success: true,
        deleted: true,
        biteship_status: 'cancelled',
        message: 'Order cancelled on Biteship and removed from database',
      });
    }

    // Otherwise update
    const updateData: Record<string, unknown> = {
      biteship_status: bsStatus,
      status: internalStatus,
      updated_at: new Date().toISOString(),
    };
    if (waybillId) updateData.tracking_number = waybillId;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('biteship_order_id', biteship_order_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      biteship_status: bsStatus,
      waybill_id: waybillId,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/orders — Delete an order by ID AND cancel it on Biteship
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id query parameter' }, { status: 400 });
    }

    // 1. Get the order to check if it has a biteship_order_id
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('biteship_order_id, biteship_status')
      .eq('id', id)
      .single();

    // 2. If it has a Biteship order and not already cancelled, cancel it on Biteship server!
    if (order?.biteship_order_id && BITESHIP_TEST_KEY && order.biteship_status !== 'cancelled') {
      try {
        const cancelRes = await fetch(`${BITESHIP_BASE_URL}/v1/orders/${order.biteship_order_id}/cancel`, {
          method: 'POST',
          headers: {
            Authorization: BITESHIP_TEST_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancellation_reason: 'Dibatalkan oleh Admin Toko SEVAYA',
          }),
        });
        const cancelData = await cancelRes.json();
        console.log(`[Biteship Cancel] Order ${order.biteship_order_id}:`, cancelData);
      } catch (cancelErr) {
        console.warn(`[Biteship Cancel Error]:`, cancelErr);
      }
    }

    // 3. Delete from Supabase
    const { error } = await supabaseAdmin.from('orders').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order berhasil dibatalkan di Biteship dan dihapus dari database',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

