import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Pause,
  FileText,
  ExternalLink,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DOC_FIELDS, getSignedDocUrl, STATUS_TONE } from "@/lib/driver-application";

export const Route = createFileRoute("/_authenticated/admin/drivers")({
  component: AdminDriversPage,
});

type Application = {
  id: string;
  user_id: string;
  full_name: string;
  mobile: string;
  email: string;
  address: string;
  vehicle_number: string;
  vehicle_type: string;
  aadhaar_number: string;
  pan_number: string;
  aadhaar_url: string;
  pan_url: string;
  dl_url: string;
  rc_url: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

function AdminDriversPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "suspended" | "all">(
    "pending"
  );
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isAdmin) return;
    void load();
  }, [isAdmin]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("driver_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as Application[]) ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps
      .filter((a) => (tab === "all" ? true : a.status === tab))
      .filter(
        (a) =>
          !q ||
          a.full_name.toLowerCase().includes(q) ||
          a.mobile.includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.vehicle_number.toLowerCase().includes(q)
      );
  }, [apps, tab, query]);

  async function decide(
    app: Application,
    status: Application["status"],
    note?: string
  ): Promise<void> {
    const { error } = await supabase
      .from("driver_applications")
      .update({
        status,
        review_note: note ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    if (error) { toast.error(error.message); return; }

    // If approved → ensure driver row + grant driver role
    if (status === "approved") {
      await supabase
        .from("user_roles")
        .upsert({ user_id: app.user_id, role: "driver" }, { onConflict: "user_id,role" });
      await supabase.from("drivers").upsert(
        {
          user_id: app.user_id,
          name: app.full_name,
          phone: app.mobile,
          vehicle_no: app.vehicle_number,
          status: "active",
          verified: true,
        } as never,
        { onConflict: "user_id" }
      );
    }
    toast.success(`Marked as ${status}`);
    void load();
  }

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

  const counts = apps.reduce(
    (acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1, all: acc.all + 1 }),
    { pending: 0, approved: 0, rejected: 0, suspended: 0, all: 0 } as Record<string, number>
  );

  const active = filtered.find((a) => a.id === activeId) ?? null;

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              Driver Applications
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-card">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name / phone / vehicle"
              className="w-56 bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "suspended", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setTab(s);
                setActiveId(null);
              }}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition ${
                tab === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {s} ({counts[s] ?? 0})
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-border bg-card shadow-card">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">No applications.</p>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => setActiveId(a.id)}
                      className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-secondary/60 ${
                        active?.id === a.id ? "bg-secondary" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{a.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.mobile} • {a.vehicle_number} • {a.vehicle_type.replace("_", " ")}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          STATUS_TONE[a.status]
                        }`}
                      >
                        {a.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {!active ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Select an application to review.
              </p>
            ) : (
              <ApplicationDetail app={active} onDecide={decide} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationDetail({
  app,
  onDecide,
}: {
  app: Application;
  onDecide: (
    app: Application,
    status: Application["status"],
    note?: string
  ) => Promise<void>;
}) {
  const [note, setNote] = useState(app.review_note ?? "");
  const [busy, setBusy] = useState<string | null>(null);

  async function open(col: keyof Application) {
    const url = await getSignedDocUrl(app[col] as string);
    window.open(url, "_blank");
  }

  async function act(status: Application["status"]) {
    setBusy(status);
    try {
      await onDecide(app, status, note.trim() || undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-extrabold text-foreground">{app.full_name}</h2>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
              STATUS_TONE[app.status]
            }`}
          >
            {app.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Applied {new Date(app.created_at).toLocaleString()}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Field k="Mobile" v={app.mobile} />
        <Field k="Email" v={app.email} />
        <Field k="Vehicle" v={`${app.vehicle_number} • ${app.vehicle_type.replace("_", " ")}`} />
        <Field k="Aadhaar" v={app.aadhaar_number} />
        <Field k="PAN" v={app.pan_number} />
        <Field k="Address" v={app.address} full />
      </dl>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documents
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DOC_FIELDS.map((f) => (
            <button
              key={f.key}
              onClick={() => open(f.col)}
              className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
            >
              <FileText className="h-4 w-4 text-primary" />
              <span className="flex-1 truncate">{f.label}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Review note (optional)
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Note shown to driver"
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Btn
          onClick={() => act("approved")}
          busy={busy === "approved"}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        >
          Approve
        </Btn>
        <Btn
          onClick={() => act("rejected")}
          busy={busy === "rejected"}
          tone="danger"
          icon={<XCircle className="h-4 w-4" />}
        >
          Reject
        </Btn>
        <Btn
          onClick={() => act("suspended")}
          busy={busy === "suspended"}
          tone="muted"
          icon={<Pause className="h-4 w-4" />}
        >
          Suspend
        </Btn>
      </div>
    </div>
  );
}

function Field({ k, v, full }: { k: string; v: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="text-sm text-foreground">{v}</dd>
    </div>
  );
}

function Btn({
  children,
  onClick,
  busy,
  tone,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  tone: "success" | "danger" | "muted";
  icon: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : tone === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "bg-slate-700 text-white hover:bg-slate-800";
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${cls}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
