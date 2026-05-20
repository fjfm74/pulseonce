import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { Pitch } from "@/components/pitch";
import { FORMATION_LAYOUTS, FORMATIONS, lastName, type Formation } from "@/lib/catalog";
import { listActiveModes } from "@/lib/profile.functions";
import { listPlayersForMode } from "@/lib/players.functions";
import { listHistoricalTeams } from "@/lib/admin-sync.functions";
import { saveLineup } from "@/lib/lineup.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/lineups/new")({
  validateSearch: (s) => z.object({ mode: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Monta tu 11 · 11Pulse" }] }),
  component: NewLineup,
});

type Player = { id: number; name: string; position: 'GK'|'DF'|'MF'|'FW'; birth_year: number|null; nationality: string|null; historical_teams?: string[] | null };

const POS_COLORS: Record<string, string> = {
  GK: 'bg-accent text-accent-foreground',
  DF: 'bg-foreground text-background',
  MF: 'bg-magenta text-white',
  FW: 'bg-primary text-primary-foreground',
};

function NewLineup() {
  const router = useRouter();
  const search = useSearch({ from: Route.id });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.navigate({ to: "/auth/login" });
      else setReady(true);
    });
  }, [router]);

  const modesFn = useServerFn(listActiveModes);
  const playersFn = useServerFn(listPlayersForMode);
  const saveFn = useServerFn(saveLineup);
  const histTeamsFn = useServerFn(listHistoricalTeams);

  const modes = useQuery({ queryKey: ['modes'], queryFn: modesFn, enabled: ready });
  const histTeams = useQuery({ queryKey: ['hist-teams'], queryFn: histTeamsFn, enabled: ready });

  const [selectedModeSlug, setSelectedModeSlug] = useState<string>(search.mode ?? 'corazon');
  useEffect(() => { if (search.mode) setSelectedModeSlug(search.mode); }, [search.mode]);
  const selectedMode = useMemo(() => modes.data?.find(m => m.slug === selectedModeSlug), [modes.data, selectedModeSlug]);

  const players = useQuery({
    queryKey: ['players', selectedModeSlug],
    queryFn: () => playersFn({ data: { mode_slug: selectedModeSlug } }),
    enabled: ready && !!selectedMode,
  });

  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [title, setTitle] = useState("Mi 11");
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [histTeamFilter, setHistTeamFilter] = useState<string>("");

  useEffect(() => { setAssignments({}); }, [formation]);

  const layout = FORMATION_LAYOUTS[formation];
  const usedIds = new Set(Object.values(assignments));
  const slotInfo = activeSlot ? layout.find(s => s.slot === activeSlot) : null;

  const filtered = useMemo(() => {
    const list = (players.data?.players ?? []) as Player[];
    return list.filter(p => {
      if (slotInfo && p.position !== slotInfo.position) return false;
      if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false;
      if (histTeamFilter && !(p.historical_teams ?? []).includes(histTeamFilter)) return false;
      return true;
    });
  }, [players.data, slotInfo, filter, histTeamFilter]);

  const assign = (playerId: number) => {
    if (!activeSlot) return;
    setAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(s => { if (next[s] === playerId) delete next[s]; });
      next[activeSlot] = playerId;
      return next;
    });
    setActiveSlot(null);
    setFilter("");
  };

  const clearSlot = (slot: string) => setAssignments(prev => { const n = { ...prev }; delete n[slot]; return n; });

  const filled = Object.keys(assignments).length;
  const isComplete = filled === 11;
  const pct = (filled / 11) * 100;

  const save = async () => {
    if (!isComplete || !selectedMode) return;
    setSaving(true);
    try {
      const playersArr = layout.map(s => ({ slot: s.slot, player_id: assignments[s.slot] }));
      const res = await saveFn({ data: {
        mode_id: selectedMode.id, title, formation, players: playersArr,
      }});
      toast.success("Carta soltada 🔥");
      router.navigate({ to: "/c/$code", params: { code: res.code } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSaving(false); }
  };

  if (!ready) return <div className="min-h-screen"><Nav /></div>;

  const playerById = (id: number) => (players.data?.players ?? []).find(p => p.id === id) as Player | undefined;

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      {/* Top status bar */}
      <div className={`marquee ${isComplete ? '' : 'alt'}`}>
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3">
              {isComplete
                ? <>● 11/11 · TODO LISTO · DALE A SOLTAR CARTA · </>
                : <>EDITOR EN VIVO · {filled}/11 HUECOS · ESTA SEMANA · </>}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full relative">
        {/* Giant background stencil */}
        <div aria-hidden className="pointer-events-none absolute -top-4 right-2 select-none">
          <div className="stencil text-[200px] sm:text-[280px] leading-none opacity-15">11</div>
        </div>

        {/* HEADER */}
        <div className="relative flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="tape tape-accent">EDITOR · LIVE</span>
              {selectedMode && (selectedMode.rules as { selection_mode?: string })?.selection_mode === 'pool' && (
                <span className="sticker text-[10px] bg-magenta text-white">POOL · 22</span>
              )}
            </div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-3 display text-5xl sm:text-7xl bg-transparent border-b-4 border-foreground outline-none focus:border-primary w-full max-w-xl"
              maxLength={60}
            />
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              progreso
            </div>
            <div className="flex items-center gap-3">
              <div className={`display text-5xl ${isComplete ? 'text-primary glow-primary' : 'text-foreground'}`}>
                {filled}<span className="text-muted-foreground">/11</span>
              </div>
              <button
                disabled={!isComplete || saving}
                onClick={save}
                className="btn-hero disabled:opacity-30 disabled:!shadow-none disabled:cursor-not-allowed"
              >
                {saving ? "SOLTANDO…" : "SOLTAR CARTA"}
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar brutalist */}
        <div className="h-3 bg-surface border-2 border-foreground mb-6 relative overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%`, backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0 6px, transparent 6px 12px)' }}
          />
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">modo</label>
          <select
            value={selectedModeSlug}
            onChange={e => { setSelectedModeSlug(e.target.value); setAssignments({}); }}
            className="bg-surface border-2 border-foreground px-3 py-2 font-mono text-sm uppercase"
          >
            {(modes.data ?? []).map(m => <option key={m.slug} value={m.slug}>{m.name}</option>)}
          </select>
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-2">formación</label>
          <div className="flex gap-1">
            {FORMATIONS.map(f => (
              <button
                key={f}
                onClick={() => setFormation(f)}
                className={`px-3 py-2 font-mono text-sm border-2 ${formation === f ? 'bg-primary text-primary-foreground border-foreground shadow-brutal' : 'bg-surface border-foreground hover:bg-foreground hover:text-background'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 relative">
          {/* PITCH */}
          <div className="relative">
            <div className="absolute -top-3 -left-2 z-10 sticker text-[10px] bg-primary text-primary-foreground rotate-[-4deg]">
              EL CÉSPED
            </div>

            <Pitch>
              {layout.map((s, i) => {
                const pid = assignments[s.slot];
                const p = pid ? playerById(pid) : undefined;
                const active = activeSlot === s.slot;
                return (
                  <button
                    key={s.slot}
                    onClick={() => setActiveSlot(s.slot)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-[60px] sm:w-[72px] text-center transition-transform hover:scale-105 ${active ? 'ring-4 ring-accent ring-offset-2 ring-offset-pitch scale-110 z-10' : ''}`}
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  >
                    {p ? (
                      <div className="border-2 border-foreground bg-background shadow-[3px_3px_0_var(--color-foreground)]">
                        <div className={`text-[10px] font-bold py-0.5 tracking-wider ${POS_COLORS[p.position]}`}>
                          {s.slot}
                        </div>
                        <div className="display text-[14px] sm:text-[16px] py-1 px-1 leading-none">
                          {lastName(p.name)}
                        </div>
                        <div className="text-[9px] bg-surface flex justify-between px-1 py-0.5 border-t border-border">
                          <span>{p.nationality}</span>
                          <span className="font-mono">{i + 1}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`border-2 border-dashed py-3 transition-colors ${active ? 'border-accent bg-accent/20' : 'border-chalk/70 bg-black/40 hover:border-primary hover:bg-primary/10'}`}>
                        <div className={`font-mono text-[10px] ${active ? 'text-accent' : 'text-chalk'}`}>{s.slot}</div>
                        <div className={`text-xl ${active ? 'text-accent' : 'text-chalk'}`}>+</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </Pitch>

            {filled > 0 && (
              <div className="mt-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Quitar ficha:
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {Object.keys(assignments).map((slot) => (
                    <button
                      key={slot}
                      onClick={() => clearSlot(slot)}
                      className="px-2 py-1 bg-surface border-2 border-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      {slot} ✕
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PICKER */}
          <aside className="relative border-2 border-foreground bg-surface shadow-brutal max-h-[80vh] flex flex-col">
            <div className="absolute -top-3 -right-2 z-10 sticker text-[10px] bg-accent text-accent-foreground rotate-[3deg]">
              FICHAJES
            </div>

            <div className="p-3 border-b-2 border-foreground bg-background">
              {!activeSlot ? (
                <div className="flex items-center gap-2">
                  <span className="display text-2xl">→</span>
                  <span className="text-sm text-muted-foreground">Toca un hueco del campo</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">posición</div>
                    <div className="display text-3xl text-primary">{activeSlot}</div>
                  </div>
                  {slotInfo && (
                    <span className={`text-[10px] font-bold px-2 py-1 border-2 border-foreground ${POS_COLORS[slotInfo.position]}`}>
                      {slotInfo.position}
                    </span>
                  )}
                </div>
              )}
            </div>

            {activeSlot && (
              <>
                <div className="p-3 border-b-2 border-foreground space-y-2">
                  <input
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Buscar jugador…"
                    className="w-full bg-background border-2 border-foreground px-3 py-2 font-mono text-sm focus:border-primary outline-none"
                  />
                  <select
                    value={histTeamFilter}
                    onChange={e => setHistTeamFilter(e.target.value)}
                    className="w-full bg-background border-2 border-foreground px-3 py-2 font-mono text-xs uppercase focus:border-primary outline-none"
                  >
                    <option value="">Todos los equipos</option>
                    {(histTeams.data ?? []).map(t => (
                      <option key={t.team_name} value={t.team_name}>
                        {t.team_name} ({t.player_count})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filtered.length === 0 && (
                    <div className="text-xs text-muted-foreground p-4 text-center">
                      Sin fichajes disponibles.
                    </div>
                  )}
                  {filtered.map(p => {
                    const used = usedIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        disabled={used}
                        onClick={() => assign(p.id)}
                        className={`w-full text-left flex items-center justify-between px-2 py-2 border-2 transition-all ${
                          used
                            ? 'opacity-30 border-border'
                            : 'border-border hover:border-primary hover:bg-background hover:translate-x-1'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 border ${POS_COLORS[p.position]} flex-shrink-0`}>
                            {p.position}
                          </span>
                          <span className="truncate text-sm">{p.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{p.nationality}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
