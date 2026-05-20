// Server-only HTML email templates for 11Pulse.
// Brutalist fanzine style, white background, dark-mode safe (color-scheme: light only).

const PRIMARY = "#16a34a";        // verde neón (CTA)
const PRIMARY_FG = "#0a1410";
const MAGENTA = "#e11d83";
const BLACK = "#0a0a0a";
const PAPER = "#ffffff";
const PAPER_2 = "#f5f3ee";
const MUTED = "#55575d";

export const SITE_URL = (process.env.SITE_URL ?? "https://11pulse.com").replace(/\/+$/, "");
export const FROM = "Pulse11 <hola@11pulse.com>";
export const REPLY_TO = "hola@11pulse.com";

function shell(opts: { title: string; preview: string; bodyHtml: string; unsubscribeUrl?: string }): string {
  const footer = opts.unsubscribeUrl
    ? `Recibes esto porque tienes cuenta en 11Pulse. <a href="${opts.unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Darme de baja</a>.`
    : `Recibes esto porque acabas de pedir un enlace de acceso a 11Pulse.`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};color:${BLACK};font-family:Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:${PAPER};border:2px solid ${BLACK};box-shadow:6px 6px 0 ${BLACK};">
      <tr><td style="padding:20px 24px;border-bottom:2px solid ${BLACK};background:${PAPER_2};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:Impact,'Bebas Neue','Archivo Narrow',sans-serif;font-size:28px;letter-spacing:1px;color:${BLACK};line-height:1;">
              <span style="background:${MAGENTA};color:#fff;padding:2px 6px;border:2px solid ${BLACK};display:inline-block;">11</span>
              <span style="margin-left:6px;">PULSE.</span>
            </td>
            <td align="right" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${MUTED};letter-spacing:2px;text-transform:uppercase;">FANZINE Nº 1</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:32px 28px;">
        ${opts.bodyHtml}
      </td></tr>
      <tr><td style="padding:16px 24px;border-top:2px solid ${BLACK};background:${PAPER_2};font-family:'JetBrains Mono',monospace;font-size:11px;color:${MUTED};text-align:center;line-height:1.6;">
        ${footer}<br/>
        <span style="font-size:10px;letter-spacing:1px;">11PULSE · 11pulse.com · sin betting · sin dms</span>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function heading(text: string, color = BLACK): string {
  return `<h1 style="margin:0 0 16px;font-family:Impact,'Bebas Neue','Archivo Narrow',sans-serif;font-size:42px;line-height:0.95;letter-spacing:1px;color:${color};text-transform:uppercase;">${escapeHtml(text)}</h1>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${BLACK};">${text}</p>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
    <td style="background:${PRIMARY};border:2px solid ${BLACK};box-shadow:4px 4px 0 ${BLACK};">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Impact,'Bebas Neue','Archivo Narrow',sans-serif;font-size:22px;letter-spacing:2px;color:${PRIMARY_FG};text-decoration:none;text-transform:uppercase;">${escapeHtml(label)} →</a>
    </td>
  </tr></table>`;
}

function tape(text: string, color = MAGENTA): string {
  return `<div style="display:inline-block;background:${color};color:#fff;padding:4px 10px;border:2px solid ${BLACK};font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">${escapeHtml(text)}</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// ============ Templates ============

export function magicLinkEmail(opts: { actionLink: string }): { subject: string; html: string } {
  return {
    subject: "Tu llave para entrar en 11Pulse",
    html: shell({
      title: "Entra en 11Pulse",
      preview: "Tu enlace mágico está aquí. Caduca en 1 hora.",
      bodyHtml: `
        ${tape("ACCESO · 1 USO")}
        ${heading("ENTRA EN PULSE11", PRIMARY)}
        ${para("Pinchas, entras, montas tu 11. Sin contraseñas, sin movidas.")}
        ${button("Entrar", opts.actionLink)}
        ${para(`Si el botón no va, copia y pega esto: <br/><span style="word-break:break-all;color:${MUTED};font-size:12px;">${escapeHtml(opts.actionLink)}</span>`)}
        ${para(`<span style="color:${MUTED};font-size:13px;">Caduca en 1 hora. Si no fuiste tú, ignóralo.</span>`)}
      `,
    }),
  };
}

export function welcomeEmail(opts: { username: string; unsubscribeUrl: string }): { subject: string; html: string } {
  const u = escapeHtml(opts.username);
  return {
    subject: `Bienvenid@ a 11Pulse, @${opts.username}`,
    html: shell({
      title: "Bienvenido a 11Pulse",
      preview: `Ya estás dentro, @${opts.username}. Empieza por montar tu 11.`,
      bodyHtml: `
        ${tape("FICHADO ✓", PRIMARY)}
        ${heading(`BIENVENIDO, @${u}`)}
        ${para("Esto es lo que se hace aquí:")}
        <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.6;color:${BLACK};">
          <li><strong>Monta tu 11 ideal</strong> en cualquiera de los modos (clásico, B2B, dream team…).</li>
          <li><strong>Comparte tu carta</strong> con un código corto y mira cuántos pulses se lleva.</li>
          <li><strong>Compite en ligas privadas</strong> con tus colegas — sin trolls, sin DMs.</li>
        </ul>
        ${button("Montar mi primer 11", `${SITE_URL}/lineups/new`)}
        ${para(`<span style="color:${MUTED};font-size:13px;">Si te aburres, pásate por /modes y elige uno.</span>`)}
      `,
      unsubscribeUrl: opts.unsubscribeUrl,
    }),
  };
}

export function pulseNotificationEmail(opts: {
  fromUsername: string;
  lineupTitle: string;
  lineupCode: string;
  pulseCount: number;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const from = escapeHtml(opts.fromUsername);
  const title = escapeHtml(opts.lineupTitle);
  return {
    subject: `@${opts.fromUsername} pulseó tu 11`,
    html: shell({
      title: "Te han pulseado",
      preview: `@${opts.fromUsername} acaba de pulsear "${opts.lineupTitle}".`,
      bodyHtml: `
        ${tape("⚡ PULSE NUEVO", MAGENTA)}
        ${heading(`@${from} PULSEÓ TU 11`, MAGENTA)}
        ${para(`Tu carta <strong>"${title}"</strong> sigue subiendo.`)}
        <div style="margin:0 0 20px;padding:14px 16px;border:2px solid ${BLACK};background:${PAPER_2};display:inline-block;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;color:${MUTED};text-transform:uppercase;">TOTAL PULSES</div>
          <div style="font-family:Impact,sans-serif;font-size:38px;color:${BLACK};line-height:1;">${opts.pulseCount}</div>
        </div>
        ${button("Ver mi carta", `${SITE_URL}/c/${opts.lineupCode}`)}
      `,
      unsubscribeUrl: opts.unsubscribeUrl,
    }),
  };
}

export function forkNotificationEmail(opts: {
  fromUsername: string;
  originalTitle: string;
  originalCode: string;
  forkCode: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const from = escapeHtml(opts.fromUsername);
  const title = escapeHtml(opts.originalTitle);
  return {
    subject: `@${opts.fromUsername} hizo su versión de tu 11`,
    html: shell({
      title: "Han forkeado tu 11",
      preview: `@${opts.fromUsername} montó su propia versión de "${opts.originalTitle}".`,
      bodyHtml: `
        ${tape("FORK / REMIX", PRIMARY)}
        ${heading(`@${from} HIZO SU VERSIÓN DE TU 11`)}
        ${para(`Tu carta <strong>"${title}"</strong> inspiró un remix. Pásate a ver qué cambió.`)}
        ${button("Ver el remix", `${SITE_URL}/c/${opts.forkCode}`)}
        ${para(`<a href="${SITE_URL}/c/${opts.originalCode}" style="color:${MUTED};font-size:13px;">Ver mi carta original →</a>`)}
      `,
      unsubscribeUrl: opts.unsubscribeUrl,
    }),
  };
}
