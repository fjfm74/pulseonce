import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { myLeagues } from "@/lib/lineup.functions";
import { getCrest } from "@/lib/catalog";

export const Route = createFileRoute("/leagues")({
  head: () => ({ meta: [{ title: "Mis ligas · 11Pulse" }] }),
  component: Leagues,
});

function Leagues() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.navigate({ to: "/auth/login" }); else setReady(true);
    });
  }, [router]);
  const fn = useServerFn(myLeagues);
  const q = useQuery({ queryKey: ['my-leagues'], queryFn: fn, enabled: ready });

  const tilts = ['tilt-1', 'tilt-2', 'tilt-3'];

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      <div className="marquee alt">
        <div>{Array.from({ length: 8 }).map((_, i) => (
          <span key={i}>LIGAS PRIVADAS · ENTRE COLEGAS · SIN HUMO · </span>
        ))}</div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="relative">
          <div className="absolute -top-6 -left-3 stencil text-[24vw] sm:text-[14rem] leading-none opacity-25 pointer-events-none select-none">LIGAS</div>
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="tape mb-3">TU GENTE</div>
              <h1 className="display text-6xl sm:text-8xl glow-primary text-primary leading-[0.85]">
                TUS LIGAS
              </h1>
              <p className="mt-3 max-w-md text-muted-foreground">Compite con tus colegas. El que más pulses junte en la semana, manda.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/leagues/create" className="btn-hero">CREAR LIGA</Link>
              <Link to="/leagues/join" className="btn-ghost-zine">UNIRME</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(q.data ?? []).map((l, i) => (
            <Link
              key={l.id}
              to="/leagues/$code"
              params={{ code: l.code }}
              className={`group relative border-2 border-foreground bg-surface p-5 shadow-brutal hover-lift ${tilts[i % tilts.length]}`}
            >
              <div className="absolute -top-3 -right-3 sticker text-[10px] bg-accent text-accent-foreground border-foreground">/{l.code}</div>
              <div className="flex items-center gap-4">
                <div className="text-6xl wiggle">{getCrest(l.crest_id).emoji}</div>
                <div className="min-w-0">
                  <div className="display text-3xl leading-none group-hover:text-primary truncate">{l.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    LIGA PRIVADA
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-dashed border-border pt-3 flex items-center justify-between font-mono text-xs uppercase">
                <span className="text-muted-foreground">VER RANKING</span>
                <span className="text-primary">→</span>
              </div>
            </Link>
          ))}

          {ready && q.data && q.data.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-magenta p-12 text-center">
              <div className="display text-5xl text-magenta glow-primary mb-2">VACÍO</div>
              <p className="text-muted-foreground mb-6">Aún no estás en ninguna liga. Móntala tú o entra con un código.</p>
              <div className="flex justify-center gap-3">
                <Link to="/leagues/create" className="btn-hero">MONTAR LIGA</Link>
                <Link to="/leagues/join" className="btn-ghost-zine">USAR CÓDIGO</Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
