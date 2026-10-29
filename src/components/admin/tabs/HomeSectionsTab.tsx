import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import type { SiteSectionsConfig } from '@/integrations/supabase';
import type { ImagePickerTarget } from '../adminTypes';

interface HomeSectionsTabProps {
  sections: SiteSectionsConfig;
  setSections: React.Dispatch<React.SetStateAction<SiteSectionsConfig>>;
  onOpenImagePicker: (target: ImagePickerTarget) => void;
}

export const HomeSectionsTab: React.FC<HomeSectionsTabProps> = ({
  sections,
  setSections,
  onOpenImagePicker,
}) => {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="pb-2">
        <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
          Editorial &amp; Storefront
        </span>
        <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
          Kelola Section Beranda (Homepage)
        </h2>
        <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
          Hero Banner, Category Spotlight, Signature Textiles, dan Editorial Journal. Tersimpan otomatis.
        </p>
      </div>

      {/* 1. HERO SECTION */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-7 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
        <div className="border-b border-black/10 pb-2.5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-black">
              1. Hero Section (Homepage Banner Utama)
            </h3>
            <p className="text-[11px] text-black/60 mt-0">
              Banner utama dengan foto latar penuh dan teks tajuk toko.
            </p>
          </div>
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-semibold text-black/70 border border-black/15">
            Desktop &amp; Mobile
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-medium text-black/70">
              Gambar Latar Hero
            </span>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
              <Image
                src={sections.hero.image}
                alt="Hero preview"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('hero')}
              className="inline-flex min-h-[28px] sm:min-h-[34px] items-center justify-center gap-1 rounded-full border border-black/20 bg-white px-2 py-1 text-[10px] sm:text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
            >
              <Icon name="image" size={14} />
              <span>Ganti Gambar Hero</span>
            </button>
          </div>

          <div className="flex flex-col gap-3.5 lg:col-span-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black/70">
                Badge Label
              </label>
              <input
                type="text"
                value={sections.hero.badge}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, badge: e.target.value },
                  }))
                }
                className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black/70">
                Judul Utama (Title)
              </label>
              <input
                type="text"
                value={sections.hero.title}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, title: e.target.value },
                  }))
                }
                className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black/70">
                Deskripsi Hero
              </label>
              <textarea
                rows={2}
                value={sections.hero.desc}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, desc: e.target.value },
                  }))
                }
                className="w-full rounded-none border border-black/20 bg-white p-3 text-base sm:text-xs text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY SPOTLIGHT */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2">
          <h3 className="text-xs font-bold text-black">
            2. Category Spotlight (2 Kartu Sorotan)
          </h3>
          <p className="text-[11px] text-black/60 mt-0">
            Dua kartu kategori utama yang ditampilkan berdampingan di beranda.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
          {sections.spotlight.map((card, idx) => (
            <div
              key={card.id}
              className="flex flex-col gap-3 rounded-xl bg-black/5 p-4 border border-black/15/60"
            >
              <span className="text-xs font-semibold text-black/70 uppercase tracking-wider">
                Kartu Spotlight #{idx + 1}
              </span>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
                <Image src={card.image} alt={card.title} fill className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => onOpenImagePicker(`spotlight-${idx}` as ImagePickerTarget)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5"
              >
                <Icon name="image" size={14} />
                <span>Ganti Gambar #{idx + 1}</span>
              </button>
              <div className="flex flex-col gap-2 pt-1">
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSections((prev) => {
                      const next = [...prev.spotlight];
                      if (next[idx]) next[idx] = { ...next[idx]!, title: val };
                      return { ...prev, spotlight: next };
                    });
                  }}
                  placeholder="Judul"
                  className="w-full rounded-none border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                />
                <input
                  type="text"
                  value={card.subtitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSections((prev) => {
                      const next = [...prev.spotlight];
                      if (next[idx]) next[idx] = { ...next[idx]!, subtitle: val };
                      return { ...prev, spotlight: next };
                    });
                  }}
                  placeholder="Subjudul"
                  className="w-full rounded-none border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SIGNATURE TEXTILES */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2">
          <h3 className="text-xs font-bold text-black">
            3. Showcase Tekstil Berkelanjutan
          </h3>
          <p className="text-[11px] text-black/60 mt-0">
            Banner narasi komitmen material premium ramah lingkungan Sevaya.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
            <Image
              src={sections.missionTextiles.image}
              alt="Textiles background"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => onOpenImagePicker('textiles')}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5"
            >
              <Icon name="image" size={14} />
              <span>Ganti Gambar Showcase Tekstil</span>
            </button>
            <input
              type="text"
              value={sections.missionTextiles.title}
              onChange={(e) =>
                setSections((prev) => ({
                  ...prev,
                  missionTextiles: { ...prev.missionTextiles, title: e.target.value },
                }))
              }
              className="w-full rounded-none border border-black/20 bg-white px-3.5 py-2 text-xs text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. JOURNAL SECTION */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2">
          <h3 className="text-xs font-bold text-black">
            4. Artikel Journal (2 Artikel)
          </h3>
          <p className="text-[11px] text-black/60 mt-0">
            Artikel editorial gaya hidup dan wawasan abaya di beranda toko.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
          {sections.journal.map((art, idx) => (
            <div
              key={art.id}
              className="flex flex-col gap-3 rounded-xl bg-black/5 p-4 border border-black/15/60"
            >
              <span className="text-xs font-semibold text-black/70 uppercase tracking-wider">
                Artikel #{idx + 1}
              </span>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
                <Image src={art.image} alt={art.title} fill className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => onOpenImagePicker(`journal-${idx}` as ImagePickerTarget)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5"
              >
                <Icon name="image" size={14} />
                <span>Ganti Gambar Artikel #{idx + 1}</span>
              </button>
              <input
                type="text"
                value={art.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setSections((prev) => {
                    const next = [...prev.journal];
                    if (next[idx]) next[idx] = { ...next[idx]!, title: val };
                    return { ...prev, journal: next };
                  });
                }}
                placeholder="Judul Artikel"
                className="w-full rounded-none border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
              />
              <textarea
                rows={2}
                value={art.excerpt}
                onChange={(e) => {
                  const val = e.target.value;
                  setSections((prev) => {
                    const next = [...prev.journal];
                    if (next[idx]) next[idx] = { ...next[idx]!, excerpt: val };
                    return { ...prev, journal: next };
                  });
                }}
                placeholder="Kutipan ringkasan"
                className="w-full rounded-none border border-black/20 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
