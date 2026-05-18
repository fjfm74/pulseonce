import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { getMyProfile, listActiveModes } from "@/lib/profile.functions";
import { myLeagues, myLineupsList } from "@/lib/lineup.functions";
import { getCrest } from "@/lib/catalog";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Tu vestuario · Pulse11" }] }),
  component: Dashboard,
});

function Dashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.navigate({ to: "/auth/login" });
      else setReady(true);
    });
  }, [router]);

  const meFn = useServerFn(getMyProfile);
  const modesFn = useServerFn(listActiveModes);
  const linesFn = useServerFn(myLineupsList);
  const leaguesFn = useServerFn(myLeagues);

  const me = useQuery({ queryKey: ['me'], queryFn: meFn, enabled: ready });
  const modes = useQuery({ queryKey: ['modes'], queryFn: modesFn, enabled: ready });
  const lines = useQuery({ queryKey: ['my-lineups'], queryFn: linesFn, enabled: ready });
  const leagues = useQuery({ queryKey: ['my-leagues'], queryFn: leaguesFn, enabled: ready });

  useEffect(() => {
    if (ready && me.data === null) router.navigate({ to: "/onboarding" });
  }, [ready, me.data, router]);

  if (!ready || !me.data) return <div className="min-h-screen"><Nav /></div>;

  const totalPulses = (lines.data ?? []).reduce((s, l) => s + (l.pulses_count ?? 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="tape mb-2">VESTUARIO</div>
        <h1 className="display text-5xl">HOLA, {me.data.username.toUpperCase()}.</h1>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            ['11s creados', (lines.data ?? []).length],
            ['Pulses recibidos', totalPulses],
            ['Ligas', (leagues.data ?? []).length],
          ].map(([k,v],i) => (
            <div key={i} className="border-2 border-foreground bg-surface p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
              <div className="display text-5xl text-primary">{v}</div>
            </div>
          ))}
        </div>

        {/* Modos activos */}
        <div className="mt-10">
          <h2 className="display text-3xl">MODOS DE ESTA SEMANA</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {(modes.data ?? []).map(m => (
              <Link key={m.id} to="/lineups/new" search={{ mode: m.slug } as never} className="ticket p-6 hover:translate-y-[-2px] transition-transform">
                <div className="text-xs uppercase text-primary font-bold">{(m.rules as { selection_mode?: string })?.selection_mode === 'pool' ? 'POOL CERRADO' : 'ABIERTO'}</div>
                <div className="display text-3xl mt-1">{m.name}</div>
                <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                <div className="mt-4 font-mono text-xs uppercase tracking-wider">Monta tu 11 →</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Feed: mis cartas */}
        <div className="mt-10">
          <h2 className="display text-3xl">TUS ÚLTIMAS CARTAS</h2>
          {(lines.data ?? []).length === 0 ? (
            <div className="border-2 border-dashed border-border p-8 text-center mt-4">
              <p className="text-muted-foreground">Aún no hay 11s en tus ligas. Crea el primero.</p>
              <Link to="/lineups/new" className="btn-hero mt-4 inline-block">MONTA TU 11</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {(lines.data ?? []).map(l => (
                <Link key={l.id} to="/c/$code" params={{ code: l.code }} className="border-2 border-foreground bg-surface p-4 hover:border-primary">
                  <div className="font-mono text-xs text-muted-foreground">/c/{l.code}</div>
                  <div className="display text-2xl mt-1">{l.title}</div>
                  <div className="mt-2 text-xs uppercase tracking-wider">{l.formation}</div>
                  <div className="mt-3 flex gap-4 font-mono text-sm">
                    <span className="text-primary">● {l.pulses_count} pulses</span>
                    <span className="text-accent">⤴ {l.forks_count}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mis ligas */}
        <div className="mt-10">
          <h2 className="display text-3xl">MIS LIGAS</h2>
          {(leagues.data ?? []).length === 0 ? (
            <div className="border-2 border-dashed border-border p-8 text-center mt-4">
              <p className="text-muted-foreground">No estás en ninguna liga todavía.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link to="/leagues/create" className="btn-hero">CREAR LIGA</Link>
                <Link to="/leagues/join" className="btn-ghost-zine">Unirme con código</Link>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {(leagues.data ?? []).map(l => (
                <Link key={l.id} to="/leagues/$code" params={{ code: l.code }} className="border-2 border-foreground bg-surface p-4 flex items-center gap-3 hover:border-primary">
                  <div className="text-4xl">{getCrest(l.crest_id).emoji}</div>
                  <div>
                    <div className="display text-2xl">{l.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{l.code}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
