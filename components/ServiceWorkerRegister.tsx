'use client';

import { useEffect } from 'react';
import { Serwist } from '@serwist/window';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const serwist = new Serwist('/sw.js', {
        scope: '/',
      });
      serwist.register();
    }
  }, []);

  return null;
}
