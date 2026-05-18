import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/nav";

export const Route = createFileRoute("/legal/privacidad")({
  head: () => ({ meta: [{ title: "Privacidad · Pulse11" }] }),
  component: () => (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <article className="flex-1 max-w-2xl mx-auto px-4 py-12 prose prose-invert">
        <div className="tape mb-2">LEGAL</div>
        <h1 className="display text-5xl">PRIVACIDAD</h1>
        <p className="text-muted-foreground mt-4">Última actualización: 2026.</p>
        <h2 className="display text-2xl mt-6">Quiénes somos</h2>
        <p>Pulse11 es una red social de cartas de 11 ideales para fans del fútbol mayores de 14 años (LOPDGDD art. 8).</p>
        <h2 className="display text-2xl mt-6">Qué datos recogemos</h2>
        <ul className="list-disc pl-6">
          <li>Email (para magic link).</li>
          <li>Username, año de nacimiento, equipo y avatar (configurados por ti).</li>
          <li>Cartas, pulses y comentarios que publicas.</li>
        </ul>
        <h2 className="display text-2xl mt-6">Tus derechos</h2>
        <p>Puedes acceder, rectificar y borrar tus datos desde Ajustes. La eliminación anonimiza tus cartas.</p>
        <h2 className="display text-2xl mt-6">Contacto</h2>
        <p>hola@pulse11.app</p>
      </article>
      <Footer />
    </div>
  ),
});
