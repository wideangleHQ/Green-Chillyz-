import { SectionHeader } from "@/components/ui/SectionHeader";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { PendingAsset } from "@/components/ui/PendingAsset";
import { GALLERY_ITEMS } from "@/lib/content";
import { STAGGER } from "@/lib/motion";

/**
 * Gallery (12_Homepage_Sections.md §9): editorial photo grid, glass
 * caption revealed on hover/focus (200ms fade). Below tablet the caption
 * is always visible — hover is an enhancement, never a requirement
 * (18_Responsive_Design_System.md).
 */
export function GallerySection() {
  return (
    <section
      id="gallery"
      aria-labelledby="gallery-headline"
      className="section-pad bg-surface-container"
    >
      <div className="container-site flex flex-col gap-12">
        <div id="gallery-headline">
          <SectionHeader eyebrow="Gallery" headline="A Closer Look." colorTheme="green" />
        </div>

        <RevealGroup
          as="ul"
          stagger={STAGGER.list}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {GALLERY_ITEMS.map((item) => (
            <RevealItem as="li" key={item.assetName}>
              <figure className="group relative aspect-square overflow-hidden rounded-md" tabIndex={0}>
                <PendingAsset name={item.assetName} description={item.caption} />
                <figcaption className="glass absolute inset-x-4 bottom-4 rounded-md px-4 py-3 text-body-md text-on-surface transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:group-focus:opacity-100">
                  {item.caption}
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
