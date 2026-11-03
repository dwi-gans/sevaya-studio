import { NextRequest, NextResponse } from 'next/server';
import { generateDokuHeaders } from '@/integrations/doku';

const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID!;
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY!;
const IS_PRODUCTION = process.env.DOKU_IS_PRODUCTION !== 'false';
const DOKU_BASE_URL = IS_PRODUCTION ? 'https://api.doku.com' : 'https://api-sandbox.doku.com';

export async function GET(req: NextRequest) {
  // Only allow admin
  const adminKey = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('key');
  if (adminKey !== 'sevaya-admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const testPayload = {
    order: {
      amount: 10000,
      invoice_number: `TEST-DEBUG-${Date.now()}`,
      currency: 'IDR',
      callback_url: 'https://sevaya-studio.com/profile/orders/test',
    },
    payment: {
      payment_due_date: 60,
    },
    customer: {
      name: 'Test Customer',
      email: 'test@sevaya.id',
      phone: '6281234567890',
    },
  };

  const requestTarget = '/checkout/v1/payment';
  const { headers, stringBody } = generateDokuHeaders(requestTarget, testPayload);

  const res = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
    method: 'POST',
    headers,
    body: stringBody,
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));

  return NextResponse.json({
    status: res.status,
    ok: res.ok,
    env: {
      client_id: DOKU_CLIENT_ID,
      is_production: IS_PRODUCTION,
      base_url: DOKU_BASE_URL,
      has_secret: !!DOKU_SECRET_KEY,
    },
    doku_response: json,
    payment_url: json.response?.payment?.url || json.payment?.url || null,
  });
}
