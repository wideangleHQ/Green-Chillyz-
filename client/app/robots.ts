import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/wallet", "/rewards"],
      },
    ],
    sitemap: "https://greenchillyz.com/sitemap.xml",
  };
}
