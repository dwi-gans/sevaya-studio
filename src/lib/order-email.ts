import { sendEmail } from './resend';

export interface OrderEmailItem {
  name?: string;
  title?: string;
  price?: number;
  quantity?: number;
  color?: string;
  size?: string;
  image?: string;
  edition?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderEmailItem[];
  subtotal: number;
  discount?: number;
  shippingCost: number;
  grandTotal: number;
  paymentMethod: string;
  courierName?: string;
  createdAt?: string;
  paymentUrl?: string;
  giftFee?: number;
  taxes?: number;
}

const formatIDR = (n?: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

function formatDateWIB(isoDate?: string): string {
  try {
    const d = isoDate ? new Date(isoDate) : new Date();
    return (
      new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(d) + ' WIB'
    );
  } catch {
    return '';
  }
}

function escapeHtml(str?: string | number | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const SUPABASE_STORAGE_CATALOG_BASE =
  'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog';

/**
 * Resolves an email image to a live public HTTPS URL on Supabase Storage CDN.
 * Email clients like Gmail, Apple Mail, and Outlook block localhost and paused domains.
 */
function resolveEmailImageUrl(rawImg?: string): string {
  const fallback = `${SUPABASE_STORAGE_CATALOG_BASE}/catalog-01.jpg`;
  if (!rawImg) return fallback;

  // If already an absolute Supabase Storage or external CDN URL that is not localhost / paused domain
  if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
    if (rawImg.includes('localhost') || rawImg.includes('sevaya-studio.com')) {
      const filename = rawImg.split('/').pop()?.split('?')[0];
      if (filename) {
        return `${SUPABASE_STORAGE_CATALOG_BASE}/${encodeURIComponent(filename)}`;
      }
    }
    return rawImg;
  }

  // Relative path like /images/catalog/catalog-01.jpg or catalog-01.jpg
  const filename = rawImg.split('/').pop()?.split('?')[0];
  if (filename) {
    return `${SUPABASE_STORAGE_CATALOG_BASE}/${encodeURIComponent(filename)}`;
  }

  return fallback;
}

function formatAddressLines(name: string, rawAddress?: string): string {
  const safeName = escapeHtml(name || 'Customer');
  if (!rawAddress) {
    return `${safeName}<br>Indonesia`;
  }
  const parts = rawAddress
    .split(/[\r\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const lines = [safeName, ...parts];
  const hasCountry = lines.some((l) => l.toLowerCase().includes('indonesia'));
  if (!hasCountry) {
    lines.push('Indonesia');
  }

  return lines.map((l) => escapeHtml(l)).join('<br>');
}

const buildMinimalItemsHtml = (items: OrderEmailItem[], giftFee?: number) => {
  const itemsRows = (items || [])
    .map((item) => {
      const title = escapeHtml(item.title || item.name || 'Koleksi SEVAYA');
      const price = item.price || 0;
      const qty = item.quantity || 1;
      const variantParts = [item.color, item.size, item.edition].filter(Boolean);
      const variant = variantParts.length > 0 ? variantParts.map((v) => escapeHtml(v)).join(' / ') : 'Standar';

      const fullImageUrl = resolveEmailImageUrl(item.image);

      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid #EEEEEE; padding-bottom: 14px; margin-bottom: 14px;">
          <tr>
            <td width="58" valign="top" style="padding-right: 14px;">
              <img src="${escapeHtml(fullImageUrl)}" alt="${title}" width="52" height="60" style="display: block; width: 52px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ECEAE6; background-color: #F8F6F4;" />
            </td>
            <td valign="middle">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: #111111; line-height: 1.4;">
                ${title} &times; ${qty}
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #767676; margin-top: 3px; line-height: 1.4;">
                ${variant}
              </div>
            </td>
            <td align="right" valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 500; color: #111111; white-space: nowrap; padding-left: 12px;">
              ${formatIDR(price * qty)}
            </td>
          </tr>
        </table>
      `;
    })
    .join('');

  // Only show gift box if the customer explicitly purchased gift packaging (no default/free box)
  let giftRow = '';
  if (typeof giftFee === 'number' && giftFee > 0) {
    giftRow = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid #EEEEEE; padding-bottom: 14px; margin-bottom: 14px;">
        <tr>
          <td width="58" valign="top" style="padding-right: 14px;">
            <div style="width: 52px; height: 48px; border-radius: 4px; border: 1px solid #ECEAE6; background-color: #F8F6F4; text-align: center; line-height: 48px; font-size: 20px;">
              &#128230;
            </div>
          </td>
          <td valign="middle">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: #111111;">
              EXCLUSIVE HARDBOX &bull; GIFT SET &times; 1
            </div>
          </td>
          <td align="right" valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 500; color: #111111; white-space: nowrap; padding-left: 12px;">
            ${formatIDR(giftFee)}
          </td>
        </tr>
      </table>
    `;
  }

  return itemsRows + giftRow;
};

/**
 * 1. EMAIL MENUNGGU PEMBAYARAN (Minimal, editorial clean layout based on reference)
 */
export async function sendOrderPendingPaymentEmail(data: OrderEmailData) {
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_SITE_URL
        : 'https://sevaya-studio.com';

    const payUrl =
      data.paymentUrl || `${siteUrl}/order-confirmation?orderNumber=${encodeURIComponent(data.orderNumber)}`;

    const firstName = (data.customerName || 'Customer').trim().split(' ')[0];
    const itemsHtml = buildMinimalItemsHtml(data.items, data.giftFee);
    const addressHtml = formatAddressLines(data.customerName, data.customerAddress);

    const emailHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ORDER ${escapeHtml(data.orderNumber)} - SEVAYA</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111111;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td { padding: 0; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 24px 16px !important; }
      .col-half { display: block !important; width: 100% !important; margin-bottom: 20px !important; }
      .totals-table { max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF;">
  <center style="width: 100%; background-color: #FFFFFF; text-align: left;">
    <div class="email-wrapper" style="max-width: 540px; margin: 0 auto; padding: 36px 20px 48px 20px;">
      
      <!-- Top Bar: Brand & Order Number -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
        <tr>
          <td valign="middle">
            <span style="font-family: 'Avenir Next', 'Avenir', 'Helvetica Neue', Arial, -apple-system, sans-serif; font-size: 20px; font-weight: 700; color: #111111; letter-spacing: 0.22em; text-transform: uppercase;">
              SEVAYA
            </span>
          </td>
          <td align="right" valign="middle">
            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: #111111; letter-spacing: 0.05em; text-transform: uppercase;">
              ORDER ${escapeHtml(data.orderNumber)}
            </span>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: #888888; margin-top: 3px;">
              ${escapeHtml(formatDateWIB(data.createdAt))}
            </div>
          </td>
        </tr>
      </table>

      <!-- Greeting & Instructions -->
      <h1 style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 500; color: #111111; line-height: 1.35;">
        Hi ${escapeHtml(firstName)}, Thank you for your purchase!
      </h1>

      <p style="margin: 0 0 14px 0; font-size: 13px; line-height: 1.6; color: #666666;">
        Please review your order details below and complete the payment within 10 minutes after placing an order. You&#039;ll get a confirmation email after completing your payment. Thank you!
      </p>

      <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #666666;">
        If you want to continue the payment, please use the button below or check the payment link from Midtrans:
      </p>

      <!-- Action Button & Store Link -->
      <div style="margin: 0 0 32px 0;">
        <a href="${payUrl}" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-right: 14px;">
          Complete Payment
        </a>
        <a href="${siteUrl}/shop" style="display: inline-block; font-size: 13px; font-weight: 500; color: #111111; text-decoration: underline;">
          Visit our store
        </a>
      </div>

      <!-- Section: Order summary -->
      <h2 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #111111; letter-spacing: -0.01em;">
        Order summary
      </h2>

      <!-- Items List -->
      ${itemsHtml}

      <!-- Cost Summary Breakdown -->
      <table role="presentation" align="right" class="totals-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 320px; margin-top: 8px; margin-bottom: 32px;">
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #555555;">Subtotal</td>
          <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">${formatIDR(data.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #555555;">Shipping</td>
          <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">${formatIDR(data.shippingCost)}</td>
        </tr>
        ${
          data.discount
            ? `<tr>
                <td style="padding: 4px 0; font-size: 13px; color: #555555;">Discount</td>
                <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">-${formatIDR(data.discount)}</td>
              </tr>`
            : ''
        }
        ${
          data.taxes
            ? `<tr>
                <td style="padding: 4px 0; font-size: 13px; color: #555555;">Taxes</td>
                <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">${formatIDR(data.taxes)}</td>
              </tr>`
            : ''
        }
        <tr>
          <td colspan="2" style="padding: 10px 0 6px 0;">
            <div style="border-top: 1px solid #E5E5E5;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #111111;">Total</td>
          <td align="right" style="padding: 6px 0; font-size: 18px; font-weight: bold; color: #111111;">${formatIDR(data.grandTotal)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0 10px 0; font-size: 12px; color: #767676;">Total paid today</td>
          <td align="right" style="padding: 4px 0 10px 0; font-size: 13px; font-weight: 500; color: #111111;">Rp 0</td>
        </tr>
        <tr>
          <td colspan="2">
            <div style="border-bottom: 1px solid #E5E5E5;"></div>
          </td>
        </tr>
      </table>

      <div style="clear: both;"></div>

      <!-- Section: Customer information -->
      <h2 style="margin: 32px 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #111111; letter-spacing: -0.01em;">
        Customer information
      </h2>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <td width="48%" valign="top" class="col-half">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 8px;">
              Shipping address
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #666666;">
              ${addressHtml}
            </div>
          </td>
          <td width="4%" class="col-half"></td>
          <td width="48%" valign="top" class="col-half">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 8px;">
              Billing address
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #666666;">
              ${addressHtml}
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="3" style="padding-top: 20px;">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 6px;">
              Shipping method
            </div>
            <div style="font-size: 12px; line-height: 1.5; color: #666666;">
              ${escapeHtml(data.courierName || 'JNE - Reguler')}
            </div>
          </td>
        </tr>
      </table>

      <!-- Footer Help -->
      <div style="border-top: 1px solid #EEEEEE; padding-top: 24px; margin-top: 36px;">
        <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #767676;">
          If you have any questions, reply to this email or contact us at <a href="mailto:sevayaofficial@gmail.com" style="color: #111111; text-decoration: none; font-weight: 600;">sevayaofficial@gmail.com</a>
        </p>
      </div>

    </div>
  </center>
</body>
</html>`;

    const recipient = data.customerEmail?.trim();
    if (!recipient) {
      console.warn(`[Resend Pending Email Skipped] Customer email missing for order ${data.orderNumber}`);
      return { success: false, error: 'Customer email address missing' };
    }
    const sendResult = await sendEmail({
      to: recipient,
      subject: `Order ${escapeHtml(data.orderNumber)} confirmed — Complete your payment`,
      html: emailHtml,
    });

    if (!sendResult.success) {
      const errorMsg = String((sendResult.error as any)?.message || sendResult.error || '');
      if (errorMsg.includes('only send testing emails')) {
        console.warn(
          `[Resend Sandbox Restriction] Cannot send to ${recipient}. ` +
          `Order ${escapeHtml(data.orderNumber)} created — pending payment email skipped.`
        );
        return { success: false, sandboxRestriction: true, error: 'resend_sandbox_restriction' };
      }
      console.warn('[Resend Pending Email Error]:', sendResult.error);
    } else {
      console.log('[Resend Pending Payment Email Sent]:', (sendResult.data as any)?.id || 'OK');
    }
    return sendResult;
  } catch (err) {
    console.warn('[Resend Pending Email Error]:', err);
    return { success: false, error: err };
  }
}

/**
 * 2. EMAIL PEMBAYARAN BERHASIL (Minimal, clean receipt layout)
 */
export async function sendOrderPaidReceiptEmail(data: OrderEmailData) {
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_SITE_URL
        : 'https://sevaya-studio.com';

    const orderUrl = `${siteUrl}/order-confirmation?orderNumber=${encodeURIComponent(data.orderNumber)}`;

    const firstName = (data.customerName || 'Customer').trim().split(' ')[0];
    const itemsHtml = buildMinimalItemsHtml(data.items, data.giftFee);
    const addressHtml = formatAddressLines(data.customerName, data.customerAddress);

    const emailHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt ORDER ${escapeHtml(data.orderNumber)} - SEVAYA</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111111;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td { padding: 0; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 24px 16px !important; }
      .col-half { display: block !important; width: 100% !important; margin-bottom: 20px !important; }
      .totals-table { max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF;">
  <center style="width: 100%; background-color: #FFFFFF; text-align: left;">
    <div class="email-wrapper" style="max-width: 540px; margin: 0 auto; padding: 36px 20px 48px 20px;">
      
      <!-- Top Bar: Brand & Order Number -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
        <tr>
          <td valign="middle">
            <span style="font-family: 'Avenir Next', 'Avenir', 'Helvetica Neue', Arial, -apple-system, sans-serif; font-size: 20px; font-weight: 700; color: #111111; letter-spacing: 0.22em; text-transform: uppercase;">
              SEVAYA
            </span>
          </td>
          <td align="right" valign="middle">
            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: #111111; letter-spacing: 0.05em; text-transform: uppercase;">
              ORDER ${escapeHtml(data.orderNumber)}
            </span>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: #888888; margin-top: 3px;">
              ${escapeHtml(formatDateWIB(data.createdAt))}
            </div>
          </td>
        </tr>
      </table>

      <!-- Greeting & Confirmation -->
      <h1 style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 500; color: #111111; line-height: 1.35;">
        Hi ${escapeHtml(firstName)}, Thank you for your purchase!
      </h1>

      <p style="margin: 0 0 14px 0; font-size: 13px; line-height: 1.6; color: #666666;">
        We&#039;re pleased to let you know that your payment has been successfully received and verified. Your order is now being carefully prepared by our team and will be dispatched shortly.
      </p>

      <!-- Action Button & Store Link -->
      <div style="margin: 0 0 32px 0;">
        <a href="${orderUrl}" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-right: 14px;">
          View Order Status
        </a>
        <a href="${siteUrl}/shop" style="display: inline-block; font-size: 13px; font-weight: 500; color: #111111; text-decoration: underline;">
          Visit our store
        </a>
      </div>

      <!-- Section: Order summary -->
      <h2 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #111111; letter-spacing: -0.01em;">
        Order summary
      </h2>

      <!-- Items List -->
      ${itemsHtml}

      <!-- Cost Summary Breakdown -->
      <table role="presentation" align="right" class="totals-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 320px; margin-top: 8px; margin-bottom: 32px;">
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #555555;">Subtotal</td>
          <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">${formatIDR(data.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #555555;">Shipping</td>
          <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">${formatIDR(data.shippingCost)}</td>
        </tr>
        ${
          data.discount
            ? `<tr>
                <td style="padding: 4px 0; font-size: 13px; color: #555555;">Discount</td>
                <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">-${formatIDR(data.discount)}</td>
              </tr>`
            : ''
        }
        ${
          data.taxes
            ? `<tr>
                <td style="padding: 4px 0; font-size: 13px; color: #555555;">Taxes</td>
                <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">${formatIDR(data.taxes)}</td>
              </tr>`
            : ''
        }
        <tr>
          <td colspan="2" style="padding: 10px 0 6px 0;">
            <div style="border-top: 1px solid #E5E5E5;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #111111;">Total</td>
          <td align="right" style="padding: 6px 0; font-size: 18px; font-weight: bold; color: #111111;">${formatIDR(data.grandTotal)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0 10px 0; font-size: 12px; color: #767676;">Total paid today</td>
          <td align="right" style="padding: 4px 0 10px 0; font-size: 13px; font-weight: 500; color: #111111;">${formatIDR(data.grandTotal)}</td>
        </tr>
        <tr>
          <td colspan="2">
            <div style="border-bottom: 1px solid #E5E5E5;"></div>
          </td>
        </tr>
      </table>

      <div style="clear: both;"></div>

      <!-- Section: Customer information -->
      <h2 style="margin: 32px 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #111111; letter-spacing: -0.01em;">
        Customer information
      </h2>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <td width="48%" valign="top" class="col-half">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 8px;">
              Shipping address
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #666666;">
              ${addressHtml}
            </div>
          </td>
          <td width="4%" class="col-half"></td>
          <td width="48%" valign="top" class="col-half">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 8px;">
              Billing address
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #666666;">
              ${addressHtml}
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="3" style="padding-top: 20px;">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 6px;">
              Shipping method
            </div>
            <div style="font-size: 12px; line-height: 1.5; color: #666666;">
              ${escapeHtml(data.courierName || 'JNE - Reguler')}
            </div>
          </td>
        </tr>
      </table>

      <!-- Footer Help -->
      <div style="border-top: 1px solid #EEEEEE; padding-top: 24px; margin-top: 36px;">
        <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #767676;">
          If you have any questions, reply to this email or contact us at <a href="mailto:sevayaofficial@gmail.com" style="color: #111111; text-decoration: none; font-weight: 600;">sevayaofficial@gmail.com</a>
        </p>
      </div>

    </div>
  </center>
</body>
</html>`;

    const recipient = data.customerEmail?.trim();
    if (!recipient) {
      console.warn(`[Resend Pending Email Skipped] Customer email missing for order ${data.orderNumber}`);
      return { success: false, error: 'Customer email address missing' };
    }
    const sendResult = await sendEmail({
      to: recipient,
      subject: `Order ${escapeHtml(data.orderNumber)} payment confirmed — Thank you for your purchase`,
      html: emailHtml,
    });

    if (!sendResult.success) {
      const errorMsg = String((sendResult.error as any)?.message || sendResult.error || '');
      if (errorMsg.includes('only send testing emails')) {
        console.warn(
          `[Resend Sandbox Restriction] Cannot send to ${recipient}. ` +
          `Order ${escapeHtml(data.orderNumber)} paid — email receipt skipped.`
        );
        return { success: false, sandboxRestriction: true, error: 'resend_sandbox_restriction' };
      }
      console.warn('[Resend Paid Receipt Email Error]:', sendResult.error);
    } else {
      console.log('[Resend Paid Receipt Email Sent]:', (sendResult.data as any)?.id || 'OK');
    }
    return sendResult;
  } catch (err) {
    console.warn('[Resend Paid Receipt Email Error]:', err);
    return { success: false, error: err };
  }
}

/**
 * Backwards compatibility alias for sendOrderPaidReceiptEmail
 */
export async function sendOrderReceiptEmail(data: OrderEmailData) {
  return sendOrderPaidReceiptEmail(data);
}

/**
 * 3. EMAIL PESANAN DIBATALKAN (Minimal, clean layout)
 */
export async function sendOrderCancelledEmail(data: OrderEmailData & { cancelReason?: string }) {
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_SITE_URL
        : 'https://sevaya-studio.com';

    const shopUrl = `${siteUrl}/shop`;
    const firstName = (data.customerName || 'Customer').trim().split(' ')[0];
    const itemsHtml = buildMinimalItemsHtml(data.items, data.giftFee);
    const addressHtml = formatAddressLines(data.customerName, data.customerAddress);

    const emailHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order ${escapeHtml(data.orderNumber)} Cancelled - SEVAYA</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111111;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td { padding: 0; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 24px 16px !important; }
      .col-half { display: block !important; width: 100% !important; margin-bottom: 20px !important; }
      .totals-table { max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF;">
  <center style="width: 100%; background-color: #FFFFFF; text-align: left;">
    <div class="email-wrapper" style="max-width: 540px; margin: 0 auto; padding: 36px 20px 48px 20px;">
      
      <!-- Top Bar: Brand & Order Number -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
        <tr>
          <td valign="middle">
            <span style="font-family: 'Avenir Next', 'Avenir', 'Helvetica Neue', Arial, -apple-system, sans-serif; font-size: 20px; font-weight: 700; color: #111111; letter-spacing: 0.22em; text-transform: uppercase;">
              SEVAYA
            </span>
          </td>
          <td align="right" valign="middle">
            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: #111111; letter-spacing: 0.05em; text-transform: uppercase;">
              ORDER ${escapeHtml(data.orderNumber)}
            </span>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: #888888; margin-top: 3px;">
              ${escapeHtml(formatDateWIB(data.createdAt))}
            </div>
          </td>
        </tr>
      </table>

      <!-- Greeting & Notice -->
      <h1 style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 500; color: #111111; line-height: 1.35;">
        Hi ${escapeHtml(firstName)}, your order was cancelled
      </h1>

      <p style="margin: 0 0 14px 0; font-size: 13px; line-height: 1.6; color: #666666;">
        Order #${escapeHtml(data.orderNumber)} was automatically cancelled because the payment window of 10 minutes expired. The reserved items have been returned to our inventory.
      </p>

      <!-- Action Button -->
      <div style="margin: 0 0 32px 0;">
        <a href="${shopUrl}" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-right: 14px;">
          Reorder Collection
        </a>
        <a href="${siteUrl}/shop" style="display: inline-block; font-size: 13px; font-weight: 500; color: #111111; text-decoration: underline;">
          Visit our store
        </a>
      </div>

      <!-- Section: Order summary -->
      <h2 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #111111; letter-spacing: -0.01em;">
        Order summary
      </h2>

      <!-- Items List -->
      ${itemsHtml}

      <!-- Cost Summary Breakdown -->
      <table role="presentation" align="right" class="totals-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 320px; margin-top: 8px; margin-bottom: 32px;">
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #555555;">Subtotal</td>
          <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">${formatIDR(data.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #555555;">Shipping</td>
          <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">${formatIDR(data.shippingCost)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px 0 6px 0;">
            <div style="border-top: 1px solid #E5E5E5;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #111111;">Total</td>
          <td align="right" style="padding: 6px 0; font-size: 18px; font-weight: bold; color: #111111;">${formatIDR(data.grandTotal)}</td>
        </tr>
        <tr>
          <td colspan="2">
            <div style="border-bottom: 1px solid #E5E5E5;"></div>
          </td>
        </tr>
      </table>

      <div style="clear: both;"></div>

      <!-- Section: Customer information -->
      <h2 style="margin: 32px 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #111111; letter-spacing: -0.01em;">
        Customer information
      </h2>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <td width="48%" valign="top" class="col-half">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 8px;">
              Shipping address
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #666666;">
              ${addressHtml}
            </div>
          </td>
          <td width="4%" class="col-half"></td>
          <td width="48%" valign="top" class="col-half">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 8px;">
              Billing address
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #666666;">
              ${addressHtml}
            </div>
          </td>
        </tr>
      </table>

      <!-- Footer Help -->
      <div style="border-top: 1px solid #EEEEEE; padding-top: 24px; margin-top: 36px;">
        <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #767676;">
          If you have any questions, reply to this email or contact us at <a href="mailto:sevayaofficial@gmail.com" style="color: #111111; text-decoration: none; font-weight: 600;">sevayaofficial@gmail.com</a>
        </p>
      </div>

    </div>
  </center>
</body>
</html>`;

    const recipient = data.customerEmail?.trim();
    if (!recipient) {
      console.warn(`[Resend Pending Email Skipped] Customer email missing for order ${data.orderNumber}`);
      return { success: false, error: 'Customer email address missing' };
    }
    const sendResult = await sendEmail({
      to: recipient,
      subject: `Order ${escapeHtml(data.orderNumber)} cancelled`,
      html: emailHtml,
    });

    if (!sendResult.success) {
      console.warn('[Resend Cancelled Email Error]:', sendResult.error);
    } else {
      console.log('[Resend Cancelled Email Sent]:', (sendResult.data as any)?.id || 'OK');
    }
    return sendResult;
  } catch (err) {
    console.warn('[Resend Cancelled Email Error]:', err);
    return { success: false, error: err };
  }
}
