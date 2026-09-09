import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Franchise",
  description: "Franchise information for GreenChillyz, YellowChillyz and GoldenChillyz.",
  path: "/franchise",
  noIndex: true,
});

export default function FranchiseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
