'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LineFocusMode } from '@/types/bible';
import { ChevronUp, ChevronDown, Lock, MousePointer } from 'lucide-react';

interface LineFocusOverlayProps {
  mode: LineFocusMode;
  fontSize: number;
  lineHeight: number;
  onSwipePrev?: () => void;
  onSwipeNext?: () => void;
}

export const LineFocusOverlay: React.FC<LineFocusOverlayProps> = ({
  mode,
  fontSize,
  lineHeight,
  onSwipePrev,
  onSwipeNext,
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

  // Clamp the aperture center to keep it fully visible on screen
  const clampY = useCallback(
    (y: number) => {
      const minY = Math.max(50, apertureHeight / 2);
      const maxY = Math.max(minY, (window.innerHeight || 800) - apertureHeight / 2 - 50);
      return Math.max(minY, Math.min(maxY, y));
    },
    [apertureHeight]
  );

  // Follow mouse position when not locked
  useEffect(() => {
    if (mode === 'off' || isLocked) return;

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setWindowCenterY(clampY(e.clientY));
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [mode, isLocked, clampY]);

  // --- Touch Drag Support (Mobile / Coarse Pointers) ---
  // Press and hold with the thumb anywhere on the screen to guide the focus
  // line; vertical movement moves the aperture, a horizontal flick turns pages.
  const rootRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const touchActive = useRef<boolean>(false);
  const touchRafId = useRef<number | null>(null);

  const forwardPointerEvent = useCallback((clientX: number, clientY: number, type: 'click') => {
    const layer = rootRef.current;
    if (!layer) return;
    const prevPointerEvents = layer.style.pointerEvents;
    layer.style.pointerEvents = 'none';
    const el = document.elementFromPoint(clientX, clientY);
    layer.style.pointerEvents = prevPointerEvents;
    if (el && el !== layer) {
      el.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
        })
      );
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchStartTime.current = Date.now();
    touchActive.current = true;
    setIsLocked(true);
    setWindowCenterY(clampY(t.clientY));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchActive.current) return;
    e.preventDefault();
    const t = e.touches[0];
    if (touchRafId.current !== null) cancelAnimationFrame(touchRafId.current);
    touchRafId.current = requestAnimationFrame(() => {
      setWindowCenterY(clampY(t.clientY));
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchActive.current) return;
    touchActive.current = false;
    // Suppress the browser's native synthesized click: we forward our own
    // synthetic click below when the touch was a tap.
    e.preventDefault();
    if (touchRafId.current !== null) {
      cancelAnimationFrame(touchRafId.current);
      touchRafId.current = null;
    }
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    const t = e.changedTouches[0];
    touchStartX.current = null;
    touchStartY.current = null;
    if (startX === null || startY === null) return;

    const deltaX = t.clientX - startX;
    const deltaY = t.clientY - startY;
    const deltaTime = Date.now() - touchStartTime.current;

    // Horizontal flick -> page turn (kept working while Line Focus is active)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35 && deltaTime < 600) {
      if (deltaX < 0) {
        onSwipeNext?.();
      } else {
        onSwipePrev?.();
      }
      return;
    }

    // Tap (no movement) -> forward a synthetic click to the reading canvas
    // so verse selection and tap zones keep working below the overlay.
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 500) {
      forwardPointerEvent(t.clientX, t.clientY, 'click');
    }
  };

  // Forward mouse clicks on coarse-pointer (touch) devices to the content below
  const handleClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    forwardPointerEvent(e.clientX, e.clientY, 'click');
  };

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
    <div
      ref={rootRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className="pointer-events-none pointer-coarse:pointer-events-auto fixed inset-0 z-30 touch-none overflow-hidden"
    >
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
