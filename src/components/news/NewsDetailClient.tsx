'use client';

import React from 'react';
import Link from 'next/link';
import { StudioImage } from '@/components/common';
import { Footer } from '@/components/layout/Footer';
import { Icon } from '@/components/ui/Icon';
import { Article } from '@/integrations/supabase/articles';
import { useLanguage } from '@/context/LanguageContext';

interface NewsDetailClientProps {
  article: Article;
  relatedArticles: Article[];
}

export function NewsDetailClient({ article, relatedArticles }: NewsDetailClientProps) {
  const { t } = useLanguage();

  const middleImage = article.images?.[0] || '/images/catalog/catalog-12.jpg';
  const extraImages = article.images?.slice(1) || [];

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-body text-[#000000] selection:bg-black/5 flex flex-col justify-between">
      {/* ── EDITORIAL ARTICLE DETAIL CONTAINER ── */}
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20">
        
        {/* Top Navigation Back to News */}
        <div className="mb-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-widest text-[#777777] uppercase transition hover:text-black"
          >
            <Icon name="arrow_back" size={14} />
            <span>{t('news.back_to_news')}</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="text-center mb-8 sm:mb-10 space-y-3">
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#888888] uppercase block">
            {article.date}
          </span>
          <h1 className="font-headline text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-[#000000] uppercase leading-tight max-w-2xl mx-auto">
            {article.title}
          </h1>
        </header>

        {/* Hero Photo */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-black/5 mb-2">
          <StudioImage
            src={article.image}
            alt={article.title}
            fill
            priority
            preset="full"
            className="object-cover"
          />
        </div>
        {/* Hero Caption */}
        {article.hero_caption && article.hero_caption.trim() !== '' && (
          <p className="text-[10px] text-center text-[#777777] italic tracking-wide mb-8">
            {article.hero_caption}
          </p>
        )}

        {/* Article Body Content */}
        <article className="prose prose-neutral max-w-none space-y-6 text-[#222222] text-xs sm:text-[13px] leading-relaxed">
          {article.excerpt && (
            <p className="font-serif italic text-black/80 sm:text-sm leading-relaxed border-l-2 border-black/20 pl-4 py-1">
              {article.excerpt}
            </p>
          )}

          {article.content?.map((paragraph, index) => (
            <React.Fragment key={index}>
              <p className="leading-relaxed">
                {paragraph}
              </p>

              {index === 0 && middleImage && (
                <div className="my-8 space-y-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
                    <StudioImage
                      src={middleImage}
                      alt="SEVAYA Studio Detail"
                      fill
                      preset="spotlight"
                      className="object-cover"
                    />
                  </div>
                  {article.image_captions?.[0] && article.image_captions[0].trim() !== '' && (
                    <p className="text-[10px] text-center text-[#777777] italic tracking-wide">
                      {article.image_captions[0]}
                    </p>
                  )}
                </div>
              )}

              {index > 0 && extraImages[index - 1] && (
                <div className="my-8 space-y-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
                    <StudioImage
                      src={extraImages[index - 1]!}
                      alt={`${article.title} — foto ${index + 1}`}
                      fill
                      preset="spotlight"
                      className="object-cover"
                    />
                  </div>
                  {article.image_captions?.[index] && article.image_captions[index].trim() !== '' && (
                    <p className="text-[10px] text-center text-[#777777] italic tracking-wide">
                      {article.image_captions[index]}
                    </p>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}

          {extraImages.length >= (article.content?.length || 1) && (
            <div className="mt-8 space-y-6">
              {extraImages.slice((article.content?.length || 1) - 1).map((img, i) => {
                const imgIdx = (article.content?.length || 1) + i;
                return (
                  <div key={i} className="space-y-3">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
                      <StudioImage
                        src={img}
                        alt={`${article.title} — foto ${i + 2}`}
                        fill
                        preset="spotlight"
                        className="object-cover"
                      />
                    </div>
                    {article.image_captions?.[imgIdx] && article.image_captions[imgIdx].trim() !== '' && (
                      <p className="text-[10px] text-center text-[#777777] italic tracking-wide">
                        {article.image_captions[imgIdx]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* Category Tag */}
        <div className="mt-12 pt-6 border-t border-black/10 flex items-center justify-between text-xs text-[#666666]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
            <span>{t('news.category_label')}:</span>
            <span className="font-semibold text-black">{article.category}</span>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-black/15">
            <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#888888] uppercase mb-6 text-center">
              {t('news.related_title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/news/${encodeURIComponent(rel.slug)}`}
                  className="group block space-y-2.5"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                    <StudioImage
                      src={rel.image}
                      alt={rel.title}
                      fill
                      preset="catalog"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <span className="text-[9px] font-semibold tracking-wider text-[#888888] uppercase block">
                    {rel.date}
                  </span>
                  <h3 className="font-headline text-xs font-semibold text-black group-hover:text-[#555555] transition leading-snug line-clamp-2">
                    {rel.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
