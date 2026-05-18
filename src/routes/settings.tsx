import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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
  const [danger, setDanger] = useState(false);

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

  const logout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
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

  if (!ready || !me.data) return (
    <div className="min-h-screen flex flex-col"><Nav />
      <div className="flex-1 grid place-items-center"><div className="display text-5xl wiggle">CARGANDO…</div></div>
    </div>
  );

  const selectedAvatar = AVATARS.find(a => a.id === avatar);

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      <div className="marquee">
        <div>{Array.from({ length: 6 }).map((_, i) => (
          <span key={i}>AJUSTES · @{me.data?.username?.toUpperCase()} &nbsp; · &nbsp; PERFIL · AVATAR · EQUIPO &nbsp; · &nbsp; RGPD &nbsp; · &nbsp;</span>
        ))}</div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          <Link to="/dashboard" className="hover:text-primary">← DASHBOARD</Link>
          <span>/</span>
          <span className="text-foreground">AJUSTES</span>
        </div>

        {/* Header */}
        <div className="relative">
          <div className="absolute -top-4 -left-2 stencil text-[24vw] sm:text-[12rem] leading-none opacity-20 pointer-events-none select-none">AJUSTES</div>
          <div className="relative z-10">
            <div className="tape mb-3">CUENTA</div>
            <h1 className="display text-6xl sm:text-8xl glow-primary text-primary leading-[0.85]">TU<br/>PERFIL</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-10">
          {/* Form */}
          <div className="space-y-6">
            {/* Username card */}
            <div className="border-2 border-foreground bg-surface p-6 shadow-brutal flex items-center gap-5">
              <div className="text-7xl wiggle">{selectedAvatar?.emoji}</div>
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">USERNAME · INMUTABLE</div>
                <div className="display text-4xl sm:text-5xl truncate">@{me.data.username}</div>
                <Link to="/u/$username" params={{ username: me.data.username }} className="sticker bg-foreground text-background border-foreground text-[10px] mt-2 inline-block hover:bg-accent hover:text-accent-foreground transition">
                  VER MI PERFIL PÚBLICO
                </Link>
              </div>
            </div>

            {/* Avatar picker */}
            <div className="border-2 border-foreground bg-surface p-6 shadow-brutal">
              <div className="display text-3xl text-accent mb-3">ELIGE AVATAR</div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {AVATARS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAvatar(a.id)}
                    className={`aspect-square text-3xl border-2 transition ${avatar === a.id ? 'border-primary bg-primary/15 shadow-brutal-primary scale-110' : 'border-border hover:border-foreground'}`}
                    aria-label={a.id}
                  >
                    {a.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Team */}
            <div className="border-2 border-foreground bg-surface p-6 shadow-brutal">
              <div className="display text-3xl text-accent mb-3">EQUIPO DEL CORAZÓN</div>
              <select
                value={team ?? ''}
                onChange={e => setTeam(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-input border-2 border-border focus:border-primary outline-none px-4 py-3 display text-2xl"
              >
                <option value="">— SIN EQUIPO —</option>
                {(teams.data ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <button onClick={save} disabled={busy} className="btn-hero w-full disabled:opacity-30">
              {busy ? "GUARDANDO…" : "GUARDAR CAMBIOS"}
            </button>

            <button onClick={logout} className="w-full border-2 border-foreground bg-surface-2 py-4 display text-2xl hover-lift">
              CERRAR SESIÓN
            </button>

            {/* Zona Roja */}
            <div className={`relative border-2 border-destructive bg-surface p-6 ${danger ? 'shadow-brutal-magenta' : ''}`}>
              <div className="absolute -top-3 left-4 sticker bg-destructive text-destructive-foreground border-destructive text-[10px]">RGPD · ART.17</div>
              <div className="display text-3xl text-destructive glow-primary mt-2">ZONA ROJA</div>
              <p className="text-sm text-muted-foreground mt-2">
                Eliminar tu cuenta anonimiza tus cartas (se desvinculan de tu nombre) y cierra tu acceso. <strong className="text-foreground">No es reversible.</strong>
              </p>

              {!danger ? (
                <button onClick={() => setDanger(true)} className="mt-4 border-2 border-destructive text-destructive display text-xl px-4 py-2 hover:bg-destructive hover:text-destructive-foreground transition">
                  QUIERO BORRAR MI CUENTA
                </button>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      ESCRIBE <span className="text-destructive">BORRAR</span> PARA CONFIRMAR
                    </span>
                    <input
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="BORRAR"
                      className="mt-1 w-full bg-input border-2 border-destructive focus:border-destructive outline-none px-3 py-3 display text-2xl tracking-widest"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => { setDanger(false); setConfirm(''); }} className="flex-1 border-2 border-foreground display text-lg py-2">
                      CANCELAR
                    </button>
                    <button
                      onClick={onDelete}
                      disabled={confirm !== "BORRAR" || busy}
                      className="flex-1 bg-destructive text-destructive-foreground display text-lg py-2 border-2 border-foreground disabled:opacity-30"
                    >
                      {busy ? "BORRANDO…" : "BORRAR CUENTA"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side preview */}
          <aside className="space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">PREVIEW</div>
            <div className="border-2 border-foreground bg-surface-2 p-5 shadow-brutal-primary tilt-1 scanlines">
              <div className="text-8xl text-center wiggle">{selectedAvatar?.emoji}</div>
              <div className="display text-3xl text-center mt-3 break-words text-primary glow-primary">
                @{me.data.username}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-center text-muted-foreground mt-2">
                MIEMBRO PULSE11
              </div>
              <div className="border-t-2 border-dashed border-border mt-4 pt-3 text-center">
                <span className="tape tape-accent">11 IDEAL</span>
              </div>
            </div>

            <div className="border-2 border-foreground bg-surface p-4 -tilt-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">PRIVACIDAD</div>
              <ul className="mt-2 text-sm space-y-2">
                <li>· Solo magic link, sin contraseñas</li>
                <li>· Sin DMs, sin betting</li>
                <li>· Edad mínima 14 años (LOPDGDD)</li>
                <li>· <Link to="/legal/privacidad" className="text-primary hover:underline">Política completa</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
