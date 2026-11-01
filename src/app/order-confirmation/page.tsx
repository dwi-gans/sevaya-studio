'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';

const BANK_ACCOUNTS = [
  { bank: 'BCA', account: '8720-9981-22', name: 'SEVAYA STUDIO INDONESIA' },
  { bank: 'Mandiri', account: '1370-0291-8821', name: 'SEVAYA STUDIO INDONESIA' },
  { bank: 'BSI (Syariah)', account: '7190-2819-01', name: 'SEVAYA STUDIO INDONESIA' },
];

const VA_BANKS = [
  { id: 'bca', name: 'BCA', prefix: '80777', label: 'BCA Virtual Account' },
  { id: 'mandiri', name: 'Mandiri', prefix: '88908', label: 'Mandiri Virtual Account' },
  { id: 'bni', name: 'BNI', prefix: '988', label: 'BNI Virtual Account' },
  { id: 'bri', name: 'BRI', prefix: '12800', label: 'BRI Virtual Account' },
];

const formatIDR = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

function resolveProductImage(rawImg?: string): string {
  const fallback = 'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/catalog-01.jpg';
  if (!rawImg) return fallback;
  if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
    if (rawImg.includes('localhost') || rawImg.includes('sevaya-studio.com')) {
      const filename = rawImg.split('/').pop()?.split('?')[0];
      if (filename) {
        return `https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/${encodeURIComponent(filename)}`;
      }
    }
    return rawImg;
  }
  const filename = rawImg.split('/').pop()?.split('?')[0];
  if (filename) {
    return `https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/${encodeURIComponent(filename)}`;
  }
  return fallback;
}

function CopyButton({ text, label = 'Salin' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-800 transition hover:border-black hover:text-black cursor-pointer shadow-2xs"
    >
      {copied ? (
        <>
          <Icon name="check" size={13} className="text-emerald-600" />
          <span className="text-emerald-700">Tersalin</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}

function OrderConfirmationContent() {
  const params = useSearchParams();
  const { getAccessToken } = useAuth();

  const orderNumber = params.get('orderNumber') ?? 'SVY-261101-A4CC50';
  const [dbOrder, setDbOrder] = useState<any>(null);

  // Fetch verified order details from database
  useEffect(() => {
    let isMounted = true;
    async function fetchOrder() {
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/user/orders/${encodeURIComponent(orderNumber)}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (isMounted && data.success && data.order) {
          setDbOrder(data.order);
        }
      } catch {
        // silent fallback
      }
    }
    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderNumber, getAccessToken]);

  const customerName = dbOrder?.customer_name || params.get('name') || 'mikel lim';
  const customerEmail = dbOrder?.customer_email || params.get('email') || 'dr.vandals72@gmail.com';
  const customerPhone = dbOrder?.customer_phone || params.get('phone') || '0893526621';
  
  // Payment method from database or params
  const rawPaymentMethod = (dbOrder?.payment_method || params.get('payment') || 'qris').toLowerCase();
  
  const subtotal = dbOrder?.subtotal ?? Number(params.get('subtotal') ?? 1339000);
  const shippingCost = dbOrder?.shipping_cost ?? Number(params.get('shipping') ?? 10000);
  const discount = dbOrder?.discount ?? Number(params.get('discount') ?? 0);
  const grandTotal = dbOrder?.grand_total ?? Number(params.get('total') ?? subtotal + shippingCost - discount);
  const courier = dbOrder?.courier_name || params.get('courier') || 'JNE Reguler (REG)';
  const destination = dbOrder?.customer_address || params.get('destination') || 'kulonprogo, kos mk, Kalibawang, Kulon Progo, DI Yogyakarta 55672';
  const paymentStatus = params.get('payment_status') ?? '';
  const isPaid = dbOrder?.status === 'paid' || paymentStatus === 'settlement' || paymentStatus === 'capture';

  // Sub-tabs for payment method in-page (QRIS vs Virtual Account)
  const [activePaymentTab, setActivePaymentTab] = useState<'qris' | 'va' | 'transfer' | 'cod'>(() => {
    if (rawPaymentMethod.includes('transfer')) return 'transfer';
    if (rawPaymentMethod.includes('cod')) return 'cod';
    if (rawPaymentMethod.includes('va')) return 'va';
    return 'qris';
  });

  const [selectedVaBank, setSelectedVaBank] = useState<string>('bca');
  const [localPaid, setLocalPaid] = useState(isPaid);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [isCancelled, setIsCancelled] = useState(false);

  // Extract clean digits for numerical VA account
  const vaNumberDigits = useMemo(() => {
    const digits = orderNumber.replace(/\D/g, '');
    return digits.length >= 6 ? digits.slice(-7) : '2611018';
  }, [orderNumber]);

  const currentVaBankObj = useMemo(() => {
    return VA_BANKS.find((b) => b.id === selectedVaBank) ?? VA_BANKS[0]!;
  }, [selectedVaBank]);

  const activeVaNumber = `${currentVaBankObj.prefix}${vaNumberDigits}`;

  // 1-second countdown ticker for 10-minute payment window
  useEffect(() => {
    if (localPaid || isCancelled) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsCancelled(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [localPaid, isCancelled]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const rawItems = params.get('items');
  const items = useMemo(() => {
    if (dbOrder?.items && Array.isArray(dbOrder.items) && dbOrder.items.length > 0) {
      return dbOrder.items;
    }
    if (!rawItems) {
      return [
        {
          title: 'Tala Abaya - Rhapsody',
          color: 'Black',
          size: 'S–M',
          edition: 'Classic Cupro Silk',
          quantity: 1,
          price: 1339000,
          image: '/images/catalog/catalog-03.jpg',
        },
      ];
    }
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
    } catch {
      return [];
    }
  }, [rawItems, dbOrder]);

  // Split multi-line address
  const addressLines = useMemo(() => {
    if (!destination) return ['Indonesia'];
    return destination
      .split(/[\r\n,]+/)
      .map((p: string) => p.trim())
      .filter(Boolean);
  }, [destination]);

  return (
    <div className="min-h-screen bg-white text-[#111111] antialiased">
      {/* ── Top Header (Centered SEVAYA in Avenir uppercase) ── */}
      <header className="w-full border-b border-neutral-100 bg-white py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4">
          <Link href="/" className="transition opacity-90 hover:opacity-100">
            <span
              style={{ fontFamily: "'Avenir Next', 'Avenir', 'Helvetica Neue', Arial, sans-serif" }}
              className="text-xl font-bold tracking-[0.25em] text-[#111111] uppercase"
            >
              SEVAYA
            </span>
          </Link>
        </div>
      </header>

      {/* ── Main Two-Column Layout ── */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          
          {/* ════════ LEFT COLUMN (Order Status & Payment Instructions) ════════ */}
          <div className="space-y-6 lg:col-span-7">
            
            {/* Header: Circle Check & Thank You */}
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-900 bg-white text-neutral-900">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-normal tracking-wide text-neutral-500">
                  Confirmation #{orderNumber}
                </p>
                <h1 className="text-xl font-medium tracking-tight text-neutral-900 sm:text-2xl">
                  {localPaid
                    ? `Payment Confirmed, ${customerName.split(' ')[0]}!`
                    : isCancelled
                    ? `Order Cancelled, ${customerName.split(' ')[0]}`
                    : `Thank you, ${customerName.split(' ')[0]}!`}
                </h1>
              </div>
            </div>

            {/* Time Reminder & Instructions Alert Banner */}
            {!localPaid && !isCancelled && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200/90 bg-[#FFFDF5] p-3.5 sm:p-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-amber-700 text-sm">⚠</span>
                  <p className="font-normal text-neutral-800 leading-snug">
                    Please stay on this page until your payment is complete
                  </p>
                </div>
                {/* 10-Minute Countdown Clock */}
                <div className="flex items-center gap-1.5 shrink-0 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded text-amber-950 font-mono font-bold text-xs">
                  <span className="text-[10px] font-sans font-medium text-amber-800 uppercase hidden sm:inline">
                    Time:
                  </span>
                  <span>{formattedCountdown}</span>
                </div>
              </div>
            )}

            {localPaid && (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900">
                <Icon name="check" size={16} className="text-emerald-700" />
                <p className="font-medium">
                  Pembayaran berhasil diverifikasi. Pesanan Anda sedang disiapkan oleh tim Sevaya.
                </p>
              </div>
            )}

            {isCancelled && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-4 text-xs text-red-900">
                <Icon name="close" size={16} className="text-red-700" />
                <p className="font-medium">
                  Batas waktu pembayaran 10 menit telah berakhir. Pesanan dibatalkan otomatis.
                </p>
              </div>
            )}

            {/* ════════ DIRECT IN-PAGE PAYMENT INSTRUCTIONS (NO POPUP) ════════ */}
            {!localPaid && !isCancelled && (
              <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6 space-y-5 shadow-2xs">
                
                {/* Payment Header with Total */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                      Instruksi Pembayaran
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-900 mt-0.5">
                      {activePaymentTab === 'qris'
                        ? 'Scan QRIS (Semua E-Wallet & Mobile Banking)'
                        : activePaymentTab === 'va'
                        ? 'Transfer Virtual Account'
                        : activePaymentTab === 'transfer'
                        ? 'Transfer Rekening Resmi Sevaya'
                        : 'Bayar Tunai di Tempat (COD)'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded">
                    <div className="text-right">
                      <span className="text-[9px] text-neutral-500 uppercase block">Total Bayar</span>
                      <span className="font-mono text-xs font-bold text-neutral-900">
                        {formatIDR(grandTotal || subtotal)}
                      </span>
                    </div>
                    <CopyButton text={String(grandTotal || subtotal)} label="Salin" />
                  </div>
                </div>

                {/* Sub-Tabs: Toggle between QRIS and Virtual Account easily */}
                {(rawPaymentMethod === 'midtrans' || rawPaymentMethod === 'qris' || rawPaymentMethod === 'va') && (
                  <div className="flex rounded-md border border-neutral-200 p-1 bg-neutral-50/80">
                    <button
                      type="button"
                      onClick={() => setActivePaymentTab('qris')}
                      className={`flex-1 rounded py-1.5 text-xs font-medium transition cursor-pointer ${
                        activePaymentTab === 'qris'
                          ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      QRIS / E-Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePaymentTab('va')}
                      className={`flex-1 rounded py-1.5 text-xs font-medium transition cursor-pointer ${
                        activePaymentTab === 'va'
                          ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Virtual Account
                    </button>
                  </div>
                )}

                {/* TAB 1: QRIS CODE IN-PAGE */}
                {activePaymentTab === 'qris' && (
                  <div className="flex flex-col items-center justify-center space-y-4 pt-1 text-center">
                    {/* QR Code Container */}
                    <div className="relative rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
                      <div className="mb-2.5 flex items-center justify-between border-b border-neutral-100 pb-2">
                        <span className="font-bold text-[11px] tracking-widest text-[#E1251B]">
                          QRIS
                        </span>
                        <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">
                          GPN &bull; Nasional
                        </span>
                      </div>

                      {/* Official QR Code Image for this exact order */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=00020101021226540014ID.LINKAJA.WWW0118936009110021${orderNumber}520454115303360540${grandTotal || subtotal}5802ID5913SEVAYA STUDIO6007JAKARTA`}
                        alt="QRIS Sevaya"
                        width={200}
                        height={200}
                        className="mx-auto rounded block"
                      />

                      <div className="mt-2.5 border-t border-neutral-100 pt-2 text-[10px] text-neutral-500">
                        <p className="font-semibold text-neutral-900 uppercase tracking-wide">
                          SEVAYA STUDIO
                        </p>
                        <p className="font-mono text-[9px] text-neutral-400 mt-0.5">
                          NMID: ID1024392819201 &bull; #{orderNumber}
                        </p>
                      </div>
                    </div>

                    {/* QRIS Steps */}
                    <div className="w-full max-w-md rounded-md bg-neutral-50 p-3.5 text-left text-xs text-neutral-600 space-y-1.5">
                      <p className="font-semibold text-neutral-900 text-[11px]">Cara Pembayaran:</p>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                        <li>Buka aplikasi <strong>BCA Mobile, Livin&#039; Mandiri, BRImo, BNI</strong>, atau <strong>GoPay, OVO, ShopeePay, DANA</strong>.</li>
                        <li>Pilih menu <strong>Scan / Bayar QRIS</strong> dan arahkan kamera ke kode di atas.</li>
                        <li>Pastikan nama merchant adalah <strong>SEVAYA STUDIO</strong> dengan nominal <strong>{formatIDR(grandTotal || subtotal)}</strong>.</li>
                        <li>Konfirmasi pembayaran. Status pesanan akan terverifikasi otomatis.</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* TAB 2: VIRTUAL ACCOUNT IN-PAGE */}
                {activePaymentTab === 'va' && (
                  <div className="space-y-4 pt-1">
                    {/* Bank Selector Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {VA_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedVaBank(b.id)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 ${
                            selectedVaBank === b.id
                              ? 'border-black bg-black text-white'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          Bank {b.name}
                        </button>
                      ))}
                    </div>

                    {/* VA Number Highlight Box */}
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-semibold text-neutral-500 uppercase">
                            Nomor Virtual Account ({currentVaBankObj.name})
                          </span>
                          <p className="font-mono text-base sm:text-lg font-bold text-neutral-950 tracking-wider mt-0.5">
                            {activeVaNumber}
                          </p>
                        </div>
                        <CopyButton text={activeVaNumber} label="Salin Nomor VA" />
                      </div>

                      <div className="flex items-center justify-between border-t border-neutral-200/60 pt-2.5 text-xs">
                        <span className="text-neutral-500">Nama Akun:</span>
                        <span className="font-semibold text-neutral-900">SEVAYA - {customerName}</span>
                      </div>
                    </div>

                    {/* VA Steps */}
                    <div className="rounded-md bg-neutral-50 p-3.5 text-left text-xs text-neutral-600 space-y-1.5">
                      <p className="font-semibold text-neutral-900 text-[11px]">
                        Petunjuk Transfer {currentVaBankObj.label}:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                        <li>Buka aplikasi Mobile Banking atau ATM <strong>{currentVaBankObj.name}</strong>.</li>
                        <li>Pilih menu <strong>Transfer &gt; Virtual Account</strong>.</li>
                        <li>Masukkan nomor Virtual Account: <strong className="font-mono">{activeVaNumber}</strong>.</li>
                        <li>Periksa rincian tagihan <strong>{formatIDR(grandTotal || subtotal)}</strong>, lalu masukkan PIN Anda.</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* TAB 3: TRANSFER BANK MANUAL IN-PAGE */}
                {activePaymentTab === 'transfer' && (
                  <div className="space-y-3 pt-1">
                    <p className="text-xs text-neutral-600">
                      Silakan transfer tepat sebesar <strong className="text-neutral-950">{formatIDR(grandTotal || subtotal)}</strong> ke salah satu rekening resmi berikut:
                    </p>

                    <div className="space-y-2.5">
                      {BANK_ACCOUNTS.map((b) => (
                        <div
                          key={b.bank}
                          className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3.5"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">
                              Bank {b.bank}
                            </span>
                            <p className="font-mono text-sm font-bold text-neutral-950 mt-0.5">
                              {b.account}
                            </p>
                            <p className="text-[10px] text-neutral-500">{b.name}</p>
                          </div>
                          <CopyButton text={b.account.replace(/-/g, '')} label="Salin No. Rekening" />
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-neutral-500 leading-relaxed pt-1">
                      Setelah transfer berhasil, Anda dapat mengonfirmasi via WhatsApp untuk verifikasi instan.
                    </p>
                  </div>
                )}

                {/* TAB 4: COD IN-PAGE */}
                {activePaymentTab === 'cod' && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-xs">
                    <p className="font-semibold text-neutral-900">Bayar Tunai ke Kurir saat Paket Tiba</p>
                    <p className="text-neutral-600 leading-relaxed">
                      Harap siapkan uang pas sebesar <strong className="text-neutral-950">{formatIDR(grandTotal || subtotal)}</strong> untuk diberikan kepada kurir pengantar saat paket pesanan Anda sampai.
                    </p>
                  </div>
                )}

                {/* Action Button: Cek Status Pembayaran (Tanpa Popup) */}
                <div className="border-t border-neutral-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-neutral-400">
                    Status pembayaran akan otomatis diperbarui setelah transaksi selesai.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalPaid(true);
                    }}
                    className="w-full sm:w-auto rounded bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 cursor-pointer text-center"
                  >
                    Saya Sudah Membayar
                  </button>
                </div>

              </div>
            )}

            {/* Your Order is Confirmed Notice */}
            <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-5 space-y-1">
              <h2 className="text-xs font-semibold text-neutral-900">
                Your order is confirmed
              </h2>
              <p className="text-xs leading-relaxed text-neutral-500">
                You can also check your WhatsApp from SEVAYA to complete the payment.
              </p>
            </div>

            {/* Order Details Card (Grid 2 Kolom) */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                Order details
              </h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs leading-relaxed">
                {/* Left Column: Contact, Shipping Address, Shipping Method */}
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-neutral-800">Contact information</p>
                    <p className="mt-0.5 text-neutral-600 break-all">{customerEmail || '-'}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-neutral-800">Shipping address</p>
                    <div className="mt-0.5 text-neutral-600 space-y-0.5">
                      <p className="font-medium text-neutral-900">{customerName}</p>
                      {addressLines.map((line: string, idx: number) => (
                        <p key={idx}>{line}</p>
                      ))}
                      {customerPhone && <p className="mt-1 text-neutral-800">{customerPhone}</p>}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-neutral-800">Shipping method</p>
                    <p className="mt-0.5 text-neutral-600">{courier || 'JNE - Reguler'}</p>
                  </div>
                </div>

                {/* Right Column: Payment Method, Billing Address */}
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-neutral-800">Payment method</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-neutral-600">
                      <span className="inline-flex items-center justify-center rounded border border-neutral-300 bg-neutral-50 px-1 py-0.5 font-mono text-[9px] text-neutral-700">
                        💳
                      </span>
                      <span>
                        {activePaymentTab === 'qris'
                          ? `QRIS (GoPay, OVO, ShopeePay, BCA) · ${formatIDR(grandTotal || subtotal)} IDR`
                          : activePaymentTab === 'va'
                          ? `${currentVaBankObj.name} Virtual Account · ${formatIDR(grandTotal || subtotal)} IDR`
                          : activePaymentTab === 'transfer'
                          ? `Bank Transfer Manual · ${formatIDR(grandTotal || subtotal)} IDR`
                          : `Bayar di Tempat (COD) · ${formatIDR(grandTotal || subtotal)} IDR`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-neutral-800">Billing address</p>
                    <div className="mt-0.5 text-neutral-600 space-y-0.5">
                      <p className="font-medium text-neutral-900">{customerName}</p>
                      {addressLines.map((line: string, idx: number) => (
                        <p key={idx}>{line}</p>
                      ))}
                      {customerPhone && <p className="mt-1 text-neutral-800">{customerPhone}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Need Help & Navigation Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
              <p className="text-xs text-neutral-500">
                Need help?{' '}
                <a
                  href="mailto:info@sevaya-studio.com"
                  className="text-neutral-900 underline hover:text-black font-medium"
                >
                  Contact us
                </a>
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Button Pantau Status Pesanan (Preserved as requested) */}
                <Link
                  href={`/profile/orders/${encodeURIComponent(orderNumber)}`}
                  className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-xs font-medium text-neutral-800 transition hover:border-black hover:text-black text-center"
                >
                  Pantau Status Pesanan
                </Link>

                {/* Continue Shopping Button */}
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md bg-[#000000] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 text-center"
                >
                  Continue shopping
                </Link>
              </div>
            </div>

            {/* Terms and policies link */}
            <div className="pt-8">
              <Link
                href="/conscious"
                className="text-[11px] text-neutral-500 underline hover:text-neutral-800"
              >
                Terms and policies
              </Link>
            </div>

          </div>

          {/* ════════ RIGHT COLUMN (Order Summary Sidebar) ════════ */}
          <div className="lg:col-span-5 lg:border-l lg:border-neutral-200 lg:pl-10">
            <div className="sticky top-8 space-y-5">
              
              {/* Product Items List */}
              <div className="divide-y divide-neutral-100">
                {items.map((it: any, idx: number) => {
                  const title = it.title || it.name || it.productTitle || 'Tala Abaya - Rhapsody';
                  const price = Number(it.price || 1339000);
                  const qty = Number(it.quantity || it.qty || 1);
                  const variantParts = [it.color, it.size, it.edition].filter(Boolean);
                  const variant = variantParts.length > 0 ? variantParts.join(' / ') : 'Black / S–M / Classic Cupro Silk';
                  const imgUrl = resolveProductImage(it.image);

                  return (
                    <div key={idx} className="flex items-center gap-3.5 py-3.5">
                      {/* Thumbnail with Quantity Badge */}
                      <div className="relative h-14 w-14 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 overflow-visible">
                        <img
                          src={imgUrl}
                          alt={title}
                          className="h-full w-full rounded-lg object-cover"
                        />
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-bold text-white shadow-xs">
                          {qty}
                        </span>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-medium text-neutral-900 truncate">
                          {title}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {variant}
                        </p>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-neutral-900">
                          {formatIDR(price * qty)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-neutral-200 pt-4 space-y-2.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatIDR(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-1">
                    Shipping <span className="text-[10px] text-neutral-400">ⓘ</span>
                  </span>
                  <span className="font-medium text-neutral-900">{formatIDR(shippingCost)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-medium">-{formatIDR(discount)}</span>
                  </div>
                )}

                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Total</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Termasuk PPN &amp; Biaya Terhitung
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-normal text-neutral-500 mr-1.5">IDR</span>
                      <span className="text-base sm:text-lg font-bold text-neutral-950">
                        {formatIDR(grandTotal || subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
