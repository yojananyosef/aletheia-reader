'use client';

import React from 'react';
import { ThemeMode } from '@/types/bible';

interface PaperGrainOverlayProps {
  theme: ThemeMode;
}

export const PaperGrainOverlay: React.FC<PaperGrainOverlayProps> = ({ theme }) => {
  const isDark = theme === 'noche';

  return (
    <>
      {/* SVG procedural filter definition */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0 }}
      >
        <defs>
          <filter id="paperNoiseFilter" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.1   0 0 0 0 0.1   0 0 0 0 0.1  0 0 0 0.06 0"
              result="coloredNoise"
            />
            <feBlend mode={isDark ? 'screen' : 'multiply'} in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>
      </svg>

      {/* Procedural Grain Overlay Layer */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-300 ${
          isDark
            ? 'opacity-[0.04] mix-blend-screen'
            : 'opacity-[0.06] mix-blend-multiply'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </>
  );
};
