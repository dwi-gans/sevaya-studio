'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Harap masukkan alamat email yang valid.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Terjadi kesalahan. Silakan coba lagi.');
      }

      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#FAF8F5]">
      <main className="pb-safe relative flex w-full flex-1 flex-col py-6">
        <div className="px-margin-mobile mx-auto w-full max-w-lg">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-2">
            <Link
              href="/login"
              className="mb-2 inline-flex items-center gap-1.5 text-xs tracking-wider text-[#685E5A] uppercase transition-colors hover:text-[#141312]"
            >
              <Icon name="arrow_back" size={14} />
              Kembali ke Login
            </Link>
            <h1 className="font-headline-xl-mobile font-normal text-[#1B1718] md:text-3xl">
              Lupa <span className="font-sans font-medium text-[#141312]">Kata Sandi?</span>
            </h1>
            <p className="font-body-md text-body-md leading-relaxed text-[#685E5A]">
              Masukkan alamat email terdaftar Anda. Kami akan mengirimkan tautan untuk membuat kata sandi baru.
            </p>
          </div>

          {/* Success State */}
          {sent ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center bg-emerald-100">
                  <Icon name="mark_email_read" size={24} className="text-emerald-700" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-sans text-sm font-semibold tracking-wider text-emerald-800 uppercase">
                    Email Terkirim
                  </p>
                  <p className="text-sm leading-relaxed text-emerald-700">
                    Tautan reset kata sandi telah dikirim ke{' '}
                    <strong>{email}</strong>.{' '}
                    Silakan periksa kotak masuk dan folder spam Anda.
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">
                    Tautan berlaku selama <strong>1 jam</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setSent(false); setEmail(''); }}
                className="font-label-md text-label-md flex h-12 w-full items-center justify-center gap-2 border border-[#E5DDD5] bg-[#FAF8F5] font-medium tracking-wider text-[#685E5A] uppercase transition-colors hover:border-[#141312] hover:text-[#141312]"
              >
                Kirim Ulang ke Email Lain
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="font-label-md text-label-md font-medium text-[#6b1d2f] underline underline-offset-4 transition-colors hover:text-[#5a1224]"
                >
                  Kembali ke Halaman Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Error Alert */}
              {errorMsg && (
                <div className="flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <Icon name="error" size={16} className="mt-0.5 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="font-label-md text-label-md tracking-wider text-[#1B1718] uppercase"
                    htmlFor="email"
                  >
                    Alamat Email
                  </label>
                  <span className="font-label-sm text-label-sm tracking-tight text-[#685E5A]">
                    Wajib Diisi
                  </span>
                </div>
                <div className="relative flex items-center border border-[#E5DDD5] bg-[#FAF8F5] shadow-2xs transition-all focus-within:border-[#141312] focus-within:ring-1 focus-within:ring-[#141312]/20">
                  <Icon
                    name="mail"
                    size={19}
                    className="pointer-events-none absolute left-3.5 text-[#685E5A]"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="font-body-md text-body-md h-12 w-full bg-transparent pr-4 pl-11 text-[#1B1718] placeholder:text-[#685E5A]/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="font-label-lg text-label-lg mt-2 flex h-12 w-full items-center justify-center gap-2 border border-[#141312] bg-[#141312] font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-sm transition-all hover:bg-[#2b2826] active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Kirim Tautan Reset</span>
                    <Icon name="send" size={16} />
                  </>
                )}
              </button>

              {/* Back Link */}
              <div className="mt-2 text-center">
                <Link
                  href="/login"
                  className="font-label-md text-label-md font-medium text-[#685E5A] underline underline-offset-4 transition-colors hover:text-[#141312]"
                >
                  Ingat kata sandi? Masuk di sini
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
