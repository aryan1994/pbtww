import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ShieldAlert,
  Bell,
  Search,
  Package,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WATER_TYPE_LABEL, ORDER_STATUS_LABEL } from "@/lib/booking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Orders | Admin" }] }),
  component: AdminOrdersPage,
});

type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  driver_id: string | null;
  status: string;
  water_type: string;
  size_l: number;
  total: number;
  address_text: string;
  delivery_date: string;
  delivery_slot: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

type Driver = {
  user_id: string;
  name: string;
  phone: string;
  vehicle_no: string;
  status: string;
};

type NewOrderNotification = {
  id: string;
  order_code: string;
  customer_name: string;
  total: number;
  created_at: string;
};

function AdminOrdersPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"pending" | "assigned" | "in_progress" | "delivered" | "all">("pending");
  const [newOrderNotifs, setNewOrderNotifs] = useState<NewOrderNotification[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTo, setAssigningTo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return setIsAdmin(false);
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!roleRow);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    const [ordersRes, driversRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("drivers")
        .select("*")
        .eq("status", "active"),
    ]);

    setOrders((ordersRes.data ?? []) as Order[]);
    setDrivers((driversRes.data ?? []) as Driver[]);
    setLoading(false);

    // Check for new orders (created in last 5 minutes)
    const recentOrders = (ordersRes.data ?? [])
      .filter((o: Order) => {
        const createdTime = new Date(o.created_at).getTime();
        const now = new Date().getTime();
        return now - createdTime < 5 * 60 * 1000 && o.status === "pending";
      });
    
    if (recentOrders.length > 0) {
      setNewOrderNotifs(recentOrders.map((o: Order) => ({
        id: o.id,
        order_code: o.order_code,
        customer_name: o.customer_name,
        total: o.total,
        created_at: o.created_at,
      })));
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void load();
      // Poll for new orders every 10 seconds
      const interval = setInterval(() => load(), 10000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  // Real-time subscriptions
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => {
        const matches =
          selectedTab === "all"
            ? true
            : selectedTab === "pending" ? o.status === "pending" && !o.driver_id
            : selectedTab === "assigned" ? o.driver_id && o.status === "confirmed"
            : selectedTab === "in_progress" ? ["on_the_way", "reached"].includes(o.status)
            : selectedTab === "delivered" ? o.status === "delivered"
            : true;
        return matches;
      })
      .filter(
        (o) =>
          !q ||
          o.order_code.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q) ||
          o.customer_email.toLowerCase().includes(q)
      );
  }, [orders, query, selectedTab]);

  async function assignDriver(order: Order, driverId: string) {
    setAssigningTo(driverId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ driver_id: driverId, status: "confirmed" })
        .eq("id", order.id);
      
      if (error) throw error;
      
      toast.success("Driver assigned successfully!");
      setShowAssignModal(false);
      setSelectedOrder(null);
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to assign driver";
      toast.error(msg);
    } finally {
      setAssigningTo(null);
    }
  }

  const dismissNotif = (id: string) => {
    setNewOrderNotifs(newOrderNotifs.filter((n) => n.id !== id));
  };

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero">
        <div className="rounded-3xl bg-card p-10 text-center shadow-elegant">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Admin access required</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      {/* New Order Notifications */}
      {newOrderNotifs.length > 0 && (
        <div className="fixed top-24 right-4 z-50 space-y-2 max-w-sm">
          {newOrderNotifs.map((notif) => (
            <div
              key={notif.id}
              className="rounded-lg bg-white border-l-4 border-accent shadow-lg p-4 animate-in slide-in-from-right"
            >
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-foreground">New Order!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notif.customer_name} · {notif.order_code}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">₹{notif.total}</p>
                </div>
                <button
                  onClick={() => dismissNotif(notif.id)}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
              <h1 className="font-display text-3xl font-extrabold">Orders Management</h1>
            </div>
            <button
              onClick={() => load()}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold hover:bg-secondary/80"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["pending", "assigned", "in_progress", "delivered", "all"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-colors",
                  selectedTab === tab
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-secondary"
                )}
              >
                {tab === "in_progress" ? "In Progress" : tab}
                {tab !== "all" && ` (${filtered.filter(o => {
                  if (tab === "pending") return o.status === "pending" && !o.driver_id;
                  if (tab === "assigned") return o.driver_id && o.status === "confirmed";
                  if (tab === "in_progress") return ["on_the_way", "reached"].includes(o.status);
                  if (tab === "delivered") return o.status === "delivered";
                  return true;
                }).length})`}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by order code, customer name, phone, email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base font-bold text-foreground">{order.order_code}</p>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold",
                        order.status === "pending" && "bg-yellow-100 text-yellow-800",
                        order.status === "confirmed" && "bg-blue-100 text-blue-800",
                        order.status === "on_the_way" && "bg-cyan-100 text-cyan-800",
                        order.status === "reached" && "bg-purple-100 text-purple-800",
                        order.status === "delivered" && "bg-green-100 text-green-800",
                        order.status === "cancelled" && "bg-red-100 text-red-800",
                      )}>
                        {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] || order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-display text-2xl font-extrabold text-primary">₹{order.total}</p>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="mt-0.5 font-semibold">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Order Details</p>
                    <p className="mt-0.5 font-semibold">
                      {WATER_TYPE_LABEL[order.water_type as keyof typeof WATER_TYPE_LABEL]} · {order.size_l}L
                    </p>
                    <p className="text-xs text-muted-foreground">{order.delivery_date} {order.delivery_slot.split(" · ")[0]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="mt-0.5 text-xs line-clamp-2">{order.address_text}</p>
                  </div>
                </div>

                {order.driver_id && (
                  <div className="mt-3 rounded-lg bg-primary/5 p-2 text-xs text-primary">
                    Driver assigned: <span className="font-semibold">{drivers.find(d => d.user_id === order.driver_id)?.name}</span>
                  </div>
                )}

                {order.status === "pending" && !order.driver_id && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowAssignModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90"
                    >
                      <Eye className="h-4 w-4" /> Assign Driver
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Driver Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-card p-6 shadow-xl max-w-md w-full">
            <h2 className="font-display text-xl font-bold mb-4">Assign Driver for {selectedOrder.order_code}</h2>
            
            {drivers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active drivers available</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {drivers.map((driver) => (
                  <button
                    key={driver.user_id}
                    onClick={() => assignDriver(selectedOrder, driver.user_id)}
                    disabled={assigningTo === driver.user_id}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary disabled:opacity-60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">{driver.vehicle_no}</p>
                      </div>
                      {assigningTo === driver.user_id && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrder(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-secondary font-semibold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
