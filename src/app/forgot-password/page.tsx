'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/context/LanguageContext';

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isId = language === 'id';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg(isId ? 'Harap masukkan alamat email yang valid.' : 'Please enter a valid email address.');
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
      setIsLoading(false);

      if (res.ok && data.success) {
        setSent(true);
      } else {
        setErrorMsg(data.error || (isId ? 'Gagal mengirim instruksi pemulihan. Coba lagi.' : 'Failed to send recovery instructions.'));
      }
    } catch {
      setIsLoading(false);
      setErrorMsg(isId ? 'Terjadi kesalahan jaringan. Coba lagi.' : 'Network error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white font-body text-black selection:bg-black/5 flex flex-col justify-between">
      {/* ── TOP HEADER (Matching Profile Page Minimal Bar) ── */}
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
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-3.5 py-1 text-xs font-medium text-black/70 transition hover:border-black hover:text-black hover:bg-black/5"
          >
            <Icon name="arrow_back" size={14} />
            <span>{isId ? 'Kembali ke Masuk' : 'Back to Sign In'}</span>
          </Link>
        </div>
      </header>

      {/* ── MAIN CONTENT (Minimalist & Elegant Card Matching Profile) ── */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        <div className="flex items-center gap-6 sm:gap-8 pb-6 justify-center">
          <h2 className="font-headline text-2xl sm:text-3xl font-semibold tracking-tight text-black/85">
            {isId ? 'Pemulihan Akun' : 'Account Recovery'}
          </h2>
        </div>

        <div className="rounded-2xl border border-black/15 bg-white p-6 sm:p-8 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-5">
          {sent ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                <Icon name="check" size={24} />
              </div>
              <div>
                <h1 className="font-headline text-lg sm:text-xl font-semibold text-black/85">
                  {isId ? 'Tautan Pemulihan Terkirim' : 'Recovery Link Sent'}
                </h1>
                <p className="text-xs sm:text-sm text-black/70 mt-2 leading-relaxed max-w-sm mx-auto">
                  {isId
                    ? `Kami telah mengirimkan instruksi atur ulang kata sandi ke ${email}. Silakan periksa folder inbox atau spam Anda.`
                    : `We've sent password reset instructions to ${email}. Please check your inbox or spam folder.`}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-black/85"
                >
                  {isId ? 'Kembali ke Masuk' : 'Return to Sign In'}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center sm:text-left">
                <h1 className="font-headline text-lg sm:text-xl font-semibold text-black/85">
                  {isId ? 'Lupa Kata Sandi?' : 'Forgot Your Password?'}
                </h1>
                <p className="text-xs sm:text-sm text-black/70 mt-1 leading-relaxed">
                  {isId
                    ? 'Masukkan alamat email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.'
                    : 'Enter your registered email address. We will send a secure link to reset your password.'}
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <Icon name="error" size={16} className="shrink-0 text-red-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold tracking-wider text-black uppercase"
                    htmlFor="email"
                  >
                    {isId ? 'Alamat Email Terdaftar' : 'Registered Email Address'}
                  </label>
                  <div className="relative flex items-center rounded-xl border border-black/15 bg-white transition focus-within:border-black focus-within:bg-white focus-within:ring-1 focus-within:ring-[#000000]/15">
                    <Icon
                      name="mail"
                      size={18}
                      className="pointer-events-none absolute left-3.5 text-black/50"
                    />
                    <input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="h-11 w-full bg-transparent pl-10 pr-4 text-xs sm:text-sm text-black placeholder:text-black/50 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-xs font-semibold tracking-wider text-white uppercase shadow-xs transition hover:bg-black/85 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>{isId ? 'Kirim Tautan Pemulihan' : 'Send Recovery Link'}</span>
                      <Icon name="arrow_forward" size={14} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-black/70">
            {isId ? 'Ingat kata sandi Anda?' : 'Remember your password?'}{' '}
            <Link
              href="/login"
              className="font-semibold text-black underline underline-offset-4 hover:text-black/70 transition"
            >
              {isId ? 'Masuk ke Akun' : 'Sign In'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
