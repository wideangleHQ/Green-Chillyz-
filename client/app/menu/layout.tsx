import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Indian Food Menu",
  description:
    "Explore the GreenChillyz menu across meals, starters, combos, rice, noodles, desserts and beverages. Choose an outlet to view available dishes.",
  path: "/menu",
});

export default function MenuLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
