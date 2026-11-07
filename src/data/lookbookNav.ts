export interface LookbookLink {
  id: string;
  label: string;
  season?: string;
  href: string;
  badge?: string;
  hidden?: boolean;
}

/**
 * Daftar edisi Lookbook SEVAYA untuk menu navigasi / dropdown.
 * Single source of truth.
 */
export const LOOKBOOK_LINKS: LookbookLink[] = [
  {
    id: 'vol-1',
    label: 'Vol 1: Sevilla Abaya',
    season: "'26",
    href: '/lookbook',
    badge: 'NEW',
  },
];
