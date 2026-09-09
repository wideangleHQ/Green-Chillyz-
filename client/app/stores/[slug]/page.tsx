import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock3, MapPin, Phone, Truck, Utensils } from "lucide-react";
import type { StoreDetail } from "@/types/store";
import { absoluteUrl, createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

function apiOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001").origin;
  } catch {
    return "http://localhost:5001";
  }
}

async function getStore(slug: string): Promise<StoreDetail | null> {
  try {
    const response = await fetch(
      `${apiOrigin()}/api/v1/stores/slug/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );

    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: StoreDetail } | StoreDetail;
    if (Object.prototype.hasOwnProperty.call(payload, "data")) {
      return (payload as { data?: StoreDetail }).data || null;
    }
    return payload as StoreDetail;
  } catch {
    return null;
  }
}

function storeDescription(store: StoreDetail) {
  return (
    store.shortDescription ||
    store.description ||
    `Visit ${store.name} in ${store.city} for GreenChillyz dining, takeaway and available outlet services.`
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);

  if (!store) {
    return createPageMetadata({
      title: "Outlet Not Found",
      description: "The requested GreenChillyz outlet could not be found.",
      path: `/stores/${slug}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: store.name,
    description: storeDescription(store),
    path: `/stores/${store.slug}`,
  });
}

function buildStructuredData(store: StoreDetail) {
  const address = {
    "@type": "PostalAddress",
    streetAddress: [store.addressLine1, store.addressLine2].filter(Boolean).join(", "),
    addressLocality: store.city,
    addressRegion: store.state,
    postalCode: store.postalCode || undefined,
    addressCountry: store.country,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Stores", item: absoluteUrl("/#locations") },
          { "@type": "ListItem", position: 3, name: store.name, item: absoluteUrl(`/stores/${store.slug}`) },
        ],
      },
      {
        "@type": "Restaurant",
        "@id": absoluteUrl(`/stores/${store.slug}#restaurant`),
        name: store.name,
        url: absoluteUrl(`/stores/${store.slug}`),
        description: storeDescription(store),
        image: store.coverImage || store.thumbnailImage || absoluteUrl("/assets/brand-story/brand_story_green.png"),
        address,
        telephone: store.phone || undefined,
        geo: {
          "@type": "GeoCoordinates",
          latitude: store.latitude,
          longitude: store.longitude,
        },
        parentOrganization: { "@id": "https://greenchillyz.com/#organization" },
        hasMap: store.googleMapsLink || undefined,
      },
    ],
  };
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) notFound();

  const description = storeDescription(store);
  const address = [store.addressLine1, store.addressLine2, store.city, store.state, store.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-[#FFF8F1] px-5 pb-20 pt-28 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildStructuredData(store)).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs font-semibold uppercase tracking-wider text-stone-500">
          <Link href="/" className="hover:text-brand-green">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/#locations" className="hover:text-brand-green">Stores</Link>
          <span className="mx-2">/</span>
          <span className="text-stone-800">{store.name}</span>
        </nav>

        <header className="max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-green">{store.brandName}</p>
          <h1 className="text-4xl font-heading font-extrabold uppercase leading-none tracking-tight text-stone-950 md:text-6xl">
            {store.name}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-stone-600 md:text-lg">{description}</p>
        </header>

        <section aria-labelledby="location-details" className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-soft">
            <h2 id="location-details" className="text-xl font-heading font-extrabold uppercase text-stone-950">Location details</h2>
            <address className="mt-5 flex gap-3 not-italic text-sm leading-relaxed text-stone-600">
              <MapPin className="mt-0.5 size-5 shrink-0 text-brand-green" aria-hidden="true" />
              <span>{address}</span>
            </address>
            {store.phone && (
              <a href={`tel:${store.phone}`} className="mt-4 flex items-center gap-3 text-sm font-semibold text-brand-green hover:underline">
                <Phone className="size-4" aria-hidden="true" />
                {store.phone}
              </a>
            )}
            {store.googleMapsLink && (
              <a href={store.googleMapsLink} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">
                Get directions <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            )}
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-heading font-extrabold uppercase text-stone-950">Available services</h2>
            <ul className="mt-5 flex flex-col gap-4 text-sm text-stone-600">
              {store.supportsDineIn && <li className="flex items-center gap-3"><Utensils className="size-4 text-brand-green" aria-hidden="true" /> Dine-in</li>}
              {store.supportsTakeaway && <li className="flex items-center gap-3"><Clock3 className="size-4 text-brand-green" aria-hidden="true" /> Takeaway</li>}
              {store.supportsDelivery && <li className="flex items-center gap-3"><Truck className="size-4 text-brand-green" aria-hidden="true" /> Delivery</li>}
            </ul>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/menu" className="inline-flex items-center rounded-full bg-brand-red px-6 py-3 text-sm font-bold uppercase tracking-wider text-white">View menu</Link>
          <Link href="/#locations" className="inline-flex items-center rounded-full border border-stone-300 px-6 py-3 text-sm font-bold uppercase tracking-wider text-stone-900">Explore more stores</Link>
        </div>
      </div>
    </main>
  );
}
