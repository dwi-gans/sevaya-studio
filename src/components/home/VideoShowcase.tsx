'use client';

import React, { useRef, useEffect } from 'react';

export function VideoShowcase({
  src = '/videos/kani.mp4',
}: {
  src?: string;
  poster?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Efisien: Autoplay & loop hanya saat video masuk ke layar (viewport).
  // Saat discroll keluar layar, video otomatis dijeda (pause) untuk membebaskan
  // 100% beban GPU hardware decoder, menjamin scrolling halaman tetap mulus 60/120fps.
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    video.muted = true;

    if (typeof IntersectionObserver === 'undefined') {
      video.play().catch(() => {});
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  return (
    <section className="mx-auto w-full max-w-[1360px] px-3 pb-3 sm:px-6 sm:pb-6 lg:px-8">
      <div
        ref={containerRef}
        className="relative aspect-[16/10] w-full overflow-hidden bg-black shadow-sm sm:aspect-[16/9] md:aspect-[21/9]"
      >
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          className="pointer-events-none h-full w-full select-none object-cover"
        />
      </div>
    </section>
  );
}
