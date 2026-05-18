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
      .select("id, username, avatar_id, favorite_team_id, status")
      .ilike("username", data.username).maybeSingle();
    if (!p || p.status !== "active") return null;
    const { data: lineups } = await supabaseAdmin.from("lineups")
      .select("id, code, title, formation, pulses_count, forks_count")
      .eq("author_id", p.id).eq("is_public", true)
      .order("created_at", { ascending: false }).limit(24);
    const total = (lineups ?? []).reduce((s, l) => s + (l.pulses_count ?? 0), 0);
    return { profile: p, lineups: lineups ?? [], totalPulses: total };
  });

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({ meta: [{ title: `${params.username} · Pulse11` }] }),
  component: Profile,
});

function Profile() {
  const { username } = Route.useParams();
  const fn = useServerFn(getPublicProfile);
  const q = useQuery({ queryKey: ['u', username], queryFn: () => fn({ data: { username } }) });

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        {!q.data ? <div className="text-center text-muted-foreground p-12">Perfil no encontrado.</div> : (
          <>
            <div className="border-2 border-foreground bg-surface p-6 flex items-center gap-4">
              <div className="text-6xl">{getAvatar(q.data.profile.avatar_id).emoji}</div>
              <div>
                <h1 className="display text-5xl">{q.data.profile.username}</h1>
                <div className="font-mono text-sm text-primary">{q.data.totalPulses} pulses recibidos · {q.data.lineups.length} cartas</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {q.data.lineups.map(l => (
                <Link key={l.id} to="/c/$code" params={{ code: l.code }} className="border-2 border-foreground bg-surface p-4 hover:border-primary">
                  <div className="font-mono text-xs text-muted-foreground">/c/{l.code}</div>
                  <div className="display text-2xl mt-1">{l.title}</div>
                  <div className="mt-2 text-xs uppercase">{l.formation}</div>
                  <div className="mt-2 font-mono text-sm text-primary">● {l.pulses_count}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
