'use client';

import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from 'react';
import { useToast } from '@/context/ToastContext';
import {
  getDbProducts,
  createDbProduct,
  updateDbProduct,
  deleteDbProduct,
  DbProduct,
  getSiteSections,
  getCachedSiteSections,
  saveSiteSections,
  SiteSectionsConfig,
  DEFAULT_SITE_SECTIONS,
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

// Admin Tabs
import { BiteshipSimulatorDashboard } from '@/components/admin/BiteshipSimulatorDashboard';
import { CatalogTab } from '@/components/admin/tabs/CatalogTab';
import { HomeSectionsTab } from '@/components/admin/tabs/HomeSectionsTab';
import { NewsTab } from '@/components/admin/tabs/NewsTab';
import { LookbookTab } from '@/components/admin/tabs/LookbookTab';
import { ConsciousTab } from '@/components/admin/tabs/ConsciousTab';
import { MediaLibraryTab } from '@/components/admin/tabs/MediaLibraryTab';
import { SettingsTab } from '@/components/admin/tabs/SettingsTab';

export default function AdminPage() {
  const { showToast } = useToast();

  // ── Authentication State ──
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
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
  const [selectedLookbookVolId, setSelectedLookbookVolId] = useState('vol-1');
  const [, setMediaFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── News & Articles State ──
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
    images: [],
    featured: false,
  });

  // ── Product Modal (Create / Edit) ──
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

  // ── Admin Login Handlers ──
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
        const updated = await updateDbProduct(editingProduct.id, {
          ...productForm,
          slug,
        });
        if (updated) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
          showToast(`Produk "${updated.title}" berhasil diperbarui!`);
        }
      } else {
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
        showToast(`Foto tersimpan otomatis untuk ${selectedLookbookVolId.toUpperCase()}!`);
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
      content: Array.isArray(art.content)
        ? art.content.join('\n\n')
        : ((art.content as unknown as string) || ''),
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

  // ── Direct Image Upload Handler ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const currentPickerImage = useMemo(() => {
    if (!imagePickerTarget) return undefined;
    if (imagePickerTarget === 'product') return productForm.image;
    if (imagePickerTarget.startsWith('swatch-')) {
      const idx = parseInt(imagePickerTarget.replace('swatch-', ''), 10);
      return productForm.swatches[idx]?.image;
    }
    if (imagePickerTarget === 'hero') return sections.hero.image;
    if (imagePickerTarget === 'spotlight-0') return sections.spotlight[0]?.image;
    if (imagePickerTarget === 'spotlight-1') return sections.spotlight[1]?.image;
    if (imagePickerTarget === 'textiles') return sections.missionTextiles.image;
    if (imagePickerTarget === 'journal-0') return sections.journal[0]?.image;
    if (imagePickerTarget === 'journal-1') return sections.journal[1]?.image;
    if (imagePickerTarget === 'article') return articleForm.image;
    return undefined;
  }, [imagePickerTarget, productForm, sections, articleForm]);

  const handleSelectPredefinedImage = (imagePath: string) => {
    applyImageToTarget(imagePickerTarget, imagePath);
    setIsImagePickerOpen(false);
    showToast('Gambar berhasil dipilih!');
  };

  // ── Auto-save sections debounce ──
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
        productsCount={products.length}
        articlesCount={articles.length}
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
        className={`relative min-h-screen bg-[#f9f9f8] px-3 pb-16 pt-16 sm:px-6 sm:pt-20 lg:px-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-0'
        }`}
      >
        {activeTab === 'orders' && <BiteshipSimulatorDashboard />}

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
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'section-home' && (
          <HomeSectionsTab
            sections={sections}
            setSections={setSections}
            onOpenImagePicker={(target) => {
              setImagePickerTarget(target);
              setIsImagePickerOpen(true);
            }}
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
          />
        )}

        {activeTab === 'section-conscious' && (
          <ConsciousTab
            sections={sections}
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
        productForm={productForm}
        setProductForm={setProductForm}
        onSave={handleSaveProduct}
        onAddSwatch={handleAddSwatch}
        onRemoveSwatch={handleRemoveSwatch}
        onUpdateSwatch={handleUpdateSwatch}
        onOpenImagePicker={(target) => {
          setImagePickerTarget(target);
          setIsImagePickerOpen(true);
        }}
        onFileUpload={handleFileUpload}
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
        currentImage={currentPickerImage}
      />
    </div>
  );
}
