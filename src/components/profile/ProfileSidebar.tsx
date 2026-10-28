'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/ui/Icon';

export type ProfileTab = 'profile' | 'edit' | 'addresses' | 'orders' | 'password';

interface ProfileSidebarProps {
  activeTab: ProfileTab;
  onSelectTab: (tab: ProfileTab) => void;
  orderCount?: number;
  addressCount?: number;
}

export function ProfileSidebar({
  activeTab,
  onSelectTab,
  orderCount,
  addressCount,
}: ProfileSidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'profile' as ProfileTab,
      label: 'Profil Saya',
      sublabel: 'Informasi akun & kontak',
      icon: 'person' as const,
    },
    {
      id: 'edit' as ProfileTab,
      label: 'Ubah Profil',
      sublabel: 'Nama, telepon & foto',
      icon: 'settings' as const,
    },
    {
      id: 'addresses' as ProfileTab,
      label: 'Buku Alamat',
      sublabel: 'Alamat pengiriman',
      icon: 'location_on' as const,
      badge: addressCount,
    },
    {
      id: 'orders' as ProfileTab,
      label: 'Riwayat Pesanan',
      sublabel: 'Status transaksi & resi',
      icon: 'local_shipping' as const,
      badge: orderCount,
    },
    {
      id: 'password' as ProfileTab,
      label: 'Keamanan Akun',
      sublabel: 'Ganti kata sandi',
      icon: 'lock' as const,
    },
  ];

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SV';

  return (
    <aside className="w-full shrink-0 lg:w-72">
      {/* User Header Summary Card */}
      <div className="border border-black/15 bg-white p-5 text-center shadow-xs">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center border border-black/20 bg-white text-lg font-medium text-black">
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

        <h2 className="mt-3.5 font-sans text-sm font-semibold tracking-wider text-black/85 uppercase line-clamp-1">
          {user?.name || 'Member Sevaya'}
        </h2>
        <p className="mt-0.5 text-xs text-black/70 line-clamp-1">{user?.email}</p>

        <div className="mt-3 inline-flex items-center gap-1.5 border border-black/15 bg-white px-2.5 py-1 text-[10px] font-medium tracking-widest text-black uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span>Sevaya Privilege Member</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-3 border border-black/15 bg-white shadow-xs">
        <div className="divide-y divide-[rgba(0,0,0,0.12)]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`group flex w-full items-center justify-between p-4 text-left transition-colors ${
                  isActive
                    ? 'border-l-4 border-l-[#000000] bg-white text-black'
                    : 'text-[#554C48] hover:bg-white/60 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-black text-white'
                        : 'border border-black/15 bg-white text-black/70 group-hover:border-black group-hover:text-black'
                    }`}
                  >
                    <Icon name={item.icon} size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs tracking-wider uppercase ${
                        isActive ? 'font-semibold text-black' : 'font-medium'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="text-[10px] text-black/50 line-clamp-1">
                      {item.sublabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="bg-black px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                  <Icon
                    name="chevron_right"
                    size={15}
                    className={`transition-transform ${
                      isActive ? 'translate-x-0.5 text-black' : 'text-black/50 opacity-50 group-hover:opacity-100'
                    }`}
                  />
                </div>
              </button>
            );
          })}

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin keluar dari akun Sevaya?')) {
                logout();
              }
            }}
            className="group flex w-full items-center justify-between p-4 text-left text-red-600 transition-colors hover:bg-red-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border border-red-200 bg-white text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Icon name="logout" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-wider uppercase">Keluar Akun</span>
                <span className="text-[10px] text-red-400">Akhiri sesi di perangkat ini</span>
              </div>
            </div>
            <Icon name="chevron_right" size={15} className="text-red-400" />
          </button>
        </div>
      </nav>

      {/* Quick Help & Concierge Box */}
      <div className="mt-4 border border-black/15 bg-white p-4 text-xs text-black/70">
        <p className="font-semibold tracking-wider text-black uppercase">Butuh Bantuan Pesanan?</p>
        <p className="mt-1 text-[11px] leading-relaxed">
          Tim concierge kami siap melayani informasi ukuran, jahitan custom, dan pelacakan kurir.
        </p>
        <Link
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-black uppercase underline underline-offset-4 hover:opacity-75"
        >
          <span>Chat WhatsApp Concierge</span>
          <Icon name="arrow_forward" size={12} />
        </Link>
      </div>
    </aside>
  );
}
