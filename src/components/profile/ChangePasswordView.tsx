'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';

export function ChangePasswordView() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Kata sandi baru harus minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah kata sandi.');
      }

      setSuccessMsg('Kata sandi akun Anda berhasil diperbarui!');
      showToast('Kata sandi berhasil diubah.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan server.';
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
          Keamanan &amp; Kata Sandi
        </h2>
        <p className="mt-1 text-xs text-[#685E5A]">
          Ganti kata sandi akun Anda secara berkala untuk menjaga keamanan data belanja Anda.
        </p>
      </div>

      {successMsg && (
        <div className="mt-5 flex items-start gap-2.5 border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <Icon name="check" size={16} className="shrink-0 text-emerald-600 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-5 flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          <Icon name="error" size={16} className="shrink-0 text-red-600 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4.5">
        {/* Current Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
            Kata Sandi Saat Ini
          </label>
          <div className="relative flex items-center">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan kata sandi lama Anda"
              className="w-full border border-[#E5DDD5] bg-[#FAF8F5] px-4 py-3 pr-11 text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 text-[#685E5A] hover:text-[#141312]"
            >
              <Icon name={showCurrent ? 'visibility_off' : 'visibility'} size={18} />
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
            Kata Sandi Baru <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full border border-[#E5DDD5] bg-[#FAF8F5] px-4 py-3 pr-11 text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 text-[#685E5A] hover:text-[#141312]"
            >
              <Icon name={showNew ? 'visibility_off' : 'visibility'} size={18} />
            </button>
          </div>
          <p className="text-[11px] text-[#8E8380]">
            Gunakan kombinasi huruf, angka, dan simbol untuk keamanan maksimal.
          </p>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wider text-[#141312] uppercase">
            Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi kata sandi baru"
            className="w-full border border-[#E5DDD5] bg-[#FAF8F5] px-4 py-3 text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-[#E5DDD5]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 border border-[#141312] bg-[#141312] px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29] disabled:opacity-50"
          >
            {isSubmitting && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            <span>{isSubmitting ? 'Memperbarui...' : 'Simpan Kata Sandi'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
