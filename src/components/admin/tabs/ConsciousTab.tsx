import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import type { SiteSectionsConfig } from '@/integrations/supabase';
import type { ImagePickerTarget } from '../adminTypes';

interface ConsciousTabProps {
  sections: SiteSectionsConfig;
  onOpenImagePicker: (target: ImagePickerTarget) => void;
}

export const ConsciousTab: React.FC<ConsciousTabProps> = ({
  sections,
  onOpenImagePicker,
}) => {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="pb-2">
        <span className="hidden sm:block text-[9px] font-bold tracking-widest text-black/50 uppercase">
          Editorial &amp; Storefront
        </span>
        <h2 className="text-sm sm:text-xl font-bold tracking-tight text-black">
          Halaman Tentang Toko (About)
        </h2>
        <p className="hidden sm:block text-[11px] text-black/60 mt-0.5">
          Kelola banner filosofi brand dan 4 foto arsip material kain busana Sevaya. Tersimpan otomatis.
        </p>
      </div>

      {/* Manifesto Hero Banner */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2">
          <h3 className="text-xs font-bold text-black">
            1. Banner Utama Halaman About
          </h3>
          <p className="text-[11px] text-black/60 mt-0">
            Foto tajuk atas halaman Tentang Toko (&quot;A Softer Way of Dressing&quot;).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/15 bg-black/5">
            <Image
              src={sections.conscious?.heroImage || '/images/catalog/catalog-11.jpg'}
              alt="Conscious hero"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => onOpenImagePicker('conscious-hero')}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:border-black hover:bg-black/5"
            >
              <Icon name="image" size={14} />
              <span>Ganti Gambar Hero Filosofi</span>
            </button>
            <p className="text-xs text-black/70">
              Tampilan editorial manifesto untuk mengedukasi pelanggan mengenai etika pembuatan pakaian Sevaya.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Textile Archives */}
      <div className="rounded-xl border border-black/15 bg-white p-3 sm:p-5 shadow-[0_1px_4px_rgba(27,23,24,0.03)] space-y-3">
        <div className="border-b border-black/10 pb-2">
          <h3 className="text-xs font-bold text-black">
            2. Foto 4 Arsip Tekstil Berkelanjutan
          </h3>
          <p className="text-[11px] text-black/60 mt-0">
            Empat foto makro material kain alami (Bemberg, Tencel, Pure Linen, Eco Modal).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* 1. Bemberg */}
          <div className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 border border-black/15/60">
            <span className="truncate text-xs font-semibold text-black">
              Bemberg™ Cupro
            </span>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
              <Image
                src={sections.conscious?.bembergImage || '/images/catalog/catalog-06.jpg'}
                alt="Bemberg Cupro"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('conscious-bemberg')}
              className="rounded-full border border-black/20 bg-white py-1.5 text-center text-[11px] font-medium text-black hover:border-black"
            >
              Ganti Foto
            </button>
          </div>

          {/* 2. Tencel */}
          <div className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 border border-black/15/60">
            <span className="truncate text-xs font-semibold text-black">
              TENCEL™ Lyocell
            </span>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
              <Image
                src={sections.conscious?.tencelImage || '/images/catalog/catalog-16.jpg'}
                alt="Tencel Lyocell"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('conscious-tencel')}
              className="rounded-full border border-black/20 bg-white py-1.5 text-center text-[11px] font-medium text-black hover:border-black"
            >
              Ganti Foto
            </button>
          </div>

          {/* 3. Linen */}
          <div className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 border border-black/15/60">
            <span className="truncate text-xs font-semibold text-black">
              Pure Flax Linen
            </span>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
              <Image
                src={sections.conscious?.linenImage || '/images/catalog/catalog-15.jpg'}
                alt="Pure Flax Linen"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('conscious-linen')}
              className="rounded-full border border-black/20 bg-white py-1.5 text-center text-[11px] font-medium text-black hover:border-black"
            >
              Ganti Foto
            </button>
          </div>

          {/* 4. Modal */}
          <div className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 border border-black/15/60">
            <span className="truncate text-xs font-semibold text-black">
              Eco Modal
            </span>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/15 bg-white">
              <Image
                src={sections.conscious?.modalImage || '/images/catalog/catalog-04.jpg'}
                alt="Eco Modal"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenImagePicker('conscious-modal')}
              className="rounded-full border border-black/20 bg-white py-1.5 text-center text-[11px] font-medium text-black hover:border-black"
            >
              Ganti Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
