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
    if (initialData) {
      setData(initialData);
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
    <section className="w-full bg-white py-8 sm:py-12 lg:py-16 text-black section--light">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <RevealOnScroll variant="editorial">
          {/* Framed Editorial Box Container ("di dalam kotak") */}
          <div className="border border-black/15 bg-[#FAF9F7] overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-stretch shadow-xs">
            {/* Left Column: Photo fills its chamber seamlessly */}
            <div className="relative min-h-[300px] sm:min-h-[380px] lg:min-h-[460px] xl:min-h-[500px] w-full overflow-hidden bg-black/5">
              <Link href={linkUrl} className="group relative block h-full w-full min-h-[300px] sm:min-h-[380px] lg:min-h-full">
                <StudioImage
                  src={image}
                  alt={title}
                  fill
                  preset="spotlight"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
              </Link>
            </div>

            {/* Right Column: Editorial Narrative Story inside the box */}
            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12 xl:p-16 text-left border-t border-black/10 lg:border-t-0 lg:border-l lg:border-black/10">
              {/* Eyebrow */}
              <span className="font-sans text-[8.5px] sm:text-[10px] lg:text-[11px] font-medium tracking-[0.2em] sm:tracking-[0.25em] text-black/60 uppercase block mb-1.5 sm:mb-2.5">
                {eyebrow}
              </span>

              {/* Title */}
              <h2 className="font-sans text-[15px] sm:text-lg md:text-xl lg:text-[23px] font-medium sm:font-normal tracking-[0.14em] sm:tracking-[0.16em] text-black uppercase mb-3.5 sm:mb-4 lg:mb-5 leading-snug">
                {title}
              </h2>

              {/* Story Paragraph 1 */}
              <p className="text-[11px] sm:text-xs md:text-[13px] lg:text-sm text-black/75 leading-[1.75] sm:leading-[1.85] font-light mb-3 sm:mb-3.5 lg:mb-4.5">
                {paragraph1 === DEFAULT_CLOSER_LOOK.paragraph1 ? (
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
              <p className="text-[11px] sm:text-xs md:text-[13px] lg:text-sm text-black/75 leading-[1.75] sm:leading-[1.85] font-light mb-4 sm:mb-5 lg:mb-6">
                {paragraph2 === DEFAULT_CLOSER_LOOK.paragraph2 ? (
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
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
