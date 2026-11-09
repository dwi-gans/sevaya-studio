'use client';

/**
 * Hook state untuk modal image cropper.
 * Presentasional — tidak tahu apa pun soal bisnis, Supabase, atau hero.
 */

import { useState, useCallback, useRef } from 'react';
import type { CropPreset } from '@/config/image-crop-presets';
import type { CropperResult } from './ImageCropperModal';

export interface UseImageCropperOptions {
  preset: CropPreset;
  onConfirm: (result: CropperResult) => void | Promise<void>;
}

export interface UseImageCropperReturn {
  /** Buka modal dengan file yang dipilih atau URL gambar cloud */
  openCropper: (file: File | string) => void;
  /** Tutup modal tanpa melakukan apa pun */
  closeCropper: () => void;
  /** Props yang diteruskan ke <ImageCropperModal> */
  cropperProps: {
    open: boolean;
    file: File | string | null;
    preset: CropPreset;
    onConfirm: (result: CropperResult) => void | Promise<void>;
    onCancel: () => void;
  };
}

export function useImageCropper({
  preset,
  onConfirm,
}: UseImageCropperOptions): UseImageCropperReturn {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const openCropper = useCallback((f: File | string) => {
    // Bersihkan objectURL sebelumnya
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (f instanceof File) {
      objectUrlRef.current = URL.createObjectURL(f);
    }
    setFile(f);
    setOpen(true);
  }, []);

  const closeCropper = useCallback(() => {
    setOpen(false);
    setFile(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(
    async (result: CropperResult) => {
      await onConfirm(result);
      closeCropper();
    },
    [onConfirm, closeCropper],
  );

  return {
    openCropper,
    closeCropper,
    cropperProps: {
      open,
      file,
      preset,
      onConfirm: handleConfirm,
      onCancel: closeCropper,
    },
  };
}
