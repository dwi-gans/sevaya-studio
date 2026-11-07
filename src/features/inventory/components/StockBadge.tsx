import React from 'react';

export type StockStatus = 'ready' | 'low' | 'out';

export function getStockStatus(stock: number, lowThreshold = 3): StockStatus {
  if (stock <= 0) return 'out';
  if (stock <= lowThreshold) return 'low';
  return 'ready';
}

export interface StockBadgeProps {
  stock: number;
  lowThreshold?: number;
  className?: string;
  showCount?: boolean;
}

const BADGE_CONFIG: Record<StockStatus, { label: string; className: string }> = {
  ready: {
    label: 'Tersedia',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
  },
  low: {
    label: 'Stok Terbatas',
    className: 'bg-amber-50 text-amber-800 border-amber-200/70',
  },
  out: {
    label: 'Habis',
    className: 'bg-rose-50 text-rose-800 border-rose-200/70',
  },
};

/**
 * Standard StockBadge component for catalog, product card, modal, or admin views.
 */
export function StockBadge({
  stock,
  lowThreshold = 3,
  className = '',
  showCount = false,
}: StockBadgeProps) {
  const status = getStockStatus(stock, lowThreshold);
  const config = BADGE_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.className} ${className}`}
    >
      <span>{config.label}</span>
      {showCount && <span className="font-mono">({stock})</span>}
    </span>
  );
}

export default StockBadge;
