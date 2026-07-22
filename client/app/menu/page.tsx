import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Menu — GreenChillyz",
  description: "The full GreenChillyz, YellowChillyz and GoldenChillyz menu.",
};

/* Route stub so the homepage "View Full Menu" CTA never dead-links;
   full menu page is a separate milestone (16_Project_TODO.md). */
export default function MenuPage() {
  return (
    <main className="section-pad container-site flex min-h-svh flex-col items-center justify-center gap-6 text-center">
      <p className="text-label-caps uppercase text-primary">The Menu</p>
      <h1 className="text-headline-lg-mobile xl:text-headline-lg">
        The full menu is on its way.
      </h1>
      <p className="max-w-md text-body-md text-on-surface-variant">
        We&apos;re plating it up now. Meanwhile, the signature dishes are live
        on the homepage.
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
