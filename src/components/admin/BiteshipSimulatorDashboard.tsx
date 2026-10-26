'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

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

// Biteship status → label & color
const BITESHIP_STATUSES = [
  { value: 'confirmed', label: 'Confirmed', emoji: '📋', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'allocated', label: 'Allocated', emoji: '🏢', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { value: 'picking_up', label: 'Picking Up', emoji: '🚶', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'picked', label: 'Picked', emoji: '📦', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'dropping_off', label: 'Dropping Off', emoji: '🚚', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'delivered', label: 'Delivered', emoji: '✅', color: 'text-green-700 bg-green-50 border-green-200' },
  { value: 'cancelled', label: 'Cancelled', emoji: '🚫', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'returned', label: 'Returned', emoji: '↩️', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { value: 'on_hold', label: 'On Hold', emoji: '⏸️', color: 'text-gray-500 bg-gray-50 border-gray-200' },
];

const INTERNAL_STATUSES = [
  { value: 'pending_payment', label: 'Belum Bayar', color: 'text-[#8A6335] bg-[#F4EFEB] border-[#E5DDD5]' },
  { value: 'paid', label: 'Sudah Bayar', color: 'text-[#141312] bg-[#FAF8F5] border-[#141312]/30' },
  { value: 'processing', label: 'Diproses', color: 'text-[#5B4A42] bg-[#F4EFEB] border-[#E5DDD5]' },
  { value: 'shipped', label: 'Di Perjalanan', color: 'text-[#874A2C] bg-[#F4EFEB] border-[#E5DDD5]' },
  { value: 'delivered', label: 'Sampai', color: 'text-[#2D5A3C] bg-[#F4EFEB] border-[#2D5A3C]/20' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'text-[#8C3A3A] bg-[#F4EFEB] border-[#8C3A3A]/20' },
];

const COURIERS = [
  { value: 'jne', label: 'JNE', services: ['reg', 'yes', 'oke'] },
  { value: 'sicepat', label: 'SiCepat', services: ['siunt', 'best', 'gokil'] },
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
  if (!found) return <span className="text-xs text-[#685E5A]">{status || '—'}</span>;

  const emoji = ('emoji' in found ? found.emoji : '') as string;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${found.color}`}
    >
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
}: {
  order: AdminOrder;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, extra?: Partial<AdminOrder>) => Promise<void>;
  onCreateBiteship: (order: AdminOrder, courier: string, service: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('jne');
  const [selectedService, setSelectedService] = useState('reg');
  const [trackingInput, setTrackingInput] = useState(order.tracking_number || '');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLogs((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p]);

  const courierServices =
    COURIERS.find((c) => c.value === selectedCourier)?.services || ['reg'];

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
      if (newStatus === 'shipped') {
        extraPayload.biteship_status = 'dropping_off';
      } else if (newStatus === 'delivered') {
        extraPayload.biteship_status = 'delivered';
      } else if (newStatus === 'processing') {
        extraPayload.biteship_status = 'picking_up';
      } else if (newStatus === 'cancelled') {
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

  const handleCreateBiteship = async () => {
    setLoading(true);
    addLog(`Membuat test order Biteship (${selectedCourier} ${selectedService})...`);
    try {
      await onCreateBiteship(order, selectedCourier, selectedService);
      addLog(`✅ Test order Biteship berhasil dibuat!`);
      addLog(`   Cek dashboard.biteship.com/orders untuk update status simulasi`);
    } catch (e) {
      addLog(`❌ Gagal: ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4 backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] rounded-t-2xl sm:rounded-2xl border border-[#E5DDD5] bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5DDD5] bg-[#FAF8F5] px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
          <div>
            <span className="font-headline text-[10px] font-bold tracking-widest text-[#8E8380] uppercase block">
              Rincian Transaksi
            </span>
            <h3 className="font-headline text-base sm:text-lg font-bold text-[#141312]">
              #{order.order_number}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#685E5A] mt-0.5">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} type="internal" />
            {order.biteship_status && (
              <span className="hidden xs:inline-flex">
                <StatusBadge status={order.biteship_status} type="biteship" />
              </span>
            )}
            <button
              onClick={onClose}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-[#685E5A] transition hover:bg-[#F4EFEB] hover:text-[#141312] active:scale-95"
              aria-label="Tutup Rincian"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 grid gap-5 sm:gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="flex flex-col gap-5">
            {/* Customer Info */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#685E5A]">
                Data Penerima
              </h4>
              <div className="rounded-xl border border-[#E5DDD5] bg-[#FAF8F5] p-3.5 sm:p-4 text-xs space-y-1.5">
                <p className="font-semibold text-sm text-[#141312]">{order.customer_name}</p>
                <p className="text-[#685E5A]">{order.customer_phone}</p>
                {order.customer_email && <p className="text-[#685E5A]">{order.customer_email}</p>}
                <p className="text-[#554C48] pt-1 border-t border-[#E5DDD5]/60">{order.customer_address}</p>
                {order.destination_area && (
                  <p className="text-[#8E8380] text-[11px]">{order.destination_area}</p>
                )}
              </div>
            </section>

            {/* Order Details Table */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#685E5A]">
                Detail Pesanan
              </h4>
              <div className="rounded-xl border border-[#E5DDD5] bg-[#FAF8F5] overflow-hidden">
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
                        <tr key={label} className="border-t border-[#E5DDD5]">
                          <td className="py-2.5 pl-4 pr-2 text-[#685E5A] font-medium w-1/3">{label}</td>
                          <td className="py-2.5 pr-4">
                            <StatusBadge status={order.status} type="internal" />
                          </td>
                        </tr>
                      ) : (
                        <tr key={label} className="border-t border-[#E5DDD5] first:border-t-0">
                          <td className="py-2.5 pl-4 pr-2 text-[#685E5A] font-medium w-1/3">{label}</td>
                          <td className="py-2.5 pr-4 font-semibold text-[#141312]">{value}</td>
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
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#685E5A]">
                  Produk
                </h4>
                <div className="rounded-xl border border-[#E5DDD5] bg-[#FAF8F5] p-3 space-y-2">
                  {parsedItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-[#E5DDD5]/50 last:border-0">
                      <div>
                        <p className="font-semibold text-[#141312]">{item.productTitle || item.name}</p>
                        <p className="text-[#685E5A]">{item.color} · ×{item.qty || 1}</p>
                      </div>
                      <span className="font-bold text-[#141312]">{formatIDR(item.price || 0)}</span>
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
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#685E5A]">
                Ubah Status Internal
              </h4>
              <div className="rounded-xl border border-[#E5DDD5] bg-[#FAF8F5] p-3.5 sm:p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#685E5A] font-medium uppercase tracking-wider">
                    Nomor Resi (opsional)
                  </label>
                  <input
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Masukkan nomor resi..."
                    className="w-full rounded-none border border-[#D0C5BD] bg-white px-3 py-2 text-base sm:text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none min-h-[42px] sm:min-h-[36px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {INTERNAL_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      disabled={loading || order.status === s.value}
                      onClick={() => handleInternalStatusChange(s.value)}
                      className={`min-h-[38px] rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition active:scale-95
                        ${order.status === s.value
                          ? s.color + ' opacity-100 ring-2 ring-[#141312]/30'
                          : 'border-[#D0C5BD] bg-white text-[#685E5A] hover:bg-[#F4EFEB] disabled:opacity-40'
                        }`}
                    >
                      {order.status === s.value ? '▶ ' : ''}{s.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Shipping Carrier / Biteship */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#685E5A]">
                Pengiriman Kurir (Biteship)
              </h4>
              <div className="rounded-xl border border-[#E5DDD5] bg-[#FAF8F5] p-3.5 sm:p-4 space-y-3">
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
                              handleInternalStatusChange(btn.internal);
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

                    <a
                      href="https://dashboard.biteship.com/orders"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 text-xs text-[#141312] underline hover:text-[#685E5A]"
                    >
                      Buka Biteship Dashboard →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-[#685E5A]">
                      Pilih kurir dan layanan untuk memproses resi pengiriman otomatis.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#685E5A] font-medium uppercase tracking-wider block mb-1">
                          Kurir
                        </label>
                        <select
                          value={selectedCourier}
                          onChange={(e) => {
                            setSelectedCourier(e.target.value);
                            const firstService = COURIERS.find(c => c.value === e.target.value)?.services[0] || 'reg';
                            setSelectedService(firstService);
                          }}
                          className="w-full rounded-none border border-[#D0C5BD] bg-white px-2.5 py-2 text-base sm:text-xs text-[#141312] focus:outline-none min-h-[42px] sm:min-h-[36px]"
                        >
                          {COURIERS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#685E5A] font-medium uppercase tracking-wider block mb-1">
                          Layanan
                        </label>
                        <select
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="w-full rounded-none border border-[#D0C5BD] bg-white px-2.5 py-2 text-base sm:text-xs text-[#141312] focus:outline-none min-h-[42px] sm:min-h-[36px]"
                        >
                          {courierServices.map((s) => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleCreateBiteship}
                      disabled={loading}
                      className="w-full min-h-[44px] rounded-full bg-[#141312] py-2.5 text-xs font-semibold text-[#FAF8F5] transition hover:bg-[#2b2826] active:scale-[0.99] disabled:opacity-40"
                    >
                      {loading ? 'Memproses...' : '📦 Atur Pengiriman Kurir'}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Logs */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#685E5A]">Log Aktivitas</h4>
                {logs.length > 0 && (
                  <button onClick={() => setLogs([])} className="text-[10px] text-[#685E5A] hover:text-[#141312] underline">
                    Bersihkan
                  </button>
                )}
              </div>
              <div className="rounded-xl border border-[#E5DDD5] bg-[#141312] p-3 max-h-36 overflow-y-auto font-mono text-[10px]">
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
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function BiteshipSimulatorDashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const scrollTable = (offset: number) => {
    tableContainerRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const scrollToLeftEdge = () => {
    tableContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const scrollToRightEdge = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ left: tableContainerRef.current.scrollWidth, behavior: 'smooth' });
    }
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const res = await fetch('/api/admin/orders');
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

  // Auto-polling: automatically syncs with Biteship API periodically
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

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
              status: 'processing',
              courier_name: `${courier.toUpperCase()} ${service.toUpperCase()}`,
              updated_at: new Date().toISOString(),
            }
          : prev,
      );
    }
  };

  // Stats
  const stats = {
    all: orders.length,
    pending_payment: orders.filter((o) => o.status === 'pending_payment').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    with_biteship: orders.filter((o) => !!o.biteship_order_id).length,
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'pending_payment')
    .reduce((s, o) => s + (o.grand_total || 0), 0);

  // Filter + search
  const filtered = orders.filter((o) => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch =
      !search ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search) ||
      o.biteship_order_id?.toLowerCase().includes(search.toLowerCase()) ||
      o.tracking_number?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const FILTER_TABS = [
    { key: 'all', label: `Semua (${stats.all})` },
    { key: 'pending_payment', label: `Belum Bayar (${stats.pending_payment})` },
    { key: 'processing', label: `Diproses (${stats.processing})` },
    { key: 'shipped', label: `Dikirim (${stats.shipped})` },
    { key: 'delivered', label: `Sampai (${stats.delivered})` },
    { key: 'cancelled', label: `Dibatalkan (${stats.cancelled})` },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <span className="font-headline text-[10px] font-bold tracking-widest text-[#8E8380] uppercase block">
            Transaksi &amp; Logistik
          </span>
          <h2 className="font-headline text-xl sm:text-2xl font-bold tracking-tight text-[#141312]">
            Pesanan &amp; Pengiriman
          </h2>
          <p className="text-xs text-[#685E5A] mt-0.5">
            Pantau transaksi pelanggan, status pengiriman kurir, dan nomor resi secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[11px] text-[#8E8380]">
              Update: {lastRefresh.toLocaleTimeString('id-ID')}
            </span>
          )}
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="rounded-full border border-[#D0C5BD] bg-white px-3.5 py-1.5 text-xs font-medium text-[#141312] transition hover:border-[#141312] hover:bg-[#F4EFEB] active:scale-95 disabled:opacity-40"
          >
            {refreshing ? '↻ Memuat...' : '↻ Segarkan'}
          </button>
        </div>
      </div>

      {/* Unified KPI Summary Card */}
      <div className="rounded-2xl border border-[#E5DDD5] bg-white p-5 sm:p-7 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-[#E5DDD5]/70 pb-4">
          <div>
            <span className="font-headline text-[10px] font-bold tracking-widest text-[#8E8380] uppercase block">
              Total Pendapatan Terkonfirmasi
            </span>
            <p className="font-headline text-2xl sm:text-3xl font-bold text-[#141312] mt-1">
              {formatIDR(totalRevenue)}
            </p>
          </div>
          <p className="text-xs text-[#685E5A]">
            Akumulasi transaksi aktif &amp; berhasil diproses
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Order', value: stats.all, color: 'text-[#141312]' },
            { label: 'Belum Bayar', value: stats.pending_payment, color: 'text-[#8A6335]' },
            { label: 'Diproses', value: stats.processing, color: 'text-[#5B4A42]' },
            { label: 'Dikirim', value: stats.shipped, color: 'text-[#874A2C]' },
            { label: 'Sampai', value: stats.delivered, color: 'text-[#2D5A3C]' },
            { label: 'Biteship Aktif', value: stats.with_biteship, color: 'text-blue-600' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1 rounded-xl bg-[#F4EFEB] p-3 border border-[#E5DDD5]/50"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#685E5A]">
                {s.label}
              </span>
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, no. order, resi, Biteship ID..."
          className="w-full rounded-none border border-[#D0C5BD] bg-white px-4 py-2.5 text-base sm:text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none min-h-[44px] sm:min-h-[38px]"
        />
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1.5 pt-0.5 touch-pan-x">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`shrink-0 min-h-[38px] flex items-center rounded-full border px-4 py-1.5 text-xs font-medium transition active:scale-95 ${
                filter === tab.key
                  ? 'border-[#141312] bg-[#141312] text-[#FAF8F5]'
                  : 'border-[#D0C5BD] bg-white text-[#685E5A] hover:border-[#141312] hover:bg-[#F4EFEB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Biteship info banner when no orders */}
      {!loading && orders.length === 0 && !error && (
        <div className="rounded-2xl border border-[#E5DDD5] bg-white p-8 text-center space-y-2">
          <p className="text-2xl">📦</p>
          <p className="font-semibold text-sm text-[#141312]">Belum ada data pesanan</p>
          <p className="text-xs text-[#685E5A]">
            Pesanan baru pelanggan dari toko akan otomatis tersinkronisasi dan tampil di sini.
          </p>
          <a
            href="/test-shipping"
            className="mt-2 inline-block text-xs font-medium text-[#141312] underline hover:text-[#685E5A]"
          >
            Buka form simulasi sandbox &rarr;
          </a>
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-[#E5DDD5] bg-white">
          <div className="text-xs text-[#685E5A]">Memuat data pesanan dari Supabase...</div>
        </div>
      ) : (
        filtered.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Table Scroll Bar & Controls */}
            <div className="hidden md:flex items-center justify-between rounded-xl border border-[#E5DDD5] bg-[#F4EFEB] px-4 py-2 text-xs">
              <div className="flex items-center gap-2 text-[#685E5A]">
                <span className="font-bold text-[#141312]">{filtered.length} Pesanan</span>
                <span>&bull;</span>
                <span className="text-[11px] text-[#7C726E]">
                  Gunakan tombol geser di kanan untuk melihat kolom secara penuh
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={scrollToLeftEdge}
                  className="rounded-full border border-[#D0C5BD] bg-white px-3 py-1 text-[11px] font-medium text-[#141312] transition hover:bg-[#F4EFEB]"
                >
                  ⏮ Paling Kiri
                </button>
                <button
                  type="button"
                  onClick={() => scrollTable(-320)}
                  className="rounded-full border border-[#D0C5BD] bg-white px-3 py-1 text-[11px] font-medium text-[#141312] transition hover:bg-[#F4EFEB]"
                >
                  &larr; Geser Kiri
                </button>
                <button
                  type="button"
                  onClick={() => scrollTable(320)}
                  className="rounded-full border border-[#D0C5BD] bg-white px-3 py-1 text-[11px] font-medium text-[#141312] transition hover:bg-[#F4EFEB]"
                >
                  Geser Kanan &rarr;
                </button>
                <button
                  type="button"
                  onClick={scrollToRightEdge}
                  className="rounded-full bg-[#141312] px-3.5 py-1 text-[11px] font-medium text-[#FAF8F5] transition hover:bg-[#2b2826]"
                >
                  Kolom Aksi ⏭
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div
              ref={tableContainerRef}
              className="hidden md:block overflow-x-auto rounded-2xl border border-[#E5DDD5] bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)] scroll-smooth"
            >
              <table className="w-full text-xs min-w-[1050px]">
                <thead>
                  <tr className="border-b border-[#E5DDD5] bg-[#F4EFEB]">
                    {[
                      'Order ID / Ref',
                      'Pelanggan',
                      'Wilayah Tujuan',
                      'Total Item',
                      'Total Ongkir',
                      'Kurir / Resi',
                      'Status',
                      'Biteship',
                      'Dibuat',
                    ].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-3 text-left font-headline text-[10px] font-bold uppercase tracking-wider text-[#685E5A]"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="sticky right-0 z-20 whitespace-nowrap bg-[#F4EFEB] px-4 py-3 text-left font-headline text-[10px] font-bold uppercase tracking-wider text-[#685E5A] shadow-[-6px_0_10px_rgba(0,0,0,0.03)]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DDD5]/60">
                  {filtered.map((o) => {
                    let parsedItems: { qty?: number }[] = [];
                    try { parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []; } catch { /* */ }
                    const totalItems = parsedItems.reduce((s, i) => s + (i.qty || 1), 0);

                    return (
                      <tr
                        key={o.id}
                        className="group bg-white transition hover:bg-[#FAF8F5]"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[#141312]">#{o.order_number}</p>
                          <p className="font-mono text-[10px] text-[#8E8380]">{o.id?.slice(0, 8)}...</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-[#141312]">{o.customer_name}</p>
                          <p className="text-[#685E5A]">{o.customer_phone}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[#141312]">{o.destination_area || '—'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-[#141312]">
                          {totalItems}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#141312]">
                          {formatIDR(o.shipping_cost || 0)}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[#141312]">{o.courier_name || '—'}</p>
                          {o.tracking_number && (
                            <p className="font-mono text-[10px] text-emerald-800 font-semibold">{o.tracking_number}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={o.status} type="internal" />
                        </td>
                        <td className="px-4 py-3.5">
                          {o.biteship_status ? (
                            <StatusBadge status={o.biteship_status} type="biteship" />
                          ) : (
                            <span className="text-[#8E8380]">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-[#685E5A]">
                          {formatDate(o.created_at)}
                        </td>
                        <td className="sticky right-0 z-10 whitespace-nowrap bg-white group-hover:bg-[#FAF8F5] px-4 py-3.5 shadow-[-6px_0_10px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="rounded-full border border-[#D0C5BD] bg-white px-3 py-1 text-xs font-medium text-[#141312] transition hover:border-[#141312] hover:bg-[#F4EFEB]"
                            >
                              Kelola
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
            <div className="space-y-3 md:hidden">
              {filtered.map((o) => {
                let parsedItems: { qty?: number }[] = [];
                try { parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []; } catch { /* */ }
                const totalItems = parsedItems.reduce((s, i) => s + (i.qty || 1), 0);

                return (
                  <div
                    key={o.id}
                    className="rounded-2xl border border-[#E5DDD5] bg-white p-4 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3"
                  >
                    {/* Top: Order number, date, badges */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#E5DDD5]/70 pb-2.5">
                      <div>
                        <p className="font-bold text-sm text-[#141312]">#{o.order_number}</p>
                        <p className="text-[10px] text-[#8E8380]">{formatDate(o.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={o.status} type="internal" />
                        {o.biteship_status && (
                          <StatusBadge status={o.biteship_status} type="biteship" />
                        )}
                      </div>
                    </div>

                    {/* Customer & Destination */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-[#8E8380] uppercase tracking-wider">Pelanggan</span>
                        <p className="font-semibold text-[#141312] truncate">{o.customer_name}</p>
                        <p className="text-[11px] text-[#685E5A]">{o.customer_phone}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#8E8380] uppercase tracking-wider">Tujuan</span>
                        <p className="text-[#141312] text-[11px] line-clamp-2">{o.destination_area || o.customer_address || '—'}</p>
                      </div>
                    </div>

                    {/* Courier & Shipping Cost */}
                    <div className="flex items-center justify-between rounded-xl bg-[#F4EFEB] px-3 py-2 text-xs">
                      <div>
                        <p className="font-semibold text-[#141312]">{o.courier_name || 'Kurir Reguler'}</p>
                        {o.tracking_number ? (
                          <p className="font-mono text-[10px] text-emerald-800 font-semibold">Resi: {o.tracking_number}</p>
                        ) : (
                          <p className="text-[10px] text-[#8E8380]">Belum ada resi</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#8E8380]">{totalItems} Item</p>
                        <p className="font-bold text-[#141312]">{formatIDR(o.shipping_cost || 0)}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[#E5DDD5]/50">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="flex-1 min-h-[44px] flex items-center justify-center rounded-full bg-[#141312] py-2.5 text-center text-xs font-semibold text-[#FAF8F5] transition hover:bg-[#2b2826] active:scale-[0.99]"
                      >
                        Kelola Pesanan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(o.id, o.order_number)}
                        title="Hapus Pesanan"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-xs text-red-600 transition hover:bg-red-100 active:scale-95"
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
        />
      )}
    </div>
  );
}
