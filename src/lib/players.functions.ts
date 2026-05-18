import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listPlayersForMode = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ mode_slug: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { data: mode } = await supabaseAdmin
      .from("modes").select("rules").eq("slug", data.mode_slug).maybeSingle();
    const sel = (mode?.rules as { selection_mode?: string; pool_size?: number } | null)?.selection_mode;

    if (sel === 'pool') {
      // deterministic-ish pool of 22 based on ISO week
      const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
      const { data: all } = await supabaseAdmin.from("players")
        .select("id, name, position, birth_year, nationality, team_id").order("id");
      const players = all ?? [];
      // shuffle by week seed
      const seeded = players.map((p, i) => ({ p, k: ((week + 1) * 9301 + i * 49297) % 233280 }))
        .sort((a, b) => a.k - b.k).map(x => x.p);
      const pool = seeded.slice(0, 22);
      return { selection_mode: 'pool', players: pool };
    }
    const { data: all } = await supabaseAdmin.from("players")
      .select("id, name, position, birth_year, nationality, team_id").order("name");
    return { selection_mode: 'open', players: all ?? [] };
  });
