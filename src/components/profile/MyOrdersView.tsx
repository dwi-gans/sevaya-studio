'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/ui/Icon';

export interface OrderItem {
  id?: string;
  name?: string;
  title?: string;
  price?: number;
  quantity?: number;
  image?: string;
  color?: string;
  size?: string;
  edition?: string;
}

export interface UserOrder {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  destination_area?: string;
  items: OrderItem[];
  subtotal?: number;
  discount?: number;
  shipping_cost?: number;
  gift_fee?: number;
  grand_total?: number;
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

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua Pesanan' },
  { id: 'pending_payment', label: 'Belum Bayar' },
  { id: 'processing', label: 'Diproses' },
  { id: 'shipped', label: 'Dalam Pengiriman' },
  { id: 'delivered', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending_payment':
      return {
        label: 'Menunggu Pembayaran',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'processing':
    case 'paid':
      return {
        label: 'Sedang Dipersiapkan',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'shipped':
      return {
        label: 'Dalam Pengiriman',
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'delivered':
      return {
        label: 'Pesanan Selesai',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        bg: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        dot: 'bg-neutral-400',
      };
    default:
      return {
        label: status.replace(/_/g, ' ').toUpperCase(),
        bg: 'bg-neutral-50 text-neutral-700 border-neutral-200',
        dot: 'bg-neutral-400',
      };
  }
}

const formatIDR = (n?: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

interface MyOrdersViewProps {
  onOrderCountChange?: (count: number) => void;
}

export function MyOrdersView({ onOrderCountChange }: MyOrdersViewProps) {
  const { getAccessToken } = useAuth();

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [activeStatus, setActiveStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async (status: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const token = await getAccessToken();
      const queryParam = status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`/api/user/orders${queryParam}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat daftar pesanan.');
      }

      const list = data.orders || [];
      setOrders(list);
      if (status === 'all') {
        onOrderCountChange?.(list.length);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat pesanan';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, onOrderCountChange]);

  useEffect(() => {
    fetchOrders(activeStatus);
  }, [activeStatus, fetchOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 border border-black/15 bg-white p-6 shadow-xs">
        <h2 className="font-sans text-base font-semibold tracking-wider text-black/85 uppercase">
          Riwayat Transaksi &amp; Pesanan
        </h2>
        <p className="text-xs text-black/70">
          Pantau status pemrosesan pesanan abaya &amp; khiban eksklusif Anda, nomor resi kurir Biteship, dan rincian transaksi.
        </p>

        {/* Status Filter Horizontal Tabs */}
        <div className="mt-3 -mx-2 flex items-center gap-1.5 overflow-x-auto px-2 pb-1 no-scrollbar sm:flex-wrap">
          {STATUS_FILTERS.map((tab) => {
            const isSelected = activeStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatus(tab.id)}
                className={`shrink-0 border px-3.5 py-1.5 text-xs tracking-wider uppercase transition-colors ${
                  isSelected
                    ? 'border-black bg-black font-semibold text-white'
                    : 'border-black/15 bg-white text-[#554C48] hover:border-black hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse border border-black/15 bg-white p-5 space-y-4">
              <div className="flex justify-between">
                <div className="h-4 w-40 bg-[rgba(0,0,0,0.12)]/70" />
                <div className="h-4 w-24 bg-[rgba(0,0,0,0.12)]/50" />
              </div>
              <div className="flex gap-4">
                <div className="h-16 w-16 bg-[rgba(0,0,0,0.12)]/50 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 w-48 bg-[rgba(0,0,0,0.12)]/60" />
                  <div className="h-3 w-28 bg-[rgba(0,0,0,0.12)]/40" />
                </div>
              </div>
              <div className="h-px bg-[rgba(0,0,0,0.12)]" />
              <div className="flex justify-between">
                <div className="h-4 w-28 bg-[rgba(0,0,0,0.12)]/60" />
                <div className="h-8 w-28 bg-[rgba(0,0,0,0.12)]/60" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="border border-red-200 bg-red-50 p-8 text-center text-xs text-red-700">
          <Icon name="error" size={28} className="mx-auto text-red-500 mb-2" />
          <p className="font-semibold">{errorMsg}</p>
          <button
            type="button"
            onClick={() => fetchOrders(activeStatus)}
            className="mt-4 inline-block border border-red-300 bg-white px-5 py-2 text-xs font-semibold tracking-wider uppercase text-red-700 hover:bg-red-100"
          >
            Coba Lagi
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-black/20 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center border border-black/15 bg-white text-black/50">
            <Icon name="shopping_bag" size={26} />
          </div>
          <h3 className="mt-4 font-sans text-sm font-semibold tracking-wider text-black/85 uppercase">
            Tidak Ada Pesanan Ditemukan
          </h3>
          <p className="mt-1 text-xs text-black/70 max-w-sm mx-auto">
            {activeStatus === 'all'
              ? 'Anda belum memiliki riwayat pembelian. Temukan koleksi abaya dan khiban eksklusif SEVAYA sekarang.'
              : `Tidak ada pesanan dengan status "${STATUS_FILTERS.find((f) => f.id === activeStatus)?.label}".`}
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 border border-black bg-black px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29]"
          >
            <Icon name="storefront" size={15} />
            <span>Mulai Belanja</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const badge = getStatusBadge(ord.status);
            const firstItem = ord.items?.[0];
            const extraItemCount = (ord.items?.length || 1) - 1;
            const dateStr = ord.created_at
              ? new Date(ord.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-';

            return (
              <div
                key={ord.id}
                className="border border-black/15 bg-white p-5 transition-shadow hover:shadow-md shadow-xs"
              >
                {/* Order Header */}
                <div className="flex flex-col gap-2 pb-3.5 border-b border-black/15 sm:flex-row sm:items-center sm:justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-black">
                      #{ord.order_number}
                    </span>
                    <span className="text-black/50">|</span>
                    <span className="text-black/70">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${badge.bg}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="py-4">
                  {firstItem ? (
                    <div className="flex items-center gap-4">
                      <div className="relative h-18 w-14 shrink-0 overflow-hidden bg-white border border-black/15">
                        {firstItem.image ? (
                          <Image
                            src={firstItem.image}
                            alt={firstItem.title || firstItem.name || 'Produk'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-black/50">
                            <Icon name="shopping_bag" size={18} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans text-xs font-semibold tracking-wider text-black/85 uppercase truncate">
                          {firstItem.title || firstItem.name || 'Koleksi Sevaya'}
                        </h4>
                        <p className="mt-0.5 text-[11px] text-black/70">
                          {[firstItem.color, firstItem.size]
                            .filter(Boolean)
                            .join(' / ') || 'Standar'}{' '}
                          &bull; {firstItem.quantity || 1} barang
                        </p>
                        {extraItemCount > 0 && (
                          <p className="mt-1 text-[11px] text-black/50">
                            +{extraItemCount} produk lainnya dalam pesanan ini
                          </p>
                        )}
                      </div>

                      {/* Courier & Waybill */}
                      {ord.courier_name && (
                        <div className="hidden sm:flex flex-col text-right text-xs">
                          <span className="text-[10px] tracking-wider text-black/50 uppercase">
                            Kurir
                          </span>
                          <span className="font-medium text-black">
                            {ord.courier_name}
                          </span>
                          {ord.tracking_number && (
                            <span className="font-mono text-[10px] text-emerald-700">
                              Resi: {ord.tracking_number}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-black/50">Informasi produk tidak tersedia</p>
                  )}
                </div>

                {/* Order Footer & Total */}
                <div className="flex flex-col gap-3 pt-3.5 border-t border-black/15 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[11px] text-black/50 tracking-wider uppercase block">
                      Total Pembayaran
                    </span>
                    <span className="font-sans text-base font-bold text-black">
                      {formatIDR(ord.grand_total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/profile/orders/${ord.order_number}#tracking`}
                      className="inline-flex items-center gap-1.5 border border-black bg-white px-3.5 py-2 text-xs font-semibold tracking-wider text-black uppercase transition hover:bg-white"
                    >
                      <Icon name="local_shipping" size={14} />
                      <span>Lacak Pesanan</span>
                    </Link>
                    <Link
                      href={`/profile/orders/${ord.order_number}`}
                      className="inline-flex items-center gap-1.5 border border-black bg-black px-4 py-2 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29]"
                    >
                      <span>Lihat Rincian</span>
                      <Icon name="arrow_forward" size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
