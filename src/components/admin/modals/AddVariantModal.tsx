'use client';

import React, { useState, useEffect } from 'react';
import { DbProduct, ProductVariant, generateVariantSku } from '@/integrations/supabase';
import { Icon } from '@/components/ui/Icon';

interface AddVariantModalProps {
  isOpen: boolean;
  products: DbProduct[];
  preselectedProductId?: string | null;
  onClose: () => void;
  onSuccess: (variant: ProductVariant) => void;
}

export default function AddVariantModal({
  isOpen,
  products,
  preselectedProductId,
  onClose,
  onSuccess,
}: AddVariantModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#1A1A1A');
  const [size, setSize] = useState('S');
  const [initialStock, setInitialStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedProductId) {
      setSelectedProductId(String(preselectedProductId));
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(String(products[0]?.id));
    }
  }, [preselectedProductId, products, selectedProductId]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => String(p.id) === selectedProductId) || products[0];

  const previewSku = currentProduct && colorName.trim()
    ? generateVariantSku(currentProduct.title, currentProduct.id, colorName.trim(), size)
    : 'SVY-PROD-CLR-SIZE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) {
      setError('Pilih produk busana terlebih dahulu.');
      return;
    }
    if (!colorName.trim()) {
      setError('Masukkan nama warna (misal: Obsidian Black, Sage Green).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'sevaya-admin',
        },
        body: JSON.stringify({
          action: 'add_variant',
          productId: String(currentProduct.id),
          productTitle: currentProduct.title,
          productSlug: currentProduct.slug,
          colorName: colorName.trim(),
          colorHex,
          size,
          initialStock: Math.max(0, Number(initialStock) || 0),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menambahkan varian baru.');
      }

      onSuccess(json.variant as ProductVariant);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-black/15 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 sm:px-6 py-3.5 shrink-0">
          <div className="min-w-0 pr-2">
            <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
              Inventaris Produk
            </span>
            <h3 className="font-headline text-sm sm:text-base font-bold text-black truncate">
              Tambah Varian Baru
            </h3>
            <p className="text-[11px] text-black/50 mt-0.5 truncate">
              Daftarkan kombinasi warna &amp; ukuran baru dengan SKU unik otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/60 hover:bg-black/5 hover:text-black transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4 text-xs">
          {/* Pilih Produk */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
              Produk Busana
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={Boolean(preselectedProductId)}
              className="w-full h-9 rounded-lg border border-black/20 bg-white px-3 text-xs text-black focus:border-black focus:outline-none transition-colors disabled:bg-black/[0.03]"
            >
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.title} ({p.edition || 'Koleksi'})
                </option>
              ))}
            </select>
          </div>

          {/* Warna & Hex */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
                Nama Warna
              </label>
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="cth. Obsidian Black, Dusty Rose"
                className="w-full h-9 rounded-lg border border-black/20 bg-white px-3 text-xs text-black focus:border-black focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
                Palet / Hex
              </label>
              <div className="flex items-center gap-1.5 h-9 rounded-lg border border-black/20 bg-white px-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                />
                <span className="font-mono text-[10px] text-black/70 uppercase">
                  {colorHex}
                </span>
              </div>
            </div>
          </div>

          {/* Ukuran (Size) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1.5">
              Ukuran (Size)
            </label>
            <div className="flex items-center gap-2">
              {['S', 'M', 'L', 'XL', 'ALL'].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSize(sz)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition active:scale-95 text-center ${
                    size === sz
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'border-black/20 bg-white text-black/70 hover:bg-black/5'
                  }`}
                >
                  {sz === 'ALL' ? 'All Size' : sz}
                </button>
              ))}
            </div>
          </div>

          {/* Stok Awal Fisik */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
              Stok Awal Fisik (pcs)
            </label>
            <input
              type="number"
              min={0}
              value={initialStock}
              onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="0"
              className="w-full h-9 rounded-lg border border-black/20 bg-white px-3 text-xs text-black focus:border-black focus:outline-none font-semibold"
            />
            <p className="text-[10px] text-black/40 mt-1">
              Jika stok dimasukkan &gt; 0, riwayat mutasi masuk otomatis dicatat atas nama produksi.
            </p>
          </div>

          {/* Preview SKU Card */}
          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3">
            <span className="text-[10px] uppercase font-bold text-black/50 tracking-wider block">
              Pratinjau SKU Terstandarisasi
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                style={{ backgroundColor: colorHex }}
              />
              <span className="font-mono text-xs font-bold text-black">
                {previewSku}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-semibold text-black/70 hover:bg-black/5 hover:text-black transition active:scale-95 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !colorName.trim()}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-1.5 text-xs font-semibold text-white transition active:scale-95 cursor-pointer ${
                loading || !colorName.trim()
                  ? 'bg-black/20 cursor-not-allowed text-white/80'
                  : 'bg-black hover:bg-black/85 shadow-xs'
              }`}
            >
              {loading ? (
                <>
                  <Icon name="refresh" size={13} className="animate-spin" />
                  <span>Menambahkan...</span>
                </>
              ) : (
                <>
                  <Icon name="check" size={13} />
                  <span>Simpan Varian Baru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
