'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { siteConfig } from '@/config/site';

export interface CartItem {
  id: string;
  title: string;
  edition?: string;
  price: number;
  originalPrice?: number;
  color: string;
  colorHex?: string;
  size: string;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discount: number;
  promoCode: string;
  promoApplied: boolean;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  giftPackaging: boolean;
  setGiftPackaging: (val: boolean) => void;
  personalNote: string;
  setPersonalNote: (note: string) => void;
  isLoaded: boolean;
  totalPayable: number;
  freeShippingProgress: number;
  freeShippingRemaining: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const INITIAL_ITEMS: CartItem[] = [];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [giftPackaging, setGiftPackaging] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  // Restore cart items from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sevaya_cart_items');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync cart items to localStorage ONLY AFTER INITIAL RESTORE
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('sevaya_cart_items', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isLoaded]);

  const addToCart = useCallback((newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.id === newItem.id && i.color === newItem.color && i.size === newItem.size,
      );
      const qtyToAdd = newItem.quantity || 1;
      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        if (existing) {
          updated[existingIndex] = {
            ...existing,
            quantity: existing.quantity + qtyToAdd,
          };
        }
        return updated;
      }
      return [...prev, { ...newItem, quantity: qtyToAdd }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem('sevaya_cart_items');
    } catch {
      // ignore
    }
  }, []);

  const applyPromoCode = useCallback((code: string) => {
    if (code.trim().toUpperCase() === 'EIDDELIGHT' || code.trim().toUpperCase() === 'SEVAYA10') {
      setPromoCode(code.trim().toUpperCase());
      setPromoApplied(true);
      return true;
    }
    return false;
  }, []);

  const removePromoCode = useCallback(() => {
    setPromoCode('');
    setPromoApplied(false);
  }, []);

  const calculations = useMemo(() => {
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discount = promoApplied && subtotal > 0 ? 50000 : 0;
    const totalPayable = Math.max(0, subtotal - discount);

    const threshold = siteConfig.freeShippingThreshold;
    const freeShippingProgress = Math.min(100, Math.round((subtotal / threshold) * 100));
    const freeShippingRemaining = Math.max(0, threshold - subtotal);

    return {
      itemCount,
      subtotal,
      discount,
      totalPayable,
      freeShippingProgress,
      freeShippingRemaining,
    };
  }, [items, promoApplied]);

  const contextValue = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount: calculations.itemCount,
      subtotal: calculations.subtotal,
      discount: calculations.discount,
      promoCode,
      promoApplied,
      applyPromoCode,
      removePromoCode,
      giftPackaging,
      setGiftPackaging,
      personalNote,
      setPersonalNote,
      totalPayable: calculations.totalPayable,
      freeShippingProgress: calculations.freeShippingProgress,
      freeShippingRemaining: calculations.freeShippingRemaining,
      isLoaded,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      calculations,
      promoCode,
      promoApplied,
      applyPromoCode,
      removePromoCode,
      giftPackaging,
      personalNote,
      isLoaded,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
