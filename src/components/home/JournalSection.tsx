'use client';

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { StudioImage } from '@/components/common';
import { useLanguage } from '@/context/LanguageContext';
import {
  getSiteSections,
  getCachedSiteSections,
  DEFAULT_SITE_SECTIONS,
  DEFAULT_JOURNAL_HEADER,
  JournalArticleData,
  HomeJournalHeaderConfig,
} from '@/integrations/supabase';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

interface JournalSectionProps {
  initialArticles?: JournalArticleData[];
  initialHeader?: HomeJournalHeaderConfig;
}

export function JournalSection({ initialArticles, initialHeader }: JournalSectionProps = {}) {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<JournalArticleData[]>(() => {
    if (initialArticles && initialArticles.length > 0) return initialArticles;
    const cached = getCachedSiteSections();
    return cached?.journal?.length ? cached.journal : DEFAULT_SITE_SECTIONS.journal;
  });

  const [header, setHeader] = useState<HomeJournalHeaderConfig>(() => {
    if (initialHeader) return initialHeader;
    const cached = getCachedSiteSections();
    return cached?.journalHeader || DEFAULT_JOURNAL_HEADER;
  });

  useLayoutEffect(() => {
    if (!initialArticles || !initialArticles.length) {
      const cached = getCachedSiteSections();
      if (cached?.journal?.length) setArticles(cached.journal);
      if (cached?.journalHeader && !initialHeader) setHeader(cached.journalHeader);
    }
  }, [initialArticles, initialHeader]);

  useEffect(() => {
    // Fetch artikel terbaru dari DB (via /api/journal) — override sections.journal
    fetch('/api/journal')
      .then((r) => r.json())
      .then((data: { articles?: JournalArticleData[] }) => {
        if (Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles(data.articles);
        } else if (!initialArticles?.length) {
          // Fallback: ambil dari sections config hanya jika tidak ada SSR data
          getSiteSections().then((sections) => {
            if (sections.journal?.length) setArticles(sections.journal);
            if (sections.journalHeader && !initialHeader) setHeader(sections.journalHeader);
          });
        }
      })
      .catch(() => {
        // Fallback jika fetch gagal, hanya jika tidak ada SSR data
        if (!initialArticles?.length) {
          getSiteSections().then((sections) => {
            if (sections.journal?.length) setArticles(sections.journal);
            if (sections.journalHeader && !initialHeader) setHeader(sections.journalHeader);
          });
        }
      });

    // Refresh journalHeader dari sections hanya jika tidak ada dari SSR
    if (!initialHeader) {
      getSiteSections().then((sections) => {
        if (sections.journalHeader) setHeader(sections.journalHeader);
      });
    }
  }, []);

  return (
    <section className="w-full bg-black text-white section--dark py-8 sm:py-12 overflow-hidden" id="journal">
      <div className="mx-auto max-w-[1360px] px-3 sm:px-6 lg:px-8">
        {/* Top Header Layout: Left is Manifesto, Right is OUR READING CORNER → */}
        <RevealOnScroll variant="fade-up" className="mb-6 sm:mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end">
          {/* Left Column: The Art of Fewer, Better Choices */}
          <div className="space-y-2 sm:space-y-2.5">
            <h2 className="font-sans text-sm font-normal tracking-wide text-white sm:text-lg">
              {header.manifestoTitle || 'The Art of Fewer, Better Choices'}
            </h2>
            <p className="max-w-xl text-[10px] leading-relaxed text-white/60 sm:text-[11px]">
              {header.manifestoDesc ||
                t('home.journal.manifesto_desc') ||
                'Opting for quality over quantity means selecting timeless, durable, and responsibly made items. This approach simplifies our lives and fosters a deeper appreciation for our surroundings. Emphasizing longevity and responsible production resonates with a more sustainable and mindful lifestyle.'}
            </p>
          </div>

          {/* Right Column: OUR READING CORNER → */}
          <div className="flex flex-col md:items-end md:text-right pb-1 md:pb-0">
            <Link
              href={header.journalLinkUrl || '/news'}
              className="group inline-flex items-center gap-1.5 font-sans text-xs sm:text-sm font-medium tracking-wider text-white uppercase transition-colors hover:text-white/70"
            >
              <span>{header.journalTitle || 'OUR READING CORNER'}</span>
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>
        </RevealOnScroll>

        {/* ── CARD BOXES CONTAINER (2 MENYAMPING DALAM 1 FRAME DI MOBILE & DESKTOP) ── */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-6">
          {articles.map((item, idx) => (
            <RevealOnScroll key={`${item.id}-${idx}`} variant="editorial" delayMs={idx * 120}>
              <article className="group flex h-full flex-col overflow-hidden bg-white border border-white/10 p-2.5 sm:p-4 md:p-5 text-black shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <Link href={item.href || '/news'} className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden bg-black/5 block">
                  <StudioImage
                    src={item.image}
                    alt={item.title}
                    fill
                    preset="journal"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>

                <div className="flex flex-1 flex-col justify-between pt-2.5 sm:pt-4">
                  <div>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] font-medium tracking-wide text-black/60">
                      {item.date}
                    </span>
                    <Link href={item.href || '/news'}>
                      <h4 className="mt-1 font-sans text-[10px] sm:text-xs md:text-sm font-semibold tracking-wider text-black uppercase transition-colors group-hover:text-black/70 line-clamp-2">
                        {item.title}
                      </h4>
                    </Link>
                    <p className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] md:text-[11px] leading-relaxed text-black/70 line-clamp-2 sm:line-clamp-3">
                      {item.excerpt}
                    </p>
                  </div>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
