'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@/components/ui/Icon';

type PageState = 'loading' | 'ready' | 'success' | 'error';

// Use anon client for password reset (user-facing)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const sessionRef = useRef<any>(null);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [tokenError, setTokenError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Collect debug info (URL at the time of landing)
    const debug = `hash="${window.location.hash.substring(0, 60)}" search="${window.location.search}"`;
    setDebugInfo(debug);

    // METHOD 1: Listen for Supabase PASSWORD_RECOVERY auth state event.
    // Supabase JS client automatically parses the #access_token from the URL
    // and fires this event — this is the recommended approach.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          sessionRef.current = session;
          setPageState('ready');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    // METHOD 2: Fallback — check for ?code= (PKCE) or ?token_hash= in URL
    const qp = new URLSearchParams(window.location.search);
    const code = qp.get('code');
    const tokenHash = qp.get('token_hash');
    const type = qp.get('type');

    async function tryFallback() {
      try {
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session) {
            sessionRef.current = data.session;
            setPageState('ready');
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }

        if (tokenHash && type === 'recovery') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (!error && data.session) {
            sessionRef.current = data.session;
            setPageState('ready');
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }

        // Nothing worked after 2.5s → show error
        setTimeout(() => {
          setPageState((prev) => {
            if (prev === 'loading') {
              setTokenError('Tautan reset tidak valid atau telah kedaluwarsa.');
              return 'error';
            }
            return prev;
          });
        }, 2500);
      } catch (err) {
        console.error('Fallback error:', err);
        setTokenError('Gagal memproses tautan reset.');
        setPageState('error');
      }
    }

    tryFallback();

    return () => subscription.unsubscribe();
  }, []);

  const validatePassword = (): string | null => {
    if (newPassword.length < 8) return 'Kata sandi minimal 8 karakter.';
    if (newPassword !== confirmPassword) return 'Konfirmasi kata sandi tidak cocok.';
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return 'Kata sandi harus mengandung huruf dan angka.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = validatePassword();
    if (validationError) { setErrorMsg(validationError); return; }

    setIsLoading(true);
    try {
      // If we have a stored session, set it first
      if (sessionRef.current) {
        await supabase.auth.setSession({
          access_token: sessionRef.current.access_token,
          refresh_token: sessionRef.current.refresh_token,
        });
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw new Error(error.message);

      await supabase.auth.signOut();
      setPageState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Password strength ─────────────────────────────────────────────────────
  const getStrength = (pw: string) => {
    if (!pw) return { label: '', color: '', width: 'w-0' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Lemah', color: 'bg-red-500', width: 'w-1/4' };
    if (score <= 2) return { label: 'Cukup', color: 'bg-orange-400', width: 'w-2/4' };
    if (score <= 3) return { label: 'Baik', color: 'bg-yellow-500', width: 'w-3/4' };
    return { label: 'Kuat', color: 'bg-emerald-500', width: 'w-full' };
  };
  const strength = getStrength(newPassword);

  // ── States ────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
        <p className="text-sm text-black/70">Memverifikasi tautan…</p>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center gap-4 border border-red-200 bg-red-50 p-8 text-center">
            <Icon name="link_off" size={32} className="text-red-500" />
            <div>
              <p className="font-sans text-sm font-semibold tracking-wider text-red-800 uppercase">
                Tautan Tidak Valid
              </p>
              <p className="mt-2 text-sm leading-relaxed text-red-700">{tokenError}</p>
            </div>
          </div>

          {/* Debug info — remove before production */}
          {debugInfo && (
            <div className="mt-3 border border-black/15 bg-white p-3">
              <p className="text-xs font-semibold text-black">Debug URL:</p>
              <p className="break-all text-xs text-black/70">{debugInfo}</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/forgot-password"
              className="font-label-lg text-label-lg flex h-12 w-full items-center justify-center gap-2 border border-black bg-black font-semibold tracking-wider text-white uppercase transition-all hover:bg-black/85"
            >
              <Icon name="refresh" size={16} />
              Minta Tautan Baru
            </Link>
            <Link href="/login" className="text-center text-sm text-black/70 underline underline-offset-4 hover:text-black">
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center gap-4 border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center bg-emerald-100">
              <Icon name="check_circle" size={30} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-sans text-sm font-semibold tracking-wider text-emerald-800 uppercase">
                Kata Sandi Diperbarui!
              </p>
              <p className="mt-2 text-sm leading-relaxed text-emerald-700">
                Kata sandi akun SEVAYA Anda berhasil diubah. Silakan masuk dengan kata sandi baru.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <button
              onClick={() => router.push('/login')}
              className="font-label-lg text-label-lg flex h-12 w-full items-center justify-center gap-2 border border-black bg-black font-semibold tracking-wider text-white uppercase transition-all hover:bg-black/85"
            >
              <span>Masuk Sekarang</span>
              <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main password form ────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <main className="pb-safe relative flex w-full flex-1 flex-col py-6">
        <div className="px-margin-mobile mx-auto w-full max-w-lg">
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="font-headline-xl-mobile font-normal text-black md:text-3xl">
              Buat <span className="font-sans font-medium text-black">Kata Sandi Baru</span>
            </h1>
            <p className="font-body-md text-body-md leading-relaxed text-black/70">
              Pilih kata sandi yang kuat untuk akun SEVAYA Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                <Icon name="error" size={16} className="mt-0.5 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md tracking-wider text-black uppercase" htmlFor="new-password">
                Kata Sandi Baru
              </label>
              <div className="relative flex items-center border border-black/15 bg-white shadow-2xs transition-all focus-within:border-black focus-within:ring-1 focus-within:ring-[#000000]/20">
                <Icon name="lock" size={19} className="pointer-events-none absolute left-3.5 text-black/70" />
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="font-body-md text-body-md h-12 w-full bg-transparent pr-11 pl-11 text-black placeholder:text-black/70/60 focus:outline-none"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} aria-label="Toggle"
                  className="absolute right-3.5 text-black/70 transition-colors hover:text-black">
                  <Icon name={showNew ? 'visibility_off' : 'visibility'} size={19} />
                </button>
              </div>
              {newPassword && (
                <div className="flex flex-col gap-1">
                  <div className="h-1 w-full bg-[rgba(0,0,0,0.12)]">
                    <div className={`h-1 transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-xs text-black/70">Kekuatan: <span className="font-medium text-black">{strength.label}</span></p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md tracking-wider text-black uppercase" htmlFor="confirm-password">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative flex items-center border border-black/15 bg-white shadow-2xs transition-all focus-within:border-black focus-within:ring-1 focus-within:ring-[#000000]/20">
                <Icon name="lock" size={19} className="pointer-events-none absolute left-3.5 text-black/70" />
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="font-body-md text-body-md h-12 w-full bg-transparent pr-11 pl-11 text-black placeholder:text-black/70/60 focus:outline-none"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle"
                  className="absolute right-3.5 text-black/70 transition-colors hover:text-black">
                  <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size={19} />
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Kata sandi tidak cocok.</p>
              )}
              {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 8 && (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <Icon name="check_circle" size={13} /> Kata sandi cocok.
                </p>
              )}
            </div>

            {/* Requirements */}
            <div className="border border-black/15 bg-white p-3.5">
              <p className="mb-1.5 text-xs font-semibold tracking-wider text-black uppercase">Persyaratan</p>
              <ul className="space-y-1">
                {[
                  { check: newPassword.length >= 8, text: 'Minimal 8 karakter' },
                  { check: /[A-Za-z]/.test(newPassword), text: 'Mengandung huruf' },
                  { check: /[0-9]/.test(newPassword), text: 'Mengandung angka' },
                ].map(({ check, text }) => (
                  <li key={text} className="flex items-center gap-2 text-xs text-black/70">
                    <Icon name={check ? 'check_circle' : 'radio_button_unchecked'} size={13}
                      className={check ? 'text-emerald-500' : 'text-[#B8A99A]'} />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="font-label-lg text-label-lg mt-1 flex h-12 w-full items-center justify-center gap-2 border border-black bg-black font-semibold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-black/85 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <><span>Simpan Kata Sandi Baru</span><Icon name="check" size={17} /></>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
