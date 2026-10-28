'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
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
  const [selectedSwatch, setSelectedSwatch] = useState(product.swatches[0]?.name || '');

  const activeSwatch = product.swatches.find((s) => s.name === selectedSwatch);
  const displayImage = activeSwatch?.image || product.image;
  // If product has multiple images, use the secondary image on hover (Tazalabel style)
  const secondaryImage =
    product.images && product.images.length > 1
      ? product.images[1]
      : product.images && product.images[0] !== displayImage
      ? product.images[0]
      : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.slug,
      title: product.title,
      edition: product.edition || 'Sevilla Cupro',
      price: product.price,
      originalPrice: product.originalPrice,
      color: selectedSwatch,
      size: 'S–M',
      image: displayImage,
      quantity: 1,
    });
    showToast(`Ditambahkan ${product.title} (${selectedSwatch}) ke tas`);
  };

  const formatPrice = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  return (
    <article className="group relative flex flex-col bg-transparent">
      {/* Product Image Frame: 2:3 Portrait Aspect Ratio (Tazalabel abaya silhouette standard) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/5">
        <Link href={`/product/${product.slug}`} className="relative block h-full w-full">
          {/* Badge */}
          {product.badge && (
            <span className="absolute top-3 left-3 z-10 bg-black px-2.5 py-1 text-[8px] font-medium tracking-widest text-white uppercase">
              {product.badge}
            </span>
          )}

          {/* Primary Product Image */}
          <Image
            src={displayImage}
            alt={`${product.title} - ${selectedSwatch}`}
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 25vw"
            className={`pointer-events-none select-none object-cover transition-all duration-700 ease-out ${
              secondaryImage
                ? 'group-hover:opacity-0 group-hover:scale-105'
                : 'group-hover:scale-105'
            }`}
            draggable={false}
          />

          {/* Secondary Image on Hover (Tazalabel luxury flip effect) */}
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.title} alternate view`}
              fill
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 25vw"
              className="pointer-events-none select-none object-cover opacity-0 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-105"
              draggable={false}
            />
          )}
        </Link>

        {/* Floating Quick Buy Circle Button (Tazalabel signature) */}
        <button
          type="button"
          aria-label={`Tambah ${product.title} ke tas`}
          onClick={handleQuickAdd}
          className="absolute right-3 bottom-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-md transition-all duration-300 hover:scale-110 hover:bg-black hover:text-white active:scale-95 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
          title="Quick Add"
        >
          <Icon name="add" size={18} />
        </button>
      </div>

      {/* Typography & Price below image (Tazalabel centered layout) */}
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

        {/* Color Swatches below price (Tazalabel centered swatches) */}
        {product.swatches && product.swatches.length > 0 && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5">
            {product.swatches.map((swatch) => (
              <button
                key={swatch.name}
                type="button"
                title={swatch.name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedSwatch(swatch.name);
                }}
                className={`h-3.5 w-3.5 rounded-full transition-all ${
                  selectedSwatch === swatch.name
                    ? 'scale-110 ring-1 ring-black ring-offset-1'
                    : 'opacity-70 ring-1 ring-black/10 hover:opacity-100'
                }`}
                style={{ backgroundColor: swatch.color }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
