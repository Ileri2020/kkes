import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Explicitly set Turbopack root to suppress the "multiple lockfiles" warning
  // caused by the parent commerce/package-lock.json being detected
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
