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

// Lazy load sections below the fold for optimal Lighthouse performance
const BrandSnapshotSection = dynamic(
  () => import("@/components/brand-snapshot/BrandSnapshotSection").then((mod) => mod.BrandSnapshotSection),
  { ssr: true }
);

const BrandStorySection = dynamic(
  () => import("@/components/brand-story/BrandStorySection").then((mod) => mod.BrandStorySection),
  { ssr: true }
);

const SignatureCreationsSection = dynamic(
  () => import("@/components/signature-creations/SignatureCreationsSection").then((mod) => mod.SignatureCreationsSection),
  { ssr: true }
);

const OffersSection = dynamic(
  () => import("@/components/offers/OffersSection").then((mod) => mod.OffersSection),
  { ssr: true }
);

const GamesSection = dynamic(
  () => import("@/components/games/GamesSection").then((mod) => mod.GamesSection),
  { ssr: true }
);

const BusinessVerticalsSection = dynamic(
  () => import("@/components/business-verticals/BusinessVerticalsSection").then((mod) => mod.BusinessVerticalsSection),
  { ssr: true }
);

const LocationsSection = dynamic(
  () => import("@/components/locations/LocationsSection").then((mod) => mod.LocationsSection),
  { ssr: true }
);

const WhyGreenChillyzSection = dynamic(
  () => import("@/components/why-greenchillyz/WhyGreenChillyzSection").then((mod) => mod.WhyGreenChillyzSection),
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
        <BrandSnapshotSection />
        <BrandStorySection />
        <SignatureCreationsSection />
        <OffersSection />
        <GamesSection />
        <BusinessVerticalsSection />
        <LocationsSection />
        <WhyGreenChillyzSection />
        <ReviewsSection />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
