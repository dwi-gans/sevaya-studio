'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { BiteshipSimulatorDashboard } from '@/components/admin/BiteshipSimulatorDashboard';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';
import { Icon, IconName } from '@/components/ui/Icon';
import { useToast } from '@/context/ToastContext';
import {
  getDbProducts,
  createDbProduct,
  updateDbProduct,
  deleteDbProduct,
  DbProduct,
  ProductSwatch,
  getSiteSections,
  getCachedSiteSections,
  saveSiteSections,
  SiteSectionsConfig,
  DEFAULT_SITE_SECTIONS,
  uploadFileToStorage,
  listUploadedFiles,
  StorageFile,
} from '@/integrations/supabase';
import { Article, ARTICLE_CATEGORIES } from '@/integrations/supabase/articles';

// Available built-in high-resolution catalog photos for quick picking
const AVAILABLE_CATALOG_IMAGES = Array.from({ length: 18 }, (_, i) => {
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

const MASTER_CATALOG_ASSETS: MasterAsset[] = [
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

type AdminTab =
  | 'orders'
  | 'catalog'
  | 'section-home'
  | 'section-news'
  | 'section-lookbook'
  | 'section-conscious'
  | 'media'
  | 'settings';

type ImagePickerTarget =
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

interface AdminNavItem {
  id: AdminTab;
  label: string;
  icon: IconName;
  countBadge?: string | number;
}

interface AdminNavGroup {
  groupTitle: string;
  items: AdminNavItem[];
}

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
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

const ADMIN_NAV_ITEMS: { id: AdminTab; label: string; icon: IconName }[] = ADMIN_NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => ({ id: i.id, label: i.label, icon: i.icon }))
);

const emptySubscribe = () => () => {};

export default function AdminPage() {
  const { showToast } = useToast();

  // Hydration-safe mounting check to prevent any SSR mismatch
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Secure server-side admin session check
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch('/api/admin/auth');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated) {
            setIsAuthenticated(true);
          }
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setAuthChecked(true);
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);


  // ── Admin Active Tab & Mobile Drawer (Persisted across refreshes) ──
  const [activeTab, setActiveTabState] = useState<AdminTab>('orders');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Restore persisted sidebar state on client mount
  useEffect(() => {
    try {
      const savedSidebar = localStorage.getItem('sevaya_admin_sidebar_open');
      if (savedSidebar !== null) {
        setIsSidebarOpen(savedSidebar === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sevaya_admin_sidebar_open', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Restore persisted tab on client mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const validTabs: AdminTab[] = [
        'orders',
        'catalog',
        'section-home',
        'section-news',
        'section-lookbook',
        'section-conscious',
        'media',
        'settings',
      ];
      if (tabParam === 'storage') {
        setActiveTabState('settings');
        return;
      }
      if (tabParam && (validTabs as string[]).includes(tabParam)) {
        setActiveTabState(tabParam as AdminTab);
        return;
      }
      const saved = localStorage.getItem('sevaya_admin_tab');
      if (saved === 'storage') {
        setActiveTabState('settings');
        return;
      }
      if (saved && (validTabs as string[]).includes(saved)) {
        setActiveTabState(saved as AdminTab);
      }
    } catch {
      // ignore
    }
  }, []);

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('sevaya_admin_tab', tab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  // ── Data State ──
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [sections, setSections] = useState<SiteSectionsConfig>(getCachedSiteSections);
  const [mediaFiles, setMediaFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── News & Articles State ──
  const [articles, setArticles] = useState<Article[]>([]);
  const [newsFilterCategory, setNewsFilterCategory] = useState('All Stories');
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState<{
    title: string;
    slug: string;
    category: string;
    date: string;
    readTime: string;
    excerpt: string;
    content: string;
    image: string;
    images: string[];
    featured: boolean;
  }>({
    title: '',
    slug: '',
    category: 'Journal',
    date: '',
    readTime: '4 min read',
    excerpt: '',
    content: '',
    image: '/images/catalog/catalog-11.jpg',
    images: [],
    featured: false,
  });

  // ── Media Gallery Interactive State ──
  const [selectedAsset, setSelectedAsset] = useState<MasterAsset>(MASTER_CATALOG_ASSETS[0]!);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [mediaViewMode, setMediaViewMode] = useState<'grid' | 'table'>('grid');
  const [mediaCategory, setMediaCategory] = useState<'all' | 'plum' | 'cuff' | 'outdoor'>('all');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCollection, setUploadCollection] = useState('Abaya Plum Riverside Silk (Spring 2025)');

  // ── Product Modal (Create / Edit) ──
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [productForm, setProductForm] = useState<{
    title: string;
    slug: string;
    edition: string;
    price: number;
    original_price: number;
    badge: string;
    image: string;
    inStock: boolean;
    hidden: boolean;
    swatches: ProductSwatch[];
  }>({
    title: '',
    slug: '',
    edition: '',
    price: 1339000,
    original_price: 1489000,
    badge: '',
    image: '/images/catalog/catalog-01.jpg',
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-01.jpg' },
      { name: 'Garnet', color: '#6B2D2B', image: '/images/catalog/catalog-06.jpg' },
    ],
  });

  // ── Image Picker Modal State ──
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<ImagePickerTarget>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    // Immediately load cached sections so there is 0ms delay / zero flash of old default images
    setSections(getCachedSiteSections());

    Promise.all([getDbProducts(), getSiteSections()])
      .then(([dbProds, siteSections]) => {
        if (!isMounted) return;
        setProducts(dbProds);
        setSections(siteSections);
      })
      .catch(() => {
        showToast('Gagal memuat data dari Supabase');
      });

    listUploadedFiles()
      .then((storageFiles) => {
        if (isMounted) setMediaFiles(storageFiles);
      })
      .catch(() => {});

    // Load articles from Supabase
    fetch('/api/articles?admin=true')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && Array.isArray(data.articles)) {
          setArticles(data.articles);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, showToast]);

  // ── Admin Login Handler (Server-Verified & HttpOnly Session) ──
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminPassword('');
        showToast('Login Admin Berhasil. Selamat datang di Sevaya Studio.');
      } else {
        setAuthError(data.error || 'Username atau password admin salah.');
        showToast('Kredensial admin tidak valid.');
      }
    } catch {
      setAuthError('Gagal menghubungi server untuk autentikasi admin.');
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setAdminUsername('');
    setAdminPassword('');
    showToast('Admin logged out.');
  };

  // ── Product CRUD Handlers ──
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      slug: '',
      edition: '',
      price: 1350000,
      original_price: 1500000,
      badge: 'Baru',
      image: '/images/catalog/catalog-01.jpg',
      inStock: true,
      hidden: false,
      swatches: [
        { name: 'Obsidian Black', color: '#1A1A1A', image: '/images/catalog/catalog-01.jpg' },
        { name: 'Garnet Maroon', color: '#6B2D2B', image: '/images/catalog/catalog-06.jpg' },
        { name: 'Caramel Dune', color: '#C68B59', image: '/images/catalog/catalog-08.jpg' },
        { name: 'Peach Bloom', color: '#E5A894', image: '/images/catalog/catalog-10.jpg' },
      ],
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: DbProduct) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      slug: product.slug,
      edition: product.edition || '',
      price: product.price,
      original_price: product.original_price || product.price,
      badge: product.badge || '',
      image: product.image,
      inStock: product.inStock !== false,
      hidden: product.hidden === true,
      swatches:
        product.swatches && product.swatches.length > 0
          ? product.swatches.map((s) => ({
              name: s.name,
              color: s.color,
              image: s.image || product.image,
            }))
          : [
              { name: 'Black', color: '#000000', image: product.image },
              { name: 'Garnet', color: '#6B2D2B', image: product.image },
            ],
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) {
      showToast('Harap isi judul dan harga produk');
      return;
    }

    const slug =
      productForm.slug.trim() ||
      productForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    setIsLoading(true);
    try {
      if (editingProduct) {
        // Update
        const updated = await updateDbProduct(editingProduct.id, {
          ...productForm,
          slug,
        });
        if (updated) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
          showToast(`Produk "${updated.title}" berhasil diperbarui!`);
        }
      } else {
        // Create
        const created = await createDbProduct({
          ...productForm,
          slug,
        });
        setProducts((prev) => [created, ...prev]);
        showToast(`Produk "${created.title}" berhasil ditambahkan!`);
      }
      setIsProductModalOpen(false);
    } catch {
      showToast('Gagal menyimpan produk ke Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string | number, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus produk "${title}"?`)) return;

    setIsLoading(true);
    try {
      await deleteDbProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(`Produk "${title}" telah dihapus.`);
    } catch {
      showToast('Gagal menghapus produk');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Swatch Builder Handlers ──
  const handleAddSwatch = () => {
    setProductForm((prev) => ({
      ...prev,
      swatches: [
        ...prev.swatches,
        {
          name: `Warna #${prev.swatches.length + 1}`,
          color: 'rgba(0,0,0,0.64)',
          image: prev.image || '/images/catalog/catalog-01.jpg',
        },
      ],
    }));
  };

  const handleRemoveSwatch = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      swatches: prev.swatches.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateSwatch = (index: number, field: 'name' | 'color' | 'image', val: string) => {
    setProductForm((prev) => {
      const next = [...prev.swatches];
      if (next[index]) {
        next[index] = { ...next[index]!, [field]: val };
      }
      return { ...prev, swatches: next };
    });
  };

  // ── Apply selected or uploaded image to target ──
  const applyImageToTarget = (target: ImagePickerTarget, urlOrPath: string) => {
    if (!target) return;

    if (target === 'product') {
      setProductForm((prev) => ({ ...prev, image: urlOrPath }));
    } else if (target.startsWith('swatch-')) {
      const swatchIdx = parseInt(target.replace('swatch-', ''), 10);
      handleUpdateSwatch(swatchIdx, 'image', urlOrPath);
    } else if (target === 'hero') {
      setSections((prev) => {
        const next = { ...prev, hero: { ...prev.hero, image: urlOrPath } };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'spotlight-0') {
      setSections((prev) => {
        const nextSpotlight = [...prev.spotlight];
        if (nextSpotlight[0]) nextSpotlight[0] = { ...nextSpotlight[0], image: urlOrPath };
        const next = { ...prev, spotlight: nextSpotlight };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'spotlight-1') {
      setSections((prev) => {
        const nextSpotlight = [...prev.spotlight];
        if (nextSpotlight[1]) nextSpotlight[1] = { ...nextSpotlight[1], image: urlOrPath };
        const next = { ...prev, spotlight: nextSpotlight };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'textiles') {
      setSections((prev) => {
        const next = {
          ...prev,
          missionTextiles: { ...prev.missionTextiles, image: urlOrPath },
        };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'journal-0') {
      setSections((prev) => {
        const nextJournal = [...prev.journal];
        if (nextJournal[0]) nextJournal[0] = { ...nextJournal[0], image: urlOrPath };
        const next = { ...prev, journal: nextJournal };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'journal-1') {
      setSections((prev) => {
        const nextJournal = [...prev.journal];
        if (nextJournal[1]) nextJournal[1] = { ...nextJournal[1], image: urlOrPath };
        const next = { ...prev, journal: nextJournal };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target.startsWith('lookbook-')) {
      const idx = parseInt(target.replace('lookbook-', ''), 10);
      setSections((prev) => {
        const nextLb = [...prev.lookbook];
        if (nextLb[idx]) nextLb[idx] = { ...nextLb[idx]!, image: urlOrPath };
        const next = { ...prev, lookbook: nextLb };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target.startsWith('lbpage-')) {
      const key = target.replace('lbpage-', '');
      setSections((prev) => {
        const next = {
          ...prev,
          lookbookPage: {
            ...(prev.lookbookPage || DEFAULT_SITE_SECTIONS.lookbookPage!),
            [key]: urlOrPath,
          },
        };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'conscious-hero') {
      setSections((prev) => {
        const next = {
          ...prev,
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            heroImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'conscious-bemberg') {
      setSections((prev) => {
        const next = {
          ...prev,
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            bembergImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'conscious-tencel') {
      setSections((prev) => {
        const next = {
          ...prev,
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            tencelImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'conscious-linen') {
      setSections((prev) => {
        const next = {
          ...prev,
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            linenImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'conscious-modal') {
      setSections((prev) => {
        const next = {
          ...prev,
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            modalImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        showToast('Foto tersimpan otomatis!');
        return next;
      });
    } else if (target === 'article') {
      setArticleForm((prev) => ({ ...prev, image: urlOrPath }));
    } else if (target === 'article-add-image') {
      setArticleForm((prev) => ({ ...prev, images: [...prev.images, urlOrPath] }));
      showToast('Foto isi artikel ditambahkan!');
    } else if (target.startsWith('article-image-')) {
      const idx = parseInt(target.replace('article-image-', ''), 10);
      setArticleForm((prev) => {
        const next = [...prev.images];
        if (next[idx] !== undefined) {
          next[idx] = urlOrPath;
        }
        return { ...prev, images: next };
      });
      showToast('Foto isi artikel diperbarui!');
    }
  };

  // ── News & Articles Handlers ──
  const handleOpenCreateArticleModal = () => {
    setEditingArticle(null);
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setArticleForm({
      title: '',
      slug: '',
      category: 'Journal',
      date: today,
      readTime: '4 min read',
      excerpt: '',
      content: '',
      image: '/images/catalog/catalog-11.jpg',
      images: [],
      featured: false,
    });
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticleModal = (art: Article) => {
    setEditingArticle(art);
    setArticleForm({
      title: art.title,
      slug: art.slug,
      category: art.category,
      date: art.date,
      readTime: art.read_time,
      excerpt: art.excerpt,
      content: Array.isArray(art.content) ? art.content.join('\n\n') : ((art.content as unknown as string) || ''),
      image: art.image || '/images/catalog/catalog-11.jpg',
      featured: Boolean(art.featured),
      images:
        Array.isArray(art.images) && art.images.length > 0
          ? art.images
          : ['/images/catalog/catalog-12.jpg'],
    });
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title.trim()) {
      showToast('Judul artikel wajib diisi!');
      return;
    }
    const paragraphs = articleForm.content
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);
    setIsLoading(true);
    try {
      if (editingArticle) {
        const res = await fetch(`/api/articles/${editingArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: articleForm.title.trim(),
            slug: articleForm.slug.trim() || editingArticle.slug,
            category: articleForm.category,
            date: articleForm.date || editingArticle.date,
            read_time: articleForm.readTime || '3 min read',
            excerpt: articleForm.excerpt.trim(),
            content: paragraphs.length > 0 ? paragraphs : editingArticle.content,
            image: articleForm.image,
            images: articleForm.images,
            featured: articleForm.featured,
          }),
        });
        const data = await res.json();
        if (res.ok && data.article) {
          setArticles((prev) => prev.map((a) => (a.id === editingArticle.id ? data.article : a)));
          showToast(`Artikel "${articleForm.title}" berhasil diperbarui!`);
        } else {
          showToast(data.error || 'Gagal memperbarui artikel');
        }
      } else {
        const res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: articleForm.title.trim(),
            slug: articleForm.slug.trim(),
            category: articleForm.category,
            date: articleForm.date,
            read_time: articleForm.readTime || '4 min read',
            excerpt: articleForm.excerpt.trim(),
            content: paragraphs.length > 0 ? paragraphs : [articleForm.excerpt.trim()],
            image: articleForm.image,
            images: articleForm.images,
            featured: articleForm.featured,
            published: true,
          }),
        });
        const data = await res.json();
        if (res.ok && data.article) {
          setArticles((prev) =>
            articleForm.featured
              ? [data.article, ...prev.map((a) => ({ ...a, featured: false }))]
              : [data.article, ...prev]
          );
          showToast(`Artikel baru "${articleForm.title}" berhasil diterbitkan!`);
        } else {
          showToast(data.error || 'Gagal membuat artikel');
        }
      }
      setIsArticleModalOpen(false);
    } catch {
      showToast('Gagal menyimpan artikel ke Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus artikel "${title}"?`)) return;
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        showToast(`Artikel "${title}" telah dihapus.`);
      } else {
        showToast('Gagal menghapus artikel');
      }
    } catch {
      showToast('Gagal menghapus artikel');
    }
  };

  const handleToggleFeaturedArticle = async (id: string) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;
    const newFeatured = !article.featured;
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: newFeatured }),
      });
      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => ({
            ...a,
            featured: a.id === id ? newFeatured : newFeatured ? false : a.featured,
          }))
        );
        showToast('Status Featured artikel diperbarui!');
      }
    } catch {
      showToast('Gagal memperbarui status featured');
    }
  };

  // ── Direct Image Upload Handler ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadFileToStorage(file);
      showToast('Gambar berhasil diunggah ke Supabase Cloud!');

      applyImageToTarget(imagePickerTarget, publicUrl);

      // Refresh media files
      const updatedFiles = await listUploadedFiles();
      setMediaFiles(updatedFiles);
      setIsImagePickerOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah file';
      showToast(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectPredefinedImage = (imagePath: string) => {
    applyImageToTarget(imagePickerTarget, imagePath);
    setIsImagePickerOpen(false);
    showToast('Gambar berhasil dipilih!');
  };

  // ── Save Sections Handler ──
    // Auto-save sections whenever user edits text or config
  const isFirstSectionsRender = useRef(true);
  useEffect(() => {
    if (isFirstSectionsRender.current) {
      isFirstSectionsRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveSiteSections(sections);
    }, 1000);
    return () => clearTimeout(timer);
  }, [sections]);

  const handleSaveSections = async (sectionName = 'Section') => {
    setIsLoading(true);
    try {
      const success = await saveSiteSections(sections);
      if (success) {
        showToast(`Konfigurasi & gambar ${sectionName} berhasil disimpan ke Supabase Cloud!`);
      } else {
        showToast('Gagal menyimpan section ke Supabase');
      }
    } catch {
      showToast('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.edition && p.edition.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // ──────────────────────────────────────────────────────────
  
  // ──────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────
  // 0. AUTH HYDRATION CHECK (Exact server/client match on initial tick)
  // ──────────────────────────────────────────────────────────
  if (!isClient || !authChecked) {
    return (
      <div className="min-h-screen w-full bg-[#f9f9f8] text-[#1a1c1c] antialiased flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1a1c1c] border-t-transparent" />
          <span className="font-mono text-xs tracking-wider text-[#514346] uppercase">
            Memuat Sevaya Studio...
          </span>
        </div>
      </div>
    );
  }
  // 1. ADMIN LOGIN GATE (MATCHING USER PROFILE MINIMAL & ELEGANT DESIGN)
  // -------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white font-body text-black selection:bg-black/5 flex flex-col justify-between">
        {/* Top Header (Matching Profile Page Minimal Bar) */}
        <header className="sticky top-0 z-30 border-b border-black/15 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex items-center transition hover:opacity-85"
              aria-label="Sevaya Homepage"
              title="SEVAYA"
            >
              <Logo className="h-6 sm:h-7 w-auto" />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-3.5 py-1 text-xs font-medium text-black/70 transition hover:border-black hover:text-black hover:bg-black/5"
            >
              <Icon name="arrow_back" size={14} />
              <span className="hidden sm:inline">Kembali ke Beranda Publik</span>
              <span className="sm:hidden">Kembali</span>
            </Link>
          </div>
        </header>

        {/* Main Content Card */}
        <main className="mx-auto w-full max-w-lg flex-1 px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
          <div className="flex items-center gap-6 sm:gap-8 pb-6 justify-center">
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold tracking-tight text-black">
              Admin Console
            </h2>
          </div>

          <div className="rounded-2xl border border-black/15 bg-white p-6 sm:p-8 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-5">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>Sistem Internal Terenkripsi</span>
                </span>
              </div>
              <h1 className="font-headline text-lg sm:text-xl font-semibold text-black">
                Otorisasi Akses Pengelola
              </h1>
              <p className="text-xs sm:text-sm text-black/70 mt-1 leading-relaxed">
                Area khusus pengelolaan operasional pesanan, katalog koleksi abaya, dan editorial konten.
              </p>
            </div>

            {authError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                <Icon name="error" size={16} className="shrink-0 text-red-600 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold tracking-wider text-black uppercase"
                  htmlFor="admin-user"
                >
                  ID Operator / Username
                </label>
                <div className="relative flex items-center rounded-xl border border-black/15 bg-white transition focus-within:border-black focus-within:bg-white focus-within:ring-1 focus-within:ring-[#000000]/15">
                  <Icon
                    name="person"
                    size={18}
                    className="pointer-events-none absolute left-3.5 text-black/50"
                  />
                  <input
                    id="admin-user"
                    type="text"
                    required
                    autoFocus
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    className="h-11 w-full bg-transparent pl-10 pr-4 text-xs sm:text-sm text-black placeholder:text-black/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold tracking-wider text-black uppercase"
                  htmlFor="admin-pass"
                >
                  Kata Sandi Keamanan
                </label>
                <div className="relative flex items-center rounded-xl border border-black/15 bg-white transition focus-within:border-black focus-within:bg-white focus-within:ring-1 focus-within:ring-[#000000]/15">
                  <Icon
                    name="lock"
                    size={18}
                    className="pointer-events-none absolute left-3.5 text-black/50"
                  />
                  <input
                    id="admin-pass"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-11 w-full bg-transparent pl-10 pr-4 text-xs sm:text-sm text-black placeholder:text-black/50 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-xs font-semibold tracking-wider text-white uppercase shadow-xs transition hover:bg-black/85 active:scale-[0.99] cursor-pointer"
              >
                <Icon name="lock" size={14} />
                <span>Buka Konsol Studio</span>
                <Icon name="arrow_forward" size={14} />
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="font-mono text-[11px] text-black/50 uppercase tracking-wider">
              SEVAYA STUDIO &bull; INTERNAL MANAGEMENT CONSOLE
            </p>
          </div>
        </main>
      </div>
    );
  }

  const activeTabMeta =
    ADMIN_NAV_ITEMS.find((item) => item.id === activeTab) ?? {
      id: 'orders' as AdminTab,
      label: 'Pesanan & Resi',
      icon: 'receipt_long',
    };

  // ──────────────────────────────────────────────────────────
  // 2. ADMIN STUDIO DASHBOARD (EXECUTIVE BACK-OFFICE CONSOLE)
  // ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-[#f9f9f8] text-[#1a1c1c] antialiased">
      {/* ──────────────────────────────────────────────────────────
          A. DESKTOP SIDEBAR (Collapsible Luxury Drawer)
      ────────────────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full w-[260px] bg-white border-r border-[#d5c2c5]/30 z-50 flex-col justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen
            ? 'translate-x-0 opacity-100 shadow-[8px_0_36px_rgba(26,28,28,0.06)]'
            : '-translate-x-full opacity-0 pointer-events-none shadow-none'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header Brand */}
          <div className="p-4 border-b border-black/15/70 flex items-center">
            <Link href="/admin" className="flex items-center" aria-label="Admin Home">
              <Logo className="h-5 w-auto text-black" />
            </Link>
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 no-scrollbar">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <p className="px-2 pb-1 font-sans text-[10.5px] font-bold text-[#514346] uppercase tracking-wider">
                  {group.groupTitle}
                </p>
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const badge =
                      item.id === 'orders'
                        ? 12
                        : item.id === 'catalog'
                        ? products.length || 4
                        : item.id === 'section-news'
                        ? articles.length || 6
                        : item.id === 'media'
                        ? '18'
                        : null;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 text-left transition-colors font-sans text-[13px] ${
                          isActive
                            ? 'bg-[#1a1c1c] text-white font-semibold shadow-xs'
                            : 'text-[#514346] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name={item.icon} size={18} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {badge !== null && (
                          <span
                            className={`px-1.5 py-0.5 font-mono text-[11px] shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#e8e8e7] text-[#1a1c1c]'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Sidebar: User Profile & Actions */}
        <div className="p-3 border-t border-[#d5c2c5]/20 bg-[#f3f4f3]/40 flex flex-col gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-2.5 py-1.5 border border-[#d5c2c5]/40 bg-white text-[#1a1c1c] hover:bg-[#eeeeed] transition-colors text-[11px] font-sans font-bold uppercase tracking-wider"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="storefront" size={14} />
              <span>Lihat Toko Publik</span>
            </span>
            <Icon name="north_east" size={14} />
          </Link>

          <div className="flex items-center gap-2 pt-1">
            <div className="w-8 h-8 bg-[#1a1c1c] text-white flex items-center justify-center shrink-0">
              <Icon name="person" size={18} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-sans text-[12px] font-semibold text-[#1a1c1c] truncate">
                Sevaya Admin
              </span>
              <span className="font-sans text-[11px] text-[#514346] truncate">
                admin@sevaya.id
              </span>
            </div>
            <button
              type="button"
              onClick={handleAdminLogout}
              title="Keluar Sesi Admin"
              className="text-[#514346] hover:text-red-700 transition-colors p-1"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────
          B. MOBILE OFF-CANVAS DRAWER
      ────────────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-[#1a1c1c]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 flex w-[85vw] max-w-xs flex-col justify-between border-r border-[#d5c2c5]/30 bg-white p-5 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] animate-drawer-slide-in rounded-none z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#d5c2c5]/20 pb-4">
                <div className="flex flex-col gap-0.5">
                  <Logo className="h-5 w-auto text-[#1a1c1c]" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-none border border-black/20 text-[#1a1c1c] hover:bg-black hover:text-white active:scale-95 transition"
                  aria-label="Tutup Menu"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              {/* Drawer Nav Groups */}
              <nav className="mt-5 space-y-5">
                {ADMIN_NAV_GROUPS.map((group) => (
                  <div key={group.groupTitle} className="space-y-1">
                    <p className="px-2 text-[10px] font-bold tracking-wider text-[#514346] uppercase">
                      {group.groupTitle}
                    </p>
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      const badge =
                        item.id === 'orders'
                          ? 12
                          : item.id === 'catalog'
                          ? products.length || 4
                          : item.id === 'section-news'
                          ? articles.length || 6
                          : item.id === 'media'
                          ? '18'
                          : null;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 text-left text-[13px] font-sans transition-all rounded-lg ${
                            isActive
                              ? 'bg-[#1a1c1c] text-white font-semibold shadow-xs'
                              : 'text-[#514346] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon name={item.icon} size={18} />
                            <span>{item.label}</span>
                          </div>
                          {badge !== null && (
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#eeeeed] text-[#1a1c1c]'
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-2 border-t border-[#d5c2c5]/20 pt-4 mt-6">
              <Link
                href="/"
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#d5c2c5]/40 bg-[#f9f9f8] py-2.5 text-xs font-semibold tracking-wider text-[#1a1c1c] uppercase hover:bg-white active:bg-stone-200 transition"
              >
                <Icon name="storefront" size={15} />
                <span>Lihat Toko Publik</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleAdminLogout();
                }}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-transparent bg-[#f3f4f3] py-2.5 text-xs font-semibold tracking-wider text-[#514346] uppercase hover:bg-red-50 hover:text-red-700 active:bg-red-100 transition"
              >
                <Icon name="logout" size={16} />
                <span>Keluar Sesi Admin</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          C. FIXED TOP BAR HEADER (Matching Mockup)
      ────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 right-0 h-14 sm:h-16 bg-white/95 backdrop-blur-xl border-b border-[#d5c2c5]/30 z-40 px-3 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? 'left-0 md:left-[260px]' : 'left-0'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
          {/* Tombol Menu Mobile: Garis 3 (Hamburger) Selalu Tampil di Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-none border border-black/20 bg-white text-black hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all duration-200 shrink-0 md:hidden"
            aria-label="Buka Menu Admin"
            title="Buka Menu Admin"
          >
            <Icon name="menu" size={20} />
          </button>

          {/* Tombol Toggle Sidebar Desktop */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="group relative hidden md:flex h-10 w-10 items-center justify-center rounded-none border border-black/20 bg-white text-black hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all duration-300 shrink-0"
            aria-label="Toggle Menu Sidebar"
            title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Buka Sidebar'}
          >
            <div className="relative flex h-[14px] w-[18px] flex-col justify-between items-start overflow-hidden">
              {/* Bar 1 (Top line) */}
              <span
                className={`h-[1.5px] bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isSidebarOpen
                    ? 'w-[18px] translate-y-[6.25px] rotate-45'
                    : 'w-[18px] translate-y-0 rotate-0 group-hover:w-3'
                }`}
              />
              {/* Bar 2 (Middle line) */}
              <span
                className={`h-[1.5px] bg-current transition-all duration-200 ease-out ${
                  isSidebarOpen
                    ? 'w-0 opacity-0 -translate-x-3'
                    : 'w-3 group-hover:w-[18px] opacity-100 translate-x-0'
                }`}
              />
              {/* Bar 3 (Bottom line) */}
              <span
                className={`h-[1.5px] bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isSidebarOpen
                    ? 'w-[18px] -translate-y-[6.25px] -rotate-45'
                    : 'w-[18px] translate-y-0 rotate-0 group-hover:w-3'
                }`}
              />
            </div>
          </button>

          {/* Logo Brand SEVAYA (Tampil di Mobile & Desktop) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/admin" className="flex items-center" aria-label="Admin Home">
              <Logo className="h-4 sm:h-5 w-auto text-black" />
            </Link>
            <span className="text-[#d5c2c5] font-light text-xs">|</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#514346] text-[12px] font-sans min-w-0">
            <span className="hover:text-[#1a1c1c] cursor-pointer hidden xs:inline shrink-0">Studio</span>
            <Icon name="chevron_right" size={14} className="text-[#837376] hidden xs:inline shrink-0" />
            <span className="font-semibold text-[#1a1c1c] truncate">{activeTabMeta.label}</span>
          </div>

          {(activeTab === 'orders' || activeTab === 'catalog' || activeTab === 'media') && (
            <div className="relative flex-1 max-w-xs hidden sm:block">
              <Icon
                name="search"
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#514346]"
              />
              <input
                className="w-full h-9 pl-8 pr-12 border border-[#d5c2c5]/50 bg-[#f9f9f8] text-[#1a1c1c] text-[12px] focus:outline-none focus:border-[#1a1c1c] transition-colors"
                placeholder="Cari pesanan, SKU, atau aset..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-[#eeeeed] border border-[#d5c2c5]/40 text-[10px] font-mono text-[#514346]">
                ⌘K
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-black/15 bg-white text-black hover:bg-black/5 active:scale-95 transition-colors"
            title="Lihat Toko Publik"
          >
            <Icon name="storefront" size={15} />
          </Link>
          {activeTab === 'settings' && (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 text-[11px] font-medium text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="hidden xs:inline">Supabase CDN Active</span>
              <span className="xs:hidden">CDN</span>
            </div>
          )}
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────
          D. MAIN TAB CONTENT CONTAINER
      ────────────────────────────────────────────────────────── */}
      <main
        className={`relative min-h-screen bg-[#f9f9f8] px-3 pb-16 pt-16 sm:px-6 sm:pt-20 lg:px-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-0'
        }`}
      >
        {/* ──────────────────────────────────────────────────────────
            SECTION 0: DASHBOARD PESANAN & PENGIRIMAN (REAL SUPABASE + BITESHIP)
        ────────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && <BiteshipSimulatorDashboard />}

        {/* ──────────────────────────────────────────────────────────
            SECTION 1: KATALOG PRODUK (MULTI-FOTO PER WARNA)
        ────────────────────────────────────────────────────────── */}
        {activeTab === 'catalog' && (
          <div className="mx-auto w-full max-w-5xl space-y-3 sm:space-y-4">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-2 pb-1 sm:pb-2">
              <div className="min-w-0">
                <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
                  Koleksi &amp; Inventori
                </span>
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-black truncate">
                  Manajemen Katalog
                </h2>
                <p className="text-[11px] text-black/50 mt-0 hidden sm:block">
                  1 produk mendukung banyak foto untuk setiap varian warna yang dipilih pembeli.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="shrink-0 inline-flex items-center justify-center gap-1 rounded-full bg-black px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold text-white transition hover:bg-black/85 active:scale-95"
                >
                  <Icon name="add" size={14} />
                  <span>Tambah Produk</span>
                </button>
              </div>
            </div>

            {/* Search & Stats Card */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-black/15 bg-white p-2.5 sm:p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama abaya, edisi, warna..."
                  className="w-full h-8 sm:h-9 rounded-lg border border-black/20 bg-white pr-3 pl-8 py-1 text-xs text-black placeholder:text-black/40 focus:border-black focus:outline-none transition-colors"
                />
                <Icon
                  name="search"
                  size={14}
                  className="pointer-events-none absolute top-2 sm:top-2.5 left-2.5 text-black/50"
                />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium text-black/70 shrink-0">
                <span className="rounded-full bg-black/5 px-2.5 py-1 border border-black/10">
                  Total: <strong className="text-black">{products.length}</strong>
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 border border-emerald-200/60 text-emerald-800">
                  Tersedia: <strong className="font-bold">{products.filter((p) => p.inStock !== false).length}</strong>
                </span>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading && products.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-black/15 bg-white">
                <span className="text-xs tracking-wider text-black/70 uppercase">
                  Memuat data produk...
                </span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-black/15 bg-white p-6 text-center">
                <Icon name="shopping_bag" size={28} className="text-black/70" />
                <p className="text-xs text-black/70">
                  Tidak ada produk yang cocok dengan pencarian.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white uppercase"
                >
                  Tambah Produk Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)] transition hover:border-black/30"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[3/4] w-full bg-black/5">
                      <Image
                        src={product.image || '/images/catalog/catalog-01.jpg'}
                        alt={product.title}
                        fill
                        className={`object-cover transition-opacity ${product.hidden ? 'opacity-40' : 'opacity-100'}`}
                      />
                      {product.hidden && (
                        <div className="absolute inset-0 flex items-center justify-center p-2">
                          <span className="rounded-full bg-black/80 px-2 py-0.5 text-center text-[9px] font-bold tracking-wider text-white uppercase backdrop-blur-xs sm:text-[10px]">
                            Disembunyikan
                          </span>
                        </div>
                      )}
                      {product.badge && (
                        <span className="absolute top-2 left-2 rounded-full bg-black px-2 py-0.5 text-[9px] font-semibold tracking-wider text-white uppercase sm:text-[10px]">
                          {product.badge}
                        </span>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-black shadow-xs backdrop-blur-xs sm:px-2 sm:text-[10px]">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${product.inStock !== false ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                        <span className="xs:inline hidden">
                          {product.inStock !== false ? 'In Stock' : 'Habis'}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                      {product.edition && (
                        <span className="font-headline truncate text-[10px] tracking-widest text-black/50 uppercase">
                          {product.edition}
                        </span>
                      )}
                      <h3 className="font-headline line-clamp-1 text-xs font-semibold text-black sm:text-sm">
                        {product.title}
                      </h3>
                      <span className="truncate text-[10px] font-mono text-black/50 sm:text-xs">
                        /{product.slug}
                      </span>

                      {/* Pricing */}
                      <div className="mt-1 flex flex-col sm:mt-1.5 sm:flex-row sm:items-baseline sm:gap-2">
                        <span className="text-xs font-bold text-black sm:text-sm">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-[10px] text-black/50 line-through sm:text-[11px]">
                            Rp {product.original_price.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>

                      {/* Swatches preview with photo indicator */}
                      {product.swatches && product.swatches.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1 rounded-xl bg-black/5 p-2 text-xs">
                          <span className="text-[9px] font-semibold tracking-wider text-black/70 uppercase">
                            {product.swatches.length} Varian:
                          </span>
                          <div className="flex flex-wrap items-center gap-1">
                            {product.swatches.map((sw, idx) => (
                              <div
                                key={idx}
                                title={`${sw.name} - ${sw.image ? 'Ada Foto' : 'Foto Utama'}`}
                                className="flex items-center gap-1 rounded-full border border-black/15 bg-white px-1.5 py-0.5 shadow-2xs"
                              >
                                <span
                                  style={{ backgroundColor: sw.color }}
                                  className="h-2.5 w-2.5 rounded-full border border-black/15"
                                />
                                <span className="hidden text-[9px] font-medium text-black sm:inline">
                                  {sw.name.split(' ')[0]}
                                </span>
                                {sw.image && (
                                  <Icon name="image" size={9} className="text-emerald-700" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-2.5 flex items-center gap-1 border-t border-black/10 pt-2 sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(product)}
                          className="flex h-7 sm:h-8 flex-1 items-center justify-center gap-1 rounded-full border border-black/20 bg-white px-1.5 text-[10px] sm:text-xs font-medium text-black transition hover:bg-black/5 active:scale-95"
                        >
                          <Icon name="edit" size={11} />
                          <span className="truncate">Edit</span>
                        </button>
                        {/* Hide / Show quick toggle */}
                        <button
                          type="button"
                          title={product.hidden ? 'Tampilkan di Toko' : 'Sembunyikan dari Toko'}
                          onClick={async () => {
                            const updated = await updateDbProduct(product.id, {
                              hidden: !product.hidden,
                            });
                            if (updated) {
                              setProducts((prev) =>
                                prev.map((p) => (p.id === product.id ? updated : p)),
                              );
                              showToast(
                                updated.hidden
                                  ? `"${updated.title}" disembunyikan dari toko.`
                                  : `"${updated.title}" ditampilkan kembali di toko.`,
                              );
                            }
                          }}
                          className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-95 ${
                            product.hidden
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                          }`}
                        >
                          <Icon name={product.hidden ? 'visibility' : 'visibility_off'} size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id, product.title)}
                          className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 active:scale-95"
                          title="Hapus Produk"
                        >
                          <Icon name="delete" size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            SECTION 2: BERANDA (HOMEPAGE SECTIONS)
        ────────────────────────────────────────────────────────── */}
        {activeTab === 'section-home' && (
          <div className="mx-auto w-full max-w-5xl space-y-4">
            <div className="pb-2">
              <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
                Editorial &amp; Storefront
              </span>
              <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
                Kelola Section Beranda (Homepage)
              </h2>
              <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
                Hero Banner, Category Spotlight, Signature Textiles, dan Editorial Journal. Tersimpan otomatis.
              </p>
            </div>

            {/* 1. HERO SECTION */}
            <div className="rounded-2xl border border-black/15 bg-white p-4 sm:p-7 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
              <div className="border-b border-black/10 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-black">
                    1. Hero Section (Homepage Banner Utama)
                  </h3>
                  <p className="text-[11px] text-black/60 mt-0">
                    Banner utama dengan foto latar penuh dan teks tajuk toko.
                  </p>
                </div>
                <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-semibold text-black/70 border border-black/15">
                  Desktop &amp; Mobile
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-medium text-black/70">
                    Gambar Latar Hero
                  </span>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
                    <Image
                      src={sections.hero.image}
                      alt="Hero preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePickerTarget('hero');
                      setIsImagePickerOpen(true);
                    }}
                    className="inline-flex min-h-[28px] sm:min-h-[34px] items-center justify-center gap-1 rounded-full border border-black/20 bg-white px-2 py-1 text-[10px] sm:text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                  >
                    <Icon name="image" size={14} />
                    <span>Ganti Gambar Hero</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3.5 lg:col-span-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-black/70">
                      Badge Label
                    </label>
                    <input
                      type="text"
                      value={sections.hero.badge}
                      onChange={(e) =>
                        setSections((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, badge: e.target.value },
                        }))
                      }
                      className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-black/70">
                      Judul Utama (Title)
                    </label>
                    <input
                      type="text"
                      value={sections.hero.title}
                      onChange={(e) =>
                        setSections((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, title: e.target.value },
                        }))
                      }
                      className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-black/70">
                      Deskripsi Hero
                    </label>
                    <textarea
                      rows={2}
                      value={sections.hero.desc}
                      onChange={(e) =>
                        setSections((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, desc: e.target.value },
                        }))
                      }
                      className="w-full rounded-none border border-black/20 bg-white p-3 text-base sm:text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CATEGORY SPOTLIGHT */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2">
                <h3 className="text-xs font-bold text-black">
                  2. Category Spotlight (2 Kartu Sorotan)
                </h3>
                <p className="text-[11px] text-black/60 mt-0">
                  Dua kartu kategori utama yang ditampilkan berdampingan di beranda.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                {sections.spotlight.map((card, idx) => (
                  <div
                    key={card.id}
                    className="flex flex-col gap-3 rounded-xl bg-black/5 p-4 border border-black/15/60"
                  >
                    <span className="text-xs font-semibold text-black/70 uppercase tracking-wider">
                      Kartu Spotlight #{idx + 1}
                    </span>
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
                      <Image src={card.image} alt={card.title} fill className="object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget(`spotlight-${idx}` as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Gambar #{idx + 1}</span>
                    </button>
                    <div className="flex flex-col gap-2 pt-1">
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSections((prev) => {
                            const next = [...prev.spotlight];
                            if (next[idx]) next[idx] = { ...next[idx]!, title: val };
                            return { ...prev, spotlight: next };
                          });
                        }}
                        placeholder="Judul"
                        className="w-full rounded-none border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                      />
                      <input
                        type="text"
                        value={card.subtitle}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSections((prev) => {
                            const next = [...prev.spotlight];
                            if (next[idx]) next[idx] = { ...next[idx]!, subtitle: val };
                            return { ...prev, spotlight: next };
                          });
                        }}
                        placeholder="Subjudul"
                        className="w-full rounded-none border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. SIGNATURE TEXTILES */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2">
                <h3 className="text-xs font-bold text-black">
                  3. Showcase Tekstil Berkelanjutan
                </h3>
                <p className="text-[11px] text-black/60 mt-0">
                  Banner narasi komitmen material premium ramah lingkungan Sevaya.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
                  <Image
                    src={sections.missionTextiles.image}
                    alt="Textiles background"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center gap-3 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImagePickerTarget('textiles');
                      setIsImagePickerOpen(true);
                    }}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5"
                  >
                    <Icon name="image" size={14} />
                    <span>Ganti Gambar Showcase Tekstil</span>
                  </button>
                  <input
                    type="text"
                    value={sections.missionTextiles.title}
                    onChange={(e) =>
                      setSections((prev) => ({
                        ...prev,
                        missionTextiles: { ...prev.missionTextiles, title: e.target.value },
                      }))
                    }
                    className="w-full rounded-none border border-black/20 bg-white px-3.5 py-2 text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. JOURNAL SECTION */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2">
                <h3 className="text-xs font-bold text-black">
                  4. Artikel Journal (2 Artikel)
                </h3>
                <p className="text-[11px] text-black/60 mt-0">
                  Artikel editorial gaya hidup dan wawasan abaya di beranda toko.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                {sections.journal.map((art, idx) => (
                  <div
                    key={art.id}
                    className="flex flex-col gap-3 rounded-xl bg-black/5 p-4 border border-black/15/60"
                  >
                    <span className="text-xs font-semibold text-black/70 uppercase tracking-wider">
                      Artikel #{idx + 1}
                    </span>
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
                      <Image src={art.image} alt={art.title} fill className="object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget(`journal-${idx}` as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Gambar Artikel #{idx + 1}</span>
                    </button>
                    <input
                      type="text"
                      value={art.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSections((prev) => {
                          const next = [...prev.journal];
                          if (next[idx]) next[idx] = { ...next[idx]!, title: val };
                          return { ...prev, journal: next };
                        });
                      }}
                      placeholder="Judul Artikel"
                      className="w-full rounded-none border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={art.excerpt}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSections((prev) => {
                          const next = [...prev.journal];
                          if (next[idx]) next[idx] = { ...next[idx]!, excerpt: val };
                          return { ...prev, journal: next };
                        });
                      }}
                      placeholder="Kutipan ringkasan"
                      className="w-full rounded-none border border-black/20 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            SECTION: NEWS & EDITORIAL (JURNAL PUBLIK /NEWS)
        ────────────────────────────────────────────────────────── */}
        {activeTab === 'section-news' && (
          <div className="mx-auto w-full max-w-5xl space-y-4">
            {/* Top Toolbar */}
            <div className="pb-2">
              <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
                Editorial &amp; Storefront
              </span>
              <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
                Manajemen News &amp; Editorial (Jurnal)
              </h2>
              <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
                Kelola artikel berita, jurnal filosofi brand, dan wawasan busana modest.
              </p>
            </div>

            {/* Telemetry Summary Card */}
            <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
              <div className="grid grid-cols-3 divide-x divide-[rgba(0,0,0,0.12)]/50 gap-0">
                <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4">
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
                    Total Terbit
                  </span>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-base sm:text-2xl font-bold text-black">{articles.length}</span>
                    <span className="text-[10px] text-black/60">artikel</span>
                  </div>
                  <span className="hidden sm:block text-[11px] text-black/50">
                    Tersinkronisasi otomatis
                  </span>
                </div>

                <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4">
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
                    Featured
                  </span>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-base sm:text-2xl font-bold text-amber-600">
                      {articles.filter((a) => a.featured).length}
                    </span>
                    <span className="text-[10px] text-black/60">sorotan</span>
                  </div>
                  <span className="hidden sm:block text-[11px] text-black/50">
                    Banner hero editorial
                  </span>
                </div>

                <div className="flex flex-col justify-center space-y-0.5 px-2 sm:px-4">
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-black/50 truncate">
                    Kategori
                  </span>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-base sm:text-2xl font-bold text-black">
                      {ARTICLE_CATEGORIES.filter((c) => c !== 'All Stories').length}
                    </span>
                    <span className="text-[10px] text-black/60">topik</span>
                  </div>
                  <span className="hidden sm:block text-[11px] text-black/50">
                    Journal &amp; Event
                  </span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-black/15 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
                {ARTICLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewsFilterCategory(cat)}
                    className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${
                      newsFilterCategory === cat
                        ? 'bg-black text-white'
                        : 'border border-black/20 bg-white text-black/70 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={newsSearchQuery}
                    onChange={(e) => setNewsSearchQuery(e.target.value)}
                    placeholder="Cari judul atau topik artikel..."
                    className="w-full min-h-[38px] sm:min-h-[34px] rounded-lg border border-black/20 bg-white pl-8 pr-3 py-1.5 text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                  <Icon
                    name="search"
                    size={15}
                    className="pointer-events-none absolute left-2.5 top-2.5 text-black/70"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateArticleModal}
                  className="shrink-0 min-h-[38px] sm:min-h-[34px] inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95"
                >
                  <Icon name="add" size={15} />
                  <span>Tulis Artikel Baru</span>
                </button>
              </div>
            </div>

            {/* Articles Grid */}
            {(() => {
              const filtered = articles.filter((a) => {
                const matchesCat =
                  newsFilterCategory === 'All Stories' || a.category === newsFilterCategory;
                const q = newsSearchQuery.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  a.title.toLowerCase().includes(q) ||
                  a.category.toLowerCase().includes(q) ||
                  a.excerpt.toLowerCase().includes(q);
                return matchesCat && matchesSearch;
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-2xl border border-black/15 bg-white p-12 text-center text-black/70">
                    <Icon name="search_off" size={36} className="mb-2 text-black/50 mx-auto block" />
                    <p className="font-semibold text-sm text-black">Tidak ada artikel yang cocok</p>
                    <p className="text-xs text-black/70 mt-1">
                      Coba ganti kata kunci pencarian atau pilih kategori lain.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreateArticleModal}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-black/85"
                    >
                      <Icon name="add" size={15} />
                      <span>Tulis Artikel Baru</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
                  {filtered.map((art) => (
                    <div
                      key={art.id}
                      className="flex flex-col rounded-2xl border border-black/15 bg-white shadow-[0_1px_4px_rgba(27,23,24,0.03)] overflow-hidden transition hover:border-black/20"
                    >
                      {/* Cover Photo */}
                      <div className="relative aspect-[16/10] w-full bg-black/5 overflow-hidden">
                        <Image
                          src={art.image || '/images/catalog/catalog-11.jpg'}
                          alt={art.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                        {art.featured && (
                          <div className="absolute top-2.5 left-2.5 rounded-full bg-black/90 backdrop-blur-xs px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 border border-amber-300/30">
                            ⭐ Featured Story
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur-xs">
                          {art.read_time}
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                        <div className="flex items-center justify-between text-[11px] text-black/50">
                          <span className="font-semibold text-black/70">{art.category}</span>
                          <span>{art.date}</span>
                        </div>

                        <h3 className="mt-1 text-xs font-bold text-black line-clamp-2">
                          {art.title}
                        </h3>

                        <p className="mt-1 text-[11px] text-black/70 line-clamp-2 leading-snug flex-1">
                          {art.excerpt}
                        </p>

                        <div className="mt-2 text-[10px] font-mono text-black/50">
                          /{art.slug}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-black/15/60 flex items-center gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditArticleModal(art)}
                            className="flex-1 min-h-[38px] flex items-center justify-center gap-1 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:bg-black/5 active:scale-95"
                          >
                            <Icon name="edit" size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFeaturedArticle(art.id)}
                            title={art.featured ? 'Batalkan Status Featured' : 'Jadikan Featured Story'}
                            className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full border transition-colors active:scale-95 ${
                              art.featured
                                ? 'border-amber-300 bg-amber-50 text-amber-700'
                                : 'border-black/20 bg-white text-black/70 hover:bg-black/5'
                            }`}
                          >
                            <Icon name="star" size={14} filled={art.featured} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art.id, art.title)}
                            title="Hapus Artikel"
                            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:scale-95"
                          >
                            <Icon name="delete" size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            SECTION 3: LOOKBOOK STUDIO
        ────────────────────────────────────────────────────────── */}
        {activeTab === 'section-lookbook' && (
          <div className="mx-auto w-full max-w-5xl space-y-4">
            <div className="pb-2">
              <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
                Editorial &amp; Storefront
              </span>
              <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
                Manajemen Lookbook &amp; Galeri Editorial
              </h2>
              <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
                Sesuaikan seluruh foto halaman Lookbook publik (/lookbook). Setiap foto yang dipilih otomatis tersimpan.
              </p>
            </div>

            {/* ══ BAGIAN A: SEMUA FOTO HALAMAN LOOKBOOK PUBLIK (/lookbook) ══ */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-4">
              <div className="border-b border-black/10 pb-2.5 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-black">
                    1. Foto Editorial Halaman Lookbook (/lookbook)
                  </h3>
                  <p className="text-[11px] text-black/60 mt-0">
                    Klik &quot;Ganti Foto&quot; pada slot foto mana saja untuk memilih foto dari galeri/unggah baru.
                  </p>
                </div>
                <span className="self-start sm:self-auto rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-semibold text-black/70 border border-black/15">
                  Live di /lookbook
                </span>
              </div>

              {/* Grid Slot Foto Lookbook */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 items-stretch">
                {/* 1. Hero Poster / Foto Utama */}
                <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        1. Foto Utama (The First Chapter)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 4:3
                      </span>
                    </div>
                    <p className="text-[10px] text-black/50 truncate">
                      Default: sevaya_first_chapter.jpg
                    </p>
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.heroImage || '/images/sevaya_first_chapter.jpg'}
                        alt="Hero Lookbook"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-heroImage' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Hero</span>
                    </button>
                  </div>
                </div>

                {/* 2. Kolase Kiri (Portrait) */}
                <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        2. Kolase Kiri (Portrait Besar)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 4:5
                      </span>
                    </div>
                    <p className="text-[10px] text-black/50 truncate">
                      Default: lookbook_figma_0.png
                    </p>
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.collagePortrait || '/images/lookbook_figma_0.png'}
                        alt="Kolase Portrait"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-collagePortrait' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Kolase 1</span>
                    </button>
                  </div>
                </div>

                {/* 3. Kolase Kanan Atas */}
                <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        3. Kolase Kanan Atas (Detail)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 16:10
                      </span>
                    </div>
                    <p className="text-[10px] text-black/50 truncate">
                      Default: figma_about_1.png
                    </p>
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.collageDetail1 || '/images/figma_about_1.png'}
                        alt="Kolase Detail 1"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-collageDetail1' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Detail 1</span>
                    </button>
                  </div>
                </div>

                {/* 4. Kolase Kanan Bawah */}
                <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        4. Kolase Kanan Bawah (Buku)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 16:10
                      </span>
                    </div>
                    <p className="text-[10px] text-black/50 truncate">
                      Default: figma_about_2.png
                    </p>
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.collageDetail2 || '/images/figma_about_2.png'}
                        alt="Kolase Detail 2"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-collageDetail2' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Detail 2</span>
                    </button>
                  </div>
                </div>

                {/* 5. Panorama Lebar 1 */}
                <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        5. Panorama Lebar 1 (Duo Abaya)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 16:9
                      </span>
                    </div>
                    <p className="text-[10px] text-black/50 truncate">
                      Default: figma_hero.png
                    </p>
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.panorama1 || '/images/figma_hero.png'}
                        alt="Panorama 1"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-panorama1' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Panorama 1</span>
                    </button>
                  </div>
                </div>

                {/* 6. Panorama Lebar 2 */}
                <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        6. Panorama Lebar 2 (Tepi Sungai)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 16:9
                      </span>
                    </div>
                    <p className="text-[10px] text-black/50 truncate">
                      Default: lookbook_figma_1.png
                    </p>
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.panorama2 || '/images/lookbook_figma_1.png'}
                        alt="Panorama 2"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-panorama2' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Panorama 2</span>
                    </button>
                  </div>
                </div>

                {/* 7. Triptych Foto 1 */}
                <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        7. Triptych Bawah 1 (Atelier)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 3:4
                      </span>
                    </div>
                    <p className="text-[10px] text-black/50 truncate">
                      Default: lookbook_figma_2.png
                    </p>
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.triptych1 || '/images/lookbook_figma_2.png'}
                        alt="Triptych 1"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-triptych1' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Triptych 1</span>
                    </button>
                  </div>
                </div>

                {/* 8. Triptych Foto 2 */}
                <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        8. Triptych Bawah 2 (Duo Model)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 3:4
                      </span>
                    </div>
                    <p className="text-[10px] text-black/50 truncate">
                      Default: lookbook_figma_3.png
                    </p>
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.triptych2 || '/images/lookbook_figma_3.png'}
                        alt="Triptych 2"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-triptych2' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Triptych 2</span>
                    </button>
                  </div>
                </div>

                {/* 9. Triptych Foto 3 */}
                <div className="flex flex-col justify-between h-full rounded-xl border border-black/15 bg-white p-2 sm:p-3 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        9. Triptych Bawah 3 (Detail Cuff)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 3:4
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-black truncate">
                      Default: lookbook_figma_4.png
                    </p>
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.triptych3 || '/images/lookbook_figma_4.png'}
                        alt="Triptych 3"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-triptych3' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Triptych 3</span>
                    </button>
                  </div>
                </div>

                {/* 10. Panorama Penutup (Flowing Dress) */}
                <div className="flex flex-col justify-between rounded-xl border border-black/15 bg-white p-3.5 shadow-xs sm:col-span-2 lg:col-span-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wide">
                        10. Foto Panorama Penutup (Flowing Dress Shot)
                      </span>
                      <span className="rounded bg-[rgba(0,0,0,0.12)]/60 px-1.5 py-0.5 text-[9px] font-medium text-black/70">
                        Tampil: 21:10
                      </span>
                    </div>
                    <p className="text-[10px] text-black/50 truncate">
                      Default: lookbook_figma_5.png
                    </p>
                    <div className="relative aspect-[21/9] sm:aspect-[21/10] w-full overflow-hidden rounded-lg border border-black/15 bg-black/5">
                      <Image
                        src={sections.lookbookPage?.fullDress || '/images/lookbook_figma_5.png'}
                        alt="Full Flowing Dress"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('lbpage-fullDress' as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white px-5 py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Penutup</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ BAGIAN B: BAB LOOKBOOK (Koleksi / Chapter) ══ */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-black">
                    2. Bab / Chapter Lookbook Aktif
                  </h3>
                  <p className="text-[11px] text-black/60 mt-0">
                    Hanya bab aktif yang ditampilkan (saat ini Chapter 1 / Season 1). Tambah bab baru jika merilis season berikutnya.
                  </p>
                </div>
                <span className="rounded-full bg-black px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {sections.lookbook.length} Bab Aktif
                </span>
              </div>

              {/* Lookbook Chapters Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.lookbook.map((ch, idx) => (
                  <div
                    key={ch.id || idx}
                    className="flex flex-col rounded-2xl border border-black/15 bg-white p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-black/15/60">
                      <span className="rounded-full bg-black px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                        {ch.num || `BAB ${idx + 1}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-black/70">
                          Look {String(idx + 1).padStart(2, '0')}
                        </span>
                        {sections.lookbook.length > 1 && (
                          <button
                            type="button"
                            title="Hapus Bab Ini"
                            onClick={() => {
                              if (!window.confirm(`Yakin hapus "${ch.num || `Bab ${idx + 1}`}"?`))
                                return;
                              setSections((prev) => ({
                                ...prev,
                                lookbook: prev.lookbook.filter((_, i) => i !== idx),
                              }));
                            }}
                            className="flex h-7 w-7 min-h-[28px] min-w-[28px] items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100 active:scale-95"
                          >
                            <Icon name="close" size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chapter Image Preview */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
                      <Image
                        src={ch.image || '/images/sevaya_first_chapter.jpg'}
                        alt={ch.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Upload / Pick Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget(`lookbook-${idx}` as ImagePickerTarget);
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex w-full min-h-[38px] items-center justify-center gap-1.5 rounded-full border border-black/20 bg-white py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                    >
                      <Icon name="image" size={14} />
                      <span>Ganti Foto Bab</span>
                    </button>

                    {/* Form fields */}
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-black/70 uppercase">
                          Label Bab
                        </label>
                        <input
                          type="text"
                          value={ch.num}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSections((prev) => {
                              const next = [...prev.lookbook];
                              if (next[idx]) next[idx] = { ...next[idx]!, num: val };
                              return { ...prev, lookbook: next };
                            });
                          }}
                          className="w-full min-h-[40px] sm:min-h-[34px] rounded-none border border-black/20 bg-white px-2.5 py-1.5 text-base sm:text-xs text-black focus:border-black focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-black/70 uppercase">
                          Judul Look / Chapter
                        </label>
                        <input
                          type="text"
                          value={ch.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSections((prev) => {
                              const next = [...prev.lookbook];
                              if (next[idx]) next[idx] = { ...next[idx]!, title: val };
                              return { ...prev, lookbook: next };
                            });
                          }}
                          className="w-full min-h-[40px] sm:min-h-[34px] rounded-none border border-black/20 bg-white px-2.5 py-1.5 text-base sm:text-xs text-black focus:border-black focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Chapter Button */}
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-black/20 bg-white py-5">
                <button
                  type="button"
                  onClick={() => {
                    const newIdx = sections.lookbook.length + 1;
                    setSections((prev) => ({
                      ...prev,
                      lookbook: [
                        ...prev.lookbook,
                        {
                          id: crypto.randomUUID(),
                          num: `BAB ${newIdx}`,
                          title: `Season ${newIdx} // Look ${String(newIdx).padStart(2, '0')}`,
                          image: '/images/catalog/catalog-01.jpg',
                        },
                      ],
                    }));
                  }}
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full border border-black/20 bg-white px-6 py-2.5 text-xs font-semibold text-black shadow-xs transition-all hover:bg-white hover:border-black active:scale-[0.98]"
                >
                  <Icon name="add" size={16} />
                  <span>Tambah Bab Baru (Season Berikutnya)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            SECTION 4: TENTANG TOKO (ABOUT & MANIFESTO)
        ────────────────────────────────────────────────────────── */}
        {activeTab === 'section-conscious' && (
          <div className="mx-auto w-full max-w-5xl space-y-4">
            <div className="pb-2">
              <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
                Editorial &amp; Storefront
              </span>
              <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
                Halaman Tentang Toko (About)
              </h2>
              <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
                Kelola banner filosofi brand dan 4 foto arsip material kain busana Sevaya. Tersimpan otomatis.
              </p>
            </div>

            {/* Manifesto Hero Banner */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2">
                <h3 className="text-xs font-bold text-black">
                  1. Banner Utama Halaman About
                </h3>
                <p className="text-[11px] text-black/60 mt-0">
                  Foto tajuk atas halaman Tentang Toko (&quot;A Softer Way of Dressing&quot;).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
                  <Image
                    src={sections.conscious?.heroImage || '/images/catalog/catalog-11.jpg'}
                    alt="Conscious hero"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center gap-3 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImagePickerTarget('conscious-hero');
                      setIsImagePickerOpen(true);
                    }}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5"
                  >
                    <Icon name="image" size={14} />
                    <span>Ganti Gambar Hero Filosofi</span>
                  </button>
                  <p className="text-xs text-black/70">
                    Tampilan editorial manifesto untuk mengedukasi pelanggan mengenai etika pembuatan pakaian Sevaya.
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Textile Archives */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2">
                <h3 className="text-xs font-bold text-black">
                  2. Foto 4 Arsip Tekstil Berkelanjutan
                </h3>
                <p className="text-[11px] text-black/60 mt-0">
                  Empat foto makro material kain alami (Bemberg, Tencel, Pure Linen, Eco Modal).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {/* 1. Bemberg */}
                <div className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 border border-black/15/60">
                  <span className="truncate text-xs font-semibold text-black">
                    Bemberg™ Cupro
                  </span>
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
                    <Image
                      src={sections.conscious?.bembergImage || '/images/catalog/catalog-06.jpg'}
                      alt="Bemberg Cupro"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePickerTarget('conscious-bemberg');
                      setIsImagePickerOpen(true);
                    }}
                    className="rounded-full border border-black/20 bg-white py-1.5 text-center text-[11px] font-medium text-black hover:border-black"
                  >
                    Ganti Foto
                  </button>
                </div>

                {/* 2. Tencel */}
                <div className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 border border-black/15/60">
                  <span className="truncate text-xs font-semibold text-black">
                    TENCEL™ Lyocell
                  </span>
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
                    <Image
                      src={sections.conscious?.tencelImage || '/images/catalog/catalog-16.jpg'}
                      alt="Tencel Lyocell"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePickerTarget('conscious-tencel');
                      setIsImagePickerOpen(true);
                    }}
                    className="rounded-full border border-black/20 bg-white py-1.5 text-center text-[11px] font-medium text-black hover:border-black"
                  >
                    Ganti Foto
                  </button>
                </div>

                {/* 3. Linen */}
                <div className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 border border-black/15/60">
                  <span className="truncate text-xs font-semibold text-black">
                    Pure Flax Linen
                  </span>
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
                    <Image
                      src={sections.conscious?.linenImage || '/images/catalog/catalog-15.jpg'}
                      alt="Pure Flax Linen"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePickerTarget('conscious-linen');
                      setIsImagePickerOpen(true);
                    }}
                    className="rounded-full border border-black/20 bg-white py-1.5 text-center text-[11px] font-medium text-black hover:border-black"
                  >
                    Ganti Foto
                  </button>
                </div>

                {/* 4. Modal */}
                <div className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 border border-black/15/60">
                  <span className="truncate text-xs font-semibold text-black">
                    Eco Modal
                  </span>
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
                    <Image
                      src={sections.conscious?.modalImage || '/images/catalog/catalog-04.jpg'}
                      alt="Eco Modal"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePickerTarget('conscious-modal');
                      setIsImagePickerOpen(true);
                    }}
                    className="rounded-full border border-black/20 bg-white py-1.5 text-center text-[11px] font-medium text-black hover:border-black"
                  >
                    Ganti Foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            SECTION 5: GALERI CLOUD MEDIA & MASTER STORAGE
        ────────────────────────────────────────────────────────── */}
        {activeTab === 'media' && (
          <div className="mx-auto w-full max-w-5xl space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
              <div>
                <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
                  Aset Digital &amp; Master Storage
                </span>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
                    Galeri Cloud Media
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-800 border border-emerald-200/60">
                    CDN ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-black/60 mt-0">
                  Pusat aset master fotografi editorial resolusi tinggi dan integrasi CDN Supabase Storage.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="shrink-0 inline-flex items-center justify-center gap-1 rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-black/85 active:scale-[0.99]"
                >
                  <Icon name="add_photo_alternate" size={16} />
                  <span>Unggah Master Foto</span>
                </button>
              </div>
            </div>

            {/* Telemetry Summary Card */}
            <div className="rounded-xl sm:rounded-2xl border border-black/15 bg-white p-3.5 sm:p-6 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(0,0,0,0.12)]/50 gap-3.5 sm:gap-0">
                {/* Metric 1: Kapasitas Bucket */}
                <div className="flex flex-col justify-between space-y-2 pb-3.5 sm:pb-0 sm:pr-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-black/70">
                      Kapasitas Bucket
                    </span>
                    <span className="font-mono text-xs font-semibold text-black">
                      18.4 GB / 50 GB
                    </span>
                  </div>
                  <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-black h-full rounded-full" style={{ width: '36.8%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-black/70">
                    <span>{MASTER_CATALOG_ASSETS.length} Foto Abaya Aktif</span>
                    <span className="text-emerald-700 font-medium">36.8% terpakai</span>
                  </div>
                </div>

                {/* Metric 2: CDN Edge Caching */}
                <div className="flex flex-col justify-between space-y-1 py-3.5 sm:py-0 sm:px-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-black/70">
                      Status Edge CDN
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Optimal (99.98%)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-black">12 ms</span>
                    <span className="text-[11px] text-black/70">TTFB P95 Jakarta (CGK-1)</span>
                  </div>
                  <div className="text-[11px] text-black/70">
                    Kompresi Brotli 4K otomatis
                  </div>
                </div>

                {/* Metric 3: Sinkronisasi Katalog */}
                <div className="flex flex-col justify-between space-y-1 pt-3.5 sm:pt-0 sm:pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-black/70">
                      Koneksi Storefront
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
                      100% SYNCED
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-black">18 / 18</span>
                    <span className="text-[11px] text-black/70">PDP Terkoneksi</span>
                  </div>
                  <div className="text-[11px] text-black/70">
                    Bucket: <code className="font-mono text-[10px] text-black">production-katalog</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-black/15 bg-white p-3 sm:p-4 shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
                {[
                  { id: 'all', label: `Semua (${MASTER_CATALOG_ASSETS.length})` },
                  { id: 'plum', label: 'Siluet Plum (8)' },
                  { id: 'cuff', label: 'Manset & Hijab (5)' },
                  { id: 'outdoor', label: 'Editorial Outdoor (5)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMediaCategory(tab.id as any)}
                    className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${
                      mediaCategory === tab.id
                        ? 'bg-black text-white'
                        : 'border border-black/20 bg-white text-black/70 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="relative flex-1 sm:w-56">
                  <input
                    type="text"
                    value={mediaSearchQuery}
                    onChange={(e) => setMediaSearchQuery(e.target.value)}
                    placeholder="Filter berkas..."
                    className="w-full min-h-[40px] sm:min-h-[34px] rounded-none border border-black/20 bg-white pl-8 pr-3 py-1.5 text-base sm:text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                  <Icon
                    name="filter_alt"
                    size={15}
                    className="pointer-events-none absolute left-2.5 top-3 sm:top-2.5 text-black/70"
                  />
                </div>

                <div className="flex items-center rounded-full border border-black/20 p-0.5 bg-black/5">
                  <button
                    type="button"
                    onClick={() => setMediaViewMode('grid')}
                    className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-full transition-colors ${
                      mediaViewMode === 'grid'
                        ? 'bg-white text-black shadow-2xs'
                        : 'text-black/70 hover:text-black'
                    }`}
                    title="Tampilan Kisi"
                  >
                    <Icon name="grid_view" size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaViewMode('table')}
                    className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-full transition-colors ${
                      mediaViewMode === 'table'
                        ? 'bg-white text-black shadow-2xs'
                        : 'text-black/70 hover:text-black'
                    }`}
                    title="Tampilan Tabel"
                  >
                    <Icon name="table_rows" size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Split Layout: Asset Display (Left) + Persistent Asset Inspector (Right) */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left Column: Asset Grid or Table */}
              <div className="flex-1 min-w-0 w-full">
                {(() => {
                  const filteredAssets = MASTER_CATALOG_ASSETS.filter((asset) => {
                    const matchesCategory =
                      mediaCategory === 'all' || asset.category === mediaCategory;
                    const matchesSearch =
                      mediaSearchQuery.trim() === '' ||
                      asset.filename.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
                      asset.collection.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
                      asset.badge.toLowerCase().includes(mediaSearchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                  });

                  if (filteredAssets.length === 0) {
                    return (
                      <div className="rounded-2xl border border-black/15 bg-white p-12 text-center text-black/70">
                        <Icon name="search_off" size={36} className="mb-2 text-black/50 mx-auto block" />
                        <p className="font-semibold text-sm text-black">Tidak ada foto yang cocok</p>
                        <p className="text-xs text-black/70 mt-1">
                          Coba ganti kata kunci pencarian atau ubah filter kategori di atas.
                        </p>
                      </div>
                    );
                  }

                  if (mediaViewMode === 'grid') {
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {filteredAssets.map((asset) => {
                          const isSelected = selectedAsset.filename === asset.filename;
                          return (
                            <div
                              key={asset.filename}
                              onClick={() => { setSelectedAsset(asset); setInspectorOpen(true); }}
                              className={`group relative rounded-2xl border bg-white overflow-hidden cursor-pointer transition-all shadow-[0_1px_4px_rgba(27,23,24,0.03)] ${
                                isSelected && inspectorOpen
                                  ? 'border-black ring-1 ring-[#000000]'
                                  : 'border-black/15 hover:border-black'
                              }`}
                            >
                              <div className="relative aspect-[3/4] w-full bg-black/5 overflow-hidden">
                                <Image
                                  src={asset.src}
                                  alt={asset.collection}
                                  fill
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 left-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                                      asset.badge === 'LIVE PDP'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                        : asset.badge === 'LOOKBOOK'
                                        ? 'bg-purple-50 text-purple-800 border border-purple-200/60'
                                        : asset.badge === 'DETAIL PDP'
                                        ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                                        : 'bg-black/5 text-black/70'
                                    }`}
                                  >
                                    {asset.badge}
                                  </span>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(asset.cdnUrl);
                                      showToast(`Path CDN ${asset.filename} disalin!`);
                                    }}
                                    className="w-7 h-7 rounded-full bg-black/80 backdrop-blur-xs text-white flex items-center justify-center hover:bg-black transition-colors"
                                    title="Salin Path CDN"
                                  >
                                    <Icon name="content_copy" size={13} />
                                  </button>
                                </div>
                              </div>
                              <div className="p-3 flex flex-col gap-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs text-black truncate max-w-[130px]">
                                    {asset.filename}
                                  </span>
                                  <span className="font-mono text-[10px] text-black/50">
                                    {asset.size}
                                  </span>
                                </div>
                                <span className="text-[11px] text-black/70 truncate">
                                  {asset.collection}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // Table View
                  return (
                    <div className="rounded-2xl border border-black/15 bg-white overflow-hidden shadow-[0_1px_4px_rgba(27,23,24,0.03)]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-black/15 bg-white text-[11px] font-semibold text-black/70 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Pratinjau</th>
                              <th className="py-2.5 px-3">Nama Berkas Master</th>
                              <th className="py-2.5 px-3">Dimensi</th>
                              <th className="py-2.5 px-3">Ukuran File</th>
                              <th className="py-2.5 px-3">Penempatan</th>
                              <th className="py-2.5 px-3">Status CDN</th>
                              <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[rgba(0,0,0,0.12)]/60 text-xs">
                            {filteredAssets.map((asset) => {
                              const isSelected = selectedAsset.filename === asset.filename;
                              return (
                                <tr
                                  key={asset.filename}
                                  onClick={() => { setSelectedAsset(asset); setInspectorOpen(true); }}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected && inspectorOpen
                                      ? 'bg-black/5 font-medium'
                                      : 'hover:bg-white'
                                  }`}
                                >
                                  <td className="py-2 px-3">
                                    <div className="relative w-8 h-10 overflow-hidden rounded-md bg-black/5">
                                      <Image
                                        src={asset.src}
                                        alt={asset.filename}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="font-semibold text-black block">
                                      {asset.filename}
                                    </span>
                                    <span className="text-[11px] text-black/70 truncate block max-w-xs">
                                      {asset.collection}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-mono text-[11px] text-black">
                                    {asset.res}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-[11px] text-black/70">
                                    {asset.size}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                        asset.badge === 'LIVE PDP'
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                          : 'bg-black/5 text-black/70'
                                      }`}
                                    >
                                      {asset.badge}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-1 text-emerald-700 text-[11px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                      <span>Cached 4K</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(asset.cdnUrl);
                                          showToast(`Path CDN ${asset.filename} disalin!`);
                                        }}
                                        className="rounded-full p-1 text-black/70 hover:text-black hover:bg-black/5 transition-colors"
                                        title="Salin Path CDN"
                                      >
                                        <Icon name="content_copy" size={15} />
                                      </button>
                                      <a
                                        href={asset.src}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded-full p-1 text-black/70 hover:text-black hover:bg-black/5 transition-colors"
                                        title="Buka Resolusi Penuh"
                                      >
                                        <Icon name="open_in_new" size={15} />
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Asset Inspector */}
              {inspectorOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
                    onClick={() => setInspectorOpen(false)}
                  />
                  <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md bg-white border-l border-black/15 p-5 shadow-2xl overflow-y-auto lg:static lg:z-auto lg:w-[320px] xl:w-[350px] lg:max-w-none lg:rounded-2xl lg:border lg:p-5 lg:shadow-[0_1px_4px_rgba(27,23,24,0.03)] lg:sticky lg:top-24 lg:overflow-visible animate-in slide-in-from-right duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-black/15/70">
                      <div className="flex items-center gap-1.5">
                        <Icon name="info" size={16} className="text-black" />
                        <span className="text-xs uppercase font-bold tracking-wider text-black">
                          Inspektur Berkas
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            selectedAsset.badge === 'LIVE PDP'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : 'bg-black/5 text-black/70'
                          }`}
                        >
                          {selectedAsset.badge}
                        </span>
                        <button
                          type="button"
                          onClick={() => setInspectorOpen(false)}
                          className="flex min-h-[36px] items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-black/70 hover:text-black hover:bg-black/5 border border-black/20 transition-colors active:scale-95"
                          title="Tutup Inspektur"
                        >
                          <Icon name="close" size={14} />
                          <span>Tutup</span>
                        </button>
                      </div>
                    </div>

                    {/* Preview Box */}
                    <div className="my-3 overflow-hidden rounded-xl border border-black/15 bg-black/5 relative aspect-[3/4]">
                      <Image
                        src={selectedAsset.src}
                        alt={selectedAsset.collection}
                        fill
                        sizes="350px"
                        className="object-cover"
                      />
                      <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-white text-[10px] font-mono flex items-center justify-between">
                        <span>{selectedAsset.res} px</span>
                        <span>{selectedAsset.format}</span>
                      </div>
                    </div>

                    {/* Metadata Attributes */}
                    <div className="space-y-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-black/50 block">
                          Nama Berkas Master
                        </span>
                        <span className="font-semibold text-black text-xs break-all">
                          {selectedAsset.filename}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-black/50 block">
                          Deskripsi Siluet &amp; Koleksi
                        </span>
                        <span className="text-black text-xs">
                          {selectedAsset.collection}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-black/50 block">
                          Supabase Storage CDN Path
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            className="flex-1 bg-white text-black font-mono text-[10.5px] px-2 py-1 border border-black/20 select-all truncate rounded-none focus:outline-none"
                            readOnly
                            type="text"
                            value={selectedAsset.cdnUrl}
                          />
                          <button
                            type="button"
                            className="rounded-full p-1.5 bg-black/5 hover:bg-[#EAE4DD] text-black transition-colors shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedAsset.cdnUrl);
                              showToast('Path Supabase CDN berhasil disalin!');
                            }}
                            title="Salin Path"
                          >
                            <Icon name="content_copy" size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/15/60 text-[11px]">
                        <div>
                          <span className="text-black/50 text-[10px] block font-bold uppercase tracking-wider">
                            Ukuran File
                          </span>
                          <span className="font-mono font-semibold text-black">
                            {selectedAsset.size}
                          </span>
                        </div>
                        <div>
                          <span className="text-black/50 text-[10px] block font-bold uppercase tracking-wider">
                            Waktu Unggah
                          </span>
                          <span className="font-mono text-black text-[10.5px]">
                            {selectedAsset.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Cluster */}
                    <div className="mt-4 pt-3 border-t border-black/15/60 flex flex-col gap-2">
                      <a
                        className="w-full py-1.5 rounded-full border border-black/20 bg-white hover:bg-black/5 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        href={selectedAsset.src}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon name="open_in_new" size={14} />
                        <span>Buka Resolusi Penuh</span>
                      </a>

                      <label className="w-full py-1.5 rounded-full border border-black/20 bg-white hover:bg-black/5 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                        <Icon name="refresh" size={14} />
                        <span>Ganti File / Versi Baru</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>

                      <button
                        type="button"
                        className="w-full py-1 text-red-600 hover:bg-red-50 text-xs rounded-full flex items-center justify-center gap-1 transition-colors"
                        onClick={() => {
                          if (
                            confirm(
                              `Apakah Anda yakin ingin menghapus berkas ${selectedAsset.filename} dari master bucket?`
                            )
                          ) {
                            showToast(`Aset ${selectedAsset.filename} berhasil dihapus dari bucket.`);
                          }
                        }}
                      >
                        <Icon name="delete" size={14} />
                        <span>Hapus Aset dari Bucket</span>
                      </button>
                    </div>
                  </aside>
                </>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            SECTION 7: PENGATURAN STUDIO INTERNAL & CDN
        ────────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="mx-auto w-full max-w-5xl space-y-4">
            <div className="flex flex-col gap-1 pb-2">
              <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
                Sistem &amp; Konfigurasi
              </span>
              <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
                Pengaturan Studio &amp; Infrastruktur CDN
              </h2>
              <p className="text-[11px] text-black/60 mt-0">
                Konfigurasi operasional Sevaya, kredensial integrasi pengiriman, payment gateway, dan status Supabase Cloud CDN.
              </p>
            </div>

            {/* Card 1: Identitas Brand & Toko */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2">
                <h3 className="text-xs font-bold text-black">
                  Identitas Brand &amp; Toko
                </h3>
                <p className="text-[11px] text-black/60 mt-0">
                  Informasi merek resmi yang digunakan pada antarmuka publik dan struk pesanan.
                </p>
              </div>

              <div className="divide-y divide-[rgba(0,0,0,0.12)]/60">
                <div className="flex items-center justify-between py-2.5 gap-2">
                  <span className="text-xs font-medium text-black/70">Nama Brand</span>
                  <div className="w-full sm:w-80">
                    <input
                      type="text"
                      readOnly
                      value="SEVAYA"
                      className="w-full min-h-[42px] sm:min-h-[36px] rounded-none border border-black/20 bg-black/5 px-3.5 py-2 text-base sm:text-xs font-semibold text-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2.5 gap-2">
                  <span className="text-xs font-medium text-black/70">Domain Resmi</span>
                  <div className="w-full sm:w-80">
                    <input
                      type="text"
                      readOnly
                      value="https://sevaya.id"
                      className="w-full min-h-[42px] sm:min-h-[36px] rounded-none border border-black/20 bg-black/5 px-3.5 py-2 text-base sm:text-xs font-mono text-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Status Integrasi Logistik & Payment Gateway */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2">
                <h3 className="text-xs font-bold text-black">
                  Status Integrasi Logistik &amp; Payment Gateway
                </h3>
                <p className="text-[11px] text-black/60 mt-0">
                  Layanan pihak ketiga yang aktif dan tersambung dengan sistem e-commerce Sevaya.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-black">Biteship Logistics</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Live Webhook
                    </span>
                  </div>
                  <p className="text-[11px] text-black/70">
                    Origin: Gudang Sevaya Jakarta Selatan
                  </p>
                  <div className="pt-2 border-t border-black/15/70 text-[11px] text-[#554C48]">
                    Dukungan kurir instant, sameday, next day, dan reguler seluruh Indonesia.
                  </div>
                </div>

                <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-black">Midtrans Snap</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Production Gateway
                    </span>
                  </div>
                  <p className="text-[11px] text-black/70">
                    QRIS, BCA VA, Mandiri VA, BNI VA, GoPay
                  </p>
                  <div className="pt-2 border-t border-black/15/70 text-[11px] text-[#554C48]">
                    Konfirmasi pembayaran otomatis via HTTP POST webhook callback.
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Infrastruktur Cloud & Status CDN (Supabase Storage - Merged) */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-black">
                    Infrastruktur Cloud &amp; Status CDN (Supabase)
                  </h3>
                  <p className="text-[11px] text-black/60 mt-0">
                    Monitoring bucket Supabase cloud storage, integrasi edge CDN Anycast global, dan latensi node.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
                  ALL REGIONS OK
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-black/15/70">
                    <span className="font-semibold text-black">Bucket S3 Production</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-mono text-emerald-800 border border-emerald-200/60">
                      PUBLIC CDN
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-black/70">Endpoint S3</span>
                      <span className="font-mono text-black">https://cdn.sevaya.id/storage/v1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">CORS Policy</span>
                      <span className="text-emerald-700 font-medium">Enabled (GET, HEAD, POST)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">Cache Control</span>
                      <span className="font-mono text-black">1 Year Immutable</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">Enkripsi At-Rest</span>
                      <span className="text-emerald-700 font-medium">AES-256 Verified</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-black/15/70">
                    <span className="font-semibold text-black">Edge Network Latency</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Global Anycast
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-black/70">Jakarta POP (CGK-1)</span>
                      <span className="font-mono text-emerald-700 font-semibold">11ms • 100% UP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">Singapore POP (SIN-1)</span>
                      <span className="font-mono text-emerald-700 font-semibold">19ms • 100% UP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">Kuala Lumpur POP (KUL-1)</span>
                      <span className="font-mono text-emerald-700 font-semibold">24ms • 100% UP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">Global SSL Cert</span>
                      <span className="text-emerald-700 font-medium">Aktif s/d Des 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 1: Identitas Brand & Toko */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2">
                <h3 className="text-xs font-bold text-black">
                  Identitas Brand &amp; Toko
                </h3>
                <p className="text-[11px] text-black/60 mt-0">
                  Informasi merek resmi yang digunakan pada antarmuka publik dan struk pesanan.
                </p>
              </div>

              <div className="divide-y divide-[rgba(0,0,0,0.12)]/60">
                <div className="flex items-center justify-between py-2.5 gap-2">
                  <span className="text-xs font-medium text-black/70">Nama Brand</span>
                  <div className="w-full sm:w-80">
                    <input
                      type="text"
                      readOnly
                      value="SEVAYA"
                      className="w-full min-h-[42px] sm:min-h-[36px] rounded-none border border-black/20 bg-black/5 px-3.5 py-2 text-base sm:text-xs font-semibold text-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2.5 gap-2">
                  <span className="text-xs font-medium text-black/70">Domain Resmi</span>
                  <div className="w-full sm:w-80">
                    <input
                      type="text"
                      readOnly
                      value="https://sevaya.id"
                      className="w-full min-h-[42px] sm:min-h-[36px] rounded-none border border-black/20 bg-black/5 px-3.5 py-2 text-base sm:text-xs font-mono text-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Status Integrasi Logistik & Payment Gateway */}
            <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
              <div className="border-b border-black/10 pb-2">
                <h3 className="text-xs font-bold text-black">
                  Status Integrasi Logistik &amp; Payment Gateway
                </h3>
                <p className="text-[11px] text-black/60 mt-0">
                  Layanan pihak ketiga yang aktif dan tersambung dengan sistem e-commerce Sevaya.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-black">Biteship Logistics</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Live Webhook
                    </span>
                  </div>
                  <p className="text-[11px] text-black/70">
                    Origin: Gudang Sevaya Jakarta Selatan
                  </p>
                  <div className="pt-2 border-t border-black/15/70 text-[11px] text-[#554C48]">
                    Dukungan kurir instant, sameday, next day, dan reguler seluruh Indonesia.
                  </div>
                </div>

                <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-black">Midtrans Snap</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Production Gateway
                    </span>
                  </div>
                  <p className="text-[11px] text-black/70">
                    QRIS, BCA VA, Mandiri VA, BNI VA, GoPay
                  </p>
                  <div className="pt-2 border-t border-black/15/70 text-[11px] text-[#554C48]">
                    Konfirmasi pembayaran otomatis via HTTP POST webhook callback.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ──────────────────────────────────────────────────────────
          MODAL: UPLOAD MASTER FOTO KATALOG
      ────────────────────────────────────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-black/15 shadow-2xl w-full max-w-lg p-5 sm:p-7 flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-black/15/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                  <Icon name="cloud_upload" size={18} />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-black">
                    Unggah Master Foto Katalog
                  </h3>
                  <p className="text-[11px] text-black/70">
                    Bucket:{' '}
                    <code className="bg-black/5 px-1.5 py-0.5 rounded font-mono text-[10px] text-black">
                      production-katalog-sevaya
                    </code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-black/70 hover:bg-black/5 hover:text-black transition-colors"
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Tutup Unggah"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <label className="rounded-xl border-2 border-dashed border-black/20 p-5 sm:p-6 flex flex-col items-center justify-center text-center bg-white hover:bg-black/5 transition-colors cursor-pointer">
              <Icon name="add_photo_alternate" size={36} className="text-black mb-2" />
              <p className="font-semibold text-xs text-black">
                Tarik &amp; lepas berkas master di sini
              </p>
              <p className="text-[11px] text-black/70 mt-1 max-w-sm">
                RAW, TIFF, PNG, atau JPG hingga 25 MB per berkas. Sistem mengonversi otomatis ke WebP 4K untuk edge CDN.
              </p>
              <span className="mt-4 min-h-[40px] inline-flex items-center rounded-full px-5 py-2 bg-white border border-black/20 text-xs font-semibold text-black hover:bg-black/5 shadow-xs active:scale-95 transition">
                Pilih dari Komputer
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleFileUpload(e);
                  setIsUploadModalOpen(false);
                }}
              />
            </label>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold uppercase tracking-wider text-black/70 text-[10px] block">
                Koleksi Terhubung
              </label>
              <select
                className="w-full min-h-[42px] sm:min-h-[36px] rounded-none border border-black/20 bg-white px-3 py-2 text-base sm:text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                value={uploadCollection}
                onChange={(e) => setUploadCollection(e.target.value)}
              >
                <option>Abaya Plum Riverside Silk (Spring 2025)</option>
                <option>Koleksi Manset Monogram Emas</option>
                <option>Editorial Padang Rumput &amp; Linen</option>
                <option>Draft Umum / Belum Terikat</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/15/70">
              <button
                type="button"
                className="min-h-[44px] flex-1 sm:flex-initial rounded-full border border-black/20 bg-white px-5 py-2 text-xs font-medium text-black/70 hover:bg-black/5 hover:text-black transition-colors active:scale-95"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-[0.99]"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  showToast('Aset master berhasil diproses ke CDN!');
                }}
              >
                <Icon name="done" size={15} />
                <span>Mulai Proses CDN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: PRODUCT CRUD (WITH MULTI-PHOTO SWATCHES)
      ────────────────────────────────────────────────────────── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] sm:max-h-[90vh] w-full max-w-full sm:max-w-2xl flex flex-col rounded-t-2xl sm:rounded-2xl border border-black/15 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/15/70 bg-white px-3.5 sm:px-6 py-2.5 sm:py-3.5 shrink-0">
              <div className="min-w-0 pr-2">
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-black/50 uppercase block">
                  Katalog Koleksi
                </span>
                <h3 className="font-headline text-sm sm:text-base font-bold text-black truncate">
                  {editingProduct ? 'Edit Produk & Varian Foto' : 'Tambah Produk Baru'}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-black/50 mt-0 truncate">
                  Atur foto utama dan varian warna masing-masing busana.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-black/70 hover:bg-black/5 hover:text-black transition-colors"
                aria-label="Tutup Form Produk"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-3.5 sm:gap-4 p-3.5 sm:p-5 overflow-y-auto overflow-x-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[11px] font-medium text-black/70">
                    Nama / Judul Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="cth. Fina Abaya - Stripe 2.0"
                    className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[11px] font-medium text-black/70">
                    Slug URL
                  </label>
                  <input
                    type="text"
                    value={productForm.slug}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="otomatis dibuat dari judul"
                    className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[11px] font-medium text-black/70">
                    Edisi / Subtitle
                  </label>
                  <input
                    type="text"
                    value={productForm.edition}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, edition: e.target.value }))
                    }
                    placeholder="cth. Edition 2.0"
                    className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[11px] font-medium text-black/70">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, price: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[11px] font-medium text-black/70">
                    Harga Normal (Coret)
                  </label>
                  <input
                    type="number"
                    value={productForm.original_price}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        original_price: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Badge & Stock & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-[11px] font-medium text-black/70">
                    Badge Label (Opsional)
                  </label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="cth. Best Seller, Sale -20%"
                    className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs h-8 sm:h-9 text-black focus:border-black focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/15 bg-white p-2">
                    <input
                      type="checkbox"
                      checked={productForm.inStock}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, inStock: e.target.checked }))
                      }
                      className="h-3.5 w-3.5 accent-[#000000]"
                    />
                    <span className="text-[11px] font-medium text-black truncate">
                      In Stock
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                    <input
                      type="checkbox"
                      checked={productForm.hidden}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, hidden: e.target.checked }))
                      }
                      className="h-3.5 w-3.5 accent-amber-600"
                    />
                    <span className="text-[11px] font-medium text-amber-800 truncate">
                      Sembunyikan
                    </span>
                  </label>
                </div>
              </div>

              {/* Product Default Image */}
              <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-black/[0.02] p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-black">
                    Foto Sampul Utama Produk
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePickerTarget('product');
                      setIsImagePickerOpen(true);
                    }}
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-black/20 bg-white px-2.5 text-[10px] font-medium text-black hover:bg-black/5 active:scale-95"
                  >
                    <Icon name="image" size={12} />
                    <span>Pilih Galeri</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  <div className="relative h-16 w-12 sm:h-20 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-black/15 bg-white">
                    <Image
                      src={productForm.image || '/images/catalog/catalog-01.jpg'}
                      alt="Product preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                    <input
                      type="text"
                      value={productForm.image}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, image: e.target.value }))
                      }
                      placeholder="/images/catalog/catalog-01.jpg atau URL Supabase"
                      className="w-full h-8 rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs text-black focus:border-black focus:outline-none"
                    />
                    <label className="inline-flex h-7 w-fit cursor-pointer items-center gap-1 rounded-full bg-black px-3 text-[10px] font-semibold text-white transition hover:bg-black/85 active:scale-95">
                      <Icon name="upload" size={12} />
                      <span>{isUploading ? 'Mengunggah...' : 'Unggah File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => {
                          setImagePickerTarget('product');
                          handleFileUpload(e);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Color Swatches Builder with Multi-Photo per Color */}
              <div className="flex flex-col gap-2.5 rounded-xl border border-black/10 bg-black/[0.02] p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-black block truncate">
                      Varian Warna &amp; Foto Warna
                    </span>
                    <p className="text-[10px] text-black/50 hidden sm:block">
                      Setiap varian warna dapat dihubungkan ke foto busananya masing-masing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSwatch}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-black/20 bg-white px-2.5 text-[10px] font-medium text-black hover:bg-black/5 active:scale-95"
                  >
                    <Icon name="add" size={12} />
                    <span>Tambah Warna</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  {productForm.swatches.map((sw, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-black/15 bg-white p-2.5 sm:p-3 shadow-2xs min-w-0"
                    >
                      {/* Top Row on mobile: Color picker & name & delete */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <input
                            type="color"
                            value={sw.color}
                            onChange={(e) => handleUpdateSwatch(idx, 'color', e.target.value)}
                            className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-black/15 p-0.5"
                            title="Pilih Warna Hex"
                          />
                          <input
                            type="text"
                            value={sw.name}
                            onChange={(e) => handleUpdateSwatch(idx, 'name', e.target.value)}
                            placeholder="Nama Warna"
                            className="flex-1 sm:w-28 h-7 rounded border border-black/20 bg-white px-2 py-0.5 text-xs text-black focus:border-black focus:outline-none min-w-0"
                          />
                          <input
                            type="text"
                            value={sw.color}
                            onChange={(e) => handleUpdateSwatch(idx, 'color', e.target.value)}
                            placeholder="#1A1A1A"
                            className="w-16 h-7 rounded border border-black/20 bg-white px-1.5 py-0.5 font-mono text-[10px] text-black/60 focus:border-black focus:outline-none shrink-0"
                          />
                        </div>

                        {/* Delete button (visible on mobile inline) */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSwatch(idx)}
                          className="sm:hidden h-7 w-7 shrink-0 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 active:scale-95"
                          title="Hapus Warna Ini"
                        >
                          <Icon name="close" size={15} />
                        </button>
                      </div>

                      {/* Photo for this specific color */}
                      <div className="flex flex-1 items-center gap-2 sm:border-l sm:border-black/15 sm:pl-2.5 min-w-0">
                        <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md border border-black/15 bg-black/5">
                          <Image
                            src={sw.image || productForm.image || '/images/catalog/catalog-01.jpg'}
                            alt={`Foto warna ${sw.name}`}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setImagePickerTarget(`swatch-${idx}` as ImagePickerTarget);
                                setIsImagePickerOpen(true);
                              }}
                              className="h-6 rounded-full border border-black/20 bg-white px-2 text-[10px] font-medium text-black hover:bg-black/5 active:scale-95"
                            >
                              <Icon name="image" size={10} className="inline mr-1" />
                              <span>Pilih</span>
                            </button>

                            <label className="h-6 flex items-center cursor-pointer rounded-full bg-black px-2 text-[10px] font-semibold text-white hover:bg-black/85 active:scale-95">
                              <Icon name="upload" size={10} className="inline mr-1" />
                              <span>Unggah</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploading}
                                onChange={(e) => {
                                  setImagePickerTarget(`swatch-${idx}` as ImagePickerTarget);
                                  handleFileUpload(e);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <span className="truncate font-mono text-[8px] text-black/40 block min-w-0">
                            {sw.image || productForm.image}
                          </span>
                        </div>

                        {/* Delete button (visible on desktop) */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSwatch(idx)}
                          className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full p-1 text-red-500 hover:bg-red-50 active:scale-95"
                          title="Hapus Warna Ini"
                        >
                          <Icon name="close" size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-black/15 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="h-8 sm:h-9 flex-1 sm:flex-initial rounded-full border border-black/20 bg-white px-4 text-xs font-medium text-black/70 hover:bg-black/5 hover:text-black active:scale-95 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-8 sm:h-9 flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95"
                >
                  <Icon name="check" size={14} />
                  <span>{isLoading ? 'Menyimpan...' : 'Simpan Produk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: ARTICLE CRUD (NEWS & EDITORIAL JOURNAL)
      ────────────────────────────────────────────────────────── */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] sm:max-h-[90vh] w-full max-w-2xl flex flex-col rounded-t-2xl sm:rounded-2xl border border-black/15 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/15/70 bg-white px-4 sm:px-6 py-3 sm:py-4 shrink-0">
              <div>
                <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
                  Editorial Journal
                </span>
                <h3 className="font-headline text-base sm:text-lg font-bold text-black">
                  {editingArticle ? 'Edit Artikel Berita' : 'Tulis Artikel Berita Baru'}
                </h3>
                <p className="text-[11px] sm:text-[11px] text-black/60 mt-0">
                  Publikasikan wawasan busana, filosofi tekstil, atau rilis studio ke /news.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsArticleModalOpen(false)}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-black/70 hover:bg-black/5 hover:text-black transition-colors"
                aria-label="Tutup Form Artikel"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="flex flex-col gap-4.5 p-3.5 sm:p-6 overflow-y-auto">
              {/* Title & Slug */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-black/70">
                    Judul Artikel *
                  </label>
                  <input
                    type="text"
                    required
                    value={articleForm.title}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="cth. The Art of Fewer, Better Choices"
                    className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-black/70">
                    Slug URL
                  </label>
                  <input
                    type="text"
                    value={articleForm.slug}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="otomatis dibuat dari judul"
                    className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Category, Date & Read Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-black/70">
                    Kategori Topik
                  </label>
                  <select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full min-h-[42px] sm:min-h-[36px] rounded-none border border-black/20 bg-white px-3 py-2 text-base sm:text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                  >
                    {ARTICLE_CATEGORIES.filter((c) => c !== 'All Stories').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-black/70">
                    Tanggal Rilis
                  </label>
                  <input
                    type="text"
                    value={articleForm.date}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, date: e.target.value }))}
                    placeholder="cth. Oct 18, 2026"
                    className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-black/70">
                    Estimasi Waktu Baca
                  </label>
                  <input
                    type="text"
                    value={articleForm.readTime}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, readTime: e.target.value }))}
                    placeholder="cth. 4 min read"
                    className="w-full rounded border border-black/20 bg-white px-2.5 py-1.5 text-xs h-9 text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-black/70">
                  Cuplikan / Excerpt (Tampil di kartu &amp; preview)
                </label>
                <textarea
                  rows={2}
                  required
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Ringkasan 1-2 kalimat mengenai topik artikel ini..."
                  className="w-full rounded-none border border-black/20 bg-white p-3 text-base sm:text-xs text-black focus:border-black focus:bg-white focus:outline-none"
                />
              </div>

              {/* Full Content */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-black/70">
                    Isi Paragraf Konten Lengkap
                  </label>
                  <span className="text-[10px] text-black/50">
                    Pisahkan antar paragraf dengan 2x Enter (baris kosong)
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={articleForm.content}
                  onChange={(e) => setArticleForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Tulis narasi lengkap artikel di sini..."
                  className="w-full rounded-none border border-black/20 bg-white p-3 text-base sm:text-xs text-black focus:border-black focus:bg-white focus:outline-none leading-relaxed"
                />
              </div>

              {/* -- FOTO SAMPUL ARTIKEL -- */}
              <div className="flex flex-col gap-3 rounded-xl border border-black/15 bg-black/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-black">Foto Sampul Artikel</span>
                  <button
                    type="button"
                    onClick={() => { setImagePickerTarget('article'); setIsImagePickerOpen(true); }}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-black/20 bg-white px-3 py-1 text-xs font-medium text-black hover:bg-white active:scale-95"
                  >
                    <Icon name="image" size={14} />
                    <span>Pilih dari Galeri</span>
                  </button>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-black/15 bg-white">
                    <Image src={articleForm.image || '/images/catalog/catalog-11.jpg'} alt="cover" fill className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <input
                      type="text"
                      value={articleForm.image}
                      onChange={(e) => setArticleForm((prev) => ({ ...prev, image: e.target.value }))}
                      placeholder="/images/catalog/catalog-11.jpg atau URL Supabase"
                      className="w-full min-h-[38px] rounded-none border border-black/20 bg-white px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                    />
                    <label className="inline-flex min-h-[36px] w-fit cursor-pointer items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-95">
                      <Icon name="upload" size={14} />
                      <span>{isUploading ? 'Mengunggah...' : 'Unggah File Foto'}</span>
                      <input type="file" accept="image/*" disabled={isUploading} onChange={(e) => { setImagePickerTarget('article'); handleFileUpload(e); }} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Featured checkbox */}
                <label className="mt-1 flex cursor-pointer items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                  <input
                    type="checkbox"
                    checked={articleForm.featured}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="h-4 w-4 accent-amber-600"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-900">Jadikan Artikel Pilihan Utama (Featured Story)</span>
                    <span className="text-[11px] text-amber-700">Artikel ini akan tampil pada banner hero besar di bagian atas halaman /news.</span>
                  </div>
                </label>
              </div>

              {/* -- FOTO ISI ARTIKEL (MULTI-IMAGE) -- */}
              <div className="flex flex-col gap-3 rounded-xl border border-black/15 bg-black/5 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-xs font-semibold text-black">Foto Isi Artikel (Editorial Gallery)</span>
                    <p className="text-[10px] text-black/50 mt-0.5">Foto-foto ini akan disisipkan di antara narasi paragraf artikel seperti majalah.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget('article-add-image');
                        setIsImagePickerOpen(true);
                      }}
                      className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-black/20 bg-black text-white px-3 py-1 text-xs font-medium hover:bg-black/85 active:scale-95 transition"
                    >
                      <Icon name="image" size={13} />
                      <span>Pilih dari Galeri</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleForm((prev) => ({ ...prev, images: [...prev.images, ''] }))}
                      className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-black/20 bg-white px-3 py-1 text-xs font-medium text-black hover:bg-black/5 active:scale-95 transition"
                    >
                      <Icon name="add" size={13} />
                      <span>Slot Baru</span>
                    </button>
                  </div>
                </div>

                {articleForm.images.length === 0 && (
                  <div className="text-center py-5 border border-dashed border-black/15 rounded-xl bg-white/50 space-y-2">
                    <p className="text-xs text-black/60 font-medium">Belum ada foto isi artikel tambahan.</p>
                    <p className="text-[11px] text-black/40 max-w-sm mx-auto">
                      Klik <strong>&quot;Pilih dari Galeri&quot;</strong> di atas untuk memasukkan foto katalog studio ke dalam artikel.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {articleForm.images.map((img, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-black/10 bg-white p-3 shadow-xs">
                      {/* Preview Image */}
                      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/5">
                        {img ? (
                          <Image src={img} alt={`foto-${idx + 1}`} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-black/25">
                            <Icon name="image" size={20} />
                          </div>
                        )}
                      </div>

                      {/* Input & Ganti Galeri */}
                      <div className="flex flex-1 flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wider">
                            Foto #{idx + 1} {idx === 0 ? '(Tampil setelah Paragraf 1)' : `(Paragraf ${idx + 1})`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setImagePickerTarget(`article-image-${idx}` as ImagePickerTarget);
                              setIsImagePickerOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-black hover:underline"
                          >
                            <Icon name="image" size={12} />
                            <span>Ganti dari Galeri</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={img}
                          onChange={(e) => {
                            const next = [...articleForm.images];
                            next[idx] = e.target.value;
                            setArticleForm((prev) => ({ ...prev, images: next }));
                          }}
                          placeholder="/images/catalog/catalog-12.jpg atau URL Supabase"
                          className="w-full min-h-[34px] rounded-none border border-black/20 bg-white px-2.5 py-1 text-xs text-black focus:border-black focus:outline-none"
                        />
                      </div>

                      {/* Urutan & Hapus */}
                      <div className="flex items-center sm:flex-col gap-1.5 self-end sm:self-center shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            title="Geser ke atas"
                            onClick={() => {
                              const next = [...articleForm.images];
                              [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
                              setArticleForm((prev) => ({ ...prev, images: next }));
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 bg-white text-black/50 hover:text-black disabled:opacity-20 transition"
                          >
                            <Icon name="expand_less" size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === articleForm.images.length - 1}
                            title="Geser ke bawah"
                            onClick={() => {
                              const next = [...articleForm.images];
                              [next[idx + 1], next[idx]] = [next[idx]!, next[idx + 1]!];
                              setArticleForm((prev) => ({ ...prev, images: next }));
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 bg-white text-black/50 hover:text-black disabled:opacity-20 transition"
                          >
                            <Icon name="expand_more" size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          title="Hapus foto"
                          onClick={() => {
                            setArticleForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition"
                        >
                          <Icon name="delete" size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload foto langsung */}
                <div className="pt-1">
                  <label className="inline-flex min-h-[36px] w-fit cursor-pointer items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-black hover:text-white transition active:scale-95">
                    <Icon name="upload" size={14} />
                    <span>{isUploading ? 'Mengunggah...' : 'Unggah File Foto Baru'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        try {
                          const { uploadFileToStorage } = await import('@/integrations/supabase/storage');
                          const url = await uploadFileToStorage(file, 'articles');
                          if (url) {
                            setArticleForm((prev) => ({ ...prev, images: [...prev.images, url] }));
                            showToast('Foto berhasil diunggah dan ditambahkan!');
                          }
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto';
                          showToast(`Upload gagal: ${msg}. Anda juga bisa memilih dari Galeri.`);
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 border-t border-black/15/70 pt-4">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="min-h-[44px] flex-1 sm:flex-initial rounded-full border border-black/20 bg-white px-5 py-2 text-xs font-medium text-black/70 hover:bg-black/5 hover:text-black active:scale-95 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-6 py-2 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-[0.99]"
                >
                  <Icon name="check" size={15} />
                  <span>{editingArticle ? 'Simpan Perubahan' : 'Terbitkan Artikel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------
          MODAL: UNIVERSAL IMAGE PICKER & UPLOADER
      ---------------------------------------------------------- */}
      {isImagePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] sm:max-h-[85vh] w-full max-w-3xl flex flex-col rounded-t-2xl sm:rounded-2xl border border-black/15 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/15/70 bg-white px-4 sm:px-6 py-3 sm:py-4 shrink-0">
              <div>
                <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
                  Galeri Media
                </span>
                <h3 className="font-headline text-base font-bold text-black sm:text-lg">
                  Pilih atau Unggah Foto
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImagePickerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black transition"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Predefined catalog images */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-black/60 mb-3">
                  Pustaka Foto Bawaan Studio
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {AVAILABLE_CATALOG_IMAGES.map((img) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => handleSelectPredefinedImage(img)}
                      className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-black/15 bg-black/5 transition-all hover:scale-105 hover:ring-2 hover:ring-[#000000]"
                    >
                      <Image src={img} alt="Catalog photo" fill className="object-cover" />
                      <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white backdrop-blur-xs">
                        {img.split('/').pop()?.replace('.jpg', '')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
