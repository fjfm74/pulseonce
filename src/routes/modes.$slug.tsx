import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { Nav, Footer } from "@/components/nav";

const getModeRanking = createServerFn({ method: "POST" })
  .inputValidator(d => z.object({ slug: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { data: mode } = await supabaseAdmin.from("modes").select("id, name, description").eq("slug", data.slug).maybeSingle();
    if (!mode) return null;
    const { data: lineups } = await supabaseAdmin.from("lineups")
      .select("id, code, title, formation, pulses_count, forks_count, author_id")
      .eq("mode_id", mode.id).eq("is_public", true)
      .order("pulses_count", { ascending: false }).limit(30);
    const ids = (lineups ?? []).map(l => l.author_id).filter(Boolean) as string[];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, username, avatar_id").in("id", ids)
      : { data: [] };
    const byId = new Map((profiles ?? []).map(p => [p.id, p]));
    return {
      mode,
      lineups: (lineups ?? []).map(l => ({
        ...l,
        username: l.author_id ? byId.get(l.author_id)?.username ?? null : null,
        avatar_id: l.author_id ? byId.get(l.author_id)?.avatar_id ?? null : null,
      })),
    };
  });

export const Route = createFileRoute("/modes/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Modo ${params.slug} · Pulse11` }] }),
  component: ModePage,
});

const PODIUM = [
  'bg-primary text-primary-foreground',
  'bg-accent text-accent-foreground',
  'bg-magenta text-white',
];

function ModePage() {
  const { slug } = Route.useParams();
  const fn = useServerFn(getModeRanking);
  const q = useQuery({ queryKey: ['mode', slug], queryFn: () => fn({ data: { slug } }) });

  if (q.isLoading) return (
    <div className="min-h-screen flex flex-col"><Nav />
      <div className="flex-1 grid place-items-center"><div className="display text-5xl wiggle">CARGANDO MODO…</div></div>
    </div>
  );

  if (!q.data) return (
    <div className="min-h-screen flex flex-col noise-grad"><Nav />
      <div className="flex-1 grid place-items-center text-center px-6">
        <div>
          <div className="display text-[20vw] sm:text-[12rem] text-stroke leading-none">404</div>
          <div className="tape mt-4">MODO NO ENCONTRADO</div>
          <Link to="/dashboard" className="btn-hero mt-6 inline-flex">VOLVER</Link>
        </div>
      </div>
    </div>
  );

  const { mode, lineups } = q.data;

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      <div className="marquee" style={{ background: 'hsl(var(--magenta))', color: 'white' }}>
        <div>{Array.from({ length: 6 }).map((_, i) => (
          <span key={i}>MODO · {mode.name.toUpperCase()} &nbsp; · &nbsp; TOP 30 &nbsp; · &nbsp; ORDENADO POR PULSES &nbsp; · &nbsp;</span>
        ))}</div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          <Link to="/dashboard" className="hover:text-primary">← DASHBOARD</Link>
          <span>/</span>
          <span className="text-foreground">MODO</span>
        </div>

        {/* Header */}
        <div className="relative">
          <div className="absolute -top-6 -left-2 stencil text-[26vw] sm:text-[14rem] leading-none opacity-15 pointer-events-none select-none">
            {slug.toUpperCase()}
          </div>
          <div className="relative z-10">
            <div className="tape mb-3">MODO ACTIVO</div>
            <h1 className="display text-6xl sm:text-8xl glow-primary text-primary leading-[0.85]">{mode.name}</h1>
            {mode.description && <p className="text-muted-foreground mt-4 max-w-2xl text-lg">{mode.description}</p>}
            <div className="mt-5">
              <Link to="/lineups/new" search={{ mode: slug }} className="btn-hero">CREAR MI 11 →</Link>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <div className="mt-12 relative">
          <div className="flex items-end justify-between mb-4">
            <h2 className="display text-4xl sm:text-5xl">TOP<br/><span className="text-accent">11s</span></h2>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">RANKING POR PULSES</span>
          </div>

          {lineups.length === 0 ? (
            <div className="border-2 border-dashed border-magenta p-12 text-center">
              <div className="display text-4xl text-magenta glow-primary">SIN ACTIVIDAD</div>
              <p className="text-muted-foreground mt-2">Aún no hay 11s en este modo. Sé el primero.</p>
              <Link to="/lineups/new" search={{ mode: slug }} className="btn-hero mt-5 inline-flex">CREAR EL PRIMERO</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {lineups.map((l, i) => {
                const isPodium = i < 3;
                return (
                  <Link
                    key={l.id}
                    to="/c/$code"
                    params={{ code: l.code }}
                    className={`relative border-2 border-foreground p-3 sm:p-4 flex items-center gap-4 ${isPodium ? 'shadow-brutal' : ''} ${i === 0 ? 'bg-surface-2' : 'bg-surface'} hover-lift block`}
                  >
                    <div className={`display text-4xl sm:text-5xl w-14 h-14 grid place-items-center border-2 border-foreground shrink-0 ${isPodium ? PODIUM[i] : 'bg-background'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="display text-2xl sm:text-3xl truncate">{l.title}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                        {l.formation} · /{l.code} {l.username && <>· por @{l.username}</>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="display text-3xl sm:text-4xl text-primary glow-primary">● {l.pulses_count}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">FORKS · {l.forks_count}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
