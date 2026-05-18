import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { AVATARS } from "@/lib/catalog";
import { checkUsername, completeOnboarding, getMyProfile, listTeams } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Configura tu perfil · Pulse11" }] }),
  component: Onboarding,
});

const CURRENT_YEAR = 2026;
const MAX_BIRTH = 2012; // 14 años
const MIN_BIRTH = 1940;
const YEARS = Array.from({ length: MAX_BIRTH - MIN_BIRTH + 1 }, (_, i) => MAX_BIRTH - i);

function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [authReady, setAuthReady] = useState(false);
  const [username, setUsername] = useState("");
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [avatarId, setAvatarId] = useState("av-01");
  const [unameStatus, setUnameStatus] = useState<'idle'|'checking'|'ok'|'taken'|'invalid'>('idle');
  const [submitting, setSubmitting] = useState(false);

  const checkFn = useServerFn(checkUsername);
  const saveFn = useServerFn(completeOnboarding);
  const teamsFn = useServerFn(listTeams);
  const meFn = useServerFn(getMyProfile);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.navigate({ to: "/auth/login" }); return; }
      setAuthReady(true);
    });
  }, [router]);

  const meQ = useQuery({ queryKey: ['me'], queryFn: meFn, enabled: authReady });
  useEffect(() => {
    if (meQ.data?.username && meQ.data.status === 'active') {
      router.navigate({ to: "/dashboard" });
    }
  }, [meQ.data, router]);

  const teamsQ = useQuery({ queryKey: ['teams'], queryFn: teamsFn, enabled: authReady });

  // Live username check
  useEffect(() => {
    const u = username.toLowerCase().trim();
    if (!u) { setUnameStatus('idle'); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(u)) { setUnameStatus('invalid'); return; }
    setUnameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const res = await checkFn({ data: { username: u } });
        setUnameStatus(res.available ? 'ok' : 'taken');
      } catch { setUnameStatus('invalid'); }
    }, 350);
    return () => clearTimeout(t);
  }, [username, checkFn]);

  const submit = async () => {
    if (!birthYear || !username) return;
    setSubmitting(true);
    try {
      await saveFn({ data: {
        username: username.toLowerCase().trim(),
        birth_year: birthYear,
        favorite_team_id: teamId,
        avatar_id: avatarId,
      }});
      toast.success("¡Perfil listo!");
      router.navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSubmitting(false); }
  };

  if (!authReady) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6 font-mono text-xs">
          {[1,2,3,4].map(n => (
            <div key={n} className={`h-2 flex-1 ${n <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
        <div className="ticket p-8">
          {step === 1 && (
            <>
              <div className="tape mb-3">PASO 1 / 4</div>
              <h2 className="display text-4xl">ELIGE TU NOMBRE</h2>
              <p className="text-muted-foreground text-sm mt-1">Será tu identidad pública. Solo a-z, 0-9 y _</p>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                className="mt-4 w-full bg-input border-2 border-border focus:border-primary outline-none px-3 py-3 font-mono text-lg"
                placeholder="iker_07"
                maxLength={20}
              />
              <div className="h-5 mt-1 text-xs font-mono">
                {unameStatus === 'checking' && <span className="text-muted-foreground">Comprobando…</span>}
                {unameStatus === 'ok' && <span className="text-primary">✓ Disponible</span>}
                {unameStatus === 'taken' && <span className="text-destructive">✗ Ya en uso</span>}
                {unameStatus === 'invalid' && <span className="text-destructive">Solo a-z, 0-9, _ (3–20)</span>}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  disabled={unameStatus !== 'ok'}
                  onClick={() => setStep(2)}
                  className="btn-hero disabled:opacity-30"
                >SIGUIENTE</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="tape mb-3">PASO 2 / 4</div>
              <h2 className="display text-4xl">¿AÑO DE NACIMIENTO?</h2>
              <p className="text-muted-foreground text-sm mt-1">Edad mínima 14 años. (LOPDGDD)</p>
              <select
                value={birthYear ?? ''}
                onChange={e => setBirthYear(Number(e.target.value))}
                className="mt-4 w-full bg-input border-2 border-border focus:border-primary outline-none px-3 py-3 font-mono text-lg"
              >
                <option value="">— elige año —</option>
                {YEARS.map(y => <option key={y} value={y}>{y} ({CURRENT_YEAR - y} años)</option>)}
              </select>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(1)} className="btn-ghost-zine">Atrás</button>
                <button disabled={!birthYear} onClick={() => setStep(3)} className="btn-hero disabled:opacity-30">SIGUIENTE</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="tape mb-3">PASO 3 / 4</div>
              <h2 className="display text-4xl">EQUIPO DEL CORAZÓN</h2>
              <p className="text-muted-foreground text-sm mt-1">Opcional. Lo puedes cambiar luego.</p>
              <select
                value={teamId ?? ''}
                onChange={e => setTeamId(e.target.value ? Number(e.target.value) : null)}
                className="mt-4 w-full bg-input border-2 border-border focus:border-primary outline-none px-3 py-3 font-mono"
              >
                <option value="">— ninguno —</option>
                {(teamsQ.data ?? []).map(t => <option key={t.id} value={t.id}>{t.name} · {t.country}</option>)}
              </select>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(2)} className="btn-ghost-zine">Atrás</button>
                <button onClick={() => setStep(4)} className="btn-hero">SIGUIENTE</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="tape mb-3">PASO 4 / 4</div>
              <h2 className="display text-4xl">ELIGE AVATAR</h2>
              <p className="text-muted-foreground text-sm mt-1">Sin fotos. Solo iconos.</p>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mt-4">
                {AVATARS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAvatarId(a.id)}
                    className={`aspect-square text-3xl flex items-center justify-center border-2 ${avatarId === a.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                    title={a.label}
                  >{a.emoji}</button>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(3)} className="btn-ghost-zine">Atrás</button>
                <button onClick={submit} disabled={submitting} className="btn-hero disabled:opacity-30">
                  {submitting ? "GUARDANDO…" : "TERMINAR"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
