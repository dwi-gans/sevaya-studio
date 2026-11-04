import { NextResponse } from 'next/server';

export async function GET() {
  const previewHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: ORDER SV-34472 - SEVAYA</title>
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
            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 500; color: #767676; letter-spacing: 0.05em; text-transform: uppercase;">
              ORDER SV-34472
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting & Instructions -->
      <h1 style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 500; color: #111111; line-height: 1.35;">
        Hi mikel, Thank you for your purchase!
      </h1>

      <p style="margin: 0 0 14px 0; font-size: 13px; line-height: 1.6; color: #666666;">
        Please review your order details below and complete the payment within 10 minutes after placing an order. You&#039;ll get a confirmation email after completing your payment. Thank you!
      </p>

      <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #666666;">
        If you want to continue the payment, please use the button below or check the payment link from Midtrans:
      </p>

      <!-- Action Button & Store Link -->
      <div style="margin: 0 0 32px 0;">
        <a href="http://localhost:3000/order-confirmation?orderNumber=SV-34472" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-right: 14px;">
          Complete Payment
        </a>
        <a href="http://localhost:3000/shop" style="display: inline-block; font-size: 13px; font-weight: 500; color: #111111; text-decoration: underline;">
          Visit our store
        </a>
      </div>

      <!-- Section: Order summary -->
      <h2 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #111111; letter-spacing: -0.01em;">
        Order summary
      </h2>

      <!-- Items List -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid #EEEEEE; padding-bottom: 14px; margin-bottom: 14px;">
        <tr>
          <td width="58" valign="top" style="padding-right: 14px;">
            <img src="https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/catalog-01.jpg" alt="FINA ABAYA 1.0" width="52" height="60" style="display: block; width: 52px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ECEAE6; background-color: #F8F6F4;" />
          </td>
          <td valign="middle">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: #111111; line-height: 1.4;">
              FINA ABAYA 1.0 &times; 1
            </div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #767676; margin-top: 3px; line-height: 1.4;">
              Dark Choco / M / Top Notch
            </div>
          </td>
          <td align="right" valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 500; color: #111111; white-space: nowrap; padding-left: 12px;">
            Rp 1.399.000
          </td>
        </tr>
      </table>

      <!-- Cost Summary Breakdown -->
      <table role="presentation" align="right" class="totals-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 320px; margin-top: 8px; margin-bottom: 32px;">
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #555555;">Subtotal</td>
          <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">Rp 1.399.000</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #555555;">Shipping</td>
          <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 500; color: #111111;">Rp 50.000</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px 0 6px 0;">
            <div style="border-top: 1px solid #E5E5E5;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #111111;">Total</td>
          <td align="right" style="padding: 6px 0; font-size: 18px; font-weight: bold; color: #111111;">Rp 1.449.000</td>
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
              mikel lim<br>kp<br>kos<br>kulonprogo<br>Yogyakarta 55672<br>Indonesia
            </div>
          </td>
          <td width="4%" class="col-half"></td>
          <td width="48%" valign="top" class="col-half">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 8px;">
              Billing address
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #666666;">
              mikel lim<br>kp<br>kos<br>kulonprogo<br>Yogyakarta 55672<br>Indonesia
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="3" style="padding-top: 20px;">
            <div style="font-size: 12px; font-weight: 600; color: #555555; margin-bottom: 6px;">
              Shipping method
            </div>
            <div style="font-size: 12px; line-height: 1.5; color: #666666;">
              JNE - Reguler
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

  return new NextResponse(previewHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
