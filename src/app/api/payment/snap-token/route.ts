import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSnapTransaction } from '@/integrations/midtrans';
import { createDokuCheckoutSession } from '@/integrations/doku';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, grand_total: clientGrandTotal, items: clientItems, customer: clientCustomer } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'Nomor pesanan (order_id) wajib disertakan.' },
        { status: 400 },
      );
    }

    // 1. Fetch official order from database to ensure price cannot be manipulated from client
    let finalGrandTotal = Number(clientGrandTotal) || 0;
    let finalItems = clientItems;
    let finalCustomer = clientCustomer;

    try {
      const { data: dbOrder } = await supabaseAdmin
        .from('orders')
        .select('grand_total, items, customer_name, customer_email, customer_phone')
        .eq('order_number', order_id)
        .maybeSingle();

      if (dbOrder && typeof dbOrder.grand_total === 'number' && dbOrder.grand_total > 0) {
        // ALWAYS use database verified grand total
        finalGrandTotal = Math.round(dbOrder.grand_total);

        // If items are stored in db, parse and use them
        if (dbOrder.items) {
          try {
            const parsed = typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items;
            if (Array.isArray(parsed) && parsed.length > 0) {
              finalItems = parsed.map((it: any, idx: number) => ({
                id: String(it.id || `item-${idx}`),
                name: String(it.title || it.name || 'Abaya SEVAYA'),
                price: Math.round(Number(it.price) || finalGrandTotal),
                quantity: Math.round(Number(it.quantity) || 1),
              }));
            }
          } catch {
            // fallback to client items
          }
        }

        // Use official customer details from db
        const nameParts = (dbOrder.customer_name || '').split(' ');
        finalCustomer = {
          first_name: nameParts[0] || 'Pelanggan',
          last_name: nameParts.slice(1).join(' ') || '',
          email: dbOrder.customer_email || clientCustomer?.email || '',
          phone: dbOrder.customer_phone || clientCustomer?.phone || '',
        };
      }
    } catch (dbErr) {
      console.warn('[Payment Token DB Lookup Warning]:', dbErr);
    }

    if (!finalGrandTotal || finalGrandTotal <= 0) {
      return NextResponse.json(
        { success: false, error: 'Nominal transaksi tidak valid.' },
        { status: 400 },
      );
    }

    // 2. Try DOKU Payment Gateway first if credentials are configured
    const dokuClientId = process.env.DOKU_CLIENT_ID;
    const dokuSecretKey = process.env.DOKU_SECRET_KEY;

    if (dokuClientId && dokuSecretKey) {
      try {
        const customerFullName =
          [finalCustomer?.first_name, finalCustomer?.last_name].filter(Boolean).join(' ') ||
          'Pelanggan SEVAYA';

        const dokuSession = await createDokuCheckoutSession({
          order_id,
          amount: finalGrandTotal,
          items: finalItems?.map((it: any) => ({
            name: it.name || it.title || 'Produk SEVAYA',
            price: Math.round(Number(it.price) || finalGrandTotal),
            quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
          })),
          customer: {
            name: customerFullName,
            email: finalCustomer?.email || 'customer@sevaya.id',
            phone: finalCustomer?.phone || '',
          },
        });

        console.log(`[DOKU Session Created] Order: ${order_id}, URL: ${dokuSession.payment_url}`);

        return NextResponse.json({
          success: true,
          gateway: 'doku',
          payment_url: dokuSession.payment_url,
          redirect_url: dokuSession.payment_url,
          token: dokuSession.token || dokuSession.payment_url,
          gross_amount: finalGrandTotal,
        });
      } catch (dokuErr: any) {
        console.warn('[DOKU Checkout Fallback to Midtrans]:', dokuErr.message);
        // If DOKU payment channels are inactive, gracefully fallback to Midtrans
      }
    }

    // 3. Midtrans Gateway Fallback
    const { token, redirect_url } = await createSnapTransaction({
      order_id,
      gross_amount: finalGrandTotal,
      items: finalItems,
      customer: finalCustomer,
    });

    return NextResponse.json({
      success: true,
      gateway: 'midtrans',
      token,
      redirect_url,
      gross_amount: finalGrandTotal,
    });
  } catch (err) {
    console.error('API /api/payment/snap-token error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
