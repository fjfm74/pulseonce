import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { getLeague } from "@/lib/lineup.functions";
import { getCrest, getAvatar } from "@/lib/catalog";
import { toast } from "sonner";

export const Route = createFileRoute("/leagues/$code")({
  head: ({ params }) => ({ meta: [{ title: `Liga ${params.code} · Pulse11` }] }),
  component: LeagueDetail,
});

function LeagueDetail() {
  const { code } = Route.useParams();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.navigate({ to: "/auth/login" }); else setReady(true);
    });
  }, [router]);
  const fn = useServerFn(getLeague);
  const q = useQuery({ queryKey: ['league', code], queryFn: () => fn({ data: { code } }), enabled: ready });

  const share = async () => {
    try { await navigator.clipboard.writeText(code); toast.success("Código copiado."); } catch { /* */ }
  };

  if (!ready || q.isLoading) return <div className="min-h-screen"><Nav /></div>;
  if (!q.data) return <div className="min-h-screen"><Nav /><div className="p-12 text-center">Liga no encontrada</div></div>;
  if (!q.data.isMember) return <div className="min-h-screen"><Nav /><div className="p-12 text-center text-muted-foreground">No eres miembro de esta liga.</div></div>;

  const { league, ranking } = q.data;
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
        <div className="border-2 border-foreground bg-surface p-6 flex items-center gap-4">
          <div className="text-6xl">{getCrest(league.crest_id).emoji}</div>
          <div className="flex-1">
            <div className="tape mb-1">LIGA</div>
            <h1 className="display text-5xl">{league.name}</h1>
            <button onClick={share} className="mt-2 font-mono text-sm text-primary hover:underline">Código: {league.code} · copiar</button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="display text-3xl">RANKING POR PULSES</h2>
          <div className="mt-3 space-y-1">
            {ranking.map((r, i) => (
              <div key={r.username} className="flex items-center justify-between border-b border-border py-2">
                <div className="flex items-center gap-3">
                  <span className="display text-2xl w-8 text-accent">{i + 1}</span>
                  <span className="text-2xl">{getAvatar(r.avatar_id).emoji}</span>
                  <span>{r.username}</span>
                </div>
                <span className="font-mono text-primary">{r.pulses} pulses</span>
              </div>
            ))}
            {ranking.length === 0 && <div className="text-muted-foreground p-4 border border-dashed border-border">Aún no hay 11s en tus ligas. Crea el primero.</div>}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
