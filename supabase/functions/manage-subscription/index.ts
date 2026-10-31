import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (status: number, obj: unknown) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
  const SB_URL     = Deno.env.get('SUPABASE_URL') ?? ''
  const SB_ANON    = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!STRIPE_KEY) return json(503, { ok: false, error: 'Stripe not configured' })

  const auth = req.headers.get('Authorization') ?? ''
  const ur = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: req.headers.get('apikey') || SB_ANON },
  })
  if (!ur.ok) return json(401, { ok: false, error: 'Sign in required' })
  const user = await ur.json()
  if (!user?.id) return json(401, { ok: false, error: 'Sign in required' })

  let body: { action?: string }
  try { body = await req.json() } catch { return json(400, { ok: false, error: 'Invalid JSON' }) }

  const profileRes = await fetch(
    `${SB_URL}/rest/v1/user_profiles?user_id=eq.${user.id}&select=stripe_customer_id`,
    { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` } }
  )
  const profiles = await profileRes.json()
  const customerId = profiles?.[0]?.stripe_customer_id
  if (!customerId) return json(400, { ok: false, error: 'No billing account' })

  if (body.action === 'portal') {
    const session = await stripePost('billing_portal/sessions', {
      customer: customerId,
      return_url: 'https://unionvault.app/?portal=return',
    }, STRIPE_KEY)
    if (!session.url) return json(502, { ok: false, error: 'Portal creation failed' })
    return json(200, { ok: true, url: session.url })
  }

  const subRes = await fetch(
    `${SB_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&select=stripe_subscription_id`,
    { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` } }
  )
  const subs = await subRes.json()
  const subId = subs?.[0]?.stripe_subscription_id
  if (!subId) return json(400, { ok: false, error: 'No active subscription' })

  if (body.action === 'cancel') {
    await stripePost(`subscriptions/${subId}`, { cancel_at_period_end: 'true' }, STRIPE_KEY)
    return json(200, { ok: true, action: 'cancel_at_period_end' })
  }

  if (body.action === 'reactivate') {
    await stripePost(`subscriptions/${subId}`, { cancel_at_period_end: 'false' }, STRIPE_KEY)
    return json(200, { ok: true, action: 'reactivated' })
  }

  return json(400, { ok: false, error: 'Unknown action' })
})

async function stripePost(endpoint: string, params: Record<string, string>, key: string) {
  const r = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(key + ':')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  })
  return r.json()
}
