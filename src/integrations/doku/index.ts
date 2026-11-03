import crypto from 'crypto';

const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || 'BRN-0202-1793525474119';
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || 'SK-E424Pzl4lnRKKFZmCBah';
const IS_PRODUCTION = process.env.DOKU_IS_PRODUCTION !== 'false';

const DOKU_BASE_URL = IS_PRODUCTION ? 'https://api.doku.com' : 'https://api-sandbox.doku.com';

export interface DokuItemDetail {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DokuCustomerDetail {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface CreateDokuPaymentParams {
  order_id: string;
  amount: number;
  items?: DokuItemDetail[];
  customer?: DokuCustomerDetail;
  callback_url?: string;
  payment_method_types?: string[];
}

/**
 * Generate HMAC-SHA256 Signature for DOKU Checkout API
 */
export function generateDokuHeaders(
  requestTarget: string,
  requestBody: Record<string, unknown> | string,
  requestId: string = crypto.randomUUID(),
  requestTimestamp: string = new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
) {
  const stringBody = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
  const digest = crypto.createHash('sha256').update(stringBody).digest('base64');

  const componentString =
    `Client-Id:${DOKU_CLIENT_ID}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${requestTimestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digest}`;

  const hmac = crypto.createHmac('sha256', DOKU_SECRET_KEY).update(componentString).digest('base64');
  const signature = `HMACSHA256=${hmac}`;

  return {
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': DOKU_CLIENT_ID,
      'Request-Id': requestId,
      'Request-Timestamp': requestTimestamp,
      Digest: digest,
      Signature: signature,
    },
    digest,
    signature,
    stringBody,
  };
}

/**
 * Sanitize item name to only allow characters accepted by DOKU API:
 * a-z A-Z 0-9 . - / + , = _ : ' @ % ( ) and space
 */
function cleanDokuName(name: string): string {
  return String(name || 'Item')
    .replace(/&/g, 'dan')
    .replace(/[^a-zA-Z0-9.\-/+,=_:'@%() ]/g, '')
    .slice(0, 50);
}

/**
 * Build line_items array that always sums to roundedAmount.
 * - If items total equals amount → use as-is.
 * - If amount > items total → append a "Ongkos Kirim dan Layanan" line for the difference.
 * - If amount < items total → collapse to a single line to avoid mismatch.
 * - If no items provided → return undefined (don't send line_items).
 */
function buildLineItems(
  items: DokuItemDetail[],
  roundedAmount: number,
  orderId: string,
): Array<{ name: string; price: number; quantity: number }> | undefined {
  if (!items || items.length === 0) return undefined;

  const rawLineItems = items.map((it) => ({
    name: cleanDokuName(it.name || 'Produk SEVAYA'),
    price: Math.max(0, Math.round(Number(it.price) || 0)),
    quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
  }));

  const itemsTotal = rawLineItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  if (itemsTotal === roundedAmount) {
    return rawLineItems;
  } else if (roundedAmount > itemsTotal) {
    // Append shipping / service fee line to balance the total
    rawLineItems.push({
      name: 'Ongkos Kirim dan Layanan',
      price: roundedAmount - itemsTotal,
      quantity: 1,
    });
    return rawLineItems;
  } else {
    // items exceed total (shouldn't happen) → collapse to single line
    return [{ name: cleanDokuName(`Pesanan SEVAYA ${orderId}`), price: roundedAmount, quantity: 1 }];
  }
}

/**
 * Create a DOKU Checkout Payment Session
 * Returns payment url and token
 */
export async function createDokuCheckoutSession(params: CreateDokuPaymentParams): Promise<{
  payment_url: string;
  invoice_number: string;
  token?: string;
}> {
  if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
    throw new Error('DOKU_CLIENT_ID or DOKU_SECRET_KEY is not configured');
  }

  const roundedAmount = Math.round(Number(params.amount) || 0);
  if (roundedAmount <= 0) {
    throw new Error('Invalid payment amount');
  }

  const allowedChannels =
    params.payment_method_types && params.payment_method_types.length > 0
      ? params.payment_method_types
      : [
          'VIRTUAL_ACCOUNT_BRI',
          'VIRTUAL_ACCOUNT_BNI',
          'VIRTUAL_ACCOUNT_BSI',
          'VIRTUAL_ACCOUNT_BANK_MANDIRI',
          'VIRTUAL_ACCOUNT_DOKU',
          'ONLINE_TO_OFFLINE_ALFA',
          'ONLINE_TO_OFFLINE_INDOMARET',
        ];

  const payload: Record<string, unknown> = {
    order: {
      amount: roundedAmount,
      invoice_number: params.order_id,
      currency: 'IDR',
      callback_url: params.callback_url || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sevaya-studio.com'}/profile/orders/${encodeURIComponent(params.order_id)}`,
      callback_url_cancel: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sevaya-studio.com'}/profile/orders/${encodeURIComponent(params.order_id)}`,
    },
    payment: {
      payment_due_date: 60, // 60 minutes
      payment_method_types: allowedChannels,
    },
  };

  const lineItems = buildLineItems(params.items || [], roundedAmount, params.order_id);
  if (lineItems) {
    (payload.order as Record<string, unknown>).line_items = lineItems;
  }

  if (params.customer) {
    payload.customer = {
      name: String(params.customer.name || 'Pelanggan SEVAYA').slice(0, 100),
      email: String(params.customer.email || '').trim(),
      phone: String(params.customer.phone || '').trim().replace(/^0/, '62'),
    };
  }

  const requestTarget = '/checkout/v1/payment';
  const { headers, stringBody } = generateDokuHeaders(requestTarget, payload);

  const res = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
    method: 'POST',
    headers,
    body: stringBody,
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('[DOKU Checkout Error]', json);
    const errorMsg = Array.isArray(json.message) ? json.message.join(', ') : json.error?.message || json.message || 'Gagal membuat sesi pembayaran DOKU';
    throw new Error(errorMsg);
  }

  const paymentUrl = json.response?.payment?.url || json.payment?.url;
  if (!paymentUrl) {
    throw new Error('DOKU tidak mengembalikan URL pembayaran');
  }

  return {
    payment_url: paymentUrl,
    invoice_number: params.order_id,
    token: json.response?.payment?.token || json.payment?.token,
  };
}

/**
 * Verify Webhook Signature from DOKU Notification
 */
export function verifyDokuWebhookSignature(
  rawBody: string,
  headers: {
    clientId?: string | null;
    requestId?: string | null;
    requestTimestamp?: string | null;
    signature?: string | null;
  },
  requestTarget: string = '/api/webhooks/doku',
): boolean {
  if (!DOKU_SECRET_KEY) return false;
  if (!headers.signature) return false;

  const digest = crypto.createHash('sha256').update(rawBody).digest('base64');
  const componentString =
    `Client-Id:${headers.clientId || DOKU_CLIENT_ID}\n` +
    `Request-Id:${headers.requestId || ''}\n` +
    `Request-Timestamp:${headers.requestTimestamp || ''}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digest}`;

  const hmac = crypto.createHmac('sha256', DOKU_SECRET_KEY).update(componentString).digest('base64');
  const expectedSignature = `HMACSHA256=${hmac}`;

  return expectedSignature.toLowerCase() === headers.signature.toLowerCase();
}
