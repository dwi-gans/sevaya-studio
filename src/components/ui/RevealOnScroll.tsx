'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  durationMs?: number;
  variant?: 'editorial' | 'fade-up' | 'scale-up' | 'fade-in';
  as?: React.ElementType;
}

/**
 * Editorial scroll reveal animation designed for luxury modest fashion.
 * Engineered for 60/120fps hardware acceleration with zero scroll jank:
 * - GPU compositor-only transitions (transform & opacity only; never transition-all)
 * - Releases will-change layer memory as soon as the reveal animation settles
 * - 120px preemptive rootMargin so content is ready before entering viewport
 * - Zero premature timer storms during initial scroll
 */
export function RevealOnScroll({
  children,
  className = '',
  delayMs = 0,
  durationMs = 550,
  variant = 'editorial',
  as: Component = 'div',
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      setIsSettled(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.01,
        rootMargin: '120px 0px 120px 0px',
      }
    );

    observer.observe(el);

    // Safety fallback: only if observer never fired after 2500ms
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  // Once animation completes, mark as settled to release GPU memory & compositor layers
  useEffect(() => {
    if (!isVisible) return;
    const settleTimer = setTimeout(() => {
      setIsSettled(true);
    }, delayMs + durationMs + 40);

    return () => clearTimeout(settleTimer);
  }, [isVisible, delayMs, durationMs]);

  const getVariantStyles = () => {
    if (isSettled) {
      return 'opacity-100 transform-none';
    }

    switch (variant) {
      case 'fade-up':
        return isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-5';
      case 'scale-up':
        return isVisible
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-[0.98]';
      case 'fade-in':
        return isVisible ? 'opacity-100' : 'opacity-0';
      case 'editorial':
      default:
        return isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4';
    }
  };

  return (
    <Component
      ref={ref}
      suppressHydrationWarning
      style={
        isSettled
          ? undefined
          : {
              transitionDuration: `${durationMs}ms`,
              transitionDelay: `${delayMs}ms`,
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: isVisible ? 'transform, opacity' : 'auto',
            }
      }
      className={`${isSettled ? '' : 'transition-[opacity,transform] ease-out'} ${getVariantStyles()} ${className}`}
    >
      {children}
    </Component>
  );
}
