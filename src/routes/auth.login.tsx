import { createFileRoute, useRouter } from "@tanstack/react-router";
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
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="ticket p-8 sm:p-12 max-w-md w-full">
          <div className="tape mb-4">ACCESO</div>
          <h1 className="display text-5xl">ENTRA AL VESTUARIO</h1>
          <p className="mt-2 text-muted-foreground">Te mandamos un link mágico al email. Sin contraseñas.</p>

          {sent ? (
            <div className="mt-8 border-2 border-primary p-4">
              <div className="display text-2xl text-primary">REVISA TU EMAIL</div>
              <p className="text-sm mt-1 text-muted-foreground">Hemos enviado un link a <strong>{email}</strong>. Caduca en 1 hora.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">EMAIL</span>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="mt-1 w-full bg-input border-2 border-border focus:border-primary outline-none px-3 py-3 font-mono"
                />
              </label>
              <button disabled={loading} className="btn-hero w-full disabled:opacity-50">
                {loading ? "ENVIANDO…" : "MANDAR LINK"}
              </button>
              <p className="text-[11px] text-muted-foreground">
                Al entrar aceptas los <a href="/legal/terminos" className="underline">términos</a> y la
                <a href="/legal/privacidad" className="underline ml-1">política de privacidad</a>.
                Edad mínima: 14 años.
              </p>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
