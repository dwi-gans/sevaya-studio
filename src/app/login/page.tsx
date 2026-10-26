'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

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
      if (redirect) {
        setRedirectUrl(redirect);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier || !password) {
      setErrorMsg('Harap masukkan alamat email dan kata sandi Anda.');
      showToast('Harap isi email dan kata sandi');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(identifier, password);
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

  const handleWhatsAppOtp = () => {
    showToast('Fitur WhatsApp OTP sedang dalam tahap integrasi.');
  };

  const handleSocialAuth = (provider: string) => {
    showToast(`Autentikasi dengan ${provider} sedang dalam persiapan.`);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#FAF8F5]">
      {/* Main Form Content */}
      <main className="pb-safe relative flex w-full flex-1 flex-col py-6">
        <div className="px-margin-mobile mx-auto w-full max-w-lg">
          {/* Editorial Introductory Header */}
          <div className="mb-6 flex flex-col gap-2">
            <h1 className="font-headline-xl-mobile font-normal text-[#1B1718] md:text-3xl">
              Welcome to <span className="font-sans font-medium text-[#141312]">Sevaya</span>
            </h1>
            <p className="font-body-md text-body-md leading-relaxed text-[#685E5A]">
              Sign in to access your Saved Silhouettes, reserved fabric swatches, and private
              pre-order capsule drops.
            </p>
          </div>

          {/* Tab Switcher (Segmented Control) */}
          <div className="mb-6 flex w-full items-center border border-[#E5DDD5] bg-[#F4EFEB] p-1">
            <button
              type="button"
              className="font-label-md text-label-md flex-1 bg-[#FAF8F5] py-2.5 text-center font-semibold tracking-wider text-[#141312] uppercase shadow-xs transition-all"
            >
              Sign In
            </button>
            <Link
              href={`/register${redirectUrl !== '/profile' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-label-md text-label-md flex-1 py-2.5 text-center font-medium tracking-wider text-[#685E5A] uppercase transition-colors hover:text-[#1B1718]"
            >
              Create Account
            </Link>
          </div>

          {/* Error Alert Banner */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <Icon name="error" size={16} className="shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Identifier Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-md text-label-md tracking-wider text-[#1B1718] uppercase"
                  htmlFor="identifier"
                >
                  Email Address
                </label>
                <span className="font-label-sm text-label-sm tracking-tight text-[#685E5A]">
                  Required
                </span>
              </div>
              <div className="relative flex items-center border border-[#E5DDD5] bg-[#FAF8F5] shadow-2xs transition-all focus-within:border-[#141312] focus-within:ring-1 focus-within:ring-[#141312]/20">
                <Icon
                  name="mail"
                  size={19}
                  className="pointer-events-none absolute left-3.5 text-[#685E5A]"
                />
                <input
                  id="identifier"
                  name="identifier"
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com"
                  className="font-body-md text-body-md h-12 w-full bg-transparent pr-4 pl-11 text-[#1B1718] placeholder:text-[#685E5A]/60 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Input with Toggle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-md text-label-md tracking-wider text-[#1B1718] uppercase"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-label-md text-label-md text-[#141312] underline underline-offset-4 transition-colors hover:text-[#000000]"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative flex items-center border border-[#E5DDD5] bg-[#FAF8F5] shadow-2xs transition-all focus-within:border-[#141312] focus-within:ring-1 focus-within:ring-[#141312]/20">
                <Icon
                  name="lock"
                  size={19}
                  className="pointer-events-none absolute left-3.5 text-[#685E5A]"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="font-body-md text-body-md h-12 w-full bg-transparent pr-11 pl-11 text-[#1B1718] placeholder:text-[#685E5A]/60 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 flex items-center justify-center text-[#685E5A] transition-colors hover:text-[#1B1718]"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={19} />
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="group flex cursor-pointer items-center gap-2.5">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer text-[#141312] accent-[#141312]"
                />
                <span className="font-body-sm text-body-sm text-[#685E5A] transition-colors group-hover:text-[#1B1718]">
                  Keep this device remembered for 30 days
                </span>
              </label>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="font-label-lg text-label-lg mt-2 flex h-12 w-full items-center justify-center gap-2 border border-[#141312] bg-[#141312] font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-sm transition-all hover:bg-[#2b2826] active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <Icon name="arrow_forward" size={17} />
                </>
              )}
            </button>
          </form>

          {/* Visual Divider */}
          <div className="relative my-7 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="h-[1px] w-full bg-[#E5DDD5]" />
            </div>
            <div className="font-label-sm text-label-sm relative bg-[#FAF8F5] px-3 text-[#685E5A]">
              or continue with
            </div>
          </div>

          {/* Social & WhatsApp Auth */}
          <div className="flex flex-col gap-2.5">
            {/* WhatsApp OTP Button */}
            <button
              type="button"
              onClick={handleWhatsAppOtp}
              className="font-label-md text-label-md flex h-12 w-full items-center justify-center gap-3 border border-[#E5DDD5] bg-[#FAF8F5] px-4 font-medium tracking-wider text-[#1B1718] shadow-2xs transition-colors hover:bg-[#F4EFEB]"
            >
              <Icon name="chat" size={19} className="text-[#1B1718]" />
              <span>Sign in with WhatsApp OTP</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Apple Sign In */}
              <button
                type="button"
                onClick={() => handleSocialAuth('Apple')}
                className="font-label-md text-label-md flex h-12 items-center justify-center gap-2 border border-[#E5DDD5] bg-[#FAF8F5] px-3 font-medium tracking-wider text-[#1B1718] shadow-2xs transition-colors hover:bg-[#F4EFEB]"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.59-7.7-11.72-13.98-6.19-9.5-11.08-20.12-14.67-31.87-3.59-11.74-5.38-22.95-5.38-33.62 0-14.24 3.53-26.04 10.6-35.41 7.07-9.37 16.03-14.17 26.89-14.4 5.33 0 11.1 1.41 17.31 4.23 6.21 2.82 10.05 4.3 11.52 4.43 2.18-.33 6.36-1.96 12.54-4.89 6.18-2.93 11.85-4.22 17.01-3.87 13.25.98 23.49 5.86 30.73 14.65-11.73 7.07-17.47 16.85-17.22 29.35.25 9.78 4.07 18.04 11.45 24.78 7.39 6.74 16.29 10.54 26.71 11.41-2.17 6.74-4.89 13.59-8.15 20.57zm-29.28-111.48c0 7.39-2.73 14.38-8.19 20.97-6.52 7.82-14.68 12.39-24.47 13.7-1.09-8.04 1.74-15.54 8.5-22.5 6.75-6.96 14.81-11.02 24.16-12.17z" />
                </svg>
                <span>Apple</span>
              </button>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={() => handleSocialAuth('Google')}
                className="font-label-md text-label-md flex h-12 items-center justify-center gap-2 border border-[#E5DDD5] bg-[#FAF8F5] px-3 font-medium tracking-wider text-[#1B1718] shadow-2xs transition-colors hover:bg-[#F4EFEB]"
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
            </div>
          </div>

          {/* Bottom Navigation Anchor */}
          <div className="mt-8 flex flex-col items-center gap-1 text-center">
            <p className="font-body-md text-body-md text-[#685E5A]">New to Sevaya?</p>
            <Link
              href={`/register${redirectUrl !== '/profile' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-label-lg text-label-lg font-medium text-[#6b1d2f] underline underline-offset-4 transition-colors hover:text-[#5a1224]"
            >
              Create Your Sevaya Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
