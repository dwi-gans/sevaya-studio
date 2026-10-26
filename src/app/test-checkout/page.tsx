'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import type { BiteshipArea, BiteshipRateOption } from '@/integrations/biteship';
import type { IconName } from '@/components/ui/Icon';

function loadSnapScript(): Promise<any> {
  if (typeof window !== 'undefined' && window.snap) {
    return Promise.resolve(window.snap);
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('midtrans-snap-script');
    if (existing) {
      existing.onload = () => resolve(window.snap);
      return;
    }
    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'Mid-client-3hvHlo_u41mlnJKP');
    script.onload = () => resolve(window.snap);
    script.onerror = () => reject(new Error('Gagal memuat pop-up pembayaran Midtrans'));
    document.body.appendChild(script);
  });
}

const INDONESIA_PROVINCES = [
  'Aceh', 'Bali', 'Banten', 'Bengkulu', 'DI Yogyakarta', 'DKI Jakarta',
  'Gorontalo', 'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
  'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah',
  'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung',
  'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat',
  'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Riau', 'Sulawesi Barat',
  'Sulawesi Selatan', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Sulawesi Utara',
  'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara',
];

const PAYMENT_METHODS: { id: string; label: string; desc: string; badge?: string; icon: IconName }[] = [
  {
    id: 'midtrans',
    label: 'Bayar Otomatis',
    desc: 'QRIS, Virtual Account, E-Wallet, Kartu Kredit. Terverifikasi instan.',
    badge: 'Rekomendasi',
    icon: 'payments',
  },
  {
    id: 'transfer',
    label: 'Transfer Bank',
    desc: 'Transfer manual ke rekening resmi Sevaya.',
    icon: 'receipt_long' as IconName,
  },
  {
    id: 'cod',
    label: 'Bayar di Tempat',
    desc: 'Bayar tunai ke kurir saat paket tiba.',
    icon: 'local_shipping',
  },
];

// Sub-pilihan metode Midtrans (untuk UI saja — Midtrans Snap tetap menampilkan semua)
const MIDTRANS_SUB_METHODS: { id: string; icon: IconName; label: string; desc: string }[] = [
  { id: 'qris',    icon: 'payments',     label: 'QRIS',            desc: 'GoPay, OVO, Shopee, BCA' },
  { id: 'va',      icon: 'receipt_long', label: 'Virtual Account', desc: 'BCA, Mandiri, BRI, BNI' },
  { id: 'ewallet', icon: 'payments',     label: 'E-Wallet',        desc: 'GoPay & ShopeePay' },
  { id: 'cc',      icon: 'credit_card',  label: 'Kartu Kredit',    desc: 'Visa, Mastercard, JCB' },
];

const formatIDR = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

export default function CheckoutPage() {
  const { items, subtotal, discount, totalPayable, giftPackaging, clearCart, addToCart, isLoaded } = useCart();
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [emailNews, setEmailNews] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('DKI Jakarta');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [saveInfo, setSaveInfo] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('midtrans');
  const [sameAddress, setSameAddress] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { user, getAccessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  // ── Autofill authenticated user info ───────────────────────────────────────
  useEffect(() => {
    if (user) {
      if (user.email) setEmail((prev) => prev || user.email);
      if (user.name) {
        const parts = user.name.trim().split(' ');
        setFirstName((prev) => prev || parts[0] || '');
        setLastName((prev) => prev || parts.slice(1).join(' ') || '');
      }
      if (user.phone) setPhone((prev) => prev || user.phone || '');

      getAccessToken().then((token) => {
        if (!token) return;
        fetch('/api/user/addresses', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.addresses?.length > 0) {
              const defaultAddr = d.addresses.find((a: any) => a.is_default) || d.addresses[0];
              if (defaultAddr) {
                setAddress((prev) => prev || defaultAddr.address_line || '');
                setCity((prev) => prev || defaultAddr.city || '');
                setProvince((prev) => (prev === 'DKI Jakarta' && defaultAddr.province ? defaultAddr.province : prev));
                setPostalCode((prev) => prev || defaultAddr.postal_code || '');
              }
            }
          })
          .catch(() => {});
      });
    }
  }, [user, getAccessToken]);

  // ── Embedded Midtrans Payment state ──────────────────────────────────────────
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [embeddedOrderNumber, setEmbeddedOrderNumber] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [midtransSubMethod, setMidtransSubMethod] = useState<string>('qris');

  const copyBankToClipboard = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedBank(id);
      setTimeout(() => setCopiedBank(null), 2000);
    } catch {
      // ignore
    }
  };

  // ── Restore in-progress payment from sessionStorage (survives reload) ─────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('sevaya_checkout_pending');
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data.snapToken && data.orderNumber && data.expiresAt && Date.now() < data.expiresAt) {
        setSnapToken(data.snapToken);
        setEmbeddedOrderNumber(data.orderNumber);
        setPaymentMethod('midtrans');
        // Restore form fields so user sees context
        if (data.email) setEmail(data.email);
        if (data.firstName) setFirstName(data.firstName);
        if (data.lastName) setLastName(data.lastName);
        if (data.phone) setPhone(data.phone);
        if (data.address) setAddress(data.address);
        if (data.apartment) setApartment(data.apartment);
        if (data.city) setCity(data.city);
        if (data.province) setProvince(data.province);
        if (data.postalCode) setPostalCode(data.postalCode);
        if (data.selectedArea) setSelectedArea(data.selectedArea);
        if (data.selectedRate) setSelectedRate(data.selectedRate);
      } else {
        sessionStorage.removeItem('sevaya_checkout_pending');
      }
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Biteship shipping state ──────────────────────────────────────────────────
  const [areaQuery, setAreaQuery] = useState('');
  const [areaResults, setAreaResults] = useState<BiteshipArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<BiteshipArea | null>(null);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  const [shippingRates, setShippingRates] = useState<BiteshipRateOption[]>([]);
  const [selectedRate, setSelectedRate] = useState<BiteshipRateOption | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [shippingNotice, setShippingNotice] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  // ── Address "complete" check ─────────────────────────────────────────────────
  const addressComplete = address.trim().length > 3 && city.trim().length > 1 && postalCode.length >= 5;

  const handleSubmitOrder = async () => {
    setSubmitError(null);

    if (!user) {
      setSubmitError('Harap masuk (login) ke akun Anda terlebih dahulu agar pesanan dapat disimpan dan dilacak resmi.');
      router.push('/login?redirect=/test-checkout');
      return;
    }

    if (!email || !email.includes('@')) {
      setSubmitError('Harap masukkan alamat email yang valid.');
      return;
    }
    if (!firstName.trim()) {
      setSubmitError('Nama depan wajib diisi.');
      return;
    }
    if (!address.trim() || !city.trim() || postalCode.length < 5) {
      setSubmitError('Lengkapi detail alamat dan kode pos.');
      return;
    }
    if (!phone.trim()) {
      setSubmitError('Nomor HP / WhatsApp wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = (items.length > 0 ? items : displayItems).map((it) => ({
        productTitle: it.title,
        color: it.color,
        size: it.size,
        qty: it.quantity,
        price: it.price,
      }));

      const payload = {
        email,
        firstName,
        lastName,
        phone,
        address,
        apartment,
        city,
        province,
        postalCode,
        items: orderItems,
        subtotal: displaySubtotal,
        discount,
        shippingCost,
        giftFee,
        grandTotal: displayTotal,
        paymentMethod,
        selectedRate,
        selectedArea,
        userId: user?.id || null,
      };

      const token = await getAccessToken();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses pesanan.');
      }

      const queryParams = new URLSearchParams({
        orderNumber: data.orderNumber,
        name: `${firstName} ${lastName}`.trim(),
        email: email.trim(),
        phone: phone.trim(),
        payment: paymentMethod,
        subtotal: String(displaySubtotal),
        shipping: String(shippingCost),
        total: String(displayTotal),
        courier: selectedRate ? `${selectedRate.courier_name} ${selectedRate.courier_service_name}` : '',
        duration: selectedRate?.duration || '',
        destination: selectedArea ? selectedArea.name : `${city}, ${province}`,
        items: JSON.stringify(orderItems),
      });

      // If Midtrans is selected, request Snap Token then redirect to order-confirmation
      // The confirmation page will show "Pay Now" → opens Midtrans popup there
      if (paymentMethod === 'midtrans') {
        const snapRes = await fetch('/api/payment/snap-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: data.orderNumber,
            grand_total: displayTotal,
            items: orderItems.map((it: any, idx: number) => ({
              id: String(it.id || `item-${idx}`),
              name: String(it.title || it.name || 'Abaya SEVAYA'),
              price: Number(it.price) || 0,
              quantity: Number(it.quantity) || 1,
            })),
            customer: {
              first_name: firstName,
              last_name: lastName,
              email: email.trim(),
              phone: phone.trim(),
            },
          }),
        });

        const snapData = await snapRes.json();
        if (!snapData.success || !snapData.token) {
          throw new Error(snapData.error || 'Gagal menghubungi gateway pembayaran Midtrans');
        }

        // Clear cart now
        if (items.length > 0 && clearCart) clearCart();

        // Store snap token in sessionStorage so confirmation page can open popup
        try {
          sessionStorage.setItem('sevaya_snap_pending', JSON.stringify({
            snapToken: snapData.token,
            orderNumber: data.orderNumber,
            createdAt: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes timeout
          }));
        } catch { /* ignore */ }

        // Redirect to order-confirmation — Pay Now button lives there
        router.push(`/order-confirmation?${queryParams.toString()}`);
        return;
      }

      // Fallback for manual transfer / COD
      if (items.length > 0 && clearCart) {
        clearCart();
      }

      router.push(`/order-confirmation?${queryParams.toString()}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal memproses pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Search Biteship area when city/postalCode changes ───────────────────────
  useEffect(() => {
    const query = postalCode.length >= 5 ? postalCode : city.trim();
    if (query.length < 2) {
      setAreaResults([]);
      setShowAreaDropdown(false);
      return;
    }
    setAreaQuery(query);
  }, [city, postalCode]);

  useEffect(() => {
    if (!areaQuery || areaQuery.length < 2) return;
    const timer = setTimeout(async () => {
      setIsSearchingArea(true);
      try {
        const res = await fetch(`/api/shipping/destination?search=${encodeURIComponent(areaQuery)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setAreaResults(json.data);
          setShowAreaDropdown(true);
          if (!selectedArea) {
            startTransition(() => setSelectedArea(json.data[0]));
          }
        }
      } catch {
        // silent fail
      } finally {
        setIsSearchingArea(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [areaQuery]);

  // ── Re-mount Midtrans embed when snapToken changes (including after restore) ───
  useEffect(() => {
    if (!snapToken) return;
    const token = snapToken;
    const timer = setTimeout(async () => {
      try {
        const snapInstance = await loadSnapScript();
        if (!snapInstance) return;
        const embedContainer = document.getElementById('snap-embed-container');
        if (embedContainer && typeof snapInstance.embed === 'function') {
          snapInstance.embed(token, {
            embedId: 'snap-embed-container',
            onSuccess: () => {
              try { sessionStorage.removeItem('sevaya_checkout_pending'); } catch { /* ignore */ }
              if (items.length > 0 && clearCart) clearCart();
              window.location.href = `/order-confirmation?orderNumber=${embeddedOrderNumber}&payment_status=settlement`;
            },
            onPending: () => {
              try { sessionStorage.removeItem('sevaya_checkout_pending'); } catch { /* ignore */ }
              window.location.href = `/order-confirmation?orderNumber=${embeddedOrderNumber}&payment_status=pending`;
            },
            onError: () => {
              setSubmitError('Pembayaran gagal. Silakan coba lagi.');
            },
            onClose: () => { /* user closed */ },
          });
          const embedEl = document.getElementById('section-payment-embed');
          if (embedEl) embedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapToken]);

  // ── Fetch shipping rates when address + area ready ───────────────────────────
  useEffect(() => {
    if (!addressComplete || !selectedArea) return;

    const totalWeight = items.reduce((sum, item) => sum + 500 * item.quantity, 0) || 1000;

    setIsLoadingRates(true);
    setShippingError(null);
    setShippingNotice(null);
    setShippingRates([]);
    setSelectedRate(null);

    fetch('/api/shipping/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination_area_id: selectedArea.id,
        destination_postal_code: selectedArea.postal_code,
        weight: totalWeight,
        couriers: 'jne,sicepat,jnt,anteraja,tiki,pos',
        items: items.map((it) => ({
          name: it.title,
          category: 'fashion',
          value: it.price,
          quantity: it.quantity,
          weight: 500,
        })),
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setShippingRates(json.data);
          if (json.notice) setShippingNotice(json.notice);
          if (json.data.length > 0) setSelectedRate(json.data[0]);
        } else {
          setShippingError(json.error || 'Gagal memuat tarif pengiriman');
        }
      })
      .catch(() => setShippingError('Koneksi ke API pengiriman gagal'))
      .finally(() => setIsLoadingRates(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressComplete, selectedArea]);

  const shippingCost = selectedRate?.price ?? 0;
  const giftFee = giftPackaging ? 25000 : 0;
  const grandTotal = (totalPayable || subtotal) + shippingCost + giftFee;

  // ── Wait for cart items to load from localStorage before checking empty ──
  if (!isLoaded || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#141312] border-t-transparent" />
          <p className="text-xs text-[#7C726E]">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  // ── Empty bag check: show polite empty view instead of injecting fake items ──
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#141312]">
        <header className="sticky top-0 z-40 border-b border-[#E5DDD5] bg-[#FAF8F5]/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-[#141312]"
            >
              <Icon name="arrow_back" size={14} />
              <span className="hidden sm:inline">Toko</span>
            </Link>
            <Logo className="h-5 w-auto" />
            <Link
              href="/bag"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-[#141312]"
            >
              <Icon name="shopping_bag" size={14} />
              <span className="hidden sm:inline">Tas</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#E5DDD5] bg-[#F4EFEB] text-[#141312]">
            <Icon name="shopping_bag" size={28} />
          </div>
          <h1 className="font-sans text-xl font-medium text-[#141312] sm:text-2xl">Tas Belanja Anda Kosong</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#7C726E]">
            Belum ada busana di dalam tas belanja Anda. Silakan pilih busana modest abaya dari koleksi Sevaya untuk melanjutkan pemesanan.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-[#141312] px-6 py-3 text-xs font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-sm transition hover:bg-[#2b2826]"
            >
              <Icon name="shopping_bag" size={15} />
              <span>Jelajahi Koleksi Busana</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                addToCart({
                  id: 'fina-abaya-stripe-2',
                  title: 'Fina Abaya - Stripe 2.0',
                  edition: 'Edition 2.0',
                  price: 1339000,
                  originalPrice: 1489000,
                  color: 'Garnet Wine',
                  colorHex: '#6b1d2f',
                  size: 'S–M',
                  image: '/images/catalog/catalog-01.jpg',
                  quantity: 1,
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D0C5BD] bg-white px-4 py-3 text-xs font-medium tracking-wider text-[#141312] uppercase transition hover:border-[#141312]"
            >
              <span>+ Coba dengan 1 Item Contoh</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Authentication check: User MUST log in before checking out so orders are properly saved & tracked ──
  if (!authLoading && !isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#141312]">
        <header className="sticky top-0 z-40 border-b border-[#E5DDD5] bg-[#FAF8F5]/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/bag"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-[#141312]"
            >
              <Icon name="arrow_back" size={14} />
              <span className="hidden sm:inline">Tas Belanja</span>
            </Link>
            <Logo className="h-5 w-auto" />
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E5DDD5] bg-[#F4EFEB] text-[#141312]">
            <Icon name="lock" size={28} />
          </div>
          <span className="font-label-sm text-[11px] font-bold tracking-[0.2em] text-[#8C827A] uppercase">
            Autentikasi Diperlukan
          </span>
          <h1 className="mt-2 font-headline-md text-2xl font-semibold text-[#141312]">
            Masuk untuk Melanjutkan Checkout
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#7C726E]">
            Untuk memastikan pesanan Anda tersimpan resmi dan dapat dilacak kapan saja di menu profil Anda, silakan masuk ke akun Sevaya terlebih dahulu.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3">
            <Link
              href="/login?redirect=/test-checkout"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#141312] text-xs font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-sm transition hover:bg-[#2b2826]"
            >
              <Icon name="person" size={16} />
              <span>Masuk ke Akun Anda</span>
            </Link>
            <Link
              href="/register?redirect=/test-checkout"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D0C5BD] bg-white text-xs font-medium tracking-wider text-[#141312] uppercase transition hover:border-[#141312]"
            >
              <Icon name="arrow_forward" size={16} />
              <span>Daftar Akun Baru</span>
            </Link>
            <Link
              href="/bag"
              className="mt-2 text-[11px] font-medium tracking-wider text-[#7C726E] underline underline-offset-4 hover:text-[#141312]"
            >
              Kembali ke Tas Belanja
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayItems = items;
  const displaySubtotal = subtotal;
  const displayTotal = grandTotal;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#141312]">
      {/* Midtrans Snap JS */}
      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js'
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-3hvHlo_u41mlnJKP'}
        strategy="afterInteractive"
      />
      {/* ── Checkout Header ── */}
      <header className="sticky top-0 z-40 border-b border-[#E5DDD5] bg-[#FAF8F5]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-[#141312]"
          >
            <Icon name="arrow_back" size={14} />
            <span className="hidden sm:inline">Toko</span>
          </Link>

          <Logo className="h-5 w-auto" />

          <Link
            href="/bag"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-[#141312]"
          >
            <Icon name="shopping_bag" size={14} />
            <span className="hidden sm:inline">Tas</span>
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">

          {/* ═══════════ ORDER SUMMARY (mobile top / desktop right) ═══════════ */}
          <aside className="order-first lg:order-last">
            <div className="lg:sticky lg:top-20 space-y-5">

              {/* Items */}
              <div className="space-y-4">
                {displayItems.map((item, idx) => (
                  <div key={`${item.id || item.title}-${item.color || ''}-${idx}`} className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className="h-16 w-16 overflow-hidden rounded-md border border-[#E5DDD5] bg-[#F4EFEB]">
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#7C726E] text-[10px] font-semibold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex flex-1 items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-[#141312]">{item.title}</p>
                        <p className="mt-0.5 text-[11px] text-[#7C726E]">
                          {item.color} / {item.size}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#141312] whitespace-nowrap">
                        {formatIDR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-[#E5DDD5]" />

              {/* Discount code */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Kode diskon"
                  className="flex-1 rounded-lg border border-[#D0C5BD] bg-white px-3 py-2.5 text-xs text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none"
                />
                <button
                  type="button"
                  className="rounded-lg border border-[#141312] bg-white px-4 py-2.5 text-xs font-medium text-[#141312] transition hover:bg-[#141312] hover:text-white"
                >
                  Terapkan
                </button>
              </div>

              <hr className="border-[#E5DDD5]" />

              {/* Price breakdown */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#554C48]">Subtotal</span>
                  <span className="font-medium text-[#141312]">{formatIDR(displaySubtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Diskon</span>
                    <span>−{formatIDR(discount)}</span>
                  </div>
                )}

                {giftPackaging && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#554C48]">Gift Packaging</span>
                    <span className="font-medium text-[#141312]">{formatIDR(giftFee)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#554C48]">Pengiriman</span>
                  <span className={`font-medium ${selectedRate ? 'text-[#141312]' : 'text-[#8E8380] text-xs'}`}>
                    {selectedRate ? formatIDR(shippingCost) : 'Masukkan alamat pengiriman'}
                  </span>
                </div>
              </div>

              <hr className="border-[#E5DDD5]" />

              {/* Total */}
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#141312]">Total</p>
                  <p className="text-[10px] text-[#7C726E]">Termasuk pajak yang berlaku</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] tracking-wider text-[#7C726E] uppercase">IDR</p>
                  <p className="text-xl font-semibold text-[#141312]">{formatIDR(displayTotal)}</p>
                </div>
              </div>

              {/* Submit Error — sidebar */}
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {submitError}
                </div>
              )}
            </div>
          </aside>

          {/* ═══════════ LEFT — Form ═══════════ */}
          <div className="order-last lg:order-first space-y-8">

            {/* ── PAYMENT LOCK BANNER — shown when Midtrans embed is active ── */}
            {snapToken && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <Icon name="lock" size={15} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-800">Pembayaran sedang berlangsung</p>
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    Detail pesanan dikunci. Selesaikan pembayaran atau{' '}
                    <button
                      type="button"
                      className="underline hover:text-amber-900 font-medium"
                      onClick={() => {
                        setSnapToken(null);
                        setEmbeddedOrderNumber(null);
                        try { sessionStorage.removeItem('sevaya_checkout_pending'); } catch { /* ignore */ }
                      }}
                    >
                      batalkan untuk mengubah
                    </button>
                    .
                  </p>
                </div>
              </div>
            )}

            {/* Wrap seluruh form dengan fieldset — disabled otomatis mengunci semua input saat bayar */}
            <fieldset disabled={!!snapToken} className="contents">{/* contents = no box, just semantic group */}

            {/* 1. Contact */}
            <section>
              <div className="mb-4">
                <h2 className="text-sm font-semibold tracking-[0.12em] text-[#141312] uppercase">
                  Kontak
                </h2>
              </div>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none"
                />
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#554C48]">
                  <input
                    type="checkbox"
                    checked={emailNews}
                    onChange={(e) => setEmailNews(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-[#141312]"
                  />
                  Kirim penawaran dan berita via email
                </label>
              </div>
            </section>

            {/* 2. Delivery */}
            <section>
              <h2 className="mb-4 text-sm font-semibold tracking-[0.12em] text-[#141312] uppercase">
                Pengiriman
              </h2>
              <div className="space-y-3">
                {/* Country */}
                <div className="relative">
                  <select
                    defaultValue="ID"
                    className="w-full appearance-none rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] focus:border-[#141312] focus:outline-none"
                  >
                    <option value="ID">Indonesia</option>
                  </select>
                  <Icon name="keyboard_arrow_down" size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#8E8380]" />
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nama depan" className="rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nama belakang" className="rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none" />
                </div>

                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat" className="w-full rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none" />
                <input type="text" value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="Apartemen, suite, dll. (opsional)" className="w-full rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none" />
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kota / Kecamatan" className="w-full rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none" />

                {/* Province + Postal */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full appearance-none rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] focus:border-[#141312] focus:outline-none">
                      {INDONESIA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <Icon name="keyboard_arrow_down" size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#8E8380]" />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="Kode Pos"
                      maxLength={5}
                      className="w-full rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none"
                    />
                    {isSearchingArea && (
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[#8E8380]">Mencari...</span>
                    )}
                  </div>
                </div>

                {/* Biteship area dropdown */}
                {showAreaDropdown && areaResults.length > 0 && (
                  <div className="rounded-lg border border-[#E5DDD5] bg-white shadow-md overflow-hidden">
                    <p className="border-b border-[#E5DDD5] px-3 py-2 text-[10px] font-semibold tracking-wider text-[#8E8380] uppercase">
                      Pilih area tujuan
                    </p>
                    <div className="max-h-40 overflow-y-auto">
                      {areaResults.slice(0, 6).map((area) => (
                        <button
                          key={area.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedArea(area);
                            setCity(area.name);
                            if (area.postal_code) setPostalCode(String(area.postal_code));
                            setShowAreaDropdown(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs transition hover:bg-[#FAF8F5] ${selectedArea?.id === area.id ? 'bg-[#F4EFEB] font-semibold' : ''}`}
                        >
                          <span>{area.name}</span>
                          {area.postal_code && <span className="text-[10px] text-[#8E8380]">{area.postal_code}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Area Badge */}
                {selectedArea && (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Icon name="check_circle" size={16} className="shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-950">
                          Area Pengiriman: {selectedArea.name}
                        </p>
                        {selectedArea.postal_code && (
                          <p className="text-[10px] text-emerald-700">Kode Pos: {selectedArea.postal_code}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArea(null);
                        setShowAreaDropdown(true);
                      }}
                      className="shrink-0 text-[11px] font-semibold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
                    >
                      Ubah
                    </button>
                  </div>
                )}

                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nomor HP / WhatsApp" className="w-full rounded-lg border border-[#D0C5BD] bg-white px-4 py-3 text-sm text-[#141312] placeholder:text-[#A89E99] focus:border-[#141312] focus:outline-none" />

                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#554C48]">
                  <input type="checkbox" checked={saveInfo} onChange={(e) => setSaveInfo(e.target.checked)} className="h-3.5 w-3.5 rounded accent-[#141312]" />
                  Simpan informasi ini untuk lain kali
                </label>
              </div>
            </section>

            {/* 3. Shipping Method */}
            <section>
              <h2 className="mb-4 text-sm font-semibold tracking-[0.12em] text-[#141312] uppercase">
                Metode Pengiriman
              </h2>

              {!addressComplete ? (
                <div className="rounded-lg border border-[#E5DDD5] bg-[#FAF8F5] px-4 py-4 text-sm text-[#8E8380]">
                  Masukkan alamat pengiriman untuk melihat pilihan kurir.
                </div>
              ) : isLoadingRates ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-[#E5DDD5] bg-[#FAF8F5] px-4 py-4 text-sm text-[#8E8380]">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#D0C5BD] border-t-[#141312]" />
                  Menghitung tarif Biteship...
                </div>
              ) : shippingError ? (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">{shippingError}</div>
              ) : shippingRates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#D0C5BD] bg-[#FAF8F5] px-4 py-4 text-sm text-[#8E8380]">
                  Tidak ada kurir tersedia untuk lokasi ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {shippingNotice && (
                    <div className="mb-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                      {shippingNotice}
                    </div>
                  )}
                  {shippingRates.map((rate, idx) => {
                    const isSelected =
                      selectedRate?.courier_code === rate.courier_code &&
                      selectedRate?.courier_service_code === rate.courier_service_code;
                    return (
                      <label
                        key={`${rate.courier_code}-${rate.courier_service_code}-${idx}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3.5 transition ${isSelected ? 'border-[#141312] bg-white' : 'border-[#D0C5BD] bg-white hover:border-[#B5AAA2]'}`}
                      >
                        <input type="radio" name="shipping_rate" checked={isSelected} onChange={() => setSelectedRate(rate)} className="accent-[#141312]" />
                        <div className="flex flex-1 items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-[#141312]">
                              {rate.courier_name} — {rate.courier_service_name}
                            </p>
                            <p className="text-[11px] text-[#7C726E]">
                              Estimasi {rate.duration || '2-4 hari kerja'}
                              {rate.available_for_cash_on_delivery && (
                                <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">COD</span>
                              )}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-[#141312] whitespace-nowrap">{formatIDR(rate.price)}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 4. Payment Section (Embedded & Luxury) */}
            <section id="section-payment" className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold tracking-[0.12em] text-[#141312] uppercase">
                  4. Metode Pembayaran
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-700">
                  <Icon name="lock" size={11} />
                  Semua transaksi terenkripsi &amp; aman langsung di halaman ini.
                </p>
              </div>

              {/* Payment Method Selector Cards */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {PAYMENT_METHODS.map((m) => {
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(m.id);
                        if (m.id !== 'midtrans') {
                          setSnapToken(null);
                          setEmbeddedOrderNumber(null);
                        }
                      }}
                      className={`relative flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-[#141312] bg-white ring-2 ring-[#141312] shadow-sm'
                          : 'border-[#D0C5BD] bg-[#FAF8F5] hover:border-[#141312]/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name={m.icon} size={15} className="text-[#141312]" />
                          <span className="text-xs font-bold text-[#141312]">{m.label}</span>
                        </div>
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#141312] text-white">
                            <Icon name="check" size={10} />
                          </span>
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-[#7C726E] line-clamp-2">{m.desc}</span>
                      {m.badge && (
                        <span className="mt-2 inline-block rounded bg-[#141312] px-1.5 py-0.5 text-[8px] font-bold text-[#FAF8F5] uppercase tracking-wider">
                          {m.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* DYNAMIC CONTENT FOR CHOSEN PAYMENT */}

              {/* OPTION 1: MIDTRANS EMBEDDED */}
              {paymentMethod === 'midtrans' && (
                <div className="rounded-2xl border border-[#D0C5BD] bg-white p-4 shadow-2xs sm:p-5">
                  {!snapToken ? (
                    <div className="space-y-4">
                      <div className="border-b border-[#F0EAE3] pb-3">
                        <h3 className="text-xs font-bold tracking-wider text-[#141312] uppercase">
                          Pilih Metode Pembayaran
                        </h3>
                        <p className="mt-0.5 text-[11px] text-[#7C726E]">
                          Klik salah satu di bawah, lalu tekan &ldquo;Bayar Sekarang&rdquo;. Pembayaran tampil langsung di halaman ini.
                        </p>
                      </div>

                      {/* Sub-method selector — clickable */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {MIDTRANS_SUB_METHODS.map((sub) => {
                          const isSubSelected = midtransSubMethod === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setMidtransSubMethod(sub.id)}
                              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                                isSubSelected
                                  ? 'border-[#141312] bg-white ring-2 ring-[#141312]'
                                  : 'border-[#E5DDD5] bg-[#FAF8F5] hover:border-[#141312]/50 hover:bg-white'
                              }`}
                            >
                              <div className="flex w-full items-center justify-between">
                                <Icon name={sub.icon} size={16} className={isSubSelected ? 'text-[#141312]' : 'text-[#8E8380]'} />
                                {isSubSelected && (
                                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#141312] text-white">
                                    <Icon name="check" size={9} />
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] font-semibold leading-tight ${isSubSelected ? 'text-[#141312]' : 'text-[#554C48]'}`}>{sub.label}</p>
                              <p className="text-[9px] text-[#8E8380]">{sub.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* The Active Embedded Midtrans Container */
                    <div id="section-payment-embed" className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[#F0EAE3] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h3 className="text-xs font-bold tracking-wider text-[#141312] uppercase">
                            Selesaikan Pembayaran
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] font-semibold text-[#685E5A]">
                            #{embeddedOrderNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSnapToken(null);
                              setEmbeddedOrderNumber(null);
                              try { sessionStorage.removeItem('sevaya_checkout_pending'); } catch { /* ignore */ }
                            }}
                            className="text-[11px] text-[#8E8380] hover:text-[#141312] underline"
                          >
                            Batalkan
                          </button>
                        </div>
                      </div>

                      {/* Embed Container where Midtrans iframe is injected */}
                      <div className="overflow-hidden rounded-xl border border-[#E5DDD5] bg-[#FAF8F5] p-1">
                        <div
                          id="snap-embed-container"
                          className="min-h-[540px] w-full rounded-lg"
                        />
                      </div>
                      <p className="text-center text-[10px] text-[#8E8380]">
                        Setelah pembayaran dilakukan di atas, pesanan Anda otomatis terverifikasi tanpa perlu konfirmasi manual.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* OPTION 2: TRANSFER BANK MANUAL */}
              {paymentMethod === 'transfer' && (
                <div className="rounded-2xl border border-[#D0C5BD] bg-white p-5 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#F0EAE3] pb-3">
                    <Icon name="payments" size={18} className="text-[#141312]" />
                    <h3 className="text-xs font-bold tracking-wider text-[#141312] uppercase">
                      Rekening Pembayaran Resmi Sevaya
                    </h3>
                  </div>
                  <p className="text-xs text-[#7C726E]">
                    Silakan transfer tepat sebesar <strong className="text-[#141312]">{formatIDR(displayTotal)}</strong> ke salah satu rekening resmi berikut:
                  </p>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {[
                      { bank: 'BCA', no: '8720998122', display: '8720-9981-22', name: 'SEVAYA STUDIO INDONESIA' },
                      { bank: 'Mandiri', no: '137002918821', display: '1370-0291-8821', name: 'SEVAYA STUDIO INDONESIA' },
                      { bank: 'BSI (Syariah)', no: '7190281901', display: '7190-2819-01', name: 'SEVAYA STUDIO INDONESIA' },
                    ].map((b) => (
                      <div key={b.bank} className="rounded-xl border border-[#E5DDD5] bg-[#FAF8F5] p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-wider text-[#8E8380] uppercase">
                            Bank {b.bank}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyBankToClipboard(b.no, b.bank)}
                            className="rounded border border-[#D0C5BD] bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#554C48] hover:border-[#141312]"
                          >
                            {copiedBank === b.bank ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                        <p className="font-mono text-xs font-bold text-[#141312]">{b.display}</p>
                        <p className="text-[9px] text-[#8E8380]">a.n. {b.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OPTION 3: COD */}
              {paymentMethod === 'cod' && (
                <div className="rounded-2xl border border-[#D0C5BD] bg-white p-5 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon name="local_shipping" size={18} className="text-[#141312]" />
                    <h3 className="text-xs font-bold tracking-wider text-[#141312] uppercase">
                      Bayar Tunai di Tempat (COD)
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-[#7C726E]">
                    Siapkan uang pas sebesar <strong className="text-[#141312]">{formatIDR(displayTotal)}</strong> saat kurir Biteship menyerahkan paket pesanan di alamat tujuan Anda.
                  </p>
                </div>
              )}
            </section>


            {/* CTA — desktop (bottom of form, after payment method) */}
            <div className="hidden lg:block space-y-3">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {submitError}
                </div>
              )}
              <button
                type="button"
                onClick={
                  snapToken
                    ? () => {
                        const el = document.getElementById('section-payment-embed');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    : handleSubmitOrder
                }
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-[#141312] py-4 text-sm font-medium tracking-[0.1em] text-white uppercase transition hover:bg-[#322D29] disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Memproses Pesanan...'
                  : snapToken
                    ? 'Lanjutkan Pembayaran'
                    : 'Bayar Sekarang'}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-[#8E8380]">
                <Icon name="lock" size={11} />
                Pembayaran aman &amp; terenkripsi
              </p>
            </div>

            {/* CTA — mobile */}
            <div className="lg:hidden space-y-3">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {submitError}
                </div>
              )}
              {/* CTA — mobile */}
              <button
                type="button"
                onClick={
                  snapToken
                    ? () => {
                        const el = document.getElementById('section-payment-embed');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    : handleSubmitOrder
                }
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-[#141312] py-4 text-sm font-medium tracking-[0.1em] text-white uppercase transition hover:bg-[#322D29] disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Memproses Pesanan...'
                  : snapToken
                    ? 'Lanjutkan Pembayaran'
                    : 'Bayar Sekarang'}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-[#8E8380]">
                <Icon name="lock" size={11} />
                Pembayaran aman &amp; terenkripsi
              </p>
            </div>
            </fieldset>
          </div>
        </div>
      </main>
    </div>
  );
}
