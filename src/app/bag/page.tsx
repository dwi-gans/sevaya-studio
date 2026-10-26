'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Footer } from '@/components/layout/Footer';
import { Icon } from '@/components/ui/Icon';

export default function ShoppingBagPage() {
  const { t, language } = useLanguage();
  const {
    items,
    isLoaded,
    updateQuantity,
    removeFromCart,
    itemCount,
    subtotal,
    discount,
    promoCode,
    promoApplied,
    applyPromoCode,
    removePromoCode,
    giftPackaging,
    setGiftPackaging,
    personalNote,
    setPersonalNote,
    totalPayable,
    freeShippingProgress,
    freeShippingRemaining,
  } = useCart();

  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [promoInput, setPromoInput] = useState(promoCode);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleTogglePromo = () => {
    if (promoApplied) {
      removePromoCode();
      showToast(language === 'id' ? 'Kode promo dihapus' : 'Promo code removed');
    } else {
      const success = applyPromoCode(promoInput);
      if (success) {
        showToast(
          language === 'id'
            ? 'Kode promo berhasil digunakan (-Rp 50.000)'
            : 'Promo code applied (-Rp 50,000)',
        );
      } else {
        showToast(
          language === 'id'
            ? 'Kode promo tidak valid. Coba EIDDELIGHT'
            : 'Invalid promo code. Try EIDDELIGHT',
        );
      }
    }
  };

  const router = useRouter();

  const handleCheckout = () => {
    if (!isAuthenticated && !user) {
      showToast(
        language === 'id'
          ? 'Harap masuk (login) terlebih dahulu untuk melanjutkan pesanan.'
          : 'Please log in first to continue your order.',
      );
      router.push('/login?redirect=/test-checkout');
      return;
    }

    setIsCheckingOut(true);
    showToast(
      language === 'id'
        ? 'Mengarahkan ke halaman pengiriman Biteship...'
        : 'Redirecting to Biteship shipping...',
    );
    setTimeout(() => {
      router.push('/test-checkout');
    }, 400);
  };

  const formatIDR = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-[#FAF8F5] pb-32">
      <div className="px-gutter-mobile mx-auto w-full max-w-3xl pt-3 pb-8">
        {/* Item count */}
        <div className="mb-4 flex items-center justify-end border-b border-[#E5DDD5]/50 py-2">
          <span className="font-label-md text-label-md tracking-wider text-[#685E5A] uppercase">
            {language === 'id'
              ? `${itemCount} Produk`
              : `${itemCount} ${itemCount === 1 ? 'Item' : 'Items'}`}
          </span>
        </div>

        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#141312] border-t-transparent" />
            <p className="font-label-sm text-xs text-[#685E5A]">Memuat tas belanja...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Icon name="shopping_bag" size={48} className="text-[#D6CECB]" />
            <h2 className="font-headline-md text-headline-md text-[#1B1718]">
              {t('bag.title_empty')}
            </h2>
            <p className="font-body-sm text-body-sm max-w-xs text-[#685E5A]">
              {t('bag.desc_empty')}
            </p>
            <Link
              href="/"
              className="font-label-md mt-2 rounded-full bg-[#141312] px-6 py-3 font-semibold tracking-wider text-[#FAF8F5] uppercase transition-all hover:bg-[#2b2826]"
            >
              {t('bag.discover')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Free Shipping Progress Tracker */}
            <section className="rounded-xl border border-[#E5DDD5] bg-[#F4EFEB] p-4 shadow-2xs">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon name="local_shipping" size={18} className="text-[#141312]" />
                  <span className="font-label-md text-label-md font-semibold tracking-wider text-[#1B1718] uppercase">
                    {t('bag.domestic_delivery')}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm font-semibold tracking-wide text-[#141312]">
                  {freeShippingProgress}% {t('bag.unlocked')}
                </span>
              </div>
              <p className="font-body-sm text-body-sm mb-2.5 text-[#685E5A]">
                {freeShippingRemaining > 0 ? (
                  <>
                    {t('bag.add_more')}{' '}
                    <span className="font-medium text-[#1B1718]">
                      {formatIDR(freeShippingRemaining)}
                    </span>{' '}
                    {t('bag.to_unlock')}{' '}
                    <span className="font-semibold text-[#141312]">{t('bag.free_express')}</span>
                  </>
                ) : (
                  <span className="font-semibold text-[#141312]">{t('bag.unlocked_shipping')}</span>
                )}
              </p>
              {/* Visual Bar */}
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#E5DDD5]">
                <div
                  className="h-full rounded-full bg-[#141312] transition-all duration-500 ease-out"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </section>

            {/* Cart Items List */}
            <section className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.color}-${item.size}`}
                  className="relative flex gap-3.5 rounded-xl border border-[#E5DDD5]/70 bg-[#F4EFEB] p-3.5 shadow-2xs transition-all"
                >
                  {/* Thumbnail (3:4 ratio) */}
                  <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-none border border-[#E5DDD5]/50 bg-[#FAF8F5]">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                    {item.edition && (
                      <span className="font-label-sm absolute top-1.5 left-1.5 rounded-full bg-[#141312] px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-[#FAF8F5] uppercase backdrop-blur-xs">
                        {item.edition}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex min-w-0 flex-grow flex-col justify-between pr-6">
                    <div>
                      <h2 className="font-headline-sm text-headline-sm line-clamp-1 leading-snug font-medium text-[#1B1718]">
                        {item.title}
                      </h2>
                      <div className="font-body-sm text-body-sm mt-1 flex flex-wrap gap-2 text-[#685E5A]">
                        <span className="inline-flex items-center gap-1.5">
                          {item.colorHex && (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full border border-[#D6CECB]"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          )}
                          {item.color}
                        </span>
                        <span className="text-[#D6CECB]">&bull;</span>
                        <span>
                          {language === 'id' ? 'Ukuran' : 'Size'}: {item.size}
                        </span>
                      </div>
                      <p className="font-headline-sm text-headline-sm mt-1.5 font-semibold text-[#141312]">
                        {formatIDR(item.price)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex h-8 items-center rounded-none border border-[#E5DDD5] bg-[#FAF8F5] px-1">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="flex h-7 w-7 items-center justify-center text-[#1B1718] transition-colors hover:text-[#141312]"
                        >
                          <Icon name="remove" size={15} />
                        </button>
                        <span className="font-label-md text-label-md w-7 text-center font-semibold text-[#1B1718]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="flex h-7 w-7 items-center justify-center text-[#1B1718] transition-colors hover:text-[#141312]"
                        >
                          <Icon name="add" size={15} />
                        </button>
                      </div>
                      <span className="font-body-sm text-body-sm text-[#685E5A]">
                        Sub:{' '}
                        <span className="font-medium text-[#1B1718]">
                          {formatIDR(item.price * item.quantity)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    aria-label={`Remove ${item.title}`}
                    onClick={() => {
                      removeFromCart(item.id);
                      showToast(
                        language === 'id'
                          ? `${item.title} dihapus dari tas`
                          : `Removed ${item.title} from bag`,
                      );
                    }}
                    className="absolute top-3 right-3 p-1 text-[#877274] transition-colors hover:text-[#141312]"
                  >
                    <Icon name="close" size={17} />
                  </button>
                </div>
              ))}
            </section>

            {/* Atelier Gift Packaging */}
            <section className="rounded-xl border border-[#E5DDD5]/80 bg-[#F4EFEB] p-4 shadow-2xs">
              <label className="group flex cursor-pointer items-start gap-3 select-none">
                <input
                  type="checkbox"
                  checked={giftPackaging}
                  onChange={(e) => setGiftPackaging(e.target.checked)}
                  className="mt-1 h-4 w-4 cursor-pointer rounded accent-[#141312]"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-lg text-label-lg font-medium text-[#1B1718]">
                      {t('bag.gift_packaging')}
                    </span>
                    <span className="font-label-sm rounded-full bg-[#141312] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-[#FAF8F5] uppercase">
                      {t('bag.complimentary')}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm mt-0.5 leading-relaxed text-[#685E5A]">
                    {t('bag.gift_desc')}
                  </p>
                </div>
              </label>

              {giftPackaging && (
                <div className="mt-3 flex flex-col gap-1.5 border-t border-[#E5DDD5]/50 pt-3">
                  <label
                    htmlFor="custom-note"
                    className="font-label-sm text-[11px] tracking-wider text-[#685E5A] uppercase"
                  >
                    {t('bag.calligraphy_note')}
                  </label>
                  <input
                    id="custom-note"
                    type="text"
                    value={personalNote}
                    onChange={(e) => setPersonalNote(e.target.value)}
                    placeholder={
                      language === 'id'
                        ? 'cth: Untuk Amira tersayang, dengan penuh kehangatan & keanggunan'
                        : 'e.g. For dearest Amira, with heartfelt warmth & elegance'
                    }
                    className="text-body-sm h-11 w-full rounded-none border border-[#E5DDD5] bg-[#FAF8F5] px-3 text-[#1B1718] placeholder:text-[#685E5A]/60 focus:border-[#141312] focus:outline-none"
                  />
                </div>
              )}
            </section>

            {/* Promo Code Input */}
            <section className="flex items-center gap-2 rounded-xl border border-[#E5DDD5]/80 bg-[#F4EFEB] p-3">
              <div className="relative flex flex-grow items-center">
                <Icon name="style" size={18} className="absolute left-3 text-[#685E5A]" />
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder={t('bag.promo_placeholder')}
                  className="text-body-sm h-11 w-full rounded-none border border-[#E5DDD5] bg-[#FAF8F5] pr-3 pl-9 tracking-wider text-[#1B1718] uppercase placeholder:normal-case focus:border-[#141312] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleTogglePromo}
                className="font-label-md text-label-md flex h-11 items-center justify-center rounded-full bg-[#141312] px-5 font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-2xs transition-all hover:bg-[#2b2826] active:scale-95"
              >
                {promoApplied ? t('bag.applied') : t('bag.apply')}
              </button>
            </section>

            {/* Order Summary */}
            <section className="rounded-xl border border-[#E5DDD5]/80 bg-[#F4EFEB] p-5 shadow-2xs">
              <h3 className="font-headline-sm text-headline-sm mb-3 font-semibold tracking-wider text-[#1B1718] uppercase">
                {t('bag.order_summary')}
              </h3>
              <div className="font-body-md text-body-md flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[#685E5A]">
                  <span>
                    {t('bag.subtotal')} (
                    {language === 'id'
                      ? `${itemCount} produk`
                      : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
                    )
                  </span>
                  <span className="font-medium text-[#1B1718]">{formatIDR(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-[#141312]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>
                        {language === 'id' ? 'Kode Hak Istimewa' : 'Privilege Code'} ({promoCode})
                      </span>
                      <Icon name="verified" size={16} />
                    </div>
                    <span className="font-semibold">-{formatIDR(discount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[#685E5A]">
                  <div className="flex items-center gap-1">
                    <span>{language === 'id' ? 'Kemasan Atelier' : 'Atelier Packaging'}</span>
                    <Icon name="eco" size={14} className="text-[#685E5A]" />
                  </div>
                  <span className="font-label-md text-label-md font-semibold text-[#141312] uppercase">
                    {t('bag.complimentary')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#685E5A]">
                  <span>{language === 'id' ? 'Kurir Domestik' : 'Domestic Courier'}</span>
                  <span className="font-label-md text-label-md font-medium text-[#1B1718] uppercase">
                    {freeShippingRemaining === 0
                      ? t('bag.complimentary')
                      : language === 'id'
                        ? 'Dihitung saat checkout'
                        : 'Calculated at checkout'}
                  </span>
                </div>

                <div className="my-2 h-[1px] bg-[#E5DDD5]" />

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="font-headline-sm text-headline-sm font-semibold tracking-wider text-[#1B1718] uppercase">
                      {t('bag.total')}
                    </span>
                    <p className="font-label-sm text-[11px] text-[#685E5A]">
                      {t('bag.tax_included')}
                    </p>
                  </div>
                  <span className="font-headline-md text-headline-md font-semibold tracking-tight text-[#141312]">
                    {formatIDR(totalPayable)}
                  </span>
                </div>
              </div>
            </section>

            {/* Trust Assurances */}
            <div className="font-label-md text-label-md flex items-center justify-center gap-4 px-3 py-2 text-[#685E5A]">
              <div className="flex items-center gap-1.5">
                <Icon name="published_with_changes" size={16} className="text-[#141312]" />
                <span>{t('bag.returns_badge')}</span>
              </div>
              <span className="text-[#D6CECB]">&bull;</span>
              <div className="flex items-center gap-1.5">
                <Icon name="lock" size={16} className="text-[#141312]" />
                <span>
                  {language === 'id'
                    ? 'Pembayaran Terenkripsi 256-Bit'
                    : '256-Bit Encrypted Checkout'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Checkout Action Bar */}
      {items.length > 0 && (
        <aside className="pb-safe fixed bottom-0 left-0 z-40 w-full border-t border-[#E5DDD5] bg-[#FAF8F5]/95 shadow-[0_-4px_20px_rgba(27,23,24,0.06)] backdrop-blur-xl">
          <div className="px-gutter-mobile mx-auto flex max-w-3xl flex-col gap-2.5 pt-3 pb-3">
            {/* Authenticated prompt hint if guest */}
            {!isAuthenticated && !user && (
              <div className="flex items-center justify-between px-1 text-[11px] text-[#685E5A]">
                <span>
                  {language === 'id'
                    ? 'Wajib masuk untuk menyimpan riwayat & lacak pesanan.'
                    : 'Log in required to save & track your order.'}
                </span>
                <Link
                  href="/login?redirect=/test-checkout"
                  className="font-medium text-[#141312] underline underline-offset-2 hover:opacity-80"
                >
                  {language === 'id' ? 'Masuk Akun' : 'Sign In'}
                </Link>
              </div>
            )}

            <button
              type="button"
              disabled={isCheckingOut}
              onClick={handleCheckout}
              className="font-headline-sm text-headline-sm flex h-12 w-full items-center justify-between rounded-xl bg-[#141312] px-5 font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-md transition-all hover:bg-[#2b2826] active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <Icon name="lock" size={20} />
                {isCheckingOut
                  ? language === 'id'
                    ? 'Memproses...'
                    : 'Processing...'
                  : t('bag.checkout_btn')}
              </span>
              <span className="font-semibold tracking-normal text-[#FAF8F5]">
                {formatIDR(totalPayable)}
              </span>
            </button>

            {/* Payment Assurance Gateways */}
            <div className="flex items-center justify-between px-1">
              <span className="font-label-sm text-[10px] tracking-wider text-[#685E5A] uppercase">
                {t('bag.gateways')}
              </span>
              <div className="flex items-center gap-1.5 opacity-90">
                {['QRIS', 'BCA', 'MANDIRI', 'VISA', 'MASTERCARD'].map((gw) => (
                  <span
                    key={gw}
                    className="font-label-sm rounded border border-[#E5DDD5] bg-[#F4EFEB] px-1.5 py-0.5 text-[9px] font-bold tracking-tight text-[#1B1718]"
                  >
                    {gw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}

      <Footer />
    </main>
  );
}
