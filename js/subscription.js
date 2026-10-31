// SUBSCRIPTION & FEATURE GATING
// ═══════════════════════════════════════
// Client-side tier state, upgrade modal, and Stripe checkout integration.
// Depends on: supabase.js (_SB_URL, _SB_KEY, _sbAuthHdr, _sbSession, _sbOnAuthChange, _sbEnsureFreshToken)

let _uvTier = 'free';
let _uvTrialDaysLeft = 0;
let _uvSubLoaded = false;
let _uvSubDetails = null;

// ── Feature map ─────────────────────────────────────────────────────────────
const _UV_PAID_PAGES = new Set(['seating','calendar','events','inspo','visionboard','wishingwell']);

const _UV_PAID_FEATURES = new Set([
  'mealChoices','childrenMeal','highChair','dietary',
  'budgetSubItems','budgetDocs','budgetPayments','perHead','perItem',
  'printExport','brandOff','unlimitedGuests',
]);

const _UV_FEATURE_LABELS = {
  seating:'Seating Plan', calendar:'Calendar', events:'Multi-Event Planning',
  inspo:'Inspiration', visionboard:'Vision Board', wishingwell:'Wishing Well',
  mealChoices:'Meal Choices', childrenMeal:"Children's Meals", highChair:'High-Chair Tracking',
  dietary:'Dietary Requirements', budgetSubItems:'Budget Sub-Items',
  budgetDocs:'Budget Documents', budgetPayments:'Payment Plans',
  perHead:'Per-Head Pricing', perItem:'Per-Item Pricing',
  printExport:'Print & Export', brandOff:'Remove Union Vault Badge',
  unlimitedGuests:'Unlimited Guests',
};

function _uvIsPaid(){ return _uvTier === 'full' || _uvTier === 'trial'; }
function _uvIsFree(){ return _uvTier === 'free'; }

function _uvGuestLimitReached(){
  return !_uvIsPaid() && _sbSession && STATE.guests && STATE.guests.length >= 50;
}

function _uvRequirePaid(feature){
  if(_uvIsPaid()) return true;
  if(!_sbSession) return true; // offline users aren't gated
  _uvShowUpgradeModal(feature);
  return false;
}

// ── Load subscription state from Supabase ───────────────────────────────────

async function _uvLoadSubscription(){
  if(!_sbSession){ _uvTier='free'; _uvTrialDaysLeft=0; _uvSubLoaded=true; return; }

  // Check sessionStorage cache (5 min TTL)
  try{
    const cached = sessionStorage.getItem('uv_sub');
    if(cached){
      const c = JSON.parse(cached);
      if(c._ts && Date.now() - c._ts < 300000){
        _applySubData(c);
        return;
      }
    }
  }catch(_){}

  await _sbEnsureFreshToken();
  try{
    const r = await fetch(_SB_URL+'/rest/v1/rpc/get_my_subscription',{
      method:'POST',
      headers:{'apikey':_SB_KEY,'Authorization':_sbAuthHdr(),'Content-Type':'application/json'},
      body:'{}',
    });
    if(r.ok){
      const data = await r.json();
      data._ts = Date.now();
      try{ sessionStorage.setItem('uv_sub', JSON.stringify(data)); }catch(_){}
      _applySubData(data);
    } else {
      _uvTier='free'; _uvSubLoaded=true;
    }
  }catch(e){
    console.warn('[UV sub] fetch failed', e);
    _uvTier='free'; _uvSubLoaded=true;
  }
}

function _applySubData(d){
  _uvTier = d.tier || 'free';
  _uvTrialDaysLeft = d.trialDaysLeft || 0;
  _uvSubDetails = d;
  _uvSubLoaded = true;
  _uvUpdateSidebarLocks();
}

function _uvInvalidateCache(){
  try{ sessionStorage.removeItem('uv_sub'); }catch(_){}
}

// Re-load when auth state changes
_sbOnAuthChange(function(user){
  _uvInvalidateCache();
  if(user) _uvLoadSubscription();
  else { _uvTier='free'; _uvTrialDaysLeft=0; _uvSubLoaded=true; _uvSubDetails=null; }
});

// ── Sidebar lock icons ──────────────────────────────────────────────────────

function _uvUpdateSidebarLocks(){
  document.querySelectorAll('[data-nav]').forEach(function(btn){
    const page = btn.getAttribute('data-nav');
    if(_UV_PAID_PAGES.has(page)){
      const locked = _sbSession && !_uvIsPaid();
      btn.classList.toggle('nav-locked', locked);
    }
  });
}

// ── Upgrade modal ───────────────────────────────────────────────────────────

function _uvShowUpgradeModal(feature){
  const existing = document.getElementById('uv-upgrade-overlay');
  if(existing) existing.remove();

  const label = _UV_FEATURE_LABELS[feature] || feature || 'Full Access';
  const isTrialEligible = !_uvSubDetails?.subStatus;

  const overlay = document.createElement('div');
  overlay.id = 'uv-upgrade-overlay';
  overlay.className = 'uv-upgrade-overlay';
  overlay.innerHTML = `
    <div class="uv-upgrade-card">
      <button class="uv-upgrade-close" onclick="this.closest('.uv-upgrade-overlay').remove()">&times;</button>
      <div class="uv-upgrade-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold,#B8965A)" stroke-width="1.5">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      </div>
      <div class="uv-upgrade-title">Unlock ${_escH(label)}</div>
      <div class="uv-upgrade-sub">This feature is available with Full Access.${
        isTrialEligible ? ' Start your 14-day free trial — no payment required upfront.' : ''
      }</div>
      <div class="uv-upgrade-feats">
        <div class="uv-upgrade-feat">&#10003; Unlimited guests with dietary &amp; meal tracking</div>
        <div class="uv-upgrade-feat">&#10003; Seating plan, calendar &amp; multi-event planning</div>
        <div class="uv-upgrade-feat">&#10003; Full budget with documents &amp; payment plans</div>
        <div class="uv-upgrade-feat">&#10003; Vision board, wishing well &amp; inspiration</div>
        <div class="uv-upgrade-feat">&#10003; Print &amp; export everything</div>
        <div class="uv-upgrade-feat">&#10003; Remove Union Vault branding</div>
      </div>
      <button class="uv-upgrade-cta" onclick="_uvGoCheckout()">${
        isTrialEligible ? 'Start 14-day free trial' : 'Upgrade to Full Access'
      }</button>
      <button class="uv-upgrade-dismiss" onclick="this.closest('.uv-upgrade-overlay').remove()">Continue with free plan</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function _escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Checkout redirect ───────────────────────────────────────────────────────

async function _uvGoCheckout(priceId){
  // If no priceId passed, redirect to the pricing section on the landing page
  // (the user picks their plan there). For now, use a default price.
  // The real priceId will come from settings or the upgrade modal plan selector.
  const pid = priceId || _uvGetDefaultPriceId();
  if(!pid){
    window.location.hash = 'pricing';
    const el = document.getElementById('pricing');
    if(el) el.scrollIntoView({behavior:'smooth'});
    return;
  }

  await _sbEnsureFreshToken();
  try{
    const r = await fetch(_SB_URL+'/functions/v1/create-checkout-session',{
      method:'POST',
      headers:{'Authorization':_sbAuthHdr(),'apikey':_SB_KEY,'Content-Type':'application/json'},
      body: JSON.stringify({priceId: pid}),
    });
    const data = await r.json();
    if(data.url) window.location.href = data.url;
    else console.error('[UV checkout] No URL returned', data);
  }catch(e){
    console.error('[UV checkout] fetch error', e);
  }
}

function _uvGetDefaultPriceId(){
  return typeof UV_STRIPE_MONTHLY_PRICE !== 'undefined' ? UV_STRIPE_MONTHLY_PRICE : '';
}

// ── Landing page pricing pills ──────────────────────────────────────────────

function _uvSelectPricePill(btn){
  document.querySelectorAll('.price-pill').forEach(function(p){ p.classList.remove('active'); });
  btn.classList.add('active');
}

function _uvPricingCTA(){
  if(_sbSession){
    _uvGoCheckout();
  } else {
    var a=document.getElementById('auth');
    if(a){a.scrollIntoView({behavior:'smooth'});setTimeout(function(){document.querySelectorAll('.tab')[1].click();var e=document.getElementById('auth-up-email');if(e)e.focus();},400);}
  }
}

// ── Manage subscription (Settings page helpers) ─────────────────────────────

async function _uvOpenPortal(){
  await _sbEnsureFreshToken();
  const r = await fetch(_SB_URL+'/functions/v1/manage-subscription',{
    method:'POST',
    headers:{'Authorization':_sbAuthHdr(),'apikey':_SB_KEY,'Content-Type':'application/json'},
    body: JSON.stringify({action:'portal'}),
  });
  const data = await r.json();
  if(data.url) window.location.href = data.url;
}

async function _uvCancelSub(){
  await _sbEnsureFreshToken();
  await fetch(_SB_URL+'/functions/v1/manage-subscription',{
    method:'POST',
    headers:{'Authorization':_sbAuthHdr(),'apikey':_SB_KEY,'Content-Type':'application/json'},
    body: JSON.stringify({action:'cancel'}),
  });
  _uvInvalidateCache();
  await _uvLoadSubscription();
}

async function _uvReactivateSub(){
  await _sbEnsureFreshToken();
  await fetch(_SB_URL+'/functions/v1/manage-subscription',{
    method:'POST',
    headers:{'Authorization':_sbAuthHdr(),'apikey':_SB_KEY,'Content-Type':'application/json'},
    body: JSON.stringify({action:'reactivate'}),
  });
  _uvInvalidateCache();
  await _uvLoadSubscription();
}

// ── Checkout return detection ───────────────────────────────────────────────

function _uvCheckReturn(){
  const p = new URLSearchParams(location.search);
  if(p.get('checkout') === 'success'){
    history.replaceState(null,'',location.pathname + location.hash);
    _uvInvalidateCache();
    setTimeout(function(){
      _uvLoadSubscription().then(function(){
        if(typeof showToast === 'function') showToast('Welcome to Full Access!','success');
      });
    }, 1500);
  }
  if(p.get('portal') === 'return'){
    history.replaceState(null,'',location.pathname + location.hash);
    _uvInvalidateCache();
    _uvLoadSubscription();
  }
}
