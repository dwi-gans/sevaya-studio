import React, { useState } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { MASTER_CATALOG_ASSETS, MasterAsset } from '../adminTypes';

interface MediaLibraryTabProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  showToast: (msg: string) => void;
}

export const MediaLibraryTab: React.FC<MediaLibraryTabProps> = ({
  onFileUpload,
  showToast,
}) => {
  const [mediaCategory, setMediaCategory] = useState<'all' | 'plum' | 'cuff' | 'outdoor'>('all');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [mediaViewMode, setMediaViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<MasterAsset>(MASTER_CATALOG_ASSETS[0]!);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCollection, setUploadCollection] = useState('Abaya Plum Riverside Silk (Spring 2025)');

  const filteredAssets = MASTER_CATALOG_ASSETS.filter((asset) => {
    const matchesCategory = mediaCategory === 'all' || asset.category === mediaCategory;
    const matchesSearch =
      mediaSearchQuery.trim() === '' ||
      asset.filename.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
      asset.collection.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
      asset.badge.toLowerCase().includes(mediaSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
            Aset Digital &amp; Master Storage
          </span>
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
              Galeri Cloud Media
            </h2>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-800 border border-emerald-200/60">
              CDN ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-black/60 mt-0">
            Pusat aset master fotografi editorial resolusi tinggi dan integrasi CDN Supabase Storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="shrink-0 inline-flex items-center justify-center gap-1 rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-black/85 active:scale-[0.99]"
          >
            <Icon name="add_photo_alternate" size={16} />
            <span>Unggah Master Foto</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Card */}
      <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white p-3.5 sm:p-6 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(0,0,0,0.12)]/50 gap-3.5 sm:gap-0">
          {/* Metric 1: Kapasitas Bucket */}
          <div className="flex flex-col justify-between space-y-2 pb-3.5 sm:pb-0 sm:pr-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black/70">
                Kapasitas Bucket
              </span>
              <span className="font-mono text-xs font-semibold text-black">
                18.4 GB / 50 GB
              </span>
            </div>
            <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-black h-full rounded-full" style={{ width: '36.8%' }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-black/70">
              <span>{MASTER_CATALOG_ASSETS.length} Foto Abaya Aktif</span>
              <span className="text-emerald-700 font-medium">36.8% terpakai</span>
            </div>
          </div>

          {/* Metric 2: CDN Edge Caching */}
          <div className="flex flex-col justify-between space-y-1 py-3.5 sm:py-0 sm:px-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black/70">
                Status Edge CDN
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Optimal (99.98%)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-black">12 ms</span>
              <span className="text-[11px] text-black/70">TTFB P95 Jakarta (CGK-1)</span>
            </div>
            <div className="text-[11px] text-black/70">
              Kompresi Brotli 4K otomatis
            </div>
          </div>

          {/* Metric 3: Sinkronisasi Katalog */}
          <div className="flex flex-col justify-between space-y-1 pt-3.5 sm:pt-0 sm:pl-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black/70">
                Koneksi Storefront
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
                100% SYNCED
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-black">18 / 18</span>
              <span className="text-[11px] text-black/70">PDP Terkoneksi</span>
            </div>
            <div className="text-[11px] text-black/70">
              Bucket: <code className="font-mono text-[10px] text-black">production-katalog</code>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-black/15 bg-white p-3 sm:p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
          {[
            { id: 'all', label: `Semua (${MASTER_CATALOG_ASSETS.length})` },
            { id: 'plum', label: 'Siluet Plum (8)' },
            { id: 'cuff', label: 'Manset & Hijab (5)' },
            { id: 'outdoor', label: 'Editorial Outdoor (5)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMediaCategory(tab.id as 'all' | 'plum' | 'cuff' | 'outdoor')}
              className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${
                mediaCategory === tab.id
                  ? 'bg-black text-white'
                  : 'border border-black/20 bg-white text-black/70 hover:bg-black/5 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              value={mediaSearchQuery}
              onChange={(e) => setMediaSearchQuery(e.target.value)}
              placeholder="Filter berkas..."
              className="w-full min-h-[40px] sm:min-h-[34px] rounded-none border border-black/20 bg-white pl-8 pr-3 py-1.5 text-base sm:text-xs text-black focus:border-black focus:bg-white focus:outline-none"
            />
            <Icon
              name="filter_alt"
              size={15}
              className="pointer-events-none absolute left-2.5 top-3 sm:top-2.5 text-black/70"
            />
          </div>

          <div className="flex items-center rounded-full border border-black/20 p-0.5 bg-black/5">
            <button
              type="button"
              onClick={() => setMediaViewMode('grid')}
              className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-full transition-colors ${
                mediaViewMode === 'grid'
                  ? 'bg-white text-black shadow-2xs'
                  : 'text-black/70 hover:text-black'
              }`}
              title="Tampilan Kisi"
            >
              <Icon name="grid_view" size={16} />
            </button>
            <button
              type="button"
              onClick={() => setMediaViewMode('table')}
              className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-full transition-colors ${
                mediaViewMode === 'table'
                  ? 'bg-white text-black shadow-2xs'
                  : 'text-black/70 hover:text-black'
              }`}
              title="Tampilan Tabel"
            >
              <Icon name="table_rows" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Split Layout: Asset Display (Left) + Persistent Asset Inspector (Right) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Asset Grid or Table */}
        <div className="flex-1 min-w-0 w-full">
          {filteredAssets.length === 0 ? (
            <div className="rounded-2xl border border-black/15 bg-white p-12 text-center text-black/70">
              <Icon name="search_off" size={36} className="mb-2 text-black/50 mx-auto block" />
              <p className="font-semibold text-sm text-black">Tidak ada foto yang cocok</p>
              <p className="text-xs text-black/70 mt-1">
                Coba ganti kata kunci pencarian atau ubah filter kategori di atas.
              </p>
            </div>
          ) : mediaViewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAsset.filename === asset.filename;
                return (
                  <div
                    key={asset.filename}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setInspectorOpen(true);
                    }}
                    className={`group relative rounded-2xl border bg-white overflow-hidden cursor-pointer transition-all shadow-[0_1px_4px_rgba(27,23,24,0.03)] ${
                      isSelected && inspectorOpen
                        ? 'border-black ring-1 ring-[#000000]'
                        : 'border-black/15 hover:border-black'
                    }`}
                  >
                    <div className="relative aspect-[3/4] w-full bg-black/5 overflow-hidden">
                      <Image
                        src={asset.src}
                        alt={asset.collection}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                            asset.badge === 'LIVE PDP'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : asset.badge === 'LOOKBOOK'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200/60'
                              : asset.badge === 'DETAIL PDP'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                              : 'bg-black/5 text-black/70'
                          }`}
                        >
                          {asset.badge}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(asset.cdnUrl);
                            showToast(`Path CDN ${asset.filename} disalin!`);
                          }}
                          className="w-7 h-7 rounded-full bg-black/80 backdrop-blur-xs text-white flex items-center justify-center hover:bg-black transition-colors"
                          title="Salin Path CDN"
                        >
                          <Icon name="content_copy" size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-black truncate max-w-[130px]">
                          {asset.filename}
                        </span>
                        <span className="font-mono text-[10px] text-black/50">
                          {asset.size}
                        </span>
                      </div>
                      <span className="text-[11px] text-black/70 truncate">
                        {asset.collection}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-black/15 bg-white overflow-hidden shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/15 bg-white text-[11px] font-semibold text-black/70 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Pratinjau</th>
                      <th className="py-2.5 px-3">Nama Berkas Master</th>
                      <th className="py-2.5 px-3">Dimensi</th>
                      <th className="py-2.5 px-3">Ukuran File</th>
                      <th className="py-2.5 px-3">Penempatan</th>
                      <th className="py-2.5 px-3">Status CDN</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(0,0,0,0.12)]/60 text-xs">
                    {filteredAssets.map((asset) => {
                      const isSelected = selectedAsset.filename === asset.filename;
                      return (
                        <tr
                          key={asset.filename}
                          onClick={() => {
                            setSelectedAsset(asset);
                            setInspectorOpen(true);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected && inspectorOpen
                              ? 'bg-black/5 font-medium'
                              : 'hover:bg-white'
                          }`}
                        >
                          <td className="py-2 px-3">
                            <div className="relative w-8 h-10 overflow-hidden rounded-md bg-black/5">
                              <Image
                                src={asset.src}
                                alt={asset.filename}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-black block">
                              {asset.filename}
                            </span>
                            <span className="text-[11px] text-black/70 truncate block max-w-xs">
                              {asset.collection}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-black">
                            {asset.res}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-black/70">
                            {asset.size}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                asset.badge === 'LIVE PDP'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                  : 'bg-black/5 text-black/70'
                              }`}
                            >
                              {asset.badge}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1 text-emerald-700 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>Cached 4K</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(asset.cdnUrl);
                                  showToast(`Path CDN ${asset.filename} disalin!`);
                                }}
                                className="rounded-full p-1 text-black/70 hover:text-black hover:bg-black/5 transition-colors"
                                title="Salin Path CDN"
                              >
                                <Icon name="content_copy" size={15} />
                              </button>
                              <a
                                href={asset.src}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-full p-1 text-black/70 hover:text-black hover:bg-black/5 transition-colors"
                                title="Buka Resolusi Penuh"
                              >
                                <Icon name="open_in_new" size={15} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Asset Inspector */}
        {inspectorOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setInspectorOpen(false)}
            />
            <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md bg-white border-l border-black/15 p-5 shadow-2xl overflow-y-auto lg:static lg:z-auto lg:w-[320px] xl:w-[350px] lg:max-w-none lg:rounded-2xl lg:border lg:p-5 lg:shadow-[0_1px_4px_rgba(27,23,24,0.03)] lg:sticky lg:top-24 lg:overflow-visible animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-black/15/70">
                <div className="flex items-center gap-1.5">
                  <Icon name="info" size={16} className="text-black" />
                  <span className="text-xs uppercase font-bold tracking-wider text-black">
                    Inspektur Berkas
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      selectedAsset.badge === 'LIVE PDP'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                        : 'bg-black/5 text-black/70'
                    }`}
                  >
                    {selectedAsset.badge}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectorOpen(false)}
                    className="flex min-h-[36px] items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-black/70 hover:text-black hover:bg-black/5 border border-black/20 transition-colors active:scale-95"
                    title="Tutup Inspektur"
                  >
                    <Icon name="close" size={14} />
                    <span>Tutup</span>
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div className="my-3 overflow-hidden rounded-xl border border-black/15 bg-black/5 relative aspect-[3/4]">
                <Image
                  src={selectedAsset.src}
                  alt={selectedAsset.collection}
                  fill
                  sizes="350px"
                  className="object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-white text-[10px] font-mono flex items-center justify-between">
                  <span>{selectedAsset.res} px</span>
                  <span>{selectedAsset.format}</span>
                </div>
              </div>

              {/* Metadata Attributes */}
              <div className="space-y-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-black/50 block">
                    Nama Berkas Master
                  </span>
                  <span className="font-semibold text-black text-xs break-all">
                    {selectedAsset.filename}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-black/50 block">
                    Deskripsi Siluet &amp; Koleksi
                  </span>
                  <span className="text-black text-xs">
                    {selectedAsset.collection}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-black/50 block">
                    Supabase Storage CDN Path
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      className="flex-1 bg-white text-black font-mono text-[10.5px] px-2 py-1 border border-black/20 select-all truncate rounded-none focus:outline-none"
                      readOnly
                      type="text"
                      value={selectedAsset.cdnUrl}
                    />
                    <button
                      type="button"
                      className="rounded-full p-1.5 bg-black/5 hover:bg-[#EAE4DD] text-black transition-colors shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedAsset.cdnUrl);
                        showToast('Path Supabase CDN berhasil disalin!');
                      }}
                      title="Salin Path"
                    >
                      <Icon name="content_copy" size={13} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/15/60 text-[11px]">
                  <div>
                    <span className="text-black/50 text-[10px] block font-bold uppercase tracking-wider">
                      Ukuran File
                    </span>
                    <span className="font-mono font-semibold text-black">
                      {selectedAsset.size}
                    </span>
                  </div>
                  <div>
                    <span className="text-black/50 text-[10px] block font-bold uppercase tracking-wider">
                      Waktu Unggah
                    </span>
                    <span className="font-mono text-black text-[10.5px]">
                      {selectedAsset.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Action Cluster */}
              <div className="mt-4 pt-3 border-t border-black/15/60 flex flex-col gap-2">
                <a
                  className="w-full py-1.5 rounded-full border border-black/20 bg-white hover:bg-black/5 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  href={selectedAsset.src}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="open_in_new" size={14} />
                  <span>Buka Resolusi Penuh</span>
                </a>

                <label className="w-full py-1.5 rounded-full border border-black/20 bg-white hover:bg-black/5 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                  <Icon name="refresh" size={14} />
                  <span>Ganti File / Versi Baru</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileUpload}
                  />
                </label>

                <button
                  type="button"
                  className="w-full py-1 text-red-600 hover:bg-red-50 text-xs rounded-full flex items-center justify-center gap-1 transition-colors"
                  onClick={() => {
                    if (
                      confirm(
                        `Apakah Anda yakin ingin menghapus berkas ${selectedAsset.filename} dari master bucket?`
                      )
                    ) {
                      showToast(`Aset ${selectedAsset.filename} berhasil dihapus dari bucket.`);
                    }
                  }}
                >
                  <Icon name="delete" size={14} />
                  <span>Hapus Aset dari Bucket</span>
                </button>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Upload Master Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-black/15 shadow-2xl w-full max-w-lg p-5 sm:p-7 flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-black/15/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                  <Icon name="cloud_upload" size={18} />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-black">
                    Unggah Master Foto Katalog
                  </h3>
                  <p className="text-[11px] text-black/70">
                    Bucket:{' '}
                    <code className="bg-black/5 px-1.5 py-0.5 rounded font-mono text-[10px] text-black">
                      production-katalog-sevaya
                    </code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-black/70 hover:bg-black/5 hover:text-black transition-colors"
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Tutup Unggah"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <label className="rounded-xl border-2 border-dashed border-black/20 p-5 sm:p-6 flex flex-col items-center justify-center text-center bg-white hover:bg-black/5 transition-colors cursor-pointer">
              <Icon name="add_photo_alternate" size={36} className="text-black mb-2" />
              <p className="font-semibold text-xs text-black">
                Tarik &amp; lepas berkas master di sini
              </p>
              <p className="text-[11px] text-black/70 mt-1 max-w-sm">
                RAW, TIFF, PNG, atau JPG hingga 25 MB per berkas. Sistem mengonversi otomatis ke WebP 4K untuk edge CDN.
              </p>
              <span className="mt-4 min-h-[40px] inline-flex items-center rounded-full px-5 py-2 bg-white border border-black/20 text-xs font-semibold text-black hover:bg-black/5 shadow-xs active:scale-95 transition">
                Pilih dari Komputer
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  onFileUpload(e);
                  setIsUploadModalOpen(false);
                }}
              />
            </label>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold uppercase tracking-wider text-black/70 text-[10px] block">
                Koleksi Terhubung
              </label>
              <select
                className="w-full min-h-[42px] sm:min-h-[36px] rounded-none border border-black/20 bg-white px-3 py-2 text-base sm:text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                value={uploadCollection}
                onChange={(e) => setUploadCollection(e.target.value)}
              >
                <option>Abaya Plum Riverside Silk (Spring 2025)</option>
                <option>Koleksi Manset Monogram Emas</option>
                <option>Editorial Padang Rumput &amp; Linen</option>
                <option>Draft Umum / Belum Terikat</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/15/70">
              <button
                type="button"
                className="min-h-[44px] flex-1 sm:flex-initial rounded-full border border-black/20 bg-white px-5 py-2 text-xs font-medium text-black/70 hover:bg-black/5 hover:text-black transition-colors active:scale-95"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-[0.99]"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  showToast('Aset master berhasil diproses ke CDN!');
                }}
              >
                <Icon name="done" size={15} />
                <span>Mulai Proses CDN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
