import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmail, verifyUnsubToken } from "./email-sender.server";
import { magicLinkEmail, SITE_URL } from "./email-templates.server";

// ---------- Magic link via Resend ----------
export const sendMagicLink = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase().trim();

    // Generate a magic link without Supabase sending an email.
    // `generateLink` with type 'magiclink' creates the user if needed (default behavior).
    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${SITE_URL}/onboarding` },
    });
    if (error) {
      console.error("[magic-link] generateLink failed", error);
      throw new Error("No pudimos generar el enlace. Inténtalo otra vez.");
    }
    const actionLink = linkData.properties?.action_link;
    if (!actionLink) throw new Error("Enlace no disponible");

    const { subject, html } = magicLinkEmail({ actionLink });
    const r = await sendEmail({ to: email, subject, html, bypassOptOut: true });
    if (!r.ok) {
      throw new Error("El email no pudo enviarse. Prueba con contraseña.");
    }
    return { ok: true };
  });

// ---------- Unsubscribe (public, token-gated) ----------
export const unsubscribeWithToken = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    token: z.string().min(8).max(128),
  }).parse(d))
  .handler(async ({ data }) => {
    if (!verifyUnsubToken(data.userId, data.token)) {
      throw new Error("Enlace inválido o caducado");
    }
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ email_notifications_enabled: false } as never)
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getUnsubscribeStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    token: z.string().min(8).max(128),
  }).parse(d))
  .handler(async ({ data }) => {
    if (!verifyUnsubToken(data.userId, data.token)) {
      return { valid: false as const };
    }
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("username, email_notifications_enabled")
      .eq("id", data.userId)
      .maybeSingle();
    if (!row) return { valid: false as const };
    return {
      valid: true as const,
      username: row.username,
      enabled: (row as unknown as { email_notifications_enabled: boolean }).email_notifications_enabled,
    };
  });

// ---------- Self-service toggle (used by /settings) ----------
export const updateEmailNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ email_notifications_enabled: data.enabled } as never)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Dev helper: send a test email to myself ----------
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const email = userResp?.user?.email;
    if (!email) throw new Error("Tu cuenta no tiene email");
    const { subject, html } = magicLinkEmail({ actionLink: `${SITE_URL}/dashboard?test=1` });
    const r = await sendEmail({ to: email, subject: `[TEST] ${subject}`, html, bypassOptOut: true });
    if (!r.ok) throw new Error("No se pudo enviar el email de prueba");
    return { ok: true, sentTo: email };
  });
