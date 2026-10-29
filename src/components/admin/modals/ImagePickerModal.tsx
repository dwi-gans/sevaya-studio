import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { AVAILABLE_CATALOG_IMAGES } from '../adminTypes';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imagePath: string) => void;
  availableImages?: string[];
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  availableImages = AVAILABLE_CATALOG_IMAGES,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] sm:max-h-[85vh] w-full max-w-3xl flex flex-col rounded-t-2xl sm:rounded-2xl border border-black/15 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/15/70 bg-white px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase block">
              Galeri Media
            </span>
            <h3 className="font-headline text-base font-bold text-black sm:text-lg">
              Pilih atau Unggah Foto
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black transition"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Predefined catalog images */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-black/60 mb-3">
              Pustaka Foto Bawaan Studio
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {availableImages.map((img) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => onSelectImage(img)}
                  className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-black/15 bg-black/5 transition-all hover:scale-105 hover:ring-2 hover:ring-[#000000]"
                >
                  <Image src={img} alt="Catalog photo" fill className="object-cover" />
                  <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white backdrop-blur-xs">
                    {img.split('/').pop()?.replace('.jpg', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
