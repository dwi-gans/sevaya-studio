'use client';

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    const cached = getCachedSiteSections();
    if (cached?.journal?.length) setArticles(cached.journal);
    if (cached?.journalHeader) setHeader(cached.journalHeader);
  }, []);

  useEffect(() => {
    getSiteSections().then((sections) => {
      if (sections.journal?.length) setArticles(sections.journal);
      if (sections.journalHeader) setHeader(sections.journalHeader);
    });
  }, []);

  return (
    <section className="w-full bg-black text-white section--dark py-8 sm:py-12 overflow-hidden" id="journal">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Top Header Layout: Left is Manifesto, Right is Prestigious Journals */}
        <RevealOnScroll variant="fade-up" className="mb-6 sm:mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-end">
          {/* Left Column: The Art of Fewer, Better Choices */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] sm:text-[10px] font-medium tracking-widest text-white/70 uppercase backdrop-blur-xs">
              <span>{header.manifestoTag || 'Philosophy • Studio Manifesto'}</span>
            </div>
            <h2 className="font-sans text-sm font-normal tracking-wide text-white sm:text-lg">
              {header.manifestoTitle || 'The Art of Fewer, Better Choices'}
            </h2>
            <p className="max-w-xl text-[10px] leading-relaxed text-white/60 sm:text-[11px]">
              {header.manifestoDesc ||
                t('home.journal.manifesto_desc') ||
                'Opting for quality over quantity means selecting timeless, durable, and responsibly made items. This approach simplifies our lives and fosters a deeper appreciation for our surroundings. Emphasizing longevity and responsible production resonates with a more sustainable and mindful lifestyle.'}
            </p>
          </div>

          {/* Right Column: PRESTIGIOUS JOURNALS / OUR READING CORNER */}
          <div className="flex flex-col md:items-end md:text-right">
            <span className="text-[9px] font-medium tracking-[0.25em] text-white/60 uppercase">
              {header.journalBadge || t('home.journal.badge') || 'EDITORIAL JOURNAL'}
            </span>
            <h3 className="mt-1 font-sans text-xs sm:text-sm font-normal tracking-wide text-white uppercase">
              {header.journalTitle || 'OUR READING CORNER'}
            </h3>
            <div className="mt-3 sm:mt-4 flex items-center gap-4 md:justify-end">
              <Link
                href={header.journalLinkUrl || '/news'}
                className="group inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:text-white/70"
              >
                <span>{header.journalLinkText || t('home.journal.explore') || 'Explore All Stories'}</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        {/* ── CARD BOXES CONTAINER (2 MENYAMPING DALAM 1 FRAME DI MOBILE & DESKTOP) ── */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-6">
          {articles.map((item, idx) => (
            <RevealOnScroll key={`${item.id}-${idx}`} variant="editorial" delayMs={idx * 120}>
              <article className="group flex h-full flex-col overflow-hidden bg-white border border-white/10 p-2.5 sm:p-4 md:p-5 text-black shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <Link href={item.href || '/news'} className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden bg-black/5 block">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 50vw"
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

                  <div className="mt-2.5 sm:mt-4">
                    <Link
                      href={item.href || '/news'}
                      className="inline-block text-[9px] sm:text-[10px] md:text-[11px] font-normal text-black border-b border-black pb-0.5 transition hover:text-black/70 hover:border-black/60"
                    >
                      {t('home.journal.read_article')}
                    </Link>
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
