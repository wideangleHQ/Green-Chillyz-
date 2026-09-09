import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Rewards",
  description: "Browse GreenChillyz rewards and redeem coins at participating outlets.",
  path: "/rewards",
  noIndex: true,
});

export default function RewardsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
