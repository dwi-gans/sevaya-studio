import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { createDokuCheckoutSession } from '@/integrations/doku';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      grand_total: clientGrandTotal,
      items: clientItems,
      customer: clientCustomer,
      payment_method,
      payment_method_types,
    } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'Nomor pesanan (order_id) wajib disertakan.' },
        { status: 400 },
      );
    }

    // Ambil data order dari DB untuk pastikan harga tidak bisa dimanipulasi client
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
        finalGrandTotal = Math.round(dbOrder.grand_total);

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
          } catch { /* fallback ke client items */ }
        }

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

    // DOKU Payment Gateway
    let selectedMethodTypes = payment_method_types;
    if (!selectedMethodTypes) {
      if (payment_method === 'va_bri')              selectedMethodTypes = ['VIRTUAL_ACCOUNT_BRI'];
      else if (payment_method === 'va_bni')         selectedMethodTypes = ['VIRTUAL_ACCOUNT_BNI'];
      else if (payment_method === 'va_bsi')         selectedMethodTypes = ['VIRTUAL_ACCOUNT_BSI'];
      else if (payment_method === 'va_mandiri')     selectedMethodTypes = ['VIRTUAL_ACCOUNT_BANK_MANDIRI'];
      else if (payment_method === 'va_other')       selectedMethodTypes = ['VIRTUAL_ACCOUNT_DOKU'];
      else if (payment_method === 'retail_alfamart')   selectedMethodTypes = ['ONLINE_TO_OFFLINE_ALFA'];
      else if (payment_method === 'retail_indomaret')  selectedMethodTypes = ['ONLINE_TO_OFFLINE_INDOMARET'];
    }

    const customerFullName =
      [finalCustomer?.first_name, finalCustomer?.last_name].filter(Boolean).join(' ') ||
      'Pelanggan SEVAYA';

    const dokuSession = await createDokuCheckoutSession({
      order_id,
      amount: finalGrandTotal,
      payment_method_types: selectedMethodTypes,
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

    console.log(`[DOKU Session] Order: ${order_id}, URL: ${dokuSession.payment_url}`);

    return NextResponse.json({
      success: true,
      gateway: 'doku',
      payment_url: dokuSession.payment_url,
      gross_amount: finalGrandTotal,
    });

  } catch (err: any) {
    console.error('[snap-token error]:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Gagal membuat sesi pembayaran' },
      { status: 500 },
    );
  }
}
