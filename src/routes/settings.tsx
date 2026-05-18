import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { AVATARS } from "@/lib/catalog";
import { deleteMyAccount, getMyProfile, listTeams, updateProfileSettings } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Ajustes · Pulse11" }] }),
  component: Settings,
});

function Settings() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.navigate({ to: "/auth/login" }); else setReady(true);
    });
  }, [router]);
  const meFn = useServerFn(getMyProfile);
  const teamsFn = useServerFn(listTeams);
  const updFn = useServerFn(updateProfileSettings);
  const delFn = useServerFn(deleteMyAccount);

  const me = useQuery({ queryKey: ['me'], queryFn: meFn, enabled: ready });
  const teams = useQuery({ queryKey: ['teams'], queryFn: teamsFn, enabled: ready });
  const [avatar, setAvatar] = useState<string>("av-01");
  const [team, setTeam] = useState<number | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (me.data) {
      setAvatar(me.data.avatar_id);
      setTeam(me.data.favorite_team_id);
    }
  }, [me.data]);

  const save = async () => {
    setBusy(true);
    try { await updFn({ data: { avatar_id: avatar, favorite_team_id: team } }); toast.success("Guardado."); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const onDelete = async () => {
    if (confirm !== "BORRAR") return;
    setBusy(true);
    try {
      await delFn();
      await supabase.auth.signOut();
      toast.success("Cuenta eliminada.");
      router.navigate({ to: "/" });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  if (!me.data) return <div className="min-h-screen"><Nav /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full">
        <div className="tape mb-2">AJUSTES</div>
        <h1 className="display text-5xl">PERFIL</h1>

        <div className="ticket p-6 mt-6 space-y-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">USERNAME</span>
            <div className="display text-3xl">{me.data.username}</div>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">AVATAR</span>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {AVATARS.map(a => (
                <button key={a.id} onClick={() => setAvatar(a.id)}
                  className={`aspect-square text-2xl border-2 ${avatar === a.id ? 'border-primary bg-primary/10' : 'border-border'}`}>
                  {a.emoji}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">EQUIPO DEL CORAZÓN</span>
            <select value={team ?? ''} onChange={e => setTeam(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 w-full bg-input border-2 border-border focus:border-primary outline-none px-3 py-2 font-mono">
              <option value="">— ninguno —</option>
              {(teams.data ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <button onClick={save} disabled={busy} className="btn-hero disabled:opacity-30">GUARDAR</button>
        </div>

        <div className="border-2 border-destructive p-6 mt-8">
          <div className="display text-2xl text-destructive">ZONA ROJA</div>
          <p className="text-sm text-muted-foreground mt-1">
            Borrar tu cuenta anonimiza tus cartas (se desvinculan de tu nombre) y elimina tu acceso. No es reversible.
          </p>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder='Escribe BORRAR para confirmar'
            className="mt-3 w-full bg-input border-2 border-border focus:border-destructive outline-none px-3 py-2 font-mono" />
          <button onClick={onDelete} disabled={confirm !== "BORRAR" || busy}
            className="mt-3 bg-destructive text-destructive-foreground display text-xl px-4 py-2 border-2 border-foreground disabled:opacity-30">
            BORRAR CUENTA
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
