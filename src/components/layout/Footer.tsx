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
    <footer className="w-full border-t border-black/10 bg-white pt-16 pb-12 text-black section--light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-8">
          {/* Column 1: Contact Us */}
          <div className="col-span-2 space-y-3 sm:col-span-1">
            <h4 className="text-xs font-semibold tracking-wider text-black/85 uppercase">
              {t('footer.contact_us') || 'Contact Us'}
            </h4>
            <div className="space-y-2 text-xs text-black/60">
              <p>
                <a
                  href="https://wa.me/6281290007890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-black"
                >
                  WhatsApp: +62 812-9000-7890
                </a>
              </p>
              <p>
                <a href="mailto:care@sevaya.id" className="transition hover:text-black">
                  Email: care@sevaya.id
                </a>
              </p>
              <p>Senin – Jumat 09:00 – 17:00 WIB</p>
              <div className="flex items-center gap-4 pt-1">
                <a
                  href="https://instagram.com/sevayaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-black/80 transition hover:text-black"
                >
                  Instagram
                </a>
                <span className="text-black/20">&bull;</span>
                <a
                  href="https://tiktok.com/@sevayaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-black/80 transition hover:text-black"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Customers */}
          <div className="col-span-1 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-black/85 uppercase">
              {t('footer.customers') || 'Help'}
            </h4>
            <ul className="space-y-2 text-xs text-black/60">
              <li>
                <Link href="/customer/terms-of-service" className="transition hover:text-black">
                  {t('footer.terms') || 'Terms of Service'}
                </Link>
              </li>
              <li>
                <Link href="/customer/faq" className="transition hover:text-black">
                  {t('footer.faq') || 'FAQ'}
                </Link>
              </li>
              <li>
                <Link href="/customer/shipping-information" className="transition hover:text-black">
                  {t('footer.shipping_info') || 'Shipping Information'}
                </Link>
              </li>
              <li>
                <Link href="/customer/returns-exchanges" className="transition hover:text-black">
                  Returns &amp; Exchanges
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="col-span-1 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-black/85 uppercase">
              {t('footer.company') || 'Company'}
            </h4>
            <ul className="space-y-2 text-xs text-black/60">
              <li>
                <Link href="/shop" className="transition hover:text-black">
                  {t('footer.shop_all') || 'Shop All Collections'}
                </Link>
              </li>
              <li>
                <Link href="/news" className="transition hover:text-black">
                  {t('footer.news') || 'News & Journals'}
                </Link>
              </li>
              <li>
                <Link href="/lookbook" className="transition hover:text-black">
                  {t('footer.lookbook') || 'Lookbook'}
                </Link>
              </li>
              <li>
                <Link href="/conscious" className="transition hover:text-black">
                  {t('footer.about_us') || 'About Us'}
                </Link>
              </li>
              <li>
                <Link href="/conscious#pillars" className="transition hover:text-black">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="/conscious#textiles" className="transition hover:text-black">
                  Textile Innovation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 & 5: Newsletter Subscription */}
          <div className="col-span-2 space-y-3 md:col-span-3 lg:col-span-2">
            <h4 className="text-xs font-semibold tracking-wider text-black/85 uppercase">
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
                  className="w-full flex-1 border border-black/15 bg-white px-3.5 py-2.5 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-black px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-black/85"
                >
                  {subscribed ? (t('footer.subscribed') || 'Subscribed ✓') : (t('footer.subscribe') || 'Subscribe')}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-black/50">
                {t('footer.newsletter_sub') || 'By signing up, you agree to our Privacy Policy and Terms of Service.'}
              </p>
            </form>
          </div>
        </div>

        {/* Bottom Bar: Logo & Copyright */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-8 sm:flex-row sm:items-center">
          <Link href="/" aria-label="Sevaya Home">
            <Logo className="h-6 w-auto text-black" />
          </Link>
          <p className="text-xs text-black/50">
            &copy; {new Date().getFullYear()} SEVAYA. {t('footer.rights') || 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
