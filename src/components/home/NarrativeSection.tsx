'use client';

import React, { useEffect, useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VideoShowcase } from './VideoShowcase';
import { useLanguage } from '@/context/LanguageContext';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS, LookbookPageConfig } from '@/integrations/supabase';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

export function NarrativeSection() {
  const { t } = useLanguage();
  const [lbPage, setLbPage] = useState<LookbookPageConfig>(DEFAULT_SITE_SECTIONS.lookbookPage!);

  useLayoutEffect(() => {
    const cached = getCachedSiteSections();
    if (cached?.lookbookPage) setLbPage(cached.lookbookPage);
  }, []);

  useEffect(() => {
    getSiteSections().then((sections) => {
      if (sections.lookbookPage) setLbPage(sections.lookbookPage);
    });
  }, []);

  return (
    <div className="w-full bg-white text-black section--light">
      {/* 1. Elegance in Simplicity Narrative */}
      <section className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
        <RevealOnScroll variant="fade-up">
          <h2 className="font-sans text-xs font-normal tracking-wide text-black sm:text-sm">
            Elegance in Simplicity
          </h2>
          <div className="mx-auto mt-3 max-w-2xl space-y-2 text-[10px] leading-relaxed text-black/70">
            <p>
              {t('home.narrative.elegance_p')}
            </p>
            <p className="font-medium text-black">
              {t('home.narrative.less_more')}
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/conscious"
              className="inline-block text-[10px] font-normal text-black border-b border-black pb-0.5 transition hover:text-black/60 hover:border-[#000000]"
            >
              {t('common.read_more')}
            </Link>
          </div>
        </RevealOnScroll>
      </section>

      {/* 2. Video Player Showcase */}
      <RevealOnScroll variant="editorial" delayMs={50}>
        <VideoShowcase />
      </RevealOnScroll>

      {/* 3. Brand Pillars */}
      <section className="mx-auto w-full max-w-7xl px-3 pt-4 pb-8 sm:px-6 sm:pt-4 sm:pb-10 lg:px-8">
        <RevealOnScroll variant="fade-up" className="text-center">
          <span className="text-[9px] font-medium tracking-[0.25em] text-black/60 uppercase">
            OUR CORE VALUES
          </span>
          <h2 className="mt-1.5 font-sans text-sm font-medium tracking-wider text-black/85 uppercase">
            Brand Pillars
          </h2>
          <div className="mx-auto mt-3 h-[1px] w-12 bg-black/20" />
        </RevealOnScroll>

        <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-3 md:gap-0 md:divide-x md:border-y md:border-black/15">
          {/* Pillar 1: Timeless */}
          <RevealOnScroll variant="editorial" delayMs={0} className="col-span-2 md:col-span-1">
            <div className="group flex flex-col items-center border border-black/15 bg-white p-4 text-center shadow-xs transition-colors hover:bg-white/80 md:border-0 md:bg-transparent md:p-8 md:shadow-none h-full">
              <span className="font-sans text-[9px] font-semibold tracking-widest text-black/50">01</span>
              <h3 className="mt-2 font-sans text-xs font-medium tracking-wider text-black/85 uppercase sm:text-[13px]">
                Timeless
              </h3>
              <p className="mt-2.5 max-w-sm text-[10px] leading-relaxed text-black/60">
                {t('home.narrative.pillar1_desc') || "Designed beyond fleeting trends, with silhouettes and colours you'll want to wear season after season."}
              </p>
            </div>
          </RevealOnScroll>

          {/* Pillar 2: Intentional */}
          <RevealOnScroll variant="editorial" delayMs={120} className="col-span-1">
            <div className="group flex flex-col items-center border border-black/15 bg-white p-4 text-center shadow-xs transition-colors hover:bg-white/80 md:border-0 md:bg-transparent md:p-8 md:shadow-none h-full">
              <span className="font-sans text-[9px] font-semibold tracking-widest text-black/50">02</span>
              <h3 className="mt-1.5 font-sans text-xs font-medium tracking-wider text-black/85 uppercase sm:text-[11px]">
                Intentional
              </h3>
              <p className="mt-2 text-[10px] leading-relaxed text-black/60">
                {t('home.narrative.pillar2_desc') || 'From fabric selection to details, every decision creates meaning.'}
              </p>
            </div>
          </RevealOnScroll>

          {/* Pillar 3: Effortless */}
          <RevealOnScroll variant="editorial" delayMs={240} className="col-span-1">
            <div className="group flex flex-col items-center border border-black/15 bg-white p-4 text-center shadow-xs transition-colors hover:bg-white/80 md:border-0 md:bg-transparent md:p-8 md:shadow-none h-full">
              <span className="font-sans text-[9px] font-semibold tracking-widest text-black/50">03</span>
              <h3 className="mt-1.5 font-sans text-xs font-medium tracking-wider text-black/85 uppercase sm:text-[11px]">
                Effortless
              </h3>
              <p className="mt-2 text-[10px] leading-relaxed text-black/60">
                {t('home.narrative.pillar3_desc') || 'Modest silhouettes made for ease, comfort, and quiet confidence.'}
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 4. About SEVAYA */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          {/* Mobile Title */}
          <RevealOnScroll variant="fade-up" className="space-y-1 md:hidden">
            <span className="text-[9px] font-medium tracking-[0.25em] text-black/50 uppercase">
              ABOUT SEVAYA
            </span>
          </RevealOnScroll>

          {/* 2 Editorial Photos */}
          <div className="order-2 md:order-2 grid grid-cols-2 gap-3 sm:gap-4 items-start">
            <RevealOnScroll variant="editorial" delayMs={0}>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
                <Image
                  src={lbPage.collageDetail1 || '/images/figma_about_1.png'}
                  alt="SEVAYA editorial 1"
                  fill
                  className="object-cover transition duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            </RevealOnScroll>
            <RevealOnScroll variant="editorial" delayMs={150}>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
                <Image
                  src={lbPage.collageDetail2 || '/images/figma_about_2.png'}
                  alt="SEVAYA editorial 2"
                  fill
                  className="object-cover transition duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            </RevealOnScroll>
          </div>

          {/* Left Text */}
          <RevealOnScroll variant="fade-up" delayMs={100} className="order-3 md:order-1 space-y-3 pr-0 md:pr-8">
            <div className="hidden md:block">
              <span className="text-[9px] font-medium tracking-[0.25em] text-black/50 uppercase">
                ABOUT SEVAYA
              </span>
            </div>

            <p className="text-[10px] leading-relaxed text-black/70">
              {t('home.narrative.about_p')}
            </p>

            <div className="pt-1">
              <Link
                href="/conscious"
                className="inline-block text-[10px] font-normal text-black border-b border-black pb-0.5 transition hover:text-black/60 hover:border-[#000000]"
              >
                {t('common.read_more')}
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
