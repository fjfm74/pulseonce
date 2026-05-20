import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUnsubscribeStatus, unsubscribeWithToken } from "@/lib/email.functions";
import { z } from "zod";

export const Route = createFileRoute("/email/unsubscribe")({
  head: () => ({ meta: [{ title: "Darse de baja · 11Pulse" }] }),
  validateSearch: (s) => z.object({ u: z.string().uuid().optional(), t: z.string().optional() }).parse(s),
  component: Unsub,
});

function Unsub() {
  const { u, t } = Route.useSearch();
  const statusFn = useServerFn(getUnsubscribeStatus);
  const unsubFn = useServerFn(unsubscribeWithToken);
  const [state, setState] = useState<"loading" | "ready" | "done" | "already" | "invalid" | "error">("loading");
  const [username, setUsername] = useState<string | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!u || !t) { setState("invalid"); return; }
    statusFn({ data: { userId: u, token: t } })
      .then((r) => {
        if (!r.valid) { setState("invalid"); return; }
        setUsername(r.username ?? null);
        setState(r.enabled ? "ready" : "already");
      })
      .catch(() => setState("invalid"));
  }, [u, t, statusFn]);

  const confirm = async () => {
    if (!u || !t) return;
    try { await unsubFn({ data: { userId: u, token: t } }); setState("done"); }
    catch (e) { setErr((e as Error).message); setState("error"); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-16 bg-background">
      <div className="border-2 border-foreground bg-surface p-8 shadow-brutal-primary max-w-md w-full">
        <div className="tape mb-3">EMAILS · 11PULSE</div>
        {state === "loading" && <div className="display text-3xl wiggle">CARGANDO…</div>}
        {state === "invalid" && (
          <>
            <h1 className="display text-4xl text-destructive">ENLACE INVÁLIDO</h1>
            <p className="text-sm text-muted-foreground mt-3">Este enlace no es válido o caducó. Puedes gestionar tus emails desde tus ajustes.</p>
          </>
        )}
        {state === "already" && (
          <>
            <h1 className="display text-4xl text-primary glow-primary">YA ESTÁS FUERA</h1>
            <p className="text-sm text-muted-foreground mt-3">@{username} no recibe emails de notificación. Solo te llegarán los críticos (acceso, recuperación).</p>
          </>
        )}
        {state === "ready" && (
          <>
            <h1 className="display text-4xl text-primary glow-primary">DARSE DE BAJA</h1>
            <p className="text-sm text-muted-foreground mt-3">@{username}, dejarás de recibir avisos de pulses, forks y bienvenida. Los emails de acceso seguirán llegando.</p>
            <button onClick={confirm} className="btn-hero w-full mt-5">CONFIRMAR BAJA</button>
          </>
        )}
        {state === "done" && (
          <>
            <h1 className="display text-4xl text-primary glow-primary">HECHO ✓</h1>
            <p className="text-sm text-muted-foreground mt-3">Listo. Puedes reactivar los emails cuando quieras desde /settings.</p>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="display text-4xl text-destructive">UPS</h1>
            <p className="text-sm text-muted-foreground mt-3">{err}</p>
          </>
        )}
      </div>
    </div>
  );
}
