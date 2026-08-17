import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Alethia Reader - Lector Bíblico de Alto Confort y Tinta Electrónica",
  description: "Componente de lectura bíblica modular, responsivo y de alto rendimiento con emulación de tinta electrónica, accesibilidad WCAG 2.2 AAA y mitigación de fatiga visual.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alethia",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFBF6" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" sizes="192x192" />
      </head>
      <body className="h-full min-h-screen antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
