import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — GreenChillyz",
  description: "How GreenChillyz Group handles your data.",
};

export default function PrivacyPage() {
  return (
    <main className="section-pad container-site flex min-h-svh max-w-3xl flex-col justify-center gap-6">
      <p className="text-label-caps uppercase text-primary">Legal</p>
      <h1 className="text-headline-lg-mobile xl:text-headline-lg">Privacy Notice</h1>
      <p className="text-body-md text-on-surface-variant">
        The full customer-facing privacy notice is being finalized with the
        GreenChillyz Group and will be published here before launch. It will
        cover account data, coins and rewards activity, and analytics
        (Google Analytics, Microsoft Clarity).
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center self-start rounded-full border border-outline-variant px-8 py-3.5 text-nav-link text-on-surface transition-shadow duration-200 hover:shadow-hover"
      >
        Back to Home
      </Link>
    </main>
  );
}
