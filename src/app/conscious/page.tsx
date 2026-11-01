'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        {/* Section 1: Title & Hero Narrative */}
        <div className="mb-12 text-center">
          <h1 className="text-[10px] font-semibold tracking-[0.25em] text-[#666666] uppercase">
            {t('conscious.about_badge')}
          </h1>
          <h2 className="mt-2 font-sans text-base font-normal tracking-wide text-[#000000] sm:text-xl">
            {t('conscious.hero_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[10px] leading-relaxed text-[#333333] sm:text-xs">
            {t('conscious.hero_p')}
          </p>
        </div>

        {/* Big Panoramic Landscape Banner */}
        <div className="relative mb-14 aspect-[16/7] w-full overflow-hidden rounded-none bg-black/5 shadow-xs">
          <Image
            src="/images/figma_about_1.png"
            alt="SEVAYA Landscape"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
          <div className="absolute top-6 left-6 z-10">
            <Logo variant="light" className="h-5 w-auto drop-shadow-md" />
          </div>
        </div>

        {/* Philosophy text */}
        <div className="mx-auto mb-14 max-w-3xl space-y-4 text-center text-[10px] leading-relaxed text-[#333333] sm:text-xs">
          <span className="block text-[10px] font-semibold tracking-[0.25em] text-black/50 uppercase mb-2">{t('conscious.philo_badge')}</span>
          <p>
            {t('conscious.philo_1')}
          </p>
          <p>
            {t('conscious.philo_2')}
          </p>
          <p className="font-medium text-[#000000]">
            {t('conscious.philo_quote')}
          </p>
        </div>

        {/* Pillars Horizontal divider */}
        <div className="my-10 flex items-center justify-center gap-6 text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase sm:gap-10 sm:text-[10px]">
          <span>{t('conscious.pillars')}</span>
        </div>

        {/* Section 2: Our Inspiration (Image left, text right) */}
        <div className="my-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-none bg-black/5 shadow-xs sm:aspect-[1/1]">
            <Image
              src="/images/figma_about_2.png"
              alt="Our Inspiration Andalusia"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
              {t('conscious.inspo_badge')}
            </span>
            <h3 className="font-sans text-sm font-normal tracking-wide text-[#000000] sm:text-lg">
              {t('conscious.inspo_title')}
            </h3>
            <p className="text-[10px] leading-relaxed text-[#333333] sm:text-xs">
              {t('conscious.inspo_p1')}
            </p>
            <p className="text-[10px] leading-relaxed text-[#333333] sm:text-xs">
              {t('conscious.inspo_p2')}
            </p>
            <p className="text-[10px] leading-relaxed text-[#333333] sm:text-xs">
              {t('conscious.inspo_p3')}
            </p>
            <div className="pt-2 text-[10px] italic text-[#666666]">
              {t('conscious.inspo_tagline')}
            </div>
          </div>
        </div>

        {/* Section 3: The Founder's Story (Full width) */}
        <div className="my-16 space-y-6">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
              {t('conscious.founder_badge')}
            </span>
            <h3 className="mt-1 font-sans text-sm font-normal tracking-wide text-[#000000] sm:text-lg">
              {t('conscious.founder_title')}
            </h3>
          </div>

          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-none bg-black/5 shadow-xs">
            <Image
              src="/images/figma_about_1.png"
              alt="Founder Story"
              fill
              className="object-cover object-[center_30%]"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>

          <div className="space-y-4 text-[10px] leading-relaxed text-[#333333] sm:text-xs">
            <p>
              {t('conscious.founder_p1')}
            </p>
            <p>
              {t('conscious.founder_p2')}
            </p>
            <p>
              {t('conscious.founder_p3')}
            </p>
            <p className="font-medium text-[#000000]">
              {t('conscious.founder_closing')}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
