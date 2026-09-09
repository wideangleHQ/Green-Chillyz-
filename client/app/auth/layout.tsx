import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Account",
  description: "Sign in to your GreenChillyz customer account.",
  path: "/auth",
  noIndex: true,
});

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
