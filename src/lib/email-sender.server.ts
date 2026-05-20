// Server-only Resend sender + unsubscribe token utilities.
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { FROM, REPLY_TO, SITE_URL } from "./email-templates.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

function getHmacSecret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.LOVABLE_API_KEY ?? "11pulse-fallback-secret";
  return s;
}

export function makeUnsubToken(userId: string): string {
  return createHmac("sha256", getHmacSecret()).update(`unsub:${userId}`).digest("hex").slice(0, 32);
}

export function verifyUnsubToken(userId: string, token: string): boolean {
  const expected = makeUnsubToken(userId);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function unsubscribeUrl(userId: string): string {
  return `${SITE_URL}/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${makeUnsubToken(userId)}`;
}

export type ProfileEmailInfo = {
  id: string;
  username: string;
  email: string | null;
  email_notifications_enabled: boolean;
};

export async function getProfileEmailInfo(userId: string): Promise<ProfileEmailInfo | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, email_notifications_enabled")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;
  const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(userId);
  return {
    id: profile.id,
    username: profile.username,
    email: userResp?.user?.email ?? null,
    email_notifications_enabled: (profile as unknown as { email_notifications_enabled: boolean }).email_notifications_enabled,
  };
}

/**
 * Low-level send through the Resend gateway.
 * Returns { ok, status, body } — never throws on Resend errors; caller decides.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  bypassOptOut?: boolean;  // true for magic-link / account-critical emails
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no está configurada");
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY no está configurada");

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM,
      to: [opts.to],
      reply_to: REPLY_TO,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[resend] send failed", res.status, body);
  }
  return { ok: res.ok, status: res.status, body };
}

/**
 * Send a notification email to a profile, respecting their opt-out preference.
 * Returns true if delivered, false if skipped (opted out, missing email, or send failure).
 */
export async function sendNotificationToProfile(
  userId: string,
  build: (info: ProfileEmailInfo & { unsubscribeUrl: string }) => { subject: string; html: string },
): Promise<boolean> {
  try {
    const info = await getProfileEmailInfo(userId);
    if (!info || !info.email) return false;
    if (!info.email_notifications_enabled) return false;
    const { subject, html } = build({ ...info, unsubscribeUrl: unsubscribeUrl(userId) });
    const r = await sendEmail({ to: info.email, subject, html });
    return r.ok;
  } catch (e) {
    console.error("[email] notify failed", e);
    return false;
  }
}
