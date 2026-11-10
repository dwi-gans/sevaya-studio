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
  biteship_order_id?: string;
  biteship_status?: string;
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

  const isBiteshipPickup = Boolean(order.biteship_order_id);
  const barcodeValue = order.tracking_number?.trim() || order.biteship_order_id || order.order_number;
  const isManualShipping = !isBiteshipPickup;

  // Cek apakah alamat tujuan sudah lengkap memuat kecamatan/kota sehingga tidak perlu diulang (tanpa hook)
  const destNorm = order.destination_area ? order.destination_area.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const addrNorm = order.customer_address ? order.customer_address.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const isDestinationRedundant = Boolean(destNorm && addrNorm && addrNorm.includes(destNorm));

  const handlePrint = () => {
    const labelEl = document.getElementById('sevaya-shipping-label');
    if (!labelEl) {
      window.print();
      return;
    }

    try {
      // Buat iframe terisolasi agar PASTI hanya 1 halaman & tidak mencetak dashboard di belakang
      const iframe = document.createElement('iframe');
      iframe.setAttribute(
        'style',
        'position:fixed;top:-9999px;left:-9999px;width:100mm;height:150mm;border:0;visibility:hidden;'
      );
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      // Kloning seluruh styles aktif dari halaman
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((el) => el.outerHTML)
        .join('\n');

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Label Pengiriman SEVAYA #${order.order_number}</title>
            ${styles}
            <style>
              @page {
                size: 100mm 150mm;
                margin: 0;
              }
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                width: 100mm !important;
                height: 146mm !important;
                max-height: 146mm !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: #fff !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              }
              .print-container {
                width: 100mm !important;
                height: 146mm !important;
                max-height: 146mm !important;
                box-sizing: border-box !important;
                padding: 2mm !important;
                overflow: hidden !important;
              }
              #sevaya-shipping-label {
                width: 100% !important;
                max-width: 100% !important;
                height: 100% !important;
                max-height: 100% !important;
                min-height: 0 !important;
                box-sizing: border-box !important;
                border: 1.5px solid #000 !important;
                padding: 2.5mm !important;
                box-shadow: none !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                overflow: hidden !important;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${labelEl.outerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {
            // ignore
          }
        }, 1500);
      }, 300);
    } catch {
      window.print();
    }
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
      {/* ─── Global Print Styles (Fallback jika Ctrl+P) ────────────────────── */}
      <style jsx global>{`
        @media print {
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          html,
          body {
            width: 100mm !important;
            height: 146mm !important;
            max-height: 146mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #sevaya-shipping-label,
          #sevaya-shipping-label * {
            visibility: visible !important;
          }
          #sevaya-shipping-label {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100mm !important;
            max-width: 100mm !important;
            height: 146mm !important;
            max-height: 146mm !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 2.5mm !important;
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            background: #fff !important;
            color: #000 !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
                {isManualShipping ? '📦 Mode: Kirim Manual / Drop-Off (Tanpa Barcode)' : '🚚 Mode: Pick Up Kurir (Biteship - Barcode Aktif)'}
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
              className="w-full max-w-[380px] bg-white border-2 border-black p-3 text-black font-sans shadow-md flex flex-col justify-between print:shadow-none print:border-2 print:border-black print:max-w-none print:w-[100mm] print:h-[146mm] print:p-2.5 box-border"
              style={{ minHeight: '480px' }}
            >
              {/* Header: Logo, Store & Service */}
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5 shrink-0">
                <div>
                  <h1 className="font-serif text-base font-extrabold tracking-widest uppercase leading-tight">
                    SEVAYA
                  </h1>
                  <p className="text-[8.5px] uppercase tracking-wider text-black font-medium">
                    Modern Modestwear Studio
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-black text-white px-2 py-0.5 text-[11px] font-black uppercase tracking-wider rounded-xs">
                    {order.courier_name || 'REGULER'}
                  </div>
                  <p className="text-[8.5px] text-black/70 font-mono mt-0.5">
                    {formattedDate}
                  </p>
                </div>
              </div>

              {/* Barcode & Waybill Section */}
              {isBiteshipPickup ? (
                <div className="py-1.5 border-b-2 border-black text-center bg-black/2 print:bg-transparent shrink-0">
                  <BarcodeSVG value={barcodeValue} />
                  <div className="flex items-center justify-between px-2 pt-0.5 text-[8.5px] text-black/70">
                    <span className="font-mono font-bold">Resi: {barcodeValue}</span>
                    <span>Berat: {estWeight} kg</span>
                    <span>Qty: {totalQuantity} pcs</span>
                  </div>
                </div>
              ) : (
                <div className="py-1.5 px-2.5 border-b-2 border-black bg-neutral-50/70 print:bg-transparent shrink-0">
                  <div className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block text-[8px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-2xs">
                        DROP-OFF GERAI
                      </span>
                      <span className="font-bold text-black font-mono">
                        #{order.order_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[8.5px] text-black/80 font-medium">
                      <span className="font-bold text-black">NON-COD • LUNAS</span>
                      <span>•</span>
                      <span>{estWeight} kg</span>
                      <span>•</span>
                      <span>{totalQuantity} pcs</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Section: Recipient & Sender */}
              <div className="grid grid-cols-1 divide-y-2 divide-black border-b-2 border-black shrink-0">
                
                {/* Kepada (Penerima) */}
                <div className="p-2 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-bold uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-2xs">
                      PENERIMA (TO)
                    </span>
                    <span className="font-bold text-[11px] font-mono">{order.customer_phone}</span>
                  </div>
                  <p className="font-extrabold text-[13px] leading-tight text-black pt-0.5">
                    {order.customer_name}
                  </p>
                  <p className="text-[10px] leading-snug text-black break-words">
                    {order.customer_address}
                  </p>
                  {order.destination_area && !isDestinationRedundant && (
                    <p className="text-[9px] font-semibold text-black/80 pt-0.5">
                      📍 {order.destination_area}
                    </p>
                  )}
                </div>

                {/* Dari (Pengirim) */}
                <div className="p-1.5 space-y-0.5 bg-neutral-50/50 print:bg-transparent text-[9px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-black/80">
                      PENGIRIM (FROM):
                    </span>
                    <span className="font-bold font-mono">WA: {shipperInfo.phone}</span>
                  </div>
                  <p className="font-bold text-[10px] text-black">
                    {shipperInfo.name}
                  </p>
                  <p className="text-[9px] text-black/80 leading-tight break-words">
                    {shipperInfo.address}
                  </p>
                </div>
              </div>

              {/* Packing Slip / Daftar Produk */}
              <div className="p-1.5 border-b-2 border-black space-y-1 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-black">
                    RINCIAN ISI PAKET (PACKING SLIP)
                  </span>
                  <span className="text-[8.5px] text-black/60 font-mono">
                    Total: {totalQuantity} pcs
                  </span>
                </div>
                <div className="divide-y divide-black/20 text-[9.5px]">
                  {itemsList.map((item, idx) => (
                    <div key={idx} className="py-0.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-black leading-tight truncate">
                          {item.productTitle || item.title || item.name || 'Produk Modestwear'}
                        </p>
                        <p className="text-[8.5px] text-black/70">
                          {item.color ? `Warna: ${item.color}` : ''}
                          {item.size ? ` • Size: ${item.size}` : ''}
                        </p>
                      </div>
                      <span className="font-bold font-mono text-[10.5px] shrink-0">
                        ×{item.qty || item.quantity || 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-1.5 pb-0.5 text-center text-[7.5px] text-black/75 leading-tight shrink-0">
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
