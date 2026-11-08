'use client';

import React, { useRef, useEffect, useState } from 'react';

export function VideoShowcase({
  src = '/videos/kani.mp4',
  poster = '/images/figma_video_cover.png',
}: {
  src?: string;
  poster?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // isPlaying: true setelah video benar-benar mulai bermain
  // → sembunyikan poster/placeholder dummy sampai video muncul
  const [isPlaying, setIsPlaying] = useState(false);

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
    const handlePlaying = () => {
      setIsPlaying(true);
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('pause', handlePause);
    video.addEventListener('playing', handlePlaying);

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
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pb-3 sm:px-6 sm:pb-6 lg:px-8">
      {/* Pure Cinematic Video Screen: 100% clean, no buttons, no overlays */}
      <div ref={containerRef} className="relative aspect-[16/10] w-full overflow-hidden bg-black shadow-sm sm:aspect-[16/9] md:aspect-[21/9]">
        {/* Overlay hitam solid saat video belum siap — cegah poster/placeholder muncul */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black z-10 pointer-events-none" />
        )}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          className={`pointer-events-none h-full w-full select-none object-cover transition-opacity duration-500 ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </section>
  );
}
