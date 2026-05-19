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
    { title: `Carta /${params.code} · 11Pulse` },
    { name: "description", content: "Una carta de 11 ideal en 11Pulse." },
    { property: "og:title", content: `11Pulse · /${params.code}` },
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
  const [pop, setPop] = useState(false);

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

  if (q.isLoading) return (
    <div className="min-h-screen flex flex-col"><Nav />
      <div className="flex-1 grid place-items-center"><div className="display text-6xl wiggle">PINTANDO TU CARTA…</div></div>
    </div>
  );
  if (!q.data) return (
    <div className="min-h-screen flex flex-col"><Nav />
      <div className="flex-1 grid place-items-center text-center px-6">
        <div>
          <div className="display text-[24vw] sm:text-[14rem] leading-none text-stroke">404</div>
          <div className="tape mt-4">CARTA NO ENCONTRADA</div>
          <div className="mt-6"><Link to="/" className="btn-hero">VOLVER</Link></div>
        </div>
      </div>
    </div>
  );

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
      if (r.pulseado) { setPop(true); setTimeout(() => setPop(false), 600); }
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

  const fechaShort = new Date(lu.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      {/* Marquee status */}
      <div className="marquee magenta">
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>★ CARTA /{lu.code} &nbsp; · &nbsp; {pulses} PULSES &nbsp; · &nbsp; {lu.forks_count} FORKS &nbsp; · &nbsp; {mode?.name?.toUpperCase()} &nbsp; · &nbsp;</span>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        {/* Ghost code */}
        <div className="relative">
          <div className="absolute -top-6 -right-2 sm:-right-6 stencil text-[28vw] sm:text-[16rem] leading-none opacity-30 pointer-events-none select-none">
            /{lu.code}
          </div>

          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="tape">CARTA · /{lu.code}</span>
                <span className="tape tape-accent">{lu.formation}</span>
                <span className="tape tape-magenta">{mode?.name?.toUpperCase()}</span>
              </div>
              <h1 className="display text-6xl sm:text-8xl glow-primary text-primary leading-[0.85]">
                {lu.title}
              </h1>
              {author && (
                <div className="mt-3 font-mono text-sm uppercase tracking-wider">
                  POR{" "}
                  <Link to="/u/$username" params={{ username: author.username }} className="text-magenta hover:underline">
                    {getAvatar(author.avatar_id).emoji} @{author.username}
                  </Link>
                  {" "}· {fechaShort}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={onPulse} disabled={authorIdSelf}
                className={`btn-hero ${pulseado ? '!bg-accent !text-accent-foreground' : ''} ${pop ? 'wiggle' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}>
                {pulseado ? `❤︎ PULSEADO · ${pulses}` : `PULSE · ${pulses}`}
              </button>
              <button onClick={fork} className="btn-ghost-zine">FORK</button>
              <button onClick={share} className="btn-ghost-zine">SHARE</button>
            </div>
          </div>
        </div>

        {/* Pitch + sidebar */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 mt-10">
          <div className="relative">
            <div className="absolute -top-3 -left-3 sticker tilt-3 z-20 text-sm">11 IDEAL</div>
            <div className="absolute -bottom-3 -right-3 sticker tilt-2 z-20 text-sm bg-accent text-accent-foreground border-foreground">{lu.formation}</div>
            <div className="border-2 border-foreground shadow-brutal-primary scanlines relative">
              <Pitch>
                {slots.map(s => {
                  const slotDef = layout.find(l => l.slot === s.slot);
                  const p = playerById(s.player_id);
                  if (!slotDef || !p) return null;
                  const idx = slots.findIndex(x => x.slot === s.slot);
                  return <MiniCard key={s.slot} slot={slotDef} player={p} jersey={idx + 1} />;
                })}
              </Pitch>
            </div>
          </div>

          <aside className="space-y-4">
            {/* Stats brutalist */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-foreground bg-primary text-primary-foreground p-3 shadow-brutal">
                <div className="text-xs font-mono uppercase opacity-70">Pulses</div>
                <div className="display text-5xl leading-none mt-1">{pulses}</div>
              </div>
              <div className="border-2 border-foreground bg-accent text-accent-foreground p-3 shadow-brutal">
                <div className="text-xs font-mono uppercase opacity-70">Forks</div>
                <div className="display text-5xl leading-none mt-1">{lu.forks_count}</div>
              </div>
            </div>

            {/* Lista */}
            <div className="border-2 border-foreground bg-surface shadow-brutal">
              <div className="bg-foreground text-background px-3 py-1.5 flex items-center justify-between">
                <span className="display text-xl tracking-wider">PLANTILLA</span>
                <span className="font-mono text-[10px]">11/11</span>
              </div>
              <ol className="divide-y divide-border">
                {slots.map((s, i) => {
                  const p = playerById(s.player_id);
                  return (
                    <li key={s.slot} className="flex items-center justify-between px-3 py-1.5 font-mono text-xs hover:bg-surface-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="display text-base w-6 text-magenta">{i + 1}</span>
                        <span className="bg-foreground text-background px-1.5 py-0.5 text-[10px] w-10 text-center">{s.slot}</span>
                        <span className="truncate">{p?.name}</span>
                      </div>
                      <span className="text-muted-foreground shrink-0">{p?.nationality}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* CTA */}
            {!authed && (
              <Link to="/auth/login" className="block border-2 border-dashed border-magenta p-3 text-center font-mono text-xs uppercase hover:bg-magenta hover:text-white transition">
                Entra para pulsar y forkear esta carta
              </Link>
            )}
          </aside>
        </div>

        {/* Big stencil mode footer */}
        <div className="mt-16 text-center">
          <div className="stencil text-[18vw] sm:text-[10rem] leading-none">11PULSE</div>
          <div className="font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground -mt-2">El football se vive en cartas</div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
