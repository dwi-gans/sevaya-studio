import crypto from 'crypto';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const SNAP_API_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransCustomerDetail {
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
  billing_address?: Record<string, string>;
  shipping_address?: Record<string, string>;
}

export interface CreateSnapTransactionParams {
  order_id: string;
  gross_amount: number;
  items?: MidtransItemDetail[];
  customer?: MidtransCustomerDetail;
}

/**
 * Create a Snap transaction and retrieve the snap token + redirect URL
 */
export async function createSnapTransaction(params: CreateSnapTransactionParams): Promise<{
  token: string;
  redirect_url: string;
}> {
  if (!MIDTRANS_SERVER_KEY) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured');
  }

  const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');

  const payload: Record<string, unknown> = {
    transaction_details: {
      order_id: params.order_id,
      gross_amount: Math.round(params.gross_amount),
    },
    credit_card: {
      secure: true,
    },
    usage_limit: 1,
    expiry: {
      unit: 'minute',
      duration: 10,
    },
  };

  if (params.items && params.items.length > 0) {
    const formattedItems = params.items.map((it, idx) => ({
      id: String(it.id || `item-${idx}`).slice(0, 50),
      price: Math.round(Number(it.price) || 0),
      quantity: Number(it.quantity) || 1,
      name: String(it.name || 'Produk SEVAYA').slice(0, 50),
    }));

    // In Midtrans, sum(price * qty) must exactly match gross_amount.
    // If it matches, send item_details; if not, omit to prevent Midtrans 400 error.
    const itemsTotal = formattedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
    if (itemsTotal === Math.round(params.gross_amount)) {
      payload.item_details = formattedItems;
    }
  }

  if (params.customer) {
    payload.customer_details = {
      first_name: params.customer.first_name,
      last_name: params.customer.last_name || '',
      email: params.customer.email,
      phone: params.customer.phone,
    };
  }

  const res = await fetch(SNAP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('[Midtrans Error]', json);
    throw new Error(json.error_messages?.join(', ') || 'Failed to create Snap transaction');
  }

  return {
    token: json.token,
    redirect_url: json.redirect_url,
  };
}

/**
 * Verify notification signature from Midtrans Webhook
 * SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
): boolean {
  if (!MIDTRANS_SERVER_KEY) return false;

  const raw = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
  const hash = crypto.createHash('sha512').update(raw).digest('hex');
  return hash.toLowerCase() === signatureKey.toLowerCase();
}

/**
 * Check transaction status directly with Midtrans API
 */
export async function checkMidtransStatus(orderId: string): Promise<any> {
  if (!MIDTRANS_SERVER_KEY) return null;

  const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
  const baseUrl = IS_PRODUCTION
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2';

  try {
    const res = await fetch(`${baseUrl}/${encodeURIComponent(orderId)}/status`, {
      headers: {
        Authorization: `Basic ${authString}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[Midtrans Status Check Error]:', err);
    return null;
  }
}

