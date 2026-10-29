import { IconName } from '@/components/ui/Icon';

export type AdminTab =
  | 'orders'
  | 'catalog'
  | 'section-home'
  | 'section-news'
  | 'section-lookbook'
  | 'section-conscious'
  | 'media'
  | 'settings';

export type ImagePickerTarget =
  | 'product'
  | `swatch-${number}`
  | 'hero'
  | 'spotlight-0'
  | 'spotlight-1'
  | 'textiles'
  | 'journal-0'
  | 'journal-1'
  | `lookbook-${number}`
  | `lbpage-${string}`
  | 'conscious-hero'
  | 'conscious-bemberg'
  | 'conscious-tencel'
  | 'conscious-linen'
  | 'conscious-modal'
  | 'article'
  | 'article-add-image'
  | `article-image-${number}`
  | null;

export interface AdminNavItem {
  id: AdminTab;
  label: string;
  icon: IconName;
  countBadge?: string | number;
}

export interface AdminNavGroup {
  groupTitle: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    groupTitle: 'Transaksi & Logistik',
    items: [
      { id: 'orders', label: 'Pesanan & Resi', icon: 'receipt_long', countBadge: 12 },
      { id: 'catalog', label: 'Katalog Koleksi Abaya', icon: 'checkroom', countBadge: 4 },
    ],
  },
  {
    groupTitle: 'Editorial & Storefront',
    items: [
      { id: 'section-home', label: 'Beranda (Homepage)', icon: 'view_quilt' },
      { id: 'section-news', label: 'News & Editorial (Jurnal)', icon: 'newspaper', countBadge: 6 },
      { id: 'section-lookbook', label: 'Lookbook Studio', icon: 'photo_library' },
      { id: 'section-conscious', label: 'Tentang Toko (About)', icon: 'auto_stories' },
    ],
  },
  {
    groupTitle: 'Aset Digital & Sistem',
    items: [
      { id: 'media', label: 'Galeri Cloud Media', icon: 'perm_media', countBadge: '1.4k' },
      { id: 'settings', label: 'Pengaturan Studio & CDN', icon: 'tune' },
    ],
  },
];

export const ADMIN_NAV_ITEMS: { id: AdminTab; label: string; icon: IconName }[] = ADMIN_NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => ({ id: i.id, label: i.label, icon: i.icon }))
);

export const AVAILABLE_CATALOG_IMAGES = Array.from({ length: 18 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return `/images/catalog/catalog-${num}.jpg`;
});

export interface MasterAsset {
  filename: string;
  collection: string;
  size: string;
  res: string;
  format: string;
  date: string;
  cdnUrl: string;
  src: string;
  badge: 'LIVE PDP' | 'LOOKBOOK' | 'DETAIL PDP' | 'COLLECTION' | 'DRAFT';
  isMaster?: boolean;
  category: 'all' | 'plum' | 'cuff' | 'outdoor';
}

export const MASTER_CATALOG_ASSETS: MasterAsset[] = [
  {
    filename: 'catalog-01.jpg',
    collection: 'Abaya Plum Riverside Silk',
    size: '3.8 MB',
    res: '3840 × 5120',
    format: '4K RAW Master',
    date: '14 Feb 2025 • 16:42 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-01.jpg',
    src: '/images/catalog/catalog-01.jpg',
    badge: 'LIVE PDP',
    isMaster: true,
    category: 'plum',
  },
  {
    filename: 'catalog-02.jpg',
    collection: 'Siluet Plum Full Frontal',
    size: '4.1 MB',
    res: '3840 × 5120',
    format: 'WebP 4K',
    date: '14 Feb 2025 • 16:38 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-02.jpg',
    src: '/images/catalog/catalog-02.jpg',
    badge: 'LIVE PDP',
    category: 'plum',
  },
  {
    filename: 'catalog-03.jpg',
    collection: 'Koleksi Linen Plum & Taupe',
    size: '3.4 MB',
    res: '3840 × 5120',
    format: 'JPG High-Res',
    date: '14 Feb 2025 • 16:35 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-03.jpg',
    src: '/images/catalog/catalog-03.jpg',
    badge: 'LIVE PDP',
    category: 'plum',
  },
  {
    filename: 'catalog-04.jpg',
    collection: 'Pose Dinamis Hijab Angin',
    size: '2.9 MB',
    res: '3840 × 5120',
    format: 'JPG High-Res',
    date: '14 Feb 2025 • 16:30 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-04.jpg',
    src: '/images/catalog/catalog-04.jpg',
    badge: 'LOOKBOOK',
    category: 'outdoor',
  },
  {
    filename: 'catalog-05.jpg',
    collection: 'Siluet Punggung & Draping',
    size: '3.1 MB',
    res: '3840 × 5120',
    format: 'WebP 4K',
    date: '14 Feb 2025 • 16:22 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-05.jpg',
    src: '/images/catalog/catalog-05.jpg',
    badge: 'LIVE PDP',
    category: 'plum',
  },
  {
    filename: 'catalog-06.jpg',
    collection: 'Detail Manset & Pin Sevaya Emas',
    size: '2.6 MB',
    res: '3840 × 5120',
    format: 'RAW Master',
    date: '14 Feb 2025 • 16:15 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-06.jpg',
    src: '/images/catalog/catalog-06.jpg',
    badge: 'DETAIL PDP',
    category: 'cuff',
  },
  {
    filename: 'catalog-07.jpg',
    collection: 'Tekstur Kain & Draping Dada',
    size: '3.3 MB',
    res: '3840 × 5120',
    format: 'JPG High-Res',
    date: '14 Feb 2025 • 16:10 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-07.jpg',
    src: '/images/catalog/catalog-07.jpg',
    badge: 'LIVE PDP',
    category: 'cuff',
  },
  {
    filename: 'catalog-08.jpg',
    collection: 'Perspektif Belakang Tepi Sungai',
    size: '3.7 MB',
    res: '3840 × 5120',
    format: 'WebP 4K',
    date: '14 Feb 2025 • 16:04 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-08.jpg',
    src: '/images/catalog/catalog-08.jpg',
    badge: 'LIVE PDP',
    category: 'outdoor',
  },
  {
    filename: 'catalog-09.jpg',
    collection: 'Editorial Naratif Jurnal',
    size: '2.8 MB',
    res: '3840 × 5120',
    format: 'JPG High-Res',
    date: '14 Feb 2025 • 15:58 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-09.jpg',
    src: '/images/catalog/catalog-09.jpg',
    badge: 'LOOKBOOK',
    category: 'outdoor',
  },
  {
    filename: 'catalog-10.jpg',
    collection: 'Potret Wajah & French Khimar',
    size: '3.0 MB',
    res: '3840 × 5120',
    format: 'WebP 4K',
    date: '14 Feb 2025 • 15:45 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-10.jpg',
    src: '/images/catalog/catalog-10.jpg',
    badge: 'LIVE PDP',
    category: 'plum',
  },
  {
    filename: 'catalog-11.jpg',
    collection: 'Editorial Padang Ilalang',
    size: '4.3 MB',
    res: '3840 × 5120',
    format: 'JPG High-Res',
    date: '14 Feb 2025 • 15:30 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-11.jpg',
    src: '/images/catalog/catalog-11.jpg',
    badge: 'DRAFT',
    category: 'outdoor',
  },
  {
    filename: 'catalog-12.jpg',
    collection: 'Duo Palet Cream & Sage',
    size: '3.6 MB',
    res: '3840 × 5120',
    format: 'WebP 4K',
    date: '14 Feb 2025 • 15:10 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-12.jpg',
    src: '/images/catalog/catalog-12.jpg',
    badge: 'COLLECTION',
    category: 'plum',
  },
  {
    filename: 'catalog-13.jpg',
    collection: 'Detail Kancing & Kerah Shanghai',
    size: '2.7 MB',
    res: '3840 × 5120',
    format: 'RAW Master',
    date: '14 Feb 2025 • 14:55 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-13.jpg',
    src: '/images/catalog/catalog-13.jpg',
    badge: 'DETAIL PDP',
    category: 'cuff',
  },
  {
    filename: 'catalog-14.jpg',
    collection: 'Siluet Ombak Sutra Bemberg',
    size: '3.9 MB',
    res: '3840 × 5120',
    format: 'WebP 4K',
    date: '14 Feb 2025 • 14:40 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-14.jpg',
    src: '/images/catalog/catalog-14.jpg',
    badge: 'COLLECTION',
    category: 'plum',
  },
  {
    filename: 'catalog-15.jpg',
    collection: 'Tekstur Anyaman Khimar',
    size: '3.1 MB',
    res: '3840 × 5120',
    format: 'JPG High-Res',
    date: '14 Feb 2025 • 14:25 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-15.jpg',
    src: '/images/catalog/catalog-15.jpg',
    badge: 'DETAIL PDP',
    category: 'cuff',
  },
  {
    filename: 'catalog-16.jpg',
    collection: 'Pencahayaan Twilight Studio',
    size: '3.5 MB',
    res: '3840 × 5120',
    format: 'JPG High-Res',
    date: '14 Feb 2025 • 14:10 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-16.jpg',
    src: '/images/catalog/catalog-16.jpg',
    badge: 'LOOKBOOK',
    category: 'outdoor',
  },
  {
    filename: 'catalog-17.jpg',
    collection: 'Draping Lebar Siluet Kaftan',
    size: '4.0 MB',
    res: '3840 × 5120',
    format: 'WebP 4K',
    date: '14 Feb 2025 • 13:50 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-17.jpg',
    src: '/images/catalog/catalog-17.jpg',
    badge: 'COLLECTION',
    category: 'plum',
  },
  {
    filename: 'catalog-18.jpg',
    collection: 'Potret Close-up Pasmina',
    size: '2.9 MB',
    res: '3840 × 5120',
    format: 'RAW Master',
    date: '14 Feb 2025 • 13:30 WIB',
    cdnUrl: 'https://cdn.sevaya.id/storage/v1/object/public/katalog/catalog-18.jpg',
    src: '/images/catalog/catalog-18.jpg',
    badge: 'DRAFT',
    category: 'cuff',
  },
];
