import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/nav";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Fijar contraseña · Pulse11" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasRecoveryToken = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash;
    return hash.includes("type=recovery") || hash.includes("access_token=");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session || hasRecoveryToken) setReady(true);
    });
  }, [hasRecoveryToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Contraseña guardada. Ya puedes entrar.");
    router.navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex flex-col noise-grad">
      <Nav />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md border-2 border-foreground bg-surface p-8 sm:p-10 shadow-brutal-primary">
          <div className="tape mb-3">ACCESO</div>
          <h1 className="display text-5xl sm:text-6xl text-primary glow-primary leading-[0.9]">
            FIJA TU
            <br />
            CONTRASEÑA
          </h1>

          {!ready ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Este enlace no está activo. Vuelve a <Link to="/auth/login" className="underline hover:text-primary">entrar</Link> y pulsa en
                <span className="text-foreground"> “Fijar / recuperar contraseña”</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">NUEVA CONTRASEÑA</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full bg-input border-2 border-border focus:border-primary outline-none px-4 py-3 display text-xl tracking-widest"
                />
              </label>

              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">REPETIR CONTRASEÑA</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full bg-input border-2 border-border focus:border-primary outline-none px-4 py-3 display text-xl tracking-widest"
                />
              </label>

              <button disabled={loading || password.length < 6 || confirmPassword.length < 6} className="btn-hero w-full disabled:opacity-30">
                {loading ? "GUARDANDO…" : "GUARDAR CONTRASEÑA →"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}