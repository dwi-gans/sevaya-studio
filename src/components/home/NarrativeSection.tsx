'use client';

import React, { useEffect, useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import { StudioImage } from '@/components/common';
import { VideoShowcase } from './VideoShowcase';
import { useLanguage } from '@/context/LanguageContext';
import {
  getSiteSections,
  getCachedSiteSections,
  DEFAULT_HOME_NARRATIVE,
  HomeNarrativeConfig,
} from '@/integrations/supabase';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

interface NarrativeSectionProps {
  initialNarrative?: HomeNarrativeConfig;
}

export function NarrativeSection({ initialNarrative }: NarrativeSectionProps = {}) {
  const { t } = useLanguage();
  const [narrative, setNarrative] = useState<HomeNarrativeConfig>(
    () => initialNarrative || DEFAULT_HOME_NARRATIVE
  );

  useEffect(() => {
    // Jika sudah ada data SSR, tidak perlu fetch ulang dari network
    if (initialNarrative) return;

    // Tidak ada SSR data: coba cache dulu (sync, 0 delay), lalu network
    const cached = getCachedSiteSections();
    if (cached?.narrative) {
      setNarrative(cached.narrative);
    }
    getSiteSections().then((sections) => {
      if (sections?.narrative) {
        setNarrative(sections.narrative);
      }
    });
  }, [initialNarrative]);

  return (
    <div className="w-full bg-white text-black section--light">
      {/* 1. Elegance in Simplicity Narrative */}
      <section className="mx-auto max-w-3xl px-4 py-10 sm:py-14 text-center sm:px-6">
        <RevealOnScroll variant="fade-up">
          <h2 className="font-sans text-sm sm:text-base md:text-[17px] font-normal tracking-wide text-black uppercase">
            {narrative.eleganceTitle || 'Elegance in Simplicity'}
          </h2>
          <div className="mx-auto mt-3.5 max-w-2xl space-y-2.5 text-[11px] sm:text-[12.5px] md:text-[13.5px] leading-relaxed sm:leading-[1.8] text-black/75 font-light">
            <p>
              {narrative.eleganceParagraph ||
                t('home.narrative.elegance_p') ||
                'Opting for quality over quantity means selecting timeless, durable, and responsibly made items. This approach simplifies our lives and fosters a deeper appreciation for our surroundings. Emphasizing longevity and responsible production resonates with a more sustainable and mindful lifestyle.'}
            </p>
            <p className="text-[11.5px] sm:text-[13px] md:text-[14px] font-medium text-black tracking-wide">
              {narrative.eleganceHighlight ||
                t('home.narrative.less_more') ||
                'The Art of Fewer, Better Choices'}
            </p>
          </div>
        </RevealOnScroll>
      </section>

      {/* 2. Video Player Showcase */}
      <RevealOnScroll variant="editorial" delayMs={50}>
        <VideoShowcase src={narrative.videoSrc} poster={narrative.videoPoster} />
      </RevealOnScroll>

      {/* 3. Brand Pillars */}
      <section className="mx-auto w-full max-w-[1360px] px-3 pt-4 pb-8 sm:px-6 sm:pt-4 sm:pb-10 lg:px-8">
        <RevealOnScroll variant="fade-up" className="text-center">
          <span className="text-[9px] font-medium tracking-[0.25em] text-black/60 uppercase">
            {narrative.pillarsTagline || 'OUR CORE VALUES'}
          </span>
          <h2 className="mt-1.5 font-sans text-sm font-medium tracking-wider text-black/85 uppercase">
            {narrative.pillarsTitle || 'Brand Pillars'}
          </h2>
          <div className="mx-auto mt-3 h-[1px] w-12 bg-black/20" />
        </RevealOnScroll>

        <div suppressHydrationWarning className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-3 md:gap-0 md:border-y md:border-black/15">
          {/* Pillar 1: Timeless */}
          <div className="col-span-2 md:col-span-1 md:border-r md:border-black/15 flex flex-col">
            <RevealOnScroll variant="editorial" delayMs={0} className="h-full">
              <div className="group flex flex-col items-center border border-black/15 bg-white p-4 text-center shadow-xs md:border-none md:bg-transparent md:p-8 md:shadow-none h-full">
                <span className="font-sans text-[9px] font-semibold tracking-widest text-black/50">01</span>
                <h3 className="mt-2 font-sans text-xs font-medium tracking-wider text-black/85 uppercase sm:text-[13px]">
                  {narrative.pillar1Title || 'Timeless'}
                </h3>
                <p className="mt-2.5 max-w-sm text-[10px] leading-relaxed text-black/60">
                  {narrative.pillar1Desc ||
                    t('home.narrative.pillar1_desc') ||
                    "Designed beyond fleeting trends, with silhouettes and colours you'll want to wear season after season."}
                </p>
              </div>
            </RevealOnScroll>
          </div>

          {/* Pillar 2: Intentional */}
          <div className="col-span-1 md:border-r md:border-black/15 flex flex-col">
            <RevealOnScroll variant="editorial" delayMs={120} className="h-full">
              <div className="group flex flex-col items-center border border-black/15 bg-white p-4 text-center shadow-xs md:border-none md:bg-transparent md:p-8 md:shadow-none h-full">
                <span className="font-sans text-[9px] font-semibold tracking-widest text-black/50">02</span>
                <h3 className="mt-1.5 font-sans text-xs font-medium tracking-wider text-black/85 uppercase sm:text-[11px]">
                  {narrative.pillar2Title || 'Intentional'}
                </h3>
                <p className="mt-2 text-[10px] leading-relaxed text-black/60">
                  {narrative.pillar2Desc ||
                    t('home.narrative.pillar2_desc') ||
                    'From fabric selection to details, every decision creates meaning.'}
                </p>
              </div>
            </RevealOnScroll>
          </div>

          {/* Pillar 3: Effortless */}
          <div className="col-span-1 flex flex-col">
            <RevealOnScroll variant="editorial" delayMs={240} className="h-full">
              <div className="group flex flex-col items-center border border-black/15 bg-white p-4 text-center shadow-xs md:border-none md:bg-transparent md:p-8 md:shadow-none h-full">
                <span className="font-sans text-[9px] font-semibold tracking-widest text-black/50">03</span>
                <h3 className="mt-1.5 font-sans text-xs font-medium tracking-wider text-black/85 uppercase sm:text-[11px]">
                  {narrative.pillar3Title || 'Effortless'}
                </h3>
                <p className="mt-2 text-[10px] leading-relaxed text-black/60">
                  {narrative.pillar3Desc ||
                    t('home.narrative.pillar3_desc') ||
                    'Modest silhouettes made for ease, comfort, and quiet confidence.'}
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 4. About SEVAYA */}
      <section className="mx-auto w-full max-w-[1360px] px-4 pt-2 pb-10 sm:px-6 sm:pb-14 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-5 sm:gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* 1 Editorial Photo Card (Lebar) */}
          <div className="order-1 md:order-2 w-full">
            <RevealOnScroll variant="editorial" delayMs={0}>
              <div className="relative aspect-[4/3] sm:aspect-[16/11] md:aspect-[4/3] w-full overflow-hidden bg-black/5 shadow-xs border border-black/10">
                <StudioImage
                  src={narrative.aboutImage || narrative.aboutImage1 || '/images/figma_about_1.webp'}
                  alt="SEVAYA editorial story"
                  fill
                  preset="spotlight"
                  className="object-cover transition duration-700 hover:scale-105"
                />
              </div>
            </RevealOnScroll>
          </div>

          {/* Narrative Text (Title + Paragraph + Our Story) */}
          <RevealOnScroll
            variant="fade-up"
            delayMs={100}
            className="order-2 md:order-1 space-y-3 sm:space-y-4 pr-0 md:pr-8 lg:pr-12 text-left"
          >
            <h2 className="font-sans text-[11px] sm:text-xs md:text-sm lg:text-base font-semibold md:font-medium tracking-[0.2em] sm:tracking-[0.18em] text-black uppercase">
              {narrative.aboutTagline || 'ABOUT SEVAYA'}
            </h2>

            <p className="text-[12px] sm:text-[13px] md:text-[13.5px] lg:text-[14px] leading-relaxed sm:leading-[1.8] text-black/75 font-light">
              {narrative.aboutDesc ||
                t('home.narrative.about_p') ||
                'Rooted in simplicity, SEVAYA redefines modern modestwear through understated silhouettes, responsible material selection, and intentional craftsmanship.'}
            </p>

            <div className="pt-1 sm:pt-2">
              <Link
                href={narrative.aboutLinkUrl || '/conscious'}
                className="group inline-flex items-center gap-1.5 text-[11.5px] sm:text-xs md:text-[13px] font-medium text-black border-b border-black pb-0.5 transition hover:text-black/60 hover:border-black/60"
              >
                <span>
                  {narrative.aboutLinkText && narrative.aboutLinkText !== 'Read more'
                    ? narrative.aboutLinkText
                    : 'Our Story'}
                </span>
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
