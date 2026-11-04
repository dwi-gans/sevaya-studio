import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { Icon } from '@/components/ui/Icon';
import { getArticles, ARTICLE_CATEGORIES } from '@/integrations/supabase/articles';
import { NewsClientFilter } from '@/components/news/NewsClientFilter';

// Always fetch fresh — never serve stale/deleted articles
export const revalidate = 0;

export default async function NewsIndexPage() {
  // Fetch directly from Supabase on the server — zero flash, always fresh
  const articles = await getArticles();

  const featuredArticle = articles.find((a) => a.featured) || articles[0];
  const listArticles = articles.filter((a) => a.id !== featuredArticle?.id);

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-body text-[#000000] selection:bg-black/5 flex flex-col justify-between">
      <main className="mx-auto w-full max-w-5xl lg:max-w-6xl flex-1 px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
          <div>
            <span className="text-[10px] sm:text-[10px] font-semibold tracking-widest text-[#666666] uppercase">
              SEVAYA JOURNAL & ATELIER NOTES
            </span>
            <h1 className="font-headline text-base sm:text-xl lg:text-2xl font-semibold tracking-tight text-[#000000] mt-1">
              Reading Room & Stories
            </h1>
          </div>
          <p className="text-[10px] sm:text-xs text-[#555555] max-w-sm leading-relaxed sm:text-right">
            Reflections on modest elegance, explorations of pure materials, and creative studio notes.
          </p>
        </div>

        {/* Client-side category filter + article rendering */}
        <NewsClientFilter
          articles={articles}
          categories={ARTICLE_CATEGORIES}
          featuredArticle={featuredArticle || null}
          listArticles={listArticles}
        />
      </main>

      <Footer />
    </div>
  );
}
