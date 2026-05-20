import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { genCode, genLeagueCode } from "./catalog";
import { sendNotificationToProfile } from "./email-sender.server";
import { forkNotificationEmail, pulseNotificationEmail } from "./email-templates.server";

const slotSchema = z.object({ slot: z.string().min(1).max(10), player_id: z.number().int().positive() });
const lineupInputSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  mode_id: z.string().uuid(),
  title: z.string().min(1).max(60),
  formation: z.enum(['4-3-3','4-4-2','3-5-2','4-2-3-1']),
  players: z.array(slotSchema).length(11),
  forked_from: z.string().uuid().nullable().optional(),
});

// ---------- LINEUPS ----------
export const saveLineup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => lineupInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("lineups")
        .update({
          title: data.title,
          formation: data.formation,
          players: data.players,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .eq("author_id", userId);
      if (error) throw new Error(error.message);
      const { data: row } = await supabaseAdmin.from("lineups").select("code").eq("id", data.id).single();
      return { code: row?.code as string };
    }

    // New: try a few codes for uniqueness
    let code = genCode();
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await supabaseAdmin.from("lineups").select("id").eq("code", code).maybeSingle();
      if (!clash) break;
      code = genCode();
    }
    const { error, data: inserted } = await supabaseAdmin.from("lineups").insert({
      code,
      author_id: userId,
      mode_id: data.mode_id,
      title: data.title,
      formation: data.formation,
      players: data.players,
      forked_from: data.forked_from ?? null,
      is_public: true,
    }).select("code").single();
    if (error) {
      if (error.code === "23505") throw new Error("Ya tienes un 11 esta semana en este modo");
      throw new Error(error.message);
    }
    if (data.forked_from) {
      // bump source fork count + notify original author
      const { data: src } = await supabaseAdmin
        .from("lineups")
        .select("forks_count, title, code, author_id")
        .eq("id", data.forked_from)
        .maybeSingle();
      if (src) {
        await supabaseAdmin
          .from("lineups")
          .update({ forks_count: (src.forks_count ?? 0) + 1 })
          .eq("id", data.forked_from);
        if (src.author_id && src.author_id !== userId) {
          const { data: me } = await supabaseAdmin
            .from("profiles").select("username").eq("id", userId).maybeSingle();
          if (me?.username) {
            void sendNotificationToProfile(src.author_id, (info) =>
              forkNotificationEmail({
                fromUsername: me.username,
                originalTitle: src.title,
                originalCode: src.code,
                forkCode: inserted.code,
                unsubscribeUrl: info.unsubscribeUrl,
              }),
            );
          }
        }
      }
    }
    return { code: inserted.code };
  });

export const getLineupByCode = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ code: z.string().min(1).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const { data: lu } = await supabaseAdmin
      .from("lineups")
      .select("id, code, title, formation, players, pulses_count, forks_count, created_at, author_id, mode_id, forked_from")
      .eq("code", data.code)
      .eq("is_public", true)
      .maybeSingle();
    if (!lu) return null;

    const playerIds = (lu.players as { slot: string; player_id: number }[]).map(p => p.player_id);
    const { data: players } = await supabaseAdmin
      .from("players")
      .select("id, name, position, birth_year, nationality, team_id")
      .in("id", playerIds);

    let author: { username: string; avatar_id: string } | null = null;
    if (lu.author_id) {
      const { data: a } = await supabaseAdmin.from("profiles").select("username, avatar_id").eq("id", lu.author_id).maybeSingle();
      author = a;
    }
    const { data: mode } = await supabaseAdmin.from("modes").select("slug, name").eq("id", lu.mode_id).maybeSingle();

    return { lineup: lu, players: players ?? [], author, mode };
  });

export const myLineupsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("lineups")
      .select("id, code, title, formation, pulses_count, forks_count, created_at, mode_id")
      .eq("author_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });

export const togglePulse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ lineup_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("pulses").select("user_id").eq("lineup_id", data.lineup_id).eq("user_id", userId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("pulses").delete().eq("lineup_id", data.lineup_id).eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { pulseado: false };
    }
    const { error } = await supabase.from("pulses").insert({ lineup_id: data.lineup_id, user_id: userId });
    if (error) throw new Error(error.message.includes("propia") ? "No puedes hacer pulse a tu propia carta" : error.message);

    // Notify lineup author (fire-and-forget)
    const { data: lu } = await supabaseAdmin
      .from("lineups")
      .select("author_id, title, code, pulses_count")
      .eq("id", data.lineup_id)
      .maybeSingle();
    if (lu?.author_id && lu.author_id !== userId) {
      const { data: me } = await supabaseAdmin
        .from("profiles").select("username").eq("id", userId).maybeSingle();
      if (me?.username) {
        void sendNotificationToProfile(lu.author_id, (info) =>
          pulseNotificationEmail({
            fromUsername: me.username,
            lineupTitle: lu.title,
            lineupCode: lu.code,
            pulseCount: lu.pulses_count ?? 0,
            unsubscribeUrl: info.unsubscribeUrl,
          }),
        );
      }
    }
    return { pulseado: true };
  });

export const hasPulsed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ lineup_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase.from("pulses").select("user_id").eq("lineup_id", data.lineup_id).eq("user_id", userId).maybeSingle();
    return { pulseado: !!row };
  });

// ---------- LEAGUES ----------
export const myLeagues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: memberships } = await supabaseAdmin
      .from("league_members")
      .select("league_id, role")
      .eq("user_id", context.userId);
    const ids = (memberships ?? []).map(m => m.league_id);
    if (!ids.length) return [];
    const { data: leagues } = await supabaseAdmin
      .from("leagues")
      .select("id, code, name, crest_id, created_at")
      .in("id", ids);
    return leagues ?? [];
  });

export const createLeague = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(2).max(40),
    crest_id: z.string().min(2).max(10),
  }).parse(d))
  .handler(async ({ data, context }) => {
    let code = genLeagueCode();
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await supabaseAdmin.from("leagues").select("id").eq("code", code).maybeSingle();
      if (!clash) break;
      code = genLeagueCode();
    }
    const { data: league, error } = await supabaseAdmin.from("leagues").insert({
      code, name: data.name, crest_id: data.crest_id, created_by: context.userId,
    }).select("id, code").single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("league_members").insert({
      league_id: league.id, user_id: context.userId, role: "admin",
    });
    return { code: league.code };
  });

export const joinLeague = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(4).max(10) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: league } = await supabaseAdmin
      .from("leagues").select("id, code").eq("code", data.code.toUpperCase()).maybeSingle();
    if (!league) throw new Error("Liga no encontrada");
    const { error } = await supabaseAdmin.from("league_members").upsert({
      league_id: league.id, user_id: context.userId, role: "member",
    });
    if (error) throw new Error(error.message);
    return { code: league.code };
  });

export const getLeague = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(4).max(10) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: league } = await supabaseAdmin
      .from("leagues").select("id, code, name, crest_id, created_at, created_by")
      .eq("code", data.code.toUpperCase()).maybeSingle();
    if (!league) return null;
    const { data: member } = await supabaseAdmin
      .from("league_members").select("user_id").eq("league_id", league.id).eq("user_id", context.userId).maybeSingle();
    if (!member) return { league, isMember: false, members: [], ranking: [] };

    const { data: members } = await supabaseAdmin
      .from("league_members").select("user_id, role, joined_at").eq("league_id", league.id);
    const uids = (members ?? []).map(m => m.user_id);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, username, avatar_id").in("id", uids);
    const { data: lineups } = await supabaseAdmin
      .from("lineups").select("author_id, pulses_count").in("author_id", uids);

    const sumByUser = new Map<string, number>();
    (lineups ?? []).forEach(l => {
      if (!l.author_id) return;
      sumByUser.set(l.author_id, (sumByUser.get(l.author_id) ?? 0) + (l.pulses_count ?? 0));
    });
    const ranking = (profiles ?? []).map(p => ({
      username: p.username, avatar_id: p.avatar_id, pulses: sumByUser.get(p.id) ?? 0,
    })).sort((a, b) => b.pulses - a.pulses);

    return { league, isMember: true, members: members ?? [], ranking };
  });
