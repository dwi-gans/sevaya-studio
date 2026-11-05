export interface SearchItem {
  id: string;
  slug: string;
  title: string;
  edition: string;
  price: number;
  originalPrice?: number;
  image: string;
  category?: string;
  badge?: string;
}

export const SEARCH_CATALOG: SearchItem[] = [
  {
    id: '1793862893527',
    slug: 'abaya-ramadhan',
    title: 'Abaya Ramadhan',
    edition: 'Edition 2026',
    price: 1350000,
    originalPrice: 1500000,
    image: '/images/catalog/catalog-14.jpg',
    category: 'abaya',
    badge: 'Baru',
  },
  {
    id: '1',
    slug: 'sevia-cupro-abaya',
    title: 'Sevilla Cupro Abaya',
    edition: 'VOL. 1',
    price: 899000,
    originalPrice: 899000,
    image: 'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240873915_1ctz_aacd4e05-f72a-4ad3-918c-52a5ba1c8b1b.jpg',
    category: 'abaya',
  },
  {
    id: '5',
    slug: 'amani-modest-abaya-sage',
    title: 'Paloma Khiban',
    edition: 'Soft Earth Tones',
    price: 239000,
    originalPrice: 1339000,
    image: '/images/catalog/catalog-10.jpg',
    category: 'abaya',
    badge: 'Best Seller',
  },
  {
    id: '6',
    slug: 'tala-french-khimar',
    title: 'Khimar 1',
    edition: 'Cloudmatte Finish',
    price: 789000,
    originalPrice: 789000,
    image: '/images/khiban-banner-v2.jpg',
    category: 'khimar',
    badge: 'Trending',
  },
];
