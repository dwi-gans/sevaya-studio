'use client';

/**
 * Hook pembungkus (wrapper) untuk useImageCropper yang spesifik pada fitur Hero Home.
 *
 * Menyertakan:
 * - Preset heroHome
 * - Logika upload ke Supabase Storage
 * - Callback onConfirm yang diterima dari admin page (untuk update state sections)
 *
 * Komponen image-cropper itu sendiri tidak tahu apa pun soal hero atau Supabase.
 */

import { useCallback } from 'react';
import { useImageCropper } from '@/components/image-cropper';
import type { CropperResult } from '@/components/image-cropper';
import { CROP_PRESETS } from '@/config/image-crop-presets';
import { uploadFileToStorage } from '@/integrations/supabase/storage';

export interface UseHeroImageCropperOptions {
  /** Dipanggil dengan URL publik gambar yang sudah di-upload */
  onUploaded: (publicUrl: string) => void | Promise<void>;
  /** Dipanggil saat upload sedang berlangsung */
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
        // Jika user memilih "Gunakan Asli" dan gambar sudah dari URL cloud/galeri:
        if (!result.wasCropped && result.originalUrl) {
          await onUploaded(result.originalUrl);
          return;
        }
        const publicUrl = await uploadFileToStorage(result.file, 'uploads');
        await onUploaded(publicUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal mengunggah gambar hero';
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
