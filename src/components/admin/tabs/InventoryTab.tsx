'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  ProductVariant,
  StockMutation,
  MutationType,
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
  onStockMutated?: (productId: string, totalStock: number) => void;
}

type StockFilter = 'all' | 'ready' | 'low' | 'out';
type SortOption = 'stock-desc' | 'stock-asc' | 'title-asc' | 'latest';
type ActiveView = 'grouped' | 'flat' | 'mutations';

function getStockStatus(stock: number, lowThreshold = 3): 'ready' | 'low' | 'out' {
  if (stock <= 0) return 'out';
  if (stock <= lowThreshold) return 'low';
  return 'ready';
}

const STATUS_BADGE: Record<'ready' | 'low' | 'out', { label: string; className: string }> = {
  ready: {
    label: 'Tersedia',
    className: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
  },
  low: {
    label: 'Perlu Restock',
    className: 'bg-amber-50 text-amber-800 border border-amber-200/70',
  },
  out: {
    label: 'Habis',
    className: 'bg-rose-50 text-rose-800 border border-rose-200/70',
  },
};

const MUTATION_TYPE_INFO: Record<MutationType, { label: string; className: string }> = {
  in: {
    label: 'Masuk',
    className: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
  },
  out: {
    label: 'Keluar',
    className: 'bg-rose-50 text-rose-800 border border-rose-200/70',
  },
  adjustment: {
    label: 'Penyesuaian',
    className: 'bg-amber-50 text-amber-800 border border-amber-200/70',
  },
};

export default function InventoryTab({ products, onStockMutated }: InventoryTabProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [telemetry, setTelemetry] = useState<InventoryTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('grouped');

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('stock-desc');

  // Expanded product cards in grouped view (all expanded by default for quick glance)
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [mutationTarget, setMutationTarget] = useState<{
    variant: ProductVariant;
    availableVariants?: ProductVariant[];
    type: MutationType;
  } | null>(null);

  // Sync state
  const [generating, setGenerating] = useState(false);

  const fetchInventory = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory${refresh ? '?refresh=true' : ''}`, {
        headers: {
          'x-admin-key': 'sevaya-admin',
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) {
        console.warn(`[InventoryTab] Server returned status ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success) {
        const fetchedVariants: ProductVariant[] = json.variants ?? [];
        setVariants(fetchedVariants);
        setMutations(json.mutations ?? []);
        setTelemetry(json.telemetry ?? null);

        // Auto-expand all product cards on first load
        const initExpanded: Record<string, boolean> = {};
        fetchedVariants.forEach((v) => {
          initExpanded[v.productId] = true;
        });
        setExpandedProductIds((prev) => (Object.keys(prev).length === 0 ? initExpanded : prev));
      }
    } catch (err) {
      console.warn('[InventoryTab] fetch warning:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Options
  const availableSizes = useMemo(
    () => ['all', ...Array.from(new Set(variants.map((v) => v.size))).sort()],
    [variants]
  );
  const availableColors = useMemo(
    () => ['all', ...Array.from(new Set(variants.map((v) => v.colorName))).sort()],
    [variants]
  );

  // Filtered variants (for flat list & telemetry)
  const filteredVariants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return variants.filter((v) => {
      const matchSearch =
        !q ||
        v.productTitle.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.colorName.toLowerCase().includes(q);
      const status = getStockStatus(v.stock, v.lowStockThreshold ?? 3);
      // 'ready' includes stock > 0 (even low stock is ready to buy)
      const matchStock =
        stockFilter === 'all' ||
        (stockFilter === 'ready' && v.stock > 0) ||
        (stockFilter === 'low' && status === 'low') ||
        (stockFilter === 'out' && status === 'out');
      const matchSize = sizeFilter === 'all' || v.size === sizeFilter;
      const matchColor = colorFilter === 'all' || v.colorName === colorFilter;
      return matchSearch && matchStock && matchSize && matchColor;
    });
  }, [variants, searchQuery, stockFilter, sizeFilter, colorFilter]);

  // Group variants by parent product
  const groupedProducts = useMemo(() => {
    // Map products to their variants
    const productMap = new Map<
      string,
      {
        id: string;
        title: string;
        slug: string;
        edition?: string;
        image?: string;
        totalStock: number;
        variants: ProductVariant[];
        colorsSummary: { name: string; hex: string; stock: number }[];
      }
    >();

    // Seed from catalog products
    products.forEach((p) => {
      productMap.set(String(p.id), {
        id: String(p.id),
        title: p.title,
        slug: p.slug,
        edition: p.edition,
        image: p.image,
        totalStock: 0,
        variants: [],
        colorsSummary: [],
      });
    });

    // Populate variants (hanya masukkan jika produk induk masih aktif di katalog, jangan buat entri untuk produk yang sudah dihapus)
    variants.forEach((v) => {
      let entry = productMap.get(v.productId);
      if (!entry) {
        // Produk telah dihapus dari katalog, jangan tampilkan lagi di tab stok
        return;
      }
      entry.variants.push(v);
      entry.totalStock += v.stock;
    });

    // Compute color summaries per product
    productMap.forEach((entry) => {
      const colorTotals = new Map<string, { name: string; hex: string; stock: number }>();
      entry.variants.forEach((v) => {
        const existing = colorTotals.get(v.colorName);
        if (existing) {
          existing.stock += v.stock;
        } else {
          colorTotals.set(v.colorName, {
            name: v.colorName,
            hex: v.colorHex,
            stock: v.stock,
          });
        }
      });
      entry.colorsSummary = Array.from(colorTotals.values());
    });

    // Convert to array and filter
    let list = Array.from(productMap.values());
    const q = searchQuery.toLowerCase().trim();

    list = list.filter((p) => {
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q) || v.colorName.toLowerCase().includes(q));

      // Stock filter:
      // ready: totalStock > 0
      // low: has at least one variant with low stock (1-3)
      // out: totalStock === 0
      const matchStock =
        stockFilter === 'all' ||
        (stockFilter === 'ready' && p.totalStock > 0) ||
        (stockFilter === 'low' && p.variants.some((v) => v.stock > 0 && v.stock <= (v.lowStockThreshold ?? 3))) ||
        (stockFilter === 'out' && p.totalStock === 0);

      const matchSize =
        sizeFilter === 'all' || p.variants.some((v) => v.size === sizeFilter);

      const matchColor =
        colorFilter === 'all' || p.variants.some((v) => v.colorName === colorFilter);

      return matchSearch && matchStock && matchSize && matchColor;
    });

    // Sort list
    list.sort((a, b) => {
      if (sortBy === 'stock-desc') return b.totalStock - a.totalStock;
      if (sortBy === 'stock-asc') return a.totalStock - b.totalStock;
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [products, variants, searchQuery, stockFilter, sizeFilter, colorFilter, sortBy]);

  // Toggle card expansion
  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    groupedProducts.forEach((p) => {
      next[p.id] = true;
    });
    setExpandedProductIds(next);
  };

  const collapseAll = () => {
    setExpandedProductIds({});
  };

  // Sync / Generate variants for all products via server API
  const handleGenerateVariants = async () => {
    setGenerating(true);
    try {
      // Call ensure_product for every catalog product — server will create missing variants idempotently
      let synced = 0;
      for (const p of products) {
        const res = await fetch('/api/admin/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': 'sevaya-admin',
          },
          body: JSON.stringify({ action: 'ensure_product', product: p }),
        });
        const json = await res.json();
        if (json.success) synced++;
      }

      if (synced === 0) {
        alert('Tidak ada produk di katalog untuk disinkronkan.');
      } else {
        await fetchInventory(true);
      }
    } catch (err) {
      console.warn('[GenerateVariants]', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleMutationSuccess = (updatedVariant: ProductVariant, totalProductStock?: number) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === updatedVariant.id ? updatedVariant : v))
    );
    if (typeof totalProductStock === 'number' && onStockMutated) {
      onStockMutated(updatedVariant.productId, totalProductStock);
    }
    fetchInventory(true);
  };

  const scrollTable = (id: string | number, offset: number) => {
    const el = document.getElementById(`table-container-${id}`);
    if (el) {
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
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
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1560px] space-y-3 sm:space-y-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-1 sm:pb-2">
        <div className="min-w-0">
          <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
            Transaksi &amp; Logistik
          </span>
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-black truncate">
            Inventaris &amp; Stok Fisik
          </h2>
          <p className="text-[11px] text-black/50 mt-0 hidden sm:block">
            Stok terpusat per produk, warna &amp; ukuran. Jumlah stok di katalog disinkronkan otomatis dari sini.
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
        </div>
      </div>

      {/* Telemetry Summary Card (Swipeable on Mobile) */}
      <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] overflow-hidden">
        <div className="flex sm:grid sm:grid-cols-4 overflow-x-auto sm:overflow-visible no-scrollbar divide-x divide-black/10 touch-pan-x -mx-1 px-1">
          <div className="flex flex-col justify-center space-y-0.5 px-3 sm:px-4 py-1 sm:py-0 min-w-[130px] sm:min-w-0 shrink-0">
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
              Di {variants.length} varian ({products.length} produk)
            </span>
          </div>

          <div className="flex flex-col justify-center space-y-0.5 px-3 sm:px-4 py-1 sm:py-0 min-w-[130px] sm:min-w-0 shrink-0">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
              Stok Tersedia
            </span>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold text-emerald-800 tabular-nums">
                {variants.filter((v) => v.stock > 0).length}
              </span>
              <span className="text-[10px] text-black/60">varian</span>
            </div>
            <span className="hidden sm:block text-[11px] text-black/50">
              Siap dijual di toko (stok &gt; 0)
            </span>
          </div>

          <div className="flex flex-col justify-center space-y-0.5 px-3 sm:px-4 py-1 sm:py-0 min-w-[130px] sm:min-w-0 shrink-0">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
              Perlu Restock
            </span>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold text-amber-700 tabular-nums">
                {telemetry?.lowStockVariantsCount ?? 0}
              </span>
              <span className="text-[10px] text-black/60">varian</span>
            </div>
            <span className="hidden sm:block text-[11px] text-black/50">
              Kritis (sisa 1–3 pcs)
            </span>
          </div>

          <div className="flex flex-col justify-center space-y-0.5 px-3 sm:px-4 py-1 sm:py-0 min-w-[130px] sm:min-w-0 shrink-0">
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
              0 pcs (Sold Out di toko)
            </span>
          </div>
        </div>
      </div>

      {/* View Mode & Filter Controls */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl sm:rounded-2xl border border-black/15 bg-white p-2.5 sm:p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
          {/* View Mode Switcher (Scrollable on Mobile) */}
          <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full w-full sm:w-fit overflow-x-auto no-scrollbar shrink-0 touch-pan-x">
            <button
              type="button"
              onClick={() => setActiveView('grouped')}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'grouped'
                  ? 'bg-white text-black shadow-xs font-bold'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              Per Produk ({groupedProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView('flat')}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'flat'
                  ? 'bg-white text-black shadow-xs font-bold'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              Semua Baris SKU ({variants.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView('mutations')}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'mutations'
                  ? 'bg-white text-black shadow-xs font-bold'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              Riwayat Mutasi ({mutations.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
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

        {/* Sub-Filters & Sorting Bar */}
        {activeView !== 'mutations' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              {/* Status Pills (Swipeable on Mobile) */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 touch-pan-x w-full sm:w-auto">
                {[
                  { id: 'all', label: 'Semua Stok' },
                  { id: 'ready', label: 'Tersedia (>0)' },
                  { id: 'low', label: 'Perlu Restock (1-3)' },
                  { id: 'out', label: 'Habis (0)' },
                ].map((tab) => {
                  const active = stockFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStockFilter(tab.id as StockFilter)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 shrink-0 cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-black text-white shadow-xs'
                          : 'border border-black/15 bg-white text-black/70 hover:bg-black/5 hover:text-black'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Size & Color Dropdowns - Hanya tampil di tab "Semua Baris SKU" */}
              {activeView === 'flat' && (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <select
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="flex-1 sm:flex-initial h-7 sm:h-8 rounded-lg border border-black/20 bg-white px-2.5 text-[11px] font-medium text-black/80 focus:border-black focus:outline-none transition-colors cursor-pointer"
                  >
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>
                        {s === 'all' ? 'Semua Size' : `Size ${s}`}
                      </option>
                    ))}
                  </select>

                  <select
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value)}
                    className="flex-1 sm:flex-initial h-7 sm:h-8 rounded-lg border border-black/20 bg-white px-2.5 text-[11px] font-medium text-black/80 focus:border-black focus:outline-none transition-colors cursor-pointer"
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

            {/* Sorting & Expand/Collapse Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-black/40 hidden sm:inline">
                  Urutan:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-7 sm:h-8 rounded-lg border border-black/20 bg-white px-2.5 text-[11px] font-semibold text-black/80 focus:border-black focus:outline-none transition-colors"
                >
                  <option value="stock-desc">Stok: Banyak → Sedikit</option>
                  <option value="stock-asc">Stok: Sedikit → Banyak</option>
                  <option value="title-asc">Nama Produk (A–Z)</option>
                </select>
              </div>

              {activeView === 'grouped' && (
                <div className="flex items-center gap-1 text-[11px] text-black/60">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="hover:text-black underline cursor-pointer text-[10px]"
                  >
                    Buka Semua
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="hover:text-black underline cursor-pointer text-[10px]"
                  >
                    Tutup Semua
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && variants.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2.5 rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
          <Icon name="refresh" size={24} className="animate-spin text-black/40" />
          <span className="text-xs font-semibold tracking-wider text-black/60 uppercase">
            Memuat data stok &amp; inventaris...
          </span>
        </div>
      ) : activeView === 'grouped' ? (
        /* ═══════════════════════════════════════════════════════════════
           MODE 1: HIERARCHICAL / GROUPED BY PARENT PRODUCT (DEFAULT)
           ═══════════════════════════════════════════════════════════════ */
        <div className="space-y-3">
          {groupedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-black/15 bg-white">
              <Icon name="search_off" size={32} className="text-black/40 mb-2" />
              <p className="text-xs font-bold text-black">Tidak ada produk yang cocok dengan filter</p>
              <p className="text-[11px] text-black/50 mt-0.5">
                Coba sesuaikan kata kunci pencarian atau ganti status filter stok.
              </p>
            </div>
          ) : (
            groupedProducts.map((prod) => {
              const isExpanded = expandedProductIds[prod.id] !== false;
              const status = getStockStatus(prod.totalStock, 3);
              const badge = STATUS_BADGE[status];

              return (
                <div
                  key={prod.id}
                  className="rounded-xl sm:rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)] overflow-hidden transition"
                >
                  {/* Product Card Header Summary */}
                  <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Product Thumbnail */}
                      <div className="relative h-14 w-12 sm:h-16 sm:w-14 shrink-0 rounded-lg overflow-hidden bg-black/5 border border-black/10">
                        <Image
                          src={prod.image || '/images/catalog/catalog-01.jpg'}
                          alt={prod.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>

                      {/* Product Meta */}
                      <div className="min-w-0">
                        {prod.edition && (
                          <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block truncate">
                            {prod.edition}
                          </span>
                        )}
                        <h3 className="font-headline text-xs sm:text-sm font-bold text-black truncate">
                          {prod.title}
                        </h3>
                        <span className="text-[10px] font-mono text-black/40 truncate block">
                          /{prod.slug}
                        </span>

                        {/* Color Subtotals Pills (Swipeable on Mobile) */}
                        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto no-scrollbar max-w-full touch-pan-x py-0.5">
                          {prod.colorsSummary.map((c) => (
                            <span
                              key={c.name}
                              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.02] px-2 py-0.5 text-[10px] text-black/70 font-medium whitespace-nowrap shrink-0"
                            >
                              <span
                                className="h-2 w-2 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span>{c.name}:</span>
                              <strong className="text-black">{c.stock} pcs</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Total Stock & Quick Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10">
                      {/* Total Stock Highlight Box */}
                      <div className="flex flex-col sm:items-end">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-black/40">
                          Total Stok Fisik
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg sm:text-2xl font-bold text-black tabular-nums">
                            {prod.totalStock}
                          </span>
                          <span className="text-xs text-black/60 font-medium">pcs</span>
                        </div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-0.5 ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Expand / Collapse Button */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleExpand(prod.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-black/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-black hover:bg-black/5 transition active:scale-95 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Tutup' : 'Rincian'}</span>
                          <Icon
                            name={isExpanded ? 'expand_less' : 'expand_more'}
                            size={14}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Matrix Table of Variants (Accordion Content) */}
                  {isExpanded && (
                    <div className="border-t border-black/10 bg-black/[0.01]">
                      {prod.variants.length === 0 ? (
                        <div className="p-4 text-center text-xs text-black/50">
                          Belum ada varian ukuran/warna untuk produk ini.
                          <br />
                          <span className="text-[11px] text-black/40">Tekan &ldquo;Sinkronkan Katalog&rdquo; untuk membuat varian otomatis.</span>
                        </div>
                      ) : (() => {
                        // Build color-keyed map: colorName → { hex, variants by size }
                        const colorMap = new Map<string, { hex: string; bySize: Map<string, ProductVariant> }>();
                        const allSizes: string[] = [];
                        prod.variants.forEach((v) => {
                          if (!colorMap.has(v.colorName)) {
                            colorMap.set(v.colorName, { hex: v.colorHex, bySize: new Map() });
                          }
                          colorMap.get(v.colorName)!.bySize.set(v.size, v);
                          if (!allSizes.includes(v.size)) allSizes.push(v.size);
                        });
                        // Sort sizes naturally: S, M, L, XL, etc.
                        allSizes.sort((a, b) => {
                          const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
                          const ia = order.indexOf(a.toUpperCase());
                          const ib = order.indexOf(b.toUpperCase());
                          if (ia !== -1 && ib !== -1) return ia - ib;
                          if (ia !== -1) return -1;
                          if (ib !== -1) return 1;
                          return a.localeCompare(b);
                        });

                        return (
                          <div
                            id={`table-container-${prod.id}`}
                            className="overflow-x-auto touch-pan-x scrollbar-thin scroll-smooth pb-1"
                          >
                            {/* Mobile Swipe & Interactive Scroll Buttons */}
                            <div className="flex sm:hidden items-center justify-between px-3 py-1.5 bg-black/[0.03] border-b border-black/10 text-[10px] text-black/60 sticky left-0 z-20">
                              <span className="flex items-center gap-1 font-medium">
                                <span>Geser rincian stok:</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => scrollTable(prod.id, -180)}
                                  className="inline-flex items-center justify-center w-7 h-6 rounded-md border border-black/20 bg-white text-black active:bg-black/10 active:scale-95 cursor-pointer shadow-2xs"
                                  title="Geser ke kiri"
                                >
                                  <Icon name="chevron_left" size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => scrollTable(prod.id, 180)}
                                  className="inline-flex items-center justify-center w-7 h-6 rounded-md border border-black/20 bg-white text-black active:bg-black/10 active:scale-95 cursor-pointer shadow-2xs"
                                  title="Geser ke kanan"
                                >
                                  <Icon name="chevron_right" size={14} />
                                </button>
                              </div>
                            </div>

                            <table className="w-full min-w-[500px] text-left text-xs">
                              <thead>
                                <tr className="border-b border-black/10 bg-black/[0.03]">
                                  <th className="sticky left-0 z-10 bg-[#fafafa] py-2 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/60 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                                    Warna / Swatch
                                  </th>
                                  {allSizes.map((sz) => (
                                    <th key={sz} className="py-2 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center whitespace-nowrap">
                                      Size {sz}
                                    </th>
                                  ))}
                                  <th className="py-2 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center whitespace-nowrap">
                                    Total Warna
                                  </th>
                                  <th className="py-2 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-right whitespace-nowrap">
                                    Aksi
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black/[0.05]">
                                {Array.from(colorMap.entries()).map(([colorName, colorData]) => {
                                  const colorVariants = Array.from(colorData.bySize.values());
                                  const colorTotal = colorVariants.reduce((s, v) => s + v.stock, 0);
                                  const colorStatus = getStockStatus(colorTotal, 3);
                                  const colorBadge = STATUS_BADGE[colorStatus];
                                  // Pick first variant for quick restock action
                                  const firstVariant = allSizes
                                    .map((sz) => colorData.bySize.get(sz))
                                    .find((v) => v !== undefined);

                                  return (
                                    <tr key={colorName} className="hover:bg-black/[0.015] transition-colors bg-white">
                                      {/* Color swatch + name (Sticky on Mobile Swipe) */}
                                      <td className="sticky left-0 z-10 bg-white py-2.5 px-3 sm:px-4 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                                        <div className="flex items-center gap-2 min-w-[110px]">
                                          <span
                                            className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0"
                                            style={{ backgroundColor: colorData.hex }}
                                          />
                                          <div className="min-w-0">
                                            <span className="text-black/90 font-semibold text-[11px] block truncate">{colorName}</span>
                                            <span className={`inline-block rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider mt-0.5 ${colorBadge.className}`}>
                                              {colorBadge.label}
                                            </span>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Stock per size */}
                                      {allSizes.map((sz) => {
                                        const v = colorData.bySize.get(sz);
                                        const szStatus = v ? getStockStatus(v.stock, v.lowStockThreshold ?? 3) : null;
                                        return (
                                          <td key={sz} className="py-2.5 px-3 sm:px-4 text-center">
                                            {v ? (
                                              <button
                                                type="button"
                                                onClick={() => setMutationTarget({ variant: v, availableVariants: colorVariants, type: 'in' })}
                                                title={`Masuk stok: ${colorName} Size ${sz}`}
                                                className={`inline-flex flex-col items-center gap-0 cursor-pointer rounded-lg px-2 py-1 transition hover:scale-105 active:scale-95 ${
                                                  szStatus === 'out'
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : szStatus === 'low'
                                                    ? 'bg-amber-50 text-amber-800'
                                                    : 'bg-emerald-50/60 text-emerald-800'
                                                }`}
                                              >
                                                <span className="text-xs font-bold tabular-nums">{v.stock}</span>
                                                <span className="text-[9px] font-medium opacity-70">pcs</span>
                                              </button>
                                            ) : (
                                              <span className="text-black/25 text-[11px]">—</span>
                                            )}
                                          </td>
                                        );
                                      })}

                                      {/* Total per color */}
                                      <td className="py-2.5 px-3 sm:px-4 text-center">
                                        <span className="text-sm font-bold text-black tabular-nums">{colorTotal}</span>
                                        <span className="text-[10px] text-black/50 ml-0.5">pcs</span>
                                      </td>

                                      {/* Quick action buttons */}
                                      <td className="py-2.5 px-3 sm:px-4 text-right">
                                        {firstVariant ? (
                                          <div className="inline-flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setMutationTarget({ variant: firstVariant, availableVariants: colorVariants, type: 'in' })}
                                              className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
                                              title="Stok Masuk (+)"
                                            >
                                              <Icon name="add" size={11} />
                                              <span>Masuk</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setMutationTarget({ variant: firstVariant, availableVariants: colorVariants, type: 'out' })}
                                              className="inline-flex items-center gap-0.5 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                                              title="Stok Keluar (-)"
                                            >
                                              <Icon name="remove" size={11} />
                                              <span>Keluar</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-black/25 text-[10px]">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : activeView === 'flat' ? (
        /* ═══════════════════════════════════════════════════════════════
           MODE 2: FLAT SKU TABLE (BARCODE SCANNER & OPNAME)
           ═══════════════════════════════════════════════════════════════ */
        <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)] overflow-hidden">
          {filteredVariants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Icon name="search_off" size={32} className="text-black/40 mb-2" />
              <p className="text-xs font-bold text-black">Tidak ada varian yang cocok</p>
            </div>
          ) : (
            <div
              id="table-container-flat"
              className="overflow-x-auto touch-pan-x scrollbar-thin scroll-smooth"
            >
              {/* Mobile Swipe & Interactive Scroll Buttons */}
              <div className="flex sm:hidden items-center justify-between px-3 py-1.5 bg-black/[0.03] border-b border-black/10 text-[10px] text-black/60 sticky left-0 z-20">
                <span className="font-medium">Geser tabel SKU:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollTable('flat', -180)}
                    className="inline-flex items-center justify-center w-7 h-6 rounded-md border border-black/20 bg-white text-black active:bg-black/10 active:scale-95 cursor-pointer shadow-2xs"
                    title="Geser ke kiri"
                  >
                    <Icon name="chevron_left" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTable('flat', 180)}
                    className="inline-flex items-center justify-center w-7 h-6 rounded-md border border-black/20 bg-white text-black active:bg-black/10 active:scale-95 cursor-pointer shadow-2xs"
                    title="Geser ke kanan"
                  >
                    <Icon name="chevron_right" size={14} />
                  </button>
                </div>
              </div>
              <table className="w-full min-w-[650px] text-left text-xs">
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
                      Size
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center">
                      Stok Fisik
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-center">
                      Status
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-black/50 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {filteredVariants.map((variant) => {
                    const rowVariants = variants.filter(
                      (v) => v.productId === variant.productId && v.colorName.toLowerCase() === variant.colorName.toLowerCase()
                    );
                    const status = getStockStatus(variant.stock, variant.lowStockThreshold ?? 3);
                    const badge = STATUS_BADGE[status];
                    return (
                      <tr key={variant.id} className="hover:bg-black/[0.015] transition-colors">
                        <td className="py-2.5 px-3 sm:px-4 font-mono text-[11px] text-black/60 font-medium">
                          {variant.sku}
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 font-semibold text-black max-w-[180px] truncate">
                          {variant.productTitle}
                        </td>
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
                        <td className="py-2.5 px-3 sm:px-4 text-center">
                          <span className="inline-block rounded-md bg-black/5 px-2 py-0.5 font-bold text-black/80 text-[10px]">
                            {variant.size}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-center">
                          <span className="text-sm font-bold text-black tabular-nums">
                            {variant.stock}
                          </span>
                          <span className="text-[10px] text-black/50 ml-0.5">pcs</span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setMutationTarget({ variant, availableVariants: rowVariants, type: 'in' })}
                              className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
                              title="Stok Masuk"
                            >
                              <Icon name="add" size={11} />
                              <span>Masuk</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMutationTarget({ variant, availableVariants: rowVariants, type: 'out' })}
                              className="inline-flex items-center gap-0.5 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                              title="Stok Keluar"
                            >
                              <Icon name="remove" size={11} />
                              <span>Keluar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMutationTarget({ variant, availableVariants: rowVariants, type: 'adjustment' })}
                              className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 hover:bg-amber-100 transition active:scale-95 cursor-pointer"
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
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           MODE 3: MUTATIONS AUDIT TRAIL TABLE
           ═══════════════════════════════════════════════════════════════ */
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
            <div
              id="table-container-mutations"
              className="overflow-x-auto touch-pan-x scrollbar-thin scroll-smooth"
            >
              {/* Mobile Swipe & Interactive Scroll Buttons */}
              <div className="flex sm:hidden items-center justify-between px-3 py-1.5 bg-black/[0.03] border-b border-black/10 text-[10px] text-black/60 sticky left-0 z-20">
                <span className="font-medium">Geser riwayat mutasi:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollTable('mutations', -180)}
                    className="inline-flex items-center justify-center w-7 h-6 rounded-md border border-black/20 bg-white text-black active:bg-black/10 active:scale-95 cursor-pointer shadow-2xs"
                    title="Geser ke kiri"
                  >
                    <Icon name="chevron_left" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTable('mutations', 180)}
                    className="inline-flex items-center justify-center w-7 h-6 rounded-md border border-black/20 bg-white text-black active:bg-black/10 active:scale-95 cursor-pointer shadow-2xs"
                    title="Geser ke kanan"
                  >
                    <Icon name="chevron_right" size={14} />
                  </button>
                </div>
              </div>
              <table className="w-full min-w-[740px] text-left text-xs">
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

      {/* Modal Mutasi Stok */}
      {mutationTarget && (
        <StockMutationModal
          variant={mutationTarget.variant}
          availableVariants={mutationTarget.availableVariants}
          defaultType={mutationTarget.type}
          onClose={() => setMutationTarget(null)}
          onSuccess={handleMutationSuccess}
        />
      )}
    </div>
  );
}
