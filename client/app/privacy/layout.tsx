import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Notice",
  description: "The GreenChillyz privacy notice for customer accounts, rewards activity and analytics.",
  path: "/privacy",
  noIndex: true,
});

export default function PrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
