-- Subscription infrastructure for Stripe-based paywall
-- Tables: user_profiles (tier + trial state), subscriptions (Stripe sync)
-- RPC: get_my_subscription() for client-side tier checks

-- ── user_profiles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier              text NOT NULL DEFAULT 'trial'
                    CHECK (tier IN ('free','trial','full')),
  trial_started     timestamptz DEFAULT now(),
  stripe_customer_id text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- ── subscriptions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id      text NOT NULL,
  stripe_subscription_id  text UNIQUE,
  status                  text NOT NULL DEFAULT 'trialing'
                          CHECK (status IN ('trialing','active','past_due','canceled','unpaid','incomplete','paused')),
  price_id                text,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  trial_end               timestamptz,
  cancel_at_period_end    boolean DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),

  CONSTRAINT one_sub_per_user UNIQUE (user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_sub" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ── Auto-create profile on signup ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, tier, trial_started)
  VALUES (NEW.id, 'trial', now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ── Backfill existing users with a fresh trial ─────────────────────────────
INSERT INTO user_profiles (user_id, tier, trial_started)
SELECT id, 'trial', now()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ── RPC: get_my_subscription ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_subscription()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _profile user_profiles;
  _sub     subscriptions;
  _tier    text;
  _trial_days_left int := 0;
BEGIN
  SELECT * INTO _profile FROM user_profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN json_build_object('tier', 'free', 'trialDaysLeft', 0);
  END IF;

  SELECT * INTO _sub FROM subscriptions WHERE user_id = auth.uid();

  IF _sub IS NOT NULL AND _sub.status IN ('active', 'trialing') THEN
    _tier := 'full';
  ELSIF _profile.tier = 'trial'
        AND _profile.trial_started + interval '14 days' > now() THEN
    _tier := 'trial';
    _trial_days_left := GREATEST(0,
      EXTRACT(EPOCH FROM (_profile.trial_started + interval '14 days' - now()))::int / 86400);
  ELSE
    _tier := 'free';
  END IF;

  RETURN json_build_object(
    'tier',               _tier,
    'trialDaysLeft',      _trial_days_left,
    'trialEnd',           _profile.trial_started + interval '14 days',
    'subStatus',          _sub.status,
    'cancelAtPeriodEnd',  COALESCE(_sub.cancel_at_period_end, false),
    'currentPeriodEnd',   _sub.current_period_end,
    'priceId',            _sub.price_id
  );
END;
$$;
