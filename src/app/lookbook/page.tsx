'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { Icon } from '@/components/ui/Icon';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS, LookbookPageConfig } from '@/integrations/supabase';

const LOOKBOOK_PRODUCTS: Product[] = [
  {
    id: 'lb-1',
    slug: 'fina-abaya-stripe-2',
    title: 'FINA ABAYA - STRIPE EDITION 2.0',
    edition: 'Edition 1.0',
    price: 499000,
    badge: 'NEW',
    image: '/images/catalog/catalog-01.jpg',
    images: ['/images/catalog/catalog-01.jpg', '/images/catalog/catalog-02.jpg'],
    swatches: [
      { name: 'Grey', color: '#4A4E53' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Cream', color: '#E5D6C5' },
    ],
  },
  {
    id: 'lb-2',
    slug: 'fina-abaya-stripe-2',
    title: 'TALA ABAYA - FLORAISON',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-03.jpg',
    images: ['/images/catalog/catalog-03.jpg', '/images/catalog/catalog-04.jpg'],
    swatches: [
      { name: 'Espresso', color: '#3A271E' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Camel', color: '#A98263' },
    ],
  },
  {
    id: 'lb-3',
    slug: 'tala-abaya-cloudmatte',
    title: 'SEVILLA CUPRO - ABAYA',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-18.jpg',
    images: ['/images/catalog/catalog-18.jpg', '/images/catalog/catalog-17.jpg'],
    swatches: [
      { name: 'Beige', color: '#D2BFA6' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Blush', color: '#E8BEB7' },
    ],
  },
  {
    id: 'lb-4',
    slug: 'fina-abaya-stripe-2',
    title: 'FINA ABAYA - OATMEAL STRIPE',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-13.jpg',
    images: ['/images/catalog/catalog-13.jpg', '/images/catalog/catalog-14.jpg'],
    swatches: [
      { name: 'Sage Green', color: '#889A84' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Rose', color: '#DBA8A0' },
    ],
  },
  {
    id: 'lb-5',
    slug: 'fina-abaya-1',
    title: 'AMANI MODEST ABAYA - SAGE',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-05.jpg',
    images: ['/images/catalog/catalog-05.jpg', '/images/catalog/catalog-06.jpg'],
    swatches: [
      { name: 'Dusty Pink', color: '#DCAEAA' },
      { name: 'Mocha', color: '#B28E78' },
      { name: 'Black', color: '#1A1A1A' },
    ],
  },
  {
    id: 'lb-6',
    slug: 'tala-abaya-cloudmatte',
    title: 'TALA ABAYA - CLOUDMATTE',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-07.jpg',
    images: ['/images/catalog/catalog-07.jpg', '/images/catalog/catalog-08.jpg'],
    swatches: [
      { name: 'Mocha', color: '#B28E78' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Cream', color: '#E5D6C5' },
    ],
  },
  {
    id: 'lb-7',
    slug: 'fina-abaya-stripe-oatmeal',
    title: 'LUNA ESSENTIAL ABAYA',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-10.jpg',
    images: ['/images/catalog/catalog-10.jpg', '/images/catalog/catalog-09.jpg'],
    swatches: [
      { name: 'Camel', color: '#A98263' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Grey', color: '#4A4E53' },
    ],
  },
  {
    id: 'lb-8',
    slug: 'fina-abaya-1',
    title: 'NOUR LUXURY SILHOUETTE',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-15.jpg',
    images: ['/images/catalog/catalog-15.jpg', '/images/catalog/catalog-16.jpg'],
    swatches: [
      { name: 'Rose', color: '#DBA8A0' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Sage', color: '#889A84' },
    ],
  },
];

function EditorialImage({
  isMounted,
  src,
  alt,
  fill = true,
  className = 'object-cover',
  priority = false,
  sizes,
}: {
  isMounted: boolean;
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!isMounted) {
    return <div className="absolute inset-0 bg-black/5" />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  );
}

export default function LookbookPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [cfg, setCfg] = useState<LookbookPageConfig>(
    DEFAULT_SITE_SECTIONS.lookbookPage!
  );

  useEffect(() => {
    // 1. Immediately read cached sections from localStorage
    const cached = getCachedSiteSections();
    if (cached.lookbookVolumesConfig?.['vol-1']) {
      setCfg(cached.lookbookVolumesConfig['vol-1']);
    } else if (cached.lookbookPage) {
      setCfg(cached.lookbookPage);
    }
    // 2. Mark as mounted to safely render client images without SSR hydration mismatch
    setIsMounted(true);

    // 3. Refresh from cloud in background
    getSiteSections().then((sections) => {
      if (sections.lookbookVolumesConfig?.['vol-1']) {
        setCfg(sections.lookbookVolumesConfig['vol-1']);
      } else if (sections.lookbookPage) {
        setCfg(sections.lookbookPage);
      }
    });
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 300;
      scrollRef.current.scrollBy({ left: -(cardWidth * 2), behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 300;
      scrollRef.current.scrollBy({ left: cardWidth * 2, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.firstElementChild?.clientWidth || 280;
    const idx = Math.min(Math.max(Math.round(el.scrollLeft / cardWidth), 0), LOOKBOOK_PRODUCTS.length - 1);
    setActiveIndex((prev) => (prev !== idx ? idx : prev));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPos(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.3;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      <main className="mx-auto max-w-4xl px-4 pt-6 pb-12 sm:px-6 sm:pt-10 sm:pb-16 lg:px-8">

        {/* Section 1: Campaign Hero Header */}
        <header className="mx-auto mb-8 sm:mb-10 max-w-2xl text-center px-4">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-[#666666] uppercase">
            &apos;26 SEVILLA CUPRO ABAYA
          </span>
          <h1 className="mt-2 font-sans text-base sm:text-xl lg:text-2xl font-medium tracking-[0.18em] text-[#000000] uppercase">
            {cfg.heroTitle && cfg.heroTitle !== '26°RHAPSODY' ? cfg.heroTitle : 'VOL 1: INTO A NEW SEASON'}
          </h1>
          <p className="mt-4 text-[10px] sm:text-[11px] leading-relaxed text-[#333333] font-light max-w-xl mx-auto">
            Effortless elegance, made practical. Meet Sevilla, a thoughtfully designed abaya that combines timeless style with details that make everyday life easier. Made from a blend of 60% cupro and 40% viscose, the fabric feels soft and smooth, with a beautiful drape that moves naturally with you.
          </p>
        </header>

        {/* Section 2: Editorial Hero Photo — Matching Text Width (max-w-2xl px-2 sm:px-4) */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-black/10 bg-black/5 shadow-xs">
            <EditorialImage
              isMounted={isMounted}
              src={cfg.heroImage || '/images/sevaya_first_chapter.jpg'}
              alt="SEVAYA Floraison Campaign Hero"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        </div>

        {/* Section 3: The Seed of The Story */}
        <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
          <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
            Every detail is designed with purpose
          </h2>
          <ul className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543] space-y-2">
            <li><span className="font-medium text-[#000000]">Two looks in one:</span> A beautiful abstract button detail lets you style your abaya in two different ways, giving you more versatility in one piece.</li>
            <li><span className="font-medium text-[#000000]">40 cm front zipper:</span> Designed for extra convenience, making everyday activities and mealtimes easier.</li>
            <li><span className="font-medium text-[#000000]">Two side pockets:</span> Functional pockets on both the right and left sides, perfect for keeping your essentials close at hand.</li>
          </ul>
        </section>

        {/* Centered Editorial Collage — The Seed of The Story */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5 shadow-xs">
              <EditorialImage
                isMounted={isMounted}
                src={cfg.collagePortrait || '/images/lookbook_figma_0.png'}
                alt="Floraison Botanical Silhouette"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 50vw, 336px"
              />
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5 shadow-xs">
              <EditorialImage
                isMounted={isMounted}
                src={cfg.collageDetail1 || '/images/figma_about_1.png'}
                alt="Floraison Textile Flow"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 50vw, 336px"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Meet The Icon */}
        <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
          <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
            Practical for everyday moments
          </h2>
          <p className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543]">
            Thoughtfully designed to make daily activities—including eating and enjoying a bowl of soup—feel more comfortable and effortless. Sevilla has a timeless silhouette: an elegant, flowing shape that balances comfort, simplicity, and modern femininity.
          </p>
        </section>

        {/* Centered Editorial Feature Image — Meet The Icon — Matching Text Width */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-black/10 bg-black/5 shadow-xs">
            <EditorialImage
              isMounted={isMounted}
              src={cfg.panorama1 || '/images/figma_hero.png'}
              alt="SEVAYA Meet The Icon Editorial"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        </div>

        {/* Section 5: The Summer 2026 Collection */}
        <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
          <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
            Sevilla is more than an abaya
          </h2>
          <p className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543]">
            It is a little reminder that beautiful design should not only look good, but make life easier, too.
          </p>
          <p className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543] mt-3 font-medium tracking-wide uppercase">
            SEVAYA — Slow fashion, thoughtfully made.
          </p>
        </section>

        {/* Centered Gallery — Summer 2026 Silhouettes */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <EditorialImage
                isMounted={isMounted}
                src={cfg.triptych1 || '/images/lookbook_figma_2.png'}
                alt="Floraison Texture Detail 1"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 100vw, 224px"
              />
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <EditorialImage
                isMounted={isMounted}
                src={cfg.triptych2 || '/images/lookbook_figma_3.png'}
                alt="Floraison Texture Detail 2"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 100vw, 224px"
              />
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <EditorialImage
                isMounted={isMounted}
                src={cfg.triptych3 || '/images/lookbook_figma_4.png'}
                alt="Floraison Texture Detail 3"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 100vw, 224px"
              />
            </div>
          </div>
        </div>

        {/* Centered Final Movement Frame — Matching Text Width */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-black/10 bg-black/5 shadow-xs">
            <EditorialImage
              isMounted={isMounted}
              src={cfg.fullDress || '/images/lookbook_figma_5.png'}
              alt="SEVAYA Movement in Rhythm"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        </div>
      </main>

      {/* Section: SHOP THE COLLECTION */}
      <section className="border-t border-[#E5E5E5] pt-10 pb-12 sm:pt-12 sm:pb-16 bg-white/40">
        {/* Title */}
        <div className="mx-auto mb-8 flex max-w-4xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-[#666666] uppercase">
            SHOP THE COLLECTION
          </span>
          <h2 className="mt-1 font-sans text-sm font-medium tracking-[0.15em] text-[#000000] uppercase sm:text-lg">
            FLORAISON
          </h2>
          <p className="mt-2 text-[10px] sm:text-xs text-[#555555] max-w-md font-light">
            Siluet bernapas dan palet warna alami yang dirancang untuk menemani setiap langkah dalam ritme Anda sendiri.
          </p>
        </div>

        {/* Desktop: arrow wrapper */}
        <div className="relative mx-auto max-w-6xl sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={scrollLeft}
            className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#CCCCCC] bg-white text-[#000000] shadow-md transition-all hover:scale-105 hover:bg-[#FFFFFF] sm:flex"
          >
            <Icon name="chevron_left" size={20} />
          </button>

          {/* Carousel Track */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClickCapture={handleClickCapture}
            className={`no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-4 touch-pan-y select-none sm:-mx-6 sm:gap-6 sm:px-6 md:mx-0 md:px-0 ${
              isDown ? 'cursor-grabbing scroll-auto' : 'cursor-grab scroll-smooth'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              scrollSnapType: isDown ? 'none' : 'x proximity',
            }}
          >
            {LOOKBOOK_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                className="w-[58vw] shrink-0 sm:w-[46vw] md:w-[285px] lg:w-[calc(25%-18px)]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ProductCard product={prod} />
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Scroll right"
            onClick={scrollRight}
            className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#CCCCCC] bg-white text-[#000000] shadow-md transition-all hover:scale-105 hover:bg-[#FFFFFF] sm:flex"
          >
            <Icon name="chevron_right" size={20} />
          </button>
        </div>

        {/* Dot indicators — mobile only */}
        <div className="mt-3 flex items-center justify-center gap-1.5 sm:hidden">
          {LOOKBOOK_PRODUCTS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Produk ${i + 1}`}
              onClick={() => {
                if (!scrollRef.current) return;
                const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 280;
                scrollRef.current.scrollTo({ left: cardWidth * i, behavior: 'smooth' });
                setActiveIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === i ? 'w-5 bg-[#000000]' : 'w-1.5 bg-[#CCCCCC]'
              }`}
            />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

