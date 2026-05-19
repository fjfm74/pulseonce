import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { Nav, Footer } from "@/components/nav";
import { getAvatar } from "@/lib/catalog";

const getPublicProfile = createServerFn({ method: "POST" })
  .inputValidator(d => z.object({ username: z.string().min(1).max(30) }).parse(d))
  .handler(async ({ data }) => {
    const { data: p } = await supabaseAdmin.from("profiles")
      .select("id, username, avatar_id, favorite_team_id, status, created_at")
      .ilike("username", data.username).maybeSingle();
    if (!p || p.status !== "active") return null;
    const { data: lineups } = await supabaseAdmin.from("lineups")
      .select("id, code, title, formation, pulses_count, forks_count, created_at")
      .eq("author_id", p.id).eq("is_public", true)
      .order("created_at", { ascending: false }).limit(24);
    const total = (lineups ?? []).reduce((s, l) => s + (l.pulses_count ?? 0), 0);
    const forks = (lineups ?? []).reduce((s, l) => s + (l.forks_count ?? 0), 0);
    return { profile: p, lineups: lineups ?? [], totalPulses: total, totalForks: forks };
  });

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({ meta: [{ title: `@${params.username} · 11Pulse` }] }),
  component: Profile,
});

const TILTS = ['tilt-1', 'tilt-2', 'tilt-3', '-tilt-1', '-tilt-2'] as const;

function Profile() {
  const { username } = Route.useParams();
  const fn = useServerFn(getPublicProfile);
  const q = useQuery({ queryKey: ['u', username], queryFn: () => fn({ data: { username } }) });

  if (q.isLoading) return (
    <div className="min-h-screen flex flex-col"><Nav />
      <div className="flex-1 grid place-items-center"><div className="display text-5xl wiggle">CARGANDO PERFIL…</div></div>
    </div>
  );

  if (!q.data) return (
    <div className="min-h-screen flex flex-col noise-grad"><Nav />
      <div className="flex-1 grid place-items-center text-center px-6">
        <div>
          <div className="display text-[20vw] sm:text-[12rem] text-stroke leading-none">404</div>
          <div className="tape mt-4">PERFIL NO ENCONTRADO</div>
          <p className="text-muted-foreground mt-3">@{username} no existe o ha sido eliminado.</p>
          <Link to="/dashboard" className="btn-hero mt-6 inline-flex">VOLVER</Link>
        </div>
      </div>
    </div>
  );

  const { profile, lineups, totalPulses, totalForks } = q.data;
  const avatar = getAvatar(profile.avatar_id);

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      <div className="marquee">
        <div>{Array.from({ length: 6 }).map((_, i) => (
          <span key={i}>@{profile.username.toUpperCase()} &nbsp; · &nbsp; {totalPulses} PULSES &nbsp; · &nbsp; {totalForks} FORKS &nbsp; · &nbsp; {lineups.length} CARTAS &nbsp; · &nbsp;</span>
        ))}</div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        {/* Header */}
        <div className="relative border-2 border-foreground bg-surface shadow-brutal-primary scanlines overflow-hidden">
          <div className="absolute -right-10 -bottom-20 text-[22rem] opacity-10 leading-none pointer-events-none select-none">
            {avatar.emoji}
          </div>
          <div className="relative p-6 sm:p-10 flex flex-wrap items-center gap-6">
            <div className="text-8xl sm:text-9xl wiggle">{avatar.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="tape mb-2">PERFIL PÚBLICO</div>
              <h1 className="display text-6xl sm:text-8xl text-primary glow-primary leading-[0.85] break-words">
                @{profile.username}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="sticker bg-foreground text-background border-foreground text-xs">{lineups.length} CARTAS</span>
                <span className="sticker bg-primary text-primary-foreground border-foreground text-xs">{totalPulses} PULSES</span>
                <span className="sticker bg-accent text-accent-foreground border-foreground text-xs">{totalForks} FORKS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cartas */}
        <div className="mt-12 relative">
          <div className="absolute -top-4 -left-2 stencil text-[18vw] sm:text-[9rem] leading-none opacity-20 pointer-events-none select-none">CARTAS</div>
          <div className="relative z-10 flex items-end justify-between mb-6">
            <h2 className="display text-4xl sm:text-5xl">SUS 11<br/><span className="text-accent">IDEALES</span></h2>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">ÚLTIMAS {lineups.length}</span>
          </div>

          {lineups.length === 0 ? (
            <div className="border-2 border-dashed border-magenta p-12 text-center">
              <div className="display text-4xl text-magenta glow-primary">SIN CARTAS</div>
              <p className="text-muted-foreground mt-2">@{profile.username} todavía no ha publicado ningún 11.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {lineups.map((l, i) => (
                <Link
                  key={l.id}
                  to="/c/$code"
                  params={{ code: l.code }}
                  className={`relative border-2 border-foreground bg-surface p-5 shadow-brutal hover-lift block ${TILTS[i % TILTS.length]}`}
                >
                  <div className="absolute -top-3 -right-3 sticker bg-primary text-primary-foreground border-foreground text-[10px]">
                    /{l.code}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l.formation}</div>
                  <div className="display text-3xl mt-2 leading-tight line-clamp-2">{l.title}</div>
                  <div className="border-t-2 border-dashed border-border mt-4 pt-3 flex items-center justify-between">
                    <span className="display text-2xl text-primary glow-primary">● {l.pulses_count}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">FORKS · {l.forks_count}</span>
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
