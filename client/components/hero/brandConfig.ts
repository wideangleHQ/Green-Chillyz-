export type BrandId = "green" | "yellow" | "red";

export interface BrandConfig {
  id: BrandId;
  name: string;
  tagline: string;
  headline: string;
  description: string;
  cta: { label: string; href: string };
  colors: {
    primary: string;
    glow: string;
    surface: string;
    surfaceDeep: string;
    accent: string;
    particle: string;
  };
  chilliGradient: [string, string];
  restaurant: { name: string; description: string };
}

export const BRANDS: Record<BrandId, BrandConfig> = {
  green: {
    id: "green",
    name: "GreenChillyz",
    tagline: "Fresh · Modern · Reimagined",
    headline: "Fresh. Modern.\nReimagined.",
    description:
      "Experience the flagship GreenChillyz — where fresh ingredients meet bold innovation in every bite.",
    cta: { label: "Explore the Menu", href: "/menu" },
    colors: {
      primary: "#00c853",
      glow: "#00e676",
      surface: "#071f10",
      surfaceDeep: "#030d07",
      accent: "#69f0ae",
      particle: "#00e67640",
    },
    chilliGradient: ["#00c853", "#00e676"],
    restaurant: {
      name: "greenchillyz-flagship-interior",
      description:
        "Bright, modern GreenChillyz interior with green accents and natural light",
    },
  },
  yellow: {
    id: "yellow",
    name: "YellowChillyz",
    tagline: "Pure · Traditional · Sattvik",
    headline: "Pure. Traditional.\nSattvik.",
    description:
      "A journey into pure, traditional flavors — YellowChillyz, where every dish honors the Sattvik way.",
    cta: { label: "Discover YellowChillyz", href: "/menu" },
    colors: {
      primary: "#ffc107",
      glow: "#ffd54f",
      surface: "#1a150a",
      surfaceDeep: "#0d0a05",
      accent: "#ffe082",
      particle: "#ffd54f40",
    },
    chilliGradient: ["#ffc107", "#ffab00"],
    restaurant: {
      name: "yellowchillyz-warm-interior",
      description:
        "Warm, traditional YellowChillyz interior with brass accents and soft lighting",
    },
  },
  red: {
    id: "red",
    name: "Red Experience",
    tagline: "Bold · Fiery · Unforgettable",
    headline: "Bold. Fiery.\nUnforgettable.",
    description:
      "The Red Experience — where street food energy meets premium night dining under electric lights.",
    cta: { label: "Enter the Experience", href: "/menu" },
    colors: {
      primary: "#f44336",
      glow: "#ff5252",
      surface: "#1a0a0a",
      surfaceDeep: "#0d0505",
      accent: "#ff8a80",
      particle: "#ff525240",
    },
    chilliGradient: ["#f44336", "#ff5722"],
    restaurant: {
      name: "red-experience-concept",
      description:
        "Dark, energetic Red Experience interior with warm lighting and modern street food atmosphere",
    },
  },
};

export const BRAND_ORDER: BrandId[] = ["green", "yellow", "red"];
