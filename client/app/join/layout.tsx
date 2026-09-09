import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Join Rewards",
  description: "Join the GreenChillyz rewards programme and earn coins when membership is available.",
  path: "/join",
  noIndex: true,
});

export default function JoinLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
