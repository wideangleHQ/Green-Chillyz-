import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "Learn about GreenChillyz, YellowChillyz and GoldenChillyz, a restaurant family rooted in Odisha and built around Indian food and hospitality.",
  path: "/about",
});

export default function AboutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
