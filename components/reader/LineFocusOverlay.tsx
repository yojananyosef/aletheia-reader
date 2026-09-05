'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LineFocusMode } from '@/types/bible';

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
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Track active touch drag — disables CSS transitions for instant movement.
  // Ref drives handler logic; state mirror drives render (refs can't be read during render).
  const isDragging = useRef<boolean>(false);
  const [isDraggingState, setIsDraggingState] = useState<boolean>(false);

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
  const rootRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const touchActive = useRef<boolean>(false);
  const touchRafId = useRef<number | null>(null);
  const lastRafTime = useRef<number>(0);
  const forwardDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forwardPointerEvent = useCallback((clientX: number, clientY: number, type: 'click') => {
    if (forwardDebounceRef.current) clearTimeout(forwardDebounceRef.current);
    forwardDebounceRef.current = setTimeout(() => {
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
    }, 16);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchStartTime.current = Date.now();
    touchActive.current = true;
    isDragging.current = false;
    setIsDraggingState(false);
    // Position immediately on touch, but don't lock yet — wait for movement threshold
    setWindowCenterY(clampY(t.clientY));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchActive.current) return;
    // touch-none ya evita scroll; no llamar preventDefault para no disparar warning passive
    const t = e.touches[0];
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    if (startX === null || startY === null) return;

    const deltaY = Math.abs(t.clientY - startY);
    const deltaX = Math.abs(t.clientX - startX);

    // Only activate vertical drag after 8px of vertical movement (avoids conflict with taps/horizontal swipe)
    if (!isDragging.current && deltaY > 8 && deltaY > deltaX * 1.5) {
      isDragging.current = true;
      setIsDraggingState(true);
      setIsLocked(true);
    }

    if (!isDragging.current) return;

    // Throttle RAF to max once per 16ms (~60fps) for smooth but efficient updates
    const now = Date.now();
    if (touchRafId.current !== null && now - lastRafTime.current < 16) return;

    if (touchRafId.current !== null) cancelAnimationFrame(touchRafId.current);
    touchRafId.current = requestAnimationFrame(() => {
      lastRafTime.current = Date.now();
      setWindowCenterY(clampY(t.clientY));
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchActive.current) return;
    touchActive.current = false;

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

    // If we were dragging, just end — don't forward anything
    if (isDragging.current) {
      isDragging.current = false;
      setIsDraggingState(false);
      return;
    }

    // Horizontal flick -> page turn
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35 && deltaTime < 600) {
      if (deltaX < 0) {
        onSwipeNext?.();
      } else {
        onSwipePrev?.();
      }
      return;
    }

    // Tap (minimal movement, short time) -> forward click to content below
    if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8 && deltaTime < 300) {
      forwardPointerEvent(t.clientX, t.clientY, 'click');
    }
  };

  // Forward mouse clicks on coarse-pointer (touch) devices to the content below
  const handleClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    forwardPointerEvent(e.clientX, e.clientY, 'click');
  };

  // Keyboard navigation & locking toggle
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

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsLocked((prev) => !prev);
        return;
      }

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

  // No transitions during active drag — instant position update
  const transitionClass = isDraggingState
    ? 'transition-none'
    : isLocked
    ? 'transition-all duration-150 ease-out'
    : 'transition-none';

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

      {/* Focus Aperture — solo resalte, sin controles flotantes (quitan visión) */}
      <div
        className={`absolute left-0 right-0 border-y border-amber-600/40 bg-amber-500/[0.03] shadow-[0_0_20px_rgba(0,0,0,0.2)] ${transitionClass}`}
        style={{
          top: `${topMaskHeight}px`,
          height: `${apertureHeight}px`,
        }}
      />

      {/* Bottom Mask */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-black/65 backdrop-blur-[0.5px] ${transitionClass}`}
        style={{ top: `${bottomMaskTop}px` }}
      />
    </div>
  );
};
