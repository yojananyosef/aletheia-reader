import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  disable: process.env.NODE_ENV !== "production",
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  exclude: [/\.webmanifest$/],
  register: false,
});

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withSerwist(nextConfig);
