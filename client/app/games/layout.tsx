import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Arcade Games",
  description:
    "Play GreenChillyz Arcade games, score points and earn coins connected to the GreenChillyz rewards experience.",
  path: "/games",
});

export default function GamesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
