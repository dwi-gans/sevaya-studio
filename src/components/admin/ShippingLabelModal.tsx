'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';

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

// ═════════════════════════════════════════════════════════════════════════════
// 100% Compliant ISO/IEC 15417 Code 128 Barcode Generator
// Scannable by any barcode scanner gun (J&T/JNE/SiCepat), warehouse scanner, & mobile camera
// ═════════════════════════════════════════════════════════════════════════════
const CODE128_PATTERNS = [
  '11011001100','11001101100','11001100110','10010011000','10010001100',
  '10001001100','10011001000','10011000100','10001100100','11001001000',
  '11001000100','11000100100','10110011100','10011011100','10011001110',
  '10111001100','10011101100','10011100110','11001110010','11001011100',
  '11001001110','11011100100','11001110100','11101101110','11101001100',
  '11100101100','11100100110','11101100100','11100110100','11100110010',
  '11011011000','11011000110','11000110110','10100011000','10001011000',
  '10001000110','10110001000','10001101000','10001100010','11010001000',
  '11000101000','11000100010','10110111000','10110001110','10001101110',
  '10111011000','10111000110','10001110110','11101110110','11010001110',
  '11000101110','11011101000','11011100010','11011101110','11101011000',
  '11101000110','11100010110','11101101000','11101100010','11100011010',
  '11101111010','11001000010','11110001010','10100110000','10100001100',
  '10010110000','10010000110','10000101100','10000100110','10110010000',
  '10110000100','10011010000','10011000010','10000110100','10000110010',
  '11000010010','11001010000','11110111010','11000010100','10001111010',
  '10100111100','10010111100','10010011110','10111100100','10011110100',
  '10011110010','11110100100','11110010100','11110010010','11011011110',
  '11011110110','11110110110','10101111000','10100011110','10001011110',
  '10111101000','10111100010','11110101000','11110100010','10111011110',
  '10111101110','11101011110','11110101110',
  '11010000100', // 103: Start A
  '11010010000', // 104: Start B
  '11010011100', // 105: Start C
  '1100011101011' // 106: Stop (13 bits)
];

function generateCode128Bars(text: string) {
  const clean = (text || 'SEVAYA').trim();
  let sum = 104; // Start Code B
  let bits = '0000000000'; // 10 modules Quiet Zone
  bits += CODE128_PATTERNS[104];

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    if (code < 0 || code > 94) continue;
    sum += code * (i + 1);
    bits += CODE128_PATTERNS[code];
  }

  const checksum = sum % 103;
  bits += CODE128_PATTERNS[checksum];
  bits += CODE128_PATTERNS[106];
  bits += '0000000000'; // 10 modules Quiet Zone

  // Group consecutive '1' bits into single solid bars for optimal SVG rendering
  const bars: { x: number; width: number }[] = [];
  let i = 0;
  while (i < bits.length) {
    if (bits[i] === '1') {
      const start = i;
      while (i < bits.length && bits[i] === '1') i++;
      bars.push({ x: start, width: i - start });
    } else {
      i++;
    }
  }

  return { bars, totalWidth: bits.length };
}

function BarcodeSVG({ value }: { value: string }) {
  const { bars, totalWidth } = useMemo(() => generateCode128Bars(value), [value]);

  return (
    <div className="flex flex-col items-center justify-center px-1">
      <svg
        className="w-full max-w-[320px] h-13"
        viewBox={`0 0 ${totalWidth} 50`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={0}
            width={bar.width}
            height={50}
            fill="#000000"
          />
        ))}
      </svg>
      <span className="font-mono text-xs sm:text-[13px] font-extrabold tracking-[0.16em] text-black mt-1">
        {value}
      </span>
    </div>
  );
}

export function ShippingLabelModal({ order, isOpen, onClose }: ShippingLabelModalProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [shipperInfo, setShipperInfo] = useState({
    name: 'SEVAYA',
    phone: '0851 9099 3087',
    address: 'Jl. Kebon Jeruk No. 10, Kebon Jeruk, Jakarta Barat 11450',
  });
  const [isEditingShipper, setIsEditingShipper] = useState(false);
  const [savingShipper, setSavingShipper] = useState(false);

  useEffect(() => {
    fetch('/api/admin/shipping-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          const s = data.settings;
          const fullAddress = [
            s.origin_address,
            s.origin_area_name,
            s.origin_postal_code ? String(s.origin_postal_code) : '',
          ]
            .filter(Boolean)
            .join(', ');

          setShipperInfo({
            name: s.shipper_name || 'SEVAYA',
            phone: s.shipper_phone || '0851 9099 3087',
            address: fullAddress || s.origin_address || 'Jl. Kebon Jeruk No. 10, Kebon Jeruk, Jakarta Barat 11450',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveShipper = async () => {
    setSavingShipper(true);
    try {
      await fetch('/api/admin/shipping-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipper_name: shipperInfo.name,
          shipper_phone: shipperInfo.phone,
          origin_address: shipperInfo.address,
          origin_postal_code: 11450,
        }),
      });
      setIsEditingShipper(false);
    } catch {
      // Keep local state anyway
      setIsEditingShipper(false);
    } finally {
      setSavingShipper(false);
    }
  };

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

          {/* Banner Informasi Skenario Pengiriman & Pengirim (Screen Only) */}
          <div className="border-b border-black/10 bg-[#FAF9F6] px-5 py-2.5 text-[11px] text-black/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black">
                {isManualShipping ? '📦 Mode: Kirim Sendiri / Drop Off' : '🚚 Mode: Pick Up Kurir (Biteship)'}
              </span>
              <span className="text-black/40">•</span>
              <span className="text-black/60 truncate max-w-xs">
                Pengirim: {shipperInfo.name} ({shipperInfo.phone})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingShipper(!isEditingShipper)}
              className="text-[10px] font-semibold text-black underline hover:text-black/70 cursor-pointer self-start sm:self-auto"
            >
              {isEditingShipper ? '✕ Tutup Edit' : '✏️ Ubah Alamat Pengirim'}
            </button>
          </div>

          {/* Quick Edit Shipper Box (Screen Only) */}
          {isEditingShipper && (
            <div className="border-b border-black/15 bg-white p-4 space-y-2.5 print:hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-black uppercase tracking-wider">
                  Sesuaikan Identitas &amp; Alamat Pengirim (Toko)
                </span>
                <span className="text-[10px] text-black/50">Langsung tercermin di label saat dicetak</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-black/60 font-semibold uppercase block mb-1">
                    Nama Toko / Pengirim
                  </label>
                  <input
                    type="text"
                    value={shipperInfo.name}
                    onChange={(e) => setShipperInfo({ ...shipperInfo, name: e.target.value })}
                    className="w-full border border-black/20 rounded p-1.5 text-xs text-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-black/60 font-semibold uppercase block mb-1">
                    No. WhatsApp Pengirim
                  </label>
                  <input
                    type="text"
                    value={shipperInfo.phone}
                    onChange={(e) => setShipperInfo({ ...shipperInfo, phone: e.target.value })}
                    className="w-full border border-black/20 rounded p-1.5 text-xs text-black"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-black/60 font-semibold uppercase block mb-1">
                    Alamat Lengkap Pengirim / Studio
                  </label>
                  <input
                    type="text"
                    value={shipperInfo.address}
                    onChange={(e) => setShipperInfo({ ...shipperInfo, address: e.target.value })}
                    placeholder="Contoh: Jl. Panglima Polim No. 12, Kebayoran Baru, Jakarta Selatan 12160"
                    className="w-full border border-black/20 rounded p-1.5 text-xs text-black"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveShipper}
                  disabled={savingShipper}
                  className="px-3.5 py-1.5 bg-black text-white text-xs font-bold rounded-full hover:bg-black/85"
                >
                  {savingShipper ? 'Menyimpan...' : 'Terapkan ke Label'}
                </button>
              </div>
            </div>
          )}

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
                    <span className="font-bold">WA: {shipperInfo.phone}</span>
                  </div>
                  <p className="font-bold text-[11px] text-black">
                    {shipperInfo.name}
                  </p>
                  <p className="text-[10px] text-black/80 leading-tight">
                    {shipperInfo.address}
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
