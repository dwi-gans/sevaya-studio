'use client';

import React, { useEffect, useState } from 'react';

import { useLanguage } from '@/context/LanguageContext';

export function CountdownTicker() {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 19,
    seconds: 17,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const format = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="px-margin-mobile flex w-full items-center justify-center gap-2.5 border-b border-[#E5DDD5]/60 bg-[#F4EFEB] py-2.5">
      <span className="font-label-sm text-label-sm tracking-widest text-[#685E5A] uppercase">
        {t('home.countdown_ends')}
      </span>
      <div className="font-label-md text-label-md flex items-center gap-1 font-medium tracking-tight text-[#1B1718]">
        <span className="rounded-md border border-[#E5DDD5] bg-[#FAF8F5] px-1.5 py-0.5 shadow-2xs">
          {format(timeLeft.days)}d
        </span>
        <span className="font-bold text-[#877274]">:</span>
        <span className="rounded-md border border-[#E5DDD5] bg-[#FAF8F5] px-1.5 py-0.5 shadow-2xs">
          {format(timeLeft.hours)}h
        </span>
        <span className="font-bold text-[#877274]">:</span>
        <span className="rounded-md border border-[#E5DDD5] bg-[#FAF8F5] px-1.5 py-0.5 shadow-2xs">
          {format(timeLeft.minutes)}m
        </span>
        <span className="font-bold text-[#877274]">:</span>
        <span className="rounded-md border border-[#6b1d2f]/30 bg-[#FAF8F5] px-1.5 py-0.5 font-semibold text-[#6b1d2f] shadow-2xs">
          {format(timeLeft.seconds)}s
        </span>
      </div>
    </div>
  );
}
