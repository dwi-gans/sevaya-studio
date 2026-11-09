'use client';

/**
 * ImageCropperModal — Modal crop gambar yang reusable.
 * Presentasional: tidak tahu apa pun soal bisnis, Supabase, atau lokasi penggunaannya.
 *
 * Pemakaian:
 *   const { cropperProps, openCropper } = useImageCropper({ preset: CROP_PRESETS.heroHome, onConfirm });
 *   <ImageCropperModal {...cropperProps} />
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { X, Crop, RotateCcw, RotateCw, RefreshCw, Monitor, Smartphone } from 'lucide-react';
import type { CropPreset } from '@/config/image-crop-presets';
import { getCroppedImage } from './getCroppedImage';

export interface CropperResult {
  file: File;
  blob: Blob;
  width: number;
  height: number;
  /** false jika user memilih "Gunakan Asli" */
  wasCropped: boolean;
}

export interface RatioOption {
  label: string;
  value: number;
}

export interface ImageCropperModalProps {
  open: boolean;
  file: File | null;
  preset: CropPreset;
  extraRatios?: RatioOption[];
  allowFreeRatio?: boolean;
  allowSkip?: boolean;
  title?: string;
  description?: string;
  onConfirm: (result: CropperResult) => void | Promise<void>;
  onCancel: () => void;
}

const BUILT_IN_RATIOS: RatioOption[] = [
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '1:1', value: 1 },
];

type ViewMode = 'desktop' | 'mobile';

/** Validasi file — computed, tidak memerlukan state */
function validateFile(file: File | null): string | null {
  if (!file) return null;
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) return 'Format tidak didukung. Gunakan JPG, PNG, atau WebP.';
  if (file.size > 20 * 1024 * 1024) return 'Ukuran file terlalu besar (maks. 20 MB).';
  return null;
}

export function ImageCropperModal({
  open,
  file,
  preset,
  extraRatios = [],
  allowFreeRatio = true,
  allowSkip = true,
  title = 'Sesuaikan / Potong Foto',
  description = 'Atur posisi agar pas dengan tampilan di website & mobile',
  onConfirm,
  onCancel,
}: ImageCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeRatio, setActiveRatio] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  const objectUrlRef = useRef<string | null>(null);
  const prevFileRef = useRef<File | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Validasi file (derived, bukan state)
  const fileError = useMemo(() => validateFile(file), [file]);
  const error = fileError ?? cropError;

  const effectiveAspect = useMemo(
    () => (viewMode === 'mobile' && preset.mobileAspect ? preset.mobileAspect : preset.aspect),
    [viewMode, preset],
  );

  // Muat objectURL saat file baru; bersihkan saat tutup
  useEffect(() => {
    // Bersihkan saat tutup
    if (!open) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      prevFileRef.current = null;
      // Reset semua state lewat callback agar tidak sync dalam effect body
      const timer = setTimeout(() => {
        setImageSrc(null);
        setCropError(null);
        setViewMode('desktop');
      }, 0);
      return () => clearTimeout(timer);
    }

    // File tidak valid atau tidak berubah → jangan muat ulang
    if (!file || fileError || prevFileRef.current === file) return undefined;

    prevFileRef.current = file;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    // Semua setState di dalam callback async agar tidak sync dalam effect body
    const timer = setTimeout(() => {
      setImageSrc(url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setActiveRatio(preset.aspect);
      setViewMode('desktop');
      setCropError(null);
    }, 0);

    return () => clearTimeout(timer);
  }, [file, open, fileError, preset.aspect]);

  // Focus trap & tutup dengan Esc
  useEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
      (el) => !el.hasAttribute('disabled'),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setActiveRatio(effectiveAspect);
  };

  const handleRotateLeft = () => setRotation((r) => r - 90);
  const handleRotateRight = () => setRotation((r) => r + 90);

  const handleConfirm = async () => {
    if (!file || !imageSrc || !croppedAreaPixels) return;
    setIsLoading(true);
    try {
      const result = await getCroppedImage(
        imageSrc,
        croppedAreaPixels,
        rotation,
        file,
        preset.outputMaxWidth,
        preset.outputFormat ?? 'image/webp',
        preset.quality ?? 0.9,
      );
      await onConfirm({ ...result, wasCropped: true });
    } catch (err) {
      setCropError(err instanceof Error ? err.message : 'Gagal memproses gambar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      await onConfirm({ file, blob, width: 0, height: 0, wasCropped: false });
    } catch (err) {
      setCropError(err instanceof Error ? err.message : 'Gagal memproses gambar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const newAspect =
      mode === 'mobile' && preset.mobileAspect ? preset.mobileAspect : preset.aspect;
    setActiveRatio(newAspect);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleRatioSelect = (ratio: number | null) => {
    setActiveRatio(ratio);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  if (!open) return null;

  // Tombol rasio yang ditampilkan
  const ratioButtons: Array<{ label: string; value: number | null }> = [
    { label: preset.label, value: effectiveAspect },
    ...BUILT_IN_RATIOS.filter((r) => r.value !== effectiveAspect),
    ...extraRatios.filter((r) => r.value !== effectiveAspect),
    ...(allowFreeRatio ? [{ label: 'Bebas', value: null }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex w-full max-w-[560px] flex-col rounded-2xl bg-white shadow-2xl border border-black/15 overflow-hidden max-h-[95dvh]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-black/10 px-5 py-4">
          <Crop className="h-4 w-4 shrink-0 text-black/50" aria-hidden />
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-black">
              {title}
            </h2>
            <p className="mt-0.5 text-[10px] text-black/50 leading-tight truncate">{description}</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Tutup modal crop"
            className="ml-auto shrink-0 rounded-full p-1.5 text-black/40 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col overflow-hidden flex-1">
          {/* Error */}
          {error && (
            <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Desktop / Mobile toggle — hanya jika preset punya mobileAspect */}
          {preset.mobileAspect && (
            <div className="flex justify-center gap-1 px-4 pt-3">
              <button
                onClick={() => handleViewModeChange('desktop')}
                aria-pressed={viewMode === 'desktop'}
                aria-label="Tampilan desktop"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium tracking-wide transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-black text-white'
                    : 'border border-black/20 bg-white text-black/60 hover:border-black/40'
                }`}
              >
                <Monitor className="h-3 w-3" aria-hidden />
                Desktop
              </button>
              <button
                onClick={() => handleViewModeChange('mobile')}
                aria-pressed={viewMode === 'mobile'}
                aria-label="Tampilan mobile"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium tracking-wide transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-black text-white'
                    : 'border border-black/20 bg-white text-black/60 hover:border-black/40'
                }`}
              >
                <Smartphone className="h-3 w-3" aria-hidden />
                Mobile
              </button>
            </div>
          )}

          {/* Area crop */}
          <div
            className="relative mx-4 mt-3 overflow-hidden rounded-xl bg-black/5"
            style={{ height: 'clamp(200px, 45vh, 340px)' }}
          >
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={activeRatio ?? undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { borderRadius: '12px' },
                  cropAreaStyle: {
                    border: '2px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                  },
                }}
                showGrid
                objectFit="contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-black/30">
                {error ? 'Pilih gambar lain' : 'Memuat gambar…'}
              </div>
            )}
          </div>

          {/* Toolbar rasio + rotate */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            {/* Rasio */}
            <div className="flex flex-wrap gap-1">
              {ratioButtons.map((btn) => {
                const isActive = btn.value === activeRatio;
                return (
                  <button
                    key={btn.label}
                    onClick={() => handleRatioSelect(btn.value)}
                    aria-pressed={isActive}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide transition-colors ${
                      isActive
                        ? 'bg-black text-white'
                        : 'border border-black/20 bg-white text-black/60 hover:border-black/40 hover:text-black'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {/* Rotate & Reset */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleRotateLeft}
                aria-label="Putar kiri 90°"
                className="rounded-full p-1.5 text-black/50 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                onClick={handleRotateRight}
                aria-label="Putar kanan 90°"
                className="rounded-full p-1.5 text-black/50 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                onClick={handleReset}
                aria-label="Reset ke posisi awal"
                className="rounded-full p-1.5 text-black/50 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-black/10 px-5 py-3.5">
          <p className="hidden text-[10px] leading-tight text-black/40 sm:block">
            Geser atau scroll foto untuk menyesuaikan.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            {allowSkip && (
              <button
                onClick={handleSkip}
                disabled={isLoading || !file}
                className="rounded-full border border-black/20 bg-white px-4 py-2 text-[10px] font-medium tracking-[0.1em] uppercase text-black/70 transition-colors hover:border-black/40 hover:text-black disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                Gunakan Asli
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={isLoading || !imageSrc || !croppedAreaPixels}
              className="rounded-full bg-black px-5 py-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-white transition-colors hover:bg-black/80 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50"
            >
              {isLoading ? 'Memproses…' : 'Pasang Foto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
