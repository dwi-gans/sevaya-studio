'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getDbProducts, DEFAULT_DB_PRODUCTS, DbProduct } from '@/integrations/supabase';
import { SEARCH_CATALOG } from '@/data/searchCatalog';
import { DEFAULT_BEST_SELLERS } from '@/components/home/ProductGrid';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { Footer } from '@/components/layout/Footer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ProductColorOption {
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
const SIZE_OPTIONS = ['All Size'];

/**
 * Mencari produk secara instan dan akurat berdasarkan slug dari seluruh sumber data
 */
function findInitialProduct(slug: string): DbProduct {
  // 1. Cek di DEFAULT_DB_PRODUCTS
  const fromDb = DEFAULT_DB_PRODUCTS.find((p) => p.slug === slug);
  if (fromDb) return fromDb;

  // 2. Cek di DEFAULT_BEST_SELLERS
  const fromBest = DEFAULT_BEST_SELLERS.find((p) => p.slug === slug);
  if (fromBest) {
    return {
      id: fromBest.id,
      slug: fromBest.slug,
      title: fromBest.title,
      price: fromBest.price,
      original_price: fromBest.originalPrice,
      badge: fromBest.badge,
      image: fromBest.image,
      images: fromBest.images,
      swatches: (fromBest.swatches || []).map((s) => ({
        name: s.name,
        color: s.color,
        image: fromBest.image,
      })),
      edition: fromBest.edition,
    };
  }

  // 3. Cek di SEARCH_CATALOG
  const fromSearch = SEARCH_CATALOG.find((p) => p.slug === slug);
  if (fromSearch) {
    return {
      id: fromSearch.id,
      slug: fromSearch.slug,
      title: fromSearch.title,
      price: fromSearch.price,
      original_price: fromSearch.originalPrice,
      badge: fromSearch.badge,
      image: fromSearch.image,
      images: [fromSearch.image],
      swatches: [
        { name: 'Black', color: '#1C1C1E', image: fromSearch.image },
        { name: 'Navy', color: '#1B263B', image: '/images/catalog/catalog-05.jpg' },
        { name: 'Espresso', color: '#3E2A20', image: '/images/catalog/catalog-07.jpg' },
        { name: 'Olive Brown', color: '#8C857B', image: '/images/catalog/catalog-04.jpg' },
      ],
      edition: fromSearch.edition,
    };
  }

  // 4. Fallback dinamis cerdas dari slug
  const titleFallback = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    id: slug,
    slug,
    title: titleFallback,
    price: 1339000,
    image: '/images/catalog/catalog-01.jpg',
    images: ['/images/catalog/catalog-01.jpg'],
    swatches: [
      { name: 'Black', color: '#1C1C1E', image: '/images/catalog/catalog-01.jpg' },
      { name: 'Navy', color: '#1B263B', image: '/images/catalog/catalog-05.jpg' },
      { name: 'Espresso', color: '#3E2A20', image: '/images/catalog/catalog-07.jpg' },
      { name: 'Olive Brown', color: '#8C857B', image: '/images/catalog/catalog-04.jpg' },
    ],
  };
}

export default function ProductDetailPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  // Inisialisasi awal sinkron agar data produk langsung tampil tanpa delay atau salah nama
  const initialProduct = useMemo(() => findInitialProduct(slug), [slug]);
  const [dbProduct, setDbProduct] = useState<DbProduct>(initialProduct);

  // Opsi warna berdasarkan produk
  const [colors, setColors] = useState<ProductColorOption[]>(() => {
    if (initialProduct.swatches && initialProduct.swatches.length > 0) {
      return initialProduct.swatches.map((s, idx) => ({
        name: s.name,
        hex: s.color,
        image: s.image || initialProduct.image || '/images/catalog/catalog-01.jpg',
        outOfStock: idx === 3,
      }));
    }
    return DEFAULT_COLOR_OPTIONS;
  });

  const [selectedColor, setSelectedColor] = useState<ProductColorOption>(() => colors[0] || DEFAULT_COLOR_OPTIONS[0]!);
  const [selectedSize, setSelectedSize] = useState<string>(SIZE_OPTIONS[0]!);
  const [selectedQuality, setSelectedQuality] = useState<string>(QUALITY_OPTIONS[0]!);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<string>(() => initialProduct.image || '/images/catalog/catalog-01.jpg');

  // Accordion state
  const [fabricOpen, setFabricOpen] = useState(false);
  const [sizingOpen, setSizingOpen] = useState(false);

  // Gallery thumbnails
  const [galleryImages, setGalleryImages] = useState<string[]>(() => [
    initialProduct.image || '/images/catalog/catalog-01.jpg',
    '/images/catalog/catalog-03.jpg',
    '/images/catalog/catalog-04.jpg',
    '/images/catalog/catalog-05.jpg',
    '/images/catalog/catalog-06.jpg',
    '/images/catalog/catalog-07.jpg',
  ]);

  // Sinkronisasi dinamis jika slug berubah atau Supabase ter-update
  useEffect(() => {
    let isMounted = true;
    const initial = findInitialProduct(slug);
    setDbProduct(initial);

    let mapped: ProductColorOption[] = [];
    if (initial.swatches && initial.swatches.length > 0) {
      mapped = initial.swatches.map((s, idx) => ({
        name: s.name,
        hex: s.color,
        image: s.image || initial.image || '/images/catalog/catalog-01.jpg',
        outOfStock: idx === 3,
      }));
    } else {
      mapped = DEFAULT_COLOR_OPTIONS;
    }
    setColors(mapped);
    setSelectedColor(mapped[0] || DEFAULT_COLOR_OPTIONS[0]!);
    setActiveImage(initial.image || mapped[0]?.image || '/images/catalog/catalog-01.jpg');

    // Fetch dari cloud database Supabase
    getDbProducts().then((items) => {
      if (!isMounted) return;
      const found = items.find((p) => p.slug === slug);
      if (found) {
        setDbProduct(found);
        if (found.swatches && found.swatches.length > 0) {
          const fromDbColors: ProductColorOption[] = found.swatches.map((s, idx) => ({
            name: s.name,
            hex: s.color,
            image: s.image || found.image || '/images/catalog/catalog-01.jpg',
            outOfStock: idx === 3,
          }));
          setColors(fromDbColors);
          setSelectedColor(fromDbColors[0]!);
          setActiveImage(fromDbColors[0]!.image);

          const thumbs = Array.from(
            new Set([
              ...fromDbColors.map((c) => c.image),
              found.image,
              '/images/catalog/catalog-01.jpg',
              '/images/catalog/catalog-03.jpg',
              '/images/catalog/catalog-04.jpg',
              '/images/catalog/catalog-05.jpg',
              '/images/catalog/catalog-06.jpg',
              '/images/catalog/catalog-07.jpg',
            ].filter(Boolean) as string[])
          );
          setGalleryImages(thumbs);
        } else if (found.image) {
          setActiveImage(found.image);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Nama dan Harga Produk
  const title = (dbProduct?.title || initialProduct.title).toUpperCase();
  const price = dbProduct?.price || initialProduct.price || 1339000;
  const formattedPrice = `RP ${price.toLocaleString('id-ID')}`;

  const handleAddToCart = () => {
    addToCart({
      id: `${slug}-${selectedColor.name}-${selectedSize}-${selectedQuality}`,
      title,
      edition: selectedQuality,
      price,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      size: selectedSize,
      image: activeImage,
      quantity,
    });

    showToast(`Ditambahkan ke keranjang: ${title} (${selectedColor.name})`);
  };

  // Koleksi Produk Terkait (Related Products)
  const relatedProducts: Product[] = useMemo(() => {
    const list: Product[] = [];
    const seenSlugs = new Set([slug]);

    for (const item of SEARCH_CATALOG) {
      if (!seenSlugs.has(item.slug)) {
        seenSlugs.add(item.slug);
        list.push({
          id: String(item.id),
          slug: item.slug,
          title: item.title,
          edition: item.edition || 'Classic Cupro',
          price: item.price,
          originalPrice: item.originalPrice,
          badge: item.badge,
          image: item.image,
          images: [item.image],
          swatches: [
            { name: 'Black', color: '#1A1A1A', image: item.image },
            { name: 'Mocha', color: '#B28E78', image: item.image },
            { name: 'Dusty Pink', color: '#DCAEAA', image: item.image },
          ],
        });
        if (list.length >= 4) break;
      }
    }
    return list;
  }, [slug]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <main className="w-full flex-1 pt-8 sm:pt-10 pb-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* 
            Layout Sesuai Permintaan User:
            - Desktop (lg): Kolom Kiri = Detail & Pilihan Beli, Kolom Kanan = Foto Produk Portrait
            - Mobile: Foto di atas, rincian di bawah
            - Font asli konsisten (font-sans SEVAYA asli, bukan diganti serif)
          */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 items-start">
            
            {/* ── KOLOM KIRI (lg:col-span-6): DETAIL PRODUK & FORM PEMBELIAN ── */}
            <div className="order-2 flex flex-col lg:order-1 lg:col-span-6 space-y-6">
              
              {/* Header Produk: Judul & Harga (Font Asli Konsisten) */}
              <div>
                <h1 className="font-sans text-sm sm:text-base lg:text-lg font-normal tracking-[0.18em] text-black uppercase">
                  {title}
                </h1>
                <p className="mt-2 text-xs sm:text-sm font-normal tracking-wider text-black/75 uppercase">
                  {formattedPrice}
                </p>
              </div>

              {/* Paragraf Deskripsi Produk — tepat di bawah Harga */}
              <div className="text-[11px] leading-relaxed text-black/70">
                <p>
                  The {title} features the same cut as our signature Alia One Set, but refreshed with minimalist button details on the sleeves. Designed in a relaxed fit and crafted from 100% premium cupro silk linen, it offers an easy, comfortable feel while keeping the look effortlessly stylish. The front buttons add a practical touch to the design, making {title.toLowerCase()} an easy choice for running errands, slow days, and everything in between.
                </p>
              </div>

              {/* ── Pilihan Warna (COLOR) — Bulat-bulat dengan Swatches ── */}
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-black">
                    COLOR &mdash; <span className="font-normal text-black/80">{selectedColor.name}</span>
                  </span>
                </div>
                
                {/* Swatch Bulat-bulat Sesuai Request User */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {colors.map((c) => {
                    const isSelected = selectedColor.name === c.name;
                    return (
                      <div key={c.name} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedColor(c);
                            setActiveImage(c.image);
                          }}
                          className={`group relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'ring-1 ring-black ring-offset-2 ring-offset-white scale-105'
                              : 'ring-1 ring-black/20 hover:ring-black/60'
                          } ${c.outOfStock ? 'opacity-50' : ''}`}
                          title={c.name}
                          aria-label={`Pilih warna ${c.name}${c.outOfStock ? ' (Sold out)' : ''}`}
                        >
                          {/* Bulatan Warna Penuh */}
                          <span
                            className="h-full w-full rounded-full border border-black/10 transition-transform duration-150"
                            style={{ backgroundColor: c.hex }}
                          />

                          {/* Garis Coret Diagonal Halus jika Out of Stock */}
                          {c.outOfStock && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <span className="h-[1.5px] w-6 rotate-[-45deg] bg-black/60" />
                            </span>
                          )}
                        </button>

                        {/* Label Status Sold Out jika ada */}
                        {c.outOfStock && (
                          <span className="text-[10px] font-medium text-black/45 line-through">
                            {c.name} (Sold out)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Pilihan Ukuran (SIZE) ── */}
              <div>
                <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-black">
                  SIZE
                </span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`border px-5 py-2 text-[10px] tracking-wider uppercase transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-black bg-white text-black font-semibold'
                            : 'border-black/20 bg-white text-black/60 hover:border-black hover:text-black'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Pilihan Kualitas / Grade (QUALITY) ── */}
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

              {/* ── Pengatur Kuantitas (QUANTITY) ── */}
              <div>
                <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-black">
                  QUANTITY
                </span>
                <div className="mt-2.5 inline-flex items-center border border-black/20 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-2 text-[11px] text-black transition-colors hover:bg-black/5 cursor-pointer"
                    aria-label="Kurangi kuantitas"
                  >
                    &minus;
                  </button>
                  <span className="w-10 text-center text-[11px] font-semibold text-black">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-3 py-2 text-[11px] text-black transition-colors hover:bg-black/5 cursor-pointer"
                    aria-label="Tambah kuantitas"
                  >
                    &#43;
                  </button>
                </div>
              </div>

              {/* ── Tombol ADD TO CART Lebar Penuh (Warna & Font Konsisten) ── */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full bg-[#1A1A1A] hover:bg-black py-4 text-center text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors cursor-pointer active:scale-[0.99]"
                >
                  ADD TO CART
                </button>
              </div>

              {/* ── Accordion: FABRIC & SIZING ── */}
              <div className="border-t border-black/15 pt-2">
                
                {/* Accordion FABRIC */}
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
                      <p>
                        100% Bemberg™ Cupro Silk Linen. Naturally breathable, lightweight, with a soft cool-touch finish and elegant fluid drape. Hand wash or gentle machine wash cold, hang dry in shade, warm iron if needed.
                      </p>
                    </div>
                  )}
                </div>

                {/* Accordion SIZING */}
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
                      <p className="font-medium text-black">
                        All Size (fits XS through XL comfortably):
                      </p>
                      <ul className="mt-2 list-inside list-disc space-y-1">
                        <li>Bust / Lingkar Dada: 120 cm</li>
                        <li>Abaya Length / Panjang Baju: 140 cm</li>
                        <li>Sleeve Length / Panjang Lengan: 57 cm</li>
                        <li>Armhole / Lingkar Kerung: 52 cm</li>
                      </ul>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* ── KOLOM KANAN (lg:col-span-6): GALERI FOTO PRODUK PORTRAIT ── */}
            <div className="order-1 flex flex-col lg:order-2 lg:col-span-6 sticky top-24">
              {/* Foto Utama Besar Sejajar */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ECE8E1] border border-black/5">
                <Image
                  src={activeImage}
                  alt={`${title} - ${selectedColor.name}`}
                  fill
                  priority
                  className="object-cover object-top transition-all duration-300"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Strip Thumbnail Horizontal di Bawah Foto Utama */}
              <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto py-1">
                {galleryImages.map((imgSrc, idx) => {
                  const isActive = activeImage === imgSrc;
                  return (
                    <button
                      key={`${imgSrc}-${idx}`}
                      type="button"
                      onClick={() => setActiveImage(imgSrc)}
                      className={`relative h-16 w-12 flex-shrink-0 overflow-hidden bg-[#ECE8E1] transition-all cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-black ring-offset-1'
                          : 'opacity-70 hover:opacity-100 border border-black/10'
                      }`}
                      aria-label={`Thumbnail photo ${idx + 1}`}
                    >
                      <Image
                        src={imgSrc}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover object-top"
                        sizes="64px"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── SECTION RELATED PRODUCTS (MUNCUL KETIKA DI-SCROLL) ── */}
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

              {/* Grid 4 Produk Terkait Menggunakan ProductCard Standar */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      {/* ── FOOTER LENGKAP SEVAYA (MUNCUL DI PALING BAWAH SAAT DI-SCROLL) ── */}
      <Footer />
    </div>
  );
}
