import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { joinLeague } from "@/lib/lineup.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/leagues/join")({
  head: () => ({ meta: [{ title: "Unirme a liga · 11Pulse" }] }),
  component: Join,
});

function Join() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (!data.session) router.navigate({ to: "/auth/login" }); });
  }, [router]);
  const fn = useServerFn(joinLeague);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fn({ data: { code } });
      toast.success("¡Dentro!");
      router.navigate({ to: "/leagues/$code", params: { code: r.code } });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />
      <div className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          <Link to="/leagues" className="hover:text-primary">← LIGAS</Link>
          <span>/</span>
          <span className="text-foreground">UNIRME</span>
        </div>

        <div className="relative">
          <div className="absolute -top-4 -right-2 stencil text-[22vw] sm:text-[10rem] leading-none opacity-25 pointer-events-none select-none">JOIN</div>
          <div className="relative z-10">
            <div className="tape tape-magenta mb-3">CÓDIGO SECRETO</div>
            <h1 className="display text-6xl sm:text-8xl glow-primary text-primary leading-[0.85]">ENTRA<br/>A LA LIGA</h1>
            <p className="mt-3 text-muted-foreground max-w-md">Pídele a tu colega el código de 6 letras y dale.</p>
          </div>
        </div>

        <form onSubmit={submit} className="border-2 border-foreground bg-surface p-6 sm:p-8 shadow-brutal-magenta mt-10 space-y-6 tilt-1">
          <label className="block">
            <span className="display text-2xl text-accent">CÓDIGO</span>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              required minLength={4} maxLength={10}
              className="mt-2 w-full bg-input border-2 border-foreground focus:border-primary outline-none px-4 py-6 display text-5xl sm:text-6xl tracking-[0.3em] text-center uppercase"
              placeholder="A7K2X9"
              autoComplete="off"
            />
          </label>
          <button disabled={busy || code.length < 4} className="btn-hero w-full disabled:opacity-30">
            {busy ? "ENTRANDO…" : "ENTRAR"}
          </button>
        </form>

        <div className="mt-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ¿NO TIENES CÓDIGO? &nbsp; · &nbsp; <Link to="/leagues/create" className="text-primary hover:underline">CREA LA TUYA →</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
