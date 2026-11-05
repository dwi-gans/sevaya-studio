'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { DbProduct, ProductSwatch } from '@/integrations/supabase';
import { ImagePickerTarget } from '../adminTypes';

export interface ProductFormData {
  title: string;
  slug: string;
  category?: 'abaya' | 'khimar' | string;
  edition: string;
  price: number;
  original_price: number;
  badge: string;
  image: string;
  inStock: boolean;
  hidden: boolean;
  stock: number;
  sizes?: string[];
  swatches: ProductSwatch[];
  description: string;  // deskripsi produk
  fabric: string;       // informasi bahan / kain
  sizing: string;       // panduan ukuran
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: DbProduct | null;
  products?: DbProduct[];
  productForm: ProductFormData;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
  onSave: (e: React.FormEvent) => Promise<void>;
  onAddSwatch: () => void;
  onRemoveSwatch: (index: number) => void;
  onUpdateSwatch: (index: number, field: 'name' | 'color' | 'image', value: string) => void;
  onOpenImagePicker: (target: ImagePickerTarget) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isLoading: boolean;
  isUploading: boolean;
}

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'];

export function ProductModal({
  isOpen,
  onClose,
  editingProduct,
  products = [],
  productForm,
  setProductForm,
  onSave,
  onAddSwatch,
  onRemoveSwatch,
  onUpdateSwatch,
  onOpenImagePicker,
  onFileUpload,
  isLoading,
  isUploading,
}: ProductModalProps) {
  const [customSizeInput, setCustomSizeInput] = useState('');

  if (!isOpen) return null;

  const currentId = editingProduct ? String(editingProduct.id) : null;
  const isDuplicateTitle = Boolean(
    productForm.title.trim() &&
    products.some(
      (p) => String(p.id) !== currentId && p.title.trim().toLowerCase() === productForm.title.trim().toLowerCase()
    )
  );

  const currentSizes = productForm.sizes && productForm.sizes.length > 0
    ? productForm.sizes
    : ['S', 'M', 'L'];

  const toggleSize = (sz: string) => {
    const isSelected = currentSizes.includes(sz);
    if (isSelected) {
      if (currentSizes.length <= 1) return; // pertahankan minimal 1 size
      setProductForm((prev) => ({
        ...prev,
        sizes: currentSizes.filter((s) => s !== sz),
      }));
    } else {
      setProductForm((prev) => ({
        ...prev,
        sizes: [...currentSizes, sz],
      }));
    }
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!currentSizes.includes(trimmed)) {
      setProductForm((prev) => ({
        ...prev,
        sizes: [...currentSizes, trimmed],
      }));
    }
    setCustomSizeInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] sm:max-h-[90vh] w-full max-w-full sm:max-w-2xl flex flex-col rounded-t-2xl sm:rounded-2xl border border-black/15 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/15/70 bg-white px-3.5 sm:px-6 py-2.5 sm:py-3.5 shrink-0">
          <div className="min-w-0 pr-2">
            <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-black/50 uppercase block">
              Katalog Koleksi
            </span>
            <h3 className="font-headline text-sm sm:text-base font-bold text-black truncate">
              {editingProduct ? 'Edit Produk & Varian Foto' : 'Tambah Produk Baru'}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-black/50 mt-0 truncate">
              Atur foto utama dan varian warna masing-masing busana.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-black/70 hover:bg-black/5 hover:text-black transition-colors cursor-pointer"
            aria-label="Tutup Form Produk"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={onSave} className="flex flex-col gap-3.5 sm:gap-4 p-3.5 sm:p-5 overflow-y-auto overflow-x-hidden">
          {/* Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-black/70">
                  Nama / Judul Produk *
                </label>
                {isDuplicateTitle && (
                  <span className="text-[10px] text-rose-600 font-semibold">
                    Nama produk ini sudah ada!
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={productForm.title}
                onChange={(e) => setProductForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="cth. Fina Abaya - Stripe 2.0"
                className={`w-full rounded-lg border bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:outline-none transition-colors ${
                  isDuplicateTitle ? 'border-rose-500 focus:border-rose-600' : 'border-black/20 focus:border-black'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] font-medium text-black/70">
                Slug URL
              </label>
              <input
                type="text"
                value={productForm.slug}
                onChange={(e) => setProductForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="otomatis dibuat dari judul"
                className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Category Selector (Abaya atau Khimar) */}
          <div className="flex flex-col gap-1.5 rounded-xl border border-black/10 bg-black/[0.02] p-2.5 sm:p-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-black uppercase tracking-wider">
                Kategori Busana *
              </label>
              <span className="text-[10px] text-black/50">Wajib dipilih: Abaya atau Khimar</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProductForm((prev) => ({ ...prev, category: 'abaya' }))}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  (productForm.category || 'abaya').toLowerCase() === 'abaya'
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-black/70 border border-black/15 hover:border-black/40 hover:text-black'
                }`}
              >
                <span>Abaya</span>
                {(productForm.category || 'abaya').toLowerCase() === 'abaya' && (
                  <span className="text-[10px]">✓</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setProductForm((prev) => ({ ...prev, category: 'khimar' }))}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  (productForm.category || '').toLowerCase() === 'khimar'
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-black/70 border border-black/15 hover:border-black/40 hover:text-black'
                }`}
              >
                <span>Khimar</span>
                {(productForm.category || '').toLowerCase() === 'khimar' && (
                  <span className="text-[10px]">✓</span>
                )}
              </button>
            </div>
          </div>

          {/* Edition, Price, Original Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] font-medium text-black/70">
                Edisi / Subtitle
              </label>
              <input
                type="text"
                value={productForm.edition}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, edition: e.target.value }))
                }
                placeholder="cth. Edition 2.0"
                className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] font-medium text-black/70">
                Harga (Rp) *
              </label>
              <input
                type="number"
                required
                value={productForm.price}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, price: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] font-medium text-black/70">
                Harga Normal (Coret)
              </label>
              <input
                type="number"
                value={productForm.original_price}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    original_price: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Badge & Stock & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] font-medium text-black/70">
                Badge Label (Opsional)
              </label>
              <input
                type="text"
                value={productForm.badge}
                onChange={(e) => setProductForm((prev) => ({ ...prev, badge: e.target.value }))}
                placeholder="cth. Best Seller, Sale -20%"
                className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setProductForm((prev) => ({ ...prev, badge: 'Best Seller' }))}
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-medium tracking-wider transition active:scale-95 cursor-pointer ${
                    productForm.badge?.toLowerCase() === 'best seller'
                      ? 'bg-[#1C1917] text-[#FBF9F5] border border-black shadow-xs'
                      : 'bg-black/5 text-black hover:bg-black/10'
                  }`}
                >
                  ✦ Best Seller
                </button>
                <button
                  type="button"
                  onClick={() => setProductForm((prev) => ({ ...prev, badge: 'Trending' }))}
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-medium tracking-wider transition active:scale-95 cursor-pointer ${
                    productForm.badge?.toLowerCase() === 'trending'
                      ? 'bg-[#FAF8F5] text-[#2C2723] border border-[#DDD5C7] shadow-xs'
                      : 'bg-black/5 text-black hover:bg-black/10'
                  }`}
                >
                  ✦ Trending
                </button>
                <button
                  type="button"
                  onClick={() => setProductForm((prev) => ({ ...prev, badge: 'New' }))}
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-medium tracking-wider transition active:scale-95 cursor-pointer ${
                    productForm.badge?.toLowerCase() === 'new'
                      ? 'bg-[#1C1917] text-[#FBF9F5] border border-black shadow-xs'
                      : 'bg-black/5 text-black hover:bg-black/10'
                  }`}
                >
                  ✦ New
                </button>
                {productForm.badge && (
                  <button
                    type="button"
                    onClick={() => setProductForm((prev) => ({ ...prev, badge: '' }))}
                    className="text-[9px] text-red-600 hover:underline cursor-pointer ml-1"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {/* Stok Fisik (Read-Only / Otomatis dari Inventaris) */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-black/70">
                  Stok Fisik
                </label>
                <span className="text-[10px] text-black/40 flex items-center gap-0.5 font-mono">
                  <Icon name="lock" size={10} />
                  Otomatis
                </span>
              </div>
              <div className="flex items-center justify-between h-8 sm:h-9 rounded-lg border border-black/15 bg-black/[0.03] px-2.5 py-1 text-xs font-semibold text-black">
                <span>{productForm.stock ?? 0} pcs</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    (productForm.stock ?? 0) > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {(productForm.stock ?? 0) > 0 ? 'Tersedia' : 'Habis (0 pcs)'}
                </span>
              </div>
              <p className="text-[9px] text-black/40 leading-tight">
                {editingProduct
                  ? 'Dihitung otomatis dari akumulasi varian di tab Inventaris.'
                  : 'Stok awal 0 pcs. Diatur via tab Inventaris (otomatis disembunyikan sampai restock).'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-5">
              <div
                className={`flex items-center gap-1.5 rounded-lg border p-2 ${
                  (productForm.stock ?? 0) > 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
                title="Status ketersediaan ditentukan otomatis dari total stok varian di inventaris"
              >
                <Icon
                  name={(productForm.stock ?? 0) > 0 ? 'check_circle' : 'cancel'}
                  size={14}
                  className={(productForm.stock ?? 0) > 0 ? 'text-emerald-700' : 'text-rose-600'}
                />
                <span className="text-[10px] font-semibold truncate">
                  {(productForm.stock ?? 0) > 0 ? 'Stok Tersedia' : 'Stok Habis (0 pcs)'}
                </span>
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2">
                <input
                  type="checkbox"
                  checked={productForm.hidden}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, hidden: e.target.checked }))
                  }
                  className="h-3.5 w-3.5 accent-[#000000]"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-amber-900 truncate">
                    Sembunyikan
                  </span>
                  {!editingProduct && (
                    <span className="text-[8px] text-amber-700/80 leading-none">
                      (Auto-hide aktif)
                    </span>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Product Default Image */}
          <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-black/[0.02] p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-black">
                Foto Sampul Utama Produk
              </span>
              <button
                type="button"
                onClick={() => onOpenImagePicker('product')}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-black/20 bg-white px-2.5 text-[10px] font-medium text-black hover:bg-black/5 active:scale-95 cursor-pointer"
              >
                <Icon name="image" size={12} />
                <span>Pilih Galeri</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="relative h-16 w-12 sm:h-20 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-black/15 bg-white">
                <Image
                  src={productForm.image || '/images/catalog/catalog-01.jpg'}
                  alt="Product preview"
                  fill
                  className="object-cover"
                  unoptimized={Boolean(productForm.image?.startsWith('http'))}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                <input
                  type="text"
                  value={productForm.image}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, image: e.target.value }))
                  }
                  placeholder="/images/catalog/catalog-01.jpg atau URL Supabase"
                  className="w-full h-8 rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs text-black focus:border-black focus:outline-none"
                />
                <label className="inline-flex h-7 w-fit cursor-pointer items-center gap-1 rounded-full bg-black px-3 text-[10px] font-semibold text-white transition hover:bg-black/85 active:scale-95">
                  <Icon name="upload" size={12} />
                  <span>{isUploading ? 'Mengunggah...' : 'Unggah File'}</span>
                  <input
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif"
                    disabled={isUploading}
                    onChange={(e) => {
                      onOpenImagePicker('product');
                      onFileUpload(e);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Pilihan Ukuran (Size) Builder */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-black/10 bg-black/[0.02] p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-black">
                    Pilihan Ukuran (Size)
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/10 text-black">
                    {currentSizes.length} Ukuran
                  </span>
                </div>
                <p className="text-[10px] text-black/50">
                  Tentukan ukuran busana apa saja yang diproduksi dan tersedia di inventaris.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                <span className="text-black/40 text-[9px]">Preset:</span>
                <button
                  type="button"
                  onClick={() => setProductForm((prev) => ({ ...prev, sizes: ['S', 'M', 'L'] }))}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition cursor-pointer ${
                    currentSizes.length === 3 && currentSizes.includes('S') && currentSizes.includes('M') && currentSizes.includes('L')
                      ? 'bg-black text-white font-semibold'
                      : 'bg-white border border-black/15 text-black/70 hover:bg-black/5'
                  }`}
                >
                  S, M, L
                </button>
                <button
                  type="button"
                  onClick={() => setProductForm((prev) => ({ ...prev, sizes: ['S', 'M', 'L', 'XL'] }))}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition cursor-pointer ${
                    currentSizes.length === 4 && currentSizes.includes('S') && currentSizes.includes('M') && currentSizes.includes('L') && currentSizes.includes('XL')
                      ? 'bg-black text-white font-semibold'
                      : 'bg-white border border-black/15 text-black/70 hover:bg-black/5'
                  }`}
                >
                  S - XL
                </button>
                <button
                  type="button"
                  onClick={() => setProductForm((prev) => ({ ...prev, sizes: ['All Size'] }))}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition cursor-pointer ${
                    currentSizes.length === 1 && currentSizes.includes('All Size')
                      ? 'bg-black text-white font-semibold'
                      : 'bg-white border border-black/15 text-black/70 hover:bg-black/5'
                  }`}
                >
                  All Size
                </button>
              </div>
            </div>

            {/* Size Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {PRESET_SIZES.map((sz) => {
                const isSelected = currentSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-white border border-black/15 text-black/60 hover:border-black/40 hover:text-black'
                    }`}
                  >
                    {isSelected && <Icon name="check" size={13} className="text-white" />}
                    <span>{sz}</span>
                  </button>
                );
              })}

              {/* Custom sizes that aren't in PRESET_SIZES */}
              {currentSizes.filter((s) => !PRESET_SIZES.includes(s)).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider bg-black text-white shadow-xs transition active:scale-95 cursor-pointer"
                  title="Klik untuk menghapus ukuran kustom ini"
                >
                  <Icon name="check" size={13} className="text-white" />
                  <span>{sz}</span>
                  <Icon name="close" size={11} className="text-white/70 ml-0.5" />
                </button>
              ))}
            </div>

            {/* Custom Size Input */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="relative flex-1 min-w-[140px] max-w-[220px]">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSize();
                    }
                  }}
                  placeholder="Tambah size kustom..."
                  className="w-full h-7 rounded-lg border border-black/20 bg-white px-2 text-[10px] text-black focus:border-black focus:outline-none placeholder:text-black/30"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomSize}
                disabled={!customSizeInput.trim()}
                className="h-7 px-2.5 rounded-lg border border-black/20 bg-white text-[10px] font-semibold text-black hover:bg-black/5 active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                + Tambah
              </button>
              <span className="text-[9px] text-black/40 italic">
                cth: Petite, Tall, 38, 40
              </span>
            </div>

            {/* Summary info box */}
            <div className="rounded-lg border border-neutral-200 bg-white p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-black/70">
              <span className="flex items-center gap-1">
                <Icon name="inventory_2" size={13} className="text-black/50" />
                <span>Kombinasi SKU:</span>
                <strong className="text-black">{productForm.swatches.length} warna × {currentSizes.length} size = {productForm.swatches.length * currentSizes.length} SKU</strong>
              </span>
              <span className="text-[9px] text-amber-700 font-medium">
                {editingProduct ? 'Stok dikelola via inventaris' : 'Stok awal: 0 pcs (Auto-hide aktif)'}
              </span>
            </div>
          </div>

          {/* Color Swatches Builder with Multi-Photo per Color */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-black/10 bg-black/[0.02] p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-black block truncate">
                  Varian Warna &amp; Foto Warna
                </span>
                <p className="text-[10px] text-black/50 hidden sm:block">
                  Setiap varian warna dapat dihubungkan ke foto busananya masing-masing.
                </p>
              </div>
              <button
                type="button"
                onClick={onAddSwatch}
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-black/20 bg-white px-2.5 text-[10px] font-medium text-black hover:bg-black/5 active:scale-95 cursor-pointer"
              >
                <Icon name="add" size={12} />
                <span>Tambah Warna</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              {productForm.swatches.map((sw, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-black/15 bg-white p-2.5 sm:p-3 shadow-2xs min-w-0"
                >
                  {/* Top Row on mobile: Color picker & name & delete */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="color"
                        value={sw.color}
                        onChange={(e) => onUpdateSwatch(idx, 'color', e.target.value)}
                        className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-black/15 p-0.5"
                        title="Pilih Warna Hex"
                      />
                      <input
                        type="text"
                        value={sw.name}
                        onChange={(e) => onUpdateSwatch(idx, 'name', e.target.value)}
                        placeholder="Nama Warna"
                        className="flex-1 sm:w-28 h-7 rounded border border-black/20 bg-white px-2 py-0.5 text-xs text-black focus:border-black focus:outline-none min-w-0"
                      />
                      <input
                        type="text"
                        value={sw.color}
                        onChange={(e) => onUpdateSwatch(idx, 'color', e.target.value)}
                        placeholder="#1A1A1A"
                        className="w-16 h-7 rounded border border-black/20 bg-white px-1.5 py-0.5 font-mono text-[10px] text-black/60 focus:border-black focus:outline-none shrink-0"
                      />
                    </div>

                    {/* Delete button (visible on mobile inline) */}
                    <button
                      type="button"
                      onClick={() => onRemoveSwatch(idx)}
                      className="sm:hidden h-7 w-7 shrink-0 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 active:scale-95 cursor-pointer"
                      title="Hapus Warna Ini"
                    >
                      <Icon name="close" size={15} />
                    </button>
                  </div>

                  {/* Photo for this specific color */}
                  <div className="flex flex-1 items-center gap-2 sm:border-l sm:border-black/15 sm:pl-2.5 min-w-0">
                    <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md border border-black/15 bg-black/5">
                      <Image
                        src={sw.image || productForm.image || '/images/catalog/catalog-01.jpg'}
                        alt={`Foto warna ${sw.name}`}
                        fill
                        className="object-cover"
                        unoptimized={Boolean(sw.image?.startsWith('http') || productForm.image?.startsWith('http'))}
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenImagePicker(`swatch-${idx}` as ImagePickerTarget)}
                          className="h-6 rounded-full border border-black/20 bg-white px-2 text-[10px] font-medium text-black hover:bg-black/5 active:scale-95 cursor-pointer"
                        >
                          <Icon name="image" size={10} className="inline mr-1" />
                          <span>Pilih</span>
                        </button>

                        <label className="h-6 flex items-center cursor-pointer rounded-full bg-black px-2 text-[10px] font-semibold text-white hover:bg-black/85 active:scale-95">
                          <Icon name="upload" size={10} className="inline mr-1" />
                          <span>Unggah</span>
                          <input
                            type="file"
                            accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif"
                            disabled={isUploading}
                            onChange={(e) => {
                              onOpenImagePicker(`swatch-${idx}` as ImagePickerTarget);
                              onFileUpload(e);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <span className="truncate font-mono text-[8px] text-black/40 block min-w-0">
                        {sw.image || productForm.image}
                      </span>
                    </div>

                    {/* Delete button (visible on desktop) */}
                    <button
                      type="button"
                      onClick={() => onRemoveSwatch(idx)}
                      className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full p-1 text-red-500 hover:bg-red-50 active:scale-95 cursor-pointer"
                      title="Hapus Warna Ini"
                    >
                      <Icon name="close" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description, Fabric & Sizing */}
          <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-3 sm:p-4">
            <span className="text-[11px] font-semibold text-black">Deskripsi, Bahan &amp; Ukuran</span>

            {/* Deskripsi */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-black/70">
                Deskripsi Produk
              </label>
              <textarea
                rows={3}
                value={productForm.description}
                onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="cth. Abaya dari bahan Cupro premium dengan siluet yang mengalir elegan..."
                className="w-full rounded-lg border border-black/20 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none leading-relaxed resize-none"
              />
            </div>

            {/* Fabric */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-black/70">
                Informasi Bahan / Fabric
              </label>
              <textarea
                rows={2}
                value={productForm.fabric}
                onChange={(e) => setProductForm((prev) => ({ ...prev, fabric: e.target.value }))}
                placeholder="cth. 100% Cupro Bemberg · Breathable · Anti-static · Lining: Microfiber"
                className="w-full rounded-lg border border-black/20 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none leading-relaxed resize-none"
              />
            </div>

            {/* Sizing */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-black/70">
                Panduan Ukuran / Sizing Guide
              </label>
              <textarea
                rows={3}
                value={productForm.sizing}
                onChange={(e) => setProductForm((prev) => ({ ...prev, sizing: e.target.value }))}
                placeholder={`cth.\nS  — Lingkar Dada 86-90 cm · Panjang 140 cm\nM  — Lingkar Dada 90-96 cm · Panjang 142 cm\nL  — Lingkar Dada 96-102 cm · Panjang 144 cm`}
                className="w-full rounded-lg border border-black/20 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none leading-relaxed resize-none font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-black/15 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-8 sm:h-9 flex-1 sm:flex-initial rounded-full border border-black/20 bg-white px-4 text-xs font-medium text-black/70 hover:bg-black/5 hover:text-black active:scale-95 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || isDuplicateTitle}
              className="h-8 sm:h-9 flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="check" size={14} />
              <span>{isLoading ? 'Menyimpan...' : isDuplicateTitle ? 'Nama Sudah Dipakai' : 'Simpan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
