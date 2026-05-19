import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { AVATARS } from "@/lib/catalog";
import { checkUsername, completeOnboarding, getMyProfile, listTeams } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Configura tu perfil · 11Pulse" }] }),
  component: Onboarding,
});

const CURRENT_YEAR = 2026;
const MAX_BIRTH = 2012;
const MIN_BIRTH = 1940;
const YEARS = Array.from({ length: MAX_BIRTH - MIN_BIRTH + 1 }, (_, i) => MAX_BIRTH - i);

const STEPS = [
  { n: 1, label: "NOMBRE" },
  { n: 2, label: "EDAD" },
  { n: 3, label: "EQUIPO" },
  { n: 4, label: "AVATAR" },
];

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

  const selectedAvatar = useMemo(() => AVATARS.find(a => a.id === avatarId), [avatarId]);
  const selectedTeam = useMemo(() => (teamsQ.data ?? []).find(t => t.id === teamId), [teamId, teamsQ.data]);
  const age = birthYear ? CURRENT_YEAR - birthYear : null;

  if (!authReady) return null;

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      <div className="marquee">
        <div>{Array.from({ length: 6 }).map((_, i) => (
          <span key={i}>ONBOARDING · PASO {step}/4 &nbsp; · &nbsp; {STEPS[step-1].label} &nbsp; · &nbsp; BIENVENID@ AL VESTUARIO &nbsp; · &nbsp;</span>
        ))}</div>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-10">
        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {STEPS.map(s => {
            const active = s.n === step;
            const done = s.n < step;
            return (
              <div key={s.n} className={`relative border-2 border-foreground p-3 ${active ? 'bg-primary text-primary-foreground shadow-brutal' : done ? 'bg-foreground text-background' : 'bg-surface'}`}>
                <div className="font-mono text-[9px] uppercase tracking-widest opacity-80">{s.n}/4</div>
                <div className="display text-lg sm:text-2xl leading-tight">{s.label}</div>
                {done && <span className="absolute top-1 right-2 text-xs">✓</span>}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Form card */}
          <div className="relative border-2 border-foreground bg-surface p-6 sm:p-10 shadow-brutal-primary">
            <div className="absolute -top-4 -left-2 stencil text-[10rem] leading-none opacity-15 pointer-events-none select-none">
              {step}
            </div>

            {step === 1 && (
              <div className="relative z-10">
                <div className="tape mb-3">PASO 1 / 4</div>
                <h2 className="display text-5xl sm:text-7xl text-primary glow-primary leading-[0.85]">ELIGE TU<br/>NOMBRE</h2>
                <p className="text-muted-foreground mt-3">Tu identidad pública. Solo a-z, 0-9 y guion bajo. No se puede cambiar.</p>
                <div className="mt-6">
                  <div className="flex items-center border-2 border-border focus-within:border-primary bg-input">
                    <span className="display text-3xl sm:text-4xl px-4 py-3 text-muted-foreground border-r-2 border-border">@</span>
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase())}
                      className="flex-1 bg-transparent outline-none px-3 py-4 display text-3xl sm:text-4xl"
                      placeholder="iker_07"
                      maxLength={20}
                    />
                    <span className="font-mono text-xs text-muted-foreground pr-3">{username.length}/20</span>
                  </div>
                  <div className="h-6 mt-2 text-sm font-mono">
                    {unameStatus === 'checking' && <span className="text-muted-foreground">Comprobando…</span>}
                    {unameStatus === 'ok' && <span className="text-primary">✓ Disponible · te lo quedas</span>}
                    {unameStatus === 'taken' && <span className="text-destructive">✗ Ya en uso, prueba otro</span>}
                    {unameStatus === 'invalid' && <span className="text-destructive">Solo a-z, 0-9, _ · (3-20 chars)</span>}
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button disabled={unameStatus !== 'ok'} onClick={() => setStep(2)} className="btn-hero disabled:opacity-30">
                    SIGUIENTE →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="relative z-10">
                <div className="tape mb-3">PASO 2 / 4</div>
                <h2 className="display text-5xl sm:text-7xl text-primary glow-primary leading-[0.85]">¿AÑO DE<br/>NACIMIENTO?</h2>
                <p className="text-muted-foreground mt-3">Edad mínima <strong className="text-foreground">14 años</strong> (LOPDGDD art.8). Esto no se enseña en tu perfil.</p>
                <div className="mt-6">
                  <select
                    value={birthYear ?? ''}
                    onChange={e => setBirthYear(Number(e.target.value))}
                    className="w-full bg-input border-2 border-border focus:border-primary outline-none px-4 py-4 display text-3xl"
                  >
                    <option value="">— ELIGE AÑO —</option>
                    {YEARS.map(y => <option key={y} value={y}>{y} · {CURRENT_YEAR - y} años</option>)}
                  </select>
                  {age !== null && (
                    <div className="mt-4 sticker bg-accent text-accent-foreground border-foreground inline-block">
                      TIENES {age} AÑOS
                    </div>
                  )}
                </div>
                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(1)} className="font-mono text-xs uppercase tracking-widest hover:text-primary">← ATRÁS</button>
                  <button disabled={!birthYear} onClick={() => setStep(3)} className="btn-hero disabled:opacity-30">SIGUIENTE →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="relative z-10">
                <div className="tape mb-3">PASO 3 / 4</div>
                <h2 className="display text-5xl sm:text-7xl text-primary glow-primary leading-[0.85]">EQUIPO<br/>DEL CORAZÓN</h2>
                <p className="text-muted-foreground mt-3">Opcional. Se ve en tu perfil. Lo puedes cambiar luego.</p>
                <div className="mt-6">
                  <select
                    value={teamId ?? ''}
                    onChange={e => setTeamId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-input border-2 border-border focus:border-primary outline-none px-4 py-4 display text-2xl"
                  >
                    <option value="">— NINGUNO —</option>
                    {(teamsQ.data ?? []).map(t => <option key={t.id} value={t.id}>{t.name} · {t.country}</option>)}
                  </select>
                </div>
                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(2)} className="font-mono text-xs uppercase tracking-widest hover:text-primary">← ATRÁS</button>
                  <button onClick={() => setStep(4)} className="btn-hero">SIGUIENTE →</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="relative z-10">
                <div className="tape mb-3">PASO 4 / 4</div>
                <h2 className="display text-5xl sm:text-7xl text-primary glow-primary leading-[0.85]">ELIGE<br/>AVATAR</h2>
                <p className="text-muted-foreground mt-3">Sin fotos. Solo iconos · sin caras, sin líos.</p>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mt-6">
                  {AVATARS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAvatarId(a.id)}
                      className={`aspect-square text-3xl border-2 transition ${avatarId === a.id ? 'border-primary bg-primary/15 shadow-brutal-primary scale-110' : 'border-border hover:border-foreground'}`}
                      title={a.label}
                    >{a.emoji}</button>
                  ))}
                </div>
                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(3)} className="font-mono text-xs uppercase tracking-widest hover:text-primary">← ATRÁS</button>
                  <button onClick={submit} disabled={submitting} className="btn-hero disabled:opacity-30">
                    {submitting ? "GUARDANDO…" : "FICHAR ✓"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live preview */}
          <aside className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">TU CARNET</div>
            <div className="border-2 border-foreground bg-surface-2 p-5 shadow-brutal-primary tilt-1 scanlines">
              <div className="text-8xl text-center wiggle">{selectedAvatar?.emoji}</div>
              <div className="display text-3xl text-center mt-3 text-primary glow-primary break-words">
                @{username || "tu_user"}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-center text-muted-foreground mt-2">
                {age !== null ? `${age} AÑOS` : "EDAD ·"} · 11PULSE
              </div>
              <div className="border-t-2 border-dashed border-border mt-4 pt-3 text-center">
                <span className="tape tape-accent">
                  {selectedTeam ? selectedTeam.name.toUpperCase() : "SIN EQUIPO"}
                </span>
              </div>
            </div>
            <div className="border-2 border-foreground bg-surface p-3 -tilt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              · MAGIC LINK · 14+ · RGPD ·
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
