import type { Store } from "@/types/store";

export function buildStructuredData(stores?: Store[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://greenchillyz.com/#organization",
        name: "GreenChillyz Group",
        url: "https://greenchillyz.com",
        logo: "https://greenchillyz.com/assets/icons/logo.png",
        brand: [
          { "@type": "Brand", name: "GreenChillyz" },
          { "@type": "Brand", name: "YellowChillyz" },
          { "@type": "Brand", name: "GoldenChillyz" },
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://greenchillyz.com/#website",
        name: "GreenChillyz",
        url: "https://greenchillyz.com",
        publisher: { "@id": "https://greenchillyz.com/#organization" },
        inLanguage: "en-IN",
      },
      {
        "@type": "WebPage",
        "@id": "https://greenchillyz.com/#webpage",
        url: "https://greenchillyz.com/",
        name: "GreenChillyz | Indian Food, Dining & Catering in Odisha",
        isPartOf: { "@id": "https://greenchillyz.com/#website" },
        about: { "@id": "https://greenchillyz.com/#organization" },
        inLanguage: "en-IN",
      },
      ...(stores || []).map((store) => ({
        "@type": "Restaurant",
        name: store.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: store.addressLine1,
          addressLocality: store.city,
          addressRegion: store.state,
          addressCountry: store.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: store.latitude,
          longitude: store.longitude,
        },
        parentOrganization: {
          "@id": "https://greenchillyz.com/#organization",
        },
      })),
    ],
  };
}
