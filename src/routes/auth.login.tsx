import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Entrar · Pulse11" }] }),
  component: Login,
});

function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Try sign-in first; if user doesn't exist, sign up (auto-confirm is on)
    let { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error && /invalid login credentials/i.test(error.message)) {
      const up = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/onboarding" },
      });
      if (up.error) { setLoading(false); toast.error(up.error.message); return; }
      // If session was created (auto-confirm), redirect; else inform
      if (up.data.session) {
        toast.success("¡Cuenta creada!");
        router.navigate({ to: "/onboarding" });
        return;
      }
      toast.success("Cuenta creada, ya puedes entrar");
      error = null;
    }
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    router.navigate({ to: "/dashboard" });
  };

  const submitMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/onboarding" },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />

      <div className="marquee">
        <div>{Array.from({ length: 6 }).map((_, i) => (
          <span key={i}>ACCESO · EMAIL + CONTRASEÑA &nbsp; · &nbsp; SIN BETTING &nbsp; · &nbsp; +14 AÑOS &nbsp; · &nbsp;</span>
        ))}</div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 items-stretch">
        <aside className="relative hidden lg:flex flex-col justify-between p-12 border-r-2 border-foreground bg-surface scanlines overflow-hidden">
          <div className="absolute -top-10 -left-6 stencil text-[18rem] leading-none opacity-15 pointer-events-none select-none">11</div>
          <div className="relative z-10">
            <Link to="/" className="font-mono text-xs uppercase tracking-widest hover:text-primary">← VOLVER</Link>
          </div>
          <div className="relative z-10">
            <div className="tape mb-3">PULSE11</div>
            <h2 className="display text-7xl leading-[0.85] text-primary glow-primary">
              FICHA POR<br/>
              <span className="text-stroke text-transparent">EL VESTUARIO</span>
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground text-lg">
              Crea tu 11 ideal, compártelo como carta y compite en ligas privadas con tus colegas.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="sticker bg-primary text-primary-foreground border-foreground text-xs">11 IDEAL</span>
              <span className="sticker bg-accent text-accent-foreground border-foreground text-xs">LIGAS PRIVADAS</span>
              <span className="sticker bg-magenta text-white border-foreground text-xs">SIN TOXICIDAD</span>
            </div>
          </div>
          <div className="relative z-10 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            · ACCESO RÁPIDO · ACCESO RÁPIDO ·
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 sm:px-8 py-16 relative">
          <div className="absolute top-6 left-6 lg:hidden">
            <Link to="/" className="font-mono text-xs uppercase tracking-widest hover:text-primary">← VOLVER</Link>
          </div>

          <div className="relative w-full max-w-md">
            <div className="absolute -top-6 -left-2 stencil text-[8rem] leading-none opacity-15 pointer-events-none select-none">IN</div>

            <div className="relative border-2 border-foreground bg-surface p-8 sm:p-10 shadow-brutal-primary">
              <div className="tape mb-3">ACCESO</div>
              <h1 className="display text-5xl sm:text-6xl text-primary glow-primary leading-[0.9]">
                ENTRA AL<br/>VESTUARIO
              </h1>

              {/* Mode toggle */}
              <div className="mt-6 grid grid-cols-2 border-2 border-foreground">
                <button
                  type="button"
                  onClick={() => { setMode("password"); setSent(false); }}
                  className={`py-2 font-mono text-[11px] uppercase tracking-widest ${mode === 'password' ? 'bg-primary text-primary-foreground' : 'hover:bg-surface-2'}`}
                >CONTRASEÑA</button>
                <button
                  type="button"
                  onClick={() => { setMode("magic"); setSent(false); }}
                  className={`py-2 font-mono text-[11px] uppercase tracking-widest border-l-2 border-foreground ${mode === 'magic' ? 'bg-primary text-primary-foreground' : 'hover:bg-surface-2'}`}
                >MAGIC LINK</button>
              </div>

              {mode === "password" ? (
                <form onSubmit={submitPassword} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">EMAIL</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="mt-1 w-full bg-input border-2 border-border focus:border-primary outline-none px-4 py-3 display text-xl"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">CONTRASEÑA · MIN 6</span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 w-full bg-input border-2 border-border focus:border-primary outline-none px-4 py-3 display text-xl tracking-widest"
                    />
                  </label>
                  <button disabled={loading || !email || password.length < 6} className="btn-hero w-full disabled:opacity-30">
                    {loading ? "ENTRANDO…" : "ENTRAR / CREAR CUENTA →"}
                  </button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Si el email no existe, te creamos cuenta al momento. Edad mínima <strong className="text-foreground">14 años</strong>.
                  </p>
                </form>
              ) : sent ? (
                <div className="mt-6 border-2 border-foreground bg-background p-5 shadow-brutal wiggle">
                  <div className="sticker bg-primary text-primary-foreground border-foreground text-[10px] inline-block">EMAIL ENVIADO</div>
                  <div className="display text-3xl text-primary glow-primary mt-3">REVISA TU BUZÓN</div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Link mandado a <strong className="text-foreground">{email}</strong>. Si no llega en 2 min mira en spam o usa contraseña.
                  </p>
                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
                  >
                    ← USAR OTRO EMAIL
                  </button>
                </div>
              ) : (
                <form onSubmit={submitMagic} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">EMAIL</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="mt-1 w-full bg-input border-2 border-border focus:border-primary outline-none px-4 py-3 display text-xl"
                    />
                  </label>
                  <button disabled={loading || !email} className="btn-hero w-full disabled:opacity-30">
                    {loading ? "ENVIANDO…" : "MANDAR MAGIC LINK →"}
                  </button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Aviso: el email gratis de Supabase puede tardar / caer en spam. Si urge, usa contraseña.
                  </p>
                </form>
              )}

              <p className="mt-5 text-[11px] text-muted-foreground leading-relaxed">
                Al entrar aceptas los <Link to="/legal/terminos" className="underline hover:text-primary">términos</Link> y la
                <Link to="/legal/privacidad" className="underline hover:text-primary ml-1">política de privacidad</Link>.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="live-dot" /> SIN BETTING · SIN DMS · SIN PUBLI
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
