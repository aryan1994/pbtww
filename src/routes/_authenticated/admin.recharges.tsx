import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert, CheckCircle2, XCircle, ExternalLink, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/recharges")({
  head: () => ({ meta: [{ title: "Wallet Recharges | Admin" }] }),
  component: AdminRechargesPage,
});

type Req = {
  id: string;
  user_id: string;
  amount: number;
  upi_ref: string | null;
  screenshot_url: string;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  created_at: string;
};

type ProfileLite = { id: string; full_name: string | null; email: string | null; phone: string | null };

function AdminRechargesPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Req[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return setIsAdmin(false);
      const { data: r } = await supabase
        .from("user_roles").select("role").eq("user_id", data.user.id).eq("role","admin").maybeSingle();
      setIsAdmin(!!r);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wallet_recharge_requests")
      .select("id,user_id,amount,upi_ref,screenshot_url,status,note,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data ?? []) as Req[];
    setRows(list);
    const ids = Array.from(new Set(list.map(r => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("id,full_name,email,phone").in("id", ids);
      const m: Record<string, ProfileLite> = {};
      (profs ?? []).forEach(p => { m[(p as ProfileLite).id] = p as ProfileLite; });
      setProfiles(m);
    }
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);

  const filtered = useMemo(() => rows.filter(r => tab === "all" ? true : r.status === tab), [rows, tab]);
  const counts = rows.reduce((a,r) => ({ ...a, [r.status]: (a[r.status]??0)+1, all: a.all+1 }), { pending:0, approved:0, rejected:0, all:0 } as Record<string,number>);

  async function openShot(path: string) {
    const { data, error } = await supabase.storage.from("wallet-screenshots").createSignedUrl(path, 600);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }
  async function approve(r: Req) {
    setBusyId(r.id);
    const { error } = await supabase.rpc("approve_wallet_recharge", { _request_id: r.id, _note: undefined });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Credited ₹${r.amount}`);
    void load();
  }
  async function reject(r: Req) {
    const note = window.prompt("Reason for rejection? (optional)") || undefined;
    setBusyId(r.id);
    const { error } = await supabase.rpc("reject_wallet_recharge", { _request_id: r.id, _note: note });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    void load();
  }

  if (isAdmin === null) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>;
  if (!isAdmin) return (
    <div className="flex min-h-screen items-center justify-center bg-hero">
      <div className="rounded-3xl bg-card p-10 text-center shadow-elegant">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-500"/>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Admin access required</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary underline">Back to home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
          <h1 className="font-display text-3xl font-extrabold">Wallet Recharges</h1>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(["pending","approved","rejected","all"] as const).map(s => (
            <button key={s} onClick={()=>setTab(s)} className={`rounded-full border px-4 py-1.5 text-xs font-semibold capitalize ${tab===s?"border-primary bg-primary text-primary-foreground":"border-border bg-card hover:bg-secondary"}`}>
              {s} ({counts[s]??0})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">No requests.</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map(r => {
              const p = profiles[r.user_id];
              return (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold">{p?.full_name ?? "Unknown"} <span className="text-xs font-normal text-muted-foreground">· {p?.phone ?? p?.email ?? r.user_id.slice(0,8)}</span></p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} {r.upi_ref ? `· ref ${r.upi_ref}` : ""} {r.note ? `· ${r.note}` : ""}</p>
                    </div>
                    <p className="font-display text-2xl font-extrabold text-primary">₹{Number(r.amount).toFixed(0)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button onClick={()=>openShot(r.screenshot_url)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
                      <ExternalLink className="h-3.5 w-3.5"/> View screenshot
                    </button>
                    {r.status === "pending" ? (
                      <>
                        <button disabled={busyId===r.id} onClick={()=>approve(r)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 hover:bg-emerald-700">
                          {busyId===r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <CheckCircle2 className="h-3.5 w-3.5"/>} Approve & credit
                        </button>
                        <button disabled={busyId===r.id} onClick={()=>reject(r)} className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 hover:bg-rose-700">
                          <XCircle className="h-3.5 w-3.5"/> Reject
                        </button>
                      </>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.status==="approved"?"bg-emerald-100 text-emerald-800":"bg-rose-100 text-rose-800"}`}>
                        {r.status==="approved" ? <Wallet className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>} {r.status}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
