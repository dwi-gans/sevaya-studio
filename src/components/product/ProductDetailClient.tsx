'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudioImage } from '@/components/common';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { getDbProducts, DbProduct } from '@/integrations/supabase';
import { ProductVariant } from '@/integrations/supabase/inventory';
import { mapDbProductToProduct } from '@/features/catalog';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { Footer } from '@/components/layout/Footer';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

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
  { name: 'Olive Brown', hex: '#8C857B', image: '/images/catalog/catalog-04.jpg' },
  { name: 'Sesame', hex: '#EAE5DB', image: '/images/catalog/catalog-03.jpg' },
  { name: 'Chai', hex: '#DDD2C3', image: '/images/catalog/catalog-06.jpg' },
];

/** Buat daftar warna awal dari swatches produk, dengan status sold-out dari data varian dan foto cerdas */
function buildColorOptions(
  swatches: Array<{ name: string; color: string; image?: string }> | undefined,
  fallbackImage: string,
  variants: ProductVariant[],
  extraImages?: string[]
): ProductColorOption[] {
  if (!swatches || swatches.length === 0) return DEFAULT_COLOR_OPTIONS;

  return swatches.map((s, idx) => {
    const sName = s.name.trim().toLowerCase();
    const colorVariants = variants.filter(
      (v) => v.colorName.trim().toLowerCase() === sName
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

/** Ambil semua foto untuk satu swatch (cover + extras), max 4, tanpa duplikat */
function getSwatchPhotos(
  swatch: { image?: string; images?: string[] },
  fallback: string
): string[] {
  const photos: string[] = [];
  const push = (img?: string) => {
    if (!img?.trim() || img.includes('logo_ibey') || photos.includes(img.trim())) return;
    if (photos.length < 4) photos.push(img.trim());
  };
  push(swatch.image);
  if (Array.isArray(swatch.images)) swatch.images.forEach(push);
  return photos.length > 0 ? photos : [fallback];
}

/** Buat map: colorName (lowercase) → array foto (1–4 foto) */
function buildColorPhotoMap(
  swatches: Array<{ name: string; image?: string; images?: string[] }> | undefined,
  fallback: string
): Record<string, string[]> {
  if (!swatches || swatches.length === 0) return {};
  return Object.fromEntries(
    swatches.map((s) => [s.name.toLowerCase(), getSwatchPhotos(s, fallback)])
  );
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
  }

  // Selalu tambahkan foto per-warna dari swatches ke galeri (agar swipe = ganti warna)
  if (Array.isArray(swatches)) {
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
  const router = useRouter();
  const { language } = useLanguage();
  const { items, addToCart } = useCart();
  const { showToast } = useToast();

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      if (window.history.length > 1) {
        window.history.back();
        // Fallback: jika setelah 250ms URL tidak berubah (misal dibuka langsung dari tab baru), arahkan ke /shop
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.href === currentUrl) {
            router.push('/shop');
          }
        }, 250);
      } else {
        router.push('/shop');
      }
    }
  };

  const [dbProduct, setDbProduct] = useState<DbProduct>(initialProduct);
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  // Track whether variants have been confirmed from live API (prevents flicker)
  const [variantsReady, setVariantsReady] = useState(initialVariants.length > 0);
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
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<string>(
    () => colors[0]?.image || initialProduct.image || '/images/catalog/catalog-01.jpg'
  );

  const [fabricOpen, setFabricOpen] = useState(false);
  const [sizingOpen, setSizingOpen] = useState(false);

  // Galeri foto lengkap: foto utama + semua foto tambahan + foto tiap varian warna
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    // Init galeri dari foto warna pertama (jika ada multi-foto per warna)
    const firstSwatch = initialProduct.swatches?.[0];
    const fallback = initialProduct.image || '/images/catalog/catalog-01.jpg';
    if (firstSwatch) {
      const firstPhotos = getSwatchPhotos(firstSwatch, fallback);
      if (firstPhotos.length > 1) return firstPhotos;
    }
    return buildGalleryList(
      initialProduct.image,
      initialProduct.images,
      initialProduct.swatches
    );
  });

  // Map: colorName (lowercase) → array foto (1–4 foto) untuk filtered gallery di detail page
  const [colorPhotoMap, setColorPhotoMap] = useState<Record<string, string[]>>(() =>
    buildColorPhotoMap(
      initialProduct.swatches,
      initialProduct.image || '/images/catalog/catalog-01.jpg'
    )
  );

  // Fullscreen Zoom Lightbox state & Mobile swipe carousel ref
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const mobileGalleryRef = useRef<HTMLDivElement>(null);
  const mobileThumbnailBarRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Galeri lengkap seluruh produk (semua angle + foto swatches)
  const allGalleryImages = useMemo(() => {
    return buildGalleryList(
      dbProduct.image,
      dbProduct.images,
      dbProduct.swatches
    );
  }, [dbProduct.image, dbProduct.images, dbProduct.swatches]);

  // Cleanup scroll timeout saat unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Auto-scroll mobile thumbnail bar agar thumbnail aktif selalu tampak
  useEffect(() => {
    if (!mobileThumbnailBarRef.current) return;
    const activeThumb = mobileThumbnailBarRef.current.querySelector<HTMLElement>(
      '[data-active="true"]'
    );
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeGalleryIndex, activeImage]);

  // Lock body scroll saat zoom modal terbuka
  useEffect(() => {
    if (zoomOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [zoomOpen]);

  // Tutup zoom modal dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomOpen) {
        setZoomOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomOpen]);

  // Handler saat mobile carousel digeser / di-swipe secara horizontal oleh user
  const handleGalleryScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;
    if (!mobileGalleryRef.current) return;
    const scrollLeft = mobileGalleryRef.current.scrollLeft;
    const width = mobileGalleryRef.current.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== activeGalleryIndex && galleryImages[newIndex]) {
        setActiveGalleryIndex(newIndex);
        const newImg = galleryImages[newIndex]!;
        setActiveImage(newImg);
        // Sync swatch jika foto ini milik warna tertentu
        const matched = colors.find(
          (c) => c.image && c.image.trim() === newImg.trim()
        );
        if (matched && matched.name.toLowerCase() !== selectedColor.name.toLowerCase()) {
          setSelectedColor(matched);
        }
      }
    }
  }, [activeGalleryIndex, galleryImages, colors, selectedColor.name]);

  // Handler saat user mengklik Swatch Warna:
  // 1. Ubah warna terpilih & kuantitas
  // 2. Jika warna punya foto banyak tersendiri (>1), tampilkan foto khusus warna itu
  //    Jika hanya 1 foto cover, pertahankan galeri produk (allGalleryImages) dan highlight thumbnail warna tersebut
  // 3. Scroll mobile carousel ke foto warna yang dipilih tanpa glitch / layout jumping
  const handleSelectColor = (colorOption: ProductColorOption) => {
    setSelectedColor(colorOption);
    setQuantity(1);

    // Jika size yang aktif stoknya 0 pada warna baru, otomatis pilih size yang ada stok
    if (variants.length > 0) {
      const colorVariants = variants.filter(
        (v) => v.colorName.trim().toLowerCase() === colorOption.name.trim().toLowerCase()
      );
      const currentSizeStock = colorVariants.find(
        (v) => v.size.trim().toUpperCase() === selectedSize.trim().toUpperCase()
      )?.stock ?? 0;

      if (currentSizeStock <= 0) {
        const inStock = colorVariants.find((v) => v.stock > 0);
        if (inStock) {
          setSelectedSize(inStock.size);
        }
      }
    }

    const specificPhotos = colorPhotoMap[colorOption.name.trim().toLowerCase()];
    const hasDedicatedGallery = specificPhotos && specificPhotos.length > 1;

    let targetGallery: string[];
    let targetIndex = 0;
    let targetImage: string;

    if (hasDedicatedGallery) {
      // Warna ini punya multi-foto tersendiri
      targetGallery = specificPhotos;
      targetImage = specificPhotos[0]!;
      targetIndex = 0;
    } else {
      // Warna ini hanya punya 1 foto cover.
      // Pertahankan allGalleryImages agar kotak thumbnail TIDAK hilang atau collapsing!
      targetImage =
        colorOption.image && !colorOption.image.includes('logo_ibey')
          ? colorOption.image
          : specificPhotos?.[0] || dbProduct.image || '/images/catalog/catalog-01.jpg';

      if (allGalleryImages.includes(targetImage)) {
        targetGallery = allGalleryImages;
        targetIndex = allGalleryImages.indexOf(targetImage);
      } else {
        targetGallery = [targetImage, ...allGalleryImages.filter((img) => img !== targetImage)];
        targetIndex = 0;
      }
    }

    isProgrammaticScroll.current = true;
    setGalleryImages(targetGallery);
    setActiveImage(targetImage);
    setActiveGalleryIndex(targetIndex);

    if (mobileGalleryRef.current) {
      const width = mobileGalleryRef.current.clientWidth;
      if (width > 0) {
        mobileGalleryRef.current.scrollTo({ left: targetIndex * width, behavior: 'auto' });
      }
    }

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 150);
  };

  // Baca query parameter ?color= dari URL jika user datang dari klik swatch di card katalog
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const colorParam = searchParams.get('color');
    if (colorParam) {
      const decoded = decodeURIComponent(colorParam).trim().toLowerCase();
      const matched = colors.find((c) => c.name.trim().toLowerCase() === decoded);
      if (matched) {
        handleSelectColor(matched);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler saat user mengklik thumbnail di galeri:
  // 1. Update activeImage & activeGalleryIndex
  // 2. Scroll mobile carousel secara halus ke foto tersebut
  // 3. Two-way sync: jika thumbnail ini milik salah satu warna, pilih warna tersebut
  const handleSelectGalleryImage = (imgSrc: string) => {
    setActiveImage(imgSrc);
    const idx = galleryImages.findIndex((img) => img === imgSrc);
    if (idx !== -1) {
      setActiveGalleryIndex(idx);
      if (mobileGalleryRef.current) {
        isProgrammaticScroll.current = true;
        const width = mobileGalleryRef.current.clientWidth;
        if (width > 0) {
          mobileGalleryRef.current.scrollTo({ left: idx * width, behavior: 'smooth' });
        }
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 350);
      }
    }

    // Two-way sync: jika thumbnail ini cocok dengan swatch warna, otomatis aktifkan warnanya
    const matchedColor = colors.find(
      (c) => c.image && c.image.trim() === imgSrc.trim()
    );
    if (matchedColor && matchedColor.name.toLowerCase() !== selectedColor.name.toLowerCase()) {
      setSelectedColor(matchedColor);
    }
  };

  // Stok varian spesifik yang dipilih (warna + size)
  const selectedVariantStock = useMemo(() => {
    if (variants.length > 0) {
      const sColor = selectedColor.name.trim().toLowerCase();
      const sSize = selectedSize.trim().toUpperCase();
      const v = variants.find(
        (vr) =>
          vr.colorName.trim().toLowerCase() === sColor &&
          vr.size.trim().toUpperCase() === sSize
      );
      if (v !== undefined) return v.stock;
      // Color found but no matching size variant = not configured, use product-level stock
      const colorVariants = variants.filter(
        (vr) => vr.colorName.trim().toLowerCase() === sColor
      );
      if (colorVariants.length > 0) {
        // Specific size not found but color variants exist = size is available, use max of color
        return Math.max(...colorVariants.map((v) => v.stock));
      }
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
        const cName = c.name.trim().toLowerCase();
        const colorVariants = variants.filter(
          (v) => v.colorName.trim().toLowerCase() === cName
        );
        const isColorSoldOut =
          colorVariants.length > 0 && colorVariants.every((v) => v.stock <= 0);
        return { ...c, outOfStock: isColorSoldOut };
      })
    );
    // Sinkronkan juga status outOfStock pada selectedColor yang aktif
    setSelectedColor((prev) => {
      const pName = prev.name.trim().toLowerCase();
      const colorVariants = variants.filter(
        (v) => v.colorName.trim().toLowerCase() === pName
      );
      const isColorSoldOut =
        colorVariants.length > 0 && colorVariants.every((v) => v.stock <= 0);
      return { ...prev, outOfStock: isColorSoldOut };
    });
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

      // Rebuild color photo map dari data terbaru
      const freshFallback = found.image || '/images/catalog/catalog-01.jpg';
      const freshMap = buildColorPhotoMap(found.swatches, freshFallback);
      setColorPhotoMap(freshMap);

      // Pertahankan warna yang SEDANG DIPILIH oleh user
      setSelectedColor((prevSelected) => {
        const pName = prevSelected.name.trim().toLowerCase();
        const matched = freshColors.find(
          (c) => c.name.trim().toLowerCase() === pName
        );
        const resolvedColor = matched || freshColors[0]!;
        // Perbarui galeri foto untuk warna yang aktif (hanya ganti jika warna punya multi-foto tersendiri)
        const freshPhotos = freshMap[resolvedColor.name.trim().toLowerCase()];
        if (freshPhotos && freshPhotos.length > 1) {
          setGalleryImages(freshPhotos);
        } else {
          setGalleryImages(buildGalleryList(found.image, found.images, found.swatches));
        }
        return resolvedColor;
      });
    });

    // Refresh data varian dari API publik (tanpa hambatan auth admin)
    fetch(`/api/products/${encodeURIComponent(slug)}/variants`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted || !data?.variants) return;
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          setVariants(data.variants);
          setVariantsReady(true);

          // Otomatis pilih size yang memiliki stok tersedia untuk warna aktif agar tidak langsung "OUT OF STOCK"
          const colorVariants = data.variants.filter(
            (v: ProductVariant) => v.colorName.trim().toLowerCase() === selectedColor.name.trim().toLowerCase()
          );
          if (colorVariants.length > 0) {
            const currentVar = colorVariants.find(
              (v: ProductVariant) => v.size.trim().toUpperCase() === selectedSize.trim().toUpperCase()
            );
            if (!currentVar || currentVar.stock <= 0) {
              const inStock = colorVariants.find((v: ProductVariant) => v.stock > 0);
              if (inStock) {
                setSelectedSize(inStock.size);
              }
            }
          }
        } else {
          setVariantsReady(true);
        }
      })
      .catch(() => {
        setVariantsReady(true); // fallback to SSR data on error
      });

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

    const cartItemId = `${slug}-${selectedColor.name}-${selectedSize}`;
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
        edition: dbProduct.material || dbProduct.fabric || dbProduct.edition || '100% Cupro',
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
      edition: dbProduct.material || dbProduct.fabric || dbProduct.edition || '100% Cupro',
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
      <main className="w-full flex-1 pb-20">
        
        {/* ── 1. MOBILE FULL-SCREEN IMAGE HERO (< lg) — MATCHING TAZA ── */}
        <section className="lg:hidden relative w-full h-[calc(100svh-4rem)] sm:h-[calc(100dvh-4rem)] min-h-[560px] bg-[#F7F5F0] overflow-hidden select-none">
          {/* Floating Back Button (Top Left) */}
          <button
            type="button"
            onClick={handleBack}
            className="absolute top-3.5 left-3.5 z-30 flex h-8 items-center gap-1.5 rounded-full bg-white/85 px-3 text-[10px] font-medium tracking-[0.16em] uppercase text-black backdrop-blur-md shadow-xs border border-black/10 active:scale-95 transition cursor-pointer"
            aria-label="Kembali"
          >
            <Icon name="arrow_back" size={13} />
            <span>{language === 'id' ? 'Kembali' : 'Back'}</span>
          </button>

          {/* Floating Zoom Button (Top Right) — matches taza screenshot */}
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="absolute top-3.5 right-3.5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-black backdrop-blur-md shadow-xs border border-black/10 hover:bg-white active:scale-95 transition cursor-pointer"
            aria-label="Zoom Photo"
            title="Lihat foto resolusi penuh"
          >
            <Icon name="zoom_in" size={18} />
          </button>

          {/* Badge Label (Best Seller / Trending / Sale) */}
          {dbProduct.badge && (
            <span
              className={`absolute top-13 left-3.5 z-20 px-2.5 py-1 text-[8px] font-medium tracking-[0.22em] uppercase backdrop-blur-xs shadow-xs border ${
                dbProduct.badge.toLowerCase().includes('best')
                  ? 'bg-[#1C1917]/95 text-[#FBF9F5] border-black/30'
                  : dbProduct.badge.toLowerCase().includes('trend')
                  ? 'bg-[#FAF8F5]/95 text-[#2C2723] border-[#DDD5C7]'
                  : 'bg-[#1C1917]/95 text-[#FBF9F5] border-black/30'
              }`}
            >
              <span className="mr-1 opacity-75">✦</span>
              {dbProduct.badge}
            </span>
          )}

          {/* Mobile Fullscreen Swipeable Gallery */}
          <div
            ref={mobileGalleryRef}
            onScroll={handleGalleryScroll}
            className="flex h-full w-full overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {galleryImages.map((imgSrc, idx) => (
              <div
                key={`mob-${imgSrc}-${idx}`}
                className="relative h-full w-full shrink-0 snap-center cursor-zoom-in"
                style={{ scrollSnapAlign: 'center' }}
                onClick={() => setZoomOpen(true)}
              >
                <StudioImage
                  src={imgSrc}
                  alt={`${title} - view ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  preset="full"
                  onError={() => {
                    const fallback = dbProduct.image || '/images/catalog/catalog-01.jpg';
                    if (imgSrc !== fallback) {
                      setActiveImage(fallback);
                    }
                  }}
                  unoptimized={
                    !imgSrc.startsWith('/') &&
                    !imgSrc.includes('supabase.co') &&
                    !imgSrc.includes('unsplash.com')
                  }
                  className="object-cover object-top"
                />
              </div>
            ))}
          </div>


        </section>

        {/* ── 2. MAIN CONTAINER (DETAILS & DESKTOP GALLERY) ── */}
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-8">
          
          {/* Desktop-only Back Button */}
          <div className="hidden lg:block mb-4">
            <button
              type="button"
              onClick={handleBack}
              className="group -ml-2 inline-flex min-h-[44px] items-center gap-2 px-2 py-2 text-[10px] sm:text-[11px] font-normal tracking-[0.18em] uppercase text-black/60 hover:text-black active:opacity-40 transition-colors cursor-pointer select-none"
              aria-label="Kembali"
            >
              <Icon
                name="arrow_back"
                size={14}
                className="transition-transform group-hover:-translate-x-1 text-black/70 group-hover:text-black shrink-0"
              />
              <span>{language === 'id' ? 'Kembali' : 'Back'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-14 items-start">
            
            {/* ── KOLOM DETAIL & FORM PEMBELIAN ── */}
            <div className="flex flex-col lg:col-span-6 space-y-6">
              
              {/* ── DERETAN THUMBNAIL MOBILE (Muncul saat discroll ke bawah foto utama 100%) ── */}
              {galleryImages.length > 1 && (
                <div
                  ref={mobileThumbnailBarRef}
                  className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar"
                >
                  <div className="flex items-center gap-2.5 py-1.5">
                    {galleryImages.map((imgSrc, idx) => {
                      const isActive = idx === activeGalleryIndex || activeImage === imgSrc;
                      return (
                        <button
                          key={`mob-thumb-bar-${imgSrc}-${idx}`}
                          type="button"
                          data-active={isActive ? 'true' : 'false'}
                          onClick={() => handleSelectGalleryImage(imgSrc)}
                          className={`relative h-18 w-13.5 sm:h-20 sm:w-15 shrink-0 overflow-hidden bg-[#ECE8E1] cursor-pointer transition-all ${
                            isActive
                              ? 'ring-1.5 ring-black ring-offset-2 ring-offset-white opacity-100'
                              : 'opacity-50 hover:opacity-90 border border-black/10'
                          }`}
                          aria-label={`Thumbnail ${idx + 1}`}
                        >
                          <StudioImage
                            src={imgSrc}
                            alt={`Thumbnail ${idx + 1}`}
                            fill
                            preset="thumbnail"
                            className="object-cover object-top"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                    COLOR &mdash;{' '}
                    <span className="font-normal text-black/80">{selectedColor.name}</span>
                    {selectedColor.outOfStock && (
                      <span className="ml-2 font-normal text-rose-600 tracking-normal normal-case">
                        (Habis)
                      </span>
                    )}
                  </span>
                </div>
                
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {colors.map((c) => {
                    const isSelected = selectedColor.name.trim().toLowerCase() === c.name.trim().toLowerCase();
                    return (
                      <div key={c.name} className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleSelectColor(c)}
                          className={`group relative flex h-7 w-7 items-center justify-center rounded-full cursor-pointer ${
                            c.outOfStock
                              ? 'opacity-60'
                              : ''
                          } ${
                            isSelected
                              ? 'ring-1 ring-black ring-offset-2 ring-offset-white'
                              : 'ring-1 ring-black/20 hover:ring-black/60'
                          }`}
                          title={c.outOfStock ? `${c.name} — Stok Habis` : c.name}
                          aria-label={`Pilih warna ${c.name}${c.outOfStock ? ' (Stok Habis)' : ''}`}
                        >
                          <span
                            className="h-full w-full rounded-full border border-black/10"
                            style={{ backgroundColor: c.hex }}
                          />

                          {c.outOfStock && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <span className="h-[1.5px] w-6 rotate-[-45deg] bg-black/60" />
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Ukuran */}
              <div>
                <span className="text-[10px] font-normal tracking-[0.16em] uppercase text-black/60">
                  SIZE
                </span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {sizeOptions.map((sz) => {
                    const isSelected = selectedSize.trim().toUpperCase() === sz.trim().toUpperCase();
                    // Cek apakah kombinasi warna+size ini habis
                    // Only mark sold-out after variants confirmed from live API (prevents 1s flicker)
                    const szVariant = variantsReady && variants.length > 0
                      ? variants.find(
                          (v) =>
                            v.colorName.trim().toLowerCase() === selectedColor.name.trim().toLowerCase() &&
                            v.size.trim().toUpperCase() === sz.trim().toUpperCase()
                        )
                      : undefined;
                    const isSzSoldOut = szVariant !== undefined && szVariant.stock <= 0;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => !isSzSoldOut && setSelectedSize(sz)}
                        disabled={isSzSoldOut}
                        className={`h-9 min-w-[46px] border px-4 text-[10px] tracking-wider uppercase font-normal inline-flex items-center justify-center transition-colors ${
                          isSzSoldOut
                            ? 'border-black/[0.08] bg-white text-black/25 cursor-not-allowed line-through'
                            : isSelected
                            ? 'border-black bg-white text-black font-medium ring-1 ring-black cursor-pointer'
                            : 'border-black/[0.12] bg-white text-black/75 hover:border-black hover:text-black cursor-pointer'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Material Produk (Spesifikasi Material) */}
              <div>
                <span className="text-[10px] font-normal tracking-[0.16em] uppercase text-black/60">
                  MATERIAL
                </span>
                <div className="mt-2.5">
                  <div className="inline-flex items-center justify-center h-9 border border-black/[0.12] bg-white px-4 text-[10px] font-normal tracking-wider text-black select-none uppercase">
                    {dbProduct.material || dbProduct.fabric || '100% Cupro Silk Linen'}
                  </div>
                </div>
              </div>

              {/* Kuantitas */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-normal tracking-[0.16em] uppercase text-black/60">
                    QUANTITY
                  </span>
                  {isOutOfStock && variantsReady ? (
                    <span className="text-[9.5px] font-normal text-rose-600 uppercase tracking-wider">
                      Stok Habis
                    </span>
                  ) : variantsReady && availableStock <= 5 ? (
                    <span className="text-[9.5px] font-normal text-amber-700">
                      Sisa {availableStock} lagi
                    </span>
                  ) : null}
                </div>
                <div className="mt-2.5 inline-flex items-center h-9 border border-black/[0.12] bg-white">
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity <= 1}
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="h-full px-3 text-[11px] text-black/60 hover:text-black transition-colors hover:bg-black/5 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Kurangi kuantitas"
                  >
                    &minus;
                  </button>
                  <span className="h-full w-10 flex items-center justify-center text-[11px] font-normal text-black border-x border-black/[0.08]">
                    {isOutOfStock ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity >= availableStock}
                    onClick={() => setQuantity((prev) => Math.min(availableStock, prev + 1))}
                    className="h-full px-3 text-[11px] text-black/60 hover:text-black transition-colors hover:bg-black/5 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center"
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
                  className="w-full bg-[#1A1A1A] hover:bg-black py-4 text-center text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors cursor-pointer active:opacity-90 disabled:bg-black/30 disabled:cursor-not-allowed"
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

            {/* ── KOLOM KANAN (lg:col-span-6): DESKTOP STICKY GALLERY (hidden di mobile, lg:flex di desktop) ── */}
            <div className="hidden lg:flex flex-col items-start lg:col-span-6 static lg:sticky lg:top-24 w-full">
              <div
                className="relative aspect-[3/4] w-full max-h-[640px] xl:max-h-[680px] overflow-hidden bg-[#ECE8E1] border border-black/5 cursor-zoom-in group"
                onClick={() => setZoomOpen(true)}
              >
                {/* Desktop Zoom button on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomOpen(true);
                  }}
                  className="absolute top-3.5 right-3.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-black backdrop-blur-md shadow-xs border border-black/10 hover:bg-white active:scale-95 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label="Zoom Photo"
                  title="Lihat foto resolusi penuh"
                >
                  <Icon name="zoom_in" size={18} />
                </button>

                {dbProduct.badge && (
                  <span
                    className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[7.5px] sm:text-[8.5px] font-medium tracking-[0.22em] uppercase backdrop-blur-xs shadow-xs ${
                      dbProduct.badge.toLowerCase().includes('best')
                        ? 'bg-[#1C1917]/95 text-[#FBF9F5] border border-white/20'
                        : dbProduct.badge.toLowerCase().includes('trend')
                        ? 'bg-[#FAF8F5]/95 text-[#2C2723] border border-[#DDD5C7]'
                        : 'bg-[#1C1917]/95 text-[#FBF9F5] border border-white/20'
                    }`}
                  >
                    <span className="mr-1 text-[8px] sm:text-[9px] opacity-75">✦</span>
                    {dbProduct.badge}
                  </span>
                )}
                <StudioImage
                  src={activeImage}
                  alt={`${title} - ${selectedColor.name}`}
                  fill
                  priority
                  preset="spotlight"
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
                  className="object-cover object-top"
                />
              </div>

              {galleryImages.length > 1 && (
                <div className="no-scrollbar mt-3 flex items-center justify-start gap-2.5 overflow-x-auto py-1.5 w-full">
                  {galleryImages.map((imgSrc, idx) => {
                    const isActive = idx === activeGalleryIndex || activeImage === imgSrc;
                    return (
                      <button
                        key={`desk-thumb-${imgSrc}-${idx}`}
                        type="button"
                        onClick={() => handleSelectGalleryImage(imgSrc)}
                        className={`relative h-15 w-11.5 flex-shrink-0 overflow-hidden bg-[#ECE8E1] cursor-pointer transition-all ${
                          isActive
                            ? 'ring-1.5 ring-black ring-offset-2 ring-offset-white opacity-100'
                            : 'opacity-50 hover:opacity-90 border border-black/10'
                        }`}
                        aria-label={`Thumbnail photo ${idx + 1}`}
                      >
                        <StudioImage
                          src={imgSrc}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          preset="thumbnail"
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
            <RevealOnScroll variant="fade-up">
              <section className="mt-20 sm:mt-24 border-t border-black/10 pt-12 sm:pt-16">
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
            </RevealOnScroll>
          )}

        </div>
      </main>

      {/* ── FULLSCREEN LIGHTBOX ZOOM MODAL ── */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setZoomOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition cursor-pointer"
            aria-label="Tutup Zoom"
          >
            <Icon name="close" size={24} />
          </button>

          {/* Photo Counter */}
          {galleryImages.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 rounded-full bg-white/10 px-3.5 py-1 text-xs font-mono tracking-widest text-white backdrop-blur-xs">
              {activeGalleryIndex + 1} / {galleryImages.length}
            </div>
          )}

          {/* Navigation Arrows if > 1 photo */}
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const prev = (activeGalleryIndex - 1 + galleryImages.length) % galleryImages.length;
                  setActiveGalleryIndex(prev);
                  setActiveImage(galleryImages[prev]!);
                }}
                className="absolute left-3 sm:left-6 z-50 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition cursor-pointer"
                aria-label="Foto Sebelumnya"
              >
                <Icon name="chevron_left" size={26} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = (activeGalleryIndex + 1) % galleryImages.length;
                  setActiveGalleryIndex(next);
                  setActiveImage(galleryImages[next]!);
                }}
                className="absolute right-3 sm:right-6 z-50 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition cursor-pointer"
                aria-label="Foto Selanjutnya"
              >
                <Icon name="chevron_right" size={26} />
              </button>
            </>
          )}

          {/* High-res Image Display */}
          <div
            className="relative h-full w-full max-w-4xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <StudioImage
              src={galleryImages[activeGalleryIndex] || activeImage}
              alt={`${title} - full preview`}
              fill
              preset="full"
              priority
              className="object-contain"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
