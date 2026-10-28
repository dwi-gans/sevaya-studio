'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        {/* Section 1: Title & Hero Narrative */}
        <div className="mb-12 text-center">
          <h1 className="text-[10px] font-semibold tracking-[0.25em] text-[#666666] uppercase">
            ABOUT SEVAYA
          </h1>
          <h2 className="mt-2 font-sans text-base font-normal tracking-wide text-[#000000] sm:text-xl">
            A Softer Way of Dressing.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[10px] leading-relaxed text-[#333333] sm:text-xs">
            SEVAYA was born from a love for timeless design, the beauty of modest dressing, and the belief that what we wear can be both beautiful and meaningful. Inspired by the architectural heritage of Andalusia, particularly the enduring beauty of Sevilla and Granada, SEVAYA brings together understated elegance, thoughtful details, and a sense of quiet simplicity.
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
          <span className="block text-[10px] font-semibold tracking-[0.25em] text-black/50 uppercase mb-2">OUR PHILOSOPHY</span>
          <p>
            We believe modesty is not about making yourself smaller. It is about dressing in a way that feels true to your values while making space for everything you aspire to be. Whether you are leading a team, creating something new, building a career, spending time with loved ones, or simply finding your own rhythm in everyday life, what you wear should support you through it all.
          </p>
          <p>
            At SEVAYA, we design with this in mind: graceful silhouettes, thoughtful details, and comfort that allows you to move freely through your day. Pieces that respect your commitment to modesty without asking you to compromise on personal style, comfort, or ambition.
          </p>
          <p className="font-medium text-[#000000]">
            Because being a modest woman does not mean choosing between your faith and your aspirations. You can honour both, beautifully.
          </p>
        </div>

        {/* Pillars Horizontal divider */}
        <div className="my-10 flex items-center justify-center gap-6 text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase sm:gap-10 sm:text-[10px]">
          <span>TIMELESS</span>
          <span>&bull;</span>
          <span>INTENTIONAL</span>
          <span>&bull;</span>
          <span>EFFORTLESS</span>
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
              OUR INSPIRATION
            </span>
            <h3 className="font-sans text-sm font-normal tracking-wide text-[#000000] sm:text-lg">
              Inspired by Andalusia. Made for the Woman You Are Becoming.
            </h3>
            <p className="text-[10px] leading-relaxed text-[#333333] sm:text-xs">
              There is something timeless about Andalusia—the warmth of its architecture, the rhythm of its courtyards, the intricate patterns of its tiles, and the quiet beauty found in the simplest details.
            </p>
            <p className="text-[10px] leading-relaxed text-[#333333] sm:text-xs">
              Inspired by Sevilla and Granada, our aesthetic draws from warm Mediterranean tones, graceful forms, and a deep appreciation for thoughtful design. With a background in architecture, we see clothing much like the spaces we inhabit: every proportion, detail, and material has a purpose.
            </p>
            <p className="text-[10px] leading-relaxed text-[#333333] sm:text-xs">
              We translate this inspiration into modestwear for contemporary women—pieces that feel timeless yet relevant, elegant yet effortless, and beautiful without sacrificing the ease of everyday life.
            </p>
            <div className="pt-2 text-[10px] italic text-[#666666]">
              Rooted in heritage. Designed for the life ahead.
            </div>
          </div>
        </div>

        {/* Section 3: The Founder's Story (Full width) */}
        <div className="my-16 space-y-6">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
              THE FOUNDER&apos;S STORY
            </span>
            <h3 className="mt-1 font-sans text-sm font-normal tracking-wide text-[#000000] sm:text-lg">
              A Personal Journey, Woven into Every Piece.
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
              My years living in Spain shaped the way I see design. I learned to appreciate not only the beauty of architecture, but also the culture, rituals, and everyday experiences that give meaning to the things we create. With a background in architecture and design, I have always believed that good design should be thoughtful, purposeful, and made to serve the people who experience it.
            </p>
            <p>
              SEVAYA grew from that belief, alongside my own personal journey toward dressing more intentionally and deepening my understanding of modesty. I wanted to create clothing that reflected my love for design while supporting the woman I aspire to become: a woman who can pursue her ambitions, embrace her individuality, and remain grounded in her faith.
            </p>
            <p>
              SEVAYA is still growing, learning, and discovering better ways to create. We are committed to making more thoughtful choices in our materials, our production, and the way we approach fashion. Every piece is part of that ongoing journey.
            </p>
            <p className="font-medium text-[#000000]">
              Thank you for being here, and for growing with us.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
