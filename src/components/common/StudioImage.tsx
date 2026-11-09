import React from 'react';
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
 */
export function StudioImage({
  quality = 95,
  preset,
  sizes,
  src,
  alt = '',
  className = '',
  fallbackSrc = '/images/catalog/catalog-01.jpg',
  ...rest
}: StudioImageProps) {
  const resolvedSizes = sizes || (preset ? PRESET_SIZES[preset] : undefined);
  const resolvedSrc = src || fallbackSrc;
  const isDataUrl = typeof resolvedSrc === 'string' && resolvedSrc.startsWith('data:');

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      quality={quality}
      sizes={resolvedSizes}
      unoptimized={isDataUrl || rest.unoptimized}
      className={className}
      {...rest}
    />
  );
}

export default StudioImage;
