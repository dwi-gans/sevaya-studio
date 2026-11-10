'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

export interface StudioImageProps extends Omit<ImageProps, 'quality'> {
  /**
   * Compression quality (1-100). Defaults to 95 for high-definition Retina display.
   * Can be adjusted globally here for all sections of the site.
   */
  quality?: number;
  /**
   * Predefined responsive size presets for common luxury ecommerce layouts.
   */
  preset?: 'catalog' | 'hero' | 'spotlight' | 'thumbnail' | 'journal' | 'full';
  /**
   * Optional fallback image URL if src is empty or fails.
   */
  fallbackSrc?: string;
}

const PRESET_SIZES: Record<NonNullable<StudioImageProps['preset']>, string> = {
  catalog: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  hero: '(max-width: 768px) 100vw, 100vw',
  spotlight: '(max-width: 768px) 100vw, 50vw',
  thumbnail: '(max-width: 640px) 96px, 120px',
  journal: '(max-width: 768px) 100vw, 50vw',
  full: '100vw',
};

/**
 * StudioImage is the single source of truth for all imagery across Sevaya Studio.
 * - Enforces 95 HD quality preset globally
 * - Optimized for Retina displays & modern Next.js image pipeline
 * - Prevents touching dozens of files when tuning image rules or CDN paths
 * - Built-in fallback error resilience: swaps automatically to fallbackSrc if remote image fails
 */
export function StudioImage({
  quality = 95,
  preset,
  sizes,
  src,
  alt = '',
  className = '',
  fallbackSrc = '/images/catalog/catalog-01.jpg',
  onError,
  ...rest
}: StudioImageProps) {
  const initialSrc = src || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  const resolvedSizes = sizes || (preset ? PRESET_SIZES[preset] : undefined);
  const isDataUrl = typeof currentSrc === 'string' && currentSrc.startsWith('data:');
  const isRemoteHttp = typeof currentSrc === 'string' && currentSrc.startsWith('http');

  return (
    <Image
      src={currentSrc}
      alt={alt}
      quality={quality}
      sizes={resolvedSizes}
      unoptimized={isDataUrl || isRemoteHttp || rest.unoptimized}
      className={className}
      onError={(e) => {
        if (!hasError && fallbackSrc && currentSrc !== fallbackSrc) {
          setHasError(true);
          setCurrentSrc(fallbackSrc);
        }
        onError?.(e);
      }}
      {...rest}
    />
  );
}

export default StudioImage;
