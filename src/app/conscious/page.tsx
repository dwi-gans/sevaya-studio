import React from 'react';
import { StudioImage } from '@/components/common';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Footer } from '@/components/layout/Footer';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import {
  getSiteSections,
  DEFAULT_CONSCIOUS_PAGE,
  type ConsciousPageConfig,
} from '@/integrations/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always serve fresh data

export default async function AboutPage() {
  const sections = await getSiteSections(true);
  const c: ConsciousPageConfig = {
    ...DEFAULT_CONSCIOUS_PAGE,
    ...(sections?.consciousPage || {}),
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        {/* Section 1: Title & Hero Narrative */}
        <RevealOnScroll variant="fade-up" className="mb-12 text-center">
          <h1 className="text-[10px] font-semibold tracking-[0.25em] text-[#666666] uppercase">
            {c.aboutBadge}
          </h1>
          <h2 className="mt-2 font-sans text-base font-normal tracking-wide text-[#000000] sm:text-xl">
            {c.aboutTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[10px] leading-relaxed text-[#333333] sm:text-xs">
            {c.aboutP}
          </p>
        </RevealOnScroll>

        {/* Big Panoramic Landscape Banner */}
        <RevealOnScroll variant="editorial" delayMs={100} className="mb-14">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-none bg-black/5 shadow-xs">
            <StudioImage
              src={c.heroImage || DEFAULT_CONSCIOUS_PAGE.heroImage!}
              alt="SEVAYA Landscape"
              fill
              className="object-cover"
              priority
              preset="full"
            />
            <div className="absolute top-6 left-6 z-10">
              <Logo variant="light" className="h-5 w-auto drop-shadow-md" />
            </div>
          </div>
        </RevealOnScroll>

        {/* Philosophy text */}
        <RevealOnScroll variant="fade-up" className="mx-auto mb-14 max-w-3xl space-y-4 text-center text-[10px] leading-relaxed text-[#333333] sm:text-xs">
          <span className="block text-[10px] font-semibold tracking-[0.25em] text-black/50 uppercase mb-2">
            {c.philoBadge}
          </span>
          <p>{c.philo1}</p>
          <p>{c.philo2}</p>
          <p className="font-medium text-[#000000]">{c.philoQuote}</p>
        </RevealOnScroll>

        {/* Pillars Horizontal divider */}
        <RevealOnScroll variant="fade-up" className="my-10 flex items-center justify-center gap-6 text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase sm:gap-10 sm:text-[10px]">
          <span>{c.pillars}</span>
        </RevealOnScroll>

        {/* Section 2: Our Inspiration (Image left, text right) */}
        <div className="my-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <RevealOnScroll variant="editorial" delayMs={0}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-none bg-black/5 shadow-xs sm:aspect-[1/1]">
              <StudioImage
                src={c.inspoImage || DEFAULT_CONSCIOUS_PAGE.inspoImage!}
                alt="Our Inspiration Andalusia"
                fill
                preset="spotlight"
                className="object-cover"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll variant="fade-up" delayMs={120} className="space-y-4">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
              {c.inspoBadge}
            </span>
            <h3 className="font-sans text-sm font-normal tracking-wide text-[#000000] sm:text-lg">
              {c.inspoTitle}
            </h3>
            <p className="text-[10px] leading-relaxed text-[#333333] sm:text-xs">{c.inspoP1}</p>
            <p className="text-[10px] leading-relaxed text-[#333333] sm:text-xs">{c.inspoP2}</p>
            <p className="text-[10px] leading-relaxed text-[#333333] sm:text-xs">{c.inspoP3}</p>
            <div className="pt-2 text-[10px] italic text-[#666666]">{c.inspoTagline}</div>
          </RevealOnScroll>
        </div>

        {/* Section 3: The Founder's Story (Full width) */}
        <div className="my-16 space-y-6">
          <RevealOnScroll variant="fade-up">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
              {c.founderBadge}
            </span>
            <h3 className="mt-1 font-sans text-sm font-normal tracking-wide text-[#000000] sm:text-lg">
              {c.founderTitle}
            </h3>
          </RevealOnScroll>

          <RevealOnScroll variant="editorial" delayMs={100}>
            <div className="relative aspect-[16/8] w-full overflow-hidden rounded-none bg-black/5 shadow-xs">
              <StudioImage
                src={c.founderImage || DEFAULT_CONSCIOUS_PAGE.founderImage!}
                alt="Founder Story"
                fill
                preset="full"
                className="object-cover object-[center_30%]"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll variant="fade-up" delayMs={150} className="space-y-4 text-[10px] leading-relaxed text-[#333333] sm:text-xs">
            <p>{c.founderP1}</p>
            <p>{c.founderP2}</p>
            <p>{c.founderP3}</p>
            <p className="font-medium text-[#000000]">{c.founderClosing}</p>
          </RevealOnScroll>
        </div>

        {/* Back to home link */}
        <RevealOnScroll variant="fade-up" className="mt-16 text-center">
          <Link
            href="/"
            className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase hover:text-black transition-colors"
          >
            ← Back to SEVAYA
          </Link>
        </RevealOnScroll>
      </main>

      <Footer />
    </div>
  );
}
