import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Truck,
  Loader2,
  MapPin,
  Phone,
  CheckCircle2,
  PlayCircle,
  IndianRupee,
  Package,
  Wallet,
  Navigation,
  RefreshCw,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, WATER_TYPE_LABEL } from "@/lib/booking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/driver")({
  head: () => ({ meta: [{ title: "Driver Dashboard | PBTW" }] }),
  component: DriverDashboard,
});

type DriverRow = {
  user_id: string;
  name: string;
  phone: string;
  vehicle_no: string | null;
  status: string;
  total_deliveries: number;
  total_earnings: number;
};


type OrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  water_type: string;
  size_l: number;
  total: number;
  address_text: string;
  lat: number | null;
  lng: number | null;
  delivery_date: string;
  delivery_slot: string;
  created_at: string;
};

type EarningRow = { amount: number; earned_on: string };

const NEXT_STATUS: Record<string, (typeof ORDER_STATUS_FLOW)[number] | null> = {
  pending: "confirmed",
  confirmed: "assigned",
  assigned: "on_the_way",
  on_the_way: "reached",
  reached: "delivered",
  delivered: null,
};

function DriverDashboard() {
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const u = userRes.user;
    if (!u) return;

    const { data: d } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", u.id)
      .maybeSingle();
    setDriver(d ? (d as unknown as DriverRow) : null);

    if (d?.user_id) {
      const [{ data: ords }, { data: earns }] = await Promise.all([
        supabase
          .from("orders")
          .select(
            "id,order_code,customer_name,customer_phone,status,water_type,size_l,total,address_text,lat,lng,delivery_date,delivery_slot,created_at"
          )
          .eq("driver_id", d.user_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("driver_earnings")
          .select("amount,earned_on")
          .eq("driver_id", d.user_id)
          .order("earned_on", { ascending: false })
          .limit(60),
      ]);

      setOrders((ords ?? []) as OrderRow[]);
      setEarnings((earns ?? []) as EarningRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!driver?.user_id) return;
    const channel = supabase
      .channel(`driver-${driver.user_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `driver_id=eq.${driver.user_id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.user_id]);


  const advance = async (order: OrderRow) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: next })
        .eq("id", order.id);
      if (error) throw error;
      await supabase.from("order_tracking").insert({
        order_id: order.id,
        status: next,
        note: `Driver marked as ${ORDER_STATUS_LABEL[next]}`,
      });
      if (next === "delivered" && driver) {
        // Record earning + bump counters
        const earnAmount = Math.round(Number(order.total) * 0.6);
        await supabase.from("driver_earnings").insert({
          driver_id: driver.user_id,
          order_id: order.id,
          amount: earnAmount,
          earned_on: new Date().toISOString().slice(0, 10),
        });
        await supabase
          .from("drivers")
          .update({
            total_deliveries: driver.total_deliveries + 1,
            total_earnings: Number(driver.total_earnings) + earnAmount,
          })
          .eq("user_id", driver.user_id);

        // Auto-generate invoice record
        const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
        await supabase.from("invoices").insert({
          order_id: order.id,
          invoice_no: invoiceNo,
          data: { total: order.total, order_code: order.order_code },
        });
      }
      toast.success(`Order ${order.order_code}: ${ORDER_STATUS_LABEL[next]}`);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Could not update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const setAvailability = async (status: "available" | "offline" | "busy") => {
    if (!driver) return;
    const { error } = await supabase
      .from("drivers")
      .update({ status })
      .eq("user_id", driver.user_id);

    if (error) {
      toast.error("Could not update availability");
      return;
    }
    setDriver({ ...driver, status });
    toast.success(`Status: ${status}`);
  };

  const todayEarnings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return earnings
      .filter((e) => e.earned_on === today)
      .reduce((s, e) => s + Number(e.amount), 0);
  }, [earnings]);

  const weekEarnings = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return earnings
      .filter((e) => new Date(e.earned_on) >= weekAgo)
      .reduce((s, e) => s + Number(e.amount), 0);
  }, [earnings]);

  // Calculate hours online (from current session, or estimate based on deliveries)
  const hoursOnline = useMemo(() => {
    const sessionStart = new Date();
    sessionStart.setHours(7, 0, 0, 0); // Assume 7 AM start for demo
    const now = new Date();
    return Math.round((now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60) * 10) / 10;
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-surface pt-32 pb-24">
        <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-card">
          <Truck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
            You're not registered as a driver
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask an admin at PBTW to add your account to the driver fleet to access this dashboard.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Go to customer dashboard
          </Link>
        </div>
      </div>
    );
  }

  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const completed = orders.filter((o) => o.status === "delivered");

  return (
    <div className="bg-surface min-h-screen">
      <section className="bg-hero pt-32 pb-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              Driver Dashboard
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {driver.name}
            </h1>
            <p className="mt-1 text-sm text-white/75">
              {driver.vehicle_no || "Vehicle not set"} · {driver.total_deliveries} deliveries
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["available", "busy", "offline"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setAvailability(s)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  driver.status === s
                    ? "bg-accent text-accent-foreground"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {s}
              </button>
            ))}
            <button
              onClick={load}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto -mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat
              icon={IndianRupee}
              label="Today's earnings"
              value={`₹${todayEarnings}`}
              tone="primary"
            />
            <Stat
              icon={Wallet}
              label="Last 7 days"
              value={`₹${weekEarnings}`}
              tone="accent"
            />
            <Stat
              icon={Clock}
              label="Hours online"
              value={`${hoursOnline}h`}
              tone="emerald"
            />
            <Stat
              icon={Package}
              label="Active orders"
              value={String(active.length)}
              tone="primary"
            />
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl font-bold text-foreground">Active deliveries</h2>
            <p className="text-sm text-muted-foreground">
              Tap the action to move the order to its next status.
            </p>
            <div className="mt-4 grid gap-4">
              {active.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  No active deliveries right now.
                </div>
              ) : (
                active.map((o) => (
                  <DriverOrderCard
                    key={o.id}
                    order={o}
                    updating={updatingId === o.id}
                    onAdvance={() => advance(o)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-foreground">
              Recent completed
            </h2>
            <div className="mt-4 grid gap-3">
              {completed.slice(0, 8).map((o) => (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
                >
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">
                      {o.order_code} · {o.size_l.toLocaleString()} L
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.customer_name} · {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-display text-base font-bold text-emerald-600">
                    ₹{o.total}
                  </span>
                </div>
              ))}
              {!completed.length && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  No completed deliveries yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  tone: "primary" | "accent" | "emerald";
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl text-white",
          tone === "primary" ? "bg-primary" : tone === "accent" ? "bg-accent" : "bg-emerald-500"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

function DriverOrderCard({
  order,
  updating,
  onAdvance,
}: {
  order: OrderRow;
  updating: boolean;
  onAdvance: () => void;
}) {
  const next = NEXT_STATUS[order.status];
  const mapsHref = order.lat && order.lng
    ? `https://www.google.com/maps?q=${order.lat},${order.lng}`
    : `https://www.google.com/maps?q=${encodeURIComponent(order.address_text)}`;
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-bold text-foreground">
            {order.order_code}
            <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
              {ORDER_STATUS_LABEL[order.status]}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {WATER_TYPE_LABEL[order.water_type as keyof typeof WATER_TYPE_LABEL] ?? order.water_type} ·{" "}
            {order.size_l.toLocaleString()} L · {order.delivery_date} ·{" "}
            {order.delivery_slot.split(" · ")[0]}
          </p>
        </div>
        <p className="font-display text-xl font-extrabold text-primary">₹{order.total}</p>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="text-foreground">{order.address_text}</span>
        </div>
        <div className="flex items-start gap-2">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <a href={`tel:${order.customer_phone}`} className="font-medium text-foreground hover:text-primary">
            {order.customer_name} · {order.customer_phone}
          </a>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground"
        >
          <Navigation className="h-3.5 w-3.5" /> Navigate
        </a>
        <a
          href={`tel:${order.customer_phone}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </a>
        {next && (
          <button
            disabled={updating}
            onClick={onAdvance}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-card hover:scale-[1.03] disabled:opacity-60"
          >
            {next === "delivered" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
            Mark {ORDER_STATUS_LABEL[next]}
          </button>
        )}
      </div>
    </article>
  );
}
