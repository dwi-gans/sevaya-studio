'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VideoShowcase } from './VideoShowcase';
import { useLanguage } from '@/context/LanguageContext';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS, LookbookPageConfig } from '@/integrations/supabase';

export function NarrativeSection() {
  const { t } = useLanguage();
  const [lbPage, setLbPage] = useState<LookbookPageConfig>(DEFAULT_SITE_SECTIONS.lookbookPage!);

  useEffect(() => {
    const cached = getCachedSiteSections();
    if (cached.lookbookPage) setLbPage(cached.lookbookPage);
    getSiteSections().then((sections) => {
      if (sections.lookbookPage) setLbPage(sections.lookbookPage);
    });
  }, []);

  return (
    <div className="w-full">
      {/* 1. Elegance in Simplicity Narrative */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-sans text-2xl font-normal tracking-wide text-[#141312] sm:text-3xl">
          {t('narrative.elegance_title') || 'Elegance in Simplicity'}
        </h2>
        <div className="mx-auto mt-4 max-w-2xl space-y-3 text-xs leading-relaxed text-[#554C48] sm:text-sm">
          <p>
            {t('narrative.elegance_p') ||
              'At SEVAYA, we believe the most beautiful pieces are often the ones we return to, again and again. We create thoughtfully designed modestwear that brings together comfort, versatility, and understated elegance, pieces to accompany you through everyday moments and the occasions that matter.'}
          </p>
          <p className="font-medium text-[#141312]">
            {t('narrative.less_more') || 'Less, but more meaningful'}
          </p>
        </div>
        <div className="mt-6">
          <Link
            href="/conscious"
            className="inline-block text-xs sm:text-sm font-normal text-[#141312] border-b border-[#141312] pb-0.5 transition hover:text-[#685E5A] hover:border-[#685E5A]"
          >
            {t('narrative.read_more') || 'Read more'}
          </Link>
        </div>
      </section>

      {/* 2. Video Player Showcase */}
      <VideoShowcase />

      {/* 3. Brand Pillars */}
      <section className="mx-auto w-full max-w-7xl px-3 pt-4 pb-14 sm:px-6 sm:pt-6 sm:pb-20 lg:px-8">
        <div className="text-center">
          <span className="text-[10px] font-medium tracking-[0.25em] text-[#7C726E] uppercase sm:text-[11px]">
            OUR CORE VALUES
          </span>
          <h2 className="mt-1.5 font-sans text-xl font-medium tracking-wider text-[#141312] uppercase sm:text-2xl lg:text-3xl">
            Brand Pillars
          </h2>
          <div className="mx-auto mt-3 h-[1px] w-12 bg-[#D0C5BD]" />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-3 md:gap-0 md:divide-x md:border-y md:border-[#E5DDD5]">
          {/* Pillar 1: Timeless */}
          <div className="group col-span-2 flex flex-col items-center rounded-xl border border-[#E5DDD5] bg-white p-6 text-center shadow-xs transition-colors hover:bg-white/80 md:col-span-1 md:border-0 md:rounded-none md:bg-transparent md:p-12 md:shadow-none">
            <span className="font-sans text-[11px] font-semibold tracking-widest text-[#8E8380]">01</span>
            <h3 className="mt-2 font-sans text-base font-medium tracking-wider text-[#141312] uppercase sm:text-lg lg:text-xl">
              Timeless
            </h3>
            <p className="mt-2.5 max-w-sm text-xs leading-relaxed text-[#685E5A] sm:text-sm">
              Designed beyond fleeting trends, with silhouettes and colours you&apos;ll want to wear season after season.
            </p>
          </div>

          {/* Pillar 2: Intentional */}
          <div className="group col-span-1 flex flex-col items-center rounded-xl border border-[#E5DDD5] bg-white p-5 text-center shadow-xs transition-colors hover:bg-white/80 md:col-span-1 md:border-0 md:rounded-none md:bg-transparent md:p-12 md:shadow-none">
            <span className="font-sans text-[10px] font-semibold tracking-widest text-[#8E8380] sm:text-[11px]">02</span>
            <h3 className="mt-1.5 font-sans text-sm font-medium tracking-wider text-[#141312] uppercase sm:text-base lg:text-lg">
              Intentional
            </h3>
            <p className="mt-2 text-[11px] leading-relaxed text-[#685E5A] sm:text-xs md:text-sm">
              From fabric selection to details, every decision creates meaning.
            </p>
          </div>

          {/* Pillar 3: Effortless */}
          <div className="group col-span-1 flex flex-col items-center rounded-xl border border-[#E5DDD5] bg-white p-5 text-center shadow-xs transition-colors hover:bg-white/80 md:col-span-1 md:border-0 md:rounded-none md:bg-transparent md:p-12 md:shadow-none">
            <span className="font-sans text-[10px] font-semibold tracking-widest text-[#8E8380] sm:text-[11px]">03</span>
            <h3 className="mt-1.5 font-sans text-sm font-medium tracking-wider text-[#141312] uppercase sm:text-base lg:text-lg">
              Effortless
            </h3>
            <p className="mt-2 text-[11px] leading-relaxed text-[#685E5A] sm:text-xs md:text-sm">
              Modest silhouettes made for ease, comfort, and quiet confidence.
            </p>
          </div>
        </div>
      </section>

      {/* 4. About SEVAYA: A Softer Way of Dressing */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          {/* Mobile Title */}
          <div className="space-y-2 md:hidden">
            <span className="text-[11px] font-medium tracking-[0.25em] text-[#8E8380] uppercase">
              {t('narrative.about_sub') || 'ABOUT SEVAYA'}
            </span>
            <h2 className="font-sans text-2xl font-light tracking-tight text-[#141312]">
              {t('narrative.about_title') || 'A Softer Way of Dressing.'}
            </h2>
          </div>

          {/* 2 Editorial Photos — now connected to admin */}
          <div className="order-2 md:order-2 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F3EFEA] shadow-xs">
              <Image
                src={lbPage.collageDetail1 || '/images/figma_about_1.png'}
                alt="SEVAYA editorial 1"
                fill
                className="object-cover transition duration-700 hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F3EFEA] shadow-xs translate-y-3 sm:translate-y-4 md:translate-y-6">
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
          <div className="order-3 md:order-1 space-y-5 pr-0 md:pr-8">
            {/* Desktop Title */}
            <div className="hidden md:block space-y-3">
              <span className="text-[11px] font-medium tracking-[0.25em] text-[#8E8380] uppercase">
                {t('narrative.about_sub') || 'ABOUT SEVAYA'}
              </span>
              <h2 className="font-sans text-3xl lg:text-4xl font-light tracking-tight text-[#141312]">
                {t('narrative.about_title') || 'A Softer Way of Dressing.'}
              </h2>
            </div>

            <p className="text-xs leading-relaxed text-[#554C48] sm:text-sm">
              {t('narrative.about_p') ||
                'SEVAYA was born from a love for timeless design, the beauty of modest dressing, and the belief that what we wear can be both beautiful and meaningful. Inspired by the architectural heritage of Andalusia, particularly the enduring beauty of Sevilla and Granada, SEVAYA brings together understated elegance, thoughtful details, and a sense of quiet simplicity.'}
            </p>

            <div className="pt-2">
              <Link
                href="/conscious"
                className="inline-block text-xs sm:text-sm font-normal text-[#141312] border-b border-[#141312] pb-0.5 transition hover:text-[#685E5A] hover:border-[#685E5A]"
              >
                {t('narrative.read_more') || 'Read more'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
