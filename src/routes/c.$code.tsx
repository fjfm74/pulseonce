import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { Pitch, MiniCard } from "@/components/pitch";
import { FORMATION_LAYOUTS, getAvatar, type Formation } from "@/lib/catalog";
import { getLineupByCode, hasPulsed, togglePulse } from "@/lib/lineup.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/c/$code")({
  head: ({ params }) => ({ meta: [
    { title: `Carta ${params.code} · Pulse11` },
    { name: "description", content: "Una carta de 11 ideal en Pulse11." },
    { property: "og:title", content: `Pulse11 · /${params.code}` },
  ]}),
  component: CardView,
});

function CardView() {
  const { code } = Route.useParams();
  const router = useRouter();
  const getFn = useServerFn(getLineupByCode);
  const togglePulseFn = useServerFn(togglePulse);
  const hasPulsedFn = useServerFn(hasPulsed);

  const q = useQuery({ queryKey: ['c', code], queryFn: () => getFn({ data: { code } }) });

  const [authed, setAuthed] = useState(false);
  const [authorIdSelf, setAuthorIdSelf] = useState(false);
  const [pulseado, setPulseado] = useState(false);
  const [pulses, setPulses] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);
  useEffect(() => {
    if (!q.data) return;
    setPulses(q.data.lineup.pulses_count ?? 0);
    if (authed) {
      hasPulsedFn({ data: { lineup_id: q.data.lineup.id }}).then(r => setPulseado(r.pulseado)).catch(() => {});
      supabase.auth.getUser().then(({ data }) => setAuthorIdSelf(data.user?.id === q.data!.lineup.author_id));
    }
  }, [q.data, authed, hasPulsedFn]);

  if (q.isLoading) return <div className="min-h-screen"><Nav /><div className="p-12 text-center text-muted-foreground">Pintando tu carta…</div></div>;
  if (!q.data) return <div className="min-h-screen"><Nav /><div className="p-12 text-center">Carta no encontrada</div></div>;

  const lu = q.data.lineup;
  const players = q.data.players;
  const author = q.data.author;
  const mode = q.data.mode;

  const layout = FORMATION_LAYOUTS[(lu.formation as Formation)] ?? FORMATION_LAYOUTS['4-3-3'];
  const slots = (lu.players as { slot: string; player_id: number }[]);
  const playerById = (id: number) => players.find(p => p.id === id);

  const onPulse = async () => {
    if (!authed) { router.navigate({ to: "/auth/login" }); return; }
    if (authorIdSelf) { toast.error("No puedes hacer pulse a tu propia carta"); return; }
    try {
      const r = await togglePulseFn({ data: { lineup_id: lu.id }});
      setPulseado(r.pulseado);
      setPulses(p => p + (r.pulseado ? 1 : -1));
    } catch (e) { toast.error((e as Error).message); }
  };

  const share = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); toast.success("Link copiado."); }
    catch { toast.error("No pudimos copiar el link."); }
  };

  const fork = () => {
    if (!authed) { router.navigate({ to: "/auth/login" }); return; }
    router.navigate({ to: "/lineups/new" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="tape mb-2">CARTA · /{lu.code}</div>
            <h1 className="display text-5xl">{lu.title}</h1>
            <div className="mt-1 text-sm text-muted-foreground font-mono uppercase tracking-wider">
              {mode?.name} · {lu.formation}
              {author && <> · por <Link to="/u/$username" params={{ username: author.username }} className="text-primary hover:underline">{getAvatar(author.avatar_id).emoji} {author.username}</Link></>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onPulse} disabled={authorIdSelf}
              className={`btn-hero ${pulseado ? '!bg-accent !text-accent-foreground' : ''} disabled:opacity-40`}>
              {pulseado ? `PULSEADO · ${pulses}` : `PULSE · ${pulses}`}
            </button>
            <button onClick={fork} className="btn-ghost-zine">Hacer mi versión</button>
            <button onClick={share} className="btn-ghost-zine">Compartir</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
          <Pitch>
            {slots.map(s => {
              const slotDef = layout.find(l => l.slot === s.slot);
              const p = playerById(s.player_id);
              if (!slotDef || !p) return null;
              const idx = slots.findIndex(x => x.slot === s.slot);
              return <MiniCard key={s.slot} slot={slotDef} player={p} jersey={idx + 1} />;
            })}
          </Pitch>

          <aside className="border-2 border-foreground bg-surface p-4">
            <div className="display text-2xl mb-2">LISTA</div>
            <ol className="space-y-1 font-mono text-sm">
              {slots.map((s, i) => {
                const p = playerById(s.player_id);
                return (
                  <li key={s.slot} className="flex justify-between border-b border-border py-1">
                    <span><span className="text-muted-foreground w-10 inline-block">{s.slot}</span> {p?.name}</span>
                    <span>{p?.nationality}</span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 font-mono text-xs text-muted-foreground">
              FORKS: {lu.forks_count}
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
