import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light' | 'burgundy';
  showSubtitle?: boolean;
}

export function Logo({ className = 'h-7 w-auto', variant = 'dark' }: LogoProps) {
  const primaryColor =
    variant === 'light' ? '#FAF8F5' : variant === 'burgundy' ? '#6b1d2f' : '#141312';

  return (
    <svg
      viewBox="0 0 260 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SEVAYA"
    >
      <text
        x="50%"
        y="25"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={primaryColor}
        style={{
          fontFamily:
            'var(--font-dm-sans), "Plus Jakarta Sans", "Inter", "Century Gothic", -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: '24px',
          fontWeight: 500,
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
        }}
      >
        SEVAYA
      </text>
    </svg>
  );
}
