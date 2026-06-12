import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Droplets,
  ShieldCheck,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import heroImg from "@/assets/hero-tanker.jpg";
import { COMPANY } from "@/lib/booking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Water Tanker Delivery in Beawar | PAPPU BHAI TANKER WALE" },
      {
        name: "description",
        content:
          "Book clean drinking & construction water tankers in Beawar — 1000L to 10000L. GPS-tracked, 24×7, on-time delivery. Call 9214775938.",
      },
      { property: "og:title", content: "Water Tanker Delivery in Beawar | PAPPU BHAI TANKER WALE" },
      {
        property: "og:description",
        content: "Clean water tanker delivery for homes, businesses & construction sites in Beawar.",
      },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: Home,
});

const TRUST = [
  { icon: Clock, title: "On-Time Delivery", desc: "Slot-based scheduling so you never wait." },
  { icon: MapPin, title: "GPS Tracked Tankers", desc: "Track your tanker live on the map." },
  { icon: ShieldCheck, title: "Tested Water Supply", desc: "Quality-checked drinking water." },
  { icon: Sparkles, title: "24×7 Support", desc: "We're here whenever you need us." },
];

const SIZES = [
  { size: "1000 L", use: "Small home / office", priceFrom: 79 },
  { size: "3000 L", use: "Mid-size families", priceFrom: 169 },
  { size: "5000 L", use: "Apartments & shops", priceFrom: 259 },
  { size: "10000 L", use: "Construction sites", priceFrom: 449 },
];

const STEPS = [
  { n: "01", t: "Choose your tanker", d: "Pick size, water type, and delivery slot." },
  { n: "02", t: "Pin your location", d: "Share GPS location for accurate delivery." },
  { n: "03", t: "Confirm & relax", d: "We dispatch the nearest tanker right away." },
];

const REVIEWS = [
  { name: "Rahul S.", role: "Resident, Beawar", text: "Always on time. Driver was polite and the water was clean. Booking on WhatsApp is a breeze." },
  { name: "Anita M.", role: "Café Owner", text: "Reliable supply every morning. PBTW saved us during the summer water shortage." },
  { name: "Vikram K.", role: "Builder", text: "Best price for construction water in Beawar. We use them on every site now." },
];

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-hero pt-28 pb-20 text-white sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-sky/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
          <div className="lg:col-span-6">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Now serving Beawar & nearby areas
            </div>

            <h1 className="reveal reveal-delay-1 mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Clean Water Delivered Fast —{" "}
              <span className="block text-gradient-accent">Book Your Water Tanker Now</span>
            </h1>

            <p className="reveal reveal-delay-2 mt-6 max-w-xl text-base text-white/80 sm:text-lg">
              Fast, reliable and affordable water tanker delivery for homes, businesses and
              construction sites. Starting at just <span className="font-semibold text-white">₹79</span>.
            </p>

            <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-3">
              <Link
                to="/book"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground shadow-elegant transition-transform hover:scale-[1.03]"
              >
                <Truck className="h-4 w-4" />
                Book Tanker
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href={`tel:${COMPANY.phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <Phone className="h-4 w-4" /> Call Now
              </a>
              <a
                href={`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent("I Need Your Service")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-card transition-transform hover:scale-[1.03]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>

            <div className="reveal reveal-delay-4 mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TRUST.map((t) => (
                <div
                  key={t.title}
                  className="rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur transition-colors hover:bg-white/10"
                >
                  <t.icon className="h-5 w-5 text-sky-300" />
                  <p className="mt-2 text-xs font-semibold leading-tight text-white">{t.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <div className="reveal reveal-delay-2 relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-sky/30 via-transparent to-accent/30 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-elegant">
                <img
                  src={heroImg}
                  alt="Pappu Bhai water tanker delivering clean water in Beawar"
                  width={1600}
                  height={1200}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="float-slow absolute -bottom-6 -left-6 hidden rounded-2xl border border-white/20 bg-white/95 p-4 shadow-elegant backdrop-blur sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg. delivery</p>
                    <p className="font-display text-lg font-bold text-foreground">Under 60 min</p>
                  </div>
                </div>
              </div>

              <div className="float-slow absolute -top-6 -right-6 hidden rounded-2xl border border-white/20 bg-white/95 p-4 shadow-elegant backdrop-blur sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Happy customers</p>
                    <p className="font-display text-lg font-bold text-foreground">4.9 / 5 rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIZES */}
      <section className="bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
              Tanker Sizes
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Pick the perfect tanker for your need
            </h2>
            <p className="mt-3 text-muted-foreground">
              From small homes to construction sites — we have a size that fits, with
              upfront pricing and no surprises.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SIZES.map((s, i) => (
              <div
                key={s.size}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-accent opacity-10 transition-opacity group-hover:opacity-20" />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-accent text-white">
                  <Droplets className="h-6 w-6" />
                </div>
                <p className="mt-5 font-display text-2xl font-extrabold text-foreground">{s.size}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.use}</p>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">From</p>
                    <p className="font-display text-xl font-bold text-primary">₹{s.priceFrom}</p>
                  </div>
                  <Link
                    to="/book"
                    className="rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    Book →
                  </Link>
                </div>
                <span className="absolute left-6 top-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
                How It Works
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Ordering water is now as easy as ordering food
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Three quick steps to get clean water delivered to your doorstep — anywhere in
                Beawar and nearby areas.
              </p>
              <Link
                to="/book"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-transform hover:scale-[1.02]"
              >
                Start your booking <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ol className="relative space-y-5 lg:pl-6">
              <span className="absolute left-[14px] top-3 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-primary via-sky to-accent lg:block" />
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="group relative rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elegant lg:pl-12"
                >
                  <span className="absolute -left-[6px] top-6 hidden h-7 w-7 items-center justify-center rounded-full border-4 border-background bg-primary text-[10px] font-bold text-primary-foreground lg:flex">
                    {s.n}
                  </span>
                  <p className="font-display text-lg font-bold text-foreground">{s.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
              What customers say
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Trusted across Beawar
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <figure
                key={r.name}
                className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/85">
                  “{r.text}”
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-hero p-10 text-white shadow-elegant sm:p-14 lg:p-20">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky/30 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Need a tanker today? We're on it.
                </h2>
                <p className="mt-3 max-w-md text-white/80">
                  Book in under 60 seconds. We'll dispatch the nearest tanker right after you confirm.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-white/85">
                  {["Same-day delivery available", "Cash or online payment", "GST invoice on request"].map(
                    (i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" /> {i}
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground shadow-card transition-transform hover:scale-[1.03]"
                >
                  <Truck className="h-4 w-4" /> Book Tanker
                </Link>
                <a
                  href={`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent("I Need Your Service")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-card transition-transform hover:scale-[1.03]"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
