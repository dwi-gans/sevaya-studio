import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import {
  SiteSectionsConfig,
  DEFAULT_SITE_SECTIONS,
  DEFAULT_CLOSER_LOOK,
  DEFAULT_HOME_NARRATIVE,
  DEFAULT_JOURNAL_HEADER,
  saveSiteSections,
  HomeNarrativeConfig,
  HomeJournalHeaderConfig,
  CloserLookData,
} from '@/integrations/supabase';
import { uploadFileToStorage } from '@/integrations/supabase/storage';
import type { Article } from '@/integrations/supabase/articles';
import { INITIAL_ARTICLES } from '@/data/newsArticles';
import type { ImagePickerTarget } from '../adminTypes';

// â”€â”€ Upload Action Group (harus di luar komponen agar tidak re-create saat render) â”€â”€
interface UploadActionGroupProps {
  target: ImagePickerTarget;
  label?: string;
  currentImage?: string;
  uploadingTarget: ImagePickerTarget | null;
  onDirectUpload: (target: ImagePickerTarget, file: File) => void | Promise<void>;
  onOpenImagePicker: (target: ImagePickerTarget) => void;
}

const UploadActionGroup: React.FC<UploadActionGroupProps> = ({
  target,
  label = 'Pilih Galeri',
  uploadingTarget,
  onDirectUpload,
  onOpenImagePicker,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isUploadingThis = uploadingTarget === target;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <input
        type="file"
        ref={inputRef}
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onDirectUpload(target, file);
          const inputEl = e.target;
          setTimeout(() => {
            if (inputEl) inputEl.value = '';
          }, 100);
        }}
      />
      <button
        type="button"
        disabled={isUploadingThis || uploadingTarget !== null}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-0.5 text-[9px] font-semibold text-white transition hover:bg-black/85 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
        title="Unggah foto langsung"
      >
        <Icon name="upload" size={11} />
        <span>{isUploadingThis ? 'Mengunggah...' : 'Unggah'}</span>
      </button>

      <button
        type="button"
        onClick={() => onOpenImagePicker(target)}
        className="inline-flex items-center gap-1 rounded-full border border-black/20 bg-white px-2 py-0.5 text-[9px] font-medium text-black hover:border-black active:scale-95 transition cursor-pointer"
      >
        <Icon name="image" size={11} />
        <span>{label}</span>
      </button>
    </div>
  );
};

interface HomeSectionsTabProps {
  sections: SiteSectionsConfig;
  setSections: React.Dispatch<React.SetStateAction<SiteSectionsConfig>>;
  articles?: Article[];
  onOpenImagePicker: (target: ImagePickerTarget) => void;
  /** Dipanggil saat upload file â€” parent dapat intercept (mis. untuk image cropper hero) */
  onFileUploadDirect?: (target: ImagePickerTarget, file: File) => void | Promise<void>;
  showToast: (msg: string) => void;
}

export const HomeSectionsTab: React.FC<HomeSectionsTabProps> = ({
  sections,
  setSections,
  articles,
  onOpenImagePicker,
  onFileUploadDirect,
  showToast,
}) => {
  const hero = sections.hero || DEFAULT_SITE_SECTIONS.hero;
  const closerLook = sections.closerLook || DEFAULT_CLOSER_LOOK;
  const spotlightIntro = sections.spotlightIntro || DEFAULT_SITE_SECTIONS.spotlightIntro || '';
  const spotlight = sections.spotlight?.length ? sections.spotlight : DEFAULT_SITE_SECTIONS.spotlight;
  const narrative: HomeNarrativeConfig = {
    ...DEFAULT_HOME_NARRATIVE,
    ...(sections.narrative || {}),
  };
  const journalHeader: HomeJournalHeaderConfig = {
    ...DEFAULT_JOURNAL_HEADER,
    ...(sections.journalHeader || {}),
  };
  const journal = sections.journal?.length ? sections.journal : DEFAULT_SITE_SECTIONS.journal;

  // â”€â”€ Direct Upload Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [uploadingTarget, setUploadingTarget] = useState<ImagePickerTarget | null>(null);

  const handleDirectUpload = async (target: ImagePickerTarget, file: File) => {
    if (!file) return;
    setUploadingTarget(target);
    showToast(`Mengunggah ${file.name}...`);
    try {
      const publicUrl = await uploadFileToStorage(file, 'uploads');
      setSections((prev) => {
        let next = { ...prev };
        if (target === 'hero') {
          next = { ...next, hero: { ...(next.hero || DEFAULT_SITE_SECTIONS.hero), image: publicUrl } };
        } else if (target === 'hero-mobile') {
          next = { ...next, hero: { ...(next.hero || DEFAULT_SITE_SECTIONS.hero), mobileImage: publicUrl } };
        } else if (target === 'closer-look') {
          next = { ...next, closerLook: { ...(next.closerLook || DEFAULT_CLOSER_LOOK), image: publicUrl } };
        } else if (target === 'home-video-poster') {
          next = { ...next, narrative: { ...(next.narrative || DEFAULT_HOME_NARRATIVE), videoPoster: publicUrl } };
        } else if (target === 'home-about-1') {
          next = { ...next, narrative: { ...(next.narrative || DEFAULT_HOME_NARRATIVE), aboutImage1: publicUrl } };
        } else if (target === 'home-about-2') {
          next = { ...next, narrative: { ...(next.narrative || DEFAULT_HOME_NARRATIVE), aboutImage2: publicUrl } };
        } else if (target === 'spotlight-0') {
          const sp = [...(next.spotlight?.length ? next.spotlight : DEFAULT_SITE_SECTIONS.spotlight)];
          if (sp[0]) sp[0] = { ...sp[0], image: publicUrl };
          next = { ...next, spotlight: sp };
        } else if (target === 'spotlight-1') {
          const sp = [...(next.spotlight?.length ? next.spotlight : DEFAULT_SITE_SECTIONS.spotlight)];
          if (sp[1]) sp[1] = { ...sp[1], image: publicUrl };
          next = { ...next, spotlight: sp };
        } else if (target === 'textiles') {
          next = { ...next, missionTextiles: { ...(next.missionTextiles || DEFAULT_SITE_SECTIONS.missionTextiles), image: publicUrl } };
        } else if (target === 'journal-0') {
          const j = [...(next.journal?.length ? next.journal : DEFAULT_SITE_SECTIONS.journal)];
          if (j[0]) j[0] = { ...j[0], image: publicUrl };
          next = { ...next, journal: j };
        } else if (target === 'journal-1') {
          const j = [...(next.journal?.length ? next.journal : DEFAULT_SITE_SECTIONS.journal)];
          if (j[1]) j[1] = { ...j[1], image: publicUrl };
          next = { ...next, journal: j };
        }
        saveSiteSections(next);
        return next;
      });
      showToast('âœ“ Foto berhasil diunggah & langsung tersimpan di Cloud Beranda!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto';
      showToast(`Upload gagal: ${msg}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  // Jika parent menyediakan handler (misal untuk cropper), pakai itu; fallback ke lokal
  const resolvedDirectUpload = useCallback(
    (target: ImagePickerTarget, file: File): void | Promise<void> => {
      if (onFileUploadDirect) return onFileUploadDirect(target, file);
      return handleDirectUpload(target, file);
    },
    // handleDirectUpload adalah fungsi stabil dalam render scope ini
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onFileUploadDirect]
  );

  const availableArticles: Article[] =
    articles && articles.length > 0
      ? articles
      : INITIAL_ARTICLES.map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          category: a.category,
          date: a.date,
          read_time: a.readTime,
          excerpt: a.excerpt,
          content: a.content,
          image: a.image,
          images: [a.image],
          featured: Boolean(a.featured),
          published: true,
        }));

  const handleSelectArticleForSlot = (slotIdx: number, articleId: string) => {
    if (!articleId) return;
    const art = availableArticles.find((a) => a.id === articleId || a.slug === articleId);
    if (!art) return;

    setSections((prev) => {
      const nextJournal = [...(prev.journal?.length ? prev.journal : DEFAULT_SITE_SECTIONS.journal)];
      const formattedDate = art.category ? `${art.date} â€¢ ${art.category}` : art.date;
      nextJournal[slotIdx] = {
        id: `journal-${slotIdx + 1}`,
        title: art.title,
        date: formattedDate,
        excerpt: art.excerpt,
        image: art.image || '/images/catalog/catalog-11.jpg',
        href: `/news/${art.slug}`,
      };
      return { ...prev, journal: nextJournal };
    });
    showToast(`Slot #${slotIdx + 1} diatur ke artikel "${art.title}"!`);
  };

  // â”€â”€ Updaters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const updateHeroField = (field: keyof typeof hero, val: string) => {
    setSections((prev) => ({
      ...prev,
      hero: { ...(prev.hero || DEFAULT_SITE_SECTIONS.hero), [field]: val },
    }));
  };

  const updateCloserLookField = (field: keyof CloserLookData, val: string) => {
    setSections((prev) => ({
      ...prev,
      closerLook: { ...(prev.closerLook || DEFAULT_CLOSER_LOOK), [field]: val },
    }));
  };

  const updateNarrativeField = (field: keyof HomeNarrativeConfig, val: string) => {
    setSections((prev) => ({
      ...prev,
      narrative: { ...(prev.narrative || DEFAULT_HOME_NARRATIVE), [field]: val },
    }));
  };

  const updateJournalHeaderField = (field: keyof HomeJournalHeaderConfig, val: string) => {
    setSections((prev) => ({
      ...prev,
      journalHeader: { ...(prev.journalHeader || DEFAULT_JOURNAL_HEADER), [field]: val },
    }));
  };

  const updateSpotlightItem = (idx: number, field: string, val: string) => {
    setSections((prev) => {
      const next = [...(prev.spotlight?.length ? prev.spotlight : DEFAULT_SITE_SECTIONS.spotlight)];
      if (next[idx]) {
        next[idx] = { ...next[idx]!, [field]: val };
      }
      return { ...prev, spotlight: next };
    });
  };

  const updateJournalItem = (idx: number, field: string, val: string) => {
    setSections((prev) => {
      const next = [...(prev.journal?.length ? prev.journal : DEFAULT_SITE_SECTIONS.journal)];
      if (next[idx]) {
        next[idx] = { ...next[idx]!, [field]: val };
      }
      return { ...prev, journal: next };
    });
  };

  const selectedArt0 = availableArticles.find(
    (a) =>
      a.title === journal[0]?.title ||
      (journal[0]?.href && journal[0].href.endsWith(`/${a.slug}`))
  );
  const selectedArt1 = availableArticles.find(
    (a) =>
      a.title === journal[1]?.title ||
      (journal[1]?.href && journal[1].href.endsWith(`/${a.slug}`))
  );

  const handleSaveAll = () => {
    const next: SiteSectionsConfig = {
      ...sections,
      hero,
      closerLook: sections.closerLook || closerLook,
      spotlightIntro,
      spotlight,
      narrative,
      journalHeader,
      journal,
    };
    setSections(next);
    saveSiteSections(next);
    showToast('Semua teks & foto Beranda berhasil disimpan ke cloud!');
  };

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1560px] space-y-4 pb-20">
      {/* â”€â”€ HEADER TITLE & ACTION â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase">
            Visual Page Editor
          </span>
          <h2 className="text-base sm:text-xl font-bold tracking-tight text-black">
            Edit Halaman Beranda (Homepage)
          </h2>
          <p className="text-[11px] text-black/60 mt-0.5">
            Layout editor ini mengalir persis dari atas ke bawah sesuai urutan tampilan beranda toko Anda.
          </p>
        </div>


      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* SECTION 1: HERO SECTION (BANNER UTAMA) */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/40 uppercase">
              Bagian 1 â€¢ Atas
            </span>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Hero Banner Utama
            </h3>
            <p className="text-[11px] text-black/60 mt-0.5">
              Banner visual utama toko: foto latar, tagline atas, dan 2 tombol CTA (Shop & Lookbook). Didesain minimalis mewah tanpa paragraf teks panjang.
            </p>
          </div>
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-semibold text-black/60 border border-black/10 shrink-0">
            Layar Penuh
          </span>
        </div>

                {/* Hero Photo Preview (Desktop & Mobile Responsive) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          {/* Desktop Hero (16:9 / Landscape) */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-bold tracking-wider text-black/80 uppercase flex items-center gap-1.5">
                  <span>🖥️</span> Foto Hero Desktop
                </label>
                <p className="text-[10px] text-black/50">Rasio 16:9 • Tampil di Layar Laptop / PC</p>
              </div>
              <UploadActionGroup target="hero" label="Pilih Galeri" currentImage={hero.image} uploadingTarget={uploadingTarget} onDirectUpload={resolvedDirectUpload} onOpenImagePicker={onOpenImagePicker} />
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5 shadow-inner">
              <Image
                src={hero.image?.trim() || '/images/hero_optimized.jpg'}
                alt="Hero Desktop Preview"
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                <span className="text-[9px] tracking-widest uppercase opacity-90">
                  {hero.badge || 'TIMELESS • INTENTIONAL • EFFORTLESS'}
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="rounded bg-white text-black px-2 py-0.5 text-[9px] font-semibold uppercase">
                    {hero.ctaShop || 'Shop The Collection'}
                  </span>
                  <span className="rounded border border-white text-white px-2 py-0.5 text-[9px] font-semibold uppercase">
                    {hero.ctaLookbook || 'Lookbook'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Hero (9:16 / Portrait) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-bold tracking-wider text-black/80 uppercase flex items-center gap-1.5">
                  <span>📱</span> Foto Hero Mobile
                </label>
                <p className="text-[10px] text-black/50">Rasio 9:16 • Tampil di Layar Smartphone</p>
              </div>
              <UploadActionGroup target="hero-mobile" label="Pilih Galeri" currentImage={hero.mobileImage || hero.image} uploadingTarget={uploadingTarget} onDirectUpload={resolvedDirectUpload} onOpenImagePicker={onOpenImagePicker} />
            </div>

            <div className="relative mx-auto aspect-[9/16] max-h-[300px] w-full max-w-[180px] overflow-hidden rounded-xl border-2 border-black/20 bg-black/5 shadow-md">
              <Image
                src={hero.mobileImage?.trim() || hero.image?.trim() || '/images/hero_optimized.jpg'}
                alt="Hero Mobile Preview"
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-3 text-white text-center">
                <span className="text-[8px] tracking-widest uppercase opacity-90 leading-tight">
                  {hero.badge || 'TIMELESS • INTENTIONAL • EFFORTLESS'}
                </span>
                <div className="mt-1.5 flex flex-col gap-1">
                  <span className="rounded bg-white text-black py-0.5 text-[8px] font-semibold uppercase">
                    {hero.ctaShop || 'Shop'}
                  </span>
                </div>
              </div>
              {!hero.mobileImage && (
                <div className="absolute top-2 left-2 right-2 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded text-center backdrop-blur-xs">
                  Mengikuti Desktop
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Tagline Hero (Teks Kecil di Atas Tombol)
            </label>
            <input
              type="text"
              value={hero.badge}
              onChange={(e) => updateHeroField('badge', e.target.value)}
              placeholder="Contoh: TIMELESS â€¢ INTENTIONAL â€¢ EFFORTLESS"
              className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Tombol Kiri (Teks)
            </label>
            <input
              type="text"
              value={hero.ctaShop}
              onChange={(e) => updateHeroField('ctaShop', e.target.value)}
              placeholder="Shop The Collection"
              className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Tombol Kanan (Teks)
            </label>
            <input
              type="text"
              value={hero.ctaLookbook}
              onChange={(e) => updateHeroField('ctaLookbook', e.target.value)}
              placeholder="Lookbook"
              className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* SECTION: A CLOSER LOOK AT (VOL 1: SEVILLA ABAYA) */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/10 pb-3 gap-2">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/40 uppercase">
              Bagian Eksklusif â€¢ Editorial Collection
            </span>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              A Closer Look At (Vol 1: Sevilla Abaya)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-semibold text-black/60 border border-black/10">
              Foto Kiri + Cerita Kanan
            </span>
            <button
              type="button"
              onClick={() => {
                const next: SiteSectionsConfig = {
                  ...sections,
                  closerLook: sections.closerLook || closerLook,
                };
                setSections(next);
                saveSiteSections(next);
                showToast('âœ“ Data Closer Look berhasil disimpan ke cloud!');
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-[10px] font-semibold text-white uppercase tracking-wider hover:bg-black/85 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <Icon name="check" size={12} />
              <span>Simpan Closer Look</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Foto Banner Kiri */}
          <div className="flex flex-col gap-2 rounded-xl border border-black/15 bg-black/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-widest text-black/60 uppercase">
                Foto Koleksi (Cloud)
              </span>
              <UploadActionGroup target="closer-look" label="Pilih Foto" currentImage={closerLook?.image} uploadingTarget={uploadingTarget} onDirectUpload={resolvedDirectUpload} onOpenImagePicker={onOpenImagePicker} />
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-black/15 bg-white">
              <Image
                src={closerLook?.image || DEFAULT_CLOSER_LOOK.image || '/images/lookbook_figma_0.png'}
                alt="Closer Look Collection"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <p className="text-[10px] text-black/50">
              Dapat diganti kapan saja dari Galeri Cloud atau unggah foto baru dari laptop/HP.
            </p>
          </div>

          {/* Form Teks Narasi Kanan */}
          <div className="md:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                  Sub-Judul Kecil (Eyebrow)
                </label>
                <input
                  type="text"
                  value={closerLook.eyebrow || ''}
                  onChange={(e) => updateCloserLookField('eyebrow', e.target.value)}
                  placeholder="A CLOSER LOOK AT"
                  className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                  Judul Koleksi
                </label>
                <input
                  type="text"
                  value={closerLook.title || ''}
                  onChange={(e) => updateCloserLookField('title', e.target.value)}
                  placeholder="VOL 1: SEVILLA ABAYA"
                  className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                Paragraf Cerita #1
              </label>
              <textarea
                rows={3}
                value={closerLook.paragraph1 || ''}
                onChange={(e) => updateCloserLookField('paragraph1', e.target.value)}
                placeholder="In Indonesia, particularly between June and August..."
                className="w-full rounded border border-black/20 bg-white p-2.5 text-xs leading-relaxed text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                Paragraf Cerita #2
              </label>
              <textarea
                rows={3}
                value={closerLook.paragraph2 || ''}
                onChange={(e) => updateCloserLookField('paragraph2', e.target.value)}
                placeholder="Through Vol. 1: Sevilla Abaya, SEVAYA reflects on gentle, mindful growth..."
                className="w-full rounded border border-black/20 bg-white p-2.5 text-xs leading-relaxed text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                  Teks Tombol / Link
                </label>
                <input
                  type="text"
                  value={closerLook.linkText || ''}
                  onChange={(e) => updateCloserLookField('linkText', e.target.value)}
                  placeholder="Read More"
                  className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                  Target Link (Halaman Lookbook)
                </label>
                <input
                  type="text"
                  value={closerLook.linkUrl || ''}
                  onChange={(e) => updateCloserLookField('linkUrl', e.target.value)}
                  placeholder="/lookbook"
                  className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  const next: SiteSectionsConfig = {
                    ...sections,
                    closerLook: sections.closerLook || closerLook,
                  };
                  setSections(next);
                  saveSiteSections(next);
                  showToast('âœ“ Data Closer Look berhasil disimpan ke cloud!');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white tracking-wider hover:bg-black/85 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <Icon name="check" size={14} />
                <span>Simpan Closer Look</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* SECTION 2: CATEGORY SPOTLIGHT (2 KARTU MENYAMPING) */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/40 uppercase">
              Bagian 2 â€¢ Sorotan
            </span>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Category Spotlight (2 Kolom Menyamping)
            </h3>
          </div>
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-semibold text-black/60 border border-black/10">
            2 Kolom Berdampingan
          </span>
        </div>

        {/* Intro Subtext */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
            Paragraf Pengantar Sorotan Kategori
          </label>
          <textarea
            rows={2}
            value={spotlightIntro}
            onChange={(e) =>
              setSections((prev) => ({ ...prev, spotlightIntro: e.target.value }))
            }
            placeholder="Discover modestwear designed for women who embrace their faith..."
            className="w-full rounded border border-black/20 bg-white p-2.5 text-xs leading-relaxed text-black focus:border-black focus:outline-none"
          />
        </div>

        {/* 2 Cards Side-by-Side */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Card 1: Abaya */}
          <div className="flex flex-col gap-2 rounded-xl border border-black/15 bg-black/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-widest text-black/60 uppercase">
                Kolom Kiri #1
              </span>
              <UploadActionGroup target="spotlight-0" label="Pilih" currentImage={spotlight[0]?.image} uploadingTarget={uploadingTarget} onDirectUpload={resolvedDirectUpload} onOpenImagePicker={onOpenImagePicker} />
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-black/15 bg-white">
              <Image
                src={spotlight[0]?.image || '/images/figma_abaya_banner.png'}
                alt="Spotlight 1"
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white uppercase">
                {spotlight[0]?.title || 'ABAYA'}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <input
                type="text"
                value={spotlight[0]?.title || ''}
                onChange={(e) => updateSpotlightItem(0, 'title', e.target.value)}
                placeholder="Judul (misal: ABAYA)"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs text-black focus:border-black focus:outline-none"
              />
              <input
                type="text"
                value={spotlight[0]?.href || ''}
                onChange={(e) => updateSpotlightItem(0, 'href', e.target.value)}
                placeholder="Link Target (/shop?category=abaya)"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-[11px] text-black/80 focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Card 2: Khimar */}
          <div className="flex flex-col gap-2 rounded-xl border border-black/15 bg-black/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-widest text-black/60 uppercase">
                Kolom Kanan #2
              </span>
              <UploadActionGroup target="spotlight-1" label="Pilih" currentImage={spotlight[1]?.image} uploadingTarget={uploadingTarget} onDirectUpload={resolvedDirectUpload} onOpenImagePicker={onOpenImagePicker} />
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-black/15 bg-white">
              <Image
                src={spotlight[1]?.image || '/images/khiban-banner-v2.jpg'}
                alt="Spotlight 2"
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white uppercase">
                {spotlight[1]?.title || 'KHIMAR'}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <input
                type="text"
                value={spotlight[1]?.title || ''}
                onChange={(e) => updateSpotlightItem(1, 'title', e.target.value)}
                placeholder="Judul (misal: KHIMAR)"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs text-black focus:border-black focus:outline-none"
              />
              <input
                type="text"
                value={spotlight[1]?.href || ''}
                onChange={(e) => updateSpotlightItem(1, 'href', e.target.value)}
                placeholder="Link Target (/shop?category=khimar)"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-[11px] text-black/80 focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* SECTION 3: NARRATIVE (ELEGANCE IN SIMPLICITY) */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/40 uppercase">
              Bagian 3 â€¢ Filosofi
            </span>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Narasi Filosofi (Elegance in Simplicity)
            </h3>
          </div>
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-semibold text-black/60 border border-black/10">
            Teks Editorial
          </span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Judul Narasi
            </label>
            <input
              type="text"
              value={narrative.eleganceTitle}
              onChange={(e) => updateNarrativeField('eleganceTitle', e.target.value)}
              placeholder="Elegance in Simplicity"
              className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Paragraf Filosofi
            </label>
            <textarea
              rows={3}
              value={narrative.eleganceParagraph}
              onChange={(e) => updateNarrativeField('eleganceParagraph', e.target.value)}
              placeholder="Opting for quality over quantity means selecting timeless..."
              className="w-full rounded border border-black/20 bg-white p-2.5 text-xs leading-relaxed text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Teks Highlight Penutup (Cetak Tebal)
            </label>
            <input
              type="text"
              value={narrative.eleganceHighlight}
              onChange={(e) => updateNarrativeField('eleganceHighlight', e.target.value)}
              placeholder="The Art of Fewer, Better Choices"
              className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                Teks Tombol Link
              </label>
              <input
                type="text"
                value={narrative.eleganceLinkText}
                onChange={(e) => updateNarrativeField('eleganceLinkText', e.target.value)}
                placeholder="Read more"
                className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                URL Target Link
              </label>
              <input
                type="text"
                value={narrative.eleganceLinkUrl}
                onChange={(e) => updateNarrativeField('eleganceLinkUrl', e.target.value)}
                placeholder="/conscious"
                className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* SECTION 4: CINEMATIC VIDEO SHOWCASE */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/40 uppercase">
              Bagian 4 â€¢ Video
            </span>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Cinematic Video Player Showcase
            </h3>
          </div>
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-semibold text-black/60 border border-black/10">
            Cinematic Screen
          </span>
        </div>

        <div className="space-y-3">
          {/* Poster Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                Cover Poster Video (Sebelum Dimainkan)
              </label>
              <UploadActionGroup target="home-video-poster" label="Pilih Galeri" currentImage={narrative.videoPoster} uploadingTarget={uploadingTarget} onDirectUpload={resolvedDirectUpload} onOpenImagePicker={onOpenImagePicker} />
            </div>

            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-xl border border-black/15 bg-black">
              <Image
                src={narrative.videoPoster || '/images/kani_poster.webp'}
                alt="Video Cover"
                fill
                unoptimized
                className="object-cover opacity-90"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white/20 p-3 backdrop-blur-xs">
                  <Icon name="play" size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              URL Berkas Video MP4
            </label>
            <input
              type="text"
              value={narrative.videoSrc}
              onChange={(e) => updateNarrativeField('videoSrc', e.target.value)}
              placeholder="/videos/kani.mp4 atau URL video hosting eksternal"
              className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
            <p className="text-[10px] text-black/50">
              Mendukung path lokal di folder public (misal: /videos/kani.mp4) atau URL streaming CDN.
            </p>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* SECTION 5: BRAND PILLARS (OUR CORE VALUES - 3 MENYAMPING) */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/40 uppercase">
              Bagian 5 â€¢ Nilai Inti
            </span>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Brand Pillars (3 Pilar Menyamping)
            </h3>
          </div>
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-semibold text-black/60 border border-black/10">
            3 Kolom Berdampingan
          </span>
        </div>

        {/* Section Headers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Subtitle Tagline
            </label>
            <input
              type="text"
              value={narrative.pillarsTagline}
              onChange={(e) => updateNarrativeField('pillarsTagline', e.target.value)}
              placeholder="OUR CORE VALUES"
              className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Judul Seksi
            </label>
            <input
              type="text"
              value={narrative.pillarsTitle}
              onChange={(e) => updateNarrativeField('pillarsTitle', e.target.value)}
              placeholder="Brand Pillars"
              className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>
        </div>

        {/* 3 Pillars Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Pillar 1 */}
          <div className="flex flex-col gap-2 rounded-xl border border-black/15 bg-black/5 p-3.5">
            <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
              <span className="text-[9px] font-bold tracking-widest text-black/50">PILAR 01</span>
              <span className="rounded bg-black/10 px-1.5 py-0.2 text-[8px] font-semibold text-black">01</span>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Judul</label>
              <input
                type="text"
                value={narrative.pillar1Title}
                onChange={(e) => updateNarrativeField('pillar1Title', e.target.value)}
                placeholder="Timeless"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Deskripsi</label>
              <textarea
                rows={3}
                value={narrative.pillar1Desc}
                onChange={(e) => updateNarrativeField('pillar1Desc', e.target.value)}
                placeholder="Designed beyond fleeting trends..."
                className="w-full rounded border border-black/20 bg-white p-2 text-xs text-black focus:border-black focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="flex flex-col gap-2 rounded-xl border border-black/15 bg-black/5 p-3.5">
            <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
              <span className="text-[9px] font-bold tracking-widest text-black/50">PILAR 02</span>
              <span className="rounded bg-black/10 px-1.5 py-0.2 text-[8px] font-semibold text-black">02</span>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Judul</label>
              <input
                type="text"
                value={narrative.pillar2Title}
                onChange={(e) => updateNarrativeField('pillar2Title', e.target.value)}
                placeholder="Intentional"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Deskripsi</label>
              <textarea
                rows={3}
                value={narrative.pillar2Desc}
                onChange={(e) => updateNarrativeField('pillar2Desc', e.target.value)}
                placeholder="From fabric selection to details..."
                className="w-full rounded border border-black/20 bg-white p-2 text-xs text-black focus:border-black focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="flex flex-col gap-2 rounded-xl border border-black/15 bg-black/5 p-3.5">
            <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
              <span className="text-[9px] font-bold tracking-widest text-black/50">PILAR 03</span>
              <span className="rounded bg-black/10 px-1.5 py-0.2 text-[8px] font-semibold text-black">03</span>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Judul</label>
              <input
                type="text"
                value={narrative.pillar3Title}
                onChange={(e) => updateNarrativeField('pillar3Title', e.target.value)}
                placeholder="Effortless"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Deskripsi</label>
              <textarea
                rows={3}
                value={narrative.pillar3Desc}
                onChange={(e) => updateNarrativeField('pillar3Desc', e.target.value)}
                placeholder="Modest silhouettes made for ease..."
                className="w-full rounded border border-black/20 bg-white p-2 text-xs text-black focus:border-black focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* SECTION 6: ABOUT SEVAYA (2 FOTO MENYAMPING & CERITA) */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/40 uppercase">
              Bagian 6 â€¢ Tentang Brand
            </span>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              About SEVAYA (2 Foto Menyamping & Cerita)
            </h3>
          </div>
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-semibold text-black/60 border border-black/10">
            Foto & Filosofi
          </span>
        </div>

        {/* 2 Photos Side-by-Side */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
            2 Foto Editorial Berdampingan
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Photo 1 */}
            <div className="flex flex-col gap-2 rounded-xl border border-black/15 bg-black/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-widest text-black/50">FOTO #1 (KIRI)</span>
                <UploadActionGroup target="home-about-1" label="Pilih" currentImage={narrative.aboutImage1} uploadingTarget={uploadingTarget} onDirectUpload={resolvedDirectUpload} onOpenImagePicker={onOpenImagePicker} />
              </div>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-black/15 bg-white">
                <Image
                  src={narrative.aboutImage1 || '/images/figma_about_1.png'}
                  alt="About Foto 1"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>

            {/* Photo 2 */}
            <div className="flex flex-col gap-2 rounded-xl border border-black/15 bg-black/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-widest text-black/50">FOTO #2 (KANAN)</span>
                <UploadActionGroup target="home-about-2" label="Pilih" currentImage={narrative.aboutImage2} uploadingTarget={uploadingTarget} onDirectUpload={resolvedDirectUpload} onOpenImagePicker={onOpenImagePicker} />
              </div>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-black/15 bg-white">
                <Image
                  src={narrative.aboutImage2 || '/images/figma_about_2.png'}
                  alt="About Foto 2"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Inputs */}
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Tagline Judul
            </label>
            <input
              type="text"
              value={narrative.aboutTagline}
              onChange={(e) => updateNarrativeField('aboutTagline', e.target.value)}
              placeholder="ABOUT SEVAYA"
              className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              Paragraf Cerita Filosofi
            </label>
            <textarea
              rows={3}
              value={narrative.aboutDesc}
              onChange={(e) => updateNarrativeField('aboutDesc', e.target.value)}
              placeholder="Rooted in simplicity, SEVAYA redefines modern modestwear..."
              className="w-full rounded border border-black/20 bg-white p-2.5 text-xs leading-relaxed text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                Teks Tombol Link
              </label>
              <input
                type="text"
                value={narrative.aboutLinkText}
                onChange={(e) => updateNarrativeField('aboutLinkText', e.target.value)}
                placeholder="Read more"
                className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                URL Target Link
              </label>
              <input
                type="text"
                value={narrative.aboutLinkUrl}
                onChange={(e) => updateNarrativeField('aboutLinkUrl', e.target.value)}
                placeholder="/conscious"
                className="w-full rounded border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* SECTION 7: JOURNAL & READING CORNER (2 ARTIKEL MENYAMPING) */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/40 uppercase">
              Bagian 7 â€¢ Jurnal
            </span>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Our Reading Corner (Jurnal Beranda)
            </h3>
          </div>
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-semibold text-black/60 border border-black/10">
            2 Card Berdampingan
          </span>
        </div>

        {/* Section Header Inputs (Left & Right Column) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-black/10 bg-black/5 p-3.5">
          {/* Header Left: Manifesto */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase">
              Header Kiri â€¢ Studio Manifesto
            </span>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Tagline</label>
              <input
                type="text"
                value={journalHeader.manifestoTag}
                onChange={(e) => updateJournalHeaderField('manifestoTag', e.target.value)}
                placeholder="Philosophy â€¢ Studio Manifesto"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Judul</label>
              <input
                type="text"
                value={journalHeader.manifestoTitle}
                onChange={(e) => updateJournalHeaderField('manifestoTitle', e.target.value)}
                placeholder="The Art of Fewer, Better Choices"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Deskripsi</label>
              <textarea
                rows={2}
                value={journalHeader.manifestoDesc}
                onChange={(e) => updateJournalHeaderField('manifestoDesc', e.target.value)}
                placeholder="Opting for quality over quantity..."
                className="w-full rounded border border-black/20 bg-white p-2 text-xs text-black focus:border-black focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Header Right: Reading Corner */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase">
              Header Kanan â€¢ Reading Corner
            </span>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Badge Atas</label>
              <input
                type="text"
                value={journalHeader.journalBadge}
                onChange={(e) => updateJournalHeaderField('journalBadge', e.target.value)}
                placeholder="EDITORIAL JOURNAL"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-black/60 uppercase">Judul Utama</label>
              <input
                type="text"
                value={journalHeader.journalTitle}
                onChange={(e) => updateJournalHeaderField('journalTitle', e.target.value)}
                placeholder="OUR READING CORNER"
                className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black/60 uppercase">Teks Tautan</label>
                <input
                  type="text"
                  value={journalHeader.journalLinkText}
                  onChange={(e) => updateJournalHeaderField('journalLinkText', e.target.value)}
                  placeholder="Explore All Stories"
                  className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black/60 uppercase">URL Tautan</label>
                <input
                  type="text"
                  value={journalHeader.journalLinkUrl}
                  onChange={(e) => updateJournalHeaderField('journalLinkUrl', e.target.value)}
                  placeholder="/news"
                  className="w-full rounded border border-black/20 bg-white px-2 py-1 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2 Articles Side-by-Side (Menyamping) */}
        <div className="space-y-3 pt-1">
          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 text-xs text-black/70 flex items-start gap-2.5">
            <span className="text-sm shrink-0">ðŸ’¡</span>
            <p className="text-[11px] leading-relaxed">
              <strong>Pilih Artikel yang Ditampilkan:</strong> Di bagian ini Anda cukup memilih artikel mana dari daftar berita/jurnal yang ingin dipajang pada 2 slot kartu di Beranda. Judul, tanggal, ringkasan, foto, dan tautan akan terhubung otomatis. Untuk menulis artikel baru atau mengedit isi lengkapnya, silakan buka tab <strong>News / Jurnal</strong>.
            </p>
          </div>

          <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase block">
            2 Slot Kartu Artikel (Tampil Berdampingan di Beranda Toko)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Article Slot 1 */}
            <div className="flex flex-col gap-3 rounded-xl border border-black/15 bg-black/[0.03] p-3.5">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <span className="text-[10px] font-bold tracking-widest text-black/70 uppercase">
                  SLOT ARTIKEL #1 (KIRI)
                </span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedArt0 ? 'âœ“ Terhubung ke Jurnal' : 'Belum Dipilih'}
                </span>
              </div>

              {/* Selector dari News */}
              <div className="space-y-1.5 bg-white p-3 rounded-lg border border-black/15 shadow-2xs">
                <label className="text-[10px] font-bold text-black uppercase block">
                  Pilih Artikel untuk Ditampilkan:
                </label>
                <select
                  value={selectedArt0?.id || ''}
                  onChange={(e) => handleSelectArticleForSlot(0, e.target.value)}
                  className="w-full rounded-md border border-black/25 bg-white px-2.5 py-1.5 text-xs text-black font-medium focus:border-black focus:outline-none"
                >
                  <option value="">-- Pilih Artikel dari Database News --</option>
                  {availableArticles.map((art) => (
                    <option key={art.id} value={art.id}>
                      [{art.category}] {art.title} ({art.date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Read-Only Live Preview Card (Terhubung langsung ke artikel) */}
              <div className="space-y-2 bg-white p-3 rounded-lg border border-black/15 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-black/50 uppercase tracking-wider">
                    Preview Tampilan di Beranda:
                  </span>
                  <span className="text-[8.5px] font-medium text-black/40 italic">
                    Read-only (sinkron otomatis)
                  </span>
                </div>

                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-black/10 bg-black/5">
                  <Image
                    src={journal[0]?.image || '/images/catalog/catalog-11.jpg'}
                    alt={journal[0]?.title || 'Artikel 1'}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
                    {journal[0]?.date || 'Tanggal & Kategori'}
                  </span>
                  <h4 className="text-xs font-bold text-black leading-snug line-clamp-2">
                    {journal[0]?.title || 'Pilih artikel di atas...'}
                  </h4>
                  <p className="text-[11px] text-black/60 leading-relaxed line-clamp-3">
                    {journal[0]?.excerpt || 'Ringkasan artikel akan tampil di sini...'}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-black/10 text-[10px] text-black/40 font-mono">
                    <span className="truncate">Tautan: {journal[0]?.href || '/news'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Slot 2 */}
            <div className="flex flex-col gap-3 rounded-xl border border-black/15 bg-black/[0.03] p-3.5">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <span className="text-[10px] font-bold tracking-widest text-black/70 uppercase">
                  SLOT ARTIKEL #2 (KANAN)
                </span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedArt1 ? 'âœ“ Terhubung ke Jurnal' : 'Belum Dipilih'}
                </span>
              </div>

              {/* Selector dari News */}
              <div className="space-y-1.5 bg-white p-3 rounded-lg border border-black/15 shadow-2xs">
                <label className="text-[10px] font-bold text-black uppercase block">
                  Pilih Artikel untuk Ditampilkan:
                </label>
                <select
                  value={selectedArt1?.id || ''}
                  onChange={(e) => handleSelectArticleForSlot(1, e.target.value)}
                  className="w-full rounded-md border border-black/25 bg-white px-2.5 py-1.5 text-xs text-black font-medium focus:border-black focus:outline-none"
                >
                  <option value="">-- Pilih Artikel dari Database News --</option>
                  {availableArticles.map((art) => (
                    <option key={art.id} value={art.id}>
                      [{art.category}] {art.title} ({art.date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Read-Only Live Preview Card (Terhubung langsung ke artikel) */}
              <div className="space-y-2 bg-white p-3 rounded-lg border border-black/15 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-black/50 uppercase tracking-wider">
                    Preview Tampilan di Beranda:
                  </span>
                  <span className="text-[8.5px] font-medium text-black/40 italic">
                    Read-only (sinkron otomatis)
                  </span>
                </div>

                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-black/10 bg-black/5">
                  <Image
                    src={journal[1]?.image || '/images/catalog/catalog-12.jpg'}
                    alt={journal[1]?.title || 'Artikel 2'}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
                    {journal[1]?.date || 'Tanggal & Kategori'}
                  </span>
                  <h4 className="text-xs font-bold text-black leading-snug line-clamp-2">
                    {journal[1]?.title || 'Pilih artikel di atas...'}
                  </h4>
                  <p className="text-[11px] text-black/60 leading-relaxed line-clamp-3">
                    {journal[1]?.excerpt || 'Ringkasan artikel akan tampil di sini...'}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-black/10 text-[10px] text-black/40 font-mono">
                    <span className="truncate">Tautan: {journal[1]?.href || '/news'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ BOTTOM STICKY SAVE BAR â”€â”€ */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-black/20 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[11px] font-medium text-black/70 hidden sm:block">
            Semua perubahan beranda dapat disimpan langsung ke server cloud database.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[11px] font-semibold tracking-wider text-white uppercase shadow-sm transition hover:bg-black/85 active:scale-95"
        >
          <Icon name="check" size={14} />
          <span>Simpan Semua Perubahan Beranda</span>
        </button>
      </div>
    </div>
  );
};
