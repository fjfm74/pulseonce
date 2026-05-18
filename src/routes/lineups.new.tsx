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
import { saveLineup } from "@/lib/lineup.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/lineups/new")({
  validateSearch: (s) => z.object({ mode: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Monta tu 11 · Pulse11" }] }),
  component: NewLineup,
});

type Player = { id: number; name: string; position: 'GK'|'DF'|'MF'|'FW'; birth_year: number|null; nationality: string|null };

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

  const modes = useQuery({ queryKey: ['modes'], queryFn: modesFn, enabled: ready });

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
  const [assignments, setAssignments] = useState<Record<string, number>>({}); // slot → player_id
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);

  // reset assignments if formation changes
  useEffect(() => { setAssignments({}); }, [formation]);

  const layout = FORMATION_LAYOUTS[formation];
  const usedIds = new Set(Object.values(assignments));
  const slotInfo = activeSlot ? layout.find(s => s.slot === activeSlot) : null;

  const filtered = useMemo(() => {
    const list = (players.data?.players ?? []) as Player[];
    return list.filter(p => {
      if (slotInfo && p.position !== slotInfo.position) return false;
      if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [players.data, slotInfo, filter]);

  const assign = (playerId: number) => {
    if (!activeSlot) return;
    setAssignments(prev => {
      const next = { ...prev };
      // remove if already used elsewhere
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

  const save = async () => {
    if (!isComplete || !selectedMode) return;
    setSaving(true);
    try {
      const playersArr = layout.map(s => ({ slot: s.slot, player_id: assignments[s.slot] }));
      const res = await saveFn({ data: {
        mode_id: selectedMode.id, title, formation, players: playersArr,
      }});
      toast.success("Carta guardada");
      router.navigate({ to: "/c/$code", params: { code: res.code } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSaving(false); }
  };

  if (!ready) return <div className="min-h-screen"><Nav /></div>;

  const playerById = (id: number) => (players.data?.players ?? []).find(p => p.id === id) as Player | undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <div className="tape mb-2">EDITOR</div>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              className="display text-5xl bg-transparent border-b-2 border-foreground outline-none focus:border-primary"
              maxLength={60}
            />
          </div>
          <div className="flex gap-2 items-center font-mono text-sm">
            <span className={isComplete ? "text-primary" : "text-muted-foreground"}>{filled}/11</span>
            <button disabled={!isComplete || saving} onClick={save} className="btn-hero disabled:opacity-30">
              {saving ? "GUARDANDO…" : "SOLTAR CARTA"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* PITCH */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <select value={selectedModeSlug} onChange={e => { setSelectedModeSlug(e.target.value); setAssignments({}); }} className="bg-input border-2 border-border px-3 py-2 font-mono text-sm">
                {(modes.data ?? []).map(m => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </select>
              <select value={formation} onChange={e => setFormation(e.target.value as Formation)} className="bg-input border-2 border-border px-3 py-2 font-mono text-sm">
                {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              {selectedMode && (selectedMode.rules as { selection_mode?: string })?.selection_mode === 'pool' && (
                <span className="text-xs uppercase font-mono text-accent self-center">POOL 22 · ESTA SEMANA</span>
              )}
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
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-[58px] sm:w-[68px] text-center ${active ? 'ring-2 ring-accent' : ''}`}
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  >
                    {p ? (
                      <div className="border-2 border-foreground bg-background">
                        <div className="text-[10px] font-bold py-0.5 bg-primary text-primary-foreground">{s.slot}</div>
                        <div className="display text-[14px] py-1 px-1">{lastName(p.name)}</div>
                        <div className="text-[10px] bg-surface flex justify-between px-1">
                          <span>{p.nationality}</span>
                          <span className="font-mono">{i + 1}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-chalk/60 bg-black/30 py-3">
                        <div className="font-mono text-[10px] text-chalk">{s.slot}</div>
                        <div className="text-chalk text-xl">+</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </Pitch>

            {filled > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono">
                {Object.entries(assignments).map(([slot, pid]) => (
                  <button key={slot} onClick={() => clearSlot(slot)} className="px-2 py-1 bg-surface border border-border hover:border-destructive">
                    {slot} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PICKER */}
          <aside className="border-2 border-foreground bg-surface p-3 max-h-[80vh] overflow-y-auto">
            {!activeSlot ? (
              <div className="text-sm text-muted-foreground p-2">Toca un hueco del campo para asignar jugador.</div>
            ) : (
              <>
                <div className="display text-2xl">{activeSlot}</div>
                <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar nombre…" className="mt-2 w-full bg-input border border-border px-2 py-2 font-mono text-sm" />
                <div className="mt-2 space-y-1">
                  {filtered.length === 0 && <div className="text-xs text-muted-foreground p-2">Sin resultados.</div>}
                  {filtered.map(p => {
                    const used = usedIds.has(p.id);
                    return (
                      <button key={p.id} disabled={used} onClick={() => assign(p.id)}
                        className={`w-full text-left flex items-center justify-between px-2 py-2 border ${used ? 'opacity-40 border-border' : 'border-border hover:border-primary'}`}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[10px] w-6 text-muted-foreground">{p.position}</span>
                          <span>{p.name}</span>
                        </span>
                        <span className="text-xs">{p.nationality}</span>
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
