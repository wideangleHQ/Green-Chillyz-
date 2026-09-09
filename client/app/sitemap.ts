import type { MetadataRoute } from "next";

type StoreSummary = { slug: string; updatedAt?: string };

async function getStoreEntries(base: string): Promise<MetadataRoute.Sitemap> {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001");
    const response = await fetch(`${apiUrl.origin}/api/v1/stores/active`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as { data?: StoreSummary[] } | StoreSummary[];
    const stores = Array.isArray(payload) ? payload : payload.data || [];
    return stores
      .filter((store) => Boolean(store.slug))
      .map((store) => ({
        url: `${base}/stores/${encodeURIComponent(store.slug)}`,
        lastModified: store.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://greenchillyz.com";
  const pages = ["", "/about", "/menu", "/games"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  return [...pages, ...(await getStoreEntries(base))];
}
