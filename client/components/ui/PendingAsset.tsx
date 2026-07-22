interface PendingAssetProps {
  /** Asset name per 09_Asset_Pipeline.md convention, e.g. "hero-video-brand-loop-01" */
  name: string;
  /** Short description of what the final asset will show (visual direction). */
  description: string;
  className?: string;
}

/**
 * Clearly-marked placeholder for imagery/video not yet produced
 * (09_Asset_Pipeline.md: never fabricate a "final-looking" stand-in).
 * Reserves exact layout space via the parent's aspect-ratio box to
 * protect CLS (08_Performance_Guidelines.md).
 */
export function PendingAsset({ name, description, className = "" }: PendingAssetProps) {
  return (
    <div
      role="img"
      aria-label={`Placeholder — pending asset: ${description}`}
      className={`relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden bg-surface-container-highest p-6 text-center ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute -left-1/4 top-0 h-2/3 w-2/3 rounded-full bg-secondary-container opacity-20 blur-blob"
      />
      <p className="text-label-caps uppercase text-on-surface-variant">
        Asset pending
      </p>
      <p className="max-w-xs text-body-md text-on-surface-variant">{description}</p>
      <p className="font-mono text-xs text-outline">{name}</p>
    </div>
  );
}
