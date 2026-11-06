'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSiteSections, DEFAULT_SITE_SECTIONS, HeroSectionData } from '@/integrations/supabase';

const PRIMARY_HERO = '/images/hero_optimized.jpg';

interface HeroSectionProps {
  initialHero?: HeroSectionData;
}

export function HeroSection({ initialHero }: HeroSectionProps) {
  const [hero, setHero] = useState<HeroSectionData>(() => initialHero || DEFAULT_SITE_SECTIONS.hero);

  useEffect(() => {
    // Background refresh: update only if cloud data differs from current state
    getSiteSections().then((sections) => {
      if (sections?.hero) {
        setHero((prev) => {
          const newImg = sections.hero.image?.trim();
          if (
            newImg &&
            !newImg.startsWith('blob:') &&
            newImg !== 'undefined' &&
            (newImg !== prev.image ||
              sections.hero.title !== prev.title ||
              sections.hero.ctaShop !== prev.ctaShop ||
              sections.hero.ctaLookbook !== prev.ctaLookbook)
          ) {
            return sections.hero;
          }
          return prev;
        });
      }
    });
  }, []);

  const heroImage = (hero?.image && hero.image.trim()) || PRIMARY_HERO;

  return (
    <section
      suppressHydrationWarning
      className="relative flex w-full flex-col justify-end overflow-hidden bg-[#111111] text-white section--dark h-[calc(100svh-4rem)] sm:h-[calc(100dvh-4rem)] min-h-[500px]"
    >
      {/* Background Hero Image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          suppressHydrationWarning
          className="relative h-full w-full sm:animate-kenburns bg-[#111111]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            suppressHydrationWarning
            src={heroImage}
            alt="SEVAYA Collection - Timeless, Intentional, Effortless"
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover object-[center_30%] sm:object-[center_35%]"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith(PRIMARY_HERO)) {
                target.src = PRIMARY_HERO;
                setHero((prev) => ({ ...prev, image: PRIMARY_HERO }));
              }
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 sm:px-6 pb-10 text-center text-white sm:pb-16 md:pb-20 lg:pb-24">
        {/* Tagline */}
        <p className="animate-hero-fadeup-title mb-4 text-[9px] font-normal tracking-[0.22em] sm:tracking-[0.28em] text-white/95 uppercase drop-shadow-sm sm:text-[10px]">
          {hero.badge || 'TIMELESS • INTENTIONAL • EFFORTLESS'}
        </p>

        {/* CTA Buttons - Selalu menyamping berdampingan (flex-row) di mobile & desktop */}
        <div className="animate-hero-fadeup-link flex flex-row items-center justify-center gap-2.5 sm:gap-4 w-full max-w-sm sm:max-w-md px-2">
          <Link
            href="/shop"
            className="flex-1 sm:flex-none inline-flex min-w-[125px] sm:min-w-[160px] items-center justify-center bg-white px-3.5 py-2.5 sm:px-5 sm:py-3 text-[9px] sm:text-[10px] font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-black uppercase transition-all duration-300 hover:bg-white/90 active:scale-95 whitespace-nowrap text-center"
          >
            {hero.ctaShop || 'Shop The Collection'}
          </Link>

          <Link
            href="/lookbook"
            className="flex-1 sm:flex-none inline-flex min-w-[125px] sm:min-w-[160px] items-center justify-center border border-white bg-transparent px-3.5 py-2.5 sm:px-5 sm:py-3 text-[9px] sm:text-[10px] font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-white hover:text-black active:scale-95 whitespace-nowrap text-center"
          >
            {hero.ctaLookbook || 'Lookbook'}
          </Link>
        </div>
      </div>
    </section>
  );
}