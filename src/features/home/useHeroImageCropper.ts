'use client';

/**
 * Hook pembungkus (wrapper) untuk useImageCropper yang spesifik pada fitur Hero Home.
 *
 * Menyertakan:
 * - Preset heroHome (Desktop & Mobile)
 * - Pemrosesan langsung (hasil crop tidak diunggah ulang ke cloud)
 * - Callback onConfirm yang diterima dari admin page (untuk update state sections desktop & mobile)
 */

import { useCallback } from 'react';
import { useImageCropper } from '@/components/image-cropper';
import type { CropperResult } from '@/components/image-cropper';
import { CROP_PRESETS } from '@/config/image-crop-presets';

export interface UseHeroImageCropperOptions {
  /** Dipanggil dengan URL gambar hasil crop atau original, beserta target ('desktop' | 'mobile') */
  onUploaded: (url: string, target?: 'desktop' | 'mobile') => void | Promise<void>;
  /** Dipanggil saat proses sedang berlangsung */
  onLoadingChange?: (loading: boolean) => void;
  /** Dipanggil saat ada error */
  onError?: (message: string) => void;
}

export function useHeroImageCropper({
  onUploaded,
  onLoadingChange,
  onError,
}: UseHeroImageCropperOptions) {
  const handleConfirm = useCallback(
    async (result: CropperResult) => {
      onLoadingChange?.(true);
      try {
        const target = result.targetMode || 'desktop';

        // Jika user memilih "Gunakan Asli" dan gambar sudah dari URL cloud/galeri:
        if (!result.wasCropped && result.originalUrl) {
          await onUploaded(result.originalUrl, target);
          return;
        }

        // Hasil crop TIDAK disimpan di cloud!
        // Gunakan dataUrl beresolusi tinggi (anti-burik, kualitas 0.98 WebP) langsung
        const finalUrl =
          result.dataUrl ||
          (typeof window !== 'undefined' && result.blob ? URL.createObjectURL(result.blob) : '');

        if (!finalUrl) {
          throw new Error('Gagal menghasilkan URL gambar.');
        }

        await onUploaded(finalUrl, target);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal memproses gambar hero';
        onError?.(msg);
      } finally {
        onLoadingChange?.(false);
      }
    },
    [onUploaded, onLoadingChange, onError],
  );

  const { openCropper, closeCropper, cropperProps } = useImageCropper({
    preset: CROP_PRESETS.heroHome,
    onConfirm: handleConfirm,
  });

  return { openCropper, closeCropper, cropperProps };
}
