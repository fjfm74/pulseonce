import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAvatar } from "@/lib/catalog";

export function Nav() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<{ username: string; avatar_id: string } | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
      router.invalidate();
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? { id: data.session.user.id } : null);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("username, avatar_id").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <header className="border-b-2 border-foreground bg-background sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="display text-3xl tracking-wider flex items-center gap-1.5 group">
          <span className="relative inline-flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0_var(--color-foreground)] -rotate-3 group-hover:rotate-0 transition-transform">
            <span className="display text-2xl leading-none">11</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-magenta border border-foreground rounded-full" />
          </span>
          <span className="display tracking-tight">PULSE</span>
          <span className="display text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm uppercase font-semibold tracking-wider">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
              <Link to="/lineups/new" className="hover:text-primary">Monta tu 11</Link>
              <Link to="/leagues" className="hover:text-primary">Ligas</Link>
              <Link to="/settings" className="hover:text-primary flex items-center gap-1">
                <span className="text-xl">{profile ? getAvatar(profile.avatar_id).emoji : '⚽'}</span>
                <span className="hidden sm:inline">{profile?.username ?? '...'}</span>
              </Link>
              <button onClick={signOut} className="text-muted-foreground hover:text-accent text-xs">Salir</button>
            </>
          ) : (
            <Link to="/auth/login" className="btn-ghost-zine !py-1 !px-3 !text-sm">Entrar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-foreground bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-wrap gap-6 items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <div className="display text-2xl text-foreground">11PULSE</div>
        <div className="flex gap-4">
          <Link to="/legal/privacidad" className="hover:text-primary">Privacidad</Link>
          <Link to="/legal/terminos" className="hover:text-primary">Términos</Link>
          <Link to="/legal/cookies" className="hover:text-primary">Cookies</Link>
        </div>
        <div>Hecho en España · Sin apuestas · 14+</div>
      </div>
    </footer>
  );
}
