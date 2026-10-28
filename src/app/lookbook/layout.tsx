import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campaign: Floraison',
  description:
    'Inspired by the life cycle of plants, Floraison reflects on gentle, mindful growth — an invitation to embrace your own rhythm.',
};

export default function LookbookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
