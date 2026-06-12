import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Mail, Lock, User, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import logoAsset from "@/assets/pbtw-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In | PBTW Group" },
      {
        name: "description",
        content:
          "Sign in or create your PBTW Group account to book water tanker deliveries, manage your wallet, and track orders.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);

  // Redirect once auth state populates. Read from session (localStorage) to avoid
  // a getUser() race that caused the /auth ↔ /profile loop.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session?.user) {
        navigate({ to: "/profile", replace: true });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        navigate({ to: "/profile", replace: true });
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Enter email and password");
    if (mode === "signup" && password.length < 6) return toast.error("Password must be at least 6 characters");
    if (mode === "signup" && !name.trim()) return toast.error("Enter your full name");
    if (mode === "signup" && !terms) return toast.error("You must accept the Terms & Privacy Policy");

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim(), phone: phone.trim() || null },
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        // Record T&C acceptance (best-effort)
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          await supabase.from("customer_terms_acceptances").insert({ user_id: u.user.id, version: "v1" });
        }
        toast.success("Account created! You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed");
        setBusy(false);
      }
      // result.redirected → browser navigates away
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero pt-28 pb-16">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Left intro */}
        <div className="hidden text-white lg:block">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white overflow-hidden">
              <img src={logoAsset.url} alt="PBTW Group" className="h-10 w-10 object-contain" />
            </span>
            <div>
              <p className="font-display text-xl font-extrabold">PBTW Group</p>
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Pappu Bhai Tanker Wale</p>
            </div>
          </div>
          <h1 className="mt-10 font-display text-4xl font-extrabold leading-tight tracking-tight">
            Book water tankers the smart way
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Sign in to manage orders, top up your wallet (15% off every booking), track live
            deliveries and download invoices.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            {[
              "Wallet payments — save 15% on every order",
              "Real-time order tracking",
              "Automatic GST invoices",
              "Saved addresses & reorder in one tap",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-aqua/30 text-aqua">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Form card */}
        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/15 bg-card p-7 shadow-elegant sm:p-8">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-border overflow-hidden">
              <img src={logoAsset.url} alt="PBTW" className="h-9 w-9 object-contain" />
            </span>
            <span className="font-display text-base font-extrabold text-foreground">PBTW Group</span>
          </div>

          <h2 className="font-display text-2xl font-extrabold text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to continue to your dashboard."
              : "Start booking water tankers in seconds."}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or with email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field icon={<User className="h-4 w-4" />} label="Full name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="Your name"
                    className="auth-input"
                  />
                </Field>
                <Field icon={<Phone className="h-4 w-4" />} label="Mobile number (optional)">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    placeholder="10-digit mobile"
                    className="auth-input"
                  />
                </Field>
              </>
            )}
            <Field icon={<Mail className="h-4 w-4" />} label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="auth-input"
              />
            </Field>
            <Field icon={<Lock className="h-4 w-4" />} label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="auth-input"
              />
            </Field>

            {mode === "signup" && (
              <label className="flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded"
                />
                <span>
                  I have read and agree to the{" "}
                  <Link to="/" className="font-semibold text-primary underline">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/" className="font-semibold text-primary underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}


            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-navy-deep disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Please wait…
                </>
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to PBTW?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Back to home</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background-color: var(--color-card);
          color: var(--color-foreground);
          font-size: 0.95rem;
        }
        .auth-input:focus {
          outline: none;
          border-color: var(--color-ring);
          box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-ring) 18%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.2-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.3 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.3 29.2 4.5 24 4.5 16.4 4.5 9.8 8.7 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.9 13.3-5.1l-6.1-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.7 39.2 16.3 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.1 5.2c-.4.4 6.5-4.7 6.5-15 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
