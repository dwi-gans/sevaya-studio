import React, { useState } from 'react';
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
  onFileSelectForCrop?: (file: File, target: ImagePickerTarget) => void;
  showToast: (msg: string) => void;
}

export const LookbookTab: React.FC<LookbookTabProps> = ({
  sections,
  setSections,
  selectedLookbookVolId,
  setSelectedLookbookVolId,
  onOpenImagePicker,
  onFileSelectForCrop,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'posted' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddVolumeOpen, setIsAddVolumeOpen] = useState(false);
  const [newVolTitle, setNewVolTitle] = useState('');
  const [newVolSeason, setNewVolSeason] = useState("'26");
  const [newVolBadge, setNewVolBadge] = useState('NEW');

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

  const getVolKey = (link: { id?: string; href: string }) => {
    return link.id || (link.href === '/lookbook' ? 'vol-1' : link.href.replace('/lookbook/', ''));
  };

  const LookbookUploadGroup = ({
    target,
    ratioLabel = '4:5',
    selectLabel = 'Pilih Galeri',
  }: {
    target: ImagePickerTarget;
    ratioLabel?: string;
    selectLabel?: string;
  }) => (
    <div className="flex items-center gap-1.5 w-full">
      <label className="flex-1 inline-flex items-center justify-center gap-1 rounded-full bg-black py-1.5 px-2 text-[10px] font-semibold text-white transition hover:bg-black/85 active:scale-95 cursor-pointer shadow-2xs">
        <Icon name="upload" size={11} />
        <span>Unggah & Sesuaikan ({ratioLabel})</span>
        <input
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onFileSelectForCrop) onFileSelectForCrop(file, target);
            e.target.value = '';
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => onOpenImagePicker(target)}
        className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-black/20 bg-white py-1.5 px-2 text-[10px] font-medium text-black hover:border-black active:scale-95 transition cursor-pointer"
      >
        <Icon name="image" size={11} />
        <span>{selectLabel}</span>
      </button>
    </div>
  );

  const getVolConfig = (volKey: string): LookbookPageConfig => {
    if (volKey === 'vol-1') {
      return (
        sections.lookbookVolumesConfig?.['vol-1'] ||
        sections.lookbookPage ||
        DEFAULT_SITE_SECTIONS.lookbookPage!
      );
    }
    return (
      sections.lookbookVolumesConfig?.[volKey] ||
      sections.lookbookPage ||
      DEFAULT_SITE_SECTIONS.lookbookPage!
    );
  };

  const isVolumeHidden = (link: { hidden?: boolean }, volKey: string) => {
    const cfg = sections.lookbookVolumesConfig?.[volKey];
    return Boolean(link.hidden || cfg?.hidden);
  };

  const totalVolumes = currentLinks.length;
  const postedVolumes = currentLinks.filter((l) => !isVolumeHidden(l, getVolKey(l))).length;
  const hiddenVolumes = currentLinks.filter((l) => isVolumeHidden(l, getVolKey(l))).length;

  const filteredLinks = currentLinks.filter((link) => {
    const volKey = getVolKey(link);
    const hidden = isVolumeHidden(link, volKey);
    const cfg = getVolConfig(volKey);

    if (filterStatus === 'posted' && hidden) return false;
    if (filterStatus === 'hidden' && !hidden) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchLabel = link.label?.toLowerCase().includes(q);
      const matchTitle = cfg.heroTitle?.toLowerCase().includes(q);
      const matchSubtitle = cfg.heroSubtitle?.toLowerCase().includes(q);
      const matchHref = link.href?.toLowerCase().includes(q);
      return matchLabel || matchTitle || matchSubtitle || matchHref;
    }
    return true;
  });

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

  const handleCreateVolume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolTitle.trim()) {
      showToast('Harap masukkan judul volume lookbook');
      return;
    }

    const nextIndex = currentLinks.length + 1;
    const volId = `vol-${nextIndex}`;
    const newLink = {
      id: volId,
      label: newVolTitle.trim(),
      season: newVolSeason.trim() || "'26",
      href: `/lookbook/${volId}`,
      badge: newVolBadge.trim() || undefined,
    };

    const newConfig: LookbookPageConfig = {
      ...activeVolConfig,
      heroSubtitle: `SEVAYA • ${volId.toUpperCase()}`,
      heroTitle: newVolTitle.trim().toUpperCase(),
      hidden: false,
    };

    const next: SiteSectionsConfig = {
      ...sections,
      lookbookLinks: [...currentLinks, newLink],
      lookbookVolumesConfig: {
        ...(sections.lookbookVolumesConfig || {}),
        [volId]: newConfig,
      },
    };

    setSections(next);
    saveSiteSections(next);
    setSelectedLookbookVolId(volId);
    setIsAddVolumeOpen(false);
    setViewMode('edit');
    showToast(`Volume baru "${newVolTitle}" berhasil ditambahkan! Anda sekarang berada di editor volume.`);
  };

  const handleDeleteVolume = () => {
    if (selectedLookbookVolId === 'vol-1') {
      showToast('Volume utama (Vol 1) tidak dapat dihapus');
      return;
    }
    if (confirm(`Yakin ingin menghapus volume "${activeVolLabel}"?`)) {
      const updatedLinks = currentLinks.filter(
        (l) => l.id !== selectedLookbookVolId && !l.href.includes(selectedLookbookVolId)
      );
      const updatedVolConfigs = { ...(sections.lookbookVolumesConfig || {}) };
      delete updatedVolConfigs[selectedLookbookVolId];

      const next: SiteSectionsConfig = {
        ...sections,
        lookbookLinks: updatedLinks,
        lookbookVolumesConfig: updatedVolConfigs,
      };

      setSections(next);
      saveSiteSections(next);
      setSelectedLookbookVolId('vol-1');
      setViewMode('list');
      showToast(`Volume "${activeVolLabel}" berhasil dihapus.`);
    }
  };

  const handleDeleteSpecificVolume = (volKey: string, volLabel: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (volKey === 'vol-1') {
      showToast('Volume utama (Vol 1) tidak dapat dihapus');
      return;
    }
    if (confirm(`Yakin ingin menghapus volume "${volLabel}"?`)) {
      const updatedLinks = currentLinks.filter((l) => getVolKey(l) !== volKey);
      const updatedVolConfigs = { ...(sections.lookbookVolumesConfig || {}) };
      delete updatedVolConfigs[volKey];

      const next: SiteSectionsConfig = {
        ...sections,
        lookbookLinks: updatedLinks,
        lookbookVolumesConfig: updatedVolConfigs,
      };

      setSections(next);
      saveSiteSections(next);
      if (selectedLookbookVolId === volKey) {
        setSelectedLookbookVolId('vol-1');
      }
      showToast(`Volume "${volLabel}" berhasil dihapus.`);
    }
  };

  const handleToggleHideVolume = () => {
    const isCurrentlyHidden = Boolean(activeVolConfig.hidden || activeLink?.hidden);
    const nextHidden = !isCurrentlyHidden;

    const updatedConfig: LookbookPageConfig = {
      ...activeVolConfig,
      hidden: nextHidden,
    };

    const updatedLinks = currentLinks.map((link) => {
      const volKey = link.id || (link.href === '/lookbook' ? 'vol-1' : link.href.replace('/lookbook/', ''));
      if (volKey === selectedLookbookVolId) {
        return { ...link, hidden: nextHidden };
      }
      return link;
    });

    const next: SiteSectionsConfig = {
      ...sections,
      lookbookLinks: updatedLinks,
      lookbookVolumesConfig: {
        ...(sections.lookbookVolumesConfig || {}),
        [selectedLookbookVolId]: updatedConfig,
      },
      lookbookPage: selectedLookbookVolId === 'vol-1' ? updatedConfig : sections.lookbookPage,
    };

    setSections(next);
    saveSiteSections(next);
    showToast(
      nextHidden
        ? `Volume "${activeVolLabel}" disembunyikan (Hide / Draft)!`
        : `Volume "${activeVolLabel}" dipublikasikan (Post / Live)!`
    );
  };

  const handleToggleHideSpecificVolume = (volKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const cfg = getVolConfig(volKey);
    const link = currentLinks.find((l) => getVolKey(l) === volKey);
    const isCurrentlyHidden = Boolean(cfg.hidden || link?.hidden);
    const nextHidden = !isCurrentlyHidden;

    const updatedConfig: LookbookPageConfig = {
      ...cfg,
      hidden: nextHidden,
    };

    const updatedLinks = currentLinks.map((l) => {
      if (getVolKey(l) === volKey) {
        return { ...l, hidden: nextHidden };
      }
      return l;
    });

    const next: SiteSectionsConfig = {
      ...sections,
      lookbookLinks: updatedLinks,
      lookbookVolumesConfig: {
        ...(sections.lookbookVolumesConfig || {}),
        [volKey]: updatedConfig,
      },
      lookbookPage: volKey === 'vol-1' ? updatedConfig : sections.lookbookPage,
    };

    setSections(next);
    saveSiteSections(next);
    showToast(
      nextHidden
        ? `Volume "${link?.label || volKey}" disembunyikan (Hide / Draft)!`
        : `Volume "${link?.label || volKey}" dipublikasikan (Post / Live)!`
    );
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

  const defaultPoints = [
    {
      title: 'Two looks in one',
      desc: 'A beautiful abstract button detail lets you style your abaya in two different ways, giving you more versatility in one piece.',
    },
    {
      title: '40 cm front zipper',
      desc: 'Designed for extra convenience, making everyday activities and mealtimes easier.',
    },
    {
      title: 'Two side pockets',
      desc: 'Functional pockets on both the right and left sides, perfect for keeping your essentials close at hand.',
    },
  ];

  const currentPoints: Array<{ title: string; desc: string }> =
    Array.isArray(activeVolConfig.purposePoints)
      ? activeVolConfig.purposePoints
      : activeVolConfig.purpose1Title || activeVolConfig.purpose2Title || activeVolConfig.purpose3Title
      ? [
          { title: activeVolConfig.purpose1Title || '', desc: activeVolConfig.purpose1Desc || '' },
          { title: activeVolConfig.purpose2Title || '', desc: activeVolConfig.purpose2Desc || '' },
          { title: activeVolConfig.purpose3Title || '', desc: activeVolConfig.purpose3Desc || '' },
        ].filter((p) => p.title || p.desc)
      : defaultPoints;

  const updatePoints = (newPoints: Array<{ title: string; desc: string }>) => {
    const updatedConfig: LookbookPageConfig = {
      ...activeVolConfig,
      purposePoints: newPoints,
      purpose1Title: newPoints[0]?.title || '',
      purpose1Desc: newPoints[0]?.desc || '',
      purpose2Title: newPoints[1]?.title || '',
      purpose2Desc: newPoints[1]?.desc || '',
      purpose3Title: newPoints[2]?.title || '',
      purpose3Desc: newPoints[2]?.desc || '',
    };
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

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1560px] space-y-4 pb-20">
      {/* ══ MODAL TAMBAH VOLUME BARU (Shared) ══ */}
      {isAddVolumeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-black/20 bg-white p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-black/50">
                  Koleksi Baru
                </span>
                <h3 className="text-base font-bold text-black">
                  Tambah Volume Lookbook
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVolumeOpen(false)}
                className="h-8 w-8 rounded-full border border-black/10 flex items-center justify-center text-black/60 hover:text-black hover:bg-black/5 transition cursor-pointer"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateVolume} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
                  Judul Volume Lookbook <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newVolTitle}
                  onChange={(e) => setNewVolTitle(e.target.value)}
                  placeholder="e.g. Vol 2: Autumn Serenade"
                  className="w-full rounded-lg border border-black/20 bg-[#FBFBFA] px-3.5 py-2 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
                    Season / Tahun
                  </label>
                  <input
                    type="text"
                    value={newVolSeason}
                    onChange={(e) => setNewVolSeason(e.target.value)}
                    placeholder="e.g. '26"
                    className="w-full rounded-lg border border-black/20 bg-[#FBFBFA] px-3.5 py-2 text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
                    Badge Label (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newVolBadge}
                    onChange={(e) => setNewVolBadge(e.target.value)}
                    placeholder="e.g. NEW"
                    className="w-full rounded-lg border border-black/20 bg-[#FBFBFA] px-3.5 py-2 text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-[10px] text-black/50 leading-relaxed">
                Setelah volume dibuat, Anda akan langsung diarahkan ke halaman editor untuk mengatur foto hero sampul, editorial visual, narasi cerita, dan detail lookbook.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsAddVolumeOpen(false)}
                  className="rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-medium text-black hover:bg-black/5 active:scale-95 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-black/85 active:scale-95 transition shadow-sm cursor-pointer"
                >
                  Buat &amp; Buka Editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        /* ═══════════════════════════════════════════════════════════════════
            VIEW 1: OVERVIEW GRID DAFTAR VOLUME (HERO CARDS + TELEMETRY)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Top Title & Header */}
          <div className="pb-2">
            <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
              Editorial &amp; Storefront Showcase
            </span>
            <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
              Manajemen Volume Lookbook
            </h2>
            <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
              Kelola koleksi volume lookbook, foto hero sampul, editorial visual, dan status rilis publik.
            </p>
          </div>

          {/* Telemetry Summary Card (Mirrors NewsTab 3 columns) */}
          <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
            <div className="grid grid-cols-3 divide-x divide-[rgba(0,0,0,0.12)]/50 gap-0">
              <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4">
                <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
                  Total Volume
                </span>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-base sm:text-2xl font-bold text-black">{totalVolumes}</span>
                  <span className="text-[10px] text-black/60">volume</span>
                </div>
                <span className="hidden sm:block text-[11px] text-black/50">
                  Tersinkronisasi otomatis
                </span>
              </div>

              <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4">
                <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
                  Posted (Live)
                </span>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-base sm:text-2xl font-bold text-emerald-600">
                    {postedVolumes}
                  </span>
                  <span className="text-[10px] text-black/60">live</span>
                </div>
                <span className="hidden sm:block text-[11px] text-black/50">
                  Tampil di storefront
                </span>
              </div>

              <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4">
                <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
                  Hidden (Draft)
                </span>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-base sm:text-2xl font-bold text-amber-600">
                    {hiddenVolumes}
                  </span>
                  <span className="text-[10px] text-black/60">draf</span>
                </div>
                <span className="hidden sm:block text-[11px] text-black/50">
                  Disembunyikan dari publik
                </span>
              </div>
            </div>
          </div>

          {/* Filter, Search & Add Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-black/15 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-black text-white'
                    : 'border border-black/20 bg-white text-black/70 hover:bg-black/5 hover:text-black'
                }`}
              >
                All Volumes ({totalVolumes})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('posted')}
                className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  filterStatus === 'posted'
                    ? 'bg-black text-white'
                    : 'border border-black/20 bg-white text-black/70 hover:bg-black/5 hover:text-black'
                }`}
              >
                Posted ({postedVolumes})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('hidden')}
                className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  filterStatus === 'hidden'
                    ? 'bg-black text-white'
                    : 'border border-black/20 bg-white text-black/70 hover:bg-black/5 hover:text-black'
                }`}
              >
                Hidden ({hiddenVolumes})
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64 shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari volume atau judul lookbook..."
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
                onClick={() => {
                  setNewVolTitle(`Vol ${currentLinks.length + 1}: `);
                  setIsAddVolumeOpen(true);
                }}
                className="shrink-0 min-h-[38px] sm:min-h-[34px] inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95 cursor-pointer shadow-sm"
              >
                <Icon name="add" size={15} />
                <span>Tambah Volume Baru</span>
              </button>
            </div>
          </div>

          {/* Volume Grid Cards (Mirrors image layout) */}
          {filteredLinks.length === 0 ? (
            <div className="rounded-2xl border border-black/15 bg-white p-12 text-center text-black/70">
              <Icon name="search_off" size={36} className="mb-2 text-black/50 mx-auto block" />
              <p className="font-semibold text-sm text-black">Tidak ada volume yang cocok</p>
              <p className="text-xs text-black/70 mt-1">
                Coba ganti kata kunci pencarian atau ubah filter status di atas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setNewVolTitle(`Vol ${currentLinks.length + 1}: `);
                  setIsAddVolumeOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-black/85 cursor-pointer"
              >
                <Icon name="add" size={15} />
                <span>Tambah Volume Baru</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredLinks.map((vol) => {
                const volKey = getVolKey(vol);
                const volConfig = getVolConfig(volKey);
                const isHidden = isVolumeHidden(vol, volKey);
                const heroImg = volConfig.heroImage || '/images/lookbook/lookbook-hero.jpg';

                return (
                  <div
                    key={volKey}
                    className="group flex flex-col justify-between rounded-2xl border border-black/15 bg-white overflow-hidden shadow-[0_1px_4px_rgba(27,23,24,0.03)] hover:shadow-md hover:border-black/30 transition-all duration-200"
                  >
                    {/* Hero Image Container */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
                      <Image
                        src={heroImg}
                        alt={vol.label}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        {isHidden ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md text-amber-300 border border-amber-300/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Hidden (Draft)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md text-emerald-300 border border-emerald-300/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            ★ Posted (Live)
                          </span>
                        )}

                        <span className="rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm border border-white/20">
                          {vol.season || "'26"}
                        </span>
                      </div>

                      {/* Bottom Overlay Label */}
                      <div className="absolute bottom-2.5 left-3 right-3 pointer-events-none">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/90 drop-shadow-sm block">
                          {volConfig.heroSubtitle || `SEVAYA • ${volKey.toUpperCase()}`}
                        </span>
                      </div>
                    </div>

                    {/* Card Info Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-black/50 font-medium">
                          <span className="uppercase tracking-wider font-semibold text-black/70">
                            {volKey.toUpperCase()}
                          </span>
                          <span className="font-mono text-[9px] bg-black/5 px-2 py-0.5 rounded text-black/70">
                            {vol.href}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-black line-clamp-1 group-hover:text-black/80 transition">
                          {vol.label}
                        </h3>

                        <p className="text-[11px] text-black/60 line-clamp-2 leading-relaxed">
                          {volConfig.seasonDesc ||
                            volConfig.heroTitle ||
                            'Koleksi busana modest dengan siluet elegan dan kenyamanan esensial.'}
                        </p>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-3 border-t border-black/10 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLookbookVolId(volKey);
                            setViewMode('edit');
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95 shadow-sm cursor-pointer"
                        >
                          <Icon name="edit" size={13} />
                          <span>Edit Volume</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleHideSpecificVolume(volKey, e)}
                          title={
                            isHidden
                              ? 'Klik untuk mempublikasikan volume ini'
                              : 'Klik untuk menyembunyikan volume ini'
                          }
                          className={`h-8 w-8 rounded-full border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                            isHidden
                              ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <Icon name={isHidden ? 'visibility_off' : 'visibility'} size={14} />
                        </button>

                        {volKey !== 'vol-1' && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSpecificVolume(volKey, vol.label, e)}
                            title="Hapus volume ini"
                            className="h-8 w-8 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition active:scale-95 cursor-pointer"
                          >
                            <Icon name="delete" size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
            VIEW 2: EDIT VOLUME VIEW (FULL VISUAL PAGE EDITOR FOR ACTIVE VOL)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* ── HEADER: BACK + VOL NAME + STATUS + HIDE TOGGLE ── */}
          <div className="flex flex-wrap items-center gap-2 border-b border-black/10 pb-3">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="inline-flex items-center gap-1 rounded-full border border-black/20 bg-white px-3 py-1.5 text-[11px] font-semibold text-black transition hover:bg-black/5 active:scale-95 cursor-pointer"
            >
              <Icon name="arrow_back" size={13} />
              <span>Kembali</span>
            </button>

            <span className="text-black/20">|</span>

            <span className="text-xs font-bold text-black">{activeVolLabel}</span>

            {activeVolConfig.hidden || activeLink?.hidden ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                Hidden
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Live
              </span>
            )}

            <button
              type="button"
              onClick={handleToggleHideVolume}
              className={`ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer active:scale-95 ${
                activeVolConfig.hidden || activeLink?.hidden
                  ? 'bg-black text-white hover:bg-black/85'
                  : 'border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <Icon
                name={activeVolConfig.hidden || activeLink?.hidden ? 'visibility' : 'visibility_off'}
                size={13}
              />
              <span>{activeVolConfig.hidden || activeLink?.hidden ? 'Post' : 'Hide'}</span>
            </button>

            {selectedLookbookVolId !== 'vol-1' && (
              <button
                type="button"
                onClick={handleDeleteVolume}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition cursor-pointer active:scale-95"
              >
                <Icon name="delete" size={13} />
                <span>Hapus</span>
              </button>
            )}
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
          <LookbookUploadGroup target="lbpage-heroImage" ratioLabel="4:5" selectLabel="Pilih Galeri" />
        </div>
      </div>

      {/* ── SECTION 3: THE SEED OF THE STORY (DETAIL SPESIFIKASI DENGAN POIN KEUNGGULAN) ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase">
            3. The Seed of The Story (Poin Keunggulan Desain)
          </span>
          <span className="rounded bg-black/10 px-2 py-0.5 text-[9px] font-semibold text-black">
            {currentPoints.length} Poin Aktif
          </span>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <div>
            <label className="text-[10px] font-semibold text-black/60 uppercase block mb-1">
              Judul Bagian
            </label>
            <input
              type="text"
              value={activeVolConfig.seasonTitle || 'The Seed of The Story'}
              onChange={(e) => updateVolField('seasonTitle', e.target.value)}
              placeholder="e.g. The Seed of The Story"
              className="w-full rounded-md border border-black/20 bg-[#FBFBFA] px-3 py-2 text-xs font-bold text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          {currentPoints.map((pt, index) => (
            <div key={index} className="rounded-xl border border-black/10 bg-[#FAFAFA] p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-black uppercase tracking-wider">
                  Poin {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextPts = currentPoints.filter((_, i) => i !== index);
                    updatePoints(nextPts);
                    showToast(`Poin ${index + 1} berhasil dihapus.`);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 hover:text-red-800 transition cursor-pointer"
                  title="Hapus Poin ini"
                >
                  <Icon name="delete" size={13} />
                  <span>Hapus Poin</span>
                </button>
              </div>

              <div>
                <label className="text-[9px] font-semibold text-black/50 uppercase block mb-1">
                  Judul Poin (e.g. Two looks in one)
                </label>
                <input
                  type="text"
                  value={pt.title}
                  onChange={(e) => {
                    const nextPts = [...currentPoints];
                    nextPts[index] = { ...nextPts[index]!, title: e.target.value };
                    updatePoints(nextPts);
                  }}
                  placeholder="Judul Poin (e.g. Two looks in one)"
                  className="w-full rounded border border-black/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-semibold text-black/50 uppercase block mb-1">
                  Deskripsi Poin (e.g. A beautiful abstract button detail...)
                </label>
                <textarea
                  rows={2}
                  value={pt.desc}
                  onChange={(e) => {
                    const nextPts = [...currentPoints];
                    nextPts[index] = { ...nextPts[index]!, desc: e.target.value };
                    updatePoints(nextPts);
                  }}
                  placeholder="Deskripsi Poin (e.g. A beautiful abstract button detail...)"
                  className="w-full rounded border border-black/15 bg-white px-2.5 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const nextPts = [...currentPoints, { title: '', desc: '' }];
              updatePoints(nextPts);
            }}
            className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-dashed border-black/25 bg-white py-2.5 text-xs font-semibold text-black hover:border-black hover:bg-black/5 transition cursor-pointer"
          >
            <Icon name="add" size={14} />
            <span>+ Tambah Poin Baru</span>
          </button>
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
            <LookbookUploadGroup target="lbpage-collagePortrait" ratioLabel="4:5" selectLabel="Pilih Galeri" />
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
            <LookbookUploadGroup target="lbpage-collageDetail1" ratioLabel="4:5" selectLabel="Pilih Galeri" />
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
          <LookbookUploadGroup target="lbpage-panorama1" ratioLabel="4:5" selectLabel="Pilih Galeri" />
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
            <LookbookUploadGroup target="lbpage-triptych1" ratioLabel="3:4" selectLabel="Pilih" />
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
            <LookbookUploadGroup target="lbpage-triptych2" ratioLabel="3:4" selectLabel="Pilih" />
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
            <LookbookUploadGroup target="lbpage-triptych3" ratioLabel="3:4" selectLabel="Pilih" />
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
          <LookbookUploadGroup target="lbpage-fullDress" ratioLabel="4:5" selectLabel="Pilih Galeri" />
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

          {/* ── BOTTOM ACTION BAR ── */}
          <div className="flex justify-end pt-4 border-t border-black/10">
            <button
              type="button"
              onClick={handleSaveAll}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-black/85 active:scale-95 cursor-pointer"
            >
              <Icon name="check" size={16} />
              <span>Simpan Perubahan Lookbook</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
