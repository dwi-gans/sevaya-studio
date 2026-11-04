import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import {
  SiteSectionsConfig,
  DEFAULT_SITE_SECTIONS,
  saveSiteSections,
  LookbookPageConfig,
} from '@/integrations/supabase';
import type { ImagePickerTarget } from '../adminTypes';

interface LookbookTabProps {
  sections: SiteSectionsConfig;
  setSections: React.Dispatch<React.SetStateAction<SiteSectionsConfig>>;
  selectedLookbookVolId: string;
  setSelectedLookbookVolId: (id: string) => void;
  onOpenImagePicker: (target: ImagePickerTarget) => void;
  showToast: (msg: string) => void;
}

export const LookbookTab: React.FC<LookbookTabProps> = ({
  sections,
  setSections,
  selectedLookbookVolId,
  setSelectedLookbookVolId,
  onOpenImagePicker,
  showToast,
}) => {
  const activeVolConfig: LookbookPageConfig =
    sections.lookbookVolumesConfig?.[selectedLookbookVolId] ||
    sections.lookbookPage ||
    DEFAULT_SITE_SECTIONS.lookbookPage!;

  const currentLinks =
    sections.lookbookLinks && sections.lookbookLinks.length > 0
      ? sections.lookbookLinks
      : [
          {
            id: 'vol-1',
            label: 'Vol 1: Sevilla Abaya',
            season: "'26",
            href: '/lookbook',
            badge: 'NEW',
          },
        ];

  const activeVolIndex = currentLinks.findIndex(
    (l) => l.id === selectedLookbookVolId || l.href.includes(selectedLookbookVolId),
  );
  const activeLink = activeVolIndex >= 0 ? currentLinks[activeVolIndex] : currentLinks[0];
  const activeVolLabel = activeLink?.label || selectedLookbookVolId.toUpperCase();

  const updateVolField = (key: keyof LookbookPageConfig, value: string) => {
    const updatedConfig = { ...activeVolConfig, [key]: value };
    const next: SiteSectionsConfig = {
      ...sections,
      lookbookVolumesConfig: {
        ...(sections.lookbookVolumesConfig || {}),
        [selectedLookbookVolId]: updatedConfig,
      },
      lookbookPage: selectedLookbookVolId === 'vol-1' ? updatedConfig : sections.lookbookPage,
    };
    setSections(next);
  };

  const handleSaveAll = () => {
    const next: SiteSectionsConfig = {
      ...sections,
      lookbookLinks: currentLinks,
      lookbookVolumesConfig: {
        ...(sections.lookbookVolumesConfig || {}),
        [selectedLookbookVolId]: activeVolConfig,
      },
      lookbookPage: selectedLookbookVolId === 'vol-1' ? activeVolConfig : sections.lookbookPage,
    };
    setSections(next);
    saveSiteSections(next);
    showToast('Semua teks & foto Lookbook berhasil disimpan ke cloud!');
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* ── HEADER TITLE & ACTION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase">
            Visual Page Editor
          </span>
          <h2 className="text-base sm:text-xl font-bold tracking-tight text-black">
            Edit Halaman Lookbook ({activeVolLabel})
          </h2>
          <p className="text-[11px] text-black/60 mt-0.5">
            Format pengeditan tersusun persis sesuai urutan tampilan Lookbook. Teks &amp; foto langsung dapat diedit.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-black/85 active:scale-95 shrink-0"
        >
          <Icon name="check" size={15} />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {/* ══ STEP 1: PEMILIHAN VOLUME LOOKBOOK ══ */}
      <div className="rounded-xl border border-black/15 bg-white p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
            Volume Terpilih
          </span>
          <span className="text-[10px] font-mono text-black/40">
            ID: {selectedLookbookVolId}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentLinks.map((vol) => {
            const volKey = vol.id || (vol.href === '/lookbook' ? 'vol-1' : vol.href.replace('/lookbook/', ''));
            const isSelected = selectedLookbookVolId === volKey;
            return (
              <button
                key={volKey}
                type="button"
                onClick={() => setSelectedLookbookVolId(volKey)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-black text-white shadow-xs'
                    : 'border border-black/20 bg-white text-black hover:border-black'
                }`}
              >
                {vol.label} {vol.badge ? `(${vol.badge})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          VISUAL LOOKBOOK EDITOR (MIRRORS USER LOOKBOOK PAGE EXACTLY)
         ═══════════════════════════════════════════════════════════════════ */}

      {/* ── SECTION 1: CAMPAIGN HEADER ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            1. Campaign Hero Header
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            Teks Pembuka
          </span>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Subtitle (Tag Kecil Atas)
            </label>
            <input
              type="text"
              value={activeVolConfig.heroSubtitle || ''}
              onChange={(e) => updateVolField('heroSubtitle', e.target.value)}
              placeholder="e.g. SEVAYA • SEVILLA"
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs font-medium text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Judul Utama Lookbook
            </label>
            <input
              type="text"
              value={activeVolConfig.heroTitle || ''}
              onChange={(e) => updateVolField('heroTitle', e.target.value)}
              placeholder="e.g. SEVILLA ABAYA"
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-sm font-bold tracking-wider text-black focus:border-black focus:bg-white focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Deskripsi Pengantar
            </label>
            <textarea
              rows={3}
              value={activeVolConfig.seasonDesc || ''}
              onChange={(e) => updateVolField('seasonDesc', e.target.value)}
              placeholder="Sevilla Abaya An everyday expression of quiet elegance..."
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs leading-relaxed text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: FOTO HERO UTAMA ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            2. Foto Hero Utama (SEVAYA Floraison Campaign Hero)
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            Format 4:5
          </span>
        </div>

        <div className="max-w-md mx-auto space-y-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
            <Image
              src={activeVolConfig.heroImage || '/images/sevaya_first_chapter.jpg'}
              alt="Campaign Hero"
              fill
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => onOpenImagePicker('lbpage-heroImage')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/20 bg-white py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95"
          >
            <Icon name="image" size={14} />
            <span>Ganti Foto Hero Utama</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 3: THE SEED OF THE STORY (DETAIL SPESIFIKASI DENGAN 3 POIN) ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            3. The Seed of The Story (Poin Keunggulan Desain)
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            3 Poin Fitur
          </span>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Judul Bagian
            </label>
            <input
              type="text"
              value={activeVolConfig.seasonTitle || ''}
              onChange={(e) => updateVolField('seasonTitle', e.target.value)}
              placeholder="e.g. The Seed of The Story"
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs font-bold text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          {/* Poin 1 */}
          <div className="rounded-lg border border-black/10 bg-[#FAFAFA] p-3 space-y-2">
            <label className="text-[10px] font-bold text-black uppercase">Poin 1</label>
            <input
              type="text"
              value={activeVolConfig.purpose1Title || ''}
              onChange={(e) => updateVolField('purpose1Title', e.target.value)}
              placeholder="Judul Poin (e.g. Two looks in one)"
              className="w-full rounded border border-black/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
            />
            <textarea
              rows={2}
              value={activeVolConfig.purpose1Desc || ''}
              onChange={(e) => updateVolField('purpose1Desc', e.target.value)}
              placeholder="Deskripsi Poin (e.g. A beautiful abstract button detail...)"
              className="w-full rounded border border-black/15 bg-white px-2.5 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          {/* Poin 2 */}
          <div className="rounded-lg border border-black/10 bg-[#FAFAFA] p-3 space-y-2">
            <label className="text-[10px] font-bold text-black uppercase">Poin 2</label>
            <input
              type="text"
              value={activeVolConfig.purpose2Title || ''}
              onChange={(e) => updateVolField('purpose2Title', e.target.value)}
              placeholder="Judul Poin (e.g. 40 cm front zipper)"
              className="w-full rounded border border-black/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
            />
            <textarea
              rows={2}
              value={activeVolConfig.purpose2Desc || ''}
              onChange={(e) => updateVolField('purpose2Desc', e.target.value)}
              placeholder="Deskripsi Poin (e.g. Designed for extra convenience...)"
              className="w-full rounded border border-black/15 bg-white px-2.5 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          {/* Poin 3 */}
          <div className="rounded-lg border border-black/10 bg-[#FAFAFA] p-3 space-y-2">
            <label className="text-[10px] font-bold text-black uppercase">Poin 3</label>
            <input
              type="text"
              value={activeVolConfig.purpose3Title || ''}
              onChange={(e) => updateVolField('purpose3Title', e.target.value)}
              placeholder="Judul Poin (e.g. Two side pockets)"
              className="w-full rounded border border-black/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
            />
            <textarea
              rows={2}
              value={activeVolConfig.purpose3Desc || ''}
              onChange={(e) => updateVolField('purpose3Desc', e.target.value)}
              placeholder="Deskripsi Poin (e.g. Functional pockets on both sides...)"
              className="w-full rounded border border-black/15 bg-white px-2.5 py-1.5 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 4: 2 KOLASE FOTO MENYAMPING (2 COLUMNS) ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            4. 2 Kolase Menyamping (Botanical Silhouette &amp; Textile Flow)
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            2 Kolom Bersebelahan
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Kolase Kiri */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-black/70 uppercase block truncate">
              Kolase Kiri (Silhouette)
            </span>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
              <Image
                src={activeVolConfig.collagePortrait || '/images/lookbook_figma_0.png'}
                alt="Kolase Kiri"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('lbpage-collagePortrait')}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-[11px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95"
            >
              <Icon name="image" size={13} />
              <span>Ganti Foto Kiri</span>
            </button>
          </div>

          {/* Kolase Kanan */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-black/70 uppercase block truncate">
              Kolase Kanan (Textile Flow)
            </span>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
              <Image
                src={activeVolConfig.collageDetail1 || '/images/figma_about_1.png'}
                alt="Kolase Kanan"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('lbpage-collageDetail1')}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-[11px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95"
            >
              <Icon name="image" size={13} />
              <span>Ganti Foto Kanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: FABRIC STORY (TEKS) ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            5. Teks Cerita Bahan (Fabric Story)
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            Cerita Tekstil
          </span>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Judul Bagian
            </label>
            <input
              type="text"
              value={activeVolConfig.panorama1Title || ''}
              onChange={(e) => updateVolField('panorama1Title', e.target.value)}
              placeholder="e.g. Fabric Story"
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs font-bold text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Deskripsi Fabric Story
            </label>
            <textarea
              rows={4}
              value={activeVolConfig.panorama1Desc || ''}
              onChange={(e) => updateVolField('panorama1Desc', e.target.value)}
              placeholder="A Fabric Chosen for Its Feel. 60% Cupro · 40% Viscose..."
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs leading-relaxed text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 6: FOTO FEATURE (SEVAYA Meet The Icon Editorial) ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            6. Foto Editorial Fitur (SEVAYA Meet The Icon)
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            Format 4:5
          </span>
        </div>

        <div className="max-w-md mx-auto space-y-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
            <Image
              src={activeVolConfig.panorama1 || '/images/figma_hero.png'}
              alt="Meet The Icon"
              fill
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => onOpenImagePicker('lbpage-panorama1')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/20 bg-white py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95"
          >
            <Icon name="image" size={14} />
            <span>Ganti Foto Feature Editorial</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 7: SPESIFIKASI & KOMPOSISI BAHAN ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            7. Spesifikasi Siluet &amp; Detail Perawatan
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            Poin Spesifikasi
          </span>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Judul Bagian
            </label>
            <input
              type="text"
              value={activeVolConfig.triptychTitle || ''}
              onChange={(e) => updateVolField('triptychTitle', e.target.value)}
              placeholder="e.g. The Seed of The Story"
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs font-bold text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Rincian Spesifikasi &amp; Bahan (Mendukung baris baru / bullet points)
            </label>
            <textarea
              rows={5}
              value={activeVolConfig.triptychDesc || ''}
              onChange={(e) => updateVolField('triptychDesc', e.target.value)}
              placeholder="• A graceful, flowing silhouette&#10;• Soft-touch fabric...&#10;&#10;Fabric composition: 60% Cupro, 40% Viscose"
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs font-mono leading-relaxed text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Tagline Penutup
            </label>
            <input
              type="text"
              value={activeVolConfig.triptychTagline || ''}
              onChange={(e) => updateVolField('triptychTagline', e.target.value)}
              placeholder="e.g. SEVAYA — Slow fashion, thoughtfully made."
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 8: 3 GALERI FOTO MENYAMPING (TRIPTYCH) ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            8. 3 Galeri Menyamping (Texture Detail 1, 2, 3)
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            3 Kolom Bersebelahan
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          {/* Detail 1 */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-black/70 uppercase block truncate">
              Detail 1
            </span>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
              <Image
                src={activeVolConfig.triptych1 || '/images/lookbook_figma_2.png'}
                alt="Texture 1"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('lbpage-triptych1')}
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-black/20 bg-white py-1.5 text-[10px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95"
            >
              <Icon name="image" size={12} />
              <span>Ganti</span>
            </button>
          </div>

          {/* Detail 2 */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-black/70 uppercase block truncate">
              Detail 2
            </span>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
              <Image
                src={activeVolConfig.triptych2 || '/images/lookbook_figma_3.png'}
                alt="Texture 2"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('lbpage-triptych2')}
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-black/20 bg-white py-1.5 text-[10px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95"
            >
              <Icon name="image" size={12} />
              <span>Ganti</span>
            </button>
          </div>

          {/* Detail 3 */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-black/70 uppercase block truncate">
              Detail 3
            </span>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
              <Image
                src={activeVolConfig.triptych3 || '/images/lookbook_figma_4.png'}
                alt="Texture 3"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('lbpage-triptych3')}
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-black/20 bg-white py-1.5 text-[10px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95"
            >
              <Icon name="image" size={12} />
              <span>Ganti</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 9: FINAL MOVEMENT FRAME ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            9. Foto Gerakan Penutup (Movement in Rhythm)
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            Format 4:5
          </span>
        </div>

        <div className="max-w-md mx-auto space-y-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
            <Image
              src={activeVolConfig.fullDress || '/images/catalog/catalog-15.jpg'}
              alt="Movement in Rhythm"
              fill
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => onOpenImagePicker('lbpage-fullDress')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/20 bg-white py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95"
          >
            <Icon name="image" size={14} />
            <span>Ganti Foto Penutup</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 10: SHOP THE COLLECTION HEADER ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            10. Header &quot;Shop The Collection&quot;
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            Katalog Lookbook
          </span>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Tag Atas
            </label>
            <input
              type="text"
              value={activeVolConfig.shopTag || 'SHOP THE COLLECTION'}
              onChange={(e) => updateVolField('shopTag', e.target.value)}
              placeholder="e.g. SHOP THE COLLECTION"
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs font-bold text-black focus:border-black focus:bg-white focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Nama Koleksi
            </label>
            <input
              type="text"
              value={activeVolConfig.shopTitle || ''}
              onChange={(e) => updateVolField('shopTitle', e.target.value)}
              placeholder="e.g. SEVILLA ABAYA"
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs font-bold text-black focus:border-black focus:bg-white focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Deskripsi Koleksi
            </label>
            <textarea
              rows={2}
              value={activeVolConfig.shopDesc || ''}
              onChange={(e) => updateVolField('shopDesc', e.target.value)}
              placeholder="Siluet bernapas dan palet warna alami..."
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs leading-relaxed text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── BOTTOM SAVE BAR ── */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSaveAll}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-xs font-semibold text-white shadow-lg transition hover:bg-black/85 active:scale-95"
        >
          <Icon name="check" size={16} />
          <span>Simpan Semua Perubahan Lookbook</span>
        </button>
      </div>
    </div>
  );
};
