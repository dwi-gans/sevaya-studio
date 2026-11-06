'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getDbProducts, DbProduct } from '@/integrations/supabase';
import { ProductVariant } from '@/integrations/supabase/inventory';
import { mapDbProductToProduct } from '@/features/catalog';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { Footer } from '@/components/layout/Footer';

export interface ProductColorOption {
  name: string;
  hex: string;
  image: string;
  outOfStock?: boolean;
}

const DEFAULT_COLOR_OPTIONS: ProductColorOption[] = [
  { name: 'Black', hex: '#1C1C1E', image: '/images/catalog/catalog-01.jpg' },
  { name: 'Navy', hex: '#1B263B', image: '/images/catalog/catalog-05.jpg' },
  { name: 'Espresso', hex: '#3E2A20', image: '/images/catalog/catalog-07.jpg' },
  { name: 'Olive Brown', hex: '#8C857B', image: '/images/catalog/catalog-04.jpg', outOfStock: true },
  { name: 'Sesame', hex: '#EAE5DB', image: '/images/catalog/catalog-03.jpg' },
  { name: 'Chai', hex: '#DDD2C3', image: '/images/catalog/catalog-06.jpg' },
];

const QUALITY_OPTIONS = ['Top Notch', 'Almost Perfect', 'Visible Marks'];

/** Buat daftar warna awal dari swatches produk, dengan status sold-out dari data varian dan foto cerdas */
function buildColorOptions(
  swatches: Array<{ name: string; color: string; image?: string }> | undefined,
  fallbackImage: string,
  variants: ProductVariant[],
  extraImages?: string[]
): ProductColorOption[] {
  if (!swatches || swatches.length === 0) return DEFAULT_COLOR_OPTIONS;

  return swatches.map((s, idx) => {
    const colorVariants = variants.filter(
      (v) => v.colorName.toLowerCase() === s.name.toLowerCase()
    );
    const isColorSoldOut =
      colorVariants.length > 0 && colorVariants.every((v) => v.stock <= 0);

    // Ambil foto yang tepat:
    // 1. s.image jika ada
    // 2. Jika s.image kosong, gunakan foto galeri produk sesuai index (extraImages?.[idx])
    // 3. Fallback ke fallbackImage (foto utama produk)
    const photo =
      (s.image && s.image.trim()) ||
      (extraImages && extraImages[idx] && extraImages[idx].trim()) ||
      fallbackImage;

    return {
      name: s.name,
      hex: s.color,
      image: photo,
      outOfStock: isColorSoldOut,
    };
  });
}

/** Susun foto galeri asli milik produk (foto utama + foto galeri produk asli) */
function buildGalleryList(
  mainImage?: string,
  extraImages?: string[],
  swatches?: Array<{ image?: string }>
): string[] {
  const result: string[] = [];
  const pushUnique = (img?: string) => {
    if (!img) return;
    const clean = img.trim();
    // Abaikan URL yang rusak atau dummy corrupt
    if (clean && !clean.includes('logo_ibey') && !result.includes(clean)) {
      result.push(clean);
    }
  };

  pushUnique(mainImage);
  if (Array.isArray(extraImages) && extraImages.length > 0) {
    extraImages.forEach(pushUnique);
  } else if (Array.isArray(swatches)) {
    // Hanya jika produk belum memiliki extraImages tersendiri, gunakan foto swatch
    swatches.forEach((s) => {
      if (s.image && !s.image.includes('logo_ibey')) {
        pushUnique(s.image);
      }
    });
  }

  return result.length > 0 ? result : ['/images/catalog/catalog-01.jpg'];
}

interface ProductDetailClientProps {
  slug: string;
  initialProduct: DbProduct;
  initialVariants?: ProductVariant[];
}

export function ProductDetailClient({
  slug,
  initialProduct,
  initialVariants = [],
}: ProductDetailClientProps) {
  const { items, addToCart } = useCart();
  const { showToast } = useToast();

  const [dbProduct, setDbProduct] = useState<DbProduct>(initialProduct);
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  // Semua produk dari DB (untuk Related Products)
  const [allDbProducts, setAllDbProducts] = useState<DbProduct[]>([]);

  // Warna awal dihitung sekali dari SSR data (dengan fallback cerdas ke foto galeri)
  const [colors, setColors] = useState<ProductColorOption[]>(() =>
    buildColorOptions(
      initialProduct.swatches,
      initialProduct.image || '/images/catalog/catalog-01.jpg',
      initialVariants,
      initialProduct.images
    )
  );

  const [selectedColor, setSelectedColor] = useState<ProductColorOption>(
    () => colors[0] || DEFAULT_COLOR_OPTIONS[0]!
  );
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    if (initialProduct?.sizes && initialProduct.sizes.length > 0) {
      return initialProduct.sizes[0]!;
    }
    return 'S';
  });
  const [selectedQuality, setSelectedQuality] = useState<string>(QUALITY_OPTIONS[0]!);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<string>(
    () => colors[0]?.image || initialProduct.image || '/images/catalog/catalog-01.jpg'
  );

  const [fabricOpen, setFabricOpen] = useState(false);
  const [sizingOpen, setSizingOpen] = useState(false);

  // Galeri foto lengkap: foto utama + semua foto tambahan + foto tiap varian warna
  const [galleryImages, setGalleryImages] = useState<string[]>(() =>
    buildGalleryList(
      initialProduct.image,
      initialProduct.images,
      initialProduct.swatches
    )
  );

  // Handler saat user mengklik Swatch Warna:
  // 1. Ubah warna terpilih
  // 2. Ubah gambar utama ke foto varian warna tersebut (dengan validasi anti-corrupt)
  const handleSelectColor = (colorOption: ProductColorOption) => {
    setSelectedColor(colorOption);
    const validImage =
      colorOption.image && !colorOption.image.includes('logo_ibey')
        ? colorOption.image
        : dbProduct.image || '/images/catalog/catalog-01.jpg';
    setActiveImage(validImage);
  };

  // Handler saat user mengklik thumbnail di galeri bawah (Two-way sync):
  // 1. Ubah gambar utama ke thumbnail yang diklik
  // 2. Jika foto ini adalah foto salah satu warna, otomatis pilih warna tersebut
  const handleSelectGalleryImage = (imgSrc: string) => {
    setActiveImage(imgSrc);
    const matchedColor = colors.find((c) => c.image === imgSrc);
    if (matchedColor && matchedColor.name.toLowerCase() !== selectedColor.name.toLowerCase()) {
      setSelectedColor(matchedColor);
    }
  };

  // Stok varian spesifik yang dipilih (warna + size)
  const selectedVariantStock = useMemo(() => {
    if (variants.length > 0) {
      const v = variants.find(
        (vr) =>
          vr.colorName.toLowerCase() === selectedColor.name.toLowerCase() &&
          vr.size.toUpperCase() === selectedSize.toUpperCase()
      );
      if (v !== undefined) return v.stock;
    }
    // Fallback ke stok total produk jika tidak ada data varian
    return typeof dbProduct.stock === 'number'
      ? dbProduct.stock
      : dbProduct.inStock === false
      ? 0
      : 25;
  }, [variants, selectedColor, selectedSize, dbProduct]);

  const availableStock = selectedVariantStock;
  const isOutOfStock =
    availableStock <= 0 ||
    dbProduct.inStock === false ||
    (typeof dbProduct.stock === 'number' && dbProduct.stock <= 0);

  const sizeOptions = useMemo(() => {
    if (dbProduct?.sizes && dbProduct.sizes.length > 0) {
      return dbProduct.sizes;
    }
    return ['S', 'M', 'L'];
  }, [dbProduct?.sizes]);

  // Sinkronkan colors state ketika variants berubah (dari fetch API client-side)
  useEffect(() => {
    if (variants.length === 0) return;
    setColors((prev) =>
      prev.map((c) => {
        const colorVariants = variants.filter(
          (v) => v.colorName.toLowerCase() === c.name.toLowerCase()
        );
        const isColorSoldOut =
          colorVariants.length > 0 && colorVariants.every((v) => v.stock <= 0);
        return { ...c, outOfStock: isColorSoldOut };
      })
    );
  }, [variants]);

  // Refresh produk & varian dari server secara background
  useEffect(() => {
    let isMounted = true;

    // Refresh data produk
    getDbProducts(true).then((prodList) => {
      if (!isMounted) return;

      // Simpan semua produk untuk Related Products
      setAllDbProducts(prodList);

      const found = prodList.find((p) => p.slug === slug);
      if (!found) return;

      const hasChanged =
        found.price !== dbProduct.price ||
        found.title !== dbProduct.title ||
        found.image !== dbProduct.image ||
        (found.description || '') !== (dbProduct.description || '') ||
        (found.fabric || '') !== (dbProduct.fabric || '') ||
        (found.sizing || '') !== (dbProduct.sizing || '') ||
        (found.badge || '') !== (dbProduct.badge || '') ||
        found.stock !== dbProduct.stock ||
        found.inStock !== dbProduct.inStock ||
        JSON.stringify(found.swatches || []) !== JSON.stringify(dbProduct.swatches || []) ||
        JSON.stringify(found.sizes || []) !== JSON.stringify(dbProduct.sizes || []);

      if (!hasChanged) return;

      setDbProduct(found);
      const freshColors = buildColorOptions(
        found.swatches,
        found.image || '/images/catalog/catalog-01.jpg',
        variants,
        found.images
      );
      setColors(freshColors);

      // PERBAIKAN BUG: Pertahankan warna yang SEDANG DIPILIH oleh user (jangan di-reset ke warna pertama!)
      setSelectedColor((prevSelected) => {
        const matched = freshColors.find(
          (c) => c.name.toLowerCase() === prevSelected.name.toLowerCase()
        );
        return matched || freshColors[0]!;
      });

      // Perbarui galeri foto lengkap
      const thumbs = buildGalleryList(found.image, found.images, found.swatches);
      setGalleryImages(thumbs);
    });

    // Refresh data varian dari API
    fetch('/api/admin/inventory', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted || !data?.variants) return;
        const productId = String(initialProduct.id);
        const productVariants: ProductVariant[] = (data.variants as ProductVariant[]).filter(
          (v) =>
            v.productSlug === slug ||
            String(v.productId) === productId
        );
        if (productVariants.length > 0) {
          setVariants(productVariants);
        }
      })
      .catch(() => {/* ignore — SSR data masih tersedia */});

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, initialProduct]);

  const title = (dbProduct?.title || initialProduct.title).toUpperCase();
  const price = dbProduct?.price || initialProduct.price || 1339000;
  const formattedPrice = `RP ${price.toLocaleString('id-ID')}`;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      showToast('Mohon maaf, stok untuk pilihan ini sedang habis.');
      return;
    }

    const cartItemId = `${slug}-${selectedColor.name}-${selectedSize}-${selectedQuality}`;
    const existingInCart = items.find((i) => i.id === cartItemId)?.quantity || 0;

    if (existingInCart + quantity > availableStock) {
      const remainingCanAdd = Math.max(0, availableStock - existingInCart);
      if (remainingCanAdd <= 0) {
        showToast(`Stok telah mencapai batas maksimum (${availableStock} buah) di keranjang Anda.`);
        return;
      }
      showToast(`Stok tersisa ${availableStock}. Hanya ${remainingCanAdd} buah yang ditambahkan.`);
      addToCart({
        id: cartItemId,
        title,
        edition: selectedQuality,
        price,
        color: selectedColor.name,
        colorHex: selectedColor.hex,
        size: selectedSize,
        image: activeImage,
        quantity: remainingCanAdd,
        stock: availableStock,
      });
      return;
    }

    addToCart({
      id: cartItemId,
      title,
      edition: selectedQuality,
      price,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      size: selectedSize,
      image: activeImage,
      quantity,
      stock: availableStock,
    });

    showToast(`Ditambahkan ke keranjang: ${title} (${selectedColor.name})`);
  };

  const relatedProducts: Product[] = useMemo(() => {
    // Gunakan produk DB asli jika sudah tersedia, fallback ke produk awal
    const sourceList = allDbProducts.length > 0 ? allDbProducts : [initialProduct];
    const list: Product[] = [];
    const seenSlugs = new Set([slug]);

    for (const dbProd of sourceList) {
      if (dbProd.hidden) continue; // skip produk tersembunyi
      if (seenSlugs.has(dbProd.slug)) continue;
      seenSlugs.add(dbProd.slug);
      list.push(mapDbProductToProduct(dbProd));
      if (list.length >= 4) break;
    }
    return list;
  }, [slug, allDbProducts, initialProduct]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <main className="w-full flex-1 pt-8 sm:pt-10 pb-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 items-start">
            
            {/* ── KOLOM KIRI (lg:col-span-6): DETAIL PRODUK & FORM PEMBELIAN ── */}
            <div className="order-2 flex flex-col lg:order-1 lg:col-span-6 space-y-6">
              
              <div>
                {dbProduct.badge && (
                  <div className="mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[8.5px] sm:text-[9px] font-medium tracking-[0.22em] uppercase border shadow-2xs ${
                        dbProduct.badge.toLowerCase().includes('best')
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-black/30'
                          : dbProduct.badge.toLowerCase().includes('trend')
                          ? 'bg-[#FAF8F5] text-[#2C2723] border-[#DDD5C7]'
                          : 'bg-[#1C1917] text-[#FBF9F5] border-black/30'
                      }`}
                    >
                      <span className="text-[10px] opacity-75">✦</span>
                      <span>{dbProduct.badge}</span>
                    </span>
                  </div>
                )}
                <h1 className="font-sans text-sm sm:text-base lg:text-lg font-normal tracking-[0.18em] text-black uppercase">
                  {title}
                </h1>
                <p className="mt-2 text-xs sm:text-sm font-normal tracking-wider text-black/75 uppercase">
                  {formattedPrice}
                </p>
              </div>

              <div className="text-[11px] leading-relaxed text-black/70">
                {dbProduct.description ? (
                  <p className="whitespace-pre-line leading-relaxed">{dbProduct.description}</p>
                ) : (
                  <p>
                    The {title} features the same cut as our signature Alia One Set, but refreshed with minimalist button details on the sleeves. Designed in a relaxed fit and crafted from 100% premium cupro silk linen, it offers an easy, comfortable feel while keeping the look effortlessly stylish. The front buttons add a practical touch to the design, making {title.toLowerCase()} an easy choice for running errands, slow days, and everything in between.
                  </p>
                )}
              </div>

              {/* Pilihan Warna */}
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-black">
                    COLOR &mdash; <span className="font-normal text-black/80">{selectedColor.name}</span>
                  </span>
                </div>
                
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {colors.map((c) => {
                    const isSelected = selectedColor.name === c.name;
                    return (
                      <div key={c.name} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectColor(c)}
                          className={`group relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                            c.outOfStock
                              ? 'opacity-70'
                              : ''
                          } ${
                            isSelected
                              ? 'ring-1 ring-black ring-offset-2 ring-offset-white scale-105'
                              : 'ring-1 ring-black/20 hover:ring-black/60'
                          }`}
                          title={c.outOfStock ? `${c.name} — Stok Habis` : c.name}
                          aria-label={`Pilih warna ${c.name}${c.outOfStock ? ' (Stok Habis)' : ''}`}
                        >
                          <span
                            className="h-full w-full rounded-full border border-black/10 transition-transform duration-150"
                            style={{ backgroundColor: c.hex }}
                          />

                          {c.outOfStock && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <span className="h-[1.5px] w-6 rotate-[-45deg] bg-black/60" />
                            </span>
                          )}
                        </button>

                        {c.outOfStock && (
                          <span className="text-[10px] font-medium text-black/40 line-through">
                            {c.name} (Habis)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Ukuran */}
              <div>
                <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-black">
                  SIZE
                </span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {sizeOptions.map((sz) => {
                    const isSelected = selectedSize === sz;
                    // Cek apakah kombinasi warna+size ini habis
                    const szVariant = variants.length > 0
                      ? variants.find(
                          (v) =>
                            v.colorName.toLowerCase() === selectedColor.name.toLowerCase() &&
                            v.size.toUpperCase() === sz.toUpperCase()
                        )
                      : undefined;
                    const isSzSoldOut = szVariant !== undefined && szVariant.stock <= 0;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => !isSzSoldOut && setSelectedSize(sz)}
                        disabled={isSzSoldOut}
                        className={`border px-5 py-2 text-[10px] tracking-wider uppercase transition-colors ${
                          isSzSoldOut
                            ? 'border-black/10 bg-white text-black/25 cursor-not-allowed line-through'
                            : isSelected
                            ? 'border-black bg-white text-black font-semibold cursor-pointer'
                            : 'border-black/20 bg-white text-black/60 hover:border-black hover:text-black cursor-pointer'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Kualitas */}
              <div>
                <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-black">
                  QUALITY
                </span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {QUALITY_OPTIONS.map((q) => {
                    const isSelected = selectedQuality === q;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSelectedQuality(q)}
                        className={`border px-4 py-2 text-[10px] tracking-wider transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-black bg-white text-black font-semibold'
                            : 'border-black/20 bg-white text-black/60 hover:border-black hover:text-black'
                        }`}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kuantitas */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-black">
                    QUANTITY
                  </span>
                  {isOutOfStock ? (
                    <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">
                      Stok Habis
                    </span>
                  ) : availableStock <= 5 ? (
                    <span className="text-[10px] font-medium text-amber-700">
                      Sisa {availableStock} lagi
                    </span>
                  ) : null}
                </div>
                <div className="mt-2.5 inline-flex items-center border border-black/20 bg-white">
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity <= 1}
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-2 text-[11px] text-black transition-colors hover:bg-black/5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Kurangi kuantitas"
                  >
                    &minus;
                  </button>
                  <span className="w-10 text-center text-[11px] font-semibold text-black">
                    {isOutOfStock ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity >= availableStock}
                    onClick={() => setQuantity((prev) => Math.min(availableStock, prev + 1))}
                    className="px-3 py-2 text-[11px] text-black transition-colors hover:bg-black/5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Tambah kuantitas"
                  >
                    &#43;
                  </button>
                </div>
              </div>

              {/* Tombol ADD TO CART */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="w-full bg-[#1A1A1A] hover:bg-black py-4 text-center text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors cursor-pointer active:scale-[0.99] disabled:bg-black/30 disabled:cursor-not-allowed"
                >
                  {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                </button>
              </div>

              {/* Accordion: FABRIC & SIZING */}
              <div className="border-t border-black/15 pt-2">
                <div className="border-b border-black/15">
                  <button
                    type="button"
                    onClick={() => setFabricOpen(!fabricOpen)}
                    className="flex w-full items-center justify-between py-3.5 text-left text-[11px] font-medium tracking-[0.16em] text-black uppercase transition-colors hover:text-black/70 cursor-pointer"
                  >
                    <span>FABRIC</span>
                    <span className="text-xs font-light text-black">
                      {fabricOpen ? '−' : '+'}
                    </span>
                  </button>
                  {fabricOpen && (
                    <div className="pb-4 text-[11px] leading-relaxed text-black/70">
                      {dbProduct.fabric ? (
                        <p className="whitespace-pre-line leading-relaxed">{dbProduct.fabric}</p>
                      ) : (
                        <p>
                          100% Bemberg™ Cupro Silk Linen. Naturally breathable, lightweight, with a soft cool-touch finish and elegant fluid drape. Hand wash or gentle machine wash cold, hang dry in shade, warm iron if needed.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-b border-black/15">
                  <button
                    type="button"
                    onClick={() => setSizingOpen(!sizingOpen)}
                    className="flex w-full items-center justify-between py-3.5 text-left text-[11px] font-medium tracking-[0.16em] text-black uppercase transition-colors hover:text-black/70 cursor-pointer"
                  >
                    <span>SIZING</span>
                    <span className="text-xs font-light text-black">
                      {sizingOpen ? '−' : '+'}
                    </span>
                  </button>
                  {sizingOpen && (
                    <div className="pb-4 text-[11px] leading-relaxed text-black/70">
                      {dbProduct.sizing ? (
                        <div className="whitespace-pre-line leading-relaxed">{dbProduct.sizing}</div>
                      ) : (
                        <>
                          <p className="font-medium text-black">
                            All Size (fits XS through XL comfortably):
                          </p>
                          <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>Bust / Lingkar Dada: 120 cm</li>
                            <li>Abaya Length / Panjang Baju: 140 cm</li>
                            <li>Sleeve Length / Panjang Lengan: 57 cm</li>
                            <li>Armhole / Lingkar Kerung: 52 cm</li>
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ── KOLOM KANAN (lg:col-span-6): GALERI FOTO PRODUK PORTRAIT ── */}
            <div className="order-1 flex flex-col lg:order-2 lg:col-span-6 static lg:sticky lg:top-24">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ECE8E1] border border-black/5">
                {dbProduct.badge && (
                  <span
                    className={`absolute top-3 left-3 z-10 px-2.5 py-1 text-[8px] sm:text-[8.5px] font-medium tracking-[0.22em] uppercase backdrop-blur-xs shadow-xs ${
                      dbProduct.badge.toLowerCase().includes('best')
                        ? 'bg-[#1C1917]/95 text-[#FBF9F5] border border-white/20'
                        : dbProduct.badge.toLowerCase().includes('trend')
                        ? 'bg-[#FAF8F5]/95 text-[#2C2723] border border-[#DDD5C7]'
                        : 'bg-[#1C1917]/95 text-[#FBF9F5] border border-white/20'
                    }`}
                  >
                    <span className="mr-1 text-[9px] opacity-75">✦</span>
                    {dbProduct.badge}
                  </span>
                )}
                <Image
                  src={activeImage}
                  alt={`${title} - ${selectedColor.name}`}
                  fill
                  priority
                  onError={() => {
                    const fallback = dbProduct.image || '/images/catalog/catalog-01.jpg';
                    if (activeImage !== fallback) {
                      setActiveImage(fallback);
                    }
                  }}
                  unoptimized={
                    !activeImage.startsWith('/') &&
                    !activeImage.includes('supabase.co') &&
                    !activeImage.includes('unsplash.com')
                  }
                  className="object-cover object-top transition-opacity duration-300"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {galleryImages.length > 1 && (
                <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto py-1">
                  {galleryImages.map((imgSrc, idx) => {
                    const isActive = activeImage === imgSrc;
                    return (
                      <button
                        key={`${imgSrc}-${idx}`}
                        type="button"
                        onClick={() => handleSelectGalleryImage(imgSrc)}
                        className={`relative h-16 w-12 flex-shrink-0 overflow-hidden bg-[#ECE8E1] transition-all cursor-pointer ${
                          isActive
                            ? 'ring-2 ring-black ring-offset-1 opacity-100 scale-102'
                            : 'opacity-65 hover:opacity-100 border border-black/10'
                        }`}
                        aria-label={`Thumbnail photo ${idx + 1}`}
                      >
                        <Image
                          src={imgSrc}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          onError={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            if (target?.parentElement) {
                              target.parentElement.style.display = 'none';
                            }
                          }}
                          unoptimized={
                            !imgSrc.startsWith('/') &&
                            !imgSrc.includes('supabase.co') &&
                            !imgSrc.includes('unsplash.com')
                          }
                          className="object-cover object-top"
                          sizes="64px"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-24 border-t border-black/10 pt-16">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-normal tracking-[0.2em] uppercase text-black">
                  Related Products
                </h2>
                <Link
                  href="/shop"
                  className="text-[10px] tracking-[0.16em] uppercase text-black/60 hover:text-black underline underline-offset-4 transition-colors"
                >
                  View All
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
