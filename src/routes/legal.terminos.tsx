import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/nav";

export const Route = createFileRoute("/legal/terminos")({
  head: () => ({ meta: [{ title: "Términos · Pulse11" }] }),
  component: () => (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <article className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <div className="tape mb-2">LEGAL</div>
        <h1 className="display text-5xl">TÉRMINOS</h1>
        <p className="text-muted-foreground mt-4">Al usar Pulse11 aceptas estas reglas básicas.</p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>Edad mínima 14 años.</li>
          <li>Sin apuestas, sin contenido tóxico, sin acoso.</li>
          <li>Sin chats privados. Comunicación pública vía cartas y comentarios.</li>
          <li>Pulse11 puede eliminar cartas o cuentas que incumplan estas reglas.</li>
          <li>El servicio se ofrece "tal cual", sin garantías de disponibilidad continua.</li>
        </ul>
      </article>
      <Footer />
    </div>
  ),
});
