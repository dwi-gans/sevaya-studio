'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function ShoppingBagPage() {
  const {
    items,
    isLoaded,
    updateQuantity,
    removeFromCart,
    subtotal,
  } = useCart();

  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const formatIDR = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  // Estimasi berat paket: 500g per abaya/item
  const totalWeightGrams = items.reduce((sum, item) => sum + (item.quantity * 500), 0);

  const handleCheckout = () => {
    if (items.length === 0) return;

    if (!isAuthenticated && !user) {
      showToast('Silakan masuk terlebih dahulu untuk melanjutkan pesanan.');
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
              Loading cart...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <p className="mb-6 font-serif text-xs tracking-wide text-black/64">
              Your cart is currently empty.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-[#000000] px-8 py-3.5 text-[10px] font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-[#1A1A1A]"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-between">
            {/* Bagian Atas: Tabel & List Item Cart */}
            <div className="flex flex-col">
              {/* Header Kolom Desktop */}
              <div className="hidden border-b border-black/15 pb-3 text-[10px] tracking-[0.18em] text-black/60 uppercase sm:grid sm:grid-cols-12 sm:gap-6">
                <div className="col-span-7">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* List Item Cart (Bisa di-scroll jika item sangat banyak) */}
              <div className="divide-y divide-[#E5E5E5] max-h-[50vh] overflow-y-auto pr-1 sm:pr-2">
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
                      {/* Info Produk (Desktop: col-span-7, Mobile: flex) */}
                      <div className="flex items-start space-x-4 sm:col-span-7">
                        <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden bg-[#F0F0F0] sm:h-32 sm:w-24">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover object-top"
                              sizes="96px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-black/60">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-start">
                          <h2 className="text-[10px] font-medium tracking-[0.08em] text-black uppercase sm:text-xs">
                            {item.title}
                          </h2>
                          <p className="mt-1 text-[10px] text-black/64">
                            {formatIDR(item.price)}
                          </p>
                          {variantDetails && (
                            <p className="mt-1 text-[10px] tracking-wide text-black/60 uppercase">
                              {variantDetails}
                            </p>
                          )}

                          {/* Mobile Quantity & Remove Controls */}
                          <div className="mt-4 flex items-center justify-between sm:hidden">
                            <div className="flex flex-col items-start space-y-1.5">
                              <div className="inline-flex items-center border border-black/20 bg-white">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="px-2.5 py-1 text-[10px] text-black transition-colors hover:bg-white"
                                  aria-label="Decrease quantity"
                                >
                                  &minus;
                                </button>
                                <span className="w-8 text-center text-[10px] font-medium text-black">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="px-2.5 py-1 text-[10px] text-black transition-colors hover:bg-white"
                                  aria-label="Increase quantity"
                                >
                                  &#43;
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="text-[10px] text-black/64 underline underline-offset-2 transition-colors hover:text-black"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-medium text-black">
                                {formatIDR(itemTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Kolom Desktop */}
                      <div className="hidden flex-col items-center justify-center space-y-2 sm:col-span-3 sm:flex">
                        <div className="inline-flex items-center border border-black/20 bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-3 py-1.5 text-[10px] text-black transition-colors hover:bg-white"
                            aria-label="Decrease quantity"
                          >
                            &minus;
                          </button>
                          <span className="w-10 text-center text-[10px] font-medium text-black">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-3 py-1.5 text-[10px] text-black transition-colors hover:bg-white"
                            aria-label="Increase quantity"
                          >
                            &#43;
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-[10px] text-black/64 underline underline-offset-2 transition-colors hover:text-black"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Total Kolom Desktop */}
                      <div className="hidden text-right text-[10px] font-medium tracking-wide text-black sm:col-span-2 sm:block sm:text-xs">
                        {formatIDR(itemTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bagian Bawah: Total & Checkout selalu di dasar bawah halaman kanan (mt-auto) */}
            <div className="mt-auto border-t border-black/15 pt-6 pb-2">
              <div className="flex flex-col items-end text-right">
                {/* Weight */}
                {totalWeightGrams > 0 && (
                  <p className="text-[10px] tracking-wider text-black/60">
                    Weight: {totalWeightGrams.toLocaleString('id-ID')} g
                  </p>
                )}

                {/* Total */}
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-[11px] font-medium tracking-wider text-black">
                    Total:
                  </span>
                  <span className="font-serif text-sm font-medium text-black sm:text-base">
                    {formatIDR(subtotal)}
                  </span>
                </div>

                {/* Tax & Shipping Note */}
                <p className="mt-1.5 text-[10px] text-black/60">
                  Tax included.{' '}
                  <span className="underline underline-offset-2">
                    Shipping
                  </span>{' '}
                  calculated at checkout.
                </p>

                {/* Tombol Checkout */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className="mt-5 w-full bg-[#000000] px-10 py-3.5 text-center text-[10px] font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-[#1A1A1A] disabled:opacity-50 sm:w-auto"
                >
                  {isCheckingOut ? 'Loading...' : 'Checkout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
