'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'light' | 'dark';
  shape?: 'round' | 'sharp';
}

export function LanguageSwitcher({
  className = '',
  variant = 'light',
  shape = 'round',
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const isLight = variant === 'light';
  const isSharp = shape === 'sharp';

  const baseDisplay =
    className.includes('hidden') || className.includes('flex') || className.includes('block')
      ? ''
      : 'inline-flex';

  if (isSharp) {
    return (
      <div
        role="group"
        aria-label="Language selection"
        className={`${baseDisplay} items-center border border-black/25 bg-white text-[9px] font-sans tracking-wider transition-colors select-none divide-x divide-black/25 rounded-none ${className}`}
      >
        <button
          type="button"
          onClick={() => setLanguage('en')}
          aria-pressed={language === 'en'}
          title="Switch to English"
          className={`rounded-none px-2 py-0.5 uppercase transition-all cursor-pointer font-medium ${
            language === 'en'
              ? 'bg-black text-white font-semibold'
              : 'bg-white text-black/60 hover:text-black hover:bg-black/5'
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('id')}
          aria-pressed={language === 'id'}
          title="Ganti ke Bahasa Indonesia"
          className={`rounded-none px-2 py-0.5 uppercase transition-all cursor-pointer font-medium ${
            language === 'id'
              ? 'bg-black text-white font-semibold'
              : 'bg-white text-black/60 hover:text-black hover:bg-black/5'
          }`}
        >
          ID
        </button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`${baseDisplay} items-center rounded-full border p-0.5 text-[10px] font-semibold tracking-wider transition-colors select-none ${
        isLight
          ? 'border-black/15 bg-black/5 text-black'
          : 'border-white/20 bg-white/10 text-white'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        title="Switch to English"
        className={`rounded-full px-2.5 py-0.5 uppercase transition-all cursor-pointer ${
          language === 'en'
            ? isLight
              ? 'bg-black text-white shadow-2xs font-bold'
              : 'bg-white text-black shadow-2xs font-bold'
            : isLight
            ? 'text-black/50 hover:text-black'
            : 'text-white/60 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('id')}
        aria-pressed={language === 'id'}
        title="Ganti ke Bahasa Indonesia"
        className={`rounded-full px-2.5 py-0.5 uppercase transition-all cursor-pointer ${
          language === 'id'
            ? isLight
              ? 'bg-black text-white shadow-2xs font-bold'
              : 'bg-white text-black shadow-2xs font-bold'
            : isLight
            ? 'text-black/50 hover:text-black'
            : 'text-white/60 hover:text-white'
        }`}
      >
        ID
      </button>
    </div>
  );
}
