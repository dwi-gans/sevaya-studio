import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { publicEnv } from '@/config/env';
import { siteConfig } from '@/config/site';
import { Providers } from '@/components/Providers';
import { ConditionalNav } from '@/components/layout/ConditionalNav';
import { LayoutContent } from '@/components/layout/LayoutContent';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    'Studio busana abaya dan khimar modern premium di Indonesia. Koleksi abaya eksklusif dari bahan cupro silk dan bemberg dengan siluet yang mengalir elegan, nyaman, dan berkelas.',
  keywords: [
    'Abaya',
    'Baju Abaya',
    'Abaya Modern',
    'SEVAYA',
    'Sevaya Studio',
    'Sevaya Abaya',
    'Luxury Abaya',
    'Abaya Indonesia',
    'French Khimar',
    'Cupro Silk Abaya',
    'Abaya Premium',
    'Modest Fashion Indonesia',
    'Tala Abaya',
    'Fina Abaya',
    'Sevilla Abaya',
    'Khimar Modern',
  ],
  authors: [{ name: 'SEVAYA Studio' }],
  creator: 'SEVAYA',
  publisher: 'SEVAYA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: publicEnv.siteUrl,
  },
  openGraph: {
    title: 'SEVAYA — Timeless modestwear for everyday life & comfort',
    description:
      'Koleksi busana abaya dan french khimar modern dengan bahan cupro silk premium. Siluet mengalir, elegan, dan tenang.',
    url: publicEnv.siteUrl,
    siteName: 'SEVAYA Studio',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SEVAYA — Timeless modestwear for everyday life & comfort',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEVAYA — Timeless modestwear for everyday life & comfort',
    description:
      'Studio busana abaya dan french khimar modern premium. Siluet mengalir elegan dan tenang.',
    images: ['/images/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-sv.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" as="image" href="/images/hero_optimized.webp" fetchPriority="high" />
        {/* Google Structured Data / Rich Snippet for E-Commerce Brand */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ClothingStore',
              name: 'SEVAYA',
              alternateName: [
                'Sevaya Studio',
                'Sevaya Abaya',
                'SEVAYA — Timeless modestwear for everyday life & comfort',
              ],
              url: publicEnv.siteUrl,
              logo: `${publicEnv.siteUrl}/images/logo.png`,
              image: `${publicEnv.siteUrl}/images/og-image.jpg`,
              description:
                'Studio busana abaya dan khimar modern premium di Indonesia. Koleksi abaya eksklusif dari bahan cupro silk dan bemberg.',
              currenciesAccepted: 'IDR',
              paymentAccepted: 'Cash, Credit Card, Bank Transfer, QRIS',
              priceRange: '$$',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'ID',
              },
            }),
          }}
        />
      </head>
      <body className="font-body text-body-md flex min-h-screen flex-col bg-[#FFFFFF] text-[#000000] antialiased">
        <Providers>
          <ConditionalNav />
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
