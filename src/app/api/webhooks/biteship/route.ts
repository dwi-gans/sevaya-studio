import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/auth-server';

/**
 * Biteship Webhook Handler with Timing-Safe Secret Verification
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Webhook Authentication / Secret Verification
    const expectedSecret =
      process.env.BITESHIP_WEBHOOK_SECRET ||
      process.env.BITESHIP_API_KEY ||
      process.env.BITESHIP_TEST_API_KEY;

    if (expectedSecret) {
      const authHeader = req.headers.get('authorization') || req.headers.get('x-biteship-secret') || req.headers.get('x-webhook-token');
      const queryToken = req.nextUrl.searchParams.get('token');
      const providedSecret = authHeader?.replace(/^Bearer\s+/i, '').trim() || queryToken || '';

      let isSecretValid = false;
      try {
        const expectedBuf = Buffer.from(expectedSecret);
        const providedBuf = Buffer.from(providedSecret);
        if (expectedBuf.length > 0 && expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf)) {
          isSecretValid = true;
        }
      } catch {
        isSecretValid = false;
      }

      if (!isSecretValid) {
        console.warn('[Biteship Webhook] Unauthorized attempt with invalid or missing secret.');
        return NextResponse.json({ success: false, error: 'Unauthorized webhook' }, { status: 401 });
      }
    }

    const body = await req.json();

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

    if (existingOrd) {
      if (['shipped', 'delivered'].includes(existingOrd.status)) {
        if (['confirmed', 'allocated', 'picking_up', 'picked'].includes(status)) {
          finalStatus = existingOrd.status;
        }
      }
      // Jangan pernah downgrade order yang sudah paid / processing / shipped / delivered menjadi cancelled secara otomatis
      if (['paid', 'processing', 'shipped', 'delivered'].includes(existingOrd.status) && ['cancelled', 'returned'].includes(status)) {
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
    }

    return NextResponse.json({ received: true, status: finalStatus });
  } catch (err) {
    console.error('[Biteship Webhook] Error:', err);
    return NextResponse.json({ received: true, error: 'parse error' }, { status: 400 });
  }
}
