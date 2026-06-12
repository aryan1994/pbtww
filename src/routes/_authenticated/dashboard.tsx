import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  MapPin,
  FileText,
  Gift,
  Loader2,
  CheckCircle2,
  Truck,
  Wallet,
  Droplets,
  Clock,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  WATER_TYPE_LABEL,
  WALLET_DISCOUNT_PCT,
  DELIVERY_RATE_PER_KM,
} from "@/lib/booking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard | PBTW" }] }),
  component: DashboardPage,
});

type OrderRow = {
  id: string;
  order_code: string;
  status: string;
  water_type: string;
  size_l: number;
  total: number;
  distance_km: number;
  delivery_charge: number;
  wallet_discount: number;
  payment_method: string;
  address_text: string;
  delivery_date: string;
  delivery_slot: string;
  created_at: string;
};

type TrackingRow = {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
};

type InvoiceRow = {
  id: string;
  order_id: string;
  invoice_no: string;
  issued_at: string;
  pdf_url: string | null;
};

type Tab = "orders" | "track" | "invoices" | "offers";

function DashboardPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [trackingByOrder, setTrackingByOrder] = useState<Record<string, TrackingRow[]>>({});
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const load = async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const u = userRes.user;
      if (!u) { setLoading(false); return; }
      setUserId(u.id);

      const [walletRes, ordersRes, invRes] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", u.id).maybeSingle(),
        supabase
          .from("orders")
          .select(
            "id,order_code,status,water_type,size_l,total,distance_km,delivery_charge,wallet_discount,payment_method,address_text,delivery_date,delivery_slot,created_at"
          )
          .eq("customer_id", u.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select("id,order_id,invoice_no,issued_at,pdf_url")
          .order("issued_at", { ascending: false }),
      ]);

      setWalletBalance(Number(walletRes.data?.balance ?? 0));
      const ordersList = (ordersRes.data ?? []) as OrderRow[];
      setOrders(ordersList);
      setInvoices((invRes.data ?? []) as InvoiceRow[]);

      if (ordersList.length) {
        if (!selectedOrder) setSelectedOrder(ordersList[0].id);
        const ids = ordersList.map((o) => o.id);
        const { data: tracks } = await supabase
          .from("order_tracking")
          .select("id,order_id,status,note,created_at")
          .in("order_id", ids)
          .order("created_at", { ascending: true });
        const grouped: Record<string, TrackingRow[]> = {};
        (tracks ?? []).forEach((t) => {
          const row = t as TrackingRow;
          grouped[row.order_id] = grouped[row.order_id] ?? [];
          grouped[row.order_id].push(row);
        });
        setTrackingByOrder(grouped);
      }
    } catch (err) {
      console.error("dashboard load", err);
      setLoadError(err instanceof Error ? err.message : "Could not load your dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime subscribe to orders + tracking for this user
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`dashboard-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${userId}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_tracking" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled"),
    [orders]
  );

  const trackingOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrder) ?? activeOrders[0] ?? orders[0],
    [orders, selectedOrder, activeOrders]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-primary" />
        </div>
        <p className="text-xs text-muted-foreground">Loading your dashboard…</p>
        <style>{`@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <p className="font-display text-lg font-bold text-foreground">Couldn't load your data</p>
        <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          <RefreshCw className="h-4 w-4"/> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen">
      <section className="bg-hero pt-32 pb-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              Customer Dashboard
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Track every tanker, every rupee
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Wallet</p>
              <p className="font-display text-xl font-bold">₹{walletBalance.toFixed(0)}</p>
            </div>
            <Link
              to="/wallet/recharge"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/25"
            >
              <Wallet className="h-4 w-4" /> Recharge
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-card hover:scale-[1.03]"
            >
              <Droplets className="h-4 w-4" /> New booking
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto -mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-2 shadow-elegant">
            <div className="flex flex-wrap gap-1">
              <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={<Package className="h-4 w-4" />}>
                Orders <span className="text-xs opacity-70">({orders.length})</span>
              </TabButton>
              <TabButton active={tab === "track"} onClick={() => setTab("track")} icon={<MapPin className="h-4 w-4" />}>
                Live Track {activeOrders.length > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">{activeOrders.length}</span>}
              </TabButton>
              <TabButton active={tab === "invoices"} onClick={() => setTab("invoices")} icon={<FileText className="h-4 w-4" />}>
                Invoices
              </TabButton>
              <TabButton active={tab === "offers"} onClick={() => setTab("offers")} icon={<Gift className="h-4 w-4" />}>
                Offers
              </TabButton>
              <button
                onClick={load}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
          </div>

          <div className="mt-6">
            {tab === "orders" && (
              <OrdersTab orders={orders} onTrack={(id) => { setSelectedOrder(id); setTab("track"); }} />
            )}
            {tab === "track" && (
              <TrackTab
                orders={orders}
                selected={trackingOrder}
                onSelect={setSelectedOrder}
                trackingByOrder={trackingByOrder}
              />
            )}
            {tab === "invoices" && <InvoicesTab orders={orders} invoices={invoices} />}
            {tab === "offers" && <OffersTab />}
          </div>
        </div>
      </section>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        active ? "bg-primary text-primary-foreground shadow-card" : "text-foreground hover:bg-secondary"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function OrdersTab({ orders, onTrack }: { orders: OrderRow[]; onTrack: (id: string) => void }) {
  if (!orders.length) return <EmptyState title="No bookings yet" subtitle="Place your first order to see it here." cta />;
  return (
    <div className="grid gap-4">
      {orders.map((o) => (
        <article key={o.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-base font-bold text-foreground">
                {o.order_code} <StatusPill status={o.status} />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleString()}
              </p>
            </div>
            <p className="font-display text-2xl font-extrabold text-primary">₹{o.total}</p>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
            <Meta label="Water" value={WATER_TYPE_LABEL[o.water_type as keyof typeof WATER_TYPE_LABEL] ?? o.water_type} />
            <Meta label="Tanker" value={`${o.size_l.toLocaleString()} L`} />
            <Meta label="Distance" value={`${Number(o.distance_km).toFixed(1)} km`} />
            <Meta label="Delivery" value={`${o.delivery_date} · ${o.delivery_slot.split(" · ")[0]}`} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{o.address_text}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {o.payment_method.toUpperCase()} · Delivery ₹{o.delivery_charge}
              {o.wallet_discount > 0 && ` · Saved ₹${o.wallet_discount}`}
            </span>
            <button
              onClick={() => onTrack(o.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              Track <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function TrackTab({
  orders,
  selected,
  onSelect,
  trackingByOrder,
}: {
  orders: OrderRow[];
  selected?: OrderRow;
  onSelect: (id: string) => void;
  trackingByOrder: Record<string, TrackingRow[]>;
}) {
  if (!orders.length) return <EmptyState title="Nothing to track yet" subtitle="Bookings appear here once placed." cta />;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <aside className="space-y-2 lg:col-span-1">
        {orders.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition-colors",
              selected?.id === o.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-secondary/50"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-bold text-foreground">{o.order_code}</p>
              <StatusPill status={o.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {o.size_l.toLocaleString()} L · ₹{o.total}
            </p>
          </button>
        ))}
      </aside>
      <div className="lg:col-span-2">
        {selected ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold text-foreground">{selected.order_code}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selected.address_text}
                </p>
              </div>
              <StatusPill status={selected.status} large />
            </div>
            <StatusTimeline
              currentStatus={selected.status}
              events={trackingByOrder[selected.id] ?? []}
            />
          </div>
        ) : (
          <EmptyState title="Pick an order" subtitle="Select a booking on the left to see its timeline." />
        )}
      </div>
    </div>
  );
}

function StatusTimeline({
  currentStatus,
  events,
}: {
  currentStatus: string;
  events: TrackingRow[];
}) {
  const currentIdx = ORDER_STATUS_FLOW.indexOf(currentStatus as (typeof ORDER_STATUS_FLOW)[number]);
  const lastEventByStatus = new Map<string, TrackingRow>();
  events.forEach((e) => lastEventByStatus.set(e.status, e));

  return (
    <ol className="mt-6 space-y-4">
      {ORDER_STATUS_FLOW.map((s, idx) => {
        const reached = currentIdx >= idx;
        const isCurrent = idx === currentIdx;
        const event = lastEventByStatus.get(s);
        return (
          <li key={s} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                  reached
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-muted-foreground",
                  isCurrent && "ring-4 ring-primary/25 animate-pulse"
                )}
              >
                {reached ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </span>
              {idx < ORDER_STATUS_FLOW.length - 1 && (
                <span
                  className={cn(
                    "mt-1 h-10 w-0.5",
                    reached && currentIdx > idx ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-2">
              <p
                className={cn(
                  "font-display text-sm font-bold",
                  reached ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {ORDER_STATUS_LABEL[s]}
              </p>
              {event && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString()}
                  {event.note && ` · ${event.note}`}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function InvoicesTab({ orders, invoices }: { orders: OrderRow[]; invoices: InvoiceRow[] }) {
  const orderById = new Map(orders.map((o) => [o.id, o]));
  if (!invoices.length) {
    return (
      <EmptyState
        title="No invoices yet"
        subtitle="Invoices are generated automatically once your order is delivered."
      />
    );
  }
  return (
    <div className="grid gap-3">
      {invoices.map((inv) => {
        const o = orderById.get(inv.order_id);
        return (
          <div
            key={inv.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
          >
            <div>
              <p className="font-display text-sm font-bold text-foreground">{inv.invoice_no}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(inv.issued_at).toLocaleDateString()}
                {o && ` · Order ${o.order_code}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {o && <p className="font-display text-lg font-bold text-primary">₹{o.total}</p>}
              {inv.pdf_url ? (
                <a
                  href={inv.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  <FileText className="h-3.5 w-3.5" /> Download
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">PDF generating…</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OffersTab() {
  const offers = [
    {
      icon: Wallet,
      title: `${WALLET_DISCOUNT_PCT}% off with wallet`,
      desc: "Pay with your PBTW wallet on any tanker and save instantly.",
      tag: "Always on",
    },
    {
      icon: Truck,
      title: `Flat ₹${DELIVERY_RATE_PER_KM}/km delivery`,
      desc: "Transparent kilometre-based pricing — no hidden fees.",
      tag: "City-wide",
    },
    {
      icon: Sparkles,
      title: "Refer & earn ₹50",
      desc: "Share your referral code from your profile to earn wallet credit.",
      tag: "Friends only",
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((o) => (
        <article
          key={o.title}
          className="rounded-3xl border border-border bg-card p-6 shadow-card"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-accent text-white">
            <o.icon className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            {o.tag}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-foreground">{o.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{o.desc}</p>
        </article>
      ))}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function StatusPill({ status, large }: { status: string; large?: boolean }) {
  const colour =
    status === "delivered"
      ? "bg-emerald-100 text-emerald-700"
      : status === "cancelled"
      ? "bg-rose-100 text-rose-700"
      : status === "pending"
      ? "bg-amber-100 text-amber-700"
      : "bg-sky-100 text-sky-700";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold uppercase tracking-wider",
        large ? "px-3 py-1 text-xs" : "ml-2 px-2 py-0.5 text-[10px]",
        colour
      )}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}

function EmptyState({
  title,
  subtitle,
  cta,
}: {
  title: string;
  subtitle: string;
  cta?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <Package className="h-10 w-10 text-muted-foreground" />
      <p className="mt-4 font-display text-lg font-bold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{subtitle}</p>
      {cta && (
        <Link
          to="/book"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-card hover:scale-[1.03]"
        >
          Book a tanker
        </Link>
      )}
    </div>
  );
}
