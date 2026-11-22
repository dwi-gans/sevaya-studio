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
    id: '1794063420037',
    slug: 'paloma-khiban',
    title: 'Paloma Khiban',
    edition: 'Arabian Exclusive',
    price: 199000,
    originalPrice: 239000,
    image: '/images/catalog/catalog-13.jpg',
    category: 'khimar',
    badge: '',
  },
  {
    id: '1794019430147',
    slug: 'sevilla-cupro-abaya',
    title: 'Sevilla Cupro Abaya',
    edition: 'Cupro Blend',
    price: 899000,
    originalPrice: 899000,
    image: '/images/catalog/catalog-02.jpg',
    category: 'abaya',
    badge: '',
  },
  {
    id: '1793862893527',
    slug: 'alma-cupro-stripes',
    title: 'Alma Cupro Stripes',
    edition: 'Cupro Stripes',
    price: 859000,
    originalPrice: 899000,
    image: '/images/catalog/catalog-01.jpg',
    category: 'abaya',
    badge: 'Trending',
  },
];
