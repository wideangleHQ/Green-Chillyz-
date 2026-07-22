import { PendingAsset } from "@/components/ui/PendingAsset";

interface HeroMediaProps {
  /** "video" (desktop/tablet) or "image" (mobile poster) — 12_Homepage_Sections.md */
  variant: "video" | "image";
  className?: string;
}

/**
 * Single controller for hero background media (12_Homepage_Sections.md
 * dev note). Final Cloudinary video/poster pending — renders a labelled
 * placeholder with the same Ken Burns drift the real asset will carry.
 * Decorative only: no essential information lives in this layer.
 */
export function HeroMedia({ variant, className = "" }: HeroMediaProps) {
  const name =
    variant === "video" ? "hero-video-brand-loop-01" : "hero-photo-poster-01";
  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className="h-full w-full motion-safe:animate-kenburns">
        <PendingAsset
          name={name}
          description="Cinematic warm-lit signature dish, generous negative space"
        />
      </div>
      {/* Ambient light blobs — non-focal, heavy blur, low opacity */}
      <div
        aria-hidden="true"
        className="absolute -right-32 top-1/4 hidden h-96 w-96 rounded-full bg-secondary-container opacity-15 blur-blob motion-safe:animate-blob-drift md:block"
      />
      <div
        aria-hidden="true"
        className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-primary-container opacity-10 blur-blob"
      />
    </div>
  );
}
