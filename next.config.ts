import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['tesseract.js', 'canvas', 'pdfjs-dist'],
};

export default nextConfig;
