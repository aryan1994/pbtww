import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Truck,
  UploadCloud,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  IdCard,
  FileText,
  Car,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DriverApplicationSchema,
  vehicleTypes,
  DOC_FIELDS,
  uploadDriverDoc,
  type DocKey,
} from "@/lib/driver-application";
import { COMPANY } from "@/lib/booking";

export const Route = createFileRoute("/become-driver")({
  head: () => ({
    meta: [
      { title: "Become a Driver Partner | PBTW Group" },
      {
        name: "description",
        content:
          "Join PBTW's driver partner network. Earn ₹40k+/month delivering water tankers across Beawar. Apply online in 5 minutes.",
      },
      { property: "og:title", content: "Drive with PBTW — Earn weekly" },
      {
        property: "og:description",
        content: "Apply to become a PBTW tanker driver. Flexible hours, weekly payouts.",
      },
    ],
  }),
  component: BecomeDriverPage,
});

type DocsState = Record<DocKey, File | null>;

function BecomeDriverPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    email: "",
    address: "",
    vehicle_number: "",
    vehicle_type: "water_tanker" as (typeof vehicleTypes)[number]["value"],
    aadhaar_number: "",
    pan_number: "",
  });
  const [terms, setTerms] = useState(false);
  const [docs, setDocs] = useState<DocsState>({
    aadhaar: null,
    pan: null,
    dl: null,
    rc: null,
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      setForm((f) => ({
        ...f,
        email: data.user!.email ?? f.email,
      }));
      const { data: existing } = await supabase
        .from("driver_applications")
        .select("status")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing?.status) setExistingStatus(existing.status);
    })();
  }, []);

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please sign in to apply");
      navigate({ to: "/auth" });
      return;
    }
    const parsed = DriverApplicationSchema.safeParse({ ...form, terms_accepted: terms });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    for (const f of DOC_FIELDS) {
      if (!docs[f.key]) {
        toast.error(`Upload ${f.label}`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const uploaded: Record<string, string> = {};
      for (const f of DOC_FIELDS) {
        uploaded[f.col] = await uploadDriverDoc(userId, f.key, docs[f.key]!);
      }
      const { error } = await supabase.from("driver_applications").insert({
        user_id: userId,
        full_name: form.full_name.trim(),
        mobile: form.mobile,
        email: form.email.trim(),
        address: form.address.trim(),
        vehicle_number: form.vehicle_number.trim().toUpperCase(),
        vehicle_type: form.vehicle_type,
        aadhaar_number: form.aadhaar_number,
        pan_number: form.pan_number.toUpperCase(),
        aadhaar_url: uploaded.aadhaar_url,
        pan_url: uploaded.pan_url,
        dl_url: uploaded.dl_url,
        rc_url: uploaded.rc_url,
        terms_accepted_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Application submitted! We'll review within 48 hours.");
      setExistingStatus("pending");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (existingStatus) {
    return (
      <div className="min-h-screen bg-hero pt-28 pb-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl bg-card p-10 shadow-elegant text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="mt-6 font-display text-3xl font-extrabold text-foreground">
              Application {existingStatus}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {existingStatus === "pending"
                ? "Our team is reviewing your details. We usually respond within 48 hours via call or WhatsApp."
                : existingStatus === "approved"
                ? "Welcome to the PBTW driver fleet! Head to your driver dashboard to go online."
                : existingStatus === "rejected"
                ? "Unfortunately your application was not approved. Contact support for details."
                : "Your driver account is currently suspended. Please contact support."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">
                Go home
              </Link>
              <a
                href={`https://wa.me/${COMPANY.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Truck className="h-4 w-4" /> Driver Partner Program
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Drive with PBTW.<br />Earn weekly.
          </h1>
          <p className="mt-3 max-w-2xl text-white/85">
            Join Beawar's fastest-growing water tanker network. Fuel reimbursed, flexible hours,
            insurance included. Apply once, get verified, start earning.
          </p>
        </div>

        {!userId && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You need an account to apply.{" "}
            <Link to="/auth" className="font-semibold underline">
              Sign in or sign up
            </Link>{" "}
            to continue.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-3xl bg-card p-6 shadow-elegant sm:p-8"
        >
          <SectionHeader icon={<IdCard className="h-4 w-4" />} title="Personal details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.full_name} onChange={(v) => setField("full_name", v)} maxLength={80} />
            <Input
              label="Mobile number"
              value={form.mobile}
              onChange={(v) => setField("mobile", v.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder="10-digit"
            />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setField("email", v)} />
            <Input
              label="Aadhaar number"
              value={form.aadhaar_number}
              onChange={(v) => setField("aadhaar_number", v.replace(/\D/g, "").slice(0, 12))}
              inputMode="numeric"
            />
          </div>
          <Textarea
            label="Address"
            value={form.address}
            onChange={(v) => setField("address", v)}
            maxLength={400}
            placeholder="House, area, city, pincode"
          />

          <SectionHeader icon={<Car className="h-4 w-4" />} title="Vehicle details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Vehicle number"
              value={form.vehicle_number}
              onChange={(v) => setField("vehicle_number", v.toUpperCase().slice(0, 20))}
              placeholder="RJ02 AB 1234"
            />
            <Select
              label="Vehicle type"
              value={form.vehicle_type}
              onChange={(v) => setField("vehicle_type", v as typeof form.vehicle_type)}
              options={vehicleTypes.map((t) => ({ value: t.value, label: t.label }))}
            />
            <Input
              label="PAN number"
              value={form.pan_number}
              onChange={(v) => setField("pan_number", v.toUpperCase().slice(0, 10))}
              placeholder="ABCDE1234F"
            />
          </div>

          <SectionHeader icon={<FileText className="h-4 w-4" />} title="Document uploads" />
          <div className="grid gap-3 sm:grid-cols-2">
            {DOC_FIELDS.map((f) => (
              <FileField
                key={f.key}
                label={f.label}
                file={docs[f.key]}
                onPick={(file) => setDocs((d) => ({ ...d, [f.key]: file }))}
              />
            ))}
          </div>

          <label className="mt-2 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-foreground">
              <ShieldCheck className="mr-1 inline h-4 w-4 text-primary" />
              I have read and agree to the{" "}
              <Link to="/" className="font-semibold text-primary underline">
                Driver Terms &amp; Conditions
              </Link>{" "}
              and PBTW Partner Policies. I confirm all submitted documents belong to me and are genuine.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !userId}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-card transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">{title}</h2>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "text" | "tel";
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        className="h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FileField({
  label,
  file,
  onPick,
}: {
  label: string;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-4 transition hover:border-primary hover:bg-secondary">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <UploadCloud className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">
          {file ? file.name : "Tap to upload (PDF / JPG / PNG)"}
        </p>
      </div>
      <input
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (f && f.size > 5 * 1024 * 1024) {
            toast.error("Max 5 MB per file");
            return;
          }
          onPick(f);
        }}
      />
    </label>
  );
}
