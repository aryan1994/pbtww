import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Use getSession() — reads from localStorage instantly, no network round-trip.
    // getUser() hits the server and can race with session-restore right after sign-in,
    // causing a redirect loop between /auth and the protected page.
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});
