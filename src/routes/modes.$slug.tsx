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
      .select("id, code, title, pulses_count, author_id")
      .eq("mode_id", mode.id).eq("is_public", true)
      .order("pulses_count", { ascending: false }).limit(30);
    const ids = (lineups ?? []).map(l => l.author_id).filter(Boolean) as string[];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, username").in("id", ids)
      : { data: [] };
    const byId = new Map((profiles ?? []).map(p => [p.id, p.username]));
    return { mode, lineups: (lineups ?? []).map(l => ({ ...l, username: l.author_id ? byId.get(l.author_id) : null })) };
  });

export const Route = createFileRoute("/modes/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Modo ${params.slug} · Pulse11` }] }),
  component: ModePage,
});

function ModePage() {
  const { slug } = Route.useParams();
  const fn = useServerFn(getModeRanking);
  const q = useQuery({ queryKey: ['mode', slug], queryFn: () => fn({ data: { slug } }) });

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
        {!q.data ? <div className="p-12 text-center text-muted-foreground">Modo no encontrado.</div> : (
          <>
            <div className="tape mb-2">MODO</div>
            <h1 className="display text-5xl">{q.data.mode.name}</h1>
            <p className="text-muted-foreground mt-1">{q.data.mode.description}</p>
            <div className="mt-6 space-y-1">
              {q.data.lineups.map((l, i) => (
                <Link key={l.id} to="/c/$code" params={{ code: l.code }}
                  className="flex items-center justify-between border-b border-border py-2 hover:text-primary">
                  <div className="flex items-center gap-3">
                    <span className="display text-2xl w-8 text-accent">{i + 1}</span>
                    <span className="display text-2xl">{l.title}</span>
                    {l.username && <span className="text-xs text-muted-foreground">por {l.username}</span>}
                  </div>
                  <span className="font-mono text-primary">● {l.pulses_count}</span>
                </Link>
              ))}
              {q.data.lineups.length === 0 && <div className="text-muted-foreground p-4 border border-dashed border-border">Aún no hay 11s en este modo.</div>}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
