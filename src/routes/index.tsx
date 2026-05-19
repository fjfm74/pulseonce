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

const MARQUEE_A = "MONTA TU 11 ★ PULSEA LA CARTA ★ GANA TU LIGA ★ SIN APUESTAS ★ SIN TÓXICOS ★ 14+ ★ ";
const MARQUEE_B = "EL 11 DEL CORAZÓN ✦ SORPRESA DE LA JORNADA ✦ LIGA PRIVADA ✦ CÓDIGO DE 6 LETRAS ✦ ";
const MARQUEE_C = "BETA ESPAÑA ⚡ MAGIC LINK ⚡ SIN CONTRASEÑA ⚡ MENOS DE 30 SEGUNDOS ⚡ ";

function Landing() {
  return (
    <div className="min-h-screen grain noise-grad relative overflow-hidden">
      {/* Stickers flotantes de fondo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden md:block">
        <div className="absolute top-32 left-[4%] floaty" style={{ ['--r' as never]: '-12deg' }}>
          <div className="sticker text-magenta border-magenta text-sm">★ INDIE</div>
        </div>
        <div className="absolute top-[18%] right-[6%] floaty" style={{ ['--r' as never]: '8deg', animationDelay: '1.2s' }}>
          <div className="sticker text-primary text-sm">NO ADS</div>
        </div>
        <div className="absolute top-[55%] left-[2%] floaty" style={{ ['--r' as never]: '14deg', animationDelay: '0.5s' }}>
          <div className="sticker text-accent text-sm">FANZINE</div>
        </div>
      </div>

      <Nav />

      {/* ░░░ HERO ░░░ */}
      <section className="relative z-10 border-b-2 border-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 pt-10 pb-20 sm:pt-16 sm:pb-28">
          {/* Top status bar */}
          <div className="flex items-center justify-between mb-8 font-mono text-[11px] uppercase tracking-widest">
            <div className="flex items-center gap-2"><span className="live-dot" /> JORNADA EN DIRECTO · SEMANA 23</div>
            <div className="hidden sm:flex gap-4 text-muted-foreground">
              <span>EST. 2026</span>
              <span>BCN · MAD</span>
              <span className="text-primary">v0.1</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="tape">EDICIÓN ESPAÑA</div>
                <div className="tape tape-magenta">SOLO FÚTBOL</div>
              </div>

              <h1 className="display text-[88px] sm:text-[140px] lg:text-[180px] leading-[0.82] tracking-tight">
                <span className="block">MONTA</span>
                <span className="block">
                  TU <span className="text-primary glow-primary">11</span>
                </span>
                <span className="block text-stroke">IDEAL.</span>
              </h1>

              {/* Halftone slash */}
              <div className="hidden sm:block absolute -right-6 top-24 w-40 h-40 halftone text-accent rotate-12 opacity-60" />

              <p className="mt-8 max-w-xl text-lg sm:text-xl leading-snug">
                Eliges 11 nombres. Sale una carta. Tus colegas la <span className="text-primary font-bold">pulsan</span> o
                montan su <span className="text-accent font-bold">versión</span>. Sin apuestas, sin DMs, sin mierda.
                <span className="block mt-1 text-muted-foreground">Solo fútbol.</span>
              </p>

              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <Link to="/auth/login" className="btn-hero">EMPEZAR GRATIS</Link>
                <Link to="/c/demo" className="btn-ghost-zine">Ver carta de ejemplo</Link>
                <div className="font-mono text-[11px] text-muted-foreground leading-tight ml-2">
                  MAGIC LINK<br/>SIN CONTRASEÑA<br/>&lt; 30 SEG
                </div>
              </div>
            </div>

            {/* Stack de cartas */}
            <div className="lg:col-span-5 relative h-[520px] sm:h-[560px]">
              {/* Carta 1 */}
              <div className="absolute top-0 right-4 sm:right-12 w-[260px] sm:w-[300px] ticket p-5 shadow-brutal hover-lift tilt-3 z-30">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest mb-2">
                  <span>CARTA #A7K2X9</span><span className="text-primary">● LIVE</span>
                </div>
                <div className="display text-3xl leading-none">EL 11 DEL<br/>CORAZÓN</div>
                <div className="mt-2 text-[11px] uppercase text-muted-foreground tracking-wider">por @laura_07 · semana 23</div>
                <div className="mt-4 grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                  <div className="border border-border py-2"><div className="text-lg display text-primary">1</div>POR</div>
                  <div className="border border-border py-2"><div className="text-lg display">4</div>DEF</div>
                  <div className="border border-border py-2"><div className="text-lg display">3</div>MED</div>
                  <div className="border border-border py-2"><div className="text-lg display text-accent">3</div>DEL</div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div className="display text-2xl">★ 142</div>
                  <div className="text-[10px] uppercase text-muted-foreground">PULSES</div>
                </div>
              </div>

              {/* Carta 2 atrás */}
              <div className="absolute top-[200px] right-24 sm:right-36 w-[240px] ticket p-4 shadow-brutal-magenta tilt-2 z-20 hover-lift">
                <div className="text-[10px] font-mono uppercase tracking-widest text-magenta">SORPRESA · POOL 22</div>
                <div className="display text-xl mt-1">SORPRESA DE<br/>LA JORNADA</div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {['YAM','BEL','MBA','RDR','CAS','MAR','PED','VIN'].map(n => (
                    <span key={n} className="font-mono text-[9px] border border-border px-1.5 py-0.5">{n}</span>
                  ))}
                </div>
                <div className="mt-3 flex justify-between items-baseline">
                  <div className="display text-lg">★ 89</div>
                  <div className="font-mono text-[10px] text-muted-foreground">+37 hoy</div>
                </div>
              </div>

              {/* Carta 3 — comentario */}
              <div className="absolute bottom-4 left-0 sm:left-2 w-[220px] bg-background border-2 border-foreground p-4 tilt-1 z-40 hover-lift wiggle">
                <div className="text-[10px] font-mono uppercase tracking-wider text-primary">COMENTARIO · 12:48</div>
                <div className="display text-xl mt-1 leading-tight">"SIN CASILLAS NO HAY 11."</div>
                <div className="mt-2 text-[11px] uppercase text-muted-foreground">— @jose__</div>
              </div>

              {/* Número monumental atrás */}
              <div aria-hidden className="absolute -top-6 -right-6 display text-[260px] leading-none stencil opacity-30 select-none">11</div>
            </div>
          </div>
        </div>

        {/* Triple ticker abajo del hero */}
        <div className="border-t-2 border-foreground">
          <div className="marquee"><div>{Array.from({length: 6}).map((_,i)=>(<span key={i}>{MARQUEE_A}</span>))}</div></div>
          <div className="marquee alt rev"><div>{Array.from({length: 6}).map((_,i)=>(<span key={i}>{MARQUEE_B}</span>))}</div></div>
        </div>
      </section>

      {/* ░░░ STATS BAR ░░░ */}
      <section className="relative z-10 border-b-2 border-foreground bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            ['2.4K', 'CARTAS MONTADAS'],
            ['148', 'LIGAS ACTIVAS'],
            ['18K', 'PULSES ESTA SEMANA'],
            ['0', 'ANUNCIOS · APUESTAS'],
          ].map(([n, l], i) => (
            <div key={i} className="flex items-baseline gap-3">
              <div className="display text-5xl sm:text-6xl text-primary glow-primary">{n}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground leading-tight">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ░░░ CÓMO VA ░░░ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-24">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="tape mb-4">CÓMO VA</div>
            <h2 className="display text-6xl sm:text-8xl leading-[0.85]">
              EN TRES PASOS<br/>
              <span className="text-stroke">Y SIN ROLLO.</span>
            </h2>
          </div>
          <div className="font-mono text-xs text-muted-foreground max-w-[200px] uppercase">
            // Te lo explico como si fuera un fanzine de los 90.
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { n: '01', t: 'MONTA TU 11', d: 'Eliges formación y 11 jugadores del catálogo. Solo nombres. Históricos o actuales.', c: 'primary' },
            { n: '02', t: 'SUELTA LA CARTA', d: 'Se genera tu carta visual. La compartes con un link corto. Va directa a tus DMs (los suyos, no los nuestros).', c: 'magenta' },
            { n: '03', t: 'GANA LA LIGA', d: 'Tus colegas pulsean. El más pulseado de tu liga manda esa semana. Sin trofeos de pega.', c: 'accent' },
          ].map((s, i) => (
            <div key={s.n} className="relative border-2 border-foreground p-6 bg-surface hover-lift" style={{ transform: `rotate(${i === 1 ? 1 : i === 2 ? -1 : 0}deg)` }}>
              <div className={`absolute -top-5 -left-3 display text-7xl ${s.c === 'primary' ? 'text-primary' : s.c === 'magenta' ? 'text-magenta' : 'text-accent'}`}>{s.n}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-8">PASO {s.n} DE 03</div>
              <div className="display text-4xl mt-2">{s.t}</div>
              <div className="mt-4 text-muted-foreground">{s.d}</div>
              <div className="mt-6 pt-4 border-t border-border flex justify-between font-mono text-[10px] uppercase">
                <span>OK</span>
                <span className="text-primary">SIGUIENTE →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ░░░ MARQUEE PUENTE ░░░ */}
      <div className="marquee magenta"><div>{Array.from({length: 6}).map((_,i)=>(<span key={i}>{MARQUEE_C}</span>))}</div></div>

      {/* ░░░ MODOS ░░░ */}
      <section className="relative z-10 bg-surface border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
              <div className="tape tape-accent mb-4">MODOS ACTIVOS</div>
              <h2 className="display text-6xl sm:text-7xl leading-none">
                ELIGE TU<br/>
                <span className="text-primary glow-primary">CAMPEO-<br/>NATO.</span>
              </h2>
              <p className="mt-6 text-muted-foreground max-w-sm">
                Dos modos cada semana. Lunes 00:00 abre, domingo 23:59 cierra. Una carta por modo. No hay más vidas.
              </p>
            </div>

            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              <div className="ticket p-8 shadow-brutal hover-lift">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase text-primary font-bold tracking-widest">SEMANAL · ABIERTO</div>
                  <div className="font-mono text-[10px] text-muted-foreground">#01</div>
                </div>
                <div className="display text-5xl">EL 11 DEL<br/>CORAZÓN</div>
                <p className="mt-3 text-muted-foreground">Tu once ideal de siempre. Sin restricciones. Históricos, actuales, lo que sea.</p>
                <div className="mt-6 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase">
                  <div className="border border-border p-2">SELECCIÓN: LIBRE</div>
                  <div className="border border-border p-2">1 CARTA/SEMANA</div>
                </div>
              </div>

              <div className="ticket p-8 shadow-brutal-magenta hover-lift mt-0 md:mt-12">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase text-accent font-bold tracking-widest">SEMANAL · POOL CERRADO</div>
                  <div className="font-mono text-[10px] text-muted-foreground">#02</div>
                </div>
                <div className="display text-5xl">SORPRESA<br/>DE LA<br/>JORNADA</div>
                <p className="mt-3 text-muted-foreground">22 jugadores aleatorios. Solo 11 huecos. Sé creativo o pierde la liga.</p>
                <div className="mt-6 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase">
                  <div className="border border-border p-2">POOL: 22 NOMBRES</div>
                  <div className="border border-border p-2">1 CARTA/SEMANA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ░░░ LIGAS ░░░ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="tape mb-4">LIGAS PRIVADAS</div>
            <h2 className="display text-6xl sm:text-8xl leading-[0.85]">
              TUS COLEGAS,<br/>
              <span className="text-accent glow-accent">TU PIQUE.</span>
            </h2>
            <p className="mt-6 text-muted-foreground max-w-md text-lg">
              Crea una liga con escudo, invita con un código de 6 letras. Cada semana se mide quién montó la mejor carta. Sin chats privados. Solo cartas y pulses.
            </p>
            <div className="mt-8 flex gap-3 flex-wrap">
              <Link to="/leagues/create" className="btn-hero">CREAR LIGA</Link>
              <Link to="/leagues/join" className="btn-ghost-zine">Unirme con código</Link>
            </div>
            <div className="mt-8 flex gap-2 flex-wrap font-mono text-[10px] uppercase">
              <span className="sticker text-primary text-[10px]">SIN DMs</span>
              <span className="sticker text-magenta text-[10px]">SIN BULLYING</span>
              <span className="sticker text-accent text-[10px]">SIN APUESTAS</span>
              <span className="sticker text-[10px]">REPORTAR EN 1 TAP</span>
            </div>
          </div>

          <div className="relative">
            <div className="border-2 border-foreground bg-surface p-6 shadow-brutal scanlines relative">
              <div className="flex items-center justify-between mb-1">
                <div className="display text-3xl">LIGA · LOS PRIMOS</div>
                <div className="font-mono text-[10px] text-primary">● LIVE</div>
              </div>
              <div className="text-xs uppercase text-muted-foreground tracking-wider mb-5">Código: <span className="text-foreground font-mono">A7K2X9</span> · 12 miembros · Semana 23</div>

              <div className="space-y-2 font-mono">
                {[
                  ['🦁','laura_07','142', true],
                  ['🐺','jose__','118', false],
                  ['⚡','iker.b','97', false],
                  ['🔥','sara','86', false],
                  ['🦅','dani_07','71', false],
                ].map((r, i) => (
                  <div key={i} className={`flex items-center justify-between border-2 ${r[3] ? 'border-primary bg-primary/10' : 'border-border'} px-3 py-2.5`}>
                    <div className="flex items-center gap-3">
                      <span className={`display text-3xl w-7 ${i === 0 ? 'text-primary' : i === 1 ? 'text-accent' : 'text-muted-foreground'}`}>{i+1}</span>
                      <span className="text-2xl">{r[0]}</span>
                      <span className="text-sm">{r[1]}</span>
                      {r[3] && <span className="text-[9px] uppercase tape tape-accent">LÍDER</span>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="display text-2xl text-primary">{r[2]}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">pulses</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t-2 border-dashed border-border flex justify-between items-center font-mono text-[10px] uppercase">
                <span className="text-muted-foreground">CIERRA DOM 23:59</span>
                <span className="text-primary">VER LIGA →</span>
              </div>
            </div>

            {/* Sticker código encima */}
            <div className="absolute -top-6 -left-6 sticker tape-magenta text-base px-3 py-2 tilt-3 z-10 wiggle">
              CÓDIGO: A7K2X9
            </div>
          </div>
        </div>
      </section>

      {/* ░░░ MANIFESTO ░░░ */}
      <section className="relative z-10 bg-foreground text-background border-y-2 border-foreground py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-2 hidden lg:block">
            <div className="display text-[180px] leading-none text-primary">¡</div>
          </div>
          <div className="lg:col-span-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-primary mb-3">MANIFIESTO PULSE11</div>
            <p className="display text-4xl sm:text-6xl leading-[0.95]">
              SIN <span className="bg-primary text-primary-foreground px-2">APUESTAS</span>.<br/>
              SIN <span className="bg-accent text-accent-foreground px-2">TÓXICOS</span>.<br/>
              SIN <span className="bg-magenta text-white px-2">DMs</span>.<br/>
              SOLO <span className="text-primary">FÚTBOL</span> Y TUS COLEGAS.
            </p>
          </div>
          <div className="lg:col-span-2 hidden lg:block text-right">
            <div className="display text-[180px] leading-none text-primary">!</div>
          </div>
        </div>
      </section>

      {/* ░░░ VOCES ░░░ */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="tape mb-4">VOCES DE LA GRADA</div>
          <h2 className="display text-6xl sm:text-7xl mb-12">LO QUE DICEN<br/><span className="text-stroke">LOS QUE JUEGAN.</span></h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ['"Mejor que discutir en clase."', '— iker, 16', 'primary', -2],
              ['"Mi 11 hizo más pulses que el examen de mates."', '— laura, 15', 'magenta', 1.5],
              ['"Sin DMs raros. Solo fútbol."', '— jose, 17', 'accent', -1],
            ].map(([q,a,c,r],i) => (
              <div key={i} className="relative border-2 border-foreground p-7 bg-surface hover-lift" style={{ transform: `rotate(${r}deg)` }}>
                <div className={`display text-6xl absolute -top-4 left-4 ${c === 'primary' ? 'text-primary' : c === 'magenta' ? 'text-magenta' : 'text-accent'}`}>"</div>
                <div className="display text-2xl leading-tight mt-4">{q}</div>
                <div className="mt-4 text-xs uppercase text-muted-foreground tracking-wider font-mono">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ░░░ FAQ ░░░ */}
      <section className="relative z-10 border-t-2 border-foreground bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-24 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="tape">DUDAS</div>
            <h2 className="display text-6xl mt-4 leading-none">LO QUE<br/>PREGUN-<br/>TAN.</h2>
            <p className="mt-4 text-muted-foreground text-sm">Y si no está aquí, no hace falta preguntarlo.</p>
          </div>
          <div className="lg:col-span-2 divide-y-2 divide-border border-y-2 border-border">
            {[
              ['¿Es gratis?', 'Sí. No hay anuncios, ni apuestas, ni compras dentro de la app. Nunca.'],
              ['¿Edad mínima?', '14 años. Lo verifica el sistema en el registro (LOPDGDD art.8 España).'],
              ['¿Hay chat privado?', 'No, y nunca lo habrá. Solo cartas públicas y pulses. Cero DMs.'],
              ['¿Hay fotos reales de jugadores?', 'No. Solo nombres y banderas. Sin imágenes oficiales ni escudos copyright.'],
              ['¿Cómo entro?', 'Magic link al email. Sin contraseña. En menos de 30 segundos.'],
              ['¿Puedo borrar mi cuenta?', 'En 1 tap desde ajustes. Tus cartas se anonimizan al instante.'],
            ].map(([q,a],i) => (
              <details key={i} className="py-5 group">
                <summary className="display text-3xl cursor-pointer flex justify-between items-center gap-4 list-none">
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-primary">0{i+1}</span>
                    {q}
                  </span>
                  <span className="text-primary text-4xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground pl-8">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ░░░ CTA FINAL ░░░ */}
      <section className="relative z-10 bg-primary text-primary-foreground border-y-2 border-foreground overflow-hidden">
        <div aria-hidden className="absolute inset-0 halftone text-primary-foreground opacity-15" />
        <div className="relative max-w-5xl mx-auto px-4 py-28 text-center">
          <div className="inline-block bg-background text-foreground border-2 border-foreground px-4 py-1 font-mono text-[11px] uppercase tracking-widest mb-6 -rotate-2">
            ÚLTIMA PARADA · BIENVENIDO
          </div>
          <h2 className="display text-7xl sm:text-[160px] leading-[0.82]">
            ¿LISTO<br/>O QUÉ?
          </h2>
          <p className="mt-6 text-xl font-mono uppercase tracking-wide">Monta tu primer 11 en menos que tarda en cargar TikTok.</p>
          <Link
            to="/auth/login"
            className="mt-10 inline-flex items-center gap-3 bg-background text-foreground border-2 border-foreground display text-3xl sm:text-4xl px-10 py-5 shadow-[8px_8px_0_rgba(0,0,0,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_rgba(0,0,0,0.5)] transition-all"
          >
            ENTRAR AHORA →
          </Link>
          <div className="mt-6 font-mono text-xs uppercase tracking-widest">
            magic link · sin contraseña · &lt; 30 seg
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
