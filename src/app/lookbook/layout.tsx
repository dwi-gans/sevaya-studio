import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lookbook — SEVAYA Studio',
  description:
    'Koleksi editorial SEVAYA. Temukan Vol. 1: Sevilla Abaya dan Vol. 2: Alma — dua koleksi yang diracik dengan cermat untuk menemani momen sehari-hari dengan elegan dan penuh karakter.',
};

export default function LookbookLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative w-full max-w-full overflow-x-clip">{children}</div>;
}
