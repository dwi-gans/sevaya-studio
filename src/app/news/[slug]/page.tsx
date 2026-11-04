import { notFound } from 'next/navigation';
import { getArticleBySlug, getArticles } from '@/integrations/supabase/articles';
import { NewsDetailClient } from '@/components/news/NewsDetailClient';

export const revalidate = 0;

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const [article, allArticles] = await Promise.all([
    getArticleBySlug(decodedSlug),
    getArticles(),
  ]);

  if (!article) {
    notFound();
  }

  const relatedArticles = allArticles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return <NewsDetailClient article={article} relatedArticles={relatedArticles} />;
}
