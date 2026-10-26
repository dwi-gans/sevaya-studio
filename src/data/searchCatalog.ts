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
    id: '1',
    slug: 'fina-abaya-stripe-2',
    title: 'Fina Abaya - Stripe Edition 2.0',
    edition: 'Edition 2.0',
    price: 1339000,
    originalPrice: 1489000,
    image: '/images/catalog/catalog-01.jpg',
    category: 'abaya',
    badge: 'Best Seller',
  },
  {
    id: '2',
    slug: 'fina-abaya-1',
    title: 'Tala Abaya - Rhapsody',
    edition: 'Classic Cupro Silk',
    price: 1339000,
    image: '/images/catalog/catalog-03.jpg',
    category: 'abaya',
    badge: 'New',
  },
  {
    id: '3',
    slug: 'tala-abaya-cloudmatte',
    title: 'Sevilla Cupro - Abaya',
    edition: 'Cloudmatte Bemberg',
    price: 1359200,
    originalPrice: 1699000,
    image: '/images/catalog/catalog-18.jpg',
    category: 'abaya',
    badge: 'Sale -20%',
  },
  {
    id: '4',
    slug: 'fina-abaya-stripe-oatmeal',
    title: 'Fina Abaya - Oatmeal Stripe',
    edition: 'Summer Light Stripe',
    price: 1339000,
    image: '/images/catalog/catalog-13.jpg',
    category: 'abaya',
  },
  {
    id: '5',
    slug: 'fina-abaya-stripe-2',
    title: 'Amani Modest Abaya - Sage',
    edition: 'Soft Earth Tones',
    price: 1339000,
    image: '/images/catalog/catalog-05.jpg',
    category: 'abaya',
  },
  {
    id: '6',
    slug: 'tala-abaya-cloudmatte',
    title: 'Tala Abaya - Cloudmatte',
    edition: 'Cloudmatte Finish',
    price: 1359200,
    image: '/images/catalog/catalog-07.jpg',
    category: 'abaya',
    badge: 'Trending',
  },
  {
    id: '7',
    slug: 'fina-abaya-1',
    title: 'Luna Essential Abaya',
    edition: 'Minimalist Silhouette',
    price: 1289000,
    image: '/images/catalog/catalog-10.jpg',
    category: 'abaya',
  },
  {
    id: '8',
    slug: 'fina-abaya-stripe-oatmeal',
    title: 'Nour Luxury Silhouette',
    edition: 'Fluid Floor Sweep',
    price: 1489000,
    image: '/images/catalog/catalog-15.jpg',
    category: 'abaya',
  },
];
