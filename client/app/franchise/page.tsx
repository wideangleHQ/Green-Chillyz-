import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Franchise — GreenChillyz",
  description: "Bring GreenChillyz, YellowChillyz and GoldenChillyz to your city.",
};

/* Route stub so the Franchise CTA never dead-links; the inquiry form
   (React Hook Form + Zod) is a separate milestone (16_Project_TODO.md). */
export default function FranchisePage() {
  return (
    <main className="section-pad container-site flex min-h-svh flex-col items-center justify-center gap-6 text-center">
      <p className="text-label-caps uppercase text-primary">Franchise</p>
      <h1 className="text-headline-lg-mobile xl:text-headline-lg">
        The inquiry form opens soon.
      </h1>
      <p className="max-w-md text-body-md text-on-surface-variant">
        We&apos;re preparing the franchise portal. Reach out at
        franchise@greenchillyz.com meanwhile.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-8 py-3.5 text-nav-link text-on-surface transition-shadow duration-200 hover:shadow-hover"
      >
        Back to Home
      </Link>
    </main>
  );
}
