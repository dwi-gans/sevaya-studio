'use client';

import React, { useRef, useMemo } from 'react';

export interface ShippingLabelOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  destination_area?: string;
  items: string; // JSON string
  courier_name?: string;
  courier_service?: string;
  courier_duration?: string;
  tracking_number?: string;
  payment_method?: string;
  subtotal?: number;
  grand_total?: number;
  created_at: string;
}

interface ShippingLabelModalProps {
  order: ShippingLabelOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

// Generate realistic crisp barcode stripes from a string
function BarcodeSVG({ value }: { value: string }) {
  const bars = useMemo(() => {
    const str = (value || 'SEVAYA').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const pattern: number[] = [];
    // Start guard
    pattern.push(2, 1, 1, 2);
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      pattern.push((code % 3) + 1);
      pattern.push(((code >> 2) % 2) + 1);
      pattern.push(((code >> 4) % 3) + 1);
      pattern.push(((code * 7) % 2) + 1);
    }
    // Stop guard
    pattern.push(2, 1, 2, 1, 2);
    return pattern;
  }, [value]);

  let currentX = 10;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        className="w-full max-w-[280px] h-12"
        viewBox="0 0 300 48"
        preserveAspectRatio="none"
      >
        {bars.map((w, idx) => {
          const isBlack = idx % 2 === 0;
          const rect = isBlack ? (
            <rect
              key={idx}
              x={currentX}
              y={0}
              width={w * 1.6}
              height={48}
              fill="#000000"
            />
          ) : null;
          currentX += w * 1.6;
          return rect;
        })}
      </svg>
      <span className="font-mono text-[11px] font-bold tracking-widest text-black mt-1">
        {value}
      </span>
    </div>
  );
}

export function ShippingLabelModal({ order, isOpen, onClose }: ShippingLabelModalProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  // Parse items safely
  let itemsList: {
    productTitle?: string;
    title?: string;
    name?: string;
    color?: string;
    size?: string;
    qty?: number;
    quantity?: number;
    price?: number;
  }[] = [];

  try {
    itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
  } catch {
    itemsList = [];
  }

  const totalQuantity = itemsList.reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
  const estWeight = Math.max(1, Math.round(totalQuantity * 0.5 * 10) / 10);

  const barcodeValue = order.tracking_number?.trim() || order.order_number;
  const isManualShipping = !order.tracking_number;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID');

  return (
    <>
      {/* ─── Global Print Styles ────────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #sevaya-shipping-label,
          #sevaya-shipping-label * {
            visibility: visible !important;
          }
          #sevaya-shipping-label {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100mm !important;
            max-width: 100mm !important;
            min-height: 145mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            background: #fff !important;
            color: #000 !important;
            font-size: 11px !important;
            z-index: 9999999 !important;
          }
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
        }
      `}</style>

      {/* ─── Screen Modal Overlay ────────────────────────────────────────── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-xs print:p-0 print:bg-white print:fixed">
        <div className="relative flex max-h-[95vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl border border-black/15 overflow-hidden print:max-h-none print:w-auto print:max-w-none print:rounded-none print:border-none print:shadow-none">
          
          {/* Modal Top Bar (Screen Only) */}
          <div className="flex items-center justify-between border-b border-black/15 bg-white px-5 py-3.5 print:hidden">
            <div>
              <h3 className="font-headline text-sm sm:text-base font-bold text-black flex items-center gap-2">
                <span>🖨️</span> Label Pengiriman (Thermal 10×15 cm)
              </h3>
              <p className="text-[11px] text-black/60">
                Format standar thermal ekspedisi A6 / 100×150 mm siap cetak.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition hover:bg-black/85 active:scale-95 cursor-pointer shadow-sm"
              >
                <span>🖨️</span> Cetak Sekarang
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 transition hover:bg-black/5 hover:text-black"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Banner Informasi Skenario Pengiriman (Screen Only) */}
          <div className="border-b border-black/10 bg-[#FAF9F6] px-5 py-2.5 text-[11px] text-black/80 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black">
                {isManualShipping ? '📦 Mode: Kirim Sendiri / Drop Off' : '🚚 Mode: Pick Up Kurir (Biteship)'}
              </span>
              <span className="text-black/40">•</span>
              <span className="text-black/60">
                {isManualShipping
                  ? 'Label ini memuat alamat & produk lengkap. No. resi kurir bisa Anda input manual setelah drop off.'
                  : `Resi otomatis terhubung: ${order.tracking_number}`}
              </span>
            </div>
          </div>

          {/* Printable Label Area */}
          <div className="overflow-y-auto p-4 sm:p-6 bg-neutral-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
            
            {/* The 100mm x 150mm Thermal Label Canvas */}
            <div
              id="sevaya-shipping-label"
              ref={labelRef}
              className="w-full max-w-[380px] bg-white border-2 border-black p-3.5 text-black font-sans shadow-md print:shadow-none print:border-2 print:border-black print:max-w-none print:w-[100mm]"
              style={{ minHeight: '520px' }}
            >
              {/* Header: Logo, Store & Service */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                <div>
                  <h1 className="font-serif text-lg font-extrabold tracking-widest uppercase">
                    SEVAYA
                  </h1>
                  <p className="text-[9px] uppercase tracking-wider text-black font-medium">
                    Modern Modestwear Studio
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-black text-white px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-xs">
                    {order.courier_name || 'REGULER'}
                  </div>
                  <p className="text-[9px] text-black/70 font-mono mt-0.5">
                    {formattedDate}
                  </p>
                </div>
              </div>

              {/* Barcode & Waybill Section */}
              <div className="py-2.5 border-b-2 border-black text-center bg-black/2 print:bg-transparent">
                <BarcodeSVG value={barcodeValue} />
                <div className="flex items-center justify-between px-2 pt-1 text-[9px] text-black/70">
                  <span>Ref: #{order.order_number}</span>
                  <span>Berat: {estWeight} kg</span>
                  <span>Qty: {totalQuantity} pcs</span>
                </div>
              </div>

              {/* Address Section: Recipient & Sender */}
              <div className="grid grid-cols-1 divide-y-2 divide-black border-b-2 border-black">
                
                {/* Kepada (Penerima) */}
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-2xs">
                      PENERIMA (TO)
                    </span>
                    <span className="font-bold text-xs">{order.customer_phone}</span>
                  </div>
                  <p className="font-extrabold text-sm leading-tight text-black pt-0.5">
                    {order.customer_name}
                  </p>
                  <p className="text-[11px] leading-snug text-black">
                    {order.customer_address}
                  </p>
                  {order.destination_area && (
                    <p className="text-[10px] font-semibold text-black/80 pt-0.5">
                      📍 {order.destination_area}
                    </p>
                  )}
                </div>

                {/* Dari (Pengirim) */}
                <div className="p-2 space-y-0.5 bg-neutral-50/50 print:bg-transparent text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-black/80">
                      PENGIRIM (FROM):
                    </span>
                    <span className="font-bold">WA: 0851-9099-3087</span>
                  </div>
                  <p className="font-bold text-[11px] text-black">
                    SEVAYA Studio (E-Commerce Fulfillment)
                  </p>
                  <p className="text-[10px] text-black/80 leading-tight">
                    Jl. Kebon Jeruk No. 10, Kebon Jeruk, Jakarta Barat 11450
                  </p>
                </div>
              </div>

              {/* Ekspedisi & Tracking Notes */}
              <div className="p-2 border-b-2 border-black text-xs flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-black/70 uppercase block">Ekspedisi:</span>
                  <span className="font-bold uppercase text-[11px]">
                    {order.courier_name || 'Kurir Reguler'} {order.courier_service ? `(${order.courier_service})` : ''}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-black/70 uppercase block">Pembayaran:</span>
                  <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 bg-black text-white rounded-2xs">
                    NON-COD (LUNAS)
                  </span>
                </div>
              </div>

              {/* Packing Slip / Daftar Produk */}
              <div className="p-2 border-b-2 border-black space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-black">
                    RINCIAN ISI PAKET (PACKING SLIP)
                  </span>
                  <span className="text-[9px] text-black/60 font-mono">
                    Total: {totalQuantity} pcs
                  </span>
                </div>
                <div className="divide-y divide-black/20 text-[10px]">
                  {itemsList.map((item, idx) => (
                    <div key={idx} className="py-1 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-black leading-tight truncate">
                          {item.productTitle || item.title || item.name || 'Produk Modestwear'}
                        </p>
                        <p className="text-[9px] text-black/70">
                          {item.color ? `Warna: ${item.color}` : ''}
                          {item.size ? ` • Size: ${item.size}` : ''}
                        </p>
                      </div>
                      <span className="font-bold font-mono text-[11px] shrink-0">
                        ×{item.qty || item.quantity || 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-2 text-center text-[8px] text-black/70 leading-tight">
                <p className="font-bold uppercase tracking-wider text-black">
                  FRAGILE • JAGA KEBERSIHAN PAKET
                </p>
                <p className="mt-0.5">
                  Mohon rekam video unboxing saat paket pertama kali diterima. Terima kasih telah memilih SEVAYA.
                </p>
              </div>

            </div>
          </div>

          {/* Bottom Action Footer (Screen Only) */}
          <div className="flex items-center justify-between border-t border-black/15 bg-white px-5 py-3 print:hidden">
            <span className="text-xs text-black/60">
              * Kompatibel dengan printer thermal Bluetooth/USB maupun printer kertas standar A4/A6.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/20 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-black/5"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-full bg-black px-5 py-1.5 text-xs font-bold text-white transition hover:bg-black/85"
              >
                🖨️ Cetak Label
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
