import { sendEmail } from './resend';

export const ADMIN_NOTIFICATION_EMAIL = 'sevayaofficial@gmail.com';

export interface OrderAdminNotificationData {
  orderNumber: string;
  status: 'created' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
  previousStatus?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  items?: Array<{
    name?: string;
    title?: string;
    price?: number;
    quantity?: number;
    color?: string;
    size?: string;
  }>;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  grandTotal?: number;
  paymentMethod?: string;
  courierName?: string;
  trackingNumber?: string;
  cancelReason?: string;
  notes?: string;
  date?: string;
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

const STATUS_TITLES: Record<string, { label: string; badge: string; color: string; desc: string }> = {
  created: {
    label: 'Pesanan Baru Masuk',
    badge: 'ORDER BARU',
    color: '#000000',
    desc: 'Pesanan baru telah dibuat oleh pelanggan di website SEVAYA.',
  },
  pending_payment: {
    label: 'Menunggu Pembayaran',
    badge: 'PENDING PAYMENT',
    color: '#8A6335',
    desc: 'Pelanggan telah checkout dan sedang diarahkan untuk menyelesaikan pembayaran.',
  },
  paid: {
    label: 'Pembayaran Diterima',
    badge: 'PEMBAYARAN LUNAS',
    color: '#1B6A45',
    desc: 'Pembayaran pelanggan telah berhasil diverifikasi secara real-time via gateway pembayaran.',
  },
  processing: {
    label: 'Pesanan Sedang Diproses',
    badge: 'DIPROSES (ATELIER)',
    color: '#3B4E6B',
    desc: 'Pesanan sedang disiapkan, dikemas, dan dijadwalkan untuk penjemputan kurir.',
  },
  shipped: {
    label: 'Pesanan Dikirim / Dalam Perjalanan',
    badge: 'DALAM PENGIRIMAN',
    color: '#874A2C',
    desc: 'Paket telah diserahkan kepada kurir pengiriman dan sedang dalam perjalanan ke alamat tujuan.',
  },
  delivered: {
    label: 'Pesanan Telah Diterima Pelanggan',
    badge: 'SELESAI / SAMPAI',
    color: '#15803D',
    desc: 'Paket telah sampai di tangan pelanggan dengan sukses.',
  },
  cancelled: {
    label: 'Pesanan Dibatalkan',
    badge: 'DIBATALKAN',
    color: '#A82828',
    desc: 'Pesanan telah dibatalkan baik oleh sistem (kedaluwarsa) atau oleh admin.',
  },
};

export async function sendAdminOrderNotification(data: OrderAdminNotificationData) {
  try {
    const statusMeta = STATUS_TITLES[data.status] || {
      label: `Update Status: ${data.status.toUpperCase()}`,
      badge: data.status.toUpperCase(),
      color: '#000000',
      desc: `Status pesanan telah diperbarui menjadi ${data.status}.`,
    };

    const dateStr = data.date || new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    const itemsRows = (data.items || [])
      .map((item) => {
        const title = escapeHtml(item.title || item.name || 'Koleksi SEVAYA');
        const price = item.price || 0;
        const qty = item.quantity || 1;
        const variant = [escapeHtml(item.color), escapeHtml(item.size)].filter(Boolean).join(' • ') || 'Standar';

        return `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #F2EFEB; vertical-align: top;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #111111;">
                ${title}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #777777;">
                ${variant}
              </p>
            </td>
            <td style="padding: 14px 12px; border-bottom: 1px solid #F2EFEB; vertical-align: top; text-align: center; font-size: 12px; color: #555555; white-space: nowrap;">
              &times; ${qty}
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #F2EFEB; vertical-align: top; text-align: right; font-size: 12px; font-weight: 600; color: #111111; white-space: nowrap; font-family: monospace;">
              ${formatIDR(price * qty)}
            </td>
          </tr>
        `;
      })
      .join('');

    const subject = `[SEVAYA Official] ${statusMeta.badge} • #${escapeHtml(data.orderNumber)} (${escapeHtml(data.customerName)})`;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111; -webkit-font-smoothing: antialiased;">
  <center style="width: 100%; background-color: #FAFAFA; padding: 48px 16px;">
    
    <!-- Outer Elegant Wrapper with Generous White Margins -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #ECE8E4;">
      
      <!-- Minimalist Studio Header -->
      <tr>
        <td style="padding: 44px 44px 28px 44px; text-align: center; border-bottom: 1px solid #F4F1EE;">
          <h1 style="margin: 0; font-family: 'Century Gothic', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 20px; font-weight: 500; letter-spacing: 0.35em; text-transform: uppercase; color: #000000; line-height: 1;">
            SEVAYA
          </h1>
          <p style="margin: 8px 0 0 0; font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase; color: #888888;">
            Internal Studio Notification
          </p>
        </td>
      </tr>

      <!-- Body Content with Airy Padding -->
      <tr>
        <td style="padding: 36px 44px;">
          
          <!-- Status Indicator Pill -->
          <div style="margin-bottom: 24px;">
            <span style="display: inline-block; padding: 5px 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: ${statusMeta.color}; background-color: #FAFAFA; border: 1px solid #E5E0DA; border-radius: 2px;">
              ${statusMeta.badge}
            </span>
          </div>

          <!-- Main Title -->
          <h2 style="margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: #000000; line-height: 1.35;">
            ${statusMeta.label}
          </h2>
          <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 1.6; color: #666666;">
            ${statusMeta.desc}
          </p>

          ${data.cancelReason ? `
          <div style="margin-top: 16px; padding: 12px 14px; background-color: #FFF5F5; border-left: 2px solid #E05252;">
            <p style="margin: 0; font-size: 11px; color: #9B2C2C; line-height: 1.5;">
              <strong>Alasan Pembatalan:</strong> ${escapeHtml(data.cancelReason)}
            </p>
          </div>
          ` : ''}

          <!-- Spacing -->
          <div style="height: 28px;"></div>

          <!-- Metadata Box (Order Number, Waktu, Pelanggan) -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #111111; border-bottom: 1px solid #F0ECE7; padding: 12px 0;">
            <tr>
              <td style="padding: 10px 0; width: 45%; font-size: 11px; color: #777777; text-transform: uppercase; letter-spacing: 0.08em;">
                Nomor Pesanan
              </td>
              <td style="padding: 10px 0; text-align: right; font-size: 12px; font-weight: 600; color: #000000; font-family: monospace;">
                #${escapeHtml(data.orderNumber)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 11px; color: #777777; text-transform: uppercase; letter-spacing: 0.08em;">
                Waktu Perubahan
              </td>
              <td style="padding: 8px 0; text-align: right; font-size: 11px; color: #222222;">
                ${escapeHtml(dateStr)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 11px; color: #777777; text-transform: uppercase; letter-spacing: 0.08em;">
                Pelanggan
              </td>
              <td style="padding: 8px 0; text-align: right; font-size: 11px; font-weight: 500; color: #000000;">
                ${escapeHtml(data.customerName)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 11px; color: #777777; text-transform: uppercase; letter-spacing: 0.08em;">
                Kontak
              </td>
              <td style="padding: 8px 0; text-align: right; font-size: 11px; color: #444444;">
                ${escapeHtml(data.customerEmail)}${data.customerPhone ? ' • ' + escapeHtml(data.customerPhone) : ''}
              </td>
            </tr>
            ${data.courierName ? `
            <tr>
              <td style="padding: 8px 0; font-size: 11px; color: #777777; text-transform: uppercase; letter-spacing: 0.08em;">
                Kurir / Layanan
              </td>
              <td style="padding: 8px 0; text-align: right; font-size: 11px; color: #000000;">
                ${escapeHtml(data.courierName)}
              </td>
            </tr>
            ` : ''}
            ${data.trackingNumber ? `
            <tr>
              <td style="padding: 8px 0; font-size: 11px; color: #777777; text-transform: uppercase; letter-spacing: 0.08em;">
                Nomor Resi
              </td>
              <td style="padding: 8px 0; text-align: right; font-size: 12px; font-weight: 700; color: #000000; font-family: monospace;">
                ${escapeHtml(data.trackingNumber)}
              </td>
            </tr>
            ` : ''}
            ${data.paymentMethod ? `
            <tr>
              <td style="padding: 8px 0; font-size: 11px; color: #777777; text-transform: uppercase; letter-spacing: 0.08em;">
                Metode Pembayaran
              </td>
              <td style="padding: 8px 0; text-align: right; font-size: 11px; text-transform: uppercase; color: #222222;">
                ${escapeHtml(data.paymentMethod)}
              </td>
            </tr>
            ` : ''}
          </table>

          <!-- Items Table (If Available) -->
          ${itemsRows ? `
          <div style="height: 24px;"></div>
          <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #888888;">
            Rincian Busana Dipesan
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            ${itemsRows}
          </table>
          ` : ''}

          <!-- Financial Summary -->
          ${data.grandTotal !== undefined ? `
          <div style="height: 18px;"></div>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            ${data.subtotal !== undefined ? `
            <tr>
              <td style="padding: 4px 0; font-size: 11px; color: #777777;">Subtotal Produk</td>
              <td style="padding: 4px 0; text-align: right; font-size: 11px; color: #333333; font-family: monospace;">${formatIDR(data.subtotal)}</td>
            </tr>
            ` : ''}
            ${data.shippingCost !== undefined ? `
            <tr>
              <td style="padding: 4px 0; font-size: 11px; color: #777777;">Biaya Pengiriman</td>
              <td style="padding: 4px 0; text-align: right; font-size: 11px; color: #333333; font-family: monospace;">${formatIDR(data.shippingCost)}</td>
            </tr>
            ` : ''}
            ${data.discount ? `
            <tr>
              <td style="padding: 4px 0; font-size: 11px; color: #777777;">Potongan Diskon</td>
              <td style="padding: 4px 0; text-align: right; font-size: 11px; color: #A82828; font-family: monospace;">-${formatIDR(data.discount)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 12px 0 0 0; border-top: 1px solid #111111; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #000000;">
                Total Transaksi
              </td>
              <td style="padding: 12px 0 0 0; border-top: 1px solid #111111; text-align: right; font-size: 14px; font-weight: 700; color: #000000; font-family: monospace;">
                ${formatIDR(data.grandTotal)}
              </td>
            </tr>
          </table>
          ` : ''}

          ${data.customerAddress ? `
          <div style="height: 24px;"></div>
          <div style="padding: 14px 16px; background-color: #FAFAFA; border: 1px solid #EAE6E1; border-radius: 2px;">
            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #888888;">
              Alamat Pengiriman
            </p>
            <p style="margin: 0; font-size: 11px; line-height: 1.55; color: #333333;">
              ${escapeHtml(data.customerAddress)}
            </p>
          </div>
          ` : ''}

          <!-- Direct Link to Admin Action Button -->
          <div style="margin-top: 36px; text-align: center;">
            <a href="https://sevaya-studio.com/admin" target="_blank" style="display: inline-block; background-color: #000000; color: #FFFFFF; text-decoration: none; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; padding: 13px 28px; border-radius: 2px;">
              Buka Studio Admin &rarr;
            </a>
          </div>

        </td>
      </tr>

      <!-- Subtle Minimal Footer with White Space -->
      <tr>
        <td style="padding: 24px 44px 36px 44px; text-align: center; border-top: 1px solid #F4F1EE; background-color: #FFFFFF;">
          <p style="margin: 0; font-size: 10px; color: #999999; line-height: 1.5;">
            Email ini dikirim otomatis ke alamat resmi <span style="color: #000000;">${ADMIN_NOTIFICATION_EMAIL}</span><br/>
            Sistem Pemantauan Transaksi &bull; SEVAYA Studio Modestwear
          </p>
        </td>
      </tr>

    </table>

  </center>
</body>
</html>`;

    const res = await sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject,
      html,
    });

    return res;
  } catch (error) {
    console.error('[sendAdminOrderNotification] Error sending to sevayaofficial@gmail.com:', error);
    return { success: false, error };
  }
}
