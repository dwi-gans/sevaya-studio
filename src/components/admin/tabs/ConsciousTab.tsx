'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import {
  saveSiteSections,
  DEFAULT_CONSCIOUS_PAGE,
  type SiteSectionsConfig,
  type ConsciousPageConfig,
} from '@/integrations/supabase';
import { uploadFileToStorage } from '@/integrations/supabase/storage';
import type { ImagePickerTarget } from '../adminTypes';

interface ConsciousTabProps {
  sections: SiteSectionsConfig;
  setSections?: React.Dispatch<React.SetStateAction<SiteSectionsConfig>>;
  onOpenImagePicker: (target: ImagePickerTarget) => void;
  showToast?: (msg: string) => void;
}

export const ConsciousTab: React.FC<ConsciousTabProps> = ({
  sections,
  setSections,
  onOpenImagePicker,
  showToast,
}) => {
  const [cfg, setCfg] = useState<ConsciousPageConfig>(() => ({
    ...DEFAULT_CONSCIOUS_PAGE,
    ...(sections.consciousPage || {}),
  }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<ImagePickerTarget | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Sync when parent sections update (e.g. after image picker saves)
  useEffect(() => {
    setCfg((prev) => ({
      ...prev,
      ...(sections.consciousPage || {}),
    }));
  }, [sections.consciousPage]);

  function set(key: keyof ConsciousPageConfig, value: string) {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }

  /**
   * Direct upload for any photo in Halaman About.
   * Uploads to cloud storage CDN, updates preview, and automatically saves to Supabase.
   */
  const handleDirectUpload = async (target: ImagePickerTarget, file: File) => {
    if (!file) return;
    setUploadingTarget(target);
    if (showToast) showToast(`Mengunggah ${file.name} ke Cloud Storage...`);

    try {
      const publicUrl = await uploadFileToStorage(file, 'uploads');

      // Map target to config key
      let key: keyof ConsciousPageConfig | null = null;
      if (target === 'conscious-hero') key = 'heroImage';
      else if (target === 'conscious-inspo') key = 'inspoImage';
      else if (target === 'conscious-founder') key = 'founderImage';
      else if (target === 'conscious-bemberg') key = 'bembergImage';
      else if (target === 'conscious-tencel') key = 'tencelImage';
      else if (target === 'conscious-linen') key = 'linenImage';
      else if (target === 'conscious-modal') key = 'modalImage';

      if (key) {
        const nextCfg = { ...cfg, [key]: publicUrl };
        setCfg(nextCfg);

        // Langsung simpan otomatis ke Supabase database
        const updated: SiteSectionsConfig = {
          ...sections,
          consciousPage: nextCfg,
          conscious: {
            heroImage: nextCfg.heroImage || DEFAULT_CONSCIOUS_PAGE.heroImage || '/images/figma_about_1.png',
            bembergImage: nextCfg.bembergImage || '/images/catalog/catalog-06.jpg',
            tencelImage: nextCfg.tencelImage || '/images/catalog/catalog-16.jpg',
            linenImage: nextCfg.linenImage || '/images/catalog/catalog-15.jpg',
            modalImage: nextCfg.modalImage || '/images/catalog/catalog-04.jpg',
          },
        };

        if (setSections) setSections(updated);
        await saveSiteSections(updated);

        if (showToast) {
          showToast('✓ Foto berhasil diunggah & langsung tersimpan di Cloud Halaman About!');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto';
      if (showToast) showToast(`Upload gagal: ${msg}`);
      else alert(`Upload gagal: ${msg}`);
    } finally {
      setUploadingTarget(null);
      const inputEl = fileInputRefs.current[String(target)];
      if (inputEl) inputEl.value = '';
    }
  };

  async function handleSaveAll() {
    setSaving(true);
    setSaved(false);
    const updated: SiteSectionsConfig = {
      ...sections,
      consciousPage: cfg,
      // keep backward compat for image-only fields
      conscious: {
        heroImage: cfg.heroImage || DEFAULT_CONSCIOUS_PAGE.heroImage || '/images/figma_about_1.png',
        bembergImage: cfg.bembergImage || '/images/catalog/catalog-06.jpg',
        tencelImage: cfg.tencelImage || '/images/catalog/catalog-16.jpg',
        linenImage: cfg.linenImage || '/images/catalog/catalog-15.jpg',
        modalImage: cfg.modalImage || '/images/catalog/catalog-04.jpg',
      },
    };
    if (setSections) setSections(updated);
    const ok = await saveSiteSections(updated);
    setSaving(false);
    if (ok) {
      setSaved(true);
      if (showToast) showToast('✓ Semua perubahan Halaman About berhasil disimpan!');
      setTimeout(() => setSaved(false), 3000);
    }
  }

  // ── small helper components ──────────────────────────────────────────────
  const Field = ({
    label,
    fieldKey,
    multiline = false,
    rows = 3,
    hint,
  }: {
    label: string;
    fieldKey: keyof ConsciousPageConfig;
    multiline?: boolean;
    rows?: number;
    hint?: string;
  }) => (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold text-black/60 uppercase tracking-wider">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={rows}
          value={(cfg[fieldKey] as string) || ''}
          onChange={(e) => set(fieldKey, e.target.value)}
          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-black resize-y focus:border-black focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={(cfg[fieldKey] as string) || ''}
          onChange={(e) => set(fieldKey, e.target.value)}
          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-black focus:border-black focus:outline-none"
        />
      )}
      {hint && <p className="text-[10px] text-black/40">{hint}</p>}
    </div>
  );

  const PhotoBox = ({
    src,
    alt,
    target,
    label,
    aspect = 'aspect-[16/9]',
  }: {
    src: string;
    alt: string;
    target: ImagePickerTarget;
    label: string;
    aspect?: string;
  }) => {
    const isUploadingThis = uploadingTarget === target;
    return (
      <div className="flex flex-col gap-2">
        <div className={`relative ${aspect} w-full overflow-hidden rounded-xl border border-black/15 bg-black/5`}>
          <Image src={src || '/images/figma_about_1.png'} alt={alt} fill className="object-cover" />
          {isUploadingThis && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/75 text-white backdrop-blur-xs">
              <Icon name="refresh" size={24} className="animate-spin text-white mb-1.5" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Mengunggah ke Cloud...</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Direct Upload + Gallery Picker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Upload input */}
          <input
            type="file"
            ref={(el) => { fileInputRefs.current[String(target)] = el; }}
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDirectUpload(target, file);
              if (e.target) e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={isUploadingThis || uploadingTarget !== null}
            onClick={() => fileInputRefs.current[String(target)]?.click()}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Pilih foto langsung dari laptop/Mac dan simpan otomatis"
          >
            <Icon name="upload" size={13} />
            <span>{isUploadingThis ? 'Mengunggah...' : 'Unggah Foto'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenImagePicker(target)}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-3.5 py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95 cursor-pointer"
            title="Pilih dari pustaka foto yang sudah diunggah"
          >
            <Icon name="image" size={13} />
            <span>Pilih Galeri</span>
          </button>
        </div>
      </div>
    );
  };

  const SectionCard = ({
    num,
    title,
    children,
  }: {
    num: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-xl border border-black/15 bg-white p-4 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
      <div className="border-b border-black/10 pb-2">
        <h3 className="text-xs font-bold text-black">
          {num}. {title}
        </h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1560px] space-y-4 pb-24">
      {/* Header */}
      <div className="pb-2">
        <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
          About • Copywriting & Media
        </span>
        <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
          Halaman About SEVAYA
        </h2>
        <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
          Edit semua teks copywriting dan foto di halaman About/Conscious. Visual Page Mirror — urutan sama dengan halaman user.
        </p>
      </div>

      {/* ── 1. HERO BANNER ─────────────────────────────────────────────── */}
      <SectionCard num="1" title="Banner Hero Utama">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PhotoBox
            src={cfg.heroImage || '/images/figma_about_1.png'}
            alt="Hero banner"
            target="conscious-hero"
            label="Ganti Foto Hero"
            aspect="aspect-[16/7]"
          />
          <div className="space-y-3">
            <Field label="Badge / Label Atas" fieldKey="aboutBadge" hint='Contoh: "ABOUT SEVAYA"' />
            <Field label="Judul Utama (H1)" fieldKey="aboutTitle" />
            <Field label="Paragraf Deskripsi" fieldKey="aboutP" multiline rows={5} />
          </div>
        </div>
      </SectionCard>

      {/* ── 2. PHILOSOPHY BLOCK ────────────────────────────────────────── */}
      <SectionCard num="2" title="Blok Filosofi (Our Philosophy)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Badge Filosofi" fieldKey="philoBadge" hint='Contoh: "OUR PHILOSOPHY"' />
          <Field label="Pillars Tagline" fieldKey="pillars" hint='Contoh: "TIMELESS · INTENTIONAL · EFFORTLESS"' />
        </div>
        <Field label="Paragraf 1" fieldKey="philo1" multiline rows={4} />
        <Field label="Paragraf 2" fieldKey="philo2" multiline rows={4} />
        <Field label="Quote / Penutup" fieldKey="philoQuote" multiline rows={3} />
      </SectionCard>

      {/* ── 3. INSPIRATION ─────────────────────────────────────────────── */}
      <SectionCard num="3" title="Inspirasi Andalusia (Image kiri, teks kanan)">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PhotoBox
            src={cfg.inspoImage || '/images/figma_about_2.png'}
            alt="Inspiration image"
            target="conscious-inspo"
            label="Ganti Foto Inspirasi"
            aspect="aspect-[1/1]"
          />
          <div className="space-y-3">
            <Field label="Badge" fieldKey="inspoBadge" hint='Contoh: "OUR INSPIRATION"' />
            <Field label="Judul" fieldKey="inspoTitle" />
            <Field label="Paragraf 1" fieldKey="inspoP1" multiline rows={3} />
            <Field label="Paragraf 2" fieldKey="inspoP2" multiline rows={3} />
            <Field label="Paragraf 3" fieldKey="inspoP3" multiline rows={3} />
            <Field label="Tagline / Italic" fieldKey="inspoTagline" hint='Teks italic di bawah paragraf' />
          </div>
        </div>
      </SectionCard>

      {/* ── 4. FOUNDER'S STORY ─────────────────────────────────────────── */}
      <SectionCard num="4" title="Cerita Pendiri (The Founder's Story)">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PhotoBox
            src={cfg.founderImage || '/images/figma_about_1.png'}
            alt="Founder story image"
            target="conscious-founder"
            label="Ganti Foto Founder"
            aspect="aspect-[16/8]"
          />
          <div className="space-y-3">
            <Field label="Badge" fieldKey="founderBadge" hint="Contoh: THE FOUNDER'S STORY" />
            <Field label="Judul" fieldKey="founderTitle" />
          </div>
        </div>
        <Field label="Paragraf 1" fieldKey="founderP1" multiline rows={4} />
        <Field label="Paragraf 2" fieldKey="founderP2" multiline rows={4} />
        <Field label="Paragraf 3" fieldKey="founderP3" multiline rows={4} />
        <Field label="Kalimat Penutup" fieldKey="founderClosing" hint='Contoh: "Thank you for being here, and for growing with us."' />
      </SectionCard>

      {/* ── 5. TEXTILE ARCHIVE IMAGES ──────────────────────────────────── */}
      <SectionCard num="5" title="Foto Arsip Material Kain (4 Foto)">
        <p className="text-[11px] text-black/50">
          Foto makro 4 material kain (Bemberg, Tencel, Linen, Modal) — tampil di halaman Conscious versi lama. Tetap tersimpan untuk kompatibilitas.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Bemberg™ Cupro', src: cfg.bembergImage || '/images/catalog/catalog-06.jpg', target: 'conscious-bemberg' as ImagePickerTarget },
            { label: 'TENCEL™ Lyocell', src: cfg.tencelImage || '/images/catalog/catalog-16.jpg', target: 'conscious-tencel' as ImagePickerTarget },
            { label: 'Pure Flax Linen', src: cfg.linenImage || '/images/catalog/catalog-15.jpg', target: 'conscious-linen' as ImagePickerTarget },
            { label: 'Eco Modal', src: cfg.modalImage || '/images/catalog/catalog-04.jpg', target: 'conscious-modal' as ImagePickerTarget },
          ].map((item) => {
            const isUploadingThis = uploadingTarget === item.target;
            return (
              <div key={item.target} className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 border border-black/15">
                <span className="truncate text-xs font-semibold text-black">{item.label}</span>
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
                  <Image src={item.src} alt={item.label} fill className="object-cover" />
                  {isUploadingThis && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/75 text-white backdrop-blur-xs">
                      <Icon name="refresh" size={20} className="animate-spin text-white mb-1" />
                      <span className="text-[9px] font-bold tracking-wider uppercase">Mengunggah...</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[String(item.target)] = el; }}
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDirectUpload(item.target, file);
                    }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingThis || uploadingTarget !== null}
                    onClick={() => fileInputRefs.current[String(item.target)]?.click()}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-black py-1.5 text-center text-[10px] font-semibold text-white transition hover:bg-black/85 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <Icon name="upload" size={11} />
                    <span>{isUploadingThis ? 'Mengunggah...' : 'Unggah'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenImagePicker(item.target)}
                    className="rounded-full border border-black/20 bg-white py-1 text-center text-[10px] font-medium text-black hover:border-black active:scale-95 cursor-pointer"
                  >
                    Pilih Galeri
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Sticky Save Bar ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <span className="text-[11px] text-black/50 hidden sm:block">
          Semua perubahan tersimpan ke Supabase & langsung tampil di website.
        </span>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-black/80 disabled:opacity-60"
        >
          {saving ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpan...
            </>
          ) : saved ? (
            <>
              <Icon name="check" size={14} />
              Tersimpan!
            </>
          ) : (
            <>
              <Icon name="save" size={14} />
              Simpan Semua
            </>
          )}
        </button>
      </div>
    </div>
  );
};
