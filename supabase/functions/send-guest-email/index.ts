// Sends a save-the-date / invitation email to guests via Resend, optionally with the
// couple's uploaded invitation attached. Only signed-in UnionVault users may call it,
// and an attachment may only come from that user's own folder in the public `photos`
// bucket — so the function can't be used as an open mail relay.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (status: number, obj: unknown) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/
const MAX_TO = 10

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
  const SB_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const FROM_ADDR = Deno.env.get('INVITE_FROM') ?? 'invites@unionvault.app'
  if (!RESEND_KEY) return json(503, { ok: false, error: 'Email service not configured' })

  // Signed-in users only.
  const auth = req.headers.get('Authorization') ?? ''
  const ur = await fetch(`${SB_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: req.headers.get('apikey') || SB_ANON } })
  if (!ur.ok) return json(401, { ok: false, error: 'Sign in to send email' })
  const user = await ur.json()
  if (!user?.id) return json(401, { ok: false, error: 'Sign in to send email' })

  let b: { to?: string[]; subject?: string; body?: string; fromName?: string; replyTo?: string; kicker?: string; title?: string;
           attachment?: { filename?: string; path?: string } }
  try { b = await req.json() } catch { return json(400, { ok: false, error: 'Invalid JSON' }) }

  const to = (b.to ?? []).map((e) => String(e).trim()).filter((e) => EMAIL_RE.test(e))
  if (!to.length || to.length > MAX_TO) return json(400, { ok: false, error: 'Invalid recipients' })
  const subject = String(b.subject ?? '').slice(0, 200)
  const text = String(b.body ?? '').slice(0, 10000)
  if (!subject || !text) return json(400, { ok: false, error: 'Missing subject or body' })

  const name = String(b.fromName ?? '').replace(/[<>"\r\n]/g, '').trim().slice(0, 80) || 'UnionVault'
  const replyTo = EMAIL_RE.test(String(b.replyTo ?? '')) ? String(b.replyTo) : user.email

  // Look up sender's tier for branding decision
  const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  let senderTier = 'free'
  if (SB_SERVICE) {
    try {
      const pr = await fetch(`${SB_URL}/rest/v1/user_profiles?user_id=eq.${user.id}&select=tier`, {
        headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` },
      })
      const rows = await pr.json()
      if (rows?.[0]?.tier) senderTier = rows[0].tier
    } catch (_) { /* default to free — branding shown */ }
  }
  const showBranding = senderTier === 'free'

  const payload: Record<string, unknown> = { from: `${name} <${FROM_ADDR}>`, to, subject, text }
  if (replyTo) payload.reply_to = replyTo
  payload.html = brandedHtml({ kicker: String(b.kicker ?? '').slice(0, 120), title: String(b.title ?? '').slice(0, 200), text, showBranding })

  if (b.attachment?.path) {
    const allowed = `${SB_URL}/storage/v1/object/public/photos/${user.id}/`
    const path = String(b.attachment.path)
    if (!path.startsWith(allowed) || path.includes('..')) return json(400, { ok: false, error: 'Invalid attachment' })
    const filename = String(b.attachment.filename ?? 'invitation').replace(/[\\/\r\n"]/g, '').slice(0, 120) || 'invitation'
    payload.attachments = [{ filename, path }]
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) {
    console.error('Resend error:', r.status, await r.text())
    return json(502, { ok: false, error: 'Send failed' })
  }
  return json(200, { ok: true })
})

// ── Branded HTML version of a plain-text email ────────────────────────────────
// Everything passed in is plain text and is escaped here, so callers can't inject
// markup. Black logo on cream; email apps that honour prefers-color-scheme swap
// to the white logo on a dark band.
const LOGO_BASE = 'https://unionvault.app/assets'
const escH = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
function linkify(escaped: string): string {
  return escaped.replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)'"]/g, (u) => `<a href="${u}" style="color:#8a6a2c">${u}</a>`)
}
function brandedHtml(opts: { kicker?: string; title?: string; text: string; showBranding?: boolean }): string {
  const paras = String(opts.text ?? '').trim().split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${linkify(escH(p)).replace(/\n/g, '<br>')}</p>`).join('')

  const brandingFooter = opts.showBranding
    ? `<tr><td style="padding:0 26px 6px"><hr style="border:none;border-top:1px solid #E0D8CF;margin:0 0 14px"></td></tr>
<tr><td align="center" style="padding:0 26px 10px">
<a href="https://unionvault.app" style="text-decoration:none">
<picture><source srcset="${LOGO_BASE}/email-logo-white.png" media="(prefers-color-scheme: dark)"><img src="${LOGO_BASE}/email-logo-black.png" width="90" alt="Union Vault" style="display:block;width:90px;height:auto;border:0;margin:0 auto"></picture>
</a></td></tr>
<tr><td align="center" class="uv-muted" style="padding:0 26px 22px;font-size:11px;color:#6E6259">Planned with <a href="https://unionvault.app" style="color:#8a6a2c;text-decoration:none">Union Vault</a></td></tr>`
    : ''

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<style>@media (prefers-color-scheme: dark){.uv-bg{background:#111114!important}.uv-card{background:#1A1A1F!important;color:#EDE6DA!important}.uv-band{background:#111114!important}.uv-muted{color:#A79E92!important}.uv-kicker{color:#E3C878!important}}</style></head>
<body class="uv-bg" style="margin:0;padding:24px 12px;background:#EFEAE1;font-family:Helvetica,Arial,sans-serif;color:#2C2222">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="uv-card" style="max-width:560px;background:#FBF8F3;border-radius:12px;overflow:hidden">
<tr><td class="uv-band" align="center" style="background:#F4EEE4;padding:22px 0 16px">
<picture><source srcset="${LOGO_BASE}/email-logo-white.png" media="(prefers-color-scheme: dark)"><img src="${LOGO_BASE}/email-logo-black.png" width="120" alt="UnionVault" style="display:block;width:120px;height:auto;border:0"></picture>
</td></tr>
<tr><td style="padding:24px 26px 10px">
${opts.kicker ? `<div class="uv-kicker" style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a6a2c;margin-bottom:8px">${escH(opts.kicker)}</div>` : ''}
${opts.title ? `<div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.2;margin-bottom:16px">${escH(opts.title)}</div>` : ''}
${paras}
</td></tr>
${brandingFooter}
</table></td></tr></table></body></html>`
}
