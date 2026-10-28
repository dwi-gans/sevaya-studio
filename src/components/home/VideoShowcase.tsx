'use client';

import React, { useRef, useEffect } from 'react';

export function VideoShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.play().catch(() => {});

    // Ensure endless looping and continuous playback without any interruption
    const handleEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    const handlePause = () => {
      video.play().catch(() => {});
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pb-3 sm:px-6 sm:pb-6 lg:px-8">
      {/* Pure Cinematic Video Screen: 100% clean, no buttons, no overlays (Tazalabel standard) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black shadow-sm sm:aspect-[16/9] md:aspect-[21/9]">
        <video
          ref={videoRef}
          src="/videos/kani.mp4"
          poster="/images/figma_video_cover.png"
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
