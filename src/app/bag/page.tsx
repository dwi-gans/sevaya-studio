'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ShoppingBagPage() {
  const {
    items,
    isLoaded,
    updateQuantity,
    removeFromCart,
    subtotal,
  } = useCart();

  const { t, formatPrice } = useLanguage();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Estimasi berat paket: 500g per abaya/item
  const totalWeightGrams = items.reduce((sum, item) => sum + (item.quantity * 500), 0);

  const handleCheckout = () => {
    if (items.length === 0) return;

    if (!isAuthenticated && !user) {
      showToast(t('bag.loading') || 'Please sign in to proceed.');
      router.push('/login?redirect=/test-checkout');
      return;
    }

    setIsCheckingOut(true);
    router.push('/test-checkout');
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] w-full flex-col bg-white pt-8 pb-10 text-black">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
        
        {!isLoaded ? (
          <div className="py-24 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/60">
              {t('bag.loading')}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <p className="mb-6 font-serif text-xs tracking-wide text-black/64">
              {t('bag.empty_title')}
            </p>
            <Link
              href="/shop"
              className="inline-block bg-[#000000] px-8 py-3.5 text-[10px] font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-[#1A1A1A]"
            >
              {t('bag.continue_shopping')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-between">
            {/* Bagian Atas: Tabel & List Item Cart */}
            <div className="flex flex-col">
              {/* Header Kolom — desktop only */}
              <div className="hidden border-b border-black/15 pb-3 text-[10px] tracking-[0.18em] text-black/60 uppercase sm:grid sm:grid-cols-12 sm:gap-6">
                <div className="col-span-7">{t('bag.col_product')}</div>
                <div className="col-span-3 text-center">{t('bag.col_qty')}</div>
                <div className="col-span-2 text-right"></div>
              </div>

              {/* List Item Cart */}
              <div className="divide-y divide-[#E5E5E5] max-h-[55vh] overflow-y-auto pr-1 sm:pr-2">
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity;
                  const variantDetails = [item.color, item.size, item.edition]
                    .filter(Boolean)
                    .join(' / ');

                  return (
                    <div
                      key={`${item.id}-${item.size}-${item.color}`}
                      className="py-5 sm:py-6 sm:grid sm:grid-cols-12 sm:items-center sm:gap-6"
                    >
                      {/* ── Info Produk (col-span-7 desktop, full mobile) ── */}
                      <div className="flex items-start gap-3.5 sm:gap-4 sm:col-span-7">
                        {/* Gambar */}
                        <div className="relative h-28 w-20 shrink-0 overflow-hidden bg-[#F0F0F0] sm:h-32 sm:w-24">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              quality={90}
                              className="object-cover object-top"
                              sizes="192px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-black/60">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Teks produk: Judul, Varian, Harga */}
                        <div className="flex flex-col justify-start min-w-0 flex-1">
                          <h2 className="text-[10px] font-medium tracking-[0.08em] text-black uppercase sm:text-xs leading-snug">
                            {item.title}
                          </h2>
                          {variantDetails && (
                            <p className="mt-1 text-[10px] tracking-wide text-black/55 uppercase">
                              {variantDetails}
                            </p>
                          )}
                          <p className="mt-1.5 text-[11px] sm:text-xs font-medium text-black">
                            {formatPrice(itemTotal)}
                          </p>

                          {/* ── MOBILE: Stepper di kiri, Icon hapus di posisi harga lama (kanan) ── */}
                          <div className="mt-3.5 flex items-center justify-between sm:hidden">
                            <div className="flex flex-col gap-1">
                              <div className="inline-flex items-center border border-black/20 bg-white">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="px-2.5 py-1 text-[11px] text-black hover:bg-black/5 active:bg-black/10 transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <span className="w-7 text-center text-[10px] font-medium text-black select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="px-2.5 py-1 text-[11px] text-black hover:bg-black/5 active:bg-black/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                              {typeof item.stock === 'number' && item.quantity >= item.stock && (
                                <span className="text-[9px] text-amber-700">Maks. stok</span>
                              )}
                            </div>

                            {/* Boxed Delete Button (mobile) */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="border border-black/25 hover:border-black bg-white px-2.5 py-1 text-[9px] font-medium tracking-[0.14em] uppercase text-black/70 hover:text-black active:bg-black/5 transition-colors"
                              aria-label={t('bag.remove')}
                            >
                              {t('bag.remove') || 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ── DESKTOP: Quantity stepper kolom tengah ── */}
                      <div className="hidden sm:flex flex-col items-center justify-center gap-1 sm:col-span-3">
                        <div className="inline-flex items-center border border-black/20 bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-3 py-1.5 text-[10px] text-black hover:bg-black/5 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-[10px] font-medium text-black select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-3 py-1.5 text-[10px] text-black hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        {typeof item.stock === 'number' && item.quantity >= item.stock && (
                          <span className="text-[9px] text-amber-700">Maks. {item.stock} stok</span>
                        )}
                      </div>

                      {/* ── DESKTOP: Posisi harga yang lama -> Boxed Delete Button ── */}
                      <div className="hidden sm:flex items-center justify-end sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="border border-black/25 hover:border-black bg-white px-3 py-1.5 text-[10px] font-medium tracking-[0.14em] uppercase text-black/70 hover:text-black transition-colors"
                          aria-label={t('bag.remove')}
                        >
                          {t('bag.remove') || 'Delete'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bagian Bawah: Total & Checkout */}
            <div className="mt-auto border-t border-black/15 pt-6 pb-2">
              <div className="flex flex-col items-end text-right">
                {/* Weight */}
                {totalWeightGrams > 0 && (
                  <p className="text-[10px] tracking-wider text-black/60">
                    {t('bag.weight')}: {totalWeightGrams.toLocaleString('id-ID')} g
                  </p>
                )}

                {/* Total */}
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-[11px] font-medium tracking-wider text-black">
                    {t('bag.total')}:
                  </span>
                  <span className="font-serif text-sm font-medium text-black sm:text-base">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {/* Tax & Shipping Note */}
                <p className="mt-1.5 text-[10px] text-black/60">
                  {t('bag.tax_note')}
                </p>

                {/* Tombol Checkout */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className="mt-5 w-full bg-[#000000] px-10 py-3.5 text-center text-[10px] font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-[#1A1A1A] disabled:opacity-50 sm:w-auto"
                >
                  {isCheckingOut ? t('common.loading') : t('bag.checkout_btn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
