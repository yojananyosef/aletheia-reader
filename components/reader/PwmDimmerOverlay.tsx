'use client';

import React from 'react';

interface PwmDimmerOverlayProps {
  brightness: number; // 0.3 to 1.0 (1.0 = 100% full software brightness)
}

export const PwmDimmerOverlay: React.FC<PwmDimmerOverlayProps> = ({ brightness }) => {
  // If brightness is 1.0, no dimming overlay is applied
  if (brightness >= 0.99) {
    return null;
  }

  // Calculate black overlay opacity proportional to dimming amount
  // 1.0 -> 0 opacity
  // 0.3 -> 0.7 opacity
  const dimOpacity = Math.max(0, Math.min(0.75, 1 - brightness));

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-150"
      style={{
        backgroundColor: '#000000',
        opacity: dimOpacity,
      }}
    />
  );
};
