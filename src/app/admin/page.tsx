'use client';

import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from 'react';
import { useToast } from '@/context/ToastContext';
import {
  getDbProducts,
  invalidateProductsCache,
  createDbProduct,
  updateDbProduct,
  deleteDbProduct,
  ensureVariantsForProduct,
  deleteInventoryVariantsForProduct,
  getInventoryVariants,
  invalidateInventoryCache,
  DbProduct,
  getSiteSections,
  getCachedSiteSections,
  saveSiteSections,
  SiteSectionsConfig,
  DEFAULT_SITE_SECTIONS,
  DEFAULT_CLOSER_LOOK,
  uploadFileToStorage,
  listUploadedFiles,
  StorageFile,
} from '@/integrations/supabase';
import { Article } from '@/integrations/supabase/articles';

// Admin Shared Components
import { AdminTab, ImagePickerTarget } from '@/components/admin/adminTypes';
import { AdminLoginView } from '@/components/admin/shared/AdminLoginView';
import { AdminSidebar } from '@/components/admin/shared/AdminSidebar';
import { AdminHeader } from '@/components/admin/shared/AdminHeader';

// Admin Modals
import { ProductModal, ProductFormData } from '@/components/admin/modals/ProductModal';
import { ArticleModal, ArticleFormData } from '@/components/admin/modals/ArticleModal';
import { ImagePickerModal } from '@/components/admin/modals/ImagePickerModal';

// Image Cropper
import { ImageCropperModal } from '@/components/image-cropper';
import { useHeroImageCropper } from '@/features/home';

// Admin Tabs
import { BiteshipSimulatorDashboard } from '@/components/admin/BiteshipSimulatorDashboard';
import { CatalogTab } from '@/components/admin/tabs/CatalogTab';
import InventoryTab from '@/components/admin/tabs/InventoryTab';
import { HomeSectionsTab } from '@/components/admin/tabs/HomeSectionsTab';
import { NewsTab } from '@/components/admin/tabs/NewsTab';
import { LookbookTab } from '@/components/admin/tabs/LookbookTab';
import { ConsciousTab } from '@/components/admin/tabs/ConsciousTab';
import { MediaLibraryTab } from '@/components/admin/tabs/MediaLibraryTab';
import { SettingsTab } from '@/components/admin/tabs/SettingsTab';

export default function AdminPage() {
  const { showToast } = useToast();

  // ΓöÇΓöÇ Authentication State ΓöÇΓöÇ
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('sevaya_admin_logged_in') === '1';
      } catch {
        return false;
      }
    }
    return false;
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Secure server-side admin session check dengan hard-timeout agar tidak pernah stuck di loading unlimited
  useEffect(() => {
    let isFinished = false;

    // Hard fallback timer: maksimal 2 detik, loading screen wajib selesai
    const hardTimeout = setTimeout(() => {
      if (!isFinished) {
        setAuthChecked(true);
      }
    }, 2000);

    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 2500);

    async function checkSession() {
      try {
        const res = await fetch('/api/admin/auth', {
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(fetchTimeout);

        if (res.ok) {
          const data = await res.json();
          if (data && data.authenticated) {
            setIsAuthenticated(true);
            try { localStorage.setItem('sevaya_admin_logged_in', '1'); } catch {}
          } else {
            setIsAuthenticated(false);
            try { localStorage.removeItem('sevaya_admin_logged_in'); } catch {}
          }
        } else {
          setIsAuthenticated(false);
          try { localStorage.removeItem('sevaya_admin_logged_in'); } catch {}
        }
      } catch {
        // Jika offline atau fetch gagal/timeout, cek localStorage sebagai fallback lokal
        try {
          if (localStorage.getItem('sevaya_admin_logged_in') === '1') {
            setIsAuthenticated(true);
          }
        } catch {}
      } finally {
        isFinished = true;
        clearTimeout(fetchTimeout);
        clearTimeout(hardTimeout);
        setAuthChecked(true);
      }
    }

    checkSession();

    return () => {
      isFinished = true;
      clearTimeout(fetchTimeout);
      clearTimeout(hardTimeout);
      controller.abort();
    };
  }, []);

  // ΓöÇΓöÇ Admin Active Tab & Mobile Drawer (Persisted across refreshes) ΓöÇΓöÇ
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
        'inventory',
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

  // ΓöÇΓöÇ Data State ΓöÇΓöÇ
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [sections, setSections] = useState<SiteSectionsConfig>(getCachedSiteSections);
  const isSectionsLoadedFromServer = useRef(false);
  const [selectedLookbookVolId, setSelectedLookbookVolId] = useState('vol-1');
  const [mediaFiles, setMediaFiles] = useState<StorageFile[]>([]);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ΓöÇΓöÇ News & Articles State ΓöÇΓöÇ
  const [articles, setArticles] = useState<Article[]>([]);
  const [newsFilterCategory, setNewsFilterCategory] = useState('All Stories');
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState<ArticleFormData>({
    title: '',
    slug: '',
    category: 'Journal',
    date: '',
    readTime: '4 min read',
    excerpt: '',
    content: '',
    image: '/images/catalog/catalog-11.jpg',
    hero_caption: 'Atelier notes, an intimate gathering and honest reflections on modest grace.',
    images: [],
    image_captions: [],
    featured: false,
  });

  // ΓöÇΓöÇ Product Modal (Create / Edit) ΓöÇΓöÇ
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    title: '',
    slug: '',
    edition: '',
    price: 1339000,
    original_price: 1489000,
    badge: '',
    image: '/images/catalog/catalog-01.jpg',
    inStock: false,
    hidden: true,
    stock: 0,
    sizes: ['S', 'M', 'L'],
    swatches: [
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-01.jpg' },
      { name: 'Garnet', color: '#6B2D2B', image: '/images/catalog/catalog-06.jpg' },
    ],
    description: '',
    fabric: '',
    material: '',
    sizing: '',
  });

  // ΓöÇΓöÇ Image Picker Modal State ΓöÇΓöÇ
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<ImagePickerTarget>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ΓöÇΓöÇ Hero Image Cropper ΓöÇΓöÇ
  const { openCropper: openHeroCropper, cropperProps: heroCropperProps } = useHeroImageCropper({
    onUploaded: (url, target) => {
      setSections((prev) => {
        const next = {
          ...prev,
          hero: {
            ...prev.hero,
            ...(target === 'mobile' ? { mobileImage: url } : { image: url }),
          },
        };
        saveSiteSections(next);
        return next;
      });
      showToast(target === 'mobile' ? 'Foto Hero Mobile tersimpan otomatis!' : 'Foto Hero Desktop tersimpan otomatis!');
    },
    onLoadingChange: (loading) => setIsUploading(loading),
    onError: (msg) => showToast(msg),
  });

  // Fetch data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    setSections(getCachedSiteSections());

    Promise.all([getDbProducts(true), getSiteSections(true), getInventoryVariants()])
      .then(([dbProds, siteSections, invVariants]) => {
        if (!isMounted) return;
        const syncedProds = dbProds.map((p) => {
          const pVariants = invVariants.filter((v) => v.productId === String(p.id));
          if (pVariants.length > 0) {
            const totalStock = pVariants.reduce((sum, v) => sum + v.stock, 0);
            return {
              ...p,
              stock: totalStock,
              inStock: totalStock > 0,
            };
          }
          return p;
        });
        setProducts(syncedProds);
        setSections(siteSections);
        isSectionsLoadedFromServer.current = true;
      })
      .catch(() => {
        showToast('Gagal memuat data dari Supabase');
      });

    listUploadedFiles()
      .then((storageFiles) => {
        if (isMounted) setMediaFiles(storageFiles);
      })
      .catch(() => {});

    fetch('/api/articles?admin=true')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && Array.isArray(data.articles)) {
          setArticles(data.articles);
        }
      })
      .catch(() => {});

    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && Array.isArray(data.data)) {
          setOrdersCount(data.data.length);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, showToast]);

  // ΓöÇΓöÇ Admin Login Handlers ΓöÇΓöÇ
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
        try { localStorage.setItem('sevaya_admin_logged_in', '1'); } catch {}
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
    try { localStorage.removeItem('sevaya_admin_logged_in'); } catch {}
    setAdminUsername('');
    setAdminPassword('');
    showToast('Admin logged out.');
  };

  // ΓöÇΓöÇ Product CRUD Handlers ΓöÇΓöÇ
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      slug: '',
      category: 'abaya',
      edition: '',
      price: 1350000,
      original_price: 1500000,
      badge: 'Baru',
      image: '/images/catalog/catalog-01.jpg',
      inStock: false,
      hidden: true,
      stock: 0,
      sizes: ['S', 'M', 'L'],
      swatches: [
        { name: 'Obsidian Black', color: '#1A1A1A', image: '/images/catalog/catalog-01.jpg' },
        { name: 'Garnet Maroon', color: '#6B2D2B', image: '/images/catalog/catalog-06.jpg' },
        { name: 'Caramel Dune', color: '#C68B59', image: '/images/catalog/catalog-08.jpg' },
        { name: 'Peach Bloom', color: '#E5A894', image: '/images/catalog/catalog-10.jpg' },
      ],
      description: '',
      fabric: '',
      material: '',
      sizing: '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: DbProduct) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      slug: product.slug,
      category:
        product.category ||
        (product.title.toLowerCase().includes('khimar') || product.title.toLowerCase().includes('veil')
          ? 'khimar'
          : 'abaya'),
      edition: product.edition || '',
      price: product.price,
      original_price: product.original_price || product.price,
      badge: product.badge || '',
      image: product.image,
      inStock: product.inStock !== false,
      hidden: product.hidden === true,
      stock: typeof product.stock === 'number' ? product.stock : (product.inStock === false ? 0 : 25),
      sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L'],
      swatches:
        product.swatches && product.swatches.length > 0
          ? product.swatches.map((s) => ({
              name: s.name,
              color: s.color,
              image: s.image || product.image,
              images: Array.isArray(s.images) ? s.images : [],
            }))
          : [
              { name: 'Black', color: '#000000', image: product.image },
              { name: 'Garnet', color: '#6B2D2B', image: product.image },
            ],
      description: product.description || '',
      fabric: (product as any).fabric || '',
      material: (product as any).material || '',
      sizing: (product as any).sizing || '',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) {
      showToast('Harap isi judul dan harga produk');
      return;
    }

    // Block duplicate product names
    const currentId = editingProduct ? String(editingProduct.id) : null;
    const isDuplicate = products.some(
      (p) => String(p.id) !== currentId && p.title.trim().toLowerCase() === productForm.title.trim().toLowerCase()
    );
    if (isDuplicate) {
      showToast('Nama produk sudah digunakan. Gunakan nama yang berbeda.');
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
      const targetBadge = (productForm.badge || '').trim();
      if (targetBadge && (targetBadge.toLowerCase() === 'best seller' || targetBadge.toLowerCase() === 'trending')) {
        const currentTargetId = editingProduct ? String(editingProduct.id) : null;
        const othersWithBadge = products.filter(
          (p) => String(p.id) !== currentTargetId && (p.badge || '').trim().toLowerCase() === targetBadge.toLowerCase()
        );
        for (const other of othersWithBadge) {
          await updateDbProduct(other.id, { badge: '' });
        }
      }

      if (editingProduct) {
        const updated = await updateDbProduct(editingProduct.id, {
          ...productForm,
          slug,
        });
        if (updated) {
          try {
            await fetch('/api/admin/inventory', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-key': 'sevaya-admin',
              },
              body: JSON.stringify({
                action: 'ensure_product',
                product: updated,
              }),
            });
          } catch {
            // ignore
          }
          await ensureVariantsForProduct(updated);
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id === editingProduct.id) return updated;
              if (
                targetBadge &&
                (targetBadge.toLowerCase() === 'best seller' || targetBadge.toLowerCase() === 'trending') &&
                (p.badge || '').trim().toLowerCase() === targetBadge.toLowerCase()
              ) {
                return { ...p, badge: '' };
              }
              return p;
            })
          );
          showToast(`Produk "${updated.title}" berhasil diperbarui & varian stok disinkronkan!`);
        }
      } else {
        const created = await createDbProduct({
          ...productForm,
          slug,
          stock: 0,
          inStock: false,
          hidden: productForm.hidden ?? true,
        });
        try {
          await fetch('/api/admin/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-key': 'sevaya-admin',
            },
            body: JSON.stringify({
              action: 'ensure_product',
              product: created,
            }),
          });
        } catch {
          // ignore
        }
        await ensureVariantsForProduct(created);
        setProducts((prev) => [
          created,
          ...prev.map((p) => {
            if (
              targetBadge &&
              (targetBadge.toLowerCase() === 'best seller' || targetBadge.toLowerCase() === 'trending') &&
              (p.badge || '').trim().toLowerCase() === targetBadge.toLowerCase()
            ) {
              return { ...p, badge: '' };
            }
            return p;
          }),
        ]);
        showToast(`Produk "${created.title}" berhasil ditambahkan (stok 0 pcs, auto-hide aktif).`);
      }
      setIsProductModalOpen(false);
    } catch {
      showToast('Gagal menyimpan produk ke Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string | number, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus produk "${title}"? Seluruh varian stok produk ini juga akan dibersihkan.`)) return;

    setIsLoading(true);
    try {
      // 1. Hapus dari katalog produk
      await deleteDbProduct(id);

      // 2. Hapus seluruh varian inventaris di server & client
      try {
        await fetch('/api/admin/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': 'sevaya-admin',
          },
          body: JSON.stringify({
            action: 'delete_product_variants',
            productId: String(id),
          }),
        });
      } catch (invErr) {
        console.warn('Gagal menghapus varian via API:', invErr);
      }
      await deleteInventoryVariantsForProduct(id);

      // Invalidate cache
      invalidateProductsCache();
      invalidateInventoryCache();

      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
      showToast(`Produk "${title}" dan seluruh varian stoknya telah berhasil dihapus.`);
    } catch {
      showToast('Gagal menghapus produk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshProducts = async () => {
    setIsLoading(true);
    try {
      // Hapus cache client-side (memory + localStorage) agar fetch benar-benar fresh
      invalidateProductsCache();
      invalidateInventoryCache();
      const [dbProds, invVariants] = await Promise.all([
        getDbProducts(true),
        getInventoryVariants(true),
      ]);
      const syncedProds = dbProds.map((p) => {
        const pVariants = invVariants.filter((v) => v.productId === String(p.id));
        if (pVariants.length > 0) {
          const totalStock = pVariants.reduce((sum, v) => sum + v.stock, 0);
          return {
            ...p,
            stock: totalStock,
            inStock: totalStock > 0,
          };
        }
        return p;
      });
      setProducts(syncedProds);
      showToast('Katalog produk berhasil diperbarui');
    } catch {
      showToast('Gagal menyegarkan katalog produk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockMutated = (productId: string, totalStock: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        String(p.id) === String(productId)
          ? { ...p, stock: totalStock, inStock: totalStock > 0 }
          : p
      )
    );
  };

  const handleToggleHide = async (product: DbProduct) => {
    const updated = await updateDbProduct(product.id, {
      hidden: !product.hidden,
    });
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      showToast(
        updated.hidden
          ? `"${updated.title}" disembunyikan dari toko.`
          : `"${updated.title}" ditampilkan kembali di toko.`,
      );
    }
  };

  const handleSetBadge = async (product: DbProduct, newBadge: string) => {
    const isCurrentBadge = (product.badge || '').trim().toLowerCase() === newBadge.trim().toLowerCase();
    const finalBadge = isCurrentBadge ? '' : newBadge.trim();

    setIsLoading(true);
    try {
      // Jika menyematkan 'Best Seller' atau 'Trending', lepaskan badge tersebut dari produk lain agar tidak ganda
      if (finalBadge && (finalBadge.toLowerCase() === 'best seller' || finalBadge.toLowerCase() === 'trending')) {
        const othersWithBadge = products.filter(
          (p) => String(p.id) !== String(product.id) && (p.badge || '').trim().toLowerCase() === finalBadge.toLowerCase()
        );
        for (const other of othersWithBadge) {
          await updateDbProduct(other.id, { badge: '' });
        }
      }

      const updated = await updateDbProduct(product.id, { badge: finalBadge });
      if (updated) {
        setProducts((prev) =>
          prev.map((p) => {
            if (String(p.id) === String(product.id)) {
              return updated;
            }
            if (
              finalBadge &&
              (finalBadge.toLowerCase() === 'best seller' || finalBadge.toLowerCase() === 'trending') &&
              (p.badge || '').trim().toLowerCase() === finalBadge.toLowerCase()
            ) {
              return { ...p, badge: '' };
            }
            return p;
          })
        );

        if (finalBadge) {
          showToast(`Status "${finalBadge}" berhasil dipindahkan ke "${product.title}"!`);
        } else {
          showToast(`Badge dihapus dari "${product.title}".`);
        }
      }
    } catch (err) {
      console.error('Failed to update product badge:', err);
      showToast('Gagal mengubah badge produk');
    } finally {
      setIsLoading(false);
    }
  };

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

  /** Update foto ekstra (foto 2ΓÇô4) untuk satu swatch. photoIndex: 1-based (1=foto2, 2=foto3, 3=foto4). */
  const handleUpdateSwatchExtraPhoto = (swatchIndex: number, photoIndex: number, val: string) => {
    setProductForm((prev) => {
      const next = [...prev.swatches];
      if (!next[swatchIndex]) return prev;
      const currentImages = Array.isArray(next[swatchIndex]!.images)
        ? [...next[swatchIndex]!.images!]
        : ['', '', ''];
      // Pastikan array punya 3 slot
      while (currentImages.length < 3) currentImages.push('');
      currentImages[photoIndex - 1] = val;
      next[swatchIndex] = { ...next[swatchIndex]!, images: currentImages.slice(0, 3) };
      return { ...prev, swatches: next };
    });
  };

  /** Update foto untuk satu swatch sekaligus (hingga 4 foto: 1 cover + 3 ekstra). */
  const handleUpdateSwatchAllPhotos = (swatchIndex: number, photos: string[]) => {
    setProductForm((prev) => {
      const next = [...prev.swatches];
      if (!next[swatchIndex]) return prev;
      const clean = photos.filter(Boolean);
      const cover = clean[0] || next[swatchIndex]!.image || prev.image || '/images/catalog/catalog-01.jpg';
      const extras = clean.slice(1, 4);
      next[swatchIndex] = {
        ...next[swatchIndex]!,
        image: cover,
        images: extras,
      };
      return { ...prev, swatches: next };
    });
  };

  // ΓöÇΓöÇ Apply selected or uploaded image to target ΓöÇΓöÇ
  const applyImageToTarget = (target: ImagePickerTarget, urlOrPath: string) => {
    if (!target) return;

    if (target === 'product') {
      setProductForm((prev) => ({
        ...prev,
        image: urlOrPath,
        swatches: prev.swatches.map((s, idx) =>
          idx === 0 || !s.image || s.image.startsWith('/images/catalog/')
            ? { ...s, image: urlOrPath }
            : s
        ),
      }));
    } else if (target.startsWith('swatch-')) {
      if (target.includes('-photo-')) {
        // e.g. swatch-0-photo-1 ΓåÆ swatchIdx=0, photoIdx=1
        const parts = target.split('-');
        const swatchIdx = parseInt(parts[1]!, 10);
        const photoIdx = parseInt(parts[3]!, 10);
        handleUpdateSwatchExtraPhoto(swatchIdx, photoIdx, urlOrPath);
      } else {
        const swatchIdx = parseInt(target.replace('swatch-', ''), 10);
        handleUpdateSwatch(swatchIdx, 'image', urlOrPath);
      }
    } else if (target === 'hero') {
      setSections((prev) => {
        const next = { ...prev, hero: { ...prev.hero, image: urlOrPath } };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto Hero Desktop tersimpan otomatis!');
    } else if (target === 'hero-mobile') {
      setSections((prev) => {
        const next = { ...prev, hero: { ...prev.hero, mobileImage: urlOrPath } };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto Hero Mobile tersimpan otomatis!');
    } else if (target === 'closer-look') {
      setSections((prev) => {
        const next = {
          ...prev,
          closerLook: {
            ...(prev.closerLook || DEFAULT_CLOSER_LOOK),
            image: urlOrPath,
          },
        };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto Closer Look tersimpan otomatis!');
    } else if (target === 'spotlight-0') {
      setSections((prev) => {
        const nextSpotlight = [...prev.spotlight];
        if (nextSpotlight[0]) nextSpotlight[0] = { ...nextSpotlight[0], image: urlOrPath };
        const next = { ...prev, spotlight: nextSpotlight };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto Spotlight Abaya tersimpan otomatis!');
    } else if (target === 'spotlight-1') {
      setSections((prev) => {
        const nextSpotlight = [...prev.spotlight];
        if (nextSpotlight[1]) nextSpotlight[1] = { ...nextSpotlight[1], image: urlOrPath };
        const next = { ...prev, spotlight: nextSpotlight };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto Spotlight Khimar tersimpan otomatis!');
    } else if (target === 'home-about-1') {
      setSections((prev) => {
        const nextNarrative = { ...(prev.narrative || {}), aboutImage1: urlOrPath };
        const next = { ...prev, narrative: nextNarrative };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto About SEVAYA #1 tersimpan otomatis!');
    } else if (target === 'home-about-2') {
      setSections((prev) => {
        const nextNarrative = { ...(prev.narrative || {}), aboutImage2: urlOrPath };
        const next = { ...prev, narrative: nextNarrative };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto About SEVAYA #2 tersimpan otomatis!');
    } else if (target === 'home-video-poster') {
      setSections((prev) => {
        const nextNarrative = { ...(prev.narrative || {}), videoPoster: urlOrPath };
        const next = { ...prev, narrative: nextNarrative };
        saveSiteSections(next);
        return next;
      });
      showToast('Cover video beranda tersimpan otomatis!');
    } else if (target === 'textiles') {
      setSections((prev) => {
        const next = {
          ...prev,
          missionTextiles: { ...prev.missionTextiles, image: urlOrPath },
        };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto tersimpan otomatis!');
    } else if (target === 'journal-0') {
      setSections((prev) => {
        const nextJournal = [...prev.journal];
        if (nextJournal[0]) nextJournal[0] = { ...nextJournal[0], image: urlOrPath };
        const next = { ...prev, journal: nextJournal };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto tersimpan otomatis!');
    } else if (target === 'journal-1') {
      setSections((prev) => {
        const nextJournal = [...prev.journal];
        if (nextJournal[1]) nextJournal[1] = { ...nextJournal[1], image: urlOrPath };
        const next = { ...prev, journal: nextJournal };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto tersimpan otomatis!');
    } else if (target.startsWith('lookbook-')) {
      const idx = parseInt(target.replace('lookbook-', ''), 10);
      setSections((prev) => {
        const nextLb = [...prev.lookbook];
        if (nextLb[idx]) nextLb[idx] = { ...nextLb[idx]!, image: urlOrPath };
        const next = { ...prev, lookbook: nextLb };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto tersimpan otomatis!');
    } else if (target.startsWith('lbpage-')) {
      const key = target.replace('lbpage-', '');
      setSections((prev) => {
        const currentVolConfig =
          prev.lookbookVolumesConfig?.[selectedLookbookVolId] ||
          prev.lookbookPage ||
          DEFAULT_SITE_SECTIONS.lookbookPage!;
        const updatedVolConfig = { ...currentVolConfig, [key]: urlOrPath };
        const next = {
          ...prev,
          lookbookVolumesConfig: {
            ...(prev.lookbookVolumesConfig || {}),
            [selectedLookbookVolId]: updatedVolConfig,
          },
          lookbookPage: selectedLookbookVolId === 'vol-1' ? updatedVolConfig : prev.lookbookPage,
        };
        saveSiteSections(next);
        return next;
      });
      showToast(`Foto tersimpan otomatis untuk ${selectedLookbookVolId.toUpperCase()}!`);
    } else if (target === 'conscious-hero') {
      setSections((prev) => {
        const next = {
          ...prev,
          consciousPage: {
            ...(prev.consciousPage || {}),
            heroImage: urlOrPath,
          },
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            heroImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto hero about tersimpan!');
    } else if (target === 'conscious-inspo') {
      setSections((prev) => {
        const next = {
          ...prev,
          consciousPage: {
            ...(prev.consciousPage || {}),
            inspoImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto inspirasi tersimpan!');
    } else if (target === 'conscious-founder') {
      setSections((prev) => {
        const next = {
          ...prev,
          consciousPage: {
            ...(prev.consciousPage || {}),
            founderImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto founder tersimpan!');
    } else if (target === 'conscious-bemberg') {
      setSections((prev) => {
        const next = {
          ...prev,
          consciousPage: { ...(prev.consciousPage || {}), bembergImage: urlOrPath },
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            bembergImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto Bemberg tersimpan!');
    } else if (target === 'conscious-tencel') {
      setSections((prev) => {
        const next = {
          ...prev,
          consciousPage: { ...(prev.consciousPage || {}), tencelImage: urlOrPath },
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            tencelImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto Tencel tersimpan!');
    } else if (target === 'conscious-linen') {
      setSections((prev) => {
        const next = {
          ...prev,
          consciousPage: { ...(prev.consciousPage || {}), linenImage: urlOrPath },
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            linenImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto Linen tersimpan!');
    } else if (target === 'conscious-modal') {
      setSections((prev) => {
        const next = {
          ...prev,
          consciousPage: { ...(prev.consciousPage || {}), modalImage: urlOrPath },
          conscious: {
            ...(prev.conscious || DEFAULT_SITE_SECTIONS.conscious!),
            modalImage: urlOrPath,
          },
        };
        saveSiteSections(next);
        return next;
      });
      showToast('Foto Modal tersimpan!');
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

  // ΓöÇΓöÇ News & Articles Handlers ΓöÇΓöÇ
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
      hero_caption: '',
      images: [],
      image_captions: [],
      featured: false,
    });
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticleModal = (art: Article) => {
    setEditingArticle(art);
    // Jika artikel memiliki hero_caption (bahkan jika string kosong karena dihapus), gunakan itu
    const heroCaption = typeof art.hero_caption === 'string' ? art.hero_caption : '';

    const initialImages =
      Array.isArray(art.images) && art.images.length > 0
        ? art.images
        : [];

    const initialCaptions = initialImages.map((_, i) => {
      const existing = (art as any).image_captions?.[i];
      return typeof existing === 'string' ? existing : '';
    });

    setArticleForm({
      title: art.title,
      slug: art.slug,
      category: art.category,
      date: art.date,
      readTime: art.read_time,
      excerpt: art.excerpt,
      content: Array.isArray(art.content)
        ? art.content.join('\n\n')
        : ((art.content as unknown as string) || ''),
      image: art.image || '/images/catalog/catalog-11.jpg',
      hero_caption: heroCaption,
      featured: Boolean(art.featured),
      images: initialImages,
      image_captions: initialCaptions,
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
            hero_caption: articleForm.hero_caption?.trim() || '',
            images: articleForm.images,
            image_captions: articleForm.image_captions ?? [],
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
            hero_caption: articleForm.hero_caption?.trim() || '',
            images: articleForm.images,
            image_captions: articleForm.image_captions ?? [],
            featured: articleForm.featured,
            published: true,
          }),
        });
        const data = await res.json();
        if (res.ok && data.article) {
          setArticles((prev) =>
            articleForm.featured
              ? [data.article, ...prev.map((a) => ({ ...a, featured: false }))]
              : [data.article, ...prev],
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
          })),
        );
        showToast('Status Featured artikel diperbarui!');
      }
    } catch {
      showToast('Gagal memperbarui status featured');
    }
  };

  // ΓöÇΓöÇ Direct Image Upload Handler ΓöÇΓöÇ
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Khusus target hero: buka image cropper dulu sebelum upload
    if (imagePickerTarget === 'hero' || imagePickerTarget === 'hero-mobile') {
      const mode = imagePickerTarget === 'hero-mobile' ? 'mobile' : 'desktop';
      setIsImagePickerOpen(false);
      openHeroCropper(file, mode);
      // Reset input agar file yang sama bisa dipilih lagi
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadFileToStorage(file);
      showToast('Gambar berhasil diunggah ke Supabase Cloud!');

      applyImageToTarget(imagePickerTarget, publicUrl);

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

  /**
   * Upload langsung dengan target yang diberikan secara eksplisit (sinkron),
   * dipakai saat tombol "Unggah File" di form produk/swatch diklik ΓÇö
   * sehingga galeri TIDAK perlu dibuka dulu.
   */
  const handleFileUploadDirect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: ImagePickerTarget
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Khusus target hero: buka image cropper dulu sebelum upload
    if (target === 'hero' || target === 'hero-mobile') {
      const mode = target === 'hero-mobile' ? 'mobile' : 'desktop';
      openHeroCropper(file, mode);
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadFileToStorage(file);
      showToast('Gambar berhasil diunggah!');

      // Gunakan target yang diberikan langsung (bukan dari state yang mungkin belum ter-update)
      applyImageToTarget(target, publicUrl);

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

  // Handler khusus untuk HomeSectionsTab — menerima (target, file) langsung
  const handleSectionFileUpload = async (target: ImagePickerTarget, file: File): Promise<void> => {
    if (!file) return;
    // Khusus target hero: buka image cropper dulu
    if (target === 'hero' || target === 'hero-mobile') {
      const mode = target === 'hero-mobile' ? 'mobile' : 'desktop';
      openHeroCropper(file, mode);
      return;
    }
    setIsUploading(true);
    try {
      const publicUrl = await uploadFileToStorage(file);
      showToast('Gambar berhasil diunggah!');
      applyImageToTarget(target, publicUrl);
      const updatedFiles = await listUploadedFiles();
      setMediaFiles(updatedFiles);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah file';
      showToast(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const currentPickerImage = useMemo(() => {
    if (!imagePickerTarget) return undefined;
    if (imagePickerTarget === 'product') return productForm.image;
    if (imagePickerTarget.startsWith('swatch-')) {
      if (imagePickerTarget.includes('-photo-')) {
        const parts = imagePickerTarget.split('-');
        const idx = parseInt(parts[1]!, 10);
        const photoIdx = parseInt(parts[3]!, 10);
        return productForm.swatches[idx]?.images?.[photoIdx - 1];
      }
      const idx = parseInt(imagePickerTarget.replace('swatch-', ''), 10);
      return productForm.swatches[idx]?.image;
    }
    if (imagePickerTarget === 'hero') return sections.hero.image;
    if (imagePickerTarget === 'hero-mobile') return sections.hero.mobileImage || sections.hero.image;
    if (imagePickerTarget === 'closer-look') return sections.closerLook?.image || DEFAULT_CLOSER_LOOK.image;
    if (imagePickerTarget === 'spotlight-0') return sections.spotlight[0]?.image;
    if (imagePickerTarget === 'spotlight-1') return sections.spotlight[1]?.image;
    if (imagePickerTarget === 'textiles') return sections.missionTextiles.image;
    if (imagePickerTarget === 'journal-0') return sections.journal[0]?.image;
    if (imagePickerTarget === 'journal-1') return sections.journal[1]?.image;
    if (imagePickerTarget === 'article') return articleForm.image;
    return undefined;
  }, [imagePickerTarget, productForm, sections, articleForm]);

  const handleSelectPredefinedImage = (imagePath: string) => {
    // Khusus target hero: buka image cropper agar user bisa atur crop sebelum pasang
    if (imagePickerTarget === 'hero' || imagePickerTarget === 'hero-mobile') {
      const mode = imagePickerTarget === 'hero-mobile' ? 'mobile' : 'desktop';
      setIsImagePickerOpen(false);
      openHeroCropper(imagePath, mode);
      return;
    }
    applyImageToTarget(imagePickerTarget, imagePath);
    setIsImagePickerOpen(false);
    showToast('Gambar berhasil dipilih!');
  };

  const handleSelectImages = (images: string[]) => {
    if (!imagePickerTarget) return;

    // Khusus target hero dari modal picker: buka image cropper
    if ((imagePickerTarget === 'hero' || imagePickerTarget === 'hero-mobile') && images[0]) {
      const mode = imagePickerTarget === 'hero-mobile' ? 'mobile' : 'desktop';
      setIsImagePickerOpen(false);
      openHeroCropper(images[0], mode);
      return;
    }

    if (imagePickerTarget.startsWith('swatch-')) {
      const parts = imagePickerTarget.split('-');
      const swatchIdx = parseInt(parts[1]!, 10);

      // Jika user memilih banyak foto (> 1): langsung mengisi slot 1, 2, 3, 4 sekaligus!
      if (images.length > 1) {
        handleUpdateSwatchAllPhotos(swatchIdx, images);
        setIsImagePickerOpen(false);
        showToast(`Γ£ô Berhasil mengisi ${images.length} slot foto untuk warna ini!`);
        return;
      }

      // Jika user memilih 1 foto:
      if (images.length === 1) {
        if (imagePickerTarget.includes('-photo-')) {
          const photoIdx = parseInt(parts[3]!, 10);
          handleUpdateSwatchExtraPhoto(swatchIdx, photoIdx, images[0]!);
        } else {
          handleUpdateSwatch(swatchIdx, 'image', images[0]!);
        }
        setIsImagePickerOpen(false);
        showToast('Gambar berhasil dipilih!');
        return;
      }
    }

    if (images[0]) {
      applyImageToTarget(imagePickerTarget, images[0]);
    }
    setIsImagePickerOpen(false);
    showToast('Gambar berhasil dipilih!');
  };

  // ΓöÇΓöÇ Auto-save sections debounce (hanya aktif setelah data berhasil dimuat dari server) ΓöÇΓöÇ
  useEffect(() => {
    if (!isSectionsLoadedFromServer.current) return;
    const timer = setTimeout(() => {
      saveSiteSections(sections);
    }, 1200);
    return () => clearTimeout(timer);
  }, [sections]);

  // Filtered products list
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.edition && p.edition.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // 0. AUTH HYDRATION CHECK
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

  // 1. ADMIN LOGIN VIEW
  if (!isAuthenticated) {
    return (
      <AdminLoginView
        adminUsername={adminUsername}
        setAdminUsername={setAdminUsername}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        authError={authError}
        onLogin={handleAdminLogin}
      />
    );
  }

  // 2. ADMIN STUDIO DASHBOARD
  return (
    <div className="min-h-screen w-full bg-[#f9f9f8] text-[#1a1c1c] antialiased">
      {/* Navigation Sidebar & Drawer */}
      <AdminSidebar
        isSidebarOpen={isSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ordersCount={ordersCount}
        productsCount={products.length}
        articlesCount={articles.length}
        mediaCount={mediaFiles.length || 18}
        onLogout={handleAdminLogout}
      />

      {/* Header Bar */}
      <AdminHeader
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Tab Content */}
      <main
        className={`relative min-h-screen bg-[#f9f9f8] px-3 pb-16 pt-16 sm:px-5 sm:pt-20 lg:px-6 xl:px-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-0'
        }`}
      >
        {activeTab === 'orders' && <BiteshipSimulatorDashboard onOrdersCountChange={setOrdersCount} />}

        {activeTab === 'inventory' && (
          <InventoryTab products={products} onStockMutated={handleStockMutated} />
        )}

        {activeTab === 'catalog' && (
          <CatalogTab
            products={products}
            filteredProducts={filteredProducts}
            isLoading={isLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenCreateModal={handleOpenCreateModal}
            onOpenEditModal={handleOpenEditModal}
            onToggleHide={handleToggleHide}
            onSetBadge={handleSetBadge}
            onDeleteProduct={handleDeleteProduct}
            onRefresh={handleRefreshProducts}
          />
        )}

        {activeTab === 'section-home' && (
          <HomeSectionsTab
            sections={sections}
            setSections={setSections}
            articles={articles}
            onOpenImagePicker={(target) => {
              setImagePickerTarget(target);
              setIsImagePickerOpen(true);
            }}
            onFileUploadDirect={handleSectionFileUpload}
            showToast={showToast}
          />
        )}

        {activeTab === 'section-news' && (
          <NewsTab
            articles={articles}
            newsFilterCategory={newsFilterCategory}
            setNewsFilterCategory={setNewsFilterCategory}
            newsSearchQuery={newsSearchQuery}
            setNewsSearchQuery={setNewsSearchQuery}
            onOpenCreateArticleModal={handleOpenCreateArticleModal}
            onOpenEditArticleModal={handleOpenEditArticleModal}
            onToggleFeaturedArticle={handleToggleFeaturedArticle}
            onDeleteArticle={handleDeleteArticle}
          />
        )}

        {activeTab === 'section-lookbook' && (
          <LookbookTab
            sections={sections}
            setSections={setSections}
            selectedLookbookVolId={selectedLookbookVolId}
            setSelectedLookbookVolId={setSelectedLookbookVolId}
            onOpenImagePicker={(target) => {
              setImagePickerTarget(target);
              setIsImagePickerOpen(true);
            }}
            showToast={showToast}
            products={products}
          />
        )}

        {activeTab === 'section-conscious' && (
          <ConsciousTab
            sections={sections}
            setSections={setSections}
            showToast={showToast}
            onOpenImagePicker={(target) => {
              setImagePickerTarget(target);
              setIsImagePickerOpen(true);
            }}
          />
        )}

        {activeTab === 'media' && (
          <MediaLibraryTab
            onFileUpload={handleFileUpload}
            showToast={showToast}
          />
        )}

        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Product CRUD Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        editingProduct={editingProduct}
        products={products}
        productForm={productForm}
        setProductForm={setProductForm}
        onSave={handleSaveProduct}
        onAddSwatch={handleAddSwatch}
        onRemoveSwatch={handleRemoveSwatch}
        onUpdateSwatch={handleUpdateSwatch}
        onUpdateSwatchExtraPhoto={handleUpdateSwatchExtraPhoto}
        onOpenImagePicker={(target) => {
          setImagePickerTarget(target);
          setIsImagePickerOpen(true);
        }}
        onSetImageTarget={(target) => {
          // Hanya set target upload tanpa membuka galeri
          setImagePickerTarget(target);
        }}
        onFileUpload={handleFileUpload}
        onFileUploadDirect={handleFileUploadDirect}
        isLoading={isLoading}
        isUploading={isUploading}
      />

      {/* Article CRUD Modal */}
      <ArticleModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        editingArticle={editingArticle}
        articleForm={articleForm}
        setArticleForm={setArticleForm}
        onSave={handleSaveArticle}
        onOpenImagePicker={(target) => {
          setImagePickerTarget(target);
          setIsImagePickerOpen(true);
        }}
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
        showToast={showToast}
      />

      {/* Universal Image Picker Modal */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelectImage={handleSelectPredefinedImage}
        onSelectImages={handleSelectImages}
        currentImage={currentPickerImage}
        maxSelect={imagePickerTarget?.startsWith('swatch-') ? 4 : 1}
      />

      {/* Hero Image Cropper Modal */}
      <ImageCropperModal {...heroCropperProps} />
    </div>
  );
}
