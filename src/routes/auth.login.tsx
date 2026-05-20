import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { sendMagicLink } from "@/lib/email.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Entrar · 11Pulse" }] }),
  component: Login,
});

function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<"idle" | "login" | "signup" | "magic" | "reset">("idle");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("login");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading("idle");
    if (error) {
      toast.error("Email o contraseña incorrectos. Si esa cuenta entró antes con magic link, usa ‘Fijar / recuperar contraseña’.");
      return;
    }
    router.navigate({ to: "/dashboard" });
  };

  const createAccount = async () => {
    setLoading("signup");
    const up = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/onboarding" },
    });

    if (up.error) {
      setLoading("idle");
      if (/already registered/i.test(up.error.message)) {
        toast.error("Ese email ya existe. Entra con tu contraseña o usa ‘Fijar / recuperar contraseña’.");
        return;
      }
      toast.error(up.error.message);
      return;
    }

    if (up.data.session) {
      setLoading("idle");
      toast.success("¡Cuenta creada!");
      router.navigate({ to: "/onboarding" });
      return;
    }

    const login = await supabase.auth.signInWithPassword({ email, password });
    setLoading("idle");
    if (login.error) {
      toast.success("Cuenta creada. Ahora fija tu contraseña desde el email de recuperación si no te deja entrar.");
      return;
    }

    toast.success("¡Cuenta creada!");
    router.navigate({ to: "/onboarding" });
  };

  const sendReset = async () => {
    if (!email) {
      toast.error("Escribe tu email primero");
      return;
    }

    setLoading("reset");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading("idle");
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Te he enviado un email para fijar o recuperar tu contraseña");
  };

  const sendMagicFn = useServerFn(sendMagicLink);
  const submitMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("magic");
    try {
      await sendMagicFn({ data: { email } });
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading("idle");
    }
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
            <div className="tape mb-3">11PULSE</div>
            <h2 className="display text-7xl leading-[0.85] text-primary glow-primary">
              FICHA POR<br/>
              <span className="text-stroke text-transparent">EL VESTUARIO</span>
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground text-lg">
              Crea tu 11 ideal, compártelo como carta y compite en ligas privadas con tus colegas.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="sticker !bg-primary text-primary-foreground border-foreground text-xs">11 IDEAL</span>
              <span className="sticker !bg-accent text-accent-foreground border-foreground text-xs">LIGAS PRIVADAS</span>
              <span className="sticker !bg-magenta text-white border-foreground text-xs">SIN TOXICIDAD</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button disabled={loading !== "idle" || !email || password.length < 6} className="btn-hero w-full disabled:opacity-30">
                      {loading === "login" ? "ENTRANDO…" : "ENTRAR →"}
                    </button>
                    <button
                      type="button"
                      onClick={createAccount}
                      disabled={loading !== "idle" || !email || password.length < 6}
                      className="btn-ghost-zine w-full disabled:opacity-30"
                    >
                      {loading === "signup" ? "CREANDO…" : "CREAR CUENTA"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={sendReset}
                    disabled={loading !== "idle" || !email}
                    className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary disabled:opacity-30"
                  >
                    {loading === "reset" ? "ENVIANDO…" : "Fijar / recuperar contraseña"}
                  </button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Si ya entraste alguna vez por magic link, primero fija una contraseña con el enlace de recuperación. Edad mínima <strong className="text-foreground">14 años</strong>.
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
                  <button disabled={loading !== "idle" || !email} className="btn-hero w-full disabled:opacity-30">
                    {loading === "magic" ? "ENVIANDO…" : "MANDAR MAGIC LINK →"}
                  </button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Te mandamos un enlace de un solo uso desde <strong className="text-foreground">hola@11pulse.com</strong>. Caduca en 1 hora.
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
