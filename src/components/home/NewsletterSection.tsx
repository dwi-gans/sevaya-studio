'use client';

import React, { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';

import { useLanguage } from '@/context/LanguageContext';

export function NewsletterSection() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    showToast(t('newsletter.cta'));
    setEmail('');
  };

  return (
    <section className="px-margin-mobile flex w-full flex-col items-center bg-[#141312] py-14 text-center text-[#FAF8F5]">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Icon name="mail" size={30} className="mb-3 text-[#FAF8F5]" />
        <h2 className="font-headline-lg-mobile mb-2 font-light tracking-wide text-[#FAF8F5] md:text-3xl">
          {t('newsletter.title')}
        </h2>
        <p className="font-body-sm text-body-sm mb-6 leading-relaxed font-light text-[#FAF8F5]/80">
          {t('newsletter.desc')}
        </p>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <div className="relative w-full">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsletter.placeholder') || 'Enter your email address'}
              className="font-body-md text-body-md h-12 w-full rounded border border-[#FAF8F5]/25 bg-[#FAF8F5]/10 px-4 text-[#FAF8F5] transition-all outline-none placeholder:text-[#FAF8F5]/50 focus:border-[#FAF8F5] focus:bg-[#FAF8F5]/15 focus:ring-1 focus:ring-[#FAF8F5]"
            />
          </div>
          <button
            type="submit"
            className="font-label-md text-label-md h-12 w-full rounded bg-[#FAF8F5] font-semibold tracking-widest text-[#141312] uppercase shadow-sm transition-all hover:bg-[#ffffff] active:scale-[0.99]"
          >
            {t('newsletter.cta') || 'Subscribe'}
          </button>
          <p className="font-label-sm text-label-sm mt-1 text-center text-[#F3EFEA]/60">
            By entering your email address, you agree to Sevaya&rsquo;s Privacy Policy.
          </p>
        </form>
      </div>
    </section>
  );
}
