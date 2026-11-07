'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { QuickAddModal } from './QuickAddModal';

export interface Product {
  id: string;
  slug: string;
  title: string;
  edition?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  image: string;
  images?: string[];
  category?: string;
  inStock?: boolean;
  stock?: number;
  swatches: { name: string; color: string; image?: string }[];
  sizes?: string[];
  fabric?: string;
  material?: string;
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { t, formatPrice } = useLanguage();
  const [selectedSwatch, setSelectedSwatch] = useState<string | null>(null);
  const [hoveredSwatch, setHoveredSwatch] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const swatchesCount = product.swatches?.length || 0;
  const isOutOfStock =
    product.inStock === false ||
    (typeof product.stock === 'number' && product.stock <= 0);

  // Swatch aktif: prioritas ke swatch yang di-hover oleh kursor, lalu swatch yang diklik/dipilih
  const activeSwatch = hoveredSwatch
    ? product.swatches?.find((s) => s.name === hoveredSwatch)
    : selectedSwatch
    ? product.swatches?.find((s) => s.name === selectedSwatch)
    : null;

  const currentActiveName = activeSwatch?.name || product.swatches?.[0]?.name;

  // Foto yang ditampilkan: jika swatch dipilih & punya foto valid, tampilkan; jika tidak punya foto sendiri, pakai gambar dari list images; jika tidak, tampilkan foto utama produk
  const validSwatchImage =
    activeSwatch?.image && !activeSwatch.image.includes('logo_ibey') && activeSwatch.image.trim() !== ''
      ? activeSwatch.image
      : undefined;

  const swatchFallbackImage =
    activeSwatch && product.images && product.images.length > 0
      ? product.images[Math.max(0, product.swatches.findIndex((s) => s.name === activeSwatch.name)) % product.images.length]
      : undefined;

  const targetDisplayImage = validSwatchImage || swatchFallbackImage || product.image || '/images/catalog/catalog-01.jpg';

  const [imageError, setImageError] = useState<string | null>(null);

  // Reset error jika target gambar berganti
  useEffect(() => {
    setImageError(null);
  }, [targetDisplayImage]);

  const displayImage = (imageError && imageError === targetDisplayImage)
    ? (product.image || '/images/catalog/catalog-01.jpg')
    : targetDisplayImage;

  // Format gambar: Supabase dan Unsplash didukung langsung oleh Next.js optimizer (WebP otomatis)
  const isOptimizableRemote =
    !displayImage.startsWith('http') ||
    displayImage.includes('supabase.co') ||
    displayImage.includes('unsplash.com') ||
    displayImage.includes('googleusercontent.com');
  const shouldBeUnoptimized = !isOptimizableRemote;

  // Foto kedua saat hover (hanya jika produk tidak memiliki banyak swatch warna)
  const secondaryImage =
    swatchesCount <= 1 && product.images && product.images.length > 1
      ? product.images[1]
      : null;

  const currentSelectedColor = currentActiveName || 'Standard';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      showToast('Mohon maaf, produk ini sedang habis (Out of Stock).');
      return;
    }

    setIsQuickAddOpen(true);
  };

  return (
    <article
      className="group relative flex flex-col bg-transparent"
      onPointerLeave={() => setHoveredSwatch(null)}
      onMouseLeave={() => setHoveredSwatch(null)}
    >
      {/* Product Image Frame: 2:3 Portrait Aspect Ratio — clean subtle backdrop, zero gray flash */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#F6F4F0]">
        {/* Soft luxury linen shimmer placeholder while image is downloading */}
        <div
          className={`absolute inset-0 z-0 bg-[#F6F4F0] transition-opacity duration-500 ease-out ${
            isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-hidden="true"
        >
          <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-black/[0.03] to-transparent" />
        </div>

        <Link
          href={`/product/${product.slug}${currentActiveName ? `?color=${encodeURIComponent(currentActiveName)}` : ''}`}
          prefetch={true}
          className="relative block h-full w-full"
        >
          {/* Badge */}
          {product.badge && (
            <span
              className={`absolute top-3 left-3 z-10 px-2.5 py-1 text-[8px] sm:text-[8.5px] font-medium tracking-[0.22em] uppercase backdrop-blur-xs shadow-xs transition-colors ${
                product.badge.toLowerCase().includes('best')
                  ? 'bg-[#1C1917]/95 text-[#FBF9F5] border border-white/20'
                  : product.badge.toLowerCase().includes('trend')
                  ? 'bg-[#FAF8F5]/95 text-[#2C2723] border border-[#DDD5C7]'
                  : 'bg-[#1C1917]/95 text-[#FBF9F5] border border-white/20'
              }`}
            >
              <span className="mr-1 text-[9px] opacity-75">✦</span>
              {product.badge}
            </span>
          )}

          {/* Out of Stock indicator badge */}
          {isOutOfStock && (
            <span className="absolute top-3 right-3 z-10 rounded-full bg-black/75 px-2.5 py-1 text-[8px] sm:text-[8.5px] font-medium tracking-[0.2em] text-white uppercase backdrop-blur-xs shadow-xs">
              Out of Stock
            </span>
          )}

          {/* Primary Product Image — smoothly transitions on swatch change */}
          <Image
            src={displayImage}
            alt={`${product.title} - ${currentActiveName || 'Busana'}`}
            fill
            priority={priority}
            unoptimized={shouldBeUnoptimized}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              // Jika foto varian corrupt/404, otomatis fallback ke foto produk utama
              setImageError(displayImage);
              setIsLoaded(true);
            }}
            className={`pointer-events-none select-none object-cover transition-all duration-300 ease-out ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-90 scale-[1.01]'
            } ${isOutOfStock ? 'grayscale-[15%] opacity-90' : ''} ${
              secondaryImage
                ? 'group-hover:opacity-0 group-hover:scale-105'
                : 'group-hover:scale-105'
            }`}
            draggable={false}
          />

          {/* Secondary Image on Hover (only when no multiple color swatches) */}
          {secondaryImage && !isOutOfStock && (
            <Image
              src={secondaryImage}
              alt={`${product.title} alternate view`}
              fill
              unoptimized={!secondaryImage.startsWith('/') && !secondaryImage.includes('supabase.co')}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="pointer-events-none select-none object-cover opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-105"
              draggable={false}
            />
          )}
        </Link>

        {/* Floating Quick Buy Circle Button (Hanya aktif jika barang tersedia) */}
        {!isOutOfStock ? (
          <button
            type="button"
            aria-label={t('product.quick_add')}
            onClick={handleQuickAdd}
            className="absolute right-3 bottom-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-md transition-all duration-300 hover:scale-110 hover:bg-black hover:text-white active:scale-95 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 cursor-pointer"
            title={t('product.quick_add')}
          >
            <Icon name="add" size={18} />
          </button>
        ) : (
          <div
            className="absolute right-3 bottom-3 z-20 flex h-7 items-center justify-center rounded-full bg-[#1C1917]/85 backdrop-blur-xs px-2.5 text-[8.5px] font-medium tracking-wider text-white/90 uppercase shadow-xs sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
          >
            Habis
          </div>
        )}
      </div>

      {/* Typography & Price below image */}
      <div className="flex flex-col items-center pt-3 pb-1 sm:pt-3.5 sm:pb-2 text-center">
        <Link
          href={`/product/${product.slug}${currentActiveName ? `?color=${encodeURIComponent(currentActiveName)}` : ''}`}
          className="w-full"
        >
          <h3 className="line-clamp-1 font-sans text-[9px] font-medium tracking-[0.14em] text-black uppercase transition-colors hover:opacity-70 sm:text-[10px]">
            {product.title}
          </h3>
        </Link>
        <div className="mt-1 flex items-baseline justify-center gap-2">
          <p className="font-sans text-[9px] font-normal text-black sm:text-[10px]">
            {formatPrice(product.price)}
          </p>
          {product.originalPrice && product.originalPrice > product.price && (
            <p className="font-sans text-[8px] text-black/50 line-through sm:text-[9px]">
              {formatPrice(product.originalPrice)}
            </p>
          )}
        </div>

        {/* Color Swatches below price — synchronized with cycling image */}
        {product.swatches && product.swatches.length > 0 && (
          <div className="mt-1.5 flex flex-col items-center">
            {/* Color name feedback */}
            <span className="text-[7.5px] sm:text-[8px] font-normal tracking-[0.16em] uppercase text-black/50 h-3">
              {currentActiveName || ''}
            </span>

            {/* Swatch dots container */}
            <div
              className="mt-0.5 flex items-center justify-center gap-0.5"
              onPointerLeave={() => setHoveredSwatch(null)}
              onMouseLeave={() => setHoveredSwatch(null)}
            >
              {product.swatches.map((swatch) => {
                const isSelected = swatch.name === currentActiveName;
                return (
                  <button
                    key={swatch.name}
                    type="button"
                    title={swatch.name}
                    aria-label={swatch.name}
                    onPointerEnter={() => setHoveredSwatch(swatch.name)}
                    onMouseEnter={() => setHoveredSwatch(swatch.name)}
                    onFocus={() => setHoveredSwatch(swatch.name)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSwatch((prev) => (prev === swatch.name ? null : swatch.name));
                      setHoveredSwatch(swatch.name);
                    }}
                    className="group/swatch relative p-1 cursor-pointer flex items-center justify-center outline-none"
                  >
                    <span
                      className={`block h-3.5 w-3.5 rounded-full transition-all duration-200 ${
                        isSelected
                          ? 'scale-110 outline outline-1.5 outline-black outline-offset-1.5 opacity-100 shadow-xs'
                          : 'opacity-70 outline outline-1 outline-black/15 group-hover/swatch:opacity-100 group-hover/swatch:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Add / Select Options Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        product={product}
        initialColor={currentActiveName}
      />
    </article>
  );
}
