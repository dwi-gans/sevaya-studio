'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ProductVariant,
  StockMutation,
  MutationType,
  generateDefaultVariantsForProduct,
} from '@/integrations/supabase';
import { DbProduct } from '@/integrations/supabase/products';
import { Icon } from '@/components/ui/Icon';
import StockMutationModal, { REASON_LABELS } from '@/components/admin/modals/StockMutationModal';

interface InventoryTelemetry {
  totalVariants: number;
  totalPhysicalUnits: number;
  readyVariantsCount: number;
  lowStockVariantsCount: number;
  outOfStockVariantsCount: number;
}

interface InventoryTabProps {
  products: DbProduct[];
}

type StockFilter = 'all' | 'ready' | 'low' | 'out';
type ActiveView = 'variants' | 'mutations';

function getStockStatus(variant: ProductVariant): 'ready' | 'low' | 'out' {
  if (variant.stock <= 0) return 'out';
  if (variant.stock <= (variant.lowStockThreshold ?? 3)) return 'low';
  return 'ready';
}

const STATUS_BADGE: Record<'ready' | 'low' | 'out', { label: string; className: string }> = {
  ready: {
    label: 'Ready Stok',
    className: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
  },
  low: {
    label: 'Stok Menipis',
    className: 'bg-amber-50 text-amber-800 border border-amber-200/70',
  },
  out: {
    label: 'Habis',
    className: 'bg-rose-50 text-rose-800 border border-rose-200/70',
  },
};

const MUTATION_TYPE_INFO: Record<MutationType, { label: string; className: string; sign: string }> = {
  in: {
    label: 'Masuk',
    className: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
    sign: '+',
  },
  out: {
    label: 'Keluar',
    className: 'bg-rose-50 text-rose-800 border border-rose-200/70',
    sign: '−',
  },
  adjustment: {
    label: 'Penyesuaian',
    className: 'bg-amber-50 text-amber-800 border border-amber-200/70',
    sign: '⇄',
  },
};

export default function InventoryTab({ products }: InventoryTabProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [telemetry, setTelemetry] = useState<InventoryTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('variants');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');

  // Modal state
  const [mutationTarget, setMutationTarget] = useState<{
    variant: ProductVariant;
    type: MutationType;
  } | null>(null);

  // Syncing state
  const [generating, setGenerating] = useState(false);

  const fetchInventory = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (json.success) {
        setVariants(json.variants ?? []);
        setMutations(json.mutations ?? []);
        setTelemetry(json.telemetry ?? null);
      }
    } catch (err) {
      console.error('[InventoryTab] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Available options
  const availableSizes = useMemo(
    () => ['all', ...Array.from(new Set(variants.map((v) => v.size))).sort()],
    [variants]
  );
  const availableColors = useMemo(
    () => ['all', ...Array.from(new Set(variants.map((v) => v.colorName))).sort()],
    [variants]
  );

  // Filtered variants
  const filteredVariants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return variants.filter((v) => {
      const matchSearch =
        !q ||
        v.productTitle.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.colorName.toLowerCase().includes(q);
      const matchStock =
        stockFilter === 'all' ||
        (stockFilter === 'ready' && getStockStatus(v) === 'ready') ||
        (stockFilter === 'low' && getStockStatus(v) === 'low') ||
        (stockFilter === 'out' && getStockStatus(v) === 'out');
      const matchSize = sizeFilter === 'all' || v.size === sizeFilter;
      const matchColor = colorFilter === 'all' || v.colorName === colorFilter;
      return matchSearch && matchStock && matchSize && matchColor;
    });
  }, [variants, searchQuery, stockFilter, sizeFilter, colorFilter]);

  // Sync / Generate variants for products missing them
  const handleGenerateVariants = async () => {
    setGenerating(true);
    try {
      const existingProductIds = new Set(variants.map((v) => v.productId));
      const missingProducts = products.filter((p) => !existingProductIds.has(String(p.id)));

      if (missingProducts.length === 0) {
        alert('Semua produk di katalog sudah terdaftar di sistem inventaris stok.');
        return;
      }

      const newVariants: ProductVariant[] = [];
      for (const p of missingProducts) {
        newVariants.push(...generateDefaultVariantsForProduct(p));
      }

      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants: [...variants, ...newVariants] }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchInventory(true);
      }
    } catch (err) {
      console.error('[GenerateVariants]', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleMutationSuccess = (updatedVariant: ProductVariant) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === updatedVariant.id ? updatedVariant : v))
    );
    fetchInventory(true);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 sm:space-y-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-1 sm:pb-2">
        <div className="min-w-0">
          <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
            Transaksi &amp; Logistik
          </span>
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-black truncate">
            Inventaris &amp; Stok Varian
          </h2>
          <p className="text-[11px] text-black/50 mt-0 hidden sm:block">
            Kelola stok masuk, stok keluar, dan penyesuaian opname per warna &amp; ukuran dengan SKU unik.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchInventory(true)}
            disabled={loading}
            className="shrink-0 inline-flex items-center justify-center gap-1 rounded-full border border-black/20 bg-white px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold text-black transition hover:bg-black/5 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Segarkan data inventaris"
          >
            <Icon name="refresh" size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
          <button
            type="button"
            onClick={handleGenerateVariants}
            disabled={generating}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold text-white transition hover:bg-black/85 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Sinkronkan varian produk dari katalog"
          >
            <Icon name="add" size={13} />
            <span>{generating ? 'Sinkronisasi...' : 'Sinkronkan Varian'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Card */}
      <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(0,0,0,0.12)]/50 gap-0">
          <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4 py-1.5 md:py-0">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
              Total Unit Fisik
            </span>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold text-black tabular-nums">
                {telemetry?.totalPhysicalUnits ?? 0}
              </span>
              <span className="text-[10px] text-black/60">pcs</span>
            </div>
            <span className="hidden sm:block text-[11px] text-black/50">
              Di {variants.length} varian aktif
            </span>
          </div>

          <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4 py-1.5 md:py-0">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
              Stok Aman
            </span>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold text-emerald-800 tabular-nums">
                {telemetry?.readyVariantsCount ?? 0}
              </span>
              <span className="text-[10px] text-black/60">varian</span>
            </div>
            <span className="hidden sm:block text-[11px] text-black/50">
              Siap kirim ke pembeli
            </span>
          </div>

          <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4 py-1.5 md:py-0">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
              Stok Menipis
            </span>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold text-amber-700 tabular-nums">
                {telemetry?.lowStockVariantsCount ?? 0}
              </span>
              <span className="text-[10px] text-black/60">varian</span>
            </div>
            <span className="hidden sm:block text-[11px] text-black/50">
              Perlu restock segera
            </span>
          </div>

          <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4 py-1.5 md:py-0">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
              Stok Habis
            </span>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold text-rose-700 tabular-nums">
                {telemetry?.outOfStockVariantsCount ?? 0}
              </span>
              <span className="text-[10px] text-black/60">varian</span>
            </div>
            <span className="hidden sm:block text-[11px] text-black/50">
              Perlu produksi baru
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl sm:rounded-2xl border border-black/15 bg-white p-2.5 sm:p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
          {/* View Mode Pills */}
          <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full w-fit shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('variants')}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition active:scale-95 ${
                activeView === 'variants'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              Daftar Varian ({variants.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView('mutations')}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition active:scale-95 ${
                activeView === 'mutations'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              Riwayat Mutasi ({mutations.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk, SKU, warna..."
              className="w-full h-8 sm:h-9 rounded-lg border border-black/20 bg-white pr-3 pl-8 py-1 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none transition-colors"
            />
            <Icon
              name="search"
              size={14}
              className="pointer-events-none absolute top-2 sm:top-2.5 left-2.5 text-black/50"
            />
          </div>
        </div>

        {/* Sub-Filters (Variants View Only) */}
        {activeView === 'variants' && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Stock status pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {(['all', 'ready', 'low', 'out'] as StockFilter[]).map((f) => {
                const labels = {
                  all: 'Semua Stok',
                  ready: 'Ready',
                  low: 'Menipis',
                  out: 'Habis',
                };
                const active = stockFilter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStockFilter(f)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 shrink-0 ${
                      active
                        ? 'bg-black text-white shadow-xs'
                        : 'border border-black/15 bg-white text-black/70 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>

            {/* Size Dropdown */}
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="h-7 sm:h-8 rounded-lg border border-black/20 bg-white px-2.5 text-[11px] font-medium text-black/80 focus:border-black focus:outline-none transition-colors"
            >
              {availableSizes.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'Semua Ukuran' : `Size ${s}`}
                </option>
              ))}
            </select>

            {/* Color Dropdown */}
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="h-7 sm:h-8 rounded-lg border border-black/20 bg-white px-2.5 text-[11px] font-medium text-black/80 focus:border-black focus:outline-none transition-colors"
            >
              {availableColors.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'Semua Warna' : c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading State matching CatalogTab */}
      {loading && variants.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2.5 rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
          <Icon name="refresh" size={24} className="animate-spin text-black/40" />
          <span className="text-xs font-semibold tracking-wider text-black/60 uppercase">
            Memuat data stok &amp; inventaris...
          </span>
        </div>
      ) : activeView === 'variants' ? (
        /* ─── VARIANTS TABLE ─── */
        <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)] overflow-hidden">
          {filteredVariants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Icon name="search_off" size={32} className="text-black/40 mb-2" />
              <p className="text-xs font-bold text-black">Tidak ada varian yang sesuai kriteria</p>
              <p className="text-[11px] text-black/50 mt-0.5">
                Coba sesuaikan kata kunci pencarian atau filter status stok.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50">
                      SKU Unik
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50">
                      Produk
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50">
                      Warna
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center">
                      Ukuran
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center">
                      Stok Fisik
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center">
                      Status
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-right">
                      Aksi Cepat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {filteredVariants.map((variant) => {
                    const status = getStockStatus(variant);
                    const badge = STATUS_BADGE[status];
                    return (
                      <tr key={variant.id} className="hover:bg-black/[0.015] transition-colors">
                        {/* SKU */}
                        <td className="py-2.5 px-3 sm:px-4 font-mono text-[11px] text-black/60 font-medium">
                          {variant.sku}
                        </td>

                        {/* Title */}
                        <td className="py-2.5 px-3 sm:px-4 font-semibold text-black max-w-[180px] truncate">
                          {variant.productTitle}
                        </td>

                        {/* Color */}
                        <td className="py-2.5 px-3 sm:px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-3 w-3 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: variant.colorHex }}
                            />
                            <span className="text-black/80 font-medium text-[11px] truncate">
                              {variant.colorName}
                            </span>
                          </div>
                        </td>

                        {/* Size */}
                        <td className="py-2.5 px-3 sm:px-4 text-center">
                          <span className="inline-block rounded-md bg-black/5 px-2 py-0.5 font-bold text-black/80 text-[10px]">
                            {variant.size}
                          </span>
                        </td>

                        {/* Stock Quantity */}
                        <td className="py-2.5 px-3 sm:px-4 text-center">
                          <span className="text-sm font-bold text-black tabular-nums">
                            {variant.stock}
                          </span>
                          <span className="text-[10px] text-black/50 ml-0.5">pcs</span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-3 sm:px-4 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Action Buttons with clear Indonesian labels */}
                        <td className="py-2.5 px-3 sm:px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setMutationTarget({ variant, type: 'in' })}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
                              title="Tambah Stok Masuk"
                            >
                              <Icon name="add" size={11} />
                              <span>Masuk</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMutationTarget({ variant, type: 'out' })}
                              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-800 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                              title="Catat Stok Keluar"
                            >
                              <Icon name="remove" size={11} />
                              <span>Keluar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMutationTarget({ variant, type: 'adjustment' })}
                              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-100 transition active:scale-95 cursor-pointer"
                              title="Penyesuaian Opname"
                            >
                              <Icon name="tune" size={11} />
                              <span>Atur</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredVariants.length > 0 && (
            <div className="border-t border-black/10 bg-black/[0.01] px-4 py-2 text-[10px] text-black/50">
              Menampilkan {filteredVariants.length} dari {variants.length} total varian stok
            </div>
          )}
        </div>
      ) : (
        /* ─── MUTATIONS HISTORY TABLE ─── */
        <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)] overflow-hidden">
          {mutations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Icon name="receipt_long" size={32} className="text-black/40 mb-2" />
              <p className="text-xs font-bold text-black">Belum ada riwayat mutasi stok</p>
              <p className="text-[11px] text-black/50 mt-0.5">
                Setiap mutasi stok masuk, keluar, atau opname akan tercatat otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50">
                      Waktu
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50">
                      SKU
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50">
                      Varian Busana
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center">
                      Jenis
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center">
                      Jumlah
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center">
                      Perubahan Stok
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50">
                      Alasan
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50">
                      No. Ref
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {mutations.map((m) => {
                    const typeInfo = MUTATION_TYPE_INFO[m.type];
                    const friendlyReason = REASON_LABELS[m.reason] || 'Lainnya';
                    return (
                      <tr key={m.id} className="hover:bg-black/[0.015] transition-colors">
                        <td className="py-2.5 px-3 sm:px-4 text-[11px] text-black/50 whitespace-nowrap">
                          {formatDate(m.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 font-mono text-[11px] text-black/60 font-medium whitespace-nowrap">
                          {m.sku}
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 font-semibold text-black max-w-[160px] truncate">
                          {m.productTitle} · {m.colorName} ({m.size})
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${typeInfo.className}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-center font-bold tabular-nums text-black">
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-center text-[11px] font-medium text-black/60 tabular-nums whitespace-nowrap">
                          {m.previousStock} → <strong className="text-black">{m.currentStock}</strong> pcs
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-black/70 text-[11px]">
                          {friendlyReason}
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 font-mono text-[10px] text-black/50">
                          {m.reference || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Mutasi */}
      {mutationTarget && (
        <StockMutationModal
          variant={mutationTarget.variant}
          defaultType={mutationTarget.type}
          onClose={() => setMutationTarget(null)}
          onSuccess={handleMutationSuccess}
        />
      )}
    </div>
  );
}
