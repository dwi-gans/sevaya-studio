'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import type { Article } from '@/integrations/supabase/articles';

interface NewsClientFilterProps {
  articles: Article[];
  categories: string[];
  featuredArticle: Article | null;
  listArticles: Article[];
}

export function NewsClientFilter({
  articles,
  categories,
  featuredArticle: initialFeatured,
  listArticles: initialList,
}: NewsClientFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Stories');

  const filteredArticles =
    selectedCategory.toLowerCase() === 'all stories'
      ? articles
      : articles.filter((a) => a.category.toLowerCase() === selectedCategory.toLowerCase());

  const featuredArticle = filteredArticles.find((a) => a.featured) || filteredArticles[0] || null;
  const listArticles = filteredArticles.filter((a) => a.id !== featuredArticle?.id);

  return (
    <>
      {/* Category Pill Filter */}
      <nav aria-label="Kategori Artikel" className="my-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-none px-3.5 py-1.5 text-[10px] tracking-wider uppercase transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-semibold'
                    : 'bg-transparent text-[#666666] border-black/15 hover:border-black/50 hover:text-black'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Featured Lead Story */}
      {featuredArticle && (
        <section className="mb-10 sm:mb-12">
          <Link
            href={`/news/${encodeURIComponent(featuredArticle.slug)}`}
            className="group block rounded-none border border-black/15 bg-white p-4 sm:p-6 shadow-xs hover:border-black/50 hover:shadow-md transition duration-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 items-center">
              <div className="relative aspect-[16/10] md:col-span-6 w-full overflow-hidden rounded-none bg-black/5">
                <Image
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="md:col-span-6 flex flex-col justify-between self-stretch">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-[#666666]">
                    <span className="font-semibold tracking-widest uppercase text-black">
                      {featuredArticle.category}
                    </span>
                    <span>&bull;</span>
                    <span>{featuredArticle.date}</span>
                  </div>
                  <h2 className="mt-3 font-headline text-sm sm:text-lg lg:text-xl font-semibold tracking-tight text-[#000000] group-hover:text-[#555555] transition-colors leading-snug">
                    {featuredArticle.title}
                  </h2>
                  <p className="mt-3 text-[10px] sm:text-xs leading-relaxed text-[#333333] line-clamp-3 sm:line-clamp-4">
                    {featuredArticle.excerpt}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="inline-block text-[10px] sm:text-xs font-normal text-[#000000] border-b border-[#000000] pb-0.5 transition group-hover:text-[#555555] group-hover:border-[#555555]">
                    Read more
                  </span>
                  <span className="text-[10px] text-[#666666] font-medium hidden sm:inline">
                    Editorial Series
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Article Grid */}
      <section>
        {listArticles.length === 0 && !featuredArticle ? (
          <div className="rounded-none border border-dashed border-black/20 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/5 border border-[#E5E5E5] text-[#666666]">
              <Icon name="newspaper" size={24} />
            </div>
            <h3 className="mt-4 text-[11px] font-semibold text-[#000000]">No Articles Yet</h3>
            <p className="mt-1 text-[10px] text-[#555555] max-w-sm mx-auto">
              No articles under &ldquo;{selectedCategory}&rdquo; yet.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All Stories')}
              className="mt-5 inline-flex items-center gap-1.5 rounded-none bg-[#000000] px-5 py-2 text-[10px] font-semibold tracking-wider text-[#FFFFFF] uppercase transition hover:bg-[#1A1A1A]"
            >
              View All Stories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
            {listArticles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${encodeURIComponent(article.slug)}`}
                className="group block rounded-none border border-black/15 bg-white overflow-hidden shadow-xs hover:border-black/50 hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-black/5">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    quality={95}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-4">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-[#666666] uppercase">
                      {article.category}
                    </span>
                    <h3 className="mt-1 font-headline text-[10px] sm:text-xs font-semibold text-[#000000] group-hover:text-[#555555] transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#666666]">
                      <span>{article.date}</span>
                    </div>
                    <div className="mt-2 pt-0.5">
                      <span className="inline-block text-[10px] sm:text-[10px] font-normal text-[#000000] border-b border-[#000000] pb-0.5 transition group-hover:text-[#555555] group-hover:border-[#555555]">
                        Read more
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
