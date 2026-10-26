'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';

const HIDDEN_NAV_PATHS = [
  '/admin',
  '/test-checkout',
  '/checkout',
  '/order-confirmation',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/profile',
];

export function ConditionalNav() {
  const pathname = usePathname();
  const hide = HIDDEN_NAV_PATHS.some((p) => pathname.startsWith(p));
  if (hide) return null;
  return (
    <>
      <Header />
      <NavigationDrawer />
    </>
  );
}
