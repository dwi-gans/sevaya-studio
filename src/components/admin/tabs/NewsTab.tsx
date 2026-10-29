import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { Article, ARTICLE_CATEGORIES } from '@/integrations/supabase/articles';

interface NewsTabProps {
  articles: Article[];
  newsFilterCategory: string;
  setNewsFilterCategory: (cat: string) => void;
  newsSearchQuery: string;
  setNewsSearchQuery: (query: string) => void;
  onOpenCreateArticleModal: () => void;
  onOpenEditArticleModal: (art: Article) => void;
  onToggleFeaturedArticle: (id: string) => void;
  onDeleteArticle: (id: string, title: string) => void;
}

export const NewsTab: React.FC<NewsTabProps> = ({
  articles,
  newsFilterCategory,
  setNewsFilterCategory,
  newsSearchQuery,
  setNewsSearchQuery,
  onOpenCreateArticleModal,
  onOpenEditArticleModal,
  onToggleFeaturedArticle,
  onDeleteArticle,
}) => {
  const filtered = articles.filter((a) => {
    const matchesCat =
      newsFilterCategory === 'All Stories' || a.category === newsFilterCategory;
    const q = newsSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {/* Top Toolbar */}
      <div className="pb-2">
        <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
          Editorial &amp; Storefront
        </span>
        <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
          Manajemen News &amp; Editorial (Jurnal)
        </h2>
        <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
          Kelola artikel berita, jurnal filosofi brand, dan wawasan busana modest.
        </p>
      </div>

      {/* Telemetry Summary Card */}
      <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
        <div className="grid grid-cols-3 divide-x divide-[rgba(0,0,0,0.12)]/50 gap-0">
          <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
              Total Terbit
            </span>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold text-black">{articles.length}</span>
              <span className="text-[10px] text-black/60">artikel</span>
            </div>
            <span className="hidden sm:block text-[11px] text-black/50">
              Tersinkronisasi otomatis
            </span>
          </div>

          <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
              Featured
            </span>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold text-amber-600">
                {articles.filter((a) => a.featured).length}
              </span>
              <span className="text-[10px] text-black/60">sorotan</span>
            </div>
            <span className="hidden sm:block text-[11px] text-black/50">
              Banner hero editorial
            </span>
          </div>

          <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
              Kategori
            </span>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold text-black">
                {ARTICLE_CATEGORIES.filter((c) => c !== 'All Stories').length}
              </span>
              <span className="text-[10px] text-black/60">topik</span>
            </div>
            <span className="hidden sm:block text-[11px] text-black/50">
              Journal &amp; Event
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-black/15 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
          {ARTICLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setNewsFilterCategory(cat)}
              className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${
                newsFilterCategory === cat
                  ? 'bg-black text-white'
                  : 'border border-black/20 bg-white text-black/70 hover:bg-black/5 hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 shrink-0">
            <input
              type="text"
              value={newsSearchQuery}
              onChange={(e) => setNewsSearchQuery(e.target.value)}
              placeholder="Cari judul atau topik artikel..."
              className="w-full min-h-[38px] sm:min-h-[34px] rounded-lg border border-black/20 bg-white pl-8 pr-3 py-1.5 text-xs text-black focus:border-black focus:bg-white focus:outline-none"
            />
            <Icon
              name="search"
              size={15}
              className="pointer-events-none absolute left-2.5 top-2.5 text-black/70"
            />
          </div>
          <button
            type="button"
            onClick={onOpenCreateArticleModal}
            className="shrink-0 min-h-[38px] sm:min-h-[34px] inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95"
          >
            <Icon name="add" size={15} />
            <span>Tulis Artikel Baru</span>
          </button>
        </div>
      </div>

      {/* Articles Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/15 bg-white p-12 text-center text-black/70">
          <Icon name="search_off" size={36} className="mb-2 text-black/50 mx-auto block" />
          <p className="font-semibold text-sm text-black">Tidak ada artikel yang cocok</p>
          <p className="text-xs text-black/70 mt-1">
            Coba ganti kata kunci pencarian atau pilih kategori lain.
          </p>
          <button
            type="button"
            onClick={onOpenCreateArticleModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-black/85"
          >
            <Icon name="add" size={15} />
            <span>Tulis Artikel Baru</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
          {filtered.map((art) => (
            <div
              key={art.id}
              className="flex flex-col rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)] overflow-hidden transition hover:border-black/20"
            >
              {/* Cover Photo */}
              <div className="relative aspect-[16/10] w-full bg-black/5 overflow-hidden">
                <Image
                  src={art.image || '/images/catalog/catalog-11.jpg'}
                  alt={art.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
                {art.featured && (
                  <div className="absolute top-2.5 left-2.5 rounded-full bg-black/90 backdrop-blur-xs px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 border border-amber-300/30">
                    ⭐ Featured Story
                  </div>
                )}
                <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur-xs">
                  {art.read_time}
                </div>
              </div>

              {/* Content Info */}
              <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                <div className="flex items-center justify-between text-[11px] text-black/50">
                  <span className="font-semibold text-black/70">{art.category}</span>
                  <span>{art.date}</span>
                </div>

                <h3 className="mt-1 text-xs font-bold text-black line-clamp-2">
                  {art.title}
                </h3>

                <p className="mt-1 text-[11px] text-black/70 line-clamp-2 leading-snug flex-1">
                  {art.excerpt}
                </p>

                <div className="mt-2 text-[10px] font-mono text-black/50">
                  /{art.slug}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-black/15/60 flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenEditArticleModal(art)}
                    className="flex-1 min-h-[38px] flex items-center justify-center gap-1 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:bg-black/5 active:scale-95"
                  >
                    <Icon name="edit" size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFeaturedArticle(art.id)}
                    title={art.featured ? 'Batalkan Status Featured' : 'Jadikan Featured Story'}
                    className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full border transition-colors active:scale-95 ${
                      art.featured
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-black/20 bg-white text-black/70 hover:bg-black/5'
                    }`}
                  >
                    <Icon name="star" size={14} filled={art.featured} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteArticle(art.id, art.title)}
                    title="Hapus Artikel"
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:scale-95"
                  >
                    <Icon name="delete" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
