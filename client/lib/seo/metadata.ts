import type { Metadata } from "next";

export const SITE_URL = "https://greenchillyz.com";
export const SITE_NAME = "GreenChillyz";
export const SITE_DESCRIPTION =
  "GreenChillyz brings Indian food, casual dining, takeaway, delivery and event catering together across Odisha.";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);

  return {
    title: title.replace(/\s*\|\s*GreenChillyz\s*$/i, ""),
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: absoluteUrl("/assets/brand-story/brand_story_green.png") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/assets/brand-story/brand_story_green.png")],
    },
  };
}
