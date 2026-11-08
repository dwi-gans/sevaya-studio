import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import {
  SiteSectionsConfig,
  DEFAULT_SITE_SECTIONS,
  saveSiteSections,
  LookbookPageConfig,
  DbProduct,
  getDbProducts,
} from '@/integrations/supabase';
import type { ImagePickerTarget } from '../adminTypes';

interface LookbookTabProps {
  sections: SiteSectionsConfig;
  setSections: React.Dispatch<React.SetStateAction<SiteSectionsConfig>>;
  selectedLookbookVolId: string;
  setSelectedLookbookVolId: (id: string) => void;
  onOpenImagePicker: (target: ImagePickerTarget) => void;
  showToast: (msg: string) => void;
  products?: DbProduct[];
}

export const LookbookTab: React.FC<LookbookTabProps> = ({
  sections,
  setSections,
  selectedLookbookVolId,
  setSelectedLookbookVolId,
  onOpenImagePicker,
  showToast,
  products = [],
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'posted' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddVolumeOpen, setIsAddVolumeOpen] = useState(false);
  const [newVolTitle, setNewVolTitle] = useState('');
  const [newVolSeason, setNewVolSeason] = useState("'26");
  const [newVolBadge, setNewVolBadge] = useState('NEW');

  // Catalog products for Lookbook "Shop The Collection" picker
  const [catalogProducts, setCatalogProducts] = useState<DbProduct[]>(products);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'all' | 'abaya' | 'khimar'>('all');

  useEffect(() => {
    if (products && products.length > 0) {
      setCatalogProducts(products);
    } else {
      getDbProducts().then((res) => {
        if (res && res.length > 0) setCatalogProducts(res);
      });
    }
  }, [products]);

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

  const updateVolField = <K extends keyof LookbookPageConfig>(key: K, value: LookbookPageConfig[K]) => {
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

  // Selected product IDs for current active volume (Max 4)
  const selectedProductIds: string[] = useMemo(() => {
    return Array.isArray(activeVolConfig.shopProductIds)
      ? activeVolConfig.shopProductIds.map(String)
      : [];
  }, [activeVolConfig.shopProductIds]);

  // Selected DbProduct objects mapped in chosen order
  const selectedProducts: DbProduct[] = useMemo(() => {
    return selectedProductIds
      .map((id) => catalogProducts.find((p) => String(p.id) === id || p.slug === id))
      .filter((p): p is DbProduct => Boolean(p));
  }, [selectedProductIds, catalogProducts]);

  const handleToggleProduct = (product: DbProduct) => {
    const prodId = String(product.id);
    const isSelected =
      selectedProductIds.includes(prodId) ||
      (Boolean(product.slug) && selectedProductIds.includes(product.slug));

    if (isSelected) {
      const next = selectedProductIds.filter((id) => id !== prodId && id !== product.slug);
      updateVolField('shopProductIds', next);
    } else {
      if (selectedProductIds.length >= 4) {
        showToast('Maksimal 4 produk telah terpilih untuk volume ini.');
        return;
      }
      const next = [...selectedProductIds, prodId];
      updateVolField('shopProductIds', next);
    }
  };

  const handleRemoveProduct = (prodId: string) => {
    const next = selectedProductIds.filter((id) => id !== prodId);
    updateVolField('shopProductIds', next);
  };

  const handleMoveProductOrder = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedProductIds.length) return;
    const next = [...selectedProductIds];
    const itemA = next[index];
    const itemB = next[targetIdx];
    if (typeof itemA === 'string' && typeof itemB === 'string') {
      next[index] = itemB;
      next[targetIdx] = itemA;
      updateVolField('shopProductIds', next);
    }
  };

  const handleResetProducts = () => {
    updateVolField('shopProductIds', []);
    showToast('Pilihan produk dikembalikan ke 4 produk teratas di katalog secara otomatis.');
  };

  const filteredCatalogProducts = useMemo(() => {
    return catalogProducts.filter((p) => {
      if (p.hidden) return false;
      if (catalogCategoryFilter !== 'all') {
        const cat = (p.category || '').toLowerCase();
        if (
          catalogCategoryFilter === 'abaya' &&
          !cat.includes('abaya') &&
          !p.title.toLowerCase().includes('abaya')
        )
          return false;
        if (
          catalogCategoryFilter === 'khimar' &&
          !cat.includes('khimar') &&
          !p.title.toLowerCase().includes('khimar')
        )
          return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase().trim();
        return (
          p.title.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.edition && p.edition.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [catalogProducts, catalogCategoryFilter, productSearch]);

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
          <button
            type="button"
            onClick={() => onOpenImagePicker('lbpage-heroImage')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/20 bg-white py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95 cursor-pointer"
          >
            <Icon name="image" size={14} />
            <span>Ganti Foto Hero Utama</span>
          </button>
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
            <button
              type="button"
              onClick={() => onOpenImagePicker('lbpage-collagePortrait')}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-[11px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95 cursor-pointer"
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
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-[11px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95 cursor-pointer"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/20 bg-white py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95 cursor-pointer"
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
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-black/20 bg-white py-1.5 text-[10px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95 cursor-pointer"
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
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-black/20 bg-white py-1.5 text-[10px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95 cursor-pointer"
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
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-black/20 bg-white py-1.5 text-[10px] font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95 cursor-pointer"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/20 bg-white py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-95 cursor-pointer"
          >
            <Icon name="image" size={14} />
            <span>Ganti Foto Penutup</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 10: SHOP THE COLLECTION & PRODUCT PICKER ── */}
      <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-black/60 uppercase block">
              10. Shop The Collection & Kurasi Produk Katalog
            </span>
            <p className="text-[11px] text-black/60 mt-0.5">
              Kelola teks heading dan tentukan maksimal 4 produk pilihan yang tampil di bagian bawah volume ini.
            </p>
          </div>
          <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-semibold text-black border border-black/10">
            Volume: {activeVolLabel}
          </span>
        </div>

        {/* ── Part A: Header Text Inputs ── */}
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

        {/* ── Part B: Product Slots (Max 4) ── */}
        <div className="border-t border-black/10 pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-black uppercase">
                  Pilihan Produk Katalog (Maksimal 4)
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase transition ${
                    selectedProductIds.length === 4
                      ? 'bg-emerald-600 text-white'
                      : selectedProductIds.length > 0
                      ? 'bg-black text-white'
                      : 'bg-black/10 text-black/70'
                  }`}
                >
                  {selectedProductIds.length} / 4 Terpilih
                </span>
                <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-bold text-black/70 border border-black/10 uppercase tracking-wider">
                  Layout: Center
                </span>
              </div>
              <p className="text-[11px] text-black/60 mt-1">
                {selectedProductIds.length === 0 ? (
                  <span className="text-amber-700 font-medium">
                    • Mode Otomatis: Belum ada produk yang dipilih khusus. Website akan menampilkan 4 produk teratas katalog.
                  </span>
                ) : (
                  <span>
                    • Menampilkan {selectedProductIds.length} produk pilihan khusus di carousel &quot;Shop The Collection&quot;.
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetProducts}
                  className="rounded-full border border-black/20 bg-white px-3 py-1.5 text-[10px] font-semibold text-black/70 hover:bg-black/5 hover:text-black transition cursor-pointer"
                >
                  Reset Otomatis
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-[11px] font-semibold text-white shadow hover:bg-black/85 transition cursor-pointer active:scale-95"
              >
                <Icon name={isCatalogPickerOpen ? 'close' : 'add'} size={13} />
                <span>{isCatalogPickerOpen ? 'Tutup Pilihan Katalog' : '+ Pilih Produk Katalog'}</span>
              </button>
            </div>
          </div>

          {/* 4 Selected Product Slots */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[0, 1, 2, 3].map((slotIdx) => {
              const product = selectedProducts[slotIdx];
              if (product) {
                return (
                  <div
                    key={String(product.id) + slotIdx}
                    className="group relative flex flex-col rounded-xl border border-black/15 bg-[#FDFDFD] p-2.5 shadow-2xs transition hover:border-black/35 hover:shadow-sm"
                  >
                    {/* Top Row: Slot Badge & Remove */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded bg-black px-1.5 py-0.5 text-[9px] font-bold text-white tracking-widest uppercase">
                        Slot #{slotIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(String(product.id))}
                        title="Hapus dari pilihan"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-black/5 text-black/60 transition hover:bg-red-500 hover:text-white cursor-pointer"
                      >
                        <span className="text-[11px] font-bold leading-none">✕</span>
                      </button>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-black/5 border border-black/10 mb-2">
                      <Image
                        src={product.image || '/images/catalog/catalog-01.jpg'}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                      {product.badge && (
                        <span className="absolute top-1 left-1 rounded bg-black/80 backdrop-blur-xs px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold text-black truncate" title={product.title}>
                        {product.title}
                      </h4>
                      <p className="text-[10px] font-medium text-black/60 mt-0.5">
                        Rp {Number(product.price || 0).toLocaleString('id-ID')}
                      </p>
                    </div>

                    {/* Order adjustment controls */}
                    <div className="mt-2.5 flex items-center justify-between border-t border-black/10 pt-2">
                      <span className="text-[9px] text-black/50 font-medium">Urutan:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={slotIdx === 0}
                          onClick={() => handleMoveProductOrder(slotIdx, 'left')}
                          title="Geser ke kiri"
                          className="flex h-5 w-5 items-center justify-center rounded border border-black/15 bg-white text-[10px] font-bold text-black transition hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          disabled={slotIdx === selectedProducts.length - 1}
                          onClick={() => handleMoveProductOrder(slotIdx, 'right')}
                          title="Geser ke kanan"
                          className="flex h-5 w-5 items-center justify-center rounded border border-black/15 bg-white text-[10px] font-bold text-black transition hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`empty-slot-${slotIdx}`}
                  onClick={() => setIsCatalogPickerOpen(true)}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/25 bg-black/[0.015] p-4 text-center min-h-[170px] transition hover:border-black/50 hover:bg-black/[0.03] cursor-pointer group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black/40 group-hover:bg-black group-hover:text-white transition mb-2">
                    <Icon name="add" size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-black/70 uppercase tracking-wider">
                    Slot #{slotIdx + 1} Kosong
                  </span>
                  <span className="text-[9px] text-black/40 mt-1">
                    Klik untuk pilih produk
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Catalog Product Selection Panel (Collapsible Drawer) ── */}
          {isCatalogPickerOpen && (
            <div className="mt-5 rounded-2xl border border-black/20 bg-[#F9F9F8] p-4 sm:p-5 shadow-inner space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                    Daftar Produk Katalog Aktif
                  </h4>
                  <p className="text-[10px] text-black/60 mt-0.5">
                    Pilih produk untuk ditambahkan ke Lookbook ini (tersisa {Math.max(0, 4 - selectedProductIds.length)} slot).
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg border border-black/15 bg-white p-0.5 text-[10px] font-medium">
                    <button
                      type="button"
                      onClick={() => setCatalogCategoryFilter('all')}
                      className={`rounded px-2 py-1 transition cursor-pointer ${
                        catalogCategoryFilter === 'all' ? 'bg-black text-white font-bold' : 'text-black/70 hover:text-black'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogCategoryFilter('abaya')}
                      className={`rounded px-2 py-1 transition cursor-pointer ${
                        catalogCategoryFilter === 'abaya' ? 'bg-black text-white font-bold' : 'text-black/70 hover:text-black'
                      }`}
                    >
                      Abaya
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogCategoryFilter('khimar')}
                      className={`rounded px-2 py-1 transition cursor-pointer ${
                        catalogCategoryFilter === 'khimar' ? 'bg-black text-white font-bold' : 'text-black/70 hover:text-black'
                      }`}
                    >
                      Khimar
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Cari nama produk..."
                      className="rounded-lg border border-black/20 bg-white px-3 py-1.5 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none w-44 sm:w-56"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => setProductSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-black/40 hover:text-black text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid of Catalog Products */}
              {filteredCatalogProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-black/50">
                  Tidak ada produk katalog yang sesuai dengan pencarian.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredCatalogProducts.map((p) => {
                    const prodId = String(p.id);
                    const selectedIdx = selectedProductIds.findIndex(
                      (id) => id === prodId || (Boolean(p.slug) && id === p.slug)
                    );
                    const isSelected = selectedIdx >= 0;
                    const isMaxReached = selectedProductIds.length >= 4 && !isSelected;

                    return (
                      <div
                        key={prodId}
                        onClick={() => {
                          if (!isMaxReached) {
                            handleToggleProduct(p);
                          }
                        }}
                        className={`relative flex flex-col rounded-xl border p-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-black bg-black/[0.04] ring-2 ring-black shadow-xs'
                            : isMaxReached
                            ? 'border-black/10 bg-white/60 opacity-50 cursor-not-allowed'
                            : 'border-black/15 bg-white hover:border-black/40 hover:shadow-xs'
                        }`}
                      >
                        {/* Top Indicator */}
                        <div className="absolute top-3 right-3 z-10">
                          {isSelected ? (
                            <span className="flex h-5 items-center justify-center rounded-full bg-black px-1.5 text-[9px] font-bold text-white shadow-xs">
                              ✓ #{selectedIdx + 1}
                            </span>
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-black/30 bg-white text-[9px] text-black/40 font-bold">
                              +
                            </span>
                          )}
                        </div>

                        {/* Image */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-black/5 border border-black/10 mb-1.5">
                          <Image
                            src={p.image || '/images/catalog/catalog-01.jpg'}
                            alt={p.title}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Title & Price */}
                        <h5 className="text-[11px] font-bold text-black truncate" title={p.title}>
                          {p.title}
                        </h5>
                        <p className="text-[10px] text-black/60 font-medium">
                          Rp {Number(p.price || 0).toLocaleString('id-ID')}
                        </p>

                        {/* Action status button */}
                        <button
                          type="button"
                          disabled={isMaxReached}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleProduct(p);
                          }}
                          className={`mt-2 w-full rounded-md py-1 text-[10px] font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                              : isMaxReached
                              ? 'bg-black/5 text-black/40 cursor-not-allowed'
                              : 'bg-black text-white hover:bg-black/85'
                          }`}
                        >
                          {isSelected ? '✕ Lepas' : isMaxReached ? 'Penuh (4/4)' : '+ Pilih'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between items-center border-t border-black/10 pt-3">
                <span className="text-[10px] text-black/60 font-medium">
                  {selectedProductIds.length} dari 4 slot terisi.
                </span>
                <button
                  type="button"
                  onClick={() => setIsCatalogPickerOpen(false)}
                  className="rounded-full bg-black px-4 py-1.5 text-[10px] font-bold text-white hover:bg-black/85 transition cursor-pointer"
                >
                  Selesai Memilih
                </button>
              </div>
            </div>
          )}
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
