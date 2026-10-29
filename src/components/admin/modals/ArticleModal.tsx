'use client';

import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { Article, ARTICLE_CATEGORIES } from '@/integrations/supabase/articles';
import { ImagePickerTarget } from '../adminTypes';

export interface ArticleFormData {
  title: string;
  slug: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: string;
  image: string;
  images: string[];
  featured: boolean;
}

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingArticle: Article | null;
  articleForm: ArticleFormData;
  setArticleForm: React.Dispatch<React.SetStateAction<ArticleFormData>>;
  onSave: (e: React.FormEvent) => Promise<void>;
  onOpenImagePicker: (target: ImagePickerTarget) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isUploading: boolean;
  showToast: (msg: string) => void;
}

export function ArticleModal({
  isOpen,
  onClose,
  editingArticle,
  articleForm,
  setArticleForm,
  onSave,
  onOpenImagePicker,
  onFileUpload,
  isUploading,
  showToast,
}: ArticleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] sm:max-h-[90vh] w-full max-w-2xl flex flex-col rounded-t-2xl sm:rounded-2xl border border-black/15 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/15/70 bg-white px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
              Editorial Journal
            </span>
            <h3 className="font-headline text-base sm:text-lg font-bold text-black">
              {editingArticle ? 'Edit Artikel Berita' : 'Tulis Artikel Berita Baru'}
            </h3>
            <p className="text-[11px] sm:text-[11px] text-black/60 mt-0">
              Publikasikan wawasan busana, filosofi tekstil, atau rilis studio ke /news.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-black/70 hover:bg-black/5 hover:text-black transition-colors cursor-pointer"
            aria-label="Tutup Form Artikel"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={onSave} className="flex flex-col gap-4.5 p-3.5 sm:p-6 overflow-y-auto">
          {/* Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black/70">
                Judul Artikel *
              </label>
              <input
                type="text"
                required
                value={articleForm.title}
                onChange={(e) => setArticleForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="cth. The Art of Fewer, Better Choices"
                className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black/70">
                Slug URL
              </label>
              <input
                type="text"
                value={articleForm.slug}
                onChange={(e) => setArticleForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="otomatis dibuat dari judul"
                className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Category, Date & Read Time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black/70">
                Kategori Topik
              </label>
              <select
                value={articleForm.category}
                onChange={(e) => setArticleForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full min-h-[38px] rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs text-black focus:border-black focus:bg-white focus:outline-none"
              >
                {ARTICLE_CATEGORIES.filter((c) => c !== 'All Stories').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black/70">
                Tanggal Rilis
              </label>
              <input
                type="text"
                value={articleForm.date}
                onChange={(e) => setArticleForm((prev) => ({ ...prev, date: e.target.value }))}
                placeholder="cth. Oct 18, 2026"
                className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black/70">
                Estimasi Waktu Baca
              </label>
              <input
                type="text"
                value={articleForm.readTime}
                onChange={(e) => setArticleForm((prev) => ({ ...prev, readTime: e.target.value }))}
                placeholder="cth. 4 min read"
                className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-black/70">
              Cuplikan / Excerpt (Tampil di kartu &amp; preview)
            </label>
            <textarea
              rows={2}
              required
              value={articleForm.excerpt}
              onChange={(e) => setArticleForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Ringkasan 1-2 kalimat mengenai topik artikel ini..."
              className="w-full rounded border border-black/20 bg-white p-2.5 text-xs text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          {/* Full Content */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-black/70">
                Isi Paragraf Konten Lengkap
              </label>
              <span className="text-[10px] text-black/50">
                Pisahkan antar paragraf dengan 2x Enter (baris kosong)
              </span>
            </div>
            <textarea
              rows={6}
              required
              value={articleForm.content}
              onChange={(e) => setArticleForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Tulis narasi lengkap artikel di sini..."
              className="w-full rounded border border-black/20 bg-white p-2.5 text-xs text-black focus:border-black focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          {/* FOTO SAMPUL ARTIKEL */}
          <div className="flex flex-col gap-3 rounded-xl border border-black/15 bg-black/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-black">Foto Sampul Artikel</span>
              <button
                type="button"
                onClick={() => onOpenImagePicker('article')}
                className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-black/20 bg-white px-3 py-1 text-xs font-medium text-black hover:bg-white active:scale-95 cursor-pointer"
              >
                <Icon name="image" size={14} />
                <span>Pilih dari Galeri</span>
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-black/15 bg-white">
                <Image
                  src={articleForm.image || '/images/catalog/catalog-11.jpg'}
                  alt="cover"
                  fill
                  className="object-cover"
                  unoptimized={Boolean(articleForm.image?.startsWith('http'))}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <input
                  type="text"
                  value={articleForm.image}
                  onChange={(e) => setArticleForm((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="/images/catalog/catalog-11.jpg atau URL Supabase"
                  className="w-full min-h-[36px] rounded border border-black/20 bg-white px-3 py-1 text-xs text-black focus:border-black focus:outline-none"
                />
                <label className="inline-flex min-h-[34px] w-fit cursor-pointer items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95">
                  <Icon name="upload" size={14} />
                  <span>{isUploading ? 'Mengunggah...' : 'Unggah File Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => {
                      onOpenImagePicker('article');
                      onFileUpload(e);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Featured checkbox */}
            <label className="mt-1 flex cursor-pointer items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
              <input
                type="checkbox"
                checked={articleForm.featured}
                onChange={(e) => setArticleForm((prev) => ({ ...prev, featured: e.target.checked }))}
                className="h-4 w-4 accent-amber-600"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-900">Jadikan Artikel Pilihan Utama (Featured Story)</span>
                <span className="text-[11px] text-amber-700">Artikel ini akan tampil pada banner hero besar di bagian atas halaman /news.</span>
              </div>
            </label>
          </div>

          {/* FOTO ISI ARTIKEL (MULTI-IMAGE) */}
          <div className="flex flex-col gap-3 rounded-xl border border-black/15 bg-black/5 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-semibold text-black">Foto Isi Artikel (Editorial Gallery)</span>
                <p className="text-[10px] text-black/50 mt-0.5">Foto-foto ini akan disisipkan di antara narasi paragraf artikel seperti majalah.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenImagePicker('article-add-image')}
                  className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-black/20 bg-black text-white px-3 py-1 text-xs font-medium hover:bg-black/85 active:scale-95 transition cursor-pointer"
                >
                  <Icon name="image" size={13} />
                  <span>Pilih dari Galeri</span>
                </button>
                <button
                  type="button"
                  onClick={() => setArticleForm((prev) => ({ ...prev, images: [...prev.images, ''] }))}
                  className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-black/20 bg-white px-3 py-1 text-xs font-medium text-black hover:bg-black/5 active:scale-95 transition cursor-pointer"
                >
                  <Icon name="add" size={13} />
                  <span>Slot Baru</span>
                </button>
              </div>
            </div>

            {articleForm.images.length === 0 && (
              <div className="text-center py-5 border border-dashed border-black/15 rounded-xl bg-white/50 space-y-2">
                <p className="text-xs text-black/60 font-medium">Belum ada foto isi artikel tambahan.</p>
                <p className="text-[11px] text-black/40 max-w-sm mx-auto">
                  Klik <strong>&quot;Pilih dari Galeri&quot;</strong> di atas untuk memasukkan foto katalog studio ke dalam artikel.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {articleForm.images.map((img, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-black/10 bg-white p-3 shadow-xs">
                  {/* Preview Image */}
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/5">
                    {img ? (
                      <Image
                        src={img}
                        alt={`foto-${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized={Boolean(img.startsWith('http'))}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-black/25">
                        <Icon name="image" size={20} />
                      </div>
                    )}
                  </div>

                  {/* Input & Ganti Galeri */}
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wider">
                        Foto #{idx + 1} {idx === 0 ? '(Tampil setelah Paragraf 1)' : `(Paragraf ${idx + 1})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenImagePicker(`article-image-${idx}` as ImagePickerTarget)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-black hover:underline cursor-pointer"
                      >
                        <Icon name="image" size={12} />
                        <span>Ganti dari Galeri</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={img}
                      onChange={(e) => {
                        const next = [...articleForm.images];
                        next[idx] = e.target.value;
                        setArticleForm((prev) => ({ ...prev, images: next }));
                      }}
                      placeholder="/images/catalog/catalog-12.jpg atau URL Supabase"
                      className="w-full min-h-[34px] rounded border border-black/20 bg-white px-2.5 py-1 text-xs text-black focus:border-black focus:outline-none"
                    />
                  </div>

                  {/* Urutan & Hapus */}
                  <div className="flex items-center sm:flex-col gap-1.5 self-end sm:self-center shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        title="Geser ke atas"
                        onClick={() => {
                          const next = [...articleForm.images];
                          [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
                          setArticleForm((prev) => ({ ...prev, images: next }));
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 bg-white text-black/50 hover:text-black disabled:opacity-20 transition cursor-pointer"
                      >
                        <Icon name="expand_less" size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === articleForm.images.length - 1}
                        title="Geser ke bawah"
                        onClick={() => {
                          const next = [...articleForm.images];
                          [next[idx + 1], next[idx]] = [next[idx]!, next[idx + 1]!];
                          setArticleForm((prev) => ({ ...prev, images: next }));
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 bg-white text-black/50 hover:text-black disabled:opacity-20 transition cursor-pointer"
                      >
                        <Icon name="expand_more" size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      title="Hapus foto"
                      onClick={() => {
                        setArticleForm((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== idx),
                        }));
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition cursor-pointer"
                    >
                      <Icon name="delete" size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload foto langsung */}
            <div className="pt-1">
              <label className="inline-flex min-h-[34px] w-fit cursor-pointer items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-1 text-xs font-medium text-black hover:bg-black hover:text-white transition active:scale-95">
                <Icon name="upload" size={14} />
                <span>{isUploading ? 'Mengunggah...' : 'Unggah File Foto Baru'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const { uploadFileToStorage } = await import('@/integrations/supabase/storage');
                      const url = await uploadFileToStorage(file, 'articles');
                      if (url) {
                        setArticleForm((prev) => ({ ...prev, images: [...prev.images, url] }));
                        showToast('Foto berhasil diunggah dan ditambahkan!');
                      }
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto';
                      showToast(`Upload gagal: ${msg}. Anda juga bisa memilih dari Galeri.`);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-black/15/70 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] flex-1 sm:flex-initial rounded-full border border-black/20 bg-white px-5 py-2 text-xs font-medium text-black/70 hover:bg-black/5 hover:text-black active:scale-95 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-6 py-2 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-[0.99] cursor-pointer"
            >
              <Icon name="check" size={15} />
              <span>{editingArticle ? 'Simpan Perubahan' : 'Terbitkan Artikel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
