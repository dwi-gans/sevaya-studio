'use client';

import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { DbProduct, ProductSwatch } from '@/integrations/supabase';
import { ImagePickerTarget } from '../adminTypes';

export interface ProductFormData {
  title: string;
  slug: string;
  edition: string;
  price: number;
  original_price: number;
  badge: string;
  image: string;
  inStock: boolean;
  hidden: boolean;
  swatches: ProductSwatch[];
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: DbProduct | null;
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

export function ProductModal({
  isOpen,
  onClose,
  editingProduct,
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
  if (!isOpen) return null;

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
              <label className="text-[11px] font-medium text-black/70">
                Nama / Judul Produk *
              </label>
              <input
                type="text"
                required
                value={productForm.title}
                onChange={(e) => setProductForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="cth. Fina Abaya - Stripe 2.0"
                className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/15 bg-white p-2">
                <input
                  type="checkbox"
                  checked={productForm.inStock}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, inStock: e.target.checked }))
                  }
                  className="h-3.5 w-3.5 accent-[#000000]"
                />
                <span className="text-[11px] font-medium text-black truncate">
                  In Stock
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                <input
                  type="checkbox"
                  checked={productForm.hidden}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, hidden: e.target.checked }))
                  }
                  className="h-3.5 w-3.5 accent-amber-600"
                />
                <span className="text-[11px] font-medium text-amber-800 truncate">
                  Sembunyikan
                </span>
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
                    accept="image/*"
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
                            accept="image/*"
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
              disabled={isLoading}
              className="h-8 sm:h-9 flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95 cursor-pointer"
            >
              <Icon name="check" size={14} />
              <span>{isLoading ? 'Menyimpan...' : 'Simpan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
