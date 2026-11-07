import React from 'react';

export interface PriceTagProps {
  price: number;
  originalPrice?: number;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showDiscountBadge?: boolean;
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const SIZE_STYLES = {
  xs: { current: 'text-[11px] font-semibold', original: 'text-[10px]', badge: 'text-[8px] px-1 py-0.2' },
  sm: { current: 'text-xs font-semibold', original: 'text-[11px]', badge: 'text-[9px] px-1.5 py-0.5' },
  md: { current: 'text-sm font-bold', original: 'text-xs', badge: 'text-[10px] px-1.5 py-0.5' },
  lg: { current: 'text-base font-bold', original: 'text-sm', badge: 'text-[11px] px-2 py-0.5' },
  xl: { current: 'text-xl sm:text-2xl font-bold', original: 'text-base', badge: 'text-xs px-2.5 py-1' },
};

/**
 * Standard PriceTag used across ProductCard, QuickAdd, Detail, Cart, and Admin.
 * Handles original strikethrough price and discount percentage cleanly.
 */
export function PriceTag({
  price,
  originalPrice,
  className = '',
  size = 'md',
  showDiscountBadge = true,
}: PriceTagProps) {
  const hasDiscount = Boolean(originalPrice && originalPrice > price);
  const discountPercent = hasDiscount && originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const styles = SIZE_STYLES[size];

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span className={`text-black font-headline ${styles.current}`}>
        {formatIDR(price)}
      </span>

      {hasDiscount && originalPrice && (
        <span className={`text-black/40 line-through ${styles.original}`}>
          {formatIDR(originalPrice)}
        </span>
      )}

      {hasDiscount && showDiscountBadge && discountPercent > 0 && (
        <span className={`rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 font-bold uppercase tracking-wider ${styles.badge}`}>
          -{discountPercent}%
        </span>
      )}
    </div>
  );
}

export default PriceTag;
