'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/context/LanguageContext';
import {
  getSiteSections,
  getCachedSiteSections,
  DEFAULT_SITE_SECTIONS,
  LookbookPageConfig,
  getDbProducts,
  loadFromLocalStorage,
} from '@/integrations/supabase';
import { mapDbProductToProduct } from '@/features/catalog';

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
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [cfg, setCfg] = useState<LookbookPageConfig>(() => {
    const cached = getCachedSiteSections();
    return (
      cached.lookbookVolumesConfig?.['vol-1'] ||
      cached.lookbookPage ||
      DEFAULT_SITE_SECTIONS.lookbookPage!
    );
  });

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

    // 3. Immediately load products from local storage cache
    const local = loadFromLocalStorage();
    if (local && local.length > 0) {
      setProducts(local.filter((p) => !p.hidden).map(mapDbProductToProduct));
    }

    // 4. Background fresh fetch for products from server/cloud database
    getDbProducts().then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        setProducts(items.filter((p) => !p.hidden).map(mapDbProductToProduct));
      }
    });

    // 5. Refresh sections from cloud in background (force refresh to guarantee admin sync)
    getSiteSections(true).then((sections) => {
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
    const maxIdx = Math.max(products.length - 1, 0);
    const idx = Math.min(Math.max(Math.round(el.scrollLeft / cardWidth), 0), maxIdx);
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
            {cfg.heroSubtitle || 'SEVAYA • SEVILLA'}
          </span>
          <h1 className="mt-2 font-sans text-base sm:text-xl lg:text-2xl font-medium tracking-[0.18em] text-[#000000] uppercase">
            {cfg.heroTitle || 'SEVILLA ABAYA'}
          </h1>
          <p className="mt-4 text-[10px] sm:text-[11px] leading-relaxed text-[#333333] font-light max-w-xl mx-auto">
            {cfg.seasonDesc ||
              "Sevilla Abaya An everyday expression of quiet elegance. Meet the Sevilla Abaya, our signature piece inspired by the timeless beauty of Andalusia. Designed with a graceful, flowing silhouette, Sevilla brings together a soft drape, thoughtful details, and a versatile design that feels equally at home in your everyday routine and special moments."}
          </p>
        </header>

        {/* Section 2: Editorial Hero Photo */}
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

        {/* Section 3: The Seed of The Story (Features with Custom Purpose Points) */}
        <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
          <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
            {cfg.seasonTitle || 'The Seed of The Story'}
          </h2>
          <ul className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543] space-y-2">
            <li>
              <span className="font-medium text-[#000000]">
                {cfg.purpose1Title || 'Two looks in one'}:
              </span>{' '}
              {cfg.purpose1Desc ||
                'A beautiful abstract button detail lets you style your abaya in two different ways, giving you more versatility in one piece.'}
            </li>
            <li>
              <span className="font-medium text-[#000000]">
                {cfg.purpose2Title || '40 cm front zipper'}:
              </span>{' '}
              {cfg.purpose2Desc ||
                'Designed for extra convenience, making everyday activities and mealtimes easier.'}
            </li>
            <li>
              <span className="font-medium text-[#000000]">
                {cfg.purpose3Title || 'Two side pockets'}:
              </span>{' '}
              {cfg.purpose3Desc ||
                'Functional pockets on both the right and left sides, perfect for keeping your essentials close at hand.'}
            </li>
          </ul>
        </section>

        {/* Centered Editorial Collage — 2 Photos Side by Side */}
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

        {/* Section 4: Fabric Story */}
        <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
          <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
            {cfg.panorama1Title || 'Fabric Story'}
          </h2>
          <p className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543]">
            {cfg.panorama1Desc ||
              'A Fabric Chosen for Its Feel. 60% Cupro · 40% Viscose A thoughtful blend selected for its silky touch, soft feel, and fluid drape. Cupro is a regenerated cellulose fibre made from cotton linter, a material left over from cotton processing. Viscose is also a regenerated cellulose fibre, commonly made from wood pulp or other cellulose sources. Together, they create a fabric with an elegant fall and a smooth, refined appearance—bringing ease and understated sophistication to everyday dressing. We believe the fabric is an essential part of the experience: not only how a garment looks, but how it moves and feels when you wear it.'}
          </p>
        </section>

        {/* Centered Editorial Feature Image — Panorama 1 */}
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

        {/* Section 5: The Seed of The Story / Specifications */}
        <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
          <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
            {cfg.triptychTitle || 'The Seed of The Story'}
          </h2>
          <div className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543] whitespace-pre-line">
            {cfg.triptychDesc ||
              '• A graceful, flowing silhouette • Soft-touch fabric with an elegant drape • Hidden side pockets for everyday convenience • Front zipper for ease of wear • Abstract button detail at the sleeve • Designed for versatile modest styling\n\nFabric composition: 60% Cupro, 40% Viscose\nCare: Follow the garment\'s care label to maintain its texture, shape, and appearance.'}
          </div>
          <p className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543] mt-3 font-medium tracking-wide uppercase">
            {cfg.triptychTagline || 'SEVAYA — Slow fashion, thoughtfully made.'}
          </p>
        </section>

        {/* Centered Gallery — 3 Photos Side by Side (Triptych) */}
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

        {/* Centered Final Movement Frame */}
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
            {cfg.shopTag || 'SHOP THE COLLECTION'}
          </span>
          <h2 className="mt-1 font-sans text-sm font-medium tracking-[0.15em] text-[#000000] uppercase sm:text-lg">
            {cfg.shopTitle || cfg.heroTitle || 'SEVILLA ABAYA'}
          </h2>
          <p className="mt-2 text-[10px] sm:text-xs text-[#555555] max-w-md font-light">
            {cfg.shopDesc ||
              'Siluet bernapas dan palet warna alami yang dirancang untuk menemani setiap langkah dalam ritme Anda sendiri.'}
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
            {products.length === 0 ? (
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-[58vw] shrink-0 sm:w-[46vw] md:w-[285px] lg:w-[calc(25%-18px)] animate-pulse"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="aspect-[3/4] w-full bg-[#F4F4F4] rounded-xs mb-3" />
                  <div className="h-3 w-3/4 bg-[#EBEBEB] rounded mb-2" />
                  <div className="h-3 w-1/3 bg-[#F0F0F0] rounded" />
                </div>
              ))
            ) : (
              products.map((prod) => (
                <div
                  key={prod.id}
                  className="w-[58vw] shrink-0 sm:w-[46vw] md:w-[285px] lg:w-[calc(25%-18px)]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <ProductCard product={prod} />
                </div>
              ))
            )}
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
        {products.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-1.5 sm:hidden">
            {products.map((_, i) => (
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
        )}
      </section>

      <Footer />
    </div>
  );
}
