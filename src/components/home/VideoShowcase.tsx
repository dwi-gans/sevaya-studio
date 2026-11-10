'use client';

import React, { useRef, useEffect } from 'react';

export function VideoShowcase({
  src = '/videos/kani.mp4',
}: {
  src?: string;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pastikan video langsung autoplay & loop tanpa jeda poster
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback jika browser membatasi autoplay
      });
    }
  }, [src]);

  return (
    <section className="mx-auto w-full max-w-[1360px] px-3 pb-3 sm:px-6 sm:pb-6 lg:px-8">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black shadow-sm sm:aspect-[16/9] md:aspect-[21/9]">
        <video
          ref={videoRef}
          src={src}
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
