'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { LineFocusMode } from '@/types/bible';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface LineFocusOverlayProps {
  mode: LineFocusMode;
  fontSize: number;
  lineHeight: number;
}

export const LineFocusOverlay: React.FC<LineFocusOverlayProps> = ({
  mode,
  fontSize,
  lineHeight,
}) => {
  const [windowCenterY, setWindowCenterY] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight / 2;
    }
    return 300;
  });

  // Determine aperture height in pixels based on mode (1, 3, or 5 lines)
  const lineMultiplier = mode === '1-line' ? 1 : mode === '3-line' ? 3 : mode === '5-line' ? 5 : 0;
  const singleLinePx = fontSize * lineHeight;
  const apertureHeight = singleLinePx * lineMultiplier + (lineMultiplier > 1 ? 16 : 8);

  const moveUp = useCallback(() => {
    setWindowCenterY((prev) => Math.max(120, prev - singleLinePx));
  }, [singleLinePx]);

  const moveDown = useCallback(() => {
    if (typeof window !== 'undefined') {
      setWindowCenterY((prev) => Math.min(window.innerHeight - 120, prev + singleLinePx));
    }
  }, [singleLinePx]);

  // Keyboard navigation for line focus (Alt + Up / Down)
  useEffect(() => {
    if (mode === 'off') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowUp' && e.altKey) {
        e.preventDefault();
        moveUp();
      } else if (e.key === 'ArrowDown' && e.altKey) {
        e.preventDefault();
        moveDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, moveUp, moveDown]);

  if (mode === 'off') return null;

  const topMaskHeight = Math.max(0, windowCenterY - apertureHeight / 2);
  const bottomMaskTop = windowCenterY + apertureHeight / 2;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {/* Top Mask */}
      <div
        className="absolute left-0 right-0 top-0 bg-black/65 backdrop-blur-[0.5px] transition-all duration-150"
        style={{ height: `${topMaskHeight}px` }}
      />

      {/* Focus Aperture Highlight Window */}
      <div
        className="absolute left-0 right-0 border-y border-amber-600/40 bg-amber-500/[0.03] transition-all duration-150 shadow-[0_0_20px_rgba(0,0,0,0.2)]"
        style={{
          top: `${topMaskHeight}px`,
          height: `${apertureHeight}px`,
        }}
      >
        {/* Floating Line Focus Nav Buttons (Interactive) */}
        <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 rounded-full bg-neutral-900/80 p-1 text-white shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={moveUp}
            aria-label="Mover enfoque de línea hacia arriba"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-95"
            title="Subir línea (Alt + Flecha Arriba)"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={moveDown}
            aria-label="Mover enfoque de línea hacia abajo"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-95"
            title="Bajar línea (Alt + Flecha Abajo)"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bottom Mask */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-black/65 backdrop-blur-[0.5px] transition-all duration-150"
        style={{ top: `${bottomMaskTop}px` }}
      />
    </div>
  );
};
