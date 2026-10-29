import React from 'react';

export const SettingsTab: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex flex-col gap-1 pb-2">
        <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
          Sistem &amp; Konfigurasi
        </span>
        <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
          Pengaturan Studio &amp; Infrastruktur CDN
        </h2>
        <p className="text-[11px] text-black/60 mt-0">
          Konfigurasi operasional Sevaya, kredensial integrasi pengiriman, payment gateway, dan status Supabase Cloud CDN.
        </p>
      </div>

      {/* Card 1: Status Integrasi Logistik & Payment Gateway */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2">
          <h3 className="text-xs font-bold text-black">
            Status Integrasi Logistik &amp; Payment Gateway
          </h3>
          <p className="text-[11px] text-black/60 mt-0">
            Layanan pihak ketiga yang aktif dan tersambung dengan sistem e-commerce Sevaya.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-black">Biteship Logistics</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Webhook
              </span>
            </div>
            <p className="text-[11px] text-black/70">
              Origin: Gudang Sevaya Jakarta Selatan
            </p>
            <div className="pt-2 border-t border-black/15/70 text-[11px] text-[#554C48]">
              Dukungan kurir instant, sameday, next day, dan reguler seluruh Indonesia.
            </div>
          </div>

          <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-black">Midtrans Snap</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Production Gateway
              </span>
            </div>
            <p className="text-[11px] text-black/70">
              QRIS, BCA VA, Mandiri VA, BNI VA, GoPay
            </p>
            <div className="pt-2 border-t border-black/15/70 text-[11px] text-[#554C48]">
              Konfirmasi pembayaran otomatis via HTTP POST webhook callback.
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Infrastruktur Cloud & Status CDN (Supabase Storage) */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2.5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-black">
              Infrastruktur Cloud &amp; Status CDN (Supabase)
            </h3>
            <p className="text-[11px] text-black/60 mt-0">
              Monitoring bucket Supabase cloud storage, integrasi edge CDN Anycast global, dan latensi node.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
            ALL REGIONS OK
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-black/15/70">
              <span className="font-semibold text-black">Bucket S3 Production</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-mono text-emerald-800 border border-emerald-200/60">
                PUBLIC CDN
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-black/70">Endpoint S3</span>
                <span className="font-mono text-black">https://cdn.sevaya.id/storage/v1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">CORS Policy</span>
                <span className="text-emerald-700 font-medium">Enabled (GET, HEAD, POST)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">Cache Control</span>
                <span className="font-mono text-black">1 Year Immutable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">Enkripsi At-Rest</span>
                <span className="text-emerald-700 font-medium">AES-256 Verified</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/15/60 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-black/15/70">
              <span className="font-semibold text-black">Edge Network Latency</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Global Anycast
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-black/70">Jakarta POP (CGK-1)</span>
                <span className="font-mono text-emerald-700 font-semibold">11ms • 100% UP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">Singapore POP (SIN-1)</span>
                <span className="font-mono text-emerald-700 font-semibold">19ms • 100% UP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">Kuala Lumpur POP (KUL-1)</span>
                <span className="font-mono text-emerald-700 font-semibold">24ms • 100% UP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">Global SSL Cert</span>
                <span className="text-emerald-700 font-medium">Aktif s/d Des 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
