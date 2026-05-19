import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { getLeague } from "@/lib/lineup.functions";
import { getCrest, getAvatar } from "@/lib/catalog";
import { toast } from "sonner";

export const Route = createFileRoute("/leagues/$code")({
  head: ({ params }) => ({ meta: [{ title: `Liga ${params.code} · 11Pulse` }] }),
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

  if (!ready || q.isLoading) return (
    <div className="min-h-screen flex flex-col"><Nav />
      <div className="flex-1 grid place-items-center"><div className="display text-5xl wiggle">CARGANDO LIGA…</div></div>
    </div>
  );
  if (!q.data) return (
    <div className="min-h-screen flex flex-col"><Nav />
      <div className="flex-1 grid place-items-center text-center">
        <div>
          <div className="display text-[20vw] sm:text-[12rem] text-stroke leading-none">404</div>
          <div className="tape mt-4">LIGA NO ENCONTRADA</div>
          <div className="mt-6"><Link to="/leagues" className="btn-hero">VOLVER</Link></div>
        </div>
      </div>
    </div>
  );
  if (!q.data.isMember) return (
    <div className="min-h-screen flex flex-col"><Nav />
      <div className="flex-1 grid place-items-center text-center px-6">
        <div>
          <div className="display text-7xl text-magenta glow-primary">PRIVADA</div>
          <p className="mt-3 text-muted-foreground">No eres miembro de esta liga.</p>
          <div className="mt-6"><Link to="/leagues/join" className="btn-hero">USAR CÓDIGO</Link></div>
        </div>
      </div>
    </div>
  );

  const { league, ranking } = q.data;
  const crest = getCrest(league.crest_id);

  const podiumColors = [
    'bg-primary text-primary-foreground',
    'bg-accent text-accent-foreground',
    'bg-magenta text-white',
  ];

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      <div className="marquee">
        <div>{Array.from({ length: 6 }).map((_, i) => (
          <span key={i}>LIGA /{league.code} &nbsp; · &nbsp; {league.name.toUpperCase()} &nbsp; · &nbsp; {ranking.length} MIEMBROS &nbsp; · &nbsp;</span>
        ))}</div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          <Link to="/leagues" className="hover:text-primary">← LIGAS</Link>
          <span>/</span>
          <span className="text-foreground">/{league.code}</span>
        </div>

        {/* Header card */}
        <div className="relative border-2 border-foreground bg-surface shadow-brutal-primary scanlines overflow-hidden">
          <div className="absolute -right-6 -bottom-10 text-[18rem] opacity-10 leading-none pointer-events-none select-none">
            {crest.emoji}
          </div>
          <div className="relative p-6 sm:p-8 flex flex-wrap items-center gap-6">
            <div className="text-7xl sm:text-8xl wiggle">{crest.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="tape mb-2">LIGA PRIVADA</div>
              <h1 className="display text-5xl sm:text-7xl text-primary glow-primary leading-[0.85] break-words">
                {league.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-3 items-center">
                <button onClick={share} className="sticker bg-foreground text-background border-foreground text-xs hover:bg-accent hover:text-accent-foreground transition">
                  CÓDIGO /{league.code} · COPIAR
                </button>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {ranking.length} MIEMBRO{ranking.length === 1 ? '' : 'S'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <div className="mt-10 relative">
          <div className="absolute -top-4 -left-2 stencil text-[18vw] sm:text-[9rem] leading-none opacity-20 pointer-events-none select-none">RANKING</div>
          <div className="relative z-10 flex items-end justify-between mb-4">
            <h2 className="display text-4xl sm:text-5xl">RANKING<br/><span className="text-accent">POR PULSES</span></h2>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">SEMANA EN CURSO</span>
          </div>

          <div className="space-y-2">
            {ranking.map((r, i) => {
              const isPodium = i < 3;
              return (
                <div
                  key={r.username}
                  className={`relative border-2 border-foreground p-3 sm:p-4 flex items-center gap-4 ${isPodium ? 'shadow-brutal' : ''} ${i === 0 ? 'bg-surface-2' : 'bg-surface'} hover-lift`}
                >
                  <div className={`display text-4xl sm:text-5xl w-14 h-14 grid place-items-center border-2 border-foreground ${isPodium ? podiumColors[i] : 'bg-background'}`}>
                    {i + 1}
                  </div>
                  <div className="text-4xl">{getAvatar(r.avatar_id).emoji}</div>
                  <Link to="/u/$username" params={{ username: r.username }} className="flex-1 min-w-0">
                    <div className="display text-2xl sm:text-3xl truncate hover:text-primary">@{r.username}</div>
                    {i === 0 && <div className="font-mono text-[10px] uppercase tracking-widest text-accent">★ LÍDER</div>}
                  </Link>
                  <div className="text-right shrink-0">
                    <div className="display text-3xl sm:text-4xl text-primary glow-primary">{r.pulses}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">pulses</div>
                  </div>
                </div>
              );
            })}

            {ranking.length === 0 && (
              <div className="border-2 border-dashed border-magenta p-10 text-center">
                <div className="display text-4xl text-magenta glow-primary">SIN ACTIVIDAD</div>
                <p className="text-muted-foreground mt-2">Aún no hay 11s con pulses en esta liga. Sé el primero.</p>
                <Link to="/lineups/new" className="btn-hero mt-5 inline-flex">CREAR MI 11</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
