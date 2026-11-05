'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ProductVariant,
  StockMutation,
  MutationType,
  generateDefaultVariantsForProduct,
} from '@/integrations/supabase';
import { DbProduct } from '@/integrations/supabase/products';
import StockMutationModal from '@/components/admin/modals/StockMutationModal';

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
  ready: { label: 'Ready', className: 'bg-emerald-100 text-emerald-700' },
  low: { label: 'Menipis', className: 'bg-amber-100 text-amber-700' },
  out: { label: 'Habis', className: 'bg-red-100 text-red-700' },
};

const MUTATION_TYPE_LABEL: Record<MutationType, { label: string; icon: string; color: string }> = {
  in: { label: 'Masuk', icon: 'arrow_downward', color: 'text-emerald-600' },
  out: { label: 'Keluar', icon: 'arrow_upward', color: 'text-red-500' },
  adjustment: { label: 'Sesuaikan', icon: 'swap_vert', color: 'text-amber-500' },
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

  // Generating state
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

  // Variasi filter options
  const availableSizes = ['all', ...Array.from(new Set(variants.map((v) => v.size))).sort()];
  const availableColors = ['all', ...Array.from(new Set(variants.map((v) => v.colorName))).sort()];

  // Filter variants
  const filteredVariants = variants.filter((v) => {
    const q = searchQuery.toLowerCase();
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

  // Generate varian untuk produk yang belum ada varian di inventaris
  const handleGenerateVariants = async () => {
    setGenerating(true);
    try {
      const existingProductIds = new Set(variants.map((v) => v.productId));
      const missingProducts = products.filter((p) => !existingProductIds.has(String(p.id)));

      if (missingProducts.length === 0) {
        alert('Semua produk sudah memiliki varian di inventaris.');
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
    fetchInventory(true); // Refresh untuk sync mutasi terbaru
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3 text-black/30">
        <span className="material-symbols-outlined text-4xl animate-pulse">inventory_2</span>
        <p className="text-sm">Memuat inventaris stok...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-black">Inventaris & Stok Varian</h2>
          <p className="text-xs text-black/40 mt-0.5">
            Kelola stok masuk, keluar & penyesuaian per warna & ukuran. SKU unik tiap varian.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInventory(true)}
            className="flex items-center gap-1.5 text-xs border border-black/15 rounded-lg px-3 py-2 text-black/50 hover:border-black/30 hover:text-black transition-all"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh
          </button>
          <button
            onClick={handleGenerateVariants}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs bg-black text-white rounded-lg px-3 py-2 hover:bg-black/80 disabled:opacity-50 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            {generating ? 'Generating...' : 'Generate Varian Baru'}
          </button>
        </div>
      </div>

      {/* Telemetry Bar */}
      {telemetry && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Unit Fisik', value: telemetry.totalPhysicalUnits, icon: 'deployed_code', color: 'text-black' },
            { label: 'Varian Ready', value: telemetry.readyVariantsCount, icon: 'check_circle', color: 'text-emerald-600' },
            { label: 'Varian Menipis', value: telemetry.lowStockVariantsCount, icon: 'warning', color: 'text-amber-500' },
            { label: 'Varian Habis', value: telemetry.outOfStockVariantsCount, icon: 'cancel', color: 'text-red-500' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white border border-black/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
              <div>
                <p className="text-xl font-semibold text-black tabular-nums">{value}</p>
                <p className="text-xs text-black/40">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-1 bg-black/[0.04] p-1 rounded-lg w-fit">
        {(['variants', 'mutations'] as ActiveView[]).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`text-xs px-4 py-1.5 rounded-md font-medium transition-all ${
              activeView === v ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black'
            }`}
          >
            {v === 'variants' ? 'Daftar Varian' : 'Riwayat Mutasi'}
          </button>
        ))}
      </div>

      {/* ─── VARIANTS VIEW ─── */}
      {activeView === 'variants' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk, SKU, warna..."
              className="border border-black/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black/40 w-56"
            />
            {/* Stock filter */}
            <div className="flex gap-1">
              {(['all', 'ready', 'low', 'out'] as StockFilter[]).map((f) => {
                const labels = { all: 'Semua', ready: 'Ready', low: 'Menipis', out: 'Habis' };
                const active = stockFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setStockFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      active ? 'bg-black text-white border-black' : 'border-black/15 text-black/50 hover:border-black/30'
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
            {/* Size filter */}
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="border border-black/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black/40 bg-white"
            >
              {availableSizes.map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'Semua Size' : `Size ${s}`}</option>
              ))}
            </select>
            {/* Color filter */}
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="border border-black/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black/40 bg-white"
            >
              {availableColors.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'Semua Warna' : c}</option>
              ))}
            </select>
          </div>

          {/* Tabel Varian */}
          <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <th className="text-left px-4 py-3 text-black/40 font-medium uppercase tracking-wider">SKU</th>
                    <th className="text-left px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Produk</th>
                    <th className="text-left px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Warna</th>
                    <th className="text-center px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Size</th>
                    <th className="text-center px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Stok</th>
                    <th className="text-center px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {filteredVariants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-black/30">
                        <span className="material-symbols-outlined text-3xl block mb-2">search_off</span>
                        Tidak ada varian yang cocok dengan filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredVariants.map((variant) => {
                      const status = getStockStatus(variant);
                      const badge = STATUS_BADGE[status] ?? { label: status, className: 'bg-black/10 text-black/60' };
                      return (
                        <tr key={variant.id} className="hover:bg-black/[0.015] transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono text-black/50">{variant.sku}</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-black max-w-[160px] truncate">
                            {variant.productTitle}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                                style={{ background: variant.colorHex }}
                              />
                              <span className="text-black/70">{variant.colorName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block bg-black/[0.06] text-black/70 font-medium rounded px-2 py-0.5">
                              {variant.size}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-base font-semibold text-black tabular-nums">{variant.stock}</span>
                            <span className="text-black/30 ml-0.5">pcs</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setMutationTarget({ variant, type: 'in' })}
                                title="Stok Masuk"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">add</span>
                              </button>
                              <button
                                onClick={() => setMutationTarget({ variant, type: 'out' })}
                                title="Stok Keluar"
                                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">remove</span>
                              </button>
                              <button
                                onClick={() => setMutationTarget({ variant, type: 'adjustment' })}
                                title="Penyesuaian Stok"
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">tune</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredVariants.length > 0 && (
              <div className="px-4 py-2.5 border-t border-black/[0.06] text-xs text-black/30">
                Menampilkan {filteredVariants.length} dari {variants.length} varian
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MUTATIONS HISTORY VIEW ─── */}
      {activeView === 'mutations' && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
          {mutations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-black/30 gap-2">
              <span className="material-symbols-outlined text-4xl">history</span>
              <p className="text-sm">Belum ada riwayat mutasi stok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <th className="text-left px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Waktu</th>
                    <th className="text-left px-4 py-3 text-black/40 font-medium uppercase tracking-wider">SKU</th>
                    <th className="text-left px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Produk</th>
                    <th className="text-center px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Tipe</th>
                    <th className="text-center px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Jumlah</th>
                    <th className="text-center px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Stok</th>
                    <th className="text-left px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Alasan</th>
                    <th className="text-left px-4 py-3 text-black/40 font-medium uppercase tracking-wider">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {mutations.map((m) => {
                    const typeInfo = MUTATION_TYPE_LABEL[m.type];
                    return (
                      <tr key={m.id} className="hover:bg-black/[0.015] transition-colors">
                        <td className="px-4 py-3 text-black/40 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                        <td className="px-4 py-3 font-mono text-black/50">{m.sku}</td>
                        <td className="px-4 py-3 text-black/70 max-w-[140px] truncate">
                          {m.productTitle} · {m.colorName} {m.size}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 font-medium ${typeInfo.color}`}>
                            <span className="material-symbols-outlined text-xs">{typeInfo.icon}</span>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold tabular-nums text-black">
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td className="px-4 py-3 text-center text-black/50 tabular-nums whitespace-nowrap">
                          {m.previousStock} → {m.currentStock}
                        </td>
                        <td className="px-4 py-3 text-black/50">{m.reason.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-black/30 font-mono">{m.reference || '—'}</td>
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
