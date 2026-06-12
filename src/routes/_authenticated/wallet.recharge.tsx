import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, UploadCloud, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/wallet/recharge")({
  head: () => ({ meta: [{ title: "Recharge Wallet | PBTW" }] }),
  component: RechargePage,
});

const UPI_ID = "pappubhaitanker@upi";

type Req = {
  id: string;
  amount: number;
  upi_ref: string | null;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  created_at: string;
};

function RechargePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("500");
  const [upiRef, setUpiRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setUserId(u.user.id);
    const [{ data: w }, { data: rows }] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", u.user.id).maybeSingle(),
      supabase
        .from("wallet_recharge_requests")
        .select("id,amount,upi_ref,status,note,created_at")
        .order("created_at", { ascending: false }),
    ]);
    setBalance(Number(w?.balance ?? 0));
    setHistory((rows ?? []) as Req[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`recharge-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallet_recharge_requests", filter: `user_id=eq.${userId}` },
        () => void load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        () => void load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 50) { toast.error("Minimum recharge ₹50"); return; }
    if (!file) { toast.error("Upload your payment screenshot"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB image"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("wallet-screenshots")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { error } = await supabase.from("wallet_recharge_requests").insert({
        user_id: userId,
        amount: amt,
        upi_ref: upiRef.trim() || null,
        screenshot_url: path,
      });
      if (error) throw error;
      toast.success("Recharge submitted! Admin will approve shortly.");
      setAmount("500"); setUpiRef(""); setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>;
  }

  return (
    <div className="min-h-screen bg-surface pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wallet</p>
            <h1 className="font-display text-3xl font-extrabold">Recharge Wallet</h1>
          </div>
          <div className="rounded-2xl border border-border bg-card px-5 py-3 shadow-card">
            <p className="text-[10px] uppercase text-muted-foreground">Balance</p>
            <p className="font-display text-2xl font-extrabold text-primary">₹{balance.toFixed(0)}</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-card p-6 shadow-elegant">
            <h2 className="font-display text-lg font-bold">Step 1 — Pay via UPI</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pay any amount to the UPI ID below, then upload the screenshot.</p>
            <div className="mt-4 rounded-2xl bg-secondary/50 p-4 text-center">
              <img
                alt="UPI QR"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=PBTW&cu=INR`)}`}
                className="mx-auto h-44 w-44 rounded-xl bg-white p-2"
              />
              <p className="mt-3 font-mono text-sm font-semibold">{UPI_ID}</p>
              <p className="text-xs text-muted-foreground">PAPPU BHAI TANKER WALE</p>
            </div>
          </div>

          <form onSubmit={submit} className="rounded-3xl bg-card p-6 shadow-elegant space-y-4">
            <h2 className="font-display text-lg font-bold">Step 2 — Submit proof</h2>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Amount (₹)</span>
              <input type="number" min={50} value={amount} onChange={(e)=>setAmount(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm"/>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">UPI Reference / Txn ID (optional)</span>
              <input value={upiRef} onChange={(e)=>setUpiRef(e.target.value.slice(0,40))} className="h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm"/>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-4 hover:border-primary">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UploadCloud className="h-5 w-5"/></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Payment screenshot</p>
                <p className="truncate text-sm font-medium">{file ? file.name : "Tap to upload (JPG/PNG)"}</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e)=>setFile(e.target.files?.[0]??null)}/>
            </label>
            <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wallet className="h-4 w-4"/>}
              {busy ? "Submitting…" : "Submit for approval"}
            </button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-lg font-bold">Recent recharges</h2>
          {history.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">No recharges yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
              {history.map(r => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold">₹{Number(r.amount).toFixed(0)} {r.upi_ref ? <span className="text-xs text-muted-foreground">· {r.upi_ref}</span> : null}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} {r.note ? `· ${r.note}` : ""}</p>
                  </div>
                  <StatusBadge s={r.status}/>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link to="/dashboard" className="mt-6 inline-block text-sm font-semibold text-primary underline">← Back to dashboard</Link>
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: Req["status"] }) {
  const map = {
    pending: { cls: "bg-amber-100 text-amber-800", icon: <Clock className="h-3 w-3"/> },
    approved: { cls: "bg-emerald-100 text-emerald-800", icon: <CheckCircle2 className="h-3 w-3"/> },
    rejected: { cls: "bg-rose-100 text-rose-800", icon: <XCircle className="h-3 w-3"/> },
  } as const;
  const v = map[s];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${v.cls}`}>{v.icon}{s}</span>;
}
