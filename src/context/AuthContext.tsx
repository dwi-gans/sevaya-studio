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
          friendlyMsg = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
        } else if (friendlyMsg.includes('Email not confirmed')) {
          friendlyMsg = 'Email Anda belum terkonfirmasi. Silakan hubungi admin atau daftar ulang.';
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

    try {
      // Call our secure backend register route which handles validation,
      // duplicate checks, and instant verified creation via Supabase Admin
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone || '',
        }),
      });

      const resJson = await res.json();

      if (!res.ok || !resJson.success) {
        return { error: resJson.error || 'Pendaftaran akun gagal.' };
      }

      // Automatically sign in the user now that the account is created
      const loginRes = await login(email, password);
      if (loginRes.error) {
        // If automatic login had an issue, fallback to state
        setUser({
          id: resJson.user?.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone || '',
        });
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pendaftaran gagal';
      return { error: msg };
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
