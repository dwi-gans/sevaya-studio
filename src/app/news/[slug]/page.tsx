'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Icon } from '@/components/ui/Icon';
import { Article } from '@/integrations/supabase/articles';
import { INITIAL_ARTICLES } from '@/data/newsArticles';

export default function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  // Immediate 0ms initial state from INITIAL_ARTICLES so there's zero flash or empty screen
  const [article, setArticle] = useState<Article | null>(() => {
    const found = INITIAL_ARTICLES.find((a) => a.slug === slug);
    if (!found) return null;
    return {
      id: found.id,
      slug: found.slug,
      title: found.title,
      category: found.category,
      date: found.date,
      read_time: found.readTime,
      excerpt: found.excerpt,
      content: found.content,
      image: found.image,
      images: ['/images/catalog/catalog-12.jpg'],
      featured: Boolean(found.featured),
      published: true,
    };
  });

  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 1. Fetch current dynamic article from API
    fetch(`/api/articles/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.article) {
          setArticle(data.article);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    // 2. Fetch all articles for related stories section
    fetch('/api/articles')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.articles)) {
          setAllArticles(data.articles);
        }
      })
      .catch(() => {});
  }, [slug]);

  if (loaded && !article) {
    notFound();
  }

  const currentArticle = article || {
    id: 'default',
    slug,
    title: 'SEVAYA Editorial Note',
    category: 'Journal',
    date: 'Oct 2026',
    read_time: '4 min read',
    excerpt: '',
    content: [],
    image: '/images/catalog/catalog-11.jpg',
    images: ['/images/catalog/catalog-12.jpg'],
    featured: false,
    published: true,
  };

  const relatedArticles = allArticles
    .filter((a) => a.slug !== currentArticle.slug)
    .slice(0, 3);

  // Tengah image (default catalog-12.jpg if not set from admin)
  const middleImage = currentArticle.images?.[0] || '/images/catalog/catalog-12.jpg';
  const extraImages = currentArticle.images?.slice(1) || [];

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
            <span>Semua Cerita &amp; Jurnal</span>
          </Link>
        </div>

        {/* Article Header (Centered Editorial Style matching the reference photo) */}
        <header className="text-center mb-8 sm:mb-10 space-y-3">
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#888888] uppercase block">
            {currentArticle.date}
          </span>
          <h1 className="font-headline text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-[#000000] uppercase leading-tight max-w-2xl mx-auto">
            {currentArticle.title}
          </h1>
        </header>

        {/* Hero Photo Besar Pertama */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-black/5 mb-8">
          <Image
            src={currentArticle.image}
            alt={currentArticle.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>

        {/* Article Body Content (Editorial Narrative) */}
        <article className="prose prose-neutral max-w-none space-y-6 text-[#222222] text-xs sm:text-[13px] leading-relaxed">
          {/* Paragraf Pembuka */}
          {currentArticle.excerpt && (
            <p className="font-serif italic text-black/80 sm:text-sm leading-relaxed border-l-2 border-black/20 pl-4 py-1">
              {currentArticle.excerpt}
            </p>
          )}

          {/* Konten Paragraf Utama */}
          {currentArticle.content?.map((paragraph, index) => (
            <React.Fragment key={index}>
              <p className="leading-relaxed">
                {paragraph}
              </p>

              {/* Injeksi Foto Editorial Tengah (Seperti Layout Majalah / Foto Referensi Pengguna) */}
              {index === 0 && middleImage && (
                <div className="my-8 space-y-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
                    <Image
                      src={middleImage}
                      alt="SEVAYA Studio Detail"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                  </div>
                  <p className="text-[10px] text-center text-[#777777] italic tracking-wide">
                    Atelier notes — an intimate gathering and honest reflections on modest grace.
                  </p>
                </div>
              )}

              {/* Foto tambahan berikutnya jika disisipkan di antara paragraf */}
              {index > 0 && extraImages[index - 1] && (
                <div className="my-8 space-y-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
                    <Image
                      src={extraImages[index - 1]!}
                      alt={`${currentArticle.title} — foto ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                  </div>
                  <p className="text-[10px] text-center text-[#777777] italic tracking-wide">
                    Atelier notes — {currentArticle.title}
                  </p>
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Sisa foto jika jumlah foto melebihi jumlah paragraf */}
          {extraImages.length >= (currentArticle.content?.length || 1) && (
            <div className="mt-8 space-y-6">
              {extraImages.slice((currentArticle.content?.length || 1) - 1).map((img, i) => (
                <div key={i} className="space-y-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
                    <Image
                      src={img}
                      alt={`${currentArticle.title} — foto ${i + 2}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                  </div>
                  <p className="text-[10px] text-center text-[#777777] italic tracking-wide">
                    Atelier notes — {currentArticle.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* Category Tag */}
        <div className="mt-12 pt-6 border-t border-black/10 flex items-center justify-between text-xs text-[#666666]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
            <span>Kategori:</span>
            <span className="font-semibold text-black">{currentArticle.category}</span>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-black/15">
            <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#888888] uppercase mb-6 text-center">
              Cerita Terkait Lainnya
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/news/${encodeURIComponent(rel.slug)}`}
                  className="group block space-y-2.5"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                    <Image
                      src={rel.image}
                      alt={rel.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 260px"
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
