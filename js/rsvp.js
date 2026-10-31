// RSVP MANAGER
// ══════════════════════════════════════════════
// RSVP manager view state (filter + search for the tracker list)
let rsvpFilter = 'all';   // all | attending | declined | awaiting | invited | notsent
let rsvpQuery = '';

function rsvpStats(){
  // RSVP & Invites page: count A-list guests only (B-list excluded).
  const gs=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B');
  const attending=gs.filter(g=>g.rsvp==='attending').length;
  const declined=gs.filter(g=>g.rsvp==='declined').length;
  const awaiting=gs.filter(g=>!g.rsvp||g.rsvp==='awaiting').length;
  const total=gs.length;
  const responded=attending+declined;
  const rate=total?Math.round((responded/total)*100):0;
  const invitedIds=_invitedGuestIdSet();
  const invited=gs.filter(g=>invitedIds.has(g.id)).length;
  const notSent=total-invited;
  return {attending,declined,awaiting,total,responded,rate,invited,notSent};
}

// ── Shared guest-stat helpers for the new dockable widgets ──
// All count A-list guests only (B-list excluded), matching rsvpStats().
function _rsvpGuestStats(){
  const gs=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B');
  const att=gs.filter(g=>g.rsvp==='attending');
  // Age bands among ATTENDING guests (adult is implicit — _guestAgeBand normalises).
  let adults=0,children=0,infants=0;
  att.forEach(g=>{ const b=(typeof _guestAgeBand==='function')?_guestAgeBand(g):(g.ageBand||'adult'); if(b==='child')children++; else if(b==='infant')infants++; else adults++; });
  // Per-head cover count mirrors the budget rule if available; else adults + children.
  let coverCount;
  if(typeof _rsvpPerHeadCount==='function'){ try{ coverCount=_rsvpPerHeadCount(); }catch(_){ coverCount=undefined; } }
  if(typeof coverCount!=='number'){ const exclKids=!!(STATE.budget&&STATE.budget.excludeChildrenPerHead); coverCount=adults+(exclKids?0:children); }
  // Contact coverage (whole list, matches Send-to-guests card).
  const withEmail=gs.filter(g=>(g.email||'').trim()).length;
  const withPhone=gs.filter(g=>(g.phone||'').trim()).length;
  const missingBoth=gs.filter(g=>!(g.email||'').trim() && !(g.phone||'').trim()).length;
  // Seating: how many ATTENDING guests are placed at a table.
  let seated=0;
  const seatedIds=new Set();
  if(STATE.seating&&typeof STATE.seating==='object'){ Object.keys(STATE.seating).forEach(tid=>{ (STATE.seating[tid]||[]).forEach(id=>{ if(id) seatedIds.add(id); }); }); }
  att.forEach(g=>{ if(seatedIds.has(g.id)) seated++; });
  const unseated=att.length-seated;
  return {
    total:gs.length,
    attending:att.length,
    adults,children,infants,coverCount,
    withEmail,withPhone,missingBoth,
    seated,unseated
  };
}
// Days until the RSVP-by date (or null if not set).
// Pass a guest object to use their per-guest override (falls back to global).
function _rsvpDaysToRsvpBy(g){
  const d=(g&&g.rsvpByOverride)||(STATE.settings&&STATE.settings.rsvpBy);
  if(!d) return null;
  const by=new Date(d+'T00:00:00'); if(isNaN(by)) return null;
  const now=new Date(); now.setHours(0,0,0,0);
  return Math.round((by-now)/86400000);
}

// ── New dockable widget renderers ──
// Each returns a full .card. Kept compact so they read well in the narrow docked column.
function _rsvpWidgetHeadcount(){
  const st=_rsvpGuestStats();
  const row=(lbl,n)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${lbl}</span><span style="font-weight:600;color:var(--gold-deep)">${n}</span></div>`;
  return `<div class="card">
    <div class="section-eyebrow" style="margin-bottom:12px">Guest Headcount</div>
    ${row('Adults',st.adults)}
    ${row('Children',st.children)}
    <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:13px"><span>Infants</span><span style="font-weight:600;color:var(--gold-deep)">${st.infants}</span></div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:11px">Among ${st.attending} attending &middot; per-head cover count: <strong style="color:var(--ink)">${st.coverCount}</strong></div>
  </div>`;
}
function _rsvpWidgetFinalNumbers(){
  const st=_rsvpGuestStats();
  const awaiting=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B' && (!g.rsvp||g.rsvp==='awaiting')).length;
  const declined=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B' && g.rsvp==='declined').length;
  return `<div class="card">
    <div class="section-eyebrow" style="margin-bottom:12px">Final Numbers</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:38px;color:var(--green);line-height:1">${st.attending}</div>
    <div style="font-size:13px;color:var(--ink);margin-top:4px">confirmed attending</div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:12px">${awaiting} still awaiting &middot; ${declined} declined</div>
  </div>`;
}
function _rsvpWidgetAwaiting(){
  const awaitingGuests=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B' && (!g.rsvp||g.rsvp==='awaiting'));
  const awaiting=awaitingGuests.length;
  const days=_rsvpDaysToRsvpBy();
  const byRaw=STATE.settings&&STATE.settings.rsvpBy;
  const overrideCount=awaitingGuests.filter(g=>g.rsvpByOverride).length;
  const byLine = byRaw ? `RSVP by ${fmtDate(byRaw)}${days!=null?` &middot; ${days>=0?`${days} day${days===1?'':'s'} left`:`${-days} day${days===-1?'':'s'} ago`}`:''}` : 'Set an RSVP-by date in templates';
  const overrideLine = overrideCount ? `<div style="font-size:11px;color:var(--muted);margin-top:5px">${overrideCount} guest${overrideCount===1?'':'s'} have individual RSVP dates</div>` : '';
  return `<div class="card">
    <div class="section-eyebrow" style="margin-bottom:12px">Awaiting Response</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:38px;color:var(--gold-deep);line-height:1">${awaiting}</div>
    <div style="font-size:13px;color:var(--ink);margin-top:4px">haven't replied yet</div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:12px">${byLine}</div>
    ${overrideLine}
  </div>`;
}
function _rsvpWidgetInviteProgress(){
  // Build invite slots (households) from A-list guests
  const gs=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B');
  const allGuests=STATE.guests||[];
  const inviteKeys=new Set(STATE.invites||[]);
  if(STATE.inviteMeta){Object.entries(STATE.inviteMeta).forEach(([k,m])=>{if(m&&m.savedate&&m.savedate.sent)inviteKeys.add(k);});}
  const seen=new Set();
  const slots=[];
  gs.forEach(g=>{
    if(seen.has(g.id)) return;
    const fam=(STATE.families||[]).find(f=>f.memberIds.includes(g.id));
    if(fam){
      fam.memberIds.forEach(id=>seen.add(id));
      slots.push({type:'group',sent:inviteKeys.has('fam:'+fam.id)});
      return;
    }
    if(g.coupleId){
      const partner=allGuests.find(x=>x.id===g.coupleId);
      if(partner&&!seen.has(partner.id)){
        seen.add(g.id); seen.add(partner.id);
        slots.push({type:'couple',sent:inviteKeys.has('couple:'+g.id)||inviteKeys.has('couple:'+partner.id)});
        return;
      }
    }
    if(g.plusOneId){
      const plus=allGuests.find(x=>x.id===g.plusOneId);
      if(plus&&!seen.has(plus.id)){
        seen.add(g.id); seen.add(plus.id);
        slots.push({type:'couple',sent:inviteKeys.has('plusone:'+g.id)||inviteKeys.has('plusone:'+plus.id)});
        return;
      }
    }
    seen.add(g.id);
    slots.push({type:'single',sent:inviteKeys.has('solo:'+g.id)});
  });
  const totalSlots=slots.length;
  const sentSlots=slots.filter(x=>x.sent).length;
  const notSentSlots=totalSlots-sentSlots;
  const pct=totalSlots?Math.round((sentSlots/totalSlots)*100):0;
  // Breakdown of not-yet-sent by type
  const singles=slots.filter(x=>x.type==='single'&&!x.sent).length;
  const couples=slots.filter(x=>x.type==='couple'&&!x.sent).length;
  const groups=slots.filter(x=>x.type==='group'&&!x.sent).length;
  const subRow=(lbl,n)=>n>0?`<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0 3px 14px;font-size:11.5px;color:var(--muted)"><span>${lbl}</span><span>${n}</span></div>`:'';
  const breakdownHtml=notSentSlots>0?`<div style="border-left:2px solid var(--border);margin:3px 0 2px">${subRow('Singles',singles)}${subRow('Couples',couples)}${subRow('Groups / families',groups)}</div>`:'';
  return `<div class="card">
    <div class="section-eyebrow" style="margin-bottom:12px">Invite Progress</div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px"><span>Sent</span><span style="font-weight:600;color:var(--green)">${sentSlots} invite${sentSlots===1?'':'s'}</span></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0 4px;font-size:13px"><span>Not yet sent</span><span style="font-weight:600;color:var(--muted)">${notSentSlots} invite${notSentSlots===1?'':'s'}</span></div>
    ${breakdownHtml}
    <div style="height:6px;border-radius:3px;background:var(--surface);margin-top:9px;overflow:hidden"><div style="width:${pct}%;height:100%;background:var(--gold)"></div></div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:7px">${pct}% of households invited &middot; ${totalSlots} total</div>
  </div>`;
}
function _rsvpWidgetContactable(){
  const st=_rsvpGuestStats();
  const row=(lbl,n,col)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${lbl}</span><span style="font-weight:600;color:${col}">${n}</span></div>`;
  return `<div class="card">
    <div class="section-eyebrow" style="margin-bottom:12px">Contactable</div>
    ${row('Have email',st.withEmail,'var(--gold-deep)')}
    ${row('Have mobile',st.withPhone,'var(--gold-deep)')}
    <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:13px"><span>Missing both</span><span style="font-weight:600;color:${st.missingBoth>0?'var(--red)':'var(--muted)'}">${st.missingBoth}</span></div>
  </div>`;
}
function _rsvpSetField(key,prop,val){
  const w=_wbSite();
  if(!w.rsvp) w.rsvp={};
  if(!w.rsvp.fields) w.rsvp.fields={};
  if(!w.rsvp.fields[key]) w.rsvp.fields[key]={};
  w.rsvp.fields[key][prop]=val;
  saveToStorage();
  navigate('rsvp-mgr');
}
function _rsvpFormFieldsCardHtml(){
  const flds=(_wbSite().rsvp||{}).fields||{};
  function fGet(key,defaults){const f=flds[key];if(!f)return defaults;return{show:f.show!==undefined?f.show:defaults.show,required:f.required!==undefined?f.required:defaults.required};}
  const ph=fGet('phone',{show:true,required:true});
  const em=fGet('email',{show:true,required:false});
  const ad=fGet('address',{show:false,required:false});
  const so=fGet('songRequest',{show:false,required:false});
  const no=fGet('notes',{show:false,required:false});
  function tog(checked,onclick){return `<button type="button" onclick="${onclick}" style="position:relative;display:inline-flex;align-items:center;width:34px;height:20px;border-radius:10px;border:none;cursor:pointer;transition:background .2s;background:${checked?'var(--green)':'var(--border)'};padding:0;flex-shrink:0"><span style="position:absolute;left:${checked?'16px':'2px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span></button>`;}
  function row(label,key,hasSh,showOn,hasReq,reqOn){
    const reqDisabled=!showOn;
    return `<div style="display:grid;grid-template-columns:1fr 60px 60px;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px">
      <span>${label}</span>
      ${hasSh?tog(showOn,`_rsvpSetField('${key}','show',${!showOn})`):``}
      ${hasReq?`<span style="opacity:${reqDisabled?.35:1}">${tog(reqOn&&!reqDisabled,`if(!${reqDisabled})_rsvpSetField('${key}','required',${!(reqOn&&!reqDisabled)})`)}</span>`:`<span></span>`}
    </div>`;}
  return `<div class="card">
    <div class="section-eyebrow" style="margin-bottom:4px">RSVP form fields</div>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:12px">Choose which fields guests fill in when they RSVP online.</div>
    <div style="display:grid;grid-template-columns:1fr 60px 60px;align-items:center;gap:8px;padding:0 0 6px;border-bottom:2px solid var(--border);font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.04em;text-transform:uppercase">
      <span>Field</span><span style="text-align:center">Show</span><span style="text-align:center">Required</span>
    </div>
    ${row('Phone number','phone',true,ph.show,true,ph.required)}
    ${row('Email address','email',true,em.show,true,em.required)}
    ${row('Home address','address',true,ad.show,true,ad.required)}
    ${row('Song request','songRequest',true,so.show,false,false)}
    ${row('Comments / notes','notes',true,no.show,false,false)}
    <div style="font-size:11px;color:var(--muted);margin-top:10px">Required fields must be filled before submitting. If all fields are hidden, the contact step is skipped.</div>
  </div>`;}
function _rsvpWidgetSeating(){
  const st=_rsvpGuestStats();
  const row=(lbl,n,col)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${lbl}</span><span style="font-weight:600;color:${col}">${n}</span></div>`;
  return `<div class="card">
    <div class="section-eyebrow" style="margin-bottom:12px">Seating Status</div>
    ${row('Seated',st.seated,'var(--green)')}
    <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:13px"><span>Not seated</span><span style="font-weight:600;color:var(--gold-deep)">${st.unseated}</span></div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:11px">Of ${st.attending} attending guest${st.attending===1?'':'s'}.</div>
  </div>`;
}

// Renders the Response Summary body in one of three layouts (1=stat cards+bar, 2=donut, 3=hero, ... )
function rsvpSummaryBody(s){
  const style=STATE.settings.rsvpSummaryStyle||1;
  const pct=n=>s.total?(n/s.total*100):0;
  const rateLine=`<div style="font-size:11.5px;color:var(--muted);margin-top:10px">${s.rate}% response rate &middot; ${s.total} guest${s.total!==1?'s':''} on list</div>`;

  // Style 1 — donut + legend
  if(style===1){
    const C=2*Math.PI*15.9;
    const aLen=pct(s.attending)/100*C, dLen=pct(s.declined)/100*C;
    return `<div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap">
      <svg width="116" height="116" viewBox="0 0 42 42" style="flex-shrink:0">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--surface)" stroke-width="6"/>
        <circle class="green-prog-stroke" cx="21" cy="21" r="15.9" fill="none" stroke="var(--green)" stroke-width="6" stroke-dasharray="${aLen.toFixed(2)} ${(C-aLen).toFixed(2)}" stroke-dashoffset="${(C*0.25).toFixed(2)}" transform="rotate(0 21 21)"/>
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--red)" stroke-width="6" stroke-dasharray="${dLen.toFixed(2)} ${(C-dLen).toFixed(2)}" stroke-dashoffset="${(C*0.25 - aLen).toFixed(2)}"/>
        <text x="21" y="20.5" text-anchor="middle" style="font-size:7px;font-weight:600;fill:var(--ink)">${s.rate}%</text>
        <text x="21" y="26" text-anchor="middle" style="font-size:2.6px;fill:var(--muted)">responded</text>
      </svg>
      <div style="flex:1;min-width:150px">
        ${[['Attending',s.attending,'var(--green)'],['Declined',s.declined,'var(--red)'],['Awaiting',s.awaiting,'var(--parchment)']].map(([lbl,n,col])=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px">
            <span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${col};margin-right:8px;vertical-align:middle"></span>${lbl}</span>
            <span><span style="font-size:11px;color:var(--muted);margin-right:7px">${Math.round(pct(n))}%</span><span style="font-weight:600">${n}</span></span>
          </div>`).join('')}
      </div>
    </div>${rateLine}`;
  }

  // Style 2 — hero headcount
  if(style===2){
    return `<div style="text-align:center;padding:6px 0 2px">
      <div style="font-size:11px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase">Confirmed Headcount</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:54px;font-weight:600;line-height:1.05;color:var(--green)">${s.attending}</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">${Math.round(pct(s.attending))}% of ${s.total} on list &middot; ${s.rate}% responded</div>
      <div style="display:flex;justify-content:center;gap:22px;font-size:13px">
        <span style="color:var(--red)">${s.declined} declined <span style="color:var(--muted)">(${Math.round(pct(s.declined))}%)</span></span>
        <span style="color:var(--muted)">${s.awaiting} awaiting (${Math.round(pct(s.awaiting))}%)</span>
      </div>
    </div>`;
  }

  // Style 3 — rows with progress bars
  return `<div>
    ${[['Attending',s.attending,'var(--green)'],['Declined',s.declined,'var(--red)'],['Awaiting',s.awaiting,'var(--gold)']].map(([lbl,n,col])=>`
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:13px;margin-bottom:5px"><span>${lbl}</span><span><span style="font-size:11px;color:var(--muted);margin-right:7px">${Math.round(pct(n))}%</span><span style="font-weight:600">${n}</span></span></div>
        <div style="height:7px;background:var(--surface);border-radius:4px;overflow:hidden"><div class="${col==='var(--green)'?'green-prog':''}" style="width:${pct(n).toFixed(1)}%;height:100%;background:${col}"></div></div>
      </div>`).join('')}
    ${rateLine}
  </div>`;
}

function toggleRsvpStyleMenu(e){
  e.stopPropagation();
  const menu=document.getElementById('rsvp-style-menu');
  if(!menu) return;
  const showing=menu.style.display!=='none';
  menu.style.display=showing?'none':'block';
  if(!showing){
    const close=(ev)=>{ if(!menu.contains(ev.target)){ menu.style.display='none'; document.removeEventListener('click',close); } };
    setTimeout(()=>document.addEventListener('click',close),0);
  }
}

function setRsvpSummaryStyle(n){
  STATE.settings.rsvpSummaryStyle=n;
  saveToStorage();
  navigate('rsvp-mgr');
}

// ── RSVP & Invites: per-section show/hide ──
// Section keys + labels, in page order. Stored as a hidden-list in settings.
const _RSVP_SECTIONS=[
  ['invitation','Your invitation'],
  ['sendguests','Send to guests'],
  ['tracker','Guest response tracker'],
  ['link','RSVP link & QR'],
  ['meal','Meal choice'],
  ['summary','Response summary'],
  ['dietary','Dietary requirements'],
  ['plusones','Plus-ones'],
  ['headcount','Guest headcount'],
  ['finalnumbers','Final numbers'],
  ['awaiting','Awaiting response'],
  ['inviteprogress','Invite progress'],
  ['contactable','Contactable'],
  ['seatingstatus','Seating status'],
  ['onlinersvps','Online RSVPs'],
  ['formfields','RSVP form fields']
];
// Default order = array index order of _RSVP_SECTIONS keys
const _RSVP_SECTION_KEYS=_RSVP_SECTIONS.map(s=>s[0]);
// Legacy: the old single 'invite' section became two ('invitation' + 'sendguests').
// Any saved order / hidden entry that still says 'invite' expands to both, in place.
function _rsvpExpandLegacyInvite(arr){
  const out=[];
  arr.forEach(k=>{ if(k==='invite'){ out.push('invitation','sendguests'); } else { out.push(k); } });
  return out;
}
function _rsvpHiddenSet(){
  // Under the new placement model, "hidden" = any section whose placement is 'hide'.
  // Falls back to legacy rsvpHidden only if placements haven't been initialised yet.
  if(STATE.settings&&STATE.settings.rsvpPlacements&&typeof STATE.settings.rsvpPlacements==='object'){
    const pm=STATE.settings.rsvpPlacements; const out=new Set();
    Object.keys(pm).forEach(k=>{ if(pm[k]==='hide') out.add(k); });
    return out;
  }
  let arr=(STATE.settings&&Array.isArray(STATE.settings.rsvpHidden))?STATE.settings.rsvpHidden:[];
  arr=_rsvpExpandLegacyInvite(arr);
  return new Set(arr);
}
function _rsvpSectionOrder(){
  let saved=STATE.settings&&Array.isArray(STATE.settings.rsvpOrder)?STATE.settings.rsvpOrder:[];
  saved=_rsvpExpandLegacyInvite(saved);
  // Merge saved order with known keys (in case new sections added later)
  const valid=saved.filter(k=>_RSVP_SECTION_KEYS.includes(k));
  _RSVP_SECTION_KEYS.forEach(k=>{ if(!valid.includes(k)) valid.push(k); });
  return valid;
}
function _rsvpCardCols(){
  // 'auto' | '2' | '3' | '4'
  return (STATE.settings&&STATE.settings.rsvpCardCols)||'auto';
}
function _rsvpTrackerHeight(){
  // 'short' (320px) | 'medium' (560px) | 'full' (no limit). Default full.
  return (STATE.settings&&STATE.settings.rsvpTrackerHeight)||'full';
}
// ── Section placement model: Grid / Dock / Hide + row breaks ──
// Every section (except the tracker "host") has a placement state:
//   'grid' — flows in the card grid (default)
//   'dock' — pulled beside the tracker, stacked in the companion column
//   'hide' — not rendered
// Docking is capped by tracker height (Short 1 / Medium 2 / Full unlimited); over the cap,
// extra Dock choices are refused. Row breaks split the GRID cards into rows: STATE.settings
// .rsvpRowBreaks is a set of section keys that START a new row (a break sits BEFORE them).
// The tracker itself is never dockable/hideable — it's the host everything docks to.
const _RSVP_DOCKABLE=['link','summary','dietary','plusones','invitation','sendguests','headcount','finalnumbers','awaiting','inviteprogress','contactable','seatingstatus'];
// Large widgets are tall and fill the dock column on their own.
// When one is docked the effective cap tightens to prevent empty gaps.
const _RSVP_LARGE_DOCK=['invitation','sendguests','link'];
// Base caps by tracker height (Short 2 / Medium 3 / Full unlimited).
function _rsvpDockCap(){ const h=_rsvpTrackerHeight(); return h==='short'?2:h==='medium'?3:Infinity; }
// Effective cap given a set of already-docked keys.
// If any large widget is present: Short->1 (alone), Medium->2 (large + 1 other).
function _rsvpEffectiveDockCap(dockedKeys){
  const base=_rsvpDockCap();
  if(base===Infinity) return Infinity;
  const hasLarge=dockedKeys.some(k=>_RSVP_LARGE_DOCK.includes(k));
  if(!hasLarge) return base;
  return base-1;
}
// Placement map: { key: 'grid'|'dock'|'hide' }. Migrates the old rsvpDockWidget / rsvpHidden.
function _rsvpPlacements(){
  let pm=(STATE.settings&&STATE.settings.rsvpPlacements&&typeof STATE.settings.rsvpPlacements==='object')?STATE.settings.rsvpPlacements:null;
  if(!pm){
    // First run under the new model: build from legacy settings.
    pm={};
    const legacyHidden=_rsvpExpandLegacyInvite((STATE.settings&&Array.isArray(STATE.settings.rsvpHidden))?STATE.settings.rsvpHidden:[]);
    legacyHidden.forEach(k=>{ pm[k]='hide'; });
    const legacyDock=STATE.settings&&STATE.settings.rsvpDockWidget;
    if(legacyDock&&legacyDock!=='off'&&_RSVP_DOCKABLE.includes(legacyDock)) pm[legacyDock]='dock';
  }
  // Normalise: tracker is always grid (host); unknown keys default to grid.
  const out={};
  _RSVP_SECTION_KEYS.forEach(k=>{
    if(k==='tracker'){ out[k]='grid'; return; }
    let v=pm[k];
    if(v!=='dock'&&v!=='hide') v='grid';
    if(v==='dock'&&!_RSVP_DOCKABLE.includes(k)) v='grid';
    out[k]=v;
  });
  return out;
}
function _rsvpPlacement(key){ return _rsvpPlacements()[key]||'grid'; }
// Docked keys in section order, capped by height + large-widget rule.
function _rsvpDockedKeys(){
  const pm=_rsvpPlacements();
  const order=_rsvpSectionOrder();
  const docked=order.filter(k=>pm[k]==='dock');
  // Apply effective cap iteratively: each key added may tighten the cap (large widget).
  const result=[];
  for(const k of docked){
    const cap=_rsvpEffectiveDockCap(result);
    if(cap!==Infinity && result.length>=cap) break;
    result.push(k);
  }
  return result;
}
function _rsvpSavePlacements(pm){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.rsvpPlacements=pm;
  // Keep legacy mirrors clean so old code paths don't fight the new model.
  delete STATE.settings.rsvpDockWidget;
  delete STATE.settings.rsvpDockLast;
  saveToStorage();
}
// Set one section's placement. Enforces the dock cap; returns false if refused.
function _rsvpSetPlacement(key,state){
  if(key==='tracker') return false;
  if(state==='dock'){
    if(!_RSVP_DOCKABLE.includes(key)) return false;
    const already=_rsvpDockedKeys();
    if(already.indexOf(key)<0){
      // Simulate adding this key and check the effective cap for that candidate set.
      const candidate=[...already,key];
      const cap=_rsvpEffectiveDockCap(candidate);
      if(cap!==Infinity && candidate.length>cap) return false;  // cap reached
    }
  }
  const pm=_rsvpPlacements();
  pm[key]=state;
  _rsvpSavePlacements(pm);
  navigate('rsvp-mgr');
  setTimeout(_rsvpReopenArrangeMenu,40);
  return true;
}
// ── Row breaks (Grid cards) ──
// A break sits BEFORE the key it's stored against. Only meaningful between grid cards.
function _rsvpRowBreaks(){
  const arr=(STATE.settings&&Array.isArray(STATE.settings.rsvpRowBreaks))?STATE.settings.rsvpRowBreaks:[];
  return new Set(arr);
}
function _rsvpToggleRowBreak(key){
  if(!STATE.settings) STATE.settings={};
  const set=_rsvpRowBreaks();
  if(set.has(key)) set.delete(key); else set.add(key);
  STATE.settings.rsvpRowBreaks=[...set];
  saveToStorage();
  navigate('rsvp-mgr');
  setTimeout(_rsvpReopenArrangeMenu,40);
}
function _rsvpArrangeSetTrackerHeight(v){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.rsvpTrackerHeight=v;
  saveToStorage();
  // Height changes the dock cap; a full re-render keeps placements + cap in sync.
  navigate('rsvp-mgr');
  setTimeout(_rsvpReopenArrangeMenu,40);
}
function _rsvpArrangeSetTrackerHeight_LEGACY(v){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.rsvpTrackerHeight=v;
  saveToStorage();
  _rsvpApplyTrackerHeight();
}
function _rsvpApplyTrackerHeight(){
  const wrap=document.getElementById('rsvp-list-scroll');
  if(!wrap) return;
  const h=_rsvpTrackerHeight();
  wrap.setAttribute('data-tracker-height', h);
  const px = h==='short'?'320px' : h==='medium'?'560px' : '';
  if(px){ wrap.style.maxHeight=px; wrap.style.overflowY='auto'; }
  else { wrap.style.maxHeight=''; wrap.style.overflowY=''; }
  // Zoom applies to the inner #rsvp-list only — not the height wrapper —
  // so the card height/padding are unaffected by zoom level.
  const z=_rsvpZoom();
  const listEl=document.getElementById('rsvp-list');
  if(listEl) listEl.style.zoom = z===100 ? '' : String(z/100);
}
// ── Tracker zoom (mobile-friendly): 100 | 90 | 75 (percent). Default 100. ──
function _rsvpZoom(){
  const z=STATE.settings&&STATE.settings.rsvpZoom;
  return (z===90||z===75)?z:100;
}
function _rsvpSetZoom(z){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.rsvpZoom=(z===90||z===75)?z:100;
  saveToStorage();
  rsvpRerenderList();
  // rsvpRerenderList only patches the inner list, not the #rsvp-list-scroll wrapper that
  // carries the zoom style — so push zoom (and height) onto the wrapper explicitly here.
  _rsvpApplyTrackerHeight();
  _inviteChanRefreshMenu();
}
// ── Compact columns: tighter cell padding for a denser table. Default off. ──
function _rsvpCompact(){ return !!(STATE.settings&&STATE.settings.rsvpCompact); }
function _rsvpSetCompact(on){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.rsvpCompact=!!on;
  saveToStorage();
  rsvpRerenderList();
  _inviteChanRefreshMenu();
}
// Rebuild the cog dropdown's markup in place (so Display controls reflect new
// state) and keep it open. rsvpRerenderList doesn't touch the header, so the
// menu would otherwise stay stale after a zoom/compact change.
function _inviteChanRefreshMenu(){
  const m=document.getElementById('invite-chan-menu');
  if(!m || !m.parentNode){ _inviteChanReopen(); return; }
  const tmp=document.createElement('div');
  tmp.innerHTML=_inviteChanMenuHtml().trim();
  const fresh=tmp.firstChild;
  m.parentNode.replaceChild(fresh, m);
  fresh.style.display='block';
  _inviteChanMenuOpen=true;
  _inviteChanAttachCloser();
}
function _rsvpSectionHidden(key){ return _rsvpHiddenSet().has(key); }
function _rsvpSaveHidden(set){
  STATE.settings.rsvpHidden=[...set];
  saveToStorage();
}
function _rsvpToggleSection(key){
  const set=_rsvpHiddenSet();
  if(set.has(key)) set.delete(key); else set.add(key);
  _rsvpSaveHidden(set);
  navigate('rsvp-mgr');
  setTimeout(()=>{ const m=document.getElementById('rsvp-sections-menu'); if(m){ m.style.display='block'; _rsvpAttachSectionsCloser(); } }, 40);
}
function _rsvpSectionsShowAll(){ _rsvpSaveHidden(new Set()); navigate('rsvp-mgr'); setTimeout(_rsvpReopenSectionsMenu,40); }
function _rsvpSectionsHideAll(){ _rsvpSaveHidden(new Set(_RSVP_SECTIONS.map(s=>s[0]))); navigate('rsvp-mgr'); setTimeout(_rsvpReopenSectionsMenu,40); }
function _rsvpSectionsReset(){ _rsvpSaveHidden(new Set()); if(STATE.settings){delete STATE.settings.rsvpOrder;delete STATE.settings.rsvpCardCols;}saveToStorage(); navigate('rsvp-mgr'); }

// ── Arrange sections modal ──
let _rsvpArrangeDrag=null;
function _rsvpArrangeBodyHtml(){
  const _isMobile=window.innerWidth<=600;
  const order=_rsvpSectionOrder();
  const placements=_rsvpPlacements();
  const dockedKeys=_rsvpDockedKeys();
  const dockCap=_rsvpEffectiveDockCap(dockedKeys);
  const rowBreaks=_rsvpRowBreaks();
  const th=_rsvpTrackerHeight();
  const grip=`<svg class="dragrow-grip" width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;cursor:grab;color:var(--muted)"><circle cx="9" cy="6" r="1.3" fill="currentColor"/><circle cx="15" cy="6" r="1.3" fill="currentColor"/><circle cx="9" cy="12" r="1.3" fill="currentColor"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="9" cy="18" r="1.3" fill="currentColor"/><circle cx="15" cy="18" r="1.3" fill="currentColor"/></svg>`;
  // ⓘ tooltip button reusing the global .lbl-tip / _lblToggleTip popover pattern.
  const tip=(text)=>{ const t=_escAttr(text); return `<button type="button" class="lbl-tip" aria-label="${t}" title="${t}" data-tip="${t}" onclick="event.stopPropagation();_lblToggleTip(event,this)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>`; };
  const htChip=(v,lbl)=>{
    const on=th===v;
    return `<button type="button" onclick="event.stopPropagation();_rsvpArrangeSetTrackerHeight('${v}')" style="flex:1;font-size:11.5px;padding:6px 0;border-radius:7px;cursor:pointer;text-align:center;${on?'background:var(--gold);color:#fff;border:.5px solid var(--gold)':'background:#FBF8F3;border:.5px solid #E3D7C4;color:var(--gold-deep)'}">${lbl}</button>`;
  };
  // State icons for the Grid / Dock / Hide selector.
  const icoGrid='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';
  const icoDock='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
  const icoHide='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  // One state button. `enabled` false => dimmed + inert (used for Dock past the cap).
  const stateBtn=(key,state,cur,ico,enabled)=>{
    const on=cur===state;
    const base='width:20px;height:20px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;';
    let style;
    if(on) style=base+'background:var(--gold);color:#fff;border:.5px solid var(--gold);cursor:pointer';
    else if(!enabled) style=base+'background:#FBF8F3;border:.5px solid #E3D7C4;color:var(--muted);opacity:.4;cursor:not-allowed';
    else style=base+'background:#FBF8F3;border:.5px solid #E3D7C4;color:var(--gold-deep);cursor:pointer';
    const onclick = (enabled&&!on) ? `_rsvpSetPlacement('${key}','${state}')` : (on?'':'');
    const title = state==='grid'?'Show in card grid' : state==='dock'?(enabled?'Dock beside tracker':'Dock full — raise tracker height'):'Hide';
    return `<button type="button" ${onclick?`onclick="event.stopPropagation();${onclick}"`:'disabled'} title="${title}" style="${style}">${ico}</button>`;
  };
  // Build the unified section list, inserting draggable "— new row —" dividers before any
  // GRID key that carries a row break. Dividers only appear between grid cards.
  let rowsHtml='';
  let prevGridSeen=false;
  order.forEach((key)=>{
    const s=_RSVP_SECTIONS.find(x=>x[0]===key); if(!s) return;
    const place=placements[key];
    const isTracker=(key==='tracker');
    const isGrid=(!isTracker && place==='grid');
    // Row-break divider sits BEFORE this grid key (only if there's a previous grid card).
    if(!_isMobile && isGrid && prevGridSeen && rowBreaks.has(key)){
      rowsHtml+=`<div class="rsvp-rowbreak dragrow" data-break="${key}" draggable="true"
        ondragstart="_rsvpArrangeDragStart(event,'break:${key}')"
        ondragover="_rsvpArrangeDragOver(event)" ondragleave="_rsvpArrangeDragLeave(event)"
        ondrop="_rsvpArrangeDrop(event,'${key}')"
        style="display:flex;align-items:center;justify-content:center;gap:6px;padding:4px 10px;background:#FAF4EA;border-top:1px dashed #D8C9B2;border-bottom:1px dashed #D8C9B2;color:#B7955A;font-size:8.5px;letter-spacing:.05em;text-transform:uppercase;cursor:grab">
        <span style="color:#D8C9B2">⁞⁞</span>— new row —
        <button type="button" onclick="event.stopPropagation();_rsvpToggleRowBreak('${key}')" title="Remove row break" style="background:none;border:none;color:#B7955A;cursor:pointer;padding:0 0 0 4px;font-size:12px;line-height:1">×</button>
      </div>`;
    }
    const newTag='';
    if(isTracker){
      rowsHtml+=`<div class="rsvp-arr-row dragrow" data-key="${key}" draggable="true"
        ondragstart="_rsvpArrangeDragStart(event,'${key}')" ondragover="_rsvpArrangeDragOver(event)"
        ondragleave="_rsvpArrangeDragLeave(event)" ondrop="_rsvpArrangeDrop(event,'${key}')"
        style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:.5px solid var(--border);background:var(--cream)">
        ${grip}<span style="flex:1;font-size:12.5px;color:var(--ink)">${s[1]}</span>
        <span style="font-size:8.5px;color:var(--muted);font-style:italic">host</span>
      </div>`;
      return;
    }
    const dockable=_RSVP_DOCKABLE.includes(key);
    const isDocked=(place==='dock');
    // Dock enabled if already docked (so you can un-pick) OR adding this key stays within the
    // effective cap (which tightens if a large widget would be in the set).
    const _candidateSet = isDocked ? dockedKeys : [...dockedKeys, key];
    const _effCap = _rsvpEffectiveDockCap(_candidateSet);
    const dockEnabled = dockable && (isDocked || (_effCap===Infinity ? true : _candidateSet.length<=_effCap));
    const rowBg = place==='dock' ? 'background:#FAF8F3' : (place==='hide' ? 'background:#F6F1EA' : 'background:var(--cream)');
    const rowOpacity = place==='hide' ? 'opacity:.6' : '';
    const nameColor = place==='hide' ? 'var(--muted)' : 'var(--ink)';
    rowsHtml+=`<div class="rsvp-arr-row dragrow" data-key="${key}" draggable="true"
      ondragstart="_rsvpArrangeDragStart(event,'${key}')" ondragover="_rsvpArrangeDragOver(event)"
      ondragleave="_rsvpArrangeDragLeave(event)" ondrop="_rsvpArrangeDrop(event,'${key}')"
      style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:.5px solid var(--border);${rowBg};${rowOpacity};transition:background .1s">
      ${grip}
      <span style="flex:1;font-size:12.5px;color:${nameColor}">${s[1]}${newTag}</span>
      ${(()=>{
        if(_isMobile) return `<span style="display:flex;gap:4px">${stateBtn(key,'hide',place,icoHide,true)}</span>`;
        const _dockBtn=dockable?stateBtn(key,'dock',place,icoDock,dockEnabled):'<span style="width:20px;height:20px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;opacity:.25;color:var(--muted);border:.5px dashed var(--border)" title="Not dockable">'+icoDock+'</span>';
        return `<span style="display:flex;gap:4px">${stateBtn(key,'grid',place,icoGrid,true)}${_dockBtn}${stateBtn(key,'hide',place,icoHide,true)}</span>`;
      })()}
      ${(!_isMobile && isGrid)?(()=>{
        return prevGridSeen?`<button type="button" onclick="event.stopPropagation();_rsvpToggleRowBreak('${key}')" title="${rowBreaks.has(key)?'Row starts here — click to merge up':'Start a new row here'}" style="background:none;border:none;cursor:pointer;padding:0 0 0 2px;color:${rowBreaks.has(key)?'var(--gold-deep)':'var(--muted)'};flex-shrink:0" aria-label="Toggle row break">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12" stroke-dasharray="3 3"/><polyline points="8 8 4 12 8 16"/></svg>
        </button>`:'<span style="width:14px;flex-shrink:0"></span>';
      })():''}
    </div>`;
    if(isGrid) prevGridSeen=true;
  });
  const capLabel = dockCap===Infinity?'dock: no limit':`dock: ${dockCap} max${dockedKeys.some(k=>_RSVP_LARGE_DOCK.includes(k))?' (large widget)':''}`;
  return `<div style="display:flex;flex-direction:column;gap:13px">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep)">Arrange &amp; dock sections</div>
      <button onclick="event.stopPropagation();_rsvpArrangeReset()" style="background:none;border:none;color:var(--gold-deep);cursor:pointer;font-size:10px;text-decoration:underline;font-family:inherit;padding:0">Reset</button>
    </div>
    <div style="background:var(--surface);border:.5px solid var(--border);border-radius:9px;padding:10px 12px">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:7px">
        <span style="font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)">Tracker height</span>
        ${tip('Short (320px) and Medium (560px) scroll inside the card; Full shows every guest with no inner scroll. Tracker height also sets how many widgets can dock beside it: Short 2, Medium 3, Full unlimited. Invitation, Send to guests and RSVP Link are tall widgets — when one is docked the cap tightens by 1.')}
        <span style="margin-left:auto;font-size:8.5px;color:var(--muted)">${capLabel}</span>
      </div>
      <div class="rsvp-trackh-chips" style="display:flex;gap:5px">${htChip('short','Short')}${htChip('medium','Medium')}${htChip('full','Full')}</div>
    </div>
    <div>
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
        <span style="font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)">Sections</span>
        ${tip('Each section is Grid (in the card grid), Dock (beside the tracker), or Hide. Drag rows to reorder. Use the row-break arrow on a grid card to start a new row, so you can put e.g. 3 cards on one row and 2 on the next. Docked widgets stack beside the tracker and are capped by tracker height.')}
        ${_isMobile?'<span style="margin-left:auto;display:flex;gap:9px;font-size:7.5px;color:var(--muted);letter-spacing:.03em;text-transform:uppercase;padding-right:4px"><span>Hide</span></span>':'<span style="margin-left:auto;display:flex;gap:9px;font-size:7.5px;color:var(--muted);letter-spacing:.03em;text-transform:uppercase;padding-right:16px"><span>Grid</span><span>Dock</span><span>Hide</span></span>'}
      </div>
      <div id="rsvp-arr-list" style="border:.5px solid var(--border);border-radius:10px;overflow:hidden">${rowsHtml}</div>
      ${_isMobile?'':'<div style="font-size:10px;color:var(--muted);margin-top:8px;line-height:1.5">Dimmed <span style="color:var(--gold-deep)">Dock</span> means the height cap is reached — raise tracker height or un-dock another widget.</div>'}
    </div>
  </div>`;
}
// The cog now opens an anchored dropdown LIST (not a centered popup). Toggled open/closed,
// closes on outside click. All the inner controls apply live, so there's no Done button.
function _rsvpArrangeMenuHtml(){
  return `<div id="rsvp-arrange-menu" onclick="event.stopPropagation()" style="display:none;position:absolute;top:calc(100% + 6px);right:0;z-index:60;width:280px;max-height:min(560px,80vh);overflow-y:auto;background:var(--cream);border:1px solid var(--border);border-radius:11px;box-shadow:0 4px 24px rgba(26,26,24,.14);padding:14px 15px;text-align:left">${_rsvpArrangeBodyHtml()}</div>`;
}
function _rsvpToggleArrange(e){
  if(e) e.stopPropagation();
  const m=document.getElementById('rsvp-arrange-menu');
  if(!m) return;
  const showing=m.style.display!=='none' && m.style.display!=='';
  m.style.display=showing?'none':'block';
  if(!showing) _rsvpAttachArrangeCloser();
}
function _rsvpAttachArrangeCloser(){
  const close=(ev)=>{
    const menu=document.getElementById('rsvp-arrange-menu');
    const wrap=document.getElementById('rsvp-sections-wrap');
    if(menu && wrap && !wrap.contains(ev.target)){ menu.style.display='none'; document.removeEventListener('click',close); }
  };
  setTimeout(()=>document.addEventListener('click',close),0);
}
function _rsvpReopenArrangeMenu(){ const m=document.getElementById('rsvp-arrange-menu'); if(m){ m.style.display='block'; _rsvpAttachArrangeCloser(); } }
function _rsvpArrangeRebuild(){
  // The unified menu is regenerated wholesale from _rsvpArrangeBodyHtml so that placement
  // state, dock caps, row breaks, and the sections list all stay in sync. In-place patching
  // of individual controls is no longer needed.
  const menu=document.getElementById('rsvp-arrange-menu');
  if(menu) menu.innerHTML=_rsvpArrangeBodyHtml();
}
function _rsvpArrangeDragStart(e,key){
  _rsvpArrangeDrag=key;
  try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',key); }catch(_){}
  e.stopPropagation();
}
function _rsvpArrangeDragOver(e){
  e.preventDefault();
  const row=e.currentTarget;
  const r=row.getBoundingClientRect();
  const after=(e.clientY-r.top)>r.height/2;
  row.style.borderTop=after?'':'2px solid var(--gold)';
  row.style.borderBottom=after?'2px solid var(--gold)':'';
}
function _rsvpArrangeDragLeave(e){
  const row=e.currentTarget;
  row.style.borderTop=''; row.style.borderBottom='';
}
function _rsvpArrangeDrop(e,target){
  e.preventDefault();
  const row=e.currentTarget; row.style.borderTop=''; row.style.borderBottom='';
  // Row-break dividers carry a 'break:key' drag token — they aren't reorderable sections.
  if(!_rsvpArrangeDrag || _rsvpArrangeDrag===target || String(_rsvpArrangeDrag).indexOf('break:')===0){ _rsvpArrangeDrag=null; return; }
  const r=row.getBoundingClientRect();
  const after=(e.clientY-r.top)>r.height/2;
  const order=_rsvpSectionOrder();
  const fi=order.indexOf(_rsvpArrangeDrag), ti=order.indexOf(target);
  if(fi<0||ti<0){ _rsvpArrangeDrag=null; return; }
  order.splice(fi,1);
  const newTi=order.indexOf(target);
  order.splice(after?newTi+1:newTi, 0, _rsvpArrangeDrag);
  _rsvpArrangeDrag=null;
  if(!STATE.settings) STATE.settings={};
  STATE.settings.rsvpOrder=order;
  saveToStorage();
  _rsvpArrangeApplyAndReopen();
}
function _rsvpArrangeToggle(key){
  const set=_rsvpHiddenSet();
  if(set.has(key)) set.delete(key); else set.add(key);
  _rsvpSaveHidden(set);
  _rsvpArrangeApplyAndReopen();
}
function _rsvpArrangeSetCols(v){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.rsvpCardCols=v;
  saveToStorage();
  _rsvpArrangeApplyAndReopen();
}
// Re-render the page so a change (cols / show-hide / reorder) takes visual effect, then
// reopen the dropdown so it behaves like a persistent list rather than a one-shot popup.
function _rsvpArrangeApplyAndReopen(){
  navigate('rsvp-mgr');
  setTimeout(_rsvpReopenArrangeMenu,0);
}
function _rsvpArrangeReset(){
  if(STATE.settings){
    delete STATE.settings.rsvpOrder;
    delete STATE.settings.rsvpCardCols;
    delete STATE.settings.rsvpTrackerHeight;
    delete STATE.settings.rsvpPlacements;
    delete STATE.settings.rsvpRowBreaks;
    delete STATE.settings.rsvpDockWidget;
    delete STATE.settings.rsvpDockLast;
  }
  _rsvpSaveHidden(new Set());
  _rsvpArrangeApplyAndReopen();
}
function _rsvpReopenSectionsMenu(){ const m=document.getElementById('rsvp-sections-menu'); if(m){ m.style.display='block'; _rsvpAttachSectionsCloser(); } }
function _rsvpAttachSectionsCloser(){
  const close=(ev)=>{
    const menu=document.getElementById('rsvp-sections-menu');
    const wrap=document.getElementById('rsvp-sections-wrap');
    if(menu && wrap && !wrap.contains(ev.target)){ menu.style.display='none'; document.removeEventListener('click',close); }
  };
  setTimeout(()=>document.addEventListener('click',close),0);
}
function _rsvpToggleSectionsMenu(e){
  if(e) e.stopPropagation();
  const m=document.getElementById('rsvp-sections-menu');
  if(!m) return;
  const showing=m.style.display!=='none' && m.style.display!=='';
  m.style.display=showing?'none':'block';
  if(!showing) _rsvpAttachSectionsCloser();
}
function _rsvpSectionsMenuHtml(){
  const hidden=_rsvpHiddenSet();
  const rows=_RSVP_SECTIONS.map(([key,label])=>{
    const shown=!hidden.has(key);
    return `<label onclick="event.stopPropagation()" style="display:flex;align-items:center;justify-content:space-between;gap:9px;font-size:12.5px;color:${shown?'var(--ink)':'var(--muted)'};padding:6px 2px;cursor:pointer">
      <span>${label}</span>
      ${_toggleSwitch(shown, `_rsvpToggleSection('${key}')`)}
    </label>`;
  }).join('');
  return `<div id="rsvp-sections-menu" style="display:none;position:absolute;top:calc(100% + 6px);right:0;z-index:60;width:250px;background:var(--cream);border:1px solid var(--border);border-radius:11px;box-shadow:0 4px 24px rgba(26,26,24,.12);padding:13px 15px;text-align:left">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
      <div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep)">Show sections</div>
      <button onclick="_rsvpSectionsReset()" style="background:none;border:none;color:var(--gold-deep);cursor:pointer;font-size:10px;text-decoration:underline;font-family:inherit;padding:0">Reset</button>
    </div>
    ${rows}
  </div>`;
}

// ── RSVP nudge list ──────────────────────────────────────────────────────────
// Filters to A-list guests still awaiting a reply; offers a one-tap pre-filled
// message (Text when a phone is on file, else Email) plus a bulk email.
function _rsvpNudgeList(){
  return (STATE.guests||[]).filter(g=>{
    if((g.listType||'A')==='B') return false;
    if(g.relationship==='Plus One') return false;
    const st=(!g.rsvp||g.rsvp==='awaiting')?'awaiting':g.rsvp;
    return st==='awaiting';
  });
}
function _rsvpNudgeMessage(g){
  const ev=STATE.event||{};
  const couple=[ev.partner1,ev.partner2].filter(Boolean).join(' & ');
  const dateStr=ev.date?fmtDate(ev.date):'';
  const first=(g&&g.name?String(g.name).trim().split(/\s+/)[0]:'there');
  // Warm, no emoji.
  const occasion=couple?`${couple}'s wedding`:'our wedding';
  const whenBit=dateStr?` on ${dateStr}`:'';
  return `Hi ${first}, we're finalising numbers for ${occasion}${whenBit}. Could you let us know if you'll be able to join us? We'd love to have you there.`;
}
function _rsvpNudgeInitials(name){
  const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '?';
  return (parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase();
}
function rsvpNudgeText(gid){
  const g=STATE.guests.find(x=>x.id===gid); if(!g) return;
  const num=String(g.phone||'').replace(/[^+\d]/g,'');
  const msg=_rsvpNudgeMessage(g);
  if(!num) return;
  window.location.href=`sms:${num}?&body=${encodeURIComponent(msg)}`;
}
function rsvpNudgeEmail(gid){
  const g=STATE.guests.find(x=>x.id===gid); if(!g) return;
  const ev=STATE.event||{};
  const couple=[ev.partner1,ev.partner2].filter(Boolean).join(' & ');
  const subject=couple?`RSVP — ${couple}`:'RSVP reminder';
  const msg=_rsvpNudgeMessage(g);
  window.location.href=`mailto:${encodeURIComponent(g.email||'')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
}
function rsvpNudgeEmailAll(){
  const ev=STATE.event||{};
  const couple=[ev.partner1,ev.partner2].filter(Boolean).join(' & ');
  const dateStr=ev.date?fmtDate(ev.date):'';
  const recips=_rsvpNudgeList().filter(g=>(g.email||'').trim()).map(g=>g.email.trim());
  if(!recips.length){ alert('None of the awaiting guests have an email on file.'); return; }
  const subject=couple?`RSVP — ${couple}`:'RSVP reminder';
  const occasion=couple?`${couple}'s wedding`:'our wedding';
  const whenBit=dateStr?` on ${dateStr}`:'';
  const body=`Hi, we're finalising numbers for ${occasion}${whenBit}. Could you let us know if you'll be able to join us? We'd love to have you there.`;
  // Use BCC so addresses stay private.
  window.location.href=`mailto:?bcc=${encodeURIComponent(recips.join(','))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function openRsvpNudge(){
  const list=_rsvpNudgeList();
  const emailable=list.filter(g=>(g.email||'').trim()).length;
  const rows=list.length?list.map(g=>{
    const phone=String(g.phone||'').trim();
    const email=String(g.email||'').trim();
    let btn, contact, contactCol='var(--muted)';
    if(phone){ btn=`<button class="btn btn-outline btn-sm" onclick="rsvpNudgeText('${g.id}')" style="gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Text</button>`; contact=phone; }
    else if(email){ btn=`<button class="btn btn-outline btn-sm" onclick="rsvpNudgeEmail('${g.id}')" style="gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>Email</button>`; contact=email; }
    else { btn=`<button class="btn btn-sm" style="opacity:.55;cursor:not-allowed" disabled>—</button>`; contact='No phone or email on file'; contactCol='var(--red)'; }
    return `<div style="display:flex;align-items:center;gap:11px;padding:9px 10px;border:.5px solid var(--border);border-radius:11px;margin-bottom:7px">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--surface);color:var(--gold-deep);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0">${_rsvpNudgeInitials(g.name)}</div>
        <div style="flex:1;min-width:0"><div style="font-size:13px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_escHtml(g.name||'')}</div><div style="font-size:11px;color:${contactCol};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_escHtml(contact)}</div></div>
        ${btn}
      </div>`;
  }).join(''):`<div style="text-align:center;color:var(--muted);padding:26px 10px"><div style="font-size:14px;color:var(--ink);margin-bottom:4px">Everyone's responded.</div><div style="font-size:12.5px">No guests are awaiting a reply right now.</div></div>`;
  const bulk=emailable?`<button class="btn btn-primary" style="width:100%;justify-content:center;gap:6px;margin-top:6px" onclick="rsvpNudgeEmailAll()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Email everyone with an address (${emailable})</button>`:'';
  const intro=list.length?`<div style="font-size:12px;color:var(--muted);margin-bottom:13px">Send a friendly nudge — the message is pre-filled, you just hit send.</div>`:'';
  openModal('Still awaiting reply', intro+rows+bulk, `<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Close</button>`);
  // The modal title is set via textContent, so inject the count pill as rich HTML after.
  const _nt=document.getElementById('modal-title');
  if(_nt){
    _nt.innerHTML=`<div style="display:flex;align-items:center;gap:9px"><span>Still awaiting reply</span>${list.length?`<span style="font-size:11px;font-weight:600;color:var(--gold-deep);background:var(--surface);border:.5px solid var(--border);border-radius:20px;padding:3px 10px">${list.length} guest${list.length!==1?'s':''}</span>`:''}</div>`;
  }
}

// ── Guest age bands (adult / child / infant) ────────────────────────────────
// Stored on g.ageBand; absent/unknown ⇒ 'adult' so existing guests are treated
// as adults with no migration. Used for per-head budget exclusions and badges.
const _AGE_BANDS=['adult','child','infant'];
const _AGE_BAND_META={
  adult: {label:'Adult'},
  child: {label:'Child',  tint:'rgba(90,123,160,.14)',  ink:'var(--gt-fam)',   darkTint:'rgba(138,166,200,.18)', darkInk:'#8AA6C8'},
  infant:{label:'Infant', tint:'rgba(154,79,149,.13)',  ink:'var(--sep-ink)',  darkTint:'rgba(216,169,211,.16)', darkInk:'#D8A9D3'}
};
function _guestAgeBand(g){ const b=g&&g.ageBand; return _AGE_BANDS.indexOf(b)>=0?b:'adult'; }
function _setGuestAgeBand(g, band){
  if(!g) return;
  if(_AGE_BANDS.indexOf(band)<0) band='adult';
  if(band==='adult') delete g.ageBand; else g.ageBand=band; // keep default implicit
}
// Infer age band from a guest's tag list. Returns 'infant', 'child', or null.
// 'adult' is the implicit default so null means "no tag-derived band, leave as-is".
function _ageBandFromTags(tags){
  if(!Array.isArray(tags)||!tags.length) return null;
  const n=t=>String(t||'').toLowerCase().replace(/[\s_-]/g,'');
  for(const t of tags){
    const k=n(t);
    if(/^(infant|baby|bub|bubs|newborn)$/.test(k)) return 'infant';
    if(/^(child|children|kid|kids|toddler|junior)$/.test(k)) return 'child';
  }
  return null;
}
// Small badge shown beside a name (nothing for adults). Uses class-based dark
// overrides via .age-badge-child / .age-badge-infant (defined in CSS).
function _ageBandLabel(band){ return (_AGE_BAND_META[band]||{}).label||''; }
function _ageBandBadge(g){
  const b=_guestAgeBand(g);
  if(b==='adult') return '';
  const m=_AGE_BAND_META[b];
  return `<span class="age-badge age-badge-${b}" style="font-size:9.5px;padding:1px 7px;border-radius:9px;white-space:nowrap;margin-left:6px;vertical-align:middle">${m.label}</span>`;
}
// Segmented control (matches .inv-seg). Writes the chosen band into a hidden
// input (id) that the save handler reads. onChangeJs (optional) runs after set.
function _ageBandSegHtml(id, current, onChangeJs){
  const cur=_AGE_BANDS.indexOf(current)>=0?current:'adult';
  const btns=_AGE_BANDS.map(b=>{
    const on=b===cur;
    return `<button type="button" class="inv-seg-btn${on?' active':''}" data-band="${b}" onclick="_ageBandSegPick('${id}','${b}'${onChangeJs?','+JSON.stringify(onChangeJs):''})">${_AGE_BAND_META[b].label}</button>`;
  }).join('');
  return `<span class="inv-seg" id="${id}-seg" data-target="${id}">${btns}</span><input type="hidden" id="${id}" value="${cur}"/>`;
}
function _ageBandSegPick(id, band, onChangeJs){
  const inp=document.getElementById(id); if(inp) inp.value=band;
  const seg=document.getElementById(id+'-seg');
  if(seg) seg.querySelectorAll('.inv-seg-btn').forEach(btn=>{ btn.classList.toggle('active', btn.getAttribute('data-band')===band); });
  if(onChangeJs){ try{ (new Function(onChangeJs))(); }catch(_){ } }
}
// Set a guest's band directly (used by inline tracker/list controls) and re-render.
function _guestSetAgeBandInline(gid, band, rerenderFn){
  const g=STATE.guests.find(x=>x.id===gid); if(!g) return;
  _setGuestAgeBand(g, band);
  saveToStorage();
  if(rerenderFn && typeof window[rerenderFn]==='function') window[rerenderFn]();
}
// ── Per-head effective attending count ──────────────────────────────────────
// Base = attending guests (optionally scoped to invited/list-A as callers do).
// Infants are ALWAYS excluded from per-head; children excluded when the budget
// setting excludeChildrenPerHead is on. Only meaningful when per-head uses the
// RSVP count (callers gate on STATE.budget.useRsvpCount).
function _perHeadExcludesChildren(){ return !!(STATE.budget && STATE.budget.excludeChildrenPerHead); }
function _rsvpPerHeadCount(){
  const exChild=_perHeadExcludesChildren();
  return STATE.guests.filter(g=>{
    if(g.rsvp!=='attending') return false;
    const b=_guestAgeBand(g);
    if(b==='infant') return false;          // infants always excluded
    if(b==='child' && exChild) return false; // children excluded when toggled
    return true;
  }).length;
}
// Breakdown for the settings helper line: {attending, adults, children, infants, counted}.
function _rsvpPerHeadBreakdown(){
  let attending=0, adults=0, children=0, infants=0;
  STATE.guests.forEach(g=>{
    if(g.rsvp!=='attending') return;
    attending++;
    const b=_guestAgeBand(g);
    if(b==='infant') infants++; else if(b==='child') children++; else adults++;
  });
  const counted=_rsvpPerHeadCount();
  return {attending, adults, children, infants, counted};
}

// Tracker click-to-sort: sortable columns (phone/email/address excluded).
const _RSVP_SORTABLE=new Set(['name','status','date','rsvpby','dietary','tags','handle','invited','reminder','ageband']);
// Sort value for a group (via its first member g / group grp) by tracker column key.
function _rsvpSortValue(g, key, grp){
  if(!g) return '';
  switch(key){
    case 'name': return String(g.name||'').toLowerCase();
    case 'status': return _RSVP_RANK[g.rsvp||'awaiting'] ?? 0;
    case 'date': return g.rsvpDate ? String(g.rsvpDate) : '9999-99-99'; // undated last (asc)
    case 'rsvpby': return g.rsvpByOverride ? String(g.rsvpByOverride) : ((STATE.settings&&STATE.settings.rsvpBy)||'9999-99-99');
    case 'dietary': return ((g.dietary||[]).map(d=>String(d).toLowerCase()).sort().join('|'))||'~~~';
    case 'tags': return ((g.tags||[]).map(t=>String(t).toLowerCase()).sort().join('|'))||'~~~';
    case 'handle': return String(g.handle||'~~~').toLowerCase();
    case 'ageband': return _AGE_BANDS.indexOf(_guestAgeBand(g)); // adult(0)<child(1)<infant(2)
    case 'invited': {
      const sk=grp?_groupSlotKey(grp):null;
      return (sk && typeof isInvited==='function' && isInvited(sk))?0:1;
    }
    case 'reminder': {
      const sk=grp?_groupSlotKey(grp):null;
      const meta=(sk&&STATE.inviteMeta&&STATE.inviteMeta[sk])||{};
      return (meta.reminder&&meta.reminder.sent)?0:1;
    }
    default: return String(g[key]||'').toLowerCase();
  }
}
function _rsvpSortClick(colKey){ _cycleSort('rsvpSort', colKey); rsvpRerenderList(); }

// ── Online RSVPs: helpers for grouped household display ──────────────────────
let _orsvpGroups=null;
function _orsvpBuildGroups(rows){
  const rowsByName={};
  rows.forEach(r=>{if(!r.guest_name)return;const k=r.guest_name.trim().toLowerCase();if(!rowsByName[k])rowsByName[k]=[];rowsByName[k].push(r);});
  const allG=STATE.guests||[];
  const matched=allG.filter(g=>g&&g.name&&rowsByName[g.name.trim().toLowerCase()]);
  const inList=new Set(matched.map(g=>g.id));
  const byId=Object.fromEntries(matched.map(g=>[g.id,g]));
  const used=new Set();const groups=[];
  matched.forEach(g=>{
    if(used.has(g.id))return;
    const fam=(STATE.families||[]).find(f=>f.memberIds.includes(g.id));
    if(fam){const mem=fam.memberIds.filter(id=>inList.has(id)).map(id=>byId[id]);if(mem.length>1){mem.forEach(x=>used.add(x.id));groups.push({kind:fam.kind==='household'?'household':'family',members:mem});return;}}
    if(g.coupleId&&inList.has(g.coupleId)&&!used.has(g.coupleId)){const p=byId[g.coupleId];used.add(g.id);used.add(p.id);groups.push({kind:'couple',members:[g,p]});return;}
    if(g.plusOneId&&inList.has(g.plusOneId)&&!used.has(g.plusOneId)){const p=byId[g.plusOneId];used.add(g.id);used.add(p.id);groups.push({kind:'plusone',members:[g,p]});return;}
    used.add(g.id);groups.push({kind:'single',members:[g]});
  });
  // Unrecognised names not in STATE.guests
  Object.keys(rowsByName).forEach(k=>{
    if(!matched.some(g=>g.name.trim().toLowerCase()===k)){const r=rowsByName[k][0];groups.push({kind:'single',members:[{id:'anon-'+k,name:r.guest_name}]});}
  });
  // Attach row data
  groups.forEach(grp=>{
    grp.members=grp.members.map(m=>{const rws=(rowsByName[(m.name||'').trim().toLowerCase()]||[]);return Object.assign({},m,{_rows:rws});});
    const all=grp.members.flatMap(m=>m._rows).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    grp.contact={email:null,phone:null,address:null};
    ['email','phone','address'].forEach(f=>{const m=grp.members.find(m=>m._rows[0]&&m._rows[0][f]);if(m)grp.contact[f]=m._rows[0][f];});
    grp.message=all[0]?all[0].message:'';
    grp.submittedDate=all[0]?all[0].created_at:null;
    const fn=grp.members.map(m=>(m.name||'').split(' ')[0]);
    grp.householdName=fn.length===1?grp.members[0].name:fn.length===2?fn[0]+' & '+fn[1]:fn.slice(0,-1).join(', ')+' & '+fn[fn.length-1];
    grp.initials=fn.map(n=>n[0]||'').join('').slice(0,2).toUpperCase();
    grp.hasHistory=grp.members.some(m=>m._rows.length>1);
    grp.attendingAll=grp.members.filter(m=>m._rows[0]&&m._rows[0].attending==='yes').length;
    grp.totalAll=grp.members.length;
  });
  return groups;
}
function _orsvpRender(){
  const filter=window._orsvpFilter||'all';
  const view=window._orsvpView||'card';
  const groups=(_orsvpGroups||[]).slice().sort((a,b)=>new Date(b.submittedDate||0)-new Date(a.submittedDate||0));
  const toolbar=document.getElementById('orsvp-toolbar');
  const listEl=document.getElementById('orsvp-list');
  if(!listEl)return;
  // Toolbar
  if(toolbar){
    const pill=(f,label)=>`<button onclick="_orsvpSetFilter('${f}')" style="padding:4px 11px;border-radius:20px;border:1.5px solid ${filter===f?'var(--gold-deep)':'var(--border)'};background:${filter===f?'var(--gold-deep)':'transparent'};color:${filter===f?'#fff':'var(--muted)'};font-size:12px;font-weight:600;font-family:inherit;cursor:pointer">${label}</button>`;
    const vBtn=(v,svg)=>`<button onclick="_orsvpSetView('${v}')" title="${v==='card'?'Card view':'List view'}" style="width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;border:1px solid ${view===v?'var(--gold-deep)':'var(--border)'};background:${view===v?'var(--gold-deep)':'transparent'};color:${view===v?'#fff':'var(--muted)'};cursor:pointer;flex-shrink:0">${svg}</button>`;
    toolbar.innerHTML=`<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      ${pill('all','All')}${pill('yes','Attending')}${pill('no','Declined')}
      <div style="margin-left:auto;display:flex;gap:4px">
        ${vBtn('card','<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>')}
        ${vBtn('list','<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>')}
      </div>
    </div>`;
  }
  const _pdi=function(d){if(d&&d.startsWith('other:'))return'Other'+(d.slice(6)?' ('+d.slice(6)+')':'');if(d&&d.startsWith('allergy:'))return'Allergy'+(d.slice(8)?': '+d.slice(8):'');const m={vegetarian:'Vegetarian',pescatarian:'Pescatarian',vegan:'Vegan',halal:'Halal',kosher:'Kosher',lactose:'Lactose int.',gluten:'Gluten int.',allergy:'Allergy',other:'Other',glutenfree:'GF',dairyfree:'DF',nutallergy:'Nut allergy'};return m[d]||d;};
  const _fmt=iso=>{if(!iso)return'—';const d=new Date(iso);return isNaN(d)?iso:d.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});};
  const _badge=st=>st==='yes'?`<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;background:rgba(74,124,89,.1);color:var(--green);font-size:11px;font-weight:600;white-space:nowrap">✓ Attending</span>`:st==='no'?`<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;background:rgba(192,57,43,.07);color:var(--red);font-size:11px;font-weight:600;white-space:nowrap">✗ Declined</span>`:'';

  let html='';let shown=0;
  groups.forEach(grp=>{
    let vis=grp.members;
    if(filter==='yes') vis=vis.filter(m=>m._rows[0]&&m._rows[0].attending==='yes');
    else if(filter==='no') vis=vis.filter(m=>m._rows[0]&&m._rows[0].attending==='no');
    if(!vis.length)return;
    shown++;
    const summaryLine=`${grp.attendingAll} of ${grp.totalAll} attending`;
    const histBtn=grp.hasHistory?`<button onclick="_orsvpToggleHistory(this)" data-grp-id="${grp.initials+grp.members[0].id.replace(/[^a-z0-9]/gi,'')}" title="View RSVP history" style="display:inline-flex;align-items:center;gap:3px;background:none;border:none;padding:2px 4px;font:inherit;font-size:11px;color:var(--muted);cursor:pointer;border-radius:4px;vertical-align:middle"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> History</button>`:'';
    // History rows for this group
    const histId='orhist-'+grp.initials+(grp.members[0].id||'').replace(/[^a-z0-9]/gi,'');
    const histRowsHtml=grp.members.flatMap(m=>m._rows.map((r,i)=>({name:m.name,r,i,len:m._rows.length}))).filter(x=>x.len>1||grp.hasHistory).sort((a,b)=>new Date(a.r.created_at)-new Date(b.r.created_at)).map((x,idx,arr)=>{
      const prev=arr[idx-1];const st=x.r.attending==='yes'?'attending':x.r.attending==='no'?'declined':'—';
      const prevSt=prev&&prev.name===x.name?(prev.r.attending==='yes'?'attending':prev.r.attending==='no'?'declined':'—'):null;
      const isChange=prevSt&&prevSt!==st;
      return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11.5px;color:var(--muted)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg><span style="color:var(--ink);font-weight:500">${x.name}</span> <span style="${isChange?'color:var(--red)':''}">${isChange?'changed to ':''}${st}</span> <span style="margin-left:auto">${_fmt(x.r.created_at)}</span></div>`;
    }).join('');

    if(view==='card'){
      const memberRows=vis.map(m=>{
        const row=m._rows[0]||{};
        const dietItems=Array.isArray(row.dietary)?row.dietary:[];
        const dietHtml=dietItems.length?`<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">${dietItems.map(d=>`<span style="border:1px solid var(--border);border-radius:20px;padding:1px 7px;font-size:10.5px;color:var(--muted)">${_pdi(d)}</span>`).join('')}</div>`:'';
        const mealHtml=row.meal?`<span style="display:inline-block;background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-size:10.5px;font-weight:500;color:var(--ink);margin-top:4px">${row.meal}</span>`:'';
        const hcHtml=row.high_chair?`<span style="display:inline-block;font-size:10.5px;color:var(--muted);margin-top:4px">🪑 High chair</span>`:'';
        return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500;color:var(--ink)">${m.name}</div>${mealHtml}${hcHtml}${dietHtml}</div>
          <div style="flex-shrink:0;padding-top:1px">${_badge(row.attending)}</div>
        </div>`;
      }).join('');
      const c=grp.contact;
      const ci=[c.email?`<span style="font-size:11.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">${c.email}</span>`:'',c.phone?`<span style="font-size:11.5px;color:var(--ink);white-space:nowrap;flex-shrink:0">${c.phone}</span>`:'',c.address?`<span style="font-size:11.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">${c.address}</span>`:''].filter(Boolean);
      const contactHtml=ci.length?`<div style="background:var(--surface);border-top:1px solid var(--border);padding:9px 14px;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;min-width:0"><span style="font-size:10.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-right:2px;flex-shrink:0">Contact</span>${ci.join('<span style="color:var(--border);flex-shrink:0">·</span>')}</div>`:'';
      const msgHtml=grp.message?`<div style="border-top:1px solid var(--border);padding:9px 14px;font-size:12px;color:var(--muted);font-style:italic">“${grp.message}”</div>`:'';
      const histSection=grp.hasHistory?`<div id="${histId}" hidden style="border-top:1px solid var(--border);padding:10px 14px"><div style="font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Submission history</div>${histRowsHtml}</div>`:'';
      html+=`<div style="background:var(--cream);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04)">
        <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border)">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--surface);color:var(--muted);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;letter-spacing:-.02em">${grp.initials}</div>
          <div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${grp.householdName}</div><div style="font-size:11.5px;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${summaryLine}</div></div>
          <div style="font-size:11px;color:var(--muted);flex-shrink:0;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:3px;white-space:nowrap">${_fmt(grp.submittedDate)}${histBtn}</div>
        </div>
        ${memberRows}${contactHtml}${msgHtml}${histSection}
      </div>`;
    } else {
      // List view
      const memberRows=vis.map(m=>{
        const row=m._rows[0]||{};
        const dietItems=Array.isArray(row.dietary)?row.dietary:[];
        const chips=dietItems.length?dietItems.map(d=>`<span style="border:1px solid var(--border);border-radius:20px;padding:1px 6px;font-size:10.5px;color:var(--muted)">${_pdi(d)}</span>`).join(''):'';
        const meal=row.meal?`<span style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-size:10.5px;font-weight:500;color:var(--ink)">${row.meal}</span>`:'';
        return `<div style="display:flex;align-items:center;gap:8px;padding:7px 14px 7px 46px;border-bottom:1px solid var(--border);flex-wrap:wrap">
          <span style="font-size:12.5px;font-weight:500;color:var(--ink);flex-shrink:0">${m.name}</span>
          ${_badge(row.attending)}
          ${meal}
          ${chips}
        </div>`;
      }).join('');
      const c=grp.contact;const ci=[c.email,c.phone,c.address].filter(Boolean);
      const contactRow=ci.length?`<div style="display:flex;gap:16px;flex-wrap:wrap;padding:4px 14px 7px calc(14px + 28px + 8px);font-size:11px;color:var(--muted);background:var(--surface);border-bottom:1px solid var(--border)">${ci.map(x=>`<span>${x}</span>`).join('')}</div>`:'';
      const histSection=grp.hasHistory?`<div id="${histId}" hidden style="padding:6px 14px 8px 46px;border-bottom:1px solid var(--border)"><div style="font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">History</div>${histRowsHtml}</div>`:'';
      html+=`<div style="background:var(--cream);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:0">
        <div style="display:flex;align-items:center;gap:8px;padding:9px 14px ${ci.length?'4px':'9px'};${ci.length?'':'border-bottom:1px solid var(--border);'}background:var(--surface)">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--cream);color:var(--muted);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0">${grp.initials}</div>
          <div style="flex:1;min-width:0"><span style="font-size:13px;font-weight:600;color:var(--ink)">${grp.householdName}</span> <span style="font-size:11.5px;color:var(--muted)">— ${summaryLine}</span></div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0"><span style="font-size:11px;color:var(--muted)">${_fmt(grp.submittedDate)}</span>${histBtn}</div>
        </div>
        ${contactRow}${memberRows}${histSection}
      </div>`;
    }
  });
  listEl.innerHTML=shown?html:`<div style="padding:32px 0;text-align:center;font-size:13px;color:var(--muted);font-style:italic">No responses match this filter.</div>`;
}
function _orsvpSetFilter(f){window._orsvpFilter=f;_orsvpRender();}
function _orsvpSetView(v){window._orsvpView=v;try{localStorage.setItem('uv_orsvp_view',v);}catch(e){}  _orsvpRender();}
function _orsvpToggleHistory(btn){
  const id=btn.dataset.grpId?'orhist-'+btn.dataset.grpId:null;
  const panel=btn.closest('[style]').querySelector('[id^="orhist-"]');
  if(panel){panel.hidden=!panel.hidden;btn.style.color=panel.hidden?'var(--muted)':'var(--gold-deep)';}
}

// ── Online RSVPs: fetch submitted responses from Supabase ────────────────────
async function _loadOnlineRsvps(){
  const body   = document.getElementById('online-rsvps-body');
  const btn    = document.getElementById('load-rsvps-btn');
  if(!body) return;
  if(!_sbSession){
    body.innerHTML='<span style="color:var(--red)">Please sign in to view responses.</span>';
    return;
  }
  if(btn){ btn.disabled=true; btn.innerHTML=btn.innerHTML.replace('Refresh','Refreshing…'); }
  try{
    const uid = _sbSession.user.id;
    const url = `${_SB_URL}/rest/v1/rsvp_responses?couple_id=eq.${encodeURIComponent(uid)}&order=created_at.desc&limit=200`;
    const res = await fetch(url,{
      headers:{'apikey':_SB_KEY,'Authorization':_sbAuthHdr(),'Accept':'application/json'}
    });
    if(!res.ok){ throw new Error('HTTP '+res.status); }
    const rows = await res.json();

    if(!rows.length){
      body.innerHTML='<span style="color:var(--muted);font-style:italic">No responses yet — share your RSVP link to get started.</span>';
      if(btn){ btn.disabled=false; btn.innerHTML=btn.innerHTML.replace('Refreshing…','Refresh'); }
      return;
    }

    // Tally
    const yes=rows.filter(r=>r.attending==='yes').length;
    const no =rows.filter(r=>r.attending==='no').length;
    const total=rows.length;

    // Diet totals across all yes responses
    const dietMap={};
    rows.filter(r=>r.attending==='yes'&&Array.isArray(r.dietary)).forEach(r=>{
      r.dietary.forEach(d=>{ dietMap[d]=(dietMap[d]||0)+1; });
    });
    const dietLabels={vegetarian:'Veg',pescatarian:'Pesc',vegan:'Vegan',halal:'Halal',kosher:'Kosher',lactose:'Lactose int.',gluten:'Gluten int.',allergy:'Allergy',other:'Other',glutenfree:'GF',dairyfree:'DF',nutallergy:'Nut'};
    const dietSummary=Object.entries(dietMap).map(([k,v])=>`${dietLabels[k]||k} ×${v}`).join(' · ')||'None noted';

    // Format date helper
    const fmt=iso=>{if(!iso)return'—';const d=new Date(iso);return isNaN(d)?iso:d.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});};

    // Build grouped households + render
    window._orsvpFilter = window._orsvpFilter || 'all';
    try { window._orsvpView = localStorage.getItem('uv_orsvp_view') || 'card'; } catch(e) { window._orsvpView = 'card'; }
    _orsvpGroups = _orsvpBuildGroups(rows);
    // Update stat tiles and diet line in-place — avoids wiping the body div
    // (a full innerHTML replacement collapses the max-height container and causes layout shift)
    const statsEl=document.getElementById('orsvp-stats');
    if(statsEl){
      const yEl=document.getElementById('orsvp-stat-yes');
      const nEl=document.getElementById('orsvp-stat-no');
      const tEl=document.getElementById('orsvp-stat-total');
      if(yEl) yEl.textContent=yes;
      if(nEl) nEl.textContent=no;
      if(tEl) tEl.textContent=total;
      statsEl.style.display='flex';
    }
    const dietEl=document.getElementById('orsvp-diet-line');
    if(dietEl){
      dietEl.innerHTML=`<strong style="color:var(--ink)">Dietary (attending):</strong> ${dietSummary}`;
      dietEl.style.display='';
    }
    const msgEl=document.getElementById('orsvp-msg');
    if(msgEl) msgEl.style.display='none';
    _orsvpRender();
    // ── Sync online RSVPs into guest list ──
    if(Array.isArray(STATE.guests) && STATE.guests.length){
      // Always base the merge on the cloud's guest data so that a sparse local
      // STATE (e.g. after a device conflict or stale localStorage) can never
      // overwrite a richer cloud record. RSVP fill-blank changes are applied on
      // top of the cloud version; local RSVP stamps already set are preserved.
      let baseGuests = STATE.guests;
      if(_sbSession){
        try{
          const _cgRows=await _sbSelect('planner_data',
            `user_id=eq.${_sbSession.user.id}&section=eq.guests&select=data`);
          if(_cgRows&&_cgRows.length&&Array.isArray(_cgRows[0].data)&&_cgRows[0].data.length){
            const _cloudG=_cgRows[0].data;
            // Use cloud as base; carry forward any local RSVP stamps that are already set
            const _localById={};
            STATE.guests.forEach(function(g){ if(g&&g.id) _localById[g.id]=g; });
            baseGuests=_cloudG.map(function(g){
              const loc=g&&g.id?_localById[g.id]:null;
              if(loc&&loc.rsvp&&loc.rsvp!==g.rsvp)
                return Object.assign({},g,{rsvp:loc.rsvp,rsvpDate:loc.rsvpDate||g.rsvpDate,rsvpDeclinedDate:loc.rsvpDeclinedDate||g.rsvpDeclinedDate});
              return g;
            });
          }
        }catch(e){ console.warn('RSVP sync: cloud guest fetch failed, using local state',e); }
      }
      const guestsByName={};
      baseGuests.forEach(function(g){
        if(g&&g.name) guestsByName[g.name.trim().toLowerCase()]=g;
      });
      let changed=0;
      rows.forEach(function(r){
        if(!r.guest_name) return;
        const g=guestsByName[r.guest_name.trim().toLowerCase()];
        if(!g) return;
        const newRsvp=r.attending==='yes'?'attending':r.attending==='no'?'declined':null;
        let rowChanged=false;
        if(newRsvp && g.rsvp!==newRsvp){
          g.rsvp=newRsvp;
          _stampRsvpDate(g,newRsvp);
          rowChanged=true;
        }
        // Carry dietary across if the guest has none set
        if(Array.isArray(r.dietary)&&r.dietary.length&&(!g.dietary||!g.dietary.length)){
          g.dietary=r.dietary.map(function(d){
            if(d&&d.startsWith('other:'))return'other';
            if(d&&d.startsWith('allergy:'))return'allergy';
            return d;
          });
          const _oi=r.dietary.find(function(d){return d&&d.startsWith('other:');});
          if(_oi&&!g.dietOther) g.dietOther=_oi.slice(6);
          const _ai=r.dietary.find(function(d){return d&&d.startsWith('allergy:');});
          if(_ai&&!g.allergyNote) g.allergyNote=_ai.slice(8);
          rowChanged=true;
        }
        // Carry meal, phone, email, address across if not already on guest record
        if(r.meal&&!g.meal){g.meal=r.meal;g.mealSrc='guest';rowChanged=true;}
        if(r.phone&&!(g.phone||'').trim()){g.phone=r.phone.trim();rowChanged=true;}
        if(r.email&&!(g.email||'').trim()){g.email=r.email.trim();rowChanged=true;}
        if(r.address&&!(g.address||'').trim()){g.address=r.address.trim();rowChanged=true;}
        if(rowChanged) changed++;
      });
      if(changed){
        STATE.guests=baseGuests; // commit the cloud-merged list back to STATE
        saveToStorage();
        // Re-render the page so all stat cards (Response Summary, Final Numbers, etc.)
        // reflect the newly synced data. The auto-reload will fire again but changed
        // will be 0 on that second pass, breaking the cycle.
        window._orsvpSkipNextLoad=true; // suppress the redundant second fetch from renderRsvpMgr's setTimeout
        navigate('rsvp-mgr');
        return;
      }
    }
  }catch(err){
    console.warn('_loadOnlineRsvps error',err);
    body.innerHTML=`<span style="color:var(--red)">Could not load responses — ${err.message||'network error'}. Try again.</span>`;
  } finally {
    if(btn){ btn.disabled=false; btn.innerHTML=btn.innerHTML.replace('Refreshing…','Refresh'); }
  }
}

function renderRsvpMgr(c, actions){
  // Combined RSVP & Invites page. Topbar: invite-mode toggle + manage guests.
  if(actions){
    actions.innerHTML=`<button class="btn btn-sm btn-outline rsvp-invites-btn" onclick="openRsvpNudge()" title="Chase guests who haven't responded" style="white-space:nowrap;display:inline-flex;align-items:center;gap:5px">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span class="rsvp-invites-label">Nudge</span>
    </button>
    <div id="rsvp-print-wrap" style="position:relative;display:inline-flex">
      <button class="btn-icon" onclick="_rsvpTogglePrintMenu(event)" title="Print options" aria-label="Print options" aria-haspopup="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      </button>
      <div id="rsvp-print-menu" style="display:none;position:absolute;top:calc(100% + 6px);right:0;z-index:60;width:190px;background:var(--cream);border:1px solid var(--border);border-radius:11px;box-shadow:0 4px 24px rgba(26,26,24,.12);overflow:hidden">
        <button onclick="closeDots();_rsvpTrackerPrint()" style="width:100%;background:none;border:none;cursor:pointer;padding:11px 14px;text-align:left;font-size:12.5px;font-family:'Inter',sans-serif;color:var(--ink);display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Guest tracker</button>
        <button onclick="closeDots();_rsvpPrintInviteList()" style="width:100%;background:none;border:none;cursor:pointer;padding:11px 14px;text-align:left;font-size:12.5px;font-family:'Inter',sans-serif;color:var(--ink);display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Invite list</button>
        <button onclick="closeDots();_rsvpOpenLabelSetup()" style="width:100%;background:none;border:none;cursor:pointer;padding:11px 14px;text-align:left;font-size:12.5px;font-family:'Inter',sans-serif;color:var(--ink);display:flex;align-items:center;gap:8px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="5" x2="8" y2="19"/></svg>
          Address labels</button>
      </div>
    </div>
    <div id="rsvp-sections-wrap" style="position:relative;display:inline-flex">
      <button class="btn-icon" onclick="_rsvpToggleArrange(event)" title="Arrange sections" aria-label="Arrange sections">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
      ${_rsvpArrangeMenuHtml()}
    </div>`;
  }
  const url=_rsvpLink();
  const s=rsvpStats();
  const statusMeta={
    attending:{label:'Attending',bg:'rgba(74,124,89,.14)',fg:'var(--green)'},
    declined:{label:'Declined',bg:'rgba(192,57,43,.12)',fg:'var(--red)'},
    awaiting:{label:'Awaiting',bg:'var(--surface)',fg:'var(--muted)'}
  };

  // ── Option C: dietary + plus-one breakdown (reads live from guests) ──
  const dietLabels={vegetarian:'Vegetarian',vegan:'Vegan',lactose:'Lactose intolerant',gluten:'Gluten intolerant',allergy:'Allergy',other:'Other restriction'};
  const dietCounts={vegetarian:0,vegan:0,lactose:0,gluten:0,allergy:0,other:0};
  // Allergy breakdown for the caterer: each common allergen counted, typed notes listed as
  // written (grouped case-insensitively), and anyone ticked with no detail flagged to chase.
  const alCounts={}, alNotes={}; let alUnspec=0; const othNotes={}; let othUnspec=0;
  STATE.guests.forEach(g=>{ if((g.listType||'A')==='B') return; (g.dietary||[]).forEach(d=>{ if(dietCounts[d]!==undefined) dietCounts[d]++; });
    if(_hasAllergy(g)){
      const _pr=_parseAllergyText(g.allergyNote||'');
      const ks=[...new Set((Array.isArray(g.allergens)?g.allergens:[]).concat(_pr.allergens))]; const n=_pr.note.trim();
      ks.forEach(k=>{ alCounts[k]=(alCounts[k]||0)+1; });
      if(n){ const key=n.toLowerCase(); if(!alNotes[key]) alNotes[key]={label:n,n:0}; alNotes[key].n++; }
      if(!ks.length && !n) alUnspec++;
    }
    if((g.dietary||[]).includes('other')){ const o=_otherText(g);
      if(o){ const key=o.toLowerCase(); if(!othNotes[key]) othNotes[key]={label:o,n:0}; othNotes[key].n++; } else othUnspec++; } });
  const _alSubRow=(lbl,n,em)=>`<div class="rsvp-al-sub" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0 6px 22px;border-bottom:1px solid var(--border);font-size:12px;color:var(--muted)"><span${em?' style="font-style:italic"':''}>${lbl}</span><span>${n}</span></div>`;
  const alSubHtml=ALLERGENS.filter(([k])=>alCounts[k]).map(([k,l])=>_alSubRow(l,alCounts[k]))
    .concat(Object.values(alNotes).map(o=>_alSubRow(_escHtml(o.label),o.n)))
    .concat(alUnspec?[_alSubRow('Not specified yet',alUnspec,true)]:[]).join('');
  const othSubHtml=Object.values(othNotes).map(o=>_alSubRow(_escHtml(o.label),o.n))
    .concat(othUnspec?[_alSubRow('Not specified yet',othUnspec,true)]:[]).join('');
  const dietTotal=Object.values(dietCounts).reduce((a,b)=>a+b,0);
  const plusConfirmed=STATE.guests.filter(g=>g.plusOneId&&(g.listType||'A')!=='B').length;
  const plusUnused=STATE.guests.filter(g=>g.plusOne&&!g.plusOneId&&(g.listType||'A')!=='B').length;

  // ── Option B: filtered + searched guest list (A-list only; B-list excluded) ──
  const q=rsvpQuery.trim().toLowerCase();
  const _filterInvitedIds = (rsvpFilter==='invited'||rsvpFilter==='notsent') ? _invitedGuestIdSet() : null;
  // Build family-expanded search set: if a guest matches, include all their family/group members
  let _rsvpSearchIds=null;
  if(q){
    const directHits=new Set(STATE.guests.filter(g=>g.name.toLowerCase().includes(q)).map(g=>g.id));
    _rsvpSearchIds=new Set(directHits);
    directHits.forEach(id=>{
      const fam=(STATE.families||[]).find(f=>f.memberIds.includes(id));
      if(fam) fam.memberIds.forEach(mid=>_rsvpSearchIds.add(mid));
      const g=STATE.guests.find(x=>x.id===id);
      if(g){
        if(g.coupleId) _rsvpSearchIds.add(g.coupleId);
        if(g.plusOneId) _rsvpSearchIds.add(g.plusOneId);
        const host=STATE.guests.find(x=>x.plusOneId===id);
        if(host) _rsvpSearchIds.add(host.id);
      }
    });
  }
  const list=STATE.guests.filter(g=>{
    if((g.listType||'A')==='B') return false;
    const st=(!g.rsvp||g.rsvp==='awaiting')?'awaiting':g.rsvp;
    if(rsvpFilter==='attending'||rsvpFilter==='declined'||rsvpFilter==='awaiting'){
      if(st!==rsvpFilter) return false;
    } else if(rsvpFilter==='invited'){
      if(!_filterInvitedIds.has(g.id)) return false;
    } else if(rsvpFilter==='notsent'){
      if(_filterInvitedIds.has(g.id)) return false;
    }
    if(_rsvpSearchIds&&!_rsvpSearchIds.has(g.id)) return false;
    return true;
  });

  c.innerHTML=(()=>{
    const order=_rsvpSectionOrder();
    const hidden=_rsvpHiddenSet();
    const cols=_rsvpCardCols();
    const gridCols=cols==='4'?'repeat(4,minmax(0,1fr))':cols==='3'?'repeat(3,minmax(0,1fr))':cols==='2'?'repeat(2,minmax(0,1fr))':'repeat(auto-fit,minmax(280px,1fr))';
    const cardHtml={
      invitation:!hidden.has('invitation')?_invitationSectionHtml('invitation'):'',
      sendguests:!hidden.has('sendguests')?_invitationSectionHtml('sendguests'):'',
      meal:!hidden.has('meal')?`<div class="card" id="rsvp-meal-card" style="padding:22px 20px 20px">${_mealSetupHtml()}</div>`:'',
      link:!hidden.has('link')?`<div class="card">
        <div class="section-eyebrow" style="margin-bottom:12px">Your RSVP Link</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input class="form-input" value="${url}" readonly style="flex:1;font-size:11.5px"/>
          <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${url}').then(()=>alert('Copied!'))">Copy</button>
          <button class="btn btn-primary btn-sm" onclick="openRsvpPage()">Preview</button>
        </div>
        <div style="margin-top:20px">
          <div class="form-label" style="margin-bottom:10px">QR Code</div>
          <div id="qrcode-wrap" style="background:#fff;padding:12px;display:inline-block;border-radius:8px;border:1px solid var(--border)"></div>
          <div style="margin-top:10px">
            <button class="btn btn-outline btn-sm" style="display:inline-flex;align-items:center;gap:5px;font-size:12px" onclick="_downloadQr('qrcode-wrap','rsvp-qr-code.png')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download QR Code
            </button>
          </div>
        </div>
        <hr style="border:none;border-top:1px solid var(--border);margin:20px 0 16px">
        <div class="section-eyebrow" style="margin-bottom:10px">When a guest RSVPs</div>
        <label style="display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:var(--ink);cursor:pointer;margin-bottom:6px">
          <input type="checkbox" ${(STATE.settings&&STATE.settings.rsvpEmailOn!==false)?'checked':''} onchange="_rsvpSetEmailNotif(this.checked)" style="width:15px;height:15px;accent-color:var(--gold);cursor:pointer;flex-shrink:0"/>
          Email me
        </label>
        <div style="font-size:11.5px;color:var(--muted);line-height:1.5">Notifications are sent to your account email.</div>
      </div>`:'',
      summary:!hidden.has('summary')?`<div class="card" style="position:relative">
        <div class="rsvp-style-switch">
          <button class="rsvp-style-btn" onclick="toggleRsvpStyleMenu(event)" title="Change layout" aria-label="Change response summary layout" aria-haspopup="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </button>
          <div class="rsvp-style-menu" id="rsvp-style-menu" style="display:none">
            ${[[1,'Style 1'],[2,'Style 2'],[3,'Style 3']].map(([n,lbl])=>`<div class="rsvp-style-item ${(STATE.settings.rsvpSummaryStyle||1)===n?'active':''}" onclick="setRsvpSummaryStyle(${n})">${lbl}</div>`).join('')}
          </div>
        </div>
        <div class="section-eyebrow" style="margin-bottom:14px">Response Summary</div>
        ${rsvpSummaryBody(s)}</div>`:'',
      dietary:!hidden.has('dietary')?`<div class="card">
        <div class="section-eyebrow" style="margin-bottom:12px">Dietary Requirements</div>
        ${dietTotal?Object.keys(dietLabels).filter(k=>dietCounts[k]>0).map(k=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px">
            <span style="display:inline-flex;align-items:center;gap:7px">${dietIcons([k])} ${dietLabels[k]}</span>
            <span style="font-weight:600;color:var(--gold-deep)">${dietCounts[k]}</span>
          </div>${k==='allergy'?alSubHtml:k==='other'?othSubHtml:''}`).join(''):`<div style="font-size:13px;color:var(--muted);padding:8px 0">No dietary needs recorded yet.</div>`}
      </div>`:'',
      plusones:!hidden.has('plusones')?`<div class="card">
        <div class="section-eyebrow" style="margin-bottom:12px">Plus-Ones</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px"><span>Confirmed</span><span style="font-weight:600;color:var(--green)">${plusConfirmed}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:13px"><span>Allowed, unused</span><span style="font-weight:600;color:var(--muted)">${plusUnused}</span></div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:12px">Headcounts here are handy for your caterer and venue.</div>
      </div>`:'',
      headcount:!hidden.has('headcount')?_rsvpWidgetHeadcount():'',
      finalnumbers:!hidden.has('finalnumbers')?_rsvpWidgetFinalNumbers():'',
      awaiting:!hidden.has('awaiting')?_rsvpWidgetAwaiting():'',
      inviteprogress:!hidden.has('inviteprogress')?_rsvpWidgetInviteProgress():'',
      contactable:!hidden.has('contactable')?_rsvpWidgetContactable():'',
      seatingstatus:!hidden.has('seatingstatus')?_rsvpWidgetSeating():'',
      // ── Stage 5: Online RSVPs card (submissions received via public link) ──
      onlinersvps:`<div class="card" id="online-rsvp-card">
        <div class="section-eyebrow" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between">
          <span>Online RSVPs</span>
          <button class="btn btn-sm btn-outline" style="font-size:11.5px;padding:5px 10px;display:inline-flex;align-items:center;gap:5px" onclick="_loadOnlineRsvps()" id="load-rsvps-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.96"/></svg>
            Refresh
          </button>
        </div>
        <div id="online-rsvps-body" style="font-size:13px;color:var(--muted);padding:6px 0">
          <div id="orsvp-stats" style="display:none;flex-direction:row;gap:16px;flex-wrap:wrap;margin-bottom:14px">
            <div style="flex:1;min-width:90px;padding:10px 14px;background:rgba(74,124,89,.08);border:1px solid rgba(74,124,89,.25);border-radius:9px;text-align:center"><div id="orsvp-stat-yes" style="font-size:22px;font-weight:700;color:var(--green)">—</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Attending</div></div>
            <div style="flex:1;min-width:90px;padding:10px 14px;background:rgba(192,57,43,.06);border:1px solid rgba(192,57,43,.2);border-radius:9px;text-align:center"><div id="orsvp-stat-no" style="font-size:22px;font-weight:700;color:var(--red)">—</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Declining</div></div>
            <div style="flex:1;min-width:90px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:9px;text-align:center"><div id="orsvp-stat-total" style="font-size:22px;font-weight:700;color:var(--ink)">—</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Total</div></div>
          </div>
          <div id="orsvp-diet-line" style="display:none;font-size:11.5px;color:var(--muted);margin-bottom:12px"></div>
          <div id="orsvp-toolbar" style="margin-bottom:10px"></div>
          <div style="max-height:480px;overflow-y:auto">
            <div id="orsvp-list" style="display:flex;flex-direction:column;gap:10px"></div>
          </div>
          <span id="orsvp-msg" style="color:var(--muted)">Responses submitted via your public RSVP link will appear here. Hit <strong>Refresh</strong> to fetch the latest.</span>
        </div>
      </div>`,
      formfields:!hidden.has('formfields')?_rsvpFormFieldsCardHtml():''
    };
    // ── Placement-driven assembly: dock stack beside tracker + row-broken grid ──
    const _placements=_rsvpPlacements();
    const _dockedKeys=_rsvpDockedKeys().filter(k=>!hidden.has(k) && !!cardHtml[k]); // visible, rendered
    const _dockActive = !hidden.has('tracker') && _dockedKeys.length>0;
    // Tracker card: drop its top margin when it leads a dock row (the row supplies spacing).
    const cardHtmlTracker=!hidden.has('tracker')?`<div class="card rsvp-tracker-card" style="margin-top:${_dockActive?'0':'8px'}">
        <div class="rsvp-thead">
          <div class="rsvp-thead-title">
            <div class="section-eyebrow">Guest Response Tracker</div>
          </div>
          <div class="rsvp-thead-tools">
            <div style="position:relative;display:inline-flex;align-items:center">
            <input class="form-input rsvp-thead-search" placeholder="Search guests…" value="${rsvpQuery.replace(/\"/g,'&quot;')}"
              oninput="rsvpQuery=this.value;rsvpRerenderList()" style="font-size:12.5px;padding:7px ${rsvpQuery?28:11}px 7px 11px" onkeydown="if(event.key==='Escape'){rsvpQuery='';rsvpRerenderList();this.value='';}"/>
            <button type="button" onclick="rsvpQuery='';rsvpRerenderList();this.previousElementSibling.value=''" title="Clear" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);padding:0;line-height:0;display:flex;align-items:center;opacity:${rsvpQuery?1:0};pointer-events:${rsvpQuery?'auto':'none'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div style="position:relative;display:inline-flex">
              <button onclick="event.stopPropagation();_rsvpToggleColMenu(event)" class="btn btn-sm btn-outline" style="white-space:nowrap;display:inline-flex;align-items:center;gap:5px;padding:6px 11px" title="Choose columns">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                Columns
              </button>
              ${_rsvpColMenuHtml()}
            </div>
          </div>
          <div class="rsvp-thead-cog" style="position:relative;display:inline-flex">
            <button onclick="event.stopPropagation();_inviteChanToggleMenu(event)" class="btn-icon" style="width:31px;height:31px" title="Invite &amp; reminder methods" aria-label="Choose invite and reminder methods" aria-haspopup="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            ${_inviteChanMenuHtml()}
          </div>
        </div>
        <div id="rsvp-filter-pills" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
          ${[['all','All',s.total,'','',''],['attending','Attending',s.attending,'','',''],['declined','Declined',s.declined,'','',''],['awaiting','Awaiting',s.awaiting,'','',''],['invited','Invited',s.invited,'rgba(92,143,114,.14)','var(--green)','rgba(92,143,114,.5)'],['notsent','Not yet sent',s.notSent,'','','']].filter(([key,,n])=>(key!=='notsent'||n>0)&&(key!=='invited'||s.invited<s.total)).map(([key,lbl,n,activeBg,activeFg,activeBorder])=>{const isActive=rsvpFilter===key;const bg=isActive?(activeBg||'var(--gold)'):'transparent';const fg=isActive?(activeFg||'#fff'):'var(--muted)';const border=isActive?(activeBorder||'var(--gold)'):'var(--border)';return `<button onclick="rsvpFilter='${key}';rsvpRerenderList()" class="rsvp-chip${isActive?' active':''}" style="font-size:11.5px;padding:5px 12px;border-radius:14px;border:1px solid ${border};cursor:pointer;background:${bg};color:${fg};font-family:inherit">${lbl} ${n}</button>`;}).join('')}
        </div>
        <div id="rsvp-list-scroll" data-tracker-height="${_rsvpTrackerHeight()}" style="${(()=>{const h=_rsvpTrackerHeight();const px=h==='short'?'320px':h==='medium'?'560px':'';return (px?`max-height:${px};overflow-y:auto;`:'');})()}">
          <div id="rsvp-list" style="${(()=>{const z=_rsvpZoom();return z===100?'':`zoom:${z/100};`;})()}">${rsvpTableHtml(list,statusMeta)}</div>
        </div>
      </div>`:'';
    cardHtml.tracker=cardHtmlTracker;
    let html='';
    const rowBreaks=_rsvpRowBreaks();
    // Grid cards = visible, placement 'grid', not the tracker, not docked. Split into rows
    // at any key that carries a row break (a break sits BEFORE that key).
    const dockedSet=new Set(_dockedKeys);
    const gridKeys=order.filter(k=>k!=='tracker' && !dockedSet.has(k) && _placements[k]==='grid' && !hidden.has(k) && !!cardHtml[k]);
    const flushRow=(buf)=>{ if(!buf.length) return ''; return `<div class="rsvp-card-grid" data-cols="${cols}" style="display:grid;grid-template-columns:${gridCols};gap:18px;margin-top:18px;align-items:stretch">${buf.map(k=>k==='onlinersvps'?`<div style="grid-column:1/-1">${cardHtml[k]}</div>`:cardHtml[k]).join('')}</div>`; };
    // Build the grid rows (respecting row breaks) as a string we can place after the tracker.
    let gridHtml='',rowBuf=[];
    gridKeys.forEach((k,i)=>{ if(i>0 && rowBreaks.has(k)){ gridHtml+=flushRow(rowBuf); rowBuf=[]; } rowBuf.push(k); });
    gridHtml+=flushRow(rowBuf);
    // Emit sections in order. The tracker (with any docked stack beside it) sits where the
    // tracker key falls in the order; all grid rows are emitted together right after it.
    let trackerEmitted=false;
    order.forEach(key=>{
      if(key==='tracker'){
        if(hidden.has('tracker')) return;
        if(_dockActive){
          // Large-dock widgets take only their natural height (flex:0 0 auto via CSS class)
          // so they don't crowd out smaller companion widgets.
          const companions=_dockedKeys.map(k=>{
            const html=cardHtml[k];
            if(_RSVP_LARGE_DOCK.includes(k)) return html.replace(/<div class="card"/, '<div class="card rsvp-dock-large-card"');
            return html;
          }).join('');
          html+=`<div class="rsvp-tracker-row">
            <div class="rsvp-tracker-pane">${cardHtml.tracker}</div>
            <div class="rsvp-tracker-companion">${companions}</div>
          </div>`;
        } else {
          html+=cardHtml.tracker;
        }
        html+=gridHtml;          // all grid rows flow immediately below the tracker zone
        trackerEmitted=true;
      }
    });
    // If the tracker is hidden, still show the grid rows.
    if(!trackerEmitted) html+=gridHtml;
    return html;
  })()

  setTimeout(()=>{
    const el=document.getElementById('qrcode-wrap');
    if(el&&typeof QRCode!=='undefined'){ el.innerHTML=''; new QRCode(el,{text:url,width:160,height:160,colorDark:'#1A1A18',colorLight:'#ffffff'}); }
    if(typeof _rsvpAttachPan==='function') _rsvpAttachPan();
    if(!window._orsvpSkipNextLoad) _loadOnlineRsvps();
    window._orsvpSkipNextLoad=false;
  },80);
}

// ── Combined RSVP & Invites: unified guest table ──
// Column meta. Name is fixed first and always shown; the rest are toggleable + reorderable.
const _RSVP_COL_META={
  status:  {head:'RSVP'},
  name:    {head:'Name'},
  ageband: {head:'Age'},
  savedate:{head:'Save the Date'},
  invited: {head:'Invite'},
  date:    {head:'Date'},
  rsvpby:  {head:'RSVP By'},
  reminder:{head:'Reminder'},
  dietary: {head:'Dietary'},
  meal:    {head:'Meal'},
  tags:    {head:'Tags'},
  phone:   {head:'Phone'},
  email:   {head:'Email'},
  address: {head:'Address'},
  handle:  {head:'IG / Messenger'}
};
const _RSVP_COL_KEYS=['status','name','ageband','savedate','invited','date','rsvpby','reminder','dietary','meal','tags','phone','email','address','handle'];

/* ── Meal choice + provenance (v144) ──────────────────────────────────────────────────
   The MEAL column only exists when Mandy has opted in and defined the options. It is not
   a free-text note: the guest will eventually pick from HER list, so the list is the
   schema, and it is worth defining now even though today she is the one filling it in.
   Nothing built here is thrown away when hosting arrives — only WHO types the value
   changes.

   PROVENANCE is the reason this is more than a column. A value SHE typed is a guess. A
   value the GUEST gave is evidence. Those are not the same fact and the table must not
   render them as though they were — because the entire point of asking is that they know
   and she does not.

   `g.mealSrc` / `g.dietarySrc` — 'guest' when it came from an RSVP, absent otherwise.
   Absent is the safe default: every value that exists TODAY was typed by her, so an
   absent marker correctly reads as 'you'. No migration, and no value is ever wrongly
   promoted to evidence. */
function _mealOpts(){
  const m=(STATE.settings && STATE.settings.mealOptions);
  return Array.isArray(m) ? m.filter(x=>String(x||'').trim()) : [];
}
function _mealOn(){ return !!(STATE.settings && STATE.settings.mealChoiceOn) && _mealOpts().length>0; }

/* From the guest, or from Mandy? Anything not explicitly marked 'guest' is hers. */
function _isGuestGiven(g, field){
  return !!(g && g[field==='dietary'?'dietarySrc':'mealSrc']==='guest');
}

/* Overwriting a guest's OWN answer. This is deliberately a red, destructive-style confirm
   and not a soft one, because that is what it is: her note REPLACING their statement, on
   the one field where being wrong means someone eats something they are allergic to.

   The dialog QUOTES THEM BACK. "Overwrite this value?" is a dialog you click through
   without reading. "Tom told you: nut allergy" is one you actually read — and reading it
   is the entire mechanism. If she proceeds, the value stops being guest-given (it is no
   longer their answer), so the marker is cleared and the cell unlocks. */
function _guestValueText(g, field){
  if(field==='dietary'){
    const d=(g.dietary||[]);
    return d.length ? _dietText(g) : '—';
  }
  return String(g.meal||'').trim() || '—';
}
function _confirmOverwriteGuestValue(g, field){
  const what = field==='dietary' ? 'dietary needs' : 'meal choice';
  const name = _escHtml(String(g.name||'This guest').split(' ')[0] || 'This guest');
  _confirmDeleteDialog({
    title:    `Overwrite ${name}'s own answer?`,
    question: `${name} told you <b>${_escHtml(_guestValueText(g,field))}</b> when they RSVP'd. `
            + `Changing it replaces their answer with your note — and for ${what}, theirs is the one to trust.`,
    name:     '',
    verb:     'Overwrite',
    onConfirmJs: `_unlockGuestValue('${g.id}','${field}')`
  });
}
/* Proceeding means it is no longer THEIR answer. Drop the marker, then open the editor —
   the cell is now hers, and unlocked, exactly as if she had entered it herself. */
function _unlockGuestValue(gid, field){
  const g=STATE.guests.find(x=>x.id===gid); if(!g) return;
  delete g[field==='dietary'?'dietarySrc':'mealSrc'];
  saveToStorage();
  rsvpRerenderList();
  const td=document.querySelector(`td[data-gid="${gid}"][data-key="${field}"]`);
  if(field==='dietary'){ if(td) _gtEditDiet(td); }
  else _gtEditMeal(gid);
}

/* Meal editor: a pick from HER list, not free text. The guest will choose from the same
   list, so the list is the schema — not a convenience. */
function _gtEditMeal(gid){
  const g=STATE.guests.find(x=>x.id===gid); if(!g) return;
  if(_isGuestGiven(g,'meal')){ _confirmOverwriteGuestValue(g,'meal'); return; }
  const opts=_mealOpts();
  const cur=String(g.meal||'').trim();
  const body=`<div style="display:flex;flex-direction:column;gap:7px">
      ${opts.map(o=>`<button type="button" class="btn btn-outline btn-sm" style="justify-content:flex-start;text-align:left;${cur===o?'border-color:var(--gold);color:var(--gold-deep)':''}"
        onclick="_setGuestMeal('${gid}',${JSON.stringify(o).replace(/"/g,'&quot;')})">${_escHtml(o)}</button>`).join('')}
      ${cur?`<button type="button" class="btn btn-outline btn-sm" style="justify-content:flex-start;text-align:left;color:var(--muted)" onclick="_setGuestMeal('${gid}','')">Clear</button>`:''}
    </div>`;
  openModal(`Meal — ${_escHtml(g.name||'Guest')}`, body,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>`);
}
function _setGuestMeal(gid, val){
  const g=STATE.guests.find(x=>x.id===gid); if(!g) return;
  const v=String(val||'').trim();
  if(v) g.meal=v; else delete g.meal;
  delete g.mealSrc;            /* she typed it — it is hers, not evidence */
  saveToStorage();
  closeModalDirect();
  rsvpRerenderList();
}

// Current visibility map. Default-on: name, savedate, invited, status, date, reminder.
// Default-off (opt-in): dietary, tags, phone, email, address, handle, ageband.
// Invite and Name are always visible regardless of saved setting.
const _RSVP_COLS_DEFAULT_OFF=new Set(['dietary','meal','tags','phone','email','address','handle','ageband','rsvpby']);
function _rsvpCols(){
  const s=(STATE.settings&&STATE.settings.rsvpCols)||{};
  const out={};
  _RSVP_COL_KEYS.forEach(k=>{
    // MEAL is gated on the FEATURE, not just the column toggle. If Mandy turns meal choice
    // off (or clears every option), the column goes — even if `rsvpCols.meal` is still true
    // from when it was on. Otherwise a stale setting resurrects a column that can hold
    // nothing, and an empty column reads as "nobody has chosen" rather than "not asked".
    if(k==='meal'){ out[k] = _mealOn() && s[k]===true; return; }
    if(_RSVP_COLS_DEFAULT_OFF.has(k)){
      out[k]= s[k]===true;   // opt-in: only show if explicitly enabled
    } else {
      out[k]= s[k]!==false;  // default-on: show unless explicitly disabled
    }
  });
  out.invited=true; // always visible
  out.name=true;    // always visible
  return out;
}
// Current column order (validated against known keys; appends any missing).
function _rsvpColOrder(){
  let ord=(STATE.settings&&Array.isArray(STATE.settings.rsvpColOrder))?STATE.settings.rsvpColOrder.slice():[];
  ord=ord.filter(k=>_RSVP_COL_KEYS.indexOf(k)>=0);
  // 'reminder' is a newer column: if a saved order predates it, slot it right
  // after 'date' (its intended home) rather than tacking it on the end.
  if(ord.length && ord.indexOf('reminder')<0){
    const di=ord.indexOf('date');
    if(di>=0) ord.splice(di+1,0,'reminder'); else ord.push('reminder');
  }
  // 'savedate' is newer still: slot it immediately before 'invited' (chronological
  // Save the Date → Invite → Reminder) if a saved order predates it.
  if(ord.length && ord.indexOf('savedate')<0){
    const ii=ord.indexOf('invited');
    if(ii>=0) ord.splice(ii,0,'savedate'); else ord.unshift('savedate');
  }
  // Enforce savedate always before invited — fix saved orders where invited got dragged ahead.
  {const si=ord.indexOf('savedate'),ii=ord.indexOf('invited');if(si>=0&&ii>=0&&si>ii){ord.splice(si,1);ord.splice(ii,0,'savedate');}}
  // 'name' is now a real orderable column. Older saved orders predate it (Name used
  // to be pinned right after Invite). Slot it immediately after 'invited' to match
  // that historical position; fall back to the front if invite isn't present.
  if(ord.length && ord.indexOf('name')<0){
    const ni=ord.indexOf('invited');
    if(ni>=0) ord.splice(ni+1,0,'name'); else ord.unshift('name');
  }
  // 'meal' is newer again: slot it immediately AFTER 'dietary' — they are read together
  // and a saved order that predates meal should not exile it to the far right.
  if(ord.length && ord.indexOf('meal')<0){
    const di=ord.indexOf('dietary');
    if(di>=0) ord.splice(di+1,0,'meal'); else ord.push('meal');
  }
  _RSVP_COL_KEYS.forEach(k=>{ if(ord.indexOf(k)<0) ord.push(k); });
  return ord;
}
function _rsvpSetCol(key,on){
  if(on && (key==='dietary'||key==='meal') && _sbSession && typeof _uvRequirePaid==='function' && !_uvIsPaid()){ _uvRequirePaid(key==='dietary'?'dietary':'mealChoices'); return; }
  if(!STATE.settings.rsvpCols) STATE.settings.rsvpCols={};
  STATE.settings.rsvpCols[key]=!!on;
  saveToStorage();
  rsvpRerenderList();
  _rsvpReopenColMenu();
}
// Move a column in the order (drag drop): place dragKey before/after targetKey.
function _rsvpMoveCol(dragKey,targetKey,after){
  if(dragKey===targetKey) return;
  let ord=_rsvpColOrder();
  const from=ord.indexOf(dragKey);
  if(from<0) return;
  ord.splice(from,1);
  let ti=ord.indexOf(targetKey);
  if(ti<0) ti=ord.length-1;
  ord.splice(after?ti+1:ti, 0, dragKey);
  STATE.settings.rsvpColOrder=ord;
  saveToStorage();
  rsvpRerenderList();
  _rsvpReopenColMenu();
}

let _rsvpColMenuOpen=false;
// ── Shared floating-menu coordinator ────────────────────────────────────────
// Every popover menu (Columns chooser, invite-methods cog, calendar cog, seating
// cog, guest-card cog) is a single-instance floating panel. Only one should be
// open at a time: opening any one must close the others. Each toggle calls this
// FIRST (passing its own menu id to keep) before showing its panel. We only hide
// the DOM here; each menu's own open-state flag is recomputed from its display
// state the next time its toggle runs, so a hidden panel never reads as "open".
const _FLOATING_MENU_IDS=['rsvp-col-menu','invite-chan-menu','cal-cog-menu','seat-cog-menu','card-cog-menu'];
function _closeFloatingMenus(exceptId){
  _FLOATING_MENU_IDS.forEach(id=>{
    if(id===exceptId) return;
    const el=document.getElementById(id);
    if(el && el.style.display!=='none' && el.style.display!==''){ el.style.display='none'; }
  });
}

function _rsvpReopenColMenu(){
  setTimeout(()=>{
    // Rebuild the menu HTML from the current order so a drag-reorder (or freeze
    // toggle) is reflected in the chooser rows — not just the table. Replace the
    // existing element in place, then re-show and re-arm the outside-click closer.
    const old=document.getElementById('rsvp-col-menu');
    if(old && old.parentNode){
      const tmp=document.createElement('div');
      tmp.innerHTML=_rsvpColMenuHtml().trim();
      const fresh=tmp.firstChild;
      if(fresh){ old.parentNode.replaceChild(fresh, old); }
    }
    const m=document.getElementById('rsvp-col-menu');
    if(m){ m.style.display='block'; _rsvpColMenuOpen=true; _rsvpAttachColMenuCloser(); }
  }, 40);
}
function _rsvpAttachColMenuCloser(){
  const close=(ev)=>{
    const menu=document.getElementById('rsvp-col-menu');
    if(menu && !menu.contains(ev.target)){ menu.style.display='none'; _rsvpColMenuOpen=false; document.removeEventListener('click',close); }
  };
  setTimeout(()=>document.addEventListener('click',close),0);
}
function _rsvpToggleColMenu(e){
  if(e) e.stopPropagation();
  const m=document.getElementById('rsvp-col-menu');
  if(!m) return;
  _rsvpColMenuOpen = m.style.display==='none' || !m.style.display;
  if(_rsvpColMenuOpen) _closeFloatingMenus('rsvp-col-menu');
  m.style.display=_rsvpColMenuOpen?'block':'none';
  if(_rsvpColMenuOpen) _rsvpAttachColMenuCloser();
}

// Drag handlers for the chooser reorder rows.
let _rsvpDragCol=null;
function _rsvpColDragStart(e,key){ _rsvpDragCol=key; try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',key); }catch(_){} }
function _rsvpColDragOver(e,key){
  e.preventDefault();
  const row=e.currentTarget;
  const r=row.getBoundingClientRect();
  const after=(e.clientY-r.top)>r.height/2;
  row.style.borderTop=after?'':'2px solid var(--gold-deep)';
  row.style.borderBottom=after?'2px solid var(--gold-deep)':'';
}
function _rsvpColDragLeave(e){ const row=e.currentTarget; row.style.borderTop=''; row.style.borderBottom=''; }
function _rsvpColDrop(e,key){
  e.preventDefault();
  const row=e.currentTarget; const r=row.getBoundingClientRect();
  const after=(e.clientY-r.top)>r.height/2;
  row.style.borderTop=''; row.style.borderBottom='';
  if(_rsvpDragCol) _rsvpMoveCol(_rsvpDragCol,key,after);
  _rsvpDragCol=null;
}

// ── Name-column freeze ──────────────────────────────────────────────────────
// The Name column can be "frozen": when it is ALSO the leftmost visible column
// it sticks to the left while the rest of the table scrolls horizontally. If it
// is frozen but not leftmost, the preference is saved but doesn't pin yet
// (shown as "move to 1st" in the menu). Only Name has this option.
function _rsvpNameFrozen(){ return !!(STATE.settings && STATE.settings.rsvpFreezeName); }
// Is Name the leftmost VISIBLE column right now?
function _rsvpNameIsFirst(){
  const c=_rsvpCols();
  const order=_rsvpColOrder().filter(k=>c[k]);
  return order.length>0 && order[0]==='name';
}
// Name actually pins only when frozen AND leftmost.
function _rsvpNamePinned(){ return _rsvpNameFrozen() && _rsvpNameIsFirst(); }
function _rsvpToggleFreezeName(e){
  if(e) e.stopPropagation();
  if(!STATE.settings) STATE.settings={};
  STATE.settings.rsvpFreezeName=!_rsvpNameFrozen();
  saveToStorage();
  rsvpRerenderList();
  _rsvpReopenColMenu();
}

function _rsvpColMenuHtml(){
  const c=_rsvpCols();
  const order=_rsvpColOrder();
  const labels={status:'RSVP status',name:'Name',ageband:'Age band',savedate:'Save the Date',invited:'Invite',date:'RSVP date',rsvpby:'RSVP by',reminder:'Reminder',dietary:'Dietary',meal:'Meal',tags:'Tags',phone:'Phone',email:'Email',address:'Address',handle:'IG / Messenger'};
  const locked=new Set(['invited','name']); // always shown (can't be hidden), but ARE reorderable
  const grip=`<svg class="dragrow-grip" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);cursor:grab;flex-shrink:0"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>`;
  const snow=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="17" y1="5" x2="7" y2="19"/><line x1="7" y1="5" x2="17" y2="19"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
  // The Name row carries a freeze toggle. State: pinned (frozen + leftmost),
  // pending (frozen, not leftmost), or off.
  const nameFrozen=_rsvpNameFrozen(), namePinned=_rsvpNamePinned();
  const freezeBtn=()=>{
    let bg='transparent', col='var(--muted)', title='Freeze Name column';
    if(namePinned){ bg='rgba(29,158,117,.16)'; col='var(--green)'; title='Name frozen (pinned left). Click to unfreeze.'; }
    else if(nameFrozen){ bg='rgba(186,117,23,.16)'; col='#BA7517'; title='Name frozen — drag it to 1st to pin. Click to unfreeze.'; }
    return `<button onclick="_rsvpToggleFreezeName(event)" title="${title}" aria-label="${title}" style="width:20px;height:20px;flex-shrink:0;border:none;border-radius:5px;background:${bg};color:${col};display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;pointer-events:auto">${snow}</button>`;
  };
  const nameStatus=()=> namePinned
      ? `<span style="font-size:8.5px;color:var(--green);white-space:nowrap">pinned</span>`
      : (nameFrozen ? `<span style="font-size:8px;color:#BA7517;white-space:nowrap">move to 1st</span>` : '');
  const rows=order.map(key=>{
    const isName=(key==='name');
    const alwaysShown=locked.has(key);
    const chk = alwaysShown
      ? `<input type="checkbox" checked disabled style="width:15px;height:15px;accent-color:var(--muted);flex-shrink:0"/>`
      : `<input type="checkbox" ${c[key]?'checked':''} onchange="_rsvpSetCol('${key}',this.checked)" style="width:15px;height:15px;accent-color:var(--gold-deep);cursor:pointer;flex-shrink:0;pointer-events:auto"/>`;
    const labelCol = alwaysShown ? 'var(--ink)' : (c[key]?'var(--ink)':'var(--muted)');
    // Trailing widget: Name gets the freeze control (+ status); other locked
    // columns get an "always shown" hint; normal columns get nothing.
    let trail='';
    if(isName){ trail = `${nameStatus()}${freezeBtn()}`; }
    else if(alwaysShown){ trail = `<span style="font-size:9px;color:var(--muted)">always shown</span>`; }
    return `
    <div draggable="true" class="dragrow"
      ondragstart="_rsvpColDragStart(event,'${key}')"
      ondragover="_rsvpColDragOver(event,'${key}')"
      ondragleave="_rsvpColDragLeave(event)"
      ondrop="_rsvpColDrop(event,'${key}')"
      style="display:flex;align-items:center;gap:7px;font-size:12px;color:${labelCol};padding:6px 4px;border-radius:6px">
      ${grip}
      ${chk}
      <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${labels[key]}</span>
      ${trail}
    </div>`;}).join('');
  return `
  <div id="rsvp-col-menu" style="display:none;position:absolute;top:calc(100% + 6px);right:0;z-index:50;width:236px;background:var(--cream);border:1px solid var(--border);border-radius:11px;box-shadow:0 4px 24px rgba(26,26,24,.12);padding:12px 14px">
    <div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:3px">Columns</div>
    <div style="font-size:9.5px;color:var(--muted);margin-bottom:8px">Tick to show · drag to reorder · ❄ to freeze Name</div>
    ${rows}
  </div>`;
}

/* Meal choice setup. Renders as a standalone card body on the RSVP & Invites page. */
function _mealSetupHtml(){
  const on=!!(STATE.settings && STATE.settings.mealChoiceOn);
  // Use the raw array (including empty in-progress entries) so a just-added blank
  // input is visible. _mealOpts() filters empties, which is correct for display
  // elsewhere but would swallow the new row before the user can type into it.
  const opts=on ? _mealOptsArr() : _mealOpts();
  const childrenOn=on&&STATE.settings.childrenMealOn!==false;
  const cOpts=childrenOn ? _childMealOptsArr() : _childMealOpts();
  return `
    <div class="section-eyebrow" style="margin-bottom:12px">Meal Choice</div>
    <label style="display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:var(--ink);cursor:pointer;margin-bottom:${on?'14px':'0'}">
      <input type="checkbox" ${on?'checked':''} onchange="_mealSetOn(this.checked)" style="width:15px;height:15px;accent-color:var(--gold);cursor:pointer;flex-shrink:0"/>
      Offer guests a meal choice
    </label>
    ${on?`
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
        ${opts.map((o,i)=>`<div style="display:flex;gap:8px;align-items:center">
          <input type="text" value="${_escAttr(o)}" onchange="_mealSetOpt(${i},this.value)" placeholder="e.g. Beef"
            style="flex:1;min-width:0;font-size:13px;padding:7px 10px;border:1px solid var(--border);border-radius:7px;background:var(--cream);color:var(--ink)"/>
          <button onclick="_mealDelOpt(${i})" title="Remove" style="width:26px;height:26px;border-radius:50%;border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">×</button>
        </div>`).join('')}
      </div>
      <button onclick="_mealAddOpt()" style="border:1px dashed var(--border);border-radius:7px;background:none;color:var(--gold);padding:7px 10px;width:100%;text-align:left;cursor:pointer;font-size:13px;font-family:inherit">+ Add an option</button>
      ${!opts.length?`<div style="font-size:11px;color:var(--red);margin-top:8px">Add at least one option — the Meal column stays hidden until you do.</div>`:''}
      <hr style="border:none;border-top:1px solid var(--border);margin:14px 0 10px"/>
      <label style="display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:var(--ink);cursor:pointer;margin-bottom:${childrenOn?'10px':'0'}">
        <input type="checkbox" ${childrenOn?'checked':''} onchange="_childMealSetOn(this.checked)" style="width:15px;height:15px;accent-color:var(--gold);cursor:pointer;flex-shrink:0"/>
        Child allocated children's meal
      </label>
      ${childrenOn?`
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
          ${cOpts.map((o,i)=>`<div style="display:flex;gap:8px;align-items:center">
            <input type="text" value="${_escAttr(o)}" onchange="_childMealSetOpt(${i},this.value)" placeholder="e.g. Children's meal"
              style="flex:1;min-width:0;font-size:13px;padding:7px 10px;border:1px solid var(--border);border-radius:7px;background:var(--cream);color:var(--ink)"/>
            <button onclick="_childMealDelOpt(${i})" title="Remove" style="width:26px;height:26px;border-radius:50%;border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">×</button>
          </div>`).join('')}
        </div>
        <button onclick="_childMealAddOpt()" style="border:1px dashed var(--border);border-radius:7px;background:none;color:var(--gold);padding:7px 10px;width:100%;text-align:left;cursor:pointer;font-size:13px;font-family:inherit">+ Add an option for children</button>
      `:''}
    `:''}`;
}
function _rsvpRerenderMealCard(){const el=document.getElementById('rsvp-meal-card');if(el)el.innerHTML=_mealSetupHtml();}
function _mealSetOn(on){
  if(on && _sbSession && typeof _uvRequirePaid==='function' && !_uvIsPaid()){ _uvRequirePaid('mealChoices'); return; }
  if(!STATE.settings) STATE.settings={};
  STATE.settings.mealChoiceOn=!!on;
  // Turning it ON with no options yet: seed the obvious three rather than an empty list
  // she has to build from nothing. Turning it OFF keeps them — so switching back on does
  // not lose her list, and no guest's ANSWER is ever discarded by a display toggle.
  if(on && !_mealOpts().length) STATE.settings.mealOptions=['Beef','Fish','Vegetarian'];
  if(on && !(STATE.settings.childrenMealOptions||[]).filter(x=>String(x||'').trim()).length){ STATE.settings.childrenMealOn=true; STATE.settings.childrenMealOptions=["Children's meal"]; }
  if(on){ if(!STATE.settings.rsvpCols) STATE.settings.rsvpCols={}; STATE.settings.rsvpCols.meal=true; }
  saveToStorage();
  rsvpRerenderList();
  _rsvpReopenColMenu();
}
function _mealOptsArr(){
  if(!STATE.settings) STATE.settings={};
  if(!Array.isArray(STATE.settings.mealOptions)) STATE.settings.mealOptions=[];
  return STATE.settings.mealOptions;
}
function _mealSetOpt(i,v){ const a=_mealOptsArr(); if(i<0||i>=a.length) return; a[i]=String(v||'').trim(); saveToStorage(); rsvpRerenderList(); }
function _mealAddOpt(){ _mealOptsArr().push(''); saveToStorage(); rsvpRerenderList(); _rsvpRerenderMealCard(); _rsvpReopenColMenu(); }
function _mealDelOpt(i){ const a=_mealOptsArr(); if(i<0||i>=a.length) return; a.splice(i,1); saveToStorage(); rsvpRerenderList(); _rsvpRerenderMealCard(); _rsvpReopenColMenu(); }
function _childMealOptsArr(){ if(!STATE.settings) STATE.settings={}; if(!Array.isArray(STATE.settings.childrenMealOptions)) STATE.settings.childrenMealOptions=[]; return STATE.settings.childrenMealOptions; }
function _childMealOpts(){ return _childMealOptsArr().filter(x=>String(x||'').trim()); }
function _childMealOn(){ return !!(STATE.settings&&STATE.settings.mealChoiceOn)&&STATE.settings.childrenMealOn!==false&&_childMealOpts().length>0; }
function _childMealSetOn(on){ if(on && _sbSession && typeof _uvRequirePaid==='function' && !_uvIsPaid()){ _uvRequirePaid('childrenMeal'); return; } if(!STATE.settings) STATE.settings={}; STATE.settings.childrenMealOn=!!on; if(on&&!_childMealOpts().length) STATE.settings.childrenMealOptions=["Children's meal"]; saveToStorage(); rsvpRerenderList(); _rsvpRerenderMealCard(); }
function _childMealSetOpt(i,v){ const a=_childMealOptsArr(); if(i<0||i>=a.length) return; a[i]=String(v||'').trim(); saveToStorage(); rsvpRerenderList(); }
function _childMealAddOpt(){ _childMealOptsArr().push(''); saveToStorage(); rsvpRerenderList(); _rsvpRerenderMealCard(); }
function _childMealDelOpt(i){ const a=_childMealOptsArr(); if(i<0||i>=a.length) return; a.splice(i,1); saveToStorage(); rsvpRerenderList(); _rsvpRerenderMealCard(); }
function _rsvpSetEmailNotif(on){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.rsvpEmailOn=!!on;
  saveToStorage();
}

// The unified guest table. Keeps inline status editing; respects column choices + order.
// Columns are content-sized (a real <table>), so the grid only takes the width it needs.
function rsvpTableHtml(list,statusMeta){
  if(!list.length) return `<div style="font-size:13px;color:var(--muted);padding:16px 0;text-align:center">No guests match this filter.</div>`;
  const c=_rsvpCols();
  let order=_rsvpColOrder().filter(k=>c[k]);
  const invitedSet=_invitedGuestIdSet();
  const dietLabels=DIET_LABELS;

  // Columns render in their saved order. Name and Invite are ordinary columns now
  // (always visible, but freely positioned). Name can be "frozen" — when it is also
  // the leftmost column it pins sticky-left while the rest scrolls.
  const cols=[];
  order.forEach(k=>{ const meta=_RSVP_COL_META[k]; if(meta) cols.push({key:k, head:meta.head}); });
  const namePinned = _rsvpNamePinned(); // frozen AND leftmost

  const _compact=_rsvpCompact();
  const _thPad=_compact?'6px 7px':'9px 13px';
  const _tdPad=_compact?'5px 7px':'8px 13px';
  const thStyle=`padding:${_thPad};font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);text-align:left;white-space:nowrap;background:var(--surface)`;
  // Sticky-left styling for the pinned Name column. Header sits above body cells
  // (higher z) and carries a right divider so scrolled content doesn't bleed through.
  const _pinTh=`position:sticky;left:0;z-index:3;box-shadow:1px 0 0 var(--border)`;
  const _pinTd=`position:sticky;left:0;z-index:1;background:var(--cream);box-shadow:1px 0 0 var(--border)`;
  const _snowMini=`<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.2" stroke-linecap="round" style="margin-right:3px;vertical-align:-1px"><line x1="12" y1="2" x2="12" y2="22"/><line x1="17" y1="5" x2="7" y2="19"/><line x1="7" y1="5" x2="17" y2="19"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
  const rvS2=STATE.rsvpSort;
  const headCell=(x)=>{
    const pinned = namePinned && x.key==='name';
    const pinTh = pinned ? `;${_pinTh}` : '';
    const snow = pinned ? _snowMini : '';
    const namePadL = x.key==='name' ? ';padding-left:4px' : '';
    if(!_RSVP_SORTABLE.has(x.key)) return `<th style="${thStyle}${pinTh}${namePadL}">${snow}${x.head}</th>`;
    const active=!!(rvS2 && rvS2.key===x.key);
    return `<th style="${thStyle}${pinTh}${namePadL};cursor:pointer;user-select:none" class="sort-th" onclick="_rsvpSortClick('${x.key}')" title="Sort by ${x.head}"><span style="display:inline-flex;align-items:center">${snow}${x.head}${_sortCaret(active, active?rvS2.dir:null)}</span></th>`;
  };
  const _leadTh=`<th style="${thStyle};width:26px;padding-left:4px;padding-right:2px"></th><th style="${thStyle};width:30px;min-width:30px;padding:0"></th>`;
  const head=`<thead><tr>`+_leadTh+cols.map(headCell).join('')+`</tr></thead>`;

  // Match Guest List td padding exactly: 6px 11px regardless of compact mode
  // Compact mode tightens both header and data cell padding.
  const td=`padding:${_compact?'4px 7px':'6px 11px'};font-size:12px;vertical-align:middle`;

  // ── Group the (already-filtered) list into couples / families / singles. ──
  // A group only forms when 2+ of its members are present in `list`; otherwise
  // the guest renders as a single row. Order follows first appearance in `list`.
  const inList=new Set(list.map(g=>g.id));
  const byId={}; list.forEach(g=>byId[g.id]=g);
  const used=new Set();
  const groups=[];
  list.forEach(g=>{
    if(used.has(g.id)) return;
    // Family first (can hold >2).
    const fam=(STATE.families||[]).find(f=>f.memberIds.includes(g.id));
    if(fam){
      const mem=fam.memberIds.filter(id=>inList.has(id)).map(id=>byId[id]);
      if(mem.length>1){ mem.forEach(x=>used.add(x.id)); groups.push({kind:(fam.kind==='household'?'household':'family'), members:mem}); return; }
    }
    // Couple.
    if(g.coupleId && inList.has(g.coupleId) && !used.has(g.coupleId)){
      const partner=byId[g.coupleId];
      used.add(g.id); used.add(partner.id);
      groups.push({kind:'couple', members:[g,partner]});
      return;
    }
    // Plus-one host + their +1, shown together but not bracketed as a couple.
    if(g.plusOneId && inList.has(g.plusOneId) && !used.has(g.plusOneId)){
      const plus=byId[g.plusOneId];
      used.add(g.id); used.add(plus.id);
      groups.push({kind:'plusone', members:[g,plus]});
      return;
    }
    used.add(g.id);
    groups.push({kind:'single', members:[g]});
  });

  // Click-to-sort tracker: order whole groups by the first member's value for the
  // active column. Off keeps the natural order. Phone/email/address not sortable.
  const rvS=STATE.rsvpSort;
  if(rvS && rvS.key && _RSVP_SORTABLE.has(rvS.key)){
    const dir=rvS.dir==='desc'?-1:1;
    groups.forEach((grp,i)=>grp._i=i);
    groups.sort((a,b)=>{
      const va=_rsvpSortValue(a.members[0], rvS.key, a);
      const vb=_rsvpSortValue(b.members[0], rvS.key, b);
      let c;
      if(typeof va==='number' && typeof vb==='number') c=va-vb;
      else c=String(va).localeCompare(String(vb), undefined, {numeric:true, sensitivity:'base'});
      if(c===0) c=(a._i-b._i);
      return c*dir;
    });
  }

  // Per-member sub-cell (used by every non-Invite, non-Name column so each
  // person in a group keeps their own value). Returns inner HTML only.
  const memberSub=(key,g)=>{
    const st=(!g.rsvp||g.rsvp==='awaiting')?'awaiting':g.rsvp;
    const m=statusMeta[st];
    if(key==='status'){
      return `<select onchange="setGuestRsvp('${g.id}',this.value)" class="form-input rsvp-set"
          style="width:auto;min-width:104px;font-size:11.5px;padding:5px 32px 5px 10px;border-radius:13px;background-color:${m.bg};color:${m.fg};font-weight:500;cursor:pointer;appearance:none;-webkit-appearance:none">
          <option value="awaiting"${st==='awaiting'?' selected':''}>Awaiting</option>
          <option value="attending"${st==='attending'?' selected':''}>Attending</option>
          <option value="declined"${st==='declined'?' selected':''}>Declined</option>
        </select>`;
    }
    if(key==='date'){
      const dtxt=_fmtRsvpDate(g.rsvpDate);
      const val=(g.rsvpDate||'').replace(/"/g,'&quot;');
      // Native date input overlaid transparently on the label so a tap/click opens the
      // OS date picker directly — no JS popover (avoids click-race / stuck-menu issues).
      return `<span class="rsvp-date-cell" title="Click to set RSVP date" style="position:relative;display:inline-flex;align-items:center;white-space:nowrap;color:${dtxt?'var(--ink)':'var(--muted)'}">${dtxt||'—'}<input type="date" class="rsvp-date-input" value="${val}" aria-label="RSVP date" onclick="event.stopPropagation()" onchange="_setRsvpDate('${g.id}',this.value)"/></span>`;
    }
    if(key==='rsvpby'){
      // Per-guest RSVP-by date override. Falls back to global rsvpBy as placeholder.
      const override=g.rsvpByOverride||'';
      const globalBy=(STATE.settings&&STATE.settings.rsvpBy)||'';
      const displayTxt=override?_fmtRsvpDate(override):(globalBy?_fmtRsvpDate(globalBy):'');
      const isOverride=!!override;
      const isGlobal=!override&&!!globalBy;
      const label=displayTxt||(isGlobal?'global':'Set…');
      // Colour: override = ink, global fallback = muted, not set = muted
      const col=isOverride?'var(--ink)':(isGlobal?'var(--muted)':'var(--muted)');
      const title=isOverride?'Click to change RSVP-by date override':(isGlobal?`Using global date (${displayTxt}). Click to set a guest-specific date.`:'Click to set RSVP-by date');
      return `<span class="rsvp-date-cell" title="${title}" style="position:relative;display:inline-flex;align-items:center;white-space:nowrap;color:${col}">${isGlobal?`<span style="text-decoration:underline dotted;text-decoration-color:var(--border)">${label}</span>`:label}<input type="date" class="rsvp-date-input" value="${override.replace(/"/g,'&quot;')}" aria-label="RSVP by date" onclick="event.stopPropagation()" onchange="_setGuestRsvpBy('${g.id}',this.value)"/></span>`;
    }
    if(key==='dietary'){
      const diets=(g.dietary||[]);
      // A value the GUEST gave reads differently from one Mandy typed. Same column, two
      // kinds of fact: hers is a guess, theirs is evidence. `.gt-src-guest` says which.
      const gg=_isGuestGiven(g,'dietary');
      const chip=gg?'gt-chip-guest':'';
      return diets.length
        ? `<span class="${gg?'gt-src-guest':''}" title="${gg?'Confirmed by the guest when they RSVP\'d':''}" style="display:inline-flex;flex-wrap:wrap;gap:3px;align-items:center">`
          +(gg?`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="flex-shrink:0;opacity:.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`:'')
          +diets.map(d=>`<span class="tag ${chip}${d==='allergy'?' diet-tag-al':''}" style="font-size:9.5px;display:inline-flex;align-items:center;gap:3px;white-space:nowrap"><span style="display:inline-flex;color:${gg?'inherit':'var(--gold-deep)'}">${dietIcons([d])}</span>${_escHtml(_dietWord(g,d))}</span>`).join('')+`</span>`
        : `<span style="color:var(--muted)">—</span>`;
    }
    if(key==='meal'){
      const v=String(g.meal||'').trim();
      const gg=_isGuestGiven(g,'meal');
      // Empty is CLICKABLE — an em-dash you cannot act on is a dead cell. Guest-given
      // values are clickable too: the click is intercepted by the overwrite warning, not
      // blocked outright. She can always get through; she just has to mean it.
      const clk=`onclick="event.stopPropagation();_gtEditMeal('${g.id}')" style="cursor:pointer"`;
      if(!v) return `<span ${clk} title="Set a meal choice"><span style="color:var(--muted);opacity:.5">—</span></span>`;
      return `<span class="${gg?'gt-src-guest':''}" onclick="event.stopPropagation();_gtEditMeal('${g.id}')" title="${gg?'Chosen by the guest when they RSVP\'d — click to overwrite':'Click to change'}" style="display:inline-flex;align-items:center;gap:3px;cursor:pointer">`
        +(gg?`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="flex-shrink:0;opacity:.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`:'')
        +`<span class="tag ${gg?'gt-chip-guest':''}" style="font-size:9.5px;white-space:nowrap">${_escHtml(v)}</span></span>`;
    }
    if(key==='tags'){
      const tags=(g.tags||[]);
      return tags.length
        ? `<span style="display:inline-flex;flex-wrap:wrap;gap:3px">`+tags.map(t=>_tagChipHtml(t)).join('')+`</span>`
        : `<span style="color:var(--muted)">—</span>`;
    }
    if(key==='handle'){
      const v=(g.handle||'').trim();
      if(!v) return `<span class="gt-handle" onclick="event.stopPropagation();_openHandleEditor('${g.id}','rsvpRerenderList')" title="Add a handle" style="color:var(--muted);cursor:pointer">—</span>`;
      const plat=_guestHandlePlatform(g);
      return `<span class="gt-handle" onclick="event.stopPropagation();_openHandleEditor('${g.id}','rsvpRerenderList')" title="Click to edit handle" style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;cursor:pointer;color:var(--ink)"><span style="color:var(--gold-deep);display:inline-flex;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${_platformIconSvg(plat)}</svg></span>${_escHtml(_bareHandle(v))}</span>`;
    }
    if(key==='ageband'){
      const b=_guestAgeBand(g);
      if(b==='adult') return `<span style="color:var(--muted)">—</span>`;
      return _ageBandBadge(g).replace('margin-left:6px','');
    }
    const v=(g[key]||'').trim();
    return `<span style="white-space:nowrap;color:${v?'var(--ink)':'var(--muted)'}">${v?_escHtml(v):'—'}</span>`;
  };

  // ── One <tr> per member (matches Guest List list view exactly). ──
  // Edit pencil and connector use rowspan=n on the first member row; group-level
  // cells (Invite, Save the Date, Reminder) also rowspan. Per-person cells
  // (RSVP status, date, name, dietary, age, tags, etc.) render once per row.
  // Collapsible shared columns (phone/email/address) rowspan on first member.

  const _groupSlotKey=(grp)=>{
    if(grp.kind==='family'){
      const fam=(STATE.families||[]).find(f=>grp.members.some(m=>f.memberIds.includes(m.id)));
      if(fam) return `fam:${fam.id}`;
    }
    if(grp.kind==='couple') return `couple:${grp.members[0].id}`;
    if(grp.kind==='plusone') return `plusone:${grp.members[0].id}`;
    return `solo:${grp.members[0].id}`;
  };
  const _grpToSlot=(grp)=>{
    const key=_groupSlotKey(grp);
    if(grp.kind==='family'||grp.kind==='household'){
      const arranged=_gtArrangeFamily(grp.members);
      return {key, type:'family', kind:(grp.kind==='household'?'household':'family'), members:arranged.members, couples:arranged.couples};
    }
    if(grp.kind==='couple') return {key, type:'couple', kind:'couple', members:grp.members, couples:[]};
    if(grp.kind==='plusone') return {key, type:'plusone', kind:'plusone', members:grp.members, couples:[]};
    return {key, type:'solo', kind:'solo', members:grp.members, couples:[]};
  };
  const _grpAllResponded=(grp)=>grp.members.length>0&&grp.members.every(g=>g.rsvp==='attending'||g.rsvp==='declined');

  // Shared-value detection for collapsible columns (phone/email/address).
  // Tags are per-person in the new model (each row shows its own).
  const _blankTolerant=new Set(['address','email']);
  const _valSig=(key,g)=>((g[key]||'').trim()).toLowerCase();
  const _sharedVal=(key,grp)=>{
    if(grp.members.length<2) return null;
    if(_blankTolerant.has(key)){
      const filled=grp.members.filter(g=>_valSig(key,g)!=='');
      const sigs=new Set(filled.map(g=>_valSig(key,g)));
      if(filled.length&&sigs.size===1) return filled[0];
    } else {
      const first=_valSig(key,grp.members[0]);
      if(grp.members.every(g=>_valSig(key,g)===first)) return grp.members[0];
    }
    return null;
  };
  // Shared columns: phone/email/address collapse to one rowspan cell on first member.
  const _collapsibleShared=new Set(['phone','email','address']);

  const rows=groups.map(grp=>{
    const n=grp.members.length;
    const isGroup=n>1;
    const slotKey=_groupSlotKey(grp);
    const slot=_grpToSlot(grp);
    // Reorder members via slot (families may rearrange for couple adjacency).
    const members=slot.members;
    const cw=((slot.type==='family'&&slot.couples&&slot.couples.length)?30:20);

    // Precompute which collapsible columns collapse to a single rowspan cell.
    const sharedCells={};
    cols.forEach(col=>{
      if(_collapsibleShared.has(col.key)) sharedCells[col.key]=_sharedVal(col.key,{...grp,members});
    });

    return members.map((g,i)=>{
      const isFirst=(i===0);
      const rs=isGroup?` rowspan="${n}"`:'';

      // Edit pencil — rowspan, first row only.
      let editTd='';
      if(isFirst){
        const memberIds=members.map(m=>m.id);
        const editAction=memberIds.length>1?`_gtEditGuestSlot(['${memberIds.join("','")}'])`:`openEditGuest('${g.id}')`;
        const aria=memberIds.length>1?`Edit ${_escHtml(members.map(m=>m.name).join(' and '))}`:`Edit ${_escHtml(g.name)}`;
        editTd=`<td class="gt-edit-cell gt-conn-band"${rs} style="vertical-align:middle"><button type="button" class="gt-edit-btn" title="Edit details" aria-label="${aria}" onclick="event.stopPropagation();${editAction}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>`;
      }

      // Connector — rowspan, first row only.
      let connTd='';
      if(isFirst){
        if(!isGroup){
          connTd=`<td style="padding:0;width:20px;min-width:20px"></td>`;
        } else {
          connTd=`<td${rs} style="padding:0;width:${cw}px;min-width:${cw}px;vertical-align:middle;position:relative;overflow:visible" class="gt-conn gt-conn-band">${_gtConnectorHtml(slot,n)}</td>`;
        }
      }

      // Name cell — per member.
      const pinStyle=namePinned?`;${_pinTd}`:'';
      const note=(slot.type==='plusone'&&i===1)?'<span style="color:var(--muted);font-size:11px"> +1</span>':'';
      const nameTd=`<td style="${td};padding-left:4px;white-space:nowrap${pinStyle}"><span style="font-size:13px;color:var(--ink)">${_escHtml(g.name)}${note}</span>${_ageBandBadge(g)}</td>`;

      // Group-level cells (Invite, Save the Date, Reminder) — rowspan on first row.
      const groupLevelTd=(content)=>isFirst?`<td${rs} style="${td};text-align:center;vertical-align:middle;white-space:nowrap">${content}</td>`:'';

      // Data cells — per member, or rowspan for shared collapsible columns.
      const dataCells=cols.map(col=>{
        if(col.key==='name') return nameTd;
        if(col.key==='invited') return groupLevelTd(`<span style="display:inline-flex;flex-direction:column;align-items:center;gap:5px">${_sendControl('invite',slotKey)}${_trackerMethodPill('invite',slotKey)}</span>`);
        if(col.key==='savedate') return groupLevelTd(`<span style="display:inline-flex;flex-direction:column;align-items:center;gap:5px">${_sendControl('savedate',slotKey)}${_trackerMethodPill('savedate',slotKey)}</span>`);
        if(col.key==='reminder'){
          if(STATE.settings&&STATE.settings.hideReminderIfResponded&&_grpAllResponded(grp)) return isFirst?`<td${rs} style="${td};text-align:center;vertical-align:middle"></td>`:'';
          return groupLevelTd(`<span style="display:inline-flex;flex-direction:column;align-items:center;gap:5px">${_sendControl('reminder',slotKey)}${_trackerMethodPill('reminder',slotKey)}</span>`);
        }
        // Collapsible shared columns: render once with rowspan on first member.
        if(_collapsibleShared.has(col.key)){
          const shared=sharedCells[col.key];
          if(shared) return isFirst?`<td${rs} style="${td};vertical-align:middle">${memberSub(col.key,shared)}</td>`:'';
          return `<td style="${td}">${memberSub(col.key,g)}</td>`;
        }
        // Per-person columns.
        const tagsWide=col.key==='tags'?';min-width:125px':'';
        return `<td style="${td}${tagsWide}">${memberSub(col.key,g)}</td>`;
      }).join('');

      // Row border: solid top on first member of each group; dashed between members — matches Guest List.
      const rowBorder=isFirst?'border-top:0.5px solid var(--border)':(isGroup?'border-top:0.5px dashed var(--border)':'border-top:0.5px solid var(--border)');
      return `<tr style="${rowBorder}">${editTd}${connTd}${dataCells}</tr>`;
    }).join('');
  }).join('');

  return `<div id="rsvp-scroll" class="rsvp-pannable${_compact?' rsvp-compact':''}" style="overflow-x:auto;-webkit-overflow-scrolling:touch">
    <table style="border-collapse:collapse;border:1px solid var(--border);border-radius:10px;overflow:hidden;width:auto;max-width:100%">
      ${head}<tbody>${rows}</tbody>
    </table>
  </div>`;
}

// Print the Guest Response Tracker: opens the existing Guest List export preview
// modal so the user can print or download a clean copy. Reuses openExportPreview
// which already applies the print-hub-overlay (5px mobile padding rule).
// Persist the tracker-print page's own choices (called back from the print tab via window.opener).
function _trackerPrintSave(cols, order, filter, sync){
  if(!STATE.settings) STATE.settings={};
  if(cols && typeof cols==='object') STATE.settings.trackerPrintCols=cols;
  if(Array.isArray(order)) STATE.settings.trackerPrintColOrder=order;
  if(typeof filter==='string') STATE.settings.trackerPrintFilter=filter;
  if(typeof sync==='boolean') STATE.settings.trackerPrintSync=sync;
  saveToStorage();
}
// Print the Guest Response Tracker. Opens a self-contained sheet built on the Invite-list
// layout: one guest per line grouped by couple/family, RSVP status + date, dietary icon by
// the name, plus phone/email. Live filter pills + column chooser (mirrors the on-screen
// tracker minus "Invite sent"); choices persist back to the app via window.opener.
function _rsvpTrackerPrint(){
  const p1=STATE.event.partner1||'Partner 1', p2=STATE.event.partner2||'Partner 2';
  const date=STATE.event.date?fmtDate(STATE.event.date):'';
  const gs=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B');
  const byId={}; gs.forEach(g=>byId[g.id]=g);

  // Build groups (one per household), preserving guest order within each.
  const used=new Set(); const groups=[];
  const memObj=g=>({name:g.name||'', rsvp:((!g.rsvp||g.rsvp==='awaiting')?'awaiting':g.rsvp), date:_fmtRsvpDate(g.rsvpDate)||'', diet:(g.dietary||[]).slice(), al:(_hasAllergy(g)?_allergyText(g):''), oth:((g.dietary||[]).includes('other')?_otherText(g):''), phone:(g.phone||'').trim(), email:(g.email||'').trim(), tags:(g.tags||[]).slice(), address:(g.address||'').trim()});
  // Families first.
  (STATE.families||[]).forEach(fam=>{
    const mem=fam.memberIds.map(id=>byId[id]).filter(Boolean);
    if(mem.length<1) return;
    mem.forEach(g=>used.add(g.id));
    if(mem.length===1){ groups.push({kind:'single', members:[memObj(mem[0])]}); }
    else groups.push({kind:'family', members:mem.map(memObj)});
  });
  gs.forEach(g=>{
    if(used.has(g.id)) return;
    if(g.coupleId && byId[g.coupleId] && !used.has(g.coupleId)){
      const p=byId[g.coupleId]; used.add(g.id); used.add(p.id);
      groups.push({kind:'couple', members:[memObj(g),memObj(p)]}); return;
    }
    if(g.plusOneId && byId[g.plusOneId] && !used.has(g.plusOneId)){
      const p=byId[g.plusOneId]; used.add(g.id); used.add(p.id);
      groups.push({kind:'plusone', members:[memObj(g),memObj(p)]}); return;
    }
    used.add(g.id);
    groups.push({kind:'single', members:[memObj(g)]});
  });
  // Sort: households alphabetically by first member name.
  groups.sort((a,b)=>(a.members[0].name||'').localeCompare(b.members[0].name||''));

  // Tracker column state to mirror (for the Sync option). Strip 'invited'.
  const trackerCols={}; const _tc=_rsvpCols();
  ['status','date','dietary','tags','phone','email','address'].forEach(k=>{ trackerCols[k]=_tc[k]!==false; });
  const trackerOrder=_rsvpColOrder().filter(k=>k!=='invited' && k!=='name');

  const S=(STATE.settings||{});
  const cfg={
    groups,
    cols: S.trackerPrintCols || {status:true,date:true,dietary:true,tags:false,phone:true,email:true,address:false},
    order: S.trackerPrintColOrder || ['status','date','dietary','tags','phone','email','address'],
    filter: S.trackerPrintFilter || 'all',
    sync: !!S.trackerPrintSync,
    trackerCols, trackerOrder,
    title:'Guest Response Tracker',
    subtitle:`${p1} & ${p2}${date?` · ${date}`:''}`
  };

  const htmlContent=_trackerPrintDoc(cfg);
  const blob=new Blob([htmlContent],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const w=window.open(url,'_blank');
  if(!w) alert('Allow pop-ups to open the guest tracker.');
  setTimeout(()=>URL.revokeObjectURL(url), 10000);
}
// Build the full self-contained tracker-print document. All interactivity lives inside
// the returned page; it talks back to this app via window.opener._trackerPrintSave.
function _trackerPrintDoc(cfg){
  const DIET_SVG={
    vegetarian:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6 2 3 7 3 12c0 4 2.5 7 6 8"/><path d="M12 2c4 3 7 7 7 10 0 4-2.5 7-6 8"/><line x1="12" y1="22" x2="12" y2="10"/></svg>',
    vegan:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3c0 10 7 17 17 17-1-9-7-15-17-17z"/><path d="M3 3l8 8"/></svg>',
    lactose:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15 L12 5 L22 15 L2 15 Z"/><path d="M2 15 L22 15 L22 20 L2 20 Z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>',
    gluten:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21 Q10 14 12 3 M12 6 C10 4 7 5 8 8 C9 10 12 9 12 8 M12 6 C14 4 17 5 16 8 C15 10 12 9 12 8 M12 12 C10 10 7 11 8 14 C9 16 12 15 12 14 M12 12 C14 10 17 11 16 14 C15 16 12 15 12 14 M4 4 L20 2"/></svg>',
    allergy:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:#A8322A"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    other:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  const DIET_LBL={vegetarian:'Vegetarian',vegan:'Vegan',lactose:'Lactose intolerant',gluten:'Gluten intolerant',allergy:'Allergy',other:'Other'};
  // Serialise config + assets for the embedded script.
  const DATA=JSON.stringify(cfg).replace(/<\/script>/gi,'<\\/script>');
  const DSVG=JSON.stringify(DIET_SVG).replace(/<\/script>/gi,'<\\/script>');
  const DLBL=JSON.stringify(DIET_LBL).replace(/<\/script>/gi,'<\\/script>');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Guest Response Tracker — ${_escHtml(cfg.subtitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#FAFAF8;color:#1A1A18;padding:32px 40px}
@media print{body{padding:20px 24px}.no-print{display:none!important}table{page-break-inside:auto}tr{page-break-inside:avoid}}
@page{size:landscape}
.landscape-note{display:flex;align-items:center;gap:7px;font-size:11.5px;color:#8B7355;background:rgba(196,168,130,.12);border:1px solid #E6D9C2;border-radius:8px;padding:7px 11px;margin-bottom:16px}
.landscape-note svg{flex-shrink:0}
h1{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;margin-bottom:2px}
.sub{font-size:13px;color:#6B6B69;margin-bottom:6px}
.meta{font-size:11.5px;color:#9A9389;margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap}
.meta span{display:inline-flex;align-items:center;gap:4px}
.controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.pills{display:flex;gap:6px;flex-wrap:wrap}
.pill{font-size:11.5px;padding:5px 13px;border-radius:14px;border:1px solid #E0D8CF;cursor:pointer;background:#fff;color:#6B6B69;font-family:inherit}
.pill.active{background:#9A7B2E;color:#fff;border-color:#9A7B2E}
.spacer{flex:1}
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:500}
.btn-p{background:#9A7B2E;color:#fff}.btn-o{background:#fff;border:1px solid #E0D8CF;color:#3A352F}
.colwrap{position:relative}
.colmenu{position:absolute;top:calc(100% + 6px);right:0;z-index:50;width:236px;background:#fff;border:1px solid #E0D8CF;border-radius:11px;box-shadow:0 4px 24px rgba(26,26,24,.12);padding:12px 14px}
.colmenu .h{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9A7B2E;margin-bottom:3px}
.colmenu .hint{font-size:9.5px;color:#9A9389;margin-bottom:8px}
.colrow{display:flex;align-items:center;gap:8px;font-size:12px;padding:6px 4px;border-radius:6px}
.colrow.off{color:#9A9389}
.colrow[draggable="true"]{cursor:grab}
.colrow[draggable="true"]:hover{background:#F5EFE6}
.colrow[draggable="true"]:active{cursor:grabbing}
.colrow .grip{color:#C8BCA6;cursor:grab;flex-shrink:0;opacity:.35;transition:opacity .15s}
.colrow[draggable="true"]:hover .grip{opacity:1}
.colrow.fixed{color:#9A9389;opacity:.8}
.colrow input{width:15px;height:15px;accent-color:#8B7355;cursor:pointer;flex-shrink:0}
.colrow.dragover{box-shadow:inset 0 2px 0 #9A7B2E}
.syncrow{display:flex;align-items:center;gap:8px;font-size:12px;padding:8px 4px 2px;margin-top:6px;border-top:1px solid #EFE8DC;cursor:pointer}
.syncrow input{width:15px;height:15px;accent-color:#8B7355}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #E0D8CF;margin-top:4px}
th{text-align:left;padding:9px 13px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9A9389;background:#F3EFE9;border-bottom:1px solid #E0D8CF;white-space:nowrap}
td{padding:9px 13px;font-size:12.5px;color:#1A1A18;border-bottom:1px solid #EFE8DC;vertical-align:middle}
tr.grp-first td,tr.grp-mid td{border-bottom:none}
.namecell{display:flex;align-items:center;gap:7px}
.barwrap{border-left:2px solid #9A7B2E;padding-left:9px}
.barwrap.fam{border-left-color:#5B7BA0}
.nm{font-size:12.5px;color:#1A1A18;white-space:nowrap}
.diet{display:inline-flex;align-items:center;color:#8B7355}
.badge{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 8px;border-radius:9px;white-space:nowrap}
.b-att{color:#4A7C59;background:rgba(74,124,89,.12)}
.b-dec{color:#C0392B;background:rgba(192,57,43,.10)}
.b-awa{color:#888;background:#f3f3f0}
.dt{font-size:11.5px;color:#6B6B69;white-space:nowrap}
.muted{color:#B4AFA4}
.zh td{background:#FAFAF8}
.tag{font-size:9.5px;border:1px solid #E0D8CF;border-radius:4px;padding:1px 6px;color:#6B6B69;white-space:nowrap;display:inline-block;margin:1px}
</style></head><body>
<h1>Guest Response Tracker</h1>
<div class="sub">${_escHtml(cfg.subtitle)}</div>
<div class="meta" id="meta"></div>
<div class="controls no-print">
  <div class="pills" id="pills"></div>
  <div class="spacer"></div>
  <div class="colwrap"><button class="btn btn-o" onclick="toggleColMenu(event)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> Columns</button>
    <div class="colmenu" id="colmenu" style="display:none"></div></div>
  <button class="btn btn-p" onclick="window.print()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print</button>
  <button class="btn btn-o" onclick="window.close()">Close</button>
</div>
<div class="landscape-note no-print"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="2" y1="12" x2="22" y2="12"/></svg> For best results, print in <strong style="font-weight:600">landscape</strong> orientation.</div>
<table><thead id="thead"></thead><tbody id="tbody"></tbody></table>
<script>
var CFG=${DATA};
var DIET_SVG=${DSVG};
var DIET_LBL=${DLBL};
var GROUPS=CFG.groups||[];
var COLS=Object.assign({},CFG.cols);
var ORDER=(CFG.order||[]).slice();
var FILTER=CFG.filter||'all';
var SYNC=!!CFG.sync;
var TRACKER_COLS=CFG.trackerCols||{}, TRACKER_ORDER=(CFG.trackerOrder||[]).slice();
var LABELS={status:'RSVP status',date:'RSVP date',dietary:'Dietary (icon)',tags:'Tags',phone:'Phone',email:'Email',address:'Address'};
var HEAD={status:'RSVP',date:'Date',tags:'Tags',phone:'Phone',email:'Email',address:'Address'};
var STBADGE={attending:['Attending','b-att'],declined:['Declined','b-dec'],awaiting:['Awaiting','b-awa']};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function effCols(){return SYNC?Object.assign({status:true,date:true,dietary:true,tags:true,phone:true,email:true,address:true},TRACKER_COLS):COLS;}
function effOrder(){return SYNC?TRACKER_ORDER.slice():ORDER.slice();}
function persist(){try{if(window.opener&&window.opener._trackerPrintSave){window.opener._trackerPrintSave(COLS,ORDER,FILTER,SYNC);}}catch(e){}}
function renderMeta(){var att=0,dec=0,awa=0,tot=0;GROUPS.forEach(function(g){g.members.forEach(function(m){tot++;if(m.rsvp==='attending')att++;else if(m.rsvp==='declined')dec++;else awa++;});});document.getElementById('meta').innerHTML='<span>&#128101; '+tot+' guest'+(tot!==1?'s':'')+'</span><span>&#10003; '+att+' attending</span><span>&#10007; '+dec+' declined</span><span>&#8226; '+awa+' awaiting</span>';}
function renderPills(){var defs=[['all','All'],['attending','Attending'],['declined','Declined'],['awaiting','Awaiting']];document.getElementById('pills').innerHTML=defs.map(function(d){return '<button class="pill '+(FILTER===d[0]?'active':'')+'" onclick="setFilter(\\''+d[0]+'\\')">'+d[1]+'</button>';}).join('');}
function setFilter(k){FILTER=k;renderPills();renderTable();persist();}
function toggleColMenu(e){if(e)e.stopPropagation();var m=document.getElementById('colmenu');m.style.display=m.style.display==='none'?'block':'none';if(m.style.display==='block')renderColMenu();}
function renderColMenu(){
  var grip='<svg class="grip" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>';
  var c=effCols(), ord=effOrder();
  var rows=ord.map(function(k){return '<div class="colrow '+(c[k]?'':'off')+'" data-k="'+k+'" draggable="'+(SYNC?'false':'true')+'" ondragstart="dStart(event,\\''+k+'\\')" ondragover="dOver(event,\\''+k+'\\')" ondragleave="dLeave(event)" ondrop="dDrop(event,\\''+k+'\\')">'+grip+'<label style="display:flex;align-items:center;gap:8px;flex:1;cursor:pointer"><input type="checkbox" '+(c[k]?'checked':'')+' '+(SYNC?'disabled':'')+' onchange="setCol(\\''+k+'\\',this.checked)"/> '+LABELS[k]+'</label></div>';}).join('');
  document.getElementById('colmenu').innerHTML='<div class="h">Columns</div><div class="hint">Tick to show · drag to reorder</div><div class="colrow fixed"><span style="width:11px;flex-shrink:0"></span><input type="checkbox" checked disabled/> <span style="flex:1">Name</span><span style="font-size:9px">always 1st</span></div>'+rows+'<label class="syncrow"><input type="checkbox" '+(SYNC?'checked':'')+' onchange="setSync(this.checked)"/> Sync with on-screen tracker</label>';
}
function setCol(k,on){if(SYNC)return;COLS[k]=on;renderColMenu();renderTable();persist();}
function setSync(on){SYNC=on;renderColMenu();renderTable();persist();}
var _drag=null;
function dStart(e,k){if(SYNC){e.preventDefault();return;}_drag=k;}
function dOver(e,k){if(SYNC)return;e.preventDefault();var r=e.currentTarget;if(r)r.classList.add('dragover');}
function dLeave(e){var r=e.currentTarget;if(r)r.classList.remove('dragover');}
function dDrop(e,k){if(SYNC)return;e.preventDefault();var r=e.currentTarget;if(r)r.classList.remove('dragover');if(!_drag||_drag===k)return;var f=ORDER.indexOf(_drag);if(f<0)return;ORDER.splice(f,1);ORDER.splice(ORDER.indexOf(k),0,_drag);_drag=null;renderColMenu();renderTable();persist();}
function visCols(){var c=effCols(),ord=effOrder();return ord.filter(function(k){return k!=='dietary'&&c[k];});}
function dietHtml(m){var c=effCols();if(!c.dietary||!m.diet||!m.diet.length)return '';var title=m.diet.map(function(d){return (d==='allergy'&&m.al)?('Allergy ('+m.al+')'):(d==='other'&&m.oth)?('Other ('+m.oth+')'):(DIET_LBL[d]||d);}).join(', ');var ic=m.diet.map(function(d){return DIET_SVG[d]||'';}).join('');return '<span class="diet" title="'+esc(title)+'">'+ic+'</span>';}
function renderTable(){
  var vc=visCols();
  document.getElementById('thead').innerHTML='<tr><th>Name</th>'+vc.map(function(k){return '<th>'+HEAD[k]+'</th>';}).join('')+'</tr>';
  var html='';
  GROUPS.forEach(function(g){
    var mem=g.members.filter(function(m){return FILTER==='all'||m.rsvp===FILTER;});
    if(!mem.length)return;
    var grouped=(g.kind!=='single'&&mem.length>1);
    mem.forEach(function(m,i){
      var cls=grouped?(i===0?'grp-first':(i<mem.length-1?'grp-mid':'')):'';
      var zh=(g.kind!=='single')?'zh':'';
      var bar=grouped?('<div class="barwrap '+(g.kind==='family'?'fam':'')+'"><span class="nm">'+esc(m.name)+'</span></div>'):('<span class="nm">'+esc(m.name)+'</span>');
      var cells='<td><div class="namecell">'+bar+dietHtml(m)+'</div></td>';
      vc.forEach(function(k){
        if(k==='status'){var b=STBADGE[m.rsvp]||STBADGE.awaiting;cells+='<td><span class="badge '+b[1]+'">'+b[0]+'</span></td>';}
        else if(k==='date'){cells+='<td>'+(m.date?'<span class="dt">'+esc(m.date)+'</span>':'<span class="muted">—</span>')+'</td>';}
        else if(k==='tags'){cells+='<td>'+(m.tags&&m.tags.length?m.tags.map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join(''):'<span class="muted">—</span>')+'</td>';}
        else {var v=m[k];cells+='<td>'+(v?esc(v):'<span class="muted">—</span>')+'</td>';}
      });
      html+='<tr class="'+cls+' '+zh+'">'+cells+'</tr>';
    });
  });
  document.getElementById('tbody').innerHTML=html||'<tr><td colspan="'+(vc.length+1)+'" style="padding:18px;text-align:center;color:#9A9389">No guests match this filter.</td></tr>';
}
document.addEventListener('click',function(e){if(!e.target.closest('.colwrap')){var m=document.getElementById('colmenu');if(m)m.style.display='none';}});
renderMeta();renderPills();renderTable();
<\/script>
</body></html>`;
}

// Toggle the print dropdown menu
function _rsvpTogglePrintMenu(e){
  e.stopPropagation();
  const menu=document.getElementById('rsvp-print-menu');
  if(!menu) return;
  const open=menu.style.display==='none'||!menu.style.display;
  // Close any other open menus
  if(typeof closeDots==='function') closeDots();
  menu.style.display=open?'block':'none';
  if(open){
    const close=(ev)=>{ if(!ev.target.closest('#rsvp-print-wrap')){ menu.style.display='none'; document.removeEventListener('click',close); } };
    setTimeout(()=>document.addEventListener('click',close),50);
  }
}

// Print the Invite List: names + addresses grouped by household, for addressing physical invitations.
function _rsvpPrintInviteList(){
  const p1=STATE.event.partner1||'Partner 1', p2=STATE.event.partner2||'Partner 2';
  const date=STATE.event.date?fmtDate(STATE.event.date):'';
  const gs=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B');
  const invitedIds=_invitedGuestIdSet();
  if(!STATE.inviteMeta) STATE.inviteMeta={};

  // Collect a field from multiple guests, joining non-empty values
  function _gf(members, field, sep){
    return members.map(g=>{const v=g[field];return(Array.isArray(v)?v.join(', '):(v||'')).trim();}).filter(Boolean).join(sep||', ');
  }

  const used=new Set();
  const envelopes=[];

  // Families
  (STATE.families||[]).forEach(fam=>{
    const mem=fam.memberIds.map(id=>gs.find(g=>g.id===id)).filter(Boolean);
    if(!mem.length) return;
    mem.forEach(g=>used.add(g.id));
    const slotKey='fam:'+fam.id;
    const meta=STATE.inviteMeta[slotKey]||{};
    const addrs=[...new Set(mem.map(g=>(g.address||'').trim()).filter(Boolean))];
    envelopes.push({names:mem.map(g=>g.name),kind:'family',
      invited:mem.some(g=>invitedIds.has(g.id)),
      inviteMeta:meta.invite||null, savedateMeta:meta.savedate||null,
      address:addrs[0]||'', phone:_gf(mem,'phone'), email:_gf(mem,'email'), dietary:_gf(mem,'dietary','; ')});
  });

  // Couples + plus-ones + solos
  gs.forEach(g=>{
    if(used.has(g.id)) return;
    if(g.coupleId){
      const partner=gs.find(x=>x.id===g.coupleId);
      if(partner&&!used.has(partner.id)){
        used.add(g.id); used.add(partner.id);
        const slotKey='couple:'+g.id;
        const meta=STATE.inviteMeta[slotKey]||{};
        const mem=[g,partner];
        envelopes.push({names:[g.name,partner.name],kind:'couple',
          invited:invitedIds.has(g.id)||invitedIds.has(partner.id),
          inviteMeta:meta.invite||null, savedateMeta:meta.savedate||null,
          address:(g.address||partner.address||'').trim(),
          phone:_gf(mem,'phone'), email:_gf(mem,'email'), dietary:_gf(mem,'dietary','; ')});
        return;
      }
    }
    if(g.plusOneId){
      const plus=gs.find(x=>x.id===g.plusOneId);
      if(plus&&!used.has(plus.id)){
        used.add(g.id); used.add(plus.id);
        const slotKey='plusone:'+g.id;
        const meta=STATE.inviteMeta[slotKey]||{};
        const mem=[g,plus];
        envelopes.push({names:[g.name,plus.name],kind:'plusone',
          invited:invitedIds.has(g.id)||invitedIds.has(plus.id),
          inviteMeta:meta.invite||null, savedateMeta:meta.savedate||null,
          address:(g.address||plus.address||'').trim(),
          phone:_gf(mem,'phone'), email:_gf(mem,'email'), dietary:_gf(mem,'dietary','; ')});
        return;
      }
    }
    if(!used.has(g.id)){
      used.add(g.id);
      const slotKey='solo:'+g.id;
      const meta=STATE.inviteMeta[slotKey]||{};
      envelopes.push({names:[g.name],kind:'solo',
        invited:invitedIds.has(g.id),
        inviteMeta:meta.invite||null, savedateMeta:meta.savedate||null,
        address:(g.address||'').trim(), phone:(g.phone||'').trim(),
        email:(g.email||'').trim(),
        dietary:(Array.isArray(g.dietary)?g.dietary.join(', '):(g.dietary||'')).trim()});
    }
  });

  // Sort: invited > save-the-date > not yet, then alphabetical
  envelopes.sort((a,b)=>{
    const rank=e=>e.invited?2:(e.savedateMeta?1:0);
    const r=rank(b)-rank(a); if(r) return r;
    return (a.names[0]||'').localeCompare(b.names[0]||'');
  });

  const total=envelopes.length;
  const invitedCount=envelopes.filter(e=>e.invited).length;
  const savedateCount=envelopes.filter(e=>!e.invited&&e.savedateMeta).length;
  const missingAddr=envelopes.filter(e=>!e.address).length;

  const p1e=p1.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const p2e=p2.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const CH_J=JSON.stringify({post:'Post',email:'Email',text:'Text',whatsapp:'WhatsApp',messenger:'Messenger',instagram:'Instagram',inperson:'In person',other:'Other'});
  const ENV_J=JSON.stringify(envelopes);

  const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invite List — ${p1e} &amp; ${p2e}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#FAFAF8;color:#1A1A18;padding:28px 36px}
@media print{.no-print{display:none!important}table{page-break-inside:auto}tr{page-break-inside:avoid;page-break-after:auto}}
h1{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;margin-bottom:2px}
.sub{font-size:13px;color:#6B6B69;margin-bottom:6px}
.meta{font-size:11.5px;color:#9A9389;margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap}
.meta span{display:inline-flex;align-items:center;gap:4px}
.toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px;font-weight:500}
.btn-p{background:#9A7B2E;color:#fff}.btn-o{background:#fff;border:1px solid #E0D8CF;color:#3A352F}
.cc{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid #E0D8CF;border-radius:8px;padding:8px 14px;margin-bottom:20px}
.ccl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9A9389;margin-right:4px}
.cc label{display:inline-flex;align-items:center;gap:5px;cursor:pointer;user-select:none;font-size:12.5px;color:#3A352F}
.cc input{cursor:pointer;accent-color:#9A7B2E}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #E0D8CF}
th{text-align:left;padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9A9389;background:#F3EFE9;border-bottom:1px solid #E0D8CF;white-space:nowrap}
td{padding:9px 12px;font-size:12px;color:#1A1A18;border-bottom:1px solid #EFE8DC;vertical-align:top}
tr:nth-child(even) td{background:#FAFAF8}
.pill{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;white-space:nowrap;letter-spacing:.03em}
.ps{background:rgba(74,124,89,.13);color:#3E7056}
.pd{background:rgba(154,123,46,.11);color:#9A7B2E}
.mdt{font-size:10.5px;color:#9A9389;margin-left:3px}
.na{color:#C0392B;font-style:italic;font-size:11.5px}
.dim{color:#C8C3BB;font-size:11px}
</style>
</head><body>
<h1>Invite List</h1>
<div class="sub">${p1e} &amp; ${p2e}${date?' · '+date:''}</div>
<div class="meta">
  <span>&#128203; ${total} household${total!==1?'s':''}</span>
  <span style="color:#3E7056">&#9993; ${invitedCount} invited</span>
  ${savedateCount?'<span style="color:#9A7B2E">&#128197; '+savedateCount+' save the date</span>':''}
  ${missingAddr?'<span style="color:#C0392B">&#9888; '+missingAddr+' missing address</span>':''}
</div>
<div class="no-print toolbar">
  <button class="btn btn-p" onclick="window.print()">Print</button>
  <button class="btn btn-o" onclick="window.close()">Close</button>
</div>
<div class="cc no-print">
  <span class="ccl">Columns</span>
  <label><input type="checkbox" id="ca" checked onchange="tog('addr',this.checked)"> Address</label>
  <label><input type="checkbox" id="cp" onchange="tog('phone',this.checked)"> Phone</label>
  <label><input type="checkbox" id="ce" onchange="tog('email',this.checked)"> Email</label>
  <label><input type="checkbox" id="cd" onchange="tog('dietary',this.checked)"> Dietary</label>
</div>
<table>
<thead><tr>
  <th>Name(s)</th><th>Save the Date</th><th>Invite</th>
  <th data-col="addr">Address</th>
  <th data-col="phone" style="display:none">Phone</th>
  <th data-col="email" style="display:none">Email</th>
  <th data-col="dietary" style="display:none">Dietary</th>
</tr></thead>
<tbody id="tb"></tbody>
</table>
<script>
var CH=${CH_J};
var ENVS=${ENV_J};
function fmtD(s){
  if(!s) return '';
  var d=new Date(s+'T00:00:00');
  return d.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
}
function hname(ns){
  if(!ns||!ns.length) return '';
  if(ns.length===1) return ns[0];
  var parse=function(n){var w=n.trim().split(/\\s+/);return{f:w.slice(0,-1).join(' '),l:w[w.length-1]};};
  var ps=ns.map(parse),sh=ps[0].l;
  if(ps.every(function(p){return p.l.toLowerCase()===sh.toLowerCase();})){
    var fs=ps.map(function(p){return p.f;});
    if(fs.length===2) return fs[0]+' &amp; '+fs[1]+' '+sh;
    return fs.slice(0,-1).join(', ')+' &amp; '+fs[fs.length-1]+' '+sh;
  }
  if(ns.length===2) return ns[0]+' &amp; '+ns[1];
  return ns.slice(0,-1).join(', ')+' &amp; '+ns[ns.length-1];
}
function sdCell(m){
  if(!m||!m.method) return '<span class="dim">—</span>';
  var d=m.date?' <span class="mdt">'+fmtD(m.date)+'<\\/span>':'';
  return '<span class="pill pd">'+(CH[m.method]||m.method)+'<\\/span>'+d;
}
function invCell(m,inv){
  if(!inv) return '<span class="dim">—</span>';
  if(!m||!m.method) return '<span class="pill ps">Invited<\\/span>';
  var d=m.date?' <span class="mdt">'+fmtD(m.date)+'<\\/span>':'';
  return '<span class="pill ps">'+(CH[m.method]||m.method)+'<\\/span>'+d;
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function tog(col,show){
  document.querySelectorAll('[data-col="'+col+'"]').forEach(function(el){el.style.display=show?'':'none';});
}
var tb=document.getElementById('tb');
tb.innerHTML=ENVS.map(function(e){
  var addr=e.address?esc(e.address).replace(/\\n/g,'<br>'):'<span class="na">No address<\\/span>';
  return '<tr>'
    +'<td>'+hname(e.names)+'<\\/td>'
    +'<td>'+sdCell(e.savedateMeta)+'<\\/td>'
    +'<td>'+invCell(e.inviteMeta,e.invited)+'<\\/td>'
    +'<td data-col="addr">'+addr+'<\\/td>'
    +'<td data-col="phone" style="display:none">'+(e.phone?esc(e.phone):'<span class="dim">—<\\/span>')+'<\\/td>'
    +'<td data-col="email" style="display:none">'+(e.email?esc(e.email):'<span class="dim">—<\\/span>')+'<\\/td>'
    +'<td data-col="dietary" style="display:none">'+(e.dietary?esc(e.dietary):'<span class="dim">—<\\/span>')+'<\\/td>'
    +'<\\/tr>';
}).join('');
<\/script>
</body></html>`;
  const blob=new Blob([html],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const w=window.open(url,'_blank');
  if(!w) alert('Allow pop-ups to open the invite list.');
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}

// ── Address Label Print ──────────────────────────────────────────────────────
// Known label presets [id, display name, cols, rows, labelW_mm, labelH_mm, marginTop_mm, marginLeft_mm, gutterH_mm, gutterV_mm]
const _LABEL_PRESETS=[
  ['5160', 'Avery 5160 / J8160  (3×10, 63.5×38.1mm)',  3, 10, 63.5, 38.1, 12.7, 4.8, 3.2, 0],
  ['5161', 'Avery 5161 / J8161  (2×7,  101.6×33.9mm)', 2,  7,101.6, 33.9, 22.0, 2.5, 3.2, 0],
  ['5163', 'Avery 5163 / L7163  (2×5,  101.6×50.8mm)', 2,  5,101.6, 50.8, 22.0, 2.5, 3.2, 0],
  ['5167', 'Avery 5167  (4×20,  45.7×25.4mm)',          4, 20, 45.7, 25.4,  8.0, 4.8, 0, 0],
  ['l7160','Avery L7160 (3×7,   63.5×46.6mm)',          3,  7, 63.5, 46.6, 15.1, 7.2, 2.5, 0],
  ['l7159','Avery L7159 (3×8,   63.5×33.9mm)',          3,  8, 63.5, 33.9, 21.2, 7.2, 0, 0],
  ['custom','Custom…', 3, 10, 63.5, 38.1, 12.7, 4.8, 3.2, 0]
];
const _LABEL_PAPER=[
  ['A4',   'A4 (210×297mm)',  210, 297],
  ['Letter','US Letter (215.9×279.4mm)', 215.9, 279.4]
];

// Shared font list for label name + address pickers.
// Each entry: [css font-family value, display label, optional 'italic' flag]
const _LBL_FONTS=[
  ['Arial, Helvetica, sans-serif','Arial'],
  ["'Times New Roman', Times, serif",'Times New Roman'],
  ['Georgia, serif','Georgia'],
  ["'Trebuchet MS', sans-serif",'Trebuchet MS'],
  ["'Courier New', monospace",'Courier New'],
  ["'Palatino Linotype', Palatino, serif",'Palatino'],
  ["'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",'Gill Sans'],
  ['Garamond, serif','Garamond'],
  ["'Palatino Linotype', Palatino, serif",'Palatino Italic','italic'],
  ["'Perpetua', Georgia, serif",'Perpetua Italic','italic'],
  ["'Baskerville Old Face', Baskerville, Georgia, serif",'Baskerville Italic','italic'],
  ["'Segoe Script', 'Bradley Hand', cursive",'Segoe Script'],
  ["'Lucida Handwriting', 'Lucida Calligraphy', cursive",'Lucida Handwriting'],
  ["'Monotype Corsiva', cursive",'Monotype Corsiva'],
  ["'Edwardian Script ITC', cursive",'Edwardian Script ITC'],
  ["'Kunstler Script', cursive",'Kunstler Script'],
  ["'Freestyle Script', cursive",'Freestyle Script'],
  ["'French Script MT', cursive",'French Script MT'],
  ['Vivaldi, cursive','Vivaldi'],
];

function _lblFontOpts(savedVal){
  const regularFonts=_LBL_FONTS.filter(f=>!f[2]);
  const scriptFonts=_LBL_FONTS.filter(f=>!!f[2]||['Segoe Script','Lucida Handwriting','Monotype Corsiva','Edwardian Script ITC','Kunstler Script','Freestyle Script','French Script MT','Vivaldi'].some(s=>f[1].startsWith(s)));
  // Build a combined optgroup-style list as flat options with a divider option
  const mkOpt=([v,l,italic])=>{
    const fStyle=italic?`font-family:${v.replace(/"/g,'&quot;')};font-style:italic`:`font-family:${v.replace(/"/g,'&quot;')}`;
    const sel=savedVal===v+(italic?'|italic':'')?' selected':'';
    return `<option value="${v.replace(/"/g,'&quot;')}${italic?'|italic':''}" style="${fStyle}"${sel}>${l}</option>`;
  };
  const regularGroup=_LBL_FONTS.filter(f=>!f[2]&&!['Segoe Script','Lucida Handwriting','Monotype Corsiva','Edwardian Script ITC','Kunstler Script','Freestyle Script','French Script MT','Vivaldi'].some(s=>f[1].startsWith(s)));
  const scriptGroup=_LBL_FONTS.filter(f=>f[2]||['Segoe Script','Lucida Handwriting','Monotype Corsiva','Edwardian Script ITC','Kunstler Script','Freestyle Script','French Script MT','Vivaldi'].some(s=>f[1].startsWith(s)));
  return `<optgroup label="Standard">${regularGroup.map(mkOpt).join('')}</optgroup>`+
         `<optgroup label="Script &amp; italic">${scriptGroup.map(mkOpt).join('')}</optgroup>`;
}

// Parse a font option value (may have |italic suffix) into {family, italic}
function _lblParseFont(val){
  if(!val) return {family:'Arial, Helvetica, sans-serif',italic:false};
  if(val.endsWith('|italic')) return {family:val.slice(0,-7),italic:true};
  return {family:val,italic:false};
}

function _rsvpOpenLabelSetup(){
  const presetOpts=_LABEL_PRESETS.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('');
  const paperOpts=_LABEL_PAPER.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('');
  const _lblSaved=(STATE.settings&&STATE.settings.lblSetup)||{};

  const fontOpts=_lblFontOpts(_lblSaved.font||'');
  const addrFontOpts=_lblFontOpts(_lblSaved.addrFont||'');
  const fontDef=_lblParseFont(_lblSaved.font||'');
  const addrFontDef=_lblParseFont(_lblSaved.addrFont||'');
  const addrFontOpen=!!_lblSaved.addrFont;

  const row=(lbl,content)=>`<div class="lbl-row" style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:.5px solid var(--border)">
    <span class="lbl-row-lbl" style="font-size:12px;color:var(--muted);width:78px;flex-shrink:0;padding-top:6px;line-height:1.25">${lbl}</span>
    <div class="lbl-row-ct" style="flex:1;min-width:0">${content}</div></div>`;
  const sel=(id,opts,onchange='',extra='')=>`<select id="${id}" class="form-input lbl-sel" style="appearance:none;-webkit-appearance:none;padding-right:28px;font-size:12px;padding-top:6px;padding-bottom:6px${extra?';'+extra:''}" ${onchange?`onchange="${onchange}"`:''}>${opts}</select>`;
  const num=(id,val,min,max,step='0.1')=>`<input type="number" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" class="form-input" style="font-size:12px;padding:6px 10px;width:90px"/>`;
  const rsel=(saveKey,def)=>{ const v=_lblSaved[saveKey]; return v||def; };
  const radio=(name,val,lbl,grpDef)=>{ const checked=grpDef===val; const onChange=name==='lbl-who'?' onchange="_lblWhoChange()"':''; return `<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer"><input type="radio" name="${name}" value="${val}"${checked?' checked':''}${onChange}/> ${lbl}</label>`; };
  // Small ⓘ info button that reveals helper text on click (used to keep example text
  // out of the way on narrow screens). Text is escaped for the title/aria fallback.
  const tip=(text)=>{ const t=_escAttr(text); return `<button type="button" class="lbl-tip" aria-label="${t}" title="${t}" data-tip="${t}" onclick="_lblToggleTip(event,this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>`; };
  // A radio whose example/hint text is tucked into a ⓘ tip instead of shown inline.
  const radioTip=(name,val,lbl,grpDef,tipText)=>{ const checked=grpDef===val; return `<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer"><input type="radio" name="${name}" value="${val}"${checked?' checked':''}/> <span>${lbl}</span>${tip(tipText)}</label>`; };

  const _selSaved=(opts,saveKey)=>{ const v=_lblSaved[saveKey]; if(!v) return opts; return opts.replace(new RegExp(`(<option value="${v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}")`),'$1 selected'); };
  const presetSel=_selSaved(presetOpts,'preset');
  const paperSel=_selSaved(paperOpts,'paper');
  const customStyle='display:none;margin-top:10px;background:var(--surface);border-radius:9px;padding:12px 14px';

  // Sample text for preview — use first real guest name if available, else placeholder
  const _sampleEnvs=(()=>{ try{ const e=_rsvpBuildEnvelopes(); return e.length?e:null; }catch(x){ return null; } })();
  const _sampleEnv=_sampleEnvs&&_sampleEnvs[0];

  // Custom font picker: styled dropdown with each option in its own typeface.
  // A hidden <select> keeps the value for existing read logic (_lblFontPreview, generate).
  const _mkFontPicker=(id,savedVal,onchange)=>{
    const regularGroup=_LBL_FONTS.filter(f=>!f[2]&&!['Segoe Script','Lucida Handwriting','Monotype Corsiva','Edwardian Script ITC','Kunstler Script','Freestyle Script','French Script MT','Vivaldi'].some(s=>f[1].startsWith(s)));
    const scriptGroup=_LBL_FONTS.filter(f=>f[2]||['Segoe Script','Lucida Handwriting','Monotype Corsiva','Edwardian Script ITC','Kunstler Script','Freestyle Script','French Script MT','Vivaldi'].some(s=>f[1].startsWith(s)));
    const allGroups=[{label:'Standard',fonts:regularGroup},{label:'Script &amp; italic',fonts:scriptGroup}];
    const defVal=savedVal||(_LBL_FONTS[0][0]+(_LBL_FONTS[0][2]?'|italic':''));
    const defFont=_lblParseFont(defVal);
    const defLabel=_LBL_FONTS.find(f=>f[0]+(f[2]?'|italic':'')===defVal);
    const triggerLabel=defLabel?defLabel[1]:'Select font';
    const triggerStyle=`font-family:${defFont.family.replace(/"/g,'&quot;')};font-style:${defFont.italic?'italic':'normal'}`;
    // Hidden select for value compatibility
    const hiddenOpts=_LBL_FONTS.map(([v,l,italic])=>{
      const val=v+(italic?'|italic':'');
      return `<option value="${val.replace(/"/g,'&quot;')}"${defVal===val?' selected':''}>${l}</option>`;
    }).join('');
    // Dropdown items
    const items=allGroups.map(({label,fonts})=>`
      <div style="padding:4px 10px 2px;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);background:var(--surface)">${label}</div>
      ${fonts.map(([v,l,italic])=>{
        const val=v+(italic?'|italic':'');
        const fam=v.replace(/"/g,'&quot;');
        const isActive=defVal===val;
        return `<div role="option" data-val="${val.replace(/"/g,'&quot;')}" data-picker="${id}"
          onclick="_lblFontPickerSel('${id}','${val.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')"
          style="padding:7px 12px;font-family:${fam};font-style:${italic?'italic':'normal'};font-size:14px;cursor:pointer;border-bottom:.5px solid var(--border);${isActive?'background:rgba(139,115,85,.1);color:var(--gold-deep);font-weight:600':'color:var(--ink)'}">
          ${l}</div>`;
      }).join('')}`).join('');
    return `<div class="lbl-fontpick" style="position:relative">
      <button type="button" id="${id}-trigger" onclick="_lblFontPickerToggle('${id}')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--cream);cursor:pointer;font-family:'Inter',sans-serif">
        <span id="${id}-label" style="${triggerStyle};font-size:14px;color:var(--ink)">${triggerLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:var(--muted)"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div id="${id}-panel" style="display:none;position:absolute;left:0;right:0;top:calc(100% + 3px);z-index:1200;background:var(--cream);border:1px solid var(--border);border-radius:9px;box-shadow:0 6px 24px rgba(0,0,0,.14);overflow:hidden">
        <div style="max-height:168px;overflow-y:auto">${items}</div>
      </div>
      <select id="${id}" style="display:none">${hiddenOpts}</select>
    </div>`;
  };

  const fontRow=_mkFontPicker('lbl-font',_lblSaved.font||'')+
    `<div id="lbl-font-preview" style="margin-top:7px;font-family:${fontDef.family.replace(/"/g,'&quot;')};font-style:${fontDef.italic?'italic':'normal'};font-size:16px;color:var(--ink);line-height:1.2">James &amp; Sarah Smith</div>`+
    `<button onclick="_lblToggleAddrFont()" id="lbl-addr-toggle" style="margin-top:8px;background:none;border:none;padding:0;cursor:pointer;font-size:12px;color:var(--gold-deep);display:inline-flex;align-items:center;gap:4px;font-family:'Inter',sans-serif"><span id="lbl-addr-icon">${addrFontOpen?'−':'\uff0b'}</span> Use different font for address</button>`+
    `<div id="lbl-addr-box" style="${addrFontOpen?'':'display:none;'}margin-top:8px;background:var(--surface);border:.5px solid var(--border);border-radius:8px;padding:10px 12px">`+
      `<div style="font-size:11px;color:var(--muted);margin-bottom:5px">Address font</div>`+
      _mkFontPicker('lbl-addr-font',_lblSaved.addrFont||'')+
      `<div id="lbl-addr-preview" style="margin-top:6px;font-family:${addrFontDef.family.replace(/"/g,'&quot;')};font-style:${addrFontDef.italic?'italic':'normal'};font-size:13px;color:var(--muted);line-height:1.3">123 Maple Street, Brisbane QLD 4000</div>`+
    `</div>`;

  const body=`<div class="lbl-modal-body" style="max-width:460px">
    <div class="lbl-lead" style="font-size:12px;color:var(--muted);margin-bottom:12px">Each household (couple / family / solo) prints as one label.</div>
    ${row('Label size', sel('lbl-preset', presetSel, '_lblPresetChange()'))}
    ${row('Paper size', sel('lbl-paper', paperSel))}
    ${row('Name font', fontRow)}
    ${row('Sort order', `<div style="display:flex;gap:10px;flex-wrap:wrap">
      ${radio('lbl-sort','alpha','A\u2013Z',rsel('sort','alpha'))}
      ${radio('lbl-sort','invited','Invited first',rsel('sort','alpha'))}
    </div>`)}
    ${row('Include', `<div>
      <div class="lbl-who-grid" style="display:flex;gap:10px;flex-wrap:wrap">
        ${radio('lbl-who','all','All guests',rsel('who','all'))}
        ${radio('lbl-who','invited','Invited only',rsel('who','all'))}
        ${radio('lbl-who','notsent','Not yet sent',rsel('who','all'))}
        ${radio('lbl-who','choose','Choose…',rsel('who','all'))}
      </div>
      <div id="lbl-choose-box" style="${rsel('who','all')==='choose'?'':'display:none;'}margin-top:8px;background:var(--surface);border:.5px solid var(--border);border-radius:8px;overflow:hidden">
        <input id="lbl-choose-search" placeholder="Search guests…" oninput="_lblChooseFilter(this.value)" class="form-input" style="border:none;border-bottom:.5px solid var(--border);border-radius:0;font-size:12px;padding:7px 12px"/>
        <div id="lbl-choose-list" style="max-height:130px;overflow-y:auto"></div>
        <div id="lbl-choose-count" style="font-size:11px;color:var(--muted);padding:5px 12px;border-top:.5px solid var(--border)"></div>
      </div>
      <label class="lbl-addronly-row" style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;margin-top:8px;padding-top:8px;border-top:.5px solid var(--border)"><input type="checkbox" id="lbl-addronly" ${_lblSaved.addrOnly?'checked':''} style="accent-color:var(--gold)"/> <span>Only guests with an address</span>${tip('Skips any household with no address on file — useful when you only want to print what you can actually post.')}</label>
    </div>`)}
    ${row('Names on label', `<div style="display:flex;flex-direction:column;gap:6px">
      ${radioTip('lbl-names','full','Full names',rsel('names','full'),'Eg. James & Sarah Smith — shared surname merged automatically')}
      ${radioTip('lbl-names','initials','Initials',rsel('names','full'),'Eg. J. & S. Smith — when last names match')}
      ${radioTip('lbl-names','first','First names only',rsel('names','full'),'Eg. James & Sarah')}
      ${radioTip('lbl-names','surname','Surname only',rsel('names','full'),'Eg. The Smith Family (shared surname) or Smith & Jones')}
      <label class="lbl-prefix-row" style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;margin-top:2px;padding-top:6px;border-top:.5px solid var(--border)"><input type="checkbox" id="lbl-prefix" ${_lblSaved.includePrefix?'checked':''} style="accent-color:var(--gold)"/> <span>Include prefix</span>${tip('Adds the title (Eg. Mr., Dr., etc.) when one is set on the guest.')}</label>
    </div>`)}
    <div id="lbl-custom" style="${customStyle}">
      <div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:10px">Custom label dimensions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Columns</div>${num('lbl-cols',_lblSaved.cols||3,1,10,1)}</div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Rows per page</div>${num('lbl-rows',_lblSaved.rows||10,1,30,1)}</div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Label width (mm)</div>${num('lbl-w',_lblSaved.w||63.5,20,210)}</div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Label height (mm)</div>${num('lbl-h',_lblSaved.h||38.1,10,150)}</div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Top margin (mm)</div>${num('lbl-mt',_lblSaved.mt!=null?_lblSaved.mt:12.7,0,50)}</div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Left margin (mm)</div>${num('lbl-ml',_lblSaved.ml!=null?_lblSaved.ml:4.8,0,50)}</div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Col gap (mm)</div>${num('lbl-gh',_lblSaved.gh!=null?_lblSaved.gh:3.2,0,20)}</div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Row gap (mm)</div>${num('lbl-gv',_lblSaved.gv!=null?_lblSaved.gv:0,0,20)}</div>
      </div>
    </div>
    <div class="lbl-foot" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px;flex-wrap:nowrap">
      <button onclick="_lblPreviewPopup()" class="btn btn-outline btn-sm" style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="13" y2="13"/></svg> Preview</button>
      <div class="lbl-foot-actions" style="display:flex;gap:8px;flex-shrink:0">
        <button onclick="closeModalDirect()" class="btn btn-outline btn-sm" style="white-space:nowrap">Cancel</button>
        <button onclick="_rsvpGenerateLabels()" class="btn btn-primary btn-sm" style="white-space:nowrap">Generate labels</button>
      </div>
    </div>
  </div>`;
  openModal('Address labels', body, '');
  const mb=document.getElementById('modal-box'); if(mb){ mb.classList.add('modal-fit','lbl-modal'); }
  // Inject scoped styles once: widen this modal by 10px each side (less side padding)
  // and style the ⓘ info tips. Lives only while the label modal pattern is in use.
  if(!document.getElementById('lbl-modal-style')){
    const st=document.createElement('style'); st.id='lbl-modal-style';
    st.textContent=`
    #modal-box.lbl-modal{max-width:min(98vw,560px)}
    #modal-box.lbl-modal .modal-body{padding-left:20px;padding-right:20px}
    /* Compact+ : tighter content sized for mobile */
    #modal-box.lbl-modal .lbl-modal-body{min-width:0}
    #modal-box.lbl-modal .lbl-lead{font-size:11px !important;margin-bottom:9px !important;line-height:1.4;white-space:normal !important;word-break:normal;max-width:250px}
    #modal-box.lbl-modal .lbl-row{padding:5px 0 !important;gap:7px !important}
    #modal-box.lbl-modal .lbl-row-lbl{width:64px !important;font-size:11.5px !important;padding-top:5px !important}
    #modal-box.lbl-modal .lbl-sel{font-size:11.5px !important;padding-top:5px !important;padding-bottom:5px !important;max-width:200px}
    #modal-box.lbl-modal .lbl-fontpick{max-width:200px}
    #modal-box.lbl-modal .lbl-who-grid{display:grid !important;grid-template-columns:max-content max-content;gap:6px 16px !important}
    #modal-box.lbl-modal .lbl-prefix-row{align-items:flex-start !important;white-space:normal;line-height:1.35}
    #modal-box.lbl-modal .lbl-prefix-row input{margin-top:1px}
    #modal-box.lbl-modal .lbl-prefix-row .lbl-tip{margin-top:1px}
    #modal-box.lbl-modal .lbl-foot{gap:6px !important}
    #modal-box.lbl-modal .lbl-foot .btn{font-size:11px !important;padding:6px 9px !important}
    #modal-box.lbl-modal .lbl-foot .btn svg{width:11px;height:11px}
    .lbl-tip{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;border:none;background:none;color:var(--muted);cursor:pointer;flex-shrink:0;border-radius:50%}
    .lbl-tip:hover{color:var(--gold-deep)}
    .lbl-tip.on{color:var(--gold-deep)}
    .lbl-tip-pop{position:fixed;z-index:1300;max-width:230px;background:var(--cream);color:var(--ink);border:1px solid var(--border);border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.16);padding:8px 11px;font-size:11.5px;line-height:1.4;font-family:'Inter',sans-serif}`;
    document.head.appendChild(st);
  }
  _lblPresetChange();
  if(rsel('who','all')==='choose') _lblChooseOpen();
}
// Toggle the ⓘ helper popover for a label-modal tip button.
function _lblToggleTip(e, btn){
  e.preventDefault(); e.stopPropagation();
  const existing=document.querySelector('.lbl-tip-pop');
  const wasForThis = existing && existing._owner===btn;
  if(existing){ existing.remove(); document.querySelectorAll('.lbl-tip.on').forEach(b=>b.classList.remove('on')); }
  if(wasForThis) return;
  const pop=document.createElement('div');
  pop.className='lbl-tip-pop';
  pop.textContent=btn.getAttribute('data-tip')||'';
  pop._owner=btn;
  document.body.appendChild(pop);
  btn.classList.add('on');
  const r=btn.getBoundingClientRect(); const pw=pop.offsetWidth, ph=pop.offsetHeight;
  let left=r.left+r.width/2-pw/2;
  left=Math.max(8, Math.min(left, window.innerWidth-pw-8));
  let top=r.top-ph-7; if(top<8) top=r.bottom+7; // flip below if no room above
  pop.style.left=left+'px'; pop.style.top=top+'px';
  const close=(ev)=>{ if(ev.target!==btn && !btn.contains(ev.target)){ pop.remove(); btn.classList.remove('on'); document.removeEventListener('click',close,true); document.removeEventListener('scroll',onScroll,true); window.removeEventListener('resize',close); } };
  const onScroll=()=>{ pop.remove(); btn.classList.remove('on'); document.removeEventListener('click',close,true); document.removeEventListener('scroll',onScroll,true); window.removeEventListener('resize',close); };
  setTimeout(()=>{ document.addEventListener('click',close,true); document.addEventListener('scroll',onScroll,true); window.addEventListener('resize',close); },0);
}

function _lblFontPickerToggle(id){
  const panel=document.getElementById(id+'-panel'); if(!panel) return;
  const isOpen=panel.style.display!=='none';
  // Close all open font panels first
  document.querySelectorAll('[id$="-panel"]').forEach(p=>{
    if(p.id.startsWith('lbl-')||p.id.startsWith('lbl-addr-')) p.style.display='none';
  });
  if(!isOpen){
    panel.style.display='block';
    // Scroll active item into view
    const active=panel.querySelector('[data-val][data-picker="'+id+'"]');
    const sel=document.getElementById(id);
    if(sel&&active){
      const curVal=sel.value;
      const cur=panel.querySelector('[data-val="'+curVal.replace(/"/g,'&quot;')+'"]');
      if(cur) cur.scrollIntoView({block:'nearest'});
    }
    const close=e=>{
      if(!document.getElementById(id+'-panel')?.contains(e.target)&&
         !document.getElementById(id+'-trigger')?.contains(e.target)){
        panel.style.display='none';
        document.removeEventListener('mousedown',close,true);
      }
    };
    setTimeout(()=>document.addEventListener('mousedown',close,true),10);
  }
}
function _lblFontPickerSel(id, val){
  // Update hidden select
  const sel=document.getElementById(id); if(sel) sel.value=val;
  // Update trigger label
  const f=_lblParseFont(val);
  const entry=_LBL_FONTS.find(x=>(x[0]+(x[2]?'|italic':''))===val);
  const lbl=document.getElementById(id+'-label');
  if(lbl){ lbl.textContent=entry?entry[1]:val; lbl.style.fontFamily=f.family; lbl.style.fontStyle=f.italic?'italic':'normal'; }
  // Update active highlight in panel
  const panel=document.getElementById(id+'-panel');
  if(panel) panel.querySelectorAll('[data-val]').forEach(el=>{
    const isActive=el.getAttribute('data-val')===val;
    el.style.background=isActive?'rgba(139,115,85,.1)':'';
    el.style.color=isActive?'var(--gold-deep)':'var(--ink)';
    el.style.fontWeight=isActive?'600':'';
  });
  // Close panel
  if(panel) panel.style.display='none';
  // Update preview line
  if(id==='lbl-font') _lblFontPreview();
  if(id==='lbl-addr-font') _lblAddrFontPreview();
}

function _lblFontPreview(){
  const sel=document.getElementById('lbl-font');
  const pv=document.getElementById('lbl-font-preview');
  if(!sel||!pv) return;
  const f=_lblParseFont(sel.value);
  pv.style.fontFamily=f.family; pv.style.fontStyle=f.italic?'italic':'normal';
}

function _lblAddrFontPreview(){
  const sel=document.getElementById('lbl-addr-font');
  const pv=document.getElementById('lbl-addr-preview');
  if(!sel||!pv) return;
  const f=_lblParseFont(sel.value);
  pv.style.fontFamily=f.family; pv.style.fontStyle=f.italic?'italic':'normal';
}

function _lblToggleAddrFont(){
  const box=document.getElementById('lbl-addr-box');
  const icon=document.getElementById('lbl-addr-icon');
  if(!box) return;
  const open=box.style.display!=='none';
  box.style.display=open?'none':'block';
  if(icon) icon.textContent=open?'\uff0b':'−';
}

// "Choose" include — build the guest envelope list with checkboxes
let _lblChosenIds=new Set();
function _lblChooseOpen(){
  const box=document.getElementById('lbl-choose-box');
  if(!box) return;
  const isOpen=box.style.display!=='none';
  if(isOpen) return; // already built
  // Pre-populate from saved
  const saved=(STATE.settings&&STATE.settings.lblSetup&&STATE.settings.lblSetup.chooseIds)||[];
  _lblChosenIds=new Set(saved.length?saved:[]); // empty = all selected implicitly
  _lblChooseRebuild('');
}
function _lblChooseRebuild(q){
  const listEl=document.getElementById('lbl-choose-list');
  const countEl=document.getElementById('lbl-choose-count');
  if(!listEl) return;
  let envs=[];
  try{ envs=_rsvpBuildEnvelopes(); }catch(x){ return; }
  const lq=(q||'').toLowerCase();
  const filtered=lq?envs.filter(e=>e.names.some(n=>n.toLowerCase().includes(lq))):envs;
  // If nothing chosen yet, default to all selected
  if(!_lblChosenIds.size) envs.forEach(e=>_lblChosenIds.add(e.names[0]||''));
  listEl.innerHTML=filtered.map((e,i)=>{
    const key=e.names[0]||'';
    const label=e.names.length>1?e.names.slice(0,-1).join(', ')+' & '+e.names[e.names.length-1]:e.names[0]||'';
    const chk=_lblChosenIds.has(key)?'checked':'';
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 12px;${i<filtered.length-1?'border-bottom:.5px solid var(--border)':''}cursor:pointer;font-size:12.5px;color:var(--ink)">
      <input type="checkbox" ${chk} onchange="_lblChooseToggle('${key.replace(/'/g,"\\'")}',this.checked)" style="accent-color:var(--gold);flex-shrink:0"/>
      ${label.replace(/&/g,'&amp;')}
    </label>`;
  }).join('');
  const total=envs.length, chosen=_lblChosenIds.size;
  if(countEl) countEl.textContent=`${chosen} of ${total} selected`;
}
function _lblChooseToggle(key,on){
  if(on) _lblChosenIds.add(key); else _lblChosenIds.delete(key);
  const envs=_rsvpBuildEnvelopes();
  const countEl=document.getElementById('lbl-choose-count');
  if(countEl) countEl.textContent=`${_lblChosenIds.size} of ${envs.length} selected`;
}
function _lblChooseFilter(q){
  _lblChooseRebuild(q);
}
// Called when any lbl-who radio changes
function _lblWhoChange(){
  const val=document.querySelector('input[name="lbl-who"]:checked')?.value||'all';
  const box=document.getElementById('lbl-choose-box');
  if(!box) return;
  if(val==='choose'){
    box.style.display='block';
    _lblChooseOpen();
  } else {
    box.style.display='none';
  }
}

function _lblPreviewPopup(){
  const gv=id=>{ const el=document.getElementById(id); return el?el.value:''; };
  const namesVal=document.querySelector('input[name="lbl-names"]:checked')?.value||'full';
  const nameFontVal=gv('lbl-font');
  const addrBoxOpen=document.getElementById('lbl-addr-box')?.style.display!=='none';
  const addrFontVal=addrBoxOpen?gv('lbl-addr-font'):'';
  const includePrefix=document.getElementById('lbl-prefix')?.checked||false;
  const nf=_lblParseFont(nameFontVal);
  const af=addrFontVal?_lblParseFont(addrFontVal):nf;

  let sampleName='James &amp; Sarah Smith', sampleAddr='123 Maple Street<br>Brisbane QLD 4000';
  try{
    const envs=_rsvpBuildEnvelopes();
    if(envs.length){
      const e=envs[0];
      sampleName=_lblFormatName(e.names,namesVal,e.familyName||'',includePrefix?e.prefixes:null).replace(/&amp;/g,'&amp;');
      const addrLines=(e.address||'').split(/\n|,\s*/).map(l=>l.trim()).filter(Boolean);
      if(addrLines.length) sampleAddr=addrLines.map(l=>l.replace(/&/g,'&amp;')).join('<br>');
    }
  }catch(x){}

  const box=document.getElementById('modal-box')||document.body;
  const existing=document.getElementById('lbl-preview-overlay');
  if(existing) existing.remove();
  const overlay=document.createElement('div');
  overlay.id='lbl-preview-overlay';
  overlay.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:500;display:flex;align-items:center;justify-content:center;border-radius:16px';
  overlay.innerHTML=`<div style="background:var(--cream);border:1px solid var(--border);border-radius:12px;width:310px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.22)">
    <div style="font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;padding:16px 18px 8px;color:var(--ink);border-bottom:.5px solid var(--border)">Label preview</div>
    <div style="padding:20px 18px;display:flex;justify-content:center">
      <div style="width:210px;min-height:115px;border:1px dashed #C0B5A8;border-radius:3px;padding:12px 14px;display:flex;flex-direction:column;justify-content:center;gap:5px;background:#fff">
        <div style="font-family:${nf.family.replace(/"/g,'&quot;')};font-style:${nf.italic?'italic':'normal'};font-size:14px;font-weight:600;color:#1A1A18;line-height:1.25;word-break:break-word">${sampleName}</div>
        <div style="font-family:${af.family.replace(/"/g,'&quot;')};font-style:${af.italic?'italic':'normal'};font-size:11px;color:#3A352F;line-height:1.4">${sampleAddr}</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--muted);text-align:center;padding:0 18px 12px">Approximate size — actual print dimensions depend on your label preset.</div>
    <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:.5px solid var(--border);background:var(--surface)">
      <button onclick="document.getElementById('lbl-preview-overlay').remove()" class="btn btn-outline btn-sm">\u2190 Back</button>
      <button onclick="document.getElementById('lbl-preview-overlay').remove()" class="btn btn-primary btn-sm">OK</button>
    </div>
  </div>`;
  box.appendChild(overlay);
}

function _lblPresetChange(){
  const sel=document.getElementById('lbl-preset');
  const custom=document.getElementById('lbl-custom');
  if(!sel||!custom) return;
  custom.style.display=sel.value==='custom'?'block':'none';
  if(sel.value!=='custom'){
    const p=_LABEL_PRESETS.find(x=>x[0]===sel.value);
    if(p){
      const setVal=(id,v)=>{ const el=document.getElementById(id); if(el) el.value=v; };
      setVal('lbl-cols',p[2]); setVal('lbl-rows',p[3]); setVal('lbl-w',p[4]); setVal('lbl-h',p[5]);
      setVal('lbl-mt',p[6]); setVal('lbl-ml',p[7]); setVal('lbl-gh',p[8]); setVal('lbl-gv',p[9]);
    }
  }
}

// Format the name line for a label.
// familyName: registered family group name for compound-surname detection.
// prefixes: optional per-person prefix array parallel to names[] (e.g. ['Dr.','Mrs.']).
// 3+ names: "Lauren, Jeremy, Aria & Riley Van Strijp"
function _lblFormatName(names, mode, familyName, prefixes){
  if(!names||!names.length) return '';
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const withPfx=(n,i)=>{ const p=prefixes&&prefixes[i]?prefixes[i]+' ':''; return p+n; };
  if(names.length===1) return esc(withPfx(names[0],0));

  const joinFirsts=arr=>arr.length===1?arr[0]:arr.slice(0,-1).join(', ')+' & '+arr[arr.length-1];

  if(mode==='first') return esc(joinFirsts(names.map((n,i)=>withPfx((n||'').split(' ')[0],i)).filter(Boolean)));

  let sharedSurname=null;
  if(familyName&&familyName.trim()){
    const fn=familyName.trim();
    const allEndWith=names.every(n=>(n||'').trim().toLowerCase().endsWith(fn.toLowerCase()));
    if(allEndWith) sharedSurname=fn;
  }
  if(!sharedSurname){
    const wordArrays=names.map(n=>(n||'').trim().split(/\s+/));
    const minLen=Math.min(...wordArrays.map(w=>w.length));
    let suffixLen=0;
    for(let s=1;s<minLen;s++){
      const cands=wordArrays.map(w=>w.slice(-s).join(' ').toLowerCase());
      if(cands.every(c=>c===cands[0])) suffixLen=s;
    }
    if(suffixLen>0) sharedSurname=wordArrays[0].slice(-suffixLen).join(' ');
  }

  const getFirst=n=>{
    const full=(n||'').trim();
    if(!sharedSurname) return full;
    const sfx=' '+sharedSurname;
    if(full.toLowerCase().endsWith(sfx.toLowerCase())) return full.slice(0,full.length-sfx.length).trim()||full;
    return full;
  };

  if(mode==='full'){
    if(sharedSurname){ const firsts=names.map((n,i)=>withPfx(getFirst(n),i)); return esc(`${joinFirsts(firsts)} ${sharedSurname}`); }
    return esc(joinFirsts(names.map((n,i)=>withPfx(n,i))));
  }
  if(mode==='initials'){
    if(sharedSurname){ const inits=names.map((n,i)=>{ const p=prefixes&&prefixes[i]?prefixes[i]+' ':''; const f=getFirst(n); return p+f[0].toUpperCase()+'.'; }); return esc(`${joinFirsts(inits)} ${sharedSurname}`); }
    return esc(names.map((n,i)=>{ const p=prefixes&&prefixes[i]?prefixes[i]+' ':''; const ws=(n||'').trim().split(/\s+/); return ws.length>1?p+ws[0][0].toUpperCase()+'. '+ws.slice(1).join(' '):p+n; }).join(' & '));
  }
  if(mode==='surname'){
    const hasPfx=prefixes&&prefixes.some(p=>p&&p.trim());
    if(hasPfx){
      const _PFX_ORDER=['Mr.','Mr','Mrs.','Mrs','Ms.','Ms','Miss.','Miss','Mx.','Mx',
        'Master.','Master','Dr.','Dr','Prof.','Prof','Atty.','Rev.','Fr.','Hon.',
        'Gen.','Capt.','Lt.','Sgt.','Sir','Dame','Lord','Lady'];
      const pfxRank=p=>{ const i=_PFX_ORDER.indexOf((p||'').trim()); return i<0?99:i; };
      let pairs=names.map((n,i)=>({ name:n, pfx:(prefixes[i]||'').trim() }));
      pairs=[...pairs].sort((a,b)=>pfxRank(a.pfx)-pfxRank(b.pfx));
      if(sharedSurname){
        // "Mr & Mrs Smith" - strip surname, just use prefixes joined
        const pfxParts=pairs.map(p=>p.pfx||getFirst(p.name));
        return esc(joinFirsts(pfxParts)+' '+sharedSurname);
      } else {
        // "Mr Smith & Mrs Jones"
        const parts=pairs.map(p=>{
          const ws=(p.name||'').trim().split(/\s+/);
          const sn=ws[ws.length-1];
          return p.pfx ? p.pfx+' '+sn : sn;
        });
        return esc(joinFirsts(parts));
      }
    }
    // No prefixes - original behaviour
    if(sharedSurname) return esc('The '+sharedSurname+' Family');
    const surnames=[...new Set(names.map(n=>{ const ws=(n||'').trim().split(/\s+/); return ws[ws.length-1]; }))];
    return esc(joinFirsts(surnames));
  }
  return esc(joinFirsts(names.map((n,i)=>withPfx(n,i))));
}

function _rsvpBuildEnvelopes(){
  const gs=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B');
  const invitedIds=_invitedGuestIdSet();
  const used=new Set();
  const envelopes=[];
  (STATE.families||[]).forEach(fam=>{
    const mem=fam.memberIds.map(id=>gs.find(g=>g.id===id)).filter(Boolean);
    if(!mem.length) return;
    mem.forEach(g=>used.add(g.id));
    const invited=mem.some(g=>invitedIds.has(g.id));
    const addr=[...new Set(mem.map(g=>(g.address||'').trim()).filter(Boolean))];
    envelopes.push({names:mem.map(g=>g.name),prefixes:mem.map(g=>g.prefix||''),familyName:fam.name||'',address:addr[0]||'',invited,kind:'family'});
  });
  gs.forEach(g=>{
    if(used.has(g.id)) return;
    if(g.coupleId){ const partner=gs.find(x=>x.id===g.coupleId); if(partner&&!used.has(partner.id)){ used.add(g.id); used.add(partner.id); envelopes.push({names:[g.name,partner.name],prefixes:[g.prefix||'',partner.prefix||''],address:(g.address||partner.address||'').trim(),invited:invitedIds.has(g.id)||invitedIds.has(partner.id),kind:'couple'}); return; } }
    if(g.plusOneId){ const plus=gs.find(x=>x.id===g.plusOneId); if(plus&&!used.has(plus.id)){ used.add(g.id); used.add(plus.id); envelopes.push({names:[g.name],prefixes:[g.prefix||''],address:(g.address||plus.address||'').trim(),invited:invitedIds.has(g.id)||invitedIds.has(plus.id),kind:'plusone'}); return; } }
    if(!used.has(g.id)){ used.add(g.id); envelopes.push({names:[g.name],prefixes:[g.prefix||''],address:(g.address||'').trim(),invited:invitedIds.has(g.id),kind:'solo'}); }
  });
  return envelopes;
}

function _rsvpGenerateLabels(){
  const gv=(id)=>{ const el=document.getElementById(id); return el?el.value:''; };
  const presetId=gv('lbl-preset');
  const paperId=gv('lbl-paper')||'A4';
  const nameFontVal=gv('lbl-font')||'Arial, Helvetica, sans-serif';
  const addrBoxOpen=document.getElementById('lbl-addr-box')?.style.display!=='none';
  const addrFontVal=addrBoxOpen?gv('lbl-addr-font'):'';
  const sortVal=document.querySelector('input[name="lbl-sort"]:checked')?.value||'alpha';
  const whoVal=document.querySelector('input[name="lbl-who"]:checked')?.value||'all';
  const namesVal=document.querySelector('input[name="lbl-names"]:checked')?.value||'full';
  const includePrefix=document.getElementById('lbl-prefix')?.checked||false;
  const addrOnly=document.getElementById('lbl-addronly')?.checked||false;
  const chooseIds=whoVal==='choose'?[..._lblChosenIds]:[];

  const nf=_lblParseFont(nameFontVal);
  const af=addrFontVal?_lblParseFont(addrFontVal):nf;

  let cols,rows,labelW,labelH,marginTop,marginLeft,gutterH,gutterV;
  if(presetId==='custom'){
    cols=parseInt(gv('lbl-cols'))||3; rows=parseInt(gv('lbl-rows'))||10;
    labelW=parseFloat(gv('lbl-w'))||63.5; labelH=parseFloat(gv('lbl-h'))||38.1;
    marginTop=parseFloat(gv('lbl-mt'))||12.7; marginLeft=parseFloat(gv('lbl-ml'))||4.8;
    gutterH=parseFloat(gv('lbl-gh'))||3.2; gutterV=parseFloat(gv('lbl-gv'))||0;
  } else {
    const p=_LABEL_PRESETS.find(x=>x[0]===presetId)||_LABEL_PRESETS[0];
    [,, cols,rows,labelW,labelH,marginTop,marginLeft,gutterH,gutterV]=p;
  }
  const paper=_LABEL_PAPER.find(x=>x[0]===paperId)||_LABEL_PAPER[0];
  const paperW=paper[2], paperH=paper[3];

  if(!STATE.settings) STATE.settings={};
  STATE.settings.lblSetup={ preset:presetId, paper:paperId, font:nameFontVal, addrFont:addrFontVal||'', sort:sortVal, who:whoVal, names:namesVal, includePrefix, addrOnly,
    chooseIds, cols, rows, w:labelW, h:labelH, mt:marginTop, ml:marginLeft, gh:gutterH, gv:gutterV };
  saveToStorage();

  let envs=_rsvpBuildEnvelopes();
  if(whoVal==='invited') envs=envs.filter(e=>e.invited);
  else if(whoVal==='notsent') envs=envs.filter(e=>!e.invited);
  else if(whoVal==='choose'&&chooseIds.length) envs=envs.filter(e=>chooseIds.includes(e.names[0]||''));
  // "Only guests with an address" — drop households whose address resolves to no
  // printable lines (same test the label cell uses for its "No address" fallback).
  if(addrOnly) envs=envs.filter(e=>(e.address||'').split(/\n|,\s*/).map(l=>l.trim()).filter(Boolean).length>0);
  if(sortVal==='invited') envs.sort((a,b)=>{ if(a.invited!==b.invited) return a.invited?-1:1; return (a.names[0]||'').localeCompare(b.names[0]||''); });
  else envs.sort((a,b)=>(a.names[0]||'').localeCompare(b.names[0]||''));

  const namePt=labelH<28?7:labelH<35?8:9;
  const addrPt=labelH<28?6:labelH<35?7:8;
  const labelsPerPage=cols*rows;
  const totalPages=Math.ceil(envs.length/labelsPerPage)||1;
  const pxW=((labelW-7)*3.7795).toFixed(1);

  const labelCells=envs.map(e=>{
    const nameHtml=_lblFormatName(e.names, namesVal, e.familyName||'', includePrefix?e.prefixes:null);
    const addrLines=(e.address||'').split(/\n|,\s*/).map(l=>l.trim()).filter(Boolean);
    const addrHtml=addrLines.map(l=>`<div class="addr-line">${l.replace(/&/g,'&amp;')}</div>`).join('');
    return `<div class="label-cell"><div class="lbl-name" data-shrink="1">${nameHtml}</div>${addrHtml||'<div class="addr-line no-addr">No address</div>'}</div>`;
  });

  while(labelCells.length%labelsPerPage!==0) labelCells.push('<div class="label-cell empty"></div>');
  const pages=[];
  for(let i=0;i<labelCells.length;i+=labelsPerPage) pages.push(labelCells.slice(i,i+labelsPerPage));
  const pageHtml=pages.map(pg=>`<div class="label-page">${pg.join('')}</div>`).join('');

  const htmlContent=`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Address Labels</title>
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
.lbl-name{font-family:${nf.family};font-style:${nf.italic?'italic':'normal'};font-size:${namePt}pt;font-weight:600;color:#1A1A18;line-height:1.25;
  word-break:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.addr-line{font-family:${af.family};font-style:${af.italic?'italic':'normal'};font-size:${addrPt}pt;color:#3A352F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.no-addr{color:#aaa;font-style:italic}
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

// Desktop (fine-pointer) click-and-drag horizontal panning for the RSVP tracker,
// mirroring the bulk guest table's _gtAttachPan. Ignores presses on interactive
// cells; a real drag suppresses the trailing click.
function _rsvpAttachPan(){
  const w=document.getElementById('rsvp-scroll');
  if(!w) return;
  w.classList.add('rsvp-grabbable');
  let down=false, sx=0, sl=0, moved=false, pid=null;
  w.addEventListener('selectstart',function(e){ if(down) e.preventDefault(); });
  w.addEventListener('pointerdown',function(e){
    if(e.button!==0) return;
    if(e.target.closest('input,select,textarea,button,a,[contenteditable="true"],.sort-th,th')) return;
    down=true; moved=false; sx=e.clientX; sl=w.scrollLeft; pid=e.pointerId;
    w.classList.add('rsvp-grabbing');
    w.style.userSelect='none'; w.style.webkitUserSelect='none';
    try{ w.setPointerCapture(e.pointerId); }catch(_){}
  });
  w.addEventListener('pointermove',function(e){
    if(!down) return;
    const dx=e.clientX-sx;
    if(Math.abs(dx)>3) moved=true;
    w.scrollLeft=sl-dx;
  });
  const end=function(){ if(!down) return; down=false; w.classList.remove('rsvp-grabbing'); w.style.userSelect=''; w.style.webkitUserSelect=''; try{ if(pid!=null) w.releasePointerCapture(pid); }catch(_){} pid=null; };
  w.addEventListener('pointerup',end);
  w.addEventListener('pointercancel',end);
  w.addEventListener('click',function(e){ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } },true);
}

function rsvpListHtml(list,statusMeta){
  if(!list.length) return `<div style="font-size:13px;color:var(--muted);padding:16px 0;text-align:center">No guests match this filter.</div>`;
  return `<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">`+list.map((g,i)=>{
    const st=(!g.rsvp||g.rsvp==='awaiting')?'awaiting':g.rsvp;
    const m=statusMeta[st];
    const partner=g.coupleId?STATE.guests.find(x=>x.id===g.coupleId):null;
    const plus=g.plusOneId?STATE.guests.find(x=>x.id===g.plusOneId):null;
    const extra=[partner?'& '+partner.name:'',plus?'(+1: '+plus.name+')':(g.plusOne?'(+1 allowed)':'')].filter(Boolean).join(' ');
    const hasDiet=g.dietary&&g.dietary.length;
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;${i<list.length-1?'border-bottom:1px solid var(--border)':''}">
      <div style="display:flex;align-items:center;gap:8px;min-width:0">
        <span style="display:inline-flex;gap:4px;align-items:center;flex-shrink:0;min-width:15px;color:var(--gold-deep)">${hasDiet?dietIcons(g.dietary):''}</span>
        <span style="font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.name}${extra?` <span style="color:var(--muted);font-size:12px">${extra}</span>`:''}</span>
      </div>
      <select onchange="setGuestRsvp('${g.id}',this.value)" class="form-input rsvp-set"
        style="width:auto;min-width:120px;font-size:12px;padding:6px 32px 6px 11px;border-radius:14px;background-color:${m.bg};color:${m.fg};font-weight:500;cursor:pointer;appearance:none;-webkit-appearance:none">
        <option value="awaiting"${st==='awaiting'?' selected':''}>Awaiting</option>
        <option value="attending"${st==='attending'?' selected':''}>Attending</option>
        <option value="declined"${st==='declined'?' selected':''}>Declined</option>
      </select>
    </div>`;
  }).join('')+`</div>`;
}

// Re-render only the tracker list + filter pills in place — no full navigate, no scroll jump.
function rsvpRerenderList(){
  const s=rsvpStats();
  const statusMeta={
    attending:{label:'Attending',bg:'rgba(74,124,89,.14)',fg:'var(--green)'},
    declined:{label:'Declined',bg:'rgba(192,57,43,.12)',fg:'var(--red)'},
    awaiting:{label:'Awaiting',bg:'var(--surface)',fg:'var(--muted)'}
  };
  // Rebuild filtered list
  const q=rsvpQuery.trim().toLowerCase();
  const _filterInvitedIds=(rsvpFilter==='invited'||rsvpFilter==='notsent')?_invitedGuestIdSet():null;
  const list=STATE.guests.filter(g=>{
    if((g.listType||'A')==='B') return false;
    const st=(!g.rsvp||g.rsvp==='awaiting')?'awaiting':g.rsvp;
    if(rsvpFilter==='attending'||rsvpFilter==='declined'||rsvpFilter==='awaiting'){
      if(st!==rsvpFilter) return false;
    } else if(rsvpFilter==='invited'){
      if(!_filterInvitedIds.has(g.id)) return false;
    } else if(rsvpFilter==='notsent'){
      if(_filterInvitedIds.has(g.id)) return false;
    }
    if(q&&!g.name.toLowerCase().includes(q)) return false;
    return true;
  });
  // Patch the list — save both scroll positions first, restore after innerHTML swap.
  const listEl=document.getElementById('rsvp-list');
  if(listEl){
    const _scrollX=document.getElementById('rsvp-scroll')?.scrollLeft||0;
    const _scrollY=document.getElementById('rsvp-list-scroll')?.scrollTop||0;
    listEl.innerHTML=rsvpTableHtml(list,statusMeta);
    // Re-assert zoom on the inner list (zoom lives here, not on the wrapper).
    const z=_rsvpZoom();
    listEl.style.zoom = z===100 ? '' : String(z/100);
    // Restore scroll positions so the view doesn't jump on sort/send/status change.
    const _sc=document.getElementById('rsvp-scroll');
    const _sl=document.getElementById('rsvp-list-scroll');
    if(_sc && _scrollX) _sc.scrollLeft=_scrollX;
    if(_sl && _scrollY) _sl.scrollTop=_scrollY;
  }
  // Patch the filter pills
  const pillsEl=document.getElementById('rsvp-filter-pills');
  if(pillsEl){
    // If the user is sitting on "Not yet sent" but everyone's now been invited,
    // fall back to All so they're never stranded on an empty filter.
    if(rsvpFilter==='notsent' && !(s.notSent>0)) rsvpFilter='all';
    // If everyone's invited, the "Invited" filter equals "All" — drop it, and
    // bounce off it if it's the active filter.
    if(rsvpFilter==='invited' && s.invited>=s.total) rsvpFilter='all';
    pillsEl.innerHTML=[
      ['all','All',s.total,'','',''],
      ['attending','Attending',s.attending,'','',''],
      ['declined','Declined',s.declined,'','',''],
      ['awaiting','Awaiting',s.awaiting,'','',''],
      ['invited','Invited',s.invited,'rgba(92,143,114,.14)','var(--green)','rgba(92,143,114,.5)'],
      ['notsent','Not yet sent',s.notSent,'','','']
    ].filter(([key,,n])=>(key!=='notsent'||n>0)&&(key!=='invited'||s.invited<s.total)).map(([key,lbl,n,activeBg,activeFg,activeBorder])=>{
      const isActive=rsvpFilter===key;
      const bg=isActive?(activeBg||'var(--gold)'):'transparent';
      const fg=isActive?(activeFg||'#fff'):'var(--muted)';
      const border=isActive?(activeBorder||'var(--gold)'):'var(--border)';
      return `<button onclick="rsvpFilter='${key}';rsvpRerenderList()" class="rsvp-chip${isActive?' active':''}"
        style="font-size:11.5px;padding:5px 12px;border-radius:14px;border:1px solid ${border};cursor:pointer;background:${bg};color:${fg};font-family:inherit">${lbl} ${n}</button>`;
    }).join('');
  }
  // Re-attach pan on the new table
  if(typeof _rsvpAttachPan==='function') _rsvpAttachPan();
}

// Manually set a guest's RSVP from the admin tracker
function setGuestRsvp(id,val){
  const g=STATE.guests.find(x=>x.id===id);
  if(!g) return;
  g.rsvp=val;
  if(typeof _stampRsvpDate==='function') _stampRsvpDate(g,val);
  saveToStorage();
  rsvpRerenderList();
}

function openRsvpPage(){
  const uid=_sbSession&&_sbSession.user&&_sbSession.user.id;
  if(!uid){alert('Please sign in to preview the RSVP page.');return;}
  _showRsvpForm(uid,'modal');
}

// ══════════════════════════════════════════════
