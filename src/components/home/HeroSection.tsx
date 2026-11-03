'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS, HeroSectionData } from '@/integrations/supabase';

export function HeroSection() {
  const [hero, setHero] = useState<HeroSectionData>(DEFAULT_SITE_SECTIONS.hero);

  useEffect(() => {
    const cached = getCachedSiteSections();
    if (cached?.hero?.image) {
      setHero(cached.hero);
    }

    getSiteSections().then((sections) => {
      if (sections?.hero?.image) setHero(sections.hero);
    });
  }, []);

  const heroImageSrc = (hero?.image && hero.image.trim()) || '/images/hero_optimized.jpg';

  return (
    <section className="relative flex h-[82vh] min-h-[560px] w-full flex-col justify-end overflow-hidden bg-[#111111] text-white section--dark sm:h-[86vh] md:min-h-[720px] lg:h-[90vh] lg:min-h-[780px]">
      {/* Background Hero Image with smooth Ken Burns using next/image (single download) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="relative h-full w-full animate-kenburns">
          <Image
            src={heroImageSrc}
            alt="SEVAYA Collection - Timeless, Intentional, Effortless"
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-[center_30%] sm:object-[center_35%]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-24 text-center text-white sm:pb-32 md:pb-36 lg:pb-40">
        {/* Tagline: Heading/Hero Brand Text selalu English */}
        <p className="animate-hero-fadeup-title mb-4 text-[9px] font-normal tracking-[0.28em] text-white/95 uppercase drop-shadow-sm sm:text-[10px]">
          TIMELESS • INTENTIONAL • EFFORTLESS
        </p>

        {/* CTA Buttons: Selalu English */}
        <div className="animate-hero-fadeup-link flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
          <Link
            href="/shop"
            className="inline-flex min-w-[160px] items-center justify-center bg-white px-5 py-3 text-[10px] font-semibold tracking-[0.2em] text-black uppercase transition-all duration-300 hover:bg-white/90 hover:scale-[1.02]"
          >
            {hero.ctaShop || 'Shop The Collection'}
          </Link>

          <Link
            href="/lookbook"
            className="inline-flex min-w-[160px] items-center justify-center border border-white bg-transparent px-5 py-3 text-[10px] font-semibold tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-white hover:text-black"
          >
            {hero.ctaLookbook || 'Lookbook'}
          </Link>
        </div>
      </div>
    </section>
  );
}
