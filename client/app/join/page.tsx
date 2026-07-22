import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Join Free — GreenChillyz",
  description: "Join the GreenChillyz loyalty program and start earning coins.",
};

/* Route stub so "Join Free" / "Start Earning" CTAs never dead-link;
   accounts module is a future phase (16_Project_TODO.md). */
export default function JoinPage() {
  return (
    <main className="section-pad container-site flex min-h-svh flex-col items-center justify-center gap-6 text-center">
      <p className="text-label-caps uppercase text-primary">Rewards</p>
      <h1 className="text-headline-lg-mobile xl:text-headline-lg">
        Memberships open soon.
      </h1>
      <p className="max-w-md text-body-md text-on-surface-variant">
        The coins program is being polished. Your first 100 welcome coins will
        be waiting.
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
