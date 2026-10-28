import { sendEmail } from './resend';

export interface OrderEmailItem {
  name?: string;
  title?: string;
  price?: number;
  quantity?: number;
  color?: string;
  size?: string;
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
}

const formatIDR = (n?: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
function escapeHtml(str?: string | number | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


const buildItemsHtml = (items: OrderEmailItem[]) => {
  return (items || [])
    .map((item) => {
      const title = escapeHtml(item.title || item.name || 'Koleksi SEVAYA');
      const price = item.price || 0;
      const qty = item.quantity || 1;
      const variant = [escapeHtml(item.color), escapeHtml(item.size)].filter(Boolean).join(' &bull; ') || 'Standar';

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #EAE5DE; vertical-align: top;">
            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; color: #000000; line-height: 1.4;">
              ${title}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #7A706A;">
              ${variant}
            </p>
          </td>
          <td style="padding: 14px 12px; border-bottom: 1px solid #EAE5DE; vertical-align: top; text-align: center; font-family: monospace; font-size: 12px; color: #7A706A;">
            &times; ${qty}
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #EAE5DE; vertical-align: top; text-align: right; white-space: nowrap;">
            <p style="margin: 0; font-family: monospace; font-size: 13px; font-weight: 600; color: #000000;">
              ${formatIDR(price * qty)}
            </p>
          </td>
        </tr>
      `;
    })
    .join('');
};

/**
 * 1. EMAIL MENUNGGU PEMBAYARAN (Sent immediately upon order creation when payment is not yet made)
 */
export async function sendOrderPendingPaymentEmail(data: OrderEmailData) {
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_SITE_URL
        : 'https://sevaya-studio.com';

    const payUrl =
      data.paymentUrl || `${siteUrl}/order-confirmation?orderNumber=${encodeURIComponent(data.orderNumber)}`;

    const dateStr = data.createdAt
      ? new Date(data.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    const itemsHtml = buildItemsHtml(data.items);

    const emailHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menunggu Pembayaran #${escapeHtml(data.orderNumber)} - SEVAYA</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Inter', 'Segoe UI', Roboto, sans-serif;
      color: #000000;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td { padding: 0; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; padding: 20px 14px !important; }
      .col-block { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
      .col-spacer { height: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF;">
  <center style="width: 100%; background-color: #FFFFFF; padding: 40px 12px;">
    <!-- Main Container -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 8px; overflow: hidden; margin: 0 auto; text-align: left; box-shadow: 0 4px 16px rgba(20, 19, 18, 0.04);">
      
      <!-- Brand Header -->
      <tr>
        <td style="padding: 36px 36px 24px 36px; text-align: center; border-bottom: 1px solid #F0ECE7; background-color: #FFFFFF;">
          <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Century Gothic', sans-serif; font-size: 22px; font-weight: 500; letter-spacing: 0.32em; text-transform: uppercase; color: #000000; line-height: 1;">
            SEVAYA
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #8E837E;">
            Studio &bull; Modest Wear
          </p>
        </td>
      </tr>

      <!-- Pending Payment Alert Banner -->
      <tr>
        <td style="padding: 32px 36px 20px 36px;">
          <!-- Amber Status Tag -->
          <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #92400E;">
              STATUS: MENUNGGU PEMBAYARAN (10 MENIT)
            </p>
            <p style="margin: 6px 0 0 0; font-size: 12px; line-height: 1.5; color: #78350F;">
              Harap segera lakukan pembayaran sebesar <strong>${formatIDR(data.grandTotal)}</strong> dalam kurun waktu <strong>10 menit</strong> agar pesanan Anda tidak otomatis dibatalkan.
            </p>
          </div>

          <h2 style="margin: 0; font-size: 19px; font-weight: 600; color: #000000; letter-spacing: -0.01em; line-height: 1.3;">
            Segera Selesaikan Pembayaran Pesanan Anda
          </h2>
          <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.6; color: #5C544F;">
            Halo <strong>${escapeHtml(data.customerName)}</strong>, pesanan Anda dengan nomor <strong>#${escapeHtml(data.orderNumber)}</strong> telah berhasil kami catat. Item pesanan Anda telah diamankan sementara selama 10 menit.
          </p>

          <!-- Order Metadata -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; padding: 12px 0; border-top: 1px solid #F0ECE7; border-bottom: 1px solid #F0ECE7;">
            <tr>
              <td style="font-size: 11px; font-weight: 600; color: #8E837E; text-transform: uppercase; letter-spacing: 0.08em;">
                Nomor Pesanan
              </td>
              <td style="font-size: 13px; font-family: monospace; font-weight: bold; color: #000000; text-align: right;">
                #${escapeHtml(data.orderNumber)}
              </td>
            </tr>
            <tr>
              <td style="padding-top: 8px; font-size: 11px; font-weight: 600; color: #8E837E; text-transform: uppercase; letter-spacing: 0.08em;">
                Tanggal
              </td>
              <td style="padding-top: 8px; font-size: 12px; color: #000000; text-align: right;">
                ${dateStr}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Prominent Pay Button Callout Box -->
      <tr>
        <td style="padding: 0 36px 28px 36px; text-align: center;">
          <div style="background-color: #FFFFFF; border: 1px solid #EAE5DE; border-radius: 8px; padding: 24px 20px; text-align: center;">
            <p style="margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #7A706A;">
              Total yang Harus Dibayar
            </p>
            <p style="margin: 6px 0 18px 0; font-family: monospace; font-size: 24px; font-weight: 700; color: #000000;">
              ${formatIDR(data.grandTotal)}
            </p>
            <a href="${payUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; padding: 15px 36px; border-radius: 4px;">
              BAYAR SEKARANG
            </a>
            <p style="margin: 12px 0 0 0; font-size: 11px; color: #8E837E;">
              Batas waktu pembayaran: <strong>10 menit</strong> setelah pesanan dibuat.
            </p>
          </div>
        </td>
      </tr>

      <!-- Items List -->
      <tr>
        <td style="padding: 0 36px 20px 36px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <thead>
              <tr style="border-bottom: 1px solid #000000;">
                <th style="padding-bottom: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #000000; text-align: left;">
                  Item
                </th>
                <th style="padding-bottom: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #000000; text-align: center;">
                  Qty
                </th>
                <th style="padding-bottom: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #000000; text-align: right;">
                  Harga
                </th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- Cost Summary -->
      <tr>
        <td style="padding: 0 36px 28px 36px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #7A706A;">Subtotal</td>
              <td style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #000000; text-align: right;">${formatIDR(data.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #7A706A;">Ongkos Kirim (${data.courierName || 'Kurir Reguler'})</td>
              <td style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #000000; text-align: right;">${formatIDR(data.shippingCost)}</td>
            </tr>
            ${
              data.discount
                ? `<tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #2E7D32;">Potongan Diskon</td>
                    <td style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #2E7D32; text-align: right;">-${formatIDR(data.discount)}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding-top: 14px; border-top: 1px solid #000000; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #000000;">
                Total Pembayaran
              </td>
              <td style="padding-top: 14px; border-top: 1px solid #000000; font-size: 16px; font-family: monospace; font-weight: bold; color: #000000; text-align: right;">
                ${formatIDR(data.grandTotal)}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Customer Address & Payment Method -->
      <tr>
        <td style="padding: 24px 36px; background-color: #FFFFFF; border-top: 1px solid #F0ECE7; border-bottom: 1px solid #F0ECE7;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="48%" valign="top" class="col-block">
                <p style="margin: 0; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #8E837E;">
                  Alamat Pengiriman
                </p>
                <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; color: #000000;">
                  ${escapeHtml(data.customerName)}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; line-height: 1.5; color: #5C544F;">
                  ${data.customerAddress || '-'}<br>
                  WhatsApp: ${escapeHtml(data.customerPhone || '-')}
                </p>
              </td>
              <td width="4%" class="col-block col-spacer"></td>
              <td width="48%" valign="top" class="col-block">
                <p style="margin: 0; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #8E837E;">
                  Metode Pembayaran
                </p>
                <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; color: #000000;">
                  ${
                    data.paymentMethod === 'midtrans'
                      ? 'Pembayaran Instan (QRIS / VA / E-Wallet)'
                      : data.paymentMethod === 'cod'
                      ? 'Bayar di Tempat (COD)'
                      : 'Transfer Bank'
                  }
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #92400E; font-weight: 600;">
                  Status: Menunggu Pembayaran
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 24px 36px; text-align: center;">
          <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #7A706A;">
            Pertanyaan mengenai pesanan atau pembayaran?<br>
            Hubungi kami di <a href="mailto:info@sevaya-studio.com" style="color: #000000; font-weight: 600; text-decoration: none;">info@sevaya-studio.com</a> atau WhatsApp <a href="https://wa.me/6281234567890" style="color: #000000; font-weight: 600; text-decoration: none;">+62 812-3456-7890</a>
          </p>
          <p style="margin: 14px 0 0 0; font-size: 10px; color: #A89F9B; letter-spacing: 0.05em;">
            &copy; 2026 SEVAYA Studio. All rights reserved.
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;

    const recipient = data.customerEmail || 'agus2100018486@webmail.uad.ac.id';
    const sendResult = await sendEmail({
      to: recipient,
      subject: `Menunggu Pembayaran #${escapeHtml(data.orderNumber)} — Segera Selesaikan Pembayaran Anda`,
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
 * 2. EMAIL PEMBAYARAN BERHASIL (Sent when payment is verified as paid / settlement / capture)
 */
export async function sendOrderPaidReceiptEmail(data: OrderEmailData) {
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_SITE_URL
        : 'https://sevaya-studio.com';

    const trackingUrl = `${siteUrl}/profile/orders/${encodeURIComponent(data.orderNumber)}`;

    const dateStr = data.createdAt
      ? new Date(data.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    const itemsHtml = buildItemsHtml(data.items);

    const emailHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pembayaran Berhasil #${escapeHtml(data.orderNumber)} - SEVAYA</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Inter', 'Segoe UI', Roboto, sans-serif;
      color: #000000;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td { padding: 0; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; padding: 20px 14px !important; }
      .col-block { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
      .col-spacer { height: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF;">
  <center style="width: 100%; background-color: #FFFFFF; padding: 40px 12px;">
    <!-- Main Receipt Container -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 8px; overflow: hidden; margin: 0 auto; text-align: left; box-shadow: 0 4px 16px rgba(20, 19, 18, 0.04);">
      
      <!-- Brand Header -->
      <tr>
        <td style="padding: 36px 36px 24px 36px; text-align: center; border-bottom: 1px solid #F0ECE7; background-color: #FFFFFF;">
          <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Century Gothic', sans-serif; font-size: 22px; font-weight: 500; letter-spacing: 0.32em; text-transform: uppercase; color: #000000; line-height: 1;">
            SEVAYA
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #8E837E;">
            Studio &bull; Modest Wear
          </p>
        </td>
      </tr>

      <!-- Paid Banner -->
      <tr>
        <td style="padding: 32px 36px 20px 36px;">
          <!-- Green Success Tag -->
          <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #065F46;">
              STATUS: PEMBAYARAN BERHASIL & PESANAN DIPROSES
            </p>
            <p style="margin: 6px 0 0 0; font-size: 12px; line-height: 1.5; color: #047857;">
              Pembayaran Anda sebesar <strong>${formatIDR(data.grandTotal)}</strong> telah berhasil kami terima dan diverifikasi secara otomatis.
            </p>
          </div>

          <h2 style="margin: 0; font-size: 19px; font-weight: 600; color: #000000; letter-spacing: -0.01em; line-height: 1.3;">
            Terima kasih atas pesanan Anda, ${escapeHtml(data.customerName)}
          </h2>
          <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.6; color: #5C544F;">
            Pesanan Anda saat ini sedang disiapkan dengan cermat oleh tim SEVAYA dan akan segera dikirimkan ke alamat Anda. Berikut adalah tanda terima resmi transaksi Anda:
          </p>

          <!-- Order Metadata -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; padding: 12px 0; border-top: 1px solid #F0ECE7; border-bottom: 1px solid #F0ECE7;">
            <tr>
              <td style="font-size: 11px; font-weight: 600; color: #8E837E; text-transform: uppercase; letter-spacing: 0.08em;">
                Nomor Pesanan
              </td>
              <td style="font-size: 13px; font-family: monospace; font-weight: bold; color: #000000; text-align: right;">
                #${escapeHtml(data.orderNumber)}
              </td>
            </tr>
            <tr>
              <td style="padding-top: 8px; font-size: 11px; font-weight: 600; color: #8E837E; text-transform: uppercase; letter-spacing: 0.08em;">
                Tanggal
              </td>
              <td style="padding-top: 8px; font-size: 12px; color: #000000; text-align: right;">
                ${dateStr}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Items List -->
      <tr>
        <td style="padding: 0 36px 20px 36px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <thead>
              <tr style="border-bottom: 1px solid #000000;">
                <th style="padding-bottom: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #000000; text-align: left;">
                  Item
                </th>
                <th style="padding-bottom: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #000000; text-align: center;">
                  Qty
                </th>
                <th style="padding-bottom: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #000000; text-align: right;">
                  Harga
                </th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- Cost Summary -->
      <tr>
        <td style="padding: 0 36px 28px 36px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #7A706A;">Subtotal</td>
              <td style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #000000; text-align: right;">${formatIDR(data.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #7A706A;">Ongkos Kirim (${data.courierName || 'Kurir Reguler'})</td>
              <td style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #000000; text-align: right;">${formatIDR(data.shippingCost)}</td>
            </tr>
            ${
              data.discount
                ? `<tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #2E7D32;">Potongan Diskon</td>
                    <td style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #2E7D32; text-align: right;">-${formatIDR(data.discount)}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding-top: 14px; border-top: 1px solid #000000; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #000000;">
                Total Pembayaran
              </td>
              <td style="padding-top: 14px; border-top: 1px solid #000000; font-size: 16px; font-family: monospace; font-weight: bold; color: #000000; text-align: right;">
                ${formatIDR(data.grandTotal)}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Shipping Address & Payment Method -->
      <tr>
        <td style="padding: 24px 36px; background-color: #FFFFFF; border-top: 1px solid #F0ECE7; border-bottom: 1px solid #F0ECE7;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="48%" valign="top" class="col-block">
                <p style="margin: 0; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #8E837E;">
                  Alamat Pengiriman
                </p>
                <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; color: #000000;">
                  ${escapeHtml(data.customerName)}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; line-height: 1.5; color: #5C544F;">
                  ${data.customerAddress || '-'}<br>
                  WhatsApp: ${escapeHtml(data.customerPhone || '-')}
                </p>
              </td>
              <td width="4%" class="col-block col-spacer"></td>
              <td width="48%" valign="top" class="col-block">
                <p style="margin: 0; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #8E837E;">
                  Metode Pembayaran
                </p>
                <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; color: #000000;">
                  ${
                    data.paymentMethod === 'midtrans'
                      ? 'Pembayaran Instan (QRIS / VA / E-Wallet)'
                      : data.paymentMethod === 'cod'
                      ? 'Bayar di Tempat (COD)'
                      : 'Transfer Bank'
                  }
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857; font-weight: 600;">
                  Status: Lunas / Terverifikasi
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Order Tracking CTA -->
      <tr>
        <td style="padding: 32px 36px; text-align: center;">
          <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 4px;">
            Pantau Status Pesanan
          </a>
          <p style="margin: 14px 0 0 0; font-size: 11px; color: #8E837E;">
            Atau kunjungi <a href="${siteUrl}" style="color: #000000; text-decoration: underline;">${siteUrl.replace('https://', '')}</a>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 24px 36px; border-top: 1px solid #F0ECE7; text-align: center;">
          <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #7A706A;">
            Pertanyaan mengenai pesanan atau pengiriman?<br>
            Hubungi kami di <a href="mailto:info@sevaya-studio.com" style="color: #000000; font-weight: 600; text-decoration: none;">info@sevaya-studio.com</a> atau WhatsApp <a href="https://wa.me/6281234567890" style="color: #000000; font-weight: 600; text-decoration: none;">+62 812-3456-7890</a>
          </p>
          <p style="margin: 14px 0 0 0; font-size: 10px; color: #A89F9B; letter-spacing: 0.05em;">
            &copy; 2026 SEVAYA Studio. All rights reserved.
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;

    const recipient = data.customerEmail || 'agus2100018486@webmail.uad.ac.id';
    const sendResult = await sendEmail({
      to: recipient,
      subject: `Pembayaran Diterima #${escapeHtml(data.orderNumber)} — Pesanan Sedang Disiapkan`,
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
 * 3. EMAIL PESANAN DIBATALKAN (Sent when payment expires after 10 minutes or is cancelled)
 */
export async function sendOrderCancelledEmail(data: OrderEmailData & { cancelReason?: string }) {
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_SITE_URL
        : 'https://sevaya-studio.com';

    const shopUrl = `${siteUrl}/shop`;

    const itemsHtml = buildItemsHtml(data.items);

    const emailHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pesanan Dibatalkan #${escapeHtml(data.orderNumber)} - SEVAYA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Inter', sans-serif; color: #000000;">
  <center style="width: 100%; background-color: #FFFFFF; padding: 40px 16px;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border: 1px solid #E8E2D9; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(20, 19, 18, 0.04);">
      
      <!-- Header Brand -->
      <tr>
        <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #EAE5DE; background-color: #FFFFFF;">
          <h1 style="margin: 0; font-family: 'Century Gothic', -apple-system, sans-serif; font-size: 22px; font-weight: 400; letter-spacing: 0.28em; text-transform: uppercase; color: #000000;">
            SEVAYA
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(0,0,0,0.4);">
            Studio &bull; Modest Wear
          </p>
        </td>
      </tr>

      <!-- Cancellation Alert Banner -->
      <tr>
        <td style="padding: 28px 32px 20px;">
          <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #991B1B;">
              STATUS: PESANAN DIBATALKAN
            </p>
            <p style="margin: 6px 0 0 0; font-size: 12px; line-height: 1.5; color: #7F1D1D;">
              Pesanan <strong>#${escapeHtml(data.orderNumber)}</strong> telah dibatalkan secara otomatis karena melewati batas waktu pembayaran 10 menit.
            </p>
          </div>

          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #000000; letter-spacing: -0.01em;">
            Halo ${escapeHtml(data.customerName)},
          </h2>
          <p style="margin: 10px 0 0 0; font-size: 13px; line-height: 1.6; color: #554C48;">
            Kami menginformasikan bahwa pesanan busana Anda tidak dapat kami proses lebih lanjut karena batas waktu transaksi 10 menit telah berakhir. Item pada pesanan ini telah dilepaskan kembali ke stok koleksi.
          </p>
        </td>
      </tr>

      <!-- Order Summary Table -->
      <tr>
        <td style="padding: 0 32px 24px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <thead>
              <tr>
                <th style="padding-bottom: 8px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(0,0,0,0.4); border-bottom: 1px solid #000000;">Item Pesanan</th>
                <th style="padding-bottom: 8px; text-align: center; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(0,0,0,0.4); border-bottom: 1px solid #000000;">Qty</th>
                <th style="padding-bottom: 8px; text-align: right; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(0,0,0,0.4); border-bottom: 1px solid #000000;">Harga</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px;">
            <tr>
              <td style="font-size: 13px; font-weight: 700; color: #000000;">Total Tagihan</td>
              <td style="font-size: 15px; font-weight: 700; color: #000000; text-align: right; font-family: monospace;">${formatIDR(data.grandTotal)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Re-order CTA Button -->
      <tr>
        <td style="padding: 0 32px 32px; text-align: center;">
          <a href="${shopUrl}" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 4px;">
            Pesan Ulang Koleksi
          </a>
          <p style="margin: 16px 0 0 0; font-size: 11px; line-height: 1.5; color: rgba(0,0,0,0.4);">
            Koleksi favorit Anda masih dapat dipesan kembali selama ketersediaan stok tersedia.
          </p>
        </td>
      </tr>

      <!-- Footer Help -->
      <tr>
        <td style="padding: 24px 32px; background-color: #FFFFFF; border-top: 1px solid #EAE5DE; text-align: center;">
          <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #7A706A;">
            Dana Anda sudah terpotong atau mengalami kendala pembayaran?<br>
            Hubungi kami di <a href="mailto:info@sevaya-studio.com" style="color: #000000; font-weight: 600; text-decoration: none;">info@sevaya-studio.com</a> atau WhatsApp <a href="https://wa.me/6281234567890" style="color: #000000; font-weight: 600; text-decoration: none;">+62 812-3456-7890</a> untuk konfirmasi manual.
          </p>
          <p style="margin: 14px 0 0 0; font-size: 10px; color: #A89F9B;">
            &copy; 2026 SEVAYA Studio. All rights reserved.
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;

    const recipient = data.customerEmail || 'agus2100018486@webmail.uad.ac.id';
    const sendResult = await sendEmail({
      to: recipient,
      subject: `Pesanan Dibatalkan #${escapeHtml(data.orderNumber)} — Batas Waktu Pembayaran Berakhir`,
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
