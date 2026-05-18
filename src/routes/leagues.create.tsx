import { createFileRoute, useRouter } from "@tanstack/react-router";
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
      toast.success("Liga creada");
      router.navigate({ to: "/leagues/$code", params: { code: r.code } });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-xl mx-auto px-4 py-10 w-full">
        <div className="tape mb-2">NUEVA LIGA</div>
        <h1 className="display text-5xl">MONTA TU LIGA</h1>
        <form onSubmit={submit} className="ticket p-6 mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">NOMBRE</span>
            <input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={40}
              className="mt-1 w-full bg-input border-2 border-border focus:border-primary outline-none px-3 py-2 font-mono" placeholder="Los Primos" />
          </label>
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">ESCUDO</span>
            <div className="grid grid-cols-6 gap-2 mt-1">
              {CRESTS.map(c => (
                <button type="button" key={c.id} onClick={() => setCrest(c.id)}
                  className={`aspect-square text-3xl border-2 ${crest === c.id ? 'border-primary bg-primary/10' : 'border-border'}`}>
                  {c.emoji}
                </button>
              ))}
            </div>
          </div>
          <button disabled={busy} className="btn-hero w-full disabled:opacity-30">{busy ? "CREANDO…" : "CREAR LIGA"}</button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
