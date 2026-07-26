import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.31.233"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.greenchillyz.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.greenchillyz.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;