import type { NextConfig } from "next";

// Immutable static assets: bible JSON, Piper/ONNX WASM, workers, fonts.
// Filenames are content-hashed or version-pinned by the copy script, and the
// service worker mirrors the same cache-first strategy (see public/sw.js).
const IMMUTABLE = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: "/data/bibles/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/onnx/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/piper/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/worker/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      // Legacy transitional JSON: cacheable but revalidatable.
      {
        source: "/json/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
