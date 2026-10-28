'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';

const HIDDEN_NAV_PATHS = [
  '/admin',
  '/test-checkout',
  '/checkout',
  '/order-confirmation',
  '/pay',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/profile',
];

export function ConditionalNav() {
  const nextPathname = usePathname();
  const [activePath, setActivePath] = useState(nextPathname || '/');

  // Selalu sinkronkan activePath dengan Next.js pathname & browser popstate (Back/Forward)
  useEffect(() => {
    if (nextPathname) {
      setActivePath(nextPathname);
    }
  }, [nextPathname]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        setActivePath(window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const hide = HIDDEN_NAV_PATHS.some((p) => activePath.startsWith(p));

  if (hide) {
    return null;
  }

  return (
    <>
      <Header />
      <NavigationDrawer />
    </>
  );
}
