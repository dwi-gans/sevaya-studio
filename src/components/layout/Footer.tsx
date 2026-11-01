'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { useLanguage } from '@/context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const handleLinkClick = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full border-t border-black/10 bg-white pt-16 pb-12 text-black section--light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 lg:gap-8">
          {/* Column 1: Contact Us */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-black/85 uppercase">
              Contact Us
            </h4>
            <div className="space-y-2 text-xs text-black/60">
              <p>
                <a
                  href="https://wa.me/6282266316206"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-black"
                >
                  WhatsApp: +62 822-6631-6206
                </a>
              </p>
              <p>
                <a href="mailto:info@sevaya-studio.com" className="transition hover:text-black">
                  Email: info@sevaya-studio.com
                </a>
              </p>
              <div className="flex items-center gap-2.5 pt-1.5">
                <a
                  href="https://www.instagram.com/sevaya.studio?mdxt=N21ma3NvNmpqcGY2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-white text-black/75 transition-all hover:border-black hover:text-black hover:bg-black/5 active:scale-95"
                  aria-label="Instagram SEVAYA"
                  title="Instagram @sevaya.studio"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/@sevaya.studio?_r=1&_t=ZS-9B270e5d6AO"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-white text-black/75 transition-all hover:border-black hover:text-black hover:bg-black/5 active:scale-95"
                  aria-label="TikTok SEVAYA"
                  title="TikTok @sevaya.studio"
                >
                  <svg
                    className="h-3.5 w-3.5 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .59.04.86.13V9.38a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.34a8.21 8.21 0 0 0 4.77 1.78V6.69z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-black/85 uppercase">
              Company
            </h4>
            <ul className="space-y-2 text-xs text-black/60">
              <li>
                <Link href="/shop" onClick={handleLinkClick} className="transition hover:text-black">
                  {t('footer.shop_all')}
                </Link>
              </li>
              <li>
                <Link href="/news" onClick={handleLinkClick} className="transition hover:text-black">
                  {t('footer.news')}
                </Link>
              </li>
              <li>
                <Link href="/lookbook" onClick={handleLinkClick} className="transition hover:text-black">
                  {t('footer.lookbook')}
                </Link>
              </li>
              <li>
                <Link href="/conscious" onClick={handleLinkClick} className="transition hover:text-black">
                  {t('footer.about_us')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 & 4: Newsletter Subscription */}
          <div className="space-y-3 sm:col-span-2 md:col-span-2">
            <h4 className="text-xs font-semibold tracking-wider text-black/85 uppercase">
              Newsletter
            </h4>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('home.newsletter.placeholder')}
                  required
                  className="w-full flex-1 border border-black/15 bg-white px-3.5 py-2.5 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-black px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-black/85"
                >
                  {subscribed ? t('footer.subscribed') : t('footer.subscribe')}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-black/50">
                {t('footer.newsletter_sub')}
              </p>
            </form>
          </div>
        </div>

        {/* Bottom Bar: Logo & Copyright */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-8 sm:flex-row sm:items-center">
          <Link href="/" onClick={handleLinkClick} aria-label="Sevaya Home">
            <Logo className="h-6 w-auto text-black" />
          </Link>
          <p className="text-xs text-black/50">
            &copy; {new Date().getFullYear()} SEVAYA. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
