'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';

const formatIDR = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

function resolveProductImage(rawImg?: string): string {
  const fallback = 'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/catalog-01.jpg';
  if (!rawImg) return fallback;
  if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
    if (rawImg.includes('localhost') || rawImg.includes('sevaya-studio.com')) {
      const filename = rawImg.split('/').pop()?.split('?')[0];
      if (filename) {
        return `https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/${encodeURIComponent(filename)}`;
      }
    }
    return rawImg;
  }
  const filename = rawImg.split('/').pop()?.split('?')[0];
  if (filename) {
    return `https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/${encodeURIComponent(filename)}`;
  }
  return fallback;
}

function CopyButton({ text, label = 'Salin' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-800 transition hover:border-black hover:text-black cursor-pointer shadow-2xs"
    >
      {copied ? (
        <>
          <Icon name="check" size={13} className="text-emerald-600" />
          <span className="text-emerald-700">Tersalin</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'va_bri': return 'Virtual Account BRI (BRIVA)';
    case 'va_bni': return 'Virtual Account BNI';
    case 'va_bsi': return 'Virtual Account BSI (Syariah)';
    case 'va_mandiri': return 'Virtual Account Mandiri';
    case 'retail_alfamart': return 'Alfamart / Alfamidi';
    case 'retail_indomaret': return 'Indomaret';
    case 'va_other': return 'DOKU VA (Bank Lainnya)';
    default: return 'DOKU Virtual Account';
  }
}

function OrderConfirmationContent() {
  const params = useSearchParams();
  const { getAccessToken } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handleBayar = async () => {
    setIsRedirecting(true);
    setPayError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/payment/snap-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          order_id: orderNumber,
          grand_total: grandTotal,
          payment_method: rawPaymentMethod,
          customer: {
            first_name: customerName.split(' ')[0] || '',
            last_name: customerName.split(' ').slice(1).join(' ') || '',
            email: customerEmail,
            phone: customerPhone,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setPayError(data.error || 'Gagal membuka halaman pembayaran. Coba lagi.');
        setIsRedirecting(false);
      }
    } catch {
      setPayError('Koneksi bermasalah. Periksa internet lalu coba lagi.');
      setIsRedirecting(false);
    }
  };

  const orderNumber = params.get('orderNumber') ?? 'SVY-261101-A4CC50';
  const [dbOrder, setDbOrder] = useState<any>(null);

  // Fetch verified order details from database
  useEffect(() => {
    let isMounted = true;
    async function fetchOrder() {
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/user/orders/${encodeURIComponent(orderNumber)}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (isMounted && data.success && data.order) {
          setDbOrder(data.order);
        }
      } catch {
        // silent fallback
      }
    }
    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderNumber, getAccessToken]);

  const customerName = dbOrder?.customer_name || params.get('name') || 'mikel lim';
  const customerEmail = dbOrder?.customer_email || params.get('email') || 'dr.vandals72@gmail.com';
  const customerPhone = dbOrder?.customer_phone || params.get('phone') || '0893526621';
  
  // Payment method from database or params
  const rawPaymentMethod = (dbOrder?.payment_method || params.get('payment') || 'qris').toLowerCase();
  
  const subtotal = dbOrder?.subtotal ?? Number(params.get('subtotal') ?? 1339000);
  const shippingCost = dbOrder?.shipping_cost ?? Number(params.get('shipping') ?? 10000);
  const discount = dbOrder?.discount ?? Number(params.get('discount') ?? 0);
  const grandTotal = dbOrder?.grand_total ?? Number(params.get('total') ?? subtotal + shippingCost - discount);
  const courier = dbOrder?.courier_name || params.get('courier') || 'JNE Reguler (REG)';
  const destination = dbOrder?.customer_address || params.get('destination') || 'kulonprogo, kos mk, Kalibawang, Kulon Progo, DI Yogyakarta 55672';
  const paymentStatus = params.get('payment_status') ?? '';
  const isPaid = dbOrder?.status === 'paid' || paymentStatus === 'settlement' || paymentStatus === 'capture';

  const [localPaid, setLocalPaid] = useState(isPaid);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [isCancelled, setIsCancelled] = useState(false);

  // 1-second countdown ticker for 10-minute payment window
  useEffect(() => {
    if (localPaid || isCancelled) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsCancelled(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [localPaid, isCancelled]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const rawItems = params.get('items');
  const items = useMemo(() => {
    if (dbOrder?.items && Array.isArray(dbOrder.items) && dbOrder.items.length > 0) {
      return dbOrder.items;
    }
    if (!rawItems) {
      return [
        {
          title: 'Tala Abaya - Rhapsody',
          color: 'Black',
          size: 'S–M',
          edition: 'Classic Cupro Silk',
          quantity: 1,
          price: 1339000,
          image: '/images/catalog/catalog-03.jpg',
        },
      ];
    }
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
    } catch {
      return [];
    }
  }, [rawItems, dbOrder]);

  // Split multi-line address
  const addressLines = useMemo(() => {
    if (!destination) return ['Indonesia'];
    return destination
      .split(/[\r\n,]+/)
      .map((p: string) => p.trim())
      .filter(Boolean);
  }, [destination]);

  return (
    <div className="min-h-screen bg-white text-[#111111] antialiased">
      {/* ── Top Header (Centered SEVAYA in Avenir uppercase) ── */}
      <header className="w-full border-b border-neutral-100 bg-white py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4">
          <Link href="/" className="transition opacity-90 hover:opacity-100">
            <span
              style={{ fontFamily: "'Avenir Next', 'Avenir', 'Helvetica Neue', Arial, sans-serif" }}
              className="text-xl font-bold tracking-[0.25em] text-[#111111] uppercase"
            >
              SEVAYA
            </span>
          </Link>
        </div>
      </header>

      {/* ── Main Two-Column Layout ── */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          
          {/* ════════ LEFT COLUMN (Order Status & Payment Instructions) ════════ */}
          <div className="space-y-6 lg:col-span-7">
            
            {/* Header: Circle Check & Thank You */}
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-900 bg-white text-neutral-900">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-normal tracking-wide text-neutral-500">
                  Confirmation #{orderNumber}
                </p>
                <h1 className="text-xl font-medium tracking-tight text-neutral-900 sm:text-2xl">
                  {localPaid
                    ? `Payment Confirmed, ${customerName.split(' ')[0]}!`
                    : isCancelled
                    ? `Order Cancelled, ${customerName.split(' ')[0]}`
                    : `Thank you, ${customerName.split(' ')[0]}!`}
                </h1>
              </div>
            </div>

            {/* Time Reminder & Instructions Alert Banner */}
            {!localPaid && !isCancelled && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200/90 bg-[#FFFDF5] p-3.5 sm:p-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-amber-700 text-sm">⚠</span>
                  <p className="font-normal text-neutral-800 leading-snug">
                    Please stay on this page until your payment is complete
                  </p>
                </div>
                {/* 10-Minute Countdown Clock */}
                <div className="flex items-center gap-1.5 shrink-0 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded text-amber-950 font-mono font-bold text-xs">
                  <span className="text-[10px] font-sans font-medium text-amber-800 uppercase hidden sm:inline">
                    Time:
                  </span>
                  <span>{formattedCountdown}</span>
                </div>
              </div>
            )}

            {localPaid && (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900">
                <Icon name="check" size={16} className="text-emerald-700" />
                <p className="font-medium">
                  Pembayaran berhasil diverifikasi. Pesanan Anda sedang disiapkan oleh tim Sevaya.
                </p>
              </div>
            )}

            {isCancelled && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-4 text-xs text-red-900">
                <Icon name="close" size={16} className="text-red-700" />
                <p className="font-medium">
                  Batas waktu pembayaran 10 menit telah berakhir. Pesanan dibatalkan otomatis.
                </p>
              </div>
            )}

            {/* ════════ PAYMENT SECTION ════════ */}
            {!localPaid && !isCancelled && (
              <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                      Selesaikan Pembayaran
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-900 mt-0.5">
                      Bayar via {getPaymentMethodLabel(rawPaymentMethod)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded">
                    <div className="text-right">
                      <span className="text-[9px] text-neutral-500 uppercase block">Total Bayar</span>
                      <span className="font-mono text-xs font-bold text-neutral-900">
                        {formatIDR(grandTotal || subtotal)}
                      </span>
                    </div>
                    <CopyButton text={String(grandTotal || subtotal)} label="Salin" />
                  </div>
                </div>

                {/* DOKU Online payment */}
                <div className="space-y-3">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Klik tombol di bawah untuk menyelesaikan pembayaran melalui halaman resmi <strong>DOKU</strong>.
                    Tersedia pilihan <strong>Virtual Account</strong> (BRI, BNI, BSI, Mandiri, DOKU VA) dan <strong>Gerai Ritel</strong> (Alfamart &amp; Indomaret).
                  </p>

                  {payError && (
                    <div className="rounded border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-700">
                      {payError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBayar}
                    disabled={isRedirecting}
                    className="flex w-full items-center justify-center gap-2 rounded bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 cursor-pointer"
                  >
                    <Icon name="payments" size={16} />
                    <span>{isRedirecting ? 'Membuka halaman pembayaran...' : 'Bayar Sekarang'}</span>
                  </button>

                  <p className="text-[10px] text-neutral-400 text-center">
                    Anda akan diarahkan ke halaman pembayaran aman DOKU. Setelah bayar, status otomatis diperbarui.
                  </p>
                </div>

              </div>
            )}

            {/* Your Order is Confirmed Notice */}
            <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-5 space-y-1">
              <h2 className="text-xs font-semibold text-neutral-900">
                Your order is confirmed
              </h2>
              <p className="text-xs leading-relaxed text-neutral-500">
                You can also check your WhatsApp from SEVAYA to complete the payment.
              </p>
            </div>

            {/* Order Details Card (Grid 2 Kolom) */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                Order details
              </h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs leading-relaxed">
                {/* Left Column: Contact, Shipping Address, Shipping Method */}
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-neutral-800">Contact information</p>
                    <p className="mt-0.5 text-neutral-600 break-all">{customerEmail || '-'}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-neutral-800">Shipping address</p>
                    <div className="mt-0.5 text-neutral-600 space-y-0.5">
                      <p className="font-medium text-neutral-900">{customerName}</p>
                      {addressLines.map((line: string, idx: number) => (
                        <p key={idx}>{line}</p>
                      ))}
                      {customerPhone && <p className="mt-1 text-neutral-800">{customerPhone}</p>}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-neutral-800">Shipping method</p>
                    <p className="mt-0.5 text-neutral-600">{courier || 'JNE - Reguler'}</p>
                  </div>
                </div>

                {/* Right Column: Payment Method, Billing Address */}
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-neutral-800">Payment method</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-neutral-600">
                      <span className="inline-flex items-center justify-center rounded border border-neutral-300 bg-neutral-50 px-1 py-0.5 font-mono text-[9px] text-neutral-700">
                        💳
                      </span>
                      <span>
                        {getPaymentMethodLabel(rawPaymentMethod)} · {formatIDR(grandTotal || subtotal)} IDR
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-neutral-800">Billing address</p>
                    <div className="mt-0.5 text-neutral-600 space-y-0.5">
                      <p className="font-medium text-neutral-900">{customerName}</p>
                      {addressLines.map((line: string, idx: number) => (
                        <p key={idx}>{line}</p>
                      ))}
                      {customerPhone && <p className="mt-1 text-neutral-800">{customerPhone}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Need Help & Navigation Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
              <p className="text-xs text-neutral-500">
                Need help?{' '}
                <a
                  href="mailto:info@sevaya-studio.com"
                  className="text-neutral-900 underline hover:text-black font-medium"
                >
                  Contact us
                </a>
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Button Pantau Status Pesanan (Preserved as requested) */}
                <Link
                  href={`/profile/orders/${encodeURIComponent(orderNumber)}`}
                  className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-xs font-medium text-neutral-800 transition hover:border-black hover:text-black text-center"
                >
                  Pantau Status Pesanan
                </Link>

                {/* Continue Shopping Button */}
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md bg-[#000000] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 text-center"
                >
                  Continue shopping
                </Link>
              </div>
            </div>

            {/* Terms and policies link */}
            <div className="pt-8">
              <Link
                href="/conscious"
                className="text-[11px] text-neutral-500 underline hover:text-neutral-800"
              >
                Terms and policies
              </Link>
            </div>

          </div>

          {/* ════════ RIGHT COLUMN (Order Summary Sidebar) ════════ */}
          <div className="lg:col-span-5 lg:border-l lg:border-neutral-200 lg:pl-10">
            <div className="sticky top-8 space-y-5">
              
              {/* Product Items List */}
              <div className="divide-y divide-neutral-100">
                {items.map((it: any, idx: number) => {
                  const title = it.title || it.name || it.productTitle || 'Tala Abaya - Rhapsody';
                  const price = Number(it.price || 1339000);
                  const qty = Number(it.quantity || it.qty || 1);
                  const variantParts = [it.color, it.size, it.edition].filter(Boolean);
                  const variant = variantParts.length > 0 ? variantParts.join(' / ') : 'Black / S–M / Classic Cupro Silk';
                  const imgUrl = resolveProductImage(it.image);

                  return (
                    <div key={idx} className="flex items-center gap-3.5 py-3.5">
                      {/* Thumbnail with Quantity Badge */}
                      <div className="relative h-14 w-14 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 overflow-visible">
                        <img
                          src={imgUrl}
                          alt={title}
                          className="h-full w-full rounded-lg object-cover"
                        />
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-bold text-white shadow-xs">
                          {qty}
                        </span>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-medium text-neutral-900 truncate">
                          {title}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {variant}
                        </p>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-neutral-900">
                          {formatIDR(price * qty)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-neutral-200 pt-4 space-y-2.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatIDR(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-1">
                    Shipping <span className="text-[10px] text-neutral-400">ⓘ</span>
                  </span>
                  <span className="font-medium text-neutral-900">{formatIDR(shippingCost)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-medium">-{formatIDR(discount)}</span>
                  </div>
                )}

                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Total</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Termasuk PPN &amp; Biaya Terhitung
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-normal text-neutral-500 mr-1.5">IDR</span>
                      <span className="text-base sm:text-lg font-bold text-neutral-950">
                        {formatIDR(grandTotal || subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
