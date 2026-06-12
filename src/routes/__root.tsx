import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { HydraAssist } from "@/components/HydraAssist";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Water Tanker Delivery in Beawar | PAPPU BHAI TANKER WALE" },
      {
        name: "description",
        content:
          "Book clean drinking and construction water tanker delivery in Beawar. GPS-tracked tankers, 24×7 service, tested water, fast delivery. Call 9214775938.",
      },
      {
        name: "keywords",
        content:
          "water tanker near me, water tanker delivery, drinking water tanker, online tanker booking, Beawar water tanker, Pappu Bhai Tanker Wale",
      },
      { name: "author", content: "Pappu Bhai Tanker Wale" },
      { property: "og:title", content: "Water Tanker Delivery in Beawar | PAPPU BHAI TANKER WALE" },
      {
        property: "og:description",
        content:
          "Book clean drinking and construction water tanker delivery in Beawar. GPS-tracked, 24×7 support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0A3D62" },
      { name: "twitter:title", content: "Water Tanker Delivery in Beawar | PAPPU BHAI TANKER WALE" },
      { name: "description", content: "HydroFlow Water Solutions is a full-stack platform for booking and managing water tanker services." },
      { property: "og:description", content: "HydroFlow Water Solutions is a full-stack platform for booking and managing water tanker services." },
      { name: "twitter:description", content: "HydroFlow Water Solutions is a full-stack platform for booking and managing water tanker services." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/64bb33a7-ed00-4fbc-8938-286e4acda39d/id-preview-bfc3926f--b4198fa6-dfcb-43b9-bc3e-928218c406d4.lovable.app-1780394131533.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/64bb33a7-ed00-4fbc-8938-286e4acda39d/id-preview-bfc3926f--b4198fa6-dfcb-43b9-bc3e-928218c406d4.lovable.app-1780394131533.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <Toaster richColors position="top-center" />
        <HydraAssist />
      </div>
    </QueryClientProvider>
  );
}
