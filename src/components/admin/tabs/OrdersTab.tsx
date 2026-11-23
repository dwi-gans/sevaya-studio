'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { PanelLeft, RefreshCw, Store, FileDown, Calendar, ChevronDown } from 'lucide-react';
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
}: {
  order: AdminOrder;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, extra?: Partial<AdminOrder>) => Promise<void>;
  onCreateBiteship: (order: AdminOrder, courier: string, service: string) => Promise<void>;
  onPrintLabel?: (order: AdminOrder) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [trackingInput, setTrackingInput] = useState(order.tracking_number || '');
  const [logs, setLogs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
            <button
              type="button"
              onClick={() => onPrintLabel?.(order)}
              className="flex items-center gap-1.5 rounded-full border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95 cursor-pointer shadow-xs"
              title="Cetak Label Pengiriman (Thermal 10x15)"
            >
              <span>🖨️</span>
              <span className="hidden xs:inline">Cetak Label</span>
            </button>
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
          {/* Quick Print Card */}
          <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-black/15 bg-[#FAF9F6] p-3.5 sm:px-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-black text-white flex items-center justify-center text-base shrink-0">
                🖨️
              </div>
              <div>
                <p className="text-xs font-bold text-black flex items-center gap-1.5">
                  Label Pengiriman &amp; Packing Slip (Thermal 10×15 cm)
                </p>
                <p className="text-[11px] text-black/60">
                  {order.tracking_number
                    ? `No. Resi: ${order.tracking_number} (Tercetak otomatis)`
                    : 'Siap cetak untuk tempel paket (Mode kirim sendiri / drop-off manual)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onPrintLabel?.(order)}
              className="min-h-[36px] px-4 rounded-full bg-black text-white text-xs font-bold transition hover:bg-black/85 active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>🖨️</span> Cetak Label (A6)
            </button>
          </div>
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
                Ubah Status Internal
              </h4>
              <div className="rounded-xl border border-black/15 bg-white p-3.5 sm:p-4 space-y-3">
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
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {INTERNAL_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      disabled={loading || order.status === s.value}
                      onClick={() => handleInternalStatusChange(s.value)}
                      className={`min-h-[38px] rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5
                        ${order.status === s.value
                          ? `${s.color} ring-2 ring-black/15 shadow-xs font-extrabold`
                          : 'border-black/15 bg-white text-black/60 hover:bg-black/5 hover:text-black disabled:opacity-40'
                        }`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`} />
                      {order.status === s.value ? '✓ ' : ''}{s.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Shipping Carrier / Biteship */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                Pengiriman Kurir (Biteship)
              </h4>
              <div className="rounded-xl border border-black/15 bg-white p-3.5 sm:p-4 space-y-3">
                {order.biteship_order_id ? (
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/60 p-3.5 text-xs space-y-2">
                    <p className="font-bold text-emerald-800">✅ Terhubung ke Biteship</p>
                    <p className="text-emerald-700 font-mono text-[11px] break-all">{order.biteship_order_id}</p>
                    <p className="text-emerald-800 text-[11px]">Status Kurir: <strong>{order.biteship_status}</strong></p>

                    <div className="pt-2 border-t border-emerald-200/70">
                      <span className="text-[10px] text-emerald-900 font-bold uppercase tracking-wider block mb-1.5">
                        Simulasi Tahapan Kurir:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { val: 'allocated', label: 'Allocated', internal: 'processing' },
                          { val: 'picking_up', label: 'Picking Up', internal: 'processing' },
                          { val: 'picked', label: 'Picked', internal: 'processing' },
                          { val: 'dropping_off', label: 'Dropping Off', internal: 'shipped' },
                          { val: 'delivered', label: 'Delivered', internal: 'delivered' },
                        ].map((btn) => (
                          <button
                            key={btn.val}
                            type="button"
                            disabled={loading || order.biteship_status === btn.val}
                            onClick={() => {
                              handleBiteshipSimulation(btn.val, btn.internal);
                            }}
                            className={`min-h-[36px] rounded-full border px-2.5 py-1 text-[10px] font-semibold transition active:scale-95 ${
                              order.biteship_status === btn.val
                                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                                : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100 disabled:opacity-50'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href="https://dashboard.biteship.com/orders"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-black underline hover:text-black/70"
                      >
                        Buka Biteship Dashboard →
                      </a>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          if (confirm('Putus ID Biteship lama agar Anda dapat memesan kurir baru dengan API Live?')) {
                            onStatusUpdate(order.id, order.status, {
                              biteship_order_id: null as any,
                              biteship_status: null as any,
                            });
                          }
                        }}
                        className="text-[10px] text-red-600 underline hover:text-red-800 transition cursor-pointer"
                      >
                        Reset / Panggil Kurir Ulang
                      </button>
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

  // Periodic polling: fetch orders from DB every 25 seconds only when document is visible
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrders(true, false);
      }
    }, 25000);
    return () => clearInterval(interval);
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

  // Export PDF Handler (Membuka jendela cetak format dokumen PDF resmi SEVAYA)
  const handleExportPDF = () => {
    const monthLabel = selectedMonth === 'all' ? 'Semua Waktu' : formatMonthLabel(selectedMonth);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up window diblokir oleh browser. Harap izinkan pop-up untuk mengunduh laporan PDF.');
      return;
    }

    const reportOrders = selectedMonth === 'all'
      ? orders
      : orders.filter((o) => getOrderMonthKey(o.created_at) === selectedMonth);

    const reportValid = reportOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'pending_payment');
    const reportRevenue = reportValid.reduce((s, o) => s + (o.grand_total || 0), 0);
    const reportAov = reportValid.length > 0 ? Math.round(reportRevenue / reportValid.length) : 0;
    const totalOrderSum = reportOrders.reduce((s, o) => s + (o.grand_total || 0), 0);

    const totalGarments = reportOrders.reduce((sum, o) => {
      try {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [];
        return sum + items.reduce((s: number, i: { qty?: number }) => s + (i.qty || 1), 0);
      } catch {
        return sum + 1;
      }
    }, 0);

    const printDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const rowsHtml = reportOrders.map((o, idx) => {
      const dateStr = o.created_at
        ? new Date(o.created_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-';

      let statusBadgeColor = '#1A1A1A';
      let statusBgColor = '#F3F4F6';
      let statusBorder = '#E5E7EB';
      let statusText = o.status;
      if (o.status === 'processing') {
        statusBadgeColor = '#8C4725';
        statusBgColor = '#FAF4EE';
        statusBorder = '#EED4C5';
        statusText = 'Diproses';
      } else if (o.status === 'shipped') {
        statusBadgeColor = '#186068';
        statusBgColor = '#EDF7F8';
        statusBorder = '#C4E3E6';
        statusText = 'Dikirim';
      } else if (o.status === 'delivered') {
        statusBadgeColor = '#1E6037';
        statusBgColor = '#EDF7EE';
        statusBorder = '#C3E2C6';
        statusText = 'Sampai';
      } else if (o.status === 'cancelled') {
        statusBadgeColor = '#A12B35';
        statusBgColor = '#FDF2F2';
        statusBorder = '#EFC8CB';
        statusText = 'Dibatalkan';
      } else if (o.status === 'pending_payment') {
        statusBadgeColor = '#8C5D23';
        statusBgColor = '#FEF8ED';
        statusBorder = '#EEDBBF';
        statusText = 'Belum Bayar';
      }

      return `
        <tr>
          <td style="text-align: center; color: #8C857E; font-weight: 500;">${idx + 1}</td>
          <td>
            <span class="order-code">${o.order_number}</span><br/>
            <span class="text-muted">${dateStr}</span>
          </td>
          <td>
            <strong style="color: #1A1A1A; font-weight: 600;">${o.customer_name}</strong><br/>
            <span class="text-muted">${o.customer_phone || '-'}</span>
          </td>
          <td style="max-width: 170px; line-height: 1.35; color: #4A4540;">
            ${o.destination_area || o.customer_address || '-'}
          </td>
          <td>
            <span style="font-weight: 600; color: #1A1A1A;">${o.courier_name || '-'}</span><br/>
            ${o.tracking_number ? `<span class="resi-pill">${o.tracking_number}</span>` : `<span class="text-muted" style="font-style: italic;">(Belum ada resi)</span>`}
          </td>
          <td>
            <span class="status-badge" style="color: ${statusBadgeColor}; background: ${statusBgColor}; border: 1px solid ${statusBorder};">
              ${statusText}
            </span>
          </td>
          <td style="text-align: right; font-weight: 700; color: #1A1A1A; font-size: 10px;">
            ${formatIDR(o.grand_total || 0)}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan_Penjualan_SEVAYA_${monthLabel.replace(/\\s+/g, '_')}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 14mm 12mm 14mm;
          }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1A1C1C;
            background: #FFFFFF;
            margin: 0;
            padding: 0;
            font-size: 9.5px;
            line-height: 1.45;
          }

          /* Luxury Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 14px;
            border-bottom: 2px solid #1A1A1A;
            margin-bottom: 16px;
          }
          .brand-logo {
            font-family: 'Cinzel', Georgia, serif;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 0.22em;
            color: #1A1A1A;
            text-transform: uppercase;
            line-height: 1;
          }
          .brand-subtitle {
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #8C7A6B;
            margin-top: 6px;
          }
          .report-meta {
            text-align: right;
            font-size: 9px;
            color: #555;
            line-height: 1.6;
          }
          .period-pill {
            display: inline-block;
            background: #FAF9F7;
            border: 1px solid #E2DCD3;
            padding: 3px 9px;
            border-radius: 6px;
            font-weight: 700;
            color: #1A1A1A;
            font-size: 10px;
            letter-spacing: 0.02em;
            margin-bottom: 3px;
          }

          /* Executive KPI Summary Cards */
          .kpi-grid {
            display: grid;
            grid-template-columns: 1.25fr 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 18px;
          }
          .kpi-card {
            background: #FAF9F7;
            border: 1px solid #EAE6DE;
            border-radius: 8px;
            padding: 11px 14px;
            position: relative;
          }
          .kpi-card.dark {
            background: #181818;
            border-color: #181818;
            color: #FFFFFF;
          }
          .kpi-card.dark .kpi-label {
            color: #C8B9A6;
          }
          .kpi-card.dark .kpi-val {
            color: #FFFFFF;
          }
          .kpi-card.dark .kpi-sub {
            color: #9E968F;
          }
          .kpi-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.09em;
            color: #7A746E;
          }
          .kpi-val {
            font-size: 17px;
            font-weight: 800;
            color: #1A1C1C;
            margin-top: 4px;
            letter-spacing: -0.02em;
          }
          .kpi-sub {
            font-size: 8px;
            color: #8C857E;
            margin-top: 2px;
          }

          /* Luxury Orders Table */
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 9.5px;
            border: 1px solid #EAE6DE;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 16px;
          }
          thead {
            background: #181818;
          }
          th {
            color: #FFFFFF;
            padding: 8px 10px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            text-align: left;
            border: none;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #EFECE6;
            vertical-align: middle;
            color: #2D2A26;
          }
          tr:nth-child(even) td {
            background: #FAF9F7;
          }
          tr:last-child td {
            border-bottom: none;
          }

          /* Status Badges */
          .status-badge {
            display: inline-block;
            padding: 2.5px 7px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .order-code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
            font-weight: 700;
            color: #1A1A1A;
            font-size: 9px;
          }
          .resi-pill {
            display: inline-block;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
            font-size: 8px;
            background: #EFECE6;
            padding: 1.5px 5px;
            border-radius: 4px;
            color: #333;
            margin-top: 2px;
            border: 1px solid #E0DAD0;
          }
          .text-muted {
            color: #7A746E;
            font-size: 8.5px;
          }

          /* Table Summary Footer */
          tfoot td {
            background: #F3EFE9 !important;
            font-weight: 700;
            border-top: 2px solid #E0DAD0;
            padding: 9px 10px;
            color: #1A1A1A;
          }

          /* Document Footer */
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 10px;
            border-top: 1px solid #EAE6DE;
            font-size: 8.5px;
            color: #8C857E;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-logo">SEVAYA STUDIO</div>
            <div class="brand-subtitle">Modest Luxury Atelier &bull; Laporan Eksekutif Penjualan &bull; Edisi Resmi</div>
          </div>
          <div class="report-meta">
            <div><span class="period-pill">Periode: ${monthLabel}</span></div>
            <div><strong>Waktu Cetak:</strong> ${printDate} WIB</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card dark">
            <div class="kpi-label">Total Pendapatan Terkonfirmasi</div>
            <div class="kpi-val">${formatIDR(reportRevenue)}</div>
            <div class="kpi-sub">Dari ${reportValid.length} pesanan terbayar</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Transaksi Berhasil</div>
            <div class="kpi-val">${reportValid.length} Pesanan</div>
            <div class="kpi-sub">Pesanan terkonfirmasi valid</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Rata-rata Order (AOV)</div>
            <div class="kpi-val">${formatIDR(reportAov)}</div>
            <div class="kpi-sub">Rata-rata per transaksi</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Item Terjual</div>
            <div class="kpi-val">${totalGarments} Produk</div>
            <div class="kpi-sub">Total kuantitas barang dipesan</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 28px; text-align: center;">No</th>
              <th style="width: 140px;">No. Order & Tanggal</th>
              <th style="width: 155px;">Pelanggan</th>
              <th>Wilayah Tujuan</th>
              <th style="width: 165px;">Kurir & Resi</th>
              <th style="width: 90px;">Status</th>
              <th style="width: 115px; text-align: right;">Total Nilai</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #888;">Tidak ada pesanan pada periode ini</td></tr>'}
          </tbody>
          ${reportOrders.length > 0 ? `
            <tfoot>
              <tr>
                <td colspan="6" style="text-align: right; text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.05em; font-weight: 800;">
                  Total Keseluruhan (${reportOrders.length} Pesanan):
                </td>
                <td style="text-align: right; font-size: 11px; font-weight: 800; color: #1A1A1A;">
                  ${formatIDR(totalOrderSum)}
                </td>
              </tr>
            </tfoot>
          ` : ''}
        </table>

        <div class="footer">
          <div>
            <strong>SEVAYA STUDIO</strong> &copy; ${new Date().getFullYear()} &bull; Dokumen resmi sistem operasional &amp; keuangan toko online.
          </div>
          <div>
            Dicetak otomatis &bull; Total ${reportOrders.length} transaksi ditampilkan
          </div>
        </div>

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
          className="h-9 sm:h-10 px-3 sm:px-4.5 flex items-center gap-1.5 sm:gap-2.5 bg-[#1a1a1a] text-white border border-[#1a1a1a] rounded-[2px] text-[11px] sm:text-xs font-semibold tracking-wider sm:tracking-[0.14em] uppercase hover:bg-black transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
          title="Sinkronkan data pesanan"
        >
          <RefreshCw className={`w-3.5 h-3.5 stroke-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Sinkron...' : 'Sinkron'}</span>
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
              <span className="font-headline text-xl sm:text-3xl font-bold text-black tracking-tight">
                {formatIDR(monthRevenue)}
              </span>
              <span className="text-xs text-black/50">
                ({validMonthOrders.length} transaksi terkonfirmasi)
              </span>
            </div>
          </div>

          {/* Action Toolbar: Custom Month Picker & Export PDF */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Elegant Custom Month Picker Dropdown */}
            <div className="relative inline-flex items-center">
              <Calendar className="absolute left-3 w-3.5 h-3.5 text-black/45 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-9.5 pl-8.5 pr-8 bg-[#FAF9F7] hover:bg-[#F3EFE8] border border-black/15 rounded-xl text-xs font-medium text-black focus:border-black focus:outline-none cursor-pointer transition appearance-none shadow-2xs"
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

            {/* Export PDF Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="h-9.5 px-3.5 flex items-center gap-2 bg-[#1A1A1A] hover:bg-black text-white rounded-xl text-xs font-medium tracking-wide transition active:scale-95 cursor-pointer shadow-xs"
              title="Download atau cetak laporan transaksi bulanan dalam bentuk PDF"
            >
              <FileDown className="w-3.5 h-3.5 stroke-2" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* 6 Minimalist & Functional Interactive Status Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {[
            { key: 'all', label: 'Semua', value: stats.all, dot: 'bg-black' },
            { key: 'pending_payment', label: 'Belum Bayar', value: stats.pending_payment, dot: 'bg-[#C2822B]' },
            { key: 'processing', label: 'Diproses', value: stats.processing, dot: 'bg-[#BF6338]' },
            { key: 'shipped', label: 'Dikirim', value: stats.shipped, dot: 'bg-[#22848F]' },
            { key: 'delivered', label: 'Sampai', value: stats.delivered, dot: 'bg-[#2B864E]' },
            { key: 'cancelled', label: 'Dibatalkan', value: stats.cancelled, dot: 'bg-[#C7404B]' },
          ].map((s) => {
            const isActive = filter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setFilter(isActive && s.key !== 'all' ? 'all' : s.key)}
                className={`flex flex-col justify-between text-left rounded-xl p-2.5 sm:p-3.5 transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white shadow-sm ring-1 ring-[#1A1A1A]'
                    : 'bg-black/[0.02] border border-black/10 hover:bg-black/[0.04] hover:border-black/25 text-black'
                }`}
                title={`Filter: ${s.label}`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${
                    isActive ? 'text-white/80' : 'text-black/60'
                  }`}>
                    {s.label}
                  </span>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    isActive ? 'bg-white' : s.dot
                  }`} />
                </div>
                <div className="mt-2 sm:mt-2.5">
                  <span className={`text-lg sm:text-2xl font-bold font-headline tracking-tight ${
                    isActive ? 'text-white' : 'text-black'
                  }`}>
                    {s.value}
                  </span>
                </div>
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
            placeholder="Cari nama pelanggan, no. order (#SVY-...), resi, kurir, Biteship ID..."
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
                  <tr className="border-b border-black/15 bg-black/5">
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
                    <th className="sticky right-0 z-20 whitespace-nowrap bg-black/5 px-4 py-3 text-left font-headline text-[10px] font-bold uppercase tracking-wider text-black/70 shadow-[-6px_0_10px_rgba(0,0,0,0.03)]">
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
                        <td className="whitespace-nowrap px-4 py-3.5 text-black/70">
                          {formatDate(o.created_at)}
                        </td>
                        <td className="sticky right-0 z-10 whitespace-nowrap bg-white group-hover:bg-white px-4 py-3.5 shadow-[-6px_0_10px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="rounded-full border border-black/20 bg-white px-3 py-1 text-xs font-medium text-black transition hover:border-black hover:bg-black/5"
                            >
                              Kelola
                            </button>
                            <button
                              onClick={() => setPrintOrder(o)}
                              title="Cetak Label Pengiriman (Thermal 10x15)"
                              className="rounded-full border border-black/20 bg-white px-2.5 py-1 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 flex items-center gap-1"
                            >
                              <span>🖨️</span> Label
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(o.id, o.order_number)}
                              title="Hapus Pesanan"
                              className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-600 transition hover:bg-red-100"
                            >
                              🗑
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

                    {/* Actions: Clean touch-friendly buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="flex-1 min-h-[40px] flex items-center justify-center rounded-full bg-black text-white text-xs font-semibold hover:bg-black/85 active:scale-95 transition shadow-xs cursor-pointer"
                      >
                        Kelola Pesanan
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintOrder(o)}
                        title="Cetak Label Pengiriman"
                        className="min-h-[40px] px-3.5 flex items-center justify-center gap-1 rounded-full border border-black/20 bg-white text-xs font-semibold text-black hover:bg-black/5 active:scale-95 transition cursor-pointer shrink-0"
                      >
                        <span>🖨️</span> Label
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(o.id, o.order_number)}
                        title="Hapus Pesanan"
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-xs text-red-600 hover:bg-red-100 active:scale-95 transition cursor-pointer shrink-0"
                      >
                        🗑
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
