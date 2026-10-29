import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { MASTER_CATALOG_ASSETS, MasterAsset } from '../adminTypes';
import { uploadMultipleFilesToStorage } from '@/integrations/supabase/storage';
import { useToast } from '@/context/ToastContext';

const CLOUD_MEDIA_CACHE_KEY = 'sevaya_cloud_media_assets';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imagePath: string) => void;
  availableImages?: string[];
  currentImage?: string;
}

const getInitialAssets = (): MasterAsset[] => {
  if (typeof window === 'undefined') return MASTER_CATALOG_ASSETS;
  try {
    const cached = localStorage.getItem(CLOUD_MEDIA_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return MASTER_CATALOG_ASSETS;
};

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  availableImages,
  currentImage,
}) => {
  const { showToast } = useToast();
  const [assets, setAssets] = useState<MasterAsset[]>(getInitialAssets);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'cloud' | 'catalog'>('all');
  const [selectedSrc, setSelectedSrc] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync cache and fetch latest cloud uploads on modal open
  useEffect(() => {
    if (!isOpen) return;

    // Reset selection to currentImage if provided
    if (currentImage) {
      setSelectedSrc(currentImage);
    }

    // Refresh from localStorage first
    try {
      const cached = localStorage.getItem(CLOUD_MEDIA_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssets(parsed);
        }
      }
    } catch {
      // ignore
    }

    // Fetch latest cloud assets in background
    let isMounted = true;
    async function fetchLatestCloud() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/upload?folder=uploads');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.files)) {
            const cloudFiles: MasterAsset[] = data.files;
            const cloudNames = new Set(cloudFiles.map((f) => f.filename));

            // Merge with catalog assets
            const catalogFallback = MASTER_CATALOG_ASSETS.filter((c) => !cloudNames.has(c.filename));
            const merged = [...cloudFiles, ...catalogFallback];

            setAssets(merged);
            try {
              localStorage.setItem(CLOUD_MEDIA_CACHE_KEY, JSON.stringify(merged));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchLatestCloud();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentImage]);

  // Direct upload handler inside modal
  const handleFileUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f && f.type.startsWith('image/')) validFiles.push(f);
    }
    if (validFiles.length === 0) {
      showToast('Harap pilih berkas gambar (JPG, PNG, WebP).');
      return;
    }

    setIsUploading(true);
    showToast(`Mengunggah ${validFiles.length} foto ke Cloud Storage...`);

    try {
      const res = await uploadMultipleFilesToStorage(validFiles, 'uploads', 'Picker Direct Upload');
      if (res.success && res.files && res.files.length > 0) {
        const newUploaded = res.files;
        setAssets((prev) => {
          const updated = [...newUploaded, ...prev];
          try {
            localStorage.setItem(CLOUD_MEDIA_CACHE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });

        // Automatically select the first newly uploaded image
        const firstNew = newUploaded[0];
        if (firstNew?.src) {
          setSelectedSrc(firstNew.src);
        }

        showToast(`${newUploaded.length} foto berhasil diunggah dan siap digunakan!`);
      } else {
        showToast('Gagal mengunggah foto.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah foto.';
      showToast(`Upload gagal: ${msg}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Helper to distinguish cloud upload vs catalog
  const isCloudAsset = (src: string) => {
    return src.startsWith('http://') || src.startsWith('https://') || src.includes('/storage/v1/object/public/');
  };

  // Compute counts for tabs
  const cloudCount = useMemo(() => assets.filter((a) => isCloudAsset(a.src)).length, [assets]);
  const catalogCount = useMemo(() => assets.filter((a) => !isCloudAsset(a.src)).length, [assets]);

  // Filtered list based on active tab and search query
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Tab filter
      if (activeFilter === 'cloud' && !isCloudAsset(asset.src)) return false;
      if (activeFilter === 'catalog' && isCloudAsset(asset.src)) return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        asset.filename.toLowerCase().includes(q) ||
        (asset.collection && asset.collection.toLowerCase().includes(q))
      );
    });
  }, [assets, activeFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative max-h-[92vh] sm:max-h-[88vh] w-full max-w-5xl flex flex-col rounded-t-2xl sm:rounded-2xl border border-black/15 bg-white shadow-2xl overflow-hidden"
      >
        {/* Drag & Drop Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 text-white backdrop-blur-xs p-6 text-center animate-in fade-in duration-150">
            <Icon name="cloud_upload" size={48} className="animate-bounce mb-3 text-white" />
            <p className="text-base font-bold">Lepaskan Berkas Foto di Sini</p>
            <p className="text-xs text-white/70 mt-1">
              Foto akan langsung diunggah ke Supabase CDN dan siap dipilih.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 sm:px-6 py-3.5 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase">
                Pustaka Media &amp; Cloud Storage
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-mono font-semibold text-emerald-800 border border-emerald-200/60">
                {assets.length} FOTO TERSEDIA
              </span>
            </div>
            <h3 className="font-headline text-base font-bold text-black sm:text-lg">
              Pilih Foto Konten
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black transition"
            title="Tutup"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Toolbar: Category Filter, Search Bar, & Upload Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 bg-[#fafafa] px-4 sm:px-6 py-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-black text-white'
                  : 'border border-black/15 bg-white text-black/70 hover:bg-black/5'
              }`}
            >
              Semua Foto ({assets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('cloud')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'cloud'
                  ? 'bg-black text-white'
                  : 'border border-black/15 bg-white text-black/70 hover:bg-black/5'
              }`}
            >
              <span>Cloud Storage</span>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-emerald-900">
                {cloudCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('catalog')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'catalog'
                  ? 'bg-black text-white'
                  : 'border border-black/15 bg-white text-black/70 hover:bg-black/5'
              }`}
            >
              Katalog Studio ({catalogCount})
            </button>
          </div>

          {/* Search + Direct Upload */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama berkas..."
                className="w-full rounded-full border border-black/20 bg-white pl-8 pr-3 py-1.5 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none"
              />
              <Icon
                name="search"
                size={14}
                className="pointer-events-none absolute left-2.5 top-2.5 text-black/50"
              />
            </div>

            {/* Direct Upload Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Icon name="add_photo_alternate" size={15} />
              <span>{isUploading ? 'Mengunggah...' : 'Unggah Baru'}</span>
            </button>
          </div>
        </div>

        {/* Gallery Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[300px]">
          {isLoading && assets.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-black/10 bg-white p-2 space-y-2 animate-pulse"
                >
                  <div className="aspect-[3/4] w-full rounded-lg bg-black/5" />
                  <div className="h-3 bg-black/10 rounded-sm w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-black/60">
              <Icon name="search_off" size={40} className="mb-2 text-black/30" />
              <p className="font-semibold text-sm text-black">Tidak ada foto yang ditemukan</p>
              <p className="text-xs text-black/60 mt-1 max-w-md">
                {searchQuery
                  ? `Tidak ada berkas yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
                  : 'Belum ada foto pada kategori ini. Anda dapat mengunggah foto baru langsung di atas.'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-black/5"
              >
                <Icon name="add_photo_alternate" size={16} />
                <span>Unggah Foto Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected = selectedSrc === asset.src;
                const isCloud = isCloudAsset(asset.src);

                return (
                  <div
                    key={asset.src}
                    onClick={() => setSelectedSrc(asset.src)}
                    onDoubleClick={() => {
                      onSelectImage(asset.src);
                      onClose();
                    }}
                    className={`group relative rounded-xl border bg-white overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'border-black ring-2 ring-black shadow-md'
                        : 'border-black/15 hover:border-black/60 hover:shadow-xs'
                    }`}
                  >
                    <div className="relative aspect-[3/4] w-full bg-black/5 overflow-hidden">
                      <Image
                        src={asset.src}
                        alt={asset.filename}
                        fill
                        loading="lazy"
                        quality={70}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />

                      {/* Source Badge */}
                      <div className="absolute top-1.5 left-1.5">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${
                            isCloud
                              ? 'bg-emerald-950/80 text-emerald-300 backdrop-blur-xs border border-emerald-400/30'
                              : 'bg-black/60 text-white backdrop-blur-xs'
                          }`}
                        >
                          {isCloud ? 'Cloud' : 'Studio'}
                        </span>
                      </div>

                      {/* Selection Checkmark */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shadow-md animate-in zoom-in-75 duration-150">
                          <Icon name="check" size={14} />
                        </div>
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2 flex flex-col gap-0.5">
                      <span className="font-semibold text-[11px] text-black truncate" title={asset.filename}>
                        {asset.filename}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-black/50">
                        <span className="truncate">{asset.collection || (isCloud ? 'Unggahan CDN' : 'Katalog')}</span>
                        {asset.size && <span className="font-mono">{asset.size}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer: Selection Preview & Confirm Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/10 bg-white px-4 sm:px-6 py-3.5 shrink-0">
          {/* Selected Item Info */}
          <div className="flex items-center gap-3 min-w-0">
            {selectedSrc ? (
              <>
                <div className="relative w-11 h-14 rounded-lg border border-black/20 bg-black/5 overflow-hidden shrink-0">
                  <Image src={selectedSrc} alt="Preview" fill className="object-cover" sizes="44px" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-black/50 uppercase tracking-wider block">
                    Foto Terpilih:
                  </span>
                  <p className="text-xs font-semibold text-black truncate max-w-[280px] sm:max-w-md">
                    {selectedSrc.split('/').pop()?.split('?')[0] || selectedSrc}
                  </p>
                  <span className="text-[10px] text-black/50 truncate block">
                    Klik dua kali atau tekan tombol untuk menerapkan.
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xs text-black/50 italic">
                Pilih salah satu foto dari kisi di atas.
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/20 px-4 py-2 text-xs font-semibold text-black/70 hover:bg-black/5 hover:text-black transition"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!selectedSrc}
              onClick={() => {
                if (selectedSrc) {
                  onSelectImage(selectedSrc);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-black/85 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              <Icon name="check" size={15} />
              <span>Gunakan Foto Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
