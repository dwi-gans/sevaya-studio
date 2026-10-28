'use client';

import React, { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: {
        onSuccess?: (r: any) => void;
        onPending?: (r: any) => void;
        onError?: (r: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

async function loadSnapPopup(): Promise<typeof window.snap | null> {
  if (typeof window === 'undefined') return null;
  if (window.snap) return window.snap;
  return new Promise((resolve) => {
    const existing = document.getElementById('midtrans-snap-script');
    if (existing) { existing.addEventListener('load', () => resolve(window.snap ?? null)); return; }
    const s = document.createElement('script');
    s.id = 'midtrans-snap-script';
    s.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    s.setAttribute('data-client-key', 'Mid-client-3hvHlo_u41mlnJKP');
    s.onload = () => resolve(window.snap ?? null);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}

const BANK_ACCOUNTS = [
  { bank: 'BCA', account: '8720-9981-22', name: 'SEVAYA STUDIO INDONESIA' },
  { bank: 'Mandiri', account: '1370-0291-8821', name: 'SEVAYA STUDIO INDONESIA' },
  { bank: 'BSI (Syariah)', account: '7190-2819-01', name: 'SEVAYA STUDIO INDONESIA' },
];

const formatIDR = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

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
      className="inline-flex items-center gap-1 rounded-none border border-black/20 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#554C48] shadow-2xs transition hover:border-black hover:text-black"
    >
      {copied ? (
        <>
          <Icon name="check" size={11} className="text-emerald-600" />
          <span className="text-emerald-700">Tersalin</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}

function OrderConfirmationContent() {
  const params = useSearchParams();
  const { getAccessToken } = useAuth();

  const orderNumber = params.get('orderNumber') ?? 'SVY-261019-8921';
  const [dbOrder, setDbOrder] = useState<any>(null);

  // Fetch verified order details from database so it never shows Rp 0 or wrong payment method
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
        // silent
      }
    }
    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderNumber, getAccessToken]);

  const customerName = dbOrder?.customer_name || params.get('name') || 'Pelanggan Terhormat';
  const customerEmail = dbOrder?.customer_email || params.get('email') || '';
  const customerPhone = dbOrder?.customer_phone || params.get('phone') || '';
  const paymentMethod = dbOrder?.payment_method || params.get('payment') || 'midtrans';
  const subtotal = dbOrder?.subtotal ?? Number(params.get('subtotal') ?? 0);
  const shippingCost = dbOrder?.shipping_cost ?? Number(params.get('shipping') ?? 0);
  const grandTotal = dbOrder?.grand_total ?? Number(params.get('total') ?? 0);
  const courier = dbOrder?.courier_name || params.get('courier') || '';
  const duration = dbOrder?.courier_duration || params.get('duration') || '';
  const destination = dbOrder?.customer_address || params.get('destination') || '';
  const paymentStatus = params.get('payment_status') ?? '';
  const isPaid = dbOrder?.status === 'paid' || paymentStatus === 'settlement' || paymentStatus === 'capture';

  const rawItems = params.get('items');
  const items = useMemo(() => {
    if (dbOrder?.items && Array.isArray(dbOrder.items) && dbOrder.items.length > 0) {
      return dbOrder.items;
    }
    if (!rawItems) return [];
    try { return JSON.parse(rawItems); } catch { return []; }
  }, [rawItems, dbOrder]);

  const [showTick, setShowTick] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowTick(true), 150);
    return () => clearTimeout(t);
  }, []);

  // ── Midtrans Pay Now & Auto-Expiry State ─────────────────────────
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [payNowLoading, setPayNowLoading] = useState(false);
  const [payNowError, setPayNowError] = useState<string | null>(null);
  const [localPaid, setLocalPaid] = useState(isPaid);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [isCancelled, setIsCancelled] = useState(false);

  // Restore or request snap token
  useEffect(() => {
    loadSnapPopup();
    if (isPaid) return;

    try {
      const saved = sessionStorage.getItem('sevaya_snap_pending');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.orderNumber === orderNumber) {
          if (data.expiresAt) {
            const diff = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000));
            setRemainingSeconds(diff);
          }
          if (data.snapToken) {
            setSnapToken(data.snapToken);
          }
        }
      }
    } catch { /* ignore */ }
  }, [orderNumber, isPaid]);

  // Request new snap token if paymentMethod is midtrans and token is missing
  useEffect(() => {
    if (paymentMethod === 'midtrans' && !snapToken && !localPaid && grandTotal > 0) {
      (async () => {
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
              items: items,
              customer: {
                first_name: customerName.split(' ')[0],
                last_name: customerName.split(' ').slice(1).join(' '),
                email: customerEmail,
                phone: customerPhone,
              },
            }),
          });
          const json = await res.json();
          if (json.success && json.token) {
            setSnapToken(json.token);
          }
        } catch {}
      })();
    }
  }, [paymentMethod, snapToken, localPaid, grandTotal, orderNumber, items, customerName, customerEmail, customerPhone, getAccessToken]);

  // 1-second countdown ticker
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

  const handlePayNow = useCallback(async () => {
    setPayNowLoading(true);
    setPayNowError(null);
    try {
      let activeToken = snapToken;
      if (!activeToken) {
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
            items: items,
            customer: {
              first_name: customerName.split(' ')[0],
              last_name: customerName.split(' ').slice(1).join(' '),
              email: customerEmail,
              phone: customerPhone,
            },
          }),
        });
        const json = await res.json();
        if (json.success && json.token) {
          activeToken = json.token;
          setSnapToken(json.token);
        } else {
          throw new Error('Gagal memuat sesi pembayaran');
        }
      }

      const snap = window.snap || (await loadSnapPopup());
      if (!snap) throw new Error('Gateway pembayaran belum siap. Silakan coba lagi.');

      snap.pay(activeToken!, {
        onSuccess: () => {
          try { sessionStorage.removeItem('sevaya_snap_pending'); } catch {}
          setLocalPaid(true);
          setSnapToken(null);
        },
        onPending: () => {
          try { sessionStorage.removeItem('sevaya_snap_pending'); } catch {}
          setLocalPaid(true);
          setSnapToken(null);
        },
        onError: () => {
          setPayNowError('Pembayaran gagal. Silakan coba lagi.');
        },
        onClose: () => {},
      });
    } catch (e: any) {
      setPayNowError(e.message || 'Gagal memuat gateway pembayaran.');
    } finally {
      setPayNowLoading(false);
    }
  }, [snapToken, orderNumber, grandTotal, items, customerName, customerEmail, customerPhone, getAccessToken]);

  // Derived: show Pay Now button when midtrans payment and not paid
  const isMidtrans = paymentMethod === 'midtrans' || paymentMethod.includes('instant') || paymentMethod.includes('qris');
  const showPayNow = isMidtrans && !localPaid && !isCancelled;

  return (
    <div className="min-h-screen bg-white pb-24 text-black print:bg-white print:p-0">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 border-b border-black/15 bg-white/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-black"
          >
            <Icon name="arrow_back" size={14} />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
          </Link>

          <Logo className="h-5 w-auto" />
          <div className="w-10 sm:w-28" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
        {/* ── Status Announcement Banner ── */}
        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-sm transition-all duration-700 ${
              showTick ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          >
            <Icon name="check" size={24} />
          </div>

          {localPaid ? (
            <div className="inline-flex items-center gap-1.5 rounded-none border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-[11px] font-bold tracking-wider text-emerald-800 uppercase shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>Status: Lunas (Terverifikasi Otomatis)</span>
            </div>
          ) : isCancelled ? (
            <div className="inline-flex items-center gap-1.5 rounded-none border border-red-300 bg-red-50 px-3.5 py-1 text-[11px] font-bold tracking-wider text-red-800 uppercase shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              <span>Status: Dibatalkan (Waktu Habis)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-none border border-amber-300 bg-amber-50 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-amber-900 uppercase">
              <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Menunggu Pembayaran</span>
              <span className="bg-amber-200/80 px-1.5 py-0.5 font-mono font-bold text-amber-950 text-[10px]">
                {formattedCountdown}
              </span>
            </div>
          )}

          <h1 className="mt-3 font-sans text-2xl font-medium tracking-tight text-black sm:text-3xl">
            {localPaid
              ? 'Pembayaran Berhasil Diterima'
              : isCancelled
                ? 'Pesanan Dibatalkan Otomatis'
                : `Terima kasih, ${customerName.split(' ')[0]}!`}
          </h1>
          <p className="mt-1.5 text-xs text-[#7C726E] sm:text-sm">
            {localPaid
              ? `Pesanan kamu telah lunas dan sedang diproses oleh tim Sevaya Studio.`
              : isCancelled
                ? `Batas waktu pembayaran 10 menit telah berakhir. Pesanan #${orderNumber} telah dibatalkan secara otomatis.`
                : `Pesanan kamu sudah kami terima. Selesaikan pembayaran dalam 10 menit.`}
          </p>
        </div>

        {/* ── Midtrans Snap Script ── */}
        <Script
          id="midtrans-snap-script"
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key="Mid-client-3hvHlo_u41mlnJKP"
          strategy="afterInteractive"
        />

        {/* ── Pay Now Section (Always shown when pending & midtrans) ── */}
        {showPayNow && (
          <div className="mb-8 space-y-4 print:hidden">
            <div className="flex items-start justify-between gap-3 border border-amber-200 bg-amber-50/90 p-4">
              <div className="flex items-start gap-2.5">
                <Icon name="info" size={17} className="mt-0.5 text-amber-700 shrink-0" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold text-amber-950">Harap selesaikan pembayaran sebelum batas waktu berakhir.</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Total tagihan: <strong>{formatIDR(grandTotal || subtotal)}</strong>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[9px] font-semibold text-amber-800 uppercase tracking-wider">Sisa Waktu</span>
                <span className="font-mono text-sm font-bold text-amber-950 bg-amber-200/70 border border-amber-300 px-2 py-0.5">
                  {formattedCountdown}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border border-black/15 bg-white p-6 shadow-sm text-center">
              {payNowLoading ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <p className="text-xs text-[#7C726E]">Membuka jendela pembayaran Midtrans...</p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePayNow}
                    className="w-full max-w-sm bg-black py-4 text-xs font-semibold tracking-[0.2em] text-white uppercase shadow-md transition hover:bg-black/85 cursor-pointer"
                  >
                    Bayar Sekarang
                  </button>
                  <p className="mt-2.5 text-[11px] text-black/50">
                    Klik untuk membuka popup pembayaran (QRIS, BCA/Mandiri/BRI/BNI Virtual Account, GoPay, Kartu Kredit).
                  </p>
                </>
              )}

              {payNowError && (
                <p className="mt-2 text-xs font-medium text-red-600">{payNowError}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Official Luxury Receipt Card ── */}
        <div className="overflow-hidden border border-black/15 bg-white shadow-xs print:border-none print:shadow-none">
          <div className="border-b border-black/10 bg-white px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Logo className="h-6 w-auto" />
                <p className="mt-1 text-[10px] tracking-widest text-black/50 uppercase">
                  Studio &amp; Modest Couture
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-semibold tracking-widest text-black/50 uppercase">
                  No. Nota / Pesanan
                </span>
                <div className="mt-0.5 flex items-center gap-2 sm:justify-end">
                  <span className="font-mono text-sm font-bold tracking-tight text-black">
                    {orderNumber}
                  </span>
                  <CopyButton text={orderNumber} />
                </div>
                <p className="text-[10px] text-[#A29792]">
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-black/10 border-b border-black/10 text-xs sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
            <div className="p-6 sm:p-7 space-y-2">
              <span className="text-[10px] font-semibold tracking-widest text-black/50 uppercase">
                Tujuan Pengiriman
              </span>
              <p className="font-semibold text-black text-sm">{customerName}</p>
              {customerPhone && <p className="text-[#554C48]">{customerPhone}</p>}
              {customerEmail && <p className="text-[#7C726E] text-[11px]">{customerEmail}</p>}
              <p className="mt-1 text-[11px] leading-relaxed text-[#7C726E]">
                {destination || 'Alamat tujuan pesanan'}
              </p>
            </div>

            <div className="p-6 sm:p-7 space-y-2.5">
              <span className="text-[10px] font-semibold tracking-widest text-black/50 uppercase">
                Metode &amp; Logistik
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[#7C726E]">Ekspedisi</span>
                <span className="font-semibold text-black">{courier || 'Kurir Biteship'}</span>
              </div>
              {duration && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#7C726E]">Estimasi Tiba</span>
                  <span className="text-[#554C48]">{duration}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#7C726E]">Pembayaran</span>
                <span className="font-semibold text-black">
                  {isMidtrans
                    ? 'Pembayaran Instan (QRIS / VA / E-Wallet)'
                    : paymentMethod === 'cod'
                    ? 'Bayar di Tempat (COD)'
                    : 'Transfer Bank Manual'}
                </span>
              </div>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="p-6 sm:p-8 space-y-4">
            <span className="text-[10px] font-semibold tracking-widest text-black/50 uppercase">
              Rincian Item Busana
            </span>
            <div className="divide-y divide-black/8">
              {items && items.length > 0 ? (
                items.map((it: any, i: number) => {
                  const title = it.title || it.name || it.productTitle || 'Koleksi Sevaya';
                  const price = Number(it.price || 0);
                  const qty = Number(it.quantity || it.qty || 1);
                  const variant = [it.color, it.size].filter(Boolean).join(' • ');

                  return (
                    <div key={i} className="flex items-center justify-between py-3 text-xs">
                      <div>
                        <p className="font-medium text-black">{title}</p>
                        {variant && <p className="text-[11px] text-[#7C726E]">{variant}</p>}
                        <p className="font-mono text-[10px] text-black/40">{qty} × {formatIDR(price)}</p>
                      </div>
                      <span className="font-semibold text-black">{formatIDR(price * qty)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="py-3 text-xs text-[#7C726E]">
                  Pesanan #{orderNumber}
                </div>
              )}
            </div>

            <div className="border-t border-black/10 pt-4 space-y-2 text-xs text-[#554C48]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span>{formatIDR(shippingCost)}</span>
              </div>
              <div className="flex items-baseline justify-between pt-2 border-t border-black/10 text-sm font-semibold text-black">
                <span>Total Tagihan Pembayaran</span>
                <span className="text-base sm:text-lg">{formatIDR(grandTotal || subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Bank Accounts only if manual transfer */}
          {paymentMethod === 'transfer' && !isMidtrans && (
            <div className="border-t border-black/10 bg-black/[0.02] p-6 space-y-3">
              <span className="text-[10px] font-semibold tracking-widest text-black/60 uppercase block">
                Pilihan Rekening Pembayaran Resmi
              </span>
              <p className="text-xs text-[#7C726E]">
                Transfer tepat sebesar nominal total. Pembayaran diverifikasi oleh sistem:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BANK_ACCOUNTS.map((b) => (
                  <div key={b.bank} className="border border-black/15 bg-white p-3 space-y-1">
                    <span className="text-[10px] font-bold text-black/60 uppercase">Bank {b.bank}</span>
                    <p className="font-mono text-xs font-bold text-black">{b.account}</p>
                    <p className="text-[9px] text-black/50">{b.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <Link
            href={`/profile/orders/${encodeURIComponent(orderNumber)}`}
            className="w-full sm:w-auto text-center border border-black bg-white px-6 py-3 text-xs font-semibold tracking-wider text-black uppercase transition hover:bg-black hover:text-white"
          >
            Pantau Status Pesanan
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto text-center border border-black/20 bg-white px-6 py-3 text-xs font-semibold tracking-wider text-black uppercase transition hover:border-black"
          >
            Kembali ke Beranda
          </Link>
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
