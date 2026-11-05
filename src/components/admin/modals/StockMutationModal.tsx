'use client';

import React, { useState } from 'react';
import { ProductVariant, MutationType, MutationReason } from '@/integrations/supabase';

interface StockMutationModalProps {
  variant: ProductVariant;
  defaultType?: MutationType;
  onClose: () => void;
  onSuccess: (updatedVariant: ProductVariant) => void;
}

const REASON_LABELS: Record<MutationReason, string> = {
  RESTOCK_PRODUCTION: 'Hasil Produksi / Konveksi',
  CUSTOMER_ORDER: 'Penjualan Pesanan Pelanggan',
  CUSTOMER_RETURN: 'Retur dari Pelanggan',
  DAMAGE_DEFECT: 'Cacat Kain / Barang Reject',
  SAMPLE_MARKETING: 'Sampel Photoshoot / Endorse',
  STOCK_OPNAME: 'Penyesuaian Stok Opname',
  OTHER: 'Lainnya',
};

const REASON_OPTIONS_BY_TYPE: Record<MutationType, MutationReason[]> = {
  in: ['RESTOCK_PRODUCTION', 'CUSTOMER_RETURN', 'OTHER'],
  out: ['CUSTOMER_ORDER', 'DAMAGE_DEFECT', 'SAMPLE_MARKETING', 'OTHER'],
  adjustment: ['STOCK_OPNAME', 'OTHER'],
};

export default function StockMutationModal({
  variant,
  defaultType = 'in',
  onClose,
  onSuccess,
}: StockMutationModalProps) {
  const [type, setType] = useState<MutationType>(defaultType);
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<MutationReason>('OTHER');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = parseInt(quantity, 10);
  const isValidQty = !isNaN(qty) && qty > 0;

  // Preview stok baru
  const previewStock = (() => {
    if (!isValidQty) return variant.stock;
    if (type === 'in') return variant.stock + qty;
    if (type === 'out') return Math.max(0, variant.stock - qty);
    if (type === 'adjustment') return Math.max(0, qty);
    return variant.stock;
  })();

  // Auto-set reason pertama yang relevan saat tipe berubah
  const handleTypeChange = (newType: MutationType) => {
    setType(newType);
    const firstReason = REASON_OPTIONS_BY_TYPE[newType][0];
    if (firstReason) setReason(firstReason);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidQty) {
      setError('Jumlah unit harus angka positif.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/inventory/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: variant.id,
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

      onSuccess(json.variant as ProductVariant);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const stockDelta = previewStock - variant.stock;
  const deltaLabel = stockDelta === 0 ? '' : stockDelta > 0 ? `+${stockDelta}` : `${stockDelta}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <div>
            <p className="text-xs text-black/40 font-mono uppercase tracking-widest">Mutasi Stok</p>
            <h2 className="text-sm font-semibold text-black mt-0.5">{variant.productTitle}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-block w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                style={{ background: variant.colorHex }}
              />
              <span className="text-xs text-black/50">{variant.colorName} · Size {variant.size}</span>
              <span className="text-xs font-mono text-black/30">#{variant.sku}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-black/30 hover:text-black transition-colors"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Stok Saat Ini */}
          <div className="flex items-center justify-between bg-black/[0.03] rounded-lg px-4 py-3">
            <span className="text-xs text-black/50">Stok Saat Ini</span>
            <span className="text-2xl font-semibold text-black tabular-nums">{variant.stock} <span className="text-sm font-normal text-black/40">pcs</span></span>
          </div>

          {/* Tipe Mutasi */}
          <div>
            <label className="block text-xs font-medium text-black/50 mb-2 uppercase tracking-widest">Jenis Perubahan</label>
            <div className="grid grid-cols-3 gap-2">
              {(['in', 'out', 'adjustment'] as MutationType[]).map((t) => {
                const labels = { in: '+ Stok Masuk', out: '− Stok Keluar', adjustment: '= Penyesuaian' };
                const colors = {
                  in: type === 'in' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-black/15 text-black/60 hover:border-black/30',
                  out: type === 'out' ? 'bg-red-600 text-white border-red-600' : 'border-black/15 text-black/60 hover:border-black/30',
                  adjustment: type === 'adjustment' ? 'bg-amber-500 text-white border-amber-500' : 'border-black/15 text-black/60 hover:border-black/30',
                };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`text-xs font-medium py-2 px-3 rounded-lg border transition-all ${colors[t]}`}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jumlah Unit */}
          <div>
            <label className="block text-xs font-medium text-black/50 mb-2 uppercase tracking-widest">
              {type === 'adjustment' ? 'Stok Aktual (Langsung Set)' : 'Jumlah Unit'}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={type === 'adjustment' ? 'Masukkan stok aktual...' : 'Jumlah unit...'}
              className="w-full border border-black/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black/40 transition-colors"
              required
            />
            {/* Preview */}
            {isValidQty && (
              <div className={`mt-2 flex items-center justify-between text-xs rounded-md px-3 py-2 ${
                type === 'in' ? 'bg-emerald-50 text-emerald-700' :
                type === 'out' ? 'bg-red-50 text-red-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                <span>Stok setelah perubahan</span>
                <span className="font-semibold tabular-nums">
                  {previewStock} pcs {deltaLabel && <span className="opacity-60">({deltaLabel})</span>}
                </span>
              </div>
            )}
          </div>

          {/* Alasan */}
          <div>
            <label className="block text-xs font-medium text-black/50 mb-2 uppercase tracking-widest">Alasan</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as MutationReason)}
              className="w-full border border-black/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black/40 transition-colors bg-white"
            >
              {REASON_OPTIONS_BY_TYPE[type].map((r) => (
                <option key={r} value={r}>{REASON_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* No Referensi (opsional) */}
          <div>
            <label className="block text-xs font-medium text-black/50 mb-2 uppercase tracking-widest">
              No. Referensi / PO <span className="normal-case font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="cth. PO-2026-001, INV-00123..."
              className="w-full border border-black/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black/40 transition-colors"
            />
          </div>

          {/* Catatan (opsional) */}
          <div>
            <label className="block text-xs font-medium text-black/50 mb-2 uppercase tracking-widest">
              Catatan <span className="normal-case font-normal">(opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan untuk admin..."
              rows={2}
              className="w-full border border-black/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black/40 transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 text-xs rounded-lg px-4 py-3 border border-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-black/15 rounded-lg text-black/60 hover:border-black/30 hover:text-black transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !isValidQty}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                loading || !isValidQty
                  ? 'bg-black/20 text-white cursor-not-allowed'
                  : 'bg-black text-white hover:bg-black/80'
              }`}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  Simpan Mutasi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
