'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase';

export interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

interface AuthResult {
  error?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<AuthResult>;
  register: (name: string, email: string, password?: string, phone?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserFromSession = useCallback((sessionUser: any) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }
    const meta = sessionUser.user_metadata || {};
    setUser({
      id: sessionUser.id,
      name:
        meta.full_name ||
        meta.name ||
        sessionUser.email?.split('@')[0] ||
        'Member Sevaya',
      email: sessionUser.email || '',
      phone: meta.phone || sessionUser.phone || '',
      avatar_url: meta.avatar_url || '',
      created_at: sessionUser.created_at,
    });
  }, []);

  useEffect(() => {
    // 1. Initial active session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserFromSession(session.user);
      }
      setIsLoading(false);
    });

    // 2. Real-time auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncUserFromSession(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncUserFromSession]);

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const login = async (email: string, password?: string): Promise<AuthResult> => {
    if (!email || !email.includes('@')) {
      return { error: 'Format email tidak valid.' };
    }

    if (!password) {
      // Demo / fallback
      setUser({
        name: email.split('@')[0] || 'Member',
        email,
      });
      return { error: null };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        let friendlyMsg = error.message;
        if (friendlyMsg.includes('Invalid login credentials')) {
          friendlyMsg = 'Email atau kata sandi tidak cocok. Pastikan Anda sudah mendaftar terlebih dahulu.';
        } else if (friendlyMsg.includes('Email not confirmed')) {
          friendlyMsg = 'Email Anda belum terkonfirmasi. Silakan periksa inbox email Anda.';
        }
        return { error: friendlyMsg };
      }

      if (data.user) {
        syncUserFromSession(data.user);
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk akun';
      return { error: msg };
    }
  };

  const register = async (
    name: string,
    email: string,
    password?: string,
    phone?: string
  ): Promise<AuthResult> => {
    if (!name || name.trim().length < 2) {
      return { error: 'Nama lengkap minimal 2 karakter.' };
    }
    if (!email || !email.includes('@')) {
      return { error: 'Format email tidak valid.' };
    }
    if (!password || password.length < 6) {
      return { error: 'Kata sandi minimal 6 karakter.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    try {
      // Call our secure backend register route which handles validation,
      // duplicate checks, and instant verified creation via Supabase Admin
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          password,
          phone: phone || '',
        }),
      });

      const resJson = await res.json().catch(() => ({}));

      if (!res.ok || !resJson.success) {
        // Fallback: try client-side Supabase signUp directly if server route has issues
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                name: cleanName,
                full_name: cleanName,
                phone: phone || '',
              },
            },
          });

          if (!signUpError && signUpData.user) {
            syncUserFromSession(signUpData.user);
            return { error: null };
          }
        } catch {
          // fallback failed, return original error
        }

        return { error: resJson.error || 'Pendaftaran akun gagal.' };
      }

      // Automatically sign in the user now that the account is created
      const loginRes = await login(cleanEmail, password);
      if (loginRes.error) {
        // If automatic login had an issue, fallback to session state
        setUser({
          id: resJson.user?.id,
          name: cleanName,
          email: cleanEmail,
          phone: phone || '',
        });
      }

      return { error: null };
    } catch {
      // Fallback to client-side Supabase signUp if backend fetch fails
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
              full_name: cleanName,
              phone: phone || '',
            },
          },
        });

        if (!signUpError && signUpData.user) {
          syncUserFromSession(signUpData.user);
          return { error: null };
        }
        if (signUpError) {
          return { error: signUpError.message };
        }
      } catch (clientErr) {
        const msg = clientErr instanceof Error ? clientErr.message : 'Pendaftaran gagal';
        return { error: msg };
      }
      return { error: 'Terjadi kesalahan saat pendaftaran akun.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
