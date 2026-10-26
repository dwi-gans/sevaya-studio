'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS, HeroSectionData } from '@/integrations/supabase';

export function HeroSection() {
  const { t } = useLanguage();
  const [hero, setHero] = useState<HeroSectionData>(DEFAULT_SITE_SECTIONS.hero);

  useEffect(() => {
    // 1. Read cached immediately (zero flash)
    const cached = getCachedSiteSections();
    if (cached.hero) setHero(cached.hero);
    // 2. Refresh from cloud in background
    getSiteSections().then((sections) => {
      if (sections.hero) setHero(sections.hero);
    });
  }, []);

  return (
    <section className="relative flex h-[82vh] min-h-[560px] w-full flex-col justify-end overflow-hidden bg-[#141312] sm:h-[86vh] md:min-h-[720px] lg:h-[90vh] lg:min-h-[780px]">
      {/* Background Hero Image */}
      <div className="absolute inset-0">
        <Image
          src={hero.image || '/images/hero_clean.jpg'}
          alt="SEVAYA Collection - Timeless, Intentional, Effortless"
          fill
          priority
          className="object-cover object-[center_30%] sm:object-[center_35%]"
          sizes="100vw"
        />
        {/* Editorial soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-24 text-center text-white sm:pb-32 md:pb-36 lg:pb-40">
        {/* Tagline */}
        <p className="mb-4 text-xs font-normal tracking-[0.28em] text-white/95 uppercase drop-shadow-sm sm:text-sm md:text-base">
          {t('hero.tagline') || 'TIMELESS • INTENTIONAL • EFFORTLESS'}
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-6 sm:gap-12">
          <Link
            href="/lookbook"
            className="group relative px-2 py-2 text-sm font-medium tracking-widest text-white uppercase transition-all duration-300 hover:opacity-85 sm:text-base md:text-lg"
          >
            {t('hero.cta_lookbook') || hero.ctaLookbook || 'Lookbook'}
            <span className="absolute bottom-1 left-2 right-2 h-[1.5px] bg-white transition-transform duration-300 group-hover:scale-x-110" />
          </Link>

          <Link
            href="/shop"
            className="group relative px-2 py-2 text-sm font-medium tracking-widest text-white uppercase transition-all duration-300 hover:opacity-85 sm:text-base md:text-lg"
          >
            {t('hero.cta_shop') || hero.ctaShop || 'Shop The Collection'}
            <span className="absolute bottom-1 left-2 right-2 h-[1.5px] bg-white transition-transform duration-300 group-hover:scale-x-110" />
          </Link>
        </div>
      </div>
    </section>
  );
}
