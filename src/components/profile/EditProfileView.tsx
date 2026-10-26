'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';

interface EditProfileViewProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function EditProfileView({ onCancel, onSuccess }: EditProfileViewProps) {
  const { user, updateUser, getAccessToken } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Nama lengkap wajib diisi minimal 2 karakter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          avatarUrl: avatarUrl.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memperbarui profil.');
      }

      // Update state in AuthContext so UI updates immediately everywhere
      updateUser({
        name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl.trim(),
      });

      showToast('Profil Anda berhasil diperbarui.');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data profil.';
      setErrorMsg(msg);
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-[#E5DDD5] bg-white p-6 sm:p-8 shadow-xs">
      <div className="border-b border-[#E5DDD5] pb-4">
        <h2 className="font-sans text-base font-semibold tracking-wider text-[#141312] uppercase">
          Ubah Data Profil
        </h2>
        <p className="mt-1 text-xs text-[#685E5A]">
          Perbarui nama lengkap, nomor kontak WhatsApp, dan tautan foto profil Anda.
        </p>
      </div>

      {errorMsg && (
        <div className="mt-5 flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          <Icon name="error" size={16} className="shrink-0 text-red-600 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Email Field (Read Only) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
            Alamat Email
          </label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className="w-full border border-[#E5DDD5] bg-[#F4EFEB] px-4 py-3 text-xs text-[#685E5A] cursor-not-allowed"
          />
          <p className="text-[11px] text-[#8E8380]">
            Email utama akun Anda terhubung dengan verifikasi keamanan dan tidak dapat diubah secara langsung.
          </p>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Contoh: Amira Zahra"
            className="w-full border border-[#E5DDD5] bg-[#FAF8F5] px-4 py-3 text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
            Nomor Telepon / WhatsApp
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0812 3456 7890"
            className="w-full border border-[#E5DDD5] bg-[#FAF8F5] px-4 py-3 text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none"
          />
          <p className="text-[11px] text-[#8E8380]">
            Digunakan untuk konfirmasi pesanan dan update nomor resi pengiriman kurir Biteship.
          </p>
        </div>

        {/* Avatar URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
            Tautan Foto Profil (Avatar URL)
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full border border-[#E5DDD5] bg-[#FAF8F5] px-4 py-3 text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none"
          />
          <p className="text-[11px] text-[#8E8380]">
            Masukkan link gambar publik untuk foto profil Anda. Kosongkan untuk menggunakan inisial nama.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5DDD5]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border border-[#D0C5BD] bg-white px-5 py-2.5 text-xs font-semibold tracking-wider text-[#141312] uppercase transition hover:border-[#141312]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 border border-[#141312] bg-[#141312] px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29] disabled:opacity-50"
          >
            {isSubmitting && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
