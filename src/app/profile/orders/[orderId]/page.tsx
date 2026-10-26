'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import type { UserOrder, OrderItem } from '@/components/profile/MyOrdersView';

const formatIDR = (n?: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

function getStatusDetails(status: string) {
  switch (status) {
    case 'pending_payment':
      return {
        step: 1,
        label: 'Menunggu Pembayaran',
        desc: 'Pesanan telah dibuat. Silakan lakukan pembayaran sesuai petunjuk.',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'processing':
    case 'paid':
      return {
        step: 2,
        label: 'Sedang Dipersiapkan',
        desc: 'Pembayaran telah terverifikasi. Pesanan Anda sedang disiapkan dan dikemas.',
        badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    case 'shipped':
      return {
        step: 3,
        label: 'Dalam Pengiriman',
        desc: 'Paket telah diserahkan ke kurir dan sedang dalam perjalanan ke alamat tujuan.',
        badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      };
    case 'delivered':
      return {
        step: 4,
        label: 'Pesanan Selesai',
        desc: 'Paket telah berhasil diterima di alamat tujuan.',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'cancelled':
      return {
        step: 0,
        label: 'Dibatalkan',
        desc: 'Pesanan ini telah dibatalkan.',
        badgeBg: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      };
    default:
      return {
        step: 1,
        label: status.replace(/_/g, ' ').toUpperCase(),
        desc: 'Status pesanan sedang diperbarui.',
        badgeBg: 'bg-neutral-50 text-neutral-700 border-neutral-200',
      };
  }
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, getAccessToken } = useAuth();
  const { showToast } = useToast();

  const [order, setOrder] = useState<UserOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/profile/orders/${orderId}`);
    }
  }, [authLoading, isAuthenticated, router, orderId]);

  useEffect(() => {
    async function fetchOrderDetail() {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/user/orders/${encodeURIComponent(orderId)}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Pesanan tidak ditemukan.');
        }

        setOrder(data.order);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat detail pesanan';
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchOrderDetail();
    }
  }, [orderId, isAuthenticated, getAccessToken]);

  const handlePrint = () => {
    window.print();
  };

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      showToast('Nomor pesanan disalin ke clipboard');
    }
  };

  const copyTrackingNumber = () => {
    if (order?.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      showToast('Nomor resi berhasil disalin!');
    }
  };

  const userInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  // Minimal Header (matching Home logo size and placement)
  const renderMinimalHeader = () => (
    <header className="sticky top-0 z-30 border-b border-[#E5DDD5] bg-[#FAF8F5]/90 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Desktop Left Logo */}
        <Link
          href="/"
          className="hidden items-center pl-1 transition hover:opacity-85 md:flex"
          aria-label="Sevaya Homepage"
          title="SEVAYA"
        >
          <Logo className="h-7 w-auto sm:h-8" />
        </Link>

        {/* Mobile Centered Logo */}
        <div className="flex w-full items-center justify-center md:hidden">
          <Link
            href="/"
            className="flex items-center transition hover:opacity-85"
            aria-label="Sevaya Homepage"
            title="SEVAYA"
          >
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
      </div>
    </header>
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF8F5]">
        {renderMinimalHeader()}
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3.5 text-center">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute h-full w-full animate-ping rounded-full bg-[#141312]/10" />
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#141312] border-t-transparent" />
            </div>
            <p className="font-headline text-xs tracking-widest text-[#685E5A] uppercase animate-pulse">
              Memuat Rincian Pesanan...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF8F5]">
        {renderMinimalHeader()}
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-[#E5DDD5] bg-white p-8 text-center shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Icon name="error" size={26} />
            </div>
            <div>
              <h2 className="font-headline text-base font-bold text-[#141312]">
                Pesanan Tidak Ditemukan
              </h2>
              <p className="mt-1 text-xs text-[#685E5A] leading-relaxed">
                {errorMsg || 'Pesanan ini tidak tersedia atau tidak terdaftar pada akun Anda.'}
              </p>
            </div>
            <Link
              href="/profile?tab=orders"
              className="inline-flex items-center gap-2 rounded-full bg-[#141312] px-6 py-2.5 text-xs font-semibold tracking-wider text-[#FAF8F5] uppercase transition hover:bg-[#2b2826]"
            >
              <Icon name="arrow_back" size={14} />
              <span>Kembali ke Riwayat Pesanan</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusDetail = getStatusDetails(order.status);
  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5] font-body text-[#141312] selection:bg-[#F4EFEB]">
      {renderMinimalHeader()}

      <main className="flex-1 pb-20 pt-6">
        <div className="mx-auto w-full max-w-4xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Sub Navigation / Breadcrumb */}
          <nav className="flex items-center justify-between text-xs text-[#685E5A] print:hidden">
            <Link
              href="/profile?tab=orders"
              className="inline-flex items-center gap-1.5 font-medium text-[#685E5A] hover:text-[#141312] transition-colors"
            >
              <Icon name="arrow_back" size={14} />
              <span>Kembali ke Riwayat Pesanan</span>
            </Link>

            <span className="font-mono text-xs text-[#8E8380]">
              #{order.order_number}
            </span>
          </nav>

          {/* ── TOP ORDER HEADER CARD ── */}
          <div className="rounded-2xl border border-[#E5DDD5] bg-white p-5 sm:p-7 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-headline text-[10px] font-bold tracking-widest text-[#8E8380] uppercase block">
                  Informasi Transaksi
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <h1 className="font-headline text-xl sm:text-2xl font-bold tracking-tight text-[#141312]">
                    #{order.order_number}
                  </h1>
                  <button
                    type="button"
                    onClick={copyOrderNumber}
                    title="Salin Nomor Pesanan"
                    className="p-1 text-[#8E8380] hover:text-[#141312] transition-colors print:hidden"
                  >
                    <Icon name="content_copy" size={16} />
                  </button>
                </div>
                <p className="mt-0.5 text-xs text-[#685E5A]">
                  Dipesan pada {formattedDate} WIB
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase ${statusDetail.badgeBg}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{statusDetail.label}</span>
                </span>
                <p className="text-[11px] text-[#8E8380] max-w-xs sm:text-right">
                  {statusDetail.desc}
                </p>
              </div>
            </div>

            {/* Quick Actions (Cetak Nota & Hubungi Layanan) */}
            <div className="flex items-center justify-end gap-2.5 border-t border-[#E5DDD5]/70 pt-4 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D0C5BD] bg-white px-4 py-2 text-xs font-medium text-[#141312] hover:bg-[#F4EFEB] active:scale-[0.98] transition"
              >
                <Icon name="print" size={14} />
                <span>Cetak Nota</span>
              </button>

              <Link
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                  `Halo SEVAYA, saya ingin bertanya tentang pesanan #${order.order_number}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D0C5BD] bg-white px-4 py-2 text-xs font-medium text-[#141312] hover:bg-[#F4EFEB] active:scale-[0.98] transition"
              >
                <Icon name="chat" size={14} />
                <span>Hubungi Layanan</span>
              </Link>
            </div>
          </div>

          {/* ── SECTION 1: PELACAKAN PENGIRIMAN (Live Stepper & Resi) ── */}
          <div className="rounded-2xl border border-[#E5DDD5] bg-white p-5 sm:p-7 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5DDD5]/70 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4EFEB] text-[#141312]">
                  <Icon name="local_shipping" size={20} />
                </div>
                <div>
                  <span className="font-headline text-[10px] font-bold tracking-wider text-[#8E8380] uppercase block">
                    Ekspedisi &amp; Layanan
                  </span>
                  <p className="text-sm font-bold text-[#141312]">
                    {order.courier_name || 'Kurir Reguler'}{' '}
                    {order.courier_service && `• ${order.courier_service}`}
                  </p>
                  {order.courier_duration && (
                    <p className="text-xs text-[#685E5A] mt-0.5">
                      Estimasi sampai: {order.courier_duration}
                    </p>
                  )}
                </div>
              </div>

              {order.tracking_number ? (
                <div className="flex items-center gap-2 bg-[#F4EFEB] rounded-xl px-4 py-2.5 sm:self-auto">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#8E8380] uppercase block">
                      No. Resi Pengiriman
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-800">
                      {order.tracking_number}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyTrackingNumber}
                    className="ml-2 p-1.5 rounded-lg border border-[#D0C5BD] bg-white hover:bg-[#FAF8F5] text-[#141312] transition"
                    title="Salin No. Resi"
                  >
                    <Icon name="content_copy" size={14} />
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl bg-[#F4EFEB] px-4 py-2 text-xs text-[#685E5A]">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Menunggu nomor resi dari kurir</span>
                </div>
              )}
            </div>

            {/* 4-Step Visual Progress Stepper */}
            <div className="pt-2 pb-4">
              <div className="grid grid-cols-4 gap-2 relative">
                {/* Stepper connecting line */}
                <div className="absolute top-4 left-[12%] right-[12%] h-[2px] bg-[#E5DDD5] -z-0" />
                <div
                  className="absolute top-4 left-[12%] h-[2px] bg-[#141312] transition-all duration-500 -z-0"
                  style={{
                    width:
                      statusDetail.step <= 1
                        ? '0%'
                        : statusDetail.step === 2
                        ? '33%'
                        : statusDetail.step === 3
                        ? '66%'
                        : '76%',
                  }}
                />

                {/* Step 1: Dibuat */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      statusDetail.step >= 1
                        ? 'bg-[#141312] text-white shadow-xs'
                        : 'bg-[#E5DDD5] text-[#8E8380]'
                    }`}
                  >
                    {statusDetail.step > 1 ? <Icon name="check" size={14} /> : '1'}
                  </div>
                  <span className="mt-2.5 font-headline text-[11px] font-bold text-[#141312] uppercase tracking-wider">
                    Dibuat
                  </span>
                  <span className="text-[10px] text-[#8E8380]">
                    Pesanan Masuk
                  </span>
                </div>

                {/* Step 2: Dipersiapkan */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      statusDetail.step >= 2
                        ? 'bg-[#141312] text-white shadow-xs'
                        : 'bg-[#E5DDD5] text-[#8E8380]'
                    }`}
                  >
                    {statusDetail.step > 2 ? <Icon name="check" size={14} /> : '2'}
                  </div>
                  <span className="mt-2.5 font-headline text-[11px] font-bold text-[#141312] uppercase tracking-wider">
                    Dipersiapkan
                  </span>
                  <span className="text-[10px] text-[#8E8380]">
                    Pengemasan
                  </span>
                </div>

                {/* Step 3: Pengiriman */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      statusDetail.step >= 3
                        ? 'bg-[#141312] text-white shadow-xs'
                        : 'bg-[#E5DDD5] text-[#8E8380]'
                    }`}
                  >
                    {statusDetail.step > 3 ? <Icon name="check" size={14} /> : '3'}
                  </div>
                  <span className="mt-2.5 font-headline text-[11px] font-bold text-[#141312] uppercase tracking-wider">
                    Pengiriman
                  </span>
                  <span className="text-[10px] text-[#8E8380]">
                    Kurir Berjalan
                  </span>
                </div>

                {/* Step 4: Selesai */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      statusDetail.step >= 4
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-[#E5DDD5] text-[#8E8380]'
                    }`}
                  >
                    <Icon name="check" size={14} />
                  </div>
                  <span className="mt-2.5 font-headline text-[11px] font-bold text-[#141312] uppercase tracking-wider">
                    Selesai
                  </span>
                  <span className="text-[10px] text-[#8E8380]">
                    Paket Diterima
                  </span>
                </div>
              </div>
            </div>

            {/* Status Notice */}
            <div className="rounded-xl bg-[#F4EFEB] p-3.5 flex items-center gap-2.5 text-xs text-[#554C48]">
              <Icon name="info" size={16} className="text-[#141312] shrink-0" />
              <span>{statusDetail.desc}</span>
            </div>
          </div>

          {/* ── SECTION 2: DAFTAR PRODUK (Purchased Items) ── */}
          <div className="rounded-2xl border border-[#E5DDD5] bg-white p-5 sm:p-7 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DDD5]/70 pb-4">
              <h2 className="font-headline text-sm font-bold text-[#141312] uppercase tracking-wider">
                Daftar Produk ({order.items.length})
              </h2>
              <span className="text-xs text-[#8E8380]">
                Rincian barang dalam pesanan
              </span>
            </div>

            <div className="divide-y divide-[#E5DDD5]/70">
              {order.items.map((item: OrderItem, idx: number) => {
                const title = item.title || item.name || 'Busana';
                const price = item.price || 0;
                const qty = item.quantity || 1;
                const itemTotal = price * qty;

                return (
                  <div key={idx} className="flex items-center justify-between py-4 first:pt-1 last:pb-1">
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-none border border-[#E5DDD5] bg-[#F4EFEB]">
                        {item.image ? (
                          <Image src={item.image} alt={title} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#8E8380]">
                            <Icon name="shopping_bag" size={18} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-headline text-xs sm:text-sm font-semibold text-[#141312]">
                          {title}
                        </h3>
                        <p className="text-xs text-[#685E5A] mt-0.5">
                          {[item.color, item.size].filter(Boolean).join(' / ') || 'Standar'}
                        </p>
                        <p className="font-mono text-[11px] text-[#8E8380] mt-0.5">
                          {qty} x {formatIDR(price)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-headline text-xs sm:text-sm font-bold text-[#141312]">
                        {formatIDR(itemTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 3: INFORMASI PENGIRIMAN & PEMBAYARAN (2-Column Grid) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Tujuan Pengiriman */}
            <div className="rounded-2xl border border-[#E5DDD5] bg-white p-5 sm:p-6 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="flex items-center gap-2 font-headline text-xs font-bold text-[#141312] uppercase tracking-wider">
                <Icon name="location_on" size={16} />
                <span>Tujuan Pengiriman</span>
              </div>
              <div className="space-y-1 text-xs text-[#554C48]">
                <p className="font-semibold text-[#141312]">{order.customer_name}</p>
                <p className="leading-relaxed">{order.customer_address}</p>
                {order.destination_area && (
                  <p className="text-[#8E8380] text-[11px]">{order.destination_area}</p>
                )}
                <p className="pt-1 text-[#685E5A]">No. HP: {order.customer_phone || '—'}</p>
              </div>
            </div>

            {/* Metode Pembayaran */}
            <div className="rounded-2xl border border-[#E5DDD5] bg-white p-5 sm:p-6 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="flex items-center gap-2 font-headline text-xs font-bold text-[#141312] uppercase tracking-wider">
                <Icon name="payments" size={16} />
                <span>Metode Pembayaran</span>
              </div>
              <div className="space-y-1 text-xs text-[#554C48]">
                <p className="font-semibold text-[#141312]">
                  {order.payment_method === 'midtrans'
                    ? 'Pembayaran Instan (QRIS / VA / E-Wallet)'
                    : order.payment_method === 'cod'
                    ? 'Bayar di Tempat (COD)'
                    : 'Transfer Bank Manual'}
                </p>
                <p className="text-[#685E5A]">
                  Email: {order.customer_email || '—'}
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                    <Icon name="check_circle" size={12} />
                    <span>Transaksi Terverifikasi</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: RINGKASAN BIAYA & TOTAL TAGIHAN ── */}
          <div className="rounded-2xl border border-[#E5DDD5] bg-white p-5 sm:p-7 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
            <h2 className="font-headline text-xs font-bold text-[#141312] uppercase tracking-wider border-b border-[#E5DDD5]/70 pb-3">
              Ringkasan Biaya
            </h2>

            <div className="space-y-2.5 rounded-xl bg-[#F4EFEB] p-5 text-xs text-[#554C48]">
              <div className="flex justify-between">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-[#141312]">{formatIDR(order.subtotal)}</span>
              </div>

              {order.discount ? (
                <div className="flex justify-between text-emerald-800">
                  <span>Diskon Promo</span>
                  <span className="font-semibold">−{formatIDR(order.discount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between">
                <span>Ongkos Kirim ({order.courier_name || 'Kurir'})</span>
                <span className="font-semibold text-[#141312]">{formatIDR(order.shipping_cost)}</span>
              </div>

              {order.gift_fee ? (
                <div className="flex justify-between">
                  <span>Kemasan Kotak Kado</span>
                  <span className="font-semibold text-[#141312]">{formatIDR(order.gift_fee)}</span>
                </div>
              ) : null}

              <div className="my-2 border-t border-[#E5DDD5]" />

              <div className="flex items-baseline justify-between pt-1">
                <span className="font-headline text-xs font-bold text-[#141312] uppercase tracking-wider">
                  Total Tagihan
                </span>
                <span className="font-headline text-base sm:text-lg font-bold text-[#141312]">
                  {formatIDR(order.grand_total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── MINIMAL FOOTER ── */}
      <footer className="border-t border-[#E5DDD5] py-6 text-center text-xs text-[#685E5A] print:hidden">
        <div className="mx-auto w-full max-w-4xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/conscious" className="hover:text-[#141312] hover:underline">
            Kebijakan Pengembalian
          </Link>
          <Link href="/conscious" className="hover:text-[#141312] hover:underline">
            Informasi Pengiriman
          </Link>
          <Link href="/conscious" className="hover:text-[#141312] hover:underline">
            Kebijakan Privasi
          </Link>
          <Link href="/conscious" className="hover:text-[#141312] hover:underline">
            Syarat &amp; Ketentuan
          </Link>
        </div>
      </footer>
    </div>
  );
}
