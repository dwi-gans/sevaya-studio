'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    if (!isAdmin) return;

    const removeBiteshipBlock = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = (node.nodeValue || '').trim().toLowerCase();
        if (text === 'cek ongkir biteship' || text.includes('cek ongkir biteship')) {
          const parent = node.parentElement;
          if (parent && !parent.closest('header') && !parent.closest('nav')) {
            // Naik mencari pembungkus card / section Cek Ongkir Biteship
            let container = parent.closest('section, div[class*="rounded"], div[class*="border"]') as HTMLElement | null;
            if (!container) {
              container = parent.parentElement as HTMLElement | null;
            }
            if (container && !container.querySelector('header') && !container.querySelector('nav')) {
              container.style.setProperty('display', 'none', 'important');
            }
          }
        }
      }
    };

    removeBiteshipBlock();
    const timer = setTimeout(removeBiteshipBlock, 600);
    return () => clearTimeout(timer);
  }, [isAdmin]);

  const isCustomHeader = isAdmin || pathname.startsWith('/profile');

  return (
    <div className={isCustomHeader ? 'flex flex-1 flex-col pt-0' : 'flex flex-1 flex-col pt-16'}>
      {children}
    </div>
  );
}
