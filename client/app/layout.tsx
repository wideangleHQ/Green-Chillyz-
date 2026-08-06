import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL("https://greenchillyz.com"),
  title: "GreenChillyz — Taste, Reimagined",
  description:
    "One family, three flavors: GreenChillyz, YellowChillyz and GoldenChillyz. Explore the story, earn coins, find your nearest table.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "GreenChillyz — Taste, Reimagined",
    description:
      "One family, three flavors: GreenChillyz, YellowChillyz and GoldenChillyz.",
    url: "/",
    siteName: "GreenChillyz Group",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GreenChillyz — Taste, Reimagined",
    description:
      "One family, three flavors: GreenChillyz, YellowChillyz and GoldenChillyz.",
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
