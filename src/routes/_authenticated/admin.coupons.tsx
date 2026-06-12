import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ShieldAlert,
  Gift,
  Trash2,
  Copy,
  Plus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons | Admin" }] }),
  component: AdminCouponsPage,
});

type Coupon = {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  active: boolean;
  created_at: string;
};

function AdminCouponsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_percent: 10,
    max_uses: null as number | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    const { data, error } = await supabase
      .from("coupon_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setCoupons((data ?? []) as Coupon[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return toast.error("Enter coupon code");
    if (formData.discount_percent <= 0 || formData.discount_percent > 100) {
      return toast.error("Discount must be between 1-100%");
    }

    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("coupon_codes").insert({
        code: formData.code.toUpperCase().trim(),
        discount_percent: formData.discount_percent,
        max_uses: formData.max_uses || null,
        created_by: user.user.id,
      });

      if (error) throw error;
      toast.success("Coupon created successfully!");
      setFormData({ code: "", discount_percent: 10, max_uses: null });
      setShowCreateForm(false);
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create coupon";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from("coupon_codes")
        .update({ active: !coupon.active })
        .eq("id", coupon.id);

      if (error) throw error;
      toast.success(`Coupon ${!coupon.active ? "enabled" : "disabled"}!`);
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update coupon";
      toast.error(msg);
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    setDeletingId(coupon.id);
    try {
      const { error } = await supabase
        .from("coupon_codes")
        .delete()
        .eq("id", coupon.id);

      if (error) throw error;
      toast.success("Coupon deleted!");
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete coupon";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard!");
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
            <h1 className="font-display text-3xl font-extrabold">Coupon Codes</h1>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-semibold hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New Coupon
          </button>
        </div>

        {/* Create Coupon Form */}
        {showCreateForm && (
          <div className="rounded-2xl border border-border bg-card p-6 mb-8 shadow-card">
            <h2 className="font-display text-xl font-bold mb-4">Create New Coupon</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Coupon Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., SAVE10, SUMMER20"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Must be unique and uppercase</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Discount Percentage</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) })}
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-lg font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Max Uses (Optional)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses || ""}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Leave blank for unlimited"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 font-semibold hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Create Coupon
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 border border-border rounded-lg py-2 font-semibold hover:bg-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons List */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Gift className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No coupons created yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => {
              const usagePercent = coupon.max_uses
                ? Math.round((coupon.current_uses / coupon.max_uses) * 100)
                : null;
              const isNearLimit =
                coupon.max_uses && coupon.current_uses / coupon.max_uses > 0.8;
              const isExhausted =
                coupon.max_uses && coupon.current_uses >= coupon.max_uses;

              return (
                <div
                  key={coupon.id}
                  className={cn(
                    "rounded-2xl border p-5 shadow-card hover:shadow-md transition-shadow",
                    coupon.active ? "border-border bg-card" : "border-muted bg-muted/30"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="font-display text-lg font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="text-muted-foreground hover:text-foreground p-1"
                          title="Copy code"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Created on {new Date(coupon.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold text-accent">
                        {coupon.discount_percent}%
                      </p>
                      <span
                        className={cn(
                          "inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1",
                          coupon.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {coupon.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Usage Info */}
                  {coupon.max_uses && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Usage: {coupon.current_uses} / {coupon.max_uses}
                        </span>
                        <span className={cn(
                          "font-semibold",
                          isExhausted ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-foreground"
                        )}>
                          {usagePercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            isExhausted
                              ? "bg-red-500"
                              : isNearLimit
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          )}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isExhausted && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="h-3.5 w-3.5" /> This coupon has reached its usage limit
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleToggleCoupon(coupon)}
                      className={cn(
                        "flex-1 rounded-lg py-2 font-semibold text-sm transition-colors",
                        coupon.active
                          ? "bg-secondary hover:bg-secondary/80"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      )}
                    >
                      {coupon.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon)}
                      disabled={deletingId === coupon.id}
                      className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-semibold text-sm disabled:opacity-60 inline-flex items-center gap-1"
                    >
                      {deletingId === coupon.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
