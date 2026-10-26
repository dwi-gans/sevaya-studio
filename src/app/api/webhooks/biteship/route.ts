import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Biteship sends a POST with JSON body on every order status change.
 * We find the matching order by biteship_order_id and update its status + tracking fields.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('[Biteship Webhook]', JSON.stringify(body, null, 2));

    const {
      id: biteshipOrderId,
      status,
      courier,
      updated_at,
    } = body;

    if (!biteshipOrderId || !status) {
      return NextResponse.json({ received: true, skipped: 'missing id or status' });
    }

    // Map Biteship status → our internal status
    const statusMap: Record<string, string> = {
      confirmed: 'processing',
      allocated: 'processing',
      picking_up: 'processing',
      picked: 'processing',
      dropping_off: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
      returned: 'cancelled',
      on_hold: 'shipped',
    };

    let finalStatus = statusMap[status] ?? 'processing';
    const trackingNumber = courier?.waybill_id ?? courier?.tracking_id ?? null;
    const courierName = courier?.company
      ? `${courier.company.toUpperCase()}${courier.type ? ' ' + courier.type : ''}`
      : null;

    // Check existing order status to prevent preliminary webhook from demoting an already shipped/delivered order
    const { data: existingOrd } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('biteship_order_id', biteshipOrderId)
      .maybeSingle();

    if (existingOrd && (existingOrd.status === 'shipped' || existingOrd.status === 'delivered')) {
      if (['confirmed', 'allocated', 'picking_up', 'picked'].includes(status)) {
        finalStatus = existingOrd.status;
      }
    }

    const updatePayload: Record<string, unknown> = {
      biteship_status: status,
      status: finalStatus,
      updated_at: updated_at ?? new Date().toISOString(),
    };
    if (trackingNumber) updatePayload.tracking_number = trackingNumber;
    if (courierName) updatePayload.courier_name = courierName;

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('biteship_order_id', biteshipOrderId);

    if (error) {
      console.error('[Biteship Webhook] Supabase update error:', error.message);
      // Still return 200 so Biteship doesn't retry endlessly
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Biteship Webhook] Error:', err);
    return NextResponse.json({ received: true, error: 'parse error' });
  }
}
