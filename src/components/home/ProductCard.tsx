'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Icon } from '@/components/ui/Icon';

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
  swatches: { name: string; color: string; image?: string }[];
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { t, formatPrice } = useLanguage();
  const [selectedSwatch, setSelectedSwatch] = useState<string | null>(null);
  const [hoveredSwatch, setHoveredSwatch] = useState<string | null>(null);
  const [activeSwatchIndex, setActiveSwatchIndex] = useState(0);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const swatchesCount = product.swatches?.length || 0;

  // Auto-cycle through swatches every 3.5 seconds
  useEffect(() => {
    // Stop auto-cycling if:
    // 1. Product has 0 or 1 swatch
    // 2. User clicked/locked a specific swatch
    // 3. User is hovering a swatch dot
    // 4. User is hovering the product card
    if (swatchesCount <= 1 || selectedSwatch !== null || hoveredSwatch !== null || isCardHovered) {
      return;
    }

    const interval = setInterval(() => {
      setActiveSwatchIndex((prev) => (prev + 1) % swatchesCount);
    }, 3500);

    return () => clearInterval(interval);
  }, [swatchesCount, selectedSwatch, hoveredSwatch, isCardHovered]);

  // Determine active swatch:
  // 1. Swatch currently hovered by user
  // 2. Swatch clicked/locked by user
  // 3. Current auto-cycled swatch from interval
  const activeSwatch = hoveredSwatch
    ? product.swatches.find((s) => s.name === hoveredSwatch)
    : selectedSwatch
    ? product.swatches.find((s) => s.name === selectedSwatch)
    : product.swatches && product.swatches.length > 0
    ? product.swatches[activeSwatchIndex % product.swatches.length]
    : null;

  const currentActiveName = activeSwatch?.name || product.swatches?.[0]?.name;

  // Always show the photo matching the active color swatch
  const displayImage = activeSwatch?.image || product.image;

  // Track previous image for ultra-smooth backdrop crossfade without any blank/gray flash
  const [underlyingImage, setUnderlyingImage] = useState(product.image);
  useEffect(() => {
    const timer = setTimeout(() => {
      setUnderlyingImage(displayImage);
    }, 400);
    return () => clearTimeout(timer);
  }, [displayImage]);

  // Only show secondary hover image if product has no multiple swatches to cycle through
  const secondaryImage =
    swatchesCount <= 1 && product.images && product.images.length > 1
      ? product.images[1]
      : null;

  const currentSelectedColor = currentActiveName || 'Standard';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.slug,
      title: product.title,
      edition: product.edition || 'Sevilla Cupro',
      price: product.price,
      originalPrice: product.originalPrice,
      color: currentSelectedColor,
      size: 'S–M',
      image: displayImage,
      quantity: 1,
    });
    showToast(t('product.added_to_bag', { title: product.title, color: currentSelectedColor }));
  };

  return (
    <article
      className="group relative flex flex-col bg-transparent"
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => {
        setIsCardHovered(false);
        setHoveredSwatch(null);
      }}
    >
      {/* Product Image Frame: 2:3 Portrait Aspect Ratio — clean subtle backdrop, zero gray flash */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#FBFBFB]">
        <Link href={`/product/${product.slug}`} prefetch={true} className="relative block h-full w-full">
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

          {/* Underlying image prevents any blank/gray flash during image switching */}
          {underlyingImage && underlyingImage !== displayImage && (
            <Image
              src={underlyingImage}
              alt={product.title}
              fill
              unoptimized={underlyingImage.startsWith('http')}
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 25vw"
              className="pointer-events-none select-none object-cover"
              draggable={false}
            />
          )}

          {/* Primary Product Image — smoothly updates as color cycles or on interaction */}
          <Image
            src={displayImage}
            alt={`${product.title} - ${currentActiveName}`}
            fill
            unoptimized={displayImage.startsWith('http')}
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 25vw"
            className={`pointer-events-none select-none object-cover transition-all duration-500 ease-out ${
              secondaryImage
                ? 'group-hover:opacity-0 group-hover:scale-105'
                : 'group-hover:scale-105'
            }`}
            draggable={false}
          />

          {/* Secondary Image on Hover (only when no multiple color swatches) */}
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.title} alternate view`}
              fill
              unoptimized={secondaryImage.startsWith('http')}
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 25vw"
              className="pointer-events-none select-none object-cover opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-105"
              draggable={false}
            />
          )}
        </Link>

        {/* Floating Quick Buy Circle Button */}
        <button
          type="button"
          aria-label={t('product.quick_add')}
          onClick={handleQuickAdd}
          className="absolute right-3 bottom-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-md transition-all duration-300 hover:scale-110 hover:bg-black hover:text-white active:scale-95 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
          title={t('product.quick_add')}
        >
          <Icon name="add" size={18} />
        </button>
      </div>

      {/* Typography & Price below image */}
      <div className="flex flex-col items-center pt-3.5 pb-2 text-center">
        <Link href={`/product/${product.slug}`} className="w-full">
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
          <div
            className="mt-2.5 flex items-center justify-center gap-1.5"
            onMouseLeave={() => setHoveredSwatch(null)}
          >
            {product.swatches.map((swatch, idx) => {
              const isSelected = swatch.name === currentActiveName;
              return (
                <button
                  key={swatch.name}
                  type="button"
                  title={swatch.name}
                  aria-label={swatch.name}
                  onMouseEnter={() => setHoveredSwatch(swatch.name)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectedSwatch === swatch.name) {
                      // Click again to unlock auto-cycling
                      setSelectedSwatch(null);
                    } else {
                      setSelectedSwatch(swatch.name);
                      setActiveSwatchIndex(idx);
                    }
                    setHoveredSwatch(null);
                  }}
                  className={`h-3.5 w-3.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'scale-110 ring-1 ring-black ring-offset-1 opacity-100'
                      : 'opacity-70 ring-1 ring-black/10 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                />
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
