'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/context/LanguageContext';

export function PoeticInterlude() {
  const { t } = useLanguage();

  return (
    <section className="px-margin-mobile flex w-full flex-col items-center justify-center border-b border-[#E5DDD5]/40 bg-[#cfc4be]/20 py-8 text-center">
      <Icon name="spa" size={26} className="mb-2 text-[#1B1718]" />
      <blockquote className="font-headline-md text-headline-md max-w-md leading-relaxed font-normal text-[#1B1718] italic">
        {t('poetic.quote')}
      </blockquote>
      <span className="font-label-sm text-label-sm mt-3 tracking-widest text-[#6E6760] uppercase">
        {t('poetic.source')}
      </span>
    </section>
  );
}
