/*
  Homepage content — illustrative copy following 06_Content_and_Copy.md
  rules; flagged for GreenChillyz Group review before launch.
*/

export interface Brand {
  name: string;
  tagline: string;
  description: string;
  accent: "green" | "yellow" | "gold";
  assetName: string;
  assetDescription: string;
}

export const BRANDS: Brand[] = [
  {
    name: "GreenChillyz",
    tagline: "The flagship",
    description:
      "Where it all started. Fresh, fiery kitchens serving the dishes that built the family name.",
    accent: "green",
    assetName: "brand-story-photo-greenchillyz-01",
    assetDescription: "GreenChillyz signature dish, warm editorial light",
  },
  {
    name: "YellowChillyz",
    tagline: "The energetic one",
    description:
      "Fast, bright and bold. Street-inspired flavors made for the middle of a busy day.",
    accent: "yellow",
    assetName: "brand-story-photo-yellowchillyz-01",
    assetDescription: "YellowChillyz vibrant street-style plate",
  },
  {
    name: "GoldenChillyz",
    tagline: "The premium tier",
    description:
      "Slow evenings, signature plates. The family's fine-dining expression, reserved and refined.",
    accent: "gold",
    assetName: "brand-story-photo-goldenchillyz-01",
    assetDescription: "GoldenChillyz plated signature course, moody light",
  },
];

export const OUTLET_COUNT = 12;

export interface Review {
  quote: string;
  author: string;
  outlet: string;
  rating: number;
}

export const REVIEWS: Review[] = [
  {
    quote:
      "The paneer skewers arrived still smoking. I've been back three times in two weeks.",
    author: "Ananya R.",
    outlet: "Indiranagar",
    rating: 5,
  },
  {
    quote:
      "Earned enough coins over lunch breaks for a free dessert. The game is dangerously fun.",
    author: "Vikram S.",
    outlet: "Koramangala",
    rating: 5,
  },
  {
    quote:
      "GoldenChillyz feels like a different world — same warmth, twice the occasion.",
    author: "Meera K.",
    outlet: "UB City",
    rating: 4,
  },
  {
    quote:
      "Found it through the outlet locator on a work trip. Now it's my Whitefield ritual.",
    author: "Dev P.",
    outlet: "Whitefield",
    rating: 5,
  },
];

export interface Offer {
  title: string;
  detail: string;
  expiry: string;
  signature?: boolean;
}

export const OFFERS: Offer[] = [
  {
    title: "First Visit, First Reward",
    detail: "Join free and unlock 100 welcome coins.",
    expiry: "Always on",
  },
  {
    title: "Weekday Lunch Coins",
    detail: "Double coins on weekday lunches before 3pm.",
    expiry: "Ends July 31",
  },
  {
    title: "GoldenChillyz Signature Table",
    detail: "2,000 coins unlock a chef's-choice course.",
    expiry: "Members only",
    signature: true,
  },
];

export const GALLERY_ITEMS = [
  {
    assetName: "gallery-photo-ambience-01",
    caption: "Evening service at Indiranagar",
  },
  {
    assetName: "gallery-photo-dish-02",
    caption: "Signature skewers, straight off the grill",
  },
  {
    assetName: "gallery-photo-people-03",
    caption: "Friends splitting a YellowChillyz spread",
  },
  {
    assetName: "gallery-photo-ambience-04",
    caption: "GoldenChillyz private dining room",
  },
  {
    assetName: "gallery-photo-dish-05",
    caption: "Kulfi finished at the table",
  },
  {
    assetName: "gallery-photo-ingredient-06",
    caption: "Morning chilli delivery, market-fresh",
  },
];
