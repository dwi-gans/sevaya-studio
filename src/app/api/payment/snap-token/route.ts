import { NextRequest, NextResponse } from 'next/server';
import { createSnapTransaction } from '@/integrations/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, grand_total, items, customer } = body;

    if (!order_id || !grand_total) {
      return NextResponse.json(
        { success: false, error: 'Missing order_id or grand_total' },
        { status: 400 },
      );
    }

    const { token, redirect_url } = await createSnapTransaction({
      order_id,
      gross_amount: grand_total,
      items,
      customer,
    });

    return NextResponse.json({
      success: true,
      token,
      redirect_url,
    });
  } catch (err) {
    console.error('API /api/payment/snap-token error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
