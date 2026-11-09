'use client';

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { StudioImage } from '@/components/common';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import {
  CloserLookData,
  DEFAULT_CLOSER_LOOK,
  getCachedSiteSections,
  getSiteSections,
} from '@/integrations/supabase';

interface CloserLookSectionProps {
  initialData?: CloserLookData;
}

export function CloserLookSection({ initialData }: CloserLookSectionProps = {}) {
  const [data, setData] = useState<CloserLookData>(() => {
    if (initialData) return initialData;
    const cached = getCachedSiteSections();
    return cached?.closerLook || DEFAULT_CLOSER_LOOK;
  });

  useLayoutEffect(() => {
    if (!initialData) {
      const cached = getCachedSiteSections();
      if (cached?.closerLook) {
        setData(cached.closerLook);
      }
    }
  }, [initialData]);

  useEffect(() => {
    getSiteSections().then((sections) => {
      if (sections?.closerLook) {
        setData(sections.closerLook);
      }
    });
  }, []);

  const eyebrow = data.eyebrow || 'A CLOSER LOOK AT';
  const title = data.title || 'VOL 1: SEVILLA ABAYA';
  const paragraph1 =
    data.paragraph1 ||
    'In Indonesia, particularly between June and August, temperatures range from 24°C to 32°C, bringing moments that feel lighter, calmer, and more balanced. In this atmosphere, life moves in its own rhythm; like a Rhapsody: free-flowing, expressive, and quietly harmonious.';
  const paragraph2 =
    data.paragraph2 ||
    'Through Vol. 1: Sevilla Abaya, SEVAYA reflects on gentle, mindful growth. That much like nature, we each unfold in our own time and beauty reveals itself when we learn to move with our own rhythm.';
  const image = data.image || '/images/lookbook_figma_0.png';
  const linkText = data.linkText || 'Read More';
  const linkUrl = data.linkUrl || '/lookbook';

  return (
    <section className="w-full bg-white py-6 sm:py-10 lg:py-14 text-black section--light">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 lg:gap-14 xl:gap-18 items-center">
          {/* Left Column: Editorial Photo — sleek and responsive on mobile */}
          <RevealOnScroll variant="editorial" delayMs={0}>
            <div className="max-w-md sm:max-w-none mx-auto w-full">
              <Link
                href={linkUrl}
                className="group relative block aspect-[16/10] sm:aspect-[16/10] lg:aspect-[4/3] w-full overflow-hidden bg-black/5 border border-black/10 shadow-xs"
              >
                <StudioImage
                  src={image}
                  alt={title}
                  fill
                  preset="spotlight"
                  className="object-cover transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
              </Link>
            </div>
          </RevealOnScroll>

          {/* Right Column: Editorial Narrative Story — with bottom divider line matching screenshot */}
          <RevealOnScroll variant="fade-up" delayMs={150}>
            <div className="flex flex-col justify-center max-w-xl mx-auto lg:mx-0 lg:pl-2 xl:pl-6 text-left border-b border-black/15 pb-6 sm:pb-8 lg:pb-10">
              {/* Eyebrow */}
              <span className="font-sans text-[8.5px] sm:text-[10px] lg:text-[11px] font-medium tracking-[0.2em] sm:tracking-[0.25em] text-black/60 uppercase block mb-1.5 sm:mb-2">
                {eyebrow}
              </span>

              {/* Title */}
              <h2 className="font-sans text-[15px] sm:text-lg md:text-xl lg:text-[24px] font-medium sm:font-normal tracking-[0.14em] sm:tracking-[0.16em] text-black uppercase mb-3 sm:mb-4 lg:mb-5 leading-snug">
                {title}
              </h2>

              {/* Story Paragraph 1 */}
              <p className="text-[11px] sm:text-xs md:text-[13px] lg:text-sm text-black/75 leading-[1.7] sm:leading-[1.8] font-light mb-3 sm:mb-3.5 lg:mb-4.5">
                {paragraph1.includes('between June and August') ? (
                  <>
                    In Indonesia, particularly{' '}
                    <strong className="font-medium text-black">between June and August</strong>
                    , temperatures range from 24°C to 32°C, bringing moments that feel lighter,
                    calmer, and more balanced. In this atmosphere, life moves in its own rhythm;
                    like a Rhapsody: free-flowing, expressive, and quietly harmonious.
                  </>
                ) : (
                  paragraph1
                )}
              </p>

              {/* Story Paragraph 2 */}
              <p className="text-[11px] sm:text-xs md:text-[13px] lg:text-sm text-black/75 leading-[1.7] sm:leading-[1.8] font-light mb-4 sm:mb-5 lg:mb-6">
                {paragraph2.includes('much like nature') ? (
                  <>
                    Through Vol. 1: Sevilla Abaya, SEVAYA reflects on gentle, mindful growth. That{' '}
                    <em className="italic font-medium text-black">much like nature</em>, we each
                    unfold in our own time and beauty reveals itself when we learn to move with
                    our own rhythm.
                  </>
                ) : (
                  paragraph2
                )}
              </p>

              {/* Read More Link */}
              <div>
                <Link
                  href={linkUrl}
                  className="inline-block text-[11px] sm:text-xs lg:text-[13px] font-medium text-black underline underline-offset-4 decoration-black/60 hover:decoration-black hover:text-black/60 transition-all self-start"
                >
                  {linkText}
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
