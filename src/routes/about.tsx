import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Heart, Target, Users, Droplets, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — PAPPU BHAI TANKER WALE | Beawar Water Delivery" },
      {
        name: "description",
        content:
          "Our story: making water tanker delivery as easy as ordering food. Serving Beawar since 2025 with reliability you can trust.",
      },
      { property: "og:title", content: "About PAPPU BHAI TANKER WALE" },
      {
        property: "og:description",
        content: "Quality water tanker delivery in Beawar with a single mission — reliability customers can trust.",
      },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: Heart, title: "Customer first", desc: "Every order is treated like our first." },
  { icon: Award, title: "Quality water", desc: "Tested supply, properly sealed tankers." },
  { icon: Target, title: "Always on time", desc: "Slot-based dispatch and live tracking." },
  { icon: Users, title: "Local & trusted", desc: "Built for Beawar, run by Beawar." },
];

const STATS = [
  { v: "10K+", l: "Tankers delivered" },
  { v: "2025", l: "Year founded" },
  { v: "24×7", l: "Support" },
  { v: "4.9★", l: "Customer rating" },
];

function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero pt-32 pb-20 text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-sky/30 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider backdrop-blur">
            <Droplets className="h-3.5 w-3.5" /> Our story
          </div>
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Water delivery, <span className="text-gradient-accent">reimagined for Beawar</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/80">
            We started with a simple observation — getting clean water delivered shouldn't be complicated.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Our story</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              From a single tanker to a trusted local service
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/85">
              <p>
                <strong>PAPPU BHAI TANKER WALE</strong> was born from a simple observation —
                getting clean water delivered shouldn't be complicated.
              </p>
              <p>
                We started in 2025 with a single tanker and a mission to make water delivery
                as easy as ordering food online. Today, we serve homes, shops, restaurants
                and construction sites across Beawar — with the same care we put into our
                very first delivery.
              </p>
              <p className="font-semibold text-foreground">
                Our focus remains simple: delivering quality water with reliability customers can trust.
              </p>
            </div>

            <Link
              to="/book"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-transform hover:scale-[1.02]"
            >
              Book your first tanker <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              {STATS.map((s) => (
                <div
                  key={s.l}
                  className="rounded-2xl border border-border bg-card p-5 text-center shadow-card transition-transform hover:-translate-y-1"
                >
                  <p className="font-display text-3xl font-extrabold text-primary">{s.v}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">What we stand for</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Built on four simple values
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="group rounded-3xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-accent text-white">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-foreground">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
