import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Droplets,
  HardHat,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Home,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
  IndianRupee,
  Banknote,
  QrCode,
  Wallet,
  Map as MapIcon,
  Truck,
} from "lucide-react";
import {
  PRICING,
  WATER_TYPE_LABEL,
  ORIGIN_COORDS,
  DELIVERY_RATE_PER_KM,
  WALLET_DISCOUNT_PCT,
  calcDeliveryCharge,
  calcWalletDiscount,
  haversineKm,
  type TankerSize,
  type WaterType,
  generateOrderId,
  buildWhatsAppLink,
  COMPANY,
} from "@/lib/booking";
import { cn } from "@/lib/utils";
import { MapPicker, type PickedLocation } from "@/components/MapPicker";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Water Tanker Online in Beawar | PAPPU BHAI TANKER WALE" },
      {
        name: "description",
        content:
          "Book a water tanker in Beawar with live Google Maps location, real distance pricing at ₹59/km, and a 15% wallet discount.",
      },
      { property: "og:title", content: "Book a Water Tanker — PAPPU BHAI TANKER WALE" },
      {
        property: "og:description",
        content: "Pick your spot on the map, see real-time delivery charge, pay with wallet for 15% off.",
      },
    ],
  }),
  component: BookPage,
});

const SIZES: { size: TankerSize; label: string; use: string }[] = [
  { size: 1000, label: "1000 L", use: "Small home / office" },
  { size: 3000, label: "3000 L", use: "Mid-size family" },
  { size: 5000, label: "5000 L", use: "Apartment / shop" },
  { size: 10000, label: "10000 L", use: "Construction site" },
];

const SLOTS = [
  "ASAP (within 90 min)",
  "Morning · 7 – 10 AM",
  "Late morning · 10 AM – 1 PM",
  "Afternoon · 1 – 4 PM",
  "Evening · 4 – 7 PM",
  "Night · 7 – 10 PM",
];

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function maxDateISO() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function BookPage() {
  const [waterType, setWaterType] = useState<WaterType>("drinking");
  const [size, setSize] = useState<TankerSize>(1000);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [date, setDate] = useState(todayISO());
  const [slot, setSlot] = useState(SLOTS[0]);
  const [payment, setPayment] = useState<"cod" | "online" | "wallet">("cod");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Auth + wallet
  const [userId, setUserId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const [confirmation, setConfirmation] = useState<{
    orderCode: string;
    waUrl: string;
    amount: number;
    saved: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      setUserId(u.id);
      const [{ data: profile }, { data: w }] = await Promise.all([
        supabase.from("profiles").select("full_name,phone").eq("id", u.id).maybeSingle(),
        supabase.from("wallets").select("balance").eq("user_id", u.id).maybeSingle(),
      ]);
      if (profile?.full_name) setName(profile.full_name);
      if (profile?.phone) setPhone(profile.phone);
      setWalletBalance(Number(w?.balance ?? 0));
    })();
  }, []);

  const basePrice = useMemo(() => PRICING[waterType][size], [waterType, size]);
  const distanceKm = useMemo(
    () => (location ? haversineKm(ORIGIN_COORDS, { lat: location.lat, lng: location.lng }) : 0),
    [location]
  );
  const deliveryCharge = useMemo(() => calcDeliveryCharge(distanceKm), [distanceKm]);
  const subtotal = basePrice + deliveryCharge;
  const walletDiscount = payment === "wallet" ? calcWalletDiscount(subtotal) : 0;
  const total = Math.max(0, subtotal - walletDiscount);
  const canPayWallet = userId !== null && walletBalance >= total && total > 0;

  // Auto-revert to COD if wallet is selected but insufficient
  useEffect(() => {
    if (payment === "wallet" && (!userId || walletBalance < subtotal)) {
      setPayment("cod");
    }
  }, [payment, userId, walletBalance, subtotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter your name");
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error("Enter a valid 10-digit mobile number");
    if (!address.trim() || address.trim().length < 8)
      return toast.error("Please enter a complete delivery address");
    if (!location) return toast.error("Please pick your delivery location on the map");

    setSubmitting(true);
    const orderCode = generateOrderId();
    let saved = false;

    try {
      if (userId) {
        // Insert order
        const { data: orderRow, error: orderErr } = await supabase
          .from("orders")
          .insert({
            order_code: orderCode,
            customer_id: userId,
            customer_name: name.trim(),
            customer_phone: phone,
            water_type: waterType,
            size_l: size,
            base_price: basePrice,
            distance_km: Number(distanceKm.toFixed(2)),
            delivery_charge: deliveryCharge,
            wallet_discount: walletDiscount,
            gst: 0,
            total,
            payment_method: payment,
            status: "pending",
            address_text: address.trim(),
            landmark: landmark.trim() || null,
            lat: location.lat,
            lng: location.lng,
            delivery_date: date,
            delivery_slot: slot,
          })
          .select("id")
          .single();

        if (orderErr) throw orderErr;
        const orderId = orderRow.id;

        // Initial tracking entry
        await supabase.from("order_tracking").insert({
          order_id: orderId,
          status: "pending",
          note: "Order placed by customer",
        });

        // Wallet debit
        if (payment === "wallet") {
          const newBalance = walletBalance - total;
          await supabase
            .from("wallets")
            .update({ balance: newBalance })
            .eq("user_id", userId);
          await supabase.from("wallet_transactions").insert({
            user_id: userId,
            type: "debit",
            status: "approved",
            amount: total,
            reference: `Order ${orderCode}`,
          });
          setWalletBalance(newBalance);
        }
        saved = true;
      }
    } catch (err) {
      console.error("Order save error", err);
      toast.error("Could not save order to your account, sending on WhatsApp instead.");
    }

    const waUrl = buildWhatsAppLink({
      orderId: orderCode,
      name: name.trim(),
      phone,
      address: address.trim(),
      landmark: landmark.trim() || undefined,
      size,
      waterType,
      date,
      slot,
      payment,
      amount: total,
      distance: distanceKm,
      deliveryCharge,
      location: { lat: location.lat, lng: location.lng },
    });

    setConfirmation({ orderCode, waUrl, amount: total, saved });
    window.open(waUrl, "_blank", "noopener,noreferrer");
    toast.success("Order placed! Opening WhatsApp…");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSubmitting(false);
  };

  const resetForm = () => {
    setConfirmation(null);
    setAddress("");
    setLandmark("");
    setLocation(null);
  };

  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero pt-32 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-sky/30 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider backdrop-blur">
            <Droplets className="h-3.5 w-3.5" /> Live map pricing · ₹{DELIVERY_RATE_PER_KM}/km · {WALLET_DISCOUNT_PCT}% wallet off
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Book your tanker
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Pick water type, drop a pin on the map, and pay with your wallet to save 15%.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6 lg:px-8">
          {confirmation ? (
            <Confirmation reset={resetForm} confirmation={confirmation} />
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-6 rounded-[2rem] border border-border bg-card p-6 shadow-elegant sm:p-8 lg:grid-cols-3"
            >
              <div className="space-y-8 lg:col-span-2">
                {/* Water type */}
                <Section title="1. Choose water type" icon={<Droplets className="h-4 w-4" />}>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <TypeCard
                      active={waterType === "drinking"}
                      onClick={() => setWaterType("drinking")}
                      icon={<Droplets className="h-5 w-5" />}
                      title="Drinking"
                      subtitle="Tested, potable"
                      hint={`From ₹${PRICING.drinking[1000]}`}
                      accent="primary"
                    />
                    <TypeCard
                      active={waterType === "non-drinking"}
                      onClick={() => setWaterType("non-drinking")}
                      icon={<Home className="h-5 w-5" />}
                      title="Non-Drinking"
                      subtitle="Household use"
                      hint={`From ₹${PRICING["non-drinking"][1000]}`}
                      accent="accent"
                    />
                    <TypeCard
                      active={waterType === "construction"}
                      onClick={() => setWaterType("construction")}
                      icon={<HardHat className="h-5 w-5" />}
                      title="Construction"
                      subtitle="Bulk site supply"
                      hint={`From ₹${PRICING.construction[1000]}`}
                      accent="accent"
                    />
                  </div>
                </Section>

                {/* Size */}
                <Section title="2. Pick tanker size" icon={<Truck className="h-4 w-4" />}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {SIZES.map((s) => {
                      const price = PRICING[waterType][s.size];
                      const active = size === s.size;
                      return (
                        <button
                          key={s.size}
                          type="button"
                          onClick={() => setSize(s.size)}
                          className={cn(
                            "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all",
                            active
                              ? "border-primary bg-primary/5 shadow-glow"
                              : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                              active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                            )}
                          >
                            <Droplets className="h-4 w-4" />
                          </div>
                          <p className="mt-3 font-display text-lg font-bold text-foreground">{s.label}</p>
                          <p className="text-xs text-muted-foreground">{s.use}</p>
                          <p className="mt-3 font-display text-base font-bold text-primary">₹{price}</p>
                          {active && (
                            <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {/* Location */}
                <Section title="3. Delivery location" icon={<MapPin className="h-4 w-4" />}>
                  <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        {location ? (
                          <>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                              Location pinned · ~{distanceKm.toFixed(1)} km away
                            </p>
                            <p className="mt-1 truncate text-sm font-medium text-foreground">
                              {location.address ||
                                `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              No location yet
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Drop a pin so we can quote the exact delivery charge.
                            </p>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPickerOpen(true)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-card transition-transform hover:scale-[1.02]",
                          location
                            ? "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
                            : "bg-accent text-accent-foreground"
                        )}
                      >
                        <MapIcon className="h-4 w-4" />
                        {location ? "Change pin" : "Open map"}
                      </button>
                    </div>
                  </div>
                </Section>

                {/* Contact details */}
                <Section title="4. Your details" icon={<User className="h-4 w-4" />}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" icon={<User className="h-4 w-4" />}>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        type="text"
                        required
                        maxLength={80}
                        placeholder="e.g. Rahul Sharma"
                        className="input-base"
                      />
                    </Field>
                    <Field label="Mobile number" icon={<Phone className="h-4 w-4" />}>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        type="tel"
                        required
                        inputMode="numeric"
                        placeholder="10-digit mobile"
                        className="input-base"
                      />
                    </Field>
                    <Field
                      label="Delivery address"
                      icon={<Home className="h-4 w-4" />}
                      className="sm:col-span-2"
                    >
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        rows={3}
                        maxLength={300}
                        placeholder="House / flat no., street, area, city"
                        className="input-base resize-none"
                      />
                    </Field>
                    <Field label="Landmark (optional)" icon={<MapPin className="h-4 w-4" />} className="sm:col-span-2">
                      <input
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        type="text"
                        maxLength={120}
                        placeholder="e.g. Near SBI ATM"
                        className="input-base"
                      />
                    </Field>
                  </div>
                </Section>

                {/* Schedule */}
                <Section title="5. Delivery schedule" icon={<Calendar className="h-4 w-4" />}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Delivery date" icon={<Calendar className="h-4 w-4" />}>
                      <input
                        type="date"
                        value={date}
                        min={todayISO()}
                        max={maxDateISO()}
                        onChange={(e) => setDate(e.target.value)}
                        className="input-base"
                      />
                    </Field>
                    <Field label="Delivery slot" icon={<Clock className="h-4 w-4" />}>
                      <select
                        value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                        className="input-base"
                      >
                        {SLOTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </Section>

                {/* Payment */}
                <Section title="6. Payment method" icon={<IndianRupee className="h-4 w-4" />}>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <TypeCard
                      active={payment === "cod"}
                      onClick={() => setPayment("cod")}
                      icon={<Banknote className="h-5 w-5" />}
                      title="Cash on Delivery"
                      subtitle="Pay the driver"
                      hint="Most popular"
                      accent="primary"
                    />
                    <TypeCard
                      active={payment === "online"}
                      onClick={() => setPayment("online")}
                      icon={<QrCode className="h-5 w-5" />}
                      title="Online / UPI"
                      subtitle="QR via WhatsApp"
                      hint="Pay on chat"
                      accent="accent"
                    />
                    <TypeCard
                      active={payment === "wallet"}
                      onClick={() => {
                        if (!userId) {
                          toast.info("Sign in to use wallet & get 15% off");
                          return;
                        }
                        if (walletBalance < subtotal) {
                          toast.info("Insufficient wallet balance — top up to use wallet");
                          return;
                        }
                        setPayment("wallet");
                      }}
                      icon={<Wallet className="h-5 w-5" />}
                      title="Wallet"
                      subtitle={
                        userId
                          ? `Balance ₹${walletBalance.toFixed(0)}`
                          : "Sign in to use"
                      }
                      hint={`Save ${WALLET_DISCOUNT_PCT}%`}
                      accent="primary"
                      disabled={!canPayWallet && payment !== "wallet"}
                    />
                  </div>
                  {!userId && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      <Link to="/auth" className="font-semibold text-primary hover:underline">
                        Sign in
                      </Link>{" "}
                      to save orders to your account and unlock wallet discounts.
                    </p>
                  )}
                </Section>
              </div>

              {/* Summary */}
              <aside className="lg:col-span-1">
                <div className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Order summary
                  </p>
                  <SummaryRow label="Water" value={WATER_TYPE_LABEL[waterType]} />
                  <SummaryRow label="Tanker" value={`${size.toLocaleString()} L`} />
                  <SummaryRow label="Base price" value={`₹${basePrice}`} />
                  <SummaryRow
                    label={`Delivery (${distanceKm.toFixed(1)} km × ₹${DELIVERY_RATE_PER_KM})`}
                    value={location ? `₹${deliveryCharge}` : "Pin location"}
                  />
                  {payment === "wallet" && (
                    <SummaryRow
                      label={`Wallet discount (${WALLET_DISCOUNT_PCT}%)`}
                      value={`− ₹${walletDiscount}`}
                      highlight
                    />
                  )}
                  <SummaryRow label="Schedule" value={`${date} · ${slot.split(" · ")[0]}`} />
                  <div className="border-t border-border pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-display text-3xl font-extrabold text-primary">
                        ₹{total}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      All city-limit delivery charges included.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-accent-foreground shadow-card transition-transform hover:scale-[1.02] disabled:opacity-60"
                  >
                    {submitting ? "Placing order…" : "Place order & send on WhatsApp"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    {userId
                      ? "Order will be saved to your dashboard."
                      : "Sign in to track your order in real time."}
                  </p>
                </div>
              </aside>
            </form>
          )}
        </div>
      </section>

      <MapPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(loc) => {
          setLocation(loc);
          if (loc.address && !address) setAddress(loc.address);
        }}
        initial={location}
      />

      <style>{`
        .input-base {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background-color: var(--color-card);
          color: var(--color-foreground);
          font-size: 0.95rem;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        textarea.input-base {
          height: auto;
          padding: 12px 14px;
          line-height: 1.5;
        }
        .input-base:focus {
          outline: none;
          border-color: var(--color-ring);
          box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-ring) 18%, transparent);
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col", className)}>
      <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function TypeCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
  hint,
  accent,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  hint: string;
  accent: "primary" | "accent";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all",
        active
          ? accent === "primary"
            ? "border-primary bg-primary/5 shadow-glow"
            : "border-accent bg-accent/5 shadow-card"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50",
        disabled && "cursor-not-allowed opacity-55"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl text-white",
            accent === "primary" ? "bg-primary" : "bg-accent"
          )}
        >
          {icon}
        </span>
        <div>
          <p className="font-display text-base font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {hint}
      </p>
      {active && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium",
          highlight ? "text-emerald-600" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Confirmation({
  confirmation,
  reset,
}: {
  confirmation: { orderCode: string; waUrl: string; amount: number; saved: boolean };
  reset: () => void;
}) {
  return (
    <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-elegant sm:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-foreground">
        Order placed!
      </h2>
      <p className="mt-2 text-muted-foreground">
        {confirmation.saved
          ? "Saved to your dashboard. Track live status anytime."
          : "Your booking is on its way to our team."}
      </p>

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Order ID</p>
        <p className="mt-1 font-display text-2xl font-extrabold text-primary">
          {confirmation.orderCode}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Total · <span className="font-semibold text-foreground">₹{confirmation.amount}</span>
        </p>
      </div>

      <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
        We've opened WhatsApp so you can send the order to{" "}
        <span className="font-semibold text-foreground">{COMPANY.phone}</span> — please tap{" "}
        <em>Send</em> to confirm.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={confirmation.waUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-card transition-transform hover:scale-[1.03]"
        >
          <MessageCircle className="h-4 w-4" /> Reopen WhatsApp
        </a>
        {confirmation.saved && (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Track order
          </Link>
        )}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Book another
        </button>
      </div>
    </div>
  );
}
