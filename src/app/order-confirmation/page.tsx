'use client';

import React, { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';

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
      className="inline-flex items-center gap-1 rounded-md border border-[#D0C5BD]/60 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#554C48] shadow-2xs transition hover:border-[#141312] hover:text-[#141312]"
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

  const orderNumber = params.get('orderNumber') ?? 'SVY-261019-8921';
  const customerName = params.get('name') ?? 'Pelanggan Terhormat';
  const customerEmail = params.get('email') ?? '';
  const customerPhone = params.get('phone') ?? '';
  const paymentMethod = params.get('payment') ?? 'transfer';
  const subtotal = Number(params.get('subtotal') ?? 0);
  const shippingCost = Number(params.get('shipping') ?? 0);
  const grandTotal = Number(params.get('total') ?? 0);
  const courier = params.get('courier') ?? '';
  const duration = params.get('duration') ?? '';
  const destination = params.get('destination') ?? '';
  const paymentStatus = params.get('payment_status') ?? '';
  const isPaid = paymentStatus === 'settlement' || paymentStatus === 'capture';

  const rawItems = params.get('items');
  const items = useMemo(() => {
    if (!rawItems) return [];
    try { return JSON.parse(rawItems); } catch { return []; }
  }, [rawItems]);

  const [showTick, setShowTick] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowTick(true), 150);
    return () => clearTimeout(t);
  }, []);

  // ── Midtrans Pay Now & Auto-Expiry (10 Minutes) State ─────────────────────────
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [payNowLoading, setPayNowLoading] = useState(false);
  const [payNowError, setPayNowError] = useState<string | null>(null);
  const [localPaid, setLocalPaid] = useState(isPaid);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600); // 10 minutes default
  const [isCancelled, setIsCancelled] = useState(false);

  // Auto-cancel order after 10 minutes without payment
  const handleAutoCancel = useCallback(async () => {
    setIsCancelled(true);
    setSnapToken(null);
    try { sessionStorage.removeItem('sevaya_snap_pending'); } catch { /* ignore */ }
    try {
      await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          reason: 'Batas waktu pembayaran 10 menit telah berakhir',
        }),
      });
    } catch (err) {
      console.warn('[Auto-Cancel Order Error]:', err);
    }
  }, [orderNumber]);

  // Restore snap token from sessionStorage & sync expiry
  useEffect(() => {
    loadSnapPopup();
    if (isPaid) return;
    try {
      const saved = sessionStorage.getItem('sevaya_snap_pending');
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data.orderNumber === orderNumber) {
        if (data.expiresAt) {
          const diff = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000));
          setRemainingSeconds(diff);
          if (diff <= 0) {
            handleAutoCancel();
            return;
          }
        }
        if (data.snapToken) {
          setSnapToken(data.snapToken);
        }
      }
    } catch { /* ignore */ }
  }, [orderNumber, isPaid, handleAutoCancel]);

  // 1-second countdown ticker
  useEffect(() => {
    if (localPaid || isCancelled) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [localPaid, isCancelled, handleAutoCancel]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handlePayNow = useCallback(async () => {
    if (!snapToken || isCancelled) return;
    setPayNowLoading(true);
    setPayNowError(null);
    try {
      const snap = window.snap || (await loadSnapPopup());
      if (!snap) throw new Error('Midtrans Snap gagal dimuat. Coba refresh halaman.');
      snap.pay(snapToken, {
        onSuccess: () => {
          try { sessionStorage.removeItem('sevaya_snap_pending'); } catch { /* ignore */ }
          fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderNumber }),
          }).catch(() => {});
          setLocalPaid(true);
          setSnapToken(null);
        },
        onPending: () => {
          try { sessionStorage.removeItem('sevaya_snap_pending'); } catch { /* ignore */ }
          setLocalPaid(true);
          setSnapToken(null);
        },
        onError: () => {
          setPayNowError('Pembayaran gagal. Silakan coba lagi.');
        },
        onClose: () => {
          // user closed popup without paying — keep Pay Now button if still in 10 mins
        },
      });
    } catch (e: any) {
      setPayNowError(e.message || 'Gagal memuat gateway pembayaran.');
    } finally {
      setPayNowLoading(false);
    }
  }, [snapToken, isCancelled, orderNumber]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // Derived: show Pay Now button when midtrans payment, not paid, and not cancelled
  const showPayNow = paymentMethod === 'midtrans' && !localPaid && !isCancelled && !!snapToken;

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 text-[#141312] print:bg-white print:p-0">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 border-b border-[#E5DDD5] bg-[#FAF8F5]/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-[#141312]"
          >
            <Icon name="arrow_back" size={14} />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
          </Link>

          <Logo className="h-5 w-auto" />

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D0C5BD] bg-white px-3 py-1 text-xs font-medium text-[#554C48] shadow-2xs transition hover:border-[#141312] hover:text-[#141312]"
          >
            <Icon name="print" size={13} />
            <span>Cetak Bukti</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
        {/* ── Status Announcement Banner ── */}
        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#141312] text-white shadow-md transition-all duration-700 ${
              showTick ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          >
            <Icon name="check" size={28} />
          </div>

          {localPaid ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-[11px] font-bold tracking-wider text-emerald-800 uppercase shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>Status: Lunas (Terverifikasi Otomatis)</span>
            </div>
          ) : isCancelled ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3.5 py-1 text-[11px] font-bold tracking-wider text-red-800 uppercase shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              <span>Status: Dibatalkan (Waktu Habis)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-amber-900 uppercase">
              <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Menunggu Pembayaran</span>
              <span className="rounded bg-amber-200/80 px-1.5 py-0.5 font-mono font-bold text-amber-950 text-[10px]">
                {formattedCountdown}
              </span>
            </div>
          )}

          <h1 className="mt-3 font-sans text-2xl font-medium tracking-tight text-[#141312] sm:text-3xl">
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

        {/* ── TAZA-STYLE PAY NOW & STATUS SECTION ── */}
        <Script
          id="midtrans-snap-script"
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key="Mid-client-3hvHlo_u41mlnJKP"
          strategy="afterInteractive"
        />

        {isCancelled ? (
          <div className="mb-8 space-y-4 print:hidden">
            {/* Cancellation Notice Banner */}
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4">
              <Icon name="error" size={18} className="mt-0.5 text-red-700 shrink-0" />
              <div className="text-xs text-red-900 leading-relaxed">
                <p className="font-semibold text-red-950">Batas Waktu Pembayaran 10 Menit Telah Berakhir</p>
                <p className="text-[11px] text-red-800 mt-0.5">
                  Pesanan #{orderNumber} dibatalkan otomatis oleh sistem. Email pemberitahuan telah dikirimkan ke <strong>{customerEmail}</strong>.
                </p>
              </div>
            </div>

            {/* Reorder Button Card */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E5DDD5] bg-white p-6 shadow-sm text-center">
              <Link
                href="/shop"
                className="w-full max-w-sm rounded-xl bg-[#141312] py-4 text-sm font-semibold tracking-wider text-white uppercase shadow-md transition hover:bg-[#322D29] hover:shadow-lg text-center inline-block"
              >
                Pesan Ulang Koleksi
              </Link>
              <p className="mt-2.5 text-[11px] text-[#8E8380]">
                Item pesanan telah dilepaskan kembali ke stok katalog. Silakan pesan ulang kapan saja.
              </p>
            </div>
          </div>
        ) : showPayNow ? (
          <div className="mb-8 space-y-4 print:hidden">
            {/* Warning Alert Banner with Live Countdown */}
            <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4">
              <div className="flex items-start gap-2.5">
                <Icon name="info" size={17} className="mt-0.5 text-amber-700 shrink-0" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold text-amber-950">Harap selesaikan pembayaran sebelum batas waktu berakhir.</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Segera lakukan pembayaran tepat sebesar <strong>{formatIDR(grandTotal || subtotal)}</strong> untuk memproses pesanan.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[9px] font-semibold text-amber-800 uppercase tracking-wider">Sisa Waktu</span>
                <span className="font-mono text-sm font-bold text-amber-950 bg-amber-200/70 border border-amber-300 rounded px-2 py-0.5">
                  {formattedCountdown}
                </span>
              </div>
            </div>

            {/* Pay Now Button Card */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E5DDD5] bg-white p-6 shadow-sm text-center">
              {payNowLoading ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#141312] border-t-transparent" />
                  <p className="text-xs text-[#7C726E]">Membuka jendela pembayaran Midtrans...</p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePayNow}
                    className="w-full max-w-sm rounded-xl bg-[#141312] py-4 text-sm font-semibold tracking-wider text-white uppercase shadow-md transition hover:bg-[#322D29] hover:shadow-lg cursor-pointer"
                  >
                    Pay Now
                  </button>
                  <p className="mt-2.5 text-[11px] text-[#8E8380]">
                    Klik untuk membuka popup pembayaran (QRIS, BCA/Mandiri/BRI/BNI Virtual Account, GoPay, Kartu Kredit).
                  </p>
                </>
              )}

              {payNowError && (
                <p className="mt-2 text-xs font-medium text-red-600">{payNowError}</p>
              )}
            </div>

            {/* Email Notification Card */}
            <div className="rounded-2xl border border-[#E5DDD5] bg-[#FAF8F5] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  <Icon name="mail" size={16} />
                </div>
                <div className="text-xs space-y-1">
                  <h3 className="font-semibold text-[#141312]">Pesanan Anda Telah Terdaftar</h3>
                  <p className="text-[#554C48] leading-relaxed">
                    Instruksi tagihan pembayaran telah kami kirimkan ke email <strong className="text-[#141312]">{customerEmail}</strong>.
                  </p>
                  <p className="text-[11px] text-[#7C726E]">
                    Setelah Anda menyelesaikan pembayaran melalui popup Pay Now di atas, status pesanan otomatis berubah menjadi <strong>Lunas</strong> dan email konfirmasi pembayaran diterima akan dikirimkan secara instan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : localPaid ? (
          /* Payment Confirmed Email Card */
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 print:hidden">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                <Icon name="check" size={16} />
              </div>
              <div className="text-xs space-y-1">
                <h3 className="font-semibold text-emerald-950">Pembayaran Diterima &amp; Dikonfirmasi</h3>
                <p className="text-emerald-900 leading-relaxed">
                  Bukti pembayaran dan faktur digital resmi telah dikirim ke email <strong className="text-emerald-950">{customerEmail}</strong>.
                </p>
                <p className="text-[11px] text-emerald-800">
                  Pesanan Anda kini sedang disiapkan oleh tim Sevaya. Anda akan menerima nomor resi pelacakan saat paket diserahkan ke kurir {courier || 'Biteship'}.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── OFFICIAL LUXURY RECEIPT CARD ── */}
        <div className="overflow-hidden border border-[#DCD3CB] bg-white shadow-sm print:border-none print:shadow-none">
          {/* Receipt Top Brand Header */}
          <div className="border-b border-[#EBE4DC] bg-[#FAF8F5] px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Logo className="h-6 w-auto" />
                <p className="mt-1 text-[10px] tracking-widest text-[#8E8380] uppercase">
                  Studio &amp; Modest Couture
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-semibold tracking-widest text-[#8E8380] uppercase">
                  No. Nota / Pesanan
                </span>
                <div className="mt-0.5 flex items-center gap-2 sm:justify-end">
                  <span className="font-mono text-sm font-bold tracking-tight text-[#141312]">
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

          {/* Customer & Shipping Summary Grid */}
          <div className="grid grid-cols-1 divide-y divide-[#EBE4DC] border-b border-[#EBE4DC] text-xs sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
            <div className="p-6 sm:p-7 space-y-2">
              <span className="text-[10px] font-semibold tracking-widest text-[#8E8380] uppercase">
                Tujuan Pengiriman
              </span>
              <p className="font-semibold text-[#141312] text-sm">{customerName}</p>
              {customerPhone && <p className="text-[#554C48]">{customerPhone}</p>}
              {customerEmail && <p className="text-[#7C726E] text-[11px]">{customerEmail}</p>}
              <p className="mt-1 text-[11px] leading-relaxed text-[#7C726E]">
                {destination || 'Alamat tujuan pesanan'}
              </p>
            </div>

            <div className="p-6 sm:p-7 space-y-2.5">
              <span className="text-[10px] font-semibold tracking-widest text-[#8E8380] uppercase">
                Metode &amp; Logistik
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[#7C726E]">Ekspedisi</span>
                <span className="font-semibold text-[#141312]">{courier || 'Kurir Biteship'}</span>
              </div>
              {duration && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#7C726E]">Estimasi Tiba</span>
                  <span className="text-[#554C48]">{duration}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#7C726E]">Pembayaran</span>
                <span className="rounded-md bg-[#F4EFEB] px-2 py-0.5 text-[10px] font-semibold text-[#141312]">
                  {paymentMethod === 'midtrans'
                    ? 'Midtrans (QRIS / VA / Bank Transfer)'
                    : paymentMethod === 'transfer'
                      ? 'Transfer Bank Manual'
                      : 'COD (Bayar di Tempat)'}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-6 sm:p-8">
            <span className="text-[10px] font-semibold tracking-widest text-[#8E8380] uppercase">
              Rincian Item Busana
            </span>

            <div className="mt-4 divide-y divide-[#F0EAE3] border-y border-[#F0EAE3]">
              {items && items.length > 0 ? (
                items.map((it: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3.5 text-xs">
                    <div>
                      <p className="font-semibold text-[#141312]">{it.productTitle}</p>
                      <p className="mt-0.5 text-[11px] text-[#8E8380]">
                        {it.color} {it.size ? `· Ukuran ${it.size}` : ''} · {it.qty} pcs
                      </p>
                    </div>
                    <span className="font-medium text-[#141312]">
                      {formatIDR(Number(it.price || 0) * Number(it.qty || 1))}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between py-3.5 text-xs">
                  <div>
                    <p className="font-semibold text-[#141312]">Pesanan Koleksi Sevaya</p>
                    <p className="mt-0.5 text-[11px] text-[#8E8380]">1 Item pesanan</p>
                  </div>
                  <span className="font-medium text-[#141312]">{formatIDR(subtotal || grandTotal)}</span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="mt-4 space-y-2 text-xs">
              {subtotal > 0 && (
                <div className="flex justify-between text-[#7C726E]">
                  <span>Subtotal Produk</span>
                  <span>{formatIDR(subtotal)}</span>
                </div>
              )}
              {shippingCost > 0 && (
                <div className="flex justify-between text-[#7C726E]">
                  <span>Ongkos Kirim ({courier || 'Biteship'})</span>
                  <span>{formatIDR(shippingCost)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-[#EBE4DC] pt-3 text-sm font-bold text-[#141312]">
                <span>Total Tagihan Pembayaran</span>
                <span className="font-mono text-base">{formatIDR(grandTotal || subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Verification / Instructions Box */}
          {localPaid ? (
            <div className="border-t border-[#EBE4DC] bg-emerald-50/70 p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <Icon name="check_circle" size={18} className="text-emerald-700" />
                <h3 className="text-xs font-bold tracking-wider text-emerald-900 uppercase">
                  Pembayaran Terverifikasi Oleh Midtrans Gateway
                </h3>
              </div>
              <p className="mt-1.5 text-xs text-emerald-800 leading-relaxed">
                Terima kasih! Pembayaran Anda sebesar <span className="font-bold">{formatIDR(grandTotal || subtotal)}</span> telah diterima dan status pesanan otomatis diperbarui menjadi <strong>Diproses</strong>. Resi pengiriman kurir telah diterbitkan dan pesanan sedang disiapkan untuk penjemputan.
              </p>
            </div>
          ) : paymentMethod === 'transfer' ? (
            <div className="border-t border-[#EBE4DC] bg-[#FAF8F5] p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <Icon name="payments" size={16} className="text-[#141312]" />
                <h3 className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
                  Pilihan Rekening Pembayaran Resmi
                </h3>
              </div>
              <p className="mt-1 text-[11px] text-[#7C726E]">
                Transfer tepat sebesar nominal total. Pembayaran diverifikasi otomatis oleh sistem:
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {BANK_ACCOUNTS.map((b) => (
                  <div
                    key={b.bank}
                    className="rounded-xl border border-[#E5DDD5] bg-white p-3 shadow-2xs"
                  >
                    <span className="text-[10px] font-bold tracking-wider text-[#7C726E] uppercase">
                      Bank {b.bank}
                    </span>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#141312]">{b.account}</span>
                      <CopyButton text={b.account.replace(/-/g, '')} />
                    </div>
                    <p className="mt-1 text-[9px] text-[#8E8380]">a.n. {b.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : isCancelled ? (
            <div className="border-t border-[#EBE4DC] bg-red-50/80 p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <Icon name="error" size={17} className="text-red-700" />
                <h3 className="text-xs font-bold tracking-wider text-red-900 uppercase">
                  Pesanan Telah Dibatalkan Otomatis
                </h3>
              </div>
              <p className="mt-1.5 text-xs text-red-800 leading-relaxed">
                Batas waktu pembayaran 10 menit telah habis. Transaksi pesanan #{orderNumber} telah kedaluwarsa dan item telah dikembalikan ke katalog. Pemberitahuan telah dikirimkan ke email <strong>{customerEmail}</strong>.
              </p>
            </div>
          ) : paymentMethod === 'midtrans' && !localPaid ? (
            <div className="border-t border-[#EBE4DC] bg-[#FAF8F5] p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <Icon name="schedule" size={15} className="text-amber-600" />
                <h3 className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
                  Pesanan Dikonfirmasi — Menunggu Pembayaran
                </h3>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#7C726E]">
                Pesanan <strong className="text-[#141312]">#{orderNumber}</strong> telah berhasil dibuat. Selesaikan pembayaran dengan menekan tombol <strong>Pay Now</strong> di atas. Konfirmasi pembayaran akan dikirim ke email <strong className="text-[#141312]">{customerEmail}</strong>.
              </p>
            </div>
          ) : null}
        </div>

        {/* ── Action Buttons ── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row print:hidden">
          <Link
            href={`/profile/orders/${orderNumber}`}
            className="flex flex-1 items-center justify-center gap-2 border border-[#141312] bg-[#141312] py-4 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29] shadow-sm"
          >
            <Icon name="local_shipping" size={16} />
            <span>Pantau Status Pesanan</span>
          </Link>

          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 border border-[#D0C5BD] bg-white py-4 text-xs font-semibold tracking-wider text-[#141312] uppercase transition hover:border-[#141312]"
          >
            <Icon name="shopping_bag" size={15} />
            <span>Kembali ke Beranda</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 border border-[#D0C5BD] bg-white px-6 py-4 text-xs font-semibold tracking-wider text-[#141312] uppercase transition hover:border-[#141312]"
          >
            <Icon name="print" size={14} />
            <span>Cetak Nota</span>
          </button>
        </div>

        {/* ── ROADMAP FITUR KEDEPANNYA (Transparan & Rapi) ── */}
        <div className="mt-10 rounded-2xl border border-dashed border-[#CFC5BD] bg-[#FAF8F5] p-5 sm:p-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#141312] text-[10px] font-bold text-white">
              ✦
            </span>
            <h4 className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
              Rencana Fitur Otomatisasi Sevaya Selanjutnya
            </h4>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-[#E5DDD5] bg-white p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#141312]">
                <Icon name="mail" size={14} className="text-[#8E8380]" />
                <span>Notifikasi Otomatis Email &amp; WA</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#7C726E]">
                Nota receipt digital otomatis terkirim ke email pembeli &amp; bot WhatsApp notifikasi saat pesanan selesai dibuat.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5DDD5] bg-white p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#141312]">
                <Icon name="payments" size={14} className="text-[#8E8380]" />
                <span>Payment Gateway Otomatis</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#7C726E]">
                QRIS Dinamis &amp; Virtual Account (BCA, Mandiri, BRI, BNI) dengan auto-verifikasi lunas tanpa upload bukti manual.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5DDD5] bg-white p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#141312]">
                <Icon name="inventory_2" size={14} className="text-[#8E8380]" />
                <span>Portal Riwayat Pembelian</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#7C726E]">
                Halaman akun pelanggan untuk cek status: Belum Bayar, Diproses, Di Perjalanan, hingga Selesai.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5DDD5] bg-white p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#141312]">
                <Icon name="local_shipping" size={14} className="text-[#8E8380]" />
                <span>Live Resi Tracking Biteship</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#7C726E]">
                Tracking resi langsung di website: Kurir jemput paket, posisi hub gudang, hingga status diterima oleh customer.
              </p>
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
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#141312] border-t-transparent" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
