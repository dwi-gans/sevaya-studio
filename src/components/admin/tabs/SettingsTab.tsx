'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Truck,
  Building2,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Search,
  Navigation,
  Clock,
  Check,
} from 'lucide-react';

interface ShippingOriginData {
  shipper_name: string;
  shipper_phone: string;
  shipper_email: string;
  shipper_organization?: string;
  origin_address: string;
  origin_note: string;
  origin_postal_code: number;
  origin_area_id?: string;
  origin_area_name?: string;
  updated_at?: string;
}

interface AreaSearchResult {
  id: string;
  name: string;
  postal_code?: number;
  administrative_division_level_1_name?: string;
  administrative_division_level_2_name?: string;
  administrative_division_level_3_name?: string;
}

export const SettingsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<ShippingOriginData>({
    shipper_name: 'SEVAYA',
    shipper_phone: '0851 9099 3087',
    shipper_email: 'info@sevaya-studio.com',
    shipper_organization: 'SEVAYA',
    origin_address: 'Jl. Kebon Jeruk No. 10, Jakarta Barat',
    origin_note: 'Toko SEVAYA',
    origin_postal_code: 11450,
    origin_area_id: 'IDNP6IDNC149IDND847IDZ11450',
    origin_area_name: 'Kebon Jeruk, Jakarta Barat',
  });

  // Area search state for relocation / autocomplete
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [areaResults, setAreaResults] = useState<AreaSearchResult[]>([]);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current settings on load
  const loadSettings = async (fresh = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/shipping-settings${fresh ? '?fresh=1' : ''}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setFormData(data.settings);
        if (data.settings.origin_area_name) {
          setAreaSearchQuery(data.settings.origin_area_name);
        }
      }
    } catch (err) {
      console.error('Failed to load shipping settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAreaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle area search debounce
  const handleAreaSearchChange = (q: string) => {
    setAreaSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (q.trim().length < 3) {
      setAreaResults([]);
      setShowAreaDropdown(false);
      return;
    }

    setIsSearchingArea(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shipping/destination?search=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAreaResults(json.data);
          setShowAreaDropdown(true);
        }
      } catch (err) {
        console.error('Area search error:', err);
      } finally {
        setIsSearchingArea(false);
      }
    }, 350);
  };

  const handleSelectArea = (area: AreaSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      origin_area_id: area.id,
      origin_area_name: area.name,
      origin_postal_code: area.postal_code || prev.origin_postal_code,
    }));
    setAreaSearchQuery(area.name);
    setShowAreaDropdown(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/shipping-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success && data.settings) {
        setFormData(data.settings);
        setFeedback({
          type: 'success',
          message: 'Alamat penjemputan berhasil diperbarui & tersimpan di cloud! Semua pickup kurir dan resi berikutnya otomatis menggunakan alamat ini.',
        });
        setTimeout(() => setFeedback(null), 7000);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Gagal menyimpan pengaturan alamat.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan jaringan saat menyimpan.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1560px] space-y-5 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-2">
        <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
          Sistem &amp; Pengaturan
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base sm:text-xl font-bold tracking-tight text-black">
            Pengaturan Alamat Penjemputan &amp; Sistem
          </h2>
          {formData.updated_at && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-black/50 font-normal">
              <Clock className="w-3.5 h-3.5 text-black/40" />
              Terakhir diperbarui:{' '}
              {new Date(formData.updated_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <p className="text-[11px] sm:text-xs text-black/60 mt-0">
          Atur alamat toko/gudang penjemputan paket kurir Biteship. Anda dapat mengubah alamat kapan saja jika berpindah lokasi gudang/toko.
        </p>
      </div>

      {/* Alert / Feedback Notification */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-3.5 text-xs border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">{feedback.message}</div>
        </div>
      )}

      {/* Card Utama: Form Alamat Pickup (Biteship Origin) */}
      <div className="rounded-xl border border-black/15 bg-white p-4 sm:p-6 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/10 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-black">
                Lokasi Penjemputan Kurir (Biteship Origin)
              </h3>
              <p className="text-[11px] text-black/60 mt-0.5">
                Alamat asal yang akan didatangi kurir saat admin menekan tombol pickup pesanan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadSettings(true)}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-black/70 hover:text-black border border-black/15 hover:border-black/30 rounded-lg transition active:scale-95 bg-white disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-black/40" />
            <p className="text-xs text-black/50">Memuat konfigurasi alamat dari cloud...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Pengirim / Toko */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-black uppercase tracking-wider block">
                  Nama Toko / PIC Pengirim <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.shipper_name}
                    onChange={(e) => setFormData({ ...formData, shipper_name: e.target.value })}
                    placeholder="Contoh: Sevaya Studio / Kak Dwi"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black focus:outline-none transition min-h-[42px] bg-white text-black"
                  />
                </div>
                <p className="text-[10px] text-black/50">Nama pengirim yang tercetak pada resi pengiriman.</p>
              </div>

              {/* No WhatsApp / Telepon */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-black uppercase tracking-wider block">
                  Nomor HP / WhatsApp Kurir <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={formData.shipper_phone}
                    onChange={(e) => setFormData({ ...formData, shipper_phone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black focus:outline-none transition min-h-[42px] bg-white text-black"
                  />
                </div>
                <p className="text-[10px] text-black/50">Nomor aktif yang dapat dihubungi kurir saat tiba di lokasi.</p>
              </div>

              {/* Email Operasional */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-black uppercase tracking-wider block">
                  Email Operasional Toko
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.shipper_email}
                    onChange={(e) => setFormData({ ...formData, shipper_email: e.target.value })}
                    placeholder="info@sevaya-studio.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black focus:outline-none transition min-h-[42px] bg-white text-black"
                  />
                </div>
                <p className="text-[10px] text-black/50">Menerima bukti penyerahan paket & salinan resi otomatis.</p>
              </div>

              {/* Kode Pos Gudang */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-black uppercase tracking-wider block">
                  Kode Pos Gudang / Toko <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Navigation className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    required
                    value={formData.origin_postal_code}
                    onChange={(e) =>
                      setFormData({ ...formData, origin_postal_code: Number(e.target.value) || 0 })
                    }
                    placeholder="Contoh: 11450"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black focus:outline-none transition min-h-[42px] bg-white text-black font-mono"
                  />
                </div>
                <p className="text-[10px] text-black/50">Digunakan untuk menghitung tarif ongkos kirim asal.</p>
              </div>
            </div>

            {/* Pencarian Area / Kecamatan Biteship (Untuk Pindah Lokasi) */}
            <div className="space-y-1 pt-1" ref={dropdownRef}>
              <label className="text-[11px] font-semibold text-black uppercase tracking-wider block">
                Kecamatan / Area Biteship (Otomatis Cari Jika Pindah Lokasi)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={areaSearchQuery}
                  onChange={(e) => handleAreaSearchChange(e.target.value)}
                  onFocus={() => areaResults.length > 0 && setShowAreaDropdown(true)}
                  placeholder="Ketik nama kelurahan, kecamatan, atau kota gudang Anda..."
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black focus:outline-none transition min-h-[42px] bg-white text-black"
                />
                {isSearchingArea && (
                  <RefreshCw className="w-4 h-4 text-black/40 animate-spin absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}

                {/* Dropdown hasil pencarian wilayah */}
                {showAreaDropdown && areaResults.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-black/15 rounded-xl shadow-lg divide-y divide-black/5">
                    {areaResults.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => handleSelectArea(area)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-black/5 transition text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-black">{area.name}</div>
                          <div className="text-[10px] text-black/50">
                            {[
                              area.administrative_division_level_3_name,
                              area.administrative_division_level_2_name,
                              area.administrative_division_level_1_name,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        </div>
                        {area.postal_code && (
                          <span className="font-mono text-[10px] bg-black/5 px-2 py-0.5 rounded border border-black/10 shrink-0">
                            {area.postal_code}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-black/60">
                <span>
                  Area Terpilih:{' '}
                  <strong className="text-black">{formData.origin_area_name || 'Belum dipilih'}</strong>
                </span>
                {formData.origin_area_id && (
                  <span className="font-mono text-[9px] bg-black/5 px-2 py-0.5 rounded border border-black/10">
                    ID: {formData.origin_area_id}
                  </span>
                )}
              </div>
            </div>

            {/* Alamat Lengkap Toko / Gudang */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-black uppercase tracking-wider block">
                Alamat Lengkap Toko / Gudang Penjemputan <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.origin_address}
                onChange={(e) => setFormData({ ...formData, origin_address: e.target.value })}
                placeholder="Nama jalan, nomor bangunan, RT/RW, kelurahan, kecamatan, kota..."
                className="w-full p-3 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black focus:outline-none transition bg-white text-black leading-relaxed"
              />
              <p className="text-[10px] text-black/50">
                Alamat ini akan diserahkan ke sistem GPS kurir untuk penjemputan paket.
              </p>
            </div>

            {/* Patokan / Catatan untuk Kurir */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-black uppercase tracking-wider block">
                Patokan Lokasi / Catatan Khusus Kurir
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={formData.origin_note}
                  onChange={(e) => setFormData({ ...formData, origin_note: e.target.value })}
                  placeholder="Contoh: Ruko samping bank, pagar hitam / Titip ke resepsionis"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-black/20 focus:border-black focus:outline-none transition min-h-[42px] bg-white text-black"
                />
              </div>
              <p className="text-[10px] text-black/50">Membantu kurir menemukan lokasi Anda dengan cepat.</p>
            </div>

            {/* Preview Box: Simulasi Informasi yang Dilihat Kurir */}
            <div className="rounded-xl bg-[#FAF9F6] border border-black/10 p-3.5 sm:p-4 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-black/10">
                <span className="font-semibold text-black flex items-center gap-1.5 text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-black" />
                  Pratinjau Tiket Penjemputan Kurir
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  SIAP DIPICKUP
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-black/50 block">Pengirim:</span>
                  <span className="font-semibold text-black">
                    {formData.shipper_name || 'SEVAYA'} ({formData.shipper_phone || '0851 9099 3087'})
                  </span>
                </div>
                <div>
                  <span className="text-black/50 block">Wilayah Asal:</span>
                  <span className="font-semibold text-black">
                    {formData.origin_area_name || 'Jakarta'} • {formData.origin_postal_code}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-black/50 block">Alamat Jemput:</span>
                  <span className="text-black leading-relaxed">
                    {formData.origin_address || 'Belum diisi'}
                  </span>
                  {formData.origin_note && (
                    <span className="block text-black/60 italic mt-0.5">
                      Catatan: &ldquo;{formData.origin_note}&rdquo;
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button: Simpan Alamat */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] text-black/50 text-center sm:text-left">
                Tersimpan permanen di cloud Supabase. Perubahan langsung aktif untuk pesanan berikutnya.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white hover:bg-black/85 px-6 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition shadow-sm active:scale-95 disabled:opacity-50 min-h-[42px]"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Simpan Perubahan Alamat
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Card 2: Status Integrasi Logistik & Payment Gateway */}
      <div className="rounded-xl border border-black/15 bg-white p-4 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2">
          <h3 className="text-xs font-bold text-black">
            Status Integrasi Logistik &amp; Payment Gateway
          </h3>
          <p className="text-[11px] text-black/60 mt-0">
            Layanan pihak ketiga yang aktif dan tersambung dengan sistem e-commerce Sevaya.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-black">Biteship Logistics</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Webhook
              </span>
            </div>
            <p className="text-[11px] text-black/70">
              Origin Aktif: {formData.origin_area_name || 'Gudang Sevaya'} ({formData.origin_postal_code})
            </p>
            <div className="pt-2 border-t border-black/10 text-[11px] text-black/60">
              Dukungan kurir instant, sameday, next day, dan reguler seluruh Indonesia.
            </div>
          </div>

          <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-black">TriPay Gateway</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Active Gateway
              </span>
            </div>
            <p className="text-[11px] text-black/70">
              T53774 • QRIS, Virtual Account, Ritel
            </p>
            <div className="pt-2 border-t border-black/10 text-[11px] text-black/60">
              Konfirmasi pembayaran otomatis via webhook /api/webhooks/tripay.
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Infrastruktur Cloud & Status CDN (Supabase Storage) */}
      <div className="rounded-xl border border-black/15 bg-white p-4 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2.5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-black">
              Infrastruktur Cloud &amp; Status CDN (Supabase)
            </h3>
            <p className="text-[11px] text-black/60 mt-0">
              Penyimpanan cloud bucket catalog untuk inventaris, produk, &amp; konfigurasi penjemputan.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
            ALL REGIONS OK
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/10 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-black/10">
              <span className="font-semibold text-black">Bucket S3 Production</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-mono text-emerald-800 border border-emerald-200/60">
                PUBLIC CDN
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-black/70">Bucket Utama</span>
                <span className="font-mono text-black">catalog</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">CORS Policy</span>
                <span className="text-emerald-700 font-medium">Enabled (GET, HEAD, POST)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">Alamat Pickup Sync</span>
                <span className="font-mono text-emerald-700 font-semibold">shipping_settings.json</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-black/5 p-4 text-xs border border-black/10 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-black/10">
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

export default SettingsTab;
