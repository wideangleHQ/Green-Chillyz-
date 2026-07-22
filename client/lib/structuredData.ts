import { OUTLETS } from "@/lib/content";

/*
  Structured data per 14_SEO_and_Metadata.md: Organization for the Group,
  LocalBusiness per outlet. Review/AggregateRating markup is intentionally
  omitted — homepage reviews are illustrative copy pending Group-sourced
  verifiable reviews (never fabricate ratings markup).
*/
export function buildStructuredData() {
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
      ...OUTLETS.map((outlet) => ({
        "@type": "Restaurant",
        name: outlet.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: outlet.address,
          addressLocality: "Bengaluru",
          addressCountry: "IN",
        },
        openingHours: outlet.hours,
        parentOrganization: {
          "@id": "https://greenchillyz.com/#organization",
        },
      })),
    ],
  };
}
