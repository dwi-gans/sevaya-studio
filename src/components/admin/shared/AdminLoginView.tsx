'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';

interface AdminLoginViewProps {
  adminUsername: string;
  setAdminUsername: (u: string) => void;
  adminPassword: string;
  setAdminPassword: (p: string) => void;
  authError: string;
  onLogin: (e: React.FormEvent) => Promise<void>;
}

export function AdminLoginView({
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  authError,
  onLogin,
}: AdminLoginViewProps) {
  return (
    <div className="min-h-screen bg-white font-body text-black selection:bg-black/5 flex flex-col justify-between">
      {/* Top Header */}
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

          <form onSubmit={onLogin} className="space-y-4">
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

      <footer className="border-t border-black/15 py-4 text-center">
        <p className="text-[11px] text-black/50 font-mono">
          &copy; {new Date().getFullYear()} SEVAYA Studio &bull; All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
