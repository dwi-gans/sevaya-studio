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
 * Provides a quiet, silky-smooth fade and drift as elements enter the viewport.
 */
export function RevealOnScroll({
  children,
  className = '',
  delayMs = 0,
  durationMs = 950,
  variant = 'editorial',
  as: Component = 'div',
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
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
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getVariantStyles = () => {
    switch (variant) {
      case 'fade-up':
        return isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-7';
      case 'scale-up':
        return isVisible
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-[0.96]';
      case 'fade-in':
        return isVisible ? 'opacity-100' : 'opacity-0';
      case 'editorial':
      default:
        return isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-6 scale-[0.985]';
    }
  };

  return (
    <Component
      ref={ref}
      suppressHydrationWarning
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform',
      }}
      className={`transition-all ${getVariantStyles()} ${className}`}
    >
      {children}
    </Component>
  );
}
