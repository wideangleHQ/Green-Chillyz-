import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

interface SectionHeaderProps {
  eyebrow: string;
  headline: string;
  body?: ReactNode;
  align?: "center" | "left";
  inverse?: boolean;
  colorTheme?: "green" | "red" | "default";
}

/**
 * Eyebrow (label-caps) + h2 headline + optional one-line body,
 * per 06_Content_and_Copy.md section-title rules.
 */
export function SectionHeader({
  eyebrow,
  headline,
  body,
  align = "center",
  inverse = false,
  colorTheme = "default",
}: SectionHeaderProps) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <Reveal className={`flex flex-col gap-4 ${alignment}`}>
      <p
        className={`text-label-caps uppercase ${
          inverse 
            ? "text-secondary-container" 
            : colorTheme === "green"
            ? "text-brand-green"
            : colorTheme === "red"
            ? "text-brand-red"
            : "text-primary"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`text-headline-lg-mobile md:text-headline-lg-tablet xl:text-headline-lg ${
          inverse 
            ? "text-inverse-on-surface" 
            : colorTheme === "green"
            ? "text-brand-green"
            : colorTheme === "red"
            ? "text-brand-red"
            : "text-on-surface"
        }`}
      >
        {headline}
      </h2>
      {body ? (
        <p
          className={`max-w-xl text-body-md md:text-body-lg ${
            inverse ? "text-inverse-on-surface/80" : "text-on-surface-variant"
          }`}
        >
          {body}
        </p>
      ) : null}
    </Reveal>
  );
}
