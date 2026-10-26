import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BITESHIP_BASE_URL = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com';
const BITESHIP_TEST_KEY = process.env.BITESHIP_TEST_API_KEY || '';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST — Create a test order on Biteship sandbox
 */
export async function POST(req: NextRequest) {
  try {
    if (!BITESHIP_TEST_KEY) {
      return NextResponse.json(
        { success: false, error: 'BITESHIP_TEST_API_KEY not configured in .env.local' },
        { status: 500 },
      );
    }

    const body = await req.json();

    const payload = {
      shipper_contact_name: body.shipper_name || 'SEVAYA Store',
      shipper_contact_phone: body.shipper_phone || '08123456789',
      shipper_contact_email: body.shipper_email || 'store@sevaya.id',
      shipper_organization: 'SEVAYA',
      origin_contact_name: body.shipper_name || 'SEVAYA Store',
      origin_contact_phone: body.shipper_phone || '08123456789',
      origin_address: body.origin_address || 'Jl. Kebon Jeruk No. 10, Jakarta Barat',
      origin_note: 'Toko SEVAYA',
      origin_postal_code: Number(process.env.BITESHIP_ORIGIN_POSTAL_CODE) || 11450,
      destination_contact_name: body.destination_name || 'Test Customer',
      destination_contact_phone: body.destination_phone || '08987654321',
      destination_contact_email: body.destination_email || 'test@customer.com',
      destination_address: body.destination_address || 'Jl. Sudirman No. 1, Jakarta Selatan',
      destination_postal_code: body.destination_postal_code || 12190,
      destination_note: body.destination_note || 'Test order - simulasi',
      courier_company: body.courier_company || 'jne',
      courier_type: body.courier_type || 'reg',
      delivery_type: 'now',
      order_note: `SEVAYA Test Order - ${new Date().toISOString()}`,
      items: body.items || [
        {
          name: 'The Obsidian Abaya - Silk Noir',
          description: 'Test item for sandbox simulation',
          category: 'fashion',
          value: 350000,
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
        { success: false, error: json.error || json.message || 'Biteship API error', detail: json },
        { status: res.status },
      );
    }
    // Save test order to Supabase so it immediately appears in Admin Dashboard
    const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
    const courierCompany = (json.courier?.company || payload.courier_company || 'jne').toUpperCase();
    const courierType = (json.courier?.type || payload.courier_type || 'reg').toUpperCase();

    try {
      await supabaseAdmin.from('orders').insert({
        order_number: orderNumber,
        customer_name: payload.destination_contact_name,
        customer_phone: payload.destination_contact_phone,
        customer_email: payload.destination_contact_email,
        customer_address: payload.destination_address,
        destination_area: `${payload.destination_address} (${payload.destination_postal_code})`,
        items: JSON.stringify(payload.items),
        subtotal: 350000,
        shipping_cost: json.price || 15000,
        grand_total: (json.price || 15000) + 350000,
        payment_method: 'Sandbox Biteship',
        courier_name: `${courierCompany} ${courierType}`,
        courier_service: courierType,
        tracking_number: json.courier?.waybill_id || json.courier?.tracking_id || 'WYB-PENDING',
        biteship_order_id: json.id,
        biteship_status: json.status || 'confirmed',
        status: 'processing',
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('Supabase insert warning for test order:', dbErr);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: json.id,
        status: json.status,
        courier: json.courier,
        note: json.order_note,
        order_number: orderNumber,
      },
      raw: json,
    });
  } catch (err) {
    console.error('Test order creation error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * GET — Retrieve a test order by ID
 */
export async function GET(req: NextRequest) {
  try {
    if (!BITESHIP_TEST_KEY) {
      return NextResponse.json(
        { success: false, error: 'BITESHIP_TEST_API_KEY not configured' },
        { status: 500 },
      );
    }

    const orderId = req.nextUrl.searchParams.get('id');
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing ?id= query parameter' },
        { status: 400 },
      );
    }

    const res = await fetch(`${BITESHIP_BASE_URL}/v1/orders/${orderId}`, {
      method: 'GET',
      headers: { Authorization: BITESHIP_TEST_KEY },
      cache: 'no-store',
    });

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: json.error || 'Failed to retrieve order', detail: json },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, order: json });
  } catch (err) {
    console.error('Test order retrieval error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
