'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [redirectUrl, setRedirectUrl] = useState('/profile');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [termsConsent, setTermsConsent] = useState(true);
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

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Nama lengkap wajib diisi minimal 2 karakter.');
      showToast('Nama lengkap wajib diisi');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Format alamat email tidak valid.');
      showToast('Format email tidak valid');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Kata sandi harus memiliki minimal 6 karakter.');
      showToast('Kata sandi minimal 6 karakter');
      return;
    }

    if (!termsConsent) {
      setErrorMsg('Harap setujui Syarat & Ketentuan Layanan serta Kebijakan Privasi.');
      showToast('Harap setujui Syarat & Ketentuan');
      return;
    }

    setIsLoading(true);

    try {
      const res = await register(fullName.trim(), email.trim(), password, phone.trim());
      setIsLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
        showToast(`Pendaftaran gagal: ${res.error}`);
        return;
      }

      showToast('Akun berhasil dibuat! Selamat datang di Sevaya.');
      router.push(redirectUrl);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat pendaftaran akun.';
      setErrorMsg(msg);
      showToast(msg);
    }
  };

  const handleSocialRegister = (provider: string) => {
    showToast(`Pendaftaran instan dengan ${provider} sedang dalam persiapan.`);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#FAF8F5]">
      {/* Main Content */}
      <main className="pb-safe relative flex w-full flex-1 flex-col py-6">
        <div className="px-margin-mobile mx-auto w-full max-w-lg">
          {/* Subtle Ornamental Header */}
          <div className="flex flex-col items-center pt-2 pb-5 text-center">
            <h1 className="font-headline-lg-mobile font-normal tracking-tight text-[#1B1718] md:text-3xl">
              Create Your Account
            </h1>
            <p className="font-body-md text-body-md mt-2 max-w-[340px] leading-relaxed text-[#685E5A]">
              Join the Sevaya community to experience tailored sizing, private collection previews,
              and conscious rewards.
            </p>
          </div>

          {/* Segmented Switcher */}
          <div className="mb-6 flex w-full items-center justify-between border border-[#E5DDD5] bg-[#F4EFEB] p-1">
            <Link
              href={`/login${redirectUrl !== '/profile' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-label-md text-label-md flex-1 py-2.5 text-center font-medium tracking-wider text-[#685E5A] uppercase transition-all hover:text-[#1B1718]"
            >
              Sign In
            </Link>
            <button
              type="button"
              className="font-label-md text-label-md flex-1 bg-[#141312] py-2.5 text-center font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-xs transition-all"
            >
              Create Account
            </button>
          </div>

          {/* Error Alert Banner */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <Icon name="error" size={16} className="shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Registration Form Card */}
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-4.5 border border-[#E5DDD5] bg-[#FAF8F5] p-5 shadow-2xs md:p-6"
          >
            {/* Full Name Field */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md flex items-center justify-between font-medium tracking-wider text-[#1B1718]"
                htmlFor="fullName"
              >
                <span>Full Name</span>
                <span className="font-label-sm text-label-sm font-normal text-[#685E5A] normal-case">
                  Required
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amira Zahra"
                  className="font-body-md text-body-md h-12 w-full border border-[#E5DDD5] bg-[#FAF8F5] px-3.5 pr-10 text-[#1B1718] placeholder:text-[#685E5A]/50 focus:border-[#141312] focus:outline-none"
                />
                <Icon
                  name="person"
                  size={18}
                  className="pointer-events-none absolute right-3.5 text-[#685E5A]"
                />
              </div>
            </div>

            {/* Email Address Field */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md flex items-center justify-between font-medium tracking-wider text-[#1B1718]"
                htmlFor="email"
              >
                <span>Email Address</span>
                <span className="font-label-sm text-label-sm font-normal text-[#685E5A] normal-case">
                  For order statements
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amira@example.com"
                  className="font-body-md text-body-md h-12 w-full border border-[#E5DDD5] bg-[#FAF8F5] px-3.5 pr-10 text-[#1B1718] placeholder:text-[#685E5A]/50 focus:border-[#141312] focus:outline-none"
                />
                <Icon
                  name="mail"
                  size={18}
                  className="pointer-events-none absolute right-3.5 text-[#685E5A]"
                />
              </div>
            </div>

            {/* WhatsApp Concierge Number Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-md text-label-md font-medium tracking-wider text-[#1B1718]"
                  htmlFor="phone"
                >
                  WhatsApp Number
                </label>
                <span className="font-label-sm text-label-sm flex items-center gap-1 font-semibold text-[#141312]">
                  <Icon name="verified" size={13} /> Concierge Ready
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Country Selector */}
                <div className="flex h-12 shrink-0 items-center gap-1.5 border border-[#E5DDD5] bg-[#F4EFEB] px-3 select-none">
                  <span className="text-[16px] leading-none">🇮🇩</span>
                  <span className="font-body-md text-body-md font-medium text-[#1B1718]">+62</span>
                  <Icon name="expand_more" size={16} className="text-[#685E5A]" />
                </div>
                {/* Input */}
                <div className="relative flex flex-1 items-center">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="812 3456 7890"
                    className="font-body-md text-body-md h-12 w-full border border-[#E5DDD5] bg-[#FAF8F5] px-3.5 pr-10 text-[#1B1718] placeholder:text-[#685E5A]/50 focus:border-[#141312] focus:outline-none"
                  />
                  <Icon
                    name="chat"
                    size={18}
                    className="pointer-events-none absolute right-3.5 text-[#685E5A]"
                  />
                </div>
              </div>
              <p className="font-body-sm text-[11px] text-[#685E5A]">
                Direct delivery notifications and stylist concierge via WhatsApp.
              </p>
            </div>

            {/* Password Field & Security Meter */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md font-medium tracking-wider text-[#1B1718]"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="font-body-md text-body-md h-12 w-full border border-[#E5DDD5] bg-[#FAF8F5] pr-10 pl-3.5 text-[#1B1718] placeholder:text-[#685E5A]/50 focus:border-[#141312] focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#685E5A] transition-colors hover:text-[#1B1718]"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>

              {/* Password strength progress bar */}
              {password.length > 0 && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-[#E5DDD5] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength <= 25
                          ? 'bg-red-500 w-1/4'
                          : strength <= 50
                          ? 'bg-amber-500 w-2/4'
                          : strength <= 75
                          ? 'bg-blue-500 w-3/4'
                          : 'bg-emerald-600 w-full'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-[#8E8380]">
                    {strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            {/* Marketing Consent Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="marketingConsent"
                name="marketingConsent"
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer text-[#141312] accent-[#141312]"
              />
              <label htmlFor="marketingConsent" className="text-xs text-[#685E5A] leading-relaxed cursor-pointer">
                Receive private collection previews, seasonal trunk show invitations, and atelier editorial updates.
              </label>
            </div>

            {/* Terms Consent Checkbox */}
            <div className="flex items-start gap-2.5">
              <input
                id="termsConsent"
                name="termsConsent"
                type="checkbox"
                required
                checked={termsConsent}
                onChange={(e) => setTermsConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer text-[#141312] accent-[#141312]"
              />
              <label htmlFor="termsConsent" className="text-xs text-[#685E5A] leading-relaxed cursor-pointer">
                I agree to the{' '}
                <span className="font-medium text-[#141312] underline underline-offset-2">
                  Terms of Service
                </span>{' '}
                &amp;{' '}
                <span className="font-medium text-[#141312] underline underline-offset-2">
                  Privacy Policy
                </span>
                .
              </label>
            </div>

            {/* Primary CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="font-headline-sm text-headline-sm flex h-12 w-full items-center justify-center gap-2 border border-[#141312] bg-[#141312] font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-md transition-all hover:bg-[#2b2826] active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <Icon name="arrow_forward" size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Social Registration Alternatives */}
          <div className="mt-6 flex flex-col items-center">
            <div className="mb-4 flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-[#E5DDD5]" />
              <span className="font-label-sm text-label-sm tracking-wider text-[#685E5A]">
                or register instantly with
              </span>
              <div className="h-px flex-1 bg-[#E5DDD5]" />
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialRegister('Google')}
                className="flex h-12 items-center justify-center gap-2.5 border border-[#E5DDD5] bg-[#FAF8F5] px-4 font-medium shadow-2xs transition-all hover:bg-[#F4EFEB]"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-label-md text-label-md font-medium text-[#1B1718]">
                  Google
                </span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => handleSocialRegister('Apple')}
                className="flex h-12 items-center justify-center gap-2.5 border border-[#E5DDD5] bg-[#FAF8F5] px-4 font-medium shadow-2xs transition-all hover:bg-[#F4EFEB]"
              >
                <svg className="h-4 w-4 shrink-0 fill-current text-[#1B1718]" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.31-7.06-10.74-12.44-23.01-16.14-36.81-3.7-13.8-5.55-26.69-5.55-38.68 0-14.7 3.73-26.85 11.2-36.44 7.47-9.59 16.73-14.47 27.79-14.65 4.8 0 10.15 1.34 16.05 4.02 5.9 2.68 9.94 4.07 12.11 4.17 1.76 0 5.8-1.4 12.11-4.2 6.31-2.8 11.45-4.08 15.42-3.85 11.53.64 20.73 4.9 27.58 12.78-9.84 5.96-14.65 14.15-14.42 24.57.24 8.08 3.38 14.88 9.43 20.41 6.05 5.53 13.23 8.78 21.54 9.76-2.12 6.52-4.66 13.06-7.62 19.61zM119.22 31.84c0-7.22 2.6-13.82 7.8-19.8 5.2-5.98 11.53-9.56 18.99-10.74.24 1.13.36 2.14.36 3.03 0 7.22-2.73 14.07-8.19 20.55-5.46 6.47-11.83 10.15-19.11 11.03-.24-1.25-.36-2.27-.36-3.07z" />
                </svg>
                <span className="font-label-md text-label-md font-medium text-[#1B1718]">
                  Apple
                </span>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-7 text-center">
            <p className="font-body-md text-body-md text-[#685E5A]">
              Already have an account?{' '}
              <Link
                href={`/login${redirectUrl !== '/profile' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="font-label-md text-label-md ml-1 font-semibold text-[#6b1d2f] hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
