import dynamic from "next/dynamic";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Preloader } from "@/components/preloader/Preloader";
import { Navbar } from "@/components/navbar/Navbar";
import { HeroSection } from "@/components/hero/HeroSection";
import { Footer } from "@/components/footer/Footer";
import { buildStructuredData } from "@/lib/structuredData";

const OnboardingWrapper = dynamic(
  () => import("@/components/onboarding/OnboardingWrapper").then((mod) => mod.OnboardingWrapper),
  { ssr: true }
);

// Lazy load sections below the fold to improve initial page load performance
const BrandStorySection = dynamic(
  () => import("@/components/brand-story/BrandStorySection").then((mod) => mod.BrandStorySection),
  { ssr: true }
);

const SignatureCreationsSection = dynamic(
  () => import("@/components/signature-creations/SignatureCreationsSection").then((mod) => mod.SignatureCreationsSection),
  { ssr: true }
);

const GamesSection = dynamic(
  () => import("@/components/games/GamesSection").then((mod) => mod.GamesSection),
  { ssr: true }
);

const OffersSection = dynamic(
  () => import("@/components/offers/OffersSection").then((mod) => mod.OffersSection),
  { ssr: true }
);

const LocationsSection = dynamic(
  () => import("@/components/locations/LocationsSection").then((mod) => mod.LocationsSection),
  { ssr: true }
);

const ReviewsSection = dynamic(
  () => import("@/components/reviews/ReviewsSection").then((mod) => mod.ReviewsSection),
  { ssr: true }
);

export default function Home() {
  return (
    <SmoothScroll>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildStructuredData()),
        }}
      />
      <Preloader />
      <Navbar />
      <OnboardingWrapper />
      <main>
        <HeroSection />
        <BrandStorySection />
        <SignatureCreationsSection />
        <GamesSection />
        <OffersSection />
        <LocationsSection />
        <ReviewsSection />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
