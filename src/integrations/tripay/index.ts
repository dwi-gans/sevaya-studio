import crypto from 'crypto';

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY!;
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY!;
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE!;
const IS_PRODUCTION = process.env.TRIPAY_IS_PRODUCTION !== 'false';
const TRIPAY_BASE_URL = IS_PRODUCTION
  ? 'https://tripay.co.id/api'
  : 'https://tripay.co.id/api-sandbox';

export interface TripayOrderItem {
  name: string;
  price: number;
  quantity: number;
  product_url?: string;
  image_url?: string;
}

export interface CreateTripayTransactionParams {
  merchant_ref: string; // = order_number
  method: string;       // e.g. 'BRIVA', 'BNIVA', 'QRIS', dll
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  order_items: TripayOrderItem[];
  expired_time?: number; // unix timestamp, default: sekarang + 24 jam
  return_url?: string;
}

export interface TripayTransactionResult {
  payment_url: string;
  reference: string;
  merchant_ref: string;
  payment_name: string;
  pay_code?: string;
  pay_url?: string;
  checkout_url: string;
}

/**
 * Generate signature TriPay untuk create transaction:
 * HMAC-SHA256(merchant_code + merchant_ref + amount, private_key)
 */
export function generateTripaySignature(merchantRef: string, amount: number): string {
  return crypto
    .createHmac('sha256', TRIPAY_PRIVATE_KEY)
    .update(`${TRIPAY_MERCHANT_CODE}${merchantRef}${amount}`)
    .digest('hex');
}

/**
 * Verifikasi signature callback dari TriPay:
 * HMAC-SHA256(rawBody, private_key) harus sama dengan header X-Callback-Signature
 */
export function verifyTripayCallback(rawBody: string, receivedSignature: string): boolean {
  if (!TRIPAY_PRIVATE_KEY || !receivedSignature) return false;
  try {
    const expected = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(receivedSignature, 'hex');

    if (expectedBuf.length === 0 || expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Buat transaksi closed payment TriPay
 */
export async function createTripayTransaction(
  params: CreateTripayTransactionParams,
): Promise<TripayTransactionResult> {
  if (!TRIPAY_API_KEY || !TRIPAY_PRIVATE_KEY || !TRIPAY_MERCHANT_CODE) {
    throw new Error('TriPay credentials not configured. Pastikan TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, dan TRIPAY_MERCHANT_CODE ada di .env.local');
  }

  const roundedAmount = Math.round(params.amount);
  if (roundedAmount <= 0) throw new Error('Invalid payment amount');

  const expiredTime =
    params.expired_time || Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const signature = generateTripaySignature(params.merchant_ref, roundedAmount);

  const payload = {
    method: params.method,
    merchant_ref: params.merchant_ref,
    amount: roundedAmount,
    customer_name: String(params.customer_name || 'Pelanggan SEVAYA').slice(0, 50),
    customer_email: String(params.customer_email || '').trim(),
    customer_phone: String(params.customer_phone || '')
      .trim()
      .replace(/^0/, '+62'),
    order_items: params.order_items.map((it) => ({
      name: String(it.name || 'Produk SEVAYA').slice(0, 50),
      price: Math.max(0, Math.round(Number(it.price) || 0)),
      quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
      ...(it.product_url ? { product_url: it.product_url } : {}),
      ...(it.image_url ? { image_url: it.image_url } : {}),
    })),
    return_url:
      params.return_url ||
      `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://sevaya-studio.com').replace(/\/$/, '')}/order-confirmation`,
    expired_time: expiredTime,
    signature,
  };

  const res = await fetch(`${TRIPAY_BASE_URL}/transaction/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TRIPAY_API_KEY}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    console.error('[TriPay Transaction Error]', json);
    throw new Error(json.message || 'Gagal membuat transaksi TriPay');
  }

  const data = json.data;
  return {
    payment_url: data.checkout_url,
    reference: data.reference,
    merchant_ref: data.merchant_ref,
    payment_name: data.payment_name,
    pay_code: data.pay_code,
    pay_url: data.pay_url,
    checkout_url: data.checkout_url,
  };
}
