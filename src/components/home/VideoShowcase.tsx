'use client';

import React, { useRef, useEffect } from 'react';

export function VideoShowcase({
  src = '/videos/kani.mp4',
  poster = '/images/figma_video_cover.png',
}: {
  src?: string;
  poster?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

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

    // Lazy-load: only load & play video when it enters the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (video.preload !== 'auto') {
              video.preload = 'auto';
              video.load();
            }
            video.muted = true;
            video.play().catch(() => {});
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pb-3 sm:px-6 sm:pb-6 lg:px-8">
      {/* Pure Cinematic Video Screen: 100% clean, no buttons, no overlays (Tazalabel standard) */}
      <div ref={containerRef} className="relative aspect-[16/10] w-full overflow-hidden bg-black shadow-sm sm:aspect-[16/9] md:aspect-[21/9]">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          className="pointer-events-none h-full w-full select-none object-cover"
        />
      </div>
    </section>
  );
}
