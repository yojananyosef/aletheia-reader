'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    let cancelled = false;

    const notifyUpdate = () => {
      if (cancelled) return;
      setUpdateAvailable(true);
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    };

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // A new SW is already waiting (e.g. installed while page was open)
        if (reg.waiting && navigator.serviceWorker.controller) {
          notifyUpdate();
        }
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            // Installed but an older SW still controls the page → update ready
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdate();
            }
          });
        });
      })
      .catch(() => {
        // SW registration failed silently
      });

    // Fires when the new SW takes control after skipWaiting
    const onControllerChange = () => {
      if (!cancelled) setUpdateAvailable(false);
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 rounded-full border border-[var(--reader-border)] bg-neutral-900 text-white text-xs font-medium pl-4 pr-2 py-1.5 shadow-2xl"
    >
      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
      <span>Nueva versión disponible</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-white/15 hover:bg-white/25 transition-colors px-3 py-1.5 font-bold min-h-[32px]"
      >
        Recargar
      </button>
    </div>
  );
}
