'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { StudioImage } from '@/components/common';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Product } from '@/components/home/ProductCard';
import { ProductVariant } from '@/integrations/supabase';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  initialColor?: string;
}

export function QuickAddModal({
  isOpen,
  onClose,
  product,
  initialColor,
}: QuickAddModalProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { formatPrice } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Mouse drag-to-scroll state for photo gallery
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const [photoStartX, setPhotoStartX] = useState(0);
  const [photoScrollLeft, setPhotoScrollLeft] = useState(0);
  const [hasPhotoDragged, setHasPhotoDragged] = useState(false);

  const photoScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizes = useMemo(() => {
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes;
    }
    return ['S', 'M', 'L', 'XL'];
  }, [product.sizes]);

  const swatches = useMemo(() => {
    return product.swatches && product.swatches.length > 0
      ? product.swatches
      : [{ name: 'Standard', color: '#1A1A1A', image: product.image }];
  }, [product.swatches, product.image]);

  // Active swatch
  const activeSwatch = useMemo(() => {
    return (
      swatches.find(
        (s) => s.name.trim().toLowerCase() === selectedColor.trim().toLowerCase()
      ) || swatches[0]
    );
  }, [swatches, selectedColor]);

  // Gallery of ALL photos: active swatch photo, all swatch photos, and all product gallery photos
  const gallery = useMemo(() => {
    const list: string[] = [];

    const addPhoto = (url?: string) => {
      if (!url) return;
      const clean = url.trim();
      if (!clean || clean.includes('logo_ibey')) return;
      if (!list.includes(clean)) {
        list.push(clean);
      }
    };

    // 1. Masukkan foto swatch yang sedang aktif sebagai prioritas utama
    if (activeSwatch?.image) {
      addPhoto(activeSwatch.image);
    }

    // 2. Masukkan SEMUA foto dari tiap varian warna (swatches) agar sejak pertama kali buka sudah bisa discroll lengkap
    if (swatches && swatches.length > 0) {
      swatches.forEach((s) => addPhoto(s.image));
    }

    // 3. Masukkan foto utama produk jika belum ada di list
    if (product.image) {
      addPhoto(product.image);
    }

    // 4. Masukkan semua foto tambahan produk (gallery images)
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => addPhoto(img));
    }

    return list.length > 0 ? list : ['/images/catalog/catalog-01.jpg'];
  }, [activeSwatch, swatches, product.image, product.images]);

  const scrollToPhoto = useCallback((idx: number) => {
    const safeIdx = Math.max(0, Math.min(gallery.length - 1, idx));
    setActivePhotoIndex(safeIdx);
    if (photoScrollRef.current) {
      photoScrollRef.current.scrollTo({
        left: safeIdx * photoScrollRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  }, [gallery.length]);

  // Reset & load variants when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const initialC =
      initialColor ||
      product.swatches?.[0]?.name ||
      'Standard';
    setSelectedColor(initialC);
    setSelectedSize(sizes[0] || 'S');
    setQuantity(1);
    setActivePhotoIndex(0);

    // Fetch real-time variants from API
    let active = true;
    setLoadingVariants(true);

    fetch(`/api/products/${encodeURIComponent(product.slug)}/variants`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data && data.success && Array.isArray(data.variants)) {
          setVariants(data.variants);
        }
      })
      .catch((err) => {
        console.warn('[QuickAddModal] Gagal memuat data varian:', err);
      })
      .finally(() => {
        if (active) setLoadingVariants(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, product.slug, initialColor, sizes, product.swatches]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle photo horizontal scroll synchronization
  const handlePhotoScroll = () => {
    if (!photoScrollRef.current) return;
    const { scrollLeft, clientWidth } = photoScrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      if (idx !== activePhotoIndex && idx >= 0 && idx < gallery.length) {
        setActivePhotoIndex(idx);
      }
    }
  };

  // Mouse drag-to-scroll handlers for photo carousel
  const handlePhotoMouseDown = (e: React.MouseEvent) => {
    if (!photoScrollRef.current) return;
    setIsPhotoDragging(true);
    setHasPhotoDragged(false);
    setPhotoStartX(e.pageX - photoScrollRef.current.offsetLeft);
    setPhotoScrollLeft(photoScrollRef.current.scrollLeft);
  };

  const handlePhotoMouseMove = (e: React.MouseEvent) => {
    if (!isPhotoDragging || !photoScrollRef.current) return;
    const x = e.pageX - photoScrollRef.current.offsetLeft;
    const walk = (x - photoStartX) * 1.5;
    if (Math.abs(walk) > 4) {
      setHasPhotoDragged(true);
    }
    photoScrollRef.current.scrollLeft = photoScrollLeft - walk;
  };

  const handlePhotoMouseUp = () => {
    if (isPhotoDragging && photoScrollRef.current) {
      setIsPhotoDragging(false);
      // Snap to nearest photo after drag ends
      const { scrollLeft, clientWidth } = photoScrollRef.current;
      if (clientWidth > 0) {
        const nearestIdx = Math.round(scrollLeft / clientWidth);
        scrollToPhoto(nearestIdx);
      }
    }
  };

  // When user clicks a color swatch: select that color, reset qty, and slide photo to that swatch's photo
  const handleSelectColor = (swatchName: string) => {
    setSelectedColor(swatchName);
    setQuantity(1);

    const targetSwatch = swatches.find(
      (s) => s.name.trim().toLowerCase() === swatchName.trim().toLowerCase()
    );
    if (targetSwatch?.image) {
      const targetIdx = gallery.findIndex((img) => img === targetSwatch.image);
      if (targetIdx !== -1) {
        scrollToPhoto(targetIdx);
        return;
      }
    }
    // Jika tidak punya foto khusus, reset ke foto pertama
    scrollToPhoto(0);
  };

  // Active image to add to cart
  const currentPhoto = gallery[activePhotoIndex] || gallery[0] || '/images/catalog/catalog-01.jpg';

  // Matched variant stock calculation
  const matchedVariant = variants.find(
    (v) =>
      v.colorName.trim().toLowerCase() === selectedColor.trim().toLowerCase() &&
      v.size.trim().toLowerCase() === selectedSize.trim().toLowerCase()
  );

  const availableStock = (() => {
    if (loadingVariants && variants.length === 0) {
      return typeof product.stock === 'number' ? product.stock : 10;
    }
    if (matchedVariant) {
      return Math.max(0, matchedVariant.stock);
    }
    if (variants.length > 0) {
      return 0;
    }
    return typeof product.stock === 'number' ? product.stock : 0;
  })();

  const isOutOfStock = availableStock <= 0;

  if (!isOpen || !mounted) return null;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      showToast('Mohon maaf, varian ini sedang habis (Out of Stock).');
      return;
    }

    addToCart({
      id: `${product.slug}-${selectedColor}-${selectedSize}`,
      title: product.title,
      edition: product.material || product.fabric || product.edition || '100% Cupro',
      price: product.price,
      originalPrice: product.originalPrice,
      color: selectedColor,
      size: selectedSize,
      image: currentPhoto,
      quantity,
      stock: availableStock,
    });

    showToast(`Ditambahkan ke keranjang: ${product.title} (${selectedColor} - ${selectedSize})`);
    onClose();
  };

  const materialText = product.material || product.fabric || '100% Cupro Silk Linen';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-6 md:p-8"
      onClick={onClose}
    >
      {/* Modal Dialog: Mobile Bottom Sheet + Desktop Expansive 2-Column Luxury Layout */}
      <div
        className="relative w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl h-[88vh] max-h-[88vh] sm:h-[680px] sm:max-h-[94vh] bg-white shadow-2xl border-t sm:border border-black/[0.10] rounded-t-2xl sm:rounded-none flex flex-col sm:flex-row overflow-y-auto sm:overflow-hidden animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button: Sticky at top-right on mobile so it's always accessible, absolute on desktop */}
        <div className="sticky top-0 z-30 flex justify-end p-3 pointer-events-none sm:absolute sm:top-4 sm:right-4 sm:p-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center text-black/60 hover:text-black transition-colors cursor-pointer rounded-full bg-white/90 shadow-2xs backdrop-blur-xs hover:bg-white border border-black/10 sm:border-0"
            aria-label="Tutup"
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        {/* ── LEFT COLUMN: Swipeable / Scrollable Horizontal Photos (Pure White Background) ── */}
        <div className="w-full sm:w-1/2 md:w-[52%] bg-white px-4 pt-1 sm:pt-8 pb-4 sm:p-8 flex flex-col items-center justify-center relative select-none shrink-0 border-b sm:border-b-0 sm:border-r border-black/[0.08]">
          {/* Outer wrapper: relative, no overflow-hidden so arrows can sit at the edge */}
          <div className="relative w-full max-w-[280px] sm:max-w-[420px]">
            {/* Photo scroll area: overflow-hidden isolated here */}
            <div
              className="relative overflow-hidden bg-white shadow-2xs"
              onMouseDown={handlePhotoMouseDown}
              onMouseMove={handlePhotoMouseMove}
              onMouseUp={handlePhotoMouseUp}
              onMouseLeave={handlePhotoMouseUp}
            >
              {/* Horizontal Scroll / Swipe Container */}
              <div
                ref={photoScrollRef}
                onScroll={handlePhotoScroll}
                className={`no-scrollbar flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x ${
                  isPhotoDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
                }`}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                }}
              >
                {gallery.map((img, i) => (
                  <div
                    key={`${img}-${i}`}
                    className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-[#F7F7F7]"
                  >
                    <StudioImage
                      src={img}
                      alt={`${product.title} angle ${i + 1}`}
                      fill
                      preset="spotlight"
                      className="pointer-events-none object-cover"
                      priority={i === 0}
                      draggable={false}
                    />

                    {/* Out of Stock watermark badge on photo if current combination is out of stock */}
                    {isOutOfStock && i === activePhotoIndex && (
                      <span className="absolute top-3 right-3 z-10 rounded-full bg-black/75 px-2.5 py-1 text-[8px] font-normal tracking-[0.18em] text-white uppercase backdrop-blur-xs shadow-xs">
                        Out of Stock
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Left & Right Chevron Arrows: outside overflow-hidden, sitting at the photo edge (half inside, half in white bg) */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Foto sebelumnya"
                  onClick={() => scrollToPhoto(activePhotoIndex - 1)}
                  className="absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-sm border border-black/[0.08] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
                  disabled={activePhotoIndex === 0}
                >
                  <Icon name="chevron_left" size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Foto selanjutnya"
                  onClick={() => scrollToPhoto(activePhotoIndex + 1)}
                  className="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-sm border border-black/[0.08] hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
                  disabled={activePhotoIndex === gallery.length - 1}
                >
                  <Icon name="chevron_right" size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Content with Spacious Luxury Scrolling ── */}
        <div className="w-full sm:w-1/2 md:w-[48%] p-5 sm:p-8 md:p-10 flex flex-col justify-between sm:overflow-y-auto scrollbar-thin bg-white">
          <div className="space-y-6">
            {/* Header: Title & Price */}
            <div>
              <h2 className="font-sans text-sm sm:text-base font-normal tracking-[0.16em] text-black uppercase pr-8">
                {product.title}
              </h2>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="font-sans text-xs sm:text-sm font-normal tracking-wider text-black">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="font-sans text-[11px] font-normal text-black/40 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* 1. Color Selection: Circular dots (Always clickable to view photos) */}
            <div className="pt-0.5">
              <div className="text-[10px] font-normal tracking-[0.16em] uppercase text-black/60 mb-2.5">
                Color: <span className="font-normal text-black">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {swatches.map((swatch) => {
                  const isSelected = swatch.name.trim().toLowerCase() === selectedColor.trim().toLowerCase();
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      title={swatch.name}
                      aria-label={`Pilih warna ${swatch.name}`}
                      onClick={() => handleSelectColor(swatch.name)}
                      className="group relative p-1 flex items-center justify-center cursor-pointer outline-none"
                    >
                      <span
                        className={`block h-5 w-5 rounded-full transition-all duration-200 ${
                          isSelected
                            ? 'scale-110 outline outline-1 outline-black outline-offset-2 opacity-100 shadow-2xs'
                            : 'opacity-70 outline outline-1 outline-black/10 group-hover:opacity-100 group-hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Size Selection: Square / Rectangular boxes (h-9) — Out of stock sizes cannot be selected */}
            <div>
              <div className="text-[10px] font-normal tracking-[0.16em] uppercase text-black/60 mb-2.5">
                Size:
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((sz) => {
                  const isSelected = selectedSize.trim().toLowerCase() === sz.trim().toLowerCase();
                  const matchedForSize = variants.find(
                    (v) =>
                      v.colorName.trim().toLowerCase() === selectedColor.trim().toLowerCase() &&
                      v.size.trim().toLowerCase() === sz.trim().toLowerCase()
                  );
                  const sizeStock = matchedForSize
                    ? matchedForSize.stock
                    : variants.length > 0
                    ? 0
                    : (product.stock ?? 10);
                  const isSizeOut = sizeStock <= 0;

                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={isSizeOut}
                      onClick={() => {
                        if (!isSizeOut) {
                          setSelectedSize(sz);
                          setQuantity(1);
                        }
                      }}
                      className={`relative min-w-[46px] h-9 border px-3 text-[10px] tracking-wider uppercase font-normal transition-all flex items-center justify-center ${
                        isSizeOut
                          ? 'border-black/[0.08] bg-white text-black/25 cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-black bg-white text-black font-medium ring-1 ring-black cursor-pointer'
                          : 'border-black/[0.12] bg-white text-black/75 hover:border-black/60 hover:text-black cursor-pointer'
                      }`}
                    >
                      <span>{sz}</span>
                      {isSizeOut && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="h-[1px] w-full rotate-[-30deg] bg-black/25" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Material Box: Same height (h-9) and consistent border as size boxes */}
            <div>
              <div className="text-[10px] font-normal tracking-[0.16em] uppercase text-black/60 mb-2.5">
                Material:
              </div>
              <div>
                <div className="inline-flex items-center justify-center h-9 border border-black/[0.12] bg-white px-4 text-[10px] font-normal tracking-wider text-black uppercase select-none">
                  {materialText}
                </div>
              </div>
            </div>

            {/* 4. Quantity Selector: Same height (h-9) and consistent border */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-normal tracking-[0.16em] uppercase text-black/60">
                  Quantity:
                </span>
                {isOutOfStock ? (
                  <span className="text-[9.5px] font-normal text-rose-600 uppercase tracking-wider">
                    Stok Habis
                  </span>
                ) : availableStock <= 5 ? (
                  <span className="text-[9.5px] font-normal text-amber-700">
                    Sisa {availableStock} lagi
                  </span>
                ) : null}
              </div>
              <div className="inline-flex items-center h-9 border border-black/[0.12] bg-white">
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="h-full px-3 text-xs text-black/60 hover:text-black transition-colors hover:bg-black/5 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Kurang"
                >
                  −
                </button>
                <span className="h-full min-w-[36px] flex items-center justify-center font-sans text-xs font-normal text-black border-x border-black/[0.08]">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock || quantity >= availableStock}
                  onClick={() => setQuantity((prev) => Math.min(availableStock, prev + 1))}
                  className="h-full px-3 text-xs text-black/60 hover:text-black transition-colors hover:bg-black/5 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Tambah"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Button & View Details */}
          <div className="pt-6 mt-5 border-t border-black/[0.08] pb-8 sm:pb-0">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="w-full bg-[#1A1A1A] hover:bg-black py-3.5 text-center text-xs font-normal tracking-[0.2em] text-white uppercase transition-colors cursor-pointer active:scale-[0.99] disabled:bg-black/25 disabled:cursor-not-allowed shadow-2xs"
            >
              {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
            </button>

            <Link
              href={`/product/${product.slug}${selectedColor ? `?color=${encodeURIComponent(selectedColor)}` : ''}`}
              onClick={onClose}
              className="mt-3.5 block text-center text-[10px] font-light tracking-[0.16em] uppercase text-black/50 hover:text-black transition-colors hover:underline"
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
