import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendNotificationToProfile } from "./email-sender.server";
import { welcomeEmail } from "./email-templates.server";

// ---------- Profile bootstrap / read ----------
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("id, username, birth_year, favorite_team_id, avatar_id, status")
      .eq("id", userId)
      .maybeSingle();
    return data;
  });

export const checkUsername = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/, "Solo a-z, 0-9 y _") }).parse(d))
  .handler(async ({ data }) => {
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", data.username)
      .maybeSingle();
    return { available: !existing };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
      birth_year: z.number().int().min(1900).max(2012),
      favorite_team_id: z.number().int().nullable(),
      avatar_id: z.string().min(2).max(20),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      username: data.username,
      birth_year: data.birth_year,
      favorite_team_id: data.favorite_team_id,
      avatar_id: data.avatar_id,
      status: "active",
    });
    if (error) {
      if (error.code === "23505") throw new Error("Ese username ya existe");
      if (error.code === "23514") throw new Error("Debes tener al menos 14 años");
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const updateProfileSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    favorite_team_id: z.number().int().nullable().optional(),
    avatar_id: z.string().min(2).max(20).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: { favorite_team_id?: number | null; avatar_id?: string } = {};
    if (data.favorite_team_id !== undefined) patch.favorite_team_id = data.favorite_team_id;
    if (data.avatar_id !== undefined) patch.avatar_id = data.avatar_id;
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    // Anonymize: detach lineups, mark profile deleted, then delete auth user.
    await supabaseAdmin.from("lineups").update({ author_id: null }).eq("author_id", userId);
    await supabaseAdmin.from("profiles").update({
      status: "deleted",
      username: `eliminado_${Math.random().toString(36).slice(2, 8)}`,
    }).eq("id", userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { ok: true };
  });

// ---------- Catalogs ----------
export const listTeams = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("teams").select("id, name, country").order("name");
  return data ?? [];
});

export const listActiveModes = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("modes")
    .select("id, slug, name, description, rules")
    .eq("is_active", true)
    .order("slug");
  return data ?? [];
});
