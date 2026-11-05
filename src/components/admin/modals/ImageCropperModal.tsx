'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';

export type AspectRatioType = '3:4' | '4:5' | '1:1' | 'free';

interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  description: string;
  ratio: number | null; // width / height
}

const RATIO_OPTIONS: AspectRatioOption[] = [
  { id: '3:4', label: '3:4 (Detail Produk)', description: 'Standar galeri & detail', ratio: 3 / 4 },
  { id: '4:5', label: '4:5 (Katalog)', description: 'Standar kartu etalase', ratio: 4 / 5 },
  { id: '1:1', label: '1:1 (Persegi)', description: 'Rasio bujur sangkar', ratio: 1 },
  { id: 'free', label: 'Asli', description: 'Gunakan rasio asli foto', ratio: null },
];

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title?: string;
  initialRatio?: AspectRatioType;
  onApplyCrop: (croppedBlob: Blob, previewUrl: string) => Promise<void> | void;
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  title = 'Sesuaikan Tampilan Foto Pembeli',
  initialRatio = '3:4',
  onApplyCrop,
}: ImageCropperModalProps) {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioType>(initialRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (!isOpen) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setImageLoaded(false);
  }, [isOpen, imageSrc]);

  // Load image to get natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  // Drag handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Drag handlers (Touch for Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && e.touches[0]) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1 || !e.touches[0]) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((prev) => Math.min(3, Math.max(0.6, prev + delta)));
  };

  // Window listeners for smooth mouse tracking outside container
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset zoom & pan
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Calculate crop & export via canvas
  const handleApply = async () => {
    if (!imageRef.current || !containerRef.current) return;
    setIsProcessing(true);

    try {
      const container = containerRef.current;
      const img = imageRef.current;

      const containerRect = container.getBoundingClientRect();
      const currentRatioOpt = RATIO_OPTIONS.find((r) => r.id === selectedRatio);
      const targetRatio = currentRatioOpt?.ratio || img.naturalWidth / img.naturalHeight;

      // Determine viewport crop box inside the container
      let cropWidth = containerRect.width;
      let cropHeight = containerRect.height;

      if (containerRect.width / containerRect.height > targetRatio) {
        cropHeight = containerRect.height;
        cropWidth = cropHeight * targetRatio;
      } else {
        cropWidth = containerRect.width;
        cropHeight = cropWidth / targetRatio;
      }

      // Max export resolution for ultra-sharp retina fashion view
      const maxDim = 1400;
      const exportWidth = targetRatio <= 1 ? Math.round(maxDim * targetRatio) : maxDim;
      const exportHeight = targetRatio <= 1 ? maxDim : Math.round(maxDim / targetRatio);

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Gagal menginisialisasi canvas untuk crop foto.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Load original image into an HTMLImageElement to draw onto canvas
      const sourceImage = new window.Image();
      sourceImage.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        sourceImage.onload = () => resolve();
        sourceImage.onerror = () => {
          // Fallback if crossOrigin fails: fetch as blob
          fetch(imageSrc)
            .then((res) => res.blob())
            .then((blob) => {
              const localUrl = URL.createObjectURL(blob);
              sourceImage.onload = () => resolve();
              sourceImage.src = localUrl;
            })
            .catch(reject);
        };
        sourceImage.src = imageSrc;
      });

      // Calculate source image rendering coordinates relative to crop box
      // Container center to crop box center is identical since both are centered
      const scaleToFit = Math.max(cropWidth / img.naturalWidth, cropHeight / img.naturalHeight);
      const currentScale = scaleToFit * zoom;

      const renderedWidth = img.naturalWidth * currentScale;
      const renderedHeight = img.naturalHeight * currentScale;

      // Position of top-left corner of image relative to center of crop box
      const imgCenterX = cropWidth / 2 + offset.x;
      const imgCenterY = cropHeight / 2 + offset.y;

      const imgLeftInCrop = imgCenterX - renderedWidth / 2;
      const imgTopInCrop = imgCenterY - renderedHeight / 2;

      // Map from crop box pixels to output canvas pixels
      const exportScale = exportWidth / cropWidth;

      const dx = imgLeftInCrop * exportScale;
      const dy = imgTopInCrop * exportScale;
      const dw = renderedWidth * exportScale;
      const dh = renderedHeight * exportScale;

      // Background fill to clean off-white for luxury theme
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // Draw the positioned & zoomed image
      ctx.drawImage(sourceImage, dx, dy, dw, dh);

      // Convert to compressed WebP (or JPEG fallback) for lightning-fast loading
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Gagal menghasilkan file gambar'));
          },
          'image/webp',
          0.9
        );
      });

      const previewUrl = URL.createObjectURL(blob);
      await onApplyCrop(blob, previewUrl);
      onClose();
    } catch (err) {
      console.error('Error cropping image:', err);
      // Fallback: still close and notify
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const currentRatioOpt = RATIO_OPTIONS.find((r) => r.id === selectedRatio);
  const targetRatio = currentRatioOpt?.ratio;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div
        className="relative flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-4 sm:px-6 py-3.5 bg-white">
          <div className="flex flex-col">
            <h3 className="font-sans text-sm sm:text-base font-semibold tracking-wide text-black uppercase">
              {title}
            </h3>
            <p className="text-[11px] text-black/60">
              Geser (drag) foto dan atur zoom agar tampilan baju pas persis dengan mata pembeli.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5 text-black/60 hover:text-black transition cursor-pointer"
            aria-label="Tutup"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Aspect Ratio Selector Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-black/10 bg-black/[0.02] px-4 sm:px-6 py-2.5">
          <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wider mr-1 shrink-0">
            Rasio Tampilan:
          </span>
          <div className="flex flex-wrap gap-1">
            {RATIO_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedRatio(opt.id);
                  handleReset();
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition cursor-pointer ${
                  selectedRatio === opt.id
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white border border-black/15 text-black/70 hover:bg-black/5 hover:text-black'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Cropper Area */}
        <div className="relative flex items-center justify-center bg-[#151515] p-4 sm:p-6 overflow-hidden min-h-[340px] sm:min-h-[420px] select-none">
          {/* Visual framing container */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className={`relative overflow-hidden shadow-2xl rounded-sm border-2 border-white/80 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              width: targetRatio
                ? targetRatio <= 1
                  ? `${Math.round(260 * targetRatio)}px`
                  : '300px'
                : '280px',
              height: targetRatio
                ? targetRatio <= 1
                  ? '346px'
                  : `${Math.round(300 / targetRatio)}px`
                : '346px',
              maxWidth: '85vw',
              maxHeight: '52vh',
            }}
          >
            {/* The Image inside the framing */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              onLoad={handleImageLoad}
              crossOrigin="anonymous"
              draggable={false}
              className="absolute pointer-events-none max-w-none transition-transform duration-75"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
              }}
            />

            {/* Subtle Rule-of-Thirds Grid Overlay */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-white/40" />
              <div className="border-r border-white/40" />
              <div />
            </div>

            {/* Hint overlay on first render */}
            <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex justify-center">
              <span className="rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-0.5 text-[9px] font-medium text-white/90 shadow-xs">
                Klik & geser untuk atur posisi foto
              </span>
            </div>
          </div>
        </div>

        {/* Zoom & Positioning Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/10 bg-white px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-black/60 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Icon name="search" size={12} />
              <span>Zoom</span>
            </span>
            <input
              type="range"
              min="0.6"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full sm:w-44 accent-black cursor-pointer h-1.5 bg-black/10 rounded-lg"
            />
            <span className="font-mono text-xs text-black/70 w-9 text-right shrink-0">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-black/20 px-2.5 py-1 text-[10px] font-medium text-black hover:bg-black/5 active:scale-95 transition cursor-pointer shrink-0 ml-1"
              title="Reset ke posisi awal"
            >
              Reset
            </button>
          </div>

          <span className="text-[10px] text-black/50 hidden sm:inline italic">
            Ukuran asli: {naturalSize.width} × {naturalSize.height} px
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-black/10 bg-white px-4 sm:px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-full border border-black/20 px-4 py-2 text-xs font-semibold text-black/70 hover:bg-black/5 hover:text-black transition disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing || !imageLoaded}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-6 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-black/85 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Menyesuaikan Foto...</span>
              </>
            ) : (
              <>
                <Icon name="check" size={14} />
                <span>Terapkan & Pasang Foto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
