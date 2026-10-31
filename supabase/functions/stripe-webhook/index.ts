import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (status: number, obj: unknown) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const STRIPE_KEY    = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
  const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
  const SB_URL        = Deno.env.get('SUPABASE_URL') ?? ''
  const SB_SERVICE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!STRIPE_KEY || !WEBHOOK_SECRET) return json(503, { error: 'Not configured' })

  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  if (!await verifySignature(rawBody, sig, WEBHOOK_SECRET)) {
    return json(400, { error: 'Invalid signature' })
  }

  const event = JSON.parse(rawBody)
  const type = event.type as string

  try {
    if (type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object, SB_URL, SB_SERVICE, STRIPE_KEY)
    } else if (type === 'customer.subscription.updated') {
      await handleSubUpdated(event.data.object, SB_URL, SB_SERVICE)
    } else if (type === 'customer.subscription.deleted') {
      await handleSubDeleted(event.data.object, SB_URL, SB_SERVICE)
    } else if (type === 'invoice.payment_failed') {
      await handlePaymentFailed(event.data.object, SB_URL, SB_SERVICE)
    }
  } catch (e) {
    console.error('Webhook handler error:', type, e)
    return json(500, { error: 'Handler failed' })
  }

  return json(200, { received: true })
})

// ── Handlers ────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  session: Record<string, unknown>, sbUrl: string, sbKey: string, stripeKey: string
) {
  if (session.mode !== 'subscription') return
  const userId = (session.metadata as Record<string, string>)?.user_id
  const customerId = session.customer as string
  const subId = session.subscription as string
  if (!userId || !subId) return

  const sub = await stripeGet(`subscriptions/${subId}`, stripeKey)

  await sbUpsert(sbUrl, sbKey, 'subscriptions', 'user_id', {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subId,
    status: sub.status ?? 'active',
    price_id: sub.items?.data?.[0]?.price?.id ?? null,
    current_period_start: tsToIso(sub.current_period_start),
    current_period_end: tsToIso(sub.current_period_end),
    trial_end: sub.trial_end ? tsToIso(sub.trial_end) : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  })

  await sbPatch(sbUrl, sbKey, 'user_profiles', 'user_id', userId, {
    tier: 'full', stripe_customer_id: customerId,
  })
}

async function handleSubUpdated(sub: Record<string, unknown>, sbUrl: string, sbKey: string) {
  const subId = sub.id as string
  const status = sub.status as string

  const row: Record<string, unknown> = {
    status,
    price_id: (sub.items as any)?.data?.[0]?.price?.id ?? null,
    current_period_start: tsToIso(sub.current_period_start as number),
    current_period_end: tsToIso(sub.current_period_end as number),
    trial_end: sub.trial_end ? tsToIso(sub.trial_end as number) : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  }

  await fetch(`${sbUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subId}`, {
    method: 'PATCH',
    headers: sbHeaders(sbKey),
    body: JSON.stringify(row),
  })

  // Update tier based on status
  const tier = (status === 'active' || status === 'trialing') ? 'full' : 'free'
  const lookupRes = await fetch(
    `${sbUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subId}&select=user_id`,
    { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
  )
  const rows = await lookupRes.json()
  if (rows?.[0]?.user_id) {
    await sbPatch(sbUrl, sbKey, 'user_profiles', 'user_id', rows[0].user_id, { tier })
  }
}

async function handleSubDeleted(sub: Record<string, unknown>, sbUrl: string, sbKey: string) {
  const subId = sub.id as string

  const lookupRes = await fetch(
    `${sbUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subId}&select=user_id`,
    { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
  )
  const rows = await lookupRes.json()

  await fetch(`${sbUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subId}`, {
    method: 'PATCH',
    headers: sbHeaders(sbKey),
    body: JSON.stringify({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() }),
  })

  if (rows?.[0]?.user_id) {
    await sbPatch(sbUrl, sbKey, 'user_profiles', 'user_id', rows[0].user_id, { tier: 'free' })
  }
}

async function handlePaymentFailed(invoice: Record<string, unknown>, sbUrl: string, sbKey: string) {
  const subId = invoice.subscription as string
  if (!subId) return
  await fetch(`${sbUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subId}`, {
    method: 'PATCH',
    headers: sbHeaders(sbKey),
    body: JSON.stringify({ status: 'past_due', updated_at: new Date().toISOString() }),
  })
}

// ── Stripe signature verification (HMAC-SHA256 via Web Crypto) ──────────────

async function verifySignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts: Record<string, string> = {}
  for (const pair of header.split(',')) {
    const eq = pair.indexOf('=')
    if (eq > 0) parts[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
  }
  const timestamp = parts.t
  if (!timestamp || !parts.v1) return false

  const fiveMinutes = 300
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > fiveMinutes) return false

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${payload}`))
  const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')

  if (hex.length !== parts.v1.length) return false
  let result = 0
  for (let i = 0; i < hex.length; i++) result |= hex.charCodeAt(i) ^ parts.v1.charCodeAt(i)
  return result === 0
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sbHeaders(key: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
}

async function sbUpsert(sbUrl: string, key: string, table: string, conflict: string, row: Record<string, unknown>) {
  await fetch(`${sbUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders(key), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row),
  })
}

async function sbPatch(sbUrl: string, key: string, table: string, col: string, val: string, data: Record<string, unknown>) {
  await fetch(`${sbUrl}/rest/v1/${table}?${col}=eq.${val}`, {
    method: 'PATCH',
    headers: sbHeaders(key),
    body: JSON.stringify(data),
  })
}

async function stripeGet(endpoint: string, key: string) {
  const r = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    headers: { Authorization: `Basic ${btoa(key + ':')}` },
  })
  return r.json()
}

function tsToIso(ts: unknown): string | null {
  if (!ts) return null
  return new Date(Number(ts) * 1000).toISOString()
}
