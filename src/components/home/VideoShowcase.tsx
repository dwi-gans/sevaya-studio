'use client';

import React, { useRef, useEffect, useState } from 'react';

export function VideoShowcase({
  src = '/videos/kani.mp4',
  poster = '/images/kani_poster.webp',
}: {
  src?: string;
  poster?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Video hanya di-load saat masuk viewport (lazy) — tidak makan bandwidth saat halaman baru buka
  const [shouldLoad, setShouldLoad] = useState(false);

  // Normalize poster: cegah poster mockup dummy lama (/images/figma_video_cover.png)
  const activePoster =
    poster && poster !== '/images/figma_video_cover.png'
      ? poster
      : '/images/kani_poster.webp';

  // IntersectionObserver: load video hanya saat container masuk viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }, // preload 200px sebelum masuk layar
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Autoplay setelah video di-load ke DOM
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    const handleEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    video.addEventListener('ended', handleEnded);

    // Set preload metadata dulu agar poster tampil, lalu play
    video.preload = 'metadata';
    video.muted = true;
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [shouldLoad]);

  return (
    <section className="mx-auto w-full max-w-[1360px] px-3 pb-3 sm:px-6 sm:pb-6 lg:px-8">
      <div
        ref={containerRef}
        className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 shadow-sm sm:aspect-[16/9] md:aspect-[21/9]"
      >
        {shouldLoad ? (
          <video
            ref={videoRef}
            src={src}
            poster={activePoster}
            muted
            loop
            playsInline
            preload="metadata"
            className="pointer-events-none h-full w-full select-none object-cover"
          />
        ) : (
          /* Tampilkan poster sebagai placeholder sampai video di-load */
          <img
            src={activePoster}
            alt="SEVAYA Video Showcase"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
    </section>
  );
}
