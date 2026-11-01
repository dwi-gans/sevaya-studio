import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { SiteSectionsConfig, DEFAULT_SITE_SECTIONS, saveSiteSections } from '@/integrations/supabase';
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
  const activeVolConfig =
    sections.lookbookVolumesConfig?.[selectedLookbookVolId] ||
    sections.lookbookPage ||
    DEFAULT_SITE_SECTIONS.lookbookPage!;

  const currentLinks =
    sections.lookbookLinks && sections.lookbookLinks.length > 0
      ? sections.lookbookLinks
      : [
          { id: 'vol-1', label: 'Vol 1: Into a New Season', season: "'26", href: '/lookbook', badge: 'NEW' },
          { id: 'vol-2', label: 'Vol 2: Autumn Serenade', season: "'26", href: '/lookbook/vol-2', badge: 'VOL 2' },
        ];

  const activeVolIndex = currentLinks.findIndex(
    (l) => l.id === selectedLookbookVolId || l.href.includes(selectedLookbookVolId),
  );
  const activeLink = activeVolIndex >= 0 ? currentLinks[activeVolIndex] : currentLinks[0];

  const activeVolLabel = activeLink?.label || selectedLookbookVolId.toUpperCase();

  const handleSaveTextAndNavbar = () => {
    const updatedConfig = { ...activeVolConfig };
    const next: SiteSectionsConfig = {
      ...sections,
      lookbookLinks: currentLinks,
      lookbookVolumesConfig: {
        ...(sections.lookbookVolumesConfig || {}),
        [selectedLookbookVolId]: updatedConfig,
      },
      lookbookPage: selectedLookbookVolId === 'vol-1' ? updatedConfig : sections.lookbookPage,
    };
    setSections(next);
    saveSiteSections(next);
    showToast('Pengaturan volume & teks lookbook berhasil disimpan!');
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="pb-2">
        <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
          Editorial &amp; Storefront
        </span>
        <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
          Manajemen Lookbook &amp; Galeri Editorial Per Volume
        </h2>
        <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
          Pilih volume lookbook, sesuaikan pengaturan navbar &amp; URL di bagian atas, lalu edit foto dan deskripsinya.
        </p>
      </div>

      {/* ══ STEP 1: PEMILIHAN VOLUME & PENGATURAN NAVBAR ATAS PER VOLUME ══ */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
        <div className="border-b border-black/10 pb-2.5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-xs font-bold text-black uppercase">
              1. Pilih Volume Lookbook &amp; Pengaturan Navbar
            </h3>
            <p className="text-[11px] text-black/60 mt-0">
              Pilih volume di bawah untuk mengedit foto, konten teks, serta label &amp; tautan navbarnya.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextNum = currentLinks.length + 1;
              const newId = `vol-${nextNum}`;
              const newHref = `/lookbook/vol-${nextNum}`;
              const newLinks = [
                ...currentLinks,
                {
                  id: newId,
                  label: `Vol ${nextNum}: New Chapter`,
                  season: "'26",
                  href: newHref,
                  badge: `VOL ${nextNum}`,
                },
              ];
              const newVolumesConfig = {
                ...(sections.lookbookVolumesConfig || {}),
                [newId]: { ...DEFAULT_SITE_SECTIONS.lookbookPage!, heroTitle: `VOL ${nextNum}: NEW COLLECTION` },
              };
              const next: SiteSectionsConfig = {
                ...sections,
                lookbookLinks: newLinks,
                lookbookVolumesConfig: newVolumesConfig,
              };
              setSections(next);
              saveSiteSections(next);
              setSelectedLookbookVolId(newId);
              showToast(`Volume baru "${newId}" berhasil ditambahkan & dipilih!`);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-black/85 active:scale-95"
          >
            <Icon name="add" size={14} />
            <span>+ Tambah Volume Baru</span>
          </button>
        </div>

        {/* Grid Volume Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentLinks.map((vol) => {
            const volKey = vol.id || (vol.href === '/lookbook' ? 'vol-1' : vol.href.replace('/lookbook/', ''));
            const isSelected = selectedLookbookVolId === volKey;
            return (
              <div
                key={volKey}
                onClick={() => setSelectedLookbookVolId(volKey)}
                className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-black/15 bg-white text-black hover:border-black/50'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                        isSelected ? 'bg-white text-black' : 'bg-black text-white'
                      }`}
                    >
                      {vol.badge || 'LOOKBOOK'}
                    </span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-white/70' : 'text-black/50'}`}>
                      {vol.season || "'26"}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold tracking-wide truncate">
                    {vol.label}
                  </h4>
                  <p className={`text-[10px] truncate ${isSelected ? 'text-white/70' : 'text-black/60'}`}>
                    URL: {vol.href}
                  </p>
                </div>
                <div className="pt-3 flex items-center justify-between border-t border-current/10 mt-3 text-[11px] font-semibold">
                  <span>{isSelected ? '● Sedang Diedit' : 'Pilih Volume →'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form Pengaturan Navbar Khusus Volume yang Dipilih (Tampil di atas) */}
        {activeLink && activeVolIndex >= 0 && (
          <div className="mt-4 rounded-xl border border-black/10 bg-[#f9f9f8] p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                  Pengaturan Menu Dropdown Navbar
                </span>
                <h4 className="text-xs font-bold text-black">
                  Pengaturan Navbar untuk: <span className="underline">{activeLink.label}</span> ({selectedLookbookVolId})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleSaveTextAndNavbar}
                className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-black/85 active:scale-95 shrink-0"
              >
                <Icon name="check" size={13} />
                <span>Simpan Navbar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-black/60 uppercase">Label Menu Navbar</label>
                <input
                  type="text"
                  value={activeLink.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSections((prev) => {
                      const cur = prev.lookbookLinks || [];
                      const next = [...cur];
                      if (next[activeVolIndex]) next[activeVolIndex] = { ...next[activeVolIndex]!, label: val };
                      return { ...prev, lookbookLinks: next };
                    });
                  }}
                  className="w-full h-9 rounded-none border border-black/20 bg-white px-2.5 text-xs text-black focus:border-black focus:outline-none"
                  placeholder="e.g. Vol 1: Into a New Season"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-black/60 uppercase">Season / Tahun</label>
                <input
                  type="text"
                  value={activeLink.season || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSections((prev) => {
                      const cur = prev.lookbookLinks || [];
                      const next = [...cur];
                      if (next[activeVolIndex]) next[activeVolIndex] = { ...next[activeVolIndex]!, season: val };
                      return { ...prev, lookbookLinks: next };
                    });
                  }}
                  className="w-full h-9 rounded-none border border-black/20 bg-white px-2.5 text-xs text-black focus:border-black focus:outline-none"
                  placeholder="e.g. '26"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-black/60 uppercase">URL / Href</label>
                <input
                  type="text"
                  value={activeLink.href}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSections((prev) => {
                      const cur = prev.lookbookLinks || [];
                      const next = [...cur];
                      if (next[activeVolIndex]) next[activeVolIndex] = { ...next[activeVolIndex]!, href: val };
                      return { ...prev, lookbookLinks: next };
                    });
                  }}
                  className="w-full h-9 rounded-none border border-black/20 bg-white px-2.5 text-xs text-black focus:border-black focus:outline-none"
                  placeholder="e.g. /lookbook"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-black/60 uppercase">Badge</label>
                <input
                  type="text"
                  value={activeLink.badge || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSections((prev) => {
                      const cur = prev.lookbookLinks || [];
                      const next = [...cur];
                      if (next[activeVolIndex]) next[activeVolIndex] = { ...next[activeVolIndex]!, badge: val };
                      return { ...prev, lookbookLinks: next };
                    });
                  }}
                  className="w-full h-9 rounded-none border border-black/20 bg-white px-2.5 text-xs text-black focus:border-black focus:outline-none"
                  placeholder="e.g. NEW atau VOL 2"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ STEP 2: EDITOR FOTO EDITORIAL UNTUK VOLUME YANG DIPILIH ══ */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
        <div className="border-b border-black/10 pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-bold text-black uppercase">
              2. Editor Foto &amp; Konten Editorial — [{activeVolLabel}]
            </h3>
            <p className="text-[11px] text-black/60 mt-0">
              Setiap foto yang diganti khusus berlaku untuk volume ini dan tersimpan otomatis ke Cloud.
            </p>
          </div>
          <span className="rounded-full bg-black px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
            Aktif: {selectedLookbookVolId}
          </span>
        </div>

        {/* Grid Slot Foto Lookbook untuk Volume Aktif */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 items-stretch">
          {/* 1. Hero Poster */}
          <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">1. Foto Hero Utama</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">4:3</span>
              </div>
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.heroImage || '/images/sevaya_first_chapter.jpg'} alt="Hero" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-heroImage')}
                className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Foto Hero</span>
              </button>
            </div>
          </div>

          {/* 2. Kolase Portrait */}
          <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">2. Kolase Portrait</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">4:5</span>
              </div>
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.collagePortrait || '/images/lookbook_figma_0.png'} alt="Portrait" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-collagePortrait')}
                className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Kolase Portrait</span>
              </button>
            </div>
          </div>

          {/* 3. Kolase Detail 1 */}
          <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">3. Kolase Detail 1</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">16:10</span>
              </div>
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.collageDetail1 || '/images/figma_about_1.png'} alt="Detail 1" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-collageDetail1')}
                className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Kolase Detail 1</span>
              </button>
            </div>
          </div>

          {/* 4. Kolase Detail 2 */}
          <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">4. Kolase Detail 2</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">16:10</span>
              </div>
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.collageDetail2 || '/images/figma_about_2.png'} alt="Detail 2" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-collageDetail2')}
                className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Kolase Detail 2</span>
              </button>
            </div>
          </div>

          {/* 5. Panorama 1 */}
          <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">5. Panorama 1</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">16:9</span>
              </div>
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.panorama1 || '/images/figma_hero.png'} alt="Panorama 1" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-panorama1')}
                className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Panorama 1</span>
              </button>
            </div>
          </div>

          {/* 6. Panorama 2 */}
          <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">6. Panorama 2</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">16:9</span>
              </div>
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.panorama2 || '/images/lookbook_figma_1.png'} alt="Panorama 2" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-panorama2')}
                className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Panorama 2</span>
              </button>
            </div>
          </div>

          {/* 7. Triptych 1 */}
          <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">7. Triptych 1</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">3:4</span>
              </div>
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.triptych1 || '/images/lookbook_figma_2.png'} alt="Tryptich 1" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-triptych1')}
                className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Triptych 1</span>
              </button>
            </div>
          </div>

          {/* 8. Triptych 2 */}
          <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">8. Triptych 2</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">3:4</span>
              </div>
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.triptych2 || '/images/lookbook_figma_3.png'} alt="Tryptich 2" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-triptych2')}
                className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Triptych 2</span>
              </button>
            </div>
          </div>

          {/* 9. Triptych 3 */}
          <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">9. Triptych 3</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">3:4</span>
              </div>
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.triptych3 || '/images/lookbook_figma_4.png'} alt="Tryptich 3" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-triptych3')}
                className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Triptych 3</span>
              </button>
            </div>
          </div>

          {/* 10. Full Dress / Penutup */}
          <div className="flex flex-col justify-between rounded-xl border border-black/15 bg-white p-3.5 shadow-xs sm:col-span-2 lg:col-span-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black uppercase tracking-wide">10. Foto Panorama Penutup (Full Dress Shot)</span>
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/70">21:10</span>
              </div>
              <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                <Image src={activeVolConfig.fullDress || '/images/lookbook_figma_5.png'} alt="Full Dress" fill className="object-cover" />
              </div>
            </div>
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => onOpenImagePicker('lbpage-fullDress')}
                className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white px-5 py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
              >
                <Icon name="image" size={14} />
                <span>Ganti Foto Penutup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ STEP 3: EDITOR TEKS KONTEN LOOKBOOK ══ */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
        <div className="border-b border-black/10 pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-bold text-black uppercase">
              3. Edit Teks Konten — [{activeVolLabel}]
            </h3>
            <p className="text-[11px] text-black/60 mt-0">
              Ubah judul dan deskripsi teks untuk volume ini. Klik &ldquo;Simpan Teks&rdquo; untuk menyimpan ke Cloud.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveTextAndNavbar}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-black/85 active:scale-95 shrink-0"
          >
            <Icon name="check" size={13} />
            <span>Simpan Teks</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* heroTitle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
              Judul Hero (heroTitle)
            </label>
            <input
              type="text"
              value={activeVolConfig.heroTitle || ''}
              placeholder="e.g. VOL 1: INTO A NEW SEASON"
              onChange={(e) => {
                const val = e.target.value;
                const updated = { ...activeVolConfig, heroTitle: val };
                setSections((prev) => ({
                  ...prev,
                  lookbookVolumesConfig: {
                    ...(prev.lookbookVolumesConfig || {}),
                    [selectedLookbookVolId]: updated,
                  },
                  lookbookPage: selectedLookbookVolId === 'vol-1' ? updated : prev.lookbookPage,
                }));
              }}
              className="w-full h-9 rounded-none border border-black/20 bg-white px-3 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          {/* heroSubtitle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
              Subtitle Hero (heroSubtitle)
            </label>
            <input
              type="text"
              value={activeVolConfig.heroSubtitle || ''}
              placeholder="e.g. '26 SEVILLA CUPRO ABAYA"
              onChange={(e) => {
                const val = e.target.value;
                const updated = { ...activeVolConfig, heroSubtitle: val };
                setSections((prev) => ({
                  ...prev,
                  lookbookVolumesConfig: {
                    ...(prev.lookbookVolumesConfig || {}),
                    [selectedLookbookVolId]: updated,
                  },
                  lookbookPage: selectedLookbookVolId === 'vol-1' ? updated : prev.lookbookPage,
                }));
              }}
              className="w-full h-9 rounded-none border border-black/20 bg-white px-3 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          {/* seasonTitle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
              Judul Section Pertama (seasonTitle)
            </label>
            <input
              type="text"
              value={activeVolConfig.seasonTitle || ''}
              placeholder="e.g. Every detail is designed with purpose"
              onChange={(e) => {
                const val = e.target.value;
                const updated = { ...activeVolConfig, seasonTitle: val };
                setSections((prev) => ({
                  ...prev,
                  lookbookVolumesConfig: {
                    ...(prev.lookbookVolumesConfig || {}),
                    [selectedLookbookVolId]: updated,
                  },
                  lookbookPage: selectedLookbookVolId === 'vol-1' ? updated : prev.lookbookPage,
                }));
              }}
              className="w-full h-9 rounded-none border border-black/20 bg-white px-3 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          {/* panorama1Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
              Judul Section Panorama (panorama1Title)
            </label>
            <input
              type="text"
              value={activeVolConfig.panorama1Title || ''}
              placeholder="e.g. Practical for everyday moments"
              onChange={(e) => {
                const val = e.target.value;
                const updated = { ...activeVolConfig, panorama1Title: val };
                setSections((prev) => ({
                  ...prev,
                  lookbookVolumesConfig: {
                    ...(prev.lookbookVolumesConfig || {}),
                    [selectedLookbookVolId]: updated,
                  },
                  lookbookPage: selectedLookbookVolId === 'vol-1' ? updated : prev.lookbookPage,
                }));
              }}
              className="w-full h-9 rounded-none border border-black/20 bg-white px-3 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>

          {/* triptychTitle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
              Judul Section Triptych (triptychTitle)
            </label>
            <input
              type="text"
              value={activeVolConfig.triptychTitle || ''}
              placeholder="e.g. Sevilla is more than an abaya"
              onChange={(e) => {
                const val = e.target.value;
                const updated = { ...activeVolConfig, triptychTitle: val };
                setSections((prev) => ({
                  ...prev,
                  lookbookVolumesConfig: {
                    ...(prev.lookbookVolumesConfig || {}),
                    [selectedLookbookVolId]: updated,
                  },
                  lookbookPage: selectedLookbookVolId === 'vol-1' ? updated : prev.lookbookPage,
                }));
              }}
              className="w-full h-9 rounded-none border border-black/20 bg-white px-3 text-xs text-black focus:border-black focus:outline-none"
            />
          </div>
        </div>

        {/* Text areas for longer descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* seasonDesc */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
              Deskripsi Hero / Opening (seasonDesc)
            </label>
            <textarea
              rows={4}
              value={activeVolConfig.seasonDesc || ''}
              placeholder="Deskripsi pembuka lookbook ini..."
              onChange={(e) => {
                const val = e.target.value;
                const updated = { ...activeVolConfig, seasonDesc: val };
                setSections((prev) => ({
                  ...prev,
                  lookbookVolumesConfig: {
                    ...(prev.lookbookVolumesConfig || {}),
                    [selectedLookbookVolId]: updated,
                  },
                  lookbookPage: selectedLookbookVolId === 'vol-1' ? updated : prev.lookbookPage,
                }));
              }}
              className="w-full rounded-none border border-black/20 bg-white px-3 py-2 text-xs text-black leading-relaxed focus:border-black focus:outline-none resize-none"
            />
          </div>

          {/* panorama1Desc */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
              Deskripsi Section Panorama (panorama1Desc)
            </label>
            <textarea
              rows={4}
              value={activeVolConfig.panorama1Desc || ''}
              placeholder="Deskripsi untuk section panorama tengah..."
              onChange={(e) => {
                const val = e.target.value;
                const updated = { ...activeVolConfig, panorama1Desc: val };
                setSections((prev) => ({
                  ...prev,
                  lookbookVolumesConfig: {
                    ...(prev.lookbookVolumesConfig || {}),
                    [selectedLookbookVolId]: updated,
                  },
                  lookbookPage: selectedLookbookVolId === 'vol-1' ? updated : prev.lookbookPage,
                }));
              }}
              className="w-full rounded-none border border-black/20 bg-white px-3 py-2 text-xs text-black leading-relaxed focus:border-black focus:outline-none resize-none"
            />
          </div>

          {/* triptychDesc */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
              Deskripsi Section Triptych / Penutup (triptychDesc)
            </label>
            <textarea
              rows={4}
              value={activeVolConfig.triptychDesc || ''}
              placeholder="Deskripsi penutup / pesan brand di section triptych..."
              onChange={(e) => {
                const val = e.target.value;
                const updated = { ...activeVolConfig, triptychDesc: val };
                setSections((prev) => ({
                  ...prev,
                  lookbookVolumesConfig: {
                    ...(prev.lookbookVolumesConfig || {}),
                    [selectedLookbookVolId]: updated,
                  },
                  lookbookPage: selectedLookbookVolId === 'vol-1' ? updated : prev.lookbookPage,
                }));
              }}
              className="w-full rounded-none border border-black/20 bg-white px-3 py-2 text-xs text-black leading-relaxed focus:border-black focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Save button bottom */}
        <div className="flex justify-end pt-2 border-t border-black/10">
          <button
            type="button"
            onClick={handleSaveTextAndNavbar}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-black/85 active:scale-95"
          >
            <Icon name="check" size={13} />
            <span>Simpan Teks</span>
          </button>
        </div>
      </div>

      {/* ══ STEP 4: MANAJEMEN & HAPUS VOLUME (DILETAKKAN DI BAWAH) ══ */}
      <div className="rounded-xl border border-red-200 bg-red-50/30 p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-red-200/60 pb-2.5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-red-700">
              4. Manajemen Hapus Volume
            </h3>
            <p className="text-[11px] text-red-600/80 mt-0">
              Kelola dan hapus volume lookbook yang sudah tidak aktif atau tidak diperlukan lagi.
            </p>
          </div>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
            Total: {currentLinks.length} Volume
          </span>
        </div>

        <div className="space-y-2.5">
          {currentLinks.map((link, idx) => {
            const isCanDelete = currentLinks.length > 1;
            return (
              <div
                key={link.id || idx}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-red-100 bg-white shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-black/5 text-black/70 shrink-0">
                    {link.badge || 'VOL'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-black truncate">{link.label}</p>
                    <p className="text-[10px] text-black/50 truncate">
                      {link.season || "'26"} &bull; {link.href}
                    </p>
                  </div>
                </div>

                {isCanDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`Yakin ingin menghapus volume "${link.label}"?`)) return;
                      const nextLinks = currentLinks.filter((_, i) => i !== idx);
                      const nextVolId =
                        selectedLookbookVolId === link.id
                          ? nextLinks[0]?.id || 'vol-1'
                          : selectedLookbookVolId;

                      const next: SiteSectionsConfig = {
                        ...sections,
                        lookbookLinks: nextLinks,
                      };
                      setSections(next);
                      saveSiteSections(next);
                      setSelectedLookbookVolId(nextVolId);
                      showToast(`Volume "${link.label}" berhasil dihapus.`);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-300 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition text-xs font-semibold shrink-0"
                    title="Hapus Volume"
                  >
                    <Icon name="close" size={14} />
                    <span>Hapus Volume</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-medium text-black/40 italic shrink-0">
                    Volume utama (tidak dapat dihapus)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
