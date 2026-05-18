import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { joinLeague } from "@/lib/lineup.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/leagues/join")({
  head: () => ({ meta: [{ title: "Unirme a liga · Pulse11" }] }),
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
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-md mx-auto px-4 py-10 w-full">
        <div className="tape mb-2">UNIRME</div>
        <h1 className="display text-5xl">ENTRA CON CÓDIGO</h1>
        <form onSubmit={submit} className="ticket p-6 mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">CÓDIGO DE 6 LETRAS</span>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required minLength={4} maxLength={10}
              className="mt-1 w-full bg-input border-2 border-border focus:border-primary outline-none px-3 py-3 font-mono text-2xl tracking-[0.3em] text-center uppercase" placeholder="A7K2X9" />
          </label>
          <button disabled={busy} className="btn-hero w-full disabled:opacity-30">{busy ? "ENTRANDO…" : "ENTRAR"}</button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
