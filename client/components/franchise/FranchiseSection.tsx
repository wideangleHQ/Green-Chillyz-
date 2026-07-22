import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { OUTLET_COUNT } from "@/lib/content";

/**
 * Franchise (12_Homepage_Sections.md §10): short, confident CTA block,
 * minimal imagery. Aspiration beat before the footer.
 */
export function FranchiseSection() {
  return (
    <section id="franchise" aria-labelledby="franchise-headline" className="section-pad">
      <div className="container-site flex flex-col items-center gap-8 text-center">
        <div id="franchise-headline">
          <SectionHeader
            eyebrow="Franchise"
            headline="Grow With GreenChillyz."
            body={`${OUTLET_COUNT} outlets in, we're just getting started. Bring the family to your city.`}
            colorTheme="red"
          />
        </div>
        <Reveal>
          <Button variant="primary-red" href="/franchise">Start Your Inquiry</Button>
        </Reveal>
      </div>
    </section>
  );
}
