// INIT — load storage FIRST, then render
// ══════════════════════════════════════════════

// Save on page close/refresh as a safety net
window.addEventListener('beforeunload', saveToStorage);

// Periodic autosave every 30 seconds
setInterval(saveToStorage, 30000);

// Refresh Settings panel on auth state change
_sbOnAuthChange(function(){ if(typeof _currentPage!=='undefined'&&_currentPage==='settings') navigate('settings'); });

// Load persisted data before first render
const alreadySetUp = loadFromStorage();

// On a fresh device with no saved preference, honour the OS dark-mode setting
if(!alreadySetUp && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
  document.body.classList.add('dark');
  // No need to set data-theme — when OS dark mode is the preference we let
  // the media query apply naturally (data-theme is only set to 'light' to
  // block that query when the user has explicitly chosen light mode).
} else if(!alreadySetUp){
  // Fresh device, OS is light mode — mark explicitly so the guard holds
  // even before any preference is saved.
  document.documentElement.setAttribute('data-theme','light');
}

// Sidebar mode — device-aware defaults, each device type remembers its own state
(function _initSidebarMode(){
  const isMobile=window.innerWidth<=900;
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebar-overlay');
  if(isMobile){
    // Mobile: hamburger drawer — ensure icon-sidebar mode from a synced desktop setting is never applied here
    document.body.classList.remove('icon-sidebar');
    const saved=localStorage.getItem('uv_sb_mobile')||'closed';
    sidebar.classList.toggle('collapsed',saved!=='open');
    if(overlay) overlay.classList.toggle('visible',saved==='open');
  } else {
    // Desktop: icon-strip sidebar by default (collapsed=icon-only), remembers full vs icon
    document.body.classList.add('icon-sidebar');
    const saved=localStorage.getItem('uv_sb_desktop')||'icon';
    sidebar.classList.toggle('collapsed',saved!=='full');
  }
})();
// Switch sidebar mode when window crosses the mobile/desktop breakpoint
window.addEventListener('resize',(function(){
  let wasDesktop=window.innerWidth>900;
  return function(){
    const isDesktop=window.innerWidth>900;
    if(isDesktop===wasDesktop) return;
    wasDesktop=isDesktop;
    const sidebar=document.getElementById('sidebar');
    const overlay=document.getElementById('sidebar-overlay');
    if(isDesktop){
      document.body.classList.add('icon-sidebar');
      const saved=localStorage.getItem('uv_sb_desktop')||'icon';
      sidebar.classList.toggle('collapsed',saved!=='full');
      if(overlay){overlay.classList.remove('visible');}
    } else {
      document.body.classList.remove('icon-sidebar');
      const saved=localStorage.getItem('uv_sb_mobile')||'closed';
      sidebar.classList.toggle('collapsed',saved!=='open');
      if(overlay) overlay.classList.toggle('visible',saved==='open');
    }
  };
})());

// Auto-mark any past-due installments on load (when enabled) so totals are correct
// from the dashboard onward.
try{ if(_autoCheckPassedInstallments()) saveToStorage(); }catch(e){}

// Load subscription tier state and detect checkout return
if(typeof _uvLoadSubscription==='function') _uvLoadSubscription();
if(typeof _uvCheckReturn==='function') _uvCheckReturn();

/* ══════════════════════════════════════════════════════════════════════════
   STAGE 5 — PUBLIC PAGES (RSVP form + Vendor portal)
   These functions render a full-page experience that replaces the normal
   app shell. They are called from boot() when URL params are detected,
   and they never touch localStorage, STATE, or any planner internals.

   SQL required in Supabase dashboard (run once):
   ────────────────────────────────────────────────
   CREATE TABLE rsvp_responses (
     id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     couple_id   uuid NOT NULL REFERENCES auth.users(id),
     guest_name  text NOT NULL,
     email       text,
     phone       text,
     address     text,
     attending   text CHECK (attending IN ('yes','no')),
     dietary     text[],
     message     text,
     created_at  timestamptz DEFAULT now()
   );
   ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "couple reads own rsvps" ON rsvp_responses
     FOR SELECT USING (auth.uid() = couple_id);
   CREATE POLICY "public can submit rsvp" ON rsvp_responses
     FOR INSERT WITH CHECK (true);

   CREATE TABLE vendor_tokens (
     token       text PRIMARY KEY DEFAULT encode(gen_random_bytes(24),'hex'),
     couple_id   uuid NOT NULL REFERENCES auth.users(id),
     vendor_name text,
     sections    text[],
     expires_at  timestamptz,
     created_at  timestamptz DEFAULT now()
   );
   ALTER TABLE vendor_tokens ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "couple manages tokens" ON vendor_tokens
     USING (auth.uid() = couple_id);
   CREATE POLICY "public reads by token" ON vendor_tokens
     FOR SELECT USING (true);
   ──────────────────────────────────────────────── */

// ── Helpers shared by public pages ──────────────────────────────────────────

function _publicPageShell(innerHtml){
  document.body.innerHTML = innerHtml;
  document.documentElement.style.overflow = 'auto';
  document.documentElement.style.height = 'auto';
  document.body.style.overflow = 'auto';
  document.body.style.height = 'auto';
}

// ── _showPublicWeddingSite: full wedding website rendered from a slug ──────────
async function _showPublicWeddingSite(slug){
  document.body.style.background='var(--cream,#FBF8F3)';
  // Look up which couple owns this slug
  let uid=null;
  try{
    const r1=await fetch(`${_SB_URL}/rest/v1/planner_data?select=user_id&section=eq.website&data->>slug=eq.${encodeURIComponent(slug)}&limit=1`,{
      headers:{'apikey':_SB_KEY,'Authorization':'Bearer '+_SB_KEY}
    });
    if(r1.ok){ const rows=await r1.json(); if(rows&&rows[0]) uid=rows[0].user_id; }
  }catch(e){ console.warn('Slug lookup failed',e); }

  if(!uid){
    document.body.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Inter',sans-serif;color:#999;flex-direction:column;gap:12px;text-align:center;padding:40px"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".4"><circle cx="12" cy="12" r="9"/><path d="M12 9v4"/><circle cx="12" cy="16.5" r=".5" fill="currentColor"/></svg><div style="font-size:15px;font-weight:500">Wedding site not found</div><div style="font-size:12.5px;color:#bbb">The link may have changed or the site is not yet published.</div></div>`;
    document.body.style.visibility='visible';
    return;
  }

  // Preserve full guest data before public RPC may overwrite it
  const _fullGuests = STATE.guests;

  // Fetch the sections needed to build the site
  try{
    const [r2, _ex]=await Promise.all([
      fetch(`${_SB_URL}/rest/v1/planner_data?select=section,data&user_id=eq.${encodeURIComponent(uid)}&section=in.(website,event,timeline,inspo)`,{
        headers:{'apikey':_SB_KEY,'Authorization':'Bearer '+_SB_KEY}
      }),
      _publicWeddingExtras(uid)
    ]);
    if(Array.isArray(_ex.guests)) STATE.guests=_ex.guests;
    if(_ex.wishingwell && typeof _ex.wishingwell==='object') STATE.wishingwell=_ex.wishingwell;
    if(r2.ok){
      const rows=await r2.json();
      rows.forEach(r=>{
        if(r.section==='website')    STATE.website=r.data||{};
        if(r.section==='event')      STATE.event=r.data||{};
        if(r.section==='timeline')   STATE.timeline=r.data||[];
        if(r.section==='guests')     STATE.guests=r.data||[];
        if(r.section==='wishingwell')STATE.wishingwell=r.data||{};
        if(r.section==='inspo')      STATE.inspo=r.data||{};
      });
    }
  }catch(e){ console.warn('Site data fetch failed',e); }

  // Check publish gate — unpublished sites are private to the owner
  const _isOwner = _sbSession && _sbSession.user && _sbSession.user.id === uid;
  _wbSite(); // normalise STATE.website (ensures w.published defaults to false)
  if(!STATE.website.published && !_isOwner){
    const ev=STATE.event||{};
    const names=[ev.partner1,ev.partner2].filter(Boolean).join(' & ')||'This wedding site';
    document.body.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Inter',sans-serif;flex-direction:column;gap:18px;text-align:center;padding:40px;background:#FBF8F3">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="1.2" stroke-linecap="round" opacity=".7"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <div style="font-size:17px;font-weight:500;color:#4A3F35">${_escHtml(names)}</div>
      <div style="font-size:13.5px;color:#9A8C7A;max-width:280px;line-height:1.6">This site is coming soon. Check back later!</div>
    </div>`;
    STATE.guests = _fullGuests;
    document.body.style.visibility='visible';
    return;
  }

  _wbPublicOwnerUid = uid;

  // If the owner is viewing their own site (session is loaded and UID matches),
  // pre-generate signed URLs for all website media so images resolve without
  // needing the bucket to be public.
  if(_sbSession && _sbSession.user && _sbSession.user.id === uid){
    await _sbEnsureFreshToken();
    const _collectIds = (obj, out) => {
      if(!obj || typeof obj !== 'object') return;
      if(Array.isArray(obj)){ obj.forEach(v=>_collectIds(v,out)); return; }
      Object.entries(obj).forEach(([k,v])=>{
        if(k==='mediaId' && v && typeof v==='string' && !v.startsWith('http') && !v.startsWith('data:')) out.add(v);
        else if(typeof v==='object') _collectIds(v,out);
      });
    };
    const ids = new Set();
    _collectIds(STATE.website, ids);
    _collectIds(STATE.inspo, ids);
    await Promise.all([...ids].map(id=>_sbPhotoSignedUrl(id)));
  }

  const html=_wbBuildSite();
  _wbPublicOwnerUid = null;
  STATE.guests = _fullGuests; // restore before document.open() can trigger beforeunload auto-sync
  document.open();
  document.write(html);
  document.close();
}

function _publicCss(accentHex, pageHex, bandHex, inkHex, textHex, headFont, bodyFont){
  // Returns a <style> block injecting the couple's wedding website palette
  // so the public RSVP/vendor pages feel on-brand.
  const a = accentHex||'#C9A227';
  const pg= pageHex ||'#E8DDD0';
  const bd= bandHex ||'#DDD3C4';
  const ink=inkHex  ||'#4A3F35';
  const txt=textHex ||'#5A5148';
  const hf= headFont||"'Cormorant Garamond',serif";
  const bf= bodyFont||"'Inter',sans-serif";
  return `<style>
    *,*::before,*::after{box-sizing:border-box}
    :root{
      --pub-page:${pg};--pub-band:${bd};--pub-accent:${a};
      --pub-ink:${ink};--pub-text:${txt};
      --pub-surface:color-mix(in srgb,${pg} 60%,#fff 40%);
      --pub-border:color-mix(in srgb,${a} 25%,#ccc 75%);
      --pub-btn:${a};--pub-btn-fg:#fff;
      --pub-radius:11px;
    }
    @media(prefers-color-scheme:dark){
      :root:not([data-theme="light"]){
        --pub-page:#1C1C22;--pub-band:#26252B;--pub-accent:#B0A085;
        --pub-ink:#D2CEC6;--pub-text:#9A9389;
        --pub-surface:#1E1E24;--pub-border:#2E2D33;
        --pub-btn:#B0A085;--pub-btn-fg:#1C1C22;
        color-scheme:dark;
      }
    }
    :root[data-theme="dark"]{
      --pub-page:#1C1C22;--pub-band:#26252B;--pub-accent:#B0A085;
      --pub-ink:#D2CEC6;--pub-text:#9A9389;
      --pub-surface:#1E1E24;--pub-border:#2E2D33;
      --pub-btn:#B0A085;--pub-btn-fg:#1C1C22;
      color-scheme:dark;
    }
    :root[data-theme="light"]{
      --pub-page:#E8DDD0;--pub-band:#DDD3C4;--pub-accent:${a};
      --pub-ink:#4A3F35;--pub-text:#5A5148;
      --pub-surface:color-mix(in srgb,#E8DDD0 60%,#fff 40%);
      --pub-border:color-mix(in srgb,${a} 25%,#ccc 75%);
      color-scheme:light;
    }
    body{margin:0;background:var(--pub-page);color:var(--pub-ink);font-family:${bf};font-size:14px;min-height:100vh}
    .pub-theme-btn{position:fixed;top:14px;right:14px;z-index:999;display:inline-flex;align-items:center;gap:5px;padding:6px 11px;font-size:11.5px;font-weight:500;font-family:${bf};border:1px solid var(--pub-border);border-radius:8px;background:var(--pub-surface);color:var(--pub-text);cursor:pointer;transition:all .15s}
    .pub-theme-btn:hover{color:var(--pub-ink);border-color:var(--pub-accent)}
    .pub-header{background:var(--pub-band);padding:40px 24px 32px;text-align:center;border-bottom:1px solid var(--pub-border)}
    .pub-eyebrow{font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--pub-accent);margin-bottom:10px}
    .pub-couple{font-family:${hf};font-size:32px;font-weight:500;color:var(--pub-ink);line-height:1.15;margin-bottom:8px}
    .pub-dateline{font-size:12.5px;color:var(--pub-text);letter-spacing:.03em}
    .pub-divider{width:44px;height:1px;background:var(--pub-accent);opacity:.6;margin:14px auto 0}
    .pub-body{padding:28px 24px;max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
    .pub-label{font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--pub-accent);margin-bottom:6px}
    .pub-label .opt{color:var(--pub-text);font-weight:400;text-transform:none;letter-spacing:0;font-size:11px}
    .pub-input,.pub-select,.pub-textarea{width:100%;padding:11px 14px;font-size:13.5px;font-family:${bf};color:var(--pub-ink);background:var(--pub-surface);border:1px solid var(--pub-border);border-radius:9px;outline:none;transition:border-color .15s,box-shadow .15s}
    .pub-input:focus,.pub-select:focus,.pub-textarea:focus{border-color:var(--pub-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--pub-accent) 20%,transparent 80%)}
    .pub-input::placeholder,.pub-textarea::placeholder{color:var(--pub-text);opacity:.7}
    .pub-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239A9389' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:calc(100% - 12px) center;padding-right:32px;cursor:pointer}
    .pub-textarea{resize:vertical;min-height:80px}
    .pub-attend-pills{display:flex;gap:8px;flex-wrap:wrap}
    .pub-attend-pill{flex:1;min-width:120px;padding:10px 12px;border:1px solid var(--pub-border);border-radius:9px;background:var(--pub-surface);font-size:12.5px;font-weight:500;color:var(--pub-text);cursor:pointer;text-align:center;transition:all .15s;font-family:${bf};user-select:none}
    .pub-attend-pill:hover{border-color:var(--pub-accent);color:var(--pub-ink)}
    .pub-attend-pill.yes{border-color:#4A7C59;background:rgba(74,124,89,.1);color:#4A7C59;font-weight:600}
    .pub-attend-pill.no{border-color:#C0392B;background:rgba(192,57,43,.08);color:#C0392B;font-weight:600}
    .pub-diet-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
    .pub-diet-chip{display:flex;align-items:center;gap:8px;padding:9px 11px;border:1px solid var(--pub-border);border-radius:8px;background:var(--pub-surface);font-size:12.5px;color:var(--pub-text);cursor:pointer;transition:all .15s;user-select:none}
    .pub-diet-chip:hover{border-color:var(--pub-accent);color:var(--pub-ink)}
    .pub-diet-chip.on{border-color:var(--pub-accent);background:color-mix(in srgb,var(--pub-accent) 12%,transparent 88%);color:var(--pub-ink)}
    .pub-diet-check{width:14px;height:14px;border:1.5px solid var(--pub-border);border-radius:4px;background:var(--pub-page);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
    .pub-diet-chip.on .pub-diet-check{background:var(--pub-accent);border-color:var(--pub-accent)}
    .pub-diet-check svg{opacity:0;transition:opacity .15s}
    .pub-diet-chip.on .pub-diet-check svg{opacity:1}
    .pub-submit{width:100%;padding:14px;background:var(--pub-btn);color:var(--pub-btn-fg);border:none;border-radius:10px;font-size:14px;font-weight:600;font-family:${bf};letter-spacing:.02em;cursor:pointer;transition:opacity .15s,transform .1s}
    .pub-submit:hover:not(:disabled){opacity:.88}
    .pub-submit:disabled{opacity:.55;cursor:not-allowed}
    .pub-footer{text-align:center;font-size:11.5px;color:var(--pub-text);padding-bottom:8px}
    .pub-addr-row{display:grid;grid-template-columns:1fr 70px 90px;gap:7px;margin-top:7px}
    .pub-addr-hint{font-size:11px;color:var(--pub-text);margin-top:5px}
    .pub-msg-box{padding:16px;border-radius:12px;text-align:center;font-size:14px;line-height:1.6}
    .pub-msg-box.success{background:rgba(74,124,89,.12);border:1px solid rgba(74,124,89,.3);color:#4A7C59}
    .pub-msg-box.expired{background:var(--pub-surface);border:1px solid var(--pub-border);color:var(--pub-text)}
    .pub-ring{width:56px;height:56px;border-radius:50%;border:1.5px solid var(--pub-accent);opacity:.7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:var(--pub-accent)}
    @media(max-width:480px){.pub-addr-row{grid-template-columns:1fr 60px 75px}.pub-couple{font-size:26px}.pub-body{padding:20px 16px}}
    .pub-ac-wrap{position:relative}
    .pub-ac-list{display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--pub-page);border:1px solid var(--pub-accent);border-radius:9px;box-shadow:0 6px 22px rgba(0,0,0,.12);list-style:none;margin:0;padding:4px 0;z-index:99;max-height:200px;overflow-y:auto}
    .pub-ac-item{padding:10px 14px;font-size:13px;color:var(--pub-ink);cursor:pointer;transition:background .1s;font-family:${bf}}
    .pub-ac-item:hover,.pub-ac-item.focused{background:color-mix(in srgb,var(--pub-accent) 15%,transparent 85%)}
    .pub-ac-none{padding:10px 14px;font-size:12.5px;color:var(--pub-text);font-style:italic;font-family:${bf}}
  </style>`;
}

function _pubToggleTheme(){
  const r=document.documentElement;
  r.setAttribute('data-theme', r.getAttribute('data-theme')==='dark'?'light':'dark');
}

// ── _showRsvpExpired: legacy ?rsvp=true link ─────────────────────────────────
function _showRsvpExpired(){
  _publicPageShell(`
    ${_publicCss()}
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 24px">
      <div style="max-width:400px;width:100%;text-align:center">
        <div class="pub-ring">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="pub-eyebrow">This link has been updated</div>
        <div class="pub-couple" style="font-size:22px;margin-bottom:10px">RSVP link expired</div>
        <div style="font-size:13.5px;color:var(--pub-text);line-height:1.6;margin-bottom:20px">
          This RSVP link is no longer valid. The couple may have regenerated a new link.<br>
          Please contact them directly to receive the updated link.
        </div>
        <div class="pub-footer" style="margin-top:8px">Powered by <strong style="color:var(--pub-ink)">Union Vault</strong></div>
      </div>
    </div>`);
}

// ── _showRsvpForm: public RSVP form for guests ───────────────────────────────
const _RSVP_PALS={
  sage:    {bg:'#E8EDEA',surf:'#D2DDD7',accent:'#5C7D6B',ink:'#2D3D35'},
  ivory:   {bg:'#F5F0E8',surf:'#EDE6D8',accent:'#A08050',ink:'#3A3020'},
  blush:   {bg:'#F5EDE9',surf:'#EDD9D2',accent:'#C0745A',ink:'#3D2820'},
  midnight:{bg:'#1A1E2A',surf:'#252A38',accent:'#7B95C8',ink:'#D0D8E8'},
  slate:   {bg:'#1E2226',surf:'#272D32',accent:'#8AA4A8',ink:'#CAD3D6'},
};
function _isDarkHex(hex){
  const h=(hex||'').replace('#',''); if(h.length<6) return false;
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  return (r*0.299+g*0.587+b*0.114)<128;
}
async function _showRsvpForm(coupleId,mode){
  // mode: 'page' (default — for ?rsvp= URL) | 'modal' (preview from within app)
  let eventName='',eventDate='',eventVenue='',theme={},guestObjs=[],rsvp={},rfields={};
  let sec={};
  try{
    const [res, _ex]=await Promise.all([
      fetch(`${_SB_URL}/rest/v1/planner_data?select=section,data&user_id=eq.${encodeURIComponent(coupleId)}&section=in.(event,website)`,{
        headers:{'apikey':_SB_KEY,'Authorization':'Bearer '+_SB_KEY}
      }),
      _publicWeddingExtras(coupleId)
    ]);
    sec.guests=_ex.guests||[]; sec.families=_ex.families||[]; sec.settings=_ex.settings||{};
    if(res.ok){
      const rows=await res.json();
      (rows||[]).forEach(r=>{sec[r.section]=r.data;});
      const ev=sec.event||{};
      const p1=ev.partner1||'',p2=ev.partner2||'';
      eventName=(p1&&p2)?`${p1} & ${p2}`:(p1||p2||'');
      eventDate=ev.date||'';
      eventVenue=ev.venue||'';
      theme=(sec.website&&sec.website.theme)||{};
      rsvp=(sec.website&&sec.website.rsvp)||{};
      rfields=rsvp.fields||{};
      // Build guest objects with relationship data for group RSVP
      const _famData=sec.families||[];
      guestObjs=(sec.guests||[])
        .filter(g=>(g.listType||'A')!=='B'&&g.name)
        .map(g=>{
          const fam=_famData.find(f=>f.memberIds&&f.memberIds.includes(g.id));
          const groupIds=fam?fam.memberIds.filter(id=>id!==g.id):[];
          return {id:g.id,name:g.name.trim(),coupleId:g.coupleId||null,plusOneId:g.plusOneId||null,plusOne:!!g.plusOne,groupIds,ageBand:g.ageBand||'adult'};
        });
    }
  }catch(e){console.warn('RSVP data fetch failed',e);}

  const dateStr=eventDate?(()=>{
    const d=new Date(eventDate+'T00:00:00');if(isNaN(d))return'';
    return d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  })():'';

  const mealOn=!!(sec.settings&&sec.settings.mealChoiceOn)&&Array.isArray(sec.settings.mealOptions)&&(sec.settings.mealOptions||[]).filter(x=>String(x||'').trim()).length>0;
  const mealOpts=mealOn?(sec.settings.mealOptions||[]).filter(x=>String(x||'').trim()):[];
  const rfEmailNotif=!((sec.settings&&sec.settings.rsvpEmailOn===false));
  const mealHtml=mealOpts.map(o=>`<button type="button" class="rf-meal-chip" onclick="_rfPickMeal(this)" data-meal="${o.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}">${o.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</button>`).join('');
  const childMealOn=mealOn&&sec.settings.childrenMealOn!==false&&(sec.settings.childrenMealOptions||[]).filter(x=>String(x||'').trim()).length>0;
  const childrenMealEnabled=mealOn&&sec.settings.childrenMealOn!==false;
  const childMealOpts=childMealOn?(sec.settings.childrenMealOptions||[]).filter(x=>String(x||'').trim()):[];
  const childMealHtml=childMealOpts.map(o=>`<button type="button" class="rf-meal-chip" onclick="_rfPickMeal(this)" data-meal="${o.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}">${o.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</button>`).join('');

  const guestNames=[...guestObjs].map(g=>g.name).sort((a,b)=>a.localeCompare(b));
  const guestNamesJson=JSON.stringify(guestNames);
  const guestObjsJson=JSON.stringify(guestObjs);

  const dietOptions=[
    ['vegetarian','Vegetarian'],['pescatarian','Pescatarian'],['vegan','Vegan'],
    ['halal','Halal'],['kosher','Kosher'],['lactose','Lactose intolerant'],
    ['gluten','Gluten intolerant'],['allergy','Allergy'],['other','Other']
  ];
  const dietHtml=dietOptions.map(([k,lbl])=>`
    <div class="rf-diet-chip" onclick="${(k==='other'||k==='allergy')?'_rfNoteToggle(this)':"this.classList.toggle('on')"}" data-diet="${k}">
      <span class="rf-chk"><svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="2,6 5,9 10,3"/></svg></span>${lbl}
    </div>`).join('')
  +`<input class="rf-inp rf-diet-note" data-for="allergy" type="text" placeholder="Please describe your allergy…" style="display:none;flex-basis:100%;margin-top:6px">`
  +`<input class="rf-inp rf-diet-note" data-for="other" type="text" placeholder="Please describe your dietary requirement…" style="display:none;flex-basis:100%;margin-top:6px">`;

  const _hf=theme.headFont||"'Cormorant Garamond',serif";
  const _bf=theme.bodyFont||"'Inter',sans-serif";
  const btnYes=rsvp.btnYes||'Joyfully accepts';
  const btnNo=rsvp.btnNo||'Regretfully declines';

  const _palC=(()=>{const _p=rsvp.palette;return _p==='custom'?(rsvp.customColors||{}):(_RSVP_PALS[_p]||null);})();
  const _palDark=_palC?_isDarkHex(_palC.bg||'#fff'):null;
  const paletteStyle=(()=>{
    if(!_palC)return'';
    const _dk=_palDark,_bfg=_isDarkHex(_palC.accent||'#888')?'#fff':'#1a1a1a';
    return`<style>:root,:root[data-theme="light"],:root[data-theme="dark"]{--pub-page:${_palC.bg||'#e8ddd0'}!important;--pub-band:${_palC.surf||_palC.bg||'#ded6c8'}!important;--pub-surface:${_palC.surf||_palC.bg||'#ede6d8'}!important;--pub-accent:${_palC.accent||'#a08050'}!important;--pub-ink:${_palC.ink||'#3a3020'}!important;--pub-text:${_palC.ink||'#3a3020'}!important;--pub-btn:${_palC.accent||'#a08050'}!important;--pub-btn-fg:${_bfg}!important;color-scheme:${_dk?'dark':'light'}!important}body{background:${_palC.bg||'#e8ddd0'}!important;color:${_palC.ink||'#3a3020'}!important}</style>`;
  })();
  // Logo data for footer — light crest = dark ink (use on light bg), dark crest = light ink (use on dark bg)
  const _uvCrestLight='data:image/png;base64,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';
  const _uvCrestDark='data:image/png;base64,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';

  const isModal=mode==='modal';
  const htmlContent=`
    ${_publicCss(theme.accent,theme.page,theme.band,theme.heading,theme.text,theme.headFont,theme.bodyFont)}
    ${paletteStyle}
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500&display=swap" rel="stylesheet">
    <style>
      *,*::before,*::after{box-sizing:border-box}
      html,body{margin:0;padding:0}
      html{background:var(--pub-page,#F5F0E8)}
      body{background:var(--pub-page,#F5F0E8);min-height:100vh;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
      :root{
        --rw-hdr:var(--pub-surface,#FAF7F2);--rw-hdr-ink:var(--pub-ink,#2E2418);--rw-hdr-muted:var(--pub-text,#7A6E5E);--rw-hdr-rule:var(--pub-border,#C8BFB0);
        --rw-step-done:var(--rw-accent,#9B6F42);--rw-step-active-bg:var(--rw-accent,#9B6F42);--rw-step-active-fg:var(--rw-btn-fg,#fff);
        --rw-bg:var(--pub-page,#F5F0E8);--rw-card:var(--pub-surface,#FAF7F2);
        --rw-ink:var(--pub-ink,#2E2418);--rw-muted:var(--pub-text,#7A6E5E);
        --rw-border:var(--pub-border,#C8BFB0);--rw-accent:var(--pub-accent,#9B6F42);
        --rw-btn:var(--pub-btn,var(--pub-accent,#9B6F42));--rw-btn-fg:var(--pub-btn-fg,#fff);
      }
      .rw-hdr{background:var(--rw-hdr);padding:36px max(16px,env(safe-area-inset-left,0px)) 28px;text-align:center;border-bottom:1px solid var(--rw-hdr-rule)}
      .rw-body{background:var(--rw-bg);min-height:60vh;padding:28px max(16px,env(safe-area-inset-left,0px)) 96px;max-width:480px;margin:0 auto}
      .rw-eyebrow{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--rw-hdr-muted);margin:0 0 10px;font-weight:400;font-family:'Cormorant Garamond',Georgia,serif}
      .rw-couple{font-family:'Cormorant Garamond','${_hf}',Georgia,serif;font-size:clamp(28px,7vw,42px);font-weight:500;color:var(--rw-hdr-ink);margin:0 0 8px;line-height:1.2;text-wrap:balance}
      .rw-meta{font-size:12.5px;color:var(--rw-hdr-muted);margin:0;letter-spacing:.02em}
      .rw-step-bar{display:flex;align-items:center;justify-content:center;gap:0;margin-top:24px}
      .rw-step-item{display:flex;flex-direction:column;align-items:center;gap:5px}
      .rw-conn{flex:1;max-width:48px;height:1px;background:var(--rw-hdr-rule);margin:0 4px;position:relative;top:-10px}
      .rw-conn.rw-done{background:var(--rw-step-done)}
      .rw-sn{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600}
      .rw-sn.rw-pending{background:transparent;border:1.5px solid var(--rw-hdr-rule);color:var(--rw-hdr-muted)}
      .rw-sn.rw-active{background:var(--rw-step-active-bg);color:var(--rw-step-active-fg);border:none}
      .rw-sn.rw-done{background:var(--rw-step-done);color:var(--rw-step-active-fg);border:none;font-size:11px}
      .rw-sl{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--rw-hdr-muted);white-space:nowrap}
      .rw-sl.rw-active{color:var(--rw-hdr-ink);font-weight:600}
      .rw-sl.rw-done{color:var(--rw-step-done)}
      .rw-page{display:none}.rw-page.rw-active{display:block}
      .rw-page-title{font-size:15px;font-weight:600;color:var(--rw-ink);margin:0 0 16px}
      .pub-ac-wrap{position:relative}
      .pub-ac-list{position:absolute;top:calc(100% + 4px);left:0;right:0;margin:0;padding:4px;list-style:none;background:var(--rw-card);border:1.5px solid var(--rw-border);border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.14);z-index:50;display:none;max-height:200px;overflow-y:auto}
      .pub-ac-item{padding:9px 12px;border-radius:7px;cursor:pointer;font-size:13.5px;color:var(--rw-ink)}
      .pub-ac-item.focused,.pub-ac-item:hover{background:color-mix(in srgb,var(--rw-accent) 10%,transparent 90%)}
      .pub-ac-none{padding:9px 12px;font-size:13px;color:var(--rw-muted);list-style:none}
      .rw-inp{width:100%;padding:11px 14px;font-size:14px;font-family:inherit;color:var(--rw-ink);background:var(--rw-card);border:1.5px solid var(--rw-border);border-radius:10px;outline:none;transition:border-color .15s,box-shadow .15s;display:block}
      .rw-inp:focus{border-color:var(--rw-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--rw-accent) 16%,transparent 84%)}
      .rw-inp::placeholder{color:var(--rw-muted);opacity:.65}
      .rw-hint{font-size:11.5px;color:var(--rw-muted);opacity:.85;margin-top:8px}
      .rw-hint a{color:var(--rw-accent);text-decoration:none}
      .rw-name-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--rw-card);border-radius:10px;border:1.5px solid var(--rw-border);margin-bottom:16px}
      .rw-nb-name{font-size:14px;font-weight:500;color:var(--rw-ink)}
      .rw-nb-change{background:none;border:none;font-size:12px;color:var(--rw-accent);cursor:pointer;font-family:inherit;padding:0}
      .rw-attend-label{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--rw-muted);margin:0 0 12px}
      .rf-member-row{padding:12px 0;border-bottom:1px solid var(--rw-border)}
      .rf-member-row:last-child{border-bottom:none}
      .rf-member-name{font-family:'Cormorant Garamond','${_hf}',Georgia,serif;font-size:16px;font-weight:500;color:var(--rw-ink);margin-bottom:8px}
      .rf-pills{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}
      .rf-pill{padding:10px;border-radius:8px;border:1.5px solid var(--rw-border);background:var(--rw-card);text-align:center;cursor:pointer;font-size:13px;font-weight:500;color:var(--rw-ink);transition:all .15s;user-select:none;-webkit-user-select:none;font-family:inherit}
      .rf-pill:hover{border-color:var(--rw-accent)}
      .rf-pill.yes{background:#EAF3EC;border-color:#3D9454;color:#1F6B38}
      .rf-pill.no{background:#F7EFED;border-color:#C05840;color:#8B3324}
      .rw-nav{display:flex;align-items:center;justify-content:space-between;margin-top:28px;gap:12px}
      .rw-btn-back{background:none;border:none;font-size:14px;font-weight:500;color:var(--rw-muted);cursor:pointer;font-family:inherit;padding:4px 0}
      .rw-btn-back:hover{color:var(--rw-ink)}
      .rw-btn-back.rw-invisible{visibility:hidden}
      .rw-btn-next{padding:12px 28px;background:var(--rw-btn);color:var(--rw-btn-fg);border:none;border-radius:10px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;transition:opacity .15s;min-width:120px;text-align:center}
      .rw-btn-next:hover{opacity:.88}
      .rw-btn-next:disabled{opacity:.45;cursor:not-allowed}
      .rw-field-group{margin-bottom:16px}
      .rw-field-lbl{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--rw-muted);margin:0 0 8px}
      .rw-field-hint{font-size:12px;color:var(--rw-muted);font-style:italic;margin:4px 0 0}
      .rw-meal-row{display:flex;flex-wrap:wrap;gap:8px}
      .rw-gdb{padding:12px 0}
      .rw-gdb.rw-gdb-sep{border-top:1px solid var(--rw-border)}
      .rw-gdb-name{font-family:'Cormorant Garamond','${_hf}',Georgia,serif;font-size:16px;font-weight:600;color:var(--rw-ink);margin:0 0 10px}
      .rf-meal-chips{display:flex;flex-wrap:wrap;gap:8px}
      .rf-meal-chip{padding:8px 16px;border-radius:20px;border:1.5px solid var(--rw-border);background:var(--rw-card);font-size:13px;font-weight:500;color:var(--rw-ink);cursor:pointer;transition:all .15s;font-family:inherit}
      .rf-meal-chip:hover{border-color:var(--rw-accent)}
      .rf-meal-chip.on{border-color:var(--rw-accent);background:color-mix(in srgb,var(--rw-accent) 14%,var(--rw-card) 86%)}
      .rw-diet-toggle{display:flex;align-items:center;justify-content:space-between;width:100%;padding:4px 0;background:none;border:none;cursor:pointer;font-family:inherit;text-align:left}
      .rw-dt-label{font-size:13px;font-weight:500;color:var(--rw-ink);display:flex;align-items:center;gap:6px}
      .rw-dt-count{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:var(--rw-accent);color:var(--rw-btn-fg,#fff);font-size:10px;font-weight:700;opacity:0}
      .rw-dt-count.rw-show{opacity:1}
      .rw-dt-chevron{transition:transform .2s;flex-shrink:0;color:var(--rw-muted)}
      .rw-diet-accordion.rw-open .rw-dt-chevron{transform:rotate(180deg)}
      .rw-diet-body{display:none;padding:10px 0 4px}
      .rw-chip-row{display:flex;flex-wrap:wrap;gap:7px}
      .rf-diet-chip{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1.5px solid var(--rw-border);background:var(--rw-card);font-size:12.5px;color:var(--rw-ink);cursor:pointer;transition:all .15s;user-select:none;-webkit-user-select:none}
      .rf-diet-chip:hover{border-color:var(--rw-accent)}
      .rf-diet-chip.on{background:color-mix(in srgb,var(--rw-accent) 12%,var(--rw-card) 88%);border-color:var(--rw-accent)}
      .rf-chk{width:13px;height:13px;border-radius:3px;border:1.5px solid var(--rw-border);background:var(--rw-card);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
      .rf-diet-chip.on .rf-chk{background:var(--rw-accent);border-color:var(--rw-accent);color:var(--rw-btn-fg,#fff)}
      .rf-chk svg{visibility:hidden}.rf-diet-chip.on .rf-chk svg{visibility:visible}
      .rf-diet-note{width:100%;margin-top:6px;padding:9px 12px;font-size:13px;font-family:inherit;color:var(--rw-ink);background:var(--rw-card);border:1.5px solid var(--rw-border);border-radius:8px;outline:none}
      .rw-addr-row{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin-top:8px}
      .rw-inp+.rw-inp{margin-top:8px}
      .rw-confirm-card{text-align:center;padding:52px 24px 36px}
      .rw-confirm-icon{font-size:28px;margin-bottom:16px;color:var(--rw-accent)}
      .rw-confirm-title{font-family:'Cormorant Garamond','${_hf}',Georgia,serif;font-size:26px;font-weight:500;color:var(--rw-ink);margin:0 0 10px}
      .rw-confirm-sub{font-size:14px;color:var(--rw-muted);margin:0}
      .rf-footer{position:fixed;bottom:0;left:0;right:0;padding:8px 20px ${isModal?'8px':'calc(env(safe-area-inset-bottom,0px) + 8px)'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:linear-gradient(transparent,color-mix(in srgb,var(--rw-bg) 88%,transparent 12%) 30%,var(--rw-bg) 100%);pointer-events:none}
      .uv-ft-lbl{font-size:9px;letter-spacing:.1em;color:var(--rw-muted);opacity:.5;text-transform:uppercase;line-height:1}
      .uv-ft-lock{display:inline-flex;align-items:center;gap:6px;pointer-events:auto}
      .uv-ft-lock a{display:inline-flex;align-items:center;gap:6px;text-decoration:none;opacity:.55;transition:opacity .15s}
      .uv-ft-lock a:hover{opacity:.85}
      .uv-ft-crest{width:22px;height:auto;display:block;flex-shrink:0}
      .uv-ft-crest-light{display:block}.uv-ft-crest-dark{display:none}
      .uv-ft-txt{display:flex;flex-direction:column;align-items:flex-start;line-height:1.05;font-family:'Cinzel',serif;font-weight:400}
      .uv-ft-txt b{font-size:11px;letter-spacing:.1em;font-weight:400;color:var(--rw-ink)}
      .uv-ft-txt i{font-size:7.5px;letter-spacing:.18em;font-style:normal;color:var(--rw-muted)}
      @media(prefers-color-scheme:dark){.rf-footer:not([data-uv-scheme="light"]) .uv-ft-crest-light{display:none}.rf-footer:not([data-uv-scheme="light"]) .uv-ft-crest-dark{display:block}}
      .rf-footer[data-uv-scheme="dark"] .uv-ft-crest-light{display:none}.rf-footer[data-uv-scheme="dark"] .uv-ft-crest-dark{display:block}
      .rf-footer[data-uv-scheme="light"] .uv-ft-crest-dark{display:none}.rf-footer[data-uv-scheme="light"] .uv-ft-crest-light{display:block}
    </style>
    <div class="rw-hdr">
      <p class="rw-eyebrow">You&#8217;re invited to the wedding of</p>
      <h1 class="rw-couple">${eventName||'Wedding RSVP'}</h1>
      ${dateStr||eventVenue?`<p class="rw-meta">${[dateStr,eventVenue].filter(Boolean).join(' · ')}</p>`:''}
      <div class="rw-step-bar" id="rw-step-bar">
        <div class="rw-step-item"><div class="rw-sn rw-active" id="rw-sn1">1</div><span class="rw-sl rw-active" id="rw-sl1">Attending</span></div>
        <div class="rw-conn" id="rw-c1"></div>
        <div class="rw-step-item"><div class="rw-sn rw-pending" id="rw-sn2">2</div><span class="rw-sl" id="rw-sl2">Details</span></div>
        <div class="rw-conn" id="rw-c2"></div>
        <div class="rw-step-item"><div class="rw-sn rw-pending" id="rw-sn3">3</div><span class="rw-sl" id="rw-sl3">Contact</span></div>
      </div>
    </div>
    <div class="rw-body">
      <div class="rw-page rw-active" id="rw-p1">
        <div id="rw-search-block">
          <p class="rw-page-title">Find your name</p>
          <div class="pub-ac-wrap">
            <input class="rw-inp" id="rf-name" type="text" autocomplete="off"
              placeholder="Type your name…"
              oninput="_rfNameSearch(this.value)"
              onfocus="if(this.value.length>=2)_rfNameSearch(this.value)"
              onblur="setTimeout(()=>{const l=document.getElementById('rf-ac-list');if(l)l.style.display='none'},200)"
              onkeydown="_rfNameKey(event)"
            />
            <ul class="pub-ac-list" id="rf-ac-list" role="listbox"></ul>
          </div>
          <div class="rw-hint">Can&#8217;t find your name? <a href="mailto:" id="rf-contact-link">Contact the couple</a></div>
        </div>
        <div id="rf-attend-card" hidden>
          <div class="rw-name-bar">
            <span class="rw-nb-name" id="rw-name-display"></span>
            <button type="button" class="rw-nb-change" onclick="_rfWizResetName()">Change</button>
          </div>
          <div id="rf-group-rows"></div>
        </div>
        <div class="rw-nav">
          <button type="button" class="rw-btn-back rw-invisible" id="rw-back-1">&#8592; Back</button>
          <button type="button" class="rw-btn-next" id="rw-next-1" disabled onclick="_rfWizNext('${coupleId}')">Next &#8594;</button>
        </div>
      </div>
      <div class="rw-page" id="rw-p2">
        <p class="rw-page-title">Meal &amp; dietary</p>
        <div id="rw-details-rows"></div>
        <div class="rw-nav">
          <button type="button" class="rw-btn-back" onclick="_rfWizBack()">&#8592; Back</button>
          <button type="button" class="rw-btn-next" onclick="_rfWizNext('${coupleId}')">Next &#8594;</button>
        </div>
      </div>
      <div class="rw-page" id="rw-p3">
        <p class="rw-page-title">Your details</p>
        ${rfields.email===false?'':`<input class="rw-inp" id="rf-email" type="email" placeholder="Email address"/>`}
        ${rfields.phone===false?'':`<input class="rw-inp" id="rf-phone" type="tel" placeholder="Phone number" style="margin-top:8px"/>`}
        ${rfields.address===false?'':`<input class="rw-inp" id="rf-street" placeholder="Street address" style="margin-top:8px"/>
        <div class="rw-addr-row">
          <input class="rw-inp" id="rf-suburb" placeholder="Suburb"/>
          <input class="rw-inp" id="rf-state" placeholder="State"/>
          <input class="rw-inp" id="rf-post" placeholder="Postcode"/>
        </div>`}
        ${rfields.message===false?'':`<textarea class="rw-inp" id="rf-message" placeholder="A note… (optional)" style="margin-top:8px;min-height:88px;resize:vertical"></textarea>`}
        <div class="rw-nav">
          <button type="button" class="rw-btn-back" onclick="_rfWizBack()">&#8592; Back</button>
          <button type="button" class="rw-btn-next" id="rf-submit" onclick="_rfWizNext('${coupleId}')">Submit RSVP</button>
        </div>
      </div>
      <div class="rw-page" id="rw-p-done">
        <div class="rw-confirm-card">
          <div class="rw-confirm-icon">&#10022;</div>
          <p class="rw-confirm-title">Thank you, <span id="rw-done-name"></span>.</p>
          <p class="rw-confirm-sub">Your RSVP has been received.</p>
        </div>
      </div>
      <div class="rw-page" id="rw-p-declined">
        <div class="rw-confirm-card">
          <p class="rw-confirm-title">Sorry you can&#8217;t make it.</p>
          <p class="rw-confirm-sub">We&#8217;ve noted your response, <span id="rw-declined-names"></span>.</p>
        </div>
      </div>
    </div>
    <div class="rf-footer" data-uv-scheme="${_palDark?'dark':'light'}">
      <span class="uv-ft-lbl">Powered by</span>
      <div class="uv-ft-lock">
        <a href="https://unionvault.app" target="_blank" rel="noopener" aria-label="Union Vault">
          <img class="uv-ft-crest uv-ft-crest-light" src="${_uvCrestLight}" alt="" width="22" height="20">
          <img class="uv-ft-crest uv-ft-crest-dark" src="${_uvCrestDark}" alt="" width="22" height="20">
          <span class="uv-ft-txt"><b>UNION</b><i>VAULT</i></span>
        </a>
      </div>
    </div>
    <div id="rf-guest-data" style="display:none"
      data-guests='${guestNamesJson.replace(/'/g,"&#39;")}'
      data-guest-objs='${guestObjsJson.replace(/'/g,"&#39;")}'
      data-btn-yes='${btnYes.replace(/'/g,"&#39;")}'
      data-btn-no='${btnNo.replace(/'/g,"&#39;")}'
      data-email-notif='${rfEmailNotif?'1':'0'}'
      data-meal-on='${mealOn?'1':'0'}'
      data-children-meal-on='${childMealOn?'1':'0'}'
      data-children-meal-enabled='${childrenMealEnabled?'1':'0'}'
      data-dietary-on='${rfields.dietary===false?'0':'1'}'
      data-has-contact='${(rfields.email!==false||rfields.phone!==false||rfields.address!==false||rfields.message!==false)?'1':'0'}'>
    </div>
    ${rfields.dietary===false?'':`<template id="rf-diet-template">${dietHtml}</template>`}
    ${mealOn?`<template id="rf-meal-template"><div class="rf-meal-chips">${mealHtml}</div></template>`:''}
    ${childMealOn?`<template id="rf-children-meal-template"><div class="rf-meal-chips">${childMealHtml}</div></template>`:''}
  `;

  if(isModal){
    document.getElementById('rsvp-form-overlay')?.remove();
    const overlay=document.createElement('div');
    overlay.id='rsvp-form-overlay';
    overlay.style.cssText='position:fixed;inset:0;z-index:9000;overflow-y:auto;padding:24px 16px 40px;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center';
    overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
    const card=document.createElement('div');
    card.style.cssText='position:relative;width:100%;max-width:480px;border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.35)';
    card.innerHTML=`<button onclick="document.getElementById('rsvp-form-overlay').remove()" style="position:absolute;top:10px;right:12px;z-index:10;background:rgba(128,128,128,.18);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;color:var(--pub-ink,#1a1a18);font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;opacity:.7">✕</button>${htmlContent}`;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  } else {
    _publicPageShell(htmlContent);
  }
}

// ── RSVP autocomplete helpers ──────────────────────────────────
function _rfNameSearch(q){
  const list=document.getElementById('rf-ac-list');
  if(!list) return;
  if(q.length<2){list.style.display='none';return;}
  const lq=q.toLowerCase();
  const gd=document.getElementById('rf-guest-data');
  const guests=gd?JSON.parse(gd.dataset.guests||'[]'):[];
  const hits=guests.filter(n=>{
    const parts=n.toLowerCase().split(/[\s&,]+/);
    return parts.some(p=>p.startsWith(lq))||n.toLowerCase().includes(lq);
  }).slice(0,8);
  if(!hits.length){
    list.innerHTML='<li class="pub-ac-none">No match — try another spelling</li>';
  } else {
    list.innerHTML=hits.map((n,i)=>`<li class="pub-ac-item" role="option" data-idx="${i}"
      onmouseenter="this.classList.add('focused')" onmouseleave="this.classList.remove('focused')"
      onmousedown="_rfPickName(this.textContent)">${n}</li>`).join('');
  }
  list.style.display='block';
}
function _rfPickName(name){
  name=(name||'').trim();
  const inp=document.getElementById('rf-name');
  const list=document.getElementById('rf-ac-list');
  if(inp){inp.value=name;inp.style.borderColor='var(--pub-accent)';inp.style.boxShadow='0 0 0 3px color-mix(in srgb,var(--pub-accent) 20%,transparent 80%)';}
  if(list)list.style.display='none';

  // Find group members using stored guest objects
  const gd=document.getElementById('rf-guest-data');
  const objs=gd?JSON.parse(gd.dataset.guestObjs||'[]'):[];
  const btnYes=(gd&&gd.dataset.btnYes)||'✓ Joyfully accepts';
  const btnNo=(gd&&gd.dataset.btnNo)||'Regretfully declines';

  const guest=objs.find(g=>g.name===name);
  window._rfCurrentGuestBand=guest?guest.ageBand||'adult':'adult';
  window._rfCurrentGuest=guest||null;
  let members=[];
  if(guest){
    const byId=Object.fromEntries(objs.map(g=>[g.id,g]));
    const seen=new Set();
    const add=g=>{if(g&&!seen.has(g.id)){seen.add(g.id);members.push(g);}};
    // If this guest is a plus-one, start with the host
    const host=objs.find(g=>g.plusOneId===guest.id);
    if(host){
      add(host);
      if(host.coupleId)add(byId[host.coupleId]);
    }
    add(guest);
    if(guest.coupleId)add(byId[guest.coupleId]);
    if(guest.plusOneId)add(byId[guest.plusOneId]);
    // Family/household group members
    if(guest.groupIds&&guest.groupIds.length){
      guest.groupIds.forEach(id=>add(byId[id]));
      // If a family member has a plus-one, include them too
      guest.groupIds.forEach(id=>{const m=byId[id];if(m&&m.plusOneId)add(byId[m.plusOneId]);});
    }
  }

  // Reset attendance state
  _rfAttending=null;
  _rfMemberAttend={};

  // Render the attend card dynamically
  const gr=document.getElementById('rf-group-rows');
  if(gr){
    if(members.length>1){
      gr.innerHTML=`<div class="rf-lbl" style="margin-bottom:4px">Will you be attending?</div>`+
        members.map(m=>{
          const eid=m.id.replace(/[^a-z0-9]/gi,'');
          return `<div class="rf-member-row" data-mid="${m.id}">
            <div class="rf-member-name">${m.name}</div>
            <div class="rf-pills">
              <div class="rf-pill" id="rfmy-${eid}" onclick="_rfSetMemberAttend('${m.id}','yes')">✓ ${btnYes}</div>
              <div class="rf-pill" id="rfmn-${eid}" onclick="_rfSetMemberAttend('${m.id}','no')">${btnNo}</div>
            </div>
            <div class="rf-member-extras" id="rfex-${eid}"></div>
          </div>`;
        }).join('');
      window._rfIsGroup=true;
      // Populate household contact header
      const firstNames=members.map(m=>m.name.split(' ')[0]);
      const hname=firstNames.length===2?firstNames[0]+' & '+firstNames[1]:firstNames.slice(0,-1).join(', ')+' & '+firstNames[firstNames.length-1];
      const ch=document.getElementById('rf-contact-header');
      if(ch)ch.innerHTML='<div class="rf-contact-hdr">'+hname+'’s contact details</div>';
      const sb2=document.getElementById('rf-submit');
      if(sb2)sb2.textContent='Send our RSVP';
    } else {
      window._rfIsGroup=false;
      const ch=document.getElementById('rf-contact-header');
      if(ch)ch.innerHTML='';
      const sb2=document.getElementById('rf-submit');
      if(sb2)sb2.textContent='Send my RSVP';
      gr.innerHTML=`<div class="rf-lbl">Will you be attending?</div>
        <div class="rf-pills">
          <div class="rf-pill" id="rf-yes" onclick="_rfSetAttend('yes')">✓ ${btnYes}</div>
          <div class="rf-pill" id="rf-no" onclick="_rfSetAttend('no')">${btnNo}</div>
        </div>`;
    }
  }

  // Reset contact group and submit button
  const cg=document.getElementById('rf-contact-group');
  const sb=document.getElementById('rf-submit');
  if(cg)cg.hidden=true;
  if(sb)sb.hidden=true;

  const ac=document.getElementById('rf-attend-card');
  if(ac){ac.hidden=false;ac.scrollIntoView({behavior:'smooth',block:'nearest'});}
  const rwsb=document.getElementById('rw-search-block');
  if(rwsb)rwsb.hidden=true;
  const rwnd=document.getElementById('rw-name-display');
  if(rwnd)rwnd.textContent=(guest&&guest.name)||name;
}
function _rfNameKey(e){
  const list=document.getElementById('rf-ac-list');
  if(!list||list.style.display==='none') return;
  const items=list.querySelectorAll('.pub-ac-item');
  const cur=list.querySelector('.pub-ac-item.focused');
  let idx=cur?parseInt(cur.dataset.idx,10):-1;
  if(e.key==='ArrowDown'){
    e.preventDefault();
    items.forEach(el=>el.classList.remove('focused'));
    idx=Math.min(idx+1,items.length-1);
    if(items[idx])items[idx].classList.add('focused');
  } else if(e.key==='ArrowUp'){
    e.preventDefault();
    items.forEach(el=>el.classList.remove('focused'));
    idx=Math.max(idx-1,0);
    if(items[idx])items[idx].classList.add('focused');
  } else if(e.key==='Enter'&&cur){
    e.preventDefault();
    _rfPickName(cur.textContent);
  } else if(e.key==='Escape'){
    list.style.display='none';
  }
}

let _rfAttending=null;
let _rfMemberAttend={};
let _rfPlusOneAttend={};
let _rfPlusOneName={};

function _rfRenderPlusOneSection(hostId,containerEl,inGroup){
  const eid=hostId.replace(/[^a-z0-9]/gi,'');
  const wrap=document.createElement('div');
  wrap.className=(inGroup?'rf-diet-wrap':'rf-card')+' rf-plus-one-section';
  wrap.id='rf-po-wrap-'+eid;
  wrap.innerHTML='<div class="rf-lbl">Plus one</div>'
    +'<div class="rf-pills">'
    +'<div class="rf-pill" id="rfpoy-'+eid+'" onclick="_rfSetPlusOneAttend(\''+hostId+'\',\'yes\')">✓ Attending</div>'
    +'<div class="rf-pill" id="rfpon-'+eid+'" onclick="_rfSetPlusOneAttend(\''+hostId+'\',\'no\')">Not attending</div>'
    +'</div>'
    +'<div id="rf-po-name-wrap-'+eid+'" style="display:none;margin-top:10px">'
    +'<input class="rf-inp" id="rf-po-name-'+eid+'" type="text" placeholder="Plus one\'s name" autocomplete="off"/>'
    +'</div>';
  containerEl.appendChild(wrap);
}
function _rfSetPlusOneAttend(hostId,val){
  _rfPlusOneAttend[hostId]=val;
  const eid=hostId.replace(/[^a-z0-9]/gi,'');
  const yes=document.getElementById('rfpoy-'+eid);
  const no=document.getElementById('rfpon-'+eid);
  if(yes){yes.classList.toggle('yes',val==='yes');yes.classList.remove('no');}
  if(no){no.classList.toggle('no',val==='no');no.classList.remove('yes');}
  const nw=document.getElementById('rf-po-name-wrap-'+eid);
  if(nw)nw.style.display=val==='yes'?'block':'none';
  if(val!=='yes')delete _rfPlusOneName[hostId];
}
function _rfSetAttend(val){
  _rfAttending=val;
  const yes=document.getElementById('rf-yes');
  const no=document.getElementById('rf-no');
  if(yes){yes.classList.toggle('yes',val==='yes');yes.classList.remove('no');}
  if(no){no.classList.toggle('no',val==='no');no.classList.remove('yes');}
  const cg=document.getElementById('rf-contact-group');
  const sb=document.getElementById('rf-submit');
  if(cg)cg.hidden=(val!=='yes');
  if(sb){sb.hidden=false;setTimeout(()=>sb.scrollIntoView({behavior:'smooth',block:'nearest'}),50);}
  // Anonymous plus-one prompt
  const g=window._rfCurrentGuest;
  const ac=document.getElementById('rf-attend-card');
  if(ac && g && g.plusOne && !g.plusOneId){
    const existing=document.getElementById('rf-po-wrap-'+g.id.replace(/[^a-z0-9]/gi,''));
    if(val==='yes' && !existing) _rfRenderPlusOneSection(g.id, ac, false);
    if(val!=='yes' && existing){ existing.remove(); delete _rfPlusOneAttend[g.id]; delete _rfPlusOneName[g.id]; }
  }
  if(typeof _rfWizUpdateNav==='function')_rfWizUpdateNav();
}
function _rfSetMemberAttend(memberId,val){
  _rfMemberAttend[memberId]=val;
  const eid=memberId.replace(/[^a-z0-9]/gi,'');
  const yes=document.getElementById('rfmy-'+eid);
  const no=document.getElementById('rfmn-'+eid);
  if(yes){yes.classList.toggle('yes',val==='yes');yes.classList.remove('no');}
  if(no){no.classList.toggle('no',val==='no');no.classList.remove('yes');}
  const rows=document.querySelectorAll('#rf-group-rows .rf-member-row');
  const memberIds=[...rows].map(r=>r.dataset.mid);
  const allSet=memberIds.length>0&&memberIds.every(id=>_rfMemberAttend[id]);
  const anyYes=memberIds.some(id=>_rfMemberAttend[id]==='yes');
  const cg=document.getElementById('rf-contact-group');
  const sb=document.getElementById('rf-submit');
  if(cg)cg.hidden=!anyYes;
  if(sb){sb.hidden=!allSet;if(allSet)setTimeout(()=>sb.scrollIntoView({behavior:'smooth',block:'nearest'}),50);}
  // Anonymous plus-one prompt for this member
  const extrasEl=document.getElementById('rfex-'+eid);
  if(extrasEl){
    const _gd3=document.getElementById('rf-guest-data');
    const _objs3=_gd3?JSON.parse(_gd3.dataset.guestObjs||'[]'):[];
    const mobj=_objs3.find(g=>g.id===memberId);
    if(mobj && mobj.plusOne && !mobj.plusOneId){
      const existing=extrasEl.querySelector('.rf-plus-one-section');
      if(val==='yes' && !existing) _rfRenderPlusOneSection(memberId, extrasEl, true);
      if(val!=='yes' && existing){ existing.remove(); delete _rfPlusOneAttend[memberId]; delete _rfPlusOneName[memberId]; }
    }
  }
  if(typeof _rfWizUpdateNav==='function')_rfWizUpdateNav();
}

function _rfNoteToggle(chip){
  chip.classList.toggle('on');
  const inp=chip.closest('.rf-diet-grid').querySelector('.rf-diet-note[data-for="'+chip.dataset.diet+'"]');
  if(inp){const on=chip.classList.contains('on');inp.style.display=on?'block':'none';if(on)setTimeout(function(){inp.focus();},0);}
}
function _rfPickMeal(chip){
  const chips=chip.closest('.rf-meal-chips');
  if(!chips) return;
  chips.querySelectorAll('.rf-meal-chip').forEach(c=>c.classList.remove('on'));
  chip.classList.add('on');
}
async function _rfSubmit(coupleId){
  const nameEl=document.getElementById('rf-name');
  const submitEl=document.getElementById('rf-submit');
  const name=nameEl?nameEl.value.trim():'';
  if(!name){nameEl&&(nameEl.style.borderColor='#C0392B');return;}

  const rows=document.querySelectorAll('#rf-group-rows .rf-member-row');
  const isGroup=rows.length>1;
  if(isGroup){
    const memberIds=[...rows].map(r=>r.dataset.mid);
    if(!memberIds.every(id=>_rfMemberAttend[id]))return;
  } else {
    if(!_rfAttending)return;
  }

  const diet=Array.from(document.querySelectorAll('#rf-diet-s0 .rf-diet-chip.on')).map(el=>el.dataset.diet);
  const _getNoteVal=function(grid,key){const i=document.querySelector('#'+grid+' .rf-diet-note[data-for="'+key+'"]');return i?i.value.trim():'';};
  const _encDiet=function(arr,gridId){return arr.map(function(d){if(d==='other'||d==='allergy'){const n=_getNoteVal(gridId,d);return n?d+':'+n:d;}return d;});};
  const dietFinal=_encDiet(diet,'rf-diet-s0');
  const street=(document.getElementById('rf-street')||{}).value||'';
  const suburb=(document.getElementById('rf-suburb')||{}).value||'';
  const state=(document.getElementById('rf-state')||{}).value||'';
  const post=(document.getElementById('rf-post')||{}).value||'';
  const addressParts=[street,suburb,state,post].map(s=>s.trim()).filter(Boolean);
  const address=addressParts.length?addressParts.join(', '):null;
  const email=(document.getElementById('rf-email')||{}).value||null;
  const phone=(document.getElementById('rf-phone')||{}).value||null;
  const message=(document.getElementById('rf-message')||{}).value||null;

  // Validate anonymous plus-one names before locking the button
  for(const [poHostId, poAttend] of Object.entries(_rfPlusOneAttend)){
    if(poAttend==='yes'){
      const poEid=poHostId.replace(/[^a-z0-9]/gi,'');
      const poNameEl=document.getElementById('rf-po-name-'+poEid);
      const poNameVal=(poNameEl||{}).value||'';
      if(!poNameVal.trim()){
        if(poNameEl){poNameEl.style.borderColor='#C0392B';poNameEl.focus();}
        return;
      }
      _rfPlusOneName[poHostId]=poNameVal.trim();
    }
  }

  submitEl.disabled=true;submitEl.textContent='Sending…';

  const _gd=document.getElementById('rf-guest-data');
  const _rfEmailNotif=!(_gd&&_gd.dataset.emailNotif==='0');

  try{
    let payloads;
    if(isGroup){
      const objs=_gd?JSON.parse(_gd.dataset.guestObjs||'[]'):[];
      const memberIds=[...rows].map(r=>r.dataset.mid);
      payloads=memberIds.map(id=>{
        const g=objs.find(o=>o.id===id)||{name};
        const eid2=id.replace(/[^a-z0-9]/gi,'');
        const mDiet=Array.from(document.querySelectorAll('#rf-diet-'+eid2+' .rf-diet-chip.on')).map(el=>el.dataset.diet);
        const mDietFinal=_encDiet(mDiet,'rf-diet-'+eid2);
        const mMealEl=document.querySelector('#rf-meal-'+eid2+' .rf-meal-chip.on');
        const hcEl2=document.getElementById('rf-highchair-'+eid2);
        return {couple_id:coupleId,guest_name:g.name,email,phone,address,message,attending:_rfMemberAttend[id],dietary:mDietFinal.length?mDietFinal:null,meal:mMealEl?mMealEl.dataset.meal:null,high_chair:!!(hcEl2&&hcEl2.checked)};
      });
    } else {
      const mealEl=document.querySelector('#rf-meal-s0 .rf-meal-chip.on');
      const hcElS=document.getElementById('rf-highchair-s0');
      payloads=[{couple_id:coupleId,guest_name:name,email,phone,address,message,attending:_rfAttending,dietary:dietFinal.length?dietFinal:null,meal:mealEl?mealEl.dataset.meal:null,high_chair:!!(hcElS&&hcElS.checked)}];
    }
    // Append anonymous plus-one RSVPs
    for(const [poHostId2, poAttend2] of Object.entries(_rfPlusOneAttend)){
      if(poAttend2==='yes' && _rfPlusOneName[poHostId2]){
        payloads.push({couple_id:coupleId,guest_name:_rfPlusOneName[poHostId2],email:null,phone:null,address:null,message:null,attending:'yes',dietary:null,meal:null});
      }
    }

    const results=await Promise.all(payloads.map(body=>
      fetch(`${_SB_URL}/rest/v1/rsvp_responses`,{
        method:'POST',
        headers:{'apikey':_SB_KEY,'Authorization':'Bearer '+_SB_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify(body)
      })
    ));

    const allOk=results.every(r=>r.ok||r.status===201);
    if(allOk){
      const anyYes=isGroup?Object.values(_rfMemberAttend).some(v=>v==='yes'):_rfAttending==='yes';
      try{
        if(_rfEmailNotif){
          const notifName=isGroup?payloads.map(function(p){return p.guest_name;}).join(', '):name;
          const notifAttending=isGroup?(anyYes?'yes':'no'):_rfAttending;
          fetch(_SB_URL+'/functions/v1/rsvp-notify',{
            method:'POST',
            headers:{'Content-Type':'application/json','apikey':_SB_KEY},
            body:JSON.stringify({couple_id:coupleId,guest_name:notifName,attending:notifAttending,members:payloads.map(function(p){return{name:p.guest_name,attending:p.attending,dietary:p.dietary||[],meal:p.meal||null};}),phone:phone||null,email:email||null,address:address||null,message:message||null})
          }).catch(function(){});
        }
      }catch(e2){}
      const rwDone=document.getElementById('rw-p-done');
      if(rwDone){
        const dn=document.getElementById('rw-done-name');
        if(dn){const firsts=payloads.map(p=>p.guest_name.split(' ')[0]);const nameStr=firsts.length<=2?firsts.join(' & '):firsts.slice(0,-1).join(', ')+' & '+firsts[firsts.length-1];dn.textContent=nameStr;}
        if(typeof _rfWizShowPage==='function')_rfWizShowPage('rw-p-done');
      } else {
        const formBody=document.getElementById('rsvp-form-body');
        if(formBody){
          formBody.innerHTML=`<div class="rf-msg-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="display:block;margin:0 auto 12px"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
            <div style="font-size:17px;font-weight:600;margin-bottom:6px">RSVP received!</div>
            <div style="font-size:13.5px;opacity:.85">${anyYes?"We can’t wait to celebrate with you 🥂":"Thank you for letting us know — you’ll be missed."}</div>
          </div>`;
        }
      }
    } else {
      submitEl.disabled=false;submitEl.textContent='Send my RSVP';
      alert('Something went wrong — please try again.');
    }
  }catch(e){
    console.warn('RSVP submit error',e);
    submitEl.disabled=false;submitEl.textContent='Send my RSVP';
    alert('Network error — please check your connection and try again.');
  }
}

function _rfWizUpdateNav(){
  const next1=document.getElementById('rw-next-1');
  if(!next1) return;
  const rows=document.querySelectorAll('#rf-group-rows .rf-member-row');
  const isGroup=rows.length>1;
  let allAnswered=false,anyYes=false;
  if(isGroup){
    const ids=[...rows].map(r=>r.dataset.mid);
    allAnswered=ids.length>0&&ids.every(id=>_rfMemberAttend[id]);
    anyYes=ids.some(id=>_rfMemberAttend[id]==='yes');
  } else {
    allAnswered=!!_rfAttending;
    anyYes=_rfAttending==='yes';
  }
  next1.disabled=!allAnswered;
  if(allAnswered){next1.textContent=anyYes?'Next →':'Submit RSVP';}
  else{next1.textContent='Next →';}
}
function _rfWizSetStep(n){
  for(let i=1;i<=3;i++){
    const sn=document.getElementById('rw-sn'+i),sl=document.getElementById('rw-sl'+i);
    const conn=document.getElementById('rw-c'+i);
    if(i<n){if(sn)sn.className='rw-sn rw-done';if(sl)sl.className='rw-sl rw-done';if(conn)conn.className='rw-conn rw-done';}
    else if(i===n){if(sn)sn.className='rw-sn rw-active';if(sl)sl.className='rw-sl rw-active';}
    else{if(sn)sn.className='rw-sn rw-pending';if(sl)sl.className='rw-sl';if(conn)conn.className='rw-conn';}
  }
}
function _rfWizShowPage(id){
  document.querySelectorAll('.rw-page').forEach(p=>p.classList.remove('rw-active'));
  const t=document.getElementById(id);
  if(t)t.classList.add('rw-active');
  window.scrollTo({top:0,behavior:'smooth'});
}
function _rfWizResetName(){
  const rwsb=document.getElementById('rw-search-block');
  const inp=document.getElementById('rf-name');
  const ac=document.getElementById('rf-attend-card');
  const gr=document.getElementById('rf-group-rows');
  if(rwsb)rwsb.hidden=false;
  if(inp){inp.value='';inp.style.borderColor='';inp.style.boxShadow='';}
  if(ac)ac.hidden=true;
  if(gr)gr.innerHTML='';
  _rfAttending=null;_rfMemberAttend={};_rfPlusOneAttend={};_rfPlusOneName={};
  window._rfCurrentGuest=null;window._rfCurrentGuestBand=null;window._rfIsGroup=false;
  _rfWizUpdateNav();
}
function _rfWizRenderPage2(){
  const gd=document.getElementById('rf-guest-data');
  const mealOn=(gd&&gd.dataset.mealOn==='1');
  const childMealOn2=(gd&&gd.dataset.childrenMealOn==='1');
  const childrenMealEnabled2=(gd&&gd.dataset.childrenMealEnabled==='1');
  const dietOn=(gd&&gd.dataset.dietaryOn==='1');
  const dr=document.getElementById('rw-details-rows');
  if(!dr) return;
  dr.innerHTML='';
  const rows=document.querySelectorAll('#rf-group-rows .rf-member-row');
  const isGroup=rows.length>1;
  const objs=gd?JSON.parse(gd.dataset.guestObjs||'[]'):[];
  let attending=[];
  if(isGroup){
    rows.forEach(r=>{
      if(_rfMemberAttend[r.dataset.mid]==='yes'){
        const o=objs.find(g=>g.id===r.dataset.mid)||{id:r.dataset.mid,name:'Guest',ageBand:'adult'};
        attending.push(o);
      }
    });
  } else {
    if(_rfAttending==='yes'){const cur=window._rfCurrentGuest;if(cur)attending=[cur];}
  }
  if(!attending.length){dr.innerHTML='<p style="font-size:14px;color:var(--rw-muted,#7A6E5E);padding:12px 0">No meal details required.</p>';return;}
  const mealTmpl=document.getElementById('rf-meal-template');
  const childTmpl=childMealOn2?document.getElementById('rf-children-meal-template'):null;
  const dietOptions=[['vegetarian','Vegetarian'],['pescatarian','Pescatarian'],['vegan','Vegan'],
    ['halal','Halal'],['kosher','Kosher'],['lactose','Lactose intolerant'],
    ['gluten','Gluten intolerant'],['allergy','Allergy'],['other','Other']];
  attending.forEach((g)=>{
    const isSingle=!isGroup;
    const eid=isSingle?'s0':g.id.replace(/[^a-z0-9]/gi,'');
    const band=g.ageBand||'adult';
    const block=document.createElement('div');
    block.className='rw-gdb'+(attending.length>1?' rw-gdb-sep':'');
    if(attending.length>1){const nm=document.createElement('p');nm.className='rw-gdb-name';nm.textContent=g.name;block.appendChild(nm);}
    if(mealOn){
      const fg=document.createElement('div');fg.className='rw-field-group';
      const lbl=document.createElement('p');lbl.className='rw-field-lbl';
      if(band==='infant'){
        lbl.textContent='Meal';const note=document.createElement('p');note.className='rw-field-hint';
        note.textContent='No meal provided for infants';fg.appendChild(lbl);fg.appendChild(note);
      } else {
        lbl.textContent=band==='child'?(attending.length>1?g.name+'’s children’s meal':'Children’s meal'):(attending.length>1?g.name+'’s meal choice':'Meal choice');
        const mealCont=document.createElement('div');mealCont.id='rf-meal-'+eid;
        mealCont.className='rw-meal-row';
        if(band==='child'){
          if(childTmpl){mealCont.appendChild(childTmpl.content.cloneNode(true));}
          else if(!childrenMealEnabled2&&mealTmpl){mealCont.appendChild(mealTmpl.content.cloneNode(true));}
        } else {
          if(mealTmpl){mealCont.appendChild(mealTmpl.content.cloneNode(true));}
        }
        fg.appendChild(lbl);fg.appendChild(mealCont);
      }
      block.appendChild(fg);
    }
    if(dietOn){
      const fg2=document.createElement('div');fg2.className='rw-field-group';
      const acc=document.createElement('div');acc.className='rw-diet-accordion';acc.id='rw-da-'+eid;
      const togBtn=document.createElement('button');togBtn.type='button';togBtn.className='rw-diet-toggle';
      togBtn.innerHTML='<span class="rw-dt-label">Dietary requirements<span class="rw-dt-count" id="rw-dc-'+eid+'"></span></span>'
        +'<svg class="rw-dt-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,5 7,9 11,5"/></svg>';
      const dietBody=document.createElement('div');dietBody.className='rw-diet-body';dietBody.style.display='none';
      togBtn.onclick=function(){acc.classList.toggle('rw-open');dietBody.style.display=acc.classList.contains('rw-open')?'block':'none';};
      const dietGrid=document.createElement('div');
      dietGrid.className='rw-chip-row rf-diet-grid';
      dietGrid.id='rf-diet-'+eid;
      let chipHtml=dietOptions.map(([k,lbl2])=>{
        const isNote=k==='allergy'||k==='other';
        const oc=isNote?`_rfWizDietNoteToggle('${eid}',this)`:`_rfWizDietToggle('${eid}',this)`;
        return `<div class="rw-chip rf-diet-chip" onclick="${oc}" data-diet="${k}"><span class="rf-chk"><svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1.5,4.5 3.5,6.5 7.5,2.5"/></svg></span>${lbl2}</div>`;
      }).join('');
      chipHtml+=`<input class="rw-inp rf-diet-note" data-for="allergy" type="text" placeholder="Please describe your allergy…" style="display:none;margin-top:6px">`;
      chipHtml+=`<input class="rw-inp rf-diet-note" data-for="other" type="text" placeholder="Please describe your dietary requirement…" style="display:none;margin-top:6px">`;
      dietGrid.innerHTML=chipHtml;
      dietBody.appendChild(dietGrid);acc.appendChild(togBtn);acc.appendChild(dietBody);
      fg2.appendChild(acc);block.appendChild(fg2);
    }
    if(band==='child'||band==='infant'){
      const hcFg=document.createElement('div');hcFg.className='rw-field-group';
      const hcLbl=document.createElement('label');
      hcLbl.style.cssText='display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:var(--rw-ink,#2a2518);cursor:pointer';
      hcLbl.innerHTML='<input type="checkbox" id="rf-highchair-'+eid+'" class="rf-highchair-cb" style="width:15px;height:15px;accent-color:var(--rw-gold,#B8985A);cursor:pointer;flex-shrink:0"> High chair required';
      hcFg.appendChild(hcLbl);block.appendChild(hcFg);
    }
    dr.appendChild(block);
  });
}
function _rfWizDietToggle(eid,chip){
  chip.classList.toggle('on');
  const cnt=document.querySelectorAll('#rf-diet-'+eid+' .rf-diet-chip.on').length;
  const dc=document.getElementById('rw-dc-'+eid);
  if(dc){dc.textContent=cnt||'';dc.className='rw-dt-count'+(cnt?' rw-show':'');}
}
function _rfWizDietNoteToggle(eid,chip){
  _rfNoteToggle(chip);
  const cnt=document.querySelectorAll('#rf-diet-'+eid+' .rf-diet-chip.on').length;
  const dc=document.getElementById('rw-dc-'+eid);
  if(dc){dc.textContent=cnt||'';dc.className='rw-dt-count'+(cnt?' rw-show':'');}
}
function _rfWizNext(coupleId){
  const gd=document.getElementById('rf-guest-data');
  const mealOn=(gd&&gd.dataset.mealOn==='1');
  const dietOn=(gd&&gd.dataset.dietaryOn==='1');
  const hasContact=(gd&&gd.dataset.hasContact==='1');
  const rows=document.querySelectorAll('#rf-group-rows .rf-member-row');
  const isGroup=rows.length>1;
  const objs2=gd?JSON.parse(gd.dataset.guestObjs||'[]'):[];
  let hasHC=false;
  if(isGroup){[...rows].forEach(r=>{if(_rfMemberAttend[r.dataset.mid]==='yes'){const o2=objs2.find(g=>g.id===r.dataset.mid);if(o2&&(o2.ageBand==='child'||o2.ageBand==='infant'))hasHC=true;}});}
  else if(_rfAttending==='yes'){const cur2=window._rfCurrentGuest;if(cur2&&(cur2.ageBand==='child'||cur2.ageBand==='infant'))hasHC=true;}
  const hasMealOrDiet=mealOn||dietOn||hasHC;
  const anyYes=isGroup?[...rows].some(r=>_rfMemberAttend[r.dataset.mid]==='yes'):_rfAttending==='yes';
  const cur=document.querySelector('.rw-page.rw-active');
  const curId=cur?cur.id:'rw-p1';
  if(curId==='rw-p1'){
    if(!anyYes){_rfWizDeclineAll(coupleId);return;}
    if(hasMealOrDiet){_rfWizRenderPage2();_rfWizSetStep(2);_rfWizShowPage('rw-p2');}
    else if(hasContact){_rfWizSetStep(3);_rfWizShowPage('rw-p3');}
    else{const sb=document.getElementById('rf-submit');if(sb)sb.hidden=false;_rfSubmit(coupleId);}
  } else if(curId==='rw-p2'){
    if(hasContact){_rfWizSetStep(3);_rfWizShowPage('rw-p3');}
    else{const sb=document.getElementById('rf-submit');if(sb)sb.hidden=false;_rfSubmit(coupleId);}
  } else if(curId==='rw-p3'){
    const sb=document.getElementById('rf-submit');if(sb)sb.hidden=false;
    _rfSubmit(coupleId);
  }
}
function _rfWizBack(){
  const gd=document.getElementById('rf-guest-data');
  const mealOn=(gd&&gd.dataset.mealOn==='1');
  const dietOn=(gd&&gd.dataset.dietaryOn==='1');
  const rows2=document.querySelectorAll('#rf-group-rows .rf-member-row');
  const isGroup2=rows2.length>1;
  const objs3=gd?JSON.parse(gd.dataset.guestObjs||'[]'):[];
  let hasHC2=false;
  if(isGroup2){[...rows2].forEach(r=>{if(_rfMemberAttend[r.dataset.mid]==='yes'){const o3=objs3.find(g=>g.id===r.dataset.mid);if(o3&&(o3.ageBand==='child'||o3.ageBand==='infant'))hasHC2=true;}});}
  else if(_rfAttending==='yes'){const cur3=window._rfCurrentGuest;if(cur3&&(cur3.ageBand==='child'||cur3.ageBand==='infant'))hasHC2=true;}
  const hasMealOrDiet=mealOn||dietOn||hasHC2;
  const cur=document.querySelector('.rw-page.rw-active');
  const curId=cur?cur.id:'rw-p1';
  if(curId==='rw-p2'){_rfWizSetStep(1);_rfWizShowPage('rw-p1');}
  else if(curId==='rw-p3'){
    if(hasMealOrDiet){_rfWizSetStep(2);_rfWizShowPage('rw-p2');}
    else{_rfWizSetStep(1);_rfWizShowPage('rw-p1');}
  }
}
async function _rfWizDeclineAll(coupleId){
  const nameEl=document.getElementById('rf-name');
  const name=nameEl?nameEl.value.trim():'';
  if(!name) return;
  const rows=document.querySelectorAll('#rf-group-rows .rf-member-row');
  const gd=document.getElementById('rf-guest-data');
  const objs=gd?JSON.parse(gd.dataset.guestObjs||'[]'):[];
  const memberIds=[...rows].map(r=>r.dataset.mid);
  const payloads=memberIds.length>1
    ?memberIds.map(id=>{const g=objs.find(o=>o.id===id)||{name};return{couple_id:coupleId,guest_name:g.name,attending:'no',email:null,phone:null,address:null,message:null,dietary:null,meal:null};})
    :[{couple_id:coupleId,guest_name:name,attending:'no',email:null,phone:null,address:null,message:null,dietary:null,meal:null}];
  try{
    await Promise.all(payloads.map(body=>fetch(`${_SB_URL}/rest/v1/rsvp_responses`,{method:'POST',headers:{'apikey':_SB_KEY,'Authorization':'Bearer '+_SB_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(body)})));
    const _rfEmailNotif=!(gd&&gd.dataset.emailNotif==='0');
    if(_rfEmailNotif){
      fetch(_SB_URL+'/functions/v1/rsvp-notify',{method:'POST',headers:{'Content-Type':'application/json','apikey':_SB_KEY},body:JSON.stringify({couple_id:coupleId,guest_name:payloads.map(p=>p.guest_name).join(', '),attending:'no',members:payloads.map(p=>({name:p.guest_name,attending:'no',dietary:[],meal:null})),phone:null,email:null,address:null,message:null})}).catch(()=>{});
    }
    const first=payloads.map(p=>p.guest_name.split(' ')[0]);
    const nameStr=first.length<=2?first.join(' & '):first.slice(0,-1).join(', ')+' & '+first[first.length-1];
    const dn=document.getElementById('rw-declined-names');
    if(dn)dn.textContent=nameStr;
    _rfWizShowPage('rw-p-declined');
  }catch(e){console.warn('RSVP decline error',e);}
}

// Public pages get guest names/groupings, meal settings and the wishing well (minus
// contributions) through this RPC — the raw guests/settings/families rows are not
// readable without signing in, so no contact details ever reach a public page.
async function _publicWeddingExtras(uid){
  try{
    const r=await fetch(`${_SB_URL}/rest/v1/rpc/public_wedding_extras`,{
      method:'POST',
      headers:{'apikey':_SB_KEY,'Authorization':'Bearer '+_SB_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({uid})
    });
    if(r.ok){ const d=await r.json(); if(d&&typeof d==='object') return d; }
  }catch(e){ console.warn('Public data fetch failed',e); }
  return {};
}
// ── _showVendorPortal: read-only vendor brief (Option B style) ───────────────
async function _showVendorPortal(token){
  let vendor={}, couple={}, theme={}, expired=false;
  try{
    // One RPC returns just this token's brief (the token table itself isn't publicly listable).
    const res = await fetch(`${_SB_URL}/rest/v1/rpc/vendor_brief`,{
      method:'POST',
      headers:{'apikey':_SB_KEY,'Authorization':'Bearer '+_SB_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({t:token})
    });
    if(res.ok){
      const b = await res.json();
      if(!b||!b.vendor){ _showVendorError('not-found'); return; }
      vendor = b.vendor;
      // Check expiry
      if(vendor.expires_at && new Date(vendor.expires_at) < new Date()){ expired=true; }
      // Shape it like the planner data the portal renders from.
      const vc = b.vendorCard||{};
      couple = { event:b.event||{}, guestCount:b.guestCount||0,
                 vendors:[Object.assign({business:vendor.vendor_name}, vc)] };
      theme = b.theme||{};
      const sectionData = b.sectionData||{};
    } else { _showVendorError('not-found'); return; }
  }catch(e){ console.warn('Vendor portal error',e); _showVendorError('error'); return; }

  if(expired){ _showVendorExpired(vendor, couple, theme); return; }

  const ev = couple.event||{};
  const p1 = ev.partner1||'', p2 = ev.partner2||'';
  const coupleName = (p1&&p2)?`${p1} & ${p2}`:(p1||p2||'');
  const dateStr = ev.date ? (()=>{
    const d=new Date(ev.date+'T00:00:00'); if(isNaN(d)) return ev.date;
    return d.toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});
  })() : '';

  // Build booking rows from vendors list matching this token's vendor_name
  const matchedVendor = (couple.vendors||[]).find(v=>v.business===vendor.vendor_name||v.contact===vendor.vendor_name)||{};
  const _gc=couple.guestCount;
  const _gcVal=(_gc&&typeof _gc==='object')?_gc.total:_gc;
  const bookingRows=[
    ['Event date', dateStr||'TBC'],
    ['Venue', ev.venue||'TBC'],
    ['Service', matchedVendor.category||vendor.vendor_name||'—'],
    ['Setup time', matchedVendor.setupTime||'TBC'],
    ['Guest count', _gcVal||'TBC']
  ].filter(([,v])=>v);

  const sections = Array.isArray(vendor.sections)&&vendor.sections.length ? vendor.sections : [];
  const _sectionLabels={timeline:'Day-of Timeline',checklist:'Checklist',contacts:'Other Contacts',budget:'Budget',notes:'Notes'};
  const _chev='<svg class="vpb-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  const sectionAccordions=sections.map(key=>{
    const label=_sectionLabels[key]||key;
    const data=sectionData[key];
    if(!data) return '';
    let rows='';
    if(key==='timeline'){
      const arr=Array.isArray(data)?data:[];
      if(!arr.length) return '';
      rows=arr.slice().sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map(r=>`<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--pub-border)"><span style="font-size:12px;color:var(--pub-accent);min-width:52px;flex-shrink:0;font-weight:500">${_escHtml(r.time||'')}</span><div><div style="font-size:12.5px;font-weight:500;color:var(--pub-ink)">${_escHtml(r.title||'')}${r.location?`<span style="font-weight:400;color:var(--pub-text)"> · ${_escHtml(r.location)}</span>`:''}</div>${r.notes?`<div style="font-size:11.5px;color:var(--pub-text);margin-top:2px">${_escHtml(r.notes)}</div>`:''}</div></div>`).join('');
    } else if(key==='checklist'){
      const arr=Array.isArray(data)?data:[];
      if(!arr.length) return '';
      rows=arr.map(r=>{const done=r.done||r.completed;return `<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--pub-border)"><span style="font-size:14px;color:${done?'var(--pub-accent)':'var(--pub-border)'};line-height:1.3">${done?'✓':'○'}</span><span style="font-size:12.5px;color:var(--pub-ink)${done?';text-decoration:line-through;opacity:.6':''}">${_escHtml(r.task||r.title||r.name||'')}</span></div>`;}).join('');
    } else if(key==='contacts'){
      const arr=Array.isArray(data)?data:[];
      if(!arr.length) return '';
      rows=arr.map(r=>`<div style="padding:9px 0;border-bottom:1px solid var(--pub-border)"><div style="font-size:12.5px;font-weight:500;color:var(--pub-ink)">${_escHtml(r.business||r.contact||'')}</div>${r.contact&&r.business?`<div style="font-size:11.5px;color:var(--pub-text)">${_escHtml(r.contact)}</div>`:''}${r.phone?`<div style="font-size:11.5px;color:var(--pub-text)">${_escHtml(r.phone)}</div>`:''}${r.email?`<div style="font-size:11.5px;color:var(--pub-text)">${_escHtml(r.email)}</div>`:''}</div>`).join('');
    } else if(key==='budget'){
      const arr=Array.isArray(data)?data:[];
      if(!arr.length) return '';
      rows=arr.map(r=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--pub-border)"><span style="font-size:12.5px;color:var(--pub-ink)">${_escHtml(r.item||r.description||r.name||'')}</span><span style="font-size:12.5px;font-weight:500;color:var(--pub-ink)">${r.amount!=null?'$'+Number(r.amount).toLocaleString('en-AU'):''}</span></div>`).join('');
    } else if(key==='notes'){
      const text=((data.brief||'')+(data.brief&&data.notes?'\n\n':'')+(data.notes||'')).trim();
      if(!text) return '';
      rows=`<pre style="white-space:pre-wrap;font-size:12.5px;color:var(--pub-ink);margin:0;font-family:inherit;line-height:1.5">${_escHtml(text)}</pre>`;
    }
    if(!rows) return '';
    return `<details class="vpb-acc"><summary>${label}${_chev}</summary><div class="vpb-body">${rows}</div></details>`;
  }).filter(Boolean).join('');

  _publicPageShell(`
    ${_publicCss(theme.accent,theme.page,theme.band,theme.heading,theme.text,theme.headFont,theme.bodyFont)}
    <button class="pub-theme-btn" onclick="_pubToggleTheme()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      Theme
    </button>
    <div class="pub-header">
      <div class="pub-eyebrow" style="font-size:10px;letter-spacing:.13em;display:inline-block;background:color-mix(in srgb,var(--pub-accent) 20%,transparent 80%);border:1px solid color-mix(in srgb,var(--pub-accent) 40%,transparent 60%);border-radius:16px;padding:3px 10px;margin-bottom:12px">Vendor brief</div>
      <div class="pub-couple">${coupleName||'Wedding'}</div>
      ${vendor.vendor_name?`<div class="pub-dateline">Shared with: ${vendor.vendor_name}</div>`:''}
      <div class="pub-divider"></div>
    </div>
    <div class="pub-body">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 13px;background:color-mix(in srgb,var(--pub-accent) 10%,transparent 90%);border:1px solid color-mix(in srgb,var(--pub-accent) 30%,transparent 70%);border-radius:8px;font-size:12px;color:var(--pub-text)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Read-only view
      </div>
      <div style="background:var(--pub-surface);border:1px solid var(--pub-border);border-radius:12px;overflow:hidden">
        <div style="padding:12px 16px;background:color-mix(in srgb,var(--pub-accent) 12%,transparent 88%);border-bottom:1px solid var(--pub-border);display:flex;align-items:center;gap:8px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--pub-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style="font-size:13px;font-weight:600;color:var(--pub-ink)">Your booking</span>
        </div>
        ${bookingRows.map(([k,v],i)=>`<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 16px;gap:12px${i?';border-top:1px solid var(--pub-border)':''}">
          <span style="font-size:12px;color:var(--pub-text);flex-shrink:0">${k}</span>
          <span style="font-size:13px;color:var(--pub-ink);font-weight:500;text-align:right">${k==='Guest count'?`<span style="font-size:17px;font-family:'Cormorant Garamond',serif">${v}</span>`:v}</span>
        </div>`).join('')}
      </div>
      ${sectionAccordions?`<div>
        <style>.vpb-acc{background:var(--pub-surface);border:1px solid var(--pub-border);border-radius:12px;overflow:hidden;margin-bottom:0}.vpb-acc summary{list-style:none;padding:12px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;color:var(--pub-ink)}.vpb-acc summary::-webkit-details-marker{display:none}.vpb-chev{transition:transform .2s;flex-shrink:0}.vpb-acc[open] .vpb-chev{transform:rotate(180deg)}.vpb-body{padding:0 16px 14px;border-top:1px solid var(--pub-border)}</style>
        <div style="font-size:10.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--pub-accent);padding-bottom:8px;border-bottom:1px solid var(--pub-border);margin-bottom:10px">Also shared with you</div>
        <div style="display:flex;flex-direction:column;gap:8px">${sectionAccordions}</div>
      </div>`:''}
      <div>
        <div style="font-size:10.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--pub-accent);padding-bottom:8px;border-bottom:1px solid var(--pub-border);margin-bottom:10px">Contact</div>
        <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--pub-surface);border:1px solid var(--pub-border);border-radius:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--pub-accent);display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Cormorant Garamond',serif;font-size:17px;flex-shrink:0">${(matchedVendor.contact||'?')[0]}</div>
          <div>
            <div style="font-size:13px;font-weight:500;color:var(--pub-ink)">${matchedVendor.contact||'—'}</div>
            ${matchedVendor.email?`<div style="font-size:11.5px;color:var(--pub-text);margin-top:1px">${matchedVendor.email}</div>`:''}
          </div>
        </div>
      </div>
    </div>
    <style>
      .vb-footer{padding:16px 24px 24px;display:flex;flex-direction:column;align-items:center;gap:4px}
      .vb-ft-lbl{font-size:9px;letter-spacing:.1em;color:var(--pub-text);opacity:.5;text-transform:uppercase;line-height:1}
      .vb-ft-lock a{display:inline-flex;align-items:center;gap:6px;text-decoration:none;opacity:.5;transition:opacity .15s}
      .vb-ft-lock a:hover{opacity:.85}
      .vb-ft-crest{height:20px;width:auto;display:block;flex-shrink:0}
      .vb-ft-crest-light{display:block}.vb-ft-crest-dark{display:none}
      .vb-ft-txt{display:flex;flex-direction:column;align-items:flex-start;line-height:1.05;font-family:'Cinzel',serif;font-weight:400}
      .vb-ft-txt b{font-size:11px;letter-spacing:.1em;font-weight:400;color:var(--pub-ink)}
      .vb-ft-txt i{font-size:7.5px;letter-spacing:.18em;font-style:normal;color:var(--pub-text)}
      @media(prefers-color-scheme:dark){.vb-footer:not([data-scheme="light"]) .vb-ft-crest-light{display:none}.vb-footer:not([data-scheme="light"]) .vb-ft-crest-dark{display:block}}
      [data-theme="dark"] .vb-ft-crest-light{display:none}[data-theme="dark"] .vb-ft-crest-dark{display:block}
      [data-theme="light"] .vb-ft-crest-dark{display:none}[data-theme="light"] .vb-ft-crest-light{display:block}
    </style>
    <div class="vb-footer">
      <span class="vb-ft-lbl">Powered by</span>
      <div class="vb-ft-lock">
        <a href="https://unionvault.app" target="_blank" rel="noopener" aria-label="Union Vault">
          <img class="vb-ft-crest vb-ft-crest-light" src="${window.location.origin}/logos/Black%20logo%20(Light%20mode).png" alt="Union Vault" height="20">
          <img class="vb-ft-crest vb-ft-crest-dark" src="${window.location.origin}/logos/White%20logo%20(Dark%20mode).png" alt="Union Vault" height="20">
          <span class="vb-ft-txt"><b>UNION</b><i>VAULT</i></span>
        </a>
      </div>
    </div>
  `);
}

function _showVendorExpired(vendor, couple, theme){
  const ev=(couple&&couple.event)||{};
  const p1=ev.partner1||'', p2=ev.partner2||'';
  const coupleName=(p1&&p2)?`${p1} & ${p2}`:(p1||p2||'the couple');
  _publicPageShell(`
    ${_publicCss((theme&&theme.accent),(theme&&theme.page),(theme&&theme.band))}
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 24px">
      <div style="max-width:400px;width:100%;text-align:center">
        <div class="pub-ring">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div class="pub-eyebrow">Access expired</div>
        <div class="pub-couple" style="font-size:22px;margin-bottom:10px">This link has expired</div>
        <div style="font-size:13.5px;color:var(--pub-text);line-height:1.6">
          Your vendor access link for ${coupleName} has passed its expiry date.<br>
          Please contact them directly to request a new link.
        </div>
        <div class="pub-footer" style="margin-top:20px">Powered by <strong>Union Vault</strong></div>
      </div>
    </div>`);
}

function _showVendorError(type){
  _publicPageShell(`
    ${_publicCss()}
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 24px">
      <div style="max-width:400px;width:100%;text-align:center">
        <div class="pub-ring" style="opacity:.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="pub-eyebrow">${type==='not-found'?'Link not found':'Something went wrong'}</div>
        <div class="pub-couple" style="font-size:22px;margin-bottom:10px">${type==='not-found'?'Vendor link not found':'Error loading page'}</div>
        <div style="font-size:13.5px;color:var(--pub-text);line-height:1.6">${type==='not-found'?'This vendor link doesn\'t exist or has been removed. Please contact the couple for a new link.':'There was a problem loading this page. Please try again or contact the couple directly.'}</div>
      </div>
    </div>`);
}

/* ══ END STAGE 5 PUBLIC PAGES ══════════════════════════════════════════════ */

/* ── BOOT ──────────────────────────────────────────────────────────────────
   The ONE async step the whole app depends on. Every render site reads images
   synchronously via _mediaUrl(), which needs the blob cache populated. So we
   read every blob out of IndexedDB, mint the URLs, migrate any leftover data:
   URLs from the old build, and only THEN render.

   If IndexedDB fails outright (private mode, ancient browser), we still render
   — the planner works, images just show as missing rather than the whole app
   refusing to load. */
(async function boot(){
  // ── Stage 5: intercept public URL params BEFORE the normal app boot ────────
  const _bootParams = new URLSearchParams(window.location.search);
  const _rsvpParam     = _bootParams.get('rsvp');
  const _vendorParam   = _bootParams.get('vendor');
  const _runsheetParam = _bootParams.get('runsheet');
  const _inviteParam   = _bootParams.get('invite');

  if(_rsvpParam){
    // Hide the app shell entirely — this is a public-facing page
    document.body.style.visibility='hidden';
    if(_rsvpParam==='true'){
      // Legacy link — show polite "link has expired / been updated" message
      _showRsvpExpired();
    } else {
      // Valid UID-based link
      await _showRsvpForm(_rsvpParam);
    }
    document.documentElement.style.visibility='';
    document.body.style.visibility='visible';
    return; // do NOT boot the planner app
  }

  if(_vendorParam){
    document.body.style.visibility='hidden';
    await _showVendorPortal(_vendorParam);
    document.body.style.visibility='visible';
    return; // do NOT boot the planner app
  }

  if(_inviteParam){
    // Public "View your invitation" page — the couple's uploaded invitation + RSVP button.
    _showPublicInvite(_inviteParam, _bootParams.get('t')==='pdf');
    return; // do NOT boot the planner app
  }

  if(_runsheetParam){
    // Public run sheet — no login required; fetch couple's public moments from Supabase
    await _showPublicRunSheet(_runsheetParam);
    return; // do NOT boot the planner app
  }

  // Recovery token from password-reset email: #access_token=...&type=recovery
  const _hashParams=new URLSearchParams(window.location.hash.slice(1));
  if(_hashParams.get('type')==='recovery'){
    const _recoveryToken=_hashParams.get('access_token');
    history.replaceState(null,'',window.location.pathname+window.location.search);
    _showResetPasswordModal(_recoveryToken);
    return; // do NOT boot the planner app
  }

  // Load session before public site render so the owner can generate signed URLs for their own photos
  _sbLoadSession();

  const _hashSlug=window.location.hash.slice(1);
  // Reserved landing-page anchors that must never be treated as wedding site slugs
  const _lpAnchors=new Set(['auth','faq','contact','signup','login','register','pricing','features','hero','about']);
  if(_hashSlug && !_lpAnchors.has(_hashSlug) && /^[a-z0-9][a-z0-9-]{0,59}$/.test(_hashSlug)){
    // Hash matches a wedding site slug — render the public wedding website
    document.body.style.visibility='hidden';
    await _showPublicWeddingSite(_hashSlug);
    return; // do NOT boot the planner app
  }
  // ── End Stage 5 URL intercept ───────────────────────────────────────────────
  try{
    await _mediaLoadAll();
    await _mediaMigrate();
    await _refreshStorageEstimate();
  }catch(e){
    console.warn('Media store unavailable', e);
  }

  if(alreadySetUp && _sbSession){
    // Safety: verify local data belongs to the signed-in user before trusting it.
    // This catches stale localStorage left by a different account (e.g. previous session on shared device).
    var _bootUID = null;
    try{ _bootUID = localStorage.getItem('uv_uid'); }catch(_){}
    if(_bootUID && _bootUID !== _sbSession.user.id){
      // Local data belongs to a different user — wipe it and reload so we fetch our own cloud data.
      try{ localStorage.removeItem(STORAGE_KEY); }catch(_){}
      try{ localStorage.setItem('uv_uid', _sbSession.user.id); }catch(_){}
      location.reload();
      return;
    }
    // Fully set up + signed in → go straight to app, then check for cloud conflict
    document.getElementById('welcome-overlay').classList.add('hidden');
    updateTopbarSub();
    if(typeof _updateAccountChip !== 'undefined') _updateAccountChip();
    navigate('dashboard');
    // Stage 3: async conflict check (runs after UI is visible, non-blocking)
    setTimeout(_autoSyncCheckOnBoot, 800);
    // Stage 4: fetch any photos missing locally (runs after conflict check)
    setTimeout(_mediaCloudSync, 2000);
  } else if(!alreadySetUp && _sbSession){
    // Signed in but no local data: triggered by sign-in on a device that had another account's data
    // (the mismatch handler in _lpSignIn cleared localStorage and reloaded). Auto-load from cloud.
    var _bootCloud = await _cloudLoad();
    if(_bootCloud.ok && !_bootCloud.empty){
      if(_bootCloud.saved.event)    Object.assign(STATE.event, _bootCloud.saved.event);
      if(_bootCloud.saved.settings) Object.assign(STATE.settings, _bootCloud.saved.settings);
      ['guests','checklist','vendors','quotes','checklistCategories','checklistDrafts','checklistCatOrder','tables','timeline','families','invites'].forEach(function(k){ if(_bootCloud.saved[k]) STATE[k]=_bootCloud.saved[k]; });
      ['budget','seating','inspo','visionboard','wishingwell','website','events','tagDefs','inviteMeta','invitation','dashWidgetOrder','dashLayout','dashHiddenWidgets'].forEach(function(k){ if(_bootCloud.saved[k]) STATE[k]=_bootCloud.saved[k]; });
      saveToStorage();
      document.getElementById('welcome-overlay').classList.add('hidden');
      updateTopbarSub();
      navigate('dashboard');
      // Only skip setup if partner names were actually entered
      if(STATE.event.partner1 || STATE.event.partner2){
        if(typeof _cloudToast !== 'undefined') _cloudToast('Your data has been restored from the cloud ✓');
        window._autoSyncState='saved'; window._autoSyncLastSaved=Date.now();
        if(typeof _syncStatusRefresh !== 'undefined') _syncStatusRefresh();
        setTimeout(_mediaCloudSync, 800);
      } else {
        _showSetupModal();
      }
    } else {
      // No cloud data for this account → show setup
      document.getElementById('welcome-overlay').classList.add('hidden');
      updateTopbarSub();
      navigate('dashboard');
      _showSetupModal();
    }
  } else if(alreadySetUp && !_sbSession){
    // Has local data but not signed in → show landing (auth prompt)
    updateTopbarSub();
    navigate('dashboard');
    document.getElementById('welcome-overlay').classList.remove('hidden');
  } else {
    // First-time visitor → show landing first; after auth/_lpContinueOffline the setup modal appears
    updateTopbarSub();
    navigate('dashboard');
    document.getElementById('welcome-overlay').classList.remove('hidden');
  }
})();
