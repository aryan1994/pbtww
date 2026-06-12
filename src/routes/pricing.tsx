import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, HardHat, Hammer, Check, ArrowRight, Sparkles } from "lucide-react";
import { PRICING, type WaterType } from "@/lib/booking";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Water Tanker Pricing in Beawar | PBTW Group" },
      {
        name: "description",
        content:
          "Transparent water tanker prices in Beawar — drinking water from ₹399, non-drinking from ₹99, construction from ₹79. Sizes 1000L to 10000L.",
      },
      { property: "og:title", content: "Water Tanker Pricing | PBTW Group" },
      {
        property: "og:description",
        content: "Real prices for drinking, non-drinking and construction water tankers in Beawar.",
      },
    ],
  }),
  component: PricingPage,
});

type Tier = {
  type: WaterType;
  label: string;
  tagline: string;
  icon: typeof Droplets;
  popular: 1000 | 3000 | 5000 | 10000;
  features: string[];
  accent: string;
};

const TIERS: Tier[] = [
  {
    type: "drinking",
    label: "Drinking Water",
    tagline: "Pure, filtered & tested water for homes and offices",
    icon: Droplets,
    popular: 3000,
    accent: "bg-primary",
    features: ["Lab tested", "Food-grade tankers", "Fast delivery", "Quality assured"],
  },
  {
    type: "non-drinking",
    label: "Non-Drinking Water",
    tagline: "Clean water for household and general purposes",
    icon: HardHat,
    popular: 3000,
    accent: "bg-navy-deep",
    features: ["Clean supply", "Regular tankers", "Same-day delivery", "Bulk discounts"],
  },
  {
    type: "construction",
    label: "Construction Water",
    tagline: "Bulk water supply for construction sites",
    icon: Hammer,
    popular: 5000,
    accent: "bg-teal-deep",
    features: ["Bulk supply", "Scheduled delivery", "Site delivery", "Volume discounts"],
  },
];

const SIZES: (1000 | 3000 | 5000 | 10000)[] = [1000, 3000, 5000, 10000];

function PricingPage() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero pt-32 pb-20 text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-aqua/30 blur-3xl" />
          <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-aqua/15 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Transparent pricing • No hidden fees
          </div>
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            No hidden charges. What you see is what you pay. Quality water at honest prices.
            <br />
            <span className="text-aqua font-semibold">Pay with Wallet & save 15% on every order.</span>
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="-mt-12 pb-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <article
                key={tier.type}
                className="relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card p-7 shadow-elegant transition-transform hover:-translate-y-1"
              >
                <header className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-extrabold text-foreground">
                      {tier.label}
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">{tier.tagline}</p>
                  </div>
                  <div className={`${tier.accent} flex h-12 w-12 items-center justify-center rounded-2xl text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </header>

                <div className="mt-6 space-y-2">
                  {SIZES.map((s) => {
                    const isPopular = tier.popular === s;
                    return (
                      <div
                        key={s}
                        className={
                          "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors " +
                          (isPopular
                            ? "border-primary bg-aqua/15"
                            : "border-border bg-secondary/40 hover:bg-secondary")
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-bold text-foreground">
                            {s.toLocaleString()} L
                          </span>
                          {isPopular && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                              Popular
                            </span>
                          )}
                        </div>
                        <span className="font-display text-lg font-extrabold text-primary">
                          ₹{PRICING[tier.type][s].toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <ul className="mt-6 space-y-2 text-sm text-foreground/85">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/book"
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-navy-deep"
                >
                  Book Now <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-3xl px-4 text-center text-xs text-muted-foreground">
          Prices shown are base tanker prices. Delivery is charged separately at{" "}
          <span className="font-semibold text-foreground">₹59/km</span> from our depot and
          calculated automatically when you book. Pay with Wallet to unlock{" "}
          <span className="font-semibold text-foreground">15% off</span> every order.
        </p>
      </section>
    </div>
  );
}
