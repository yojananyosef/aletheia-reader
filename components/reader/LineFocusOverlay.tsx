'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { LineFocusMode } from '@/types/bible';
import { ChevronUp, ChevronDown, Lock, MousePointer } from 'lucide-react';

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

  // State to track whether line is fixed (locked) or actively following the mouse
  // Default: follows mouse (isLocked = false)
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Determine aperture height in pixels based on mode (1, 3, or 5 lines)
  const lineMultiplier = mode === '1-line' ? 1 : mode === '3-line' ? 3 : mode === '5-line' ? 5 : 0;
  const singleLinePx = fontSize * lineHeight;
  const apertureHeight = singleLinePx * lineMultiplier + (lineMultiplier > 1 ? 16 : 8);

  const moveUp = useCallback(() => {
    setWindowCenterY((prev) => Math.max(60, prev - singleLinePx));
  }, [singleLinePx]);

  const moveDown = useCallback(() => {
    if (typeof window !== 'undefined') {
      setWindowCenterY((prev) => Math.min(window.innerHeight - 60, prev + singleLinePx));
    }
  }, [singleLinePx]);

  // Follow mouse position when not locked
  useEffect(() => {
    if (mode === 'off' || isLocked) return;

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const minY = Math.max(50, apertureHeight / 2);
        const maxY = Math.max(minY, (window.innerHeight || 800) - apertureHeight / 2 - 50);
        const clampedY = Math.max(minY, Math.min(maxY, e.clientY));
        setWindowCenterY(clampedY);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [mode, isLocked, apertureHeight]);

  // Keyboard navigation & locking toggle (Space = toggle lock, ArrowUp/ArrowDown = move line when locked or auto-lock)
  useEffect(() => {
    if (mode === 'off') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) ||
        target?.isContentEditable
      ) {
        return;
      }

      // Spacebar: Toggle between fixed (locked) mode and mouse follow mode
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsLocked((prev) => !prev);
        return;
      }

      // Arrow navigation for line focus (Up / Down with or without Alt)
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIsLocked(true);
        moveUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIsLocked(true);
        moveDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, moveUp, moveDown]);

  if (mode === 'off') return null;

  const topMaskHeight = Math.max(0, windowCenterY - apertureHeight / 2);
  const bottomMaskTop = windowCenterY + apertureHeight / 2;

  // Use instant movement when following mouse, and smooth transition when fixed/stepping with keys
  const transitionClass = isLocked ? 'transition-all duration-150 ease-out' : 'transition-none';

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {/* Top Mask */}
      <div
        className={`absolute left-0 right-0 top-0 bg-black/65 backdrop-blur-[0.5px] ${transitionClass}`}
        style={{ height: `${topMaskHeight}px` }}
      />

      {/* Focus Aperture Highlight Window */}
      <div
        className={`absolute left-0 right-0 border-y border-amber-600/40 bg-amber-500/[0.03] shadow-[0_0_20px_rgba(0,0,0,0.2)] ${transitionClass}`}
        style={{
          top: `${topMaskHeight}px`,
          height: `${apertureHeight}px`,
        }}
      >
        {/* Floating Line Focus Nav & Lock Buttons (Interactive & Compact on Mobile) */}
        <div className="pointer-events-auto absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 rounded-full bg-neutral-900/85 p-0.5 sm:p-1 text-white shadow-xl backdrop-blur-md border border-white/10">
          <button
            type="button"
            onClick={() => {
              setIsLocked(true);
              moveUp();
            }}
            aria-label="Mover enfoque de línea hacia arriba"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-95 text-white/90 hover:text-white"
            title="Subir línea (Flecha Arriba)"
          >
            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Mode toggle button (Mouse Follow vs Fixed) */}
          <button
            type="button"
            onClick={() => setIsLocked((prev) => !prev)}
            aria-label={isLocked ? 'Desbloquear y seguir ratón (Espacio)' : 'Fijar línea en posición actual (Espacio)'}
            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all active:scale-95 ${
              isLocked
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                : 'text-white/80 hover:bg-white/20 hover:text-white'
            }`}
            title={
              isLocked
                ? 'Línea fija. Clic o [Espacio] para seguir ratón'
                : 'Siguiendo ratón. Clic o [Espacio] para fijar'
            }
          >
            {isLocked ? (
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <MousePointer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLocked(true);
              moveDown();
            }}
            aria-label="Mover enfoque de línea hacia abajo"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-95 text-white/90 hover:text-white"
            title="Bajar línea (Flecha Abajo)"
          >
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Bottom Mask */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-black/65 backdrop-blur-[0.5px] ${transitionClass}`}
        style={{ top: `${bottomMaskTop}px` }}
      />
    </div>
  );
};
