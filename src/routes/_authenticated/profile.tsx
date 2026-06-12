import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  User,
  Wallet,
  Package,
  LogOut,
  Gift,
  ArrowRight,
  Loader2,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "My Profile | PBTW Group" }],
  }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  referral_code: string | null;
};

type WalletRow = { balance: number; total_savings: number };

function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const [p, w] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userRes.user.id).maybeSingle(),
        supabase.from("wallets").select("balance,total_savings").eq("user_id", userRes.user.id).maybeSingle(),
      ]);
      setProfile(p.data as Profile);
      setWallet(w.data as WalletRow);
      setLoading(false);
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    window.location.href = "/";
  };

  const copyCode = async () => {
    if (!profile?.referral_code) return;
    await navigator.clipboard.writeText(profile.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Referral code copied");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="bg-hero pt-32 pb-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            My Profile
          </h1>
          <p className="mt-3 text-white/80">
            Manage your account, view bookings, and top up your wallet.
          </p>
        </div>
      </section>

      <section className="-mt-12 pb-24">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {/* Profile card */}
          <article className="lg:col-span-1 rounded-3xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-accent text-white">
                <User className="h-7 w-7" />
              </span>
              <div>
                <p className="font-display text-lg font-bold text-foreground">
                  {profile?.full_name || "Customer"}
                </p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <Row k="Phone" v={profile?.phone || "—"} />
              <Row k="Account" v="Customer" />
            </dl>
            <button
              onClick={signOut}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </article>

          {/* Wallet */}
          <article className="lg:col-span-2 rounded-3xl bg-gradient-wallet p-7 text-white shadow-elegant">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/85">
                <Wallet className="h-4 w-4" /> Wallet Balance
              </div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                Save 15% with wallet
              </span>
            </div>
            <p className="mt-3 font-display text-5xl font-extrabold tracking-tight">
              ₹{Number(wallet?.balance ?? 0).toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-white/80">
              Total saved with wallet: ₹{Number(wallet?.total_savings ?? 0).toFixed(2)}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toast.info("Wallet recharge coming in the next phase")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-transform hover:scale-[1.02]"
              >
                Add Funds <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                <Package className="h-4 w-4" /> Book a tanker
              </Link>
            </div>
          </article>

          {/* Referral */}
          <article className="lg:col-span-3 rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aqua/20 text-primary">
                <Gift className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-base font-bold text-foreground">Your referral code</p>
                <p className="text-xs text-muted-foreground">Share & earn ₹50 per referral</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row">
              <div className="flex-1 rounded-xl border border-dashed border-border bg-secondary/40 px-5 py-4 text-center">
                <p className="font-display text-2xl font-extrabold tracking-[0.2em] text-primary">
                  {profile?.referral_code || "—"}
                </p>
              </div>
              <button
                onClick={copyCode}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-navy-deep"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy code"}
              </button>
            </div>
          </article>

          {/* Quick links */}
          <article className="lg:col-span-3 grid gap-3 sm:grid-cols-2">
            <Link to="/dashboard" className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant">
              <div>
                <p className="font-display text-base font-bold text-foreground">Customer Dashboard</p>
                <p className="text-xs text-muted-foreground">Orders, live tracking, invoices, offers</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/driver" className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant">
              <div>
                <p className="font-display text-base font-bold text-foreground">Driver Dashboard</p>
                <p className="text-xs text-muted-foreground">Assigned orders, status, earnings</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          </article>

        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="text-sm font-medium text-foreground">{v}</dd>
    </div>
  );
}
