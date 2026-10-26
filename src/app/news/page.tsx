'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { Footer } from '@/components/layout/Footer';
import { Article, ARTICLE_CATEGORIES, loadArticles } from '@/data/newsArticles';

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Stories');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    setArticles(loadArticles());
  }, []);

  const filteredArticles =
    selectedCategory === 'All Stories'
      ? articles
      : articles.filter((a) => a.category === selectedCategory);

  // Curated hero lead article (when "All Stories" is selected)
  const featuredArticle =
    selectedCategory === 'All Stories'
      ? articles.find((a) => a.featured) || articles[0]
      : null;

  // Remaining articles to display in the editorial row list
  const listArticles =
    selectedCategory === 'All Stories' && featuredArticle
      ? filteredArticles.filter((a) => a.id !== featuredArticle.id)
      : filteredArticles;

  return (
    <div className="min-h-screen bg-[#FAF8F5] font-body text-[#141312] selection:bg-[#F4EFEB] flex flex-col justify-between">
      {/* ── MAIN EDITORIAL CONTAINER (Aligned with User Profile layout max-w-4xl lg:max-w-5xl) ── */}
      <main className="mx-auto w-full max-w-4xl lg:max-w-5xl flex-1 px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-[#8E8380]">
          <Link href="/" className="hover:text-[#141312] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-medium text-[#141312]">Jurnal &amp; Editorial</span>
        </nav>

        {/* Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-[#E5DDD5]">
          <div>
            <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#8E8380] uppercase">
              SEVAYA JOURNAL &amp; ATELIER NOTES
            </span>
            <h1 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#141312] mt-1">
              Ruang Baca &amp; Cerita
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#685E5A] max-w-sm leading-relaxed sm:text-right">
            Refleksi tentang keanggunan modest, eksplorasi material murni, dan catatan kreatif studio.
          </p>
        </div>

        {/* Category Filter Pills (Matching User Profile clean chip style) */}
        <div className="flex items-center gap-2 overflow-x-auto py-5 no-scrollbar border-b border-[#E5DDD5]/60 mb-6">
          {ARTICLE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition active:scale-95 ${
                  isActive
                    ? 'bg-[#141312] text-[#FAF8F5] shadow-xs'
                    : 'border border-[#D0C5BD] bg-white text-[#554C48] hover:border-[#141312] hover:bg-[#F4EFEB]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── FEATURED LEAD STORY (Quiet Luxury Editorial Hero Card) ── */}
        {featuredArticle && (
          <section className="mb-8">
            <div
              onClick={() => setSelectedArticle(featuredArticle)}
              className="group cursor-pointer rounded-2xl border border-[#E5DDD5] bg-white p-5 sm:p-7 shadow-[0_1px_4px_rgba(27,23,24,0.03)] hover:border-[#D0C5BD] transition-all duration-300"
            >
              {/* Card Meta Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5DDD5]/70 mb-5">
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-widest text-[#8E8380] uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#141312]" />
                  EDISI UTAMA &bull; {featuredArticle.category}
                </span>
                <span className="text-xs text-[#8E8380]">{featuredArticle.readTime} membaca</span>
              </div>

              {/* Card Body: 2-column wide layout on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Photo with soft corner styling */}
                <div className="md:col-span-6 relative aspect-[16/10] sm:aspect-[4/3] md:aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#F4EFEB] border border-[#E5DDD5]/50">
                  <Image
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    fill
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Editorial Details */}
                <div className="md:col-span-6 flex flex-col justify-between self-stretch">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#8E8380]">
                      <span>{featuredArticle.date}</span>
                      <span>&bull;</span>
                      <span>{featuredArticle.readTime} membaca</span>
                    </div>

                    <h2 className="mt-3 font-headline text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[#141312] group-hover:text-[#685E5A] transition-colors leading-snug">
                      {featuredArticle.title}
                    </h2>

                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#554C48] line-clamp-3 sm:line-clamp-4">
                      {featuredArticle.excerpt}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="inline-block text-xs sm:text-sm font-normal text-[#141312] border-b border-[#141312] pb-0.5 transition group-hover:text-[#685E5A] group-hover:border-[#685E5A]">
                      Read more
                    </span>
                    <span className="text-xs text-[#8E8380] font-medium hidden sm:inline">
                      Editorial Series
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── ARTICLE GRID (2-column compact grid, portrait card style) ── */}
        <section>
          {listArticles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D0C5BD] bg-white p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4EFEB] border border-[#E5DDD5] text-[#8E8380]">
                <Icon name="newspaper" size={24} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#141312]">Belum Ada Jurnal</h3>
              <p className="mt-1 text-xs text-[#685E5A] max-w-sm mx-auto">
                Belum ada tulisan di bawah topik &ldquo;{selectedCategory}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory('All Stories')}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#141312] px-5 py-2 text-xs font-semibold tracking-wider text-[#FAF8F5] uppercase transition hover:bg-[#2b2826]"
              >
                Lihat Semua Cerita
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {listArticles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="group cursor-pointer rounded-2xl border border-[#E5DDD5] bg-white overflow-hidden shadow-[0_1px_4px_rgba(27,23,24,0.03)] hover:border-[#141312]/40 transition duration-200"
                >
                  {/* Square Thumbnail */}
                  <div className="relative aspect-square w-full overflow-hidden bg-[#F4EFEB]">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="p-3 sm:p-4">
                    <span className="text-[10px] font-semibold tracking-widest text-[#8E8380] uppercase">
                      {article.category}
                    </span>
                    <h3 className="mt-1 font-headline text-sm sm:text-base font-semibold text-[#141312] group-hover:text-[#685E5A] transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[#8E8380]">{article.date}</span>
                      <span className="text-[10px] sm:text-xs text-[#8E8380]">{article.readTime}</span>
                    </div>
                    <div className="mt-3 pt-1">
                      <span className="inline-block text-[11px] sm:text-xs font-normal text-[#141312] border-b border-[#141312] pb-0.5 transition group-hover:text-[#685E5A] group-hover:border-[#685E5A]">
                        Read more
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── ARTICLE READER MODAL (Bottom-sheet on mobile, serene reading canvas on desktop) ── */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-[#1B1718]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedArticle(null)}
          />

          <div className="relative z-10 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white border border-[#E5DDD5] p-5 sm:p-8 shadow-2xl">
            {/* Mobile Sheet Handle */}
            <div className="w-12 h-1.5 bg-[#E5DDD5] rounded-full mx-auto mb-4 sm:hidden" />

            {/* Close Button */}
            <button
              type="button"
              aria-label="Tutup jendela artikel"
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F4EFEB] text-[#141312] hover:bg-[#E5DDD5] transition active:scale-95"
            >
              <Icon name="close" size={18} />
            </button>

            {/* Modal Header Metadata */}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold tracking-widest text-[#8E8380] uppercase">
              <span className="rounded-full bg-[#F4EFEB] px-2.5 py-0.5 text-[#685E5A] border border-[#E5DDD5]/70">
                {selectedArticle.category}
              </span>
              <span>&bull;</span>
              <span>{selectedArticle.date}</span>
              <span>&bull;</span>
              <span>{selectedArticle.readTime} membaca</span>
            </div>

            {/* Headline */}
            <h2 className="mt-3 font-headline text-xl sm:text-2xl lg:text-3xl font-semibold text-[#141312] leading-snug">
              {selectedArticle.title}
            </h2>

            {/* Featured Image */}
            <div className="relative my-5 aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#F4EFEB] border border-[#E5DDD5]">
              <Image
                src={selectedArticle.image}
                alt={selectedArticle.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Quote Excerpt Box */}
            <div className="rounded-xl bg-[#F4EFEB] p-4 border border-[#E5DDD5]/70 text-xs sm:text-sm italic text-[#141312] leading-relaxed mb-6">
              &ldquo;{selectedArticle.excerpt}&rdquo;
            </div>

            {/* Article Content Paragraphs */}
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-[#554C48]">
              {selectedArticle.content.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-8 border-t border-[#E5DDD5] pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="rounded-full border border-[#D0C5BD] bg-white px-5 py-2.5 text-xs font-medium text-[#141312] transition hover:bg-[#F4EFEB] text-center"
              >
                Kembali ke Jurnal
              </button>
              <Link
                href="/shop"
                onClick={() => setSelectedArticle(null)}
                className="rounded-full bg-[#141312] px-6 py-2.5 text-xs font-semibold tracking-wider text-[#FAF8F5] uppercase hover:bg-[#2b2826] transition text-center"
              >
                Jelajahi Koleksi
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
