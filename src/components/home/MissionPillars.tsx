import React from 'react';
import Link from 'next/link';
import { Icon, IconName } from '@/components/ui/Icon';

interface MissionPillarsProps {
  bgImage?: string;
  showcaseTitle?: string;
}

export function MissionPillars({
  bgImage = '/images/catalog/catalog-06.jpg',
  showcaseTitle = 'The Future Wears What We Choose Today',
}: MissionPillarsProps) {
  const pillars: { icon: IconName; title: string; desc: string }[] = [
    {
      icon: 'style',
      title: 'Consciously Designed',
      desc: 'Timeless, value-driven silhouettes',
    },
    {
      icon: 'handshake',
      title: 'Consciously Crafted',
      desc: 'Ethical production & artisan partnerships',
    },
    {
      icon: 'hourglass_top',
      title: 'Consciously Enduring',
      desc: 'Seasonless, durable investment pieces',
    },
    {
      icon: 'visibility',
      title: 'Consciously Transparent',
      desc: 'Openness on materials & origins',
    },
  ];

  return (
    <div className="flex w-full flex-col">
      {/* Brand Mission Statement */}
      <section className="px-margin-mobile flex w-full flex-col items-center bg-[#FAF8F5] py-12 text-center">
        <div className="mb-4 h-0.5 w-12 rounded-full bg-[#1B1718]/30" />
        <p className="font-headline-md mb-6 max-w-xl leading-relaxed font-normal text-[#1B1718] md:text-xl">
          <strong className="font-semibold text-[#1B1718]">Sevaya</strong> aims to redefine
          women&rsquo;s attire as not only modest, but comfortable, timeless, and globally relevant
          by envisioning women&rsquo;s choice, embracing their character and taste, and honoring the
          virtues of our deen.
        </p>
        <div className="flex items-center gap-6">
          <Link
            className="font-label-md text-label-md tracking-wider text-[#1B1718] uppercase underline underline-offset-4 hover:text-[#6b1d2f]"
            href="/conscious"
          >
            About Us
          </Link>
          <span className="h-1.5 w-1.5 rounded-full bg-[#877274]" />
          <Link
            className="font-label-md text-label-md tracking-wider text-[#1B1718] uppercase underline underline-offset-4 hover:text-[#6b1d2f]"
            href="/conscious"
          >
            Our Values
          </Link>
        </div>
      </section>

      {/* #SEVAYAConscious Pillars */}
      <section className="px-margin-mobile flex w-full flex-col bg-[#EFECE6]/60 py-12">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-8 text-center">
            <span className="font-label-sm text-label-sm mb-1 block font-semibold tracking-[0.2em] text-[#685E5A] uppercase">
              Our Commitment
            </span>
            <h2 className="font-headline-lg-mobile text-[#1B1718] md:text-3xl">#SEVAYAConscious</h2>
            <p className="font-body-sm text-body-sm mx-auto mt-2 max-w-sm text-[#6E6760]">
              We embrace women from all walks of life, accompanying them on their journey towards
              conscious living.
            </p>
          </div>

          {/* 4 Value Pillar Cards */}
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="flex flex-col items-start rounded-xl border border-[#E5DDD5]/60 bg-[#FAF8F5] p-5 shadow-2xs transition-all hover:border-[#6b1d2f]/40"
              >
                <div className="mb-2.5 text-[#685E5A]">
                  <Icon name={pillar.icon} size={24} />
                </div>
                <h4 className="font-headline-sm text-headline-sm mb-1 font-medium tracking-wider text-[#1B1718] uppercase">
                  {pillar.title}
                </h4>
                <p className="font-body-sm text-body-sm leading-snug text-[#6E6760] italic">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Fabric Materials Showcase Card */}
          <div className="relative flex min-h-[260px] w-full flex-col justify-end overflow-hidden rounded-2xl border border-[#E5DDD5] p-6 shadow-sm md:min-h-[320px] md:p-10">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${bgImage}')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1B1718]/95 via-[#1B1718]/70 to-[#1B1718]/30" />
            <div className="relative z-10 max-w-2xl text-[#ffffff]">
              <p className="font-label-md text-label-md mb-1.5 font-semibold tracking-widest text-[#FAF8F5]/80 uppercase">
                Signature Textiles
              </p>
              <h3 className="font-headline-md mb-2 font-medium text-[#FAF8F5] md:text-2xl">
                {showcaseTitle}
              </h3>
              <p className="font-body-sm text-body-sm mb-5 leading-relaxed font-light text-[#F3EFEA]/90 md:text-base">
                Each fabric is chosen with care, designed to endure, whilst upholding our aim of
                mindful living. In every weave and thread, we seek to honor both the body it covers
                and the world it comes from.
              </p>
              {/* Fabric Pill badges */}
              <div className="flex flex-wrap gap-2">
                {['Bemberg™ Cupro', 'TENCEL™ Lyocell', 'Pure Belgian Linen', 'Mulberry Silk'].map(
                  (fabric) => (
                    <span
                      key={fabric}
                      className="font-label-sm text-label-sm rounded-full border border-[#FAF8F5]/30 bg-[#FAF8F5]/20 px-3 py-1 tracking-wider text-[#FAF8F5] uppercase backdrop-blur-md"
                    >
                      {fabric}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
