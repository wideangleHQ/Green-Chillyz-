import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section-pad container-site flex min-h-svh flex-col items-center justify-center gap-5 text-center">
      <p className="text-label-caps uppercase text-primary">404</p>
      <h1 className="text-headline-lg-mobile xl:text-headline-lg">Page not found</h1>
      <p className="max-w-md text-body-md text-on-surface-variant">
        The page you are looking for may have moved or is not part of the public GreenChillyz website.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-full bg-primary px-8 py-3.5 text-nav-link text-white transition-shadow duration-200 hover:shadow-hover"
      >
        Back to home
      </Link>
    </main>
  );
}
