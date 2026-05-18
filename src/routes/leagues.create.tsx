import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { CRESTS } from "@/lib/catalog";
import { createLeague } from "@/lib/lineup.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/leagues/create")({
  head: () => ({ meta: [{ title: "Crear liga · Pulse11" }] }),
  component: Create,
});

function Create() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (!data.session) router.navigate({ to: "/auth/login" }); });
  }, [router]);
  const fn = useServerFn(createLeague);
  const [name, setName] = useState("");
  const [crest, setCrest] = useState("cr-01");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fn({ data: { name, crest_id: crest } });
      toast.success("¡Liga creada!");
      router.navigate({ to: "/leagues/$code", params: { code: r.code } });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const selected = CRESTS.find(c => c.id === crest);

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          <Link to="/leagues" className="hover:text-primary">← LIGAS</Link>
          <span>/</span>
          <span className="text-foreground">CREAR</span>
        </div>

        <div className="relative">
          <div className="absolute -top-4 -left-2 stencil text-[22vw] sm:text-[11rem] leading-none opacity-25 pointer-events-none select-none">NEW</div>
          <div className="relative z-10">
            <div className="tape mb-3">NUEVA LIGA</div>
            <h1 className="display text-6xl sm:text-8xl glow-primary text-primary leading-[0.85]">MONTA<br/>TU LIGA</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-10">
          <form onSubmit={submit} className="border-2 border-foreground bg-surface p-6 shadow-brutal space-y-6">
            <label className="block">
              <span className="display text-2xl text-accent">NOMBRE DE LA LIGA</span>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required minLength={2} maxLength={40}
                className="mt-2 w-full bg-input border-2 border-border focus:border-primary outline-none px-4 py-3 display text-3xl"
                placeholder="LOS PRIMOS FC"
              />
              <span className="text-[10px] font-mono uppercase text-muted-foreground">2-40 chars · será el nombre visible</span>
            </label>

            <div>
              <span className="display text-2xl text-accent">ESCUDO</span>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mt-2">
                {CRESTS.map(c => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCrest(c.id)}
                    className={`aspect-square text-3xl border-2 transition ${crest === c.id ? 'border-primary bg-primary/15 shadow-brutal-primary scale-110' : 'border-border hover:border-foreground'}`}
                    aria-label={c.id}
                  >
                    {c.emoji}
                  </button>
                ))}
              </div>
            </div>

            <button disabled={busy || name.length < 2} className="btn-hero w-full disabled:opacity-30">
              {busy ? "CREANDO…" : "CREAR LIGA"}
            </button>
          </form>

          {/* Preview ticket */}
          <aside>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">PREVIEW</div>
            <div className="border-2 border-foreground bg-surface-2 p-5 shadow-brutal-magenta tilt-1">
              <div className="text-7xl text-center wiggle">{selected?.emoji}</div>
              <div className="display text-3xl text-center mt-3 break-words">
                {name || "TU LIGA"}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-center text-muted-foreground mt-2">
                CÓDIGO · ────
              </div>
              <div className="border-t border-dashed border-border mt-4 pt-3 text-center">
                <span className="tape tape-accent">PRIVADA</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
