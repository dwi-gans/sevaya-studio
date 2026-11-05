'use client';

import React, { useState, useEffect } from 'react';
import { ProductVariant, MutationType, MutationReason } from '@/integrations/supabase';
import { Icon } from '@/components/ui/Icon';

interface StockMutationModalProps {
  variant: ProductVariant;
  availableVariants?: ProductVariant[];
  defaultType?: MutationType;
  onClose: () => void;
  onSuccess: (updatedVariant: ProductVariant, totalProductStock?: number) => void;
}

export const REASON_LABELS: Record<MutationReason, string> = {
  RESTOCK_PRODUCTION: 'Produksi Masuk (Gudang)',
  CUSTOMER_ORDER: 'Penjualan / Pesanan Pelanggan',
  CUSTOMER_RETURN: 'Retur dari Pelanggan',
  DAMAGE_DEFECT: 'Barang Cacat / Reject',
  SAMPLE_MARKETING: 'Sampel Foto & Promosi',
  STOCK_OPNAME: 'Penyesuaian Stok Opname',
  OTHER: 'Lainnya / Catatan Khusus',
};

const REASON_OPTIONS_BY_TYPE: Record<MutationType, MutationReason[]> = {
  in: ['RESTOCK_PRODUCTION', 'CUSTOMER_RETURN', 'OTHER'],
  out: ['CUSTOMER_ORDER', 'DAMAGE_DEFECT', 'SAMPLE_MARKETING', 'OTHER'],
  adjustment: ['STOCK_OPNAME', 'OTHER'],
};

export default function StockMutationModal({
  variant,
  availableVariants,
  defaultType = 'in',
  onClose,
  onSuccess,
}: StockMutationModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variant);
  const [type, setType] = useState<MutationType>(defaultType);
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<MutationReason>(
    REASON_OPTIONS_BY_TYPE[defaultType][0] || 'OTHER'
  );
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVariant(variant);
  }, [variant]);

  const qty = parseInt(quantity, 10);
  const isValidQty = !isNaN(qty) && qty > 0;

  // Preview stok baru berdasarkan varian yang sedang dipilih
  const previewStock = (() => {
    if (!isValidQty) return selectedVariant.stock;
    if (type === 'in') return selectedVariant.stock + qty;
    if (type === 'out') return Math.max(0, selectedVariant.stock - qty);
    if (type === 'adjustment') return Math.max(0, qty);
    return selectedVariant.stock;
  })();

  const handleTypeChange = (newType: MutationType) => {
    setType(newType);
    const firstReason = REASON_OPTIONS_BY_TYPE[newType][0];
    if (firstReason) setReason(firstReason);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidQty) {
      setError('Masukkan jumlah unit yang valid (angka positif).');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/inventory/mutate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'sevaya-admin',
        },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          type,
          quantity: qty,
          reason,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan mutasi stok.');
      }

      onSuccess(json.variant as ProductVariant, json.totalProductStock as number | undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const stockDelta = previewStock - selectedVariant.stock;
  const deltaLabel = stockDelta === 0 ? '' : stockDelta > 0 ? `+${stockDelta}` : `${stockDelta}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-black/15 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 sm:px-6 py-3.5 shrink-0">
          <div className="min-w-0 pr-2">
            <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
              Mutasi Stok Fisik
            </span>
            <h3 className="font-headline text-sm sm:text-base font-bold text-black truncate">
              {type === 'in' ? 'Tambah Stok Masuk' : type === 'out' ? 'Catat Stok Keluar' : 'Penyesuaian Stok Opname'}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                style={{ background: selectedVariant.colorHex }}
              />
              <span className="text-xs text-black/70 font-medium truncate">
                {selectedVariant.productTitle} · {selectedVariant.colorName} (Size {selectedVariant.size})
              </span>
              <span className="text-[10px] font-mono text-black/40">#{selectedVariant.sku}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/60 hover:bg-black/5 hover:text-black transition-colors"
            aria-label="Tutup Form Mutasi"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4 text-xs">
          {/* Pilihan Ukuran (Size Selector) - Hanya jika ada varian ukuran lain */}
          {availableVariants && availableVariants.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                  Pilih Ukuran (Size)
                </label>
                <span className="text-[10px] text-black/40">
                  Warna: <span className="font-semibold text-black/70">{selectedVariant.colorName}</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {availableVariants.map((v) => {
                  const isSelected = v.id === selectedVariant.id;
                  const vStatus = v.stock === 0 ? 'out' : v.stock <= (v.lowStockThreshold ?? 3) ? 'low' : 'ready';
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-center transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-xs font-bold'
                          : 'bg-white border-black/15 text-black/80 hover:bg-black/5 font-medium'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wide">Size {v.size}</span>
                      <span className={`text-[10px] mt-0.5 ${
                        isSelected
                          ? 'text-white/80'
                          : vStatus === 'out'
                          ? 'text-rose-600 font-semibold'
                          : vStatus === 'low'
                          ? 'text-amber-700 font-semibold'
                          : 'text-black/50'
                      }`}>
                        {v.stock} pcs
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stok Saat Ini & Preview */}
          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-black/10 bg-black/[0.02] p-3">
            <div>
              <span className="text-[10px] uppercase font-semibold text-black/50 tracking-wider block">
                Stok Saat Ini (Size {selectedVariant.size})
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-black tabular-nums">{selectedVariant.stock}</span>
                <span className="text-[11px] text-black/50">pcs</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-black/50 tracking-wider block">
                Setelah Mutasi
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-xl font-bold tabular-nums ${
                  previewStock === 0 ? 'text-red-600' : previewStock <= (selectedVariant.lowStockThreshold ?? 3) ? 'text-amber-600' : 'text-emerald-700'
                }`}>
                  {previewStock}
                </span>
                <span className="text-[11px] text-black/50">pcs</span>
                {isValidQty && deltaLabel && (
                  <span className={`text-[10px] font-semibold ml-1 ${stockDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ({deltaLabel})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tipe Mutasi Pills */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1.5">
              Jenis Perubahan Stok
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleTypeChange('in')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition active:scale-95 text-center cursor-pointer ${
                  type === 'in'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white border-black/15 text-black/70 hover:bg-black/5'
                }`}
              >
                + Stok Masuk
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('out')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition active:scale-95 text-center cursor-pointer ${
                  type === 'out'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                    : 'bg-white border-black/15 text-black/70 hover:bg-black/5'
                }`}
              >
                − Stok Keluar
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('adjustment')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition active:scale-95 text-center cursor-pointer ${
                  type === 'adjustment'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white border-black/15 text-black/70 hover:bg-black/5'
                }`}
              >
                Penyesuaian
              </button>
            </div>
          </div>

          {/* Input Jumlah Unit */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
              {type === 'adjustment' ? 'Stok Fisik Aktual (Langsung Timpa)' : 'Jumlah Unit (pcs)'}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={type === 'adjustment' ? 'Contoh: 15' : 'Contoh: 10'}
              className="w-full h-9 rounded-lg border border-black/20 bg-white px-3 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none transition-colors"
              required
              autoFocus
            />
          </div>

          {/* Alasan Dropdown */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
              Alasan Perubahan
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as MutationReason)}
              className="w-full h-9 rounded-lg border border-black/20 bg-white px-3 text-xs text-black focus:border-black focus:outline-none transition-colors"
            >
              {REASON_OPTIONS_BY_TYPE[type].map((r) => (
                <option key={r} value={r}>
                  {REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {/* No Referensi */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
              No. Referensi / Resi / PO <span className="font-normal lowercase text-black/40">(opsional)</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Contoh: PO-2026-03, RESI-12345, SO-MARET"
              className="w-full h-9 rounded-lg border border-black/20 bg-white px-3 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none transition-colors"
            />
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
              Catatan Keterangan <span className="font-normal lowercase text-black/40">(opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan keterangan singkat untuk arsip gudang..."
              rows={2}
              className="w-full rounded-lg border border-black/20 bg-white p-2.5 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none transition-colors resize-none"
            />
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
              disabled={loading || !isValidQty}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-1.5 text-xs font-semibold text-white transition active:scale-95 cursor-pointer ${
                loading || !isValidQty
                  ? 'bg-black/20 cursor-not-allowed text-white/80'
                  : 'bg-black hover:bg-black/85 shadow-xs'
              }`}
            >
              {loading ? (
                <>
                  <Icon name="refresh" size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Icon name="check" size={13} />
                  <span>Simpan Perubahan Stok</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
