import { NextRequest, NextResponse } from 'next/server';
import {
  getArticles,
  getAllArticlesAdmin,
  createArticle,
  generateSlug,
} from '@/integrations/supabase/articles';

// GET /api/articles?admin=true
export async function GET(req: NextRequest) {
  const isAdmin = req.nextUrl.searchParams.get('admin') === 'true';

  try {
    const articles = isAdmin ? await getAllArticlesAdmin() : await getArticles();
    return NextResponse.json({ articles });
  } catch (err) {
    console.error('[GET /api/articles]', err);
    return NextResponse.json({ error: 'Gagal mengambil artikel' }, { status: 500 });
  }
}

// POST /api/articles
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, excerpt, content, image, images, featured, published, date, read_time } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Judul artikel wajib diisi' }, { status: 400 });
    }

    const slug = generateSlug(title);
    const now = new Date();
    const formattedDate =
      date ||
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newArticle = await createArticle({
      slug,
      title: title.trim(),
      category: category || 'Journal',
      date: formattedDate,
      read_time: read_time || '3 min read',
      excerpt: excerpt?.trim() || '',
      content: Array.isArray(content) ? content : [content || ''],
      image: image || '/images/catalog/catalog-01.jpg',
      images: Array.isArray(images) ? images : [],
      featured: Boolean(featured),
      published: published !== false,
    });

    if (!newArticle) {
      return NextResponse.json({ error: 'Gagal membuat artikel' }, { status: 500 });
    }

    return NextResponse.json({ article: newArticle }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/articles]', err);
    return NextResponse.json({ error: 'Gagal membuat artikel' }, { status: 500 });
  }
}
