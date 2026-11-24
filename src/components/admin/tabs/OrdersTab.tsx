'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, Store, FileDown, Calendar, ChevronDown } from 'lucide-react';
import { detectOrderCourier } from '@/lib/courier-utils';
import { ShippingLabelModal } from '../ShippingLabelModal';
import { InventoryTableSkeleton } from '../shared/AdminSkeleton';
import { AdminPageHeader } from '../shared/AdminPageHeader';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  destination_area?: string;
  destination_area_id?: string;
  items: string; // JSON string
  subtotal: number;
  discount?: number;
  shipping_cost?: number;
  gift_fee?: number;
  grand_total: number;
  payment_method?: string;
  courier_name?: string;
  courier_service?: string;
  courier_duration?: string;
  tracking_number?: string;
  biteship_order_id?: string;
  biteship_status?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

// Biteship status → label & color (Koleksi warna tenang, jelas, & elegan)
const BITESHIP_STATUSES = [
  { value: 'confirmed', label: 'Confirmed', emoji: '📋', color: 'text-[#1E4D7A] bg-[#F1F5FA] border-[#C8D8EA]' },
  { value: 'allocated', label: 'Allocated', emoji: '🏢', color: 'text-[#3E3882] bg-[#F4F3FB] border-[#D6D2EE]' },
  { value: 'picking_up', label: 'Picking Up', emoji: '🚶', color: 'text-[#8C5D23] bg-[#FFF9EE] border-[#EAD5BE]' },
  { value: 'picked', label: 'Picked', emoji: '📦', color: 'text-[#8C4725] bg-[#FAF4EE] border-[#EECDBC]' },
  { value: 'dropping_off', label: 'Dropping Off', emoji: '🚚', color: 'text-[#583375] bg-[#F8F2FA] border-[#E1CFE8]' },
  { value: 'delivered', label: 'Delivered', emoji: '✅', color: 'text-[#1E6037] bg-[#F0F6F2] border-[#C4DFC9]' },
  { value: 'cancelled', label: 'Cancelled', emoji: '🚫', color: 'text-[#A12B35] bg-[#FDF2F2] border-[#ECC6C9]' },
  { value: 'returned', label: 'Returned', emoji: '↩️', color: 'text-[#5C5C5C] bg-[#F5F5F5] border-[#DCDCDC]' },
  { value: 'on_hold', label: 'On Hold', emoji: '⏸️', color: 'text-[#6B5A4E] bg-[#F9F7F5] border-[#E3DDD7]' },
];

// Status Internal Toko SEVAYA:
// Didesain beda warna untuk tiap status, bernuansa earthy luxury/editorial yang tenang & berkelas
const INTERNAL_STATUSES = [
  {
    value: 'pending_payment',
    label: 'Belum Bayar',
    color: 'text-[#8C5D23] bg-[#FFF9EE] border-[#EAD5BE]',
    dot: 'bg-[#C2822B]',
  },
  {
    value: 'paid',
    label: 'Sudah Bayar',
    color: 'text-[#1E4D7A] bg-[#F1F5FA] border-[#C8D8EA]',
    dot: 'bg-[#2B6EA9]',
  },
  {
    value: 'processing',
    label: 'Diproses',
    color: 'text-[#8C4725] bg-[#FAF4EE] border-[#EECDBC]',
    dot: 'bg-[#BF6338]',
  },
  {
    value: 'shipped',
    label: 'Di Perjalanan',
    color: 'text-[#186068] bg-[#EFF7F7] border-[#C5E3E6]',
    dot: 'bg-[#22848F]',
  },
  {
    value: 'delivered',
    label: 'Sampai',
    color: 'text-[#1E6037] bg-[#F0F6F2] border-[#C4DFC9]',
    dot: 'bg-[#2B864E]',
  },
  {
    value: 'cancelled',
    label: 'Dibatalkan',
    color: 'text-[#A12B35] bg-[#FDF2F2] border-[#ECC6C9]',
    dot: 'bg-[#C7404B]',
  },
];

const COURIERS = [
  { value: 'jne', label: 'JNE', services: ['reg', 'yes', 'oke'] },
  { value: 'sicepat', label: 'SiCepat', services: ['reg', 'best', 'gokil'] },
  { value: 'jnt', label: 'J&T Express', services: ['ez', 'jtreg'] },
  { value: 'anteraja', label: 'AnterAja', services: ['reg', 'next', 'same'] },
  { value: 'tiki', label: 'TIKI', services: ['reg', 'ons', 'eco'] },
  { value: 'pos', label: 'Pos Indonesia', services: ['reg', 'kil'] },
  { value: 'grab', label: 'Grab', services: ['instant'] },
  { value: 'gojek', label: 'Gojek', services: ['instant'] },
];

const formatIDR = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
const formatDate = (d: string) =>
  d
    ? new Date(d).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ status, type = 'internal' }: { status: string; type?: 'internal' | 'biteship' }) {
  const pool = type === 'biteship' ? BITESHIP_STATUSES : INTERNAL_STATUSES;
  const found = pool.find((s) => s.value === status);
  if (!found) return <span className="text-xs text-black/70">{status || '—'}</span>;

  const emoji = ('emoji' in found ? found.emoji : '') as string;
  const dotColor = ('dot' in found ? found.dot : '') as string;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${found.color}`}
    >
      {dotColor && <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />}
      {emoji ? <span>{emoji}</span> : null}
      {found.label}
    </span>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate,
  onCreateBiteship,
  onPrintLabel,
  onDeleteOrder,
}: {
  order: AdminOrder;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, extra?: Partial<AdminOrder>) => Promise<void>;
  onCreateBiteship: (order: AdminOrder, courier: string, service: string) => Promise<void>;
  onPrintLabel?: (order: AdminOrder) => void;
  onDeleteOrder?: (id: string, orderNumber: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [trackingInput, setTrackingInput] = useState(order.tracking_number || '');
  const [logs, setLogs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Tracking timeline state
  type TrackingEvent = {
    datetime: string;
    note: string;
    status?: string;
    image_urls?: string[];
    images?: Array<{ type: string; images_urls: string[] }>;
  };
  const [trackingData, setTrackingData] = useState<{
    history: TrackingEvent[];
    order_status: string | null;
    waybill_id: string | null;
    tracking_link?: string | null;
    loading: boolean;
    error: string | null;
  }>({ history: [], order_status: null, waybill_id: null, tracking_link: null, loading: false, error: null });

  // Status dikontrol Biteship ketika sudah ada biteship_order_id dan status bukan cancelled
  const isBiteshipControlled =
    !!order.biteship_order_id && order.biteship_status !== 'cancelled' && order.status !== 'cancelled';

  const fetchTracking = useCallback(async () => {
    if (!order.biteship_order_id && !order.tracking_number) return;
    setTrackingData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = order.biteship_order_id
        ? `biteship_id=${encodeURIComponent(order.biteship_order_id)}`
        : `waybill_id=${encodeURIComponent(order.tracking_number!)}&courier_code=${encodeURIComponent(
            order.courier_name?.toLowerCase().split(' ')[0] || 'jne',
          )}`;
      const res = await fetch(`/api/admin/orders/tracking?${params}`);
      const json = await res.json();
      if (json.success) {
        setTrackingData({
          history: json.history ?? [],
          order_status: json.order_status ?? null,
          waybill_id: json.waybill_id ?? null,
          tracking_link: json.tracking_link ?? null,
          loading: false,
          error: null,
        });
      } else {
        setTrackingData((prev) => ({ ...prev, loading: false, error: json.error || 'Gagal memuat tracking' }));
      }
    } catch (e) {
      setTrackingData((prev) => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : 'Error',
      }));
    }
  }, [order.biteship_order_id, order.tracking_number, order.courier_name]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kunci scroll halaman luar agar tidak ikut naik-turun saat modal rincian terbuka
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, []);

  // Pastikan posisi scroll rincian transaksi SELALU mulai dari paling atas saat dibuka
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [order.id]);

  // Auto-fetch tracking ketika modal dibuka dan order punya biteship_order_id atau tracking_number
  useEffect(() => {
    if (order.biteship_order_id || order.tracking_number) {
      fetchTracking();
    }
  }, [order.id, fetchTracking]);

  const orderCourier = useMemo(() => {
    return detectOrderCourier(order);
  }, [order]);

  const addLog = (msg: string) =>
    setLogs((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p]);

  // parse items safely
  let parsedItems: { productTitle?: string; color?: string; qty?: number; price?: number; name?: string }[] = [];
  try {
    parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
  } catch {
    parsedItems = [];
  }

  const totalItems = parsedItems.reduce((s, i) => s + (i.qty || 1), 0);
  const totalWeight = totalItems; // 1 kg per item estimate

  const handleInternalStatusChange = async (newStatus: string) => {
    setLoading(true);
    addLog(`Mengubah status internal → ${newStatus}...`);
    try {
      const extraPayload: Partial<AdminOrder> = {
        tracking_number: trackingInput || undefined,
      };
      if (newStatus === 'cancelled') {
        extraPayload.biteship_status = 'cancelled';
      }

      await onStatusUpdate(order.id, newStatus, extraPayload);
      addLog(`✅ Status berhasil diubah ke: ${newStatus}`);
    } catch (e) {
      addLog(`❌ Gagal: ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBiteshipSimulation = async (bsStatus: string, internalStatus: string) => {
    setLoading(true);
    addLog(`Simulasi status Biteship → ${bsStatus}...`);
    try {
      await onStatusUpdate(order.id, internalStatus, {
        biteship_status: bsStatus,
        tracking_number: trackingInput || order.tracking_number,
      });
      addLog(`✅ Status Biteship diubah ke: ${bsStatus}`);
    } catch (e) {
      addLog(`❌ Gagal simulasi: ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrackingNumber = async () => {
    setLoading(true);
    addLog(`Menyimpan nomor resi: ${trackingInput.trim() || '(kosong)'}...`);
    try {
      await onStatusUpdate(order.id, order.status, {
        tracking_number: trackingInput.trim() || undefined,
      });
      addLog(`✅ Nomor resi berhasil disimpan: ${trackingInput.trim()}`);
    } catch (e) {
      addLog(`❌ Gagal menyimpan resi: ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBiteship = async () => {
    setLoading(true);
    addLog(`Membuat pesanan pickup kurir ${orderCourier.companyName} (${orderCourier.serviceName})...`);
    try {
      await onCreateBiteship(order, orderCourier.company, orderCourier.service);
      addLog(`✅ Order pickup kurir ${orderCourier.companyName} berhasil dibuat!`);
      addLog(`   Kurir akan menjemput paket di alamat toko.`);
    } catch (e) {
      addLog(`❌ Gagal: ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overscroll-contain"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-3xl max-h-[88vh] rounded-2xl border border-black/15 bg-white shadow-2xl flex flex-col overflow-hidden overscroll-contain my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/15 bg-white px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
          <div>
            <span className="font-headline text-[10px] font-bold tracking-widest text-black/50 uppercase block">
              Rincian Transaksi
            </span>
            <h3 className="font-headline text-base sm:text-lg font-bold text-black">
              #{order.order_number}
            </h3>
            <p className="text-[11px] sm:text-xs text-black/70 mt-0.5">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} type="internal" />
            {order.biteship_order_id && order.biteship_status && (
              <span className="hidden xs:inline-flex">
                <StatusBadge status={order.biteship_status} type="biteship" />
              </span>
            )}
            <button
              onClick={onClose}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-black/70 transition hover:bg-black/5 hover:text-black active:scale-95"
              aria-label="Tutup Rincian"
            >
              ✕
            </button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto p-4 sm:p-6 grid gap-5 sm:gap-6 md:grid-cols-2 overscroll-contain"
        >
          {/* Left Column */}

          <div className="flex flex-col gap-5">
            {/* Customer Info */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                Data Penerima
              </h4>
              <div className="rounded-xl border border-black/15 bg-white p-3.5 sm:p-4 text-xs space-y-1.5">
                <p className="font-semibold text-sm text-black">{order.customer_name}</p>
                <p className="text-black/70">{order.customer_phone}</p>
                {order.customer_email && <p className="text-black/70">{order.customer_email}</p>}
                <p className="text-[#554C48] pt-1 border-t border-black/15/60">{order.customer_address}</p>
                {order.destination_area && (
                  <p className="text-black/50 text-[11px]">{order.destination_area}</p>
                )}
              </div>
            </section>

            {/* Order Details Table */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                Detail Pesanan
              </h4>
              <div className="rounded-xl border border-black/15 bg-white overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {[
                      ['Order ID', order.id?.slice(0, 12) + '...'],
                      ['Reference', order.order_number],
                      ['Nomor Resi', order.tracking_number || '—'],
                      ['Kurir', order.courier_name || '—'],
                      ['Total Item', totalItems + ' item'],
                      ['Bobot Est.', totalWeight + ' kg'],
                      ['Subtotal', formatIDR(order.subtotal)],
                      ['Ongkir', formatIDR(order.shipping_cost || 0)],
                      ['Total', formatIDR(order.grand_total)],
                      ['Pembayaran', order.payment_method || '—'],
                      ['Status Internal', ''],
                      ['Status Biteship', order.biteship_status || '—'],
                      ['Biteship ID', order.biteship_order_id ? order.biteship_order_id.slice(0, 16) + '...' : '—'],
                      ['Diperbarui', formatDate(order.updated_at || order.created_at)],
                    ].map(([label, value]) => (
                      label === 'Status Internal' ? (
                        <tr key={label} className="border-t border-black/15">
                          <td className="py-2.5 pl-4 pr-2 text-black/70 font-medium w-1/3">{label}</td>
                          <td className="py-2.5 pr-4">
                            <StatusBadge status={order.status} type="internal" />
                          </td>
                        </tr>
                      ) : (
                        <tr key={label} className="border-t border-black/15 first:border-t-0">
                          <td className="py-2.5 pl-4 pr-2 text-black/70 font-medium w-1/3">{label}</td>
                          <td className="py-2.5 pr-4 font-semibold text-black">{value}</td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Items */}
            {parsedItems.length > 0 && (
              <section className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                  Produk
                </h4>
                <div className="rounded-xl border border-black/15 bg-white p-3 space-y-2">
                  {parsedItems.map((item: any, i) => (
                    <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-black/15/50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded border border-black/15 bg-black/5">
                          <Image
                            src={item.image || '/images/catalog/catalog-01.jpg'}
                            alt={item.productTitle || item.name || 'Produk'}
                            fill
                            className="object-cover"
                            unoptimized={Boolean(item.image && item.image.startsWith('http'))}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-black">{item.productTitle || item.name || item.title}</p>
                          <p className="text-black/70">{item.color || 'Standar'} · ×{item.qty || item.quantity || 1}</p>
                        </div>
                      </div>
                      <span className="font-bold text-black">{formatIDR(item.price || 0)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column — Actions */}
          <div className="flex flex-col gap-5">
            {/* Update Internal Status */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                Status Pesanan
              </h4>
              <div className="rounded-xl border border-black/15 bg-white p-3.5 sm:p-4 space-y-3">

                {/* Info banner: status dikunci oleh Biteship */}
                {isBiteshipControlled && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 border border-sky-200/70 p-3 text-[11px] text-sky-800">
                    <span className="mt-0.5 shrink-0 text-sm">🔒</span>
                    <div>
                      <p className="font-bold">Status dikontrol Biteship</p>
                      <p className="text-sky-700 mt-0.5 leading-relaxed">
                        Kurir sudah pick-up. Status akan otomatis update mengikuti posisi paket dari Biteship. Hanya Batalkan yang bisa dilakukan secara manual.
                      </p>
                    </div>
                  </div>
                )}

                {/* Nomor Resi — selalu bisa edit */}
                {!isBiteshipControlled && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-black/70 font-medium uppercase tracking-wider">
                      Nomor Resi
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        placeholder="Masukkan nomor resi..."
                        className="flex-1 rounded-none border border-black/20 bg-white px-3 py-2 text-base sm:text-xs text-black placeholder:text-black/50 focus:border-black focus:outline-none min-h-[42px] sm:min-h-[36px]"
                      />
                      <button
                        type="button"
                        disabled={loading || trackingInput === (order.tracking_number || '')}
                        onClick={handleSaveTrackingNumber}
                        className="px-4 bg-black text-white text-[10px] font-bold tracking-wider uppercase hover:bg-black/85 disabled:opacity-40 transition cursor-pointer shrink-0"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                )}

                {/* Status buttons grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {INTERNAL_STATUSES.map((s) => {
                    // Jika Biteship kontrol, hanya tampilkan status saat ini (readonly) + tombol Batalkan
                    const isCurrentStatus = order.status === s.value;
                    const isCancelButton = s.value === 'cancelled';
                    const isDisabled =
                      loading ||
                      isCurrentStatus ||
                      (isBiteshipControlled && !isCancelButton);

                    return (
                      <button
                        key={s.value}
                        disabled={isDisabled}
                        onClick={() => handleInternalStatusChange(s.value)}
                        title={isBiteshipControlled && !isCancelButton ? 'Status dikontrol Biteship — tidak bisa diubah manual' : undefined}
                        className={`min-h-[38px] rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5
                          ${isCurrentStatus
                            ? `${s.color} ring-2 ring-black/15 shadow-xs font-extrabold`
                            : isBiteshipControlled && !isCancelButton
                              ? 'border-black/10 bg-black/5 text-black/25 cursor-not-allowed'
                              : 'border-black/15 bg-white text-black/60 hover:bg-black/5 hover:text-black disabled:opacity-40'
                          }`}
                      >
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`} />
                        {isCurrentStatus ? '✓ ' : ''}{s.label}
                        {isBiteshipControlled && !isCancelButton && !isCurrentStatus && (
                          <span className="text-black/25">🔒</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Riwayat Tracking Biteship */}
            {(order.biteship_order_id || order.tracking_number) && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                    Riwayat Pengiriman
                  </h4>
                  <button
                    type="button"
                    onClick={fetchTracking}
                    disabled={trackingData.loading}
                    className="text-[10px] text-black/60 hover:text-black underline underline-offset-2 disabled:opacity-50 transition"
                  >
                    {trackingData.loading ? '⏳ Memuat...' : '↻ Refresh'}
                  </button>
                </div>
                <div className="rounded-xl border border-black/15 bg-white overflow-hidden">
                  {trackingData.loading ? (
                    <div className="p-5 text-center text-xs text-black/50">
                      ⏳ Mengambil data tracking dari Biteship...
                    </div>
                  ) : trackingData.error ? (
                    <div className="p-4 text-xs text-red-700 bg-red-50 rounded-xl">
                      ⚠️ {trackingData.error}
                    </div>
                  ) : trackingData.history.length === 0 ? (
                    <div className="p-5 text-center text-xs text-black/50">
                      {order.biteship_order_id
                        ? 'Belum ada riwayat pergerakan paket.'
                        : 'Tidak ada data tracking tersedia.'}
                    </div>
                  ) : (
                    <div className="p-3 space-y-0 max-h-64 overflow-y-auto">
                      {/* Waybill info & Live Tracking row */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-black/10 text-[10px] text-black/60">
                        {trackingData.waybill_id ? (
                          <div className="flex items-center gap-1.5">
                            <span>No. Resi:</span>
                            <span className="font-mono font-semibold text-black">{trackingData.waybill_id}</span>
                          </div>
                        ) : <span />}
                        {trackingData.tracking_link && (
                          <a
                            href={trackingData.tracking_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-700 hover:text-sky-900 underline font-medium inline-flex items-center gap-1 shrink-0"
                          >
                            Live Biteship ↗
                          </a>
                        )}
                      </div>
                      {/* Timeline events */}
                      {trackingData.history.map((event, idx) => {
                        const isLatest = idx === 0;
                        const eventDate = event.datetime
                          ? new Date(event.datetime).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—';
                        return (
                          <div key={idx} className="flex gap-3 py-2.5 relative">
                            {/* Timeline line */}
                            {idx < trackingData.history.length - 1 && (
                              <div className="absolute left-[7px] top-[22px] bottom-0 w-px bg-black/10" />
                            )}
                            {/* Dot */}
                            <div
                              className={`mt-0.5 h-3.5 w-3.5 rounded-full border-2 shrink-0 ${
                                isLatest
                                  ? 'border-black bg-black'
                                  : 'border-black/30 bg-white'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`text-[11px] leading-snug ${isLatest ? 'font-bold text-black' : 'text-black/70'}`}>
                                {event.note || event.status || '—'}
                              </p>
                              <p className="text-[10px] text-black/40 mt-0.5">{eventDate}</p>

                              {/* Foto Bukti dari Kurir Biteship (Pick-up, Manifest, atau POD) */}
                              {event.image_urls && event.image_urls.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {event.image_urls.map((imgUrl, imgIdx) => {
                                    const imgType = event.images?.find((i) => i.images_urls?.includes(imgUrl))?.type;
                                    const typeLabel =
                                      imgType === 'proof_of_pickup'
                                        ? 'Bukti Pick-up'
                                        : imgType === 'proof_of_delivery'
                                        ? 'Bukti Tiba (POD)'
                                        : 'Foto Manifest / Resi';

                                    return (
                                      <a
                                        key={imgIdx}
                                        href={imgUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative flex flex-col items-center overflow-hidden rounded-lg border border-black/15 bg-neutral-50 hover:border-black transition p-1 shadow-2xs"
                                        title="Klik untuk membuka foto asli resolusi penuh"
                                      >
                                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded bg-black/5">
                                          <img
                                            src={imgUrl}
                                            alt={typeLabel}
                                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            loading="lazy"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 text-white text-[8px] font-bold bg-black/80 px-1 py-0.5 rounded shadow">
                                              Buka ↗
                                            </span>
                                          </div>
                                        </div>
                                        <span className="mt-1 text-[8px] sm:text-[8.5px] font-semibold text-black/70 max-w-[76px] truncate text-center">
                                          {typeLabel}
                                        </span>
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Shipping Carrier / Biteship */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                Pengiriman Kurir (Biteship)
              </h4>
              <div className="rounded-xl border border-black/15 bg-white p-3.5 sm:p-4 space-y-3">
                {order.biteship_order_id ? (
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/60 p-3.5 text-xs space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✅</span>
                      <p className="font-bold text-emerald-800">Terhubung ke Biteship</p>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <span className="text-black/40 w-16 shrink-0">Order ID</span>
                        <span className="font-mono break-all">{order.biteship_order_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-800">
                        <span className="text-black/40 w-16 shrink-0">Status</span>
                        <StatusBadge status={order.biteship_status || ''} type="biteship" />
                      </div>
                      {order.tracking_number && (
                        <div className="flex items-center gap-2 text-emerald-800">
                          <span className="text-black/40 w-16 shrink-0">No. Resi</span>
                          <span className="font-mono font-semibold">{order.tracking_number}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-1.5 border-t border-emerald-200/60">
                      <a
                        href="https://dashboard.biteship.com/orders"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-800 underline underline-offset-2 hover:text-emerald-900 transition"
                      >
                        Buka Biteship Dashboard →
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-black/70">
                      Sistem otomatis mendeteksi ekspedisi yang dipilih & dibayar oleh pelanggan saat checkout.
                    </p>

                    {/* Informasi Ekspedisi Pilihan Pelanggan (Terkunci Sesuai Order) */}
                    <div className="rounded-xl border border-black/15 bg-[#FAF9F6] p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-black/10">
                        <span className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                          Ekspedisi Pilihan Pelanggan
                        </span>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
                          ✓ Otomatis Dari Order
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs uppercase tracking-wider shrink-0">
                          {orderCourier.company}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-black truncate">
                            {orderCourier.companyName} · {orderCourier.serviceName}
                          </p>
                          <p className="text-[11px] text-black/60 mt-0.5">
                            {order.courier_name || `${orderCourier.companyName} ${orderCourier.serviceName}`} {order.courier_duration ? `• Estimasi: ${order.courier_duration}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateBiteship}
                      disabled={loading}
                      className="w-full min-h-[44px] rounded-full bg-black py-2.5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {loading ? 'Memproses Permintaan Pickup...' : `📦 Request Pickup Kurir (${orderCourier.companyName} ${orderCourier.serviceName})`}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Aksi Cepat: Cetak Label & Hapus Pesanan */}
            <section className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onPrintLabel?.(order)}
                className="flex-1 min-h-[38px] flex items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white text-xs font-semibold text-black hover:bg-black/5 active:scale-95 transition cursor-pointer"
              >
                <span>🖨️</span>
                <span>Cetak Label</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteOrder?.(order.id, order.order_number)}
                className="min-h-[38px] px-4 flex items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 active:scale-95 transition cursor-pointer shrink-0"
                title="Hapus Pesanan"
              >
                <span>🗑</span>
                <span>Hapus</span>
              </button>
            </section>

            {/* Logs */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-black/70">Log Aktivitas</h4>
                {logs.length > 0 && (
                  <button onClick={() => setLogs([])} className="text-[10px] text-black/70 hover:text-black underline">
                    Bersihkan
                  </button>
                )}
              </div>
              <div className="rounded-xl border border-black/15 bg-black p-3 max-h-36 overflow-y-auto font-mono text-[10px]">
                {logs.length === 0 ? (
                  <p className="text-neutral-500">Belum ada aktivitas...</p>
                ) : (
                  logs.map((l, i) => (
                    <div key={i} className="text-neutral-300 leading-relaxed">{l}</div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Helpers: Periode Bulanan & Format ───────────────────────────────────────

const getOrderMonthKey = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const formatMonthLabel = (key: string) => {
  if (!key || key === 'all') return 'Semua Waktu';
  const parts = key.split('-').map(Number);
  const y = parts[0] || new Date().getFullYear();
  const m = parts[1] || 1;
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

// ─── Main Component ─────────────────────────────────────────────────────────

interface OrdersTabProps {
  onOrdersCountChange?: (count: number) => void;
  isSidebarOpen?: boolean;
  toggleSidebar?: () => void;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export function OrdersTab({
  onOrdersCountChange,
  isSidebarOpen = true,
  toggleSidebar,
  setIsMobileMenuOpen,
}: OrdersTabProps = {}) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<AdminOrder | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchOrders = useCallback(async (silent = false, sync = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const url = sync ? '/api/admin/orders?sync=true' : '/api/admin/orders';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Gagal memuat orders');
      }
    } catch {
      setError('Koneksi ke server gagal');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Polling dua lapis:
  // 1. Load awal → sync ke Biteship langsung (supaya status selalu fresh saat halaman dibuka)
  // 2. Setiap 25 detik — ambil data DB saja (cepat, tanpa call Biteship)
  // 3. Setiap 2 menit — sync ulang ke Biteship API
  useEffect(() => {
    fetchOrders(false, true); // load awal: langsung sync ke Biteship

    const dbPoll = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrders(true, false); // silent, no Biteship sync
      }
    }, 25000);

    const biteshipSync = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrders(true, true); // silent + sync Biteship
      }
    }, 2 * 60 * 1000); // 2 menit

    return () => {
      clearInterval(dbPoll);
      clearInterval(biteshipSync);
    };
  }, [fetchOrders]);

  // Notify parent whenever order count changes (outside render phase)
  useEffect(() => {
    if (onOrdersCountChange) onOrdersCountChange(orders.length);
  }, [orders.length, onOrdersCountChange]);

  // Delete an order (also cancels it on Biteship server)
  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (!window.confirm(`Yakin ingin membatalkan & menghapus order #${orderNumber}?`)) return;
    try {
      const res = await fetch(`/api/admin/orders?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        if (selectedOrder?.id === id) setSelectedOrder(null);
      } else {
        alert(data.error || 'Gagal menghapus order');
      }
    } catch {
      alert('Gagal menghubungi server');
    }
  };

  const handleStatusUpdate = async (id: string, status: string, extra?: Partial<AdminOrder>) => {
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, ...extra }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    // Update local state
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, ...extra, updated_at: new Date().toISOString() } : o)),
    );
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, status, ...extra, updated_at: new Date().toISOString() } : prev,
      );
    }
  };

  const handleCreateBiteship = async (order: AdminOrder, courier: string, service: string) => {
    const res = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        courier_company: courier,
        courier_type: service,
        destination_name: order.customer_name,
        destination_phone: order.customer_phone,
        destination_address: order.customer_address,
        destination_postal_code: 12190,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Biteship error');

    // Update local state
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              biteship_order_id: data.biteship_order_id,
              biteship_status: data.biteship_status,
              tracking_number: data.tracking_number || o.tracking_number,
              status: 'processing',
              courier_name: `${courier.toUpperCase()} ${service.toUpperCase()}`,
              updated_at: new Date().toISOString(),
            }
          : o,
      ),
    );
    if (selectedOrder?.id === order.id) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              biteship_order_id: data.biteship_order_id,
              biteship_status: data.biteship_status,
              tracking_number: data.tracking_number || prev.tracking_number,
              status: 'processing',
              courier_name: `${courier.toUpperCase()} ${service.toUpperCase()}`,
              updated_at: new Date().toISOString(),
            }
          : prev,
      );
    }
  };

  // ─── Monthly & Executive Metrics ───────────────────────────────────────────
  const currentCalendarMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentCalendarMonth);
    orders.forEach((o) => {
      const k = getOrderMonthKey(o.created_at);
      if (k) set.add(k);
    });
    return Array.from(set).sort().reverse();
  }, [orders, currentCalendarMonth]);

  // Orders filtered by the selected month
  const monthOrders = useMemo(() => {
    if (selectedMonth === 'all') return orders;
    return orders.filter((o) => getOrderMonthKey(o.created_at) === selectedMonth);
  }, [orders, selectedMonth]);

  // Valid orders (confirmed paid) for selected month
  const validMonthOrders = useMemo(() => {
    return monthOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'pending_payment');
  }, [monthOrders]);

  const monthRevenue = useMemo(() => {
    return validMonthOrders.reduce((s, o) => s + (o.grand_total || 0), 0);
  }, [validMonthOrders]);

  const stats = useMemo(() => ({
    all: monthOrders.length,
    pending_payment: monthOrders.filter((o) => o.status === 'pending_payment').length,
    processing: monthOrders.filter((o) => o.status === 'processing').length,
    shipped: monthOrders.filter((o) => o.status === 'shipped').length,
    delivered: monthOrders.filter((o) => o.status === 'delivered').length,
    cancelled: monthOrders.filter((o) => o.status === 'cancelled').length,
  }), [monthOrders]);

  // Export PDF Handler (Membuka jendela cetak format dokumen PDF resmi SEVAYA sesuai desain template editorial)
  const handleExportPDF = (mode: 'sales_only' | 'all_statuses' | 'cancelled_only' | 'current_filter' = 'sales_only') => {
    const monthLabel = selectedMonth === 'all' ? 'Semua Waktu' : formatMonthLabel(selectedMonth);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up window diblokir oleh browser. Harap izinkan pop-up untuk mengunduh laporan PDF.');
      return;
    }

    // Pool data pesanan berdasarkan bulan yang sedang dipilih
    const monthPool = selectedMonth === 'all'
      ? orders
      : orders.filter((o) => getOrderMonthKey(o.created_at) === selectedMonth);

    let targetOrders: AdminOrder[] = [];
    let reportDocTitle = 'LAPORAN PENJUALAN TERKONFIRMASI';
    let kpi1Label = 'Total penjualan bersih';
    let kpi2Label = 'Transaksi berhasil';
    let kpi3Label = 'Rata-rata order (AOV)';
    let kpi4Label = 'Total produk terjual';
    let tfootLabel = 'Total Penjualan Bersih';

    if (mode === 'sales_only') {
      targetOrders = monthPool.filter((o) => o.status !== 'cancelled' && o.status !== 'pending_payment');
      reportDocTitle = 'LAPORAN PENJUALAN TERKONFIRMASI';
      kpi1Label = 'Total penjualan bersih';
      kpi2Label = 'Transaksi berhasil';
      kpi3Label = 'Rata-rata order (AOV)';
      kpi4Label = 'Total produk terjual';
      tfootLabel = 'Total Penjualan Bersih';
    } else if (mode === 'all_statuses') {
      targetOrders = monthPool;
      reportDocTitle = 'LAPORAN SEMUA TRANSAKSI';
      kpi1Label = 'Total seluruh transaksi';
      kpi2Label = 'Total pesanan';
      kpi3Label = 'Rata-rata order (AOV)';
      kpi4Label = 'Total produk tercatat';
      tfootLabel = 'Total Seluruh Transaksi';
    } else if (mode === 'cancelled_only') {
      targetOrders = monthPool.filter((o) => o.status === 'cancelled');
      reportDocTitle = 'LAPORAN PESANAN DIBATALKAN';
      kpi1Label = 'Total nilai dibatalkan';
      kpi2Label = 'Pesanan dibatalkan';
      kpi3Label = 'Rata-rata order batal';
      kpi4Label = 'Total produk batal';
      tfootLabel = 'Total Nilai Dibatalkan';
    } else {
      // mode === 'current_filter'
      targetOrders = monthPool.filter((o) => filter === 'all' || o.status === filter);
      const filterName = filter === 'pending_payment' ? 'Belum Bayar' :
        filter === 'processing' ? 'Diproses' :
        filter === 'shipped' ? 'Dikirim' :
        filter === 'delivered' ? 'Sampai' :
        filter === 'cancelled' ? 'Dibatalkan' : 'Semua';
      reportDocTitle = `LAPORAN PESANAN (${filterName.toUpperCase()})`;
      kpi1Label = `Total nilai ${filterName.toLowerCase()}`;
      kpi2Label = `Pesanan ${filterName.toLowerCase()}`;
      kpi3Label = 'Rata-rata order';
      kpi4Label = 'Total produk';
      tfootLabel = `Total Nilai (${filterName})`;
    }

    const totalRevenue = targetOrders.reduce((s, o) => s + (o.grand_total || 0), 0);
    const avgOrderValue = targetOrders.length > 0 ? Math.round(totalRevenue / targetOrders.length) : 0;

    const totalGarments = targetOrders.reduce((sum, o) => {
      try {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [];
        return sum + items.reduce((s: number, i: { qty?: number }) => s + (i.qty || 1), 0);
      } catch {
        return sum + 1;
      }
    }, 0);

    const now = new Date();
    const datePart = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timePart = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(':', '.');
    const printDate = `${datePart}, ${timePart}`;

    const rowsHtml = targetOrders.map((o, idx) => {
      let dateStr = '-';
      if (o.created_at) {
        const d = new Date(o.created_at);
        const dDate = d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const dTime = d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).replace(':', '.');
        dateStr = `${dDate}, ${dTime}`;
      }

      let parsedItems: { productTitle?: string; title?: string; color?: string; size?: string; qty?: number; name?: string }[] = [];
      try {
        parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [];
      } catch {
        parsedItems = [];
      }

      const itemsHtml = parsedItems.length > 0
        ? parsedItems.map((i) => `
            <div>
              ${i.productTitle || i.title || i.name || 'Produk'}
              <span class="sub">${i.color || i.size ? `${i.color || i.size} &bull; ` : ''}${i.qty || 1} pcs</span>
            </div>
          `).join('')
        : 'Item pesanan';

      let statusText = 'Diproses';
      if (o.status === 'shipped') statusText = 'Dikirim';
      else if (o.status === 'delivered') statusText = 'Sampai';
      else if (o.status === 'cancelled') statusText = 'Dibatalkan';
      else if (o.status === 'pending_payment') statusText = 'Belum Bayar';
      else if (o.status === 'paid') statusText = 'Sudah Bayar';

      return `
        <tr>
          <td class="num">${idx + 1}</td>
          <td class="c-order">
            <span class="order-id">#${o.order_number}</span>
            <span class="sub">${dateStr}</span>
          </td>
          <td class="c-cust">
            ${o.customer_name}
            <span class="sub">${o.customer_phone || '-'}</span>
          </td>
          <td class="c-region">${o.destination_area || o.customer_address || '-'}</td>
          <td class="c-prod">
            ${itemsHtml}
          </td>
          <td class="c-ship">
            ${o.courier_name || '-'}
            <span class="sub">${o.tracking_number || '(Belum ada resi)'}</span>
          </td>
          <td class="c-status">${statusText}</td>
          <td class="c-total amount">${formatIDR(o.grand_total || 0)}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Laporan Penjualan SEVAYA Studio</title>
      <style>
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,700;1,400&display=swap");

        :root {
          --ink: #111111;
          --muted: #6b6b6b;
          --line: #e3e3e3;
          --paper: #ffffff;
          --font: "Avenir Next", "Avenir", "DM Sans", "Helvetica Neue", Arial, sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: var(--font);
          color: var(--ink);
          background: #f2f2f2;
          -webkit-font-smoothing: antialiased;
        }

        .page {
          width: 297mm;
          min-height: 210mm;
          margin: 12mm auto;
          padding: 12mm 16mm 10mm;
          background: var(--paper);
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 9mm;
          border-bottom: 1px solid var(--line);
        }
        .brand {
          font-size: 28px;
          font-weight: 400;
          letter-spacing: 0.29em;
          line-height: 1;
          padding-top: 4mm;
        }
        .meta { text-align: right; font-size: 11px; line-height: 1.6; color: var(--muted); }
        .meta strong { display: block; color: var(--ink); font-size: 11px; letter-spacing: 0.02em; }

        /* Ringkasan */
        .summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          margin-top: 8mm;
        }
        .stat .label { font-size: 9px; font-weight: 700; color: var(--muted); letter-spacing: 0.03em; text-transform: uppercase; }
        .stat .value { margin-top: 4px; font-size: 21px; font-weight: 700; line-height: 1.2; }

        /* Tabel */
        table { width: 100%; border-collapse: collapse; margin-top: 11mm; }
        th {
          text-align: left;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.03em;
          padding: 0 8px 9px 0;
          border-bottom: 1.2px solid var(--ink);
        }
        td {
          padding: 11px 8px 11px 0;
          font-size: 11.5px;
          line-height: 1.4;
          vertical-align: middle;
          border-bottom: 1px solid var(--line);
        }
        .num   { width: 6%;  text-align: center; color: var(--muted); font-size: 15px; padding-right: 0; }
        th.num { font-size: 9px; color: var(--ink); }
        .c-order  { width: 15%; }
        .c-cust   { width: 13%; }
        .c-region { width: 20%; }
        .c-prod   { width: 14%; }
        .c-ship   { width: 14%; }
        .c-status { width: 8%;  text-align: center; }
        .c-total  { width: 10%; text-align: right; padding-right: 0; }

        .order-id { font-weight: 700; }
        .sub { display: block; font-size: 10px; color: var(--muted); }
        .amount { font-weight: 700; font-size: 14.5px; white-space: nowrap; }

        /* Total */
        .total {
          display: flex;
          justify-content: flex-end;
          align-items: baseline;
          gap: 40px;
          margin-top: 0;
          padding-top: 10px;
          border-top: 1.2px solid var(--ink);
          margin-top: -1px;
        }
        .total .t-label { font-size: 12.5px; font-weight: 700; }
        .total .t-value { font-size: 17px; font-weight: 700; }

        /* Footer */
        .foot {
          margin-top: auto;
          padding-top: 6mm;
          border-top: 1px solid var(--line);
          font-size: 9.5px;
          color: var(--muted);
        }

        /* Cetak / simpan PDF: satu halaman A4 landscape */
        @page { size: A4 landscape; margin: 0; }
        @media print {
          body { background: none; }
          .page { margin: 0; box-shadow: none; }
        }

        /* Layar kecil: tabel bisa digeser ke samping */
        @media (max-width: 900px) {
          .page { width: 100%; margin: 0; padding: 20px 16px; min-height: 100vh; }
          .summary { grid-template-columns: repeat(2, 1fr); gap: 18px; }
          .table-wrap { overflow-x: auto; }
          table { min-width: 860px; }
          .head { flex-direction: column; gap: 14px; }
          .meta { text-align: left; }
        }
      </style>
      </head>
      <body>
        <main class="page">

          <header class="head">
            <div class="brand">SEVAYA</div>
            <div class="meta">
              <strong>${reportDocTitle}</strong>
              Periode: ${monthLabel}<br>
              Dicetak ${printDate} WIB
            </div>
          </header>

          <section class="summary" aria-label="Ringkasan penjualan">
            <div class="stat">
              <div class="label">${kpi1Label}</div>
              <div class="value">${formatIDR(totalRevenue)}</div>
            </div>
            <div class="stat">
              <div class="label">${kpi2Label}</div>
              <div class="value">${targetOrders.length} Pesanan</div>
            </div>
            <div class="stat">
              <div class="label">${kpi3Label}</div>
              <div class="value">${formatIDR(avgOrderValue)}</div>
            </div>
            <div class="stat">
              <div class="label">${kpi4Label}</div>
              <div class="value">${totalGarments} Pcs</div>
            </div>
          </section>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th class="num">NO</th>
                  <th class="c-order">ORDER &amp; TANGGAL</th>
                  <th class="c-cust">PELANGGAN</th>
                  <th class="c-region">WILAYAH TUJUAN</th>
                  <th class="c-prod">PRODUK</th>
                  <th class="c-ship">KURIR &amp; RESI</th>
                  <th class="c-status">STATUS</th>
                  <th class="c-total">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--muted);">Tidak ada data transaksi pada periode ini</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="total">
            <span class="t-label">${tfootLabel}</span>
            <span class="t-value">${formatIDR(totalRevenue)}</span>
          </div>

          <footer class="foot">SEVAYA STUDIO &copy; ${new Date().getFullYear()} &bull; sevaya-studio.com</footer>

        </main>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Filter + search
  const filtered = orders.filter((o) => {
    const matchMonth = selectedMonth === 'all' || Boolean(search) || getOrderMonthKey(o.created_at) === selectedMonth;
    const matchStatus = filter === 'all' || o.status === filter;

    const courierLower = (o.courier_name || '').toLowerCase();
    const matchCourier =
      courierFilter === 'all' ||
      (courierFilter === 'jne' && courierLower.includes('jne')) ||
      (courierFilter === 'sicepat' && courierLower.includes('sicepat'));

    const searchLower = search.toLowerCase();
    const matchSearch =
      !search ||
      o.order_number?.toLowerCase().includes(searchLower) ||
      o.customer_name?.toLowerCase().includes(searchLower) ||
      o.customer_phone?.includes(search) ||
      o.biteship_order_id?.toLowerCase().includes(searchLower) ||
      o.tracking_number?.toLowerCase().includes(searchLower) ||
      courierLower.includes(searchLower);

    return matchMonth && matchStatus && matchCourier && matchSearch;
  });

  return (
    <div className="w-full">
      {/* ===== Header Sesuai Desain SEVAYA ===== */}
      <AdminPageHeader
        title="Pesanan & Pengiriman"
        subtitle="Pantau transaksi pelanggan, status pengiriman kurir, dan nomor resi secara real-time."
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      >
        <span className="hidden sm:flex items-center gap-2 text-xs text-[#6b655e] whitespace-nowrap before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#1f7a4d]">
          Diperbarui <time className="font-mono">{lastRefresh ? lastRefresh.toLocaleTimeString('id-ID') : '12.23.49'}</time>
        </span>

        <button
          type="button"
          onClick={() => fetchOrders(true, true)}
          disabled={refreshing}
          className="h-8 sm:h-10 px-2 sm:px-3.5 flex items-center gap-1.5 sm:gap-2 bg-white border border-[#d6d1c9] rounded-[2px] text-[10px] sm:text-xs font-medium text-[#1a1a1a] hover:border-[#1a1a1a] transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
          title="Sinkronkan data pesanan"
        >
          <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Menyinkronkan...' : 'Sinkron'}</span>
        </button>
      </AdminPageHeader>

      {/* Konten Halaman */}
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1560px] px-3 sm:px-5 lg:px-6 xl:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6">

      {/* Unified Executive KPI Summary Card (Kartu Interaktif Minimalis & Elegan) */}
      <div className="rounded-xl sm:rounded-2xl border border-black/10 bg-white p-3.5 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3 sm:space-y-4">
        {/* Total Nilai Pesanan Per Bulan & Export PDF (Layout Mewah, Rapi, & Seimbang) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/10 pb-3.5">
          <div>
            <span className="font-headline text-[9px] sm:text-[10px] font-bold tracking-widest text-black/50 uppercase block">
              Total Nilai Pesanan Masuk
            </span>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span className="font-headline text-lg sm:text-3xl font-bold text-black tracking-tight">
                {formatIDR(monthRevenue)}
              </span>
              <span className="text-[10px] sm:text-xs text-black/50 mt-0.5 block sm:inline">
                ({validMonthOrders.length} transaksi)
              </span>
            </div>
          </div>

          {/* Action Toolbar: Custom Month Picker & Export PDF (Saling Geser Horizontal di Mobile, Tidak Menumpuk ke Bawah) */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-nowrap overflow-x-auto no-scrollbar touch-pan-x py-0.5">
            {/* Elegant Custom Month Picker Dropdown */}
            <div className="relative inline-flex items-center shrink-0 flex-1 sm:flex-initial min-w-[140px] sm:min-w-0">
              <Calendar className="absolute left-2.5 sm:left-3 w-3.5 h-3.5 text-black/45 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-8.5 sm:h-9.5 pl-7.5 sm:pl-8.5 pr-7 sm:pr-8 bg-[#FAF9F7] hover:bg-[#F3EFE8] border border-black/15 rounded-xl text-[11px] sm:text-xs font-medium text-black focus:border-black focus:outline-none cursor-pointer transition appearance-none shadow-2xs truncate"
                title="Pilih periode bulan transaksi"
              >
                <option value="all">Semua Waktu</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}{m === currentCalendarMonth ? ' (Bulan Ini)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-black/40 pointer-events-none" />
            </div>

            {/* Export PDF Action Button with Dropdown Options */}
            <div className="relative shrink-0" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="h-8.5 sm:h-9.5 px-3 sm:px-3.5 flex items-center gap-1.5 bg-[#1A1A1A] hover:bg-black text-white rounded-xl text-[11px] sm:text-xs font-medium tracking-wide transition active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
                title="Pilih opsi ekspor laporan PDF"
              >
                <FileDown className="w-3.5 h-3.5 stroke-2 shrink-0" />
                <span>Export PDF</span>
                <ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-200 shrink-0 ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 sm:hidden"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="fixed sm:absolute inset-x-3 bottom-20 sm:bottom-auto sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 rounded-2xl border border-black/10 bg-white shadow-2xl p-2 z-50 max-h-[75vh] overflow-y-auto">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 text-[10px] tracking-wider uppercase text-black/45 font-mono">
                      <span>Periode Laporan</span>
                      <span className="font-sans font-bold text-black text-xs truncate max-w-[140px]">
                        {selectedMonth === 'all' ? 'Semua Waktu' : formatMonthLabel(selectedMonth)}
                      </span>
                    </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleExportPDF('sales_only');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#FAF9F7] transition cursor-pointer group flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-black tracking-tight">
                          Laporan Penjualan Berhasil
                        </p>
                        <p className="text-[10px] text-black/50 mt-0.5">
                          Hanya transaksi valid ({validMonthOrders.length} pesanan)
                        </p>
                      </div>
                      <span className="text-[10px] text-black/40 font-mono mt-0.5 group-hover:text-black">PDF ↗</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleExportPDF('all_statuses');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#FAF9F7] transition cursor-pointer group flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-black tracking-tight">
                          Laporan Semua Status
                        </p>
                        <p className="text-[10px] text-black/50 mt-0.5">
                          Lengkap termasuk diproses & dibatalkan ({monthOrders.length} total)
                        </p>
                      </div>
                      <span className="text-[10px] text-black/40 font-mono mt-0.5 group-hover:text-black">PDF ↗</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleExportPDF('cancelled_only');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#FAF9F7] transition cursor-pointer group flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-black tracking-tight">
                          Laporan Pesanan Dibatalkan
                        </p>
                        <p className="text-[10px] text-black/50 mt-0.5">
                          Khusus evaluasi pembatalan ({stats.cancelled} pesanan)
                        </p>
                      </div>
                      <span className="text-[10px] text-black/40 font-mono mt-0.5 group-hover:text-black">PDF ↗</span>
                    </button>

                    {filter !== 'all' && filter !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowExportMenu(false);
                          handleExportPDF('current_filter');
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-black/[0.02] hover:bg-[#FAF9F7] transition cursor-pointer group flex items-start justify-between gap-3 border-t border-black/5"
                      >
                        <div>
                          <p className="text-xs font-semibold text-black tracking-tight">
                            Sesuai Filter: {
                              filter === 'pending_payment' ? 'Belum Bayar' :
                              filter === 'processing' ? 'Diproses' :
                              filter === 'shipped' ? 'Dikirim' :
                              filter === 'delivered' ? 'Sampai' : filter
                            }
                          </p>
                          <p className="text-[10px] text-black/50 mt-0.5">
                            Menampilkan {stats[filter as keyof typeof stats] || 0} pesanan terpilih
                          </p>
                        </div>
                        <span className="text-[10px] text-black/40 font-mono mt-0.5 group-hover:text-black">PDF ↗</span>
                      </button>
                    )}
                  </div>
                </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 6 Minimalist & Functional Interactive Status Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-3">
          {[
            {
              key: 'all', label: 'Semua', value: stats.all,
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
              ),
            },
            {
              key: 'pending_payment', label: 'Belum Bayar', value: stats.pending_payment,
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                </svg>
              ),
            },
            {
              key: 'processing', label: 'Diproses', value: stats.processing,
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              ),
            },
            {
              key: 'shipped', label: 'Dikirim', value: stats.shipped,
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              ),
            },
            {
              key: 'delivered', label: 'Sampai', value: stats.delivered,
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ),
            },
            {
              key: 'cancelled', label: 'Dibatalkan', value: stats.cancelled,
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              ),
            },
          ].map((s) => {
            const isActive = filter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setFilter(isActive && s.key !== 'all' ? 'all' : s.key)}
                className={`flex flex-col text-left rounded-xl p-2 sm:p-3.5 transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white shadow-sm ring-1 ring-[#1A1A1A]'
                    : 'bg-black/[0.02] border border-black/10 hover:bg-black/[0.04] hover:border-black/25 text-black'
                }`}
                title={`Filter: ${s.label}`}
              >
                {/* Row 1: angka kiri, logo kanan */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className={`text-base sm:text-2xl font-bold font-headline tracking-tight ${
                    isActive ? 'text-white' : 'text-black'
                  }`}>
                    {s.value}
                  </span>
                  <span className={isActive ? 'text-white/50' : 'text-black/30'}>
                    {s.icon}
                  </span>
                </div>
                {/* Row 2: label */}
                <span className={`text-[8px] sm:text-[10px] font-medium tracking-wide truncate block mt-0.5 ${
                  isActive ? 'text-white/60' : 'text-black/50'
                }`}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar & Quick Courier Filter (Bersih, Efisien, Tanpa Konflik) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, no. order, resi..."
            className="w-full bg-white px-3.5 py-2.5 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none min-h-[40px] rounded-xl border border-black/15 shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black/40 hover:text-black cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={courierFilter}
          onChange={(e) => setCourierFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-black/15 rounded-xl text-xs font-medium text-black/80 focus:border-black focus:outline-none cursor-pointer shrink-0 shadow-xs"
        >
          <option value="all">Semua Kurir</option>
          <option value="jne">Kurir: JNE</option>
          <option value="sicepat">Kurir: SiCepat</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Biteship info banner when no orders */}
      {!loading && orders.length === 0 && !error && (
        <div className="rounded-2xl border border-black/15 bg-white p-8 text-center space-y-2">
          <p className="text-2xl">📦</p>
          <p className="font-semibold text-sm text-black">Belum ada data pesanan</p>
          <p className="text-xs text-black/70">
            Pesanan baru pelanggan dari toko akan otomatis tersinkronisasi dan tampil di sini.
          </p>
          <a
            href="/test-shipping"
            className="mt-2 inline-block text-xs font-medium text-black underline hover:text-black/70"
          >
            Buka form simulasi sandbox &rarr;
          </a>
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="rounded-2xl border border-black/15 bg-white overflow-hidden shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
          <InventoryTableSkeleton rows={6} />
        </div>
      ) : (
        filtered.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div
              className="hidden md:block overflow-x-auto rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)]"
            >
              <table className="w-full text-xs min-w-[1050px]">
                <thead>
                  <tr className="border-b border-black/15 bg-[#FAF9F7]">
                    {[
                      'Order ID / Ref',
                      'Pelanggan',
                      'Wilayah Tujuan',
                      'Total Item',
                      'Harga & Ongkir',
                      'Kurir / Resi',
                      'Status',
                      'Biteship',
                      'Dibuat',
                    ].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-3 text-left font-headline text-[10px] font-bold uppercase tracking-wider text-black/70"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="whitespace-nowrap px-4 py-3 text-right font-headline text-[10px] font-bold uppercase tracking-wider text-black/70">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(0,0,0,0.12)]/60">
                  {filtered.map((o) => {
                    let parsedItems: { qty?: number }[] = [];
                    try { parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []; } catch { /* */ }
                    const totalItems = parsedItems.reduce((s, i) => s + (i.qty || 1), 0);

                    return (
                      <tr
                        key={o.id}
                        className="group bg-white transition hover:bg-white"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-black">#{o.order_number}</p>
                          <p className="font-mono text-[10px] text-black/50">{o.id?.slice(0, 8)}...</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-black">{o.customer_name}</p>
                          <p className="text-black/70">{o.customer_phone}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-black">{o.destination_area || '—'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-black">
                          {totalItems}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-bold text-xs text-black">
                            {formatIDR(o.grand_total || ((o.subtotal || 0) + (o.shipping_cost || 0)))}
                          </p>
                          <p className="text-[10px] text-black/60">
                            Produk: {formatIDR(o.subtotal || 0)}
                          </p>
                          <p className="text-[10px] text-emerald-800 font-medium">
                            + Ongkir: {formatIDR(o.shipping_cost || 0)}
                          </p>
                          {Boolean(o.discount && o.discount > 0) && (
                            <p className="text-[9.5px] text-red-600">
                              - Diskon: {formatIDR(o.discount || 0)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-black">{o.courier_name || '—'}</p>
                          {o.tracking_number && (
                            <p className="font-mono text-[10px] text-emerald-800 font-semibold">{o.tracking_number}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={o.status} type="internal" />
                        </td>
                        <td className="px-4 py-3.5">
                          {o.biteship_order_id && o.biteship_status ? (
                            <StatusBadge status={o.biteship_status} type="biteship" />
                          ) : (
                            <span className="text-black/50">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-black/70 text-[11px]">
                          {formatDate(o.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="rounded-full border border-black/20 bg-white px-3 py-1 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 cursor-pointer"
                            >
                              Kelola
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View */}
            <div className="space-y-3.5 md:hidden">
              {filtered.map((o) => {
                let parsedItems: { qty?: number }[] = [];
                try { parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []; } catch { /* */ }
                const totalItems = parsedItems.reduce((s, i) => s + (i.qty || 1), 0);

                return (
                  <div
                    key={o.id}
                    className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3"
                  >
                    {/* Top: Order number & Badges */}
                    <div className="flex items-start justify-between gap-2 border-b border-black/10 pb-3">
                      <div>
                        <p className="font-headline font-bold text-sm text-black">#{o.order_number}</p>
                        <p className="text-[11px] text-black/50 mt-0.5">{formatDate(o.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={o.status} type="internal" />
                        {o.biteship_order_id && o.biteship_status && (
                          <StatusBadge status={o.biteship_status} type="biteship" />
                        )}
                      </div>
                    </div>

                    {/* Customer & Location */}
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-black/40 uppercase tracking-wider block">Pelanggan</span>
                        <p className="font-semibold text-black text-xs truncate mt-0.5">{o.customer_name}</p>
                        <p className="text-[11px] text-black/60 font-mono mt-0.5">{o.customer_phone}</p>
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <span className="text-[10px] font-bold text-black/40 uppercase tracking-wider block">Tujuan</span>
                        <p className="text-black/80 text-[11px] line-clamp-2 mt-0.5 leading-snug">
                          {o.destination_area || o.customer_address || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Courier & Waybill Badge + Price Breakdown */}
                    <div className="rounded-xl bg-[#FAF9F6] border border-black/10 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-black text-xs truncate">{o.courier_name || 'Kurir Reguler'}</p>
                          <p className="text-[10px] text-black/50 mt-0.5">{totalItems} Item • Produk {formatIDR(o.subtotal || 0)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-black/50 block">+ Ongkir {formatIDR(o.shipping_cost || 0)}</span>
                          <span className="font-headline font-bold text-sm text-black block mt-0.5">
                            {formatIDR(o.grand_total || ((o.subtotal || 0) + (o.shipping_cost || 0)))}
                          </span>
                        </div>
                      </div>

                      {/* Resi pill if available */}
                      {o.tracking_number ? (
                        <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/80 rounded-lg px-2.5 py-1 text-[11px]">
                          <span className="text-emerald-900 font-medium">No. Resi</span>
                          <span className="font-mono font-bold text-emerald-800">{o.tracking_number}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-black/[0.03] rounded-lg px-2.5 py-1 text-[10px] text-black/50">
                          <span>Status Resi</span>
                          <span>Menunggu pickup kurir</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="w-full min-h-[40px] flex items-center justify-center rounded-full bg-black text-white text-xs font-semibold hover:bg-black/85 active:scale-95 transition shadow-xs cursor-pointer"
                      >
                        Kelola Pesanan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Modal Detail Order */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onCreateBiteship={handleCreateBiteship}
          onPrintLabel={(ord) => setPrintOrder(ord)}
          onDeleteOrder={(id, orderNumber) => {
            handleDeleteOrder(id, orderNumber);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Modal Cetak Label Pengiriman (Thermal 10x15 cm) */}
      <ShippingLabelModal
        order={printOrder}
        isOpen={Boolean(printOrder)}
        onClose={() => setPrintOrder(null)}
      />
      </div>
    </div>
  );
}

export { OrdersTab as BiteshipSimulatorDashboard };
