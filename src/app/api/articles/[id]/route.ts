import { NextRequest, NextResponse } from 'next/server';
import {
  getArticleBySlug,
  updateArticle,
  deleteArticle,
} from '@/integrations/supabase/articles';
import { verifyAdminSession } from '@/lib/auth-admin';

// GET /api/articles/[id] — by id or slug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await getArticleBySlug(id);
  if (!article) {
    return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json(
    { article },
    { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } }
  );
}

// PATCH /api/articles/[id] (Admin Only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = verifyAdminSession(req);
  if (!adminSession) {
    return NextResponse.json({ error: 'Akses ditolak: Autentikasi admin diperlukan.' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const result = await updateArticle(id, body);
    if (result.error || !result.article) {
      return NextResponse.json({ error: result.error || 'Gagal memperbarui artikel' }, { status: 500 });
    }
    return NextResponse.json({ article: result.article });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui artikel';
    console.error('[PATCH /api/articles/[id]]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/articles/[id] (Admin Only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = verifyAdminSession(req);
  if (!adminSession) {
    return NextResponse.json({ error: 'Akses ditolak: Autentikasi admin diperlukan.' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const ok = await deleteArticle(id);
    if (!ok) {
      return NextResponse.json({ error: 'Gagal menghapus artikel' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/articles/[id]]', err);
    return NextResponse.json({ error: 'Gagal menghapus artikel' }, { status: 500 });
  }
}
