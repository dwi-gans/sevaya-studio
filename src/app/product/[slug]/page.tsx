'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Footer } from '@/components/layout/Footer';
import { Icon } from '@/components/ui/Icon';
import { getDbProducts, DbProduct } from '@/integrations/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const GALLERY_IMAGES = [
  {
    src: '/images/catalog/catalog-01.jpg',
    alt: 'Fina Abaya Stripe Edition in Deep Garnet Silk Cupro',
  },
  {
    src: '/images/catalog/catalog-06.jpg',
    alt: 'Fabric drape close up Bemberg Cupro Silk',
  },
  {
    src: '/images/catalog/catalog-08.jpg',
    alt: 'Back drape showing floor-length fluid sweep',
  },
  {
    src: '/images/catalog/catalog-04.jpg',
    alt: 'Detail of concealed wudhu friendly sleeve zipper',
  },
  {
    src: '/images/catalog/catalog-02.jpg',
    alt: 'Movement shot of graceful fluid drape in motion',
  },
];

const COLORS = [
  {
    name: 'Obsidian Black',
    hex: '#141312',
    image: '/images/catalog/catalog-01.jpg',
  },
  {
    name: 'Garnet Maroon',
    hex: '#6B2D2B',
    image: '/images/catalog/catalog-06.jpg',
  },
  {
    name: 'Desert Sand',
    hex: '#D4C4B5',
    image: '/images/catalog/catalog-08.jpg',
  },
  {
    name: 'Peach Bloom',
    hex: '#E5A894',
    image: '/images/catalog/catalog-10.jpg',
  },
];

const SIZES = [
  { label: 'XS', sub: 'Bust 96cm', price: 1339000 },
  { label: 'S–M', sub: 'Bust 104cm', price: 1339000 },
  { label: 'L–XL', sub: 'Bust 116cm', price: 1339000 },
  { label: 'Custom Fit', sub: 'Tailored to measure', price: 1389000 },
];

export default function ProductDetailPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  const [dbProduct, setDbProduct] = useState<DbProduct | null>(null);
  const [availableColors, setAvailableColors] = useState(COLORS);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]!);
  const [activeImage, setActiveImage] = useState(COLORS[0]!.image);
  const [selectedSize, setSelectedSize] = useState(SIZES[1]!);
  const [quantity, setQuantity] = useState(1);
  const [wishlistActive, setWishlistActive] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getDbProducts().then((items) => {
      if (!isMounted) return;
      const found = items.find((p) => p.slug === slug);
      if (found) {
        setDbProduct(found);
        if (found.swatches && found.swatches.length > 0) {
          const sw = found.swatches.map((s) => ({
            name: s.name,
            hex: s.color,
            image: s.image || found.image || '/images/catalog/catalog-01.jpg',
          }));
          setAvailableColors(sw);
          setSelectedColor(sw[0]!);
          setActiveImage(sw[0]!.image);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const title =
    dbProduct?.title ||
    (slug === 'tala-abaya-cloudmatte'
      ? 'Tala Abaya — Cloudmatte'
      : 'Fina Abaya — Stripe Edition 2.0');
  const unitPrice = dbProduct?.price || selectedSize.price;
  const totalPrice = unitPrice * quantity;

  const handleAddToBag = () => {
    addToCart({
      id: slug,
      title,
      edition: '26° Rhapsody Chapter III',
      price: unitPrice,
      originalPrice: 1489000,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      size: selectedSize.label,
      image: activeImage,
      quantity,
    });
    showToast(`Added ${quantity}x ${title} (${selectedSize.label}) to bag`);
  };

  const handleInstantBuy = () => {
    handleAddToBag();
    router.push('/bag');
  };

  const toggleWishlist = () => {
    setWishlistActive(!wishlistActive);
    showToast(wishlistActive ? 'Removed from Wishlist' : 'Saved to your Wishlist');
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-[#FAF8F5] pb-32">
      <div className="mx-auto w-full max-w-4xl">
        {/* Gallery & Showcase */}
        <section className="relative w-full overflow-hidden bg-[#F4EFEB]">
          {/* Main 3:4 Image */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#eae7e7]">
            <Image
              src={activeImage}
              alt={`${title} - ${selectedColor.name}`}
              fill
              priority
              className="object-cover object-top transition-all duration-500 select-none"
            />

            {/* Top Badges & Wishlist */}
            <div className="pointer-events-none absolute top-4 right-4 left-4 flex items-center justify-between">
              <span className="font-label-sm pointer-events-auto inline-flex items-center rounded-full bg-[#141312] px-3 py-1 text-[10px] font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-sm">
                Best Seller
              </span>
              <button
                type="button"
                aria-label="Save to Wishlist"
                onClick={toggleWishlist}
                className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF8F5]/90 text-[#1B1718] shadow-sm backdrop-blur-md transition-all hover:text-[#141312] active:scale-95"
              >
                <Icon
                  name="bookmark"
                  size={20}
                  filled={wishlistActive}
                  className={wishlistActive ? 'text-[#141312]' : 'text-inherit'}
                />
              </button>
            </div>

            {/* Current Color Indicator on Image */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full bg-[#FAF8F5]/90 px-3 py-1 shadow-sm backdrop-blur-md">
              <span
                style={{ backgroundColor: selectedColor.hex }}
                className="h-3 w-3 rounded-full border border-black/20"
              />
              <span className="font-label-sm text-[11px] font-semibold tracking-wider text-[#1B1718] uppercase">
                {selectedColor.name}
              </span>
            </div>
          </div>

          {/* Micro Thumbnails Strip (Color variants + detail photos) */}
          <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto bg-[#FAF8F5] p-3">
            {availableColors.map((col) => {
              const isSelected = activeImage === col.image;
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => {
                    setSelectedColor(col);
                    setActiveImage(col.image);
                  }}
                  className={`group relative h-20 w-16 shrink-0 overflow-hidden shadow-2xs transition-all ${
                    isSelected
                      ? 'scale-105 opacity-100 ring-2 ring-[#141312] ring-offset-2'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={col.image} alt={col.name} fill className="object-cover" />
                  <span
                    style={{ backgroundColor: col.hex }}
                    className="absolute right-1 bottom-1 h-3.5 w-3.5 rounded-full border border-white shadow-xs"
                    title={col.name}
                  />
                </button>
              );
            })}
            {GALLERY_IMAGES.slice(1).map((img, idx) => {
              const isSelected = activeImage === img.src;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img.src)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg shadow-2xs transition-all ${
                    isSelected
                      ? 'scale-105 opacity-100 ring-2 ring-[#141312] ring-offset-2'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img.src} alt={img.alt} fill className="object-cover" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Product Meta Section */}
        <section className="px-margin-mobile flex flex-col gap-3 pt-5 pb-6">
          {/* Breadcrumbs */}
          <div className="font-label-sm flex items-center gap-1.5 text-[11px] tracking-wider text-[#685E5A] uppercase">
            <Link href="/" className="hover:text-[#1B1718]">
              Women
            </Link>
            <Icon name="chevron_right" size={12} />
            <Link href="/" className="hover:text-[#1B1718]">
              Abayas
            </Link>
            <Icon name="chevron_right" size={12} />
            <span className="font-medium text-[#1B1718]">26&deg; Rhapsody</span>
          </div>

          {/* Title & Reviews */}
          <div className="flex flex-col gap-1.5">
            <h1 className="font-headline-lg-mobile font-normal tracking-tight text-[#1B1718] md:text-3xl">
              {title}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-[#1B1718]">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} name="star" size={16} filled className="text-[#1B1718]" />
                ))}
              </div>
              <span className="font-label-md text-label-md font-semibold text-[#1B1718]">4.9</span>
              <span className="font-body-sm text-body-sm text-[#685E5A]">(128 reviews)</span>
              <span className="mx-0.5 h-1 w-1 rounded-full bg-[#dac0c2]" />
              <span className="font-label-md text-label-md font-semibold tracking-wider text-[#1B1718] uppercase">
                98% Fit True
              </span>
            </div>
          </div>

          {/* Pricing & Installment */}
          <div className="flex flex-col gap-1.5 rounded-xl border border-[#E5DDD5]/60 bg-[#F4EFEB] p-4 shadow-2xs">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2.5">
                <span className="font-headline-md font-semibold text-[#1B1718] md:text-2xl">
                  Rp {unitPrice.toLocaleString('id-ID')}
                </span>
                <span className="font-body-sm text-body-sm text-[#685E5A] line-through">
                  Rp 1,489,000
                </span>
              </div>
              <span className="font-label-sm text-label-sm rounded-full bg-[#EFE6DD] px-2.5 py-0.5 font-semibold text-[#1B1718]">
                10% OFF
              </span>
            </div>
            <div className="font-body-sm text-body-sm flex items-center gap-1.5 text-[#685E5A]">
              <Icon name="credit_card" size={16} className="text-[#1B1718]" />
              <span>
                or 3x{' '}
                <span className="font-medium text-[#1B1718]">
                  Rp {Math.round(unitPrice / 3).toLocaleString('id-ID')}
                </span>{' '}
                with PayLater (0% fee)
              </span>
            </div>
          </div>
        </section>

        {/* Color Selection */}
        <section className="px-margin-mobile flex flex-col gap-3 pb-6">
          <div className="flex items-center justify-between">
            <span className="font-label-lg text-label-lg font-medium tracking-wide text-[#1B1718] uppercase">
              Color: <span className="font-normal text-[#685E5A]">{selectedColor.name}</span>
            </span>
            <span className="text-label-sm font-label-sm font-semibold text-[#1B1718] uppercase">
              In Stock
            </span>
          </div>

          <div className="flex items-center gap-3">
            {availableColors.map((col) => {
              const isSelected = selectedColor.name === col.name;
              return (
                <button
                  key={col.name}
                  type="button"
                  aria-label={col.name}
                  onClick={() => {
                    setSelectedColor(col);
                    setActiveImage(col.image);
                  }}
                  className="group flex flex-col items-center gap-1"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full p-0.5 transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#6b1d2f] ring-offset-2 ring-offset-[#FAF8F5]'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col.hex }}
                  >
                    {isSelected && <Icon name="check" size={16} className="text-[#ffffff]" />}
                  </span>
                  <span
                    className={`font-label-sm text-[10px] ${
                      isSelected ? 'font-semibold text-[#1B1718]' : 'text-[#685E5A]'
                    }`}
                  >
                    {col.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Size Selection */}
        <section className="px-margin-mobile flex flex-col gap-3 pb-6">
          <div className="flex items-center justify-between">
            <span className="font-label-lg text-label-lg font-medium tracking-wide text-[#1B1718] uppercase">
              Select Size: <span className="font-normal text-[#685E5A]">{selectedSize.label}</span>
            </span>
            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="text-label-sm font-label-sm font-semibold text-[#1B1718] uppercase underline underline-offset-2"
            >
              Size Guide
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {SIZES.map((sz) => {
              const isSelected = selectedSize.label === sz.label;
              return (
                <button
                  key={sz.label}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`flex flex-col items-start rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#FAF8F5] shadow-xs'
                      : 'border-[#E5DDD5] bg-[#F4EFEB] text-[#1B1718] hover:border-[#6b1d2f]'
                  }`}
                >
                  <span className="font-headline-sm text-headline-sm font-semibold">
                    {sz.label}
                  </span>
                  <span
                    className={`font-body-sm text-[11px] ${
                      isSelected ? 'text-[#FAF8F5]/80' : 'text-[#685E5A]'
                    }`}
                  >
                    {sz.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Modesty Confidence Pill */}
          <div className="flex items-center gap-2.5 rounded-lg border border-[#E5DDD5] bg-[#efe6e7]/70 p-3">
            <Icon name="verified" size={18} className="text-[#1B1718]" />
            <p className="font-body-sm text-body-sm text-[#1B1718]">
              <strong className="font-medium">Opaque &amp; Non-Cling Guarantee:</strong> Double-ply
              weave engineered for flawless silhouette modesty.
            </p>
          </div>
        </section>

        {/* Craftsmanship Accordions */}
        <section className="px-margin-mobile flex flex-col gap-2.5 pb-8">
          {/* Accordion 1 */}
          <details
            className="group overflow-hidden rounded-xl border border-[#E5DDD5]/70 bg-[#F4EFEB] shadow-2xs transition-all"
            open
          >
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 select-none">
              <div className="flex items-center gap-2.5">
                <Icon name="texture" size={20} className="text-[#1B1718]" />
                <span className="font-headline-sm text-headline-sm font-medium text-[#1B1718]">
                  Material &amp; Craftsmanship
                </span>
              </div>
              <Icon
                name="expand_more"
                size={20}
                className="text-[#685E5A] transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="font-body-md text-body-md flex flex-col gap-2.5 border-t border-[#E5DDD5]/40 px-4 pt-1 pb-4 text-[#544244]">
              <p>
                Crafted exclusively from 100% Bemberg™ Cupro yarn by Asahi Kasei, offering a
                botanical silk hand feel, cool-touch temperature regulation, and fluid vertical
                drape.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="font-label-sm rounded-full border border-[#E5DDD5] bg-[#FAF8F5] px-2.5 py-1 text-[11px] text-[#1B1718]">
                  Static-Free
                </span>
                <span className="font-label-sm rounded-full border border-[#E5DDD5] bg-[#FAF8F5] px-2.5 py-1 text-[11px] text-[#1B1718]">
                  Breathable Silk Drape
                </span>
                <span className="font-label-sm rounded-full border border-[#E5DDD5] bg-[#FAF8F5] px-2.5 py-1 text-[11px] text-[#1B1718]">
                  Subtle Tonal Sheen
                </span>
              </div>
            </div>
          </details>

          {/* Accordion 2 */}
          <details className="group overflow-hidden rounded-xl border border-[#E5DDD5]/70 bg-[#F4EFEB] shadow-2xs transition-all">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 select-none">
              <div className="flex items-center gap-2.5">
                <Icon name="styler" size={20} className="text-[#1B1718]" />
                <span className="font-headline-sm text-headline-sm font-medium text-[#1B1718]">
                  Modesty &amp; Silhouette Specs
                </span>
              </div>
              <Icon
                name="expand_more"
                size={20}
                className="text-[#685E5A] transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="font-body-md text-body-md flex flex-col gap-2 border-t border-[#E5DDD5]/40 px-4 pt-1 pb-4 text-[#544244]">
              <p>
                Generous flared A-line volume designed to prevent cling. Features 22 cm concealed
                forearm zippers for effortless wudhu ablution, deep side pockets, and an internal
                tie belt for optional waist shaping.
              </p>
              <ul className="text-body-sm font-body-sm list-inside list-disc space-y-1 pl-1 text-[#1B1718]">
                <li>100% non-sheer under direct studio flash and midday sunlight</li>
                <li>Reinforced neckline with discreet magnetic safety closure</li>
                <li>Subtle 0.5 cm self-stripe weave that visually elongates</li>
              </ul>
            </div>
          </details>

          {/* Accordion 3 */}
          <details className="group overflow-hidden rounded-xl border border-[#E5DDD5]/70 bg-[#F4EFEB] shadow-2xs transition-all">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 select-none">
              <div className="flex items-center gap-2.5">
                <Icon name="dry_cleaning" size={20} className="text-[#1B1718]" />
                <span className="font-headline-sm text-headline-sm font-medium text-[#1B1718]">
                  Care Guide
                </span>
              </div>
              <Icon
                name="expand_more"
                size={20}
                className="text-[#685E5A] transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="font-body-md text-body-md flex flex-col gap-2 border-t border-[#E5DDD5]/40 px-4 pt-1 pb-4 text-[#544244]">
              <p>
                Preserve the liquid drape: Delicate hand wash in cold water using silk-friendly
                detergent, or professional dry clean. Do not wring. Steam on reverse silk setting.
              </p>
            </div>
          </details>

          {/* Accordion 4 */}
          <details className="group overflow-hidden rounded-xl border border-[#E5DDD5]/70 bg-[#F4EFEB] shadow-2xs transition-all">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 select-none">
              <div className="flex items-center gap-2.5">
                <Icon name="local_shipping" size={20} className="text-[#1B1718]" />
                <span className="font-headline-sm text-headline-sm font-medium text-[#1B1718]">
                  Complimentary Shipping &amp; Returns
                </span>
              </div>
              <Icon
                name="expand_more"
                size={20}
                className="text-[#685E5A] transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="font-body-md text-body-md flex flex-col gap-1.5 border-t border-[#E5DDD5]/40 px-4 pt-1 pb-4 text-[#544244]">
              <p>
                Enjoy free express courier across Indonesia on all orders above IDR 2,000,000.
                14-day seamless complimentary size and styling exchange.
              </p>
            </div>
          </details>
        </section>

        {/* Complete The Look */}
        <section className="px-margin-mobile flex flex-col gap-3 pb-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-headline-sm text-headline-sm tracking-wider text-[#1B1718] uppercase">
              Complete The Look
            </h2>
            <span className="font-label-md text-label-md font-semibold text-[#1B1718]">
              Bundle &amp; Save 10%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Pair 1 */}
            <div className="group flex flex-col overflow-hidden rounded-xl border border-[#E5DDD5]/60 bg-[#F4EFEB] shadow-2xs">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#eae7e7]">
                <Image
                  src="/images/catalog/catalog-04.jpg"
                  alt="Modal Silk Hijab"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      id: 'noor-pleated-wrap',
                      title: 'Noor Pleated Wrap',
                      price: 289000,
                      color: 'Dusty Rose',
                      size: 'One Size',
                      image: '/images/catalog/catalog-04.jpg',
                      quantity: 1,
                    });
                    showToast('Added Noor Pleated Wrap to bag');
                  }}
                  className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#6b1d2f] text-[#FAF8F5] shadow-md transition-transform active:scale-90"
                >
                  <Icon name="add" size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <span className="font-label-sm text-[10px] text-[#685E5A] uppercase">
                  Modal Silk Hijab
                </span>
                <span className="font-headline-sm text-headline-sm truncate font-medium text-[#1B1718]">
                  Noor Pleated Wrap
                </span>
                <span className="font-body-sm text-body-sm font-semibold text-[#1B1718]">
                  Rp 289,000
                </span>
              </div>
            </div>

            {/* Pair 2 */}
            <div className="group flex flex-col overflow-hidden rounded-xl border border-[#E5DDD5]/60 bg-[#F4EFEB] shadow-2xs">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#eae7e7]">
                <Image
                  src="/images/catalog/catalog-15.jpg"
                  alt="Sculpted Leather Obi"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      id: 'sculpted-leather-obi',
                      title: 'Sculpted Leather Obi',
                      price: 449000,
                      color: 'Cognac',
                      size: 'One Size',
                      image: '/images/catalog/catalog-15.jpg',
                      quantity: 1,
                    });
                    showToast('Added Sculpted Leather Obi to bag');
                  }}
                  className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#6b1d2f] text-[#FAF8F5] shadow-md transition-transform active:scale-90"
                >
                  <Icon name="add" size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <span className="font-label-sm text-[10px] text-[#685E5A] uppercase">
                  Accessory
                </span>
                <span className="font-headline-sm text-headline-sm truncate font-medium text-[#1B1718]">
                  Sculpted Leather Obi
                </span>
                <span className="font-body-sm text-body-sm font-semibold text-[#1B1718]">
                  Rp 449,000
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="px-margin-mobile pb-safe fixed right-0 bottom-0 left-0 z-40 border-t border-[#E5DDD5] bg-[#FAF8F5]/95 py-3 shadow-[0_-4px_16px_rgba(27,23,24,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          {/* Quantity Stepper */}
          <div className="flex h-12 items-center rounded-lg border border-[#E5DDD5] bg-[#F4EFEB] px-1">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-full w-8 items-center justify-center text-[#1B1718] transition-colors hover:text-[#6b1d2f] active:scale-90"
            >
              <Icon name="remove" size={18} />
            </button>
            <span className="font-headline-sm text-headline-sm w-6 text-center font-semibold text-[#1B1718]">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-full w-8 items-center justify-center text-[#1B1718] transition-colors hover:text-[#6b1d2f] active:scale-90"
            >
              <Icon name="add" size={18} />
            </button>
          </div>

          {/* Add to Bag CTA */}
          <button
            type="button"
            onClick={handleAddToBag}
            className="font-label-lg text-label-lg flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#6b1d2f] font-medium tracking-wider text-[#FAF8F5] uppercase shadow-md transition-all hover:bg-[#5a1224] active:scale-[0.98]"
          >
            <Icon name="shopping_bag" size={18} />
            <span>Add to Bag &mdash; Rp {totalPrice.toLocaleString('id-ID')}</span>
          </button>

          {/* Instant Buy button */}
          <button
            type="button"
            aria-label="Instant Checkout"
            onClick={handleInstantBuy}
            title="Instant Checkout"
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#E5DDD5] bg-[#F4EFEB] text-[#1B1718] shadow-2xs transition-all hover:border-[#6b1d2f] hover:text-[#6b1d2f] active:scale-95"
          >
            <Icon name="bolt" size={20} />
          </button>
        </div>
      </div>

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B1718]/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E5DDD5] bg-[#FAF8F5] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5DDD5] pb-4">
              <h3 className="font-headline-md text-headline-md text-[#1B1718]">
                Silhouette &amp; Size Guide
              </h3>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="text-[#685E5A] hover:text-[#1B1718]"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="text-body-sm flex flex-col gap-3 py-4 text-[#544244]">
              <p>
                Our abayas are designed with an intentionally generous, fluid drape to ensure
                complete modesty and breathable comfort in tropical climates.
              </p>
              <table className="text-body-sm w-full overflow-hidden rounded border border-[#E5DDD5] text-left">
                <thead className="font-label-sm bg-[#F4EFEB] uppercase">
                  <tr>
                    <th className="border-b border-[#E5DDD5] p-2">Size</th>
                    <th className="border-b border-[#E5DDD5] p-2">Bust</th>
                    <th className="border-b border-[#E5DDD5] p-2">Length</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#E5DDD5]">
                    <td className="p-2 font-medium">XS</td>
                    <td className="p-2">96 cm</td>
                    <td className="p-2">138 cm</td>
                  </tr>
                  <tr className="border-b border-[#E5DDD5]">
                    <td className="p-2 font-medium">S&ndash;M</td>
                    <td className="p-2">104 cm</td>
                    <td className="p-2">142 cm</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">L&ndash;XL</td>
                    <td className="p-2">116 cm</td>
                    <td className="p-2">145 cm</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[11px] text-[#685E5A]">
                Need custom sleeve length or bust alterations? Select &ldquo;Custom Fit&rdquo; or
                contact our WhatsApp styling concierge.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSizeGuideOpen(false)}
              className="font-label-md h-11 w-full rounded bg-[#6b1d2f] font-medium tracking-wider text-[#FAF8F5] uppercase"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
