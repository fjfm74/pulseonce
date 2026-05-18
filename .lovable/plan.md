# Pulse11 — Plan de construcción

App social de 11 ideales para fans españoles 14-18. Stack: TanStack Start (template Lovable) + Tailwind + shadcn + Lovable Cloud (Supabase).

> Nota técnica: el template Lovable actual usa **TanStack Start**, no Vite+React Router. La arquitectura, rutas (`src/routes/*.tsx`) y server functions seguirán esa convención. Funcionalmente idéntico a lo que pediste.

## Fase 0 — Infra
- Activar Lovable Cloud (Supabase + Auth + Storage).
- Configurar magic link como único método de auth.
- Design system fanzine: tokens en `src/styles.css` (verde #00B850, naranja #FF5A1F, fondo #0B0F0C, superficie #131815), fuentes Bebas Neue / Archivo Narrow / JetBrains Mono vía Google Fonts.
- Componentes base: TicketCard (bordes perforados), MarqueeStrip, TapeDivider, FlipTile, grain overlay, mini-card de jugador.

## Fase 1 — Schema + seed (migration)
Tablas con RLS habilitada: `profiles`, `teams`, `players`, `modes`, `lineups`, `pulses`, `leagues`, `league_members`, `comments`, `blocks`, `reports`.

Constraints clave:
- `profiles.birth_year` CHECK ≤ 2012 (≥14 años en 2026).
- `lineups`: UNIQUE `(author_id, mode_id, date_trunc('week', created_at AT TIME ZONE 'UTC')::date)`.
- `pulses` PK `(lineup_id, user_id)` + trigger `user_id != lineups.author_id`.
- Función `SECURITY DEFINER` `is_league_member(league_id, user_id)` para evitar recursión RLS.
- Bloqueo simétrico: vistas/políticas filtran por `blocks` en ambas direcciones.

Seed:
- 30 equipos (LaLiga + Europa + selecciones, solo nombres).
- 50 jugadores demo (históricos + actuales, solo nombre + posición + país + año).
- 2 modos: `corazon` (open) y `sorpresa` (pool 22 jugadores).
- Catálogos: 24 avatares (slugs), 12 escudos (slugs), 4 formaciones.

## Fase 2 — Auth + Onboarding + Perfil
- `/auth/login` — magic link form (rechazo si `birth_year > 2012`).
- `/onboarding` — wizard 4 pasos: username único, año nacimiento, equipo favorito, avatar (grid 24).
- `/settings` — cambiar avatar/equipo, borrar cuenta (server fn que anonimiza lineups: `author_id → null`, `username → 'usuario-eliminado-xxxx'`).

## Fase 3 — Editor + Carta pública
- `/lineups/new` y `/lineups/[id]/edit`: selector de formación (4 opciones), pitch SVG con slots, click para asignar jugador desde catálogo filtrable por posición (respeta `selection_mode` del modo: `open` o `pool`), validación 11/11 antes de guardar, genera código base62 de 7 chars.
- `/c/[code]`: vista pública con pitch + mini-cartas verticales (banda posición coloreada, APELLIDO en Bebas, bandera+dorsal abajo, ★ legends ≥65, ⚡ jóvenes ≤22), botones Pulse / Hacer mi versión / Compartir, lista de jugadores.

## Fase 4 — Dashboard + Feed
- `/dashboard`: KPIs (mis 11s, pulses recibidos, ligas), tickets de modos activos, feed de cartas de amigos/ligas, mis ligas.
- Empty states con copy exacto del brief.

## Fase 5 — Ligas
- `/leagues`, `/leagues/create` (nombre + selector de escudo), `/leagues/join` (código 6 chars), `/leagues/[code]` (header + KPIs + ranking de miembros por pulses + cartas de la semana).
- `/u/[username]` perfil público con stats + grid de cartas.
- `/modes/[slug]` ranking de 11s en ese modo.

## Fase 6 — Acciones sociales
- Pulse (toggle), Fork ("Hacer mi versión" → precarga editor con `forked_from`), Comentarios básicos, Report, Block simétrico.

## Fase 7 — OG image + Legal
- Server route `/api/og/[code]` que genera PNG 1080x1920 (Stories) con el pitch y las 11 mini-cartas usando `@vercel/og` o canvas en Worker.
- Meta tags `og:image` en `/c/[code]`.
- `/legal/privacidad`, `/legal/terminos`, `/legal/cookies` (banner cookies con rechazo por defecto, solo técnicas).

## Detalles técnicos
- TypeScript strict en todo.
- UI 100% español, tuteo, vocabulario exacto: "11", "Carta", "Liga", "Pulse", "Pulseado", "Hacer mi versión", "Monta tu 11".
- Sin imágenes oficiales de jugadores/equipos: solo nombres + emojis de bandera + escudos genéricos del catálogo.
- Server functions (`createServerFn`) para todas las mutaciones con `requireSupabaseAuth`; lecturas públicas (carta, perfil, ranking) vía server fn con `supabaseAdmin` filtrado.
- Sin chat privado, sin upload de fotos, sin referencias a apuestas/cripto/alcohol.

## Orden de entrega
Construyo Fase 0 → 1 → 2 en este turno (infra + schema + seed + auth + onboarding + settings básico). Fases 3-7 en turnos siguientes para mantener calidad y revisiones intermedias.

¿Apruebas el plan? Si quieres ajustar prioridades (p.ej. empezar por editor antes que ligas, o entregar todo de golpe aceptando menor pulido), dímelo antes de empezar.