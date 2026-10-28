'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';

export interface Address {
  id: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  notes?: string;
  is_default: boolean;
}

const INDONESIA_PROVINCES = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
  'Banten', 'Bali', 'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau',
  'Kepulauan Riau', 'Jambi', 'Sumatera Selatan', 'Kepulauan Bangka Belitung',
  'Bengkulu', 'Lampung', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan',
  'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Gorontalo',
  'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat'
];

interface MyAddressesViewProps {
  onAddressCountChange?: (count: number) => void;
}

export function MyAddressesView({ onAddressCountChange }: MyAddressesViewProps) {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form fields
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('DKI Jakarta');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/user/addresses', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat buku alamat.');
      }
      const list = data.addresses || [];
      setAddresses(list);
      onAddressCountChange?.(list.length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat alamat';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, onAddressCountChange]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const openAddForm = () => {
    setEditingAddress(null);
    setRecipientName('');
    setPhone('');
    setAddressLine('');
    setCity('');
    setProvince('DKI Jakarta');
    setPostalCode('');
    setNotes('');
    setIsDefault(addresses.length === 0);
    setIsFormOpen(true);
  };

  const openEditForm = (addr: Address) => {
    setEditingAddress(addr);
    setRecipientName(addr.recipient_name);
    setPhone(addr.phone);
    setAddressLine(addr.address_line);
    setCity(addr.city);
    setProvince(addr.province);
    setPostalCode(addr.postal_code);
    setNotes(addr.notes || '');
    setIsDefault(addr.is_default);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !phone.trim() || !addressLine.trim() || !city.trim() || !postalCode.trim()) {
      showToast('Harap lengkapi seluruh kolom wajib alamat.');
      return;
    }

    setIsSaving(true);
    try {
      const token = await getAccessToken();
      const isEdit = Boolean(editingAddress);
      const url = '/api/user/addresses';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...(isEdit ? { id: editingAddress!.id } : {}),
        recipient_name: recipientName.trim(),
        phone: phone.trim(),
        address_line: addressLine.trim(),
        city: city.trim(),
        province: province.trim(),
        postal_code: postalCode.trim(),
        notes: notes.trim(),
        is_default: isDefault,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan alamat.');
      }

      showToast(isEdit ? 'Alamat berhasil diperbarui.' : 'Alamat baru berhasil ditambahkan.');
      setIsFormOpen(false);
      fetchAddresses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      showToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus alamat pengiriman untuk "${name}"?`)) {
      return;
    }

    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/user/addresses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus alamat.');
      }

      showToast('Alamat berhasil dihapus.');
      fetchAddresses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus alamat.';
      showToast(msg);
    }
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: addr.id,
          recipient_name: addr.recipient_name,
          phone: addr.phone,
          address_line: addr.address_line,
          city: addr.city,
          province: addr.province,
          postal_code: addr.postal_code,
          notes: addr.notes,
          is_default: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menjadikan alamat utama.');
      }

      showToast('Alamat utama berhasil diubah.');
      fetchAddresses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengatur alamat';
      showToast(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col gap-4 border border-black/15 bg-white p-6 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div>
          <h2 className="font-sans text-base font-semibold tracking-wider text-black/85 uppercase">
            Buku Alamat Pengiriman
          </h2>
          <p className="mt-1 text-xs text-black/70">
            Kelola alamat tujuan untuk kemudahan checkout otomatis kurir Biteship.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 border border-black bg-black px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29] active:scale-[0.98]"
        >
          <Icon name="add" size={16} />
          <span>Tambah Alamat Baru</span>
        </button>
      </div>

      {/* Modal / Inline Form for Add & Edit */}
      {isFormOpen && (
        <div className="border border-black bg-white p-6 sm:p-8 shadow-sm animate-luxury-fade-up">
          <div className="flex items-center justify-between border-b border-black/15 pb-3">
            <h3 className="font-sans text-sm font-semibold tracking-wider text-black/85 uppercase">
              {editingAddress ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Baru'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1 text-black/50 hover:text-black"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold tracking-wider text-black uppercase">
                  Nama Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama lengkap penerima"
                  className="w-full border border-black/15 bg-white px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold tracking-wider text-black uppercase">
                  Nomor Telepon Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812 3456 7890"
                  className="w-full border border-black/15 bg-white px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold tracking-wider text-black uppercase">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                className="w-full border border-black/15 bg-white px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold tracking-wider text-black uppercase">
                  Provinsi <span className="text-red-500">*</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full border border-black/15 bg-white px-3 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                >
                  {INDONESIA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold tracking-wider text-black uppercase">
                  Kota / Kabupaten <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Jakarta Selatan"
                  className="w-full border border-black/15 bg-white px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold tracking-wider text-black uppercase">
                  Kode Pos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="12190"
                  className="w-full border border-black/15 bg-white px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold tracking-wider text-black uppercase">
                Catatan Pengiriman (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Patokan rumah, instruksi satpam / kurir"
                className="w-full border border-black/15 bg-white px-3.5 py-2.5 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="isDefault"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 cursor-pointer text-black accent-[#000000]"
              />
              <label htmlFor="isDefault" className="cursor-pointer text-xs text-[#554C48]">
                Jadikan sebagai alamat pengiriman utama (default)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/15">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
                className="border border-black/20 bg-white px-5 py-2 text-xs font-semibold tracking-wider text-black uppercase transition hover:border-black"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 border border-black bg-black px-6 py-2 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29] disabled:opacity-50"
              >
                {isSaving && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Alamat'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse border border-black/15 bg-white p-5 space-y-3">
              <div className="h-4 w-32 bg-[rgba(0,0,0,0.12)]/60" />
              <div className="h-3 w-64 bg-[rgba(0,0,0,0.12)]/40" />
              <div className="h-3 w-48 bg-[rgba(0,0,0,0.12)]/40" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
          <p>{errorMsg}</p>
          <button
            type="button"
            onClick={fetchAddresses}
            className="mt-3 inline-block border border-red-300 bg-white px-4 py-2 font-semibold tracking-wider uppercase text-red-700 hover:bg-red-100"
          >
            Coba Lagi
          </button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="border border-dashed border-black/20 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-black/15 bg-white text-black/50">
            <Icon name="location_on" size={24} />
          </div>
          <h3 className="mt-4 font-sans text-sm font-semibold tracking-wider text-black/85 uppercase">
            Belum Ada Alamat Tersimpan
          </h3>
          <p className="mt-1 text-xs text-black/70">
            Tambahkan alamat pengiriman pertama Anda untuk proses belanja yang lebih cepat.
          </p>
          <button
            type="button"
            onClick={openAddForm}
            className="mt-5 inline-flex items-center gap-1.5 border border-black bg-black px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29]"
          >
            <Icon name="add" size={15} />
            <span>Tambah Alamat Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border bg-white p-5 transition-colors shadow-xs ${
                addr.is_default
                  ? 'border-black ring-1 ring-[#000000]/20'
                  : 'border-black/15 hover:border-[rgba(0,0,0,0.4)]'
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-sans text-sm font-semibold tracking-wider text-black uppercase">
                    {addr.recipient_name}
                  </span>
                  {addr.is_default && (
                    <span className="bg-black px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
                      Alamat Utama
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {!addr.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr)}
                      className="text-black/70 hover:text-black underline underline-offset-2"
                    >
                      Jadikan Utama
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditForm(addr)}
                    className="inline-flex items-center gap-1 text-black hover:opacity-75 font-medium"
                  >
                    <Icon name="edit" size={13} />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id, addr.recipient_name)}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                  >
                    <Icon name="delete" size={13} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-[#554C48]">
                <p className="font-medium text-black">{addr.phone}</p>
                <p className="leading-relaxed">{addr.address_line}</p>
                <p className="text-black/70">
                  {addr.city}, {addr.province} {addr.postal_code}
                </p>
                {addr.notes && (
                  <p className="text-[11px] text-black/50 italic">
                    Catatan: &ldquo;{addr.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
