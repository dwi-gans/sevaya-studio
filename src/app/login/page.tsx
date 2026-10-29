'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Icon } from '@/components/ui/Icon';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const { language } = useLanguage();

  const [redirectUrl, setRedirectUrl] = useState('/profile');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      const leakedId = params.get('identifier');
      const leakedPass = params.get('password');

      if (redirect) {
        setRedirectUrl(redirect);
      }
      if (leakedId) {
        setIdentifier(decodeURIComponent(leakedId));
      }
      if (leakedPass) {
        setPassword(decodeURIComponent(leakedPass));
      }

      // PURGE credentials immediately from browser address bar & history!
      if (leakedId || leakedPass || params.has('password') || params.has('identifier')) {
        const cleanUrl =
          window.location.pathname +
          (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setErrorMsg(null);

    const cleanEmail = identifier.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Harap masukkan alamat email dan kata sandi Anda.');
      showToast('Harap isi email dan kata sandi');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(cleanEmail, password);
      setIsLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
        showToast(`Login gagal: ${res.error}`);
        return;
      }

      showToast('Selamat datang kembali di Sevaya!');
      router.push(redirectUrl);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk.';
      setErrorMsg(msg);
      showToast(msg);
    }
  };

  const handleSocialAuth = (provider: string) => {
    showToast(`Autentikasi dengan ${provider} sedang dalam persiapan.`);
  };

  const isId = language === 'id';

  return (
    <div className="min-h-screen w-full bg-white text-black font-body grid grid-cols-1 lg:grid-cols-2">
      {/* ── LEFT HALF: AUTH FORM ── */}
      <div className="flex flex-col justify-between px-6 sm:px-12 lg:px-16 xl:px-24 py-8 sm:py-12 min-h-screen">
        {/* Top Header: Back Button only */}
        <div className="flex items-center justify-start w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-black/60 hover:text-black transition"
            aria-label="Back to Store"
          >
            <Icon name="arrow_back" size={14} />
            <span>{isId ? 'Kembali ke Toko' : 'Back to Store'}</span>
          </Link>
        </div>

        {/* Center: Main Form Content */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-8">
          {/* Heading & Subtitle */}
          <div className="text-center mb-8">
            <h1 className="font-sans text-2xl sm:text-3xl font-medium tracking-tight text-black">
              {isId ? 'Selamat Datang Kembali!' : 'Welcome back!'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-black/60 leading-relaxed max-w-xs mx-auto">
              {isId
                ? 'Masuk untuk mengakses koleksi siluet, pesanan, dan kurasi eksklusif Anda.'
                : 'Sign in to access your curated silhouettes, orders, and exclusive releases.'}
            </p>
          </div>

          {/* Social Auth Buttons (Square / Kotak) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleSocialAuth('Google')}
              className="flex h-11 items-center justify-center gap-2 rounded-none border border-black/15 bg-white px-3 text-xs font-medium text-black transition hover:bg-black hover:text-white active:scale-[0.99] cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  fill="#4285F4"
                />
                <path
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  fill="#34A853"
                />
                <path
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialAuth('Apple')}
              className="flex h-11 items-center justify-center gap-2 rounded-none border border-black/15 bg-white px-3 text-xs font-medium text-black transition hover:bg-black hover:text-white active:scale-[0.99] cursor-pointer"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.59-7.7-11.72-13.98-6.19-9.5-11.08-20.12-14.67-31.87-3.59-11.74-5.38-22.95-5.38-33.62 0-14.24 3.53-26.04 10.6-35.41 7.07-9.37 16.03-14.17 26.89-14.4 5.33 0 11.1 1.41 17.31 4.23 6.21 2.82 10.05 4.3 11.52 4.43 2.18-.33 6.36-1.96 12.54-4.89 6.18-2.93 11.85-4.22 17.01-3.87 13.25.98 23.49 5.86 30.73 14.65-11.73 7.07-17.47 16.85-17.22 29.35.25 9.78 4.07 18.04 11.45 24.78 7.39 6.74 16.29 10.54 26.71 11.41-2.17 6.74-4.89 13.59-8.15 20.57zm-29.28-111.48c0 7.39-2.73 14.38-8.19 20.97-6.52 7.82-14.68 12.39-24.47 13.7-1.09-8.04 1.74-15.54 8.5-22.5 6.75-6.96 14.81-11.02 24.16-12.17z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Divider with 'Or' */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="h-[1px] w-full bg-black/10" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-normal uppercase tracking-wider text-black/40">
              Or
            </span>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-none border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <Icon name="error" size={16} className="shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form: Enforced POST and action="" so native submits NEVER append inputs to URL */}
          <form
            method="POST"
            action=""
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className="space-y-4"
          >
            {/* Email Field (No name attribute to prevent native query string leakage) */}
            <div>
              <input
                id="identifier"
                type="email"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email"
                className="h-11 w-full rounded-none border border-black/15 bg-white px-4 text-xs sm:text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none transition shadow-none"
              />
            </div>

            {/* Password Field (No name attribute to prevent native query string leakage) */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-11 w-full rounded-none border border-black/15 bg-white px-4 pr-11 text-xs sm:text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none transition shadow-none"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-black/40 hover:text-black transition"
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs text-black/60 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded-none border-black/30 accent-black cursor-pointer"
                />
                <span>{isId ? 'Ingat sesi saya' : 'Remember me'}</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-xs text-black/70 hover:text-black transition underline underline-offset-2"
              >
                {isId ? 'Lupa sandi?' : 'Forgot password?'}
              </Link>
            </div>

            {/* Submit Button (Square / Kotak, full black) */}
            <button
              type="submit"
              disabled={isLoading}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-none bg-black text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-black/85 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span>{isId ? 'Masuk dengan email' : 'Sign in with email'}</span>
              )}
            </button>
          </form>

          {/* Toggle to Register */}
          <div className="mt-8 text-center text-xs text-black/60">
            <span>{isId ? 'Belum punya akun? ' : "Don't have an account? "}</span>
            <Link
              href={`/register${redirectUrl !== '/profile' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-semibold text-black hover:underline underline-offset-2 transition"
            >
              {isId ? 'Daftar' : 'Sign Up'}
            </Link>
          </div>
        </div>

        {/* Bottom Footer Links */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-black/40 pt-4">
          <Link href="/conscious" className="hover:text-black transition">Help</Link>
          <span>/</span>
          <Link href="/conscious" className="hover:text-black transition">Terms</Link>
          <span>/</span>
          <Link href="/conscious" className="hover:text-black transition">Privacy</Link>
        </div>
      </div>

      {/* ── RIGHT HALF: FULL BLACK WITH WHITE SEVAYA ONLY ── */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-black text-white p-12 min-h-screen relative overflow-hidden select-none">
        <h2 className="font-sans text-2xl sm:text-3xl font-light tracking-[0.3em] text-white uppercase text-center">
          SEVAYA
        </h2>
      </div>
    </div>
  );
}
