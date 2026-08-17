import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alethia Reader - Lector Bíblico de Alto Confort',
    short_name: 'Alethia',
    description: 'Lector bíblico con emulación de tinta electrónica, accesibilidad WCAG 2.2 AAA y narración por voz.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDFBF6',
    theme_color: '#FDFBF6',
    orientation: 'portrait-primary',
    categories: ['books', 'education', 'accessibility'],
    lang: 'es',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
