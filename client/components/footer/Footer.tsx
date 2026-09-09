import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative w-full bg-[#004D1E] text-white rounded-t-[36px] md:rounded-t-[48px] overflow-hidden mt-12 border-t border-white/10">
      
      {/* Large Background Brand Text */}
      <div className="absolute bottom-24 left-0 right-0 pointer-events-none select-none overflow-hidden z-0 flex justify-center w-full">
        <span className="font-heading text-[11vw] uppercase tracking-[0.05em] text-center whitespace-nowrap bg-gradient-to-b from-white/[0.04] via-white/[0.015] to-transparent bg-clip-text text-transparent leading-none select-none">
          GREEN CHILLYZ
        </span>
      </div>

      <div className="container-site py-12 md:py-16 flex flex-col gap-12 relative z-10">
        
        {/* Main Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-3 w-fit group">
              <div className="size-10 rounded-full bg-white p-1 flex items-center justify-center">
                <Image
                  src="/assets/icons/logo.png"
                  alt="GreenChillyz Group"
                  width={40}
                  height={40}
                  className="size-8 object-contain"
                />
              </div>
              <span className="text-lg font-sans font-extrabold uppercase tracking-tight text-white">
                GreenChillyz
              </span>
            </Link>
            <p className="text-sm font-sans text-white/70 max-w-xs leading-relaxed">
              Flavours That Bring People Together. Crafting premium culinary experiences across Eastern India.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div className="flex flex-col gap-5">
            <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-gold">
              Explore
            </h3>
            <ul className="flex flex-col gap-3">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/menu", label: "Menu" },
                { href: "/#locations", label: "Stores" },
                { href: "/games", label: "Games" },
                { href: "/rewards", label: "Rewards" },
                { href: "/#offers", label: "Offers" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-sans text-white/70 hover:text-white transition-colors duration-200 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Business */}
          <div className="flex flex-col gap-5">
            <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-gold">
              Business
            </h3>
            <ul className="flex flex-col gap-3">
              {[
                { href: "/#verticals", label: "Catering", isLink: true },
                { href: "/#verticals", label: "Institutional Partnerships", isLink: true },
                { href: "/franchise", label: "Franchise", isLink: true },
                { label: "Contact", isLink: false },
              ].map((link) => (
                <li key={link.label}>
                  {link.isLink ? (
                    <Link
                      href={link.href!}
                      className="text-sm font-sans text-white/70 hover:text-white transition-colors duration-200 font-medium"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-sans text-white/40 cursor-default font-medium">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support */}
          <div className="flex flex-col gap-5">
            <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-gold">
              Support
            </h3>
            <ul className="flex flex-col gap-3">
              {[
                { label: "Help / FAQ", isLink: false },
                { href: "/privacy", label: "Privacy Policy", isLink: true },
                { href: "/terms", label: "Terms & Conditions", isLink: true },
                { href: "mailto:contact@greenchillyz.com", label: "Contact Support", isLink: true },
              ].map((link) => (
                <li key={link.label}>
                  {link.isLink ? (
                    <Link
                      href={link.href!}
                      className="text-sm font-sans text-white/70 hover:text-white transition-colors duration-200 font-medium"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-sans text-white/40 cursor-default font-medium">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Contact Information Bar */}
        <div className="border-t border-white/10 pt-8 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-white/5 text-gold shrink-0">
              <Phone className="size-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-1">Call Us</p>
              <a href="tel:+9118001234567" className="text-sm font-medium text-white hover:text-gold transition-colors">
                +91 1800-123-4567
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-white/5 text-gold shrink-0">
              <Mail className="size-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-1">Email Us</p>
              <a href="mailto:contact@greenchillyz.com" className="text-sm font-medium text-white hover:text-gold transition-colors">
                contact@greenchillyz.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-white/5 text-gold shrink-0">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-1">Head Office</p>
              <p className="text-sm font-medium text-white leading-relaxed">
                Headquarters, Bhubaneswar, Odisha
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="w-full bg-[#003615] py-6 relative z-10 border-t border-white/10">
        <div className="container-site flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-white/50">
          <p>© {new Date().getFullYear()} GreenChillyz Group. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-gold transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gold transition-colors duration-200">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
