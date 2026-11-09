'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSiteSections, DEFAULT_SITE_SECTIONS, HeroSectionData } from '@/integrations/supabase';

// Fallback lokal — ditanam langsung sebagai background-image CSS (zero-delay, no network)
const PRIMARY_HERO = '/images/hero_optimized.jpg';

interface HeroSectionProps {
  initialHero?: HeroSectionData;
}

export function HeroSection({ initialHero }: HeroSectionProps) {
  const [hero, setHero] = useState<HeroSectionData>(() => initialHero || DEFAULT_SITE_SECTIONS.hero);
  // animDone: setelah animasi masuk selesai (1.4s), ubah ke class statis
  // sehingga saat user scroll ke atas/bawah di mobile tidak ada animasi yang keulang / kedut-kedut
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimDone(true);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Background refresh: update hanya jika data Supabase berbeda
    getSiteSections().then((sections) => {
      if (sections?.hero) {
        setHero((prev) => {
          const s = sections.hero;
          if (
            s.image === prev.image &&
            s.mobileImage === prev.mobileImage &&
            s.badge === prev.badge &&
            s.ctaShop === prev.ctaShop &&
            s.ctaLookbook === prev.ctaLookbook
          ) {
            return prev;
          }
          return s;
        });
      }
    });
  }, []);

  const desktopHeroImage = (hero?.image && hero.image.trim()) || PRIMARY_HERO;
  const hasCustomMobile = Boolean(
    hero?.mobileImage &&
    hero.mobileImage.trim() &&
    hero.mobileImage !== PRIMARY_HERO &&
    hero.mobileImage !== desktopHeroImage
  );
  const mobileHeroImage = hasCustomMobile ? hero.mobileImage!.trim() : desktopHeroImage;

  return (
    <section
      suppressHydrationWarning
      className="relative flex w-full flex-col justify-end overflow-hidden text-white section--dark h-[calc(100svh-4rem)] sm:h-[calc(100dvh-4rem)] min-h-[500px] bg-neutral-950"
    >
      {/* Background Hero Image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          suppressHydrationWarning
          className="relative h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <picture className="h-full w-full">
            {hasCustomMobile && (
              <source media="(max-width: 639px)" srcSet={mobileHeroImage} />
            )}
            <img
              suppressHydrationWarning
              src={desktopHeroImage}
              alt="SEVAYA Collection - Timeless, Intentional, Effortless"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="animate-kenburns h-full w-full object-cover object-center"
              style={{ imageRendering: 'auto' }}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith(PRIMARY_HERO)) {
                  target.src = PRIMARY_HERO;
                  setHero((prev) => ({ ...prev, image: PRIMARY_HERO }));
                }
              }}
            />
          </picture>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
      </div>

      {/* Content — posisi seimbang di mobile sesuai permintaan user */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 sm:px-6 pb-11 text-center text-white sm:pb-16 md:pb-20 lg:pb-24">
        {/* Tagline */}
        <p
          className={`mb-3 sm:mb-4 text-[8.5px] font-normal tracking-[0.22em] sm:tracking-[0.28em] text-white/95 uppercase drop-shadow-sm sm:text-[10px] ${
            animDone ? 'opacity-100 translate-y-0' : 'animate-hero-fadeup-title'
          }`}
        >
          {hero.badge || 'TIMELESS • INTENTIONAL • EFFORTLESS'}
        </p>

        {/* CTA Buttons - Selalu menyamping berdampingan (flex-row) di mobile & desktop */}
        <div
          className={`flex flex-row items-center justify-center gap-2 sm:gap-4 w-full max-w-sm sm:max-w-md px-2 ${
            animDone ? 'opacity-100 translate-y-0' : 'animate-hero-fadeup-link'
          }`}
        >
          <Link
            href="/shop"
            className="flex-1 sm:flex-none inline-flex min-w-[118px] sm:min-w-[160px] items-center justify-center bg-white px-3 py-2 sm:px-5 sm:py-3 text-[8.5px] sm:text-[10px] font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-black uppercase transition-all duration-300 hover:bg-white/90 active:scale-95 whitespace-nowrap text-center shadow-xs"
          >
            {hero.ctaShop || 'Shop The Collection'}
          </Link>

          <Link
            href="/lookbook"
            className="flex-1 sm:flex-none inline-flex min-w-[118px] sm:min-w-[160px] items-center justify-center border border-white bg-transparent px-3 py-2 sm:px-5 sm:py-3 text-[8.5px] sm:text-[10px] font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-white hover:text-black active:scale-95 whitespace-nowrap text-center shadow-xs"
          >
            {hero.ctaLookbook || 'Lookbook'}
          </Link>
        </div>
      </div>
    </section>
  );
}