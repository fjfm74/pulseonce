import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { toast } from "sonner";
import {
  checkIsAdmin,
  getAdminStats,
  syncApiFootballLeague,
  seedLegends,
} from "@/lib/admin-sync.functions";

export const Route = createFileRoute("/admin/sync")({
  head: () => ({ meta: [{ title: "Admin Sync · 11Pulse" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminSync,
});

// Free tier de api-sports.io solo permite temporadas 2022-2024.
const LEAGUES = [
  { id: 140, name: "LaLiga", season: 2023, estReq: 25 },
  { id: 39,  name: "Premier League", season: 2023, estReq: 25 },
  { id: 78,  name: "Bundesliga", season: 2023, estReq: 22 },
  { id: 135, name: "Serie A", season: 2023, estReq: 22 },
  { id: 61,  name: "Ligue 1", season: 2023, estReq: 20 },
  { id: 2,   name: "Champions League", season: 2023, estReq: 20 },
];

type LogEntry = { ts: string; action: string; result: string };

function AdminSync() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const checkAdminFn = useServerFn(checkIsAdmin);
  const statsFn = useServerFn(getAdminStats);
  const syncFn = useServerFn(syncApiFootballLeague);
  const seedFn = useServerFn(seedLegends);

  const [inFlight, setInFlight] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      try {
        const res = await checkAdminFn();
        if (cancelled) return;
        if (!res.isAdmin) { router.navigate({ to: "/dashboard" }); return; }
        setReady(true);
      } catch {
        if (!cancelled) router.navigate({ to: "/auth/login", search: { redirect: "/admin/sync" } });
      }
    };
    // Wait for Supabase to hydrate the session from storage before checking.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session) { router.navigate({ to: "/auth/login", search: { redirect: "/admin/sync" } }); return; }
      verify();
    });
    // In case INITIAL_SESSION already fired, also try immediately.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !cancelled) verify();
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [router, checkAdminFn]);

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: statsFn,
    enabled: ready,
    refetchInterval: 10000,
  });

  const pushLog = (action: string, result: string) => {
    setLog((prev) => [{ ts: new Date().toLocaleTimeString(), action, result }, ...prev].slice(0, 10));
  };

  const runSync = async (lg: typeof LEAGUES[number]) => {
    const key = `lg-${lg.id}`;
    setInFlight(key);
    toast.info(`Sincronizando ${lg.name}…`);
    try {
      const res = await syncFn({ data: { leagueId: lg.id, season: lg.season } });
      const msg = `+${res.newCount} nuevos · ${res.updatedCount} actualizados · ${res.totalProcessed} total · ${(res.durationMs/1000).toFixed(0)}s${res.errors.length ? ` · ${res.errors.length} errores` : ""}`;
      pushLog(`SYNC ${lg.name}`, msg);
      toast.success(`${lg.name}: ${msg}`);
      stats.refetch();
    } catch (e) {
      const msg = (e as Error).message;
      pushLog(`SYNC ${lg.name}`, `ERROR: ${msg}`);
      toast.error(`${lg.name}: ${msg}`);
    } finally {
      setInFlight(null);
    }
  };

  const runSeed = async () => {
    setInFlight("seed");
    toast.info("Sembrando leyendas…");
    try {
      const res = await seedFn();
      const msg = `+${res.inserted} insertados · ${res.skipped} omitidos · ${res.total} total`;
      pushLog("SEED LEGENDS", msg);
      toast.success(msg);
      stats.refetch();
    } catch (e) {
      const msg = (e as Error).message;
      pushLog("SEED LEGENDS", `ERROR: ${msg}`);
      toast.error(msg);
    } finally {
      setInFlight(null);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center font-mono text-sm text-muted-foreground">
          Verificando…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />
      <div className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="flex items-center gap-2 mb-2">
          <span className="tape tape-accent">ADMIN · INTERNO</span>
        </div>
        <h1 className="display text-5xl sm:text-7xl mb-8">Pulse11 — Admin Sync</h1>

        {/* STATS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {[
            { label: "Jugadores", value: stats.data?.players ?? "—" },
            { label: "Equipos", value: stats.data?.teams ?? "—" },
            { label: "Equipos históricos", value: stats.data?.distinctHistoricalTeams ?? "—" },
          ].map((s) => (
            <div key={s.label} className="border-2 border-foreground bg-surface p-4 shadow-brutal">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
              <div className="display text-5xl mt-1">{s.value}</div>
            </div>
          ))}
        </section>

        {/* LEAGUES */}
        <section className="mb-10">
          <h2 className="display text-3xl mb-3">Sync Leagues</h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-4 uppercase tracking-wider">
            Free tier · 7s entre llamadas · ~3 min por liga
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LEAGUES.map((lg) => {
              const busy = inFlight === `lg-${lg.id}`;
              const disabled = inFlight !== null;
              return (
                <button
                  key={lg.id}
                  disabled={disabled}
                  onClick={() => runSync(lg)}
                  className="text-left border-2 border-foreground bg-background p-4 shadow-brutal hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="display text-2xl">{lg.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">
                        id {lg.id} · season {lg.season} · ~{lg.estReq} req · ~{Math.ceil(lg.estReq * 7 / 60)} min
                      </div>
                    </div>
                    <span className="font-mono text-xs">{busy ? "…" : "▶"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SEED */}
        <section className="mb-10">
          <h2 className="display text-3xl mb-3">Seed Legendary Players</h2>
          <button
            disabled={inFlight !== null}
            onClick={runSeed}
            className="btn-hero disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {inFlight === "seed" ? "SEMBRANDO…" : "SEMBRAR 80 LEYENDAS"}
          </button>
          <p className="font-mono text-[11px] text-muted-foreground mt-2 uppercase tracking-wider">
            Cero llamadas API · instantáneo · ids 9001-9080
          </p>
        </section>

        {/* LOG */}
        <section>
          <h2 className="display text-3xl mb-3">Activity Log</h2>
          <div className="border-2 border-foreground bg-surface">
            {log.length === 0 ? (
              <div className="p-4 font-mono text-xs text-muted-foreground">Sin actividad todavía.</div>
            ) : (
              <ul className="divide-y-2 divide-foreground">
                {log.map((e, i) => (
                  <li key={i} className="p-3 font-mono text-xs flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-muted-foreground w-20">{e.ts}</span>
                    <span className="font-bold uppercase tracking-wider w-48">{e.action}</span>
                    <span className="flex-1">{e.result}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
