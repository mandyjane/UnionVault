// WEBSITE BUILDER
// ══════════════════════════════════════════════
// The guest-facing site. Content is NOT stored twice: sections read from the planner
// (STATE.event, STATE.timeline, STATE.inspo, STATE.wishingwell). STATE.website holds
// only what the planner has no opinion about — which sections are on, their order, the
// theme, and site-only copy (FAQ, accommodation).
//
// RSVP is present but LOCKED. It cannot work: a guest's phone cannot write to this
// browser. It is shown, greyed, with the reason stated — an honest placeholder rather
// than a button that pretends.

const WB_SECTIONS = {
  home:          {name:'Home',          src:'Details',      icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'},
  details:       {name:'Event details', src:'Details',      icon:'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'},
  schedule:      {name:'Timeline',          src:'Timeline',  icon:'M12 6v6l4 2'},
  gallery:       {name:'Gallery',       src:'Inspiration',  icon:'M21 15l-5-5L5 21'},
  wishingwell:   {name:'Wishing well',  src:'Wishing Well', icon:'M20 12v10H4V12'},
  countdown:     {name:'Countdown',     src:'',             icon:'M12 6v6l4 2'},
  accommodation: {name:'Accommodation', src:'',             icon:'M3 21h18M5 21V7l7-4 7 4v14'},
  faq:           {name:'FAQ',           siteName:'Questions', src:'', icon:'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'},
  rsvp:          {name:'RSVP',          src:'',             icon:'M22 6l-10 7L2 6'}
};
// Sections that cannot be built without a server. Shown, locked, with the reason.
const WB_LOCKED = {};

const WB_PRESETS = {
  champagne: {label:'Champagne', page:'#E8DDD0', band:'#DDD3C4', accent:'#C9A227', heading:'#4A3F35', text:'#5A5148', button:'#8B7355'},
  sage:      {label:'Sage',      page:'#E4EAE3', band:'#D5DED4', accent:'#4A6349', heading:'#2F3B2E', text:'#4A544A', button:'#4A6349'},
  dusk:      {label:'Dusk',      page:'#F0E3E6', band:'#E5D2D7', accent:'#8A5A66', heading:'#4A2F36', text:'#5E4750', button:'#8A5A66'},
  midnight:  {label:'Midnight',  page:'#E6E9EF', band:'#D6DBE4', accent:'#40506B', heading:'#232B3A', text:'#4A5364', button:'#40506B'},
  noir:      {label:'Noir',      page:'#1E1C1A', band:'#2A2724', accent:'#C9A227', heading:'#F0EAE0', text:'#C8C0B4', button:'#C9A227'},
  linen:     {label:'Linen',     page:'#F5F0E8', band:'#EAE3D6', accent:'#8B7355', heading:'#3A352F', text:'#5E574D', button:'#8B7355'},
  terracotta:{label:'Terracotta',page:'#EDE6DC', band:'#E0D5C6', accent:'#A85D3C', heading:'#4A3128', text:'#5E4A40', button:'#A85D3C'},
  eucalypt:  {label:'Eucalypt',  page:'#E8EDE9', band:'#D7E0DA', accent:'#2E5A4B', heading:'#1F3B31', text:'#455650', button:'#2E5A4B'}
};

// Font stacks offered for the guest site. All are loaded by the site's own <link>.
const WB_FONTS = [
  ["'Cormorant Garamond',serif", 'Cormorant Garamond'],
  ["'Cinzel',serif",             'Cinzel'],
  ["'Playfair Display',serif",   'Playfair Display'],
  ["'Lora',serif",               'Lora'],
  ["'Libre Baskerville',serif",  'Libre Baskerville'],
  ["'Inter',sans-serif",         'Inter'],
  ["'Montserrat',sans-serif",    'Montserrat'],
  ["'Lato',sans-serif",          'Lato'],
  ["'Raleway',sans-serif",       'Raleway'],
  ["'Josefin Sans',sans-serif",  'Josefin Sans']
];
const WB_CORNERS = { sharp:'0px', round:'10px', pill:'999px' };

// Per-block IMAGE SHAPE — distinct from WB_CORNERS above, which is the site-wide corner
// style for buttons and cards as well. 'rounded' is the default and emits NO class, so
// every existing block keeps exactly the look it has today with no migration.
const WB_SHAPES = { rounded:'Rounded', square:'Square', round:'Circle', original:'Original' };
function _wbShapeCls(b){
  const sh=b && b.shape;
  return (sh==='square') ? ' sh-square' : (sh==='round' ? ' sh-round' : (sh==='original' ? ' sh-original' : ''));
}

// How the Save-the-date button is drawn. The COLOUR is theme.button — which, until v129,
// was a swatch in the theme editor that every preset defined and NOTHING on the guest site
// ever rendered. The one button on the site drew itself in `accent` instead, and inside a
// hero it was hardcoded to WHITE (see the .ics CSS). Mandy found the white one.
const WB_BTN_STYLES = ['outline','filled','soft'];

// Hero heights. Each is a vh with a px FLOOR — a 13" laptop in a half-height window has a
// viewport around 400px tall, and 45vh of that is 180px, which is not a hero, it is a strip.
// max() takes whichever is larger, so the hero can never collapse below something usable.
const WB_HERO_H = {
  short: 'max(45vh, 340px)',
  tall:  'max(65vh, 460px)',
  full:  'max(100vh, 560px)'
};


// Starting points for a new custom section. These are NOT special types — each just
// pre-fills the name and body of an ordinary custom section.
const WB_CUSTOM_PRESETS = [
  {key:'story',    name:'Our story',       body:'How we met, and everything since.'},
  {key:'party',    name:'The bridal party',body:''},
  {key:'travel',   name:'Getting there',   body:'Parking, transport and directions.'},
  {key:'registry', name:'Registry',        body:''},
  {key:'dress',    name:'Dress code',      body:''},
  {key:'faq',      name:'FAQ',             body:'Answers to your most common questions.'},
  {key:'countdown',name:'Countdown',       body:'The big day is almost here!'},
  {key:'stays',    name:'Accommodation',   body:'Places to stay nearby for our out-of-town guests.'},
  {key:'tips',     name:'Local tips',      body:'Our favourite spots — things to do, see and eat while you\'re in town.'},
  {key:'music',    name:'Song requests',   body:'Help us fill the dance floor — drop us a request!'},
  {key:'photos',   name:'Share photos',    body:'We\'d love to see the day through your eyes. Upload your snaps here.'}
];

function _wbSite(){
  // Defensive read: a STATE restored from an older export has no .website.
  if(!STATE.website) STATE.website = { order:Object.keys(WB_SECTIONS), on:{}, theme:{}, home:{}, gallery:[], faq:[], stays:[] };
  const w = STATE.website;
  if(!Array.isArray(w.order)) w.order = Object.keys(WB_SECTIONS);
  if(!w.removed || typeof w.removed!=='object') w.removed={};
  // Any section added in a later version won't be in a saved order — append it.
  // Skip sections the user has explicitly removed.
  Object.keys(WB_SECTIONS).forEach(k=>{ if(w.order.indexOf(k)<0 && !w.removed[k]) w.order.push(k); });
  if(!w.on) w.on = {};
  if(!w.theme) w.theme = {};
  if(!w.home) w.home = {};
  if(!w.images || typeof w.images!=='object') w.images = {};
  if(!Array.isArray(w.gallery)) w.gallery = [];
  // v148: gallery-owned uploaded photos, each {id, image:mediaId}. Separate from Inspiration
  // so an upload doesn't clutter the inspiration board unless the user promotes it. Their
  // ids also live in w.gallery (the picked/ordered list). The `image` field name means the
  // media walker carries them through export/import with no walker change (v145 registry proof).
  if(!Array.isArray(w.galleryUploads)) w.galleryUploads = [];
  if(!Array.isArray(w.faq)) w.faq = [];
  if(!Array.isArray(w.stays)) w.stays = [];
  if(!w.custom || typeof w.custom!=='object') w.custom={};
  if(!w.rsvp || typeof w.rsvp!=='object') w.rsvp={};
  if(!w.rsvp.fields || typeof w.rsvp.fields!=='object') w.rsvp.fields={};
  if(!w.rsvp.customColors || typeof w.rsvp.customColors!=='object') w.rsvp.customColors={};
  if(!w.layout || typeof w.layout!=='object') w.layout={};
  if(!w.details || typeof w.details!=='object') w.details={};
  if(!w.details.hide || typeof w.details.hide!=='object') w.details.hide={};
  if(!w.hero || typeof w.hero!=='object') w.hero={mediaId:'', style:'over', scrim:35, ink:'light'};
  // v121: the names over a hero photo used to be hardcoded white. They're now a choice.
  // An older STATE has no `ink` — 'light' is what it was already doing, so nobody's site
  // changes appearance on upgrade.
  if(w.hero.ink!=='dark' && w.hero.ink!=='light') w.hero.ink='light';
  // v125 hero fields. Defaults chosen so an older STATE renders as close to v124 as the
  // (deliberately changed) height allows — everything visible, nothing hidden.
  if(WB_HERO_H[w.hero.height]===undefined) w.hero.height='tall';
  if(typeof w.hero.pos!=='string' || !/%/.test(w.hero.pos)) w.hero.pos='50% 50%';
  // v127. Zoom is a PERCENTAGE OF FIT-TO-FRAME, not of the photo's pixels.
  //   >= 100  the photo fills the frame and crops   (object-fit:cover, then scaled up)
  //   <  100  the whole photo shows, matted         (object-fit:contain, scaled down)
  // 100 is the crossover and is EXACTLY the v126 behaviour, so nobody's hero changes on
  // upgrade — the same contract the Composer migration honoured.
  // v131: the zoom is now anchored to CONTAIN, not COVER. 100 means "the whole photo is
  // visible"; it used to mean "fills the frame". The SAME NUMBER now means a different
  // picture, so a stale value would silently be wrong — a 100 written under the old meaning
  // is not a 100 under the new one.
  //
  // So it is reset ONCE, on first read after upgrade, and a flag records that it happened.
  // A migration that leaves a number in place whose MEANING changed underneath it is worse
  // than one that resets: the value looks deliberate and is not.
  if(w.hero.zoomV!==2){ w.hero.zoom=100; w.hero.zoomV=2; }
  w.hero.zoom = Math.max(50, Math.min(250, Number(w.hero.zoom)||100));
  if(typeof w.hero.showNames!=='boolean') w.hero.showNames=true;
  if(typeof w.hero.showDate !=='boolean') w.hero.showDate =true;
  if(typeof w.hero.showIcs  !=='boolean') w.hero.showIcs  =true;
  if(typeof w.brandOff!=='boolean') w.brandOff=false;
  // Free-tier users cannot hide the badge — force it back on
  if(_sbSession && typeof _uvIsPaid==='function' && !_uvIsPaid()) w.brandOff=false;
  const t = w.theme;
  if(!t.page) t.page='#E8DDD0';
  if(!t.band) t.band='#DDD3C4';
  if(!t.accent) t.accent='#C9A227';
  // v120 renamed heading/body (fonts) -> headFont/bodyFont, and freed `heading`/`text`
  // to be COLOURS. Migrate an older STATE rather than silently rendering a font name as
  // a colour: the old value is a font stack, which is recognisably not a hex.
  if(t.heading && String(t.heading).indexOf('#')!==0){ t.headFont=t.heading; t.heading=''; }
  if(t.body && String(t.body).indexOf('#')!==0){ t.bodyFont=t.body; delete t.body; }
  if(!t.heading) t.heading = (t.text && String(t.text).indexOf('#')===0) ? t.text : '#4A3F35';
  if(!t.text || String(t.text).indexOf('#')!==0) t.text='#5A5148';
  if(!t.button) t.button='#8B7355';
  // v132: item titles get their own colour. `.sched .d b` (a moment), `.stays b` (a place)
  // and `.faq b` (a question) are the SAME ROLE — a title inside a list, one level below
  // the section heading — and they all took `heading`. Now they take `item`.
  //
  // It DEFAULTS to the heading colour, so nobody's site changes on upgrade. The role is
  // separated first; the colour is chosen later, or never.
  if(!t.item || String(t.item).indexOf('#')!==0) t.item = t.heading;
  if(!t.headFont) t.headFont="'Cormorant Garamond',serif";
  if(!t.bodyFont) t.bodyFont="'Inter',sans-serif";
  if(typeof t.scale!=='number') t.scale=100;
  // v129: one Text size slider became TWO — headings and body scale independently.
  // BOTH inherit the old single value, so a v128 site renders identically on upgrade.
  // `scale` is KEPT (not deleted) so a downgrade still works — same rule as the Composer's
  // legacy `images`: a migration writes the new shape and leaves the old one alone.
  if(typeof t.headScale!=='number') t.headScale=t.scale;
  if(typeof t.bodyScale!=='number') t.bodyScale=t.scale;
  t.headScale=Math.max(85,Math.min(125,t.headScale));
  t.bodyScale=Math.max(85,Math.min(125,t.bodyScale));
  // v129: the Save-the-date button. `btnStyle` is how it is drawn; `button` is its colour —
  // a colour that has existed in every preset since v120 and was rendered by NOTHING.
  if(WB_BTN_STYLES.indexOf(t.btnStyle)<0) t.btnStyle='outline';
  if(typeof t.space!=='number') t.space=100;
  // Migrate gap: old range was 50–160 (scaling multiplier); new range is 0–100 (direct px gap).
  // gapV=2 marks that the new system is active; without it we run the one-time conversion.
  if(t.gapV!==2){
    const old=typeof t.gap==='number'?t.gap:100;
    t.gap=old>100?Math.min(100,Math.round((old-100)*0.8)):0;
    t.gapV=2;
  }
  if(t.gap<0||t.gap>100) t.gap=0;
  if(typeof t.secpad!=='number') t.secpad=52;
  if(typeof t.secpadH!=='number') t.secpadH=24;
  if(typeof t.secBodyScale!=='number') t.secBodyScale=100;
  if(!t.background||String(t.background).indexOf('#')!==0) t.background=t.page;
  if(typeof t.maxWidth!=='number') t.maxWidth=720;
  t.maxWidth=Math.max(600,Math.min(1400,t.maxWidth));
  if(!['top','side'].includes(t.navPos)) t.navPos='top';
  if(typeof w.published!=='boolean') w.published=false;
  // Migrate old corner keys (soft→round) and validate
  if(t.corners==='soft') t.corners='round';
  if(!WB_CORNERS[t.corners]) t.corners='round';
  if(!['none','sm','md','lg'].includes(t.btnSize)) t.btnSize='md';
  if(!['none','soft','strong'].includes(t.btnShadow)) t.btnShadow='none';
  if(typeof t.btnBevel!=='boolean') t.btnBevel=false;
  if(t.shadow==='soft') t.shadow=33; else if(t.shadow==='lifted') t.shadow=66; else if(typeof t.shadow!=='number') t.shadow=0; else t.shadow=Math.max(0,Math.min(100,t.shadow));
  if(t.cardStyle==='bordered') t.cardStyle=33; else if(t.cardStyle==='bevel') t.cardStyle=66; else if(typeof t.cardStyle!=='number') t.cardStyle=0; else t.cardStyle=Math.max(0,Math.min(100,t.cardStyle));
  if(!['modern','editorial'].includes(t.format)) t.format='modern';
  t.rsvpMode='modal';
  if(!['thin','medium','bold'].includes(t.btnBorder)) t.btnBorder='medium';
  if(!['center','left'].includes(t.align)) t.align='center';
  if(!['left','center','justify'].includes(t.bodyAlign)) t.bodyAlign='left';
  if(typeof t.css!=='string') t.css='';
  // v185: website slug for hash-routing. Auto-generated from partner names + unique user suffix.
  if(!w.slug || typeof w.slug!=='string'){
    const ev=STATE.event||{};
    const p1=(ev.partner1||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const p2=(ev.partner2||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const base=[p1,p2].filter(Boolean).join('-')||'our-wedding';
    // Append 5 chars from the user's ID so two couples with identical names never share a slug
    const uid=(_sbSession&&_sbSession.user&&_sbSession.user.id)||'';
    const suffix=uid.replace(/-/g,'').slice(0,5)||Math.random().toString(36).slice(2,7);
    w.slug=base+'-'+suffix;
  }
  return w;
}

// ── Website public URL helper ──
function _wbSiteUrl(){
  const slug = _wbSite().slug || 'our-wedding';
  return window.location.origin + window.location.pathname + '#' + encodeURIComponent(slug);
}
// ── Download a rendered QR code (from qrcodejs canvas) as a PNG ──
// `wrapperId` = id of the div containing the QRCode canvas; `filename` = download name.
function _downloadQr(wrapperId, filename){
  const wrap = document.getElementById(wrapperId);
  if(!wrap) return;
  const canvas = wrap.querySelector('canvas');
  if(!canvas){ alert('QR code not ready yet — please wait a moment and try again.'); return; }
  // Draw onto a new canvas with a white background (transparent-bg PNGs look broken when printed)
  const out = document.createElement('canvas');
  const pad = 20;
  out.width  = canvas.width  + pad*2;
  out.height = canvas.height + pad*2;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,out.width,out.height);
  ctx.drawImage(canvas, pad, pad);
  out.toBlob(blob=>{
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'qr-code.png';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  },'image/png');
}
// ── Website QR popover toggle ──
let _wbQrBuilt = false;
function _wbQrToggle(ev){
  if(ev) ev.stopPropagation();
  const pop = document.getElementById('wb-qr-pop');
  if(!pop) return;
  const open = !pop.hasAttribute('hidden');
  if(open){ pop.setAttribute('hidden',''); return; }
  pop.removeAttribute('hidden');
  if(!_wbQrBuilt){
    _wbQrBuild();
  }
  setTimeout(()=>{ document.addEventListener('click',_wbQrOutside,{once:true}); },0);
}
function _wbQrOutside(ev){
  const pop=document.getElementById('wb-qr-pop');
  if(pop && ev.target.closest && ev.target.closest('#wb-qr-pop,#wb-qr-btn')) return;
  if(pop) pop.setAttribute('hidden','');
}
function _wbQrBuild(){
  const url = _wbSiteUrl();
  const wrap = document.getElementById('wb-qr-canvas');
  if(wrap && typeof QRCode!=='undefined'){
    wrap.innerHTML='';
    new QRCode(wrap,{text:url,width:160,height:160,colorDark:'#1A1A18',colorLight:'#ffffff'});
    _wbQrBuilt=true;
  }
  const linkEl=document.getElementById('wb-qr-link');
  if(linkEl) linkEl.textContent=url;
}
async function _wbSaveSlug(val){
  const slug = (val||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'our-wedding';
  const msg = document.getElementById('wb-slug-msg');
  const inp = document.getElementById('wb-slug-inp');
  function _setMsg(text, color){
    if(msg){ msg.textContent=text; msg.style.color=color||'var(--muted)'; }
  }
  // Uniqueness check — only when signed in and slug changed
  const currentSlug = _wbSite().slug;
  if(_sbSession && slug !== currentSlug){
    _setMsg('Checking availability…','var(--muted)');
    try{
      const uid = _sbSession.user.id;
      const rpcUrl = `${_SB_URL}/rest/v1/rpc/check_slug_available`;
      const _timeout = new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),4000));
      const chk = await Promise.race([
        fetch(rpcUrl,{method:'POST',headers:{'apikey':_SB_KEY,'Authorization':_sbAuthHdr(),'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({p_slug:slug,p_user_id:uid})}),
        _timeout
      ]);
      if(chk.ok){
        const available = await chk.json();
        if(!available){
          _setMsg('Link unavailable. Please try a different link.','var(--red)');
          if(inp) inp.value = currentSlug;
          return;
        }
      }
    }catch(e){
      _setMsg(e.message==='timeout'?'Could not verify availability — please try again.':'Connection error — please try again.','var(--red)');
      return;
    }
  }
  _wbSite().slug = slug;
  saveToStorage();
  _setMsg('Link available. Saved! ✓','var(--green)');
  setTimeout(()=>_setMsg('Auto-generated from your names. Edit to customise — letters, numbers and hyphens only.','var(--muted)'),2000);
  // Rebuild QR with new URL
  _wbQrBuilt=false;
  if(inp) inp.value=slug;
  const wrap=document.getElementById('wb-qr-canvas');
  if(wrap) wrap.innerHTML='';
  _wbQrBuild();
  // Update the RSVP page QR link text if visible
  const linkEl=document.getElementById('wb-qr-link');
  if(linkEl) linkEl.textContent=_wbSiteUrl();
}
// ── The section lookup. THE key abstraction of v120.
// WB_SECTIONS is a constant; custom sections are data. Every read of "what is section X"
// goes through here, so a custom section is a first-class citizen everywhere — drag,
// toggle, images, layout — with no special-casing at the call sites.
function _wbMeta(key){
  const built = WB_SECTIONS[key];
  if(built) return built;
  const c = _wbSite().custom[key];
  if(c) return {name:c.name||'Untitled', src:'', custom:true};
  return null;
}
function _wbIsCustom(key){ return !!_wbSite().custom[key]; }
// The heading actually shown on the site: a per-section override, else the section's name.
// The heading GUESTS see. A user override wins; otherwise the section's public name,
// which may differ from the builder row's label (the FAQ row says "FAQ"; the site has
// always said "Questions", and routing this through one function must not silently
// rename it).
function _wbHeading(key){
  const lay=_wbSite().layout[key]||{};
  if(lay.heading != null) return lay.heading;  // '' = explicitly cleared → no heading
  const m=_wbMeta(key);
  return m?(m.siteName||m.name):'';
}
function _wbNavLabel(key){
  const lay=_wbSite().layout[key]||{};
  if(lay.heading) return lay.heading;           // custom heading if non-empty
  const m=_wbMeta(key);
  return m?(m.siteName||m.name):'';            // always fall back for nav
}
function _wbLayout(key){
  const w=_wbSite();
  if(!w.layout[key]) w.layout[key]={};
  const l=w.layout[key];
  if(!l.align) l.align='center';
  if(!l.bg) l.bg='page';
  // v122: `align` governs the heading + intro; `body` governs the section's own content.
  // They were one control, and `body` was hardcoded left in the CSS — so "Centre" centred
  // the heading and silently did nothing to the words underneath it.
  // Defaults to 'left' = the v121 behaviour. Nobody's site changes on upgrade.
  if(WB_BODY_ALIGNS.indexOf(l.body)<0) l.body='left';
  // Justify cannot apply to a schedule time or a venue name. If a section was prose and
  // is somehow now structured (or a stale STATE carries justify on Details), fall back
  // rather than writing a CSS class that means nothing.
  if(l.body==='justify' && !_wbIsProse(key)) l.body='left';
  return l;
}

const WB_BODY_ALIGNS = ['left','center','justify'];

// Wishing well is STRUCTURED, not prose — it renders a <dl> of PayID / bank / reference
// rows. Justifying a BSB is meaningless. Its message is a .lead — a display line, not a
// paragraph. Read the renderer; don't guess from the section's name.
//
// Home, Gallery and Countdown get NO body control at all. Home is a <header>, not a
// <section> — `wrap()` never touches it, so a control there would be a button that cannot
// reach its own content. Gallery is images. Countdown is one number. A control that does
// nothing on the section you are looking at is worse than no control.
//
// This is a claim about what a section's content IS, not how it looks — the same
// distinction that has bitten this codebase three times as `.wb-src` / `.wb-slot`. A
// custom section is always prose; that is the entire definition of a custom section.
const WB_STRUCTURED = ['details','schedule','accommodation','wishingwell'];
const WB_NO_BODY    = ['home','gallery','countdown'];
// Sections that do NOT go through wrap(), so the whole Layout block (heading, intro, align,
// background, hide-heading) has nothing to act on. Home is a <header>. Rendering the block
// there gives you five controls that silently do nothing — which is worse than not having
// them, because a dead control teaches the wrong model of the system.
const WB_NO_LAYOUT  = ['home'];
function _wbIsProse(key){ return WB_STRUCTURED.indexOf(key)<0 && WB_NO_BODY.indexOf(key)<0; }
function _wbHasBody(key){ return WB_NO_BODY.indexOf(key)<0; }

// Couple's names, straight from the planner.
function _wbCouple(){
  const e = STATE.event||{};
  const a = (e.partner1||'').trim(), b = (e.partner2||'').trim();
  return (a&&b) ? (a+' & '+b) : (a||b||'Our Wedding');
}
// Days until the wedding. Null when no date is set.
function _wbDaysLeft(){
  const d = (STATE.event||{}).date;
  if(!d) return null;
  const then = new Date(d+'T00:00:00'), now = new Date();
  now.setHours(0,0,0,0);
  if(isNaN(then.getTime())) return null;
  return Math.round((then-now)/86400000);
}
// The timeline moments guests are allowed to see. `pub` defaults false — see saveTimelineItem.
function _wbPublicMoments(){
  return (STATE.timeline||[]).filter(x=>x.pub).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
}
// Gallery images: inspo items OR gallery-uploaded photos the user has picked, IN the order
// of w.gallery (so a future reorder is honoured). Each resolves to an object carrying `image`.
function _wbGalleryItems(){
  const picked = _wbSite().gallery;
  const inspo = (STATE.inspo&&STATE.inspo.items?STATE.inspo.items:[]);
  const ups   = _wbSite().galleryUploads||[];
  const byId={};
  inspo.forEach(i=>{ if(i.image) byId[i.id]=i; });
  ups.forEach(u=>{ if(u.image) byId[u.id]=u; });
  return picked.map(id=>byId[id]).filter(Boolean);
}
// All photos available to pick in the Gallery editor: inspiration photos + gallery uploads.
// Uploads first so a freshly-added photo is easy to find at the top.
function _wbGalleryPickable(){
  const inspo = (STATE.inspo&&STATE.inspo.items?STATE.inspo.items:[]).filter(i=>i.image)
                 .map(i=>({id:i.id, image:i.image, title:i.title||'', src:'inspo'}));
  const ups   = (_wbSite().galleryUploads||[]).filter(u=>u.image)
                 .map(u=>({id:u.id, image:u.image, title:'', src:'upload', inInspo:_wbUploadInInspo(u)}));
  return ups.concat(inspo);
}
// Has this uploaded photo already been promoted into Inspiration? (matched by mediaId)
function _wbUploadInInspo(u){
  const items=(STATE.inspo&&STATE.inspo.items?STATE.inspo.items:[]);
  return items.some(i=>i.image===u.image);
}

// A one-line summary under each row, so the list says something true at a glance.
function _wbSubline(key){
  const w=_wbSite(), e=STATE.event||{};
  if(key==='home')      return [_wbCouple(), e.date?fmtDate(e.date):'No date set'].filter(Boolean).join(' · ');
  if(key==='details')   return e.venue || 'No venue set';
  if(key==='schedule'){ const n=_wbPublicMoments().length, t=(STATE.timeline||[]).length;
                        return n===0 ? 'No moments shared yet' : (n+' of '+t+' moment'+(t===1?'':'s')+' visible to guests'); }
  if(key==='gallery'){  const n=_wbGalleryItems().length, t=(STATE.inspo&&STATE.inspo.items?STATE.inspo.items:[]).filter(i=>i.image).length;
                        return n===0 ? 'No images chosen' : (n+' of '+t+' image'+(t===1?'':'s')+' chosen'); }
  if(key==='wishingwell') return (STATE.wishingwell&&STATE.wishingwell.enabled)?'Message and payment details':'Turned off in Wishing Well';
  if(key==='countdown'){ const d=_wbDaysLeft(); return d===null?'Set a date in Event Details':(d>0?d+' days to go':(d===0?'Today':'Already happened')); }
  if(key==='accommodation'){ const n=w.stays.length; return n===0?'No places listed':(n+' place'+(n===1?'':'s')+' listed'); }
  if(key==='faq'){ const n=w.faq.length; return n===0?'No questions yet':(n+' question'+(n===1?'':'s')); }
  if(key==='rsvp')  return 'Share your link · guests fill it in online';
  const c=w.custom[key];
  if(c){
    const words=String(c.body||'').trim();
    const paras=words?words.split(/\n\s*\n/).filter(Boolean).length:0;
    return paras?(paras+' paragraph'+(paras===1?'':'s')):'No text yet';
  }
  return '';
}
// How many images a section carries, across both slots.
function _wbImgCount(key){
  const g=(_wbSite().images||{})[key];
  if(!g) return 0;
  return ['top','bottom'].reduce((n,slot)=>{
    const b=g[slot];
    return n + ((b&&Array.isArray(b.ids))?b.ids.length:0);
  },0);
}

// ── The builder page ──
function renderWebsite(c, actions){
  const w = _wbSite();
  const t = w.theme;

  _wbQrBuilt=false; // reset so popover rebuilds with current slug on next open
  const wSlug = (w.slug||'our-wedding');
  actions.innerHTML = `
    <div style="position:relative;display:inline-block">
      <button id="wb-qr-btn" class="btn btn-outline btn-sm" onclick="_wbQrToggle(event)" style="display:inline-flex;align-items:center;gap:6px" title="QR Code &amp; share link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="10" y="10" width="2" height="2"/><rect x="14" y="14" width="2" height="2"/><rect x="18" y="14" width="2" height="2"/><rect x="14" y="18" width="2" height="2"/><rect x="18" y="18" width="2" height="2"/><rect x="10" y="14" width="2" height="2"/><rect x="10" y="18" width="2" height="2"/></svg>
        QR Code
      </button>
      <div id="wb-qr-pop" hidden style="position:absolute;right:0;top:calc(100% + 8px);z-index:9999;width:260px;background:var(--cream);border:1px solid var(--border);border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.16);padding:16px;display:flex;flex-direction:column;gap:12px">
        <div style="font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Wedding Website QR</div>
        <div id="wb-qr-canvas" style="background:#fff;padding:10px;display:inline-block;border-radius:8px;border:1px solid var(--border);align-self:center"></div>
        <div style="font-size:10.5px;color:var(--muted);word-break:break-all;line-height:1.4" id="wb-qr-link"></div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-outline btn-sm" style="flex:1;font-size:11px" onclick="navigator.clipboard.writeText(_wbSiteUrl()).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy link',1500)}).catch(()=>{})">Copy link</button>
          <button class="btn btn-primary btn-sm" style="flex:1;font-size:11px;display:inline-flex;align-items:center;justify-content:center;gap:5px" onclick="_downloadQr('wb-qr-canvas','wedding-site-qr.png')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PNG
          </button>
        </div>
        <div style="border-top:1px solid var(--border);padding-top:10px">
          <div style="font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Your link name</div>
          <div style="display:flex;gap:6px;align-items:center">
            <input id="wb-slug-inp" class="form-input" value="${_escHtml(wSlug)}" style="flex:1;font-size:11.5px;padding:5px 8px" placeholder="your-names" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')" onkeydown="if(event.key==='Enter'){event.preventDefault();_wbSaveSlug(this.value);}"/>
            <button class="btn btn-sm btn-outline" onclick="_wbSaveSlug(document.getElementById('wb-slug-inp').value)" style="white-space:nowrap;font-size:11px;padding:5px 10px;flex-shrink:0">Check availability</button>
          </div>
          <div id="wb-slug-msg" style="font-size:10px;margin-top:5px;line-height:1.4;color:var(--muted)">Auto-generated from your names. Edit to customise — letters, numbers and hyphens only.</div>
        </div>
      </div>
    </div>
    <button class="btn btn-outline btn-sm" onclick="openWbPreview()" style="display:inline-flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Preview</button>`;

  const presetLabel = (WB_PRESETS[t.preset]||{}).label || 'Custom';
  const fontLabel = (t.heading||'').replace(/['"]/g,'').split(',')[0];

  const published = !!w.published;
  const publishRow = `<div class="wb-theme-row" onclick="_wbTogglePublish()" style="background:${published?'rgba(74,99,73,.07)':'var(--surface)'}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${published?'#4a6349':'var(--muted)'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${published?'<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>':'<circle cx="12" cy="12" r="9"/><path d="M12 9v3l2 2"/><circle cx="12" cy="16.5" r=".4" fill="currentColor"/>'}
      </svg>
      <div style="flex:1;min-width:0">
        <div class="wb-name" style="${published?'color:#4a6349':''}">Site ${published?'published':'not published'}</div>
        <div class="wb-sub">${published?'Guests can view your site':'Private — click to publish'}</div>
      </div>
      <label class="toggle-switch" onclick="event.stopPropagation()" style="transform:scale(.68);transform-origin:right center;pointer-events:none">
        <input type="checkbox" ${published?'checked':''} tabindex="-1"/>
        <span class="toggle-track"></span>
      </label>
    </div>`;

  const themeRow = `<div class="wb-theme-row" onclick="openWbTheme()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
      <div style="flex:1;min-width:0">
        <div class="wb-name">Theme and fonts</div>
        <div class="wb-sub">${_escHtml(presetLabel)} · ${_escHtml(fontLabel)}</div>
      </div>
      <div style="display:flex;gap:3px;flex-shrink:0">
        <span class="wb-sw" style="background:${_escHtml(t.page)}"></span>
        <span class="wb-sw" style="background:${_escHtml(t.accent)}"></span>
        <span class="wb-sw" style="background:${_escHtml(t.text)}"></span>
      </div>
    </div>`;

  const rows = w.order.map(key=>{
    const meta = _wbMeta(key); if(!meta) return '';
    const locked = !!WB_LOCKED[key];
    const on = !!w.on[key];
    const nimg = WB_LOCKED[key] ? 0 : _wbImgCount(key);
    const sub = _wbSubline(key) + (nimg?(' · '+nimg+' image'+(nimg===1?'':'s')):'');

    if(locked){
      return `<div class="wb-row wb-locked">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <div style="flex:1;min-width:0" title="${_escHtml(sub)}">
          <div class="wb-name">${_escHtml(meta.name)}</div>
          <div class="wb-sub" style="color:var(--red)">${_escHtml(sub)}</div>
        </div>
        <span class="wb-lockbadge">Locked</span>
      </div>`;
    }

    return `<div class="wb-row" draggable="true" data-wb="${key}"
        ondragstart="_wbDragStart(event,'${key}')" ondragover="_wbDragOver(event,'${key}')"
        ondrop="_wbDrop(event,'${key}')" ondragend="_wbDragEnd(event)"
        onclick="openWbSection('${key}')">
      <svg class="wb-grip" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>
      <div class="wb-rowmain" style="flex:1;min-width:0" title="${_escHtml(sub)}">
        <div class="wb-name">${_escHtml(meta.name)}${meta.custom?'<span class="wb-custom-badge">Custom</span>':''}</div>
        <div class="wb-sub">${_escHtml(sub)}</div>
      </div>
      ${meta.src?`<span class="wb-src wb-src-inline">From ${_escHtml(meta.src)}</span>`:''}
      <label class="toggle-switch" onclick="event.stopPropagation()" style="transform:scale(.68);transform-origin:right center">
        <input type="checkbox" id="wb-on-${key}" ${on?'checked':''} onchange="_wbToggle('${key}',this.checked)"/>
        <span class="toggle-track"></span>
      </label>
      ${key!=='home'?`<button type="button" title="Remove section" onclick="event.stopPropagation();_wbRemoveSection('${key}')" style="flex-shrink:0;background:none;border:none;cursor:pointer;color:var(--muted);opacity:.6;padding:3px;display:flex;align-items:center" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity='.6'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>`:''}
    </div>`;
  }).join('');

  c.innerHTML = `<div class="wb-intro" style="font-size:12.5px;color:var(--muted);line-height:1.6;margin-bottom:14px">
    Your site reads from the planner — change a detail there and it changes here. Drag to reorder, tap a section to edit.
  </div>
  <div class="wb-shell${_wbStripOpen?'':' wb-strip-shut'}">
    <div class="wb-list" style="background:var(--cream);border:1px solid var(--border);border-radius:14px;overflow:hidden">
      ${publishRow}${themeRow}${rows}
      <div style="padding:10px 12px;text-align:center;border-top:1px solid var(--border)">
        <button type="button" class="wb-addsec" onclick="openWbAddSection()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add section
        </button>
      </div>
    </div>
    <div class="wb-pane">
      <div class="wb-strip-bar" onclick="_wbStripToggle()" aria-expanded="${_wbStripOpen?'true':'false'}">
        <span style="display:flex;align-items:center;gap:7px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Preview</span>
        <svg class="wb-strip-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="${_wbStripOpen?'M18 15l-6-6-6 6':'M6 9l6 6 6-6'}"/></svg>
      </div>
      <div class="wb-pane-inner">
        <div class="wb-view-toggle" style="display:flex;justify-content:center;padding:0 0 8px">
          <span class="inv-seg">
            <button type="button" id="wb-view-desktop" class="${_wbLiveViewMode==='desktop'?'active':''}" onclick="_wbViewSet('desktop')">Desktop</button>
            <button type="button" id="wb-view-mobile"  class="${_wbLiveViewMode==='mobile' ?'active':''}" onclick="_wbViewSet('mobile')">Mobile</button>
          </span>
        </div>
        <div class="wb-pane-frame" style="${_wbLiveViewMode==='mobile'?'max-width:390px;margin:0 auto;border-radius:20px':''}"><iframe id="wb-live" title="Live preview of your website" sandbox="allow-same-origin allow-scripts"></iframe></div>
        <div class="wb-pane-cap">Live · updates as you edit</div>
      </div>
    </div>
    <div class="wb-editor-col wb-ec-empty" id="wb-editor-col">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".35"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg>
      <span>Click a section to edit</span>
    </div>
  </div>`;
  _wbLivePaint();
}

// Repaint the sticky desktop pane. The iframe only exists above 1100px, so this is a
// no-op on phone and tablet — nothing to guard at the call sites.
//
// srcdoc is reassigned wholesale rather than diffed: the guest site is a few KB and
// rebuilding it is cheaper than reasoning about what changed. But a reassignment
// reloads the frame, so callers that fire per-keystroke MUST debounce (see _wbLiveSoon).
// The frame is REBUILT on every paint — `srcdoc=` is a fresh document, not an edit. So
// the scroll position does not "jump back to the top": THE PAGE YOU WERE LOOKING AT NO
// LONGER EXISTS, and a new page starts at the top. That is why simply "stopping the
// scroll" was never going to work — there was no scroll to stop.
//
// So: read the offset out of the OLD document before it dies, and put it back into the
// NEW one once it loads. `_wbLiveFocus` is the section currently being edited — when it
// is set, that WINS over the restored offset, because on opening an editor the thing you
// want to see is the thing you are editing, not wherever you happened to be.
let _wbLiveFocus = null;

// Phone only (the CSS shows the bar below 1100px). Open by default — a preview you have to
// go find is the thing we are fixing — but foldable, because a keyboard on a small screen
// leaves very little room and sometimes the editor needs all of it.
let _wbStripOpen = (localStorage.getItem('wbStripOpen') !== '0');
// Set by _showPublicWeddingSite so _wbBuildSite can use the owner's uid without a session
let _wbPublicOwnerUid = null;
function _wbStripToggle(){
  _wbStripOpen = !_wbStripOpen;
  localStorage.setItem('wbStripOpen', _wbStripOpen ? '1' : '0');
  const sh=document.querySelector('.wb-shell');
  if(sh) sh.classList.toggle('wb-strip-shut', !_wbStripOpen);
  const bar=document.querySelector('.wb-strip-bar');
  if(bar) bar.setAttribute('aria-expanded', _wbStripOpen ? 'true' : 'false');
  // Folding OPEN paints: the frame was display:none and its document is stale/absent.
  if(_wbStripOpen) _wbLivePaint();
}

// Both preview frames get a REAL document url (blob:) rather than `srcdoc`.
//
// A srcdoc document's own url is `about:srcdoc`, but it inherits its BASE url from the
// parent page. So the guest site's own nav — `<a href="#faq">` — resolved against the
// APP's url, making it a link to a different document rather than to a section of itself.
// Clicking a page in the preview navigated the frame to the planner, and the guest site
// was replaced by the app's own sidebar (v168). Nothing about the site was wrong; the
// frame simply had no url of its own to resolve against.
//
// A blob url is a genuine document url, so `#faq` resolves to the site and scrolls to the
// section — the same behaviour a guest will get. It is same-origin (blob urls inherit the
// creating document's origin), so `contentDocument`, `contentWindow` and `onload` all
// remain reachable and the scroll-restore below is unaffected.
const _wbBlobUrls = { live:null, pv:null };
function _wbFrameLoad(f, slot, html){
  if(!f) return false;
  // After the first src-based load, write directly into the existing document to avoid
  // the blank-flash that changing f.src causes. document.write() keeps the document's
  // current URL intact, so #anchor links inside the frame still resolve correctly.
  if(_wbBlobUrls[slot]){
    try{
      const d=f.contentDocument;
      if(d){ d.open(); d.write(html); d.close(); return true; }
    }catch(e){}
  }
  // First load: set src to a blob URL so the frame gets a real document URL
  // (srcdoc resolves anchors against the parent URL, which breaks in-page nav).
  const old = _wbBlobUrls[slot];
  _wbBlobUrls[slot] = URL.createObjectURL(new Blob([html], {type:'text/html'}));
  f.src = _wbBlobUrls[slot];
  // Revoke the PREVIOUS url, never the one just assigned — the frame may not have fetched
  // it yet. A document that has already loaded survives its url being revoked, so this is
  // safe for the outgoing frame. At most one live url per surface is ever outstanding;
  // they replace rather than accumulate.
  if(old) setTimeout(function(){ URL.revokeObjectURL(old); }, 0);
  return false;
}

function _wbLiveScrollY(f){
  // Same-origin srcdoc, so the document is reachable. It is NOT reachable before first
  // load, and it is not reachable if the sandbox ever loses allow-same-origin — hence
  // the try. A failed read must cost the scroll position, never the paint.
  try{ return (f.contentWindow && f.contentWindow.scrollY) || 0; }
  catch(e){ return 0; }
}

function _wbLivePaint(){
  _wbMarkChanged();
  const f=document.getElementById('wb-live');
  if(!f) return;
  const prev=_wbLiveScrollY(f);
  const focus=_wbLiveFocus;
  // The section being edited wins. If it is toggled off (or is Home, which is a
  // <header> with no section id), fall through to the remembered offset rather than
  // sitting at the top — a missing anchor must not COST you your place.
  const land=()=>{
    try{
      const d=f.contentDocument, wdw=f.contentWindow;
      if(!d||!wdw) return;
      const el = focus ? d.getElementById(focus) : null;
      if(el) el.scrollIntoView({block:'start'});
      else   wdw.scrollTo(0, prev);
    }catch(e){}
  };
  // onload fires only on f.src changes; document.write() paints don't trigger it.
  f.onload=()=>{
    try{
      const wdw=f.contentWindow; if(!wdw) return;
      // Land once now, then AGAIN after layout settles. `onload` for a blob url can fire
      // before the iframe's images have loaded and taken up their height — so a section
      // sitting BELOW images (Accommodation, under the Gallery) scrolls to where it was
      // before the images pushed it down, and lands short. Re-running after a frame, and
      // once more after a beat, corrects for late image layout. (Cheap: scrollIntoView on
      // an already-correct position is a no-op.)
      land(); wdw.requestAnimationFrame(land); setTimeout(land, 220);
    }catch(e){}
  };
  const wrote=_wbFrameLoad(f, 'live', _wbBuildSite());
  if(wrote){
    // document.write() is synchronous — restore scroll immediately, then re-check after
    // layout settles (images that load after the write can shift content down).
    land();
    try{ f.contentWindow.requestAnimationFrame(land); }catch(e){}
    setTimeout(land, 220);
  }
}

// Called when a section editor opens/closes. Paint is left to the caller — this only
// says WHERE the next paint should land.
function _wbLiveFocusOn(key){ _wbLiveFocus = key || null; }
function _wbLiveFocusOff(){ _wbLiveFocus = null; }
// Debounced repaint, for anything typed into. Without this, every character in the FAQ
// answer box would reload the iframe.
let _wbLiveTimer=null;
function _wbLiveSoon(){
  if(!document.getElementById('wb-live')) return;
  _wbMarkChanged();
  clearTimeout(_wbLiveTimer);
  _wbLiveTimer=setTimeout(_wbLivePaint, 400);
}

function _wbToggle(key, on){
  _wbSite().on[key] = !!on;
  saveToStorage();
  // Refresh in place so the subline and preview stay honest, without a scroll jump.
  navigate('website');
}

// ── Drag to reorder ──
let _wbDragKey = null;
function _wbDragStart(e, key){
  _wbDragKey = key;
  const row = e.currentTarget; row.classList.add('wb-dragging');
  if(e.dataTransfer){ e.dataTransfer.effectAllowed='move'; try{ e.dataTransfer.setData('text/plain', key); }catch(_){} }
}
function _wbDragOver(e, key){
  if(!_wbDragKey || _wbDragKey===key) return;
  e.preventDefault();
  document.querySelectorAll('.wb-row.wb-over').forEach(r=>r.classList.remove('wb-over'));
  e.currentTarget.classList.add('wb-over');
}
function _wbDrop(e, key){
  e.preventDefault();
  if(!_wbDragKey || _wbDragKey===key){ _wbDragEnd(e); return; }
  const w=_wbSite();
  const from=w.order.indexOf(_wbDragKey), to=w.order.indexOf(key);
  if(from<0||to<0){ _wbDragEnd(e); return; }
  w.order.splice(from,1);
  w.order.splice(w.order.indexOf(key) + (from<to?1:0), 0, _wbDragKey);
  _wbDragKey=null;
  saveToStorage();
  navigate('website');
}
function _wbDragEnd(e){
  _wbDragKey=null;
  document.querySelectorAll('.wb-row.wb-dragging').forEach(r=>r.classList.remove('wb-dragging'));
  document.querySelectorAll('.wb-row.wb-over').forEach(r=>r.classList.remove('wb-over'));
}

// ── Theme panel: live specimen on top, role assignment below ──
let _wbThemeSnapshot = null;
let _wbHomeSnapshot  = null;
let _wbLiveViewMode = 'desktop';
let _wbPanelSaved = false;    // true after explicit Save click since panel open
let _wbConfirmCbs = null;     // callbacks for the confirm overlay
function _wbViewSet(mode){
  _wbLiveViewMode=mode;
  ['desktop','mobile'].forEach(m=>{
    const b=document.getElementById('wb-view-'+m);
    if(b) b.classList.toggle('active',m===mode);
  });
  const frame=document.querySelector('.wb-pane-frame');
  if(frame){
    frame.style.maxWidth    = mode==='mobile'?'390px':'';
    frame.style.margin      = mode==='mobile'?'0 auto':'';
    frame.style.borderRadius= mode==='mobile'?'20px':'';
  }
}
function _wbTogglePublish(){
  const w=_wbSite();
  w.published=!w.published;
  saveToStorage();
  navigate('website');
}
function openWbTheme(){
  _wbLiveFocusOff();
  document.querySelectorAll('.wb-row.wb-selected,.wb-theme-row.wb-selected').forEach(r=>r.classList.remove('wb-selected'));
  document.querySelector('.wb-theme-row')?.classList.add('wb-selected');
  _wbThemeSnapshot = JSON.stringify(_wbSite().theme);
  _wbPanel('Theme', _wbThemeBody(),
    `<div style="display:flex;gap:8px">
       <button class="btn btn-outline btn-sm" style="flex:1" onclick="_wbThemeCancel()">Cancel</button>
       <button class="btn btn-primary btn-sm" style="flex:1" onclick="_wbSectionSave()">Save</button>
     </div>`);
}
function _wbThemeCancel(){
  if(_wbThemeSnapshot){
    try{
      const w=_wbSite();
      w.theme=JSON.parse(_wbThemeSnapshot);
      saveToStorage();
      _wbLivePaint();
    }catch(e){}
    _wbThemeSnapshot=null;
  }
  _wbClosePanel();
}
let _wbThemeTab = 'colour';
function _wbSetThemeTab(t){ _wbThemeTab=t; _wbRepaintTheme(); }

function _wbThemeBody(){
  const t=_wbSite().theme;
  const pal = (STATE.inspo && Array.isArray(STATE.inspo.colors)) ? STATE.inspo.colors : [];

  const specimen = `<div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:7px">Preview</div>
      <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(0,0,0,.12);box-shadow:0 2px 14px rgba(0,0,0,.1)">
        <div id="wb-spec-hero" style="background:${_escHtml(t.page)};padding:24px 16px;text-align:center">
          <div id="wb-spec-name" style="font-family:${t.headFont};font-size:${Math.round(26*(t.headScale||t.scale||100)/100)}px;color:${_escHtml(t.heading)};margin-bottom:3px">${_escHtml(_wbCouple())}</div>
          <div style="font-family:${t.bodyFont};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${_escHtml(t.accent)};margin-bottom:12px">${(STATE.event||{}).date?_escHtml(fmtDate(STATE.event.date)):'Set a date'}</div>
          <span style="display:inline-block;font-family:${t.bodyFont};font-size:11px;padding:7px 18px;border-radius:${WB_CORNERS[t.corners]||WB_CORNERS.round};background:${_escHtml(t.button)};color:${_wbInk(t.button)}">Our story</span>
        </div>
        <div style="background:${_escHtml(t.band)};padding:12px 16px;text-align:center">
          <div style="font-family:${t.headFont};font-size:${Math.round(15*(t.headScale||t.scale||100)/100)}px;color:${_escHtml(t.heading)}">A banded section</div>
          <div style="font-family:${t.bodyFont};font-size:11px;color:${_escHtml(t.text)};margin-top:${Math.round(5*t.space/100)}px">Body text sits here.</div>
        </div>
      </div>
    </div>`;

  const TABS=[['colour','Colour'],['type','Type'],['advanced','Advanced']];
  const tabs = `<span id="wb-theme-tabs" class="inv-seg" style="display:flex;margin-bottom:14px">
      ${TABS.map(x=>`<button type="button" class="${_wbThemeTab===x[0]?'active':''}" style="flex:1;padding:8px 11px" onclick="_wbSetThemeTab('${x[0]}')">${x[1]}</button>`).join('')}
    </span>`;

  let body='';

  if(_wbThemeTab==='colour'){
    const fmtStyle = `<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">
      <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:10px;margin-top:4px">FORMAT STYLE</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div onclick="_wbSet('format','modern')" style="cursor:pointer;border:1.5px solid ${t.format==='modern'?'var(--gold)':'var(--border)'};background:${t.format==='modern'?'rgba(196,168,130,.1)':'var(--card)'};border-radius:9px;padding:10px 8px;text-align:center;transition:all .15s">
          <div style="height:42px;background:#EFE8DC;border-radius:5px;margin-bottom:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;overflow:hidden;padding:2px">
            <span style="font-size:5.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#8B6B4A;font-family:Inter,sans-serif">The Big Day</span>
            <span style="font-size:12px;font-weight:700;color:#3A302A;font-family:Inter,sans-serif;letter-spacing:-.01em">Event Details</span>
          </div>
          <div style="font-size:11px;font-weight:500;color:${t.format==='modern'?'var(--gold)':'var(--sub)'}">Modern${t.format==='modern'?' ✓':''}</div>
        </div>
        <div onclick="_wbSet('format','editorial')" style="cursor:pointer;border:1.5px solid ${t.format==='editorial'?'var(--gold)':'var(--border)'};background:${t.format==='editorial'?'rgba(196,168,130,.1)':'var(--card)'};border-radius:9px;padding:10px 8px;text-align:center;transition:all .15s">
          <div style="height:42px;background:#EFE8DC;border-radius:5px;margin-bottom:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:hidden;padding:2px">
            <span style="font-size:4.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#8B6B4A;font-family:Inter,sans-serif">The Big Day</span>
            <div style="width:16px;height:0.5px;background:#C4A882;margin:1px 0"></div>
            <span style="font-size:11px;font-weight:400;font-style:italic;color:#3A302A;font-family:'Cormorant Garamond',Georgia,serif">Event Details</span>
          </div>
          <div style="font-size:11px;font-weight:500;color:${t.format==='editorial'?'var(--gold)':'var(--sub)'}">Editorial${t.format==='editorial'?' ✓':''}</div>
        </div>
      </div>
    </div>`;
    const presets = `<div class="wb-slot-lbl" style="margin-bottom:8px">Presets</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px">
        ${Object.keys(WB_PRESETS).map(k=>{ const p=WB_PRESETS[k]; const sel=t.preset===k;
          return `<button type="button" onclick="_wbPreset('${k}')" title="${p.label}" style="padding:0;border:2px solid ${sel?'var(--gold)':'transparent'};border-radius:8px;background:transparent;cursor:pointer;overflow:hidden">
            <span style="display:flex;height:24px"><span style="flex:1;background:${p.page}"></span><span style="flex:1;background:${p.accent}"></span><span style="flex:1;background:${p.heading}"></span></span>
            <span style="display:block;font-family:'Inter',sans-serif;font-size:10px;color:${sel?'var(--gold-deep)':'var(--muted)'};padding:3px 0">${p.label}</span>
          </button>`; }).join('')}
      </div>`;

    const ROLES=[['background','Background'],['section','Section'],['accent','Accent'],['heading','Heading'],['item','Item titles'],['text','Body text'],['button','Button']];
    const roleRow=(role,label)=>{const cur=role==='section'?t.page:t[role];return`<div class="wb-role">
        <span class="wb-role-name">${label}</span>
        <div style="display:flex;gap:5px;flex-wrap:wrap;flex:1;align-items:center">
          ${pal.map(hex=>`<button type="button" class="wb-pal-sw ${cur===hex?'on':''}" style="background:${_escHtml(hex)}" onclick="_wbRole('${role}','${_escHtml(hex)}')" title="${_escHtml(hex)}"></button>`).join('')}
          <label class="wb-pal-sw" style="background:${_escHtml(cur)};border:2px dashed var(--border);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;position:relative">
            <input type="color" value="${_escHtml(cur)}" onchange="_wbRole('${role}',this.value)" style="position:absolute;inset:0;opacity:0;cursor:pointer"/>
          </label>
        </div>
      </div>`;};

    body = fmtStyle + presets + `<div class="wb-slot-lbl" style="margin-bottom:2px;display:flex;justify-content:space-between;align-items:center">
        <span>Colours</span>${pal.length?'<span class="wb-src">From Inspiration</span>':''}
      </div>
      <div style="font-size:11.5px;color:var(--muted);margin:6px 0 10px;line-height:1.5">${pal.length?'Give each colour a job. The dashed swatch opens a picker for anything not in your palette.':'Add colours on the Inspiration page and they will appear here. The dashed swatch opens a picker.'}</div>
      <div>${ROLES.map(r=>roleRow(r[0],r[1])).join('')}</div>`;
  }

  if(_wbThemeTab==='type'){
    body = `<div style="margin-bottom:6px">
        <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:12px;margin-top:4px;text-align:center">FONT</div>
      </div>
      <div class="form-group" style="margin-bottom:11px">
        <label class="form-label">Heading font</label>
        <select class="form-input" onchange="_wbFont('headFont',this.value)" style="font-family:${t.headFont}">
          ${WB_FONTS.map(f=>`<option value="${_escHtml(f[0])}" ${t.headFont===f[0]?'selected':''}>${f[1]}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Body font</label>
        <select class="form-input" onchange="_wbFont('bodyFont',this.value)" style="font-family:${t.bodyFont}">
          ${WB_FONTS.map(f=>`<option value="${_escHtml(f[0])}" ${t.bodyFont===f[0]?'selected':''}>${f[1]}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Heading text alignment</div>
        <span class="inv-seg">
          <button type="button" class="${t.align==='center'?'active':''}" onclick="_wbSet('align','center')">Centre</button>
          <button type="button" class="${t.align==='left'?'active':''}" onclick="_wbSet('align','left')">Left</button>
        </span>
      </div>
      <div style="margin-bottom:20px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Body text alignment</div>
        <span class="inv-seg">
          <button type="button" class="${(t.bodyAlign||'left')==='left'?'active':''}" onclick="_wbSet('bodyAlign','left')">Left</button>
          <button type="button" class="${t.bodyAlign==='center'?'active':''}" onclick="_wbSet('bodyAlign','center')">Centre</button>
          <button type="button" class="${t.bodyAlign==='justify'?'active':''}" onclick="_wbSet('bodyAlign','justify')">Justify</button>
        </span>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:0">Apply alignment globally</div>
        <label class="toggle-switch">
          <input type="checkbox" ${t.alignGlobal!==false?'checked':''} onchange="_wbSetGlobal('alignGlobal')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Heading size · ${t.headScale}%</div>
        <input type="range" min="85" max="125" step="5" value="${t.headScale}" oninput="_wbNum('headScale',this.value)" style="width:100%;accent-color:var(--gold)"/>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Menu text size · ${t.bodyScale}%</div>
        <input type="range" min="85" max="125" step="5" value="${t.bodyScale}" oninput="_wbNum('bodyScale',this.value)" style="width:100%;accent-color:var(--gold)"/>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section text size · ${t.secBodyScale}%</div>
        <input type="range" min="85" max="125" step="5" value="${t.secBodyScale}" oninput="_wbNum('secBodyScale',this.value)" style="width:100%;accent-color:var(--gold)"/>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Spacing · ${t.space<95?'Snug':(t.space>105?'Airy':'Normal')}</div>
        <input type="range" min="70" max="140" step="10" value="${t.space}" oninput="_wbNum('space',this.value)" style="width:100%;accent-color:var(--gold)"/>
      </div>
      <div style="margin-bottom:10px;padding-top:4px;border-top:1px solid var(--border)">
        <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:12px;margin-top:10px;text-align:center">SECTION FORMATTING</div>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section gap · ${t.gap} px</div>
        <input type="range" min="0" max="100" step="4" value="${t.gap}" oninput="_wbNum('gap',this.value)" style="width:100%;accent-color:var(--gold)"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>Touching</span><span>100 px apart</span></div>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section padding - vertical · ${t.secpad!=null?t.secpad:52} px</div>
        <input type="range" min="0" max="200" step="4" value="${t.secpad!=null?t.secpad:52}" oninput="_wbNum('secpad',this.value)" style="width:100%;accent-color:var(--gold)"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>No padding</span><span>200 px</span></div>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section padding - horizontal · ${t.secpadH!=null?t.secpadH:24} px</div>
        <input type="range" min="0" max="100" step="4" value="${t.secpadH!=null?t.secpadH:24}" oninput="_wbNum('secpadH',this.value)" style="width:100%;accent-color:var(--gold)"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>No padding</span><span>100 px</span></div>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section width · ${t.maxWidth||720} px</div>
        <input type="range" min="600" max="1400" step="50" value="${t.maxWidth||720}" oninput="_wbNum('maxWidth',this.value)" style="width:100%;accent-color:var(--gold)"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>Narrow · 600</span><span>1400 · Wide</span></div>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:0">Apply section width globally</div>
        <label class="toggle-switch">
          <input type="checkbox" ${t.globalWidth!==false?'checked':''} onchange="_wbSetGlobal('globalWidth')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div style="margin-bottom:10px;padding-top:4px;border-top:1px solid var(--border)">
        <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:12px;margin-top:10px;text-align:center">BUTTONS</div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button shape</div>
          <span class="inv-seg">
            ${Object.keys(WB_CORNERS).map(c=>`<button type="button" class="${t.corners===c?'active':''}" onclick="_wbCorners('${c}')">${c.charAt(0).toUpperCase()+c.slice(1)}</button>`).join('')}
          </span>
        </div>
        <div style="margin-bottom:4px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button style</div>
          <span class="inv-seg" style="margin-bottom:8px">
            <button type="button" class="${t.btnStyle==='outline'?'active':''}" onclick="_wbBtnStyle('outline')">Outline</button>
            <button type="button" class="${t.btnStyle==='filled'?'active':''}" onclick="_wbBtnStyle('filled')">Filled</button>
            <button type="button" class="${t.btnStyle==='soft'?'active':''}" onclick="_wbBtnStyle('soft')">Soft</button>
          </span>
          <div class="wb-blk-hint" style="margin-bottom:10px">Its colour is the <b>Button</b> swatch on the Colours tab.</div>
        </div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button size</div>
          <span class="inv-seg">
            <button type="button" class="${t.btnSize==='sm'?'active':''}" onclick="_wbSet('btnSize','sm')">S</button>
            <button type="button" class="${t.btnSize==='md'?'active':''}" onclick="_wbSet('btnSize','md')">M</button>
            <button type="button" class="${t.btnSize==='lg'?'active':''}" onclick="_wbSet('btnSize','lg')">L</button>
          </span>
        </div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button weight</div>
          <span class="inv-seg">
            <button type="button" class="${t.btnBorder==='thin'?'active':''}" onclick="_wbSet('btnBorder','thin')">Thin</button>
            <button type="button" class="${t.btnBorder==='medium'?'active':''}" onclick="_wbSet('btnBorder','medium')">Medium</button>
            <button type="button" class="${t.btnBorder==='bold'?'active':''}" onclick="_wbSet('btnBorder','bold')">Bold</button>
          </span>
        </div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button shadow</div>
          <span class="inv-seg">
            <button type="button" class="${t.btnShadow==='none'?'active':''}" onclick="_wbSet('btnShadow','none')">None</button>
            <button type="button" class="${t.btnShadow==='soft'?'active':''}" onclick="_wbSet('btnShadow','soft')">Soft</button>
            <button type="button" class="${t.btnShadow==='strong'?'active':''}" onclick="_wbSet('btnShadow','strong')">Strong</button>
          </span>
        </div>
        <div>
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button bevel</div>
          <span class="inv-seg">
            <button type="button" class="${!t.btnBevel?'active':''}" onclick="_wbSet('btnBevel',false)">Off</button>
            <button type="button" class="${t.btnBevel?'active':''}" onclick="_wbSet('btnBevel',true)">On</button>
          </span>
        </div>
      </div>
      <div style="margin-bottom:14px;padding-top:4px;border-top:1px solid var(--border)">
        <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:12px;margin-top:10px">SECTIONS</div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Section shadow · ${t.shadow||0}</div>
          <input type="range" min="0" max="100" step="1" value="${t.shadow||0}" oninput="_wbNum('shadow',this.value)" style="width:100%;accent-color:var(--gold)"/>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>None</span><span>Soft</span><span>Lifted</span><span>Deep</span></div>
        </div>
        <div>
          <div class="wb-slot-lbl" style="margin-bottom:6px">Card edge · ${t.cardStyle||0}</div>
          <input type="range" min="0" max="100" step="1" value="${t.cardStyle||0}" oninput="_wbNum('cardStyle',this.value)" style="width:100%;accent-color:var(--gold)"/>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>Flat</span><span>Soft</span><span>Round</span><span>Curved</span></div>
        </div>
      </div>`;
  }

  if(_wbThemeTab==='advanced'){
    body = `<div style="margin-bottom:14px">
      <div class="wb-slot-lbl" style="margin-bottom:6px">Navigation style</div>
      <span class="inv-seg">
        <button type="button" class="${(t.navPos||'top')==='top'?'active':''}" onclick="_wbSet('navPos','top')">Top bar</button>
        <button type="button" class="${t.navPos==='side'?'active':''}" onclick="_wbSet('navPos','side')">Side bar</button>
      </span>
    </div>
    <div class="wb-slot-lbl" style="margin-bottom:6px">Custom CSS <span style="color:var(--red);font-weight:400;text-transform:none;letter-spacing:0">· advanced</span></div>
      <textarea class="form-input" id="wb-css" rows="7" spellcheck="false" placeholder="h1 { letter-spacing: .08em; }"
        oninput="_wbCss(this.value)"
        style="font-family:'SF Mono',ui-monospace,Menlo,monospace;font-size:11.5px;resize:vertical;line-height:1.6">${_escHtml(t.css||'')}</textarea>
      <div style="display:flex;align-items:flex-start;gap:8px;margin-top:10px;padding:9px 11px;background:rgba(192,57,43,.07);border-radius:8px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div style="font-size:11.5px;color:var(--muted);line-height:1.55">This can break your site in ways the preview won't warn you about. It only ever touches the guest site — never the planner — and <b style="color:var(--ink)">clearing the box always restores it</b>.</div>
      </div>
      ${t.css?`<button type="button" class="btn btn-outline btn-sm" onclick="_wbCssClear()" style="margin-top:10px">Clear custom CSS</button>`:''}`;
  }

  return tabs + specimen + `<div id="wb-theme-body">${body}</div>`;
}
// Black or white ink, whichever reads on the given background. Guests get one look, so
// this has to be right without a dark-mode escape hatch.
// The luminance of a background, 0 (black) to 255 (white). ONE function, several callers —
// nobody recovers this by inspecting another function's output.
function _wbLum(hex){
  const h=String(hex||'').replace('#','');
  if(h.length!==6) return 0;
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  if(isNaN(r)||isNaN(g)||isNaN(b)) return 0;
  return 0.299*r + 0.587*g + 0.114*b;
}
function _wbIsLightBg(hex){ return _wbLum(hex) > 150; }
function _wbInk(hex){
  if(String(hex||'').replace('#','').length!==6) return '#fff';
  return _wbIsLightBg(hex) ? '#2A2520' : '#FFFFFF';
}

// ── The brand mark's colourway. THREE bands, not two.
//
// The mark holds its OWN colours — it does not take the couple's. A brand mark that renders
// in their heading colour is not a mark, it's a label, and it's a different label on every
// site. So: fixed ink, and the only thing the page decides is WHICH fixed ink.
//
// The bands are placed in dead space. Every one of the eight presets is either lum 28 (Noir)
// or lum >= 222 (the other seven) — the whole range 29..221 is empty. Only a hand-picked
// custom colour can land in the middle, so the boundaries at 90 and 200 have ~60pts of
// margin on each side and cannot be tripped by a preset.
//
// MID is the honest compromise, and it is worth naming: you cannot darken gold and have it
// stay gold. On a mid-grey page the gold sub-line sits too close to the background to read,
// so it becomes a deep bronze. That is a real loss of brand colour, accepted deliberately
// in exchange for a mark that can actually be read. The alternative — a background plate —
// was tried and rejected: a plate subtle enough not to look like a sticker is a plate too
// weak to lift the gold. A false compromise is worse than an honest one.
const WB_BRAND = {
  light: { crest:'light', main:'#3A352F', sub:'#8B7355' },   // = the app's --ink / --gold-deep
  mid:   { crest:'light', main:'#201D19', sub:'#5A4830' },   // both darkened; gold -> bronze
  dark:  { crest:'dark',  main:'#D2CEC6', sub:'#C3B69E' }    // = the app's dark --ink / --gold-deep
};
function _wbBrand(pageHex){
  const L=_wbLum(pageHex);
  if(L < 90)  return WB_BRAND.dark;
  if(L > 200) return WB_BRAND.light;
  return WB_BRAND.mid;
}
function _wbCrest(pageHex){
  return _wbBrand(pageHex).crest==='dark' ? WB_CREST_DARK : WB_CREST_LIGHT;
}
function _wbPreset(k){
  const p=WB_PRESETS[k]; if(!p) return;
  const t=_wbSite().theme;
  t.preset=k;
  ['page','band','accent','heading','text','button'].forEach(r=>{ t[r]=p[r]; });
  // No preset defines `item` — a preset is a palette, and its opinion about item titles is
  // "the same as the heading", which is the default. Setting it from p.item would write
  // `undefined`, and an undefined colour drops the CSS declaration entirely: the titles
  // would fall back to inherited black, silently, on every preset click.
  t.item = p.heading;
  saveToStorage();
  _wbRepaintTheme();
}
function _wbBtnStyle(v){
  const t=_wbSite().theme;
  if(WB_BTN_STYLES.indexOf(v)<0 || t.btnStyle===v) return;
  t.btnStyle=v;
  saveToStorage();
  _wbRepaintTheme();
}
function _wbNum(field, v){
  const n=(v===''||v===null||v===undefined||isNaN(+v))?100:+v;
  // The two text scales have a real range (85–125). Clamp INTO it rather than resetting to
  // 100 on anything unexpected — a slider that jumps to the middle when it disagrees with
  // you is worse than one that stops at its own edge.
  _wbSite().theme[field] = (field==='headScale'||field==='bodyScale'||field==='secBodyScale')
    ? Math.max(85, Math.min(125, n)) : n;
  saveToStorage();
  _wbLiveSoon();
  // Update the readout in place — a full repaint would kill the slider mid-drag.
  const t=_wbSite().theme;
  const labs=document.querySelectorAll('#modal-body .wb-slot-lbl, #wb-ec-body .wb-slot-lbl');
  labs.forEach(l=>{
    if(l.textContent.indexOf('Heading size')===0) l.textContent='Heading size · '+t.headScale+'%';
    if(l.textContent.indexOf('Menu text size')===0) l.textContent='Menu text size · '+t.bodyScale+'%';
    if(l.textContent.indexOf('Section text size')===0) l.textContent='Section text size · '+t.secBodyScale+'%';
    if(l.textContent.indexOf('Spacing')===0)      l.textContent='Spacing · '+(t.space<95?'Snug':(t.space>105?'Airy':'Normal'));
    if(l.textContent.indexOf('Section gap')===0)  l.textContent='Section gap · '+t.gap+' px';
    if(l.textContent.indexOf('Section padding - vertical')===0) l.textContent='Section padding - vertical · '+(t.secpad!=null?t.secpad:52)+' px';
    if(l.textContent.indexOf('Section padding - horizontal')===0) l.textContent='Section padding - horizontal · '+(t.secpadH!=null?t.secpadH:24)+' px';
    if(l.textContent.indexOf('Section width')===0) l.textContent='Section width · '+(t.maxWidth||720)+' px';
    if(l.textContent.indexOf('Section shadow')===0) l.textContent='Section shadow · '+(t.shadow||0);
    if(l.textContent.indexOf('Card edge')===0) l.textContent='Card edge · '+(t.cardStyle||0);
  });
  // The font specimen is a HEADING sample, so it follows the heading scale.
  const sp=document.getElementById('wb-spec-name');
  if(sp) sp.style.fontSize=Math.round(26*t.headScale/100)+'px';
}
function _wbCorners(c){
  const t=_wbSite().theme;
  if(t.corners===c) return;
  t.corners=c;
  saveToStorage();
  _wbRepaintTheme();
}
function _wbSet(field, val){
  const t=_wbSite().theme;
  if(t[field]===val) return;
  t[field]=val;
  saveToStorage();
  _wbRepaintTheme();
}
function _wbSetGlobal(field){
  const t=_wbSite().theme;
  t[field] = t[field]===false ? true : false;
  saveToStorage();
  _wbRepaintTheme();
  document.querySelectorAll('[id^="wb-lay-"]').forEach(box=>{
    const key=box.id.slice(7);
    box.outerHTML=_wbLayoutHtml(key);
  });
  _wbLivePaint();
}
// The custom CSS lands raw inside the guest site's <style> block. A stray "</style>" in
// the box would close that block early and drop the rest of the CSS into the document as
// text — which looks like a mystery rendering bug, not a typo. Neutralise it on write.
// Not a security fix (it's Mandy's own site); a "this will never confuse you" fix.
function _wbCssSafe(s){ return String(s||'').replace(/<\/\s*style/gi, '<\\/style'); }
function _wbCss(v){
  _wbSite().theme.css=_wbCssSafe(v);
  saveToStorage();
  _wbLiveSoon();          // no modal repaint: it would steal focus mid-type
}
function _wbCssClear(){
  _wbSite().theme.css='';
  saveToStorage();
  _wbRepaintTheme();
}
function _wbRole(role, hex){
  const t=_wbSite().theme;
  if(role==='section'){
    if(t.page===hex && t.band===hex) return;
    t.page=hex; t.band=hex;
  } else {
    if(t[role]===hex) return;
    t[role]=hex;
  }
  t.preset='custom';   // any manual change means it is no longer a named preset
  saveToStorage();
  _wbRepaintTheme();
}
function _wbFont(which, val){
  _wbSite().theme[which]=val;
  saveToStorage();
  _wbRepaintTheme();
}
// Redraw the modal body in place so the specimen updates live without closing.
function _wbRepaintTheme(){
  const tbody = document.getElementById('wb-theme-body');
  if(tbody){
    // Panel is open — swap only the tab content; specimen and tab bar stay in place.
    const t=_wbSite().theme;
    const pal=(STATE.inspo&&Array.isArray(STATE.inspo.colors))?STATE.inspo.colors:[];
    let body='';
    if(_wbThemeTab==='colour'){
      const fmtStyle=`<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">
      <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:10px;margin-top:4px">FORMAT STYLE</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div onclick="_wbSet('format','modern')" style="cursor:pointer;border:1.5px solid ${t.format==='modern'?'var(--gold)':'var(--border)'};background:${t.format==='modern'?'rgba(196,168,130,.1)':'var(--card)'};border-radius:9px;padding:10px 8px;text-align:center;transition:all .15s">
          <div style="height:42px;background:#EFE8DC;border-radius:5px;margin-bottom:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;overflow:hidden;padding:2px">
            <span style="font-size:5.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#8B6B4A;font-family:Inter,sans-serif">The Big Day</span>
            <span style="font-size:12px;font-weight:700;color:#3A302A;font-family:Inter,sans-serif;letter-spacing:-.01em">Event Details</span>
          </div>
          <div style="font-size:11px;font-weight:500;color:${t.format==='modern'?'var(--gold)':'var(--sub)'}">Modern${t.format==='modern'?' ✓':''}</div>
        </div>
        <div onclick="_wbSet('format','editorial')" style="cursor:pointer;border:1.5px solid ${t.format==='editorial'?'var(--gold)':'var(--border)'};background:${t.format==='editorial'?'rgba(196,168,130,.1)':'var(--card)'};border-radius:9px;padding:10px 8px;text-align:center;transition:all .15s">
          <div style="height:42px;background:#EFE8DC;border-radius:5px;margin-bottom:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:hidden;padding:2px">
            <span style="font-size:4.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#8B6B4A;font-family:Inter,sans-serif">The Big Day</span>
            <div style="width:16px;height:0.5px;background:#C4A882;margin:1px 0"></div>
            <span style="font-size:11px;font-weight:400;font-style:italic;color:#3A302A;font-family:'Cormorant Garamond',Georgia,serif">Event Details</span>
          </div>
          <div style="font-size:11px;font-weight:500;color:${t.format==='editorial'?'var(--gold)':'var(--sub)'}">Editorial${t.format==='editorial'?' ✓':''}</div>
        </div>
      </div>
    </div>`;
      const presets=`<div class="wb-slot-lbl" style="margin-bottom:8px">Presets</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px">
        ${Object.keys(WB_PRESETS).map(k=>{ const p=WB_PRESETS[k]; const sel=t.preset===k;
          return `<button type="button" onclick="_wbPreset('${k}')" title="${p.label}" style="padding:0;border:2px solid ${sel?'var(--gold)':'transparent'};border-radius:8px;background:transparent;cursor:pointer;overflow:hidden">
            <span style="display:flex;height:24px"><span style="flex:1;background:${p.page}"></span><span style="flex:1;background:${p.accent}"></span><span style="flex:1;background:${p.heading}"></span></span>
            <span style="display:block;font-family:'Inter',sans-serif;font-size:10px;color:${sel?'var(--gold-deep)':'var(--muted)'};padding:3px 0">${p.label}</span>
          </button>`; }).join('')}
      </div>`;
      const ROLES=[['background','Background'],['section','Section'],['accent','Accent'],['heading','Heading'],['item','Item titles'],['text','Body text'],['button','Button']];
      const roleRow=(role,label)=>{const cur=role==='section'?t.page:t[role];return`<div class="wb-role">
        <span class="wb-role-name">${label}</span>
        <div style="display:flex;gap:5px;flex-wrap:wrap;flex:1;align-items:center">
          ${pal.map(hex=>`<button type="button" class="wb-pal-sw ${cur===hex?'on':''}" style="background:${_escHtml(hex)}" onclick="_wbRole('${role}','${_escHtml(hex)}')" title="${_escHtml(hex)}"></button>`).join('')}
          <label class="wb-pal-sw" style="background:${_escHtml(cur)};border:2px dashed var(--border);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;position:relative">
            <input type="color" value="${_escHtml(cur)}" onchange="_wbRole('${role}',this.value)" style="position:absolute;inset:0;opacity:0;cursor:pointer"/>
          </label>
        </div>
      </div>`;};
      body=fmtStyle+presets+`<div class="wb-slot-lbl" style="margin-bottom:2px;display:flex;justify-content:space-between;align-items:center">
        <span>Colours</span>${pal.length?'<span class="wb-src">From Inspiration</span>':''}
      </div>
      <div style="font-size:11.5px;color:var(--muted);margin:6px 0 10px;line-height:1.5">${pal.length?'Give each colour a job. The dashed swatch opens a picker for anything not in your palette.':'Add colours on the Inspiration page and they will appear here. The dashed swatch opens a picker.'}</div>
      <div>${ROLES.map(r=>roleRow(r[0],r[1])).join('')}</div>`;
    }
    if(_wbThemeTab==='type'){
      body=`<div style="margin-bottom:6px">
        <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:12px;margin-top:4px;text-align:center">FONT</div>
      </div>
      <div class="form-group" style="margin-bottom:11px">
        <label class="form-label">Heading font</label>
        <select class="form-input" onchange="_wbFont('headFont',this.value)" style="font-family:${t.headFont}">
          ${WB_FONTS.map(f=>`<option value="${_escHtml(f[0])}" ${t.headFont===f[0]?'selected':''}>${f[1]}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Body font</label>
        <select class="form-input" onchange="_wbFont('bodyFont',this.value)" style="font-family:${t.bodyFont}">
          ${WB_FONTS.map(f=>`<option value="${_escHtml(f[0])}" ${t.bodyFont===f[0]?'selected':''}>${f[1]}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Heading text alignment</div>
        <span class="inv-seg">
          <button type="button" class="${t.align==='center'?'active':''}" onclick="_wbSet('align','center')">Centre</button>
          <button type="button" class="${t.align==='left'?'active':''}" onclick="_wbSet('align','left')">Left</button>
        </span>
      </div>
      <div style="margin-bottom:20px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Body text alignment</div>
        <span class="inv-seg">
          <button type="button" class="${(t.bodyAlign||'left')==='left'?'active':''}" onclick="_wbSet('bodyAlign','left')">Left</button>
          <button type="button" class="${t.bodyAlign==='center'?'active':''}" onclick="_wbSet('bodyAlign','center')">Centre</button>
          <button type="button" class="${t.bodyAlign==='justify'?'active':''}" onclick="_wbSet('bodyAlign','justify')">Justify</button>
        </span>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:0">Apply alignment globally</div>
        <label class="toggle-switch">
          <input type="checkbox" ${t.alignGlobal!==false?'checked':''} onchange="_wbSetGlobal('alignGlobal')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Heading size · ${t.headScale}%</div>
        <input type="range" min="85" max="125" step="5" value="${t.headScale}" oninput="_wbNum('headScale',this.value)" style="width:100%;accent-color:var(--gold)"/>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Menu text size · ${t.bodyScale}%</div>
        <input type="range" min="85" max="125" step="5" value="${t.bodyScale}" oninput="_wbNum('bodyScale',this.value)" style="width:100%;accent-color:var(--gold)"/>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section text size · ${t.secBodyScale}%</div>
        <input type="range" min="85" max="125" step="5" value="${t.secBodyScale}" oninput="_wbNum('secBodyScale',this.value)" style="width:100%;accent-color:var(--gold)"/>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Spacing · ${t.space<95?'Snug':(t.space>105?'Airy':'Normal')}</div>
        <input type="range" min="70" max="140" step="10" value="${t.space}" oninput="_wbNum('space',this.value)" style="width:100%;accent-color:var(--gold)"/>
      </div>
      <div style="margin-bottom:10px;padding-top:4px;border-top:1px solid var(--border)">
        <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:12px;margin-top:10px;text-align:center">SECTION FORMATTING</div>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section gap · ${t.gap} px</div>
        <input type="range" min="0" max="100" step="4" value="${t.gap}" oninput="_wbNum('gap',this.value)" style="width:100%;accent-color:var(--gold)"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>Touching</span><span>100 px apart</span></div>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section padding - vertical · ${t.secpad!=null?t.secpad:52} px</div>
        <input type="range" min="0" max="200" step="4" value="${t.secpad!=null?t.secpad:52}" oninput="_wbNum('secpad',this.value)" style="width:100%;accent-color:var(--gold)"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>No padding</span><span>200 px</span></div>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section padding - horizontal · ${t.secpadH!=null?t.secpadH:24} px</div>
        <input type="range" min="0" max="100" step="4" value="${t.secpadH!=null?t.secpadH:24}" oninput="_wbNum('secpadH',this.value)" style="width:100%;accent-color:var(--gold)"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>No padding</span><span>100 px</span></div>
      </div>
      <div style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:6px">Section width · ${t.maxWidth||720} px</div>
        <input type="range" min="600" max="1400" step="50" value="${t.maxWidth||720}" oninput="_wbNum('maxWidth',this.value)" style="width:100%;accent-color:var(--gold)"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>Narrow · 600</span><span>1400 · Wide</span></div>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:14px">
        <div class="wb-slot-lbl" style="margin-bottom:0">Apply section width globally</div>
        <label class="toggle-switch">
          <input type="checkbox" ${t.globalWidth!==false?'checked':''} onchange="_wbSetGlobal('globalWidth')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div style="margin-bottom:10px;padding-top:4px;border-top:1px solid var(--border)">
        <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:12px;margin-top:10px;text-align:center">BUTTONS</div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button shape</div>
          <span class="inv-seg">
            ${Object.keys(WB_CORNERS).map(c=>`<button type="button" class="${t.corners===c?'active':''}" onclick="_wbCorners('${c}')">${c.charAt(0).toUpperCase()+c.slice(1)}</button>`).join('')}
          </span>
        </div>
        <div style="margin-bottom:4px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button style</div>
          <span class="inv-seg" style="margin-bottom:8px">
            <button type="button" class="${t.btnStyle==='outline'?'active':''}" onclick="_wbBtnStyle('outline')">Outline</button>
            <button type="button" class="${t.btnStyle==='filled'?'active':''}" onclick="_wbBtnStyle('filled')">Filled</button>
            <button type="button" class="${t.btnStyle==='soft'?'active':''}" onclick="_wbBtnStyle('soft')">Soft</button>
          </span>
          <div class="wb-blk-hint" style="margin-bottom:10px">Its colour is the <b>Button</b> swatch on the Colours tab.</div>
        </div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button size</div>
          <span class="inv-seg">
            <button type="button" class="${t.btnSize==='sm'?'active':''}" onclick="_wbSet('btnSize','sm')">S</button>
            <button type="button" class="${t.btnSize==='md'?'active':''}" onclick="_wbSet('btnSize','md')">M</button>
            <button type="button" class="${t.btnSize==='lg'?'active':''}" onclick="_wbSet('btnSize','lg')">L</button>
          </span>
        </div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button weight</div>
          <span class="inv-seg">
            <button type="button" class="${t.btnBorder==='thin'?'active':''}" onclick="_wbSet('btnBorder','thin')">Thin</button>
            <button type="button" class="${t.btnBorder==='medium'?'active':''}" onclick="_wbSet('btnBorder','medium')">Medium</button>
            <button type="button" class="${t.btnBorder==='bold'?'active':''}" onclick="_wbSet('btnBorder','bold')">Bold</button>
          </span>
        </div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button shadow</div>
          <span class="inv-seg">
            <button type="button" class="${t.btnShadow==='none'?'active':''}" onclick="_wbSet('btnShadow','none')">None</button>
            <button type="button" class="${t.btnShadow==='soft'?'active':''}" onclick="_wbSet('btnShadow','soft')">Soft</button>
            <button type="button" class="${t.btnShadow==='strong'?'active':''}" onclick="_wbSet('btnShadow','strong')">Strong</button>
          </span>
        </div>
        <div>
          <div class="wb-slot-lbl" style="margin-bottom:6px">Button bevel</div>
          <span class="inv-seg">
            <button type="button" class="${!t.btnBevel?'active':''}" onclick="_wbSet('btnBevel',false)">Off</button>
            <button type="button" class="${t.btnBevel?'active':''}" onclick="_wbSet('btnBevel',true)">On</button>
          </span>
        </div>
      </div>
      <div style="margin-bottom:14px;padding-top:4px;border-top:1px solid var(--border)">
        <div class="wb-slot-lbl" style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:12px;margin-top:10px">SECTIONS</div>
        <div style="margin-bottom:14px">
          <div class="wb-slot-lbl" style="margin-bottom:6px">Section shadow · ${t.shadow||0}</div>
          <input type="range" min="0" max="100" step="1" value="${t.shadow||0}" oninput="_wbNum('shadow',this.value)" style="width:100%;accent-color:var(--gold)"/>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>None</span><span>Soft</span><span>Lifted</span><span>Deep</span></div>
        </div>
        <div>
          <div class="wb-slot-lbl" style="margin-bottom:6px">Card edge · ${t.cardStyle||0}</div>
          <input type="range" min="0" max="100" step="1" value="${t.cardStyle||0}" oninput="_wbNum('cardStyle',this.value)" style="width:100%;accent-color:var(--gold)"/>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>Flat</span><span>Soft</span><span>Round</span><span>Curved</span></div>
        </div>
      </div>`;
    }
    if(_wbThemeTab==='advanced'){
      body=`<div style="margin-bottom:14px">
      <div class="wb-slot-lbl" style="margin-bottom:6px">Navigation style</div>
      <span class="inv-seg">
        <button type="button" class="${(t.navPos||'top')==='top'?'active':''}" onclick="_wbSet('navPos','top')">Top bar</button>
        <button type="button" class="${t.navPos==='side'?'active':''}" onclick="_wbSet('navPos','side')">Side bar</button>
      </span>
    </div>
    <div class="wb-slot-lbl" style="margin-bottom:6px">Custom CSS <span style="color:var(--red);font-weight:400;text-transform:none;letter-spacing:0">· advanced</span></div>
      <textarea class="form-input" id="wb-css" rows="7" spellcheck="false" placeholder="h1 { letter-spacing: .08em; }"
        oninput="_wbCss(this.value)"
        style="font-family:'SF Mono',ui-monospace,Menlo,monospace;font-size:11.5px;resize:vertical;line-height:1.6">${_escHtml(t.css||'')}</textarea>
      <div style="display:flex;align-items:flex-start;gap:8px;margin-top:10px;padding:9px 11px;background:rgba(192,57,43,.07);border-radius:8px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div style="font-size:11.5px;color:var(--muted);line-height:1.55">This can break your site in ways the preview won't warn you about. It only ever touches the guest site — never the planner — and <b style="color:var(--ink)">clearing the box always restores it</b>.</div>
      </div>
      ${t.css?`<button type="button" class="btn btn-outline btn-sm" onclick="_wbCssClear()" style="margin-top:10px">Clear custom CSS</button>`:''}`;
    }
    tbody.innerHTML=body;
    // Update active state on the tab buttons without rebuilding them
    document.getElementById('wb-theme-tabs')?.querySelectorAll('button[onclick*="_wbSetThemeTab"]').forEach(btn=>{
      const m=btn.getAttribute('onclick').match(/_wbSetThemeTab\('([^']+)'\)/);
      if(m) btn.classList.toggle('active', m[1]===_wbThemeTab);
    });
    // Keep the specimen card in sync with the latest theme values
    const _hero=document.getElementById('wb-spec-hero');
    if(_hero){
      _hero.style.background=t.page;
      const _nm=document.getElementById('wb-spec-name');
      if(_nm){ _nm.style.color=t.heading; _nm.style.fontFamily=t.headFont; _nm.style.fontSize=Math.round(26*(t.headScale||t.scale||100)/100)+'px'; }
      const _band=_hero.nextElementSibling;
      if(_band){
        _band.style.background=t.band;
        const _bh=_band.firstElementChild;
        if(_bh){ _bh.style.color=t.heading; _bh.style.fontFamily=t.headFont; _bh.style.fontSize=Math.round(15*(t.headScale||t.scale||100)/100)+'px'; }
        const _bb=_band.lastElementChild;
        if(_bb){ _bb.style.color=t.text; }
      }
      const _btn=_hero.querySelector('span[style*="background"]');
      if(_btn){ _btn.style.background=t.button; _btn.style.color=_wbInk(t.button); _btn.style.fontFamily=t.bodyFont; _btn.style.borderRadius=WB_CORNERS[t.corners]||WB_CORNERS.round; }
    }
    _wbLiveSoon();
    return;
  }
  // Full repaint — panel not yet open or DOM was cleared
  const box=document.getElementById('wb-ec-body')||document.getElementById('modal-body');
  if(box) box.innerHTML=_wbThemeBody();
  _wbLiveSoon();
}

// ── Section editors ──
function _wbPanel(title, body, footer){
  _wbPanelSaved = false;
  if(window.innerWidth >= 1100){
    const col=document.getElementById('wb-editor-col');
    if(!col){ openModal(title, body, footer); return; }
    col.className='wb-editor-col';
    const _hasSave=footer&&footer.includes('_wbSectionSave');
    const _footerHtml=_hasSave?footer.replace(/<button[^>]*btn-primary[^>]*>\s*Save\s*<\/button>/,''):footer;
    col.innerHTML=`<div class="wb-ec-header" style="display:flex;align-items:center;gap:6px"><span class="wb-ec-title" style="flex:none">${title}</span><span id="wb-ec-saved" style="flex:1;font-size:11.5px;font-weight:500;color:#3d9e57;opacity:0;transition:opacity .4s;white-space:nowrap">✓ Saved</span>${_hasSave?'<button type="button" class="btn btn-primary" style="font-size:12px;padding:5px 14px;flex-shrink:0" onclick="_wbSectionSave()">Save</button>':''}<button type="button" class="wb-ec-close" onclick="_wbClosePanel()">×</button></div><div class="wb-ec-body" id="wb-ec-body">${body}</div>${_footerHtml.trim()?'<div class="wb-ec-footer">'+_footerHtml+'</div>':''}`;
    // If the body included a tab bar (e.g. the Theme panel), hoist it out of the
    // scrollable body into a dedicated non-scrolling row so it can never scroll off screen.
    const _thTabs=document.getElementById('wb-theme-tabs');
    if(_thTabs){
      const _tabRow=document.createElement('div');
      _tabRow.style.cssText='flex-shrink:0;padding:10px 14px;border-bottom:1px solid var(--border)';
      _thTabs.style.marginBottom='0';
      _tabRow.appendChild(_thTabs);
      const _ecBody=document.getElementById('wb-ec-body');
      if(_ecBody) col.insertBefore(_tabRow, _ecBody);
    }
    const _mc=document.getElementById('main-content'); if(_mc) _mc.scrollTop=0;
    const _b=document.getElementById('wb-ec-body'); if(_b) _b.scrollTop=0;
  } else {
    openModal(title, body, footer);
  }
}
function _wbClosePanel(){
  if(window.innerWidth >= 1100){
    const col=document.getElementById('wb-editor-col');
    if(col){
      col.className='wb-editor-col wb-ec-empty';
      col.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".35"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg><span>Click a section to edit</span>';
    }
    document.querySelectorAll('.wb-row.wb-selected,.wb-theme-row.wb-selected').forEach(r=>r.classList.remove('wb-selected'));
    _wbLiveFocusOn(null);
    _wbLivePaint();
  } else {
    closeModalDirect();
  }
}
function _wbSectionSave(){
  saveToStorage();
  _wbPanelSaved = true;
  const el = document.getElementById('wb-ec-saved');
  if(el){
    el.textContent = '✓ Saved';
    el.style.opacity = '1';
    clearTimeout(el._t);
  } else if(typeof _showInfoToast === 'function'){
    _showInfoToast('Saved');
  }
}
function _wbMarkChanged(){
  if(!_wbPanelSaved) return;
  _wbPanelSaved = false;
  const el = document.getElementById('wb-ec-saved');
  if(el) el.style.opacity = '0';
}
function _wbSectionCancel(){
  _wbConfirm('Close the editor?', null, 'Close', ()=>_wbClosePanel(), 'Keep editing', null);
}
function _wbNavGuard(dest){
  if(!_wbPanelSaved){
    _wbConfirm(
      'Save before leaving?',
      'This section hasn\'t been explicitly saved yet.',
      'Save & go', ()=>{ _wbSectionSave(); setTimeout(()=>{ _wbClosePanel(); navigate(dest); }, 400); },
      'Go without saving', ()=>{ _wbClosePanel(); navigate(dest); }
    );
  } else {
    _wbClosePanel(); navigate(dest);
  }
}
function _wbConfirm(title, body, okLabel, okFn, cancelLabel, cancelFn){
  const existing = document.getElementById('wb-confirm-overlay');
  if(existing) existing.remove();
  _wbConfirmCbs = {ok: okFn, cancel: cancelFn};
  const sub = body ? `<div style="font-size:13px;color:var(--muted);line-height:1.5;margin-bottom:18px">${body}</div>` : '<div style="margin-bottom:18px"></div>';
  const cancelBtn = cancelLabel ? `<button class="btn btn-outline" onclick="_wbConfirmDismiss(false)">${cancelLabel}</button>` : '';
  const el = document.createElement('div');
  el.id = 'wb-confirm-overlay';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML = `<div style="background:var(--card,#fff);border-radius:14px;padding:22px 24px;max-width:300px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.18);position:relative">
    <button onclick="_wbConfirmClose()" aria-label="Close" style="position:absolute;top:10px;right:10px;border:1px solid var(--border);background:var(--cream,#faf8f4);border-radius:8px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:var(--muted);line-height:1;font-family:inherit;flex-shrink:0">×</button>
    <div style="font-size:15px;font-weight:600;color:var(--ink);margin-bottom:8px;padding-right:32px">${title}</div>
    ${sub}
    <div style="display:flex;gap:8px;justify-content:flex-end">
      ${cancelBtn}
      <button class="btn btn-primary" onclick="_wbConfirmDismiss(true)">${okLabel}</button>
    </div>
  </div>`;
  document.body.appendChild(el);
}
function _wbConfirmDismiss(ok){
  const cbs = _wbConfirmCbs;
  _wbConfirmCbs = null;
  const el = document.getElementById('wb-confirm-overlay');
  if(el) el.remove();
  const fn = ok ? cbs?.ok : cbs?.cancel;
  if(fn) fn();
}
function _wbConfirmClose(){
  _wbConfirmCbs = null;
  const el = document.getElementById('wb-confirm-overlay');
  if(el) el.remove();
}
function openWbSection(key){
  if(WB_LOCKED[key]) return;
  const meta=_wbMeta(key); if(!meta) return;
  // Tell the live pane what we are editing, THEN mark the overlay so it docks left. Both
  // are undone in closeModalDirect() — the one exit every one of these editors uses.
  _wbLiveFocusOn(key);
  // highlight the selected row in the arranger
  document.querySelectorAll('.wb-row.wb-selected,.wb-theme-row.wb-selected').forEach(r=>r.classList.remove('wb-selected'));
  const _wbSelRow=document.querySelector(`.wb-row[data-wb="${key}"]`);
  if(_wbSelRow) _wbSelRow.classList.add('wb-selected');
  _wbLivePaint();
  if(_wbIsCustom(key))      return openWbCustom(key);
  if(key==='home')          return openWbHome();
  if(key==='details')       return openWbDetails();
  if(key==='gallery')       return openWbGallery();
  if(key==='schedule')      return openWbSchedule();
  if(key==='faq')           return openWbFaq();
  if(key==='accommodation') return openWbStays();
  if(key==='rsvp')          return openWbRsvp();
  // wishingwell / countdown hold no site-only TEXT — that still lives in the
  // planner. But they now own their images, so they get a real editor: the images, plus a
  // link to where the words come from.
  const dest = key==='wishingwell'?'wishingwell':'details';
  const destLabel = dest==='wishingwell'?'Wishing Well':'Event Details';
  const what = key==='countdown'
    ? 'The countdown reads the wedding date from Event Details.'
    : 'The words in this section come from your planner. Edit them where they live and the site follows.';
  _wbPanel(meta.name, `<div style="display:flex;flex-direction:column;gap:14px">
      <div style="font-size:12.5px;color:var(--muted);line-height:1.55">${what}</div>
      ${_wbLayoutHtml(key)}
      ${_wbBlocksHtml(key)}
    </div>`,
    `<button class="btn btn-outline" onclick="_wbNavGuard('${dest}')" style="margin-right:auto">Go to ${destLabel}</button>
     <button class="btn btn-outline" onclick="_wbSectionCancel()">Cancel</button>
     <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
}

function openWbHome(){
  const h=_wbSite().home;
  const hero=_wbSite().hero;
  const ctaMode=h.ctaMode||'ics';
  _wbHomeSnapshot=JSON.stringify({home:h, hero:{showNames:hero.showNames, showDate:hero.showDate}});
  const tog=(id,label,checked,fn)=>`<label class="tl-pub-row" for="${id}" style="padding:9px 10px">
      <span class="tl-pub-title">${label}</span>
      <span class="toggle-switch" style="transform:scale(.72);transform-origin:right center">
        <input type="checkbox" id="${id}" ${checked?'checked':''} onchange="${fn}(this.checked)"/>
        <span class="toggle-track"></span>
      </span>
    </label>`;
  _wbPanel('Home', `<div style="display:flex;flex-direction:column;gap:14px">
      <button type="button" class="btn btn-outline btn-sm" onclick="closeModalDirect();openWbHero()" style="align-self:flex-start;display:inline-flex;align-items:center;gap:6px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Hero image${hero.mediaId?' · set':''}</button>
      <div style="display:flex;flex-direction:column;gap:4px;border:1px solid var(--border);border-radius:10px;overflow:hidden">
        ${tog('wb-h-snames','Names',hero.showNames!==false,'_wbHomeHeroSet.bind(null,\'showNames\')')}
        ${tog('wb-h-sdate','Date',hero.showDate!==false,'_wbHomeHeroSet.bind(null,\'showDate\')')}
      </div>
      <div style="font-size:11.5px;color:var(--muted);margin-top:-8px;line-height:1.5">Turn these off if your hero image already has them, or to use a different layout.</div>
      <div class="form-group"><label class="form-label">Headline <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <input class="form-input" id="wb-h-head" placeholder="e.g. We're getting married" value="${_escHtml(h.headline||'')}"
               oninput="_wbLiveHomeUpdate()"/></div>
      <div class="form-group"><label class="form-label">Welcome message <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <textarea class="form-input" id="wb-h-sub" rows="3" placeholder="A line or two for your guests…" style="resize:vertical"
                  oninput="_wbLiveHomeUpdate()">${_escHtml(h.sub||'')}</textarea></div>
      <div class="wb-blk-ctl">
        <span class="wb-slot-lbl">Button</span>
        <span class="inv-seg">
          <button type="button" id="wb-cta-ics"  class="${ctaMode==='ics' ?'active':''}" onclick="_wbSetCtaMode('ics')">Save the date</button>
          <button type="button" id="wb-cta-rsvp" class="${ctaMode==='rsvp'?'active':''}" onclick="_wbSetCtaMode('rsvp')">RSVP</button>
          <button type="button" id="wb-cta-none" class="${ctaMode==='none'?'active':''}" onclick="_wbSetCtaMode('none')">None</button>
        </span>
      </div>
      <div id="wb-cta-hint" style="font-size:12px;color:var(--muted);margin-top:-6px">${ctaMode==='ics'?'Adds a Save the date calendar download.':ctaMode==='rsvp'?'Links guests to your RSVP form.':''}</div>
      <div style="margin-top:8px;border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <label class="tl-pub-row" for="wb-h-brandoff" style="padding:9px 10px${_sbSession && typeof _uvIsPaid==='function' && !_uvIsPaid()?' ;opacity:.55':''}">
          <span class="tl-pub-title" style="display:flex;flex-direction:column;gap:1px"><span>Show &ldquo;Made with Union Vault&rdquo; badge</span><span style="font-size:11px;color:var(--muted);font-weight:400">${_sbSession && typeof _uvIsPaid==='function' && !_uvIsPaid()?'Upgrade to Full Access to remove':'Toggle the footer badge on your wedding website'}</span></span>
          <span class="toggle-switch" style="transform:scale(.72);transform-origin:right center">
            <input type="checkbox" id="wb-h-brandoff" ${_wbSite().brandOff?'':'checked'} onchange="_wbToggleBrand(this.checked)"/>
            <span class="toggle-track"></span>
          </span>
        </label>
      </div>
    </div>`,
    `<button class="btn btn-outline" style="margin-right:auto" onclick="_wbHomeCancel()">Cancel</button>
     <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
}
function _wbSaveHome(){
  const h=_wbSite().home;
  h.headline=(document.getElementById('wb-h-head')||{}).value||'';
  h.sub=(document.getElementById('wb-h-sub')||{}).value||'';
  _wbHomeSnapshot=null;
  saveToStorage();
}
function _wbToggleBrand(showBadge){
  if(!showBadge && _sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('brandOff')){
    const cb=document.getElementById('wb-h-brandoff'); if(cb) cb.checked=true;
    return;
  }
  _wbSite().brandOff=!showBadge;
  saveToStorage(); _wbLivePaint();
}
function _wbHomeCancel(){
  if(_wbHomeSnapshot){
    try{
      const snap=JSON.parse(_wbHomeSnapshot);
      const w=_wbSite();
      Object.assign(w.home, snap.home);
      Object.assign(w.hero, snap.hero);
      saveToStorage(); _wbLivePaint();
    }catch(e){}
    _wbHomeSnapshot=null;
  }
  _wbClosePanel();
}
function _wbLiveHomeUpdate(){
  const h=_wbSite().home;
  h.headline=(document.getElementById('wb-h-head')||{}).value||'';
  h.sub=(document.getElementById('wb-h-sub')||{}).value||'';
  saveToStorage(); _wbLiveSoon();
}
function _wbHomeHeroSet(field, val){
  const hero=_wbSite().hero;
  hero[field]=val;
  saveToStorage(); _wbLiveSoon();
}
function _wbSetCtaMode(mode){
  const h=_wbSite().home;
  h.ctaMode=mode;
  saveToStorage();
  _wbLiveSoon();
  ['ics','rsvp','none'].forEach(m=>{
    const b=document.getElementById('wb-cta-'+m);
    if(b) b.classList.toggle('active',m===mode);
  });
  const hint=document.getElementById('wb-cta-hint');
  if(hint) hint.textContent=mode==='ics'?'Adds a Save the date calendar download.':mode==='rsvp'?'Links guests to your RSVP form.':'';
}

function _wbRsvpPreviewHtml(){
  const w=_wbSite(), r=w.rsvp||{}, t=w.theme||{};
  const p1=(STATE.event&&STATE.event.partner1)||'Partner 1';
  const p2=(STATE.event&&STATE.event.partner2)||'Partner 2';
  const dateStr=(STATE.event&&STATE.event.date)?fmtDate(STATE.event.date):'';
  const venue=(STATE.event&&STATE.event.venue)||'';
  const meta=[dateStr,venue].filter(Boolean).join(' · ');
  const pal=r.palette||'sage';
  const palC=(pal==='custom'?(r.customColors||{}):(_RSVP_PALS[pal]||_RSVP_PALS.sage));
  const bg=palC.bg||'#F5F0E8', surf=palC.surf||'#EDE6D8', accent=palC.accent||'#A08050', ink=palC.ink||'#3A3020';
  const hf=((t.headFont)||"'Cormorant Garamond',serif").replace(/"/g,"'");
  const style=r.headerStyle||'classic';
  const btnFg=_isDarkHex(accent)?'#fff':'#1a1a1a';
  const n1=p1.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const n2=p2.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const metaE=meta.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const btnYes=(r.btnYes||'Joyfully accepts').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const btnNo=(r.btnNo||'Regretfully declines').replace(/&/g,'&amp;').replace(/</g,'&lt;');

  let headerHtml;
  if(style==='banner'){
    headerHtml=`<div style="background:${surf};padding:22px 20px 18px;text-align:center">
      <div style="font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:${ink};opacity:.65;margin-bottom:7px">You are invited to celebrate</div>
      <div style="font-family:${hf};font-size:20px;color:${ink};line-height:1.15;margin-bottom:5px">${n1} &amp; ${n2}</div>
      ${metaE?`<div style="font-size:9px;color:${ink};opacity:.65">${metaE}</div>`:''}
    </div>`;
  } else if(style==='minimal'){
    headerHtml=`<div style="padding:22px 20px 18px;text-align:center">
      <div style="font-family:${hf};font-size:22px;color:${ink};line-height:1.15;margin-bottom:5px">${n1} &amp; ${n2}</div>
      ${metaE?`<div style="font-size:9px;color:${ink};opacity:.6">${metaE}</div>`:''}
    </div>`;
  } else {
    headerHtml=`<div style="padding:22px 20px 18px;text-align:center">
      <div style="font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:${accent};margin-bottom:8px">RSVP</div>
      <div style="font-family:${hf};font-size:20px;color:${ink};line-height:1.15;margin-bottom:6px">${n1} &amp; ${n2}</div>
      <div style="width:28px;height:1px;background:${accent};margin:0 auto 6px;opacity:.5"></div>
      ${metaE?`<div style="font-size:9px;color:${ink};opacity:.65">${metaE}</div>`:''}
    </div>`;
  }

  return`<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:${bg};font-family:'Inter',sans-serif;min-height:100%}</style></head><body>
${headerHtml}
<div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:8px">
  <div style="font-size:9px;color:${ink};opacity:.5;text-align:center;margin-bottom:2px">Will you be attending?</div>
  <button style="padding:9px;border-radius:7px;background:${accent};color:${btnFg};border:none;font-size:11px;font-family:'Inter',sans-serif">${btnYes}</button>
  <button style="padding:9px;border-radius:7px;background:transparent;color:${accent};border:1.5px solid ${accent};font-size:11px;font-family:'Inter',sans-serif">${btnNo}</button>
</div>
</body></html>`;
}
function _wbRsvpRefreshPreview(){
  const f=document.getElementById('rsvp-prev-frame');
  if(f) f.srcdoc=_wbRsvpPreviewHtml();
}
function openWbRsvp(){
  const url = _rsvpLink();
  const hasUid = !url.endsWith('?rsvp=true');
  const w=_wbSite(), r=w.rsvp;
  const pSel=r.palette||'sage', sSel=r.headerStyle||'classic';
  const fields=r.fields||{}, cc=r.customColors||{};
  const pal=(STATE.inspo&&STATE.inspo.colors)||[];

  const styleCard=(id,label,svgBody)=>`<button type="button" id="rsvp-style-${id}" data-style="${id}"
    onclick="_wbRsvpSetStyle('${id}')"
    style="flex:1;min-width:0;padding:8px 6px;border-radius:9px;border:2px solid ${sSel===id?'var(--gold)':'var(--border)'};background:${sSel===id?'color-mix(in srgb,var(--gold) 10%,var(--card) 90%)':'var(--card)'};cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;transition:all .15s">
    <div style="width:100%;max-width:60px;height:36px;border-radius:5px;overflow:hidden;border:1px solid var(--border)">${svgBody}</div>
    <div style="font-size:10.5px;font-weight:${sSel===id?'600':'400'};color:${sSel===id?'var(--gold)':'var(--fg)'}">${label}</div>
  </button>`;

  const palBtn=(id,label,[bg,ac])=>{const on=pSel===id;return`<button type="button" id="rsvp-pal-${id}" data-pal="${id}"
    onclick="_wbRsvpSetPalette('${id}')"
    style="flex:1;min-width:0;padding:7px 4px;border-radius:9px;border:2px solid ${on?'var(--gold)':'var(--border)'};background:${on?'color-mix(in srgb,var(--gold) 10%,var(--card) 90%)':'var(--card)'};cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;transition:all .15s">
    <div style="display:flex;gap:3px"><div style="width:14px;height:14px;border-radius:3px;background:${bg}"></div><div style="width:14px;height:14px;border-radius:3px;background:${ac}"></div></div>
    <div style="font-size:10px;font-weight:${on?'600':'400'};color:${on?'var(--gold)':'var(--muted)'};white-space:nowrap">${label}</div>
  </button>`;};

  const customRoles=[['bg','Background'],['surf','Surface'],['accent','Accent'],['ink','Text']];
  const renderCustomRows=()=>customRoles.map(([role,label])=>{
    const cur=cc[role]||'#888888';
    return `<div class="wb-role" data-role="${role}">
      <span class="wb-role-name">${label}</span>
      <div style="display:flex;gap:5px;flex-wrap:wrap;flex:1;align-items:center">
        ${pal.map(hex=>`<button type="button" class="wb-pal-sw ${cur===hex?'on':''}" style="background:${_escHtml(hex)};width:22px;height:22px;border-radius:5px" onclick="_wbRsvpSetColor('${role}','${_escHtml(hex)}',this.closest('[data-role]'))" title="${_escHtml(hex)}"></button>`).join('')}
        <label class="wb-pal-sw" style="background:${_escHtml(cur)};width:22px;height:22px;border-radius:5px;border:2px dashed var(--border);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;position:relative">
          <input type="color" value="${_escHtml(cur)}" onchange="_wbRsvpSetColor('${role}',this.value,this.closest('[data-role]'))" style="position:absolute;inset:0;opacity:0;cursor:pointer"/>
        </label>
      </div>
    </div>`;
  }).join('');

  const fieldTog=(field,label)=>{
    const on=field in fields?!!fields[field]:true;
    return `<label class="tl-pub-row" style="padding:9px 10px;border-radius:0;cursor:pointer">
      <span class="tl-pub-title">${label}</span>
      <span class="toggle-switch" style="transform:scale(.72);transform-origin:right center">
        <input type="checkbox" ${on?'checked':''} onchange="_wbRsvpToggleField('${field}',this.checked)"/>
        <span class="toggle-track"></span>
      </span>
    </label>`;
  };

  _wbPanel('RSVP', `<div style="display:flex;flex-direction:column;gap:16px">
    <div>
      <div class="wb-slot-lbl" style="margin-bottom:6px">Preview</div>
      <iframe id="rsvp-prev-frame" scrolling="no" sandbox="allow-same-origin"
        style="width:100%;height:220px;border:1px solid var(--border);border-radius:10px;display:block"></iframe>
    </div>
    <div style="font-size:12.5px;color:var(--muted);line-height:1.55">Share this link with your guests. When they open it they'll see a form to submit their RSVP — no login needed.</div>
    ${hasUid
      ? `<div style="display:flex;gap:8px;align-items:stretch">
           <input readonly class="form-input" value="${_escHtml(url)}" id="rsvp-link-inp" style="flex:1;font-size:11.5px;cursor:text" onclick="this.select()"/>
           <button type="button" class="btn btn-outline" onclick="_copyRsvpLink()" style="white-space:nowrap">Copy</button>
         </div>`
      : '<div style="color:var(--red);font-size:12.5px">Sign in to get your RSVP link.</div>'}

    <div style="font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;padding-top:4px">Appearance</div>

    <div>
      <div class="wb-slot-lbl" style="margin-bottom:6px">Header style</div>
      <div id="rsvp-style-grid" style="display:flex;gap:6px">
        ${styleCard('classic','Classic',`<svg width="100%" height="100%" viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="36" fill="#e8ddd0"/><rect x="18" y="11" width="24" height="3" rx="1.5" fill="#a08050"/><rect x="22" y="16" width="16" height="2" rx="1" fill="#c0a070"/><rect x="26" y="20" width="8" height="1.5" rx=".75" fill="#c0a070" opacity=".5"/></svg>`)}
        ${styleCard('minimal','Minimal',`<svg width="100%" height="100%" viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="36" fill="#f8f4ee"/><rect x="10" y="15" width="40" height="2.5" rx="1.25" fill="#a08050"/><rect x="18" y="20" width="24" height="1.5" rx=".75" fill="#c0a070" opacity=".7"/></svg>`)}
        ${styleCard('banner','Banner',`<svg width="100%" height="100%" viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="36" fill="#2d3d35"/><rect x="14" y="11" width="32" height="3" rx="1.5" fill="rgba(255,255,255,.85)"/><rect x="18" y="16" width="24" height="2" rx="1" fill="rgba(255,255,255,.55)"/><rect x="24" y="20" width="12" height="1.5" rx=".75" fill="rgba(255,255,255,.35)"/></svg>`)}
      </div>
    </div>

    <div>
      <div class="wb-slot-lbl" style="margin-bottom:6px">Colour scheme</div>
      <div id="rsvp-pal-grid" style="display:flex;gap:5px">
        ${palBtn('sage','Sage',['#E8EDEA','#5C7D6B'])}
        ${palBtn('ivory','Ivory',['#F5F0E8','#A08050'])}
        ${palBtn('blush','Blush',['#F5EDE9','#C0745A'])}
        ${palBtn('midnight','Midnight',['#1A1E2A','#7B95C8'])}
        ${palBtn('slate','Slate',['#1E2226','#8AA4A8'])}
        ${palBtn('custom','Custom',['var(--card)','var(--gold)'])}
      </div>
    </div>

    <div id="rsvp-custom-colors" style="display:${pSel==='custom'?'flex':'none'};flex-direction:column;gap:4px;padding:10px;background:var(--card);border-radius:10px;border:1px solid var(--border)">
      <div class="wb-slot-lbl" style="margin-bottom:4px">Custom colours</div>
      <div id="rsvp-custom-rows">${pSel==='custom'?renderCustomRows():''}</div>
    </div>

    <div style="font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;padding-top:4px">Form fields</div>
    <div style="display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:-8px">
      ${fieldTog('dietary','Dietary requirements')}
      ${fieldTog('email','Email address')}
      ${fieldTog('phone','Phone number')}
      ${fieldTog('address','Postal address')}
      ${fieldTog('message','Message to couple')}
    </div>

    <div style="font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;padding-top:4px">Button labels</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:-8px">
      <div class="form-group" style="margin:0">
        <label class="form-label" style="margin-bottom:4px">Attending</label>
        <input class="form-input" value="${_escHtml(r.btnYes||'')}" placeholder="Joyfully accepts"
          oninput="_wbRsvpSet('btnYes',this.value)" style="font-size:13px"/>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label" style="margin-bottom:4px">Not attending</label>
        <input class="form-input" value="${_escHtml(r.btnNo||'')}" placeholder="Regretfully declines"
          oninput="_wbRsvpSet('btnNo',this.value)" style="font-size:13px"/>
      </div>
    </div>

    ${_wbLayoutHtml('rsvp')}
    ${_wbBlocksHtml('rsvp')}
  </div>`,
  `<button class="btn btn-outline" onclick="_wbNavGuard('guests')" style="margin-right:auto">View responses</button>
   <button class="btn btn-outline" onclick="_wbSectionCancel()">Cancel</button>
   <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
  setTimeout(_wbRsvpRefreshPreview, 0);
}
function _copyRsvpLink(){
  const inp = document.getElementById('rsvp-link-inp');
  if(!inp) return;
  const btn = inp.nextElementSibling;
  const done = ()=>{ if(btn){ const old=btn.textContent; btn.textContent='Copied!'; setTimeout(()=>btn.textContent=old, 1800); } };
  if(navigator.clipboard) navigator.clipboard.writeText(inp.value).then(done).catch(()=>{ inp.select(); document.execCommand('copy'); done(); });
  else { inp.select(); document.execCommand('copy'); done(); }
}
function _wbRsvpSetStyle(s){
  _wbSite().rsvp.headerStyle=s; saveToStorage(); _wbLiveSoon();
  document.querySelectorAll('#rsvp-style-grid button').forEach(b=>{
    const on=b.dataset.style===s;
    b.style.borderColor=on?'var(--gold)':'var(--border)';
    b.style.background=on?'color-mix(in srgb,var(--gold) 10%,var(--card) 90%)':'var(--card)';
    const lbl=b.querySelector('div:last-child');
    if(lbl){lbl.style.fontWeight=on?'600':'400';lbl.style.color=on?'var(--gold)':'var(--fg)';}
  });
  _wbRsvpRefreshPreview();
}
function _wbRsvpSetPalette(id){
  const _r=_wbSite().rsvp;
  if(id!=='custom' && _r.palette!=='custom') _r._prevPalette=_r.palette||'sage';
  _r.palette=id; saveToStorage(); _wbLiveSoon();
  document.querySelectorAll('#rsvp-pal-grid button').forEach(b=>{
    const on=b.dataset.pal===id;
    b.style.borderColor=on?'var(--gold)':'var(--border)';
    b.style.background=on?'color-mix(in srgb,var(--gold) 10%,var(--card) 90%)':'var(--card)';
    const lbl=b.querySelector('div:last-child');
    if(lbl){lbl.style.fontWeight=on?'600':'400';lbl.style.color=on?'var(--gold)':'var(--muted)';}
  });
  const cc=document.getElementById('rsvp-custom-colors');
  if(cc){
    cc.style.display=id==='custom'?'flex':'none';
    if(id==='custom'){
      // Seed customColors from the previous palette so the preview starts with real colours
      const r=_wbSite().rsvp;
      if(!r.customColors||!Object.keys(r.customColors).length){
        const prev=r._prevPalette||'sage';
        r.customColors=Object.assign({},_RSVP_PALS[prev]||_RSVP_PALS.sage);
        saveToStorage();
      }
      const rows=document.getElementById('rsvp-custom-rows');if(rows&&!rows.children.length)_wbRsvpBuildCustomEditor();
    }
  }
  _wbRsvpRefreshPreview();
}
function _wbRsvpBuildCustomEditor(){
  const rows=document.getElementById('rsvp-custom-rows'); if(!rows) return;
  const r=_wbSite().rsvp; const cc=r.customColors||{};
  const pal=(STATE.inspo&&STATE.inspo.colors)||[];
  rows.innerHTML=[['bg','Background'],['surf','Surface'],['accent','Accent'],['ink','Text']].map(([role,label])=>{
    const cur=cc[role]||'#888888';
    return `<div class="wb-role" data-role="${role}">
      <span class="wb-role-name">${label}</span>
      <div style="display:flex;gap:5px;flex-wrap:wrap;flex:1;align-items:center">
        ${pal.map(hex=>`<button type="button" class="wb-pal-sw ${cur===hex?'on':''}" style="background:${_escHtml(hex)};width:22px;height:22px;border-radius:5px" onclick="_wbRsvpSetColor('${role}','${_escHtml(hex)}',this.closest('[data-role]'))" title="${_escHtml(hex)}"></button>`).join('')}
        <label class="wb-pal-sw" style="background:${_escHtml(cur)};width:22px;height:22px;border-radius:5px;border:2px dashed var(--border);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;position:relative">
          <input type="color" value="${_escHtml(cur)}" onchange="_wbRsvpSetColor('${role}',this.value,this.closest('[data-role]'))" style="position:absolute;inset:0;opacity:0;cursor:pointer"/>
        </label>
      </div>
    </div>`;
  }).join('');
}
function _wbRsvpSetColor(role, hex, rowEl){
  const r=_wbSite().rsvp; if(!r.customColors) r.customColors={};
  r.customColors[role]=hex; saveToStorage(); _wbLiveSoon();
  if(rowEl){
    rowEl.querySelectorAll('button.wb-pal-sw').forEach(b=>b.classList.toggle('on',b.title===hex));
    const lbl=rowEl.querySelector('label.wb-pal-sw');
    if(lbl){lbl.style.background=hex;const inp=lbl.querySelector('input[type=color]');if(inp)inp.value=hex;}
  }
  _wbRsvpRefreshPreview();
}
function _wbRsvpToggleField(field, on){
  const r=_wbSite().rsvp; if(!r.fields) r.fields={};
  r.fields[field]=on; saveToStorage(); _wbLiveSoon();
}
function _wbRsvpSet(key, val){
  _wbSite().rsvp[key]=val; saveToStorage(); _wbLiveSoon();
}

function openWbDetails(){
  const w=_wbSite(); const e=STATE.event||{};
  const dh=w.details.hide;
  const tog=(id,field,label)=>`<label class="tl-pub-row" for="${id}" style="padding:9px 10px">
    <span class="tl-pub-title">${label}</span>
    <span class="toggle-switch" style="transform:scale(.72);transform-origin:right center">
      <input type="checkbox" id="${id}" ${!dh[field]?'checked':''} onchange="_wbDetailHide('${field}',!this.checked)"/>
      <span class="toggle-track"></span>
    </span>
  </label>`;
  _wbPanel('Event details', `<div style="display:flex;flex-direction:column;gap:14px">
    ${_wbLayoutHtml('details')}
    <div style="font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.08em;text-transform:uppercase">Show on site</div>
    <div style="display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:-8px">
      ${tog('wb-dh-venue','venue','Venue')}
      ${tog('wb-dh-address','address','Address')}
      ${tog('wb-dh-ceremony','ceremony','Ceremony')}
      ${tog('wb-dh-date','date','Date')}
      ${tog('wb-dh-time','time','Time')}
    </div>
    <div class="form-group"><label class="form-label">Ceremony time <span style="color:var(--muted);font-weight:400">(optional)</span></label>
      <input class="form-input" value="${_escHtml(e.time||'')}" placeholder="e.g. 3:00 PM"
             oninput="STATE.event.time=this.value;saveToStorage();_wbLiveSoon()"/></div>
    <div style="font-size:12px;color:var(--muted);margin-top:-8px;line-height:1.5">Other details (venue, date…) are set in <b>Event Details</b> in your planner.</div>
    ${_wbBlocksHtml('details')}
  </div>`,
  `<button class="btn btn-outline" onclick="_wbNavGuard('details')" style="margin-right:auto">Go to Event Details</button>
   <button class="btn btn-outline" onclick="_wbSectionCancel()">Cancel</button>
   <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
}
function _wbDetailHide(field, hide){
  const dh=_wbSite().details.hide;
  if(hide) dh[field]=true; else delete dh[field];
  saveToStorage(); _wbLiveSoon();
}
function openWbGallery(){
  _wbPanel('Gallery', _wbLayoutHtml('gallery')+`<div id="wb-gallery-shell">${_wbGalleryBody()}</div>`,
    `<button class="btn btn-outline" style="margin-right:auto" onclick="_wbSectionCancel()">Cancel</button>
     <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
}
// Redraw ONLY the picker shell (grid + intro copy). The Layout box is a sibling node and is
// left untouched — so picking a photo no longer wipes the heading/intro/align controls (the
// v147 bug: the old refresh rewrote the whole modal body with just the grid).
function _wbGalleryRefresh(){
  const shell=document.getElementById('wb-gallery-shell');
  if(shell) shell.innerHTML=_wbGalleryBody();
  _wbLiveSoon();
}
function _wbGalleryBody(){
  const picked=_wbSite().gallery;
  const items=_wbGalleryPickable();
  const uploadTile=`<button type="button" onclick="_wbGalleryUpload()" title="Upload a photo"
      style="aspect-ratio:1;border-radius:8px;border:2px dashed var(--sw-border,#E3D7C4);background:var(--sw-bg,#FBF8F3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#A89066;cursor:pointer;font-size:10.5px;font-weight:600;padding:0">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Upload</button>`;
  const intro = items.length
    ? `<div style="font-size:12.5px;color:var(--muted);line-height:1.55;margin-bottom:12px">Tap the photos you'd like your guests to see. ${_wbGalleryItems().length} of ${items.length} chosen.</div>`
    : `<div style="font-size:12.5px;color:var(--muted);line-height:1.55;margin-bottom:12px">Upload photos for your gallery, or add some to Inspiration and they'll appear here to choose from.</div>`;
  const grid=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px">
      ${uploadTile}
      ${items.map(it=>{
        const on=picked.indexOf(it.id)>=0;
        const url=_mediaUrl(it.image);
        const gone=_mediaMissing(it.image);
        if(gone){const _goneAct=it.src==='upload'?`_wbGalleryDeleteUpload('${it.id}')`:`_wbGalleryPick('${it.id}')`;return `<div style="position:relative;aspect-ratio:1;border-radius:8px;border:1px dashed var(--red);display:flex;align-items:center;justify-content:center;text-align:center;font-size:10.5px;color:var(--red);padding:6px;cursor:pointer" onclick="${_goneAct}">Image not saved<button onclick="event.stopPropagation();${_goneAct}" style="position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;background:var(--red);color:#fff;border:none;cursor:pointer;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0">×</button></div>`;}
        // The "+ Inspiration" tag shows only on UPLOADS that aren't already in Inspiration.
        const inspoTag=(it.src==='upload' && !it.inInspo)
          ? `<span onclick="event.stopPropagation();_wbGalleryToInspo('${it.id}')" title="Also add to Inspiration"
               style="position:absolute;bottom:0;left:0;right:0;background:rgba(92,61,46,.82);color:#fff;font-size:9.5px;font-weight:600;letter-spacing:.02em;padding:3px 0;text-align:center;display:flex;align-items:center;justify-content:center;gap:3px;cursor:pointer">
               <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Inspiration</span>`
          : (it.src==='upload' && it.inInspo)
            ? `<span title="In your Inspiration gallery" style="position:absolute;bottom:0;left:0;right:0;background:rgba(74,124,89,.82);color:#fff;font-size:9.5px;font-weight:600;padding:3px 0;text-align:center">✓ In Inspiration</span>`
            : '';
        // Uploads carry a small delete ✕ (top-left) so a mistaken upload can be removed.
        const delX=(it.src==='upload')
          ? `<span onclick="event.stopPropagation();_wbGalleryDeleteUpload('${it.id}')" title="Remove this uploaded photo"
               style="position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer">✕</span>`
          : '';
        // v149: picked tiles are draggable to reorder within w.gallery. A real drag doesn't
        // fire a click, so tap-to-toggle and drag-to-reorder don't collide. A small grip badge
        // (bottom-left on picked, non-upload tiles; uploads already use bottom-left for tags —
        // there the grip goes top-right beside nothing, so we place it top-left-ish safely).
        const dragAttrs = on ? `draggable="true"
          ondragstart="_wbGalDragStart(event,'${it.id}')"
          ondragover="_wbGalDragOver(event,'${it.id}')"
          ondrop="_wbGalDrop(event,'${it.id}')"
          ondragend="_wbGalDragEnd(event)"` : '';
        const grip = on ? `<span class="wb-gal-grip" title="Drag to reorder" style="position:absolute;bottom:4px;right:4px;width:19px;height:19px;border-radius:5px;background:rgba(0,0,0,.42);color:#fff;display:flex;align-items:center;justify-content:center;pointer-events:none">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg></span>` : '';
        return `<button type="button" data-galid="${it.id}" onclick="_wbGalleryPick('${it.id}')" ${dragAttrs} style="position:relative;padding:0;border:3px solid ${on?'var(--gold)':'transparent'};border-radius:8px;overflow:hidden;cursor:${on?'grab':'pointer'};aspect-ratio:1;background:var(--surface)">
          <img src="${url}" alt="${_escHtml(it.title||'')}" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none"/>
          ${on?`<span style="position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px">✓</span>`:''}
          ${delX}
          ${inspoTag}
          ${grip}
        </button>`;
      }).join('')}
    </div>
    <div style="font-size:10.5px;color:var(--muted);margin-top:9px;line-height:1.5">Uploaded photos are website-only. Tap <b style="color:var(--gold-deep)">＋ Inspiration</b> on one to add it to your Inspiration gallery too.</div>`;
  return intro+grid;
}
function _wbGalleryPick(id){
  const g=_wbSite().gallery;
  const i=g.indexOf(id);
  if(i>=0) g.splice(i,1); else g.push(id);
  saveToStorage();
  _wbGalleryRefresh();
}
// ── Gallery reorder (drag picked tiles within w.gallery) ──────────────────────
// Only picked tiles are draggable; w.gallery IS the order the site renders, so a drop
// splices the dragged id in front of the drop target. A real drag suppresses the click,
// so this never accidentally toggles a photo off.
let _wbGalDragId=null;
function _wbGalDragStart(e,id){
  _wbGalDragId=id;
  try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',id); }catch(_){}
  const btn=e.currentTarget; if(btn) btn.style.opacity='.45';
}
function _wbGalDragOver(e,id){
  if(_wbGalDragId==null || id===_wbGalDragId) return;
  e.preventDefault();                          // allow the drop
  try{ e.dataTransfer.dropEffect='move'; }catch(_){}
  const shell=document.getElementById('wb-gallery-shell');
  if(shell) shell.querySelectorAll('[data-galid]').forEach(b=>{ if(b!==e.currentTarget) b.style.outline=''; });
  const btn=e.currentTarget;
  if(btn){ btn.style.outline='2px dashed var(--gold)'; btn.style.outlineOffset='-2px'; }
}
function _wbGalDrop(e,targetId){
  e.preventDefault();
  const g=_wbSite().gallery;
  const from=g.indexOf(_wbGalDragId), to=g.indexOf(targetId);
  if(from<0 || to<0 || from===to){ _wbGalDragEnd(e); return; }
  const [moved]=g.splice(from,1);
  // Re-find the target index AFTER removal, then insert before it.
  const t=g.indexOf(targetId);
  g.splice(t<0?g.length:t, 0, moved);
  saveToStorage();
  _wbGalDragId=null;
  _wbGalleryRefresh();                          // redraws grid in new order + repaints preview
}
function _wbGalDragEnd(e){
  _wbGalDragId=null;
  // Clear any leftover drag styling across the grid.
  const shell=document.getElementById('wb-gallery-shell');
  if(shell) shell.querySelectorAll('[data-galid]').forEach(b=>{ b.style.opacity=''; b.style.outline=''; });
}
// Upload a new photo straight into the gallery (website-only). Reuses the shared
// compressImage + _mediaPut pipeline, so it's stored and walked like every other image.
function _wbGalleryUpload(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{
    const f=inp.files&&inp.files[0]; if(!f) return;
    // Read the File to a data URL FIRST — compressImage expects a data URL string, not a
    // File object (it does img.src=…). Passing the File made img.src fail, compressImage
    // returned the File unchanged, and _mediaPut stored a broken blob → broken image.
    // This mirrors handleInspoUpload, the working inspiration-upload path.
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{
        const dataUrl=await compressImage(ev.target.result);
        const mediaId=await _mediaPut(dataUrl, f.name, 'image/jpeg');
        const up={id:'gu'+Date.now().toString(36)+Math.floor(Math.random()*1000), image:mediaId};
        _wbSite().galleryUploads.push(up);
        _wbSite().gallery.push(up.id);   // auto-select a freshly uploaded photo
        saveToStorage();
        _wbGalleryRefresh();
      }catch(e){ _showInfoToast&&_showInfoToast('Could not add that photo.'); }
    };
    reader.onerror=()=>{ _showInfoToast&&_showInfoToast('Could not read that photo.'); };
    reader.readAsDataURL(f);
  };
  inp.click();
}
// Promote an uploaded gallery photo into the Inspiration gallery. It KEEPS the same mediaId,
// so both places point at one stored blob — no copy, and the walker still sees one image.
function _wbGalleryToInspo(upId){
  const up=(_wbSite().galleryUploads||[]).find(u=>u.id===upId);
  if(!up||!up.image) return;
  if(!STATE.inspo) STATE.inspo={colors:[],items:[]};
  if(!Array.isArray(STATE.inspo.items)) STATE.inspo.items=[];
  if(STATE.inspo.items.some(i=>i.image===up.image)){ _wbGalleryRefresh(); return; } // already there
  STATE.inspo.items.push({id:'ii'+Date.now().toString(36)+Math.floor(Math.random()*1000), image:up.image, title:''});
  saveToStorage();
  _showInfoToast&&_showInfoToast('Added to your Inspiration gallery.');
  _wbGalleryRefresh();
}
// Remove an uploaded gallery photo. If it was promoted to Inspiration, the Inspiration copy
// STAYS (deleting a website photo shouldn't silently gut the inspiration board). Only the
// gallery-owned upload record and its pick are removed. The blob is left to the orphan sweep.
function _wbGalleryDeleteUpload(upId){
  const w=_wbSite();
  const idx=(w.galleryUploads||[]).findIndex(u=>u.id===upId);
  if(idx<0) return;
  w.galleryUploads.splice(idx,1);
  const gi=w.gallery.indexOf(upId);
  if(gi>=0) w.gallery.splice(gi,1);
  saveToStorage();
  _wbGalleryRefresh();
}

function openWbSchedule(){
  _wbPanel('Timeline', _wbLayoutHtml('schedule')+_wbScheduleBody()+_wbBlocksHtml('schedule'),
    `<button class="btn btn-outline" style="margin-right:auto" onclick="_wbSectionCancel()">Cancel</button>
     <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
}
function _wbScheduleBody(){
  const all=(STATE.timeline||[]).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  if(!all.length) return `<div id="wb-sched-list" style="font-size:13px;color:var(--muted);line-height:1.6">Your timeline is empty. Add moments on the Day-of Timeline page first.</div>`;
  const shown=all.filter(x=>x.pub).length;
  return `<div id="wb-sched-list"><div style="font-size:12.5px;color:var(--muted);line-height:1.55;margin-bottom:6px">Your timeline holds vendor load-ins and supplier notes, so moments start <b>hidden</b>. Tick the ones guests should see.</div>
    <div style="margin-bottom:14px"><button type="button" class="btn btn-outline btn-sm" onclick="_wbScheduleAll(${shown<all.length?'true':'false'})">${shown<all.length?'Show all on website':'Hide all from website'}</button></div>
    <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
      ${all.map((it,ix)=>`<label style="display:flex;align-items:center;gap:11px;padding:11px 13px;${ix<all.length-1?'border-bottom:1px solid var(--border);':''}cursor:pointer">
        <input type="checkbox" ${it.pub?'checked':''} onchange="_wbSchedulePick('${it.id}',this.checked)" style="width:16px;height:16px;flex-shrink:0;accent-color:var(--gold)"/>
        <span style="flex:1;min-width:0">
          <span style="display:block;font-size:13px;color:var(--ink)">${_escHtml(it.title||'Untitled')}</span>
          <span style="display:block;font-size:11.5px;color:var(--muted)">${_escHtml(tlTo12h(it.time)||'—')}${it.location?' · '+_escHtml(it.location):''}</span>
        </span>
      </label>`).join('')}
    </div></div>`;
}
// Repaint ONLY the schedule list, not #modal-body — the slots block lives in the same
// modal and rewriting the whole body would destroy it.
function _wbSchedRepaint(){
  const box=document.getElementById('wb-sched-list');
  if(box) box.outerHTML=_wbScheduleBody();
  _wbLiveSoon();
}
function _wbSchedulePick(id, on){
  const it=(STATE.timeline||[]).find(x=>x.id===id);
  if(it){ it.pub=!!on; saveToStorage(); }
  _wbSchedRepaint();
}
function _wbScheduleAll(on){
  (STATE.timeline||[]).forEach(x=>{ x.pub=!!on; });
  saveToStorage();
  _wbSchedRepaint();
}

function openWbFaq(){
  _wbPanel('FAQ', _wbLayoutHtml('faq')+_wbFaqBody()+_wbBlocksHtml('faq'),
    `<button class="btn btn-outline" style="margin-right:auto" onclick="_wbSectionCancel()">Cancel</button>
     <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
}
function _wbFaqBody(){
  const faq=_wbSite().faq;
  const expand=((_wbSite().layout||{}).faq||{}).faqExpand!==false;
  return `<div id="wb-faq-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="min-width:0">
          <div class="wb-slot-lbl" style="margin-bottom:2px">Questions</div>
          <div style="font-size:11px;color:var(--muted);line-height:1.4">${expand?'Guests tap a question to reveal its answer.':'All answers show at once — no tapping.'}</div>
        </div>
        <span class="inv-seg" style="flex-shrink:0">
          <button type="button" class="${expand?'active':''}" onclick="_wbFaqSetExpand(true)">Expandable</button>
          <button type="button" class="${!expand?'active':''}" onclick="_wbFaqSetExpand(false)">Always show</button>
        </span>
      </div>
      ${faq.length?faq.map(f=>`<div style="border:1px solid var(--border);border-radius:10px;padding:11px 13px">
        <div style="display:flex;align-items:flex-start;gap:8px">
          <div style="flex:1;min-width:0">
            <input class="form-input" value="${_escHtml(f.q)}" oninput="_wbFaqEdit('${f.id}','q',this.value)" placeholder="Question" style="font-size:13px;margin-bottom:6px"/>
            <textarea class="form-input" rows="2" oninput="_wbFaqEdit('${f.id}','a',this.value)" placeholder="Answer" style="font-size:12.5px;resize:vertical">${_escHtml(f.a)}</textarea>
          </div>
          <button type="button" onclick="_wbFaqRemove('${f.id}')" title="Remove" style="flex-shrink:0;border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:15px;padding:4px">✕</button>
        </div>
      </div>`).join(''):`<div style="font-size:13px;color:var(--muted)">No questions yet.</div>`}
      <button type="button" class="btn btn-outline btn-sm" onclick="_wbFaqAdd()" style="align-self:flex-start">Add a question</button>
    </div>`;
}
// The Expandable/Always-show switch. Stored on the FAQ layout as faqExpand (default true).
// Repaints only the FAQ list (to move the pill) and reloads the live pane — it does not
// touch text inputs, so no focus is stolen.
function _wbFaqSetExpand(on){
  const l=_wbLayout('faq');
  if((l.faqExpand!==false)===on) return;   // no change
  l.faqExpand=on;
  saveToStorage();
  const box=document.getElementById('wb-faq-list');
  if(box) box.outerHTML=_wbFaqBody();
  _wbLiveSoon();
}
function _wbFaqEdit(id, field, val){
  const f=_wbSite().faq.find(x=>x.id===id);
  if(f){ f[field]=val; saveToStorage(); _wbLiveSoon(); }   // no MODAL repaint: it would steal focus mid-type
}
function _wbFaqAdd(){
  _wbSite().faq.push({id:uid(), q:'', a:''});
  saveToStorage();
  const box=document.getElementById('wb-faq-list');
  if(box) box.outerHTML=_wbFaqBody();
  _wbLiveSoon();
}
function _wbFaqRemove(id){
  const w=_wbSite();
  w.faq=w.faq.filter(x=>x.id!==id);
  saveToStorage();
  const box=document.getElementById('wb-faq-list');
  if(box) box.outerHTML=_wbFaqBody();
  _wbLiveSoon();
}

function openWbStays(){
  _wbPanel('Accommodation', _wbLayoutHtml('accommodation')+_wbStaysBody()+_wbBlocksHtml('accommodation'),
    `<button class="btn btn-outline" style="margin-right:auto" onclick="_wbSectionCancel()">Cancel</button>
     <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
}
function _wbStaysBody(){
  return _wbStaysSearchHtml()+_wbStaysListHtml();
}
function _wbStaysSearchHtml(){
  const addr=STATE.event.venueAddress||(STATE.event.venue||'');
  if(!addr) return `<div style="font-size:12.5px;color:var(--muted);line-height:1.55;margin-bottom:12px">Places for guests who need somewhere to stay. Add your venue address in <strong>Wedding Details</strong> to search for nearby accommodation.</div>`;
  return `<div style="margin-bottom:12px">
    <div style="font-size:12.5px;color:var(--muted);line-height:1.55;margin-bottom:8px">Places for guests who need somewhere to stay.</div>
    <button type="button" class="btn btn-outline btn-sm" onclick="_wbStaysSearch()" style="margin-bottom:8px;display:inline-flex;align-items:center;gap:5px">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      Find nearby
    </button>
    <div id="wb-stays-search"></div>
  </div>`;
}
function _wbStaysListHtml(){
  const stays=_wbSite().stays;
  return `<div id="wb-stays-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
      ${stays.length?stays.map(s=>`<div style="border:1px solid var(--border);border-radius:10px;padding:11px 13px">
        <div style="display:flex;align-items:flex-start;gap:8px">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
            <input class="form-input" value="${_escHtml(s.name)}" oninput="_wbStayEdit('${s.id}','name',this.value)" placeholder="Name" style="font-size:13px"/>
            <input class="form-input" value="${_escHtml(s.note||'')}" oninput="_wbStayEdit('${s.id}','note',this.value)" placeholder="e.g. 10 min from the venue · from $180" style="font-size:12.5px"/>
            <input class="form-input" value="${_escHtml(s.link||'')}" oninput="_wbStayEdit('${s.id}','link',this.value)" placeholder="Website (optional)" style="font-size:12.5px"/>
          </div>
          <button type="button" onclick="_wbStayRemove('${s.id}')" title="Remove" style="flex-shrink:0;border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:15px;padding:4px">✕</button>
        </div>
      </div>`).join(''):`<div style="font-size:13px;color:var(--muted)">Nothing listed yet.</div>`}
      <button type="button" class="btn btn-outline btn-sm" onclick="_wbStayAdd()" style="align-self:flex-start">Add manually</button>
    </div>`;
}
var _wbStaySearchResults=[];
async function _wbStaysSearch(){
  const addr=STATE.event.venueAddress||(STATE.event.venue||'');
  const box=document.getElementById('wb-stays-search');
  if(!box) return;
  box.innerHTML='<div style="font-size:12.5px;color:var(--muted);padding:4px 0">Searching…</div>';
  try{
    const geo=await _wbStaysGeocode(addr);
    if(!geo){ box.innerHTML='<div style="font-size:12.5px;color:var(--error,#c0392b)">Could not find your venue location. Try updating the address in Wedding Details.</div>'; return; }
    const raw=await _wbStaysOverpass(geo.lat,geo.lon,10000);
    if(!raw.length){ box.innerHTML='<div style="font-size:12.5px;color:var(--muted)">No accommodation found within 10 km.</div>'; return; }
    _wbStaySearchResults=raw;
    _wbStaysRenderResults(5);
  }catch(e){
    box.innerHTML='<div style="font-size:12.5px;color:var(--error,#c0392b)">Search failed. Check your internet connection and try again.</div>';
  }
}
async function _wbStaysGeocode(address){
  const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(address),{headers:{'Accept':'application/json','User-Agent':'UnionVaultApp/1.0'}});
  const d=await r.json();
  return d&&d.length?{lat:parseFloat(d[0].lat),lon:parseFloat(d[0].lon)}:null;
}
async function _wbStaysOverpass(lat,lon,radius){
  const q=`[out:json][timeout:25];(node["tourism"~"hotel|motel|hostel|guest_house|apartment|bed_and_breakfast"](around:${radius},${lat},${lon});way["tourism"~"hotel|motel|hostel|guest_house|apartment|bed_and_breakfast"](around:${radius},${lat},${lon}););out center tags;`;
  const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:'data='+encodeURIComponent(q)});
  const d=await r.json();
  const typeLabel={hotel:'Hotel',motel:'Motel',hostel:'Hostel',guest_house:'Guest house',apartment:'Apartment',bed_and_breakfast:'B&B'};
  return (d.elements||[]).map(el=>{
    const t=el.tags||{};
    const elLat=el.lat||(el.center&&el.center.lat)||lat;
    const elLon=el.lon||(el.center&&el.center.lon)||lon;
    const dist=_haversinKm(lat,lon,elLat,elLon);
    const type=typeLabel[t.tourism]||'Accommodation';
    const name=t.name||t['name:en']||type;
    const website=t.website||t['contact:website']||t['url']||'';
    const stars=t.stars?` · ${t.stars}★`:'';
    return{name,type,note:`${dist.toFixed(1)} km from venue${stars}`,website,dist};
  }).sort((a,b)=>a.dist-b.dist);
}
function _haversinKm(la1,lo1,la2,lo2){
  const R=6371,dL=(la2-la1)*Math.PI/180,dO=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function _wbStaysRenderResults(maxKm){
  const box=document.getElementById('wb-stays-search');
  if(!box) return;
  const all=_wbStaySearchResults;
  const fil=all.filter(r=>r.dist<=maxKm);
  box.innerHTML=`<div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:2px">
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
      <span style="font-size:12px;color:var(--muted)">Within</span>
      <select id="wb-stays-radius" onchange="_wbStaysFilterResults()" style="font-size:12px;padding:3px 6px;border:1px solid var(--border);border-radius:5px;background:var(--surface);color:var(--ink)">
        ${[1,2,3,5,10].map(km=>`<option value="${km}"${km===maxKm?' selected':''}>${km} km</option>`).join('')}
      </select>
      <span style="font-size:12px;color:var(--muted)">of venue — <strong>${fil.length}</strong> found</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;max-height:260px;overflow-y:auto">
      ${fil.length?fil.map((r,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border-radius:7px;border:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_escHtml(r.name)}</div>
          <div style="font-size:11.5px;color:var(--muted);margin-top:1px">${_escHtml(r.type)} · ${_escHtml(r.note)}</div>
        </div>
        <button type="button" onclick="_wbStaysAddFromSearch(${all.indexOf(r)})" style="flex-shrink:0;background:var(--primary);color:#fff;border:none;border-radius:6px;padding:5px 11px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap">+ Add</button>
      </div>`).join(''):`<div style="font-size:12.5px;color:var(--muted);padding:2px 0">None found — try a wider range.</div>`}
    </div>
  </div>`;
}
function _wbStaysFilterResults(){
  const sel=document.getElementById('wb-stays-radius');
  if(sel) _wbStaysRenderResults(parseFloat(sel.value));
}
function _wbStaysAddFromSearch(i){
  const r=_wbStaySearchResults[i];
  if(!r) return;
  _wbSite().stays.push({id:uid(),name:r.name,note:r.note,link:r.website});
  saveToStorage();
  const box=document.getElementById('wb-stays-list');
  if(box) box.outerHTML=_wbStaysListHtml();
  _wbLiveSoon();
}
function _wbStayEdit(id,field,val){
  const s=_wbSite().stays.find(x=>x.id===id);
  if(s){ s[field]=val; saveToStorage(); _wbLiveSoon(); }
}
function _wbStayAdd(){
  _wbSite().stays.push({id:uid(),name:'',note:'',link:''});
  saveToStorage();
  const box=document.getElementById('wb-stays-list');
  if(box) box.outerHTML=_wbStaysListHtml();
  _wbLiveSoon();
}
function _wbStayRemove(id){
  const w=_wbSite();
  w.stays=w.stays.filter(x=>x.id!==id);
  saveToStorage();
  const box=document.getElementById('wb-stays-list');
  if(box) box.outerHTML=_wbStaysListHtml();
  _wbLiveSoon();
}

// ── Custom sections ──
// A custom section is an ORDINARY section whose metadata happens to live in
// STATE.website.custom instead of the WB_SECTIONS constant. Its id sits in `order` next
// to the built-ins, so drag / toggle / images / layout all work with zero special-casing.
// The only things it can do that a built-in can't: be renamed, and be deleted.

function openWbAddSection(){
  const w=_wbSite();
  // Built-in sections that are off (toggled) or removed — need action to appear on site
  const needsAction=Object.keys(WB_SECTIONS).filter(k=>{
    if(k==='home') return false;
    const inOrder=w.order.indexOf(k)>=0;
    return !inOrder || !w.on[k];
  });
  const builtinHtml=needsAction.length?`<div style="margin-bottom:14px">
    <div style="font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:7px">Standard sections</div>
    ${needsAction.map(k=>{
      const meta=WB_SECTIONS[k];
      const inOrder=w.order.indexOf(k)>=0;
      const label=inOrder?'Hidden — tap to show':'Removed — tap to restore';
      const fn=inOrder?`_wbTurnOnSection('${k}')`:`_wbRestoreSection('${k}')`;
      const icon=inOrder
        ?`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        :`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.79"/></svg>`;
      return `<button type="button" class="wb-cblank" onclick="${fn}" style="margin-bottom:5px">${icon}
        <span><span style="display:block">${_escHtml(meta.name)}</span><span style="display:block;font-size:10.5px;color:var(--muted)">${label}</span></span>
      </button>`;
    }).join('')}
  </div>`:'';
  _wbPanel('Add a section', `<div>
      ${builtinHtml}
      <div style="font-size:12.5px;color:var(--muted);line-height:1.55;margin-bottom:13px">Start from a common one, or build your own.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
        ${WB_CUSTOM_PRESETS.map(p=>`<button type="button" class="wb-cpreset" onclick="_wbAddSection('${p.key}')">
          <span class="wb-cpreset-n">${_escHtml(p.name)}</span>
        </button>`).join('')}
      </div>
      <button type="button" class="wb-cblank" onclick="_wbAddSection('')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span><span style="display:block">Blank section</span><span style="display:block;font-size:10.5px;color:var(--muted)">Your own heading, text and images</span></span>
      </button>
    </div>`,
    `<button class="btn btn-outline" onclick="_wbClosePanel()">Cancel</button>`);
}
function _wbAddSection(presetKey){
  const w=_wbSite();
  const p=WB_CUSTOM_PRESETS.find(x=>x.key===presetKey);
  const id='cs'+uid();
  w.custom[id]={ name:p?p.name:'New section', body:p?p.body:'' };
  w.on[id]=true;
  // Drop it in before RSVP, which is a locked tail-ender and should stay last.
  const r=w.order.indexOf('rsvp');
  if(r>=0) w.order.splice(r,0,id); else w.order.push(id);
  saveToStorage();
  _wbClosePanel();
  navigate('website');
  // Open it straight away — a new blank section with no editor is a dead end.
  setTimeout(()=>openWbSection(id), 60);
}
function _wbDeleteSection(id){
  const w=_wbSite();
  const name=(w.custom[id]||{}).name||'this section';
  _confirmDeleteDialog({title:'Delete section', question:'Delete this section?', name:name, verb:'Delete',
    onConfirmJs:`_wbDeleteSectionDo('${id}')`});
}
function _wbDeleteSectionDo(id){
  closeModalDirect();
  const w=_wbSite();
  const label=(w.custom[id]||{}).name||'section';
  _undoableDelete(label, ()=>{
    delete w.custom[id];
    delete w.on[id];
    delete w.layout[id];
    if(w.images) delete w.images[id];
    // v126: and its blocks. An orphaned block list left behind would be resurrected if a
    // new custom section ever landed on the same key — _wbBlocks() only builds a fresh
    // list when there ISN'T one, so a stale list is indistinguishable from a real one.
    if(w.blocks) delete w.blocks[id];
    w.order=w.order.filter(k=>k!==id);
  }, 'website');
}
function _wbRemoveSection(key){
  const isCustom=_wbIsCustom(key);
  _wbConfirm(
    'Remove section?',
    isCustom ? 'This will delete the section and its content permanently.'
              : 'You can restore it later from "Add section".',
    'Remove', ()=>_wbRemoveSectionDo(key),
    'Keep', null
  );
}
function _wbRemoveSectionDo(key){
  _wbClosePanel();
  const w=_wbSite();
  if(_wbIsCustom(key)){
    delete w.custom[key];
    delete w.layout[key];
    if(w.images) delete w.images[key];
    if(w.blocks) delete w.blocks[key];
  } else {
    w.removed[key]=true;
  }
  delete w.on[key];
  w.order=w.order.filter(k=>k!==key);
  saveToStorage();
  navigate('website');
}
function _wbRestoreSection(key){
  const w=_wbSite();
  delete w.removed[key];
  w.on[key]=true;
  if(w.order.indexOf(key)<0){
    const r=w.order.indexOf('rsvp');
    if(r>=0) w.order.splice(r,0,key); else w.order.push(key);
  }
  saveToStorage();
  _wbClosePanel();
  navigate('website');
  setTimeout(()=>openWbSection(key), 60);
}
function _wbTurnOnSection(key){
  const w=_wbSite();
  w.on[key]=true;
  saveToStorage();
  _wbClosePanel();
  navigate('website');
}
function _wbCustomEdit(id, field, val){
  const c=_wbSite().custom[id];
  if(c){ c[field]=val; saveToStorage(); _wbLiveSoon(); }
}

// ── Per-section layout ──
// Rename the heading, add intro text, align, band background, hide the heading.
// Available on every section, built-in or custom.
function _wbLayoutHtml(key){
  // v125: Home renders as a <header>, and `wrap()` — the ONLY thing that applies heading,
  // intro, align, background and noHead — returns early on headers. So every control in
  // this block was INERT on Home: five inputs you could type into and nothing happened.
  //
  // It shipped in v120, which added a general Layout block to every section and never
  // noticed Home already had its own headline/message fields. Two editors for the same
  // thing, and the second one didn't work.
  //
  // The guard lives HERE rather than at the one call site, so the next person to add a
  // section editor cannot re-introduce it by copying the pattern.
  if(WB_NO_LAYOUT.indexOf(key)>=0) return '';
  const l=_wbLayout(key);
  const m=_wbMeta(key)||{};
  const t=_wbSite().theme;
  return `<div id="wb-lay-${key}" class="wb-lay" style="margin-top:10px">
    <div class="wb-slot-lbl" style="margin-bottom:9px">Layout</div>
    <div class="form-group" style="margin-bottom:9px">
      <label class="form-label">Heading</label>
      <input class="form-input" value="${_escHtml(l.heading||'')}" placeholder="${_escHtml(m.name||'')}"
             oninput="_wbLaySet('${key}','heading',this.value)" style="font-size:12.5px"/>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:9px">
      ${t.alignGlobal!==false?'':`<div>
        <div class="wb-slot-lbl" style="margin-bottom:5px">Heading and intro</div>
        <span class="inv-seg">
          <button type="button" class="${l.align==='left'?'active':''}" onclick="_wbLaySet('${key}','align','left')">Left</button>
          <button type="button" class="${l.align==='center'?'active':''}" onclick="_wbLaySet('${key}','align','center')">Centre</button>
        </span>
      </div>
      ${_wbHasBody(key)?`<div>
        <div class="wb-slot-lbl" style="margin-bottom:5px">${_wbIsProse(key)?'Body text':'Rows'}</div>
        <span class="inv-seg">
          <button type="button" class="${l.body==='left'?'active':''}" onclick="_wbLaySet('${key}','body','left')">Left</button>
          <button type="button" class="${l.body==='center'?'active':''}" onclick="_wbLaySet('${key}','body','center')">Centre</button>
          ${_wbIsProse(key)?`<button type="button" class="${l.body==='justify'?'active':''}" onclick="_wbLaySet('${key}','body','justify')">Justify</button>`:''}
        </span>
      </div>`:''}
      ${key==='gallery'?`<div>
        <div class="wb-slot-lbl" style="margin-bottom:5px">Photo grid</div>
        <span class="inv-seg">
          <button type="button" class="${(!l.grid||l.grid==='left')?'active':''}" onclick="_wbLaySet('gallery','grid','left')">Left</button>
          <button type="button" class="${l.grid==='center'?'active':''}" onclick="_wbLaySet('gallery','grid','center')">Centre</button>
          <button type="button" class="${l.grid==='rows'?'active':''}" onclick="_wbLaySet('gallery','grid','rows')">Rows</button>
        </span>
      </div>`:''}`}
      ${t.globalWidth!==false?'':`<div>
        ${(()=>{const bv=(!l.bg||l.bg==='page')?0:(l.bg==='band'?100:Math.min(100,Math.max(0,Number(l.bg)||0)));const lbl=bv>=100?'Band':bv>0?'Wide page':'Page';return `<div id="wb-bg-lbl-${key}" class="wb-slot-lbl" style="margin-bottom:5px">Width · ${lbl}</div>
        <input type="range" min="0" max="100" step="10" value="${bv}" oninput="_wbBg('${key}',this.value)" style="width:100%;accent-color:var(--gold)"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px"><span>Page</span><span>Band</span></div>`;})()}
      </div>`}
    </div>
  </div>`;
}
function _wbLaySet(key, field, val){
  // v126: `noHead` is GONE. The heading is hidden by its block's eye, like every other
  // block. The toggle that wrote this field has been removed — leaving the setter behind
  // would let a stale onclick somewhere quietly write a field that nothing reads, which
  // is how a control becomes a lie (v119, v122, v125). Refuse it explicitly.
  if(field==='noHead') return;
  const l=_wbLayout(key);
  if(l[field]===val) return;          // no-op: don't repaint a node mid-click
  const wasEmptyIntro = (field==='intro') && !String(l.intro||'').trim();
  l[field]=val;
  saveToStorage();
  // v149: text fields (heading, intro) patch the live iframe IMMEDIATELY so typing feels
  // instant, instead of waiting out the 400ms debounce and looking like nothing happened.
  // The debounced full reload still follows as the source of truth (align/bg/block moves).
  // Two cases can't be a pure text-patch and must fall back to an immediate reload:
  //   - the very first intro character (the <p class="intro"> element doesn't exist yet —
  //     the block is created on the next _wbBlocks read), and
  //   - a heading cleared to '' (the <h2> element must vanish, not just go empty).
  const headCleared = (field==='heading' && !val);
  let patched=false;
  if((field==='heading' || field==='intro') && !headCleared){
    if(!(field==='intro' && wasEmptyIntro)){    // first-ever intro char needs the reload
      patched=_wbLivePatchText(key, field);
    }
  }
  if((field==='intro' && wasEmptyIntro) || headCleared){
    _wbLivePaint();                              // immediate reload: element appears/vanishes
  } else {
    _wbLiveSoon();                               // debounced reload as the source of truth
  }
  // Only the segmented buttons need a repaint (to move the .active pill). Text inputs
  // must NOT repaint — it would steal focus mid-type.
  if(field==='align'||field==='bg'||field==='body'||field==='grid'){
    const box=document.getElementById('wb-lay-'+key);
    if(box) box.outerHTML=_wbLayoutHtml(key);
  }
}
// Section width/band slider. Updates l.bg in place and schedules a debounced reload.
// Does NOT call _wbLaySet so the panel isn't re-rendered mid-drag (which would kill the slider).
function _wbBg(key, v){
  const n=Math.round(Math.min(100,Math.max(0,+v)));
  const l=_wbLayout(key);
  const s=String(n);
  l.bg=s;
  saveToStorage();
  const lbl=document.getElementById('wb-bg-lbl-'+key);
  if(lbl) lbl.textContent='Width · '+(n>=100?'Band':n>0?'Wide page':'Page');
  _wbLiveSoon();
}
// Patch the live iframe's heading or intro text in place, with no reload — so typing shows
// up immediately. Returns true if it found and updated the node, false if it couldn't (the
// caller then leans on the debounced reload). Mirrors the render exactly: heading uses
// _wbHeading (default-aware), intro clears to '' when empty (wrap() prints nothing then).
function _wbLivePatchText(key, field){
  const f=document.getElementById('wb-live');
  const d=f&&f.contentDocument;
  if(!d) return false;
  const sec=d.getElementById(key);
  if(!sec) return false;
  if(field==='heading'){
    const h=sec.querySelector('h2');
    if(!h) return false;
    h.textContent=_wbHeading(key);
    return true;
  }
  if(field==='intro'){
    const p=sec.querySelector('p.intro');
    if(!p) return false;                         // element not there yet → reload path
    p.textContent=String((_wbSite().layout[key]||{}).intro||'');
    return true;
  }
  return false;
}

// ── Custom section editor ──
function openWbCustom(id){
  const c=_wbSite().custom[id]; if(!c) return;
  // v126: the Text field is GONE from here. A custom section's prose now lives in its
  // TEXT BLOCKS, and `custom[id].body` is migrated into the first one. Leaving the
  // textarea would be two editors writing one field — which is precisely how Home ended
  // up with five controls that did nothing (v125). One field, one editor.
  _wbPanel(c.name||'Section', `<div style="display:flex;flex-direction:column;gap:0">
      <div style="padding:14px 16px 0">
        <label style="display:block;margin-bottom:14px">
          <span style="font-size:12px;font-weight:600;color:var(--label);display:block;margin-bottom:4px">Section name</span>
          <input type="text" value="${_esc(c.name||'')}" oninput="_wbCustomEdit('${id}','name',this.value)"
            style="display:block;width:100%;padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;background:var(--surface);color:var(--fg);font-size:14px;box-sizing:border-box;outline:none">
        </label>
      </div>
      ${_wbLayoutHtml(id)}
      ${_wbBlocksHtml(id)}
    </div>`,
    `<button class="btn btn-danger" onclick="_wbDeleteSection('${id}')" style="margin-right:auto">Delete</button>
     <button class="btn btn-outline" onclick="_wbSectionCancel()">Cancel</button>
     <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
}

// ── Hero ──
function openWbHero(){
  _wbPanel('Hero image', _wbHeroBody(),
    `<button class="btn btn-outline" style="margin-right:auto" onclick="_wbSectionCancel()">Cancel</button>
     <button class="btn btn-primary" onclick="_wbSectionSave()">Save</button>`);
}
function _wbHeroBody(){
  const h=_wbSite().hero;
  const has=h.mediaId && !_mediaMissing(h.mediaId);
  return `<div id="wb-hero-body">
    <div style="font-size:12.5px;color:var(--muted);line-height:1.55;margin-bottom:13px">A photo behind your names on the Home section.</div>
    ${has?`<div id="wb-hero-frame" class="wb-hero-frame"
        onmousedown="_wbHeroPickStart(event)" ontouchstart="_wbHeroPickStart(event)">
        <img id="wb-hero-img" src="${_mediaUrl(h.mediaId)}" alt=""
             style="${_wbHeroImgCss(h)}"/>
        <span id="wb-hero-pin" class="wb-hero-pin" style="left:${_wbHeroPct(h.pos,0)}%;top:${_wbHeroPct(h.pos,1)}%"></span>
        <button type="button" class="wb-tile-x" style="top:6px;right:6px;width:20px;height:20px;z-index:5" onclick="event.stopPropagation();_wbHeroSet('mediaId','')">✕</button>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10px;margin:-4px 0 12px">
        <div class="wb-blk-hint" style="flex:1">Drag the photo to choose which part stays in view.</div>
        <button type="button" class="wb-blk-addbtn" style="flex-shrink:0" onclick="_wbHeroCentre()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>Centre</button>
      </div>`
      :`<button type="button" class="wb-tile-add" style="width:100%;aspect-ratio:auto;height:64px;margin-bottom:12px;gap:7px" onclick="_wbHeroAdd()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span style="font-size:12px">Choose a photo</span>
      </button>`}
    ${has?`
      <div class="wb-slot-lbl" style="margin-bottom:6px">Style</div>
      <span class="inv-seg" style="margin-bottom:13px">
        <button type="button" class="${h.style==='over'?'active':''}" onclick="_wbHeroSet('style','over')">Names over photo</button>
        <button type="button" class="${h.style==='below'?'active':''}" onclick="_wbHeroSet('style','below')">Photo below names</button>
      </span>
      ${h.style==='over'?`
        <div class="wb-slot-lbl" style="margin-bottom:6px">Height</div>
        <span class="inv-seg" style="margin-bottom:13px">
          <button type="button" class="${h.height==='short'?'active':''}" onclick="_wbHeroSet('height','short')">Short</button>
          <button type="button" class="${h.height==='tall'?'active':''}" onclick="_wbHeroSet('height','tall')">Tall</button>
          <button type="button" class="${h.height==='full'?'active':''}" onclick="_wbHeroSet('height','full')">Full</button>
        </span>
        <div class="wb-slot-lbl" id="wb-hero-zoom-lbl" style="margin-bottom:6px">Zoom · ${h.zoom}%</div>
        <input type="range" min="50" max="250" step="1" value="${h.zoom}" oninput="_wbHeroZoom(this.value)"
               style="width:100%;accent-color:var(--gold)"/>
        <div id="wb-hero-zoom-note" class="wb-blk-hint" style="margin:6px 0 13px">${_wbHeroZoomNote(h.zoom)}</div>

        <div class="wb-slot-lbl" id="wb-hero-scrim-lbl" style="margin-bottom:6px">Darken · ${h.scrim}%</div>
        <input type="range" min="0" max="100" value="${h.scrim}" oninput="_wbHeroScrim(this.value)"
               style="width:100%;accent-color:var(--gold)"/>
        <div class="wb-slot-lbl" style="margin:13px 0 6px">Names</div>
        <span class="inv-seg">
          <button type="button" class="${h.ink==='light'?'active':''}" onclick="_wbHeroSet('ink','light')">Light</button>
          <button type="button" class="${h.ink==='dark'?'active':''}" onclick="_wbHeroSet('ink','dark')">Dark</button>
        </span>
        <div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5">A photo behind text is the classic way to make a heading unreadable. Darken the photo, or switch the names to dark — whichever your photo wants.</div>

        <div class="wb-slot-lbl" style="margin:15px 0 7px">Show on the photo</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label class="tl-pub-row" for="wb-hero-names" style="padding:9px 10px">
            <span><span class="tl-pub-title">Your names</span></span>
            <span class="toggle-switch" style="transform:scale(.72);transform-origin:right center">
              <input type="checkbox" id="wb-hero-names" ${h.showNames!==false?'checked':''} onchange="_wbHeroSet('showNames',this.checked)"/>
              <span class="toggle-track"></span>
            </span>
          </label>
          <label class="tl-pub-row" for="wb-hero-date" style="padding:9px 10px">
            <span><span class="tl-pub-title">The date</span></span>
            <span class="toggle-switch" style="transform:scale(.72);transform-origin:right center">
              <input type="checkbox" id="wb-hero-date" ${h.showDate!==false?'checked':''} onchange="_wbHeroSet('showDate',this.checked)"/>
              <span class="toggle-track"></span>
            </span>
          </label>
          <label class="tl-pub-row" for="wb-hero-ics" style="padding:9px 10px">
            <span><span class="tl-pub-title">Save the date button</span></span>
            <span class="toggle-switch" style="transform:scale(.72);transform-origin:right center">
              <input type="checkbox" id="wb-hero-ics" ${h.showIcs!==false?'checked':''} onchange="_wbHeroSet('showIcs',this.checked)"/>
              <span class="toggle-track"></span>
            </span>
          </label>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5">Turn these off if your photo already has them — no need to print them twice.</div>
      `:''}
    `:''}
  </div>`;
}
function _wbHeroRepaint(){
  const b=document.getElementById('wb-hero-body');
  if(b) b.outerHTML=_wbHeroBody();
  _wbLiveSoon();
}
// The editor's preview must obey EXACTLY the rules the guest site obeys, or it is a
// preview of a different photo. Both call this. One function, one truth — and when the
// hero's rendering changes, there is one place to change it, not two that drift.
function _wbHeroImgCss(h){
  // Zoom only applies to `over` — a photo BELOW the names has no frame to be zoomed
  // within, and the guest site renders it as a plain 3/2 cover crop. Applying the zoom
  // here would preview a photo the guest will never see. The focal point applies to BOTH:
  // .hero-below is object-fit:cover in a fixed box, so object-position genuinely chooses
  // its crop.
  const zoom = h.style==='over' ? Math.max(50,Math.min(250,Number(h.zoom)||100)) : 100;
  const pos=h.pos||'50% 50%';

  // ⚠️ THE ZOOM IS ANCHORED TO `contain`. 100% = THE WHOLE PHOTO, nothing cropped.
  //
  // It was anchored to `cover` (v130) so that 100% could mean "fills the frame" — a tidy
  // label. But cover for a SQUARE photo in a wide frame is enormous: it throws away more
  // than half the picture. So HALF of cover was still too big, and Mandy's photo was still
  // cropping at 50%. The bottom half of the slider was unusable, to protect a label.
  //
  // Anchored to contain, the number means something true, and the arithmetic collapses:
  //     object-fit:contain   the browser fits it — it needs no numbers from us
  //     transform:scale(z)   z is the slider. A constant.
  // Neither depends on the photo's shape or the frame's, so THIS IS STATIC CSS. The runtime
  // fit, the data-zoom attribute, the load and resize handlers — all deleted. They existed
  // ONLY to convert between the two anchors, and the right anchor has nothing to convert.
  //
  // transform-origin tracks the focal point. scale() grows the image AWAY from its origin,
  // so an origin stuck at centre would drift the very part of the photo the focal point was
  // chosen to keep. Origin and object-position are the same point, said twice.
  return `width:100%;height:130px;display:block;object-fit:contain;object-position:${pos};`
       + `transform:scale(${zoom/100});transform-origin:${pos}`;
}
// Pull the x or y percentage out of an object-position string. Returns 50 for anything it
// cannot read, rather than NaN — a NaN here would put the pin at `leftNaN%` and CSS would
// silently drop the rule, leaving the pin stuck in the corner with no error anywhere.
function _wbHeroPct(pos, ix){
  const m=String(pos||'').match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
  if(!m) return 50;
  const v=Number(ix===0?m[1]:m[2]);
  return isFinite(v)?Math.max(0,Math.min(100,v)):50;
}
function _wbHeroZoomNote(z){
  z=Number(z)||100;
  // The number means something TRUE now: 100 is the whole photo. Where it fills the frame
  // depends on the photo's shape, and there is no honest way to name that as a percentage
  // here — so it isn't named. Mandy drags until it looks right, which is what she was
  // going to do anyway.
  if(z>=250) return 'At the maximum. If it still doesn\'t fill the frame, the photo is a very different shape from the hero — a shorter hero, or a wider photo, will close the gap.';
  if(z>100) return 'Zoomed in. Keep going until it fills the frame — and past that, it crops.';
  if(z===100) return 'The whole photo, with your band colour around it. Zoom in to fill the frame.';
  return 'Smaller than the whole photo, with more of your band colour around it.';
}

// Put the focal point back in the middle. The ZOOM IS KEPT — a "reset everything" button
// would undo the crop level too, and after dragging you usually want to re-frame, not
// start over. There is no face detection here and none is implied: this centres, it does
// not "find" anything, and the label says Centre for exactly that reason.
function _wbHeroCentre(){
  const h=_wbSite().hero;
  if(h.pos==='50% 50%') return;      // already centred — don't repaint for nothing
  h.pos='50% 50%';
  saveToStorage();
  _wbHeroPaintFrame();
  _wbLiveSoon();
}

// Repaint just the picker's photo and pin. Shared by the drag, the slider and Centre —
// three callers that must not each have their own idea of what the frame looks like.
function _wbHeroPaintFrame(){
  const h=_wbSite().hero;
  const img=document.getElementById('wb-hero-img');
  // The style string is now complete on its own — no load handler, no natural-size probe,
  // nothing to wait for.
  if(img) img.setAttribute('style', _wbHeroImgCss(h));
  const pin=document.getElementById('wb-hero-pin');
  if(pin){ pin.style.left=_wbHeroPct(h.pos,0)+'%'; pin.style.top=_wbHeroPct(h.pos,1)+'%'; }
}

// The slider fires continuously. Update state and BOTH previews live, but do NOT rebuild
// the modal — that would tear down the slider mid-drag. Same rule as the scrim (v121).
function _wbHeroZoom(v){
  const h=_wbSite().hero;
  h.zoom=Math.max(50,Math.min(250,Number(v)||100));
  saveToStorage();
  const lbl=document.getElementById('wb-hero-zoom-lbl');
  if(lbl) lbl.textContent='Zoom · '+h.zoom+'%';
  const note=document.getElementById('wb-hero-zoom-note');
  if(note) note.innerHTML=_wbHeroZoomNote(h.zoom);
  _wbHeroPaintFrame();
  _wbLiveSoon();
}

// ── The focal point. Drag anywhere on the preview.
//
// It writes an `object-position` string, which is what hero.pos has ALWAYS been — wired
// and rendered since v125 with no UI to set it. Nothing downstream changes.
let _wbHeroDrag=false;
function _wbHeroPickStart(e){
  _wbHeroDrag=true;
  _wbHeroPickMove(e);
  if(e.cancelable) e.preventDefault();
}
function _wbHeroPickMove(e){
  if(!_wbHeroDrag) return;
  const box=document.getElementById('wb-hero-frame');
  if(!box) return;
  const r=box.getBoundingClientRect();
  const t=(e.touches&&e.touches[0])?e.touches[0]:e;
  const x=Math.max(0,Math.min(100, Math.round((t.clientX-r.left)/r.width*100)));
  const y=Math.max(0,Math.min(100, Math.round((t.clientY-r.top )/r.height*100)));
  const h=_wbSite().hero;
  h.pos=x+'% '+y+'%';
  _wbHeroPaintFrame();
  _wbLiveSoon();
  if(e.cancelable) e.preventDefault();
}
function _wbHeroPickEnd(){
  if(!_wbHeroDrag) return;
  _wbHeroDrag=false;
  saveToStorage();   // one write at the END of the drag, not one per pixel
}
// Bound to the WINDOW, not the frame: a drag that leaves the box must keep tracking, and
// must end when the mouse comes up ANYWHERE — otherwise releasing outside the preview
// leaves the drag latched on and the next stray mousemove yanks the focal point.
window.addEventListener('mousemove', _wbHeroPickMove);
window.addEventListener('mouseup',   _wbHeroPickEnd);
window.addEventListener('touchmove', _wbHeroPickMove, {passive:false});
window.addEventListener('touchend',  _wbHeroPickEnd);

function _wbHeroSet(field, val){
  const h=_wbSite().hero;
  if(h[field]===val) return;
  h[field]=val;
  saveToStorage();
  _wbHeroRepaint();
}
// The slider fires continuously — update state + preview live, but don't rebuild the
// modal on every pixel of drag (it would kill the slider mid-drag).
function _wbHeroScrim(v){
  _wbSite().hero.scrim=Number(v)||0;
  saveToStorage();
  // By id, not by counting .wb-slot-lbl siblings — v121 added a third label ("Names") and
  // the old heads[1] index would have quietly started pointing at the wrong element the
  // next time anything was inserted above it.
  const lbl=document.getElementById('wb-hero-scrim-lbl');
  if(lbl) lbl.textContent='Darken · '+_wbSite().hero.scrim+'%';
  _wbLiveSoon();
}
function _wbHeroAdd(){
  openConfirm2('Choose a photo',
    `<div style="display:flex;flex-direction:column;gap:8px">
      <button type="button" class="btn btn-outline" onclick="_closeConfirm2Direct();_wbHeroFromInspo()" style="display:flex;align-items:center;justify-content:flex-start;gap:9px;padding:12px 14px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span style="text-align:left">From Inspiration</span>
      </button>
      <button type="button" class="btn btn-outline" onclick="_closeConfirm2Direct();document.getElementById('wb-hero-up').click()" style="display:flex;align-items:center;justify-content:flex-start;gap:9px;padding:12px 14px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span style="text-align:left">Upload</span>
      </button>
      <input type="file" accept="image/*" id="wb-hero-up" style="display:none" onchange="_wbHeroUpload(event)"/>
    </div>`,
    `<button class="btn btn-outline" onclick="_confirm2CloseX()">Cancel</button>`);
}
function _wbHeroUpload(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async ev=>{
    const compressed=await compressImage(ev.target.result);
    const id=await _mediaPut(compressed, file.name, 'image/jpeg');
    _wbSite().hero.mediaId=id;
    saveToStorage();
    _wbHeroRepaint();
  };
  reader.readAsDataURL(file);
  e.target.value='';
}
function _wbHeroFromInspo(){
  const items=(STATE.inspo&&STATE.inspo.items?STATE.inspo.items:[]).filter(i=>i.image && !_mediaMissing(i.image));
  if(!items.length){
    openConfirm2('From Inspiration', `<div style="font-size:13px;color:var(--muted);line-height:1.6">You have no images in Inspiration yet. Add some there, or upload one here.</div>`,
      `<button class="btn btn-outline" onclick="_confirm2CloseX()">Close</button>`);
    return;
  }
  openConfirm2('From Inspiration',
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:7px;max-height:340px;overflow-y:auto">
      ${items.map(i=>`<button type="button" onclick="_wbHeroPick('${i.image}')" style="padding:0;border:3px solid transparent;border-radius:8px;overflow:hidden;cursor:pointer;aspect-ratio:1;background:var(--surface)">
        <img src="${_mediaUrl(i.image)}" alt="${_escHtml(i.title||'')}" style="width:100%;height:100%;object-fit:cover;display:block"/>
      </button>`).join('')}
    </div>`,
    `<button class="btn btn-outline" onclick="_confirm2CloseX()">Cancel</button>`);
}
function _wbHeroPick(mediaId){
  _wbSite().hero.mediaId=mediaId;
  saveToStorage();
  _closeConfirm2Direct();
  _wbHeroRepaint();
}

// ── Section images ──
// Two slots per section: 'top' (under the heading) and 'bottom' (below the text).
// Each holds media IDS and a layout. An upload here goes through the SAME
// compressImage -> _mediaPut chain Inspiration uses, so there is one image store and the
// builder holds only pointers into it. Never put bytes in STATE.

// ── The attribution crest, for the GUEST SITE footer only.
//
// These are NOT the app's LOGO_LIGHT / LOGO_DARK. Those are ~906px (141KB / 98KB of
// base64) and every downloaded guest site would carry one inlined — a permanent tax on a
// file that has to travel. These are the same mark at 128px (11.6KB / 6.2KB), which is 2x
// the size it is ever rendered at, so it stays sharp on a retina phone and costs ~8% of
// what the full crest would.
//
// Two variants because the guest site has EIGHT presets and one of them (Noir) is dark.
// A single crest would be invisible on one theme or the other. The choice is made by the
// luminance of the couple's own page colour — the same _wbInk() logic the site already
// uses to pick black-or-white text on the accent.
const WB_CREST_LIGHT = "data:image/png;base64,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";
const WB_CREST_DARK  = "data:image/png;base64,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";

// ═══════════════════════════════════════════════════════════════════════════
// THE SECTION COMPOSER (v126)
//
// A section used to be a FIXED template:
//     heading -> intro -> [images:top] -> content -> [images:bottom]
// Two image positions, hardcoded, and the content one indivisible blob. You could not
// put a photo ABOVE the heading, or BETWEEN two paragraphs.
//
// A section is now a LIST OF BLOCKS. `STATE.website.blocks[key]` is an ordered array and
// the renderer walks it. `STATE.website.images[key].top/bottom` is RETIRED — migrated
// once, on first read.
//
//   {type:'head'}   the heading. PINNED above every non-image block: images may precede
//                   it (that is the whole point — a banner photo above the heading),
//                   nothing else may. Cannot be deleted; can be hidden.
//   {type:'intro'}  the intro line. Draggable, hideable, deletable.
//   {type:'body'}   the section's OWN content — the timetable, the details rows, the
//                   gallery. Draggable, hideable, NOT deletable: it IS the section.
//                   Custom sections have none.
//   {type:'text'}   a run of prose. CUSTOM SECTIONS ONLY — they own their words.
//   {type:'img'}    images. Many allowed, anywhere. {ids, layout, align, side}
//
// EVERY block has an eye. That includes the heading, whose eye REPLACES
// `layout[key].noHead` — one gesture for "hide", not two mechanisms for the same idea.
const WB_BLOCK_SIDES = ['full','left','right'];

// Home renders as a <header> and is composed entirely differently — hero, names, date.
// It gets no blocks, for the same reason it gets no Layout block (v125): a control that
// cannot reach its target is worse than a missing one.
const WB_NO_BLOCKS = ['home'];
function _wbHasBlocks(key){ return WB_NO_BLOCKS.indexOf(key)<0; }

// A custom section's content IS its text blocks — it owns its prose, so it can have many.
// A built-in section's content is read from the planner and is one indivisible thing:
// Schedule reads STATE.timeline, and you cannot put a photo halfway through a timetable.
// This is the whole distinction, and it is a claim about what the content IS.
function _wbWantsBody(key){ return _wbHasBlocks(key) && !_wbIsCustom(key); }
function _wbWantsText(key){ return _wbIsCustom(key); }

// The body block is named after what it actually renders. "Body" tells you nothing;
// "The timetable" tells you everything, and tells you why it has no ✕.
const WB_BODY_LABEL = {
  details:'The details', schedule:'The timetable', gallery:'The photos',
  wishingwell:'How to give', countdown:'The countdown', accommodation:'The places',
  faq:'The questions'
};
function _wbBodyLabel(key){ return WB_BODY_LABEL[key] || 'The content'; }

function _wbBlockDefaults(b){
  if(!b.id) b.id=uid();
  if(b.type==='img'){
    if(!Array.isArray(b.ids)) b.ids=[];
    if(b.layout!=='grid' && b.layout!=='rows') b.layout='grid';
    if(b.align!=='stretch' && b.align!=='center') b.align='stretch';
    if(WB_BLOCK_SIDES.indexOf(b.side)<0) b.side='full';
  }
  if(b.type==='text' && typeof b.body!=='string') b.body='';
  // v133: links, buttons, video, divider.
  //
  // `links` and `btns` are the SAME SHAPE — a list of {label, url} — and are deliberately
  // separate TYPES rather than one type with a style flag, because they are different
  // things: a link is a reference, a button is a call to action. One is prose furniture,
  // the other is a control. Merging them would mean a single control that changes what the
  // thing IS, which is the distinction v129's button taxonomy note is about.
  if(b.type==='links' || b.type==='btns'){
    if(!Array.isArray(b.items)) b.items=[];
    b.items = b.items.filter(x=>x && typeof x==='object').map(x=>({
      id: x.id||uid(),
      label: typeof x.label==='string' ? x.label : '',
      url:   typeof x.url==='string'   ? x.url   : '',
      urlMode: ['custom','ics','rsvp'].includes(x.urlMode) ? x.urlMode : 'custom'
    }));
    if(b.type==='links' && b.layout!=='stack' && b.layout!=='rows') b.layout='stack';
  }
  if(b.type==='video'){
    if(typeof b.url!=='string') b.url='';
    if(typeof b.caption!=='string') b.caption='';
    if(typeof b.poster!=='string') b.poster='';   // a media id
    // 'link' is the DEFAULT, deliberately. An embedded player contacts YouTube from the
    // guest's browser (tracking), and shows a broken player if the video is ever removed.
    // The safe option is the one you get without choosing.
    if(b.mode!=='embed' && b.mode!=='link') b.mode='link';
  }
  if(b.type==='divider'){
    if(WB_DIVIDERS.indexOf(b.style)<0) b.style='line';
  }
  b.off = b.off===true;
  return b;
}

const WB_DIVIDERS = ['line','dots','leaf'];

// A YouTube or Vimeo id, pulled from whatever URL was pasted. Returns null for anything
// it cannot recognise — and the renderer then falls back to a plain link, rather than
// building an iframe around a guess.
function _wbVideoId(url){
  const u=String(url||'').trim();
  if(!u) return null;
  let m;
  m=/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(u);
  if(m) return {host:'youtube', id:m[1]};
  m=/vimeo\.com\/(?:video\/)?(\d{5,})/.exec(u);
  if(m) return {host:'vimeo', id:m[1]};
  return null;
}
function _wbVideoEmbedUrl(v){
  if(!v) return '';
  return v.host==='youtube'
    ? 'https://www.youtube-nocookie.com/embed/'+v.id   // -nocookie: the least-bad embed
    : 'https://player.vimeo.com/video/'+v.id;
}

// ── THE MIGRATION.
//
// A v125 site must open in v126 looking PIXEL-IDENTICAL. Nothing moves until Mandy drags
// it. A migration that changes what the guest already sees is a bug, not an upgrade.
//
// The old template was exactly: heading, intro, top images, content, bottom images. So
// the mapping is forced, and it is lossless. The old `images[key]` is deliberately LEFT
// IN STATE, untouched — a downgrade to v125 would otherwise lose every section photo,
// and a migration that burns the bridge behind it is a migration you cannot back out of.
function _wbBlocks(key){
  const w=_wbSite();
  if(!w.blocks || typeof w.blocks!=='object') w.blocks={};
  if(!_wbHasBlocks(key)) return [];

  if(!Array.isArray(w.blocks[key])){
    const arr=[];
    const lay = w.layout[key] || {};
    const old = (w.images||{})[key] || {};
    const slot=(sl)=>{
      const b=old[sl];
      if(!b || !Array.isArray(b.ids) || !b.ids.length) return null;
      return _wbBlockDefaults({type:'img', ids:b.ids.slice(),
        layout: b.layout==='rows'?'rows':'grid',
        align:  b.align==='center'?'center':'stretch',
        side:'full'});
    };
    // noHead becomes the head block's `off`, and is then DELETED from layout — so there
    // is exactly ONE thing in STATE that means "the heading is hidden". Leaving both
    // would be two sources of truth for one fact, and they would drift.
    arr.push(_wbBlockDefaults({type:'head', off: lay.noHead===true}));
    delete lay.noHead;
    // An intro block exists only if there IS an intro. An empty intro rendered nothing
    // before; an empty draggable block would be a new thing on screen that says nothing.
    // It can be added back from the menu.
    if(lay.intro) arr.push(_wbBlockDefaults({type:'intro'}));
    const top=slot('top'); if(top) arr.push(top);
    if(_wbWantsBody(key)) arr.push(_wbBlockDefaults({type:'body'}));
    // A custom section's prose arrives as ONE text block. Auto-splitting a four-paragraph
    // story into four blocks is a decision made on Mandy's behalf, and it is not
    // reversible by dragging. She splits it when she wants to.
    if(_wbIsCustom(key)){
      const body=String((w.custom[key]||{}).body||'');
      if(body.trim()) arr.push(_wbBlockDefaults({type:'text', body:body}));
    }
    const bot=slot('bottom'); if(bot) arr.push(bot);
    w.blocks[key]=arr;
  }

  const arr=w.blocks[key];
  arr.forEach(_wbBlockDefaults);

  // Invariants, RE-ESTABLISHED on every read rather than trusted. A hand-edited or
  // half-migrated STATE could carry two headings; a section that stopped being custom
  // could carry orphaned text blocks.
  const seen={};
  for(let i=arr.length-1;i>=0;i--){
    const t=arr[i].type;
    if(t==='head'||t==='intro'||t==='body'){ if(seen[t]) arr.splice(i,1); else seen[t]=1; }
  }
  if(!seen.head) arr.unshift(_wbBlockDefaults({type:'head'}));
  if(_wbWantsBody(key) && !seen.body) arr.push(_wbBlockDefaults({type:'body'}));
  if(!_wbWantsBody(key)) for(let i=arr.length-1;i>=0;i--) if(arr[i].type==='body') arr.splice(i,1);
  if(!_wbWantsText(key)) for(let i=arr.length-1;i>=0;i--) if(arr[i].type==='text') arr.splice(i,1);
  // v148: intro text lives on layout[key].intro, but it only RENDERS if an intro BLOCK exists
  // to carry it (wrap() reads the block, prints l.intro). The Gallery editor writes intro via
  // its Layout box but never surfaced the blocks panel — so a typed intro was saved and never
  // shown. Guarantee the block whenever there's intro text: type once, it appears. Clearing the
  // text leaves an empty block that renders nothing (wrap() returns '' for an empty intro), so
  // this never puts a blank line on the page.
  {
    const l=(w.layout&&w.layout[key])||{};
    if(l.intro && String(l.intro).trim() && !seen.intro){
      const hi=arr.findIndex(b=>b.type==='head');
      arr.splice(hi>=0?hi+1:0, 0, _wbBlockDefaults({type:'intro'}));
    }
  }
  _wbPinHead(arr);
  return arr;
}

// The heading sits above every non-image block. Enforced HERE, centrally, rather than at
// each drop site — a drop that would put the heading below the text it names is silently
// CORRECTED rather than rejected, because a drag that snaps back with no explanation
// reads as a broken drag, not as a rule.
function _wbPinHead(arr){
  const hi=arr.findIndex(b=>b.type==='head');
  if(hi<0) return;
  // Find the target WITHOUT removing the head first.
  //
  // This is the whole bug that the first version had: splicing the head out and THEN
  // scanning for leading images meant that an image which came AFTER the head slid into
  // index 0 and started counting as "leading". So `head, img, body` was silently
  // rewritten to `img, head, body` — a block the user never moved, moved. The head then
  // sat directly after a sided image and got pulled into its text column.
  //
  // Count the leading images IN PLACE, ignoring the head itself. Only images that are
  // genuinely before the head are leading.
  let f=0;
  while(f<arr.length && (arr[f].type==='img' && f<hi)) f++;
  if(f===hi) return;                       // already in position — do NOT touch the array
  const [h]=arr.splice(hi,1);
  arr.splice(f,0,h);
}

function _wbBlock(key,id){ return _wbBlocks(key).find(b=>b.id===id); }

// The head cannot be removed — a section with no heading is a wall of text. The body
// cannot be removed — it IS the section: delete Schedule's timetable and Schedule is an
// empty heading. Both HIDE instead, which is what the eye is for.
function _wbBlockDeletable(b){ return !!b && b.type!=='head' && b.type!=='body'; }

function _wbBlockOff(key,id){
  const b=_wbBlock(key,id); if(!b) return;
  b.off=!b.off;
  saveToStorage();
  _wbBlocksRepaint(key);
}
function _wbBlockDel(key,id){
  const b=_wbBlock(key,id);
  if(!b || !_wbBlockDeletable(b)) return;
  // Deleting an images block loses its list of ids. Hiding it does not. That difference
  // is invisible from the two icons alone — so it is said out loud, but only when there
  // is actually something to lose.
  if(b.type==='img' && b.ids.length){
    _confirmDeleteDialog({ title:'Remove this images block?',
      question:'The '+b.ids.length+' image'+(b.ids.length>1?'s':'')+' in it will be removed from this section. Hiding it instead keeps them.',
      name:'', verb:'Remove', onConfirmJs:"_wbBlockDelGo('"+key+"','"+id+"')" });
    return;
  }
  if(b.type==='text' && String(b.body||'').trim()){
    _confirmDeleteDialog({ title:'Remove this text block?',
      question:'The words in it will be deleted. Hiding it instead keeps them.',
      name:'', verb:'Remove', onConfirmJs:"_wbBlockDelGo('"+key+"','"+id+"')" });
    return;
  }
  if((b.type==='links'||b.type==='btns') && b.items.some(x=>String(x.label||'').trim()||String(x.url||'').trim())){
    const what = b.type==='btns' ? 'button' : 'link';
    const n = b.items.filter(x=>String(x.label||'').trim()||String(x.url||'').trim()).length;
    _confirmDeleteDialog({ title:'Remove this block?',
      question:'The '+n+' '+what+(n>1?'s':'')+' in it will be deleted. Hiding it instead keeps them.',
      name:'', verb:'Remove', onConfirmJs:"_wbBlockDelGo('"+key+"','"+id+"')" });
    return;
  }
  if(b.type==='video' && String(b.url||'').trim()){
    _confirmDeleteDialog({ title:'Remove this video?',
      question:'The address and its poster will be deleted. Hiding it instead keeps them.',
      name:'', verb:'Remove', onConfirmJs:"_wbBlockDelGo('"+key+"','"+id+"')" });
    return;
  }
  _wbBlockDelGo(key,id);
}
function _wbBlockDelGo(key,id){
  const arr=_wbBlocks(key);
  const i=arr.findIndex(x=>x.id===id);
  if(i>=0) arr.splice(i,1);
  saveToStorage();
  _wbBlocksRepaint(key);
}
function _wbBlockAdd(key,type){
  const arr=_wbBlocks(key);
  if(type==='intro' && arr.some(b=>b.type==='intro')) return;
  if(type==='text'  && !_wbWantsText(key)) return;
  arr.push(_wbBlockDefaults({type:type}));
  _wbPinHead(arr);
  saveToStorage();
  _wbBlocksRepaint(key);
}
// ── Links / Buttons item handlers.
//
// A row's fields write on every keystroke, so they must NOT repaint the list — that would
// tear down the input being typed into and drop the caret. Same rule as the text block.
function _wbLinkSet(key,bid,ix,field,val){
  const b=_wbBlock(key,bid);
  if(!b || !b.items[ix]) return;
  if(b.items[ix][field]===val) return;
  b.items[ix][field]=val;
  saveToStorage();
  _wbLiveSoon();
  // The header shows a count and the hints depend on whether a URL is missing — but
  // repainting mid-keystroke is not worth a live count. It refreshes on the next repaint.
}
function _wbLinkAdd(key,bid){
  const b=_wbBlock(key,bid); if(!b) return;
  b.items.push({id:uid(), label:'', url:''});
  saveToStorage();
  _wbBlocksRepaint(key);
}
function _wbLinkDel(key,bid,ix){
  const b=_wbBlock(key,bid); if(!b || !b.items[ix]) return;
  b.items.splice(ix,1);
  saveToStorage();
  _wbBlocksRepaint(key);
}
function _wbLinkModeSet(key,bid,ix,mode){
  const b=_wbBlock(key,bid); if(!b||!b.items[ix]) return;
  const item=b.items[ix];
  const prevMode=item.urlMode||'custom';
  const prevAutoLabel=prevMode==='ics'?'Save the date':prevMode==='rsvp'?'RSVP':'';
  item.urlMode=mode;
  if(mode!=='custom') item.url='';
  if(mode==='ics' && (!item.label||item.label===prevAutoLabel||item.label==='RSVP'))
    item.label='Save the date';
  else if(mode==='rsvp' && (!item.label||item.label===prevAutoLabel||item.label==='Save the date'))
    item.label='RSVP';
  saveToStorage();
  _wbBlocksRepaint(key);
}

// ── Video.
function _wbVideoSet(key,bid,field,val){
  const b=_wbBlock(key,bid); if(!b || b[field]===val) return;
  b[field]=val;
  saveToStorage();
  // url and caption are typed; mode and poster are clicked. Only repaint for the clicks.
  if(field==='url' || field==='caption') _wbLiveSoon();
  else _wbBlocksRepaint(key);
}
// The poster goes through the SAME chain every other image does: compress -> _mediaPut -> id.
// It is a media id like any other, which is why _wbAllSiteMedia() has to know about it.
function _wbVideoPoster(key,bid){
  openConfirm2('Poster image',
    `<div style="display:flex;flex-direction:column;gap:8px">
      <button type="button" class="btn btn-outline" onclick="_closeConfirm2Direct();_wbVidFromInspo('${key}','${bid}')" style="display:flex;align-items:center;justify-content:flex-start;gap:9px;padding:12px 14px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span style="text-align:left"><span style="display:block">From Inspiration</span><span style="display:block;font-size:11px;color:var(--muted);font-weight:400">Choose from your mood board</span></span>
      </button>
      <button type="button" class="btn btn-outline" onclick="_closeConfirm2Direct();document.getElementById('wb-vp-${bid}').click()" style="display:flex;align-items:center;justify-content:flex-start;gap:9px;padding:12px 14px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span style="text-align:left"><span style="display:block">Upload</span><span style="display:block;font-size:11px;color:var(--muted);font-weight:400">A new photo from this device</span></span>
      </button>
      <input type="file" accept="image/*" id="wb-vp-${bid}" style="display:none" onchange="_wbVidPosterUpload(event,'${key}','${bid}')"/>
    </div>`,
    `<button class="btn btn-outline" onclick="_confirm2CloseX()">Cancel</button>`);
}
function _wbVidPosterUpload(e,key,bid){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async ev=>{
    const compressed=await compressImage(ev.target.result);
    const id=await _mediaPut(compressed, file.name, 'image/jpeg');
    const b=_wbBlock(key,bid);
    if(b) b.poster=id;
    saveToStorage();
    _wbBlocksRepaint(key);
  };
  reader.readAsDataURL(file);
  e.target.value='';
}
function _wbVidFromInspo(key,bid){
  const items=(STATE.inspo&&STATE.inspo.items?STATE.inspo.items:[]).filter(i=>i.image && !_mediaMissing(i.image));
  if(!items.length){
    openConfirm2('From Inspiration',
      `<div style="font-size:13px;color:var(--muted);line-height:1.6">You have no images in Inspiration yet.</div>`,
      `<button class="btn btn-outline" onclick="_confirm2CloseX()">Close</button>`);
    return;
  }
  openConfirm2('Poster image',
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:7px;max-height:340px;overflow-y:auto">
      ${items.map(i=>`<button type="button" onclick="_wbVidPosterPick('${key}','${bid}','${i.image}')"
          style="padding:0;border:3px solid transparent;border-radius:8px;overflow:hidden;cursor:pointer;aspect-ratio:1;background:var(--surface)">
        <img src="${_mediaUrl(i.image)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"/>
      </button>`).join('')}
    </div>`,
    `<button class="btn btn-outline" onclick="_confirm2CloseX()">Cancel</button>`);
}
function _wbVidPosterPick(key,bid,mediaId){
  const b=_wbBlock(key,bid);
  if(b) b.poster=mediaId;
  saveToStorage();
  _closeConfirm2Direct();
  _wbBlocksRepaint(key);
}

function _wbBlockSet(key,id,field,val){
  const b=_wbBlock(key,id); if(!b || b[field]===val) return;
  b[field]=val;
  saveToStorage();
  // A text block's textarea writes on EVERY keystroke. Repainting the list would tear
  // down the very field being typed into and drop the caret mid-word — the same class of
  // bug as repainting #modal-body from a section editor (v117). So text writes repaint
  // the live preview only. Everything else repaints the list.
  if(field==='body') _wbLiveSoon(); else _wbBlocksRepaint(key);
}

// Does this section render any images? Used by the guest-site renderer to decide whether
// an otherwise-empty section is worth rendering at all.
function _wbHasImgs(key){
  return _wbBlocks(key).some(b=>b.type==='img' && !b.off && b.ids.length);
}

// ── The editor: one draggable block list per section.
function _wbBlocksHtml(key){
  return `<div id="wb-blocks-${key}" class="wb-blocks">${_wbBlockListHtml(key)}</div>`;
}
function _wbBlocksRepaint(key){
  const box=document.getElementById('wb-blocks-'+key);
  if(box) box.innerHTML=_wbBlockListHtml(key);
  _wbLiveSoon();
}
function _wbBlockListHtml(key){
  const arr=_wbBlocks(key);
  const hasIntro=arr.some(b=>b.type==='intro');
  // The block-type options, filtered to what this section allows.
  const opts=[['img','Images'],
    ..._wbWantsText(key)?[['text','Text']]:[],
    ['links','Links'],['btns','Buttons'],['video','Video'],['divider','Divider'],
    ...hasIntro?[]:[['intro','Text']]];
  const item=(t,label)=>`<button type="button" role="menuitem" class="wb-add-item" onclick="_wbAddPick('${key}','${t}')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${WB_BLK_ICON[t]||''}</svg>${label}</button>`;
  return arr.map(b=>_wbBlockHtml(key,b)).join('') + `<div class="wb-blk-add">
    <div class="wb-add-wrap">
      <button type="button" class="wb-add-trig" aria-haspopup="true" aria-expanded="false" onclick="_wbAddMenuToggle('${key}',event)">+ Add</button>
      <div class="wb-add-menu" id="wb-add-menu-${key}" role="menu" hidden>${opts.map(o=>item(o[0],o[1])).join('')}</div>
    </div>
  </div>`;
}
// ── "+ Add" popup menu. A single small trigger replaces the old row of chips.
// The menu is anchored under the trigger; it closes on outside-click, Escape, or a pick.
// Picking routes to the existing _wbBlockAdd — no parallel add logic.
function _wbAddMenuToggle(key,ev){
  if(ev) ev.stopPropagation();
  const menu=document.getElementById('wb-add-menu-'+key);
  if(!menu) return;
  const trig=menu.previousElementSibling;
  const open=!menu.hasAttribute('hidden');
  _wbAddMenuCloseAll();
  if(open) return;                       // it was open → toggle shut
  // Position using fixed coords so it escapes overflow:hidden parents
  if(trig){
    const r=trig.getBoundingClientRect();
    const MENU_H=220;
    const topBelow=r.bottom+5;
    const topAbove=r.top-MENU_H-5;
    menu.style.top=(topBelow+MENU_H>window.innerHeight&&topAbove>0?topAbove:topBelow)+'px';
    // align left edge, but keep on screen
    const leftEdge=Math.min(r.left, window.innerWidth - 190);
    menu.style.left=Math.max(8, leftEdge)+'px';
  }
  menu.removeAttribute('hidden');
  if(trig) trig.setAttribute('aria-expanded','true');
  // close on the next outside click / Escape
  setTimeout(()=>{
    document.addEventListener('click', _wbAddMenuOutside, {once:true});
    document.addEventListener('keydown', _wbAddMenuEsc);
  },0);
}
function _wbAddMenuCloseAll(){
  document.querySelectorAll('.wb-add-menu:not([hidden])').forEach(m=>{
    m.setAttribute('hidden','');
    m.style.top=''; m.style.left='';
    const t=m.previousElementSibling; if(t) t.setAttribute('aria-expanded','false');
  });
  document.removeEventListener('keydown', _wbAddMenuEsc);
}
function _wbAddMenuOutside(ev){
  if(ev.target.closest && ev.target.closest('.wb-add-wrap')) {
    // clicked inside an open menu/trigger that isn't a pick — keep listening
    document.addEventListener('click', _wbAddMenuOutside, {once:true});
    return;
  }
  _wbAddMenuCloseAll();
}
function _wbAddMenuEsc(ev){ if(ev.key==='Escape') _wbAddMenuCloseAll(); }
function _wbAddPick(key,type){
  _wbAddMenuCloseAll();
  _wbBlockAdd(key,type);
}

const WB_BLK_ICON = {
  links:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  btns:'<rect x="3" y="8" width="18" height="8" rx="4"/><line x1="8" y1="12" x2="16" y2="12"/>',
  video:'<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  divider:'<line x1="3" y1="12" x2="21" y2="12"/><circle cx="12" cy="12" r="2.6"/>',
  head:'<path d="M6 4v16M18 4v16M6 12h12"/>',
  intro:'<line x1="4" y1="7" x2="20" y2="7"/><line x1="7" y1="13" x2="17" y2="13"/>',
  text:'<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/>',
  img:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  body:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'
};

const WB_EYE_ON  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const WB_EYE_OFF = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A10.1 10.1 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9"/><path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

function _wbBlockHtml(key,b){
  const name = b.type==='head'  ? 'Heading'
             : b.type==='intro' ? 'Text'
             : b.type==='text'  ? 'Text'
             : b.type==='img'   ? ('Images'+(b.ids.length?' · '+b.ids.length:''))
             : b.type==='links' ? ('Links'+(b.items.length?' · '+b.items.length:''))
             : b.type==='btns'  ? ('Buttons'+(b.items.length?' · '+b.items.length:''))
             : b.type==='video' ? 'Video'
             : b.type==='divider'? 'Divider'
             : _wbBodyLabel(key);
  const pinned = b.type==='head';
  const meta=_wbMeta(key)||{};
  const src = (b.type==='body' && meta.src) ? `<span class="wb-blk-src">${_escHtml(meta.src)}</span>` : '';
  return `<div class="wb-blk${b.off?' off':''}${pinned?' pin':''}" data-bid="${b.id}"
      draggable="${pinned?'false':'true'}"
      ondragstart="_wbBlkDragStart(event,'${key}','${b.id}')"
      ondragover="_wbBlkDragOver(event)"
      ondrop="_wbBlkDrop(event,'${key}','${b.id}')"
      ondragend="_wbBlkDragEnd(event)">
    <div class="wb-blk-head">
      <span class="wb-blk-grip" title="${pinned?'The heading stays above the text':'Drag to reorder'}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="9" cy="19" r="1.6"/><circle cx="15" cy="5" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="15" cy="19" r="1.6"/></svg>
      </span>
      <span class="wb-blk-ico"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${WB_BLK_ICON[b.type]||''}</svg></span>
      <span class="wb-blk-name">${_escHtml(name)}</span>
      ${pinned?'<span class="wb-blk-pin">pinned</span>':''}
      ${src}
      <button type="button" class="wb-blk-eye${b.off?' on':''}" title="${b.off?'Show on the site':'Hide from the site'}" onclick="_wbBlockOff('${key}','${b.id}')">${b.off?WB_EYE_OFF:WB_EYE_ON}</button>
      ${_wbBlockDeletable(b)?`<button type="button" class="wb-blk-x" title="Remove this block" onclick="_wbBlockDel('${key}','${b.id}')">✕</button>`:''}
    </div>
    ${b.off?'':_wbBlockBody(key,b)}
  </div>`;
}

function _wbBlockBody(key,b){
  if(b.type==='intro'){
    const val=b.body!==undefined?b.body:((_wbLayout(key)||{}).intro||'');
    return `<div class="wb-blk-body">
      <textarea class="form-input" rows="2" placeholder="A short line under the heading…"
        oninput="_wbBlockSet('${key}','${b.id}','body',this.value)"
        style="font-size:12.5px;resize:vertical;line-height:1.55">${_escHtml(val)}</textarea>
    </div>`;
  }
  if(b.type==='text'){
    return `<div class="wb-blk-body">
      <textarea class="form-input" rows="4" placeholder="Write anything you'd like your guests to read…"
        oninput="_wbBlockSet('${key}','${b.id}','body',this.value)"
        style="font-size:12.5px;resize:vertical;line-height:1.55">${_escHtml(b.body||'')}</textarea>
      <div class="wb-blk-hint">Leave a blank line between paragraphs.</div>
    </div>`;
  }
  // ── Links and Buttons. One editor: they are the same SHAPE ({label,url}), even though
  // they are deliberately different TYPES.
  if(b.type==='links' || b.type==='btns'){
    const isBtn = b.type==='btns';
    const rows=b.items.map((x,ix)=>{
      if(!isBtn){
        return `<div class="wb-lk-row">
          <input class="form-input" value="${_escHtml(x.label)}" placeholder="Gift registry"
                 oninput="_wbLinkSet('${key}','${b.id}',${ix},'label',this.value)"/>
          <input class="form-input" value="${_escHtml(x.url)}" placeholder="example.com"
                 oninput="_wbLinkSet('${key}','${b.id}',${ix},'url',this.value)"/>
          <button type="button" class="wb-blk-x" title="Remove" onclick="_wbLinkDel('${key}','${b.id}',${ix})">✕</button>
        </div>`;
      }
      const um=x.urlMode||'custom';
      return `<div style="display:flex;flex-direction:column;gap:4px">
        <div class="wb-lk-row">
          <input class="form-input" value="${_escHtml(x.label)}" placeholder="Button name"
                 oninput="_wbLinkSet('${key}','${b.id}',${ix},'label',this.value)"/>
          <select class="form-input" style="height:32px;padding:0 8px;font-size:12px" onchange="_wbLinkModeSet('${key}','${b.id}',${ix},this.value)">
            <option value="custom"${um==='custom'?' selected':''}>Custom URL</option>
            <option value="ics"${um==='ics'?' selected':''}>Save the date</option>
            <option value="rsvp"${um==='rsvp'?' selected':''}>RSVP link</option>
          </select>
          <button type="button" class="wb-blk-x" title="Remove" onclick="_wbLinkDel('${key}','${b.id}',${ix})">✕</button>
        </div>
        ${um==='custom'?`<input class="form-input" value="${_escHtml(x.url)}" placeholder="https://…"
               oninput="_wbLinkSet('${key}','${b.id}',${ix},'url',this.value)"
               style="font-size:12px;height:32px;padding:0 8px"/>`:``}
      </div>`;
    }).join('');
    return `<div class="wb-blk-body">
      ${rows}
      <button type="button" class="wb-blk-addbtn" style="align-self:flex-start" onclick="_wbLinkAdd('${key}','${b.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add ${isBtn?'a button':'a link'}
      </button>
      ${!isBtn?`<div class="wb-blk-ctl">
        <span class="wb-slot-lbl">Layout</span>
        <span class="inv-seg">
          <button type="button" class="${b.layout==='stack'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','layout','stack')">Stacked</button>
          <button type="button" class="${b.layout==='rows'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','layout','rows')">Rows</button>
        </span>
      </div>`:`<div class="wb-blk-hint">Buttons use your <b>Button</b> colour and style, from the Theme — the same as Save the date.</div>
      <div class="wb-blk-ctl">
        <span class="wb-slot-lbl">Alignment</span>
        <span class="inv-seg">
          <button type="button" class="${(b.align||'center')==='left'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','align','left')">Left</button>
          <button type="button" class="${(b.align||'center')==='center'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','align','center')">Centre</button>
          <button type="button" class="${(b.align||'center')==='right'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','align','right')">Right</button>
        </span>
      </div>`}
      ${b.items.some(x=>String(x.label||'').trim() && (x.urlMode||'custom')==='custom' && !String(x.url||'').trim())
        ? `<div class="wb-blk-hint">A ${isBtn?'button':'link'} with no address ${isBtn?'is not shown at all':'shows as plain text, not a link that goes nowhere'}.</div>` : ''}
    </div>`;
  }

  // ── Video.
  if(b.type==='video'){
    const v=_wbVideoId(b.url);
    const bad = String(b.url||'').trim() && !v;
    const hasPoster = b.poster && !_mediaMissing(b.poster);
    return `<div class="wb-blk-body">
      <input class="form-input" value="${_escHtml(b.url)}" placeholder="youtube.com/watch?v=… or vimeo.com/…"
             oninput="_wbVideoSet('${key}','${b.id}','url',this.value)" style="font-size:12.5px"/>
      <input class="form-input" value="${_escHtml(b.caption)}" placeholder="Caption (optional)"
             oninput="_wbVideoSet('${key}','${b.id}','caption',this.value)" style="font-size:12.5px"/>
      <div class="wb-blk-ctl">
        <span class="wb-slot-lbl">Show as</span>
        <span class="inv-seg">
          <button type="button" class="${b.mode==='link'?'active':''}" onclick="_wbVideoSet('${key}','${b.id}','mode','link')">Poster + link</button>
          <button type="button" class="${b.mode==='embed'?'active':''}" onclick="_wbVideoSet('${key}','${b.id}','mode','embed')">Player</button>
        </span>
      </div>
      ${b.mode==='embed'
        ? `<div class="wb-blk-hint"><b>The player loads YouTube or Vimeo in your guest's browser.</b> They can be tracked by it, it needs a connection, and if the video is ever removed your guests see a broken player. <b>Poster + link</b> does none of that.</div>`
        : `<div class="wb-blk-ctl">
             <span class="wb-slot-lbl">Poster image</span>
             ${hasPoster
               ? `<span style="display:flex;gap:6px;align-items:center">
                    <img src="${_mediaUrl(b.poster)}" alt="" style="width:44px;height:26px;object-fit:cover;border-radius:4px;display:block"/>
                    <button type="button" class="wb-blk-x" title="Remove" onclick="_wbVideoSet('${key}','${b.id}','poster','')">✕</button>
                  </span>`
               : `<button type="button" class="wb-blk-addbtn" onclick="_wbVideoPoster('${key}','${b.id}')">Choose…</button>`}
           </div>
           <div class="wb-blk-hint">${hasPoster
              ? 'Tapping it opens the video in a new tab. Nothing is loaded from YouTube until they do.'
              : 'With no poster, this shows as a plain text link — not an empty box.'}</div>`}
      ${bad?`<div class="wb-blk-hint" style="color:var(--red)">That doesn't look like a YouTube or Vimeo address. It will still work as a link, but the player can't be built from it.</div>`:''}
    </div>`;
  }

  // ── Divider.
  if(b.type==='divider'){
    return `<div class="wb-blk-body">
      <div class="wb-blk-ctl">
        <span class="wb-slot-lbl">Style</span>
        <span class="inv-seg">
          ${WB_DIVIDERS.map(d=>`<button type="button" class="${b.style===d?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','style','${d}')">${d.charAt(0).toUpperCase()+d.slice(1)}</button>`).join('')}
        </span>
      </div>
    </div>`;
  }

  if(b.type!=='img') return '';

  const tiles=b.ids.map((id,ix)=>{
    if(_mediaMissing(id)){
      return `<div class="wb-tile wb-tile-gone">Image not saved
        <button type="button" class="wb-tile-x" title="Remove" onclick="_wbImgRemove('${key}','${b.id}',${ix})">✕</button></div>`;
    }
    return `<div class="wb-tile" draggable="true"
        ondragstart="_wbTileDragStart(event,'${key}','${b.id}',${ix})"
        ondragover="_wbTileDragOver(event)"
        ondrop="_wbTileDrop(event,'${key}','${b.id}',${ix})"
        ondragend="_wbTileDragEnd(event)">
      <img src="${_mediaUrl(id)}" alt=""/>
      <button type="button" class="wb-tile-x" title="Remove" onclick="_wbImgRemove('${key}','${b.id}',${ix})">✕</button>
    </div>`;
  }).join('');

  const has=b.ids.length>0;
  return `<div class="wb-blk-body">
    <div class="wb-tiles">
      ${tiles}
      <button type="button" class="wb-tile-add" title="Add an image" onclick="_wbImgAdd('${key}','${b.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
    ${!has?'':`
      <div class="wb-blk-ctl">
        <span class="wb-slot-lbl">Layout</span>
        <span class="inv-seg">
          <button type="button" class="${b.layout==='grid'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','layout','grid')">Grid</button>
          <button type="button" class="${b.layout==='rows'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','layout','rows')">Rows</button>
        </span>
      </div>
      <div class="wb-blk-ctl">
        <span class="wb-slot-lbl">Shape</span>
        <span class="inv-seg">
          ${Object.keys(WB_SHAPES).map(sh=>`<button type="button" class="${(b.shape||'rounded')===sh?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','shape','${sh}')">${WB_SHAPES[sh]}</button>`).join('')}
        </span>
      </div>
      ${(b.shape==='round' && b.layout==='rows')?`<div class="wb-blk-hint">Circle crops each photo to a square — the left and right edges of a wide photo won't be shown.</div>`:''}
      ${(b.shape==='original')?`<div class="wb-blk-hint">Original shows each photo at its natural proportions — no cropping. Landscape and portrait photos will have different heights.</div>`:''}
      ${(b.layout==='grid' && b.side==='full')?`
      <div class="wb-blk-ctl">
        <span class="wb-slot-lbl">Grid images</span>
        <span class="inv-seg">
          <button type="button" class="${b.align==='stretch'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','align','stretch')">Stretch</button>
          <button type="button" class="${b.align==='center'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','align','center')">Centre</button>
        </span>
      </div>`:''}
      <div class="wb-blk-ctl">
        <span class="wb-slot-lbl">Position</span>
        <span class="inv-seg">
          <button type="button" class="${b.side==='full'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','side','full')">Full</button>
          <button type="button" class="${b.side==='left'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','side','left')">Left</button>
          <button type="button" class="${b.side==='right'?'active':''}" onclick="_wbBlockSet('${key}','${b.id}','side','right')">Right</button>
        </span>
      </div>
      ${b.side==='full'?'':`<div class="wb-blk-hint">Whatever block comes next sits beside these images on a wide screen. <b>On a phone it stacks underneath</b> — below 700px, Left and Right both simply mean "above". Most guests will open this on a phone.</div>`}
    `}
  </div>`;
}

// ── Block drag.
//
// The head is not draggable (draggable="false"), and _wbPinHead() silently corrects any
// drop that would land a non-image block above it. Two guards, because the first is a
// hint to the browser and the second is the rule.
let _wbBlkDrag=null;
function _wbBlkDragStart(e,key,id){
  const b=_wbBlock(key,id);
  if(!b || b.type==='head'){ e.preventDefault(); return; }
  _wbBlkDrag={key,id};
  e.currentTarget.classList.add('wb-blk-drag');
  if(e.dataTransfer){ e.dataTransfer.effectAllowed='move'; try{ e.dataTransfer.setData('text/plain',id); }catch(_){} }
}
function _wbBlkDragOver(e){
  if(!_wbBlkDrag) return;
  e.preventDefault();
  document.querySelectorAll('.wb-blk-over').forEach(t=>t.classList.remove('wb-blk-over'));
  e.currentTarget.classList.add('wb-blk-over');
}
function _wbBlkDrop(e,key,id){
  e.preventDefault();
  const d=_wbBlkDrag;
  _wbBlkDrag=null;
  document.querySelectorAll('.wb-blk-over').forEach(t=>t.classList.remove('wb-blk-over'));
  if(!d || d.key!==key || d.id===id) return;
  const arr=_wbBlocks(key);
  const from=arr.findIndex(b=>b.id===d.id);
  const to  =arr.findIndex(b=>b.id===id);
  if(from<0 || to<0) return;
  const [moved]=arr.splice(from,1);
  arr.splice(to,0,moved);
  _wbPinHead(arr);
  saveToStorage();
  _wbBlocksRepaint(key);
}
function _wbBlkDragEnd(){
  _wbBlkDrag=null;
  document.querySelectorAll('.wb-blk-drag').forEach(t=>t.classList.remove('wb-blk-drag'));
  document.querySelectorAll('.wb-blk-over').forEach(t=>t.classList.remove('wb-blk-over'));
}

function _wbImgRemove(key,bid,ix){
  const b=_wbBlock(key,bid); if(!b || b.type!=='img') return;
  b.ids.splice(ix,1);
  saveToStorage();
  _wbBlocksRepaint(key);
}

// ── Tile drag: reorder images WITHIN one block.
//
// stopPropagation() matters here. A tile lives inside a block, and both are draggable —
// without it, picking up a tile would also pick up the block underneath it, and the drop
// would do two things at once.
let _wbTileDrag=null;
function _wbTileDragStart(e,key,bid,ix){
  _wbTileDrag={key,bid,ix};
  e.stopPropagation();
  e.currentTarget.classList.add('wb-tile-drag');
  if(e.dataTransfer){ e.dataTransfer.effectAllowed='move'; try{ e.dataTransfer.setData('text/plain',String(ix)); }catch(_){} }
}
function _wbTileDragOver(e){
  if(!_wbTileDrag) return;
  e.preventDefault();
  e.stopPropagation();
  document.querySelectorAll('.wb-tile-over').forEach(t=>t.classList.remove('wb-tile-over'));
  e.currentTarget.classList.add('wb-tile-over');
}
function _wbTileDrop(e,key,bid,ix){
  e.preventDefault();
  e.stopPropagation();
  const d=_wbTileDrag;
  _wbTileDrag=null;
  document.querySelectorAll('.wb-tile-over').forEach(t=>t.classList.remove('wb-tile-over'));
  // Only reorder within the same block. Dragging a tile between blocks would need a
  // different affordance and nobody asked for it.
  if(!d || d.key!==key || d.bid!==bid || d.ix===ix) return;
  const b=_wbBlock(key,bid); if(!b) return;
  const [moved]=b.ids.splice(d.ix,1);
  b.ids.splice(ix,0,moved);
  saveToStorage();
  _wbBlocksRepaint(key);
}
function _wbTileDragEnd(){
  _wbTileDrag=null;
  document.querySelectorAll('.wb-tile-drag').forEach(t=>t.classList.remove('wb-tile-drag'));
  document.querySelectorAll('.wb-tile-over').forEach(t=>t.classList.remove('wb-tile-over'));
}

// The + tile. Two sources, one destination: an id in this block.
function _wbImgAdd(key,bid){
  openConfirm2('Add an image',
    `<div style="display:flex;flex-direction:column;gap:8px">
      <button type="button" class="btn btn-outline" onclick="_closeConfirm2Direct();_wbImgFromInspo('${key}','${bid}')" style="display:flex;align-items:center;justify-content:flex-start;gap:9px;padding:12px 14px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span style="text-align:left"><span style="display:block">From Inspiration</span><span style="display:block;font-size:11px;color:var(--muted);font-weight:400">Choose from your mood board</span></span>
      </button>
      <button type="button" class="btn btn-outline" onclick="_closeConfirm2Direct();document.getElementById('wb-up-${bid}').click()" style="display:flex;align-items:center;justify-content:flex-start;gap:9px;padding:12px 14px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span style="text-align:left"><span style="display:block">Upload</span><span style="display:block;font-size:11px;color:var(--muted);font-weight:400">A new photo from this device</span></span>
      </button>
      <input type="file" accept="image/*" id="wb-up-${bid}" style="display:none" onchange="_wbImgUpload(event,'${key}','${bid}')"/>
    </div>`,
    `<button class="btn btn-outline" onclick="_confirm2CloseX()">Cancel</button>`);
}

// Upload. Same chain as Inspiration: compress -> _mediaPut -> store the ID.
// The image does NOT join Inspiration — that stays a mood board, not a dumping ground.
function _wbImgUpload(e,key,bid){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async ev=>{
    const compressed=await compressImage(ev.target.result);
    const id=await _mediaPut(compressed, file.name, 'image/jpeg');
    const b=_wbBlock(key,bid);
    if(b) b.ids.push(id);
    saveToStorage();
    _wbBlocksRepaint(key);
  };
  reader.readAsDataURL(file);
  e.target.value='';
}

// Pick from Inspiration. Same grid the gallery uses; multi-select, adds on close.
let _wbInspoPick = null;
function _wbImgFromInspo(key,bid){
  _wbInspoPick={key, bid, chosen:[]};
  openConfirm2('From Inspiration', _wbInspoBody(),
    `<button class="btn btn-outline" onclick="_confirm2CloseX()">Cancel</button>
     <button class="btn btn-primary" onclick="_wbInspoAdd()">Add</button>`);
}
function _wbInspoBody(){
  const items=(STATE.inspo&&STATE.inspo.items?STATE.inspo.items:[]).filter(i=>i.image && !_mediaMissing(i.image));
  if(!items.length){
    return `<div style="font-size:13px;color:var(--muted);line-height:1.6">You have no images in Inspiration yet. Add some there, or upload one straight into this section.</div>`;
  }
  const p=_wbInspoPick||{chosen:[]};
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:7px;max-height:340px;overflow-y:auto">
    ${items.map(i=>{
      const on=p.chosen.indexOf(i.image)>=0;
      return `<button type="button" onclick="_wbInspoToggle('${i.image}')" style="position:relative;padding:0;border:3px solid ${on?'var(--gold)':'transparent'};border-radius:8px;overflow:hidden;cursor:pointer;aspect-ratio:1;background:var(--surface)">
        <img src="${_mediaUrl(i.image)}" alt="${_escHtml(i.title||'')}" style="width:100%;height:100%;object-fit:cover;display:block"/>
        ${on?`<span style="position:absolute;top:4px;right:4px;width:17px;height:17px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px">✓</span>`:''}
      </button>`;
    }).join('')}
  </div>`;
}
function _wbInspoToggle(mediaId){
  if(!_wbInspoPick) return;
  const c=_wbInspoPick.chosen;
  const i=c.indexOf(mediaId);
  if(i>=0) c.splice(i,1); else c.push(mediaId);
  const box=document.getElementById('confirm2-body');
  if(box) box.innerHTML=_wbInspoBody();
}
function _wbInspoAdd(){
  const p=_wbInspoPick;
  if(p && p.chosen.length){
    const b=_wbBlock(p.key, p.bid);
    // The same inspo image can legitimately appear in two sections, but not twice in the
    // same block.
    if(b) p.chosen.forEach(id=>{ if(b.ids.indexOf(id)<0) b.ids.push(id); });
    saveToStorage();
    _wbBlocksRepaint(p.key);
  }
  _wbInspoPick=null;
  _closeConfirm2Direct();
}

// ── Preview ──
// The guest site is rendered into an <iframe> (as a blob: document — see _wbFrameLoad)
// so its CSS cannot leak into the app, and the app's cannot leak into it. Phone/Desktop
// just resizes the frame — the site inside is genuinely responsive, not a separate mock.
let _wbPreviewMode = 'phone';
function openWbPreview(){
  window.open(_wbSiteUrl(), '_blank');
}

// openModal() removes `modal-wide` from the box on EVERY open — it resets the classes so a
// previous modal's width can't leak into the next one. So the preview re-applies it after
// the call. Editing openModal() instead would change the width of every modal in the app
// to fix one of them.
//
// 780px, not 1100: a 1024px site then renders at about 0.75x — big enough to read and to
// judge, without a modal that swallows the screen. The phone renders at 1x, so the two are
// finally within sight of each other rather than one being half the scale of the other.
function _wbOpenPreviewModal(title, body, footer){
  openModal(title, body, footer);
  const box=document.getElementById('modal-box');
  if(box) box.classList.add('wb-pv-modal');
}
function _wbPreviewShell(){
  // The OUTER div centres; the INNER card (built in _wbPreviewPaint) hugs the frame. They
  // have to be two elements: a single element cannot both fill the modal (to centre) and
  // shrink to its content (to be snug).
  //
  // The switcher bar sits above the wrap on EVERY width, not just mobile — one layout to
  // maintain, and it reads as a control on the preview rather than an action in the footer.
  return `<div style="display:flex;justify-content:center;margin-bottom:12px">
      <span class="inv-seg">
        <button id="wb-pv-phone" class="${_wbPreviewMode==='phone'?'active':''}" onclick="_wbPreviewMode='phone';_wbPreviewPaint()">Phone</button>
        <button id="wb-pv-desk" class="${_wbPreviewMode==='desktop'?'active':''}" onclick="_wbPreviewMode='desktop';_wbPreviewPaint()">Desktop</button>
      </span>
    </div>
    <div id="wb-pv-wrap" style="display:flex;justify-content:center"></div>`;
}
function _wbPreviewPaint(){
  const wrap=document.getElementById('wb-pv-wrap');
  if(!wrap) return;
  const phone=_wbPreviewMode==='phone';
  const w=phone?390:1024;
  const h=phone?680:700;
  // Scale the desktop frame down to whatever the modal can actually give it. `clientWidth`
  // is read at paint time, not assumed — on a phone the wide modal is still only 96vw, and
  // a hardcoded scale would push the frame off the edge.
  const PAD=14;
  const avail=Math.max(200, wrap.clientWidth - PAD*2 - 2);
  const scale=Math.min(1, avail/w);
  const fw=Math.round(w*scale), fh=Math.round(h*scale);
  // The card is `width:max-content` so it hugs the frame — equal padding on all four
  // sides. Before, it was full-width and the side gaps were leftovers.
  wrap.innerHTML=`<div style="background:var(--surface);border-radius:10px;padding:${PAD}px;width:max-content;max-width:100%">
      <div style="width:${fw}px;height:${fh}px;overflow:hidden;border-radius:${phone?'18px':'8px'};border:1px solid var(--border);background:#fff">
        <iframe id="wb-pv-frame" style="width:${w}px;height:${h}px;border:0;transform:scale(${scale});transform-origin:top left;display:block" sandbox="allow-same-origin allow-scripts"></iframe>
      </div>
    </div>`;
  const f=document.getElementById('wb-pv-frame');
  if(f) _wbFrameLoad(f, 'pv', _wbBuildSite());
  const pb=document.getElementById('wb-pv-phone'), db=document.getElementById('wb-pv-desk');
  if(pb) pb.classList.toggle('active', phone);
  if(db) db.classList.toggle('active', !phone);
}

// ── The guest site itself ──
// One self-contained HTML document. Images are inlined as data URLs so the downloaded
// file works on any device — the same reasoning as the v114 export: a file full of
// blob: ids pointing at THIS browser's IndexedDB is worthless anywhere else.
function _wbBuildSite(forDownload){
  const w=_wbSite(), t=w.theme, e=STATE.event||{};
  const ink=_wbInk(t.accent);

  const sections=w.order.filter(k=>w.on[k] && !WB_LOCKED[k]);

  // Section images. Two slots, each with its own layout. Missing blobs are skipped
  // silently here rather than rendering a broken box on a page guests will see — the
  // builder already flags them in red where they can be fixed.
  // One images BLOCK. Missing blobs are skipped silently HERE rather than rendering a
  // broken box on a page guests will see — the builder already flags them in red, where
  // they can actually be fixed.
  //
  // `ctr` only applies at side:'full'. A centred grid inside a half-width column is
  // centring within a column nobody sees the edges of — the control is hidden in that
  // case, and the class is withheld here too, so the two cannot disagree.
  // HOME KEEPS ITS SLOTS. It is a <header>, not a <section>: it has no block list to
  // migrate them into (WB_NO_BLOCKS). Dropping them would make every existing Home photo
  // silently vanish on upgrade — a migration that changes what the guest already sees,
  // which is the one thing a migration must never do. So Home reads `images.home` still,
  // and _wbAllSiteMedia() must keep collecting from it.
  const homeSlot=(slot)=>{
    const b=((w.images||{}).home||{})[slot];
    if(!b || !Array.isArray(b.ids) || !b.ids.length) return '';
    const ids=b.ids.filter(id=>!_mediaMissing(id));
    if(!ids.length) return '';
    const cls=(b.layout==='rows') ? 'imgs-rows' : ('imgs-grid' + (b.align==='center'?' ctr':''));
    const nCol=Math.min(ids.length,3);
    return `<div class="${cls}${_wbShapeCls(b)}" style="--n:${nCol}">${ids.map(id=>`<img src="${_mediaUrl(id)}" alt="" loading="lazy"/>`).join('')}</div>`;
  };

  const imgHtml=(b)=>{
    const ids=b.ids.filter(id=>!_mediaMissing(id));
    if(!ids.length) return '';
    const cls=(b.layout==='rows')
      ? 'imgs-rows'
      : ('imgs-grid' + (b.align==='center' && b.side==='full' ? ' ctr' : ''));
    // --n = how many columns to hold on one row (capped at 3). On a phone the grid uses
    // this to keep up to 3 photos on a single line (shrinking to fit) instead of wrapping
    // one lonely photo to a second row; 4+ still wrap. Desktop is unaffected.
    const nCol=Math.min(ids.length,3);
    return `<div class="${cls}${_wbShapeCls(b)}" style="--n:${nCol}">${ids.map(id=>`<img src="${_mediaUrl(id)}" alt="" loading="lazy"/>`).join('')}</div>`;
  };

  const homeLink = sections.includes('home') ? `<a href="#home">Home</a>` : '';
  const navLinks = homeLink + sections.filter(k=>k!=='home').map(k=>
    `<a href="#${k}">${_escHtml(_wbNavLabel(k))}</a>`).join('');
  const nav = navLinks
    ? `<button type="button" class="navtoggle" aria-expanded="false" aria-controls="navlinks"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>Menu</button><span class="navlinks" id="navlinks">${navLinks}</span>`
    : '';

  // Every section is wrapped the same way, built-in or custom. Heading, intro, align and
  // band come from STATE.website.layout[k]; the inner content differs per section.
  // ── THE COMPOSER RENDERER (v126).
  //
  // wrap() no longer emits the heading and intro as fixed furniture with `inner` bolted
  // on underneath. It WALKS THE BLOCK LIST. `content` is the section's own indivisible
  // thing — the timetable, the details rows, the gallery — and it is dropped in wherever
  // the `body` block currently sits. Custom sections pass no content at all: their prose
  // IS their text blocks.
  //
  // An images block with side 'left' or 'right' PAIRS with whatever block follows it:
  // the two go into a `.beside` grid and the text sits alongside the photo. If nothing
  // follows, it renders full-width — a half-width image with no text beside it is just a
  // small image next to a hole, and a layout that silently leaves a hole is worse than
  // one that quietly declines to make one.
  const wrap=(k, content, extra)=>{
    const l=(w.layout||{})[k]||{};
    // bg is 0–100 (px max-width scale); legacy 'page'/'band' strings also handled.
    const bgV = (!l.bg||l.bg==='page')?0:(l.bg==='band'?100:Math.min(100,Math.max(0,Number(l.bg)||0)));
    const band = bgV >= 100;
    // Wide page (1 ≤ bgV < 100): section keeps page bg but gets a wider max-width.
    // max-width grows from 720px (bgV=0) toward no cap at bgV=100.
    const _mw=t.maxWidth||720; const secWideMaxW = (!band && bgV > 0) ? Math.round(_mw + bgV / 100 * Math.max(0,1400-_mw)) : null;
    const left = l.align==='left';
    // Two independent aligns. `lft` = the heading and intro; `b-*` = the section's own
    // content. v121 and earlier had only `lft`, and the body was hardcoded left in the
    // CSS — so choosing Centre centred the heading and silently did nothing below it.
    const body = (l.body==='center'||l.body==='justify') ? l.body : 'left';
    const cls = [extra||'', band?'band':'', left?'lft':'', 'b-'+body].filter(Boolean).join(' ');

    const blocks=_wbBlocks(k).filter(b=>!b.off);

    // Render ONE block. Returns '' when the block has nothing in it — an intro with no
    // text, an images block with no images. An empty block is not a gap; it is nothing.
    const one=(b)=>{
      if(b.type==='head') {
        const hd=_wbHeading(k);
        if(!hd) return '';
        if(t.format==='editorial'){
          const _ewMap={details:'The Big Day',timeline:'The Day',rsvp:'Attend',gallery:'Moments',accommodation:'Stay',wishing:'With Gratitude',countdown:'Save the Date',schedule:'Order of the Day',faq:'Questions',registry:'Registry'};
          const ew=_wbIsCustom(k)?'':(_ewMap[k]||'');
          return (ew?`<p class="edit-eyebrow">${_escHtml(ew.toUpperCase())}</p>`:'')+`<h2>${_escHtml(hd)}</h2>`;
        }
        return `<h2>${_escHtml(hd)}</h2>`;
      }
      if(b.type==='intro'){const t2=b.body!==undefined?b.body:(l.intro||'');return t2?`<p class="intro">${_escHtml(t2)}</p>`:'';}

      if(b.type==='body')  return content || '';
      if(b.type==='img')   return imgHtml(b);
      if(b.type==='text'){
        const paras=String(b.body||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
        return paras.map(x=>`<p class="para">${_escHtml(x).replace(/\n/g,'<br>')}</p>`).join('');
      }

      // ── Links. A row with no LABEL renders nothing — a bare URL is not a link a guest
      // can read. A row with a label and no URL renders as PLAIN TEXT, not a dead <a>:
      // a link that goes nowhere is worse than a word, because it invites a click.
      if(b.type==='links'){
        const rows=b.items.filter(x=>String(x.label||'').trim());
        if(!rows.length) return '';
        const one=(x)=>{
          const lbl=_escHtml(x.label);
          const url=String(x.url||'').trim();
          if(!url) return b.layout==='rows'
            ? `<li><b>${lbl}</b></li>`
            : `<span class="lk lk-dead">${lbl}</span>`;
          const href=_escHtml(_normalizeUrl(url));
          return b.layout==='rows'
            ? `<li><b>${lbl}</b><a href="${href}" target="_blank" rel="noopener noreferrer">${_escHtml(_urlDomain(url))}</a></li>`
            : `<a class="lk" href="${href}" target="_blank" rel="noopener noreferrer">${lbl}</a>`;
        };
        return b.layout==='rows'
          ? `<ul class="lks-rows">${rows.map(one).join('')}</ul>`
          : `<div class="lks">${rows.map(one).join('')}</div>`;
      }

      // ── Buttons. Same shape as links, and deliberately a DIFFERENT TYPE — a link is a
      // reference, a button is a call to action. They share `theme.button` and its
      // treatment with Save the date, so a site cannot end up with two kinds of button
      // that look almost but not quite the same.
      if(b.type==='btns'){
        const rows=b.items.filter(x=>{
          const lbl=String(x.label||'').trim();
          if(!lbl) return false;
          const um=x.urlMode||'custom';
          if(um==='ics'||um==='rsvp') return true;
          return String(x.url||'').trim();
        });
        if(!rows.length) return '';
        const btnsJustify=b.align==='left'?'flex-start':b.align==='right'?'flex-end':'center';
        return `<div class="btns" style="justify-content:${btnsJustify}">${rows.map(x=>{
          const um=x.urlMode||'custom';
          if(um==='rsvp') return `<button type="button" class="ics" onclick="_uvOpenRsvp()">${_escHtml(x.label)}</button>`;
          const href=um==='ics'?(_wbIcs()||''):_normalizeUrl(x.url);
          const attrs=um==='ics'?'download="save-the-date.ics"':'target="_blank" rel="noopener noreferrer"';
          return `<a class="ics" href="${_escHtml(href)}" ${attrs}>${_escHtml(x.label)}</a>`;
        }).join('')}</div>`;
      }

      // ── Video.
      //
      // `link` is the default and the safe one: a poster image (or a plain link) that
      // OPENS the video elsewhere. It contacts nobody, tracks nobody, and cannot show a
      // broken player.
      //
      // `embed` builds an iframe. youtube-nocookie is used because it is the least-bad
      // YouTube embed — it still contacts Google, and that is said plainly in the builder
      // rather than implied. If the URL is not a recognisable YouTube/Vimeo link, the
      // embed CANNOT be built, and it falls back to a link rather than framing a guess.
      if(b.type==='video'){
        const url=String(b.url||'').trim();
        if(!url) return '';
        const v=_wbVideoId(url);
        const cap=String(b.caption||'').trim();
        if(b.mode==='embed' && v){
          return `<div class="vid-embed"><iframe src="${_wbVideoEmbedUrl(v)}" title="${_escHtml(cap||'Video')}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>
            ${cap?`<p class="vid-cap">${_escHtml(cap)}</p>`:''}`;
        }
        const href=_escHtml(_normalizeUrl(url));
        const poster=(b.poster && !_mediaMissing(b.poster)) ? _mediaUrl(b.poster) : '';
        if(poster){
          return `<a class="vid-link" href="${href}" target="_blank" rel="noopener noreferrer">
            <img src="${poster}" alt="${_escHtml(cap||'')}" loading="lazy"/>
            <span class="vid-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
            ${cap?`<span class="vid-cap-over">${_escHtml(cap)}</span>`:''}
          </a>`;
        }
        // No poster: a plain, honest link. Not an empty box where a video should be.
        return `<p class="vid-plain"><a href="${href}" target="_blank" rel="noopener noreferrer">${_escHtml(cap||'Watch the video')}</a></p>`;
      }

      // ── Divider.
      if(b.type==='divider'){
        if(b.style==='dots') return `<div class="dv dv-dots" aria-hidden="true">&bull; &bull; &bull;</div>`;
        if(b.style==='leaf') return `<div class="dv dv-leaf" aria-hidden="true"><span></span><i>&#10086;</i><span></span></div>`;
        return `<hr class="dv dv-line"/>`;
      }

      return '';
    };

    const parts=[];
    for(let i=0;i<blocks.length;i++){
      const b=blocks[i];
      if(b.type==='img' && b.side!=='full'){
        const img=one(b);
        if(!img) continue;
        // A sided image pairs with the block that FOLLOWS it — but only if that block
        // carries CONTENT. A heading in a 62% column beside a photo is not a layout, it
        // is a heading that has lost its section; and the real content would then fall
        // out of the pair entirely and render below, orphaned.
        //
        // So: text and body may sit beside a photo. The heading and the intro may not.
        // The image renders full-width instead, which is exactly what it looks like when
        // there is nothing to sit beside — because there isn't.
        const nx=blocks[i+1];
        // Which blocks may sit BESIDE a sided image. Content may: text, the section's own
        // body, links and buttons. The heading may not (it would lose its section — v126).
        // A VIDEO may not: a 16:9 player squeezed into a 38% column is not a video, it is a
        // stamp. A DIVIDER may not: an ornamental rule beside a photograph is not dividing
        // anything. In both cases the image renders full-width instead — the same graceful
        // decline as beside a heading.
        const pairable = nx && (nx.type==='text' || nx.type==='body' || nx.type==='links' || nx.type==='btns');
        const partner=pairable ? one(nx) : '';
        if(partner){
          i++;  // the partner is CONSUMED here — it must not also be emitted on its own pass
          parts.push(`<div class="beside">${
            b.side==='left'
              ? img + `<div class="bes-t">${partner}</div>`
              : `<div class="bes-t">${partner}</div>` + img
          }</div>`);
        } else {
          parts.push(img);
        }
        continue;
      }
      const h=one(b);
      if(h) parts.push(h);
    }

    const inner=parts.join('\n      ');
    // Every block hidden, or every block empty, renders an empty band with padding — a
    // blank stripe on the site that looks like a bug. If there is nothing to show, show
    // nothing. (Same rule as the hero, v125.)
    if(!inner) return '';
    return `<section id="${k}"${cls?` class="${cls}"`:''} ${secWideMaxW?`style="max-width:${secWideMaxW}px"`:''}>
      ${inner}
    </section>`;
  };

  const blocks=sections.map(k=>{
    // Custom sections: heading + body + images. Nothing else — that's the whole point.
    if(_wbIsCustom(k)){
      // A custom section has NO content of its own to pass in — its words are text
      // blocks and the walk renders them. wrap() returns '' if every block is empty,
      // which is the same test the old `!paras.length && !_wbHasImgs(k)` guard was
      // making by hand, in one more place than it needed to.
      return wrap(k, '');
    }
    if(k==='home'){
      const h=w.home, hero=w.hero||{};
      const heroOk = hero.mediaId && !_mediaMissing(hero.mediaId);
      const over = heroOk && hero.style==='over';

      // v125: the names / date / save-the-date can each be hidden INDEPENDENTLY — a photo
      // with the names already burned into it doesn't want them printed on top as well.
      //
      // But the toggles only bite when there IS a photo to carry that information. With no
      // hero image, hiding the names leaves a page whose header says nothing at all, and
      // the couple's own site no longer tells you whose it is. So: the toggles apply to the
      // "names over photo" case, and everywhere else the names always show.
      const canHide  = over;
      const wantName = hero.showNames!==false;
      const wantDate = hero.showDate !==false;
      const wantIcs  = !canHide || hero.showIcs  !==false;
      const ctaM     = h.ctaMode || 'ics';

      // Save the date / RSVP / None. The .ics is inlined as a data: URL — no server needed.
      let icsBtn = '';
      if(ctaM==='rsvp'){
        icsBtn = `<a class="ics" href="javascript:void(0)" onclick="_uvOpenRsvp()">RSVP</a>`;
      } else if(ctaM!=='none' && wantIcs && _wbIcs()){
        icsBtn = `<a class="ics" href="${_wbIcs()}" download="save-the-date.ics"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="12" y1="13" x2="12" y2="18"/><line x1="9.5" y1="15.5" x2="14.5" y2="15.5"/></svg>Save the date</a>`;
      }

      // The hero now has a REAL HEIGHT. It used to be sized by its padding alone, so
      // `cover` cropped the photo to whatever accidental shape the text happened to make —
      // a tall portrait got squashed into a strip. And `pos` is the focal point: `cover`
      // always centres, so a couple standing low in the frame lose their heads.
      const scrim = (Number(hero.scrim)||0)/100;
      const pos   = _escHtml(hero.pos||'50% 50%');
      const zoom  = Math.max(50, Math.min(200, Number(hero.zoom)||100));

      // ── WHY THE PHOTO IS NOW AN <img>, NOT A BACKGROUND.
      //
      // It used to be a background-image with the scrim as a second background layer.
      // That CANNOT carry a zoom: `background-size:cover` is a KEYWORD, and there is no
      // CSS that says "cover, times 1.4" — you cannot multiply a keyword. And with two
      // background layers every background-* property needs two comma-separated values,
      // so one missing comma silently sizes the gradient by the photo's rules.
      //
      // An <img> composes cleanly. `object-fit` resolves the photo against the frame,
      // `transform:scale()` multiplies that result, and `object-position` is the focal
      // point — already wired since v125.
      //
      // ⚠️ transform-origin MUST TRACK THE FOCAL POINT. scale() grows the image away from
      // its origin; leave the origin at centre and zooming in would drift the very part
      // of the photo the focal point was chosen to keep. Origin and object-position are
      // the same point, expressed twice, and they must not be allowed to disagree.
      // COVER ALWAYS. See _wbHeroImgCss() for why switching fit at 100 was a bug.
      const heroImg = over
        ? `<img class="hero-bg" src="${_mediaUrl(hero.mediaId)}" alt="" aria-hidden="true"
              style="object-fit:contain;object-position:${pos};transform:scale(${zoom/100});transform-origin:${pos}"/>`
          + (scrim>0 ? `<span class="hero-scrim" style="background:rgba(0,0,0,${scrim})"></span>` : '')
        : '';

      // The frame's own colour shows through wherever the photo doesn't reach — which is
      // the MAT, below 100% zoom. It is the band colour, not white, so it reads as a
      // deliberate border rather than a hole.
      const heroStyle = over
        ? `min-height:${WB_HERO_H[hero.height]||WB_HERO_H.tall};display:flex;flex-direction:column;`
          + `align-items:center;justify-content:center;position:relative;overflow:hidden;`
          + `background:${t.band}`
        : '';

      // The names sitting on the photo are white OR dark — Mandy's choice, not a guess.
      // At 0% scrim on a pale photo, forcing white made them vanish. See DECISIONS v121.
      const cls = over ? (hero.ink==='dark' ? ' class="hero heroink-dark"' : ' class="hero"') : '';

      const inner = [
        wantName ? `<h1>${_escHtml(_wbCouple())}</h1>` : '',
        (wantDate && e.date) ? `<p class="eyebrow">${_escHtml(fmtDate(e.date))}</p>` : '',
        icsBtn,
        (heroOk && hero.style==='below')
          ? `<img class="hero-below" src="${_mediaUrl(hero.mediaId)}" alt="" style="object-position:${_escHtml(hero.pos||'50% 50%')}"/>` : '',
        homeSlot('top'),
        h.headline ? `<p class="lead">${_escHtml(h.headline)}</p>` : '',
        h.sub ? `<p class="sub">${_escHtml(h.sub)}</p>` : '',
        homeSlot('bottom')
      ].filter(Boolean).join('\n        ');

      // Everything hidden AND no photo would render an empty box with padding — a blank
      // band at the top of the site that looks like a bug. If there is nothing to show,
      // show nothing.
      if(!inner && !over) return '';

      return `<header id="home"${cls}${heroStyle?` style="${heroStyle}"`:''}>
        ${heroImg}
        ${inner}
      </header>`;
    }
    if(k==='details'){
      // The Map link is written as a Google Maps URL because that works on every device.
      // It is NOT sniffed here: this file is generated on Mandy's machine and read on a
      // guest's, so a build-time userAgent check would send Android guests to Apple Maps
      // whenever Mandy happened to build on a Mac. The site's own script swaps it at load.
      const mapA = (addr)=>`<a class="maplink" data-addr="${_escHtml(addr)}" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(addr)}" target="_blank" rel="noopener noreferrer">Map</a>`;
      const dh=(w.details||{}).hide||{};
      if(t.format==='editorial'){
        // Editorial details: centered typographic stack, no label columns
        const parts=[];
        if(!dh.date && e.date){
          const _d=new Date(e.date+'T00:00:00');
          const _days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const _mos=['January','February','March','April','May','June','July','August','September','October','November','December'];
          parts.push(`<p class="ed-date">${_escHtml(_days[_d.getDay()]+', '+_d.getDate()+' '+_mos[_d.getMonth()]+' '+_d.getFullYear())}</p>`);
        }
        if(!dh.time && e.time) parts.push(`<p class="ed-sub">Ceremony begins at ${_escHtml(e.time)}</p>`);
        if(!dh.venue && e.venue) parts.push(`<p class="ed-venue">${_escHtml(e.venue)}</p>`);
        if(!dh.ceremony && e.ceremonyVenue) parts.push(`<p class="ed-sub">${_escHtml(e.ceremonyVenue)}</p>`);
        if(!dh.address && e.venueAddress) parts.push(`<p class="ed-sub">${_escHtml(e.venueAddress)} ${mapA(e.venueAddress)}</p>`);
        return wrap(k, parts.length?`<div class="ed-details">${parts.join('')}</div>`:'');
      }
      const rows=[
        (!dh.venue && e.venue)?['Venue', _escHtml(e.venue)]:null,
        (!dh.address && e.venueAddress)?['Address', _escHtml(e.venueAddress)+' '+mapA(e.venueAddress)]:null,
        (!dh.ceremony && e.ceremonyVenue)?['Ceremony', _escHtml(e.ceremonyVenue)]:null,
        (!dh.date && e.date)?['Date', _escHtml(fmtDate(e.date))]:null,
        (!dh.time && e.time)?['Time', _escHtml(e.time)]:null
      ].filter(Boolean);
      return wrap(k, rows.length?`<dl>${rows.map(r=>`<div><dt>${_escHtml(r[0])}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>`:'');
    }
    if(k==='schedule'){
      const ms=_wbPublicMoments();
      return wrap(k, ms.length?`<ol class="sched">${ms.map(m=>`<li>
          <span class="t">${_escHtml(tlTo12h(m.time)||'')}</span>
          <span class="d"><b>${_escHtml(m.title||'')}</b>${m.location?`<i>${_escHtml(m.location)}</i>`:''}</span>
        </li>`).join('')}</ol>`:'');
    }
    if(k==='gallery'){
      const gs=_wbGalleryItems();
      // v148: gallery grid layout. l.grid in {left(default), center, rows}. `left` is the
      // pre-v148 look (auto-fill stretch), so an existing site is unchanged on upgrade.
      const gl=((w.layout||{}).gallery||{}).grid;
      const gcls = gl==='center' ? 'grid grid-center' : gl==='rows' ? 'grid grid-rows' : 'grid';
      return wrap(k, gs.length?`<div class="${gcls}">${gs.map(i=>`<img src="${_mediaUrl(i.image)}" alt="${_escHtml(i.title||'')}" loading="lazy"/>`).join('')}</div>`:'');
    }
    if(k==='wishingwell'){
      const ww=STATE.wishingwell||{};
      if(!ww.enabled) return '';
      // Deliberately public-safe: no total, no goal, no progress bar, no contributor
      // list. Guests see the message and how to give — nothing about what others gave.
      const pay=[ ww.payId?['PayID', ww.payId]:null,
                  (ww.bankBsb&&ww.bankAcc)?['Bank', ww.bankBsb+' · '+ww.bankAcc]:null,
                  ww.reference?['Reference', ww.reference]:null ].filter(Boolean);
      return wrap(k, [
        ww.message?`<p class="lead">${_escHtml(ww.message)}</p>`:'',
        pay.length?`<dl>${pay.map(r=>`<div><dt>${_escHtml(r[0])}</dt><dd>${_escHtml(r[1])}</dd></div>`).join('')}</dl>`:'',
        ww.closing?`<p class="sub">${_escHtml(ww.closing)}</p>`:''
      ].filter(Boolean).join('\n        '));
    }
    if(k==='countdown'){
      const d=_wbDaysLeft();
      let txt='';
      if(d!==null){
        if(d<0) txt='With love, always';
        else if(d===0) txt='Today';
        else if(d===1) txt='One day to go';
        else if((STATE.settings.countdownUnit||'days')==='monthsdays'){
          const months=Math.floor(d/30.4375);
          const days=Math.round(d-months*30.4375);
          if(months>0&&days>0) txt=`${months} month${months!==1?'s':''} and ${days} day${days!==1?'s':''} to go`;
          else if(months>0) txt=`${months} month${months!==1?'s':''} to go`;
          else txt=`${days} day${days!==1?'s':''} to go`;
        } else {
          txt=d+' days to go';
        }
      }
      // The countdown now goes through wrap() like every other section, so its images can
      // move and its heading has an eye like everything else. `count` is threaded in as
      // an extra class rather than hand-building a second <section> here — a second
      // renderer for one section is a second place to forget a fix.
      return wrap(k, txt?`<p>${_escHtml(txt)}</p>`:'', 'count');
    }
    if(k==='accommodation'){
      const st=w.stays.filter(x=>x.name);
      return wrap(k, !st.length?'':`<ul class="stays">${st.map(s=>`<li>
          <b>${_escHtml(s.name)}</b>
          ${s.note?`<i>${_escHtml(s.note)}</i>`:''}
          ${s.link?`<a href="${_escHtml(_normalizeUrl(s.link))}" target="_blank" rel="noopener noreferrer">Visit website</a>`:''}
        </li>`).join('')}</ul>`);
    }
    if(k==='faq'){
      const fs=w.faq.filter(x=>x.q);
      // faqExpand (default true) = the accordion. When a couple turns it OFF, every
      // answer shows at once — the pre-v157 static look. Off is opt-in, so existing sites
      // keep the accordion on upgrade.
      const expand=((w.layout||{}).faq||{}).faqExpand!==false;
      if(!fs.length) return wrap(k,'');
      const inner = expand
        ? `<div class="faq">${fs.map((f,i)=>`<details${i===0?' open':''}><summary><b>${_escHtml(f.q)}</b></summary><p>${_escHtml(f.a)}</p></details>`).join('')}</div>`
        : `<div class="faq faq-static">${fs.map(f=>`<div class="faq-i"><b>${_escHtml(f.q)}</b><p>${_escHtml(f.a)}</p></div>`).join('')}</div>`;
      return wrap(k, inner);
    }
    if(k==='rsvp'){
      const uid = _wbPublicOwnerUid || (_sbSession&&_sbSession.user&&_sbSession.user.id);
      if(!uid) return wrap(k,'');
      const rsvpUrl = window.location.origin+window.location.pathname+'?rsvp='+uid;
      const btnC = t.button||'#8B7355';
      const btnI = _wbInk(btnC);
      const bw = t.btnBorder==='thin'?'1px':t.btnBorder==='bold'?'3px':'2px';
      const btnSty = t.btnStyle==='filled'
        ? `background:${btnC};border:${bw} solid ${btnC};color:${btnI}`
        : t.btnStyle==='soft'
        ? `background:${btnC}1A;border:${bw} solid ${btnC};color:${btnC}`
        : `background:transparent;border:${bw} solid ${btnC};color:${btnC}`;
      const corners = WB_CORNERS[t.corners]||'10px';
      const rPad = t.btnSize==='sm'?'7px 16px':t.btnSize==='lg'?'14px 36px':'10px 24px';
      const rShad = t.btnShadow==='soft'?'0 2px 12px rgba(0,0,0,.14)':t.btnShadow==='strong'?'0 4px 22px rgba(0,0,0,.28)':'none';
      const rBev  = t.btnBevel?'inset 0 1px 0 rgba(255,255,255,.22),inset 0 -1px 0 rgba(0,0,0,.12)':'none';
      const rShadFull=[rShad,rBev].filter(x=>x!=='none').join(',') || 'none';
      const rsvpAction=`href="javascript:void(0)" onclick="_uvOpenRsvp()"`;
      return wrap(k,`<div style="text-align:center"><a ${rsvpAction} style="${btnSty};padding:${rPad};border-radius:${corners};display:inline-block;text-decoration:none;letter-spacing:.05em;box-shadow:${rShadFull}">RSVP</a></div>`);
    }
    return '';
  }).join('');

  const t2=t;
  // v129: ONE text scale became TWO. The split follows THE RENDERER, not a guess:
  // anything set in `headFont` is a heading. Everything else — prose, labels, small caps,
  // nav, footer — is body, which is what it all scaled with before, so nothing moves.
  const sch = (n)=>Math.round(n*(Number(t2.headScale)||100)/100);   // headings
  const scb = (n)=>Math.round(n*(Number(t2.bodyScale)||100)/100);   // body + furniture
  const scs = (n)=>Math.round(n*(Number(t2.secBodyScale)||100)/100); // section body text
  const sc  = scb;   // legacy alias — every call site below is re-pointed explicitly
  const sp = (n)=>Math.round(n*(Number(t2.space)||100)/100);
  const secGap = Math.max(0, Number(t2.gap)||0);
  const secPad = t2.secpad!=null ? Math.max(0, Number(t2.secpad)) : 52;
  const secPadH = t2.secpadH!=null ? Math.max(0, Number(t2.secpadH)) : 24;
  const rad = WB_CORNERS[t2.corners]||'10px';
  // imgRad caps at 10px — pill (999px) is for buttons only, not images or cards
  const imgRad = t2.corners==='sharp'?'0px':'10px';
  // v129: the button's ink is measured against THE BUTTON'S OWN COLOUR, not the accent.
  // It measured `accent` before — which was wrong even then, because a filled button drawn
  // in `button` and inked for `accent` is inked for a colour it is not.
  const btnInk = _wbInk(t2.button);
  const btnBW = t2.btnBorder==='thin'?'1px':t2.btnBorder==='bold'?'3px':'2px';
  const btnPad = t2.btnSize==='sm'?'7px 16px':t2.btnSize==='lg'?'14px 36px':'10px 24px';
  const btnFs  = t2.btnSize==='sm'?scb(11):t2.btnSize==='lg'?scb(14):scb(12);
  const btnShad= t2.btnShadow==='soft'?'0 2px 12px rgba(0,0,0,.14)':t2.btnShadow==='strong'?'0 4px 22px rgba(0,0,0,.28)':'none';
  const btnBevInset = t2.btnBevel?'inset 0 1px 0 rgba(255,255,255,.22),inset 0 -1px 0 rgba(0,0,0,.12)':'none';
  const btnShadFull = [btnShad, btnBevInset].filter(x=>x!=='none').join(',') || 'none';
  const BTN = (()=>{
    const c=t2.button;
    if(t2.btnStyle==='filled') return `background:${c};border:${btnBW} solid ${c};color:${btnInk}`;
    if(t2.btnStyle==='soft')   return `background:${c}1A;border:${btnBW} solid ${c};color:${c}`;
    return `background:transparent;border:${btnBW} solid ${c};color:${c}`;   // outline
  })();
  const _sv=typeof t2.shadow==='number'?Math.max(0,Math.min(100,t2.shadow)):0;
  const _cv=typeof t2.cardStyle==='number'?Math.max(0,Math.min(100,t2.cardStyle)):0;
  const _shPart=_sv>0?`0 ${Math.round(_sv/100*18)}px ${Math.round(_sv/100*64)}px rgba(0,0,0,${(_sv/100*0.40).toFixed(3)})`:'';
  const _bvInner=_cv>12?`inset 0 1.5px 0 rgba(255,255,255,${(_cv/100*0.14).toFixed(3)}),inset 0 -1px 0 rgba(0,0,0,${(_cv/100*0.035).toFixed(3)})`:'';
  const _bvOuter=_cv>12?`0 2px 8px rgba(0,0,0,${(_cv/100*0.07).toFixed(3)})`:'';
  const _allSh=[_shPart,_bvInner,_bvOuter].filter(Boolean).join(',');
  const secShadow=_allSh?`box-shadow:${_allSh}`:'';
  const secBorder=_cv>0?`;border:1px solid rgba(0,0,0,${(_cv/100*0.12).toFixed(3)});border-radius:${Math.round(_cv/100*14)}px;padding-left:28px;padding-right:28px`:'';
  const secAlign = t2.align==='left'?'left':'center';
  // The mark's colourway, resolved once from the PAGE colour — that is what the footer sits
  // on. Not the accent, and not the app's own theme (which is Mandy's, not her guests').
  const brand = _wbBrand(t2.page);
  const _uvRsvp=w.rsvp||{},_uvRfields=_uvRsvp.fields||{};
  const _uvCoupleId=_escHtml(_wbPublicOwnerUid||(_sbSession&&_sbSession.user&&_sbSession.user.id)||'');
  const _uvMealOn=!!(STATE.settings&&STATE.settings.mealChoiceOn)&&Array.isArray(STATE.settings.mealOptions)&&(STATE.settings.mealOptions||[]).filter(x=>String(x||'').trim()).length>0;
  const _uvMealOpts=_uvMealOn?(STATE.settings.mealOptions||[]).filter(x=>String(x||'').trim()):[];
  const _uvMealHtml=_uvMealOpts.map(o=>`<div class="rf-meal-chip" data-meal="${_escHtml(o)}" onclick="window._chooseMeal(this)">${_escHtml(o)}</div>`).join('');
  const _uvChildMealOn=_uvMealOn&&STATE.settings.childrenMealOn!==false&&(STATE.settings.childrenMealOptions||[]).filter(x=>String(x||'').trim()).length>0;
  const _uvChildMealEnabled=_uvMealOn&&STATE.settings.childrenMealOn!==false;
  const _uvChildMealOpts=_uvChildMealOn?(STATE.settings.childrenMealOptions||[]).filter(x=>String(x||'').trim()):[];
  const _uvChildMealHtml=_uvChildMealOpts.map(o=>`<div class="rf-meal-chip" data-meal="${_escHtml(o)}" onclick="window._chooseMeal(this)">${_escHtml(o)}</div>`).join('');
  const _uvGuests2=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B'&&g.name);
  const _uvPlus1Ids=new Set(_uvGuests2.filter(g=>g.plusOneId).map(g=>g.plusOneId));
  const _uvAllFams=STATE.families||[];
  const _uvGuestJson=JSON.stringify(_uvGuests2.map(g=>{const o={id:g.id,n:String(g.name).trim(),a:g.ageBand||'adult'};if(g.coupleId)o.ci=g.coupleId;if(g.plusOneId)o.p1=g.plusOneId;const fam=_uvAllFams.find(f=>f.memberIds&&f.memberIds.includes(g.id));if(fam){const fm=fam.memberIds.filter(mid=>mid!==g.id&&mid!==g.coupleId);if(fm.length)o.grp=fm;}return o;}).filter(g=>g.n).sort((a,b)=>a.n.localeCompare(b.n))).replace(/'/g,'&#39;');
  const _uvGuestSearchJson=JSON.stringify(_uvGuests2.filter(g=>g.name&&!_uvPlus1Ids.has(g.id)).map(g=>({id:g.id,n:String(g.name).trim()})).filter(g=>g.n).sort((a,b)=>a.n.localeCompare(b.n))).replace(/'/g,'&#39;');
  const _uvBtnYes=_escHtml(_uvRsvp.btnYes||'Joyfully accepts');
  const _uvBtnNo=_escHtml(_uvRsvp.btnNo||'Regretfully declines');
  const _flds=_uvRsvp.fields||{};
  const _fPhone=(f=>{if(f===false)return{show:false,required:false};if(!f)return{show:true,required:true};return{show:f.show!==false,required:!!f.required};})(_flds.phone);
  const _fEmail=(f=>{if(f===false)return{show:false,required:false};if(!f)return{show:true,required:false};return{show:f.show!==false,required:!!f.required};})(_flds.email);
  const _fAddr=(f=>{if(f===false)return{show:false,required:false};if(!f)return{show:false,required:false};return{show:f.show!==false,required:!!f.required};})(_flds.address);
  const _fSong=(f=>{if(!f)return{show:false};return{show:!!f.show};})(_flds.songRequest);
  const _fNotes=(f=>{if(!f)return{show:false};return{show:!!f.show};})(_flds.notes);
  const _uvHasStep2=true;
  const _uvHasStep3=_fPhone.show||_fEmail.show||_fAddr.show||_fSong.show||_fNotes.show;
  const _uvNumSteps=1+(_uvHasStep2?1:0)+(_uvHasStep3?1:0);
  const _uvWeddingDate=_escHtml((STATE.settings&&STATE.settings.weddingDate)||_uvRsvp.date||'');
  const _uvPal=(()=>{const p=_uvRsvp.palette||'sage';const ps={sage:{accent:'#5C7D6B',ink:'#2D3D35'},ivory:{accent:'#A08050',ink:'#3A3020'},blush:{accent:'#C0745A',ink:'#3D2820'},midnight:{accent:'#7B95C8',ink:'#D0D8E8'},slate:{accent:'#8AA4A8',ink:'#CAD3D6'}};if(p==='custom'){const cc=_uvRsvp.customColors||{};return {accent:cc.accent||'#5C7D6B',ink:cc.ink||_wbInk(cc.accent||'#5C7D6B')};}return ps[p]||ps.sage;})();
  const _uvModal=_uvCoupleId?`<style>
#uv-rsvp-overlay{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);align-items:center;justify-content:center;padding:16px;overscroll-behavior:none}
#uv-rsvp-overlay.open{display:flex}
#uv-rsvp-sheet{background:${t2.background||t2.page};color:${t2.text};border-radius:18px;max-height:calc(100dvh - 32px);overflow-y:auto;-webkit-overflow-scrolling:touch;width:100%;max-width:520px;box-shadow:0 8px 48px rgba(0,0,0,.32)}
.rfm-hdr{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 4px;position:sticky;top:0;background:${t2.background||t2.page};z-index:1}
.rfm-title{font-family:${t2.headFont};font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:${t2.heading};font-weight:600}
.rfm-close{background:none;border:none;cursor:pointer;color:${t2.text};opacity:.55;font-size:24px;line-height:1;padding:2px 8px;border-radius:4px;transition:opacity .15s}
.rfm-close:hover{opacity:1}
.rfm-steps{display:flex;align-items:flex-start;padding:14px 24px 16px;border-bottom:1px solid ${t2.heading}12}
.rfm-si{display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0}
.rfm-sn{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;transition:background .2s,color .2s;flex-shrink:0}
.rfm-sn.pending{background:transparent;border:1.5px solid ${t2.heading}28;color:${t2.heading};opacity:.35}
.rfm-sn.active{background:${_uvPal.accent};color:${_uvPal.ink};border:none}
.rfm-sn.done{background:${t2.heading}18;color:${t2.heading};border:none;opacity:.7}
.rfm-sl{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:${t2.heading};opacity:.4;white-space:nowrap}
.rfm-sl.active{opacity:.9;font-weight:600;color:${_uvPal.accent}}
.rfm-sl.done{opacity:.5}
.rfm-sline{flex:1;height:1.5px;background:${t2.heading}18;margin:0 8px;margin-top:13px}
.rfm-sline.done{background:${t2.heading}45}
.rf-step-panel{display:none}.rf-step-panel.active{display:block}
#uv-rsvp-sheet .rf-body{padding:16px 24px 8px}
#uv-rsvp-sheet .rf-card{border:1px solid ${t2.heading}18;border-radius:12px;padding:20px;margin-bottom:14px;position:relative}
#uv-rsvp-sheet .rf-lbl{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${t2.heading};opacity:.65;margin-bottom:8px;font-weight:600}
#uv-rsvp-sheet .rf-inp{width:100%;border:1.5px solid ${t2.heading}28;border-radius:8px;padding:12px 14px;font-size:15.5px;background:${t2.background||t2.page};color:${t2.text};outline:none;box-sizing:border-box;font-family:inherit}
#uv-rsvp-sheet .rf-inp:focus{border-color:${_uvPal.accent};box-shadow:0 0 0 3px ${_uvPal.accent}33}
#rf-ac{background:${t2.background||t2.page};border:1px solid ${t2.heading}22;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.14);overflow:hidden;position:fixed;z-index:10001;display:none;max-height:220px;overflow-y:auto}
#rf-ac .pub-ac-item{padding:11px 14px;cursor:pointer;font-size:15px;color:${t2.text}}
#rf-ac .pub-ac-item.focused,#rf-ac .pub-ac-item:hover{background:${_uvPal.accent}16}
#rf-ac .pub-ac-none{padding:11px 14px;font-size:13px;color:${t2.text};opacity:.55;pointer-events:none;font-style:italic}
#uv-rsvp-sheet .rf-pills{display:flex;gap:10px}
#uv-rsvp-sheet .rf-pill{flex:1;border:1.5px solid ${_uvPal.accent};border-radius:9px;padding:10px 0;text-align:center;cursor:pointer;font-size:13px;color:${_uvPal.accent};transition:background .2s,color .2s;user-select:none;background:none}
#uv-rsvp-sheet .rf-pill.yes{background:#EAF3EC;border-color:#3D9454;color:#1F6B38}
#uv-rsvp-sheet .rf-pill.no{background:#F7EFED;border-color:#C05840;color:#8B3324}
@media(prefers-color-scheme:dark){#uv-rsvp-sheet .rf-pill.yes{background:#1C3324;border-color:#3D9454;color:#7BC28A}#uv-rsvp-sheet .rf-pill.no{background:#3B1212;color:#FCA5A5;border-color:#7F1D1D}}
#uv-rsvp-sheet .rf-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
#uv-rsvp-sheet .rf-diet-chip{padding:6px 12px;border-radius:20px;border:1px solid ${t2.heading}28;font-size:12.5px;cursor:pointer;color:${t2.text};transition:background .15s,color .15s;user-select:none}
#uv-rsvp-sheet .rf-diet-chip.on{background:${_uvPal.accent};color:${_uvPal.ink};border-color:${_uvPal.accent}}
#uv-rsvp-sheet .rf-meal-chip{padding:6px 12px;border-radius:20px;border:1px solid ${t2.heading}28;font-size:12.5px;cursor:pointer;color:${t2.text};transition:background .15s,color .15s;user-select:none}
#uv-rsvp-sheet .rf-meal-chip.on{background:${_uvPal.accent};color:${_uvPal.ink};border-color:${_uvPal.accent}}
#uv-rsvp-sheet .rf-meal-info{font-size:13px;opacity:.65;font-style:italic;margin-top:2px}
#uv-rsvp-sheet .rf-msg-box{text-align:center;padding:40px 16px}
.rf-nav{display:flex;gap:10px;padding:12px 24px 20px;position:sticky;bottom:0;background:${t2.background||t2.page};border-top:1px solid ${t2.heading}12;z-index:2}
.rf-nav-back{flex:0 0 auto;background:none;border:1.5px solid ${t2.heading}22;color:${t2.heading};border-radius:10px;padding:11px 18px;font-size:13.5px;cursor:pointer;font-family:inherit;transition:border-color .15s}
.rf-nav-back:hover{border-color:${t2.heading}55}
.rf-nav-next{flex:1;background:${_uvPal.accent};color:${_uvPal.ink};border:none;border-radius:10px;padding:13px;font-size:15px;letter-spacing:.05em;cursor:pointer;font-family:inherit;transition:opacity .15s}
.rf-nav-next:disabled{opacity:.35;cursor:not-allowed}
.rf-inp.sm{width:100%;border:1.5px solid ${t2.heading}28;border-radius:8px;padding:8px 12px;font-size:14px;background:${t2.background||t2.page};color:${t2.text};outline:none;box-sizing:border-box;font-family:inherit;margin-top:6px}
.rf-inp.sm:focus{border-color:${_uvPal.accent};box-shadow:0 0 0 3px ${_uvPal.accent}33}
.member-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid ${t2.heading}10}
.member-row:last-child{border-bottom:none}
.member-row .rf-pills{display:grid;grid-template-columns:1fr 1fr;gap:8px;flex:0 0 auto;min-width:140px}
.member-row .rf-pill{padding:10px 6px;font-size:13px;white-space:nowrap;text-align:center;border-radius:8px;border-width:1.5px}
.plus1-row{flex-direction:column;align-items:stretch;gap:4px}
.plus1-row .member-body{display:flex;flex-direction:row;gap:10px;flex:1;align-items:center;flex-wrap:wrap}
.plus1-row .member-body>.rf-inp.sm{flex:1;min-width:140px;margin-top:0}
.plus1-row .rf-pills{min-width:140px}
.member-badge{display:inline-flex;align-items:center;justify-content:center;background:${_uvPal.accent}20;color:${_uvPal.accent};border:1px solid ${_uvPal.accent}40;border-radius:4px;font-size:10px;font-weight:700;padding:2px 6px;letter-spacing:.06em;white-space:nowrap;flex-shrink:0}
.member-name{font-size:15px;color:${t2.text};flex:1}
.member-name-lbl{font-size:13px;font-weight:600;color:${t2.heading};margin-bottom:8px;opacity:.8}
.diet-details{border:1px solid ${t2.heading}15;border-radius:8px;margin-top:12px;overflow:hidden}
.diet-details summary{padding:10px 14px;font-size:13px;color:${t2.heading};opacity:.8;cursor:pointer;user-select:none;list-style:none;display:flex;align-items:center;gap:6px}
.diet-details summary::before{content:'+';font-size:15px;font-weight:600;color:${_uvPal.accent}}
.diet-details[open] summary::before{content:'−'}
.diet-body{padding:10px 14px 14px;border-top:1px solid ${t2.heading}12}
.rf-diet-chip{display:inline-flex;align-items:center;padding:6px 12px;border-radius:20px;border:1px solid ${t2.heading}28;font-size:12.5px;cursor:pointer;color:${t2.text};transition:background .15s,color .15s,border-color .15s;user-select:none;margin:3px}
.rf-diet-chip.on{background:${_uvPal.accent};color:${_uvPal.ink};border-color:${_uvPal.accent}}
.rf-hc-label{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-top:10px;accent-color:${_uvPal.accent}}
</style>
<div id="uv-rsvp-overlay" onclick="if(event.target===this)_uvCloseRsvp()">
  <div id="uv-rsvp-sheet">
    <div class="rfm-hdr">
      <span class="rfm-title">RSVP</span>
      <button class="rfm-close" onclick="_uvCloseRsvp()" aria-label="Close">&#215;</button>
    </div>
    ${_uvNumSteps>1?`<div class="rfm-steps">
      <div class="rfm-si"><div class="rfm-sn active" id="rfm-sn-1">1</div><span class="rfm-sl active" id="rfm-sl-1">You</span></div>
      ${_uvNumSteps>=2?`<div class="rfm-sline" id="rfm-sline-1"></div><div class="rfm-si"><div class="rfm-sn pending" id="rfm-sn-2">2</div><span class="rfm-sl" id="rfm-sl-2">Dining</span></div>`:''}
      ${_uvNumSteps>=3?`<div class="rfm-sline" id="rfm-sline-2"></div><div class="rfm-si"><div class="rfm-sn pending" id="rfm-sn-3">3</div><span class="rfm-sl" id="rfm-sl-3">Details</span></div>`:''}
    </div>`:''}
    <div class="rf-body">
      <div class="rf-step-panel active" id="rf-step1">
        <div class="rf-card">
          <div class="rf-lbl">Your name</div>
          <input class="rf-inp" id="rf-name" type="text" placeholder="Search your name\u2026" autocomplete="off" oninput="_rfNameSearch(this.value)" onkeydown="_rfNameKey(event)" onblur="setTimeout(function(){var a=document.getElementById('rf-ac');if(a)a.style.display='none'},220)">
        </div>
        <div class="rf-card" id="rf-group-card" style="display:none">
          <div class="rf-lbl" id="rf-group-lbl">Attending?</div>
          <div id="rf-group-list"></div>
        </div>
      </div>
      <div class="rf-step-panel" id="rf-step2">
        <div id="rf-dining-list"></div>
      </div>
      ${_uvHasStep3?`<div class="rf-step-panel" id="rf-step3">
        ${_fPhone.show?`<div class="rf-card"><div class="rf-lbl">Phone${_fPhone.required?' <span style="color:#DC2626">*</span>':''}</div><input class="rf-inp" id="f-phone" type="tel" placeholder="+61 400 000 000" autocomplete="tel" oninput="window._uvCheckStep3&&window._uvCheckStep3()"></div>`:''}
        ${_fEmail.show?`<div class="rf-card"><div class="rf-lbl">Email${_fEmail.required?' <span style="color:#DC2626">*</span>':''}</div><input class="rf-inp" id="f-email" type="email" placeholder="email@example.com" autocomplete="email" oninput="window._uvCheckStep3&&window._uvCheckStep3()"></div>`:''}
        ${_fAddr.show?`<div class="rf-card"><div class="rf-lbl">Mailing address${_fAddr.required?' <span style="color:#DC2626">*</span>':''}</div><input class="rf-inp" id="f-street" type="text" placeholder="Street address" style="margin-bottom:8px" oninput="window._uvCheckStep3&&window._uvCheckStep3()"><input class="rf-inp" id="f-suburb" type="text" placeholder="Suburb / City" style="margin-bottom:8px"><div style="display:flex;gap:8px"><input class="rf-inp" id="f-state" type="text" placeholder="State" style="flex:1"><input class="rf-inp" id="f-post" type="text" placeholder="Postcode" style="flex:1"></div></div>`:''}
        ${_fSong.show?`<div class="rf-card"><div class="rf-lbl">Song request</div><input class="rf-inp" id="f-song" type="text" placeholder="Artist \u2014 Song title"></div>`:''}
        ${_fNotes.show?`<div class="rf-card"><div class="rf-lbl">Message for the couple</div><textarea class="rf-inp" id="f-notes" rows="3" placeholder="A note, a wish\u2026" style="resize:vertical"></textarea></div>`:''}
      </div>`:''}
      <div class="rf-step-panel" id="rf-step-done"></div>
    </div>
    <div class="rf-nav" id="rf-nav">
      <button class="rf-nav-back" id="rf-back" onclick="_uvRsvpBack()" hidden>&#8592; Back</button>
      <button class="rf-nav-next" id="rf-next" onclick="_uvRsvpNext()" disabled>Next &#8594;</button>
    </div>
    <div id="uv-rf-data" style="display:none" data-guests='${_uvGuestJson}' data-search='${_uvGuestSearchJson}' data-couple="${_uvCoupleId}" data-wdate="${_uvWeddingDate}"></div>
    ${_uvMealHtml?`<template id="uv-rf-meal-tmpl"><div class="rf-chips">${_uvMealHtml}</div></template>`:''}
    ${_uvChildMealHtml?`<template id="uv-rf-children-meal-tmpl"><div class="rf-chips">${_uvChildMealHtml}</div></template>`:''}
  </div>
</div>
<div id="rf-ac" role="listbox"></div>
<script>
(function(){
  var _su='${_SB_URL}',_sk='${_SB_KEY}';
  var _rfStep=1,_rfWizPanels=['step1'${_uvHasStep2?",'step2'":""}${_uvHasStep3?",'step3'":""}];
  var _rfTotalSteps=_rfWizPanels.length;
  var _mealOn=${_uvMealOn?'true':'false'},_childMealEnabled=${_uvChildMealEnabled?'true':'false'};
  var _phoneReq=${_fPhone.show&&_fPhone.required?'true':'false'},_emailReq=${_fEmail.show&&_fEmail.required?'true':'false'},_addrReq=${_fAddr.show&&_fAddr.required?'true':'false'};
  var group=[],plus1Names={},dietSel={},dietNotes={},mealPick={};
  var _gd=document.getElementById('uv-rf-data');
  var GG=_gd?JSON.parse(_gd.dataset.guests||'[]'):[];
  var GSearch=_gd?JSON.parse(_gd.dataset.search||'[]'):[];
  var byId={};GG.forEach(function(g){byId[g.id]=g;});
  function _esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function _checkStep1(){
    var nx=document.getElementById('rf-next');if(!nx)return;
    var allAnswered=group.length>0&&group.every(function(m){return m.att!==null;});
    var p1Ok=group.every(function(m){if(!m.isPlus1||m.att!==true)return true;return(plus1Names[m.id]||'').trim().length>0;});
    var anyYes=group.some(function(m){return m.att===true;});
    nx.disabled=!(allAnswered&&p1Ok);
    nx.textContent=(allAnswered&&!anyYes)?'Send my RSVP':'Next \u2192';
  }
  function _renderGroup(){
    var gc=document.getElementById('rf-group-card'),gl=document.getElementById('rf-group-list');
    if(!gc||!gl)return;
    if(!group.length){gc.style.display='none';return;}
    gc.style.display='';
    var lbl=document.getElementById('rf-group-lbl');
    if(lbl)lbl.textContent=group.length===1?'Will you be attending?':'Will you be attending?';
    gl.innerHTML=group.map(function(m,i){
      var yc='rf-pill'+(m.att===true?' yes':''),nc='rf-pill'+(m.att===false?' no':'');
      if(m.isPlus1){
        var p1n=_esc(plus1Names[m.id]||'');
        return '<div class="member-row plus1-row"><span class="member-badge">+1</span><div class="member-body"><input class="rf-inp sm" type="text" placeholder="Guest name (required if attending)" value="'+p1n+'" data-pid="'+m.id+'" oninput="window._uvSetP1Name(this)"><div class="rf-pills"><button class="'+yc+'" onclick="window._rfSetAtt('+i+',true)">\u2713 Yes</button><button class="'+nc+'" onclick="window._rfSetAtt('+i+',false)">No</button></div></div></div>';
      }
      return '<div class="member-row"><span class="member-name">'+_esc(m.n)+'</span><div class="rf-pills"><button class="'+yc+'" onclick="window._rfSetAtt('+i+',true)">\u2713 Yes</button><button class="'+nc+'" onclick="window._rfSetAtt('+i+',false)">No</button></div></div>';
    }).join('');
    _checkStep1();
  }
  function _rfWizSetStep(n){
    _rfStep=n;
    _rfWizPanels.forEach(function(pid,i){var p=document.getElementById('rf-'+pid);if(p)p.classList.toggle('active',i+1===n);});
    for(var i=1;i<=_rfTotalSteps;i++){
      var sn=document.getElementById('rfm-sn-'+i),sl=document.getElementById('rfm-sl-'+i),ln=document.getElementById('rfm-sline-'+i);
      if(sn)sn.className='rfm-sn '+(i<n?'done':i===n?'active':'pending');
      if(sl)sl.className='rfm-sl '+(i<n?'done':i===n?'active':'');
      if(ln)ln.classList.toggle('done',i<n);
    }
    var bk=document.getElementById('rf-back');if(bk)bk.hidden=n<=1;
    var nx=document.getElementById('rf-next');
    if(n===1)_checkStep1();
    else if(n===2){_renderDining();_checkStep2();}
    else if(n===3){window._uvCheckStep3&&window._uvCheckStep3();}
    else if(nx){nx.disabled=false;nx.textContent='Send my RSVP';}
  }
  function _checkStep2(){
    var nx=document.getElementById('rf-next');if(!nx)return;
    if(!_mealOn){nx.disabled=false;nx.textContent='Next \u2192';return;}
    var attending=group.filter(function(m){return m.att===true;});
    var allMeal=attending.every(function(m){var g=byId[m.id]||{};return (g.a||'adult')==='infant'||!!mealPick[m.id];});
    nx.disabled=!allMeal;
    nx.textContent=_rfStep===_rfTotalSteps?'Send my RSVP':'Next \u2192';
  }
  function _renderDining(){
    var dl=document.getElementById('rf-dining-list');if(!dl)return;
    var attending=group.filter(function(m){return m.att===true;});
    if(!attending.length){dl.innerHTML='';return;}
    var DIET=['Vegetarian','Pescatarian','Vegan','Halal','Kosher','Lactose free','Gluten free','Allergy','Other'];
    dl.innerHTML=attending.map(function(m){
      var g=byId[m.id]||{a:'adult'};
      var dispName=m.isPlus1?(plus1Names[m.id]||'Guest').trim():m.n;
      var mealHtml='';
      if(_mealOn){
        var isInf=(g.a||'adult')==='infant',isCh=(g.a||'adult')==='child';
        if(isInf){
          mealHtml='<div class="rf-meal-info" style="font-size:13px;opacity:.65;font-style:italic">No meal provided for infants</div>';
        } else {
          var useCh=isCh&&_childMealEnabled;
          var tmplId=useCh?'uv-rf-children-meal-tmpl':'uv-rf-meal-tmpl';
          var lbl2=useCh?'Children\\'s meal':'Meal choice';
          var tmpl=document.getElementById(tmplId);
          if(tmpl){
            var frag=tmpl.content.cloneNode(true);
            var wrap=document.createElement('div');wrap.appendChild(frag);
            wrap.querySelectorAll('.rf-meal-chip').forEach(function(btn){
              btn.dataset.mid=m.id;
              btn.onclick=function(){window._chooseMeal(this);};
              if(mealPick[m.id]===btn.dataset.meal)btn.classList.add('on');
            });
            mealHtml='<div class="rf-lbl" style="margin-bottom:6px">'+lbl2+'</div><div class="rf-chips">'+wrap.innerHTML+'</div>';
          } else if(useCh){
            mealHtml='<div style="font-size:13px;opacity:.65;font-style:italic">A children\\'s meal will be provided</div>';
          }
        }
        var isJunior=(isInf||(g.a||'adult')==='child');
        if(isJunior){mealHtml+='<label class="rf-hc-label"><input type="checkbox" data-hcid="'+m.id+'" '+(mealPick[m.id+'-hc']?'checked':'')+' onchange="mealPick[this.dataset.hcid+\\'-hc\\']=this.checked;"> High chair required</label>';}
      }
      var dSel=dietSel[m.id]||new Set();
      var chips=DIET.map(function(d){return '<label class="rf-diet-chip'+(dSel.has(d)?' on':'')+'" data-mid="'+m.id+'" data-diet="'+_esc(d)+'" onclick="window._dietClick(this)">'+_esc(d)+'</label>';}).join('');
      var aDisp=dSel.has('Allergy')?'':'display:none';
      var oDisp=dSel.has('Other')?'':'display:none';
      return '<div class="rf-card">'+'<div class="member-name-lbl">'+_esc(dispName)+'</div>'+mealHtml+'<details class="diet-details"><summary class="diet-summary">Dietary requirements</summary><div class="diet-body"><div style="display:flex;flex-wrap:wrap;margin:-3px">'+chips+'</div><input class="rf-inp sm" type="text" data-mid="'+m.id+'" data-type="allergy" placeholder="Describe allergy" value="'+_esc(dietNotes[m.id+'-allergy']||'')+'" style="'+aDisp+'" oninput="dietNotes[this.dataset.mid+\\'-allergy\\']=this.value"><input class="rf-inp sm" type="text" data-mid="'+m.id+'" data-type="other" placeholder="Please specify" value="'+_esc(dietNotes[m.id+'-other']||'')+'" style="'+oDisp+'" oninput="dietNotes[this.dataset.mid+\\'-other\\']=this.value"></div></details></div>';
    }).join('');
    _checkStep2();
  }
  window._uvRsvpNext=function(){
    var panelId=_rfWizPanels[_rfStep-1];
    if(panelId==='step1'){
      var allAns=group.length>0&&group.every(function(m){return m.att!==null;});
      var p1Ok=group.every(function(m){if(!m.isPlus1||m.att!==true)return true;return(plus1Names[m.id]||'').trim().length>0;});
      if(!(allAns&&p1Ok))return;
      var anyYes=group.some(function(m){return m.att===true;});
      if(!anyYes){window._uvRsvpSubmit();return;}
    }
    if(_rfStep<_rfTotalSteps){_rfWizSetStep(_rfStep+1);}
    else{window._uvRsvpSubmit();}
  };
  window._uvRsvpBack=function(){if(_rfStep>1)_rfWizSetStep(_rfStep-1);};
  window._uvOpenRsvp=function(){var o=document.getElementById('uv-rsvp-overlay');if(o){o.classList.add('open');document.body.style.overflow='hidden';}};
  window._uvCloseRsvp=function(){
    var o=document.getElementById('uv-rsvp-overlay');if(o){o.classList.remove('open');document.body.style.overflow='';}
    group=[];plus1Names={};dietSel={};dietNotes={};mealPick={};_rfStep=1;
    _rfWizPanels.forEach(function(pid){var p=document.getElementById('rf-'+pid);if(p)p.classList.remove('active');});
    var s1=document.getElementById('rf-step1');if(s1)s1.classList.add('active');
    var sd=document.getElementById('rf-step-done');if(sd){sd.classList.remove('active');sd.innerHTML='';}
    for(var i=1;i<=_rfTotalSteps;i++){
      var sni=document.getElementById('rfm-sn-'+i),sli=document.getElementById('rfm-sl-'+i),lni=document.getElementById('rfm-sline-'+i);
      if(sni)sni.className='rfm-sn '+(i===1?'active':'pending');
      if(sli)sli.className='rfm-sl '+(i===1?'active':'');
      if(lni)lni.classList.remove('done');
    }
    var bk=document.getElementById('rf-back');if(bk)bk.hidden=true;
    var nx=document.getElementById('rf-next');if(nx){nx.disabled=true;nx.textContent='Next \u2192';}
    var nav=document.getElementById('rf-nav');if(nav)nav.style.display='';
    var stEl=document.querySelector('.rfm-steps');if(stEl)stEl.style.display='';
    var ni=document.getElementById('rf-name'),ac=document.getElementById('rf-ac');
    if(ni){ni.value='';ni.style.borderColor='';ni.style.boxShadow='';}
    if(ac)ac.style.display='none';
    var gc=document.getElementById('rf-group-card');if(gc)gc.style.display='none';
    var gl=document.getElementById('rf-group-list');if(gl)gl.innerHTML='';
    document.querySelectorAll('#rf-step3 input,#rf-step3 textarea').forEach(function(el){el.value='';});
  };
  window._rfNameSearch=function(q){
    var ac=document.getElementById('rf-ac');if(!ac)return;
    if(q.length<2){ac.style.display='none';return;}
    var lq=q.toLowerCase();
    var hits=GSearch.filter(function(g){var pts=g.n.toLowerCase().split(/[\s&,]+/);return pts.some(function(x){return x.startsWith(lq);})||g.n.toLowerCase().indexOf(lq)>-1;}).slice(0,8);
    ac.innerHTML=hits.length?hits.map(function(g){return '<div class="pub-ac-item" role="option" data-gid="'+g.id+'" onmousedown="window._rfPickName(this.dataset.gid)">'+_esc(g.n)+'</div>';}).join(''):'<div class="pub-ac-none">No match — try another spelling</div>';
    var ni=document.getElementById('rf-name');if(ni){var r=ni.getBoundingClientRect();ac.style.cssText='position:fixed;top:'+(r.bottom+4)+'px;left:'+r.left+'px;width:'+r.width+'px;display:block';}
  };
  window._rfPickName=function(id){
    var g=byId[id];var name=g?g.n:'';
    var ni=document.getElementById('rf-name'),ac=document.getElementById('rf-ac');
    if(ni){ni.value=name;ni.style.borderColor='${_uvPal.accent}';ni.style.boxShadow='0 0 0 3px ${_uvPal.accent}33';}
    if(ac)ac.style.display='none';
    var g=byId[id];group=[];
    function add(gid,isP1){var m=byId[gid];if(!m||group.some(function(x){return x.id===gid;}))return;group.push({id:gid,n:m.n,a:m.a||'adult',isPlus1:isP1,att:null});}
    if(g){add(g.id,false);if(g.ci)add(g.ci,false);if(g.p1)add(g.p1,true);(g.grp||[]).forEach(function(fid){var fm=byId[fid];if(!fm)return;add(fm.id,false);if(fm.p1)add(fm.p1,true);});}
    _renderGroup();
    var gc=document.getElementById('rf-group-card');if(gc)setTimeout(function(){gc.scrollIntoView({behavior:'smooth',block:'nearest'});},80);
  };
  window._rfNameKey=function(e){
    var ac=document.getElementById('rf-ac');if(!ac||ac.style.display==='none')return;
    var items=Array.from(ac.querySelectorAll('.pub-ac-item')),cur=ac.querySelector('.pub-ac-item.focused');
    var idx=items.indexOf(cur);
    if(e.key==='ArrowDown'){e.preventDefault();items.forEach(function(el){el.classList.remove('focused');});idx=Math.min(idx+1,items.length-1);if(items[idx])items[idx].classList.add('focused');}
    else if(e.key==='ArrowUp'){e.preventDefault();items.forEach(function(el){el.classList.remove('focused');});idx=Math.max(idx-1,0);if(items[idx])items[idx].classList.add('focused');}
    else if(e.key==='Enter'&&cur){e.preventDefault();window._rfPickName(cur.dataset.gid);}
    else if(e.key==='Escape')ac.style.display='none';
  };
  window._rfSetAtt=function(i,val){if(!group[i])return;group[i].att=val;_renderGroup();};
  window._uvSetP1Name=function(inp){plus1Names[inp.dataset.pid]=inp.value;_checkStep1();};
  window._chooseMeal=function(btn){
    var id=btn.dataset.mid,ml=btn.dataset.meal;mealPick[id]=ml;
    btn.closest('.rf-chips').querySelectorAll('.rf-meal-chip').forEach(function(c){c.classList.remove('on');});
    btn.classList.add('on');_checkStep2();
  };
  window._dietClick=function(lbl){
    var mid=lbl.dataset.mid,diet=lbl.dataset.diet;
    if(!dietSel[mid])dietSel[mid]=new Set();
    lbl.classList.toggle('on');
    if(lbl.classList.contains('on'))dietSel[mid].add(diet);else dietSel[mid].delete(diet);
    var body=lbl.closest('.diet-body');if(!body)return;
    var ai=body.querySelector('[data-type="allergy"]'),oi=body.querySelector('[data-type="other"]');
    if(ai)ai.style.display=dietSel[mid].has('Allergy')?'':'none';
    if(oi)oi.style.display=dietSel[mid].has('Other')?'':'none';
  };
  window._uvCheckStep3=function(){
    var nx=document.getElementById('rf-next');if(!nx)return;
    var pOk=!_phoneReq||((document.getElementById('f-phone')||{value:''}).value||'').trim().length>0;
    var eOk=!_emailReq||((document.getElementById('f-email')||{value:''}).value||'').trim().length>0;
    var aOk=!_addrReq||((document.getElementById('f-street')||{value:''}).value||'').trim().length>0;
    nx.disabled=!(pOk&&eOk&&aOk);nx.textContent='Send my RSVP';
  };
  window._uvRsvpSubmit=async function(){
    var nx=document.getElementById('rf-next');if(nx){nx.disabled=true;nx.textContent='Sending\u2026';}
    var gd2=document.getElementById('uv-rf-data'),cid=gd2?gd2.dataset.couple:'';
    var phone=((document.getElementById('f-phone')||{value:''}).value||'').trim();
    var email=((document.getElementById('f-email')||{value:''}).value||'').trim();
    var st=((document.getElementById('f-street')||{value:''}).value||'').trim();
    var su=((document.getElementById('f-suburb')||{value:''}).value||'').trim();
    var ss=((document.getElementById('f-state')||{value:''}).value||'').trim();
    var sp=((document.getElementById('f-post')||{value:''}).value||'').trim();
    var addr=[st,su,ss,sp].filter(Boolean).join(', ')||null;
    var song=((document.getElementById('f-song')||{value:''}).value||'').trim();
    var notes=((document.getElementById('f-notes')||{value:''}).value||'').trim();
    var anyYes=group.some(function(m){return m.att===true;});
    var primaryName=group.length>0?(group[0].isPlus1?(plus1Names[group[0].id]||'Guest').trim():group[0].n):'';
    var guestData=group.map(function(m){
      var n=m.isPlus1?(plus1Names[m.id]||'Guest').trim():m.n;
      var ds=dietSel[m.id]?Array.from(dietSel[m.id]):[];
      var an=(dietNotes[m.id+'-allergy']||'').trim();
      var on2=(dietNotes[m.id+'-other']||'').trim();
      if(an)ds.push('Allergy: '+an);if(on2)ds.push('Other: '+on2);
      return {name:n,attending:m.att===true?'yes':'no',meal:mealPick[m.id]||null,dietary:ds.length?ds:null,highChair:!!(mealPick[m.id+'-hc'])};
    });
    try{
      var r=await fetch(_su+'/rest/v1/rsvp_responses',{method:'POST',headers:{'apikey':_sk,'Authorization':'Bearer '+_sk,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({couple_id:cid,guest_name:primaryName,email:email||null,phone:phone||null,address:addr,attending:anyYes?'yes':'no',meal:guestData[0]?guestData[0].meal:null,dietary:guestData[0]?guestData[0].dietary:null,message:notes||null,song_request:song||null,group_data:guestData.length>1?JSON.stringify(guestData):null,high_chair:!!(mealPick[(group[0]&&group[0].id)+'-hc'])})});
      if(r.ok||r.status===201){
        _rfWizPanels.forEach(function(pid){var p=document.getElementById('rf-'+pid);if(p)p.classList.remove('active');});
        var nav=document.getElementById('rf-nav');if(nav)nav.style.display='none';
        var stEl2=document.querySelector('.rfm-steps');if(stEl2)stEl2.style.display='none';
        var sd=document.getElementById('rf-step-done');
        if(sd){
          function joinN(arr){if(!arr.length)return '';if(arr.length===1)return arr[0];return arr.slice(0,-1).join(', ')+' & '+arr[arr.length-1];}
          var yNames=group.filter(function(m){return m.att===true;}).map(function(m){return m.isPlus1?(plus1Names[m.id]||'Guest').trim():m.n;});
          var noNames=group.filter(function(m){return m.att===false&&!m.isPlus1;}).map(function(m){return m.n;});
          var wDateStr=_gd?_gd.dataset.wdate||'':'';
          var wDate=wDateStr?new Date(wDateStr):null;
          function ord(n){var s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
          var dayMonth=wDate&&!isNaN(wDate.getTime())?'the '+ord(wDate.getDate())+' of '+wDate.toLocaleString('default',{month:'long'}):'the big day';
          var heading=anyYes?'See you there!':'Thanks for letting us know.';
          var msg='';
          if(yNames.length)msg+='We\\'ll see '+joinN(yNames)+' on '+dayMonth+'!';
          if(noNames.length)msg+=(msg?' ':'')+'\\'We\\'ll miss '+joinN(noNames)+'.';
          sd.innerHTML='<div class="rf-msg-box"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${_uvPal.accent}" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg><div style="font-size:17px;font-weight:600;margin:10px 0 6px;color:${t2.heading}">'+heading+'</div><div style="font-size:13.5px;line-height:1.5;opacity:.8">'+msg+'</div></div>';
          sd.classList.add('active');
        }
      }else{if(nx){nx.disabled=false;nx.textContent='Send my RSVP';}}
    }catch(e2){if(nx){nx.disabled=false;nx.textContent='Send my RSVP';}}
  };
  window.plus1Names=plus1Names;window.mealPick=mealPick;window.dietSel=dietSel;window.dietNotes=dietNotes;
  if(_rfTotalSteps===1){var nx2=document.getElementById('rf-next');if(nx2)nx2.textContent='Send my RSVP';}
  document.getElementById('uv-rsvp-overlay')&&document.getElementById('uv-rsvp-overlay').addEventListener('scroll',function(){var ac=document.getElementById('rf-ac');if(ac)ac.style.display='none';},true);
})();
<\/script>
`:'';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${_escHtml(_wbCouple())}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Cinzel:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600&family=Lato:wght@300;400;700&family=Raleway:wght@300;400;500;600&family=Josefin+Sans:wght@300;400;600&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:${t2.background||t2.page};color:${t2.text};font-family:${t2.bodyFont};font-size:${scb(16)}px;line-height:1.7}
nav{position:sticky;top:0;z-index:100;background:${t2.background||t2.page};padding:${sp(16)}px;border-bottom:1px solid ${t2.heading}1A}
main{background:${t2.background||t2.page}}
.navlinks{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 22px}
nav a{color:${t2.heading};text-decoration:none;font-size:${scb(12)}px;letter-spacing:.1em;text-transform:uppercase;opacity:.7}
nav a:hover{opacity:1;color:${t2.accent}}
body.sidenav{display:flex;align-items:flex-start}
body.sidenav nav{position:sticky;top:0;height:100dvh;overflow-y:auto;width:${scb(200)}px;flex-shrink:0;border-bottom:none;border-right:1px solid ${t2.heading}1A;padding:${sp(24)}px ${sp(16)}px;display:flex;flex-direction:column}
body.sidenav .navlinks{flex-direction:column;flex-wrap:nowrap;justify-content:flex-start;gap:0;margin-top:${sp(8)}px}
body.sidenav nav a{display:block;padding:${sp(9)}px ${sp(6)}px;opacity:.7}
body.sidenav .navtoggle{display:none}
.site-content{flex:1;min-width:0}
@media(max-width:620px){body.sidenav{display:block}body.sidenav nav{position:sticky;top:0;height:auto;width:auto;border-right:none;border-bottom:1px solid ${t2.heading}1A;padding:${sp(16)}px;display:block;overflow-y:visible}body.sidenav .navlinks{flex-direction:row;flex-wrap:wrap;justify-content:center;margin-top:0}body.sidenav nav a{display:inline;padding:0}}
header{text-align:center;padding:${sp(72)}px 24px ${sp(60)}px}
/* v125: min-height is set INLINE (it depends on hero.height), so the padding here is only
   breathing room, not the thing that sizes the box. Before, padding WAS the height — and
   cover cropped the photo to whatever accidental shape the text made. */
header.hero{padding:${sp(48)}px 24px}
/* v127: the photo is a real img layer, not a background — background-size cover is a
   keyword and cannot be multiplied, so it cannot carry a zoom. object-fit plus
   transform:scale can. overflow:hidden on the header (set inline) clips the excess. */
.hero-bg{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0}
.hero-scrim{position:absolute;inset:0;z-index:1;pointer-events:none}
/* Every direct child of the hero that is NOT the photo or the scrim must sit ABOVE them,
   or the names render behind the picture and vanish. */
header.hero>*{position:relative;z-index:2}
header.hero>.hero-bg{position:absolute;z-index:0}
header.hero>.hero-scrim{position:absolute;z-index:1}
/* object-position needs a box to position within, which needs a fixed aspect. Without it,
   the img is its own natural height and there is nothing to shift. */
.hero-below{display:block;width:100%;max-width:820px;margin:${sp(28)}px auto 0;border-radius:${imgRad};aspect-ratio:3/2;object-fit:cover}
/* The hero ink applies to the NAMES. It does NOT apply to the button — the button has its
   own colour, and being swept into this selector is what made it hardcoded white on every
   hero, invisible on a pale photo, and unfixable from the theme editor. .ics is NOT listed
   here, and must not be re-added. */
header.hero h1,header.hero .eyebrow,header.hero .lead,header.hero .sub{color:#fff;text-shadow:0 1px 18px rgba(0,0,0,.35)}
header.hero.heroink-dark h1,header.hero.heroink-dark .eyebrow,header.hero.heroink-dark .lead,header.hero.heroink-dark .sub{color:#241F1A;text-shadow:0 1px 14px rgba(255,255,255,.45)}
/* The Save-the-date button draws itself in theme.button, in the chosen treatment, in EVERY
   context — on the photo, off the photo, everywhere. The colour you pick is the colour you
   get; the preview shows you the result. A shadow keeps it legible on a busy photo without
   overriding the colour. */
.ics{display:inline-flex;align-items:center;gap:7px;margin-top:${sp(18)}px;padding:${btnPad};${BTN};border-radius:${rad};text-decoration:none;font-size:${btnFs}px;letter-spacing:.1em;text-transform:uppercase;box-shadow:${btnShadFull}}
header.hero .ics{box-shadow:0 2px 14px rgba(0,0,0,.22)}
.ics svg{width:${scb(14)}px;height:${scb(14)}px;flex-shrink:0}
.maplink{white-space:nowrap;margin-left:8px;color:${t2.accent};text-decoration:none;font-size:${scb(13)}px;border-bottom:1px solid ${t2.accent}66}
.navtoggle{display:none}
h1{font-family:${t2.headFont};font-weight:400;font-size:clamp(${sch(34)}px,7vw,${sch(60)}px);line-height:1.1;margin-bottom:10px;color:${t2.heading}}
.eyebrow{font-size:${scb(11)}px;letter-spacing:.24em;text-transform:uppercase;color:${t2.accent}}
.lead{font-family:${t2.headFont};font-size:clamp(${sch(19)}px,3vw,${sch(24)}px);font-style:italic;margin-top:${sp(22)}px;max-width:34ch;margin-left:auto;margin-right:auto;color:${t2.heading}}
.sub{margin-top:${sp(14)}px;max-width:52ch;margin-left:auto;margin-right:auto;color:${t2.text};font-size:${scs(15)}px}
section{max-width:${t2.maxWidth||720}px;margin:0 auto;padding:${secPad}px ${secPadH}px;background:${t2.page};border-top:${secGap>0?'none':`1px solid ${t2.heading}12`};text-align:${secAlign}${secBorder}${secShadow?';'+secShadow:''}}
section+section{margin-top:${secGap}px}
section.lft{text-align:left}
section.band{max-width:none;background:${t2.band};border-top:none}
section.band>*{max-width:${t2.maxWidth||720}px;margin-left:auto;margin-right:auto}
h2{font-family:${t2.headFont};font-weight:400;font-size:clamp(${sch(24)}px,4vw,${sch(32)}px);margin-bottom:${sp(12)}px;color:${t2.heading}}
.intro{max-width:52ch;margin:0 auto ${sp(24)}px;color:${t2.text};font-size:${scs(15)}px}
section.lft .intro{margin-left:0}
h2+.imgs-grid,h2+.imgs-rows,.intro+.imgs-grid,.intro+.imgs-rows{margin-top:${sp(18)}px}
.para{max-width:60ch;margin:0 auto ${sp(16)}px;font-size:${scs(16)}px;text-align:${(['left','center','justify'].includes(t2.bodyAlign)?t2.bodyAlign:'left')};${t2.bodyAlign==='justify'?'hyphens:auto;-webkit-hyphens:auto;':''}color:${t2.text}}
section.lft .para{margin-left:0}
section.b-center .para{text-align:center}
section.b-justify .para{text-align:justify;hyphens:auto;-webkit-hyphens:auto}
section.b-justify .intro{text-align:justify;hyphens:auto;-webkit-hyphens:auto}
dl{text-align:left}
dl div{display:flex;gap:18px;padding:${sp(12)}px 0;border-bottom:1px solid ${t2.heading}12}
dl div:last-child{border-bottom:none}
dt{font-size:${scb(11)}px;letter-spacing:.14em;text-transform:uppercase;color:${t2.accent};width:100px;flex-shrink:0;padding-top:4px}
dd{flex:1;font-size:${scs(15)}px}
/* Centring a structured row means STACKING it. A plain text-align:center on a flex row
   leaves the label and the value side by side and drifts both — the column is gone and
   nothing is actually centred. The row has to become a column first. */
section.b-center dl div{flex-direction:column;gap:2px;text-align:center}
section.b-center dt{width:auto;padding-top:0}
.ed-details{text-align:center;padding:${sp(8)}px 0}
.ed-date{font-family:${t2.headFont};font-size:${sch(22)}px;font-weight:600;color:${t2.item};margin:0 0 ${sp(4)}px}
.ed-venue{font-family:${t2.headFont};font-size:${sch(19)}px;font-weight:600;color:${t2.item};margin:${sp(16)}px 0 ${sp(4)}px}
.ed-sub{font-size:${scs(14)}px;color:${t2.text};opacity:.7;margin:0 0 ${sp(2)}px}
.sched{list-style:none}
section.lft .sched{text-align:left}
/* When section heading is centred (no .lft), constrain the timeline list width and
   centre it so it doesn't hang left against a centred heading. */
section:not(.lft) .sched{max-width:520px;margin-left:auto;margin-right:auto}
.sched li{display:flex;gap:18px;padding:${sp(14)}px 0;border-bottom:1px solid ${t2.heading}12}
.sched li:last-child{border-bottom:none}
.sched .t{width:82px;flex-shrink:0;font-size:${scb(13)}px;letter-spacing:.06em;color:${t2.accent};padding-top:3px}
.sched .d{flex:1;font-size:${scs(15)}px}
section.b-center .sched{text-align:center}
section.b-center .sched li{flex-direction:column;gap:2px;text-align:center}
section.b-center .sched .t{width:auto;padding-top:0}
.sched .d b{display:block;font-family:${t2.headFont};font-size:${sch(20)}px;font-weight:500;color:${t2.item}}
.sched .d i{display:block;font-style:normal;font-size:${scs(13)}px;color:${t2.text};opacity:.75;margin-top:1px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.grid img{width:100%;aspect-ratio:1;object-fit:cover;display:block;border-radius:${imgRad}}
/* v148 gallery grid layouts. Centre: fixed-width tiles that keep their size and sit centred
   (a short last row is middled, not left-hung). Rows: one photo per row, full width, tall and
   immersive; best for a curated few. Default (no extra class) is the pre-v148 stretch grid. */
.grid-center{grid-template-columns:repeat(auto-fit,minmax(150px,160px));justify-content:center}
.grid-rows{display:flex;flex-direction:column;align-items:center;gap:${sp(12)}px}
.grid-rows img{width:100%;max-width:${scb(560)}px;aspect-ratio:16/10;height:auto}
/* Stretch (auto-fill + 1fr): tiles grow to fill the row. Two photos become two half-width
   tiles. Centre (auto-fit at a fixed 160px + justify-content): tiles keep their size and
   sit in the middle. The 1fr must go — a fractional unit IS the instruction to fill. */
/* ── v133 blocks. NO BACKTICKS IN THESE COMMENTS: this is inside _wbBuildSite()'s template
   literal, where a backtick is live syntax even in a comment. It has bitten three times. */
.lks{display:flex;flex-direction:column;align-items:center;gap:2px;margin:${sp(18)}px 0}
.lks .lk{display:inline-block;padding:${sp(7)}px 2px;color:${t2.accent};text-decoration:none;
  border-bottom:1px solid ${t2.accent}55;font-size:${scb(14)}px;width:fit-content}
.lks .lk-dead{color:${t2.text};border-bottom:none;opacity:.75}
section.b-left .lks,section.b-justify .lks{align-items:flex-start}
.lks-rows{list-style:none;margin:${sp(18)}px 0;padding:0}
.lks-rows li{display:flex;justify-content:space-between;align-items:baseline;gap:16px;
  padding:${sp(12)}px 0;border-bottom:1px solid ${t2.heading}12;text-align:left}
.lks-rows b{font-family:${t2.headFont};font-weight:500;font-size:${sch(17)}px;color:${t2.item}}
.lks-rows a{color:${t2.accent};text-decoration:none;font-size:${scb(12.5)}px;white-space:nowrap;
  border-bottom:1px solid ${t2.accent}55}
.btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:${sp(20)}px 0}
section.b-left .btns,section.b-justify .btns{justify-content:flex-start}
.btns .ics{margin-top:0}
/* The embed is responsive by ratio, not by a fixed height -- a 16:9 iframe at a fixed
   height letterboxes itself on a phone. */
.vid-embed{position:relative;width:100%;aspect-ratio:16/9;margin:${sp(20)}px 0;border-radius:${imgRad};overflow:hidden;background:${t2.band}}
.vid-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}
.vid-cap{font-size:${scb(12.5)}px;color:${t2.text};opacity:.75;margin-top:${sp(8)}px}
.vid-link{position:relative;display:block;margin:${sp(20)}px 0;border-radius:${imgRad};overflow:hidden;text-decoration:none}
.vid-link img{width:100%;display:block;aspect-ratio:16/9;object-fit:cover}
.vid-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:56px;height:56px;
  border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;
  color:${t2.heading};box-shadow:0 2px 14px rgba(0,0,0,.28)}
.vid-play svg{width:24px;height:24px;margin-left:3px}
.vid-cap-over{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);color:#fff;
  font-size:${scb(11.5)}px;padding:7px 10px;text-align:center}
.vid-plain{margin:${sp(18)}px 0}
.vid-plain a{color:${t2.accent};text-decoration:none;border-bottom:1px solid ${t2.accent}55;font-size:${scb(14)}px}
.dv{border:none;margin:${sp(26)}px auto}
.dv-line{width:56%;border-top:1px solid ${t2.accent}44;height:0}
.dv-dots{color:${t2.accent};letter-spacing:.5em;font-size:${scb(13)}px;text-align:center;opacity:.8}
.dv-leaf{display:flex;align-items:center;gap:14px;width:64%}
.dv-leaf span{flex:1;height:1px;background:${t2.accent}44}
.dv-leaf i{color:${t2.accent};font-style:normal;font-size:${scb(15)}px;line-height:1}
.imgs-grid{display:grid;grid-template-columns:repeat(var(--n,3),1fr);gap:8px;margin:${sp(22)}px 0}
.imgs-grid.ctr{grid-template-columns:repeat(var(--n,3),minmax(0,160px));justify-content:center}
.imgs-grid img{width:100%;aspect-ratio:1;object-fit:cover;display:block;border-radius:${imgRad}}
.imgs-rows{display:flex;flex-direction:column;gap:12px;margin:${sp(22)}px 0}
.imgs-rows img{width:100%;height:auto;display:block;border-radius:${imgRad}}
/* Per-block image SHAPE. Overrides the theme's ${rad} because it is a deliberate choice
   about THESE images, not a site-wide corner style. Absent class = theme default. */
.sh-square img{border-radius:0!important}
.sh-round img{border-radius:50%!important}
/* ORIGINAL shows images at their natural aspect ratio — no crop, no squash. */
.sh-original.imgs-grid img{aspect-ratio:auto;height:auto;object-fit:initial}
/* CIRCLE FORCES A SQUARE CROP. A rows image is height:auto — its natural proportions —
   and a 50% radius on a landscape photo makes an ELLIPSE. Cropping loses the edges of the
   frame; squashing distorts the faces IN it. Crop. */
.sh-round.imgs-rows img{aspect-ratio:1;height:auto;object-fit:cover}
header .imgs-grid,header .imgs-rows{max-width:560px;margin-left:auto;margin-right:auto}
.count .imgs-grid,.count .imgs-rows{max-width:560px;margin-left:auto;margin-right:auto}
/* An images block set to Left or Right pairs with the block after it. Grid, not float:
   a float would let a short paragraph run out from under the photo and leave the next
   block wrapping around it, which is not what anybody drew. */
.beside{display:grid;grid-template-columns:38% 1fr;gap:${sp(22)}px;align-items:center;margin:${sp(22)}px 0}
.beside .bes-t{min-width:0}
.beside .imgs-grid,.beside .imgs-rows{margin:0}
.beside .imgs-grid{grid-template-columns:1fr;gap:8px}
.beside .bes-t>:first-child{margin-top:0}
.beside .bes-t>:last-child{margin-bottom:0}
/* AND IT STACKS ON A PHONE. A 38% column of image beside a 62% column of text is
   unreadable at 380px, and most guests open a wedding site on a phone. Below 700px the
   grid collapses to one column and Left and Right both simply mean "above" — which is
   said out loud in the builder, next to the control, rather than discovered later. */
@media(max-width:700px){
  .beside{grid-template-columns:1fr;gap:${sp(14)}px}
  .beside .imgs-grid{grid-template-columns:1fr}
}
.count p:not(.intro):not(.edit-eyebrow){font-family:${t2.headFont};font-size:clamp(${sch(26)}px,5vw,${sch(38)}px);color:${t2.accent}}
.stays{list-style:none;text-align:left}
section.b-center .stays{text-align:center}
.stays li{padding:${sp(14)}px 0;border-bottom:1px solid ${t2.heading}12}
.stays li:last-child{border-bottom:none}
.stays b{font-family:${t2.headFont};font-size:${sch(20)}px;font-weight:500;display:block;color:${t2.item}}
.stays i{font-style:normal;font-size:${scs(13)}px;color:${t2.text};opacity:.75;display:block;margin-top:2px}
.stays a{color:${t2.accent};font-size:${scb(13)}px;text-decoration:none;border-bottom:1px solid ${t2.accent}66;display:inline-block;margin-top:6px}
.faq{text-align:left}
section.b-center .faq{text-align:center}
/* On Justify, only the ANSWER justifies. A one-line question stretched to both margins
   is not "justified", it's broken — justification needs enough words to distribute. */
section.b-justify .faq p{text-align:justify;hyphens:auto;-webkit-hyphens:auto}
.faq details{border-bottom:1px solid ${t2.heading}12}
.faq details:last-child{border-bottom:none}
.faq summary{list-style:none;cursor:pointer;display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:${sp(14)}px 0;-webkit-tap-highlight-color:transparent}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';flex-shrink:0;font-family:${t2.bodyFont};font-size:${scb(18)}px;font-weight:300;line-height:1;color:${t2.accent};opacity:.8}
.faq details[open] summary::after{content:'\\2013'}
section.b-center .faq summary{justify-content:center}
section.b-center .faq summary::after{position:absolute;right:0}
section.b-center .faq details{position:relative}
.faq b{font-family:${t2.headFont};font-size:${sch(19)}px;font-weight:500;display:block;color:${t2.item}}
.faq p{color:${t2.text};opacity:.85;font-size:${scs(15)}px;margin:0 0 ${sp(14)}px}
.faq-static .faq-i{border-bottom:1px solid ${t2.heading}12;padding:${sp(14)}px 0}
.faq-static .faq-i:last-child{border-bottom:none}
.faq-static .faq-i b{font-family:${t2.headFont};font-size:${sch(19)}px;font-weight:500;display:block;color:${t2.item};margin-bottom:4px}
.faq-static .faq-i p{margin:0}
footer{text-align:center;padding:${sp(44)}px 24px;font-size:${scb(11)}px;letter-spacing:.14em;text-transform:uppercase;color:${t2.text};opacity:.7;border-top:1px solid ${t2.heading}12}
/* The attribution lockup. The mark holds its OWN colours and its OWN font — it does not
   take the couple's. A mark that renders in their heading colour and their heading font is
   not a mark; it is a label, and it is a different label on every site. Only the LABEL
   above it ("Website made with") is theirs, because that is their sentence, not our name. */
.madewith{margin-top:${sp(22)}px;display:flex;flex-direction:column;align-items:center;gap:8px;text-transform:none;letter-spacing:0}
.mw-lbl{font-family:${t2.bodyFont};font-size:${scb(10)}px;letter-spacing:.08em;color:${t2.text};opacity:.75}
.mw-lock{display:inline-flex;align-items:center;gap:7px}
.mw-crest{width:${scb(26)}px;height:auto;display:block;flex-shrink:0}
.mw-txt{display:flex;flex-direction:column;align-items:flex-start;line-height:1.05;font-family:'Cinzel',serif;font-weight:400}
.mw-txt b{font-size:${scb(13)}px;letter-spacing:.1em;font-weight:400;color:${brand.main}}
.mw-txt i{font-size:${scb(9)}px;letter-spacing:.18em;font-style:normal;color:${brand.sub}}
@media(max-width:520px){
  dl div{flex-direction:column;gap:2px}
  dt{width:auto;padding-top:0}
  .sched li{gap:12px}
  .sched .t{width:66px;font-size:${scb(12)}px}
  header.hero{padding:${sp(32)}px 20px}
  .maplink{display:block;margin:6px 0 0}
  /* The collapsed nav is opt-IN, via the .js class the site's own script adds. Without
     JS none of this fires and the nav stays the plain wrapping list it is today — a menu
     button that cannot open is worse than a nav that takes three lines. */
  nav.js{display:block;text-align:center;padding:${sp(12)}px}
  nav.js .navtoggle{display:inline-flex;align-items:center;gap:8px;background:none;border:0;padding:6px 10px;cursor:pointer;color:${t2.heading};font-family:inherit;font-size:${scb(11)}px;letter-spacing:.14em;text-transform:uppercase}
  nav.js .navtoggle svg{width:${scb(16)}px;height:${scb(16)}px}
  nav.js .navlinks{display:none;flex-direction:column;gap:0;padding-top:${sp(6)}px}
  nav.js.open .navlinks{display:flex}
  nav.js .navlinks a{padding:11px 0;font-size:${scb(12)}px}
}
${t2.format==='editorial'?`
.edit-eyebrow{font-size:${scb(10)}px;letter-spacing:.24em;text-transform:uppercase;color:${t2.accent};margin:0 0 ${sp(10)}px;opacity:.8;font-family:${t2.bodyFont}}
section.lft .edit-eyebrow{text-align:left}
h2{font-weight:300!important;letter-spacing:.04em!important}
h2::after{content:'';display:block;width:44px;height:1px;background:${t2.accent};opacity:.55;margin:${sp(12)}px auto 0}
section.lft h2::after{margin-left:0;margin-right:auto}
.intro{font-weight:300;letter-spacing:.03em}
dl dt{font-size:${scb(9.5)}px!important;opacity:.5!important;letter-spacing:.18em!important}
`:''}
${_wbCssSafe(t2.css)}
</style></head>
<body${t2.navPos==='side'?' class="sidenav"':''}>
${nav?`<nav>${nav}</nav>`:''}
${t2.navPos==='side'?`<div class="site-content"><main>${blocks}</main></div>`:`<main>${blocks}</main>`}
<footer>
  ${_escHtml(_wbCouple())}
  ${w.brandOff ? '' : `<div class="madewith">
    <span class="mw-lbl">Website made with</span>
    <a class="mw-lock" href="https://unionvault.app" target="_blank" rel="noopener" aria-label="Union Vault" style="text-decoration:none">
      <img class="mw-crest" src="${brand.crest==='dark'?WB_CREST_DARK:WB_CREST_LIGHT}" alt="" width="26" height="24"/>
      <span class="mw-txt"><b>UNION</b><i>VAULT</i></span>
    </a>
  </div>`}
</footer>
${_uvModal}
<script>
(function(){
  var n=document.querySelector('nav'), b=n&&n.querySelector('.navtoggle');
  // The .js class is what ARMS the collapsed-nav CSS. It is added here, at runtime, so a
  // guest with JS disabled never sees a menu button that cannot open — they get the plain
  // wrapping nav instead. The button exists in the markup either way; only the CSS that
  // hides the links behind it is conditional.
  if(n&&b){
    n.className='js';
    b.addEventListener('click',function(){
      var open=n.classList.toggle('open');
      b.setAttribute('aria-expanded',open?'true':'false');
    });
    n.querySelectorAll('.navlinks a').forEach(function(a){
      a.addEventListener('click',function(){ n.classList.remove('open'); b.setAttribute('aria-expanded','false'); });
    });
  }
  // Which map app to open is a fact about the GUEST's device, not the device this file was
  // built on — so it is decided here, on load, not baked in at build time. The href already
  // points at Google Maps (which works everywhere); Apple devices get rewritten.
  if(/iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(navigator.userAgent||'')){
    document.querySelectorAll('.maplink').forEach(function(a){
      a.href='https://maps.apple.com/?q='+encodeURIComponent(a.getAttribute('data-addr')||'');
    });
  }
})();
<\/script>
</body></html>`;
}

// A "Save the date" calendar file, as a data: URL. Returns '' when there is no date —
// the button then isn't rendered at all, rather than offering an empty appointment.
//
// iCalendar is fussier than it looks and it fails SILENTLY: a calendar app that dislikes
// the file simply doesn't import it, with no error anywhere. So: CRLF line endings (the
// spec requires them, and some Outlook versions genuinely reject LF), commas and
// semicolons escaped inside text values, and DTEND set to the day AFTER the date because
// an all-day VEVENT's end is exclusive — omit that and the entry lands on the wrong day.
function _wbIcs(){
  const e=STATE.event||{};
  if(!e.date) return '';
  const d=String(e.date).replace(/-/g,'');
  if(!/^\d{8}$/.test(d)) return '';
  if(isNaN(new Date(e.date+'T00:00:00'))) return '';
  const esc=(s)=>String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
  const where=[e.venue, e.venueAddress].filter(Boolean).join(', ');
  const title=(_wbCouple()||'Our Wedding')+"'s Wedding";
  // Find ceremony start from timeline; use last moment's time + 1 hr as end
  const sorted=(STATE.timeline||[]).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  const cerMom=sorted.find(m=>m.cat==='ceremony'||/ceremony/i.test(m.title||''));
  const cerTime=cerMom&&cerMom.time;
  const lastTime=(sorted[sorted.length-1]||{}).time;
  let dtStart, dtEnd;
  if(cerTime && /^\d{2}:\d{2}$/.test(cerTime)){
    const [ch,cm]=cerTime.split(':').map(Number);
    dtStart='DTSTART:'+d+'T'+String(ch).padStart(2,'0')+String(cm).padStart(2,'0')+'00';
    let endH, endM;
    if(lastTime && lastTime!==cerTime && /^\d{2}:\d{2}$/.test(lastTime)){
      const [lh,lm]=lastTime.split(':').map(Number);
      endH=Math.min(lh+1,23); endM=lm;
    } else {
      endH=Math.min(ch+4,23); endM=cm;
    }
    dtEnd='DTEND:'+d+'T'+String(endH).padStart(2,'0')+String(endM).padStart(2,'0')+'00';
  } else {
    // No ceremony time — fall back to all-day
    const nx=new Date(e.date+'T00:00:00');
    nx.setDate(nx.getDate()+1);
    const end=nx.getFullYear()+String(nx.getMonth()+1).padStart(2,'0')+String(nx.getDate()).padStart(2,'0');
    dtStart='DTSTART;VALUE=DATE:'+d;
    dtEnd='DTEND;VALUE=DATE:'+end;
  }
  const lines=[
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Union Vault//Wedding//EN','BEGIN:VEVENT',
    'UID:'+d+'-elegantaffair@local',
    'DTSTAMP:'+d+'T000000Z',
    dtStart, dtEnd,
    'SUMMARY:'+esc(title),
    where?('LOCATION:'+esc(where)):'',
    'END:VEVENT','END:VCALENDAR'
  ].filter(Boolean);
  return 'data:text/calendar;charset=utf-8,'+encodeURIComponent(lines.join('\r\n')+'\r\n');
}

// Every media id the guest site renders: the gallery, plus both slots of every section.
// If this list misses an id, that image downloads as a dead blob: URL.
function _wbAllSiteMedia(){
  const w=_wbSite();
  const ids=_wbGalleryItems().map(i=>i.image);
  // The hero. Added in v120 — and this is exactly the line that, if forgotten, ships a
  // downloaded site with a broken header image. One function, one place to remember.
  if(w.hero && w.hero.mediaId) ids.push(w.hero.mediaId);
  // v126: BLOCKS. This is the FOURTH consecutive version in which forgetting to teach
  // this one function about a new image location would ship a downloaded site full of
  // dead blob: URLs. It is the single place that knows what media the site references.
  //
  // Hidden blocks are collected too. A hidden block is still in STATE, and Mandy can
  // unhide it in the downloaded file's next build without re-exporting her photos —
  // whereas a photo left out of the inline map is gone from that file forever.
  w.order.forEach(k=>{
    if(!_wbHasBlocks(k)) return;
    _wbBlocks(k).forEach(b=>{
      if(b.type==='img' && Array.isArray(b.ids)) b.ids.forEach(id=>ids.push(id));
      // v133: a VIDEO POSTER is a media id like any other. FIFTH consecutive version in
      // which forgetting this one function would ship a downloaded site with a dead
      // blob: URL — and the PREVIEW would look fine, because it reads live state. That is
      // the one place a bug can hide: behind a preview that says it didn't happen.
      if(b.type==='video' && b.poster) ids.push(b.poster);
    });
  });
  // Home is the one section with no block list — it is a <header> — so it still reads
  // its old top/bottom slots, and they still have to be collected. Dropping this loop
  // would make every existing Home photo vanish from the downloaded site while still
  // appearing in the preview: the worst kind of bug, because the preview says it worked.
  ['top','bottom'].forEach(slot=>{
    const b=((w.images||{}).home||{})[slot];
    if(b && Array.isArray(b.ids)) b.ids.forEach(id=>ids.push(id));
  });
  return ids.filter((id,i)=>id && !_mediaMissing(id) && ids.indexOf(id)===i);
}
async function _wbDownload(){
  const map={};
  for(const mid of _wbAllSiteMedia()){
    const url=_mediaUrl(mid);
    if(!url || /^https?:|^data:/.test(url)) continue;
    try{
      const blob=await (await fetch(url)).blob();
      map[url]=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(blob); });
    }catch(_){}
  }
  let html=_wbBuildSite(true);
  Object.keys(map).forEach(u=>{ html=html.split(u).join(map[u]); });
  const blob=new Blob([html], {type:'text/html'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=String(_wbCouple()).replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'')+'_website.html';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function renderWishingWell(c, actions){
  // Silently backfill missing addresses from guest list on every WW render
  // Safe to run repeatedly — only modifies contributions that have no stored address
  const _wwResolveAddr=(name)=>{
    const nl=name.trim().toLowerCase();
    // 1. Direct individual match
    const direct=(STATE.guests||[]).find(g=>(g.name||'').trim().toLowerCase()===nl);
    if(direct&&(direct.address||'').trim()) return direct.address.trim();
    // 2. Couple / pair — reconstruct compound name the same way _guestNameList does
    if(nl.includes(' & ')){
      const guests=STATE.guests||[];
      for(const g of guests){
        if(!g.coupleId&&!g.plusOneId) continue;
        const partnerId=g.coupleId||g.plusOneId;
        const partner=guests.find(q=>q.id===partnerId);
        if(!partner) continue;
        if(g.id>=partnerId) continue;
        const n1=(g.name||'').trim(), n2=(partner.name||'').trim();
        if(!n1||!n2) continue;
        const w1=n1.split(/\s+/), w2=n2.split(/\s+/);
        const minLen=Math.min(w1.length,w2.length);
        let suffixLen=0;
        for(let s=1;s<minLen;s++){
          if(w1.slice(-s).join(' ').toLowerCase()===w2.slice(-s).join(' ').toLowerCase()) suffixLen=s;
        }
        let coupleName;
        if(suffixLen>0){
          coupleName=(w1.slice(0,-suffixLen).join(' ')+' & '+w2.slice(0,-suffixLen).join(' ')+' '+w1.slice(-suffixLen).join(' ')).trim();
        } else {
          coupleName=(n1+' & '+n2).trim();
        }
        if(coupleName.toLowerCase()===nl){
          const addr=(g.address||'').trim()||(partner.address||'').trim();
          if(addr) return addr;
        }
      }
    }
    // 3. Family/household
    const fam=(STATE.families||[]).find(f=>(f.name||'').trim().toLowerCase()===nl);
    if(fam&&(fam.address||'').trim()) return fam.address.trim();
    return '';
  };
  let _backfilled = false;
  (STATE.wishingwell.contributions||[]).forEach(contrib=>{
    if((contrib.address||'').trim()) return; // already has an address stored
    const resolved=_wwResolveAddr((contrib.name||'').trim());
    if(resolved){ contrib.address=resolved; _backfilled=true; }
  });
  if(_backfilled) saveToStorage();

  const ww = STATE.wishingwell;
  const total = _wwTotal();
  const goal = Number(ww.goal)||0;
  const pct = goal>0 ? Math.min(100, Math.round((total/goal)*100)) : 0;
  const count = (ww.contributions||[]).length;
  const thanksDue = _wwThanksDue();

  actions.innerHTML = `<div id="ww-print-wrap" style="position:relative;display:inline-flex"><button class="btn-icon" onclick="_wwTogglePrintMenu(event)" title="Print options" aria-label="Print options" aria-haspopup="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></button><div id="ww-print-menu" style="display:none;position:absolute;top:calc(100% + 6px);right:0;z-index:60;width:215px;background:var(--cream);border:1px solid var(--border);border-radius:11px;box-shadow:0 4px 24px rgba(26,26,24,.12);overflow:hidden"><button onclick="_wwClosePrintMenu();_wwPrintList()" style="width:100%;background:none;border:none;cursor:pointer;padding:11px 14px;text-align:left;font-size:12.5px;font-family:inherit;color:var(--ink);display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--border)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Print contribution list</button><button onclick="_wwClosePrintMenu();openWwPrintLabels()" style="width:100%;background:none;border:none;cursor:pointer;padding:11px 14px;text-align:left;font-size:12.5px;font-family:inherit;color:var(--ink);display:flex;align-items:center;gap:9px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Print post labels</button></div></div><button class="btn-icon" onclick="openWwSettings()" title="Wishing well settings" aria-label="Wishing well settings"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>`;

  const _tb=(id,label)=>`<button onclick="setWwTab('${id}')" style="font-size:13px;padding:8px 16px;border:none;cursor:pointer;${id!=='tracker'?'border-left:1px solid var(--border);':''}background:${wwTab===id?'var(--gold)':'transparent'};color:${wwTab===id?'#fff':'var(--muted)'};transition:all .15s">${label}</button>`;
  const tabs = `<div style="display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:22px;flex-wrap:wrap">
      ${_tb('tracker','Cash gifts')}${_tb('registry','Registry')}${_tb('preview','Public preview')}
    </div>`;

  const body = wwTab==='preview' ? _wwPreviewHtml(ww)
             : wwTab==='registry' ? _wwRegistryHtml(ww)
             : _wwTrackerHtml(ww, total, goal, pct, count, thanksDue);
  c.innerHTML = `<div style="max-width:780px;margin:0 auto">${tabs}${body}</div>`;
}

function _wwTrackerHtml(ww, total, goal, pct, count, thanksDue){
  const goalLine = goal>0 ? `Goal ${fmt(goal)}` : 'No goal set';
  const progress = goal>0 ? `<div style="height:9px;border-radius:6px;background:var(--surface);overflow:hidden;margin:10px 0 4px"><div style="width:${pct}%;height:100%;background:var(--gold);border-radius:6px;transition:width .3s"></div></div>
      <div style="font-size:11.5px;color:var(--muted)">${pct}% of goal</div>` : '';

  const stats = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:18px 0 22px">
      <div style="background:var(--surface);border-radius:10px;padding:12px 14px"><div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--ink)">${count}</div><div style="font-size:11px;color:var(--muted)">contributor${count===1?'':'s'}</div></div>
      <div style="background:var(--surface);border-radius:10px;padding:12px 14px"><div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--ink)">${thanksDue}</div><div style="font-size:11px;color:var(--muted)">thank-you${thanksDue===1?'':'s'} due</div></div>
    </div>`;

  const header = `<div style="background:var(--card,var(--cream));border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">
        <span style="font-size:13px;color:var(--muted)">Raised so far</span>
        <span style="font-size:12px;color:var(--muted)">${goalLine}</span>
      </div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:30px;color:var(--ink)">${fmt(total)}</div>
      ${progress}
      ${stats}
      <button class="btn btn-primary" onclick="openWwContribution()" style="display:inline-flex;align-items:center;gap:7px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Log a contribution</button>
    </div>`;

  const _wwSortFns = {
    newest: (a,b)=>(b.date||'').localeCompare(a.date||''),
    oldest: (a,b)=>(a.date||'').localeCompare(b.date||''),
    highest:(a,b)=>(Number(b.amount)||0)-(Number(a.amount)||0),
    lowest: (a,b)=>(Number(a.amount)||0)-(Number(b.amount)||0),
    name:   (a,b)=>(a.name||'').localeCompare(b.name||'')
  };
  const list = (ww.contributions||[]).slice().sort(_wwSortFns[wwSort]||_wwSortFns.newest);
  const _sortOpts=[['newest','Newest first'],['oldest','Oldest first'],['highest','Highest amount'],['lowest','Lowest amount'],['name','Name A–Z']];
  const sortBar = list.length>1 ? `<div style="display:flex;align-items:center;gap:9px;margin-bottom:12px;flex-wrap:wrap">
      <span style="font-size:12px;color:var(--muted);white-space:nowrap">Sort:</span>
      <select onchange="setWwSort(this.value)" style="font-size:12px;padding:4px 8px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--ink);cursor:pointer;outline:none">
        ${_sortOpts.map(([v,l])=>`<option value="${v}"${wwSort===v?' selected':''}>${l}</option>`).join('')}
      </select>
    </div>` : '';
  let listHtml;
  if(!list.length){
    listHtml = `<div class="empty-state"><div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div><div class="empty-state-text">No contributions logged yet.<br>Add one as gifts arrive.</div></div>`;
  } else {
    listHtml = sortBar+`<div style="display:flex;flex-direction:column;gap:8px">${list.map(_wwRowHtml).join('')}</div>`;
  }

  return header + listHtml;
}

function _wwInitials(name){ const p=String(name||'').trim().split(/\s+/).filter(Boolean); if(!p.length) return '?'; return ((p[0][0]||'')+(p.length>1?p[p.length-1][0]:'')).toUpperCase(); }

function _wwRowHtml(x){
  const thanked = !!x.thanked;
  const meta = [_wwMethodLabel(x.method), x.date?fmtBudgetDate(x.date):''].filter(Boolean).join(' · ');
  const thankBtn = thanked
    ? `<button onclick="toggleWwThanked('${x.id}')" title="Thanked — click to undo" aria-label="Thanked" style="background:none;border:none;cursor:pointer;color:var(--green,#5C8A4E);display:inline-flex;padding:4px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>`
    : `<button onclick="toggleWwThanked('${x.id}')" title="Mark thank-you sent" aria-label="Thank-you pending" style="background:none;border:none;cursor:pointer;color:var(--gold-deep);display:inline-flex;padding:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></button>`;
  const _resolveContribAddr=(x)=>{
    if((x.address||'').trim()) return x.address.trim();
    const nl=(x.name||'').trim().toLowerCase();
    // 1. Direct individual match
    const direct=(STATE.guests||[]).find(g=>(g.name||'').trim().toLowerCase()===nl);
    if(direct&&(direct.address||'').trim()) return direct.address.trim();
    // 2. Couple / pair — reconstruct the compound name and compare exactly
    if(nl.includes(' & ')){
      const guests=STATE.guests||[];
      for(const g of guests){
        if(!g.coupleId&&!g.plusOneId) continue;
        const partnerId=g.coupleId||g.plusOneId;
        const partner=guests.find(q=>q.id===partnerId);
        if(!partner) continue;
        // Only process the pair once (lower id wins)
        if(g.id>=partnerId) continue;
        // Reconstruct the compound name the same way _guestNameList does
        const n1=(g.name||'').trim(), n2=(partner.name||'').trim();
        if(!n1||!n2) continue;
        const w1=n1.split(/\s+/), w2=n2.split(/\s+/);
        const minLen=Math.min(w1.length,w2.length);
        let suffixLen=0;
        for(let s=1;s<minLen;s++){
          if(w1.slice(-s).join(' ').toLowerCase()===w2.slice(-s).join(' ').toLowerCase()) suffixLen=s;
        }
        let coupleName;
        if(suffixLen>0){
          coupleName=(w1.slice(0,-suffixLen).join(' ')+' & '+w2.slice(0,-suffixLen).join(' ')+' '+w1.slice(-suffixLen).join(' ')).trim();
        } else {
          coupleName=(n1+' & '+n2).trim();
        }
        if(coupleName.toLowerCase()===nl){
          const addr=(g.address||'').trim()||(partner.address||'').trim();
          if(addr) return addr;
        }
      }
    }
    // 3. Family/household exact match
    const fam=(STATE.families||[]).find(f=>(f.name||'').trim().toLowerCase()===nl);
    if(fam&&(fam.address||'').trim()) return fam.address.trim();
    return '';
  };
  const addr=_resolveContribAddr(x);
  const noteLine = x.note?`<span style="display:block;font-size:11px;color:var(--muted);font-style:italic;margin-top:2px">"${_wwEsc(x.note)}”</span>`:'';
  const addrLine = addr
    ? `<span style="display:block;font-size:11px;color:var(--muted);margin-top:3px"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${_wwEsc(addr)}</span>`
    : `<span style="display:block;font-size:11px;color:var(--gold-deep);margin-top:3px;cursor:pointer" onclick="closeDots();openWwContribution('${x.id}')"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Add address</span>`;
  return `<div style="display:flex;align-items:center;gap:12px;background:var(--card,var(--cream));border:1px solid var(--border);border-radius:11px;padding:11px 13px">
      <span style="width:32px;height:32px;border-radius:50%;background:var(--surface);color:var(--gold-deep);display:inline-flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;font-weight:500;align-self:flex-start;margin-top:1px">${_wwEsc(_wwInitials(x.name))}</span>
      <div style="flex:1;min-width:0;overflow:hidden">
        <span style="display:block;font-size:13.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_wwEsc(x.name||'Anonymous')}</span>
        <span style="display:block;font-size:11px;color:var(--muted)">${_wwEsc(meta)}</span>
        ${noteLine}${addrLine}
      </div>
      <div style="display:inline-flex;align-items:center;gap:4px;flex-shrink:0;align-self:flex-start;margin-top:1px">
        <span style="font-family:'Cormorant Garamond',serif;font-size:17px;color:var(--ink)">${fmt(Number(x.amount)||0)}</span>
        ${thankBtn}
        <div class="dots-menu">
          <button class="dots-btn" onclick="toggleDots(event,'wwdots-${x.id}')">···</button>
          <div class="dots-dropdown hidden" id="wwdots-${x.id}">
            <button onclick="closeDots();openWwContribution('${x.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
            <button class="danger" onclick="closeDots();deleteWwContribution('${x.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg> Delete</button>
          </div>
        </div>
      </div>
    </div>`;
}

let _wwRegTempImage = null;   /* media id staged by the picker, before Save */

function _wwStoreLinks(){
  const ww = STATE.wishingwell;
  if(!Array.isArray(ww.storeLinks)) ww.storeLinks = [];
  return ww.storeLinks;
}

/* Store-links strip (Mandy's management view). A store link is just a name + url. */
function _wwStoreLinksHtml(){
  const links = _wwStoreLinks();
  const chips = links.map(l=>`<span style="display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border);border-radius:7px;padding:5px 10px;font-size:12px;color:var(--ink);background:var(--cream)">
      ${_escHtml(l.name||'Store')}
      <button onclick="_wwDeleteStoreLink('${l.id}')" title="Remove" aria-label="Remove ${_escAttr(l.name||'store')}" style="border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:12px;padding:0;line-height:1;display:inline-flex">\u2715</button>
    </span>`).join('');
  return `<div style="border:1px solid var(--border);border-radius:10px;padding:11px 13px;margin-bottom:16px;background:var(--sw-bg)">
      <div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:8px">Store registries</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        ${chips}
        <button onclick="_wwOpenStoreLink()" style="font-size:11.5px;color:var(--gold-deep);border:1px dashed var(--sw-border);border-radius:7px;padding:5px 10px;background:transparent;cursor:pointer">+ Add store link</button>
      </div>
    </div>`;
}

function _wwOpenStoreLink(){
  const body = `<div style="display:flex;flex-direction:column;gap:12px">
    <div>
      <label class="form-label">Store name</label>
      <input type="text" id="wwsl-name" class="form-input" placeholder="e.g. Myer"/>
    </div>
    <div>
      <label class="form-label">Registry link</label>
      <input type="url" id="wwsl-url" class="form-input" placeholder="https://\u2026"/>
    </div>
    <div style="font-size:11.5px;color:var(--muted);line-height:1.5">Paste the web address of your registry at that store. Guests will get a button that opens it.</div>
  </div>`;
  openModal('Add store link', body,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-primary" onclick="_wwSaveStoreLink()">Add</button>`);
}
function _wwSaveStoreLink(){
  const name=(document.getElementById('wwsl-name').value||'').trim();
  let url=(document.getElementById('wwsl-url').value||'').trim();
  if(!name){ _showInfoToast('Give the store a name'); return; }
  if(!url){ _showInfoToast('Paste the registry link'); return; }
  /* A pasted link often omits the scheme ("myer.com.au/..."). Without one the browser
     treats it as a RELATIVE path and the guest button goes nowhere. Add https:// if the
     user didn't — but don't second-guess a scheme they DID type (http, even ftp). */
  if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url='https://'+url;
  _wwStoreLinks().push({ id:'sl'+Date.now()+Math.floor(Math.random()*1000), name, url });
  saveToStorage();
  closeModalDirect();
  navigate('wishingwell');
}
function _wwDeleteStoreLink(id){
  const links=_wwStoreLinks();
  const i=links.findIndex(x=>x.id===id);
  if(i>=0) links.splice(i,1);
  saveToStorage();
  navigate('wishingwell');
}

function _wwRegistry(){
  const ww = STATE.wishingwell;
  if(!Array.isArray(ww.registry)) ww.registry = [];
  return ww.registry;
}
function _wwRegReceived(){ return _wwRegistry().filter(i=>i.received).length; }

/* ── The Registry tab (Mandy's management view) ─────────────────────────────────────── */
function _wwRegistryHtml(ww){
  const items = _wwRegistry();
  const recv  = _wwRegReceived();
  const strip = _wwStoreLinksHtml();   /* store links show whether or not there are items */

  if(!items.length){
    return strip + `<div style="border:1px dashed var(--border);border-radius:14px;padding:38px 22px;text-align:center;max-width:420px;margin:0 auto">
      <div style="color:var(--muted);opacity:.6;margin-bottom:10px"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8"/></svg></div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:19px;color:var(--ink);margin-bottom:5px">No registry items yet</div>
      <div style="font-size:12.5px;color:var(--muted);line-height:1.6;margin-bottom:16px">Add things you'd love to receive — link to where guests can find them, and tick each one off as it arrives.</div>
      <button class="btn btn-primary" onclick="_wwOpenRegItem()">+ Add your first item</button>
    </div>`;
  }

  const cards = items.map(it=>{
    const url = it.image ? _mediaUrl(it.image) : '';
    const priceNote = [it.price?fmt(Number(it.price)||0):'', it.note||''].filter(Boolean).join(' \u00b7 ');
    const media = it.received
      ? `<div style="aspect-ratio:16/10;background:rgba(92,143,114,.16);display:flex;align-items:center;justify-content:center;color:var(--green)"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg></div>`
      : url
        ? `<div style="aspect-ratio:16/10;background:var(--surface);overflow:hidden"><img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"/></div>`
        : `<div style="aspect-ratio:16/10;background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--muted);opacity:.5"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;
    const sub = it.received
      ? `<div style="font-size:11.5px;color:var(--green);margin:2px 0 6px">Received${it.receivedFrom?` \u2014 from ${_escHtml(it.receivedFrom)}`:''}</div>`
      : `<div style="font-size:11.5px;color:var(--muted);margin:2px 0 6px">${_escHtml(priceNote)||'&nbsp;'}</div>`;
    const link = (!it.received && it.link)
      ? `<a href="${_escAttr(it.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="font-size:10.5px;color:var(--gold-deep);display:inline-flex;align-items:center;gap:3px;text-decoration:none"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>View</a>`
      : '';
    return `<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;background:${it.received?'var(--surface)':'var(--cream)'};cursor:pointer" onclick="_wwOpenRegItem('${it.id}')">
        ${media}
        <div style="padding:10px 11px">
          <div style="font-size:13px;color:var(--ink);font-weight:500">${_escHtml(it.name||'Untitled')}</div>
          ${sub}
          <div style="display:flex;align-items:center;gap:6px">${link}<span style="margin-left:auto;color:var(--muted);opacity:.7"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></span></div>
        </div>
      </div>`;
  }).join('');

  return `<div>
    ${strip}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap">
      <span style="font-size:12.5px;color:var(--muted)">${items.length} item${items.length===1?'':'s'}${recv?` \u00b7 ${recv} received`:''}</span>
      <button class="btn btn-primary btn-sm" onclick="_wwOpenRegItem()">+ Add item</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:11px">${cards}</div>
  </div>`;
}

/* ── Add / edit one item ────────────────────────────────────────────────────────────── */
function _wwOpenRegItem(id){
  const items = _wwRegistry();
  const it = id ? items.find(x=>x.id===id) : null;
  _wwRegTempImage = it && it.image ? it.image : null;
  const v = it || {};
  const imgUrl = _wwRegTempImage ? _mediaUrl(_wwRegTempImage) : '';

  const body = `<div style="display:flex;flex-direction:column;gap:12px">
    <div>
      <label class="form-label">Item name</label>
      <input type="text" id="wwr-name" class="form-input" value="${_escAttr(v.name||'')}" placeholder="e.g. Stand mixer"/>
    </div>
    <div style="display:flex;gap:10px">
      <div style="flex:1">
        <label class="form-label">Price <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <input type="number" id="wwr-price" class="form-input" value="${v.price!=null?_escAttr(String(v.price)):''}" placeholder="0" min="0"/>
      </div>
    </div>
    <div>
      <label class="form-label">Link to buy <span style="color:var(--muted);font-weight:400">(optional)</span></label>
      <input type="url" id="wwr-link" class="form-input" value="${_escAttr(v.link||'')}" placeholder="https://\u2026"/>
    </div>
    <div>
      <label class="form-label">Note <span style="color:var(--muted);font-weight:400">(optional)</span></label>
      <input type="text" id="wwr-note" class="form-input" value="${_escAttr(v.note||'')}" placeholder="e.g. in white if possible"/>
    </div>
    <div>
      <label class="form-label">Photo <span style="color:var(--muted);font-weight:400">(optional)</span></label>
      <div id="wwr-preview" style="display:${imgUrl?'block':'none'};margin-bottom:8px"><img id="wwr-preview-img" src="${imgUrl}" alt="" style="max-width:140px;border-radius:8px;display:block"/></div>
      <input type="file" accept="image/*" class="form-input" onchange="_wwRegUpload(event)" style="padding:6px;font-size:12px"/>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:12px">
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink);cursor:pointer">
        <input type="checkbox" id="wwr-received" ${v.received?'checked':''} onchange="document.getElementById('wwr-from-row').style.display=this.checked?'block':'none'" style="width:15px;height:15px;cursor:pointer;accent-color:var(--gold)"/>
        This gift has been received
      </label>
      <div id="wwr-from-row" style="display:${v.received?'block':'none'};margin-top:9px">
        <label class="form-label">From <span style="color:var(--muted);font-weight:400">(for thank-yous)</span></label>
        <input type="text" id="wwr-from" class="form-input" value="${_escAttr(v.receivedFrom||'')}" placeholder="e.g. Aunt Jo"/>
      </div>
    </div>
  </div>`;

  const footer = `${id?`<button class="btn btn-danger" style="margin-right:auto" onclick="_wwDeleteRegItem('${id}')">Delete</button>`:''}
    <button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
    <button class="btn btn-primary" onclick="_wwSaveRegItem('${id||''}')">Save</button>`;

  openModal(id?'Edit item':'Add registry item', body, footer);
  setTimeout(()=>{ if(document.getElementById('wwr-received')&&document.getElementById('wwr-received').checked) _nameAutocomplete('wwr-from'); document.getElementById('wwr-received').addEventListener('change',function(){ if(this.checked) setTimeout(()=>_nameAutocomplete('wwr-from'),60); }); }, 60);
}

function _wwRegUpload(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async ev=>{
    const compressed=await compressImage(ev.target.result);
    const mid=await _mediaPut(compressed, file.name, 'image/jpeg');
    _wwRegTempImage=mid;
    const p=document.getElementById('wwr-preview'), i=document.getElementById('wwr-preview-img');
    if(p)p.style.display='block';
    if(i)i.src=_mediaUrl(mid);
  };
  reader.readAsDataURL(file);
}

function _wwSaveRegItem(id){
  const items=_wwRegistry();
  const name=(document.getElementById('wwr-name').value||'').trim();
  if(!name){ _showInfoToast('Give the item a name first'); return; }
  const priceRaw=(document.getElementById('wwr-price').value||'').trim();
  const received=document.getElementById('wwr-received').checked;
  const rec = {
    name,
    price: priceRaw===''?null:Number(priceRaw),
    link: (document.getElementById('wwr-link').value||'').trim(),
    note: (document.getElementById('wwr-note').value||'').trim(),
    image: _wwRegTempImage||'',
    received,
    receivedFrom: received ? (document.getElementById('wwr-from').value||'').trim() : ''
  };
  if(id){
    const it=items.find(x=>x.id===id);
    if(it) Object.assign(it, rec);
  } else {
    rec.id='rg'+Date.now()+Math.floor(Math.random()*1000);
    rec.claimed=false;   /* built now; a guest sets this only once hosting exists */
    items.push(rec);
  }
  _wwRegTempImage=null;
  saveToStorage();
  closeModalDirect();
  navigate('wishingwell');
}

function _wwDeleteRegItem(id){
  _confirmDeleteDialog({
    title:'Delete this item?',
    question:'It will be removed from your registry and the public preview.',
    name:'', verb:'Delete',
    onConfirmJs:`_wwDeleteRegItemConfirmed('${id}')`
  });
}
function _wwDeleteRegItemConfirmed(id){
  const items=_wwRegistry();
  const i=items.findIndex(x=>x.id===id);
  if(i>=0) items.splice(i,1);
  saveToStorage();
  closeModalDirect();
  navigate('wishingwell');
}

function _wwPreviewHtml(ww){
  const p1 = STATE.event.partner1||'Partner one';
  const p2 = STATE.event.partner2||'Partner two';
  const dateLine = STATE.event.date ? fmtDate(STATE.event.date) : '';
  const suggested = (ww.suggested||[]).filter(n=>Number(n)>0);
  const chips = suggested.map((n,i)=>`<span style="font-size:12.5px;padding:8px 15px;border-radius:22px;${i===suggested.length-1?'background:var(--gold);color:#fff':'border:1px solid var(--border);color:var(--ink);background:var(--card,var(--cream))'}">${fmt(Number(n))}</span>`).join('')
    + `<span style="font-size:12.5px;padding:8px 15px;border-radius:22px;border:1px solid var(--border);color:var(--ink);background:var(--card,var(--cream))">Other</span>`;

  const payRows = [];
  if(ww.payId) payRows.push(`PayID&nbsp;&nbsp;<strong>${_wwEsc(ww.payId)}</strong>`);
  if(ww.bankBsb||ww.bankAcc) payRows.push(`Bank&nbsp;&nbsp;${ww.bankBsb?'BSB '+_wwEsc(ww.bankBsb)+'&nbsp;&nbsp;':''}${ww.bankAcc?'Acc '+_wwEsc(ww.bankAcc):''}`);
  if(ww.paypal) payRows.push(`PayPal&nbsp;&nbsp;<strong>${_wwEsc(ww.paypal)}</strong>`);
  if(ww.reference) payRows.push(`Reference&nbsp;&nbsp;<strong>${_wwEsc(ww.reference)}</strong>`);
  const payBlock = payRows.length
    ? `<div style="background:var(--surface);border-radius:12px;padding:14px 16px;margin:16px 0">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">How to contribute</div>
        <div style="font-size:13px;color:var(--ink);line-height:1.9">${payRows.join('<br>')}</div>
      </div>`
    : `<div style="background:var(--surface);border-radius:12px;padding:16px;margin:16px 0;text-align:center;font-size:12.5px;color:var(--muted)">Add your payment details in Settings to show them here.</div>`;

  return `<div style="background:var(--warning-bg,rgba(201,161,74,.10));border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:18px;font-size:12px;color:var(--muted);display:flex;align-items:center;gap:8px">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      This is a visual preview of how a public page would look. It doesn't process payments — guests pay via the details shown. Edit everything in Settings.
    </div>
    <div style="max-width:440px;margin:0 auto;background:var(--card,var(--cream));border:1px solid var(--border);border-radius:18px;overflow:hidden">
      <div style="background:var(--surface);padding:26px 22px;text-align:center;border-bottom:1px solid var(--border)">
        <div style="width:40px;height:40px;border-radius:50%;border:1.5px solid var(--gold);display:inline-flex;align-items:center;justify-content:center;color:var(--gold-deep);margin-bottom:10px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:23px;color:var(--ink)">${_wwEsc(p1)} &amp; ${_wwEsc(p2)}'s Wishing Well</div>
        ${dateLine?`<div style="font-size:12px;color:var(--muted);margin-top:4px">${_wwEsc(dateLine)}</div>`:''}
      </div>
      <div style="padding:20px 22px">
        <div style="font-size:13.5px;line-height:1.6;color:var(--ink);text-align:center;margin-bottom:18px">${_wwEsc(ww.message)}</div>
        ${suggested.length||true?`<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:18px">${chips}</div>`:''}
        ${payBlock}
        ${ww.closing?`<div style="text-align:center;font-size:12px;color:var(--muted);font-style:italic;margin-top:6px">${_wwEsc(ww.closing)}</div>`:''}
      </div>
      ${_wwRegistryPreviewHtml(ww)}
    </div>`;
}

/* The registry AS A GUEST SEES IT. Received items are hidden (a guest browsing gifts
   should not be shown ones already given). Claiming is not offered — that is a guest
   WRITE, and there is no server; the honest preview shows what will be there, and a note
   says the "claim" action arrives with hosting rather than a button that does nothing. */
function _wwRegistryPreviewHtml(ww){
  const items = (Array.isArray(ww.registry)?ww.registry:[]).filter(i=>!i.received);
  const stores = (Array.isArray(ww.storeLinks)?ww.storeLinks:[]).filter(l=>l && l.url);
  // Show the section if there is ANYTHING to show — items OR store links. A couple who
  // ONLY uses store registries still gets a registry section.
  if(!items.length && !stores.length) return '';

  // Store buttons sit ABOVE the items. The framing depends on what else is here: with no
  // manual items, "we're also registered at" reads oddly (also — as well as WHAT?), so
  // the copy shifts to make the stores the main event.
  const storeBtns = stores.length ? `<div style="margin-bottom:${items.length?'18px':'4px'}">
      <div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:10px">${items.length?"We're also registered at":'Browse our registries'}</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        ${stores.map(l=>`<a href="${_escAttr(l.url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--gold);border-radius:8px;padding:9px 18px;font-size:13px;color:var(--gold-deep);background:var(--cream);text-decoration:none">${_wwEsc(l.name||'Store')}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`).join('')}
      </div>
    </div>` : '';

  const cards = items.map(it=>{
    const url = it.image ? _mediaUrl(it.image) : '';
    const priceNote = [it.price?fmt(Number(it.price)||0):'', it.note||''].filter(Boolean).join(' \u00b7 ');
    const media = url
      ? `<div style="aspect-ratio:16/10;background:var(--surface);overflow:hidden"><img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"/></div>`
      : `<div style="aspect-ratio:16/10;background:var(--surface)"></div>`;
    const link = it.link
      ? `<a href="${_escAttr(it.link)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--gold-deep);text-decoration:none">View gift \u2192</a>`
      : '';
    return `<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--cream)">
        ${media}
        <div style="padding:10px 11px">
          <div style="font-size:13px;color:var(--ink);font-weight:500">${_wwEsc(it.name||'')}</div>
          ${priceNote?`<div style="font-size:11.5px;color:var(--muted);margin:2px 0 6px">${_wwEsc(priceNote)}</div>`:'<div style="height:6px"></div>'}
          ${link}
        </div>
      </div>`;
  }).join('');
  return `<div style="max-width:600px;margin:22px auto 0">
      <div style="text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--ink);margin-bottom:4px">Our Registry</div>
      ${items.length?`<div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:16px">A few things we'd love \u2014 no obligation at all.</div>`:'<div style="height:12px"></div>'}
      ${storeBtns}
      ${items.length?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:11px">${cards}</div>
      <div style="text-align:center;font-size:11px;color:var(--muted);opacity:.7;margin-top:12px;font-style:italic">Guests will be able to claim a gift here once your site is published.</div>`:''}
    </div>`;
}

// ── Contribution add/edit modal ──
let _wwEditId = null;
function openWwContribution(id){
  _wwEditId = id || null;
  const x = id ? (STATE.wishingwell.contributions||[]).find(c=>c.id===id) : null;
  const methods = ['payid','bank','paypal','cash','card','cheque','other'];
  const curMethod = x?x.method:'payid';
  const body = `<div style="display:flex;flex-direction:column;gap:14px">
      <div>
        <label class="form-label">From</label>
        <input type="text" id="ww-name" class="form-input" placeholder="Guest name" value="${x?_wwEsc(x.name):''}"/>
      </div>
      <div style="display:flex;gap:12px">
        <div style="flex:1">
          <label class="form-label">Amount</label>
          <input type="number" id="ww-amount" class="form-input" placeholder="0" min="0" step="0.01" value="${x&&x.amount!=null?x.amount:''}"/>
        </div>
        <div style="flex:1">
          <label class="form-label">Date</label>
          <input type="date" id="ww-date" class="form-input" value="${x&&x.date?x.date:_todayISO()}"/>
        </div>
      </div>
      <div>
        <label class="form-label">Method</label>
        <select id="ww-method" class="form-input">${methods.map(m=>`<option value="${m}" ${curMethod===m?'selected':''}>${_wwMethodLabel(m)}</option>`).join('')}</select>
      </div>
      <div>
        <label class="form-label">Note <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <input type="text" id="ww-note" class="form-input" placeholder="e.g. towards the honeymoon" value="${x?_wwEsc(x.note||''):''}"/>
      </div>
      <div>
        <label class="form-label">Address <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <input type="text" id="ww-address" class="form-input" placeholder="e.g. 12 Oak Street, Paddington QLD 4064" value="${x?_wwEsc(x.address||''):''}"/>
        <div id="ww-address-hint" style="font-size:11px;color:var(--muted);margin-top:4px;display:none">From guest profile — edit to override</div>
      </div>
      <label style="display:flex;align-items:center;gap:9px;font-size:13px;color:var(--ink);cursor:pointer">
        <input type="checkbox" id="ww-thanked" ${x&&x.thanked?'checked':''} style="width:15px;height:15px;cursor:pointer;accent-color:var(--gold)"/> Thank-you already sent
      </label>
    </div>`;
  const footer = `<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Cancel</button><button class="btn btn-primary btn-sm" onclick="saveWwContribution()">${id?'Save':'Add contribution'}</button>`;
  openModal(id?'Edit contribution':'Log a contribution', body, footer);
  setTimeout(()=>{
    _nameAutocomplete('ww-name');
    // When a name is picked from autocomplete, try to auto-fill address from guest profile
    const nameInp=document.getElementById('ww-name');
    const addrInp=document.getElementById('ww-address');
    const addrHint=document.getElementById('ww-address-hint');
    if(nameInp&&addrInp){
      // Helper: fill address from guest list if addr field is blank
      const _tryFillAddr=(name)=>{
        if((addrInp.value||'').trim()) return; // already has an address
        const nl=name.trim().toLowerCase();
        let addr='';
        // 1. Direct individual match
        const direct=(STATE.guests||[]).find(g=>(g.name||'').trim().toLowerCase()===nl);
        if(direct&&(direct.address||'').trim()) addr=direct.address.trim();
        // 2. Couple / pair — reconstruct compound name the same way _guestNameList does
        if(!addr&&nl.includes(' & ')){
          const guests=STATE.guests||[];
          for(const g of guests){
            if(!g.coupleId&&!g.plusOneId) continue;
            const partnerId=g.coupleId||g.plusOneId;
            const partner=guests.find(q=>q.id===partnerId);
            if(!partner) continue;
            if(g.id>=partnerId) continue;
            const n1=(g.name||'').trim(), n2=(partner.name||'').trim();
            if(!n1||!n2) continue;
            const w1=n1.split(/\s+/), w2=n2.split(/\s+/);
            const minLen=Math.min(w1.length,w2.length);
            let suffixLen=0;
            for(let s=1;s<minLen;s++){
              if(w1.slice(-s).join(' ').toLowerCase()===w2.slice(-s).join(' ').toLowerCase()) suffixLen=s;
            }
            let coupleName;
            if(suffixLen>0){
              coupleName=(w1.slice(0,-suffixLen).join(' ')+' & '+w2.slice(0,-suffixLen).join(' ')+' '+w1.slice(-suffixLen).join(' ')).trim();
            } else {
              coupleName=(n1+' & '+n2).trim();
            }
            if(coupleName.toLowerCase()===nl){
              addr=(g.address||'').trim()||(partner.address||'').trim();
              if(addr) break;
            }
          }
        }
        // 3. Family/household
        if(!addr){
          const fam=(STATE.families||[]).find(f=>(f.name||'').trim().toLowerCase()===nl);
          if(fam&&(fam.address||'').trim()) addr=fam.address.trim();
        }
        if(addr){ addrInp.value=addr; if(addrHint) addrHint.style.display='block'; }
      };
      // On open: if editing an existing contribution whose address is blank,
      // or a new contribution with a name already populated, pre-fill immediately
      const currentName=(nameInp.value||'').trim();
      if(currentName) _tryFillAddr(currentName);
      // When a name is picked from autocomplete (fires 'change') or typed manually
      const _onNameChange=()=>{
        const picked=(nameInp.value||'').trim();
        if(!picked) return;
        _tryFillAddr(picked);
      };
      nameInp.addEventListener('change', _onNameChange);
      nameInp.addEventListener('input', _onNameChange);
      // Hide hint if user edits address manually
      addrInp.addEventListener('input',()=>{ if(addrHint) addrHint.style.display='none'; });
    }
  }, 60);
}

function saveWwContribution(){
  const name = (document.getElementById('ww-name').value||'').trim();
  const amount = parseFloat(document.getElementById('ww-amount').value)||0;
  const date = document.getElementById('ww-date').value||_todayISO();
  const method = document.getElementById('ww-method').value||'other';
  const note = (document.getElementById('ww-note').value||'').trim();
  const address = (document.getElementById('ww-address').value||'').trim();
  const thanked = document.getElementById('ww-thanked').checked;
  if(!name && !amount){ closeModalDirect(); return; }
  if(!STATE.wishingwell.contributions) STATE.wishingwell.contributions=[];
  if(_wwEditId){
    const x = STATE.wishingwell.contributions.find(c=>c.id===_wwEditId);
    if(x){ x.name=name; x.amount=amount; x.date=date; x.method=method; x.note=note; x.address=address; x.thanked=thanked; }
  } else {
    STATE.wishingwell.contributions.push({ id:uid(), name, amount, date, method, note, address, thanked });
  }
  _wwEditId=null;
  saveToStorage();
  closeModalDirect();
  navigate('wishingwell');
}

function toggleWwThanked(id){
  const x = (STATE.wishingwell.contributions||[]).find(c=>c.id===id);
  if(x){ x.thanked=!x.thanked; saveToStorage(); navigate('wishingwell'); }
}

function deleteWwContribution(id){
  const x = (STATE.wishingwell.contributions||[]).find(c=>c.id===id);
  const name = x?(x.name||'this contribution'):'this contribution';
  openModal('Delete contribution?', `<div style="font-size:13.5px;line-height:1.5;color:var(--ink)">Remove ${_wwEsc(name)}${x&&x.amount?` (${fmt(Number(x.amount))})`:''} from your wishing well? This can't be undone.</div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button><button class="btn btn-primary" style="background:var(--red,#C0392B);border-color:var(--red,#C0392B)" onclick="_wwConfirmDelete('${id}')">Delete</button>`);
}
function _wwConfirmDelete(id){
  const _x0=(STATE.wishingwell.contributions||[]).find(c=>c.id===id);
  const _label=_x0?(_x0.name||'contribution'):'contribution';
  closeModalDirect();
  _undoableDelete(_label, ()=>{
    STATE.wishingwell.contributions = (STATE.wishingwell.contributions||[]).filter(c=>c.id!==id);
  }, 'wishingwell');
}

// ── Wishing Well print menu helpers ──
function _wwTogglePrintMenu(e){
  e.stopPropagation();
  const m=document.getElementById('ww-print-menu');
  if(!m) return;
  if(m.style.display==='block'){ m.style.display='none'; return; }
  m.style.display='block';
  const close=ev=>{ if(!m.contains(ev.target)){ m.style.display='none'; document.removeEventListener('click',close); } };
  setTimeout(()=>document.addEventListener('click',close),0);
}
function _wwClosePrintMenu(){
  const m=document.getElementById('ww-print-menu');
  if(m) m.style.display='none';
}

// ── Wishing Well label font-size helpers ──
function _wwFontSizes(labelH){
  const overhead=7.4;
  const sizes=[];
  for(let n=6;n<=14;n++){
    const addrPt=Math.max(6,n-2);
    if((2*n+3*addrPt)*0.441<=labelH-overhead) sizes.push(n);
  }
  return sizes.length?sizes:[6,7,8];
}
function _wwDefaultFontPt(labelH){ return labelH<28?8:labelH<35?9:10; }
function _wwUpdateFontSizes(){
  const ps=document.getElementById('wwlbl-preset');
  const fd=document.getElementById('wwlbl-fontpt');
  if(!ps||!fd) return;
  let labelH=38.1;
  if(ps.value==='custom'){
    const hEl=document.getElementById('wwlbl-custom-h');
    if(hEl&&parseFloat(hEl.value)>0) labelH=parseFloat(hEl.value);
  } else {
    const p=_LABEL_PRESETS.find(x=>x[0]===ps.value);
    if(p) labelH=p[5];
  }
  const sizes=_wwFontSizes(labelH);
  const cur=parseInt(fd.value)||_wwDefaultFontPt(labelH);
  fd.innerHTML=sizes.map(s=>`<option value="${s}"${s===cur?'selected':''}>${s}pt</option>`).join('');
  if(!sizes.includes(cur)) fd.value=sizes[Math.floor(sizes.length/2)]||sizes[0];
}
function _wwPresetChangeWw(){
  const ps=document.getElementById('wwlbl-preset');
  const cust=document.getElementById('wwlbl-custom-dims');
  if(ps&&cust) cust.style.display=ps.value==='custom'?'grid':'none';
  _wwUpdateFontSizes();
}

// ── Print contribution list ──
function _wwPrintList(){
  const contribs=(STATE.wishingwell.contributions||[]).slice().sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  if(!contribs.length){ alert('No contributions logged yet.'); return; }
  const total=contribs.reduce((s,c)=>s+(parseFloat(c.amount)||0),0);
  const fmt=v=>v!=null&&v!==''?('$'+parseFloat(v).toFixed(2)):'—';
  const rows=contribs.map((c,i)=>{
    const bg=i%2===0?'#FAF8F4':'#FFF';
    return `<tr style="background:${bg}">
      <td style="padding:6px 10px">${(c.name||'').replace(/&/g,'&amp;')}</td>
      <td style="padding:6px 10px;text-align:right">${fmt(c.amount)}</td>
      <td style="padding:6px 10px">${(c.method||'—').replace(/&/g,'&amp;')}</td>
      <td style="padding:6px 10px">${c.date||'—'}</td>
      <td style="padding:6px 10px;word-break:break-word">${(c.address||'').trim().replace(/&/g,'&amp;').replace(/</g,'&lt;')}</td>
      <td style="padding:6px 10px;text-align:center">${c.thanked?'✓':'—'}</td>
    </tr>`;
  }).join('');
  const htmlContent=`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Contribution List</title>
<style>
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1A1A18;margin:0;padding:20px}
h1{font-size:16px;font-weight:700;margin-bottom:4px}
.subtitle{font-size:11px;color:#6B6B69;margin-bottom:16px}
table{width:100%;border-collapse:collapse;border:1px solid #E0D8CF}
th{background:#F3EFE9;padding:7px 10px;text-align:left;font-size:11px;font-weight:600;color:#6B6B69;border-bottom:1px solid #E0D8CF}
td{font-size:12px;border-bottom:1px solid #F0EBE3;vertical-align:top}
.tfoot td{background:#F3EFE9;font-weight:600;border-top:2px solid #E0D8CF}
.no-print{padding:12px 20px;background:#F3EFE9;display:flex;gap:10px;align-items:center;margin-bottom:16px;border-radius:8px}
.btn-p{padding:7px 18px;border-radius:7px;border:none;cursor:pointer;background:#9A7B2E;color:#fff;font-size:13px;font-weight:500;font-family:inherit}
.btn-o{padding:7px 18px;border-radius:7px;border:1px solid #E0D8CF;cursor:pointer;background:#fff;color:#3A352F;font-size:13px;font-family:inherit}
@media print{.no-print{display:none!important}}
</style></head><body>
<div class="no-print">
  <button class="btn-p" onclick="window.print()">Print</button>
  <button class="btn-o" onclick="window.close()">Close</button>
</div>
<h1>Wishing Well Contributions</h1>
<div class="subtitle">${contribs.length} contribution${contribs.length!==1?'s':''} &middot; Total: $${total.toFixed(2)}</div>
<table>
<thead><tr>
  <th style="width:22%">Name</th><th style="width:9%;text-align:right">Amount</th><th style="width:9%">Method</th><th style="width:10%">Date</th><th>Address</th><th style="width:7%;text-align:center">Thanked</th>
</tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr class="tfoot">
  <td colspan="1" style="padding:6px 10px">Total (${contribs.length})</td>
  <td style="padding:6px 10px;text-align:right">$${total.toFixed(2)}</td>
  <td colspan="4" style="padding:6px 10px"></td>
</tr></tfoot>
</table>
</body></html>`;
  const blob=new Blob([htmlContent],{type:'text/html'});
  const burl=URL.createObjectURL(blob);
  const w=window.open(burl,'_blank');
  if(!w) alert('Allow pop-ups to open the print preview.');
  setTimeout(()=>URL.revokeObjectURL(burl),10000);
}

// ── Print labels modal ──
function openWwPrintLabels(){
  const contribs=(STATE.wishingwell.contributions||[]);
  const withAddr=contribs.filter(c=>(c.address||'').trim());
  const missing=contribs.length-withAddr.length;
  const presetOpts=_LABEL_PRESETS.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('');
  const paperOpts=_LABEL_PAPER.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('');
  const saved=(STATE.settings&&STATE.settings.wwlblSetup)||{};
  const initLabelH=saved.labelH||38.1;
  const initFontPt=saved.fontPt||_wwDefaultFontPt(initLabelH);
  const initSizes=_wwFontSizes(initLabelH);
  const fontOpts=initSizes.map(s=>`<option value="${s}"${s===initFontPt?'selected':''}>${s}pt</option>`).join('');
  const body=`<div style="display:flex;flex-direction:column;gap:16px;font-size:13.5px">
    ${contribs.length===0
      ? `<p style="color:var(--muted)">No contributions logged yet.</p>`
      : withAddr.length===0
        ? `<p style="color:var(--muted)">No contributions have an address. Add an address when logging a contribution to print labels.</p>`
        : `<p style="color:var(--ink);line-height:1.5">${withAddr.length} contribution${withAddr.length!==1?'s':''} with an address will print${missing?` &mdash; <span style="color:var(--muted)">${missing} without an address will be skipped</span>`:''}.</p>`}
    <div>
      <label class="form-label">Label size</label>
      <select id="wwlbl-preset" class="form-input" onchange="_wwPresetChangeWw()">${presetOpts}</select>
    </div>
    <div id="wwlbl-custom-dims" style="display:none;grid-template-columns:1fr 1fr;gap:10px">
      <div><label class="form-label" style="font-size:12px">Columns</label><input id="wwlbl-custom-cols" type="number" min="1" max="8" value="3" class="form-input" style="font-size:13px"/></div>
      <div><label class="form-label" style="font-size:12px">Rows</label><input id="wwlbl-custom-rows" type="number" min="1" max="30" value="10" class="form-input" style="font-size:13px"/></div>
      <div><label class="form-label" style="font-size:12px">Label width (mm)</label><input id="wwlbl-custom-w" type="number" min="10" max="200" value="63.5" step="0.1" class="form-input" style="font-size:13px"/></div>
      <div><label class="form-label" style="font-size:12px">Label height (mm)</label><input id="wwlbl-custom-h" type="number" min="10" max="200" value="38.1" step="0.1" class="form-input" style="font-size:13px" onchange="_wwUpdateFontSizes()"/></div>
      <div><label class="form-label" style="font-size:12px">Top margin (mm)</label><input id="wwlbl-custom-mt" type="number" min="0" max="50" value="12.7" step="0.1" class="form-input" style="font-size:13px"/></div>
      <div><label class="form-label" style="font-size:12px">Left margin (mm)</label><input id="wwlbl-custom-ml" type="number" min="0" max="50" value="4.8" step="0.1" class="form-input" style="font-size:13px"/></div>
      <div><label class="form-label" style="font-size:12px">Column gap (mm)</label><input id="wwlbl-custom-gh" type="number" min="0" max="20" value="3.2" step="0.1" class="form-input" style="font-size:13px"/></div>
      <div><label class="form-label" style="font-size:12px">Row gap (mm)</label><input id="wwlbl-custom-gv" type="number" min="0" max="20" value="0" step="0.1" class="form-input" style="font-size:13px"/></div>
    </div>
    <div>
      <label class="form-label">Paper size</label>
      <select id="wwlbl-paper" class="form-input">${paperOpts}</select>
    </div>
    <div>
      <label class="form-label">Font size</label>
      <select id="wwlbl-fontpt" class="form-input">${fontOpts}</select>
    </div>
    <div>
      <label class="form-label">Name format</label>
      <div style="display:flex;gap:18px;margin-top:4px">
        <label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:13px"><input type="radio" name="wwlbl-names" value="full" checked style="accent-color:var(--gold)"/> Full name</label>
        <label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:13px"><input type="radio" name="wwlbl-names" value="first" style="accent-color:var(--gold)"/> First name only</label>
      </div>
    </div>
  </div>`;
  const footer=`<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Cancel</button><button class="btn btn-primary btn-sm" onclick="_wwGenerateLabels()" ${withAddr.length===0?'disabled':''}>Generate &amp; print</button>`;
  openModal('Print post labels',body,footer);
  setTimeout(()=>{
    const ps=document.getElementById('wwlbl-preset');
    const pp=document.getElementById('wwlbl-paper');
    const pf=document.getElementById('wwlbl-fontpt');
    if(ps&&saved.preset){ ps.value=saved.preset; _wwPresetChangeWw(); }
    if(pp&&saved.paper) pp.value=saved.paper;
    if(pf&&saved.fontPt) pf.value=String(saved.fontPt);
    if(saved.names){ const r=document.querySelector(`input[name="wwlbl-names"][value="${saved.names}"]`); if(r) r.checked=true; }
    if(saved.preset==='custom'){
      const set=(id,val)=>{ const el=document.getElementById(id); if(el&&val!=null) el.value=val; };
      set('wwlbl-custom-cols',saved.customCols);set('wwlbl-custom-rows',saved.customRows);
      set('wwlbl-custom-w',saved.customW);set('wwlbl-custom-h',saved.customH);
      set('wwlbl-custom-mt',saved.customMt);set('wwlbl-custom-ml',saved.customMl);
      set('wwlbl-custom-gh',saved.customGh);set('wwlbl-custom-gv',saved.customGv);
    }
  },40);
}

function _wwGenerateLabels(){
  const gv=id=>{ const el=document.getElementById(id); return el?el.value:''; };
  const gn=id=>{ const el=document.getElementById(id); return el?parseFloat(el.value)||0:0; };
  const presetId=gv('wwlbl-preset')||'5160';
  const paperId=gv('wwlbl-paper')||'A4';
  const namesVal=document.querySelector('input[name="wwlbl-names"]:checked')?.value||'full';
  const fontPt=parseInt(gv('wwlbl-fontpt'))||9;
  let cols,rows,labelW,labelH,marginTop,marginLeft,gutterH,gutterV;
  if(presetId==='custom'){
    cols=parseInt(gv('wwlbl-custom-cols'))||3;
    rows=parseInt(gv('wwlbl-custom-rows'))||10;
    labelW=gn('wwlbl-custom-w')||63.5;
    labelH=gn('wwlbl-custom-h')||38.1;
    marginTop=gn('wwlbl-custom-mt');
    marginLeft=gn('wwlbl-custom-ml');
    gutterH=gn('wwlbl-custom-gh');
    gutterV=gn('wwlbl-custom-gv');
  } else {
    const p=_LABEL_PRESETS.find(x=>x[0]===presetId)||_LABEL_PRESETS[0];
    [,,cols,rows,labelW,labelH,marginTop,marginLeft,gutterH,gutterV]=p;
  }
  const paper=_LABEL_PAPER.find(x=>x[0]===paperId)||_LABEL_PAPER[0];
  const paperW=paper[2], paperH=paper[3];
  const nf={family:'Arial, Helvetica, sans-serif'};
  const namePt=fontPt;
  const addrPt=Math.max(6,fontPt-2);
  if(!STATE.settings) STATE.settings={};
  if(!STATE.settings.wwlblSetup) STATE.settings.wwlblSetup={};
  const setup=STATE.settings.wwlblSetup;
  setup.preset=presetId; setup.paper=paperId; setup.fontPt=fontPt; setup.names=namesVal; setup.labelH=labelH;
  if(presetId==='custom'){
    setup.customCols=cols;setup.customRows=rows;setup.customW=labelW;setup.customH=labelH;
    setup.customMt=marginTop;setup.customMl=marginLeft;setup.customGh=gutterH;setup.customGv=gutterV;
  }
  saveToStorage();
  let envs=(STATE.wishingwell.contributions||[])
    .filter(c=>(c.address||'').trim())
    .sort((a,b)=>(a.name||'').localeCompare(b.name||''))
    .map(c=>({name:c.name||'', address:(c.address||'').trim()}));
  const labelsPerPage=cols*rows;
  const totalPages=Math.ceil(envs.length/labelsPerPage)||1;
  const labelCells=envs.map(e=>{
    let nameHtml=namesVal==='first'?(e.name.split(/\s+/)[0]||e.name):e.name;
    nameHtml=nameHtml.replace(/&/g,'&amp;');
    const addrLines=e.address.split(/\n|,\s*/).map(l=>l.trim()).filter(Boolean);
    const addrHtml=addrLines.map(l=>`<div class="addr-line">${l.replace(/&/g,'&amp;')}</div>`).join('');
    return `<div class="label-cell"><div class="lbl-name">${nameHtml}</div>${addrHtml}</div>`;
  });
  while(labelCells.length%labelsPerPage!==0) labelCells.push('<div class="label-cell empty"></div>');
  const pages=[];
  for(let i=0;i<labelCells.length;i+=labelsPerPage) pages.push(labelCells.slice(i,i+labelsPerPage));
  const pageHtml=pages.map(pg=>`<div class="label-page">${pg.join('')}</div>`).join('');
  const htmlContent=`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Wishing Well Labels</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:${paperId==='Letter'?'letter':'A4'} portrait;margin:0}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.no-print{padding:14px 20px;background:#F3EFE9;display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #E0D8CF}
.no-print button{padding:7px 18px;border-radius:7px;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500}
.btn-p{background:#9A7B2E;color:#fff}.btn-o{background:#fff;border:1px solid #E0D8CF;color:#3A352F}
.no-print .info{font-size:12px;color:#6B6B69}
.label-page{width:${paperW}mm;height:${paperH}mm;padding-top:${marginTop}mm;padding-left:${marginLeft}mm;
  display:grid;grid-template-columns:repeat(${cols},${labelW}mm);grid-template-rows:repeat(${rows},${labelH}mm);
  column-gap:${gutterH}mm;row-gap:${gutterV}mm;page-break-after:always;overflow:hidden}
.label-cell{width:${labelW}mm;height:${labelH}mm;padding:2.5mm 3.5mm;overflow:hidden;
  border:0.2px dotted #ccc;display:flex;flex-direction:column;justify-content:center;gap:0.8mm}
.label-cell.empty{border-color:transparent}
.lbl-name{font-family:${nf.family};font-size:${namePt}pt;font-weight:600;color:#1A1A18;line-height:1.25;
  word-break:break-word;overflow-wrap:break-word;max-width:100%;
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.addr-line{font-family:${nf.family};font-size:${addrPt}pt;color:#3A352F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media print{.no-print{display:none!important}.label-cell{border-color:transparent!important}}
</style></head><body>
<div class="no-print">
  <button class="btn-p" onclick="window.print()">Print</button>
  <button class="btn-o" onclick="window.close()">Close</button>
  <span class="info">${envs.length} label${envs.length!==1?'s':''} &middot; ${totalPages} page${totalPages!==1?'s':''} &middot; ${cols}&times;${rows} grid &middot; Borders hidden when printing</span>
</div>
${pageHtml}
</body></html>`;
  closeModalDirect();
  const blob=new Blob([htmlContent],{type:'text/html'});
  const burl=URL.createObjectURL(blob);
  const w=window.open(burl,'_blank');
  if(!w) alert('Allow pop-ups to open the label sheet.');
  setTimeout(()=>URL.revokeObjectURL(burl),10000);
}

// ── Settings modal (message, goal, suggested amounts, payment details, dashboard toggle) ──
function openWwSettings(){
  const ww = STATE.wishingwell;
  const body = `<div style="display:flex;flex-direction:column;gap:14px">
      <div>
        <label class="form-label">Fundraising goal <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <input type="number" id="ww-s-goal" class="form-input" placeholder="0" min="0" step="1" value="${Number(ww.goal)>0?ww.goal:''}"/>
      </div>
      <div>
        <label class="form-label">Suggested amounts</label>
        <input type="text" id="ww-s-suggested" class="form-input" placeholder="50, 100, 200" value="${_wwEsc((ww.suggested||[]).join(', '))}"/>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">Comma-separated. Shown as tappable chips on the public page.</div>
      </div>
      <div>
        <label class="form-label">Welcome message</label>
        <textarea id="ww-s-message" class="form-input" rows="3" style="resize:vertical">${_wwEsc(ww.message)}</textarea>
      </div>
      <div>
        <label class="form-label">Closing line</label>
        <input type="text" id="ww-s-closing" class="form-input" value="${_wwEsc(ww.closing)}"/>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:14px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:10px">Payment details</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div><label class="form-label">PayID</label><input type="text" id="ww-s-payid" class="form-input" placeholder="email or phone" value="${_wwEsc(ww.payId)}"/></div>
          <div style="display:flex;gap:12px">
            <div style="flex:1"><label class="form-label">BSB</label><input type="text" id="ww-s-bsb" class="form-input" placeholder="123-456" value="${_wwEsc(ww.bankBsb)}"/></div>
            <div style="flex:1.4"><label class="form-label">Account number</label><input type="text" id="ww-s-acc" class="form-input" placeholder="1234 5678" value="${_wwEsc(ww.bankAcc)}"/></div>
          </div>
          <div><label class="form-label">PayPal link <span style="color:var(--muted);font-weight:400">(optional)</span></label><input type="text" id="ww-s-paypal" class="form-input" placeholder="paypal.me/yourname" value="${_wwEsc(ww.paypal)}"/></div>
          <div><label class="form-label">Payment reference</label><input type="text" id="ww-s-ref" class="form-input" placeholder="Your name" value="${_wwEsc(ww.reference)}"/></div>
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:9px;font-size:13px;color:var(--ink);cursor:pointer;border-top:1px solid var(--border);padding-top:14px">
        <input type="checkbox" id="ww-s-dash" ${STATE.settings.showWishingWellOnDash?'checked':''} style="width:15px;height:15px;cursor:pointer;accent-color:var(--gold)"/> Show the running total on the Dashboard
      </label>
    </div>`;
  const footer = `<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Cancel</button><button class="btn btn-primary btn-sm" onclick="saveWwSettings()">Save</button>`;
  openModal('Wishing well settings', body, footer);
}

function saveWwSettings(){
  const ww = STATE.wishingwell;
  ww.goal = parseFloat(document.getElementById('ww-s-goal').value)||0;
  ww.suggested = (document.getElementById('ww-s-suggested').value||'').split(',').map(s=>parseFloat(s.trim())).filter(n=>!isNaN(n)&&n>0);
  ww.message = document.getElementById('ww-s-message').value||'';
  ww.closing = document.getElementById('ww-s-closing').value||'';
  ww.payId = (document.getElementById('ww-s-payid').value||'').trim();
  ww.bankBsb = (document.getElementById('ww-s-bsb').value||'').trim();
  ww.bankAcc = (document.getElementById('ww-s-acc').value||'').trim();
  ww.paypal = (document.getElementById('ww-s-paypal').value||'').trim();
  ww.reference = (document.getElementById('ww-s-ref').value||'').trim();
  STATE.settings.showWishingWellOnDash = document.getElementById('ww-s-dash').checked;
  saveToStorage();
  closeModalDirect();
  navigate('wishingwell');
}

// ── Dashboard widget ──
function buildDashWishingWellHtml(){
  const ww = STATE.wishingwell;
  const total = _wwTotal();
  const goal = Number(ww.goal)||0;
  const pct = goal>0 ? Math.min(100, Math.round((total/goal)*100)) : 0;
  const count = (ww.contributions||[]).length;
  const progress = goal>0
    ? `<div style="height:8px;border-radius:5px;background:var(--surface);overflow:hidden;margin:10px 0 6px"><div style="width:${pct}%;height:100%;background:var(--gold);border-radius:5px"></div></div><div style="font-size:11.5px;color:var(--muted)">${pct}% of ${fmt(goal)} goal</div>`
    : `<div style="font-size:11.5px;color:var(--muted);margin-top:8px">${count} contribution${count===1?'':'s'} logged</div>`;
  return `<div style="margin-top:20px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div><div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Gifts</div><div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--ink)">Wishing Well</div></div>
      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();navigate('wishingwell')">View tracker \u2192</button>
    </div>
    <div style="background:var(--card,var(--cream));border:1px solid var(--border);border-radius:14px;padding:18px 20px">
      <div style="font-size:12.5px;color:var(--muted)">Raised so far</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:28px;color:var(--ink)">${fmt(total)}</div>
      ${progress}
    </div></div>`;
}

function renderVisionboard(c,actions){
  const items=STATE.visionboard.map(id=>STATE.inspo.items.find(i=>i.id===id)).filter(Boolean);
  const colors=STATE.inspo.colors;
  const allCols=[...WEDDING_COLORS,...(STATE.inspo.customColors||[])];
  const showOnDash=STATE.settings.showVisionOnDash||false;
  const vbGrouped=!!STATE.settings.vbGrouped;
  vbLayout = STATE.settings.vbLayout || 'scrapbook';
  // Page-level Captions/Images toggle (independent of the dashboard widget's toggle).
  const vbPageImagesOnly = !!STATE.settings.vbPageImagesOnly;
  // Card size (Small / Medium / Large). Per-device: stored in localStorage, not synced.
  // Migrate the old ×2/×3 density values: old '3' (denser) → small, old '2' → medium.
  let vbSize;try{vbSize=localStorage.getItem('uv-vb-size');}catch(e){}
  if(!vbSize)vbSize=STATE.settings.vbSize;
  if(!vbSize){ vbSize = STATE.settings.vbDensity==='2' ? 'medium' : (STATE.settings.vbDensity==='3' ? 'small' : 'small'); }
  if(!['xsmall','small','medium','large'].includes(vbSize)) vbSize='small';
  // Per-row card minimum width by size. Smaller = more per row.
  const vbColMin = vbSize==='large' ? '210px' : (vbSize==='medium' ? '150px' : (vbSize==='xsmall' ? '78px' : '104px'));
  const sizes = [
    {id:'xsmall', label:'X-Small', sub:'Most per row',   icon:'M3 3h4v4H3zm6 0h4v4H9zm6 0h4v4h-4zM3 9h4v4H3zm6 0h4v4H9zm6 0h4v4h-4zM3 15h4v4H3zm6 0h4v4H9zm6 0h4v4h-4z'},
    {id:'small',  label:'Small',  sub:'Compact',         icon:'M3 3h6v6H3zm8 0h6v6h-6zM3 11h6v6H3zm8 0h6v6h-6z'},
    {id:'medium', label:'Medium', sub:'Balanced',        icon:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z'},
    {id:'large',  label:'Large',  sub:'Fewer, bigger',   icon:'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z'},
  ];
  const curSize = sizes.find(s=>s.id===vbSize) || sizes[0];

  const isDark=document.body.classList.contains('dark');
  const paperBg=isDark?'#16141A':'#F9F4EC';
  const paperBorder=isDark?'#222030':'#E0D5C5';
  const inkColor=isDark?'#C8BFB0':'#3A2E20';
  const mutedInk=isDark?'#6A6070':'#8A7A65';
  const cardBg=isDark?'#1E1B26':'#FFFDF8';
  const cardShadow=isDark?'rgba(0,0,0,.45)':'rgba(60,40,20,.18)';

  const layouts = [
    {id:'scrapbook', label:'Scrapbook', sub:'Tilted, tape-pinned cards', icon:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3l3-5 3 5h-6z'},
    {id:'grid',      label:'Grid',      sub:'Even, aligned tiles',       icon:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z'},
    {id:'editorial', label:'Editorial', sub:'Magazine-style rows',        icon:'M3 5h18M3 10h18M3 15h12M3 20h8'},
    {id:'mood',      label:'Mood Board', sub:'Mixed-size collage',        icon:'M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v8h-8zM3 13h8v8H3z'},
  ];
  const curLayout = layouts.find(l=>l.id===vbLayout) || layouts[0];

  const layoutDropdownHtml = `
    <div class="vb-layout-select" id="vb-layout-select">
      <button class="vb-layout-trigger" onclick="toggleVbLayoutMenu(event)" aria-haspopup="true" title="Change layout">
        <span style="display:inline-flex"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${curLayout.icon}"/></svg></span>
        <span class="vb-tb-label" style="min-width:58px;text-align:left">${curLayout.label}</span>
        <svg class="vb-layout-chev" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="vb-layout-menu" id="vb-layout-menu" style="display:none">
        ${layouts.map(l=>`<div class="vb-layout-item ${vbLayout===l.id?'active':''}" onclick="setVbLayout('${l.id}')">
          <span class="vb-li-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${l.icon}"/></svg></span>
          <span class="vb-li-text">${l.label}<span class="vb-li-sub">${l.sub}</span></span>
          <span class="vb-li-tick"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
        </div>`).join('')}
      </div>
    </div>`;

  actions.innerHTML=`
    <button id="vb-dash-btn" class="btn btn-sm ${showOnDash?'btn-primary':'btn-outline'}" onclick="toggleVisionOnDash()" style="display:inline-flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="${showOnDash?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      <span class="vb-dash-btn-label">${showOnDash?'On Dashboard':'Add to Dashboard'}</span>
    </button>`;

  const tilts=[-2.5,-1.2,2.1,-1.8,1.5,-2.2,1.8,-1.4,2.4,-0.9,2.8,-1.6,1.1,-2.0,0.8];
  const tapeColors=['rgba(196,168,130,.55)','rgba(180,192,168,.55)','rgba(168,180,200,.55)','rgba(210,185,165,.55)','rgba(172,180,162,.55)'];

  // Elegant botanical line-art motifs for the scattered scrapbook layout.
  const vbDecoColor = isDark ? '#74694f' : '#C2AE8C';
  function vbDeco(kind){
    const col=vbDecoColor;
    const s=`fill="none" stroke="${col}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"`;
    switch(kind){
      case 'eucalyptus': return `<svg width="58" height="58" viewBox="0 0 60 60" ${s} opacity=".42"><path d="M30 56C30 40 26 22 14 8"/><ellipse cx="20" cy="18" rx="6" ry="3.4" transform="rotate(-40 20 18)"/><ellipse cx="24" cy="28" rx="6.5" ry="3.6" transform="rotate(-30 24 28)"/><ellipse cx="27" cy="40" rx="6" ry="3.4" transform="rotate(-20 27 40)"/><ellipse cx="38" cy="16" rx="5.5" ry="3.2" transform="rotate(38 38 16)"/><ellipse cx="36" cy="28" rx="6" ry="3.4" transform="rotate(28 36 28)"/><ellipse cx="33" cy="40" rx="5.5" ry="3.2" transform="rotate(18 33 40)"/></svg>`;
      case 'laurel': return `<svg width="50" height="50" viewBox="0 0 50 50" ${s} opacity=".42"><path d="M25 46V14"/><path d="M25 20c-6-2-9-7-9-7s7 1 9 5M25 20c6-2 9-7 9-7s-7 1-9 5"/><path d="M25 30c-6-2-10-6-10-6s8 0 10 4M25 30c6-2 10-6 10-6s-8 0-10 4"/><path d="M25 38c-5-2-8-5-8-5s6 0 8 3M25 38c5-2 8-5 8-5s-6 0-8 3"/></svg>`;
      case 'wheat': return `<svg width="30" height="52" viewBox="0 0 30 54" ${s} opacity=".42"><path d="M15 54V20"/><path d="M15 20c0-4 3-7 3-7s0 5-3 7zM15 20c0-4-3-7-3-7s0 5 3 7z"/><path d="M15 28c0-4 4-6 4-6s0 5-4 6zM15 28c0-4-4-6-4-6s0 5 4 6z"/><path d="M15 36c0-4 4-6 4-6s0 5-4 6zM15 36c0-4-4-6-4-6s0 5 4 6z"/><path d="M15 44c0-4 4-6 4-6s0 5-4 6zM15 44c0-4-4-6-4-6s0 5 4 6z"/></svg>`;
      case 'monstem': return `<svg width="40" height="48" viewBox="0 0 40 50" ${s} opacity=".42"><path d="M20 50V22"/><path d="M20 22c0-9 7-15 14-16-1 9-6 15-14 16zM20 26c0-7-6-12-11-12 0 7 4 12 11 12z"/></svg>`;
      case 'sprig': return `<svg width="46" height="46" viewBox="0 0 48 48" ${s} opacity=".4"><path d="M24 44V10"/><path d="M24 16c-5-1-8-5-8-5M24 16c5-1 8-5 8-5M24 24c-5-1-9-4-9-4M24 24c5-1 9-4 9-4M24 32c-4-1-7-3-7-3M24 32c4-1 7-3 7-3"/></svg>`;
      case 'dot': return `<svg width="44" height="14" viewBox="0 0 44 14" opacity=".4"><circle cx="6" cy="7" r="2" fill="${col}"/><circle cx="16" cy="7" r="1.5" fill="${col}"/><circle cx="25" cy="7" r="2.4" fill="${col}"/><circle cx="35" cy="7" r="1.5" fill="${col}"/></svg>`;
      default: return '';
    }
  }
  const vbDecoKinds=['eucalyptus','laurel','wheat','monstem','sprig','dot'];

  function dragAttrs(id){ return `draggable="true"
    ondragstart="vbDragStart(event,'${id}')"
    ondragover="vbDragOver(event,'${id}')"
    ondrop="vbDrop(event,'${id}')"
    ondragleave="vbDragLeave(event,'${id}')"
    ondragend="setTimeout(()=>vbDidDrag=false,50)"
    onclick="vbCardClick(event,'${id}')"
    data-vbid="${id}"`; }

  function cardContent(item){
    const hasImg=!!_mediaUrl(item.image);
    const xs = vbSize==='xsmall';
    const dense = vbSize==='small' || xs;
    const big = vbSize==='large';
    const _pad = xs ? '5px 6px 7px' : (dense ? '7px 8px 9px' : (big ? '12px 12px 16px' : '10px 10px 14px'));
    const _titleSz = xs ? '11px' : (dense ? '12px' : (big ? '16px' : '14px'));
    const _catSz = xs ? '8.5px' : (dense ? '9px' : (big ? '11px' : '10.5px'));
    const _phH = xs ? '70px' : (dense ? '88px' : (big ? '150px' : '120px'));
    const _linkSz = xs ? '8px' : (dense ? '8.5px' : (big ? '11px' : '10px'));
    const _linkIc = dense ? 8 : (big ? 11 : 10);
    return`${hasImg?`<img src="${_mediaUrl(item.image)}" alt="${item.title}" style="width:100%;display:block;object-fit:cover${vbPageImagesOnly?';border-radius:4px':''}" onerror="this.style.display='none'"/>`:`<div style="width:100%;height:${_phH};background:${isDark?'#252230':'#F0EBE0'};display:flex;align-items:center;justify-content:center"><svg width="${dense?'20':(big?'28':'24')}" height="${dense?'20':(big?'28':'24')}" viewBox="0 0 24 24" fill="none" stroke="${mutedInk}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`}
    ${vbPageImagesOnly?'':`<div style="padding:${_pad}">
      <div style="font-family:'Cormorant Garamond',serif;font-size:${_titleSz};font-weight:500;color:${inkColor};margin-bottom:2px;line-height:1.2">${item.title}</div>
      ${dense?'':`<div style="font-size:${_catSz};color:${mutedInk};font-style:italic">${item.category}</div>`}
      ${vbBudgetChip(item)}
      ${(!dense && item.notes)?`<div style="font-size:${big?'12px':'11px'};color:${mutedInk};margin-top:5px;line-height:1.5">${item.notes}</div>`:''}
      ${item.link?`<a href="${item.link}" target="_blank" rel="noopener" style="font-size:${_linkSz};color:${mutedInk};text-decoration:underline;margin-top:4px;display:inline-flex;align-items:center;gap:${dense?'3px':'4px'};font-style:italic;max-width:100%;min-width:0;overflow:hidden"><svg width="${_linkIc}" height="${_linkIc}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">${_escHtml(_urlDomain(item.link))}</span></a>`:''}
    </div>`}`;
  }

  // Small budget link badge themed for the vision board paper
  function vbBudgetChip(item){
    const label=inspoBudgetLabel(item);
    if(!label) return '';
    const chipBg=isDark?'#2A2418':'#F3EEE4';
    const chipFg=isDark?'#CBBBA0':'#8B7355';
    const chipBorder=isDark?'#3A332A':'#E0D5C5';
    return `<div style="margin-top:6px;max-width:100%;overflow:hidden">
      <span onclick="event.stopPropagation();jumpToBudget('${item.budgetId}')" title="${label}"
        style="font-size:10px;padding:2px 7px;border-radius:11px;background:${chipBg};color:${chipFg};display:flex;align-items:center;gap:4px;cursor:pointer;border:1px solid ${chipBorder};max-width:100%;min-width:0;overflow:hidden">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="9"/><path d="M14.8 9.5a3 3 0 0 0-5.6 1.2c0 2.5 4 1.8 4 4a3 3 0 0 1-5.6 1.2"/><line x1="12" y1="6.5" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="17.5"/></svg>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">${label}</span>
      </span>
    </div>`;
  }

  function groupItems(arr){
    const order=[], map={};
    arr.forEach(item=>{ const cat=item.category||'Other'; if(!map[cat]){map[cat]=[];order.push(cat);} map[cat].push(item); });
    return order.map(cat=>({cat,items:map[cat]}));
  }
  const ruleColor=isDark?'rgba(196,168,130,.22)':'rgba(196,168,130,.42)';
  function groupHeader(cat,count,extra=''){
    return`<div style="display:flex;align-items:center;gap:12px;margin:4px 0 14px;${extra}">
      <div style="flex:1;height:1px;background:${ruleColor}"></div>
      <div style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:14px;color:${mutedInk};display:flex;align-items:center;gap:8px">${_escHtml(cat)}<span style="font-family:'Inter',sans-serif;font-style:normal;font-size:10px;background:${isDark?'rgba(196,168,130,.15)':'rgba(196,168,130,.2)'};color:${mutedInk};padding:1px 7px;border-radius:10px">${count}</span></div>
      <div style="flex:1;height:1px;background:${ruleColor}"></div>
    </div>`;
  }

  let boardHtml = '';

  if(vbLayout==='scrapbook'){
    // Scattered scrapbook: column-flow masonry (keeps drag-reorder + responsive),
    // with per-card horizontal nudge, varied tilt and stagger so cards don't sit on a grid.
    // Botanical motifs are scattered as a non-interactive background layer.
    // Deterministic pseudo-random from index so positions are stable across re-renders.
    const jit=(n,seed)=>{ const x=Math.sin((n+1)*9.73+seed*4.19)*43758.5453; return x-Math.floor(x); };
    // Seamless willow wallpaper behind the cards (theme-aware), with a soft veil for legibility.
    const vbWall = _vbWallUrl(isDark);
    const vbTint = _vbTintLayers(isDark);
    const _vbMobile = window.innerWidth <= 900;
    function scrapCards(arr, idxOffset=0){ return arr.map((item,i)=>{
      const idx=i+idxOffset;
      const tilt=tilts[idx%tilts.length];
      const tape=tapeColors[idx%tapeColors.length];
      const nudge=_vbMobile ? 0 : (jit(idx,2.2)*22-11).toFixed(1);
      const tiltX=(tilt + (jit(idx,6.6)*2.4-1.2)).toFixed(2);
      const topGap=_vbMobile ? (4+jit(idx,8.8)*12).toFixed(0) : (8 + jit(idx,8.8)*30).toFixed(0);
      return`<div ${dragAttrs(item.id)} style="break-inside:avoid;margin:${topGap}px 0 ${_vbMobile?'12px':'22px'};display:inline-block;width:100%;cursor:grab;transform:translateX(${nudge}px)">
        <div style="position:relative;background:${vbPageImagesOnly?'transparent':cardBg};border-radius:3px;padding:${vbPageImagesOnly?'0':'4px 4px 0'};box-shadow:${vbPageImagesOnly?'none':`3px 4px 14px ${cardShadow}`};transform:rotate(${tiltX}deg);transform-origin:center top;transition:transform .2s" onmouseover="this.style.transform='rotate(0deg) scale(1.02)'" onmouseout="this.style.transform='rotate(${tiltX}deg)'">
          <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%) rotate(${(tilt*0.4).toFixed(2)}deg);width:48px;height:18px;background:${tape};border-radius:2px;opacity:.85;z-index:2"></div>
          ${cardContent(item)}
        </div>
      </div>`;
    }).join('');}
    const scrapInner = vbGrouped
      ? groupItems(items).map(({cat,items:gi},gi_)=>`<div style="column-span:all">${groupHeader(cat,gi.length,gi_===0?'margin-top:0':'margin-top:22px')}</div>${scrapCards(gi,gi_*50)}`).join('')
      : scrapCards(items);
    boardHtml = items.length ? `<div class="vb-scrapbook-wrap" style="position:relative;border-radius:16px;overflow:hidden;border:1px solid ${isDark?'#2A2533':'#E6CFC9'};padding:30px 26px 34px;background-image:${vbTint.grad},url('${vbWall}');background-size:auto,480px;background-repeat:repeat,repeat;background-blend-mode:${vbTint.blend},normal">
      <div class="vb-board vb-scrapbook vb-size-${vbSize}" style="position:relative;z-index:1;columns:${vbColMin};column-gap:26px;orphans:1;widows:1">
      ${scrapInner}
      </div>
    </div>` : '';

  } else if(vbLayout==='grid'){
    function gridCard(item){ return`<div ${dragAttrs(item.id)} style="background:${vbPageImagesOnly?'transparent':cardBg};border-radius:10px;overflow:hidden;box-shadow:${vbPageImagesOnly?'none':`0 2px 10px ${cardShadow}`};cursor:grab;transition:transform .15s,box-shadow .15s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='${vbPageImagesOnly?'none':`0 6px 20px ${cardShadow}`}'" onmouseout="this.style.transform='';this.style.boxShadow='${vbPageImagesOnly?'none':`0 2px 10px ${cardShadow}`}'">
      ${cardContent(item)}
    </div>`;}
    const gridInner = vbGrouped
      ? groupItems(items).map(({cat,items:gi},gi_)=>`<div style="grid-column:1/-1">${groupHeader(cat,gi.length,gi_===0?'margin-top:0':'margin-top:8px')}</div>${gi.map(gridCard).join('')}`).join('')
      : items.map(gridCard).join('');
    boardHtml = items.length ? `<div class="vb-board vb-grid vb-size-${vbSize}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(${vbColMin},1fr));gap:16px">
      ${gridInner}
    </div>` : '';

  } else if(vbLayout==='editorial'){
    // Large first item, smaller grid below
    const [first,...rest]=items;
    function editCard(item){ return`<div ${dragAttrs(item.id)} style="background:${vbPageImagesOnly?'transparent':cardBg};border-radius:8px;overflow:hidden;box-shadow:${vbPageImagesOnly?'none':`0 2px 8px ${cardShadow}`};cursor:grab" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
      ${cardContent(item)}
    </div>`;}
    const editHero = first?`<div ${dragAttrs(first.id)} style="background:${vbPageImagesOnly?'transparent':cardBg};border-radius:12px;overflow:hidden;margin-bottom:20px;box-shadow:${vbPageImagesOnly?'none':`0 3px 16px ${cardShadow}`};cursor:grab;display:flex;gap:0;flex-wrap:wrap" onmouseover="this.style.transform='scale(1.005)'" onmouseout="this.style.transform=''">
      ${_mediaUrl(first.image)?`<img src="${_mediaUrl(first.image)}" alt="${first.title}" style="width:100%;max-height:340px;object-fit:cover;display:block;border-radius:12px${vbPageImagesOnly?'':' 12px 0 0'}" onerror="this.style.display='none'"/>`:''}
      ${vbPageImagesOnly?'':`<div style="padding:18px 20px 22px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:${mutedInk};margin-bottom:6px">${first.category}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:${inkColor};line-height:1.2;margin-bottom:6px">${first.title}</div>
        ${first.notes?`<div style="font-size:12.5px;color:${mutedInk};line-height:1.6">${first.notes}</div>`:''}
        ${first.link?`<a href="${first.link}" target="_blank" rel="noopener" style="font-size:11px;color:${mutedInk};text-decoration:underline;margin-top:8px;display:inline-flex;align-items:center;gap:4px;font-style:italic"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>${_escHtml(_urlDomain(first.link))}</a>`:''}
      </div>`}
    </div>`:'';
    const editGrid = vbGrouped
      ? groupItems(items).map(({cat,items:gi},gi_)=>`<div style="grid-column:1/-1">${groupHeader(cat,gi.length,gi_===0?'margin-top:0':'margin-top:8px')}</div>${gi.map(editCard).join('')}`).join('')
      : rest.map(editCard).join('');
    boardHtml = items.length ? `
      ${vbGrouped?'':editHero}
      <div class="vb-board vb-editorial-grid vb-size-${vbSize}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(${vbColMin},1fr));gap:14px">
        ${editGrid}
      </div>` : '';

  } else if(vbLayout==='mood'){
    // Pinterest-style tight masonry
    function moodCards(arr,idxOffset=0){ return arr.map((item,i)=>{const idx=i+idxOffset;return`<div ${dragAttrs(item.id)} style="break-inside:avoid;margin-bottom:12px;cursor:grab">
      <div style="background:${vbPageImagesOnly?'transparent':cardBg};border-radius:8px;overflow:hidden;box-shadow:${vbPageImagesOnly?'none':`0 2px 8px ${cardShadow}`};transition:transform .15s" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform=''">
        ${_mediaUrl(item.image)?`<img src="${_mediaUrl(item.image)}" alt="${item.title}" style="width:100%;display:block;object-fit:cover;max-height:${160+((idx%3)*60)}px${vbPageImagesOnly?';border-radius:8px':''}" onerror="this.style.display='none'"/>`:''}
        ${vbPageImagesOnly?'':`<div style="padding:8px 10px 10px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:13px;color:${inkColor}">${item.title}</div>
          ${item.notes?`<div style="font-size:10px;color:${mutedInk};margin-top:3px;line-height:1.4">${item.notes}</div>`:''}
        </div>`}
      </div>
    </div>`;}).join('');}
    const moodInner = vbGrouped
      ? groupItems(items).map(({cat,items:gi},gi_)=>`<div style="column-span:all">${groupHeader(cat,gi.length,gi_===0?'margin-top:0':'margin-top:16px')}</div>${moodCards(gi,gi_*50)}`).join('')
      : moodCards(items);
    boardHtml = items.length ? `<div class="vb-board vb-mood vb-size-${vbSize}" style="columns:${vbColMin};column-gap:12px;orphans:1;widows:1">
      ${moodInner}
    </div>` : '';
  }

  const emptyState = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:16px">
    <div style="width:80px;height:80px;border:2px dashed ${isDark?'rgba(255,255,255,.1)':'rgba(60,40,20,.15)'};border-radius:6px;transform:rotate(-3deg);display:flex;align-items:center;justify-content:center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${mutedInk}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    </div>
    <div style="text-align:center">
      <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:${mutedInk};font-style:italic">Your vision board awaits</div>
      <div style="font-size:13px;color:${mutedInk};margin-top:6px;opacity:.7">Pin ideas from Inspiration to fill this board</div>
    </div>
  </div>`;

  const vbBg = (STATE.settings&&STATE.settings.vbBackground)||'wallpaper';
  const _bgSrcs=[
    {id:'wallpaper',label:'Wallpaper',url:isDark?VB_WALLPAPER_DARK:VB_WALLPAPER_LIGHT},
    {id:'botanical',label:'Botanical',url:isDark?VB_BOTANICAL_DARK:VB_BOTANICAL_LIGHT},
    {id:'marble',   label:'Marble',   url:isDark?VB_MARBLE_DARK:VB_MARBLE_LIGHT},
  ];
  const curBgSrc = _bgSrcs.find(b=>b.id===vbBg)||_bgSrcs[0];
  const bgPickerHtml = vbLayout==='scrapbook' ? `<div class="vb-layout-select" id="vb-bg-select">
    <button class="vb-layout-trigger" onclick="toggleVbBgMenu(event)" aria-haspopup="true" title="Board background">
      <span style="display:inline-flex;width:22px;height:16px;border-radius:3px;overflow:hidden;border:.5px solid var(--border);flex-shrink:0"><img src="${curBgSrc.url}" style="width:100%;height:100%;object-fit:cover;display:block"/></span>
      <span class="vb-tb-label" style="min-width:54px;text-align:left">${curBgSrc.label}</span>
      <svg class="vb-layout-chev" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="vb-layout-menu" id="vb-bg-menu" style="display:none">
      ${_bgSrcs.map(bg=>`<div class="vb-layout-item ${vbBg===bg.id?'active':''}" onclick="setVbBackground('${bg.id}')">
        <span class="vb-li-ic" style="width:32px;height:22px;border-radius:4px;overflow:hidden;border:.5px solid var(--border);flex-shrink:0"><img src="${bg.url}" style="width:100%;height:100%;object-fit:cover;display:block"/></span>
        <span class="vb-li-text">${bg.label}</span>
        <span class="vb-li-tick"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
      </div>`).join('')}
    </div>
  </div>` : '';
  const colPaletteHtml = colors.length ? `<div style="margin-bottom:32px">
    <div style="font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:${mutedInk};margin-bottom:12px;letter-spacing:.04em">colour palette</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
      ${colors.map((hex,i)=>{const col=allCols.find(x=>x.hex===hex);const size=28+((i%3)*5);return`<div title="${col?col.name:hex}" style="width:${size}px;height:${size}px;border-radius:50%;background:${hex};box-shadow:inset 0 -2px 6px rgba(0,0,0,.15),0 1px 4px rgba(0,0,0,.1);transform:translateY(${(i%2)*3}px)"></div>`;}).join('')}
    </div>
  </div>` : '';

  c.innerHTML=`
  <div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:20px;flex-wrap:wrap;gap:10px">
    <div class="vb-toolbar" style="display:flex;align-items:center;gap:10px;margin-left:auto">
      <div style="display:inline-flex;border:.5px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)">
        ${[['captions','Cap.',false],['images','Img.',true]].map(([k,lbl,val],i)=>{
          const active=vbPageImagesOnly===val;
          return `<button type="button" onclick="setVbPageImagesOnly(${val})" title="${val?'Show images only':'Show captions and frames'}" style="${i>0?'border-left:.5px solid var(--border);':''}border:none;${active?'background:var(--gold-deep);color:#fff;font-weight:600;':'background:transparent;color:var(--muted);font-weight:500;'}padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit">${lbl}</button>`;
        }).join('')}
      </div>
      <div class="vb-layout-select" id="vb-size-select">
        <button class="vb-layout-trigger" onclick="toggleVbSizeMenu(event)" aria-haspopup="true" title="Card size">
          <span style="display:inline-flex"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${curSize.icon}"/></svg></span>
          <span class="vb-tb-label" style="min-width:50px;text-align:left">${curSize.label}</span>
          <svg class="vb-layout-chev" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="vb-layout-menu" id="vb-size-menu" style="display:none">
          ${sizes.map(sz=>`<div class="vb-layout-item ${vbSize===sz.id?'active':''}" onclick="setVbSize('${sz.id}')">
            <span class="vb-li-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${sz.icon}"/></svg></span>
            <span class="vb-li-text">${sz.label}<span class="vb-li-sub">${sz.sub}</span></span>
            <span class="vb-li-tick"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
          </div>`).join('')}
        </div>
      </div>
      <button type="button" onclick="setVbGrouped(${!vbGrouped})" title="${vbGrouped?'Show as one board':'Group by category'}" style="display:inline-flex;align-items:center;gap:5px;border:.5px solid ${vbGrouped?'var(--gold-deep)':'var(--border)'};border-radius:8px;background:${vbGrouped?'rgba(196,168,130,.12)':'var(--surface)'};color:${vbGrouped?'var(--gold-deep)':'var(--muted)'};padding:6px 10px;font-size:12px;font-family:inherit;cursor:pointer;font-weight:${vbGrouped?'600':'500'};white-space:nowrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/></svg>
        <span class="vb-tb-label">Group</span>
      </button>
      ${bgPickerHtml}
      ${layoutDropdownHtml}
    </div>
  </div>
  <div class="vb-page-board" style="background:${paperBg};border:1px solid ${paperBorder};border-radius:20px;padding:36px 32px 48px;position:relative;min-height:480px">
    <div style="position:absolute;inset:0;border-radius:20px;opacity:.03;background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22/></svg>');pointer-events:none"></div>
    <button onclick="navigate('inspo')" style="position:absolute;top:16px;right:16px;display:inline-flex;align-items:center;gap:6px;border:.5px solid ${isDark?'rgba(200,190,176,.3)':'rgba(120,100,70,.22)'};border-radius:8px;background:${isDark?'rgba(255,255,255,.07)':'rgba(255,251,246,.85)'};color:${mutedInk};padding:6px 12px;font-size:12px;font-family:inherit;cursor:pointer;font-weight:500;white-space:nowrap;z-index:2;backdrop-filter:blur(2px)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      Inspiration
    </button>
    ${colPaletteHtml}
    ${items.length ? boardHtml : emptyState}
  </div>`;
}

function vbDragStart(e,id){
  vbDragId=id; vbDidDrag=true; e.dataTransfer.effectAllowed='move';
  setTimeout(()=>{const el=document.querySelector('[data-vbid="'+id+'"]');if(el)el.style.opacity='.4';},0);
}
function vbDragOver(e,id){
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  _dragAutoScroll(e);
  if(id===vbDragId)return;
  document.querySelectorAll('[data-vbid]').forEach(el=>el.style.outline='');
  const el=document.querySelector('[data-vbid="'+id+'"]');
  if(el)el.style.outline='2px solid var(--gold)';
}
function vbDragLeave(e,id){
  const el=document.querySelector('[data-vbid="'+id+'"]');
  if(el)el.style.outline='';
}
function vbDrop(e,targetId){
  e.preventDefault();
  _dragStopAutoScroll();
  document.querySelectorAll('[data-vbid]').forEach(el=>el.style.outline='');
  if(!vbDragId||vbDragId===targetId)return;
  if(STATE.settings&&STATE.settings.vbGrouped){
    const di=STATE.inspo.items.find(i=>i.id===vbDragId);
    const ti2=STATE.inspo.items.find(i=>i.id===targetId);
    if(!di||!ti2||(di.category||'Other')!==(ti2.category||'Other')){vbDragId=null;return;}
  }
  const fi=STATE.visionboard.indexOf(vbDragId);
  const ti=STATE.visionboard.indexOf(targetId);
  if(fi<0||ti<0)return;
  const[moved]=STATE.visionboard.splice(fi,1);
  STATE.visionboard.splice(ti,0,moved);
  vbDragId=null; saveToStorage(); navigate('visionboard');
}
// Click a vision board card to edit it (ignores drags and the "view" link)
let vbDidDrag=false;
function vbCardClick(e,id){
  // If a drag just happened, swallow this click
  if(vbDidDrag){ vbDidDrag=false; return; }
  // Don't hijack clicks on the external link or any anchor inside the card
  if(e.target.closest('a')) return;
  const card=(e.currentTarget&&e.currentTarget.getBoundingClientRect)?e.currentTarget:(e.target.closest('[data-vbid]')||null);
  openInspoPreview(id, card);
}

// ══════════════════════════════════════════════
