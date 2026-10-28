'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/integrations/supabase';
import type { Address } from '@/components/profile/MyAddressesView';
import type { UserOrder } from '@/components/profile/MyOrdersView';

const INDONESIA_PROVINCES = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
  'Banten', 'Bali', 'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau',
  'Kepulauan Riau', 'Jambi', 'Sumatera Selatan', 'Kepulauan Bangka Belitung',
  'Bengkulu', 'Lampung', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan',
  'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Gorontalo',
  'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat'
];

const formatIDR = (n?: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

function getOrderStatusBadge(status: string, t?: (k: string) => string) {
  switch (status) {
    case 'pending_payment':
      return {
        label: t ? t('profile.status_pending') : 'Menunggu Pembayaran',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'processing':
    case 'paid':
      return {
        label: t ? t('profile.status_processing') : 'Sedang Dipersiapkan',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'shipped':
      return {
        label: t ? t('profile.status_shipped') : 'Dalam Pengiriman',
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'delivered':
      return {
        label: t ? t('profile.status_delivered') : 'Pesanan Selesai',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'cancelled':
      return {
        label: t ? t('profile.status_cancelled') : 'Dibatalkan',
        bg: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        dot: 'bg-neutral-400',
      };
    default:
      return {
        label: status.replace(/_/g, ' ').toUpperCase(),
        bg: 'bg-neutral-50 text-neutral-700 border-neutral-200',
        dot: 'bg-neutral-400',
      };
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser, getAccessToken } = useAuth();
  const { showToast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  // Orders state
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Address form fields
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('DKI Jakarta');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrSubmitting, setAddrSubmitting] = useState(false);

  // Profile edit modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Password change modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordMethod, setPasswordMethod] = useState<'old_password' | 'email'>('old_password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [emailResetSent, setEmailResetSent] = useState(false);
  const [emailResetLoading, setEmailResetLoading] = useState(false);

  // Marketing preferences state
  const [emailMarketing, setEmailMarketing] = useState(true);

  // Sync tab with URL search parameter
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'profile' || tab === 'orders') {
        setActiveTab(tab);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleTabChange = (tab: 'orders' | 'profile') => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  // Auth Protection Guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/user/orders', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false);
    }
  }, [getAccessToken]);

  // Fetch Addresses
  const fetchAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/user/addresses', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch {
      // ignore
    } finally {
      setAddressesLoading(false);
    }
  }, [getAccessToken]);

  // Lazy non-blocking data loading for smoother profile navigation
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();

    // Fetch addresses with a tiny idle delay so orders render immediately
    const timer = setTimeout(() => {
      fetchAddresses();
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, fetchOrders, fetchAddresses]);

  // Initialize edit profile form fields
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Nama lengkap wajib diisi');
      return;
    }
    setEditSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: editName.trim(),
          phone: editPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memperbarui profil');
      }
      updateUser({
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      showToast('Profil berhasil diperbarui');
      setIsEditProfileOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui profil');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Address Modal
  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddrRecipient(user?.name || '');
    setAddrPhone(user?.phone || '');
    setAddrLine('');
    setAddrCity('');
    setAddrProvince('DKI Jakarta');
    setAddrPostal('');
    setAddrIsDefault(addresses.length === 0);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: Address) => {
    setEditingAddress(addr);
    setAddrRecipient(addr.recipient_name);
    setAddrPhone(addr.phone);
    setAddrLine(addr.address_line);
    setAddrCity(addr.city);
    setAddrProvince(addr.province);
    setAddrPostal(addr.postal_code);
    setAddrIsDefault(addr.is_default);
    setIsAddressModalOpen(true);
  };

  // Handle Save Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrRecipient.trim() || !addrPhone.trim() || !addrLine.trim() || !addrCity.trim()) {
      showToast('Lengkapi semua data alamat');
      return;
    }
    setAddrSubmitting(true);
    try {
      const token = await getAccessToken();
      const payload = {
        recipient_name: addrRecipient.trim(),
        phone: addrPhone.trim(),
        address_line: addrLine.trim(),
        city: addrCity.trim(),
        province: addrProvince,
        postal_code: addrPostal.trim(),
        is_default: addrIsDefault,
      };

      const url = editingAddress ? `/api/user/addresses?id=${editingAddress.id}` : '/api/user/addresses';
      const method = editingAddress ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan alamat');
      }

      showToast(editingAddress ? 'Alamat berhasil diperbarui' : 'Alamat baru berhasil ditambahkan');
      setIsAddressModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan alamat');
    } finally {
      setAddrSubmitting(false);
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Hapus alamat ini dari buku alamat Anda?')) return;
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/user/addresses?id=${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menghapus');
      showToast('Alamat berhasil dihapus');
      fetchAddresses();
    } catch {
      showToast('Gagal menghapus alamat');
    }
  };

  // Handle Set Default Address
  const handleSetDefaultAddress = async (addr: Address) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/user/addresses?id=${addr.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...addr, is_default: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal');
      showToast('Alamat utama berhasil diperbarui');
      fetchAddresses();
    } catch {
      showToast('Gagal memperbarui alamat utama');
    }
  };

  const openPasswordModal = () => {
    setPasswordMethod('old_password');
    setEmailResetSent(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      showToast(language === 'id' ? 'Email akun tidak ditemukan' : 'Account email not found');
      return;
    }
    setEmailResetLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Gagal mengirim email reset');
      }
      setEmailResetSent(true);
      showToast(
        language === 'id'
          ? 'Link reset kata sandi telah dikirim ke email Anda'
          : 'Password reset link has been sent to your email'
      );
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim email reset');
    } finally {
      setEmailResetLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast(language === 'id' ? 'Kata sandi baru minimal 6 karakter' : 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(language === 'id' ? 'Konfirmasi kata sandi tidak cocok' : 'Password confirmation does not match');
      return;
    }
    setPasswordSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (language === 'id' ? 'Gagal mengubah kata sandi' : 'Failed to update password'));
      }
      showToast(language === 'id' ? 'Kata sandi berhasil diperbarui' : 'Password updated successfully');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || (language === 'id' ? 'Gagal mengubah kata sandi' : 'Failed to update password'));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Sign out handlers
  const handleSignOut = async () => {
    await logout();
    showToast('Berhasil keluar dari akun');
    router.push('/');
  };

  const handleSignOutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      await logout();
      showToast('Berhasil keluar dari semua perangkat');
      router.push('/');
    } catch {
      await logout();
      router.push('/');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-none bg-black/10" />
            <div className="h-8 w-8 animate-spin rounded-none border-2 border-black border-t-transparent" />
          </div>
          <p className="font-headline text-xs tracking-widest text-black/70 uppercase animate-pulse">
            Memuat Akun...
          </p>
        </div>
      </div>
    );
  }

  const firstName = user?.name ? user.name.trim().split(' ')[0] : 'Customer';
  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');

  return (
    <div className="min-h-screen bg-white font-body text-black selection:bg-black/5 flex flex-col justify-between">
      {/* -- STORE HEADER: MATCHING HOME LOGO SIZE & PLACEMENT -- */}
      <header className="sticky top-0 z-30 border-b border-black/15 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* Desktop Left Logo (matching Home layout & size) */}
          <Link
            href="/"
            className="hidden items-center pl-1 transition hover:opacity-85 md:flex"
            aria-label="Sevaya Homepage"
            title="SEVAYA"
          >
            <Logo className="h-7 w-auto sm:h-8" />
          </Link>

          {/* Mobile Centered Logo (matching Home layout & size) */}
          <div className="flex w-full items-center justify-center md:hidden">
            <Link
              href="/"
              className="flex items-center transition hover:opacity-85"
              aria-label="Sevaya Homepage"
              title="SEVAYA"
            >
              <Logo className="h-6 w-auto" />
            </Link>
          </div>
        </div>
      </header>

      {/* -- MAIN CONTENT CONTAINER (Responsive: mobile-friendly & desktop spacious) -- */}
      <main className="mx-auto w-full max-w-4xl lg:max-w-5xl flex-1 px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Tab Switcher: Orders | Profile */}
        <div className="flex items-center gap-6 sm:gap-8 pb-8">
          <button
            type="button"
            onClick={() => handleTabChange('orders')}
            className={`font-sans text-sm font-semibold tracking-wider uppercase transition-colors ${
              activeTab === 'orders' ? 'text-black' : 'text-[#A89E99] hover:text-black/70'
            }`}
          >
            {t('profile.tab_orders')}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`font-sans text-sm font-semibold tracking-wider uppercase transition-colors ${
              activeTab === 'profile' ? 'text-black' : 'text-[#A89E99] hover:text-black/70'
            }`}
          >
            {t('profile.tab_profile')}
          </button>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* TAB 1: ORDERS (Responsive layout)                               */}
        {/* --------------------------------------------------------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Welcome banner card */}
            <div className="flex items-center justify-between gap-3 rounded-none border border-black/15 bg-white p-4 sm:p-6">
              <div className="min-w-0 pr-2">
                <h2 className="font-headline text-base sm:text-lg font-semibold text-black/85 truncate">
                  {t('profile.welcome')}, {firstName}
                </h2>
                <p className="text-xs sm:text-sm text-black/70 mt-0.5">{t('profile.ready_to_shop')}</p>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center shrink-0 whitespace-nowrap rounded-none bg-black px-4 py-2 sm:px-6 sm:py-2.5 text-[10px] font-semibold tracking-wider text-white uppercase transition hover:bg-black/85 active:scale-[0.99]"
              >
                {t('profile.shop_now')}
              </Link>
            </div>

            {/* Orders list */}
            {ordersLoading ? (
              <div className="space-y-3 pt-2">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-none border border-black/15 bg-white p-6 space-y-3">
                    <div className="h-4 w-36 bg-black/5 rounded-none" />
                    <div className="h-16 bg-black/5 rounded-none" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="border border-dashed border-black/10 bg-white p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-none bg-black/5 border border-black/15 text-black/50">
                  <Icon name="shopping_bag" size={24} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-black">{t('profile.no_orders')}</h3>
                <p className="mt-1 text-xs text-black/70 max-w-sm mx-auto">
                  {t('profile.no_orders_sub')}
                </p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-none bg-black px-5 py-2 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-black/85"
                >
                  {t('profile.explore')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {orders.map((ord) => {
                  const badge = getOrderStatusBadge(ord.status, t);
                  const firstItem = ord.items?.[0];
                  const extraItems = (ord.items?.length || 1) - 1;
                  const dateStr = ord.created_at
                    ? new Date(ord.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <div
                      key={ord.id || ord.order_number}
                      className="rounded-none border border-black/15 bg-white p-5 sm:p-6 space-y-4 transition hover:border-black/20"
                    >
                      {/* Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/15/70 pb-3.5">
                        <div className="flex items-center gap-3">
                          <p className="font-headline text-sm font-semibold text-black">#{ord.order_number}</p>
                          <span className="text-neutral-300">&bull;</span>
                          <p className="text-xs text-black/70">{dateStr}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-none border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-none ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* Items Preview & Info (Desktop wide layout) */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-1">
                        {firstItem && (
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-none border border-black/15 bg-black/5">
                              {firstItem.image ? (
                                <Image
                                  src={firstItem.image}
                                  alt={firstItem.title || firstItem.name || 'Produk'}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-black/50">
                                  <Icon name="shopping_bag" size={18} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-black truncate">
                                {firstItem.title || firstItem.name || 'Busana Modest'}
                              </p>
                              <p className="text-xs text-black/70 mt-0.5">
                                {[firstItem.color, firstItem.size].filter(Boolean).join(' / ') || 'Standar'} &bull; {firstItem.quantity || 1} {t('profile.items_count')}
                              </p>
                              {extraItems > 0 && (
                                <p className="text-[11px] text-black/50 mt-0.5">
                                  +{extraItems} {t('profile.more_items')}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-[10px] tracking-wider text-black/50 uppercase block">
                            {t('profile.total_bill')}
                          </span>
                          <p className="text-sm sm:text-base font-bold text-black">
                            {formatIDR(ord.grand_total)}
                          </p>
                        </div>
                      </div>

                      {/* Courier Waybill info */}
                      {ord.tracking_number && (
                        <div className="flex items-center justify-between rounded-none bg-black/5 px-3.5 py-2.5 text-xs">
                          <span className="text-xs font-medium text-black/70">
                            {ord.courier_name || 'Kurir Reguler'}
                          </span>
                          <span className="font-mono text-xs font-semibold text-emerald-800">
                            Resi: {ord.tracking_number}
                          </span>
                        </div>
                      )}

                      {/* Action Button: 1 Tombol Gabungan */}
                      <div className="flex items-center justify-end pt-2 border-t border-black/15/50">
                        <Link
                          href={`/profile/orders/${ord.order_number}`}
                          className="inline-flex items-center gap-2 rounded-none bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-black/85 active:scale-[0.99]"
                        >
                          <Icon name="local_shipping" size={14} />
                          <span>{t('profile.order_details')}</span>
                          <Icon name="arrow_forward" size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* TAB 2: PROFILE (Desktop 2-column grid / Mobile stacked)         */}
        {/* --------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* -- LEFT COLUMN (Profile Info & Addresses) -- */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Name & Email Section */}
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-headline text-sm font-semibold text-black lowercase">
                    {user?.name || 'Customer'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(true)}
                    className="rounded-none border border-black/20 bg-white px-3.5 py-1 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                  >
                    Edit
                  </button>
                </div>

                {/* Email Card */}
                <div className="flex items-center justify-between rounded-none border border-black/15 bg-white p-4">
                  <span className="text-xs text-black/70">Email</span>
                  <span className="text-sm font-medium text-black underline underline-offset-4">
                    {user?.email || '—'}
                  </span>
                </div>
              </section>

              {/* 2. Addresses Section */}
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-headline text-sm font-semibold text-black">{t('profile.saved_addresses')}</span>
                  <button
                    type="button"
                    onClick={openAddAddressModal}
                    className="rounded-none border border-black/20 bg-white px-3.5 py-1 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                  >
                    {t('profile.add_address')}
                  </button>
                </div>

                {addressesLoading ? (
                  <div className="animate-pulse rounded-none border border-black/15 bg-white p-5">
                    <div className="h-6 w-36 bg-black/5 rounded-none" />
                  </div>
                ) : addresses.length === 0 ? (
                  /* Empty address view (Exact matching screenshot 1) */
                  <div className="flex items-center gap-3.5 rounded-none border border-black/15 bg-white p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-black/5 text-black">
                      <Icon name="location_on" size={18} />
                    </div>
                    <span className="text-sm text-black/70">{t('profile.no_addresses')}</span>
                  </div>
                ) : (
                  /* List of saved addresses */
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="rounded-none border border-black/15 bg-white p-4 sm:p-5 space-y-2.5 transition hover:border-black/20"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-black/5 text-black">
                              <Icon name="location_on" size={15} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-black">
                                {addr.recipient_name}
                              </p>
                              <p className="text-[11px] text-black/70">{addr.phone}</p>
                            </div>
                          </div>

                          {addr.is_default && (
                            <span className="rounded-none bg-black/5 border border-black/15 px-2.5 py-0.5 text-[10px] font-semibold text-black">
                              {t('profile.default')}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#554C48] leading-relaxed pl-10.5">
                          {addr.address_line}, {addr.city}, {addr.province} {addr.postal_code}
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/15/60">
                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr)}
                              className="text-[11px] font-medium text-black/70 hover:text-black"
                            >
                              {t('profile.set_default')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditAddressModal(addr)}
                            className="text-[11px] font-medium text-black hover:underline"
                          >
                            {t('profile.edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-[11px] font-medium text-red-600 hover:underline"
                          >
                            {t('profile.delete')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* -- RIGHT COLUMN (Security, Preferences, Sign Out) -- */}
            <div className="lg:col-span-5 space-y-6">
              {/* 3. Security (Ganti Kata Sandi) */}
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-headline text-sm font-semibold text-black">{t('profile.security')}</span>
                  <button
                    type="button"
                    onClick={openPasswordModal}
                    className="rounded-none border border-black/20 bg-white px-3.5 py-1 text-xs font-medium text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                  >
                    {t('profile.change')}
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-none border border-black/15 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-black/5 text-black">
                      <Icon name="lock" size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-black/70 block">{t('profile.password')}</span>
                      <span className="text-xs font-semibold text-black">••••••••••••</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-black/50">{t('profile.encrypted')}</span>
                </div>
              </section>

              {/* 4. Marketing Preferences (Screenshot 1) */}
              <section className="space-y-2">
                <div className="px-1">
                  <span className="font-headline text-sm font-semibold text-black">{t('profile.marketing_pref')}</span>
                </div>

                <div className="flex items-center justify-between rounded-none border border-black/15 bg-white p-4">
                  <div className="flex items-center gap-2.5">
                    <Icon name="mail" size={18} className="text-black" />
                    <span className="text-sm font-medium text-black">Email</span>
                  </div>

                  {/* Switch toggle with checkmark */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailMarketing}
                    onClick={() => {
                      const next = !emailMarketing;
                      setEmailMarketing(next);
                      showToast(next ? 'Preferensi email diaktifkan' : 'Preferensi email dinonaktifkan');
                    }}
                    className={`relative flex h-6 w-11 items-center rounded-none transition-colors ${
                      emailMarketing ? 'bg-black' : 'bg-[rgba(0,0,0,0.12)]'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-none bg-white shadow-xs transition-transform ${
                        emailMarketing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    >
                      {emailMarketing && <Icon name="check" size={12} className="text-black" />}
                    </span>
                  </button>
                </div>
              </section>

              {/* 4b. Language Preference */}
              <section className="space-y-2">
                <div className="px-1">
                  <span className="font-headline text-sm font-semibold text-black">{t('profile.language_pref')}</span>
                </div>

                <div className="flex items-center justify-between rounded-none border border-black/15 bg-white p-4">
                  <div className="flex items-center gap-2.5">
                    <Icon name="settings" size={18} className="text-black" />
                    <span className="text-sm font-medium text-black">
                      {language === 'id' ? 'Bahasa Indonesia' : 'English'}
                    </span>
                  </div>

                  {/* EN / ID pill toggle */}
                  <div className="flex items-center rounded-none border border-black/15 bg-black/5 p-0.5">
                    <button
                      type="button"
                      onClick={() => setLanguage('id')}
                      className={`rounded-none px-3.5 py-1 text-xs font-semibold tracking-wider transition-all ${
                        language === 'id'
                          ? 'bg-black text-white shadow-xs'
                          : 'text-black/70 hover:text-black'
                      }`}
                    >
                      ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`rounded-none px-3.5 py-1 text-xs font-semibold tracking-wider transition-all ${
                        language === 'en'
                          ? 'bg-black text-white shadow-xs'
                          : 'text-black/70 hover:text-black'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>
              </section>

              {/* 5. Sign Out Actions */}
              <div className="pt-2 space-y-3 text-center">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full rounded-none border border-black/20 bg-white py-3 text-center text-sm font-semibold text-black transition hover:border-black hover:bg-black/5 active:scale-[0.99]"
                >
                  {t('profile.sign_out')}
                </button>
                <button
                  type="button"
                  onClick={handleSignOutAllDevices}
                  className="text-xs text-black/70 transition hover:text-black hover:underline"
                >
                  {t('profile.sign_out_all')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* -- MINIMAL FOOTER LINKS (Matching Screenshot 1 & 2) -- */}
      <footer className="border-t border-black/15 py-6 text-center text-xs text-black/70">
        <div className="mx-auto w-full max-w-4xl lg:max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-1 cursor-pointer hover:text-black">
            <span>Indonesia</span>
            <Icon name="keyboard_arrow_down" size={14} />
          </span>
          <Link href="/conscious" className="hover:text-black hover:underline">
            Return &amp; Exchange
          </Link>
          <Link href="/conscious" className="hover:text-black hover:underline">
            Shipping
          </Link>
          <Link href="/conscious" className="hover:text-black hover:underline">
            Privacy policy
          </Link>
          <Link href="/conscious" className="hover:text-black hover:underline">
            Terms of service
          </Link>
          <Link href="/conscious" className="hover:text-black hover:underline">
            Contact information
          </Link>
        </div>
      </footer>

      {/* --------------------------------------------------------------- */}
      {/* MODAL 1: EDIT PROFILE                                           */}
      {/* --------------------------------------------------------------- */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-none bg-white border border-black/15 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/15 pb-3">
              <h3 className="font-headline text-base font-semibold text-black/85">Ubah Data Profil</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-black/50 hover:text-black"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-black">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-none border border-black/20 px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-black">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-none border border-black/20 px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                  placeholder="Contoh: 081234567890"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="rounded-none border border-black/20 bg-white px-4 py-2 text-xs font-medium text-black hover:bg-black/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-none bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-black/85 disabled:opacity-50"
                >
                  {editSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* MODAL 2: ADD / EDIT ADDRESS                                     */}
      {/* --------------------------------------------------------------- */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-none bg-white border border-black/15 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/15 pb-3">
              <h3 className="font-headline text-base font-semibold text-black/85">
                {editingAddress ? 'Edit Alamat' : 'Tambah Alamat Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-black/50 hover:text-black"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-black">Nama Penerima</label>
                  <input
                    type="text"
                    value={addrRecipient}
                    onChange={(e) => setAddrRecipient(e.target.value)}
                    className="mt-1 w-full rounded-none border border-black/20 px-3 py-2 text-xs text-black focus:border-black focus:outline-none"
                    placeholder="Nama penerima"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-black">No. Telepon / WA</label>
                  <input
                    type="text"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className="mt-1 w-full rounded-none border border-black/20 px-3 py-2 text-xs text-black focus:border-black focus:outline-none"
                    placeholder="08..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-black">Alamat Lengkap (Jalan, No, RT/RW)</label>
                <textarea
                  rows={2}
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  className="mt-1 w-full rounded-none border border-black/20 px-3 py-2 text-xs text-black focus:border-black focus:outline-none"
                  placeholder="Nama jalan, gedung, blok, nomor rumah"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-black">Kota / Kecamatan</label>
                  <input
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="mt-1 w-full rounded-none border border-black/20 px-3 py-2 text-xs text-black focus:border-black focus:outline-none"
                    placeholder="Kota atau kecamatan"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-black">Kode Pos</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={addrPostal}
                    onChange={(e) => setAddrPostal(e.target.value.replace(/\D/g, ''))}
                    className="mt-1 w-full rounded-none border border-black/20 px-3 py-2 text-xs text-black focus:border-black focus:outline-none"
                    placeholder="12345"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-black">Provinsi</label>
                <select
                  value={addrProvince}
                  onChange={(e) => setAddrProvince(e.target.value)}
                  className="mt-1 w-full rounded-none border border-black/20 px-3 py-2 text-xs text-black focus:border-black focus:outline-none bg-white"
                >
                  {INDONESIA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs text-[#554C48]">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded-none accent-[#000000]"
                />
                <span>Jadikan sebagai alamat pengiriman utama</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="rounded-none border border-black/20 bg-white px-4 py-2 text-xs font-medium text-black hover:bg-black/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addrSubmitting}
                  className="rounded-none bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-black/85 disabled:opacity-50"
                >
                  {addrSubmitting ? 'Menyimpan...' : 'Simpan Alamat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* MODAL 3: CHANGE PASSWORD                                        */}
      {/* --------------------------------------------------------------- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-none bg-white border border-black/15 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/15 pb-3">
              <div>
                <h3 className="font-headline text-base font-semibold text-black/85">
                  {language === 'id' ? 'Perbarui Kata Sandi' : 'Update Password'}
                </h3>
                <p className="text-[11px] text-black/50 mt-0.5">
                  {language === 'id'
                    ? 'Pilih metode untuk memperbarui kata sandi akun Anda'
                    : 'Choose a method to update your account password'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-black/50 hover:text-black p-1 rounded-none hover:bg-black/5 transition-colors"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-2 border border-black/15 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPasswordMethod('old_password')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 transition-all ${
                  passwordMethod === 'old_password'
                    ? 'bg-white text-black shadow-xs font-semibold'
                    : 'text-black/50 hover:text-black'
                }`}
              >
                <Icon name="lock" size={14} />
                <span>{language === 'id' ? 'Sandi Lama' : 'Current Password'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPasswordMethod('email')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 transition-all ${
                  passwordMethod === 'email'
                    ? 'bg-white text-black shadow-xs font-semibold'
                    : 'text-black/50 hover:text-black'
                }`}
              >
                <Icon name="mail" size={14} />
                <span>{language === 'id' ? 'Kirim via Email' : 'Via Email'}</span>
              </button>
            </div>

            {passwordMethod === 'old_password' ? (
              <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
                <div>
                  <label className="text-xs font-semibold text-black">
                    {language === 'id' ? 'Kata Sandi Saat Ini' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-none border border-black/20 px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                    placeholder={language === 'id' ? 'Masukkan kata sandi lama' : 'Enter current password'}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-black">
                    {language === 'id' ? 'Kata Sandi Baru' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-none border border-black/20 px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                    placeholder={language === 'id' ? 'Minimal 6 karakter' : 'At least 6 characters'}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-black">
                    {language === 'id' ? 'Konfirmasi Kata Sandi Baru' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-none border border-black/20 px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                    placeholder={language === 'id' ? 'Ulangi kata sandi baru' : 'Repeat new password'}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="rounded-none border border-black/20 bg-white px-4 py-2 text-xs font-medium text-black hover:bg-black/5"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={passwordSubmitting}
                    className="rounded-none bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-black/85 disabled:opacity-50"
                  >
                    {passwordSubmitting
                      ? (language === 'id' ? 'Memproses...' : 'Processing...')
                      : (language === 'id' ? 'Ubah Kata Sandi' : 'Update Password')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="p-3.5 rounded-none bg-white border border-black/15 space-y-1.5">
                  <p className="text-[11px] font-medium text-black/50">
                    {language === 'id' ? 'Email Akun Anda:' : 'Your Account Email:'}
                  </p>
                  <p className="text-sm font-semibold text-black break-all">
                    {user?.email || '-'}
                  </p>
                  <p className="text-[11px] text-black/50 pt-1 leading-relaxed">
                    {language === 'id'
                      ? 'Kami akan mengirimkan tautan reset kata sandi resmi ke alamat email di atas. Klik tautan tersebut untuk membuat kata sandi baru secara aman.'
                      : 'We will send a secure password reset link to the email above. Follow the link to create a new password.'}
                  </p>
                </div>

                {emailResetSent && (
                  <div className="p-3 rounded-none bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                    <Icon name="check_circle" size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>
                      {language === 'id'
                        ? 'Tautan reset telah terkirim! Silakan periksa kotak masuk atau folder spam email Anda.'
                        : 'Reset link has been sent! Please check your email inbox or spam folder.'}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="rounded-none border border-black/20 bg-white px-4 py-2 text-xs font-medium text-black hover:bg-black/5"
                  >
                    {language === 'id' ? 'Tutup' : 'Close'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={emailResetLoading}
                    className="inline-flex items-center gap-1.5 rounded-none bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-black/85 disabled:opacity-50"
                  >
                    <Icon name="send" size={13} />
                    {emailResetLoading
                      ? (language === 'id' ? 'Mengirim...' : 'Sending...')
                      : emailResetSent
                      ? (language === 'id' ? 'Kirim Ulang' : 'Resend Link')
                      : (language === 'id' ? 'Kirim Link ke Email' : 'Send Link to Email')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
