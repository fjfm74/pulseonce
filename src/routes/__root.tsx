import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="display text-[120px] leading-none text-primary">404</div>
        <p className="display text-3xl mt-2">Esta carta no existe</p>
        <p className="mt-3 text-muted-foreground">El link que has seguido no lleva a ningún 11.</p>
        <Link to="/" className="btn-hero mt-6 inline-block">Volver al inicio</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="tape mb-4">ERROR</div>
        <h1 className="display text-4xl">Algo salió torcido</h1>
        <p className="mt-2 text-muted-foreground text-sm">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="btn-hero mt-6"
        >Reintentar</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "11Pulse — Monta tu 11 ideal" },
      { name: "description", content: "11Pulse: arma tu 11 ideal, compite en ligas privadas con amigos. Sin apuestas, sin tóxicos. 14+." },
      { property: "og:title", content: "11Pulse — Monta tu 11 ideal" },
      { property: "og:description", content: "11Pulse: arma tu 11 ideal, compite en ligas privadas con amigos. Sin apuestas, sin tóxicos. 14+." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "11Pulse — Monta tu 11 ideal" },
      { name: "twitter:description", content: "11Pulse: arma tu 11 ideal, compite en ligas privadas con amigos. Sin apuestas, sin tóxicos. 14+." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0b684d13-89ee-4453-8976-c4221a24413c/id-preview-f61abeb8--bce3d94d-002b-40d9-a459-078f45ef54d6.lovable.app-1779127920399.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0b684d13-89ee-4453-8976-c4221a24413c/id-preview-f61abeb8--bce3d94d-002b-40d9-a459-078f45ef54d6.lovable.app-1779127920399.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthListener() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      <Toaster position="top-center" theme="dark" />
      <Outlet />
    </QueryClientProvider>
  );
}
