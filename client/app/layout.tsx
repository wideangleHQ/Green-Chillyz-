import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo/metadata";

const anton = localFont({
  src: "./fonts/Anton-Regular.ttf",
  variable: "--font-anton",
  display: "swap",
});

const manrope = localFont({
  src: "./fonts/Manrope-VariableFont_wght.ttf",
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GreenChillyz | Indian Food, Dining & Catering in Odisha",
    template: "%s | GreenChillyz",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "GreenChillyz | Indian Food, Dining & Catering in Odisha",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: absoluteUrl("/assets/brand-story/brand_story_green.png") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GreenChillyz | Indian Food, Dining & Catering in Odisha",
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/assets/brand-story/brand_story_green.png")],
  },
  icons: {
    icon: [
      { url: "/assets/icons/logo.png", type: "image/png" },
    ],
    shortcut: "/assets/icons/logo.png",
    apple: "/assets/icons/logo.png",
  },
};

import { AppProviders } from "@/components/providers/AppProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${anton.variable} ${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
