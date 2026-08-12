import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alethia Reader - Lector Bíblico de Alto Confort y Tinta Electrónica",
  description: "Componente de lectura bíblica modular, responsivo y de alto rendimiento con emulación de tinta electrónica, accesibilidad WCAG 2.2 AAA y mitigación de fatiga visual.",
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
      <body className="h-full min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
