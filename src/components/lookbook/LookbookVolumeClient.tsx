'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { Icon } from '@/components/ui/Icon';
import { LookbookPageConfig, getSiteSections } from '@/integrations/supabase';

interface LookbookVolumeClientProps {
  slug: string;
  initialConfig: LookbookPageConfig;
  initialProducts: Product[];
  initialVolTitle: string;
  initialVolDesc: string;
}

export function LookbookVolumeClient({
  slug,
  initialConfig,
  initialProducts,
  initialVolTitle,
  initialVolDesc,
}: LookbookVolumeClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cfg, setCfg] = useState<LookbookPageConfig>(initialConfig);
  const [volTitle, setVolTitle] = useState(initialVolTitle);
  const [volDesc] = useState(initialVolDesc);

  useEffect(() => {
    getSiteSections(true).then((sections) => {
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
            {cfg.heroSubtitle || `SEVAYA • ${slug.toUpperCase()}`}
          </span>
          <h1 className="mt-2 font-sans text-base sm:text-xl lg:text-2xl font-medium tracking-[0.18em] text-[#000000] uppercase">
            {cfg.heroTitle || volTitle}
          </h1>
          <p className="mt-4 text-[10px] sm:text-[11px] leading-relaxed text-[#333333] font-light max-w-xl mx-auto">
            {cfg.seasonDesc || volDesc}
          </p>
        </header>

        {/* Section 2: Editorial Hero Photo */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-black/10 bg-black/5 shadow-xs">
            <Image
              src={cfg.heroImage || '/images/sevaya_hero_editorial.jpg'}
              alt={`${volTitle} Campaign Hero`}
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
            {cfg.seasonTitle || 'A Poetic Transition'}
          </h2>
          <p className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543]">
            {cfg.seasonDesc || volDesc}
          </p>
        </section>

        {/* Centered Editorial Collage */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5 shadow-xs">
              <Image
                src={cfg.collagePortrait || '/images/lookbook_figma_1.png'}
                alt="Autumn Serenade Silhouette"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 50vw, 336px"
              />
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5 shadow-xs">
              <Image
                src={cfg.collageDetail1 || '/images/figma_about_2.png'}
                alt="Autumn Serenade Drapery"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 50vw, 336px"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Warm Silhouettes */}
        <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
          <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
            {cfg.panorama1Title || 'Warm Silhouettes'}
          </h2>
          <p className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543]">
            {cfg.panorama1Desc || 'Thoughtfully tailored for cooler evenings and graceful movement.'}
          </p>
        </section>

        {/* Centered Editorial Feature Image */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-black/10 bg-black/5 shadow-xs">
            <Image
              src={cfg.panorama1 || '/images/lookbook_figma_6.png'}
              alt="SEVAYA Warm Silhouettes Editorial"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        </div>

        {/* Section 5: The Autumn Collection */}
        <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
          <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
            {cfg.triptychTitle || 'The Autumn Collection'}
          </h2>
          <p className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543]">
            {cfg.triptychDesc || 'Deep terracotta, espresso, and sage tones echoing nature’s autumn transitions.'}
          </p>
          <p className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543] mt-3 font-medium tracking-wide uppercase">
            SEVAYA — Slow fashion, thoughtfully made.
          </p>
        </section>

        {/* Centered Gallery */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <Image
                src={cfg.triptych1 || '/images/lookbook_figma_8.png'}
                alt="Autumn Tone 1"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 100vw, 224px"
              />
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <Image
                src={cfg.triptych2 || '/images/lookbook_figma_9.png'}
                alt="Autumn Tone 2"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 100vw, 224px"
              />
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <Image
                src={cfg.triptych3 || '/images/lookbook_figma_0.png'}
                alt="Autumn Tone 3"
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
            <Image
              src={cfg.fullDress || '/images/lookbook_figma_2.png'}
              alt="SEVAYA Movement in Rhythm"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 672px"
            />
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
            className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#CCCCCC] bg-white text-[#000000] shadow-md transition-all hover:scale-105 sm:flex"
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
