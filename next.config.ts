import type { NextConfig } from "next";
import CopyPlugin from "copy-webpack-plugin";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          { from: "node_modules/piper-tts-web/dist/onnx", to: path.join(__dirname, "public/onnx") },
          { from: "node_modules/piper-tts-web/dist/piper", to: path.join(__dirname, "public/piper") },
          { from: "node_modules/piper-tts-web/dist/worker", to: path.join(__dirname, "public/worker") },
        ],
      })
    );
    return config;
  },
};

export default nextConfig;
