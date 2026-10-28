'use client';

import React, { useEffect, useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VideoShowcase } from './VideoShowcase';
import { useLanguage } from '@/context/LanguageContext';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS, LookbookPageConfig } from '@/integrations/supabase';

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
        <h2 className="font-sans text-xs font-normal tracking-wide text-black sm:text-sm">
          {t('narrative.elegance_title') || 'Elegance in Simplicity'}
        </h2>
        <div className="mx-auto mt-3 max-w-2xl space-y-2 text-[10px] leading-relaxed text-black/70">
          <p>
            {t('narrative.elegance_p') ||
              'At SEVAYA, we believe the most beautiful pieces are often the ones we return to, again and again. We create thoughtfully designed modestwear that brings together comfort, versatility, and understated elegance, pieces to accompany you through everyday moments and the occasions that matter.'}
          </p>
          <p className="font-medium text-black">
            {t('narrative.less_more') || 'Less, but more meaningful'}
          </p>
        </div>
        <div className="mt-6">
          <Link
            href="/conscious"
            className="inline-block text-[10px] font-normal text-black border-b border-black pb-0.5 transition hover:text-black/60 hover:border-[#000000]"
          >
            {t('narrative.read_more') || 'Read more'}
          </Link>
        </div>
      </section>

      {/* 2. Video Player Showcase */}
      <VideoShowcase />

      {/* 3. Brand Pillars */}
      <section className="mx-auto w-full max-w-7xl px-3 pt-4 pb-8 sm:px-6 sm:pt-4 sm:pb-10 lg:px-8">
        <div className="text-center">
          <span className="text-[9px] font-medium tracking-[0.25em] text-black/60 uppercase">
            OUR CORE VALUES
          </span>
          <h2 className="mt-1.5 font-sans text-sm font-medium tracking-wider text-black/85 uppercase">
            Brand Pillars
          </h2>
          <div className="mx-auto mt-3 h-[1px] w-12 bg-black/20" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-3 md:gap-0 md:divide-x md:border-y md:border-black/15">
          {/* Pillar 1: Timeless */}
          <div className="group col-span-2 flex flex-col items-center border border-black/15 bg-white p-4 text-center shadow-xs transition-colors hover:bg-white/80 md:col-span-1 md:border-0 md:bg-transparent md:p-8 md:shadow-none">
            <span className="font-sans text-[9px] font-semibold tracking-widest text-black/50">01</span>
            <h3 className="mt-2 font-sans text-xs font-medium tracking-wider text-black/85 uppercase sm:text-[13px]">
              Timeless
            </h3>
            <p className="mt-2.5 max-w-sm text-[10px] leading-relaxed text-black/60">
              Designed beyond fleeting trends, with silhouettes and colours you&apos;ll want to wear season after season.
            </p>
          </div>

          {/* Pillar 2: Intentional */}
          <div className="group col-span-1 flex flex-col items-center border border-black/15 bg-white p-4 text-center shadow-xs transition-colors hover:bg-white/80 md:col-span-1 md:border-0 md:bg-transparent md:p-8 md:shadow-none">
            <span className="font-sans text-[9px] font-semibold tracking-widest text-black/50">02</span>
            <h3 className="mt-1.5 font-sans text-xs font-medium tracking-wider text-black/85 uppercase sm:text-[11px]">
              Intentional
            </h3>
            <p className="mt-2 text-[10px] leading-relaxed text-black/60">
              From fabric selection to details, every decision creates meaning.
            </p>
          </div>

          {/* Pillar 3: Effortless */}
          <div className="group col-span-1 flex flex-col items-center border border-black/15 bg-white p-4 text-center shadow-xs transition-colors hover:bg-white/80 md:col-span-1 md:border-0 md:bg-transparent md:p-8 md:shadow-none">
            <span className="font-sans text-[9px] font-semibold tracking-widest text-black/50">03</span>
            <h3 className="mt-1.5 font-sans text-xs font-medium tracking-wider text-black/85 uppercase sm:text-[11px]">
              Effortless
            </h3>
            <p className="mt-2 text-[10px] leading-relaxed text-black/60">
              Modest silhouettes made for ease, comfort, and quiet confidence.
            </p>
          </div>
        </div>
      </section>

      {/* 4. About SEVAYA */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          {/* Mobile Title */}
          <div className="space-y-1 md:hidden">
            <span className="text-[9px] font-medium tracking-[0.25em] text-black/50 uppercase">
              ABOUT SEVAYA
            </span>
          </div>

          {/* 2 Editorial Photos */}
          <div className="order-2 md:order-2 grid grid-cols-2 gap-3 sm:gap-4 items-start">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <Image
                src={lbPage.collageDetail1 || '/images/figma_about_1.png'}
                alt="SEVAYA editorial 1"
                fill
                className="object-cover transition duration-700 hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 shadow-xs">
              <Image
                src={lbPage.collageDetail2 || '/images/figma_about_2.png'}
                alt="SEVAYA editorial 2"
                fill
                className="object-cover transition duration-700 hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          </div>

          {/* Left Text */}
          <div className="order-3 md:order-1 space-y-3 pr-0 md:pr-8">
            <div className="hidden md:block">
              <span className="text-[9px] font-medium tracking-[0.25em] text-black/50 uppercase">
                ABOUT SEVAYA
              </span>
            </div>

            <p className="text-[10px] leading-relaxed text-black/70">
              SEVAYA was born from a love for timeless design, the beauty of modest dressing, and the belief that modesty should never limit the way a woman lives, dreams, or expresses herself. We believe a woman can be graceful and bold, gentle and ambitious, grounded in her faith and confident in her own direction. She can lead a room, build something meaningful, explore the world, and pursue her aspirations while staying true to what she believes in.
            </p>
            <p className="text-[10px] leading-relaxed text-black/70">
              Modest dressing should move with her life, not hold her back. It should offer the freedom to show up as herself, with comfort, confidence, and a sense of ease in every moment.
            </p>
            <p className="text-[10px] leading-relaxed text-black/70">
              Inspired by the architectural heritage of Andalusia, particularly the enduring beauty of Sevilla and Granada, SEVAYA brings together thoughtful design, understated elegance, and everyday functionality to create modestwear that feels as good to live in as it is beautiful to look at.
            </p>
            <p className="text-[10px] leading-relaxed text-black/70">
              SEVAYA is an invitation to embrace modesty on your own terms, with intention, confidence, and no limits on who you can become.
            </p>
            <p className="text-[9px] font-medium tracking-[0.28em] text-black/35 uppercase mt-4">
              TIMELESS • INTENTIONAL • EFFORTLESS
            </p>

            <div className="pt-1">
              <Link
                href="/conscious"
                className="inline-block text-[10px] font-normal text-black border-b border-black pb-0.5 transition hover:text-black/60 hover:border-[#000000]"
              >
                Read more
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}