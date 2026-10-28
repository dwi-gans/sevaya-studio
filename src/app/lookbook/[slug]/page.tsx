'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { Icon } from '@/components/ui/Icon';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS, LookbookPageConfig } from '@/integrations/supabase';

const LOOKBOOK_PRODUCTS: Product[] = [
  {
    id: 'lb-1',
    slug: 'fina-abaya-stripe-2',
    title: 'FINA ABAYA - STRIPE EDITION 2.0',
    edition: 'Edition 2.0',
    price: 499000,
    badge: 'NEW',
    image: '/images/catalog/catalog-05.jpg',
    images: ['/images/catalog/catalog-05.jpg', '/images/catalog/catalog-06.jpg'],
    swatches: [
      { name: 'Sage', color: '#889A84' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Mocha', color: '#B28E78' },
    ],
  },
  {
    id: 'lb-2',
    slug: 'tala-abaya-cloudmatte',
    title: 'TALA ABAYA - AUTUMN SERENADE',
    edition: 'Edition 2.0',
    price: 499000,
    image: '/images/catalog/catalog-07.jpg',
    images: ['/images/catalog/catalog-07.jpg', '/images/catalog/catalog-08.jpg'],
    swatches: [
      { name: 'Espresso', color: '#3A271E' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Camel', color: '#A98263' },
    ],
  },
  {
    id: 'lb-3',
    slug: 'fina-abaya-stripe-oatmeal',
    title: 'LUNA ESSENTIAL ABAYA - VOL 2',
    edition: 'Edition 2.0',
    price: 499000,
    image: '/images/catalog/catalog-10.jpg',
    images: ['/images/catalog/catalog-10.jpg', '/images/catalog/catalog-09.jpg'],
    swatches: [
      { name: 'Beige', color: '#D2BFA6' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Rose', color: '#DBA8A0' },
    ],
  },
  {
    id: 'lb-4',
    slug: 'fina-abaya-1',
    title: 'NOUR LUXURY SILHOUETTE - VOL 2',
    edition: 'Edition 2.0',
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

export default function LookbookVolumePage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'vol-2';

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
  const [volTitle, setVolTitle] = useState('VOL 2: AUTUMN SERENADE');
  const [volDesc, setVolDesc] = useState('A poetic transition into warmer tones, softer draperies, and intimate seasonal silhouettes designed for timeless elegance.');

  useEffect(() => {
    const cached = getCachedSiteSections();
    if (cached.lookbookVolumesConfig?.[slug]) {
      setCfg(cached.lookbookVolumesConfig[slug]);
    } else if (cached.lookbookPage) {
      setCfg(cached.lookbookPage);
    }
    if (cached.lookbookLinks) {
      const found = cached.lookbookLinks.find((l) => l.href.includes(slug) || l.id === slug);
      if (found) {
        setVolTitle(found.label.toUpperCase());
      }
    }
    setIsMounted(true);

    getSiteSections().then((sections) => {
      if (sections.lookbookVolumesConfig?.[slug]) {
        setCfg(sections.lookbookVolumesConfig[slug]);
      } else if (sections.lookbookPage) {
        setCfg(sections.lookbookPage);
      }
      if (sections.lookbookLinks) {
        const found = sections.lookbookLinks.find((l) => l.href.includes(slug) || l.id === slug);
        if (found) {
          setVolTitle(found.label.toUpperCase());
        }
      }
    });
  }, [slug]);

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
        
        {/* Navigation back to Vol 1 */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/lookbook"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60 hover:text-black transition"
          >
            <Icon name="arrow_back" size={16} />
            <span>← Kembali ke Lookbook Vol 1</span>
          </Link>
          <span className="rounded-full bg-black px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
            {slug.toUpperCase()}
          </span>
        </div>

        {/* Campaign Hero Header */}
        <header className="mx-auto mb-8 sm:mb-10 max-w-2xl text-center px-4">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-[#666666] uppercase">
            &apos;26 SEVAYA EDITORIAL COLLECTION
          </span>
          <h1 className="mt-2 font-sans text-base sm:text-xl lg:text-2xl font-medium tracking-[0.18em] text-[#000000] uppercase">
            {volTitle}
          </h1>
          <p className="mt-4 text-[10px] sm:text-[11px] leading-relaxed text-[#333333] font-light max-w-xl mx-auto">
            {volDesc}
          </p>
        </header>

        {/* Editorial Hero Photo */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-black/10 bg-black/5 shadow-xs">
            <EditorialImage
              isMounted={isMounted}
              src={cfg.heroImage || '/images/sevaya_hero_editorial.jpg'}
              alt="SEVAYA Volume 2 Campaign Hero"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        </div>

        {/* The Seed of The Story */}
        <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
          <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
            Crafted for Intimate Moments &amp; Warmth
          </h2>
          <ul className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543] space-y-2">
            <li><span className="font-medium text-[#000000]">Refined Drapery:</span> Enhanced cupro-viscose blend tailored for cooler evenings and graceful movement.</li>
            <li><span className="font-medium text-[#000000]">Invisible Functional Details:</span> Seamless front zippers and discreet pockets engineered into minimalist silhouettes.</li>
            <li><span className="font-medium text-[#000000]">Earthy Palette:</span> Deep terracotta, espresso, and sage tones that echo nature&apos;s autumn transitions.</li>
          </ul>
        </section>

        {/* Centered Editorial Collage */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5 shadow-xs">
              <EditorialImage
                isMounted={isMounted}
                src={cfg.collagePortrait || '/images/lookbook_figma_1.png'}
                alt="Autumn Botanical Silhouette"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 50vw, 336px"
              />
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5 shadow-xs">
              <EditorialImage
                isMounted={isMounted}
                src={cfg.collageDetail1 || '/images/figma_about_2.png'}
                alt="Autumn Textile Flow"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 50vw, 336px"
              />
            </div>
          </div>
        </div>
      </main>

      {/* SHOP THE COLLECTION */}
      <section className="border-t border-[#E5E5E5] pt-10 pb-12 sm:pt-12 sm:pb-16 bg-white/40">
        <div className="mx-auto mb-8 flex max-w-4xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-[#666666] uppercase">
            SHOP THE COLLECTION
          </span>
          <h2 className="mt-1 font-sans text-sm font-medium tracking-[0.15em] text-[#000000] uppercase sm:text-lg">
            {volTitle}
          </h2>
          <p className="mt-2 text-[10px] sm:text-xs text-[#555555] max-w-md font-light">
            Edisi terbatas eksklusif dengan sentuhan material premium dan palet warna hangat musim ini.
          </p>
        </div>

        <div className="relative mx-auto max-w-6xl sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={scrollLeft}
            className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#CCCCCC] bg-white text-[#000000] shadow-md transition-all hover:scale-105 sm:flex"
          >
            <Icon name="chevron_left" size={20} />
          </button>

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
            className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#CCCCCC] bg-white text-[#000000] shadow-md transition-all hover:scale-105 sm:flex"
          >
            <Icon name="chevron_right" size={20} />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
