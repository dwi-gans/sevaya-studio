export interface LookbookLink {
  id: string;
  label: string;
  season?: string;
  href: string;
  badge?: string;
}

/**
 * Daftar edisi Lookbook SEVAYA untuk menu navigasi / dropdown.
 * Untuk menambah lookbook baru di navbar, cukup tambahkan objek baru ke array ini:
 * contoh:
 *   {
 *     id: 'vol-2',
 *     label: 'Vol 2: Autumn Serenade',
 *     season: "'26",
 *     href: '/lookbook/vol-2',
 *   }
 */
export const LOOKBOOK_LINKS: LookbookLink[] = [
  {
    id: 'vol-1',
    label: 'Vol 1: Into a New Season',
    season: "'26",
    href: '/lookbook',
    badge: 'NEW',
  },
  {
    id: 'vol-2',
    label: 'Vol 2: Autumn Serenade',
    season: "'26",
    href: '/lookbook/vol-2',
    badge: 'VOL 2',
  },
];
