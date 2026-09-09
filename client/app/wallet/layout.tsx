import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Wallet",
  description: "Manage your GreenChillyz coins and rewards wallet.",
  path: "/wallet",
  noIndex: true,
});

export default function WalletLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
