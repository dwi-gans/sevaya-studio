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

  return (
    <footer className="w-full border-t border-[#E5DDD5] bg-[#FAF8F5] pt-14 pb-12 text-[#141312]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-8">
          {/* Column 1: Contact Us (Full width on mobile, 1 col on tablet/desktop) */}
          <div className="col-span-2 space-y-3 sm:col-span-1">
            <h4 className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
              {t('footer.contact_us') || 'Contact Us'}
            </h4>
            <div className="space-y-2 text-xs text-[#554C48]">
              <p>
                <a
                  href="https://wa.me/6281290007890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#141312]"
                >
                  WhatsApp: +62 812-9000-7890
                </a>
              </p>
              <p>
                <a href="mailto:care@sevaya.id" className="transition hover:text-[#141312]">
                  Email: care@sevaya.id
                </a>
              </p>
              <p>Senin – Jumat 09:00 – 17:00 WIB</p>
              <div className="flex items-center gap-4 pt-1">
                <a
                  href="https://instagram.com/sevayaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#141312] transition hover:opacity-70"
                >
                  Instagram
                </a>
                <span className="text-[#D0C5BD]">&bull;</span>
                <a
                  href="https://tiktok.com/@sevayaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#141312] transition hover:opacity-70"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Customers (1 col side-by-side on mobile) */}
          <div className="col-span-1 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
              {t('footer.customers') || 'Customers'}
            </h4>
            <ul className="space-y-2 text-xs text-[#554C48]">
              <li>
                <Link href="/conscious" className="transition hover:text-[#141312]">
                  {t('footer.terms') || 'Terms of Service'}
                </Link>
              </li>
              <li>
                <Link href="/conscious" className="transition hover:text-[#141312]">
                  {t('footer.return_policy') || 'Return Policy'}
                </Link>
              </li>
              <li>
                <Link href="/conscious" className="transition hover:text-[#141312]">
                  {t('footer.faq') || 'FAQ'}
                </Link>
              </li>
              <li>
                <Link href="/conscious" className="transition hover:text-[#141312]">
                  Return and Exchanges
                </Link>
              </li>
              <li>
                <Link href="/conscious" className="transition hover:text-[#141312]">
                  {t('footer.shipping_info') || 'Shipping Information'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company (1 col side-by-side on mobile) */}
          <div className="col-span-1 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
              {t('footer.company') || 'Company'}
            </h4>
            <ul className="space-y-2 text-xs text-[#554C48]">
              <li>
                <Link href="/shop" className="transition hover:text-[#141312]">
                  {t('footer.shop_all') || 'Shop All Collections'}
                </Link>
              </li>
              <li>
                <Link href="/news" className="transition hover:text-[#141312]">
                  {t('footer.news') || 'News & Journals'}
                </Link>
              </li>
              <li>
                <Link href="/lookbook" className="transition hover:text-[#141312]">
                  {t('footer.lookbook') || 'Lookbook'}
                </Link>
              </li>
              <li>
                <Link href="/conscious" className="transition hover:text-[#141312]">
                  {t('footer.about_us') || 'About Us'}
                </Link>
              </li>
              <li>
                <Link href="/conscious#pillars" className="transition hover:text-[#141312]">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="/conscious#textiles" className="transition hover:text-[#141312]">
                  Textile Innovation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 & 5: Newsletter Subscription (Full width on mobile/tablet, 2 cols on desktop) */}
          <div className="col-span-2 space-y-3 md:col-span-3 lg:col-span-2">
            <h4 className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
              {t('footer.newsletter_title') || 'Get the latest news from us'}
            </h4>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full flex-1 border border-[#D0C5BD] bg-white px-3.5 py-2.5 text-xs text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 border border-[#141312] bg-[#141312] px-6 py-2.5 text-xs font-medium tracking-wider text-white uppercase transition hover:bg-[#322D29]"
                >
                  {subscribed ? (t('footer.subscribed') || 'Subscribed ✓') : (t('footer.subscribe') || 'Subscribe')}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[#7C726E]">
                {t('footer.newsletter_sub') || 'By signing up, you agree to our Privacy Policy and Terms of Service.'}
              </p>
            </form>
          </div>
        </div>

        {/* Bottom Bar: Logo & Copyright */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[#E5DDD5]/70 pt-8 sm:flex-row sm:items-center">
          <Link href="/" aria-label="Sevaya Home">
            <Logo className="h-6 w-auto text-[#141312]" />
          </Link>
          <p className="text-xs text-[#7C726E]">
            &copy; {new Date().getFullYear()} SEVAYA. {t('footer.rights') || 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
