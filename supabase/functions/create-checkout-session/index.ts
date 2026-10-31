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

  let body: { priceId?: string }
  try { body = await req.json() } catch { return json(400, { ok: false, error: 'Invalid JSON' }) }
  if (!body.priceId) return json(400, { ok: false, error: 'Missing priceId' })

  // Look up existing Stripe customer or create one
  const profileRes = await fetch(
    `${SB_URL}/rest/v1/user_profiles?user_id=eq.${user.id}&select=stripe_customer_id`,
    { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` } }
  )
  const profiles = await profileRes.json()
  let customerId = profiles?.[0]?.stripe_customer_id

  if (!customerId) {
    const custRes = await stripePost('customers', { email: user.email, 'metadata[user_id]': user.id }, STRIPE_KEY)
    if (!custRes.id) return json(502, { ok: false, error: 'Failed to create customer' })
    customerId = custRes.id

    await fetch(`${SB_URL}/rest/v1/user_profiles?user_id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ stripe_customer_id: customerId }),
    })
  }

  // Check if user has ever had a subscription (for trial eligibility)
  const subRes = await fetch(
    `${SB_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&select=id&limit=1`,
    { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` } }
  )
  const subs = await subRes.json()
  const isFirstSub = !subs?.length

  const params: Record<string, string> = {
    customer: customerId,
    mode: 'subscription',
    'line_items[0][price]': body.priceId,
    'line_items[0][quantity]': '1',
    allow_promotion_codes: 'true',
    success_url: 'https://unionvault.app/?checkout=success',
    cancel_url: 'https://unionvault.app/?checkout=cancel',
    'metadata[user_id]': user.id,
  }
  if (isFirstSub) {
    params['subscription_data[trial_period_days]'] = '14'
  }

  const session = await stripePost('checkout/sessions', params, STRIPE_KEY)
  if (!session.url) return json(502, { ok: false, error: 'Failed to create checkout session' })

  return json(200, { ok: true, url: session.url })
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
