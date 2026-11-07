'use client';

import React, { useRef, useState, useEffect } from 'react';
import { StudioImage } from '@/components/common';
import { Footer } from '@/components/layout/Footer';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { Icon } from '@/components/ui/Icon';
import { LookbookPageConfig, getSiteSections } from '@/integrations/supabase';

interface LookbookClientProps {
  initialConfig: LookbookPageConfig;
  initialProducts: Product[];
}

export function LookbookClient({ initialConfig, initialProducts }: LookbookClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cfg, setCfg] = useState<LookbookPageConfig>(initialConfig);

  useEffect(() => {
    // Background fresh fetch for sections to guarantee sync
    getSiteSections(true).then((sections) => {
      if (sections.lookbookVolumesConfig?.['vol-1']) {
        setCfg(sections.lookbookVolumesConfig['vol-1']);
      } else if (sections.lookbookPage) {
        setCfg(sections.lookbookPage);
      }
    });
  }, []);

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
    <div className="relative flex min-h-screen w-full max-w-full flex-col bg-[#FFFFFF] text-[#000000] overflow-x-clip">
      <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-12 sm:px-6 sm:pt-10 sm:pb-16 lg:px-8">

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
            <StudioImage
              src={cfg.heroImage || '/images/sevaya_first_chapter.jpg'}
              alt="SEVAYA Floraison Campaign Hero"
              fill
              priority
              preset="spotlight"
              className="object-cover object-center"
            />
          </div>
        </div>

        {/* Section 3: The Seed of The Story (Features with Custom Purpose Points) */}
        {(() => {
          const points = (
            Array.isArray(cfg.purposePoints)
              ? cfg.purposePoints
              : [
                  cfg.purpose1Title ? { title: cfg.purpose1Title, desc: cfg.purpose1Desc || '' } : null,
                  cfg.purpose2Title ? { title: cfg.purpose2Title, desc: cfg.purpose2Desc || '' } : null,
                  cfg.purpose3Title ? { title: cfg.purpose3Title, desc: cfg.purpose3Desc || '' } : null,
                ].filter(Boolean)
          ).filter((p): p is { title: string; desc: string } => Boolean(p && (p.title || p.desc)));

          if (points.length === 0) return null;

          return (
            <section className="mx-auto mb-6 sm:mb-8 max-w-2xl text-left px-4">
              <h2 className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[#000000] uppercase mb-3">
                {cfg.seasonTitle || 'The Seed of The Story'}
              </h2>
              <ul className="font-sans text-[10px] sm:text-[11px] leading-relaxed sm:leading-loose text-[#4A4543] space-y-2">
                {points.map((pt, idx) => (
                  <li key={idx}>
                    <span className="font-medium text-[#000000]">{pt.title}:</span>{' '}
                    {pt.desc}
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}

        {/* Centered Editorial Collage — 2 Photos Side by Side */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5 shadow-xs">
              <StudioImage
                src={cfg.collagePortrait || '/images/lookbook_figma_0.png'}
                alt="Floraison Botanical Silhouette"
                fill
                preset="spotlight"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5 shadow-xs">
              <StudioImage
                src={cfg.collageDetail1 || '/images/figma_about_1.png'}
                alt="Floraison Textile Flow"
                fill
                preset="spotlight"
                className="object-cover transition-transform duration-700 hover:scale-105"
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
            <StudioImage
              src={cfg.panorama1 || '/images/figma_hero.png'}
              alt="SEVAYA Meet The Icon Editorial"
              fill
              preset="spotlight"
              className="object-cover object-center"
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
              <StudioImage
                src={cfg.triptych1 || '/images/lookbook_figma_2.png'}
                alt="Floraison Texture Detail 1"
                fill
                preset="thumbnail"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <StudioImage
                src={cfg.triptych2 || '/images/lookbook_figma_3.png'}
                alt="Floraison Texture Detail 2"
                fill
                preset="thumbnail"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <StudioImage
                src={cfg.triptych3 || '/images/lookbook_figma_4.png'}
                alt="Floraison Texture Detail 3"
                fill
                preset="thumbnail"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Centered Final Movement Frame */}
        <div className="mx-auto mb-7 sm:mb-8 max-w-2xl px-2 sm:px-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-black/10 bg-black/5 shadow-xs">
            <StudioImage
              src={cfg.fullDress || '/images/lookbook_figma_5.png'}
              alt="SEVAYA Movement in Rhythm"
              fill
              preset="spotlight"
              className="object-cover object-center"
            />
          </div>
        </div>
      </main>

      {/* Section: SHOP THE COLLECTION */}
      <section className="border-t border-[#E5E5E5] pt-10 pb-12 sm:pt-12 sm:pb-16 bg-white/40 overflow-hidden w-full">
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

        {/* Product Cards Row */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClickCapture={handleClickCapture}
            className={`no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 touch-auto select-none sm:-mx-6 sm:gap-6 sm:px-6 md:mx-0 md:px-0 ${
              isDown ? 'cursor-grabbing scroll-auto' : 'cursor-grab scroll-smooth'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              scrollSnapType: isDown ? 'none' : 'x mandatory',
              overscrollBehaviorX: 'contain',
            }}
          >
            {products.length === 0 ? (
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-[58vw] shrink-0 sm:w-[46vw] md:w-[285px] lg:w-[calc(25%-18px)] snap-start animate-pulse"
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
                  className="w-[58vw] shrink-0 sm:w-[46vw] md:w-[285px] lg:w-[calc(25%-18px)] snap-start"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <ProductCard product={prod} />
                </div>
              ))
            )}
          </div>
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
