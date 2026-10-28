'use client';

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/context/LanguageContext';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS, JournalArticleData } from '@/integrations/supabase';

export function JournalSection() {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileLayout, setMobileLayout] = useState<'slider' | 'grid'>('slider');
  const [articles, setArticles] = useState<JournalArticleData[]>(DEFAULT_SITE_SECTIONS.journal);

  useLayoutEffect(() => {
    const cached = getCachedSiteSections();
    if (cached?.journal?.length) setArticles(cached.journal);
  }, []);

  useEffect(() => {
    getSiteSections().then((sections) => {
      if (sections.journal?.length) setArticles(sections.journal);
    });
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 300;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(newIndex, 0), articles.length - 1));
    }
  };

  const scrollToSlide = (idx: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 300;
      scrollRef.current.scrollTo({
        left: idx * (cardWidth + 16),
        behavior: 'smooth',
      });
      setActiveIndex(idx);
    }
  };

  const scrollPrev = () => {
    scrollToSlide(Math.max(activeIndex - 1, 0));
  };

  const scrollNext = () => {
    scrollToSlide(Math.min(activeIndex + 1, articles.length - 1));
  };

  return (
    <section className="w-full bg-black text-white section--dark py-8 sm:py-12 text-white overflow-hidden" id="journal">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Header Layout matching Figma: Left is Manifesto, Right is Prestigious Journals */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-end">
          {/* Left Column: The Art of Fewer, Better Choices */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-widest text-white/70 uppercase backdrop-blur-xs">
              <span>Philosophy</span>
              <span>&bull;</span>
              <span>Studio Manifesto</span>
            </div>
            <h2 className="font-sans text-base font-normal tracking-wide text-white sm:text-lg">
              The Art of Fewer, Better Choices
            </h2>
            <p className="max-w-xl text-[11px] leading-relaxed text-white/60">
              Opting for quality over quantity means selecting timeless, durable, and responsibly made items. This approach simplifies our lives and fosters a deeper appreciation for our surroundings. Emphasizing longevity and responsible production resonates with a more sustainable and mindful lifestyle.
            </p>
          </div>

          {/* Right Column: PRESTIGIOUS JOURNALS / OUR READING CORNER */}
          <div className="flex flex-col md:items-end md:text-right">
            <span className="text-[9px] font-medium tracking-[0.25em] text-white/60 uppercase">
              {t('journal.badge') || 'PRESTIGIOUS JOURNALS'}
            </span>
            <h3 className="mt-1 font-sans text-sm font-normal tracking-wide text-white uppercase">
              {t('journal.title') || 'OUR READING CORNER'}
            </h3>
            <div className="mt-4 flex items-center gap-4 md:justify-end">
              <Link
                href="/news"
                className="group inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:text-white/70"
              >
                <span>{t('journal.explore') || 'Explore All Stories'}</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Layout Switcher Bar (Only on mobile viewport) */}
        <div className="mb-6 flex items-center justify-between border-b border-white/15 pb-3 md:hidden">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="font-mono text-[11px] text-white">0{activeIndex + 1}</span>
            <span>/</span>
            <span className="font-mono text-[11px]">0{articles.length}</span>
            <span className="ml-1 text-[10px] tracking-wider uppercase text-white/60">
              {mobileLayout === 'slider' ? 'Swipeable Cards' : 'Grid View'}
            </span>
          </div>

          {/* Toggle between Swipe Slider & 2-Col Grid */}
          <div className="flex items-center rounded-full border border-white/15 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setMobileLayout('slider')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wider transition-all ${
                mobileLayout === 'slider'
                  ? 'bg-white text-white shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Slider
            </button>
            <button
              type="button"
              onClick={() => setMobileLayout('grid')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wider transition-all ${
                mobileLayout === 'grid'
                  ? 'bg-white text-white shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* ── CARD BOXES CONTAINER ── */}
        {mobileLayout === 'slider' ? (
          /* Option 1 (Default): Horizontal Snap-Scroll Slider with Peek Preview */
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-3 md:gap-6 lg:gap-8 md:overflow-visible md:px-0 md:pb-0"
            >
              {articles.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="w-[82vw] shrink-0 snap-center sm:w-[360px] md:w-auto md:shrink"
                >
                  {/* Framed White Cardbox matching Figma node_8_682 */}
                  <article className="group flex h-full flex-col overflow-hidden bg-white border border-white/10 p-4 sm:p-5 text-black shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    {/* Inner Framed Photo */}
                    <div className="relative aspect-[16/11] w-full overflow-hidden bg-black/5">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 85vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    {/* Text Details */}
                    <div className="flex flex-1 flex-col justify-between pt-4">
                      <div>
                        <span className="text-[11px] font-medium tracking-wide text-black/60">
                          {item.date}
                        </span>
                        <h4 className="mt-1 font-sans text-[11px] font-semibold tracking-wider text-black uppercase transition-colors group-hover:text-black/70">
                          {item.title}
                        </h4>
                        <p className="mt-2 text-[10px] leading-relaxed text-black/70 line-clamp-3">
                          {item.excerpt}
                        </p>
                      </div>

                      <div className="mt-4">
                        <Link
                          href="/news"
                          className="inline-block text-[10px] font-normal text-black border-b border-black pb-0.5 transition hover:text-black/70 hover:border-black/60"
                        >
                          {t('journal.read_article') || 'Read more'}
                        </Link>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>

            {/* Mobile Carousel Controls & Dots Indicator */}
            <div className="mt-4 flex items-center justify-between md:hidden">
              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {articles.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    aria-label={`Go to slide ${dotIdx + 1}`}
                    onClick={() => scrollToSlide(dotIdx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeIndex === dotIdx
                        ? 'w-6 bg-white'
                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>

              {/* Prev / Next Chevrons for Mobile */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous story"
                  onClick={scrollPrev}
                  disabled={activeIndex === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition disabled:opacity-30 hover:bg-white/20"
                >
                  <Icon name="chevron_left" size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next story"
                  onClick={scrollNext}
                  disabled={activeIndex === articles.length - 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition disabled:opacity-30 hover:bg-white/20"
                >
                  <Icon name="chevron_right" size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Option 2: Compact Bento / 2-Column Grid on Mobile (No tall 1-column stack) */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:gap-8">
            {articles.map((item, idx) => (
              <article
                key={`${item.id}-${idx}`}
                className={`group flex flex-col overflow-hidden bg-white border border-white/10 p-3 text-black shadow-sm transition-all hover:shadow-xl ${
                  idx === 0 ? 'col-span-2 sm:col-span-1' : 'col-span-1'
                }`}
              >
                <div
                  className={`relative w-full overflow-hidden bg-black/5 ${
                    idx === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'
                  }`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between pt-3">
                  <div>
                    <span className="text-[10px] text-black/60">{item.date}</span>
                    <h4 className="mt-0.5 line-clamp-1 font-sans text-xs font-semibold tracking-wider text-black uppercase sm:text-sm">
                      {item.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-black/70">
                      {item.excerpt}
                    </p>
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/news"
                      className="inline-block text-[11px] sm:text-xs font-normal text-black border-b border-black pb-0.5 transition hover:text-black/70 hover:border-black/60"
                    >
                      {t('journal.read_article') || 'Read more'}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
