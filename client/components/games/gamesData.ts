export interface GameData {
  id: string;
  name: string;
  description: string;
  rating: number;
  rewardBadge: string;
  badgeVariant: "gold" | "red" | "green" | "yellow";
  image: string;
  rotation: number;
  accentColor: string;
}

export const GAMES_DATA: GameData[] = [
  {
    id: "spin-win",
    name: "Spin & Win",
    description: "Spin the daily chili wheel and claim instant bonus coins and mocktail rewards.",
    rating: 4.9,
    rewardBadge: "+500 Coins",
    badgeVariant: "gold",
    image: "/assets/food/paneer_chilly_dry.png",
    rotation: -1.5,
    accentColor: "#D4A31C",
  },
  {
    id: "chilli-rush",
    name: "Chilli Rush",
    description: "Flame-grill paneer skewers before time runs out to earn double coins.",
    rating: 4.8,
    rewardBadge: "+250 Coins",
    badgeVariant: "green",
    image: "/assets/food/schezwan_noodles.png",
    rotation: 1.2,
    accentColor: "#006B2A",
  },
  {
    id: "lucky-coin-drop",
    name: "Lucky Coin Drop",
    description: "Catch falling golden chili coins to unlock exclusive meal upgrades.",
    rating: 4.9,
    rewardBadge: "Combo Upgrade",
    badgeVariant: "gold",
    image: "/assets/food/golden_prawn_tempura.png",
    rotation: -2.0,
    accentColor: "#C9A227",
  },
  {
    id: "scratch-fiesta",
    name: "Scratch Fiesta",
    description: "Scratch digital reward cards to reveal free appetizers and crisp side dishes.",
    rating: 4.7,
    rewardBadge: "Free Fries",
    badgeVariant: "red",
    image: "/assets/food/chilly_potato.png",
    rotation: 1.8,
    accentColor: "#C62828",
  },
  {
    id: "memory-match",
    description: "Match Satvik dish pairs to score 20% discounts at YellowChillyz.",
    name: "Memory Match",
    rating: 4.8,
    rewardBadge: "20% OFF",
    badgeVariant: "yellow",
    image: "/assets/food/classic_fried_rice.png",
    rotation: -1.0,
    accentColor: "#D4A31C",
  },
  {
    id: "burger-stack",
    name: "Burger Stack",
    description: "Stack juicy gourmet ingredients to top the weekly GreenChillyz leaderboard.",
    rating: 4.9,
    rewardBadge: "+500 Coins",
    badgeVariant: "green",
    image: "/assets/food/veg_manchurian.png",
    rotation: 2.1,
    accentColor: "#006B2A",
  },
];
