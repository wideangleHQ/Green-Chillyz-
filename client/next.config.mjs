/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
