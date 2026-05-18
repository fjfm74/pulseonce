import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { myLeagues } from "@/lib/lineup.functions";
import { getCrest } from "@/lib/catalog";

export const Route = createFileRoute("/leagues")({
  head: () => ({ meta: [{ title: "Mis ligas · Pulse11" }] }),
  component: Leagues,
});

function Leagues() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.navigate({ to: "/auth/login" }); else setReady(true);
    });
  }, [router]);
  const fn = useServerFn(myLeagues);
  const q = useQuery({ queryKey: ['my-leagues'], queryFn: fn, enabled: ready });

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="flex items-end justify-between">
          <div>
            <div className="tape mb-2">LIGAS</div>
            <h1 className="display text-5xl">TUS LIGAS</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/leagues/create" className="btn-hero">CREAR</Link>
            <Link to="/leagues/join" className="btn-ghost-zine">Unirme</Link>
          </div>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(q.data ?? []).map(l => (
            <Link key={l.id} to="/leagues/$code" params={{ code: l.code }} className="border-2 border-foreground bg-surface p-4 flex items-center gap-3 hover:border-primary">
              <div className="text-4xl">{getCrest(l.crest_id).emoji}</div>
              <div>
                <div className="display text-2xl">{l.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{l.code}</div>
              </div>
            </Link>
          ))}
          {ready && q.data && q.data.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-border p-8 text-center text-muted-foreground">
              Aún no estás en ninguna liga.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
