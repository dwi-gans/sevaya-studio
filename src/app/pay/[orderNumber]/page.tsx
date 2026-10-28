'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';

function loadSnapScript(): Promise<any> {
  if (typeof window !== 'undefined' && window.snap) {
    return Promise.resolve(window.snap);
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('midtrans-snap-script');
    if (existing) {
      existing.onload = () => resolve(window.snap);
      return;
    }
    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'Mid-client-3hvHlo_u41mlnJKP');
    script.onload = () => resolve(window.snap);
    script.onerror = () => reject(new Error('Gagal memuat gateway pembayaran'));
    document.body.appendChild(script);
  });
}

const formatIDR = (n?: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

export default function SimplePaymentPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const resolvedParams = use(params);
  const orderNumber = resolvedParams.orderNumber;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken } = useAuth();

  // Instant zero-lag initial state directly from URL query params
  const paramTotal = Number(searchParams.get('total') || 0);
  const paramPayment = searchParams.get('payment') || 'midtrans';

  const [order, setOrder] = useState<any>(() => {
    // Check sessionStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('sevaya_snap_pending');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.orderNumber === orderNumber) {
            return {
              grand_total: paramTotal || parsed.grandTotal || 0,
              payment_method: paramPayment,
            };
          }
        }
      } catch {}
    }
    return paramTotal > 0 ? { grand_total: paramTotal, payment_method: paramPayment } : null;
  });

  const [isOpeningSnap, setIsOpeningSnap] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Always initialize with 600 on SSR to avoid hydration mismatch
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [mounted, setMounted] = useState(false);

  // Read saved session expiration on client mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = sessionStorage.getItem('sevaya_snap_pending');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orderNumber === orderNumber && parsed.expiresAt) {
          setTimeLeft(Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000)));
        }
      }
    } catch {}
  }, [orderNumber]);

  const paymentMethod = order?.payment_method || paramPayment || 'midtrans';

  // Background fetch to sync from Supabase DB without blocking UI paint
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
          setOrder(data.order);
          if (data.order.created_at) {
            const diffMs = Date.now() - new Date(data.order.created_at).getTime();
            const remainingSec = Math.max(0, Math.floor((10 * 60 * 1000 - diffMs) / 1000));
            setTimeLeft(remainingSec);
          }
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

  // Live countdown ticker
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Open Midtrans Snap Popup
  const handlePayNow = async () => {
    setIsOpeningSnap(true);
    setErrorMessage(null);
    try {
      let snapToken: string | null = null;

      // 1. Instant retrieve from sessionStorage
      try {
        const saved = sessionStorage.getItem('sevaya_snap_pending');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.orderNumber === orderNumber && parsed.snapToken) {
            snapToken = parsed.snapToken;
          }
        }
      } catch {}

      // 2. Fallback request to API if not cached
      if (!snapToken) {
        const token = await getAccessToken();
        const res = await fetch('/api/payment/snap-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            order_id: orderNumber,
            grand_total: order?.grand_total || paramTotal || 100000,
            items: order?.items || [],
            customer: {
              first_name: order?.customer_name?.split(' ')[0] || searchParams.get('name') || '',
              last_name: order?.customer_name?.split(' ').slice(1).join(' ') || '',
              email: order?.customer_email || searchParams.get('email') || '',
              phone: order?.customer_phone || searchParams.get('phone') || '',
            },
          }),
        });

        const snapData = await res.json();
        if (snapData.success && snapData.token) {
          snapToken = snapData.token;
        } else {
          throw new Error(snapData.error || 'Gagal memuat sesi pembayaran');
        }
      }

      const snapInstance = await loadSnapScript();
      if (!snapInstance || typeof snapInstance.pay !== 'function') {
        throw new Error('Gateway pembayaran belum siap');
      }

      snapInstance.pay(snapToken, {
        onSuccess: () => {
          try { sessionStorage.removeItem('sevaya_snap_pending'); } catch {}
          router.push(`/profile/orders/${encodeURIComponent(orderNumber)}`);
        },
        onPending: () => {
          try { sessionStorage.removeItem('sevaya_snap_pending'); } catch {}
          router.push(`/profile/orders/${encodeURIComponent(orderNumber)}`);
        },
        onError: () => {
          setErrorMessage('Pembayaran gagal atau dibatalkan.');
        },
        onClose: () => {
          // Closed by user, stays on /pay
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan saat membuka pembayaran');
    } finally {
      setIsOpeningSnap(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft <= 0;

  // Immediate total: priority order -> URL param -> fallback 0
  const totalAmount = order?.grand_total || paramTotal || 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="Mid-client-3hvHlo_u41mlnJKP"
        strategy="afterInteractive"
      />

      {/* Minimal Header */}
      <header className="border-b border-black/10 bg-white py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4">
          <Link href="/" aria-label="Sevaya Home">
            <Logo className="h-6 w-auto" />
          </Link>
          <span className="font-mono text-xs text-black/60">#{orderNumber}</span>
        </div>
      </header>

      {/* Main Container — Simple & Clean */}
      <main className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <div className="border border-black/15 bg-white p-6 sm:p-8 space-y-6">
          
          {/* Status & Countdown — Renders IMMEDIATELY without 0 delay */}
          <div className="border-b border-black/10 pb-5 text-center space-y-2">
            <span className="inline-block text-[10px] font-semibold tracking-[0.2em] text-[#8C827A] uppercase">
              Pembayaran Pesanan
            </span>
            <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-black min-h-[32px] flex items-center justify-center">
              {totalAmount > 0 ? (
                formatIDR(totalAmount)
              ) : (
                <span className="inline-block h-7 w-36 animate-pulse bg-black/10" />
              )}
            </h1>

            {/* Countdown Badge */}
            {!isExpired ? (
              <div className="inline-flex items-center gap-1.5 rounded-none border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
                <Icon name="schedule" size={13} className="text-amber-700" />
                <span suppressHydrationWarning>
                  Sisa waktu bayar: <strong suppressHydrationWarning>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</strong>
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-none border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-medium text-red-700">
                <Icon name="error" size={13} />
                <span>Waktu pembayaran telah berakhir (Batal otomatis)</span>
              </div>
            )}
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Payment Method Details */}
          {paymentMethod === 'midtrans' ? (
            <div className="space-y-4">
              <div className="border border-black/10 bg-[#FAFAFA] p-4 text-xs text-black/70 space-y-2">
                <p className="font-semibold text-black">Metode Pembayaran Instan</p>
                <p className="text-[11px] text-black/60">
                  Mendukung QRIS (GoPay, OVO, ShopeePay, BCA), Virtual Account semua bank utama, dan Kartu Kredit.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePayNow}
                disabled={isOpeningSnap || isExpired}
                className="flex w-full items-center justify-center gap-2 bg-black py-4 text-xs font-semibold tracking-[0.18em] text-white uppercase transition hover:bg-black/85 disabled:opacity-50 cursor-pointer"
              >
                <Icon name="payments" size={15} />
                <span>{isOpeningSnap ? 'Membuka Layar Bayar...' : 'Bayar Sekarang'}</span>
              </button>
            </div>
          ) : paymentMethod === 'transfer' ? (
            <div className="space-y-4 text-xs">
              <p className="text-[#554C48]">
                Silakan transfer tepat sebesar <strong className="text-black">{formatIDR(totalAmount)}</strong> ke rekening resmi:
              </p>
              <div className="border border-black/15 p-4 space-y-2">
                <p className="font-mono text-sm font-bold text-black">BCA: 8720-9981-22</p>
                <p className="text-[10px] text-black/60">a.n. SEVAYA STUDIO INDONESIA</p>
              </div>
              <Link
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                  `Halo SEVAYA, saya telah transfer untuk pesanan #${orderNumber} sebesar ${formatIDR(totalAmount)}`
                )}`}
                target="_blank"
                className="flex w-full items-center justify-center gap-2 bg-black py-3.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-black/85"
              >
                <Icon name="chat" size={14} />
                <span>Konfirmasi via WhatsApp</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="border border-black/10 bg-[#FAFAFA] p-4 text-xs text-black/70">
                <p className="font-semibold text-black">Bayar di Tempat (COD)</p>
                <p className="mt-1 text-[11px] text-black/60">
                  Siapkan uang pas <strong className="text-black">{formatIDR(totalAmount)}</strong> saat kurir menyerahkan paket di alamat Anda.
                </p>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="border-t border-black/10 pt-4 flex items-center justify-between text-xs text-black/60">
            <Link
              href={`/profile/orders/${encodeURIComponent(orderNumber)}`}
              className="hover:text-black underline underline-offset-4"
            >
              Lihat Rincian Pesanan
            </Link>
            <Link
              href="/shop"
              className="hover:text-black underline underline-offset-4"
            >
              Lanjut Belanja
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
