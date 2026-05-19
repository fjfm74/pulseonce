import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/nav";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({ meta: [{ title: "Cookies · 11Pulse" }] }),
  component: () => (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <article className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <div className="tape mb-2">LEGAL</div>
        <h1 className="display text-5xl">COOKIES</h1>
        <p className="text-muted-foreground mt-4">Por defecto rechazamos todas las cookies salvo las técnicas necesarias.</p>
        <h2 className="display text-2xl mt-6">Técnicas (siempre activas)</h2>
        <ul className="list-disc pl-6">
          <li>Sesión de autenticación (magic link).</li>
          <li>Preferencias de UI esenciales.</li>
        </ul>
        <h2 className="display text-2xl mt-6">Analítica</h2>
        <p>No usamos cookies de analítica de terceros.</p>
        <h2 className="display text-2xl mt-6">Publicidad</h2>
        <p>No mostramos anuncios.</p>
      </article>
      <Footer />
    </div>
  ),
});
