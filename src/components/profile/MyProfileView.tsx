'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/ui/Icon';

interface MyProfileViewProps {
  onEditProfile: () => void;
  onViewOrders: () => void;
  onViewAddresses: () => void;
  orderCount?: number;
  addressCount?: number;
}

export function MyProfileView({
  onEditProfile,
  onViewOrders,
  onViewAddresses,
  orderCount = 0,
  addressCount = 0,
}: MyProfileViewProps) {
  const { user } = useAuth();

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '2025';

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SV';

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 border border-[#E5DDD5] bg-white p-6 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center border border-[#141312]/20 bg-[#FAF8F5] text-xl font-medium text-[#141312]">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-xl font-normal text-[#141312] sm:text-2xl">
                {user?.name || 'Member Sevaya'}
              </h1>
              <span
                className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200"
                title="Akun Terverifikasi"
              >
                <Icon name="check" size={11} />
                <span>Terverifikasi</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-[#685E5A]">{user?.email}</p>
            <p className="mt-0.5 text-[11px] text-[#8E8380]">
              Bergabung sejak {formattedDate}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditProfile}
          className="inline-flex items-center justify-center gap-2 border border-[#141312] bg-[#141312] px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-[#322D29] active:scale-[0.98]"
        >
          <Icon name="settings" size={14} />
          <span>Ubah Profil</span>
        </button>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Metric 1: Orders */}
        <button
          type="button"
          onClick={onViewOrders}
          className="group flex flex-col justify-between border border-[#E5DDD5] bg-white p-5 text-left transition-colors hover:border-[#141312] hover:bg-[#FAF8F5]/40 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider text-[#685E5A] uppercase">
              Total Pesanan
            </span>
            <Icon
              name="local_shipping"
              size={18}
              className="text-[#8E8380] group-hover:text-[#141312] transition-colors"
            />
          </div>
          <div className="mt-4">
            <span className="font-sans text-2xl font-semibold text-[#141312]">
              {orderCount}
            </span>
            <span className="ml-1.5 text-xs text-[#685E5A]">transaksi</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#141312] uppercase tracking-wider">
            <span>Buka Riwayat</span>
            <Icon name="chevron_right" size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Metric 2: Saved Addresses */}
        <button
          type="button"
          onClick={onViewAddresses}
          className="group flex flex-col justify-between border border-[#E5DDD5] bg-white p-5 text-left transition-colors hover:border-[#141312] hover:bg-[#FAF8F5]/40 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider text-[#685E5A] uppercase">
              Buku Alamat
            </span>
            <Icon
              name="location_on"
              size={18}
              className="text-[#8E8380] group-hover:text-[#141312] transition-colors"
            />
          </div>
          <div className="mt-4">
            <span className="font-sans text-2xl font-semibold text-[#141312]">
              {addressCount}
            </span>
            <span className="ml-1.5 text-xs text-[#685E5A]">tersimpan</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#141312] uppercase tracking-wider">
            <span>Kelola Alamat</span>
            <Icon name="chevron_right" size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Metric 3: Membership Status */}
        <div className="flex flex-col justify-between border border-[#E5DDD5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider text-[#685E5A] uppercase">
              Status Member
            </span>
            <Icon name="verified" size={18} className="text-[#6b1d2f]" />
          </div>
          <div className="mt-4">
            <span className="font-sans text-lg font-semibold text-[#6b1d2f] uppercase tracking-wider">
              Privilege Tier
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#8E8380]">
            Akses rilis eksklusif &amp; konsultasi styling gratis.
          </p>
        </div>
      </div>

      {/* Detailed Personal Information Card */}
      <div className="border border-[#E5DDD5] bg-white p-6 shadow-xs">
        <h2 className="font-sans text-sm font-semibold tracking-wider text-[#141312] uppercase pb-4 border-b border-[#E5DDD5]">
          Informasi Akun Pribadi
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-medium tracking-wider text-[#8E8380] uppercase">
              Nama Lengkap
            </label>
            <p className="mt-1 text-sm font-medium text-[#141312]">
              {user?.name || '-'}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-medium tracking-wider text-[#8E8380] uppercase">
              Alamat Email
            </label>
            <p className="mt-1 text-sm font-medium text-[#141312]">
              {user?.email || '-'}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-medium tracking-wider text-[#8E8380] uppercase">
              Nomor Telepon / WhatsApp
            </label>
            <p className="mt-1 text-sm font-medium text-[#141312]">
              {user?.phone || 'Belum ditambahkan'}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-medium tracking-wider text-[#8E8380] uppercase">
              Tanggal Terdaftar
            </label>
            <p className="mt-1 text-sm font-medium text-[#141312]">
              {formattedDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
