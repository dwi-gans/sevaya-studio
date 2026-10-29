import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { SiteSectionsConfig, DEFAULT_SITE_SECTIONS } from '@/integrations/supabase';
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

  const activeVolLabel =
    (sections.lookbookLinks || []).find(
      (l) => l.id === selectedLookbookVolId || l.href.includes(selectedLookbookVolId),
    )?.label || selectedLookbookVolId.toUpperCase();

  const currentLinks =
    sections.lookbookLinks && sections.lookbookLinks.length > 0
      ? sections.lookbookLinks
      : [
          { id: 'vol-1', label: 'Vol 1: Into a New Season', season: "'26", href: '/lookbook', badge: 'NEW' },
          { id: 'vol-2', label: 'Vol 2: Autumn Serenade', season: "'26", href: '/lookbook/vol-2', badge: 'VOL 2' },
        ];

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
          Pilih volume lookbook terlebih dahulu, lalu sesuaikan foto dan deskripsi khusus untuk volume tersebut.
        </p>
      </div>

      {/* ══ STEP 1: PEMILIHAN VOLUME LOOKBOOK & TAMBAH VOLUME ══ */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
        <div className="border-b border-black/10 pb-2.5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-xs font-bold text-black">
              1. Pilih Volume Lookbook yang Ingin Diedit
            </h3>
            <p className="text-[11px] text-black/60 mt-0">
              Klik salah satu volume di bawah untuk memuat foto dan konten khususnya.
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
              setSections((prev) => ({
                ...prev,
                lookbookLinks: newLinks,
                lookbookVolumesConfig: newVolumesConfig,
              }));
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
      </div>

      {/* ══ STEP 2: EDITOR FOTO EDITORIAL UNTUK VOLUME YANG DIPILIH ══ */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
        <div className="border-b border-black/10 pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-bold text-black uppercase">
              2. Editor Foto &amp; Konten Editorial — [{activeVolLabel}]
            </h3>
            <p className="text-[11px] text-black/60 mt-0">
              Setiap foto atau teks yang diganti akan khusus berlaku untuk volume ini dan tersimpan otomatis ke Cloud.
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

      {/* ══ STEP 3: PENGATURAN DROPDOWN NAVBAR LOOKBOOK ══ */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2.5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-black">
              3. Pengaturan Label &amp; URL Dropdown Navbar
            </h3>
            <p className="text-[11px] text-black/60 mt-0">
              Sesuaikan nama volume, tahun/season, dan tautan halaman navbar.
            </p>
          </div>
          <span className="rounded-full bg-black px-2.5 py-0.5 text-[10px] font-bold text-white">
            {(sections.lookbookLinks || []).length} Volume Navbar
          </span>
        </div>

        <div className="space-y-3">
          {currentLinks.map((link, idx) => (
            <div key={link.id || idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl border border-black/10 bg-[#f9f9f8]">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-black/60 uppercase">Label Menu Navbar</label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSections((prev) => {
                        const cur = prev.lookbookLinks || [];
                        const next = [...cur];
                        if (next[idx]) next[idx] = { ...next[idx]!, label: val };
                        return { ...prev, lookbookLinks: next };
                      });
                    }}
                    className="w-full h-9 rounded-none border border-black/20 bg-white px-2.5 text-xs text-black focus:border-black focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-black/60 uppercase">Season / Tahun</label>
                  <input
                    type="text"
                    value={link.season || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSections((prev) => {
                        const cur = prev.lookbookLinks || [];
                        const next = [...cur];
                        if (next[idx]) next[idx] = { ...next[idx]!, season: val };
                        return { ...prev, lookbookLinks: next };
                      });
                    }}
                    className="w-full h-9 rounded-none border border-black/20 bg-white px-2.5 text-xs text-black focus:border-black focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-black/60 uppercase">URL / Href</label>
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSections((prev) => {
                        const cur = prev.lookbookLinks || [];
                        const next = [...cur];
                        if (next[idx]) next[idx] = { ...next[idx]!, href: val };
                        return { ...prev, lookbookLinks: next };
                      });
                    }}
                    className="w-full h-9 rounded-none border border-black/20 bg-white px-2.5 text-xs text-black focus:border-black focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-black/60 uppercase">Badge</label>
                  <input
                    type="text"
                    value={link.badge || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSections((prev) => {
                        const cur = prev.lookbookLinks || [];
                        const next = [...cur];
                        if (next[idx]) next[idx] = { ...next[idx]!, badge: val };
                        return { ...prev, lookbookLinks: next };
                      });
                    }}
                    className="w-full h-9 rounded-none border border-black/20 bg-white px-2.5 text-xs text-black focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              {((sections.lookbookLinks || []).length > 1) && (
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Yakin hapus volume "${link.label}"?`)) return;
                    setSections((prev) => ({
                      ...prev,
                      lookbookLinks: (prev.lookbookLinks || []).filter((_, i) => i !== idx),
                    }));
                    showToast('Volume lookbook dihapus.');
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition shrink-0"
                  title="Hapus Volume"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
