import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/nav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse11 — Monta tu 11 ideal" },
      { name: "description", content: "Arma tu 11 del corazón, compártelo como carta y compite con tus amigos en ligas privadas. Sin apuestas, sin tóxicos. 14+." },
    ],
  }),
  component: Landing,
});

const MARQUEE = "MONTA TU 11 · PULSEA LA CARTA · GANA TU LIGA · SIN APUESTAS · SIN TÓXICOS · 14+ · ";

function Landing() {
  return (
    <div className="min-h-screen grain">
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden border-b-2 border-foreground">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="tape mb-6">EDICIÓN BETA · ESPAÑA</div>
            <h1 className="display text-[72px] sm:text-[110px] leading-[0.85] tracking-tight">
              MONTA<br/>
              <span className="text-primary">TU&nbsp;11</span><br/>
              IDEAL.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Eliges 11 nombres. Sale una carta. Tus colegas la pulsan o montan su versión.
              Sin apuestas, sin DMs, sin mierda. Solo fútbol.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth/login" className="btn-hero">EMPEZAR GRATIS</Link>
              <Link to="/c/demo" className="btn-ghost-zine">Ver carta de ejemplo</Link>
            </div>
            <div className="mt-6 font-mono text-xs text-muted-foreground">
              · MAGIC LINK · SIN CONTRASEÑA · &lt; 30 SEG
            </div>
          </div>

          <div className="relative">
            <div className="ticket p-6 rotate-[-2deg]">
              <div className="display text-3xl">EL 11 DEL CORAZÓN</div>
              <div className="text-xs uppercase text-muted-foreground tracking-wider">Modo activo · Esta semana</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                <div className="border border-border py-2"><div className="text-2xl display">●</div>POR</div>
                <div className="border border-border py-2"><div className="text-2xl display">●●●●</div>DEF</div>
                <div className="border border-border py-2"><div className="text-2xl display">●●●</div>MED</div>
                <div className="col-span-3 border border-border py-2"><div className="text-2xl display">●●●</div>DELANTERA</div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">FORMACIÓN 4-3-3</div>
            </div>
            <div className="ticket p-4 rotate-[3deg] mt-[-30px] ml-12 max-w-[260px]">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">PULSEADA · +37</div>
              <div className="display text-xl">SORPRESA DE LA JORNADA</div>
              <div className="mt-1 text-xs">Lista cerrada · 22 jugadores</div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee"><div>{Array.from({length: 6}).map((_,i)=>(<span key={i}>{MARQUEE}</span>))}</div></div>

      {/* CÓMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="tape mb-4">CÓMO VA</div>
        <h2 className="display text-5xl sm:text-7xl">EN TRES PASOS<br/>Y SIN ROLLO.</h2>
        <div className="grid sm:grid-cols-3 gap-6 mt-10">
          {[
            { n: '01', t: 'MONTA TU 11', d: 'Eliges formación y 11 jugadores del catálogo. Solo nombres.' },
            { n: '02', t: 'SUELTA LA CARTA', d: 'Se genera tu carta visual. La compartes con un link corto.' },
            { n: '03', t: 'GANA LA LIGA', d: 'Tus colegas pulsean. El más pulseado de tu liga manda esa semana.' },
          ].map(s => (
            <div key={s.n} className="border-2 border-foreground p-6 bg-surface">
              <div className="font-mono text-sm text-primary">PASO {s.n}</div>
              <div className="display text-3xl mt-2">{s.t}</div>
              <div className="mt-3 text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MODOS */}
      <section className="bg-surface border-y-2 border-foreground">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="tape mb-4">MODOS ACTIVOS</div>
          <h2 className="display text-5xl">ELIGE TU CAMPEONATO.</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            <div className="ticket p-8">
              <div className="text-xs uppercase text-primary font-bold">SEMANAL · ABIERTO</div>
              <div className="display text-4xl mt-2">EL 11 DEL CORAZÓN</div>
              <p className="mt-2 text-muted-foreground">Tu once ideal de siempre. Sin restricciones. Históricos, actuales, lo que sea.</p>
              <div className="mt-4 font-mono text-xs">SELECCIÓN: LIBRE · 1 CARTA/SEMANA</div>
            </div>
            <div className="ticket p-8">
              <div className="text-xs uppercase text-accent font-bold">SEMANAL · POOL CERRADO</div>
              <div className="display text-4xl mt-2">SORPRESA DE LA JORNADA</div>
              <p className="mt-2 text-muted-foreground">22 jugadores aleatorios. Solo 11 huecos. Sé creativo o pierde la liga.</p>
              <div className="mt-4 font-mono text-xs">SELECCIÓN: 22 NOMBRES · 1 CARTA/SEMANA</div>
            </div>
          </div>
        </div>
      </section>

      {/* LIGAS */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="tape mb-4">LIGAS PRIVADAS</div>
            <h2 className="display text-5xl">TUS COLEGAS,<br/>TU PIQUE.</h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Crea una liga con escudo, invita con un código de 6 letras. Cada semana se mide quién montó la mejor carta.
              Sin chats privados. Solo cartas y pulses.
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/leagues/create" className="btn-hero">CREAR LIGA</Link>
              <Link to="/leagues/join" className="btn-ghost-zine">Unirme con código</Link>
            </div>
          </div>
          <div className="border-2 border-foreground bg-surface p-6">
            <div className="display text-3xl">LIGA DEMO · LOS PRIMOS</div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider">Código: A7K2X9</div>
            <div className="mt-6 space-y-2 font-mono">
              {[['🦁','laura_07','142 pulses'],['🐺','jose__','118'],['⚡','iker.b','97'],['🔥','sara','86']].map((r,i) => (
                <div key={i} className="flex items-center justify-between border-b border-border py-2">
                  <div className="flex items-center gap-3">
                    <span className="display text-2xl w-6 text-accent">{i+1}</span>
                    <span className="text-2xl">{r[0]}</span>
                    <span>{r[1]}</span>
                  </div>
                  <span className="text-primary">{r[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VOCES */}
      <section className="bg-surface border-y-2 border-foreground py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="tape mb-4">VOCES DE LA GRADA</div>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              ['"Mejor que discutir en clase."', '— iker, 16'],
              ['"Mi 11 del corazón hizo más pulses que el examen de mates."', '— laura, 15'],
              ['"Sin DMs raros. Solo fútbol."', '— jose, 17'],
            ].map(([q,a],i) => (
              <div key={i} className="border-2 border-foreground p-6 -rotate-1 bg-background">
                <div className="display text-2xl leading-tight">{q}</div>
                <div className="mt-3 text-xs uppercase text-muted-foreground tracking-wider">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <div className="tape mb-4">DUDAS</div>
        <h2 className="display text-5xl">LO QUE PREGUNTAN.</h2>
        <div className="mt-8 divide-y divide-border">
          {[
            ['¿Es gratis?', 'Sí. No hay anuncios, ni apuestas, ni compras.'],
            ['¿Edad mínima?', '14 años. Lo verifica el sistema en el registro.'],
            ['¿Hay chat privado?', 'No, y nunca lo habrá. Solo cartas públicas y pulses.'],
            ['¿Hay fotos reales de jugadores?', 'No. Solo nombres y banderas. Sin imágenes oficiales.'],
            ['¿Cómo entro?', 'Magic link al email. Sin contraseña.'],
          ].map(([q,a],i) => (
            <details key={i} className="py-4 group">
              <summary className="display text-2xl cursor-pointer flex justify-between items-center">
                {q} <span className="text-primary group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-2 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-primary text-primary-foreground border-y-2 border-foreground">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="display text-6xl sm:text-8xl">¿LISTO O QUÉ?</h2>
          <p className="mt-4 text-lg">Monta tu primer 11 en menos que tarda en cargar TikTok.</p>
          <Link to="/auth/login" className="mt-8 inline-block bg-background text-foreground border-2 border-foreground display text-2xl px-8 py-4 shadow-[6px_6px_0_rgba(0,0,0,0.4)] hover:translate-y-[-2px] transition-transform">
            ENTRAR AHORA
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
