import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Clock, Instagram, MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/booking";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — PAPPU BHAI TANKER WALE | 9214775938" },
      {
        name: "description",
        content:
          "Call 9214775938 or WhatsApp us to book a water tanker in Beawar. Office: Gaddi Thoriyan Housing Board, Beawar. Open 24×7.",
      },
      { property: "og:title", content: "Contact PAPPU BHAI TANKER WALE" },
      { property: "og:description", content: "Get in touch — 24×7 water tanker delivery in Beawar." },
    ],
  }),
  component: ContactPage,
});

const CONTACTS = [
  {
    icon: Phone,
    label: "Phone",
    value: COMPANY.phone,
    href: `tel:${COMPANY.phone}`,
    accent: "bg-primary",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: COMPANY.phone,
    href: `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent("Hello HydroxFlow Team, I would like to book a water tanker.")}`,
    accent: "bg-emerald-500",
  },
  {
    icon: Mail,
    label: "Email",
    value: COMPANY.email,
    href: `mailto:${COMPANY.email}`,
    accent: "bg-sky-500",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: COMPANY.instagram,
    href: "https://instagram.com/hydroxflow",
    accent: "bg-gradient-to-br from-pink-500 to-amber-500",
  },
];

function ContactPage() {
  const mapsQ = encodeURIComponent(COMPANY.address);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero pt-32 pb-20 text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-0 h-80 w-80 rounded-full bg-sky/30 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            We're <span className="text-gradient-accent">here for you, 24×7</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Call, message, or visit — whichever works for you. Fastest replies on WhatsApp.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="mt-10 pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACTS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group rounded-3xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.accent} text-white`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="mt-1 font-display text-lg font-bold text-foreground group-hover:text-primary">
                  {c.value}
                </p>
              </a>
            ))}
          </div>

          {/* Office + map */}
          <div className="mt-10 grid gap-8 lg:grid-cols-5">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-card lg:col-span-2">
              <h2 className="font-display text-2xl font-extrabold text-foreground">Visit our office</h2>
              <div className="mt-6 space-y-5 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">Office address</p>
                    <p className="mt-1 text-muted-foreground">{COMPANY.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">Working hours</p>
                    <p className="mt-1 text-muted-foreground">Open 24 hours • 7 days a week</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">Bookings & enquiries</p>
                    <a href={`tel:${COMPANY.phone}`} className="mt-1 block text-muted-foreground hover:text-primary">
                      {COMPANY.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border shadow-card lg:col-span-3">
              <iframe
                title="PBTW office location"
                src={`https://www.google.com/maps?q=${mapsQ}&output=embed`}
                width="100%"
                height="100%"
                style={{ minHeight: 380, border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
