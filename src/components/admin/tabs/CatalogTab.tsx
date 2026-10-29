import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import type { DbProduct, ProductSwatch } from '@/integrations/supabase';
type Product = DbProduct;

interface CatalogTabProps {
  products: Product[];
  filteredProducts: Product[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onToggleHide: (product: Product) => Promise<void> | void;
  onDeleteProduct: (id: string | number, title: string) => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  products,
  filteredProducts,
  isLoading,
  searchQuery,
  setSearchQuery,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleHide,
  onDeleteProduct,
}) => {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 sm:space-y-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-1 sm:pb-2">
        <div className="min-w-0">
          <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
            Koleksi &amp; Inventori
          </span>
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-black truncate">
            Manajemen Katalog
          </h2>
          <p className="text-[11px] text-black/50 mt-0 hidden sm:block">
            1 produk mendukung banyak foto untuk setiap varian warna yang dipilih pembeli.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="shrink-0 inline-flex items-center justify-center gap-1 rounded-full bg-black px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold text-white transition hover:bg-black/85 active:scale-95"
          >
            <Icon name="add" size={14} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-black/15 bg-white p-2.5 sm:p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama abaya, edisi, warna..."
            className="w-full h-8 sm:h-9 rounded-lg border border-black/20 bg-white pr-3 pl-8 py-1 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none transition-colors"
          />
          <Icon
            name="search"
            size={14}
            className="pointer-events-none absolute top-2 sm:top-2.5 left-2.5 text-black/50"
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium text-black/70 shrink-0">
          <span className="rounded-full bg-black/5 px-2.5 py-1 border border-black/10">
            Total: <strong className="text-black">{products.length}</strong>
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 border border-emerald-200/60 text-emerald-800">
            Tersedia: <strong className="font-bold">{products.filter((p) => p.inStock !== false).length}</strong>
          </span>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading && products.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-black/15 bg-white">
          <span className="text-xs tracking-wider text-black/70 uppercase">
            Memuat data produk...
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-black/15 bg-white p-6 text-center">
          <Icon name="shopping_bag" size={28} className="text-black/70" />
          <p className="text-xs text-black/70">
            Tidak ada produk yang cocok dengan pencarian.
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white uppercase"
          >
            Tambah Produk Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)] transition hover:border-black/30"
            >
              {/* Thumbnail Image */}
              <div className="relative aspect-[3/4] w-full bg-black/5">
                <Image
                  src={product.image || '/images/catalog/catalog-01.jpg'}
                  alt={product.title}
                  fill
                  className={`object-cover transition-opacity ${product.hidden ? 'opacity-40' : 'opacity-100'}`}
                />
                {product.hidden && (
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <span className="rounded-full bg-black/80 px-2 py-0.5 text-center text-[9px] font-bold tracking-wider text-white uppercase backdrop-blur-xs sm:text-[10px]">
                      Disembunyikan
                    </span>
                  </div>
                )}
                {product.badge && (
                  <span className="absolute top-2 left-2 rounded-full bg-black px-2 py-0.5 text-[9px] font-semibold tracking-wider text-white uppercase sm:text-[10px]">
                    {product.badge}
                  </span>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-black shadow-xs backdrop-blur-xs sm:px-2 sm:text-[10px]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${product.inStock !== false ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                  <span className="xs:inline hidden">
                    {product.inStock !== false ? 'In Stock' : 'Habis'}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                {product.edition && (
                  <span className="font-headline truncate text-[10px] tracking-widest text-black/50 uppercase">
                    {product.edition}
                  </span>
                )}
                <h3 className="font-headline line-clamp-1 text-xs font-semibold text-black sm:text-sm">
                  {product.title}
                </h3>
                <span className="truncate text-[10px] font-mono text-black/50 sm:text-xs">
                  /{product.slug}
                </span>

                {/* Pricing */}
                <div className="mt-1 flex flex-col sm:mt-1.5 sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="text-xs font-bold text-black sm:text-sm">
                    Rp {product.price.toLocaleString('id-ID')}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-[10px] text-black/50 line-through sm:text-[11px]">
                      Rp {product.original_price.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                {/* Swatches preview with photo indicator */}
                {product.swatches && product.swatches.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1 rounded-xl bg-black/5 p-2 text-xs">
                    <span className="text-[9px] font-semibold tracking-wider text-black/70 uppercase">
                      {product.swatches.length} Varian:
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {product.swatches.map((sw: ProductSwatch, idx: number) => (
                        <div
                          key={idx}
                          title={`${sw.name} - ${sw.image ? 'Ada Foto' : 'Foto Utama'}`}
                          className="flex items-center gap-1 rounded-full border border-black/15 bg-white px-1.5 py-0.5 shadow-2xs"
                        >
                          <span
                            style={{ backgroundColor: sw.color }}
                            className="h-2.5 w-2.5 rounded-full border border-black/15"
                          />
                          <span className="hidden text-[9px] font-medium text-black sm:inline">
                            {sw.name.split(' ')[0]}
                          </span>
                          {sw.image && (
                            <Icon name="image" size={9} className="text-emerald-700" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-2.5 flex items-center gap-1 border-t border-black/10 pt-2 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(product)}
                    className="flex h-7 sm:h-8 flex-1 items-center justify-center gap-1 rounded-full border border-black/20 bg-white px-1.5 text-[10px] sm:text-xs font-medium text-black transition hover:bg-black/5 active:scale-95"
                  >
                    <Icon name="edit" size={11} />
                    <span className="truncate">Edit</span>
                  </button>
                  {/* Hide / Show quick toggle */}
                  <button
                    type="button"
                    title={product.hidden ? 'Tampilkan di Toko' : 'Sembunyikan dari Toko'}
                    onClick={() => onToggleHide(product)}
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-95 ${
                      product.hidden
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                    }`}
                  >
                    <Icon name={product.hidden ? 'visibility' : 'visibility_off'} size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(product.id, product.title)}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 active:scale-95"
                    title="Hapus Produk"
                  >
                    <Icon name="delete" size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
