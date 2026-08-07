import Image from "next/image";
import Link from "next/link";
import { SiFacebook, SiInstagram, SiYoutube } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { MapPin, Phone, Mail } from "lucide-react";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#story", label: "About" },
  { href: "/menu", label: "Menu" },
  { href: "/#locations", label: "Stores" },
  { href: "/#contact", label: "Contact" },
  { href: "/franchise", label: "Franchise" },
];

const SOCIAL_LINKS = [
  { href: "https://facebook.com", label: "Facebook", Icon: SiFacebook },
  { href: "https://instagram.com", label: "Instagram", Icon: SiInstagram },
  { href: "https://linkedin.com", label: "LinkedIn", Icon: FaLinkedin },
  { href: "https://youtube.com", label: "YouTube", Icon: SiYoutube },
];

export function Footer() {
  return (
    <footer className="w-full bg-[#004D1E] text-white rounded-t-[36px] md:rounded-t-[48px] overflow-hidden mt-8 border-t border-white/10">
      <div className="container-site py-10 md:py-14 flex flex-col gap-10">
        
        {/* Desktop: 3-Column / Tablet: 2-Column / Mobile: Stacked */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          
          {/* Brand */}
          <div className="flex flex-col gap-4 md:col-span-2">
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
            <p className="text-sm font-sans text-white/80 max-w-sm">
              Flavours That Bring People Together.
            </p>
            <div className="flex items-center gap-4 pt-2">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-white/80 hover:text-amber-400 transition-colors"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-amber-400">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-sans text-white/80 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-amber-400">
              Contact
            </h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-sm font-sans text-white/80">
                <Phone className="size-4 shrink-0 mt-0.5 text-amber-400" />
                <span>+91 1800-123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-sans text-white/80">
                <Mail className="size-4 shrink-0 mt-0.5 text-amber-400" />
                <span>contact@greenchillyz.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-sans text-white/80 leading-relaxed">
                <MapPin className="size-4 shrink-0 mt-0.5 text-amber-400" />
                <span>Headquarters, <br/>Bhubaneswar, Odisha</span>
              </li>
            </ul>
          </div>
          
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full bg-[#003615] py-5">
        <div className="container-site flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-white/70">
          <p>© {new Date().getFullYear()} GreenChillyz Group. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-amber-400 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
