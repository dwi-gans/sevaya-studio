'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#141312]">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-[#7C726E]">
          <Link href="/" className="hover:text-[#141312]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#141312]">About</span>
        </nav>

        {/* Section 1: Title & Hero Narrative */}
        <div className="mb-12 text-center">
          <h1 className="text-xs font-semibold tracking-[0.25em] text-[#7C726E] uppercase">
            ABOUT SEVAYA
          </h1>
          <h2 className="mt-2 font-sans text-2xl font-normal tracking-wide text-[#141312] sm:text-3xl">
            A Softer Way of Dressing.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-[#554C48] sm:text-sm">
            SEVAYA was born from a love for timeless design, the beauty of modest dressing, and the belief that what we wear can be both beautiful and meaningful. Inspired by the architectural heritage of Andalusia, particularly the enduring beauty of Sevilla and Granada, SEVAYA brings together understated elegance, thoughtful details, and a sense of quiet simplicity.
          </p>
        </div>

        {/* Big Panoramic Landscape Banner */}
        <div className="relative mb-14 aspect-[16/7] w-full overflow-hidden rounded-xl bg-[#F3EFEA] shadow-xs">
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

        {/* Philosophy Journey text */}
        <div className="mx-auto mb-14 max-w-3xl space-y-4 text-center text-xs leading-relaxed text-[#554C48] sm:text-sm">
          <p>
            Our journey began with a simple intention: to create modestwear that feels as beautiful to wear as it is to look at. Pieces that offer ease in everyday life, confidence in modesty, and lasting value beyond a single season.
          </p>
          <p>
            We believe good design is never only about appearance. It is also about how a garment feels, how often it is worn, and the thought behind its making. This is our way of approaching fashion: more intentionally, more thoughtfully, and always with room to grow.
          </p>
          <p className="font-medium text-[#141312]">
            Welcome to SEVAYA
          </p>
        </div>

        {/* Pillars Horizontal divider */}
        <div className="my-10 flex items-center justify-center gap-6 text-[11px] font-semibold tracking-[0.2em] text-[#7C726E] uppercase sm:gap-10 sm:text-xs">
          <span>TIMELESS</span>
          <span>&bull;</span>
          <span>INTENTIONAL</span>
          <span>&bull;</span>
          <span>EFFORTLESS</span>
        </div>

        {/* Section 2: Our Inspiration (Image left, text right) */}
        <div className="my-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F3EFEA] shadow-xs sm:aspect-[1/1]">
            <Image
              src="/images/figma_about_2.png"
              alt="Our Inspiration Andalusia"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="space-y-4">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-[#7C726E] uppercase">
              OUR INSPIRATION
            </span>
            <h3 className="font-sans text-xl font-normal tracking-wide text-[#141312] sm:text-2xl">
              Inspired by Andalusia. Made for Everyday Life.
            </h3>
            <p className="text-xs leading-relaxed text-[#554C48] sm:text-sm">
              There is something timeless about Andalusia—the warmth of its architecture, the rhythm of its courtyards, the intricate patterns of its tiles, and the effortless beauty found in the simplest details.
            </p>
            <p className="text-xs leading-relaxed text-[#554C48] sm:text-sm">
              Inspired by the cities of Sevilla and Granada, our aesthetic celebrates warm tones, graceful forms, and quiet sophistication. Rather than recreating the past, we take these inspirations into the present, translating their spirit into modestwear made for the way we live today.
            </p>
            <div className="pt-2 text-xs italic text-[#7C726E]">
              &ldquo;A little Mediterranean warmth. A little everyday simplicity. A style that feels entirely your own.&rdquo;
            </div>
          </div>
        </div>

        {/* Section 3: The Founder's Story (Full width) */}
        <div className="my-16 space-y-6">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.2em] text-[#7C726E] uppercase">
              THE FOUNDER&apos;S STORY
            </span>
            <h3 className="mt-1 font-sans text-xl font-normal tracking-wide text-[#141312] sm:text-2xl">
              A Personal Journey, Woven into Every Piece.
            </h3>
          </div>

          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-xl bg-[#F3EFEA] shadow-xs">
            <Image
              src="/images/figma_about_1.png"
              alt="Founder Story"
              fill
              className="object-cover object-[center_30%]"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-[#554C48] sm:text-sm">
            <p>
              My years living in Spain shaped the way I see design—not only as something beautiful, but as something deeply connected to culture, everyday rituals, and the way we experience the world. With a background in architecture and design, I have always been drawn to thoughtful proportions, timeless materials, and the beauty of things made with intention.
            </p>
            <p>
              SEVAYA brings these influences into a more personal expression: modestwear that reflects my love for design while accompanying my own journey toward dressing more intentionally. As a growing brand, we are still learning, exploring, and finding better ways to do things. And that is part of our story, too.
            </p>
            <p className="font-medium text-[#141312]">
              Thank you for being here and growing with us.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
