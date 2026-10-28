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
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
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
  const [shippingDropdownOpen, setShippingDropdownOpen] = useState(false);
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
        id: it.id,
        title: it.title,
        productTitle: it.title,
        edition: it.edition,
        color: it.color,
        size: it.size,
        qty: it.quantity,
        quantity: it.quantity,
        price: it.price,
        image: it.image,
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <p className="text-xs text-[#7C726E]">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  // ── Empty bag check: show polite empty view instead of injecting fake items ──
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black">
        <header className="sticky top-0 z-40 border-b border-black/15 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-black"
            >
              <Icon name="arrow_back" size={14} />
              <span className="hidden sm:inline">Toko</span>
            </Link>
            <Logo className="h-5 w-auto" />
            <Link
              href="/bag"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-black"
            >
              <Icon name="shopping_bag" size={14} />
              <span className="hidden sm:inline">Tas</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-black/15 bg-black/5 text-black">
            <Icon name="shopping_bag" size={28} />
          </div>
          <h1 className="font-sans text-xl font-medium text-black sm:text-2xl">Tas Belanja Anda Kosong</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#7C726E]">
            Belum ada busana di dalam tas belanja Anda. Silakan pilih busana modest abaya dari koleksi Sevaya untuk melanjutkan pemesanan.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-xs font-semibold tracking-wider text-white uppercase shadow-sm transition hover:bg-black/85"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/20 bg-white px-4 py-3 text-xs font-medium tracking-wider text-black uppercase transition hover:border-black"
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
      <div className="min-h-screen bg-white text-black">
        <header className="sticky top-0 z-40 border-b border-black/15 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/bag"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-black"
            >
              <Icon name="arrow_back" size={14} />
              <span className="hidden sm:inline">Tas Belanja</span>
            </Link>
            <Logo className="h-5 w-auto" />
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-black/15 bg-black/5 text-black">
            <Icon name="lock" size={28} />
          </div>
          <span className="font-label-sm text-[11px] font-bold tracking-[0.2em] text-[#8C827A] uppercase">
            Autentikasi Diperlukan
          </span>
          <h1 className="mt-2 font-headline-md text-2xl font-semibold text-black">
            Masuk untuk Melanjutkan Checkout
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#7C726E]">
            Untuk memastikan pesanan Anda tersimpan resmi dan dapat dilacak kapan saja di menu profil Anda, silakan masuk ke akun Sevaya terlebih dahulu.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3">
            <Link
              href="/login?redirect=/test-checkout"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-xs font-semibold tracking-wider text-white uppercase shadow-sm transition hover:bg-black/85"
            >
              <Icon name="person" size={16} />
              <span>Masuk ke Akun Anda</span>
            </Link>
            <Link
              href="/register?redirect=/test-checkout"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-black/20 bg-white text-xs font-medium tracking-wider text-black uppercase transition hover:border-black"
            >
              <Icon name="arrow_forward" size={16} />
              <span>Daftar Akun Baru</span>
            </Link>
            <Link
              href="/bag"
              className="mt-2 text-[11px] font-medium tracking-wider text-[#7C726E] underline underline-offset-4 hover:text-black"
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
    <div className="min-h-screen bg-white text-black">
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
      <header className="sticky top-0 z-40 border-b border-black/15 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-black"
          >
            <Icon name="arrow_back" size={14} />
            <span className="hidden sm:inline">Toko</span>
          </Link>

          <Logo className="h-5 w-auto" />

          <Link
            href="/bag"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-[#7C726E] uppercase transition hover:text-black"
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

              {/* Items List Responsive */}
              <div className="space-y-3 sm:space-y-4">
                {displayItems.map((item, idx) => (
                  <div key={`${item.id || item.title}-${item.color || ''}-${idx}`} className="flex items-center gap-3 sm:gap-4 border-b border-black/5 pb-3 last:border-b-0 last:pb-0">
                    <div className="relative shrink-0">
                      <div className="h-14 w-12 sm:h-16 sm:w-14 overflow-hidden rounded-none border border-black/15 bg-black/5">
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={56}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-none bg-black text-[9px] font-semibold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-medium text-black truncate">{item.title}</p>
                        <p className="mt-0.5 text-[10px] text-[#7C726E] truncate">
                          {[item.color, item.size].filter(Boolean).join(' / ')}
                        </p>
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold text-black whitespace-nowrap shrink-0">
                        {formatIDR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-black/15" />

              {/* Discount code */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Kode diskon"
                  className="flex-1 rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black placeholder:text-[#A89E99] focus:border-black focus:outline-none"
                />
                <button
                  type="button"
                  className="rounded-lg border border-black bg-white px-4 py-2.5 text-xs font-medium text-black transition hover:bg-black hover:text-white"
                >
                  Terapkan
                </button>
              </div>

              <hr className="border-black/15" />

              {/* Price breakdown */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#554C48]">Subtotal</span>
                  <span className="font-medium text-black">{formatIDR(displaySubtotal)}</span>
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
                    <span className="font-medium text-black">{formatIDR(giftFee)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#554C48]">Pengiriman</span>
                  <span className={`font-medium ${selectedRate ? 'text-black' : 'text-black/50 text-xs'}`}>
                    {selectedRate ? formatIDR(shippingCost) : 'Masukkan alamat pengiriman'}
                  </span>
                </div>
              </div>

              <hr className="border-black/15" />

              {/* Total */}
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-sm font-semibold text-black">Total</p>
                  <p className="text-[10px] text-[#7C726E]">Termasuk pajak yang berlaku</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] tracking-wider text-[#7C726E] uppercase">IDR</p>
                  <p className="text-xl font-semibold text-black">{formatIDR(displayTotal)}</p>
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
                <h2 className="text-[10px] font-semibold tracking-[0.18em] text-black/60 uppercase">
                  Kontak
                </h2>
              </div>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black placeholder:text-[#A89E99] focus:border-black focus:outline-none"
                />
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#554C48]">
                  <input
                    type="checkbox"
                    checked={emailNews}
                    onChange={(e) => setEmailNews(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-[#000000]"
                  />
                  Kirim penawaran dan berita via email
                </label>
              </div>
            </section>

            {/* 2. Delivery */}
            <section>
              <h2 className="mb-4 text-[10px] font-semibold tracking-[0.18em] text-black/60 uppercase">
                Pengiriman
              </h2>
              <div className="space-y-3">
                {/* Country */}
                <div className="relative">
                  <select
                    defaultValue="ID"
                    className="w-full appearance-none rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                  >
                    <option value="ID">Indonesia</option>
                  </select>
                  <Icon name="keyboard_arrow_down" size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-black/50" />
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nama depan" className="rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black placeholder:text-[#A89E99] focus:border-black focus:outline-none" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nama belakang" className="rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black placeholder:text-[#A89E99] focus:border-black focus:outline-none" />
                </div>

                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat" className="w-full rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black placeholder:text-[#A89E99] focus:border-black focus:outline-none" />
                <input type="text" value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="Apartemen, suite, dll. (opsional)" className="w-full rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black placeholder:text-[#A89E99] focus:border-black focus:outline-none" />
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kota / Kecamatan" className="w-full rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black placeholder:text-[#A89E99] focus:border-black focus:outline-none" />

                {/* Province + Postal */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full appearance-none rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black focus:border-black focus:outline-none">
                      {INDONESIA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <Icon name="keyboard_arrow_down" size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-black/50" />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="Kode Pos"
                      maxLength={5}
                      className="w-full rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black placeholder:text-[#A89E99] focus:border-black focus:outline-none"
                    />
                    {isSearchingArea && (
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-black/50">Mencari...</span>
                    )}
                  </div>
                </div>

                {/* Biteship area dropdown */}
                {showAreaDropdown && areaResults.length > 0 && (
                  <div className="rounded-lg border border-black/15 bg-white shadow-md overflow-hidden">
                    <p className="border-b border-black/15 px-3 py-2 text-[10px] font-semibold tracking-wider text-black/50 uppercase">
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
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs transition hover:bg-white ${selectedArea?.id === area.id ? 'bg-black/5 font-semibold' : ''}`}
                        >
                          <span>{area.name}</span>
                          {area.postal_code && <span className="text-[10px] text-black/50">{area.postal_code}</span>}
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

                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nomor HP / WhatsApp" className="w-full rounded-lg border border-black/20 bg-white px-3 py-2.5 text-xs text-black placeholder:text-[#A89E99] focus:border-black focus:outline-none" />

                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#554C48]">
                  <input type="checkbox" checked={saveInfo} onChange={(e) => setSaveInfo(e.target.checked)} className="h-3.5 w-3.5 rounded accent-[#000000]" />
                  Simpan informasi ini untuk lain kali
                </label>
              </div>
            </section>

            {/* 3. Shipping Method */}
            <section>
              <h2 className="mb-4 text-[10px] font-semibold tracking-[0.18em] text-black/60 uppercase">
                Metode Pengiriman
              </h2>

              {!addressComplete ? (
                <div className="rounded-lg border border-black/15 bg-white px-4 py-4 text-sm text-black/50">
                  Masukkan alamat pengiriman untuk melihat pilihan kurir.
                </div>
              ) : isLoadingRates ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-black/15 bg-white px-4 py-4 text-sm text-black/50">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-[#000000]" />
                  Menghitung tarif Biteship...
                </div>
              ) : shippingError ? (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">{shippingError}</div>
              ) : shippingRates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-black/20 bg-white px-4 py-4 text-sm text-black/50">
                  Tidak ada kurir tersedia untuk lokasi ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {shippingNotice && (
                    <div className="mb-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                      {shippingNotice}
                    </div>
                  )}
                  {/* Dropdown selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShippingDropdownOpen((v) => !v)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-black/20 bg-white px-4 py-3 text-left transition hover:border-black/50"
                    >
                      {selectedRate ? (
                        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-black truncate">
                              {selectedRate.courier_name} — {selectedRate.courier_service_name}
                            </p>
                            <p className="text-[10px] text-[#7C726E]">
                              Estimasi {selectedRate.duration || '2-4 hari kerja'}
                              {selectedRate.available_for_cash_on_delivery && (
                                <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">COD</span>
                              )}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] font-semibold text-black">{formatIDR(selectedRate.price)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-black/50">Pilih jasa pengiriman</span>
                      )}
                      <Icon
                        name="keyboard_arrow_down"
                        size={18}
                        className={`ml-1 shrink-0 text-black/50 transition-transform ${shippingDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {shippingDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-black/15 bg-white shadow-lg">
                        {shippingRates.map((rate, idx) => {
                          const isSel =
                            selectedRate?.courier_code === rate.courier_code &&
                            selectedRate?.courier_service_code === rate.courier_service_code;
                          return (
                            <button
                              key={`${rate.courier_code}-${rate.courier_service_code}-${idx}`}
                              type="button"
                              onClick={() => {
                                setSelectedRate(rate);
                                setShippingDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-black/5 ${isSel ? 'bg-black/5 font-medium' : ''}`}
                            >
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-black truncate">
                                  {rate.courier_name} — {rate.courier_service_name}
                                </p>
                                <p className="text-[10px] text-[#7C726E]">
                                  Estimasi {rate.duration || '2-4 hari kerja'}
                                  {rate.available_for_cash_on_delivery && (
                                    <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">COD</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-[11px] font-semibold text-black">{formatIDR(rate.price)}</span>
                                {isSel && <Icon name="check" size={12} className="text-black" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* 4. Payment Section — Single Responsive Dropdown */}
            <section id="section-payment" className="space-y-3">
              <div>
                <h2 className="text-[10px] font-semibold tracking-[0.18em] text-black/60 uppercase">
                  4. Metode Pembayaran
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-emerald-700">
                  <Icon name="lock" size={11} />
                  Semua transaksi terenkripsi &amp; aman langsung di halaman ini.
                </p>
              </div>

              {/* Dropdown Selector Metode Pembayaran */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPaymentDropdownOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-black/20 bg-white px-4 py-3 text-left transition hover:border-black/60"
                >
                  {(() => {
                    const current = PAYMENT_METHODS.find((m) => m.id === paymentMethod) ?? PAYMENT_METHODS[0]!;
                    return (
                      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name={current.icon} size={16} className="shrink-0 text-black" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-black truncate">{current.label}</span>
                              {current.badge && (
                                <span className="rounded bg-black px-1.5 py-0.2 text-[8px] font-semibold text-white uppercase tracking-wider">
                                  {current.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#7C726E] truncate">{current.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <Icon
                    name="keyboard_arrow_down"
                    size={18}
                    className={`shrink-0 text-black/50 transition-transform ${paymentDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Options */}
                {paymentDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-black/15 bg-white shadow-lg">
                    {PAYMENT_METHODS.map((m) => {
                      const isSel = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(m.id);
                            setPaymentDropdownOpen(false);
                            if (m.id !== 'midtrans') {
                              setSnapToken(null);
                              setEmbeddedOrderNumber(null);
                            }
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-black/5 ${
                            isSel ? 'bg-black/5 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon name={m.icon} size={16} className="shrink-0 text-black" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-black truncate">{m.label}</span>
                                {m.badge && (
                                  <span className="rounded bg-black px-1.5 py-0.2 text-[8px] font-semibold text-white uppercase tracking-wider">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#7C726E] truncate">{m.desc}</p>
                            </div>
                          </div>
                          {isSel && <Icon name="check" size={14} className="shrink-0 text-black" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* KONTEN METODE TERPILIH */}
              {/* Option 1: Bayar Otomatis (Midtrans) */}
              {paymentMethod === 'midtrans' && (
                <div className="rounded-lg border border-black/15 bg-black/[0.02] p-3.5 text-xs text-[#554C48]">
                  {!snapToken ? (
                    <div className="flex items-center gap-2">
                      <Icon name="verified_user" size={15} className="text-black shrink-0" />
                      <p className="text-[11px] leading-relaxed">
                        Mendukung <strong>QRIS (GoPay, OVO, BCA, Shopee)</strong>, <strong>Virtual Account</strong>, <strong>E-Wallet</strong>, dan <strong>Kartu Kredit</strong>. Layar pembayaran instan akan langsung terbuka saat menekan tombol &ldquo;Bayar Sekarang&rdquo;.
                      </p>
                    </div>
                  ) : (
                    /* Active Embedded Midtrans */
                    <div id="section-payment-embed" className="space-y-3">
                      <div className="flex items-center justify-between border-b border-black/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
                            Selesaikan Pembayaran #{embeddedOrderNumber}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSnapToken(null);
                            setEmbeddedOrderNumber(null);
                            try { sessionStorage.removeItem('sevaya_checkout_pending'); } catch { /* ignore */ }
                          }}
                          className="text-[11px] text-black/60 underline hover:text-black"
                        >
                          Batalkan
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-black/15 bg-white p-1">
                        <div id="snap-embed-container" className="min-h-[500px] w-full rounded" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Option 2: Transfer Bank Manual */}
              {paymentMethod === 'transfer' && (
                <div className="rounded-lg border border-black/15 bg-black/[0.02] p-3.5 text-xs text-[#554C48] space-y-3">
                  <p className="text-[11px] leading-relaxed">
                    Silakan transfer tepat sebesar <strong className="text-black">{formatIDR(displayTotal)}</strong> ke rekening resmi Sevaya:
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {[
                      { bank: 'BCA', no: '8720998122', display: '8720-9981-22', name: 'SEVAYA STUDIO INDONESIA' },
                      { bank: 'Mandiri', no: '137002918821', display: '1370-0291-8821', name: 'SEVAYA STUDIO INDONESIA' },
                      { bank: 'BSI (Syariah)', no: '7190281901', display: '7190-2819-01', name: 'SEVAYA STUDIO INDONESIA' },
                    ].map((b) => (
                      <div key={b.bank} className="rounded-md border border-black/15 bg-white p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-black/60 uppercase">Bank {b.bank}</span>
                          <button
                            type="button"
                            onClick={() => copyBankToClipboard(b.no, b.bank)}
                            className="rounded border border-black/20 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#554C48] hover:border-black"
                          >
                            {copiedBank === b.bank ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                        <p className="font-mono text-xs font-bold text-black">{b.display}</p>
                        <p className="text-[9px] text-black/50">a.n. {b.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Option 3: COD */}
              {paymentMethod === 'cod' && (
                <div className="rounded-lg border border-black/15 bg-black/[0.02] p-3.5 text-xs text-[#554C48]">
                  <p className="text-[11px] leading-relaxed">
                    Siapkan uang pas sebesar <strong className="text-black">{formatIDR(displayTotal)}</strong> saat kurir menyerahkan paket di alamat tujuan Anda.
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
                className="flex w-full items-center justify-center rounded-lg bg-black py-4 text-sm font-medium tracking-[0.1em] text-white uppercase transition hover:bg-[#322D29] disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Memproses Pesanan...'
                  : snapToken
                    ? 'Lanjutkan Pembayaran'
                    : 'Bayar Sekarang'}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-black/50">
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
                className="flex w-full items-center justify-center rounded-lg bg-black py-4 text-sm font-medium tracking-[0.1em] text-white uppercase transition hover:bg-[#322D29] disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Memproses Pesanan...'
                  : snapToken
                    ? 'Lanjutkan Pembayaran'
                    : 'Bayar Sekarang'}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-black/50">
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
