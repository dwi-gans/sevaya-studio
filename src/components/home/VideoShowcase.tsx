'use client';

import React, { useRef, useEffect } from 'react';

export function VideoShowcase({
  src = '/videos/kani.mp4',
  poster = '/images/kani_poster.webp',
}: {
  src?: string;
  poster?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Normalize poster: cegah poster mockup dummy lama (/images/figma_video_cover.png)
  const activePoster =
    poster && poster !== '/images/figma_video_cover.png'
      ? poster
      : '/images/kani_poster.webp';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };
    const handlePause = () => {
      video.play().catch(() => {});
    };
    video.addEventListener('ended', handleEnded);
    video.addEventListener('pause', handlePause);

    // Langsung unduh dan mainkan sejak awal beranda diakses (tanpa nunggu scroll)
    video.preload = 'auto';
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pb-3 sm:px-6 sm:pb-6 lg:px-8">
      <div
        ref={containerRef}
        className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 shadow-sm sm:aspect-[16/9] md:aspect-[21/9]"
      >
        <video
          ref={videoRef}
          src={src}
          poster={activePoster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="pointer-events-none h-full w-full select-none object-cover"
        />
      </div>
    </section>
  );
}
