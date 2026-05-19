import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { getMyProfile, listActiveModes } from "@/lib/profile.functions";
import { myLeagues, myLineupsList } from "@/lib/lineup.functions";
import { getCrest, getAvatar } from "@/lib/catalog";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Tu vestuario · 11Pulse" }] }),
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
  const totalForks = (lines.data ?? []).reduce((s, l) => s + (l.forks_count ?? 0), 0);
  const avatar = getAvatar(me.data.avatar_id);
  const week = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      {/* Marquee status */}
      <div className="marquee magenta">
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="live-dot" /> SEMANA EN VIVO · {week} · ECHA TU 11 ANTES DEL DOMINGO · TUS AMIGOS YA HAN PULSADO ·
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full relative">
        {/* Stencil background number */}
        <div aria-hidden className="pointer-events-none absolute -top-6 right-0 select-none">
          <div className="stencil text-[180px] sm:text-[260px] leading-none opacity-20">11</div>
        </div>

        {/* Header */}
        <div className="relative">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="tape">VESTUARIO</span>
            <span className="sticker text-xs">SEM · {week}</span>
          </div>

          <div className="mt-3 flex items-end gap-4 flex-wrap">
            <div className="text-6xl wiggle">{avatar.emoji}</div>
            <div>
              <div className="display text-[64px] sm:text-[88px] leading-[0.85]">
                HOLA,
                <br />
                <span className="text-primary glow-primary">{me.data.username.toUpperCase()}</span>
                <span className="text-accent">.</span>
              </div>
              <p className="mt-2 text-muted-foreground text-sm max-w-md">
                Tu vestuario. Tus cartas. Tus pulses. Aquí mandas tú.
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 relative">
          {[
            { k: '11s creados', v: (lines.data ?? []).length, color: 'text-primary', shadow: 'shadow-brutal' },
            { k: 'Pulses', v: totalPulses, color: 'text-accent', shadow: 'shadow-brutal-primary' },
            { k: 'Forks', v: totalForks, color: 'text-magenta', shadow: 'shadow-brutal' },
            { k: 'Ligas', v: (leagues.data ?? []).length, color: 'text-foreground', shadow: 'shadow-brutal-magenta' },
          ].map((s, i) => (
            <div key={i} className={`relative border-2 border-foreground bg-surface p-4 ${s.shadow} hover-lift`}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">{s.k}</div>
              <div className={`display text-6xl ${s.color} mt-1`}>{s.v}</div>
              <div className="absolute top-2 right-2 text-[10px] font-mono opacity-60">#{String(i + 1).padStart(2, '0')}</div>
            </div>
          ))}
        </div>

        {/* Modos activos */}
        <div className="mt-14 relative">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <span className="tape tape-accent">MODOS · ESTA SEMANA</span>
              <h2 className="display text-5xl sm:text-6xl mt-3">
                ELIGE TU <span className="text-stroke">CAMPO</span> DE BATALLA
              </h2>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {(modes.data ?? []).map((m, i) => {
              const isPool = (m.rules as { selection_mode?: string })?.selection_mode === 'pool';
              return (
                <Link
                  key={m.id}
                  to="/lineups/new"
                  search={{ mode: m.slug } as never}
                  className={`group relative ticket p-6 hover-lift ${i === 0 ? 'tilt-1' : 'tilt-2'}`}
                >
                  <div className="absolute -top-3 left-4">
                    <span className={`sticker text-[10px] ${isPool ? 'bg-magenta text-white' : 'bg-primary text-primary-foreground'}`}>
                      {isPool ? 'POOL CERRADO · 22' : 'ABIERTO · TODOS'}
                    </span>
                  </div>
                  <div className="display text-5xl mt-2 group-hover:text-primary transition-colors">
                    {m.name.toUpperCase()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">{m.description}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70">
                      Monta tu 11
                    </span>
                    <span className="display text-3xl text-accent group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Feed: mis cartas */}
        <div className="mt-14">
          <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
            <div>
              <span className="tape">TUS CARTAS</span>
              <h2 className="display text-5xl sm:text-6xl mt-3">EL VESTUARIO</h2>
            </div>
            <Link to="/lineups/new" className="btn-ghost-zine !text-sm !py-2">+ Nueva carta</Link>
          </div>

          {(lines.data ?? []).length === 0 ? (
            <div className="relative border-2 border-dashed border-foreground/40 bg-surface/40 p-10 text-center">
              <div className="display text-3xl">SILENCIO EN EL VESTUARIO</div>
              <p className="text-muted-foreground mt-2">Tira la primera carta. Que rabien tus amigos.</p>
              <Link to="/lineups/new" className="btn-hero mt-6 inline-block">MONTAR MI 11</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(lines.data ?? []).map((l, i) => (
                <Link
                  key={l.id}
                  to="/c/$code"
                  params={{ code: l.code }}
                  className={`group relative bg-surface border-2 border-foreground p-4 hover-lift ${i % 3 === 1 ? 'tilt-1' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">/c/{l.code}</span>
                    <span className="text-[10px] font-mono bg-foreground text-background px-1.5 py-0.5">{l.formation}</span>
                  </div>
                  <div className="display text-3xl mt-2 group-hover:text-primary transition-colors">
                    {l.title}
                  </div>
                  <div className="mt-4 flex gap-4 font-mono text-xs uppercase tracking-wider">
                    <span className="text-primary flex items-center gap-1">● {l.pulses_count} pulses</span>
                    <span className="text-accent flex items-center gap-1">⤴ {l.forks_count}</span>
                  </div>
                  <div className="absolute bottom-2 right-3 display text-5xl text-foreground/5 group-hover:text-primary/10 transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mis ligas */}
        <div className="mt-14 mb-10">
          <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
            <div>
              <span className="tape tape-magenta">LIGAS</span>
              <h2 className="display text-5xl sm:text-6xl mt-3">TUS BANDOS</h2>
            </div>
            <div className="flex gap-2">
              <Link to="/leagues/join" className="btn-ghost-zine !text-sm !py-2">Unirme</Link>
              <Link to="/leagues/create" className="btn-ghost-zine !text-sm !py-2">+ Crear</Link>
            </div>
          </div>

          {(leagues.data ?? []).length === 0 ? (
            <div className="relative border-2 border-dashed border-foreground/40 bg-surface/40 p-10 text-center">
              <div className="display text-3xl">SIN BANDOS TODAVÍA</div>
              <p className="text-muted-foreground mt-2">Las ligas son privadas. Solo con código. Solo tu gente.</p>
              <div className="mt-6 flex justify-center gap-3 flex-wrap">
                <Link to="/leagues/create" className="btn-hero">CREAR LIGA</Link>
                <Link to="/leagues/join" className="btn-ghost-zine">UNIRME CON CÓDIGO</Link>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(leagues.data ?? []).map((l, i) => (
                <Link
                  key={l.id}
                  to="/leagues/$code"
                  params={{ code: l.code }}
                  className={`group bg-surface border-2 border-foreground p-4 flex items-center gap-4 hover-lift ${i % 2 === 0 ? 'tilt-2' : 'tilt-1'}`}
                >
                  <div className="text-5xl floaty" style={{ ['--r' as 'color']: `${(i % 2 ? -3 : 3)}deg` }}>
                    {getCrest(l.crest_id).emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="display text-3xl group-hover:text-primary transition-colors truncate">{l.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      cod · {l.code}
                    </div>
                  </div>
                  <div className="ml-auto display text-2xl text-magenta opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom marquee */}
      <div className="marquee alt">
        <div>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i}>SIN APUESTAS · SIN TÓXICOS · SIN DMs · SOLO 11 ·&nbsp;&nbsp;</span>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
