import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Instagram, Clock } from "lucide-react";
import { COMPANY } from "@/lib/booking";
import logoAsset from "@/assets/pbtw-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white overflow-hidden">
                <img src={logoAsset.url} alt="PBTW Group logo" className="h-10 w-10 object-contain" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold">PBTW Group</p>
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Pappu Bhai Tanker Wale</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
              Reliable water tanker delivery in Beawar and nearby areas — for homes,
              businesses, and construction sites. GPS-tracked tankers, tested water,
              24×7 support.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-white/70">
              <Clock className="h-4 w-4 text-aqua" />
              Working Hours — 24×7
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white/90">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><Link to="/book" className="hover:text-white">Book Tanker</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white/90">Get in Touch</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-aqua" />
                <a href={`tel:${COMPANY.phone}`} className="hover:text-white">{COMPANY.phone}</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-aqua" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white">{COMPANY.email}</a>
              </li>
              <li className="flex items-start gap-2">
                <Instagram className="mt-0.5 h-4 w-4 text-aqua" />
                <a href="https://instagram.com/pbtwgroup" target="_blank" rel="noreferrer" className="hover:text-white">{COMPANY.instagram}</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-aqua" />
                <span>{COMPANY.address}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} PBTW Group — Pappu Bhai Tanker Wale. All rights reserved.</p>
          <p>Beawar, Rajasthan • Serving since 2025</p>
        </div>
      </div>
    </footer>
  );
}
