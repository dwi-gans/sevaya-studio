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
  description: siteConfig.description,
  icons: {
    icon: '/favicon-sv.svg',
    shortcut: '/favicon-sv.svg',
    apple: '/images/logo.png',
  },
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
        <link rel="preload" as="image" href="/images/hero_optimized.jpg" fetchPriority="high" />
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
