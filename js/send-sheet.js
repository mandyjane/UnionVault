// STAGE 2 — Send hand-off + templates
// ════════════════════════════════════════════════════════════════════════

// Default save-the-date / invite / reminder templates (editable in Settings).
// Tokens: {guest} {names} {date} {rsvp_by} {link}
const _DEFAULT_SAVEDATE_TPL="Dear {guest},\n\nSave the date! {names} are getting married on {date}. A formal invitation will follow. We can't wait to celebrate with you!";
const _DEFAULT_INVITE_TPL="Dear {guest},\n\n{names} would be delighted to have you at their wedding on {date}. Kindly RSVP by {rsvp_by} via {link}. With love.";
const _DEFAULT_REMINDER_TPL="Hi {guest},\n\nA gentle reminder to RSVP for {names}'s wedding ({date}) by {rsvp_by}: {link}\n\nThank you!";
function _inviteTpl(kind){
  const s=STATE.settings||{};
  if(kind==='reminder') return (s.reminderTemplate!=null?s.reminderTemplate:_DEFAULT_REMINDER_TPL);
  if(kind==='savedate') return (s.saveDateTemplate!=null?s.saveDateTemplate:_DEFAULT_SAVEDATE_TPL);
  return (s.inviteTemplate!=null?s.inviteTemplate:_DEFAULT_INVITE_TPL);
}
// Pretty long date, e.g. "14 November 2026". Empty string if unset/invalid.
function _longDate(iso){
  if(!iso) return '';
  const d=new Date(iso+'T00:00:00'); if(isNaN(d)) return '';
  return d.getDate()+' '+['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()]+' '+d.getFullYear();
}
// The public RSVP link (same as the tracker's Copy/Preview link).
// Stage 5: uses couple_uid so the RSVP form can look up wedding details + save to rsvp_responses.
function _rsvpLink(){
  const uid = _wbPublicOwnerUid || (_sbSession&&_sbSession.user&&_sbSession.user.id);
  if(uid) return window.location.origin+window.location.pathname+'?rsvp='+uid;
  return window.location.origin+window.location.pathname+'?rsvp=true'; // fallback if not signed in
}
// Resolve template tokens for a given group of guests.
// The greeting ("Dear {guest}," / "Hi {guest}!") always sits on its own line with a blank
// line after it — also for templates saved before that was the default.
function _tplGreetingBreak(tpl){
  return String(tpl||'').replace(/^(\s*(?:[A-Za-z]+\s+)?\{guest\}[,!])[ \t]*(?!\r?\n)(\S)/, (m, greet, ch)=>greet+'\n\n'+ch.toUpperCase());
}
function _fillTemplate(tpl, grp){
  tpl=_tplGreetingBreak(tpl);
  const ev=STATE.event||{};
  const p1=ev.partner1||'', p2=ev.partner2||'';
  const names=(p1&&p2)?`${p1} & ${p2}`:(p1||p2||'the couple');
  // {guest}: first names of the group members (e.g. "Alex & Jordan" for a couple).
  const firsts=grp.members.map(g=>(g.name||'').trim().split(/\s+/)[0]).filter(Boolean);
  const guest = firsts.length? (firsts.length===1?firsts[0]:firsts.slice(0,-1).join(', ')+' & '+firsts[firsts.length-1]) : 'there';
  const map={
    '{guest}':guest,
    '{names}':names,
    '{date}':_longDate(ev.date)|| 'our wedding day',
    '{rsvp_by}':_longDate((STATE.settings||{}).rsvpBy)|| 'your earliest convenience',
    '{link}':_rsvpLink()
  };
  let msg = (tpl||'').replace(/\{guest\}|\{names\}|\{date\}|\{rsvp_by\}|\{link\}/g, m=>map[m]!=null?map[m]:m);
  if(_sbSession && typeof _uvIsPaid==='function' && !_uvIsPaid()) msg += '\n\nSent via unionvault.app';
  return msg;
}
// Primary contact of a group for a channel (first member with the needed field).
function _groupContact(grp, field){
  for(const g of grp.members){ const v=(g[field]||'').trim(); if(v) return v; }
  return '';
}
// e164-ish phone cleanup for sms:/wa.me (digits only; wa.me wants no +).
function _cleanPhone(p){ return (p||'').replace(/[^0-9]/g,''); }
// Copy helper (best-effort; falls back silently).
function _copyText(t){
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
  }catch(_){}
  try{ const ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }catch(_){}
  return Promise.resolve();
}
// --- Social handle platform helpers ---------------------------------------
// Each guest carries one `handle` string plus `handlePlatform` ('instagram'|'facebook').
// A send method identifies the platform it wants; if the guest's handle belongs to the
// other platform we don't build a broken link — we offer to switch (Option B).
function _guestHandlePlatform(g){ return (g && g.handlePlatform==='facebook') ? 'facebook' : 'instagram'; }
function _chanPlatform(chanKey){ return chanKey==='messenger' ? 'facebook' : (chanKey==='instagram' ? 'instagram' : null); }
function _platformLabel(p){ return p==='facebook' ? 'Facebook' : 'Instagram'; }
function _platformIconSvg(p){
  return p==='facebook'
    ? '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'
    : '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>';
}
// Members of a group that actually have a handle to send to.
function _membersWithHandle(grp){ return (grp&&grp.members||[]).filter(g=>g && (g.handle||'').trim()); }
// Normalise a stored handle into a bare username (strip @, pull last URL path segment).
function _bareHandle(raw){
  let h=(raw||'').trim();
  if(/\//.test(h)){ const clean=h.split(/[?#]/)[0].replace(/\/+$/,''); h=(clean.split('/').filter(Boolean).pop()||''); }
  return h.replace(/^@/,'').trim();
}
// Open a single member's chat for a platform. Returns a toast note.
function _openSocialFor(platform, g, message){
  const handle=_bareHandle(g && g.handle);
  _copyText(message);
  if(platform==='facebook'){
    const url=handle?`https://m.me/${encodeURIComponent(handle)}`:'https://www.messenger.com/';
    window.open(url,'_blank');
    return handle?`Opened Messenger to ${handle} — message copied, just paste & send.`:'Opened Messenger — message copied.';
  }
  const url=handle?`https://www.instagram.com/${encodeURIComponent(handle)}/`:'https://www.instagram.com/direct/inbox/';
  window.open(url,'_blank');
  return handle?`Opened @${handle}'s Instagram — message copied, tap Message then paste & send.`:'Opened Instagram — message copied.';
}
// Mismatch (Option B): the method's platform ≠ the handle's saved platform.
// Offer to send via the platform the handle actually belongs to.
function _confirmPlatformSwitch(g, tappedPlatform, message){
  const savedP=_guestHandlePlatform(g);
  const name=(g.name||'this guest').split(' ')[0];
  const body=`<div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:9px">
      <span style="width:26px;height:26px;border-radius:50%;background:rgba(198,150,66,.16);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold-deep)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${_platformIconSvg(savedP)}</svg></span>
      <div style="font-size:13.5px;color:var(--ink);font-weight:500">${_escHtml(name)}'s handle is saved for ${_platformLabel(savedP)}.</div>
    </div>
    <div style="font-size:12.5px;color:var(--muted);line-height:1.5">You tapped ${_platformLabel(tappedPlatform)}, but this handle won't open there. Send via ${_platformLabel(savedP)} instead?</div>
  </div>`;
  window.__handleSwitchPayload={ g, savedP, message };
  const footer=`<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Not now</button>
    <button class="btn btn-sm" onclick="_doPlatformSwitch()" style="background:var(--gold-deep);color:#fff;border:1px solid var(--gold-deep)">Send via ${_platformLabel(savedP)}</button>`;
  openModal('Different app', body, footer);
}
function _doPlatformSwitch(){
  const p=window.__handleSwitchPayload; if(!p) { closeModalDirect(); return; }
  closeModalDirect();
  const note=_openSocialFor(p.savedP, p.g, p.message);
  if(typeof _showInfoToast==='function') _showInfoToast(note, null, null);
}
// When several members have handles, ask which one to open a chat with.
function _pickHandleMember(grp, tappedPlatform, message, onPick){
  const mem=_membersWithHandle(grp);
  const rows=mem.map((g,i)=>{
    const p=_guestHandlePlatform(g);
    return `<button type="button" class="btn btn-outline" style="display:flex;align-items:center;gap:10px;width:100%;justify-content:flex-start;text-align:left;padding:10px 12px" onclick="_handleMemberPicked(${i})">
      <span style="color:var(--gold-deep);flex-shrink:0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${_platformIconSvg(p)}</svg></span>
      <span style="display:flex;flex-direction:column;line-height:1.3"><span style="font-size:13px;color:var(--ink);font-weight:500">${_escHtml(g.name||'Guest')}</span><span style="font-size:12px;color:var(--muted)">@${_escHtml(_bareHandle(g.handle))} · ${_platformLabel(p)}</span></span>
    </button>`;
  }).join('');
  window.__handlePickPayload={ mem, tappedPlatform, message, onPick };
  const body=`<div style="display:flex;flex-direction:column;gap:8px">
    <div style="font-size:12.5px;color:var(--muted);line-height:1.5;margin-bottom:2px">More than one person here has a handle. Whose chat should open?</div>
    ${rows}
  </div>`;
  const footer=`<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Cancel</button>`;
  openModal('Send to which person?', body, footer);
}
function _handleMemberPicked(i){
  const p=window.__handlePickPayload; if(!p) { closeModalDirect(); return; }
  const g=p.mem[i]; closeModalDirect();
  if(g && typeof p.onPick==='function') p.onPick(g);
}
// Members that carry a usable value for a contact field ('email' | 'phone').
function _membersWithField(grp, field){ return (grp&&grp.members||[]).filter(g=>g && (g[field]||'').trim()); }
// True when 2+ members have *different* values for a field — the only case worth
// asking about. If everyone shares one value (or only one has it), no prompt.
function _fieldNeedsPick(grp, field){
  const vals=_membersWithField(grp, field).map(g=>{
    const raw=(g[field]||'').trim();
    return field==='phone' ? _cleanPhone(raw) : raw.toLowerCase();
  }).filter(Boolean);
  return new Set(vals).size>1;
}
// Small inline SVG for the picker rows (phone or mail), matching channel icons.
function _contactFieldIcon(field){
  return field==='phone'
    ? '<path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 4.18 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'
    : '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>';
}
// Generalised "Send to which person?" for a contact field. `prompt` is the
// question line; `onPick(g)` runs with the chosen member.
function _pickContactMember(grp, field, prompt, onPick){
  const mem=_membersWithField(grp, field);
  const icon=_contactFieldIcon(field);
  const rows=mem.map((g,i)=>{
    const val=(g[field]||'').trim();
    return `<button type="button" class="btn btn-outline" style="display:flex;align-items:center;gap:10px;width:100%;justify-content:flex-start;text-align:left;padding:10px 12px" onclick="_contactMemberPicked(${i})">
      <span style="color:var(--gold-deep);flex-shrink:0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg></span>
      <span style="display:flex;flex-direction:column;line-height:1.3"><span style="font-size:13px;color:var(--ink);font-weight:500">${_escHtml(g.name||'Guest')}</span><span style="font-size:12px;color:var(--muted)">${_escHtml(val)}</span></span>
    </button>`;
  }).join('');
  window.__contactPickPayload={ mem, onPick };
  const body=`<div style="display:flex;flex-direction:column;gap:8px">
    <div style="font-size:12.5px;color:var(--muted);line-height:1.5;margin-bottom:2px">${_escHtml(prompt)}</div>
    ${rows}
  </div>`;
  const footer=`<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Cancel</button>`;
  openModal('Send to which person?', body, footer);
}
function _contactMemberPicked(i){
  const p=window.__contactPickPayload; if(!p){ closeModalDirect(); return; }
  const g=p.mem[i]; closeModalDirect();
  if(g && typeof p.onPick==='function') p.onPick(g);
}
// Open the right app/handoff for a channel with a pre-filled message.
// Returns a short human note describing what happened (for the toast).
function _channelHandoff(chanKey, grp, message){
  const subject='You\'re invited!';
  // ── Email ──────────────────────────────────────────────────────────────
  if(chanKey==='email'){
    const sendTo=(to)=>{
      const href=`mailto:${encodeURIComponent(to||'')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.location.href=href;
      return to?`Opened your mail app to ${to}.`:'Opened your mail app.';
    };
    if(_fieldNeedsPick(grp,'email')){
      _pickContactMember(grp,'email','More than one email on file. Who should this go to?',(g)=>{
        const note=sendTo((g.email||'').trim());
        if(typeof _showInfoToast==='function') _showInfoToast(note, null, null);
      });
      return '__deferred__';
    }
    return sendTo(_groupContact(grp,'email'));
  }
  // ── Text (SMS) ─────────────────────────────────────────────────────────
  if(chanKey==='text'){
    const sendTo=(rawPhone)=>{
      const ph=_cleanPhone(rawPhone);
      const href=`sms:${ph}?&body=${encodeURIComponent(message)}`;
      window.location.href=href;
      return ph?'Opened Messages, pre-filled.':'Opened Messages (no number on file — pre-filled the text).';
    };
    if(_fieldNeedsPick(grp,'phone')){
      _pickContactMember(grp,'phone','More than one number on file. Who should this go to?',(g)=>{
        const note=sendTo(g.phone||'');
        if(typeof _showInfoToast==='function') _showInfoToast(note, null, null);
      });
      return '__deferred__';
    }
    return sendTo(_groupContact(grp,'phone'));
  }
  // ── WhatsApp ───────────────────────────────────────────────────────────
  if(chanKey==='whatsapp'){
    const sendTo=(rawPhone)=>{
      const ph=_cleanPhone(rawPhone);
      const href=`https://wa.me/${ph}?text=${encodeURIComponent(message)}`;
      window.open(href,'_blank');
      return ph?'Opened WhatsApp, pre-filled.':'Opened WhatsApp (add a number to target a chat).';
    };
    if(_fieldNeedsPick(grp,'phone')){
      _pickContactMember(grp,'phone','More than one number on file. Who should this go to?',(g)=>{
        const note=sendTo(g.phone||'');
        if(typeof _showInfoToast==='function') _showInfoToast(note, null, null);
      });
      return '__deferred__';
    }
    return sendTo(_groupContact(grp,'phone'));
  }
  // ── Call ───────────────────────────────────────────────────────────────
  // Opens the dialer for a specific number; message copied as a talking-points aide.
  if(chanKey==='call'){
    const sendTo=(rawPhone)=>{
      const ph=_cleanPhone(rawPhone);
      _copyText(message);
      if(ph){ window.location.href=`tel:${ph}`; return 'Opened your dialer — message copied for reference.'; }
      return 'No number on file — message copied for reference.';
    };
    if(_fieldNeedsPick(grp,'phone')){
      _pickContactMember(grp,'phone','More than one number on file. Who are you calling?',(g)=>{
        const note=sendTo(g.phone||'');
        if(typeof _showInfoToast==='function') _showInfoToast(note, null, null);
      });
      return '__deferred__';
    }
    return sendTo(_groupContact(grp,'phone'));
  }
  // ── Messenger / Instagram ──────────────────────────────────────────────
  if(chanKey==='messenger'||chanKey==='instagram'){
    const tappedPlatform=_chanPlatform(chanKey);   // 'instagram' | 'facebook'
    const withHandle=_membersWithHandle(grp);
    // Deliver to one resolved member. Mismatch → offer to switch (Option B).
    const deliver=(g)=>{
      const savedP=_guestHandlePlatform(g);
      if(savedP!==tappedPlatform){
        _confirmPlatformSwitch(g, tappedPlatform, message);
        return '__deferred__';   // handled interactively; no toast here
      }
      return _openSocialFor(tappedPlatform, g, message);
    };
    if(withHandle.length===0){
      // Nobody has a handle — open the tapped platform's inbox with text copied.
      return _openSocialFor(tappedPlatform, {handle:''}, message);
    }
    if(withHandle.length===1){
      return deliver(withHandle[0]);
    }
    // Several members have handles — ask which person, then deliver.
    _pickHandleMember(grp, tappedPlatform, message, (g)=>{
      const note=deliver(g);
      if(note!=='__deferred__' && typeof _showInfoToast==='function') _showInfoToast(note, null, null);
    });
    return '__deferred__';
  }
  // post / inperson / other: nothing to open — just copy the text as a courtesy.
  // (No recipient picker: these don't route to any one person's contact.)
  _copyText(message);
  return 'Message copied to your clipboard.';
}
// ── Send sheet: invitation / save-the-date with the file or link attached ──────
// Chat/email links (mailto:, sms:, wa.me, Messenger, Instagram) can only carry text,
// so the file travels one of two ways: email goes out through the send-guest-email
// Edge Function with the file attached, and on a phone the OS share sheet attaches it.
// Everywhere else the message carries a "View your invitation" link instead.
const _SS_CHANNELS=['email','text','whatsapp','messenger','instagram'];
let _ss=null; // {kind, slotKey, method, grp, base, file:File|null, asset, toList, toPick}
function _ssIsPhone(){ try{ return matchMedia('(pointer:coarse)').matches; }catch(_){ return false; } }
function _ssCanShareFiles(){
  try{ return !!(navigator.canShare && navigator.canShare({files:[new File(['x'],'x.pdf',{type:'application/pdf'})]})); }catch(_){ return false; }
}
// Public pieces of the couple's invitation (invite kind only — save-the-date uploads aren't built yet).
function _ssInviteAsset(){
  const inv=STATE.invitation||{};
  const uid=_sbSession&&_sbSession.user&&_sbSession.user.id;
  const f=inv.file&&inv.file.mediaId?inv.file:null;
  const out={file:null, publicUrl:'', viewUrl:'', link:(inv.link&&inv.link.url)||''};
  if(f){
    out.file=f;
    if(uid){
      out.publicUrl=`${_SB_URL}/storage/v1/object/public/${_SB_BUCKET}/${uid}/${f.mediaId}`;
      const isPdf=/pdf/i.test(f.type||'')||/\.pdf$/i.test(f.name||'');
      out.viewUrl=window.location.origin+window.location.pathname+'?invite='+encodeURIComponent(uid+'.'+f.mediaId)+(isPdf?'&t=pdf':'');
    }
  }
  if(!out.viewUrl && out.link) out.viewUrl=out.link;
  return out;
}
function _ssCoupleNames(){ const ev=STATE.event||{}; return [ev.partner1,ev.partner2].filter(Boolean).join(' & '); }
function _ssMethodLabel(m){ const c=INVITE_CHANNELS.find(x=>x.key===m); return c?c.label:m; }
function _ssOpen(kind, slotKey, method){
  const grp=_groupFromSlotKey(slotKey); if(!grp) return;
  const base=_fillTemplate(_inviteTpl(kind), grp);
  const asset=kind==='invite'?_ssInviteAsset():{file:null,publicUrl:'',viewUrl:'',link:''};
  const signedIn=!!(_sbSession&&_sbSession.access_token);
  const emails=grp.members.map(g=>({name:g.name||'',email:(g.email||'').trim()})).filter(x=>x.email);
  _ss={kind, slotKey, method, grp, base, asset, file:null, signedIn, emails,
       to:emails.length?emails[0].email:'',
       attach:!!asset.file, addLink:true};
  // Email sent by UnionVault carries the file, so the link is opt-in there; elsewhere it's on.
  _ss.addLink = !(_ssMode()==='email-direct' && asset.file);
  // Share sheets need the File ready before the tap (iOS drops the gesture across an await).
  if(asset.file && method!=='email' && _ssIsPhone() && _ssCanShareFiles()){
    const src=_mediaUrl(asset.file.mediaId);
    if(src) fetch(src).then(r=>r.blob()).then(b=>{ if(_ss&&_ss.slotKey===slotKey) _ss.file=new File([b], asset.file.name||'invitation', {type:asset.file.type||b.type}); _ssRender(); }).catch(()=>{});
  }
  _ssRender(true);
}
// Which delivery this sheet will use, given the method, device and what's attached.
function _ssMode(){
  if(!_ss) return 'link';
  if(_ss.method==='email') return _ss.signedIn?'email-direct':'link';
  if(_ss.asset.file && _ssIsPhone() && _ssCanShareFiles()) return 'share';
  return 'link';
}
function _ssMessage(){
  const s=_ss;
  let msg=s.base;
  const extra=[];
  if(s.kind==='invite'){
    if(s.asset.viewUrl && s.addLink) extra.push('View your invitation: '+s.asset.viewUrl);
  } else if(s.kind==='savedate'){
    const w=_wbSite(); if(w && w.published && w.slug) extra.push('Details: '+_wbSiteUrl());
  }
  if(extra.length) msg=msg.replace(/\s+$/,'')+'\n\n'+extra.join('\n');
  return msg;
}
function _ssToggle(which){ if(!_ss) return; _ss[which]=!_ss[which]; _ssRender(); }
function _ssPickTo(v){ if(_ss){ _ss.to=v; } }
function _ssRender(open){
  const s=_ss; if(!s) return;
  const esc=_escHtml, mode=_ssMode();
  const noun=s.kind==='invite'?'invite':'save the date';
  const who=s.grp.members.map(g=>g.name).filter(Boolean).join(' & ');
  const contact = s.method==='email' ? (s.emails.length>1?'':(s.to||'no email on file')) : (_groupContact(s.grp,'phone')||'');
  const sw=(on,fn,label)=>`<span class="toggle-switch"><input type="checkbox" ${on?'checked':''} onchange="${fn}" aria-label="${esc(label)}"/><span class="toggle-track"></span></span>`;
  const rowStyle='display:flex;align-items:center;gap:11px;border:.5px solid var(--border);border-radius:11px;padding:9px 10px;background:var(--surface)';
  const lab='font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)';
  let attachHtml='';
  if(s.kind==='invite'){
    const f=s.asset.file;
    if(f){
      const src=_mediaUrl(f.mediaId);
      const isImg=/^image\//.test(f.type||'')||/\.(png|jpe?g|gif|webp)$/i.test(f.name||'');
      const ext=((f.name||'').match(/\.(\w+)$/)||['','FILE'])[1].toUpperCase();
      const thumb=isImg&&src?`<img src="${esc(src)}" alt="" style="width:40px;height:54px;object-fit:cover;border-radius:6px;flex-shrink:0"/>`:`<span style="width:40px;height:54px;border-radius:6px;background:rgba(196,168,130,.2);color:var(--gold-deep);display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${esc(ext)}</span>`;
      if(mode==='email-direct'||mode==='share'){
        attachHtml+=`<div style="${lab}">${mode==='share'?'Attached':'Include'}</div>
        <label style="${rowStyle};cursor:pointer">${thumb}<span style="flex:1;min-width:0"><span style="display:block;font-size:13px;font-weight:600;color:var(--ink)">${mode==='email-direct'?'Attach invitation file':esc(f.name||'Invitation')}</span><span style="display:block;font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${mode==='email-direct'?esc((f.name||'')+' · '):''}${esc(f.sizeLabel||'')}</span></span>${sw(s.attach,"_ssToggle('attach')",'Attach invitation file')}</label>`;
        if(s.asset.viewUrl) attachHtml+=`<label style="${rowStyle};cursor:pointer;margin-top:7px"><span style="flex:1;min-width:0"><span style="display:block;font-size:13px;font-weight:600;color:var(--ink)">Add “View invitation” link</span><span style="display:block;font-size:11.5px;color:var(--muted)">${mode==='email-direct'?'For guests whose email blocks attachments':'In case the file doesn’t come through'}</span></span>${sw(s.addLink,"_ssToggle('addLink')",'Add view invitation link')}</label>`;
      } else if(s.asset.viewUrl){
        attachHtml+=`<div style="${lab}">Include</div>
        <label style="${rowStyle};cursor:pointer">${thumb}<span style="flex:1;min-width:0"><span style="display:block;font-size:13px;font-weight:600;color:var(--ink)">Include invitation link</span><span style="display:block;font-size:11.5px;color:var(--muted)">${esc(_ssMethodLabel(s.method))} can’t take a file from here, so guests get a link to view it</span></span>${sw(s.addLink,"_ssToggle('addLink')",'Include invitation link')}</label>`;
      }
      if(!s.asset.viewUrl && !s.signedIn) attachHtml+=`<div style="font-size:11.5px;color:var(--muted);margin-top:6px">Sign in to share your invitation file with guests.</div>`;
    } else if(s.asset.link){
      attachHtml+=`<div style="${lab}">Include</div><label style="${rowStyle};cursor:pointer"><span style="flex:1;min-width:0"><span style="display:block;font-size:13px;font-weight:600;color:var(--ink)">Include invitation link</span><span style="display:block;font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.asset.link)}</span></span>${sw(s.addLink,"_ssToggle('addLink')",'Include invitation link')}</label>`;
    } else {
      attachHtml+=`<div style="border:1px dashed var(--border);border-radius:11px;padding:10px 12px;font-size:12px;color:var(--muted);line-height:1.5"><strong style="color:var(--ink)">No invitation uploaded yet</strong><br>Add one under Your Invitation to attach it. The message still sends on its own.</div>`;
    }
  } else {
    const w=_wbSite(); const pub=!!(w&&w.published&&w.slug);
    attachHtml+=`<div style="border:1px dashed var(--border);border-radius:11px;padding:10px 12px;font-size:12px;color:var(--muted);line-height:1.5"><strong style="color:var(--ink)">No save-the-date file yet</strong><br>${pub?'Your wedding website link goes in the message instead.':'Publish your wedding website to include its link.'} Uploading a save-the-date is coming soon.</div>`;
  }
  const toHtml = (s.method==='email' && s.emails.length>1) ? `<div style="display:flex;align-items:center;gap:8px;font-size:12.5px"><span style="color:var(--muted)">To</span><select class="form-input" style="font-size:12.5px;flex:1" onchange="_ssPickTo(this.value)">${s.emails.map(e=>`<option value="${esc(e.email)}" ${e.email===s.to?'selected':''}>${esc(e.name)} · ${esc(e.email)}</option>`).join('')}</select></div>` : '';
  const msg=_ssMessage();
  const body=`<div style="display:flex;flex-direction:column;gap:11px">
    <div style="font-size:12.5px;color:var(--muted);margin-top:-6px">${esc(who)} · ${esc(_ssMethodLabel(s.method))}${contact?' · '+esc(contact):''}</div>
    ${toHtml}
    ${attachHtml}
    <div style="${lab}">Message</div>
    <div id="ss-msg" style="border:.5px solid var(--border);border-radius:11px;padding:10px 12px;font-size:13px;line-height:1.55;color:var(--ink);background:var(--surface);white-space:pre-wrap;word-break:break-word;max-height:220px;overflow:auto">${esc(msg)}</div>
    ${mode==='share'?`<div style="font-size:11.5px;color:var(--muted);line-height:1.5">Your phone's share menu opens with the invitation attached and the message ready — choose ${esc(_ssMethodLabel(s.method))}, then the guest's chat.</div>`:''}
    ${mode==='email-direct'?`<div style="font-size:11.5px;color:var(--muted)">Sent from invites@unionvault.app as “${esc(_ssCoupleNames()||'UnionVault')}” — replies come to you.</div>`:''}
  </div>`;
  const primary = mode==='email-direct' ? 'Send email'
    : mode==='share' ? 'Share to '+_ssMethodLabel(s.method)
    : s.method==='email' ? 'Open mail app'
    : s.method==='text' ? 'Open Messages' : 'Open '+_ssMethodLabel(s.method);
  const footer=`<button class="btn btn-outline btn-sm" onclick="_ss=null;_closeConfirm2Direct()">Cancel</button>
    <button class="btn btn-primary btn-sm" id="ss-go" onclick="_ssGo()">${esc(primary)}</button>`;
  if(open || !document.getElementById('ss-msg')) openConfirm2('Send '+noun, body, footer);
  else { const b=document.getElementById('confirm2-body'); if(b) b.innerHTML=body; const g=document.getElementById('ss-go'); if(g) g.textContent=primary; }
}
// Make sure the invitation is in cloud storage before guests are pointed at it.
async function _ssEnsureUploaded(){
  const f=_ss&&_ss.asset.file; if(!f||!_sbSession) return;
  window._ssUploaded=window._ssUploaded||{};
  if(window._ssUploaded[f.mediaId]) return;
  try{
    const src=_mediaUrl(f.mediaId); if(!src) return;
    const blob=await (await fetch(src)).blob();
    if(await _sbPhotoUpload(f.mediaId, blob)) window._ssUploaded[f.mediaId]=true;
  }catch(_){}
}
async function _ssGo(){
  const s=_ss; if(!s) return;
  const mode=_ssMode(); const msg=_ssMessage();
  const btn=document.getElementById('ss-go');
  if(mode==='share'){
    if(s.attach && !s.file){ if(typeof _showInfoToast==='function') _showInfoToast('Still preparing the file — tap again in a moment.', null, null); return; }
    const data = s.attach ? {files:[s.file], text:msg} : {text:msg};
    try{ await navigator.share(data); }
    catch(e){ if(e && e.name==='AbortError') return; _ssFallback(msg); return; }
    _ssDone('Shared — finish sending in '+_ssMethodLabel(s.method)+'.');
    return;
  }
  if(mode==='email-direct'){
    if(!s.to){ if(typeof _showInfoToast==='function') _showInfoToast('No email address on file for this guest.', null, null); return; }
    if(btn){ btn.disabled=true; btn.textContent='Sending…'; }
    if(s.asset.file && (s.attach||s.addLink)) await _ssEnsureUploaded();
    const names=_ssCoupleNames();
    const payload={ to:[s.to], subject:(s.kind==='invite'?'You’re invited':'Save the date')+(names?' — '+names:''), body:msg,
      fromName:names||'UnionVault', kicker:names?names+"'s wedding":'', title:s.kind==='invite'?'You’re invited':'Save the date', replyTo:(STATE.settings&&STATE.settings.userEmail)||(_sbSession.user&&_sbSession.user.email)||'' };
    if(s.attach && s.asset.file && s.asset.publicUrl) payload.attachment={ filename:s.asset.file.name||'invitation', path:s.asset.publicUrl };
    let ok=false;
    try{
      await _sbEnsureFreshToken();
      const r=await fetch(_SB_URL+'/functions/v1/send-guest-email',{ method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+_sbSession.access_token,'apikey':_SB_KEY},
        body:JSON.stringify(payload) });
      ok = r.ok && (await r.json()).ok===true;
    }catch(_){ ok=false; }
    if(ok){ _ssDone('Email sent to '+s.to+'.'); return; }
    if(btn){ btn.disabled=false; btn.textContent='Send email'; }
    if(typeof _showInfoToast==='function') _showInfoToast('Couldn’t send from UnionVault — opening your mail app instead.', null, null);
    _ssFallback(msg); return;
  }
  if(s.asset.file && s.addLink) await _ssEnsureUploaded();
  _ssFallback(msg);
}
// The existing per-channel hand-off (mail app / Messages / WhatsApp / Messenger / Instagram).
function _ssFallback(msg){
  const s=_ss; if(!s) return;
  const note=_channelHandoff(s.method, s.grp, msg);
  _ssDone(note);
}
function _ssDone(note){
  const s=_ss; if(!s) return; _ss=null;
  _closeConfirm2Direct();
  _trackerRecordSend(s.kind, s.slotKey, s.method, note);
}
// --- Handle editor popup ---------------------------------------------------
// One handle field + a platform radio (Instagram / Facebook). Opens from the guest
// list (simple + card) and the tracker handle context. `after` is an optional
// re-render callback name run on save so the caller's view refreshes.
function _openHandleEditor(guestId, after){
  const g=(STATE.guests||[]).find(x=>x.id===guestId); if(!g) return;
  window.__handleEditAfter=after||null;
  const cur=(g.handle||'').replace(/"/g,'&quot;');
  const p=_guestHandlePlatform(g);
  const opt=(plat,label)=>{
    const on=p===plat;
    return `<label class="he-plat${on?' on':''}" onclick="_hePickPlat(this,'${plat}')" style="flex:1;display:flex;align-items:center;gap:7px;border:${on?'2px':'0.5px'} solid ${on?'var(--gold-deep)':'var(--border)'};background:${on?'rgba(198,150,66,.10)':'transparent'};border-radius:8px;padding:9px 11px;cursor:pointer">
      <span class="he-dot" style="width:15px;height:15px;border-radius:50%;border:${on?'4px':'1.5px'} solid ${on?'var(--gold-deep)':'var(--muted)'};box-sizing:border-box;flex-shrink:0"></span>
      <span style="color:${on?'var(--gold-deep)':'var(--muted)'};display:inline-flex"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${_platformIconSvg(plat)}</svg></span>
      <span style="font-size:13px;color:${on?'var(--gold-deep)':'var(--muted)'}">${label}</span>
    </label>`;
  };
  const body=`<div style="display:flex;flex-direction:column;gap:0">
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">For ${_escHtml(g.name||'this guest')}</div>
    <label class="form-label" style="margin-bottom:5px">Handle or username</label>
    <input class="form-input" id="he-handle" value="${cur}" placeholder="@username" style="margin-bottom:14px"/>
    <label class="form-label" style="margin-bottom:7px">This handle is for</label>
    <input type="hidden" id="he-plat" value="${p}"/>
    <div style="display:flex;gap:8px">${opt('instagram','Instagram')}${opt('facebook','Facebook')}</div>
  </div>`;
  const footer=`<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Cancel</button>
    <button class="btn btn-sm" onclick="_saveHandleEditor('${guestId}')" style="background:var(--gold-deep);color:#fff;border:1px solid var(--gold-deep)">Save</button>`;
  openModal('Social handle', body, footer);
}
function _hePickPlat(el, plat){
  const wrap=el.parentElement; if(!wrap) return;
  const hidden=document.getElementById('he-plat'); if(hidden) hidden.value=plat;
  Array.from(wrap.children).forEach(node=>{
    const on = node===el;
    node.style.border = (on?'2px':'0.5px')+' solid '+(on?'var(--gold-deep)':'var(--border)');
    node.style.background = on?'rgba(198,150,66,.10)':'transparent';
    const dot=node.querySelector('.he-dot');
    if(dot){ dot.style.border=(on?'4px':'1.5px')+' solid '+(on?'var(--gold-deep)':'var(--muted)'); }
    const col = on?'var(--gold-deep)':'var(--muted)';
    node.querySelectorAll('span').forEach(s=>{ if(!s.classList.contains('he-dot')) s.style.color=col; });
  });
}
function _saveHandleEditor(guestId){
  const g=(STATE.guests||[]).find(x=>x.id===guestId); if(!g){ closeModalDirect(); return; }
  const hv=(document.getElementById('he-handle')||{}).value||'';
  const pv=(document.getElementById('he-plat')||{}).value||'instagram';
  g.handle=hv.trim();
  g.handlePlatform = pv==='facebook' ? 'facebook' : 'instagram';
  if(typeof saveToStorage==='function') saveToStorage();
  closeModalDirect();
  const after=window.__handleEditAfter;
  if(after && typeof window[after]==='function'){ window[after](); }
  else { if(typeof renderGuestList==='function') renderGuestList(); if(typeof rsvpRerenderList==='function') rsvpRerenderList(); }
}
// Inline platform radio for the Add/Edit forms. idBase → hidden input id `${idBase}-plat`,
// current is 'instagram'|'facebook'. Tap toggles; reads via _formPlat(idBase).
function _platRadioHtml(idBase, current){
  const p=(current==='facebook')?'facebook':'instagram';
  const opt=(plat,label)=>{
    const on=p===plat;
    return `<label data-plat="${plat}" onclick="_formPickPlat('${idBase}',this,'${plat}')" style="flex:1 1 90px;min-width:90px;display:flex;align-items:center;justify-content:center;gap:6px;border:${on?'2px':'0.5px'} solid ${on?'var(--gold-deep)':'var(--border)'};background:${on?'rgba(198,150,66,.10)':'transparent'};border-radius:8px;padding:7px 9px;cursor:pointer">
      <span class="fpr-dot" style="width:13px;height:13px;border-radius:50%;border:${on?'4px':'1.5px'} solid ${on?'var(--gold-deep)':'var(--muted)'};box-sizing:border-box;flex-shrink:0"></span>
      <span class="fpr-icon" style="color:${on?'var(--gold-deep)':'var(--muted)'};display:inline-flex"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${_platformIconSvg(plat)}</svg></span>
      <span class="fpr-text" style="font-size:12px;color:${on?'var(--gold-deep)':'var(--muted)'}">${label}</span>
    </label>`;
  };
  return `<input type="hidden" id="${idBase}-plat" value="${p}"/>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${opt('instagram','Instagram')}${opt('facebook','Facebook')}</div>`;
}
function _formPickPlat(idBase, el, plat){
  const hidden=document.getElementById(idBase+'-plat'); if(hidden) hidden.value=plat;
  const wrap=el.parentElement; if(!wrap) return;
  Array.from(wrap.children).forEach(node=>{
    const on=node===el;
    node.style.border=(on?'2px':'0.5px')+' solid '+(on?'var(--gold-deep)':'var(--border)');
    node.style.background=on?'rgba(198,150,66,.10)':'transparent';
    const dot=node.querySelector('.fpr-dot');
    if(dot) dot.style.border=(on?'4px':'1.5px')+' solid '+(on?'var(--gold-deep)':'var(--muted)');
    const col=on?'var(--gold-deep)':'var(--muted)';
    node.querySelectorAll('span').forEach(s=>{ if(!s.classList.contains('fpr-dot')) s.style.color=col; });
  });
}
function _formPlat(idBase){ const el=document.getElementById(idBase+'-plat'); return (el&&el.value==='facebook')?'facebook':'instagram'; }
// Look up a group from a slotKey (rebuilds enough to resolve members + contacts).
function _groupFromSlotKey(slotKey){
  const g=STATE.guests||[];
  const byId={}; g.forEach(x=>byId[x.id]=x);
  if(slotKey.startsWith('fam:')){
    const id=slotKey.slice(4);
    const fam=(STATE.families||[]).find(f=>f.id===id);
    if(fam){ const mem=fam.memberIds.map(i=>byId[i]).filter(Boolean); if(mem.length) return {kind:'family', members:mem}; }
  } else if(slotKey.startsWith('couple:')){
    const id=slotKey.slice(7); const a=byId[id]; if(a){ const b=a.coupleId?byId[a.coupleId]:null; return {kind:'couple', members:[a,b].filter(Boolean)}; }
  } else if(slotKey.startsWith('plusone:')){
    const id=slotKey.slice(8); const a=byId[id]; if(a){ const b=a.plusOneId?byId[a.plusOneId]:null; return {kind:'plusone', members:[a,b].filter(Boolean)}; }
  } else if(slotKey.startsWith('solo:')){
    const id=slotKey.slice(5); const a=byId[id]; if(a) return {kind:'solo', members:[a]};
  }
  return null;
}
// Mark every guest in a slot's group as invited (adds the slot key to STATE.invites).
function _markSlotInvited(slotKey){
  if(!STATE.invites) STATE.invites=[];
  if(!STATE.invites.includes(slotKey)) STATE.invites.push(slotKey);
}
// THE SEND ACTION. kind: 'savedate'|'invite'|'reminder'. Sends via the recorded
// method, stamps today's date, and (for invites) auto-marks the group invited.
function trackerSend(kind, slotKey){
  const meta=_inviteMeta(slotKey);
  const field=_kindField(kind);
  const cur=meta[field];
  // Resolve the method: reminders may inherit the invite method via the mirror toggle.
  const method = kind==='reminder' ? _effectiveReminderMethod(slotKey) : kind==='invite' ? _effectiveInviteMethod(slotKey) : _effectiveSavedateMethod(slotKey);
  if(!method){ if(typeof _showInfoToast==='function') _showInfoToast('Pick a method first.', null, null); return; }
  const grp=_groupFromSlotKey(slotKey);
  if(!grp){ return; }
  // Save the dates + invites by email / chat go through the send sheet (file or link attached).
  if((kind==='invite'||kind==='savedate') && _SS_CHANNELS.includes(method)){
    _closeTrackerMenu();
    _ssOpen(kind, slotKey, method);
    return;
  }
  const tpl=_inviteTpl(kind);
  const message=_fillTemplate(tpl, grp);
  const note=_channelHandoff(method, grp, message);
  _trackerRecordSend(kind, slotKey, method, note);
}
// Record a send: stamp today, mark invited (invite kind) / sent (save-the-date, reminder).
function _trackerRecordSend(kind, slotKey, method, note){
  const meta=_inviteMeta(slotKey);
  const field=_kindField(kind);
  // Stamp today's date as the sent date; mark invited (invite kind only).
  // Save the Date + reminder carry their own `sent` flag and never mark invited.
  // Sending a mirrored reminder materialises the method so the sent record is complete.
  if(kind==='invite'){
    meta[field]={ method:method, date:_todayIso() };
    _markSlotInvited(slotKey);
  } else {
    meta[field]={ method:method, date:_todayIso(), sent:true };
  }
  if(typeof saveToStorage==='function') saveToStorage();
  _closeTrackerMenu();
  // '__deferred__' means an interactive flow (member picker / platform-switch confirm)
  // is showing its own toast — don't double up.
  if(note!=='__deferred__' && typeof _showInfoToast==='function') _showInfoToast(note, null, null);
  rsvpRerenderList();
}
// Whether a kind has been "sent" for a slot — invite is sent when the slot is
// marked invited; savedate + reminder are sent once their own `sent` flag is set.
function _isSentFor(kind, slotKey){
  if(kind==='invite') return isInvited(slotKey);
  const meta=(STATE.inviteMeta&&STATE.inviteMeta[slotKey])||{};
  return !!(meta[_kindField(kind)]&&meta[_kindField(kind)].sent);
}

// ── The transforming plane→tick control (Invite & Reminder columns) ──
// States: greyed plane (no method) → active plane (method, not sent) →
// green tick (sent). Tapping the tick opens a Resend / Uncheck menu.
function _sendControl(kind, slotKey){
  const meta=(STATE.inviteMeta&&STATE.inviteMeta[slotKey])||{};
  const cur=meta[_kindField(kind)]||null;
  const effMethod = kind==='reminder' ? _effectiveReminderMethod(slotKey) : kind==='invite' ? _effectiveInviteMethod(slotKey) : _effectiveSavedateMethod(slotKey);
  const sent=_isSentFor(kind, slotKey);
  const key=slotKey.replace(/'/g,"\\'");
  const plane='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  const check='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  if(sent){
    const dtxt=cur&&cur.date?` · ${_shortDate(cur.date)}`:'';
    return `<button type="button" data-sentctl="${kind}:${slotKey}" class="tsend-ctl sent" title="Sent${dtxt} — tap for options" aria-label="Sent, tap for options" onclick="event.stopPropagation();_datePopLastAnchor=event.currentTarget;openSendTickMenu(event,'${kind}','${key}')">${check}</button>`;
  }
  const noun=_kindNoun(kind).toLowerCase();
  if(effMethod){
    return `<button type="button" class="tsend-ctl ready" title="Send ${noun}${kind==='invite'?' + mark invited':''}" aria-label="Send" onclick="event.stopPropagation();trackerSend('${kind}','${key}')">${plane}</button>`;
  }
  // No method yet: open the method list; picking one sends straight away.
  return `<button type="button" class="tsend-ctl idle" title="Send ${noun} — choose a method" aria-label="Send — choose a method" onclick="event.stopPropagation();openTrackerMethodMenu(event,'${kind}','${key}',true)">${plane}</button>`;
}
// One-tap "mark sent today" with no method chosen (Option 3). Records the send +
// today's date and flips to the green tick; date is editable later via the tick menu.
function _markSentQuick(kind, slotKey){
  const meta=_inviteMeta(slotKey);
  if(kind==='invite'){
    const cur=meta.invite||{};
    meta.invite={ method:cur.method||null, date:_todayIso() };
    _markSlotInvited(slotKey);
  } else {
    const field=_kindField(kind);
    const cur=meta[field]||{};
    meta[field]={ method:cur.method||null, date:_todayIso(), sent:true };
  }
  if(typeof saveToStorage==='function') saveToStorage();
  if(typeof _showInfoToast==='function') _showInfoToast(`${_kindNoun(kind)} marked sent today.`, null, null);
  rsvpRerenderList();
}
// The tiny Resend / Uncheck menu opened by tapping a green tick.
function openSendTickMenu(ev, kind, slotKey){
  if(ev) ev.stopPropagation();
  const already=_tickMenuState && _tickMenuState.kind===kind && _tickMenuState.slotKey===slotKey;
  _closeTickMenu();
  if(already) return;
  const anchor=ev&&ev.currentTarget?ev.currentTarget:null;
  if(!anchor) return;
  const key=slotKey.replace(/'/g,"\\'");
  const menu=document.createElement('div');
  menu.className='tchan-menu';
  menu.id='tracker-tick-menu';
  menu.innerHTML=`<button type="button" class="tchan-item" onclick="event.stopPropagation();_tickResend('${kind}','${key}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg><span class="tchan-label">Resend</span></button>
    <button type="button" class="tchan-item" onclick="event.stopPropagation();_tickEditDate('${kind}','${key}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span class="tchan-label">Edit date</span></button>
    <button type="button" class="tchan-item tchan-clear" onclick="event.stopPropagation();_tickUncheck('${kind}','${key}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span class="tchan-label">Uncheck</span></button>`;
  document.body.appendChild(menu);
  const r=anchor.getBoundingClientRect();
  const mw=menu.offsetWidth||140, mh=menu.offsetHeight||90;
  let left=r.left+window.scrollX+(r.width/2)-(mw/2); let top=r.bottom+window.scrollY+6;
  const vw=document.documentElement.clientWidth;
  if(left+mw>vw-8) left=Math.max(8, vw-mw-8);
  if(left<8) left=8;
  if(r.bottom+mh>document.documentElement.clientHeight-8 && r.top-mh>8){ top=r.top+window.scrollY-mh-6; }
  menu.style.left=left+'px'; menu.style.top=top+'px';
  _tickMenuState={kind, slotKey};
  setTimeout(()=>{
    document.addEventListener('click', _tickMenuOutside, true);
    document.addEventListener('keydown', _tickMenuEsc, true);
    window.addEventListener('resize', _closeTickMenu);
    const sc=document.getElementById('rsvp-scroll'); if(sc) sc.addEventListener('scroll', _closeTickMenu, {passive:true});
  },0);
}
let _tickMenuState=null;
function _tickMenuOutside(e){ const m=document.getElementById('tracker-tick-menu'); if(m && !m.contains(e.target)) _closeTickMenu(); }
function _tickMenuEsc(e){ if(e.key==='Escape') _closeTickMenu(); }
function _closeTickMenu(){
  const m=document.getElementById('tracker-tick-menu');
  if(m && m.parentNode) m.parentNode.removeChild(m);
  document.removeEventListener('click', _tickMenuOutside, true);
  document.removeEventListener('keydown', _tickMenuEsc, true);
  window.removeEventListener('resize', _closeTickMenu);
  const sc=document.getElementById('rsvp-scroll'); if(sc) sc.removeEventListener('scroll', _closeTickMenu);
  _tickMenuState=null;
}
function _tickResend(kind, slotKey){ _closeTickMenu(); trackerSend(kind, slotKey); }
// Edit the recorded sent-date via a small native date popover.
function _tickEditDate(kind, slotKey){
  _closeTickMenu();
  const meta=(STATE.inviteMeta&&STATE.inviteMeta[slotKey])||{};
  const cur=meta[_kindField(kind)]||{};
  const val=cur.date||_todayIso();
  _openDatePopover({
    anchorSel:`[data-sentctl="${kind}:${slotKey}"]`,
    value:val,
    onPick:(iso)=>{
      const m=_inviteMeta(slotKey);
      const field=_kindField(kind);
      const c=m[field]||{};
      m[field]=(kind==='invite')?{method:c.method||null,date:iso}:{method:c.method||null,date:iso,sent:true};
      if(typeof saveToStorage==='function') saveToStorage();
      rsvpRerenderList();
    }
  });
}
// Generic tiny date-picker popover (portaled). Anchors to a selector or the
// last-clicked element; commits on change, closes stuck-safe.
let _datePopEl=null;
function _openDatePopover(opts){
  _closeDatePopover();
  const anchor=(opts.anchorSel&&document.querySelector(opts.anchorSel))||_datePopLastAnchor||null;
  _datePopAnchor=anchor;
  const pop=document.createElement('div');
  pop.className='date-pop'; pop.id='date-pop';
  pop.innerHTML=`<input type="date" value="${opts.value||''}" class="date-pop-input"/>`;
  document.body.appendChild(pop);
  _datePopEl=pop;
  const inp=pop.querySelector('input');
  const commit=()=>{ const v=inp.value; _closeDatePopover(); if(v && typeof opts.onPick==='function') opts.onPick(v); else if(!v && typeof opts.onClear==='function') opts.onClear(); };
  inp.addEventListener('change', commit);
  // position
  const r=(anchor&&anchor.getBoundingClientRect)?anchor.getBoundingClientRect():{left:80,bottom:80,top:60,width:20,height:20};
  const pw=pop.offsetWidth||180, ph=pop.offsetHeight||52;
  let left=r.left+window.scrollX+(r.width/2)-(pw/2); let top=r.bottom+window.scrollY+6;
  const vw=document.documentElement.clientWidth;
  if(left+pw>vw-8) left=Math.max(8, vw-pw-8);
  if(left<8) left=8;
  if(r.bottom+ph>document.documentElement.clientHeight-8 && r.top-ph>8){ top=r.top+window.scrollY-ph-6; }
  pop.style.left=left+'px'; pop.style.top=top+'px';
  setTimeout(()=>{ try{ inp.focus(); if(inp.showPicker) inp.showPicker(); }catch(e){} },10);
  // Register close-listeners on the NEXT frame so the click that opened the
  // popover (still propagating) can't immediately trigger the outside-click close.
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
    if(!_datePopEl) return;
    document.addEventListener('mousedown', _datePopOutside, true);
    document.addEventListener('keydown', _datePopEsc, true);
    window.addEventListener('resize', _closeDatePopover);
    const sc=document.getElementById('rsvp-scroll'); if(sc) sc.addEventListener('scroll', _closeDatePopover, {passive:true});
  }); });
}
let _datePopLastAnchor=null;
let _datePopAnchor=null;
function _datePopOutside(e){
  // Ignore clicks inside the popover or on the element that opened it.
  if(_datePopEl && (_datePopEl.contains(e.target) || (_datePopAnchor && _datePopAnchor.contains && _datePopAnchor.contains(e.target)))) return;
  _closeDatePopover();
}
function _datePopEsc(e){ if(e.key==='Escape') _closeDatePopover(); }
function _closeDatePopover(){
  if(_datePopEl && _datePopEl.parentNode) _datePopEl.parentNode.removeChild(_datePopEl);
  _datePopEl=null; _datePopAnchor=null;
  document.removeEventListener('mousedown', _datePopOutside, true);
  document.removeEventListener('keydown', _datePopEsc, true);
  window.removeEventListener('resize', _closeDatePopover);
  const sc=document.getElementById('rsvp-scroll'); if(sc) sc.removeEventListener('scroll', _closeDatePopover);
}
function _tickUncheck(kind, slotKey){
  _closeTickMenu();
  if(kind==='invite'){
    // Un-mark invited (back to active plane), keep the method.
    if(STATE.invites){ const i=STATE.invites.indexOf(slotKey); if(i>=0) STATE.invites.splice(i,1); }
  } else {
    const meta=(STATE.inviteMeta&&STATE.inviteMeta[slotKey])||{};
    const rec=meta[_kindField(kind)];
    if(rec){ rec.sent=false; }
  }
  if(typeof saveToStorage==='function') saveToStorage();
  rsvpRerenderList();
}

// ── Cog channel-chooser popup (lives in the RSVP & Invites tracker toolbar) ──
// One shared list drives BOTH menus; supports show/hide + drag reorder.
let _inviteChanMenuOpen=false;
function _inviteChanReopen(){
  setTimeout(()=>{ const m=document.getElementById('invite-chan-menu'); if(m){ m.style.display='block'; _inviteChanMenuOpen=true; _inviteChanAttachCloser(); } },40);
}
function _inviteChanAttachCloser(){
  const close=(ev)=>{ const menu=document.getElementById('invite-chan-menu'); if(menu && !menu.contains(ev.target)){ menu.style.display='none'; _inviteChanMenuOpen=false; document.removeEventListener('click',close); } };
  setTimeout(()=>document.addEventListener('click',close),0);
}
function _inviteChanToggleMenu(e){
  if(e) e.stopPropagation();
  const m=document.getElementById('invite-chan-menu'); if(!m) return;
  _inviteChanMenuOpen = m.style.display==='none' || !m.style.display;
  if(_inviteChanMenuOpen) _closeFloatingMenus('invite-chan-menu');
  m.style.display=_inviteChanMenuOpen?'block':'none';
  if(_inviteChanMenuOpen) _inviteChanAttachCloser();
}
// Refresh the channel list wherever it currently lives (the modal now).
function _inviteMethodsRefresh(){
  const list=document.getElementById('invite-methods-list');
  if(list){
    const body=document.getElementById('modal-body');
    if(body){ body.innerHTML=_inviteMethodsBodyHtml(); }
    else { list.outerHTML=_inviteMethodsBodyHtml(); }
  }
}
function _inviteChanSetHidden(key,hidden){
  if(!STATE.settings.inviteChanHidden) STATE.settings.inviteChanHidden={};
  if(hidden) STATE.settings.inviteChanHidden[key]=true; else delete STATE.settings.inviteChanHidden[key];
  saveToStorage();
  rsvpRerenderList();
  _inviteMethodsRefresh();
}
function _inviteChanMove(dragKey,targetKey,after){
  if(dragKey===targetKey) return;
  let ord=_inviteChannelOrder();
  const from=ord.indexOf(dragKey); if(from<0) return;
  ord.splice(from,1);
  let ti=ord.indexOf(targetKey); if(ti<0) ti=ord.length-1;
  ord.splice(after?ti+1:ti, 0, dragKey);
  STATE.settings.inviteChanOrder=ord;
  saveToStorage();
  rsvpRerenderList();
  _inviteMethodsRefresh();
}
let _inviteChanDrag=null;
function _inviteChanDragStart(e,key){ _inviteChanDrag=key; try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',key); }catch(_){} }
function _inviteChanDragOver(e){ e.preventDefault(); const row=e.currentTarget; const r=row.getBoundingClientRect(); const after=(e.clientY-r.top)>r.height/2; row.style.borderTop=after?'':'2px solid var(--gold-deep)'; row.style.borderBottom=after?'2px solid var(--gold-deep)':''; }
function _inviteChanDragLeave(e){ const row=e.currentTarget; row.style.borderTop=''; row.style.borderBottom=''; }
function _inviteChanDrop(e,key){ e.preventDefault(); const row=e.currentTarget; const r=row.getBoundingClientRect(); const after=(e.clientY-r.top)>r.height/2; row.style.borderTop=''; row.style.borderBottom=''; if(_inviteChanDrag) _inviteChanMove(_inviteChanDrag,key,after); _inviteChanDrag=null; }
function _inviteChanMenuHtml(){
  const _hideRemOn=!!(STATE.settings&&STATE.settings.hideReminderIfResponded);
  const _mirrorOn=!!(STATE.settings&&STATE.settings.mirrorReminderToInvite);
  const _mirrorSdOn=!!(STATE.settings&&STATE.settings.mirrorSavedateToInvite);
  const _z=_rsvpZoom();
  const _compact=_rsvpCompact();
  // ⓘ info button reusing the global .lbl-tip / _lblToggleTip popover pattern.
  const tip=(text)=>{ const t=_escAttr(text); return `<button type="button" class="lbl-tip" aria-label="${t}" title="${t}" data-tip="${t}" onclick="_lblToggleTip(event,this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>`; };
  const closeMenuJs=`(function(){var m=document.getElementById('invite-chan-menu');if(m){m.style.display='none';_inviteChanMenuOpen=false;}})();`;
  // Shared cog-button style (matches templates button).
  const btnStyle=`width:100%;display:flex;align-items:center;gap:9px;background:var(--cream);border:.5px solid var(--border);border-radius:8px;padding:9px 11px;cursor:pointer;text-align:left;font-family:inherit`;
  // Zoom segmented control.
  const zBtn=(val,lbl)=>{const on=_z===val;return `<button type="button" onclick="event.stopPropagation();_rsvpSetZoom(${val})" style="flex:1;font-size:11px;padding:5px 0;border-radius:6px;cursor:pointer;text-align:center;font-family:inherit;${on?'background:var(--gold);color:#fff;border:.5px solid var(--gold)':'background:var(--cream);border:.5px solid var(--border);color:var(--gold-deep)'}">${lbl}</button>`;};
  return `
  <div id="invite-chan-menu" style="display:none;position:absolute;top:calc(100% + 6px);right:0;z-index:50;width:248px;background:var(--cream);border:1px solid var(--border);border-radius:11px;box-shadow:0 4px 24px rgba(26,26,24,.12);padding:12px 14px">
    <label onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:9px;cursor:pointer">
      <input type="checkbox" ${_hideRemOn?'checked':''} onchange="_setHideReminderIfResponded(this.checked)" style="width:15px;height:15px;accent-color:var(--gold-deep);cursor:pointer;flex-shrink:0"/>
      <span style="display:inline-flex;align-items:center;gap:5px;min-width:0;font-size:12px;color:var(--ink);line-height:1.3">Hide reminder once responded ${tip("Blanks the reminder cell for guests who've replied.")}</span>
    </label>
    <div style="border-top:1px solid var(--border);margin:9px 0 7px"></div>
    <div style="font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-bottom:7px">Copy send methods</div>
    <label onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:9px;cursor:pointer;margin-bottom:8px">
      <input type="checkbox" ${_mirrorSdOn?'checked':''} onchange="_setMirrorSavedateToInvite(this.checked)" style="width:15px;height:15px;accent-color:var(--gold-deep);cursor:pointer;flex-shrink:0"/>
      <span style="display:inline-flex;align-items:center;gap:5px;min-width:0;font-size:12px;color:var(--ink);line-height:1.3">Match save the date method to invite ${tip("Invites use each guest's save-the-date method automatically. Pick an invite method to override.")}</span>
    </label>
    <label onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:9px;cursor:pointer">
      <input type="checkbox" ${_mirrorOn?'checked':''} onchange="_setMirrorReminderToInvite(this.checked)" style="width:15px;height:15px;accent-color:var(--gold-deep);cursor:pointer;flex-shrink:0"/>
      <span style="display:inline-flex;align-items:center;gap:5px;min-width:0;font-size:12px;color:var(--ink);line-height:1.3">Match invite method to reminder ${tip("Reminders use each guest's invite method automatically. Pick a reminder method to override.")}</span>
    </label>
    <div style="border-top:1px solid var(--border);margin:9px 0 8px"></div>
    <button type="button" onclick="event.stopPropagation();${closeMenuJs}_openInviteMethodsModal()" style="${btnStyle}">
      <span style="color:var(--gold-deep);flex-shrink:0;display:inline-flex">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </span>
      <span style="min-width:0;flex:1">
        <span style="display:block;font-size:12px;color:var(--ink);line-height:1.3;font-weight:500">Invite &amp; reminder methods</span>
        <span style="display:block;font-size:9.5px;color:var(--muted);margin-top:1px;line-height:1.35">Choose which methods show &amp; their order</span>
      </span>
      <span style="margin-left:auto;color:var(--sw-idle,#C9B89C);flex-shrink:0;font-size:15px;line-height:1">›</span>
    </button>
    <div style="height:8px"></div>
    <button type="button" onclick="event.stopPropagation();${closeMenuJs}_openInviteTemplatesModal()" style="${btnStyle}">
      <span style="color:var(--gold-deep);flex-shrink:0;display:inline-flex">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </span>
      <span style="min-width:0;flex:1">
        <span style="display:block;font-size:12px;color:var(--ink);line-height:1.3;font-weight:500">RSVP date &amp; message templates</span>
        <span style="display:block;font-size:9.5px;color:var(--muted);margin-top:1px;line-height:1.35">Set your deadline and edit invite / reminder text</span>
      </span>
      <span style="margin-left:auto;color:var(--sw-idle,#C9B89C);flex-shrink:0;font-size:15px;line-height:1">›</span>
    </button>
    <div style="border-top:1px solid var(--border);margin:10px 0 8px"></div>
    <div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:7px">Display</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
      <span style="font-size:12px;color:var(--ink);flex:1">Zoom</span>
      <div style="display:flex;gap:5px;flex:0 0 auto;width:150px">${zBtn(100,'100%')}${zBtn(90,'90%')}${zBtn(75,'75%')}</div>
    </div>
    <label onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:9px;cursor:pointer">
      <input type="checkbox" ${_compact?'checked':''} onchange="_rsvpSetCompact(this.checked)" style="width:15px;height:15px;accent-color:var(--gold-deep);cursor:pointer;flex-shrink:0"/>
      <span style="display:inline-flex;align-items:center;gap:5px;min-width:0;font-size:12px;color:var(--ink);line-height:1.3">Compact columns ${tip("Tightens the space between columns for a denser table.")}</span>
    </label>
  </div>`;
}

// The channel list (tick to show / drag to reorder) relocated to its own modal,
// opened from the cog's "Invite & reminder methods" button.
function _openInviteMethodsModal(){
  const footer=`<button class="btn btn-primary" onclick="closeModalDirect()">Done</button>`;
  openModal('Invite & reminder methods', _inviteMethodsBodyHtml(), footer);
}
// Body builder (separate so drag-reorder can re-render it in place).
function _inviteMethodsBodyHtml(){
  const hidden=_inviteChanHidden();
  const grip=`<svg class="dragrow-grip" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);cursor:grab;flex-shrink:0;pointer-events:none"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>`;
  const rows=_inviteChannelOrder().map(key=>{
    const c=_trackerChanDef(key); if(!c) return '';
    const on=!hidden[key];
    const note=key==='call'?`<span style="font-size:9px;color:var(--muted)">reminder only</span>`:'';
    return `<div draggable="true" class="dragrow"
      ondragstart="_inviteChanDragStart(event,'${key}')" ondragover="_inviteChanDragOver(event)" ondragleave="_inviteChanDragLeave(event)" ondrop="_inviteChanDrop(event,'${key}')"
      style="display:flex;align-items:center;gap:9px;font-size:13px;color:${on?'var(--ink)':'var(--muted)'};padding:8px 4px;border-radius:6px">
      ${grip}
      <label onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:9px;cursor:pointer;flex:1;min-width:0;pointer-events:none">
        <input type="checkbox" ${on?'checked':''} onchange="_inviteChanSetHidden('${key}',!this.checked)" style="width:16px;height:16px;accent-color:var(--gold-deep);cursor:pointer;flex-shrink:0;pointer-events:auto"/>
        <span style="display:inline-flex;color:var(--gold-deep);flex-shrink:0"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${c.svg}</svg></span>
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">${c.label}</span>${note}
      </label>
    </div>`;
  }).join('');
  return `<div>
    <div style="font-size:12.5px;color:var(--muted);line-height:1.5;margin-bottom:12px">Tick to show a method in the tracker's send menus. Drag to reorder.</div>
    <div id="invite-methods-list">${rows}</div>
  </div>`;
}

// The RSVP-by date + invite/reminder message templates, opened as an L1 modal
// from the tracker's invite/reminder cog. (Relocated out of App Settings so all
// the send-related setup lives beside the tracker that uses it.)
function _openInviteTemplatesModal(){
  const tokenChips=['{guest}','{names}','{date}','{rsvp_by}','{link}']
    .map(t=>`<code style="font-size:11px;background:var(--chip);border:.5px solid var(--border);border-radius:5px;padding:2px 7px;color:var(--gold-deep)">${t}</code>`).join('');
  const body=`
    <div style="display:flex;flex-direction:column;gap:18px">
      <div>
        <div style="font-size:13.5px;font-weight:500;margin-bottom:4px">RSVP by date</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">The date guests should respond by. Fills the <code style="font-size:11px">{rsvp_by}</code> token in your messages.</div>
        <input type="date" class="form-input" id="tpl-rsvpby" value="${(STATE.settings.rsvpBy||'').replace(/"/g,'&quot;')}" onchange="STATE.settings.rsvpBy=this.value;saveToStorage()" style="max-width:220px"/>
      </div>
      <div style="background:var(--surface);border-radius:12px;padding:16px 18px;border:1px solid var(--border)">
        <div style="font-size:12.5px;color:var(--muted);line-height:1.6">Templates fill these tokens automatically when you send from the tracker:
          <span style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${tokenChips}</span>
        </div>
      </div>
      <div>
        <div style="font-size:13.5px;font-weight:500;margin-bottom:4px">Save the Date message</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Sent when you use the Save the Date send button in the tracker.</div>
        <textarea class="form-input" id="tpl-savedate" rows="3" oninput="STATE.settings.saveDateTemplate=this.value;saveToStorage()" style="width:100%;resize:vertical;line-height:1.5;font-family:'Inter',sans-serif">${_escHtml(_inviteTpl('savedate'))}</textarea>
        <button type="button" class="btn btn-outline btn-sm" style="margin-top:8px" onclick="STATE.settings.saveDateTemplate=null;saveToStorage();document.getElementById('tpl-savedate').value=_inviteTpl('savedate')">Reset to default</button>
      </div>
      <div>
        <div style="font-size:13.5px;font-weight:500;margin-bottom:4px">Invite message</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Sent when you use the invite send button in the tracker.</div>
        <textarea class="form-input" id="tpl-invite" rows="3" oninput="STATE.settings.inviteTemplate=this.value;saveToStorage()" style="width:100%;resize:vertical;line-height:1.5;font-family:'Inter',sans-serif">${_escHtml(_inviteTpl('invite'))}</textarea>
        <button type="button" class="btn btn-outline btn-sm" style="margin-top:8px" onclick="STATE.settings.inviteTemplate=null;saveToStorage();document.getElementById('tpl-invite').value=_inviteTpl('invite')">Reset to default</button>
      </div>
      <div>
        <div style="font-size:13.5px;font-weight:500;margin-bottom:4px">Reminder message</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Sent when you use the reminder send button in the tracker.</div>
        <textarea class="form-input" id="tpl-reminder" rows="3" oninput="STATE.settings.reminderTemplate=this.value;saveToStorage()" style="width:100%;resize:vertical;line-height:1.5;font-family:'Inter',sans-serif">${_escHtml(_inviteTpl('reminder'))}</textarea>
        <button type="button" class="btn btn-outline btn-sm" style="margin-top:8px" onclick="STATE.settings.reminderTemplate=null;saveToStorage();document.getElementById('tpl-reminder').value=_inviteTpl('reminder')">Reset to default</button>
      </div>
      <div style="font-size:11.5px;color:var(--muted);line-height:1.5;background:var(--surface);border-radius:10px;padding:12px 14px;border:1px solid var(--border)">
        <strong style="color:var(--ink)">How sending works:</strong> Email, Text, and WhatsApp open the app pre-filled — you tap send. Messenger and Instagram open the person's chat and copy the message to your clipboard (paste &amp; send). Sending stamps today's date and marks the guest invited.
      </div>
    </div>`;
  const footer=`<button class="btn btn-primary" onclick="closeModalDirect()">Done</button>`;
  openModal('Invites & Reminders', body, footer);
}

// Toggle: when on, the tracker's Reminder cell is blank for any group whose members
// have all responded (attending/declined). Re-renders the tracker list in place.
function _setHideReminderIfResponded(on){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.hideReminderIfResponded=!!on;
  saveToStorage();
  if(typeof rsvpRerenderList==='function') rsvpRerenderList();
  _inviteChanRefreshMenu();
}
// Toggle: when on, reminders inherit each guest's invite method unless a reminder
// method was manually picked. Resolved at read time by _effectiveReminderMethod.
function _setMirrorReminderToInvite(on){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.mirrorReminderToInvite=!!on;
  saveToStorage();
  if(typeof rsvpRerenderList==='function') rsvpRerenderList();
  _inviteChanRefreshMenu();
}
function _setMirrorSavedateToInvite(on){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.mirrorSavedateToInvite=!!on;
  saveToStorage();
  if(typeof rsvpRerenderList==='function') rsvpRerenderList();
  _inviteChanRefreshMenu();
}

function inviteSimpleRowHtml(slot){
  const info=_inviteSlotInfo(slot);
  if(!info) return '';
  const sent=isInvited(info.key);
  const detId='isd-'+info.key.replace(/[^a-z0-9]/gi,'');
  const multi=info.members.length>1;
  const phoneSvg=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);flex-shrink:0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.13.96.38 1.9.72 2.81a2 2 0 0 1-.45 2.11L7.91 10.3a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.59 2.81.72A2 2 0 0 1 22 17.73z"/></svg>`;
  const mailSvg=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);flex-shrink:0"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
  const pinSvg=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);flex-shrink:0;margin-top:2px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  // Build deduped detail lines per field: shared value shown once (no name); differing values get a first-name prefix
  const detailBits=[];
  const fieldRow=(field,svg,alignTop)=>{
    const entries=info.members.map(m=>({name:(m.name||'').split(' ')[0],val:(m[field]||'').trim()})).filter(e=>e.val);
    if(!entries.length) return;
    const uniqueVals=[...new Set(entries.map(e=>e.val))];
    const wrap=inner=>`<div style="display:flex;align-items:${alignTop?'flex-start':'center'};gap:7px">${svg}${inner}</div>`;
    if(uniqueVals.length===1){
      detailBits.push(wrap(uniqueVals[0]));
    } else {
      entries.forEach(e=>detailBits.push(wrap(`${multi?e.name+': ':''}${e.val}`)));
    }
  };
  fieldRow('phone',phoneSvg,false);
  fieldRow('email',mailSvg,false);
  fieldRow('address',pinSvg,true);
  const editBtn=`<button onclick="event.stopPropagation();${_inviteEditOnclick(slot,info)}" title="Edit details" style="background:none;border:none;cursor:pointer;color:var(--muted);opacity:.7;padding:2px;display:flex;align-items:center;flex-shrink:0;margin-left:auto">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  </button>`;
  const detailInner = detailBits.length
    ? `<div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0">${detailBits.join('')}</div>${editBtn}`
    : `<div style="flex:1;font-style:italic;color:var(--muted)">No information</div>${editBtn}`;
  const expanded=_inviteExpanded.has(info.key);
  const avatar = sent
    ? `<div style="width:30px;height:30px;border-radius:50%;background:rgba(92,143,114,.15);color:var(--green);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>`
    : `<div class="guest-avatar" style="width:30px;height:30px;flex-shrink:0">${initials(info.lead.name)}</div>`;
  const action = sent
    ? `<button onclick="event.stopPropagation();toggleInvite('${info.key}')" style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--green);display:inline-flex;align-items:center;gap:4px;flex-shrink:0;white-space:nowrap"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Sent</button>`
    : `<button onclick="event.stopPropagation();toggleInvite('${info.key}')" class="btn btn-outline btn-sm" style="font-size:11px;padding:3px 9px;flex-shrink:0;white-space:nowrap">Mark sent</button>`;
  const chevron=`<button onclick="event.stopPropagation();toggleInviteRowExpand('${info.key}');(function(){const el=document.getElementById('${detId}');const b=document.getElementById('${detId}-b');const open=el.style.display!=='none';el.style.display=open?'none':'flex';b.style.transform=open?'rotate(0)':'rotate(180deg)';})()" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center;flex-shrink:0"><svg id="${detId}-b" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .2s;transform:${expanded?'rotate(180deg)':'rotate(0)'}"><polyline points="6 9 12 15 18 9"/></svg></button>`;
  return `<div class="inv-simple-row" data-slot-key="${info.key}" style="background:var(--surface);border:1px solid var(--border);border-radius:9px;margin-bottom:5px;overflow:hidden;${sent?'opacity:.72':''}">
    <div style="padding:8px 11px;display:flex;align-items:center;gap:9px">
      ${avatar}
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:var(--ink);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${info.name}</div>
        <div style="font-size:10.5px;color:var(--muted)">${info.sub}</div>
        ${_inviteMethodPills(info.key, sent)}
      </div>
      ${action}
      ${chevron}
    </div>
    <div id="${detId}" style="display:${expanded?'flex':'none'};flex-direction:column;border-top:1px solid var(--border);padding:11px;gap:12px;font-size:12px;color:var(--ink)">
      <div style="display:flex;align-items:flex-start;gap:9px">${detailInner}</div>
      ${_inviteChipRow('savedate', info.key)}
      ${_inviteChipRow('invite', info.key)}
      ${_inviteChipRow('reminder', info.key)}
    </div>
  </div>`;
}

function guestCardHtml(g, isLinked=false){
  const rsvpClasses={attending:'badge-green',declined:'badge-red',awaiting:'badge-muted'};
  const isBList=(g.listType||'A')==='B';
  const isSelected=bulkSelected.has(g.id);
  const showDragHandle = reorderMode && !bulkMode && !isLinked;
  return`<div class="guest-card" id="gc-${g.id}" ${bulkMode?`onclick="toggleBulkSelect('${g.id}')" style="cursor:pointer;${isSelected?'background:var(--parchment);outline:2px solid var(--gold);outline-offset:-2px;border-radius:10px':''}"`:''}> 
    ${bulkMode?`<div style="flex-shrink:0;width:18px;height:18px;border-radius:4px;border:2px solid ${isSelected?'var(--gold)':'var(--border)'};background:${isSelected?'var(--gold)':'transparent'};display:flex;align-items:center;justify-content:center;pointer-events:none">
      ${isSelected?'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}
    </div>`:''}
    ${showDragHandle?`<span class="drag-handle" style="opacity:1;display:flex;align-items:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="7" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="17" r="1" fill="currentColor"/><circle cx="15" cy="17" r="1" fill="currentColor"/></svg></span>`:''}
    <div class="guest-avatar">${initials(g.name)}</div>
    <div class="guest-info">
      <div class="guest-name" style="display:flex;align-items:center;gap:6px">
        ${g.name}
        ${_ageBandBadge(g)}
        ${isBList?`<span style="font-size:9.5px;font-weight:700;letter-spacing:.06em;background:var(--muted);color:#fff;padding:1px 6px;border-radius:4px;opacity:.7">B</span>`:''}
        ${_newlyImportedIds.has(g.id)?`<span class="guest-new-badge" style="font-size:9px;font-weight:700;letter-spacing:.08em;background:var(--green);color:#fff;padding:2px 6px;border-radius:5px">NEW</span>`:''}
      </div>
      ${(()=>{
        const showRole=!_hiddenGuestSections.has('gf_role');
        const showPhone=!_hiddenGuestSections.has('gf_phone');
        const rel=g.relationship&&g.relationship!=='Couple'&&g.relationship!=='Plus One'?g.relationship:'';
        const parts=[showRole?rel:'', showPhone?(g.phone||''):''].filter(Boolean);
        return parts.length?`<div class="guest-sub">${parts.join(' · ')}</div>`:'';
      })()}
      ${!_hiddenGuestSections.has('gf_email')&&g.email?`<div class="guest-sub" style="margin-top:1px">${g.email}</div>`:''}
      ${!_hiddenGuestSections.has('gf_handle')&&g.handle?`<div class="guest-sub gt-handle" onclick="event.stopPropagation();_openHandleEditor('${g.id}','renderGuestList')" title="Click to edit handle" style="margin-top:1px;display:inline-flex;align-items:center;gap:5px;cursor:pointer"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gold-deep);flex-shrink:0">${_platformIconSvg(_guestHandlePlatform(g))}</svg>${_escHtml(_bareHandle(g.handle))}</div>`:''}
      ${!_hiddenGuestSections.has('gf_address')&&g.address?`<div class="guest-sub" style="margin-top:1px">${g.address}</div>`:''}
      ${(()=>{
        if(_hiddenGuestSections.has('gf_tags')) return '';
        const roleWord=(g.relationship&&g.relationship!=='Couple'&&g.relationship!=='Plus One')?String(g.relationship).trim().toLowerCase():'';
        const roleShown=!_hiddenGuestSections.has('gf_role') && !!roleWord;
        const tags=(g.tags||[]).filter(t=>!(roleShown && String(t).trim().toLowerCase()===roleWord));
        return tags.length?`<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:3px">${tags.map(t=>_tagChipHtml(t)).join('')}</div>`:'';
      })()}
      ${!_hiddenGuestSections.has('gf_dietary')&&g.dietary&&g.dietary.length?`<div style="margin-top:3px;font-size:12px;color:var(--muted)">${dietIcons(g.dietary)} ${_dietRawHtml(g)}</div>`:''}
    </div>
    <div class="guest-rsvp-wrap" style="position:relative;flex-shrink:0">
      <select class="rsvp-select sel-chevron rsvp-${g.rsvp||'awaiting'}" style="width:110px;font-size:12px;padding:6px 28px 6px 10px;border:1px solid var(--border);border-radius:8px;background-color:${g.rsvp==='attending'?'rgba(92,143,114,.22)':g.rsvp==='declined'?'rgba(180,60,60,.10)':'var(--cream)'};color:var(--ink);font-family:'Inter',sans-serif;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none" onclick="event.stopPropagation()" onchange="event.stopPropagation();setRsvpStatus('${g.id}',this.value)">
        <option value="awaiting" ${g.rsvp==='awaiting'?'selected':''}>Awaiting</option>
        <option value="attending" ${g.rsvp==='attending'?'selected':''}>Attending</option>
        <option value="declined" ${g.rsvp==='declined'?'selected':''}>Declined</option>
      </select>
    </div>
    <div class="dots-menu">
      <button class="dots-btn" onclick="event.stopPropagation();toggleDots(event,'gdots-${g.id}')">···</button>
      <div class="dots-dropdown hidden" id="gdots-${g.id}">
        <button onclick="event.stopPropagation();closeDots();openEditGuest('${g.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
        <button onclick="event.stopPropagation();closeDots();openLinkGuest('${g.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Link Guest</button>
        <button onclick="event.stopPropagation();closeDots();toggleGuestList('${g.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> Move to ${isBList?'Primary':'B List'}</button>
        <button class="danger" onclick="event.stopPropagation();closeDots();deleteGuest('${g.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete</button>
      </div>
    </div>
  </div>`;
}

function toggleGuestList(id){
  const g=STATE.guests.find(x=>x.id===id); if(!g) return;
  g.listType=(g.listType||'A')==='A'?'B':'A';
  // If coupled/linked, move partner too
  if(g.coupleId){ const p=STATE.guests.find(x=>x.id===g.coupleId); if(p) p.listType=g.listType; }
  if(g.plusOneId){ const p=STATE.guests.find(x=>x.id===g.plusOneId); if(p) p.listType=g.listType; }
  saveToStorage(); renderGuestList();
}
function setRsvpStatus(id,val){
  const g=STATE.guests.find(x=>x.id===id);
  if(g){ g.rsvp=val; _stampRsvpDate(g,val); }
  saveToStorage();
  renderGuestList();
  updateRsvpCountDisplay();
}
// Click-to-edit a guest's RSVP date directly in the tracker (native date popover).
// Save an edited RSVP date (from the inline native date input in the tracker).
function _setRsvpDate(id, iso){
  const g=STATE.guests.find(x=>x.id===id); if(!g) return;
  g.rsvpDate=iso||'';
  if(typeof saveToStorage==='function') saveToStorage();
  rsvpRerenderList();
  if(typeof updateRsvpCountDisplay==='function') updateRsvpCountDisplay();
}
// Set (or clear) a per-guest RSVP-by date override.
function _setGuestRsvpBy(id, iso){
  const g=STATE.guests.find(x=>x.id===id); if(!g) return;
  g.rsvpByOverride=iso||'';
  saveToStorage();
  rsvpRerenderList();
}

// Stamp (or clear) the date a guest's RSVP was recorded.
// Set to today when moving to attending/declined; cleared when back to awaiting.
function _stampRsvpDate(g,val){
  if(!g) return;
  if(val==='attending'||val==='declined'){
    if(!g.rsvpDate) g.rsvpDate=_todayIso();
  } else {
    g.rsvpDate='';
  }
}
function _todayIso(){
  const d=new Date();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return d.getFullYear()+'-'+m+'-'+day;
}
// Format an ISO date (YYYY-MM-DD) as "12 Jun" / "12 Jun 2026" if not current year.
function _fmtRsvpDate(iso){
  if(!iso) return '';
  const parts=String(iso).split('-');
  if(parts.length<3) return '';
  const y=+parts[0], mo=+parts[1]-1, da=+parts[2];
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if(mo<0||mo>11) return '';
  const now=new Date();
  return da+' '+months[mo]+(y!==now.getFullYear()?(' '+y):'');
}

function updateRsvpCountDisplay(){
  const primary=STATE.guests.filter(g=>(g.listType||'A')==='A');
  const attending=primary.filter(g=>g.rsvp==='attending').length;
  const declined=primary.filter(g=>g.rsvp==='declined').length;
  const awaiting=primary.filter(g=>g.rsvp==='awaiting').length;
  const map={
    'gc-attending':'<strong>'+attending+'</strong> attending',
    'gc-declined':'<strong>'+declined+'</strong> declined',
    'gc-awaiting':'<strong>'+awaiting+'</strong> awaiting'
  };
  Object.entries(map).forEach(([id,html])=>{
    const el=document.getElementById(id);
    if(el) el.innerHTML=html;
  });
}

let dragGuestId=null;
let dragGroupType=null;
let dragSlotKey=null; // unique key for the dragged slot
let _groupDragDocOver=null; // document-level dragover handler kept alive during a reorder drag

// Build an ordered list of slots from current STATE for reordering
// Each slot: { key, type, leadId, ids[] }
function buildSlots(){
  const slots=[];
  const seen=new Set();

  // Single pass through STATE.guests in order — families appear where their first member appears
  STATE.guests.forEach(g=>{
    if(seen.has(g.id)) return;

    // Check if this guest belongs to a family
    const fam=(STATE.families||[]).find(f=>f.memberIds.includes(g.id));
    if(fam){
      // Only emit the family slot once, on first encounter
      const famKey='fam:'+fam.id;
      if(!slots.find(s=>s.key===famKey)){
        const ids=fam.memberIds.filter(id=>STATE.guests.find(g=>g.id===id));
        ids.forEach(id=>seen.add(id));
        slots.push({key:famKey, type:'family', kind:(fam.kind==='household'?'household':'family'), famId:fam.id, leadId:ids[0]||g.id, ids});
      }
      return;
    }

    // Couple link
    if(g.coupleId){
      const partner=STATE.guests.find(x=>x.id===g.coupleId);
      if(partner&&!seen.has(partner.id)){
        seen.add(g.id); seen.add(partner.id);
        slots.push({key:'couple:'+g.id, type:'couple', leadId:g.id, ids:[g.id,partner.id]});
      } else if(!partner){
        seen.add(g.id);
        slots.push({key:'solo:'+g.id, type:'solo', leadId:g.id, ids:[g.id]});
      }
    // Plus-one link
    } else if(g.plusOneId){
      const plusGuest=STATE.guests.find(x=>x.id===g.plusOneId);
      if(plusGuest&&!seen.has(plusGuest.id)){
        seen.add(g.id); seen.add(plusGuest.id);
        slots.push({key:'plusone:'+g.id, type:'plusone', leadId:g.id, ids:[g.id,plusGuest.id]});
      } else {
        seen.add(g.id);
        slots.push({key:'solo:'+g.id, type:'solo', leadId:g.id, ids:[g.id]});
      }
    // Solo
    } else {
      seen.add(g.id);
      slots.push({key:'solo:'+g.id, type:'solo', leadId:g.id, ids:[g.id]});
    }
  });
  return slots;
}

// Apply new slot order back to STATE.guests
function applySlotsToGuests(slots){
  const newOrder=[];
  slots.forEach(slot=>{
    slot.ids.forEach(id=>{
      const g=STATE.guests.find(x=>x.id===id);
      if(g) newOrder.push(g);
    });
  });
  // Append any guests not in slots (shouldn't happen but safety net)
  STATE.guests.forEach(g=>{ if(!newOrder.find(x=>x.id===g.id)) newOrder.push(g); });
  STATE.guests=newOrder;
}

function groupDragStart(e, slotKey){
  dragSlotKey=slotKey;
  e.dataTransfer.effectAllowed='move';
  e.stopPropagation();
  // Native drag fires dragover only on the element under the cursor. Near the TOP of the
  // list the cursor leaves the rows (onto the fixed topbar / gaps), so groupDragOver stops
  // firing and the up-edge auto-scroll never runs. A document-level dragover keeps the edge
  // detection alive wherever the cursor is, so up-scroll works the same as down-scroll.
  if(!_groupDragDocOver){
    _groupDragDocOver=(ev)=>{ if(dragSlotKey!=null) _dashAutoScroll(ev); };
    document.addEventListener('dragover', _groupDragDocOver, true);
  }
  setTimeout(()=>{
    const el=document.querySelector(`[data-slot-key="${CSS.escape(slotKey)}"]`);
    if(el) el.style.opacity='.35';
  },0);
}
function _groupDragDetachDocOver(){
  if(_groupDragDocOver){ document.removeEventListener('dragover', _groupDragDocOver, true); _groupDragDocOver=null; }
}
function _gtClearDropLines(){
  document.querySelectorAll('[data-gtrow]').forEach(el=>{ el.style.boxShadow=''; });
  document.querySelectorAll('[data-slot-key]').forEach(el=>el.style.outline='');
}
// Track where the drop will land so groupDrop can honour the shown line.
let _groupDropBefore=true; // true = insert before target slot, false = after
function groupDragOver(e, slotKey){
  e.preventDefault(); e.stopPropagation();
  _dashAutoScroll(e); // reuse the dashboard edge auto-scroll while dragging to reorder
  if(slotKey===dragSlotKey){ _gtClearDropLines(); return; }
  _gtClearDropLines();
  // Decide above/below from the cursor position within the hovered slot's row span.
  const rows=document.querySelectorAll(`[data-slot="${CSS.escape(slotKey)}"]`);
  if(!rows.length) return;
  const first=rows[0], last=rows[rows.length-1];
  const top=first.getBoundingClientRect().top;
  const bottom=last.getBoundingClientRect().bottom;
  const before=(e.clientY < (top+bottom)/2);
  _groupDropBefore=before;
  const line='0 0 0 0'; // placeholder; use inset box-shadow as the line
  if(before){ first.style.boxShadow='inset 0 2px 0 0 var(--gold)'; }
  else { last.style.boxShadow='inset 0 -2px 0 0 var(--gold)'; }
}
function groupDragLeave(e, slotKey){
  // Only clear if we've actually left the slot's rows (not just moved between its cells).
  const rows=document.querySelectorAll(`[data-slot="${CSS.escape(slotKey)}"]`);
  let inside=false;
  rows.forEach(r=>{ if(r.contains(e.relatedTarget)) inside=true; });
  if(!inside){ rows.forEach(r=>r.style.boxShadow=''); }
}
function groupDragEnd(){
  _dashStopAutoScroll();
  _groupDragDetachDocOver();
  _gtClearDropLines();
  document.querySelectorAll('[data-slot-key]').forEach(el=>{ el.style.opacity=''; });
  dragSlotKey=null;
}
function groupDrop(e, targetSlotKey){
  e.preventDefault(); e.stopPropagation();
  _dashStopAutoScroll();
  _groupDragDetachDocOver();
  _gtClearDropLines();
  document.querySelectorAll('[data-slot-key]').forEach(el=>{ el.style.opacity=''; });
  if(!dragSlotKey||dragSlotKey===targetSlotKey){ dragSlotKey=null; return; }

  const slots=buildSlots();
  const fi=slots.findIndex(s=>s.key===dragSlotKey);
  let ti=slots.findIndex(s=>s.key===targetSlotKey);
  if(fi<0||ti<0){ dragSlotKey=null; return; }

  const[mv]=slots.splice(fi,1);
  // Recompute target index after removal, then insert before/after per the shown line.
  let ins=slots.findIndex(s=>s.key===targetSlotKey);
  if(ins<0) ins=ti>fi?ti-1:ti;
  const insertAt = _groupDropBefore ? ins : ins+1;
  slots.splice(insertAt,0,mv);

  applySlotsToGuests(slots);
  dragSlotKey=null;
  saveToStorage(); renderGuestList();
}

// ── Guest prefix picker ────────────────────────────────────────────────────
const _GUEST_PREFIXES=['Mr.','Ms.','Mrs.','Miss.','Mx.','Master.','Dr.','Prof.',
  'Atty.','Rev.','Fr.','Hon.','Gen.','Capt.','Lt.','Sgt.','Sir','Dame','Lord','Lady'];

// Render the "+ add prefix" trigger + inline dropdown anchored in the FULL NAME label row.
// idPfx: unique id prefix for this instance (e.g. 'gf' or 'eg' or 'gf1'/'gf2')
// currentVal: existing g.prefix value (for edit mode pre-selection)
function _pfxPickerHtml(idPfx, currentVal){
  const chosen=currentVal||'';
  const opts=_GUEST_PREFIXES.map(p=>`<div class="pfx-opt${chosen===p?' pfx-sel':''}" onmousedown="event.preventDefault();event.stopPropagation();_pfxSel('${idPfx}','${p}')">${p}</div>`).join('');
  const triggerD=chosen?'none':'inline-flex';
  const chosenD=chosen?'inline-flex':'none';
  return `<span id="${idPfx}-pfx-root" style="position:relative;display:inline-flex;align-items:center;flex-shrink:0;vertical-align:middle">
    <button id="${idPfx}-pfx-trigger" onmousedown="event.preventDefault();event.stopPropagation();_pfxOpen('${idPfx}')" style="display:${triggerD};background:none;border:none;cursor:pointer;font-size:11.5px;color:var(--gold-deep);font-family:'Inter',sans-serif;align-items:center;gap:3px;padding:0;white-space:nowrap"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>add prefix</button>
    <span id="${idPfx}-pfx-chosen" style="display:${chosenD};align-items:center;gap:4px;font-size:11.5px;color:var(--gold-deep);background:rgba(139,115,85,.1);border:.5px solid rgba(139,115,85,.3);border-radius:5px;padding:2px 5px 2px 8px;white-space:nowrap">
      <span id="${idPfx}-pfx-lbl">${_escHtml(chosen)}</span>
      <button onmousedown="event.preventDefault();event.stopPropagation();_pfxOpen('${idPfx}')" style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--gold-deep);font-family:'Inter',sans-serif;padding:0 2px;opacity:.7" title="Change">↓</button>
      <button onmousedown="event.preventDefault();event.stopPropagation();_pfxClear('${idPfx}')" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--gold-deep);line-height:1;padding:0 1px;opacity:.7" title="Remove prefix">×</button>
    </span>
    <div id="${idPfx}-pfx-dd" style="display:none;position:absolute;top:calc(100% + 6px);right:0;z-index:1100;background:var(--cream);border:1px solid var(--border);border-radius:9px;box-shadow:0 6px 24px rgba(0,0,0,.18);overflow:hidden;width:140px">
      <div style="max-height:152px;overflow-y:auto">${opts}<div class="pfx-opt" onmousedown="event.preventDefault();event.stopPropagation();_pfxOther('${idPfx}')">Other…</div></div>
      <input id="${idPfx}-pfx-other" placeholder="Type prefix + Enter" onkeydown="event.stopPropagation();_pfxOtherKey(event,'${idPfx}')" onclick="event.stopPropagation()" style="display:none;width:100%;padding:7px 10px;border:none;border-top:.5px solid var(--border);font-family:'Inter',sans-serif;font-size:13px;color:var(--ink);background:var(--cream);outline:none;box-sizing:border-box"/>
    </div>
  </span>`;
}

const _pfxCloseHandlers={};
function _pfxOpen(id){
  const dd=document.getElementById(id+'-pfx-dd'); if(!dd) return;
  document.querySelectorAll('[id$="-pfx-dd"]').forEach(el=>{ if(el!==dd) el.style.display='none'; });
  dd.style.display='block';
  if(_pfxCloseHandlers[id]) document.removeEventListener('click',_pfxCloseHandlers[id],true);
  const close=e=>{
    const root=document.getElementById(id+'-pfx-root');
    if(root&&root.contains(e.target)) return;
    dd.style.display='none';
    const other=document.getElementById(id+'-pfx-other');
    if(other){ other.style.display='none'; other.value=''; }
    document.removeEventListener('mousedown',close,true);
    delete _pfxCloseHandlers[id];
  };
  _pfxCloseHandlers[id]=close;
  setTimeout(()=>document.addEventListener('mousedown',close,true),10);
}
function _pfxSel(id, val){
  const lbl=document.getElementById(id+'-pfx-lbl'); if(lbl) lbl.textContent=val;
  const trigger=document.getElementById(id+'-pfx-trigger'); if(trigger) trigger.style.display='none';
  const chosen=document.getElementById(id+'-pfx-chosen'); if(chosen) chosen.style.display='inline-flex';
  const dd=document.getElementById(id+'-pfx-dd'); if(dd) dd.style.display='none';
  const other=document.getElementById(id+'-pfx-other'); if(other){ other.style.display='none'; other.value=''; }
  document.querySelectorAll('#'+id+'-pfx-dd .pfx-opt').forEach(o=>o.classList.toggle('pfx-sel',o.textContent.trim()===val));
  // Remove the outside-click close handler immediately — selection already done
  if(_pfxCloseHandlers[id]){ document.removeEventListener('mousedown',_pfxCloseHandlers[id],true); delete _pfxCloseHandlers[id]; }
}
function _pfxOther(id){
  const inp=document.getElementById(id+'-pfx-other'); if(!inp) return;
  inp.style.display='block'; inp.focus();
}
function _pfxOtherKey(e,id){
  if(e.key==='Enter'){ e.preventDefault(); const v=e.target.value.trim(); if(v) _pfxSel(id,v); }
}
function _pfxClear(id){
  const lbl=document.getElementById(id+'-pfx-lbl'); if(lbl) lbl.textContent='';
  const trigger=document.getElementById(id+'-pfx-trigger'); if(trigger) trigger.style.display='inline-flex';
  const chosen=document.getElementById(id+'-pfx-chosen'); if(chosen) chosen.style.display='none';
  const dd=document.getElementById(id+'-pfx-dd'); if(dd) dd.style.display='none';
  const other=document.getElementById(id+'-pfx-other'); if(other){ other.style.display='none'; other.value=''; }
  document.querySelectorAll('#'+id+'-pfx-dd .pfx-opt').forEach(o=>o.classList.remove('pfx-sel'));
}
function _pfxGetVal(id){
  const el=document.getElementById(id+'-pfx-lbl'); return el?(el.textContent.trim()):'';
}

// Add pfx-opt and pfx-sel styles if not already in document
(function(){
  if(document.getElementById('_pfx-style')) return;
  const s=document.createElement('style'); s.id='_pfx-style';
  s.textContent='.pfx-opt{padding:7px 12px;font-size:13px;color:var(--ink);cursor:pointer;border-bottom:.5px solid var(--border);transition:background .1s;white-space:nowrap}.pfx-opt:last-child{border-bottom:none}.pfx-opt:hover{background:var(--surface)}.pfx-opt.pfx-sel{background:rgba(139,115,85,.1);color:var(--gold-deep);font-weight:600}';
  document.head.appendChild(s);
})();
// ── End prefix picker ──────────────────────────────────────────────────────

function openAddGuest(type){
  const isCouple=(type==='couple');
  const existingGuests=STATE.guests.filter(g=>!g.coupleId&&!g.plusOneId);
  openModal(isCouple?'Add Couple':'Add Guest',`
  <div style="display:flex;flex-direction:column;gap:12px">
    ${isCouple?`
    <div style="display:flex;gap:14px">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gold-deep)">Partner 1</div>
        <div class="form-group"><label class="form-label" style="display:flex;align-items:center;justify-content:space-between">Name ${_pfxPickerHtml('gf1','')}</label><input class="form-input" id="gf-name1" placeholder="Full name"/></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="gf-phone1" placeholder="Mobile" type="tel" oninput="_couplePhoneEmailSync()"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="gf-email1" placeholder="email@example.com" type="email" oninput="_couplePhoneEmailSync()"/></div>
        <div class="form-group"><label class="form-label">Role</label><input class="form-input" id="gf-rel1" placeholder="e.g. Bride"/></div>
        <div class="form-group gf-more-couple" style="display:none"><label class="form-label">IG / Messenger handle</label><input class="form-input" id="gf-handle1" placeholder="@username"/>${_platRadioHtml('gf-handle1','instagram')}</div>
      </div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gold-deep)">Partner 2</div>
        <div class="form-group"><label class="form-label" style="display:flex;align-items:center;justify-content:space-between">Name ${_pfxPickerHtml('gf2','')}</label><input class="form-input" id="gf-name2" placeholder="Full name"/></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="gf-phone2" placeholder="Mobile" type="tel"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="gf-email2" placeholder="email@example.com" type="email"/></div>
        <div class="form-group"><label class="form-label">Role</label><input class="form-input" id="gf-rel2" placeholder="e.g. Groom"/></div>
        <div class="form-group gf-more-couple" style="display:none"><label class="form-label">IG / Messenger handle</label><input class="form-input" id="gf-handle2" placeholder="@username"/>${_platRadioHtml('gf-handle2','instagram')}</div>
      </div>
    </div>
    <button type="button" class="gf-more-btn" onclick="_gfToggleMoreCouple(this)" aria-expanded="false"><svg class="gf-more-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg><span class="gf-more-lbl">More details</span></button>
    <div style="display:flex;align-items:center;gap:8px">
      <input type="checkbox" id="gf-sameas" onchange="_couplePhoneEmailSync()" style="accent-color:var(--gold);width:16px;height:16px"/>
      <label for="gf-sameas" style="font-size:13px;color:var(--muted);cursor:pointer">Partner 2 phone &amp; email same as Partner 1</label>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;flex-direction:column;gap:10px">
      <div class="eg-eyebrow">Shared details</div>
      <div class="form-group"><label class="form-label">Shared Address</label><input class="form-input" id="gf-addr" placeholder="Street address"/></div>
      <div class="form-group"><label class="form-label">Tags</label><input type="hidden" id="gf-tags" value=""/>${_tagDropdownHtml('gf-tags',[])}</div>
    </div>
    `:`
    <div class="form-row">
      <div class="form-group"><label class="form-label" style="display:flex;align-items:center;justify-content:space-between">Full Name ${_pfxPickerHtml('gf','')}</label><input class="form-input" id="gf-name" placeholder="Full name"/></div>
      <div class="form-group"><label class="form-label">Role / Relationship</label><input class="form-input" id="gf-rel-free" placeholder="e.g. Maid of Honour"/></div>
    </div>
    <div class="eg-inline-row">
      <label class="form-label">Age band</label>
      ${_ageBandSegHtml('gf-ageband', 'adult')}
    </div>

    <div class="form-row">
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="gf-phone" placeholder="Mobile" type="tel"/></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="gf-email" placeholder="email@example.com" type="email"/></div>
    </div>
    <div class="form-group"><label class="form-label">Address</label><input class="form-input" id="gf-addr" placeholder="Street address"/></div>

    <div style="margin-top:6px">
      ${_egSection('gfmore','More details','',`
        <div class="form-group"><label class="form-label">IG / Messenger handle</label><input class="form-input" id="gf-handle" placeholder="@username"/>${_platRadioHtml('gf-handle','instagram')}</div>
        <div class="form-group" style="margin-top:12px"><label class="form-label">Tags</label><input type="hidden" id="gf-tags" value=""/>${_tagDropdownHtml('gf-tags',[])}</div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">Link to Existing Guest</label>
          <input type="hidden" id="gf-link" value=""/>
          <div style="position:relative">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="gf-link-search" class="form-input" placeholder="Search for a guest…" autocomplete="off" style="padding-left:30px" oninput="_gfLinkSearch(this.value)" onfocus="_gfLinkSearch(this.value)" onkeydown="if(event.key==='Escape'){document.getElementById('gf-link-results').style.display='none'}"/><button type="button" onclick="_gfLinkSelect('','');const _gfi=document.getElementById('gf-link-search');if(_gfi){_gfi.value='';_gfi.focus()}" title="Clear" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);padding:0;line-height:0;display:flex;align-items:center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div id="gf-link-results" style="border:1px solid var(--border);border-radius:8px;overflow:hidden;max-height:200px;overflow-y:auto;margin-top:4px;display:none"></div>
        </div>
        <div id="rel-type-row" class="hidden" style="margin-top:12px">
          <div class="form-group"><label class="form-label">Relationship Type</label>
            <select class="form-input" id="gf-rel">
              <option value="Couple">Couple</option><option value="Plus One">Plus One</option>
              <option value="Friend">Friend</option>
              <option value="Family">Family</option><option value="Colleague">Colleague</option>
            </select>
          </div>
        </div>
        <div id="plus-one-row" style="display:flex;align-items:center;gap:8px;margin-top:12px">
          <input type="checkbox" id="gf-plusone" style="accent-color:var(--gold);width:16px;height:16px"/>
          <label for="gf-plusone" style="font-size:13px;color:var(--muted);cursor:pointer">Guest may bring a Plus One</label>
        </div>`)}
    </div>
    `}
    <div style="margin-top:6px">
      ${_egSection('gfrsvpby','RSVP by date', '', `
        <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">Set a specific RSVP deadline for this guest, overriding the global date.</div>
        <input type="date" class="form-input" id="gf-rsvpby" value="" style="max-width:200px"/>
        ${(STATE.settings&&STATE.settings.rsvpBy)?`<div style="font-size:11px;color:var(--muted);margin-top:5px">Global date: ${_fmtRsvpDate((STATE.settings||{}).rsvpBy)} — leave blank to use this.</div>`:'<div style="font-size:11px;color:var(--muted);margin-top:5px">No global RSVP date set. You can set one in Settings → Templates.</div>'}
      `)}
    </div>
    <div style="display:flex;align-items:center;gap:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;width:fit-content">
      <button type="button" id="list-a-btn" onclick="setGuestList('A')"
        style="padding:6px 18px;font-size:12.5px;font-weight:600;border:none;background:var(--gold);color:#fff;cursor:pointer;transition:background .15s">Primary</button>
      <button type="button" id="list-b-btn" onclick="setGuestList('B')"
        style="padding:6px 18px;font-size:12.5px;font-weight:500;border:none;background:transparent;color:var(--muted);cursor:pointer;transition:background .15s">B List</button>
    </div>
    <input type="hidden" id="gf-listtype" value="A"/>
  </div>`,
  `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
   <button class="btn btn-primary" onclick="saveGuest('${type}')">${isCouple?'Add Couple':'Add Guest'}</button>`);
}

// Add Couple: mirror Partner 1's phone & email onto Partner 2 when the box is ticked.
// Also called live (oninput) so edits to P1 propagate while the box stays checked.
function _couplePhoneEmailSync(){
  const on=document.getElementById('gf-sameas')?.checked;
  const p1p=document.getElementById('gf-phone1'), p1e=document.getElementById('gf-email1');
  const p2p=document.getElementById('gf-phone2'), p2e=document.getElementById('gf-email2');
  if(!p2p||!p2e) return;
  if(on){
    p2p.value=p1p?p1p.value:''; p2e.value=p1e?p1e.value:'';
    p2p.disabled=true; p2e.disabled=true; p2p.style.opacity='.55'; p2e.style.opacity='.55';
  } else {
    p2p.disabled=false; p2e.disabled=false; p2p.style.opacity=''; p2e.style.opacity='';
  }
}
function setGuestList(val){
  document.getElementById('gf-listtype').value=val;
  const aBtn=document.getElementById('list-a-btn');
  const bBtn=document.getElementById('list-b-btn');
  if(aBtn) aBtn.style.cssText=`padding:6px 18px;font-size:12.5px;font-weight:${val==='A'?'600':'500'};border:none;background:${val==='A'?'var(--gold)':'transparent'};color:${val==='A'?'#fff':'var(--muted)'};cursor:pointer;transition:background .15s`;
  if(bBtn) bBtn.style.cssText=`padding:6px 18px;font-size:12.5px;font-weight:${val==='B'?'600':'500'};border:none;background:${val==='B'?'var(--muted)':'transparent'};color:${val==='B'?'#fff':'var(--muted)'};cursor:pointer;transition:background .15s`;
}
function _egOthShow(on){ const w=document.getElementById('eg-oth-wrap'); if(w) w.style.display=on?'block':'none'; }
function _egAlShow(on){ const w=document.getElementById('eg-al-wrap'); if(w) w.style.display=on?'block':'none'; }
function _egAlChip(b){ const on=!b.classList.contains('on'); b.classList.toggle('on',on); b.textContent=(on?'✓ ':'+ ')+_allergenLabel(b.dataset.k); }
function toggleDietModal(btn){
  btn.classList.toggle('open');
  document.getElementById('diet-modal-section').classList.toggle('hidden');
}
function onLinkChange(){
  const v=document.getElementById('gf-link')?.value;
  document.getElementById('rel-type-row')?.classList.toggle('hidden',!v);
  document.getElementById('plus-one-row')?.classList.toggle('hidden',!!v);
}

// Add Guest form: reveal/hide the "more details" block (IG / Messenger).
function _gfToggleMore(btn, wrapId){
  const wrap=document.getElementById(wrapId); if(!wrap) return;
  const open=wrap.style.display==='none';
  wrap.style.display=open?'':'none';
  _gfSetMoreBtn(btn, open);
}
// Add Couple form: one toggle reveals both partners' handle fields at once.
function _gfToggleMoreCouple(btn){
  const groups=[...document.querySelectorAll('.gf-more-couple')];
  const open=groups.length && groups[0].style.display==='none';
  groups.forEach(g=>{ g.style.display=open?'':'none'; });
  _gfSetMoreBtn(btn, open);
}
function _gfSetMoreBtn(btn, open){
  if(!btn) return;
  btn.setAttribute('aria-expanded', open?'true':'false');
  const caret=btn.querySelector('.gf-more-caret'); if(caret) caret.style.transform=open?'rotate(180deg)':'';
  const lbl=btn.querySelector('.gf-more-lbl'); if(lbl) lbl.textContent=open?'Less':'More details';
}

function saveGuest(type){
  if(_sbSession && typeof _uvGuestLimitReached==='function' && _uvGuestLimitReached()){ _uvRequirePaid('unlimitedGuests'); return; }
  const tags=(document.getElementById('gf-tags')?.value||'').split(',').map(t=>t.trim()).filter(Boolean);
  const addr=document.getElementById('gf-addr')?.value.trim()||'';
  const listType=document.getElementById('gf-listtype')?.value||'A';
  const handle=document.getElementById('gf-handle')?.value.trim()||'';
  const rsvpByOverride=document.getElementById('gf-rsvpby')?.value||'';

  if(type==='couple'){
    const n1=document.getElementById('gf-name1')?.value.trim();
    const n2=document.getElementById('gf-name2')?.value.trim();
    if(!n1||!n2){alert('Please enter both names.');return;}
    const ph1=document.getElementById('gf-phone1')?.value.trim()||'';
    const em1=document.getElementById('gf-email1')?.value.trim()||'';
    const rl1=document.getElementById('gf-rel1')?.value.trim()||'';
    const hn1=document.getElementById('gf-handle1')?.value.trim()||'';
    const sameAs=document.getElementById('gf-sameas')?.checked;
    const ph2=sameAs?ph1:(document.getElementById('gf-phone2')?.value.trim()||'');
    const em2=sameAs?em1:(document.getElementById('gf-email2')?.value.trim()||'');
    const rl2=document.getElementById('gf-rel2')?.value.trim()||'';
    const hn2=document.getElementById('gf-handle2')?.value.trim()||'';
    const pfx1=_pfxGetVal('gf1'); const pfx2=_pfxGetVal('gf2');
    const g1={id:uid(),name:n1,prefix:pfx1,rsvp:'awaiting',dietary:[],tags:tags.slice(),phone:ph1,email:em1,address:addr,handle:hn1,handlePlatform:_formPlat('gf-handle1'),coupleId:null,plusOneId:null,plusOne:false,relationship:rl1||'Couple',isMain:true,listType,...(rsvpByOverride?{rsvpByOverride}:{})};
    const g2={id:uid(),name:n2,prefix:pfx2,rsvp:'awaiting',dietary:[],tags:tags.slice(),phone:ph2,email:em2,address:addr,handle:hn2,handlePlatform:_formPlat('gf-handle2'),coupleId:null,plusOneId:null,plusOne:false,relationship:rl2||'Couple',isMain:false,listType,...(rsvpByOverride?{rsvpByOverride}:{})};
    g1.coupleId=g2.id; g2.coupleId=g1.id;
    STATE.guests.push(g1,g2);
  } else {
    const name=document.getElementById('gf-name')?.value.trim();
    if(!name){alert('Please enter a name.');return;}
    const phone=document.getElementById('gf-phone')?.value.trim()||'';
    const email=document.getElementById('gf-email')?.value.trim()||'';
    const relFree=document.getElementById('gf-rel-free')?.value.trim()||'';
    const link=document.getElementById('gf-link')?.value||'';
    const rel=document.getElementById('gf-rel')?.value||'';
    const plusOneAllowed=document.getElementById('gf-plusone')?.checked||false;
    const pfx=_pfxGetVal('gf');
    const finalRel=link?rel:(relFree||rel);
    const g={id:uid(),name,prefix:pfx,rsvp:'awaiting',dietary:[],tags,phone,email,address:addr,handle,handlePlatform:_formPlat('gf-handle'),coupleId:null,plusOneId:null,plusOne:plusOneAllowed,relationship:finalRel,isMain:true,listType,...(rsvpByOverride?{rsvpByOverride}:{})};
    { const _ab=document.getElementById('gf-ageband'); if(_ab) _setGuestAgeBand(g, _ab.value); }
    if(link){
      const linked=STATE.guests.find(x=>x.id===link);
      if(linked){
        if(rel==='Plus One'){ g.coupleId=linked.id; linked.plusOneId=g.id; }
        else { g.coupleId=linked.id; linked.coupleId=g.id; }
      }
    }
    STATE.guests.push(g);
  }
  closeModalDirect();
  navigate('guests');
}

let _egKA=[], _egKASelfId='';
function _egGuestName(gid){ const x=STATE.guests.find(g=>g.id===gid); return x?(x.name||'Guest'):'Guest'; }
function _egKAChipsHtml(){
  if(!_egKA.length) return '';
  return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">`+_egKA.map(id=>`<span style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;background:var(--chip,var(--surface));border:1px solid var(--border);border-radius:999px;padding:5px 6px 5px 11px">${_escHtml(_egGuestName(id))} <span onclick="_egKARemove('${id}')" title="Remove" style="width:16px;height:16px;border-radius:50%;background:var(--surface);color:var(--muted);display:inline-flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer">×</span></span>`).join('')+`</div>`;
}
function _egKAListHtml(query){
  const q=(query||'').toLowerCase().trim();
  if(!q) return ''; // hide list until user types
  const items=STATE.guests
    .filter(x=>x.id!==_egKASelfId && !_egKA.includes(x.id))
    .filter(x=>(x.name||'').toLowerCase().includes(q))
    .sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  if(!items.length) return `<div style="font-size:12.5px;color:var(--muted);padding:10px 12px">No matches.</div>`;
  return items.map((x,i)=>`<div onclick="_egKAAdd('${x.id}')" style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;${i<items.length-1?'border-bottom:1px solid var(--border);':''}cursor:pointer">
    <span style="font-size:13.5px;color:var(--ink)">${_escHtml(x.name||'Guest')}</span>
    <span style="color:var(--gold-deep);font-size:16px;font-weight:600;line-height:1">+</span>
  </div>`).join('');
}
function _egKARenderChips(){ const el=document.getElementById('eg-ka-chips'); if(el){ el.innerHTML=_egKAChipsHtml(); el.style.display=_egKA.length?'block':'none'; } }
function _egKARenderList(query){
  const el=document.getElementById('eg-ka-list');
  if(el) el.innerHTML=_egKAListHtml(query);
  const wrap=document.getElementById('eg-ka-list-wrap');
  if(wrap){ const q=(query||'').trim(); wrap.style.display=(q&&el&&el.innerHTML)?'block':'none'; }
}
function _egKAAdd(id){ if(!_egKA.includes(id)) _egKA.push(id); _egKARenderChips(); const s=document.getElementById('eg-ka-search'); _egKARenderList(s?s.value:''); if(s) s.focus(); }
function _egKARemove(id){ _egKA=_egKA.filter(x=>x!==id); _egKARenderChips(); const s=document.getElementById('eg-ka-search'); _egKARenderList(s?s.value:''); }
// ── Add Guest linked partner search (gf- prefix = guest form) ──
function _gfLinkSearch(query){
  const q=(query||'').toLowerCase().trim();
  const wrap=document.getElementById('gf-link-results');
  if(!wrap) return;
  if(!q){ wrap.style.display='none'; wrap.innerHTML=''; return; }
  const existing=STATE.guests.filter(x=>!x.coupleId&&!x.plusOneId);
  const items=existing.filter(x=>(x.name||'').toLowerCase().includes(q)).slice(0,8);
  if(!items.length){ wrap.innerHTML=`<div style="font-size:12.5px;color:var(--muted);padding:10px 12px">No matches.</div>`; wrap.style.display='block'; return; }
  const curId=document.getElementById('gf-link')?.value||'';
  wrap.innerHTML=items.map((x,i)=>{
    const active=x.id===curId;
    return `<div onclick="_gfLinkSelect('${x.id}','${_escSQ(x.name)}')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;${i<items.length-1?'border-bottom:.5px solid var(--border);':''}cursor:pointer;${active?'background:var(--surface)':''}">
      <span style="font-size:13px;color:var(--ink);flex:1">${_escHtml(x.name||'Guest')}</span>
      ${active?'<span style="font-size:11px;color:var(--gold-deep);font-weight:600">✓ linked</span>':''}
    </div>`;
  }).join('');
  wrap.style.display='block';
}
function _gfLinkSelect(id,name){
  const inp=document.getElementById('gf-link');
  const search=document.getElementById('gf-link-search');
  const wrap=document.getElementById('gf-link-results');
  const cur=inp?inp.value:'';
  const newId=(cur===id)?'':id; // tap again to deselect
  if(inp) inp.value=newId;
  if(search) search.value=newId?name:'';
  if(wrap){ wrap.style.display='none'; wrap.innerHTML=''; }
  // Show/hide relationship type row
  if(typeof onLinkChange==='function') onLinkChange();
}

// ── Linked partner search ──
let _egLinkId=''; // currently selected partner id
function _egLinkInit(currentId){ _egLinkId=currentId||''; }
function _egLinkSearch(query){
  const q=(query||'').toLowerCase().trim();
  const selfId=_egKASelfId;
  const wrap=document.getElementById('eg-link-results');
  if(!wrap) return;
  if(!q){ wrap.style.display='none'; wrap.innerHTML=''; return; }
  // Include current partner even if already linked so user can re-select/clear
  // Exclude children and infants — they cannot be linked as a partner
  const items=STATE.guests
    .filter(x=>x.id!==selfId)
    .filter(x=>x.ageBand!=='child'&&x.ageBand!=='infant')
    .filter(x=>!q||(x.name||'').toLowerCase().includes(q))
    .slice(0,8);
  if(!items.length){ wrap.innerHTML=`<div style="font-size:12.5px;color:var(--muted);padding:10px 12px">No matches.</div>`; wrap.style.display='block'; return; }
  wrap.innerHTML=items.map((x,i)=>{
    const active=x.id===_egLinkId;
    return `<div onclick="_egLinkSelect('${x.id}','${_escSQ(x.name)}')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;${i<items.length-1?'border-bottom:.5px solid var(--border);':''}cursor:pointer;${active?'background:var(--surface)':''}">
      <span style="font-size:13px;color:var(--ink);flex:1">${_escHtml(x.name||'Guest')}</span>
      ${active?'<span style="font-size:11px;color:var(--gold-deep);font-weight:600">✓ linked</span>':''}
    </div>`;
  }).join('');
  wrap.style.display='block';
}
function _egLinkSelect(id,name){
  _egLinkId=(_egLinkId===id)?''  :id; // tap again to deselect
  document.getElementById('eg-link').value=_egLinkId;
  const inp=document.getElementById('eg-link-search');
  if(inp) inp.value=_egLinkId?name:'';
  const wrap=document.getElementById('eg-link-results');
  if(wrap){ wrap.style.display='none'; wrap.innerHTML=''; }
  // Update the sub-label
  const lbl=document.getElementById('eg-link-lbl');
  if(lbl) lbl.textContent=_egLinkId?`Linked with ${name}. Tap the field and search to change, or clear to unlink.`:'';
}
function _egLinkClear(){
  _egLinkId='';
  document.getElementById('eg-link').value='';
  const inp=document.getElementById('eg-link-search');
  if(inp){ inp.value=''; inp.focus(); }
  const lbl=document.getElementById('eg-link-lbl');
  if(lbl) lbl.textContent='';
}

// Reveal the collapsed Keep-apart search/list and focus the search input.
function _egKAExpand(){
  const p=document.getElementById('eg-ka-prompt'); if(p) p.style.display='none';
  const b=document.getElementById('eg-ka-body'); if(b) b.style.display='';
  const m=document.getElementById('eg-ka-min'); if(m) m.style.display='inline-flex';
  const s=document.getElementById('eg-ka-search'); if(s) s.focus();
}
// Minimise the Keep-apart section back to the prompt. Chips (if any) stay visible;
// the prompt label adapts to "Add another" when some are already selected.
function _egKACollapse(){
  const b=document.getElementById('eg-ka-body'); if(b) b.style.display='none';
  const m=document.getElementById('eg-ka-min'); if(m) m.style.display='none';
  const p=document.getElementById('eg-ka-prompt'); if(p) p.style.display='block';
  const has=_egKA.length>0;
  const lbl=document.getElementById('eg-ka-prompt-label'); if(lbl) lbl.textContent=has?'Add another':'Add a guest to keep apart from';
}
// Guest-list pencil dispatcher for couples/families: present a member picker so
// any member's edit form can be opened, not just the group's lead. Solo guests
// never reach here (they call openEditGuest directly from the pencil).
function _gtEditGuestSlot(ids){
  const members=(ids||[]).map(id=>STATE.guests.find(g=>g.id===id)).filter(Boolean);
  if(members.length===0) return;
  if(members.length===1){ openEditGuest(members[0].id); return; }
  const _roleFor=(g,i)=>{
    const rel=(g.relationship&&g.relationship!=='Couple'&&g.relationship!=='Guest'&&g.relationship!=='Plus One')?g.relationship:'';
    if(rel) return rel;
    if(i===0) return 'Lead guest';
    return g.plusOneId ? '+1' : 'Member';
  };
  const _initials=(name)=>{
    const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
    if(parts.length===0) return '?';
    if(parts.length===1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
  };
  const groupLabel=members.map(m=>m.name).join(' & ');
  const rows=members.map((g,i)=>`
    <button type="button" class="gt-mp-row" onclick="closeModalDirect();openEditGuest('${g.id}')">
      <span class="gt-mp-av">${_escHtml(_initials(g.name))}</span>
      <span class="gt-mp-txt">
        <span class="gt-mp-name">${_escHtml(g.name)}</span>
        <span class="gt-mp-role">${_escHtml(_roleFor(g,i))}</span>
      </span>
      <svg class="gt-mp-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`).join('');
  const idSet=new Set(ids||[]);
  const fam=(STATE.families||[]).find(f=>f.memberIds.some(id=>idSet.has(id)));
  const editGroupBtn=fam
    ?`<button class="btn btn-outline btn-sm" style="margin-right:auto" onclick="closeModalDirect();openEditFamily('${fam.id}')">Edit group…</button>`
    :'';
  const body=`<div style="font-size:12.5px;color:var(--muted);margin:-2px 0 12px">${_escHtml(groupLabel)} — choose a member to edit.</div>
    <div class="gt-mp-list">${rows}</div>`;
  const footer=`${editGroupBtn}<button class="btn" onclick="closeModalDirect()">Cancel</button>`;
  openModal('Edit which guest?', body, footer);
}
// Collapsible section for the redesigned guest forms. `summaryHtml` shows inline
// when collapsed (e.g. a preview of filled data); empty = just the title. Sections
// start collapsed; tapping the header toggles. IDs are namespaced by `key`.
function _egSection(key, title, summaryHtml, bodyHtml){
  const caret=`<svg class="eg-sec-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
  const sum=summaryHtml?`<span class="eg-sec-summary">${summaryHtml}</span>`:'';
  return `<div class="eg-sec" id="egsec-${key}">
    <button type="button" class="eg-sec-head" onclick="_egToggleSection('${key}')" aria-expanded="false">
      ${caret}<span class="eg-sec-title">${title}</span>${sum}
    </button>
    <div class="eg-sec-body">${bodyHtml}</div>
  </div>`;
}
function _egToggleSection(key){
  const sec=document.getElementById('egsec-'+key);
  if(!sec) return;
  const open=sec.classList.toggle('open');
  const btn=sec.querySelector('.eg-sec-head');
  if(btn) btn.setAttribute('aria-expanded', open?'true':'false');
}
function openEditGuest(id){
  const g=STATE.guests.find(x=>x.id===id);
  if(!g)return;
  _egPlusOneOpen=false; // reset the Plus One reveal each time the dialog opens
  _editGuestReturnPage=_currentPage||'guests'; // remember where we came from
  _egKASelfId=id; _egKA=Array.isArray(g.keepApart)?g.keepApart.slice():[];
  _egLinkInit(g.coupleId||null);
  const linkable=STATE.guests.filter(x=>x.id!==id&&!x.coupleId&&!x.plusOneId);
  const currentPartner=g.coupleId?STATE.guests.find(x=>x.id===g.coupleId):null;
  const linkOpts=`<option value="">— Not linked —</option>
    ${currentPartner?`<option value="${currentPartner.id}" selected>${currentPartner.name} (current)</option>`:''}
    ${linkable.filter(x=>!currentPartner||x.id!==currentPartner.id).map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}`;
  // Inline summaries for collapsed sections (shown only when there's data).
  const _handleSum=(g.handle||'').trim()?_escHtml(_bareHandle(g.handle)):'';
  const _tagsArr=(g.tags||[]);
  const _linkSum=currentPartner?`linked: ${_escHtml(currentPartner.name)}`:'';
  const _moreBits=[_handleSum, _tagsArr.length?`${_tagsArr.length} tag${_tagsArr.length!==1?'s':''}`:'', _linkSum].filter(Boolean);
  const _dietSummary=_escHtml(_dietText(g));
  const _kaSummary=_egKA.length?`${_egKA.length} guest${_egKA.length!==1?'s':''}`:'';
  const _ageBandSum=_guestAgeBand(g)!=='adult'?_ageBandLabel(_guestAgeBand(g)):'';
  if(_ageBandSum) _moreBits.unshift(_ageBandSum);
  const _moreSummary=_moreBits.join(' · ');
  const _moreBody=`
    <div class="eg-inline-row" style="margin-bottom:12px">
      <label class="form-label">Age band</label>
      ${_ageBandSegHtml('eg-ageband', _guestAgeBand(g))}
    </div>
    <div class="form-group"><label class="form-label">IG / Messenger handle</label><input class="form-input" id="eg-handle" value="${(g.handle||'').replace(/"/g,'&quot;')}" placeholder="@username"/>${_platRadioHtml('eg-handle', _guestHandlePlatform(g))}</div>
    <div class="form-group" style="margin-top:12px"><label class="form-label">Tags</label><input type="hidden" id="eg-tags" value="${(g.tags||[]).join(', ')}"/>${_tagDropdownHtml('eg-tags', g.tags||[])}</div>
    ${(()=>{const _ab=_guestAgeBand(g);if(_ab==='child'||_ab==='infant') return '';return `<div class="form-group" style="margin-top:12px">
      <label class="form-label">Linked Partner</label>
      <input type="hidden" id="eg-link" value="${currentPartner?currentPartner.id:''}"/>
      <div style="position:relative">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="eg-link-search" class="form-input" placeholder="Search for a guest…" autocomplete="off" value="${currentPartner?_escHtml(currentPartner.name):''}" style="padding-left:30px" oninput="_egLinkSearch(this.value)" onfocus="_egLinkSearch(this.value)" onkeydown="if(event.key==='Escape'){document.getElementById('eg-link-results').style.display='none'}"/><button type="button" onclick="_egLinkClear()" title="Clear" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);padding:0;line-height:0;display:flex;align-items:center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div id="eg-link-results" style="border:1px solid var(--border);border-radius:8px;overflow:hidden;max-height:200px;overflow-y:auto;margin-top:4px;display:none"></div>
      <div id="eg-link-lbl" style="font-size:11.5px;color:var(--muted);margin-top:4px">${currentPartner?`Linked with ${_escHtml(currentPartner.name)}. Search to change, or clear the field to unlink.`:''}</div>
    </div>`;})()}`;
  const _alOn=_hasAllergy(g);
  const _alSel=new Set(Array.isArray(g.allergens)?g.allergens:[]);
  const _dietBody=`<div style="display:flex;flex-wrap:wrap;gap:12px">
      ${DIET_KEYS.map(d=>`<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer"><input type="checkbox" class="diet-cb" value="${d}"${d==='allergy'?' onchange="_egAlShow(this.checked)"':d==='other'?' onchange="_egOthShow(this.checked)"':''} ${(g.dietary||[]).includes(d)?'checked':''} style="accent-color:var(--gold)"/>${d.charAt(0).toUpperCase()+d.slice(1)}</label>`).join('')}
    </div>
    <div class="al-wrap" id="eg-al-wrap" style="display:${_alOn?'block':'none'}">
      <span class="al-lbl">Allergic to</span>
      <div class="al-chips">${ALLERGENS.map(([k,l])=>`<button type="button" class="al-chip${_alSel.has(k)?' on':''}" data-k="${k}" onclick="_egAlChip(this)">${_alSel.has(k)?'✓':'+'} ${l}</button>`).join('')}</div>
      <input class="form-input" id="eg-al-note" value="${_escHtml(g.allergyNote||'')}" placeholder="Anything else? e.g. kiwi fruit"/>
      <div class="al-hint">Common allergens are counted on the RSVP summary; anything typed shows as written.</div>
    </div>
    <div class="al-wrap" id="eg-oth-wrap" style="display:${(g.dietary||[]).includes('other')?'block':'none'}">
      <label class="al-lbl" for="eg-oth-note">Other — please specify</label>
      <input class="form-input" id="eg-oth-note" value="${_escHtml(g.dietOther||'')}" placeholder="e.g. halal, no pork, pescatarian"/>
    </div>`;
  const _kaBody=`
      <div style="font-size:11.5px;color:var(--muted);margin:-2px 0 8px">Won't be seated together or beside each other.</div>
      <div id="eg-ka-chips" style="display:${_egKA.length?'block':'none'};margin-bottom:8px">${_egKAChipsHtml()}</div>
      <div style="position:relative">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="eg-ka-search" class="form-input" placeholder="Add a guest…" autocomplete="off" style="padding-left:30px;padding-right:28px" oninput="_egKARenderList(this.value)" onkeydown="if(event.key==='Escape'){this.value='';_egKARenderList('')}"/><button type="button" onclick="document.getElementById('eg-ka-search').value='';_egKARenderList('')" title="Clear" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);padding:0;line-height:0;display:flex;align-items:center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div id="eg-ka-list-wrap" style="border:1px solid var(--border);border-radius:8px;overflow:hidden;max-height:170px;overflow-y:auto;margin-top:6px;display:none"><div id="eg-ka-list"></div></div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">Search &amp; tap + to add; × to remove. Flags apply both ways.</div>`;

  openModal('Edit Guest',`
  <div style="display:flex;flex-direction:column;gap:10px">
    <div class="form-row">
      <div class="form-group"><label class="form-label" style="display:flex;align-items:center;justify-content:space-between">Full Name ${_pfxPickerHtml('eg',g.prefix||'')}</label><input class="form-input" id="eg-name" value="${g.name}"/></div>
      <div class="form-group"><label class="form-label">Role / Relationship</label><input class="form-input" id="eg-rel" value="${(g.relationship&&g.relationship!=='Couple'&&g.relationship!=='Guest'&&g.relationship!=='Plus One')?g.relationship:''}" placeholder="e.g. Maid of Honour"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="eg-phone" value="${g.phone||''}"/></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" id="eg-email" value="${g.email||''}" placeholder="email@example.com"/></div>
    </div>
    <div class="form-group"><label class="form-label">Address</label><input class="form-input" id="eg-addr" value="${g.address||''}"/></div>

    ${(()=>{ const _ab=_guestAgeBand(g); if(_ab==='child'||_ab==='infant') return ''; const _b=_egPlusOneBlockHtml(g); return _b?`<div style="border-top:1px solid var(--border);padding-top:11px;margin-top:2px"><div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:8px">Plus One</div>${_b}</div>`:''; })()}

    <div style="margin-top:6px">
      ${_egSection('more','More details', _moreSummary, _moreBody)}
      ${_egSection('diet','Dietary requirements', _dietSummary, _dietBody)}
      ${_egSection('ka','Keep apart from', _kaSummary, _kaBody)}
      ${_egSection('rsvpby','RSVP by date', g.rsvpByOverride?_fmtRsvpDate(g.rsvpByOverride):'', `
        <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">Set a specific RSVP deadline for this guest, overriding the global date.</div>
        <input type="date" class="form-input" id="eg-rsvpby" value="${g.rsvpByOverride||''}" style="max-width:200px"/>
        ${(STATE.settings&&STATE.settings.rsvpBy)?`<div style="font-size:11px;color:var(--muted);margin-top:5px">Global date: ${_fmtRsvpDate((STATE.settings||{}).rsvpBy)} — leave blank to use this.</div>`:'<div style="font-size:11px;color:var(--muted);margin-top:5px">No global RSVP date set. You can set one in Settings → Templates.</div>'}
      `)}
    </div>
  </div>`,
  `<div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:10px">
     <button class="btn btn-danger-ghost" onclick="deleteGuest('${id}')" style="display:inline-flex;align-items:center;gap:6px">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Delete guest
     </button>
     <div style="display:flex;gap:8px">
       <button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
       <button class="btn btn-primary" onclick="saveEditGuest('${id}')">Save</button>
     </div>
   </div>`);
}
function saveEditGuest(id, quiet){
  const g=STATE.guests.find(x=>x.id===id);
  if(!g)return;
  g.name=document.getElementById('eg-name').value.trim()||g.name;
  g.prefix=_pfxGetVal('eg');
  const newRel=(document.getElementById('eg-rel')?.value||'').trim();
  if(newRel) g.relationship=newRel;
  g.phone=document.getElementById('eg-phone').value.trim();
  g.email=document.getElementById('eg-email').value.trim();
  g.address=document.getElementById('eg-addr').value.trim();
  { const _h=document.getElementById('eg-handle'); if(_h) g.handle=_h.value.trim(); g.handlePlatform=_formPlat('eg-handle'); }
  g.tags=(document.getElementById('eg-tags').value||'').split(',').map(t=>t.trim()).filter(Boolean);
  { const el=document.getElementById('eg-rsvpby'); if(el) g.rsvpByOverride=el.value||''; }
  g.dietary=[...document.querySelectorAll('.diet-cb:checked')].map(c=>c.value);
  { const _w=document.getElementById('eg-al-wrap');
    if(_w){ const _n=document.getElementById('eg-al-note');
            // A common allergen typed into "Anything else" folds into its chip, so it is counted once.
            const _pr=_parseAllergyText(_n?_n.value:(g.allergyNote||''));
            g.allergens=[...new Set([..._w.querySelectorAll('.al-chip.on')].map(b=>b.dataset.k).concat(_pr.allergens))];
            g.allergyNote=_pr.note; } }
  { const _o=document.getElementById('eg-oth-note'); if(_o) g.dietOther=_o.value.trim(); }
  { const _ab=document.getElementById('eg-ageband'); if(_ab) _setGuestAgeBand(g, _ab.value); }

  // Keep-apart flags (mutual): update this guest and reciprocate on the others.
  const newKA=Array.isArray(_egKA)?_egKA.slice():[];
  const oldKA=Array.isArray(g.keepApart)?g.keepApart.slice():[];
  g.keepApart=newKA;
  // Add reciprocal links for newly-added; remove reciprocal for removed.
  newKA.forEach(oid=>{ const o=STATE.guests.find(x=>x.id===oid); if(o){ if(!Array.isArray(o.keepApart)) o.keepApart=[]; if(!o.keepApart.includes(g.id)) o.keepApart.push(g.id); } });
  oldKA.filter(oid=>!newKA.includes(oid)).forEach(oid=>{ const o=STATE.guests.find(x=>x.id===oid); if(o&&Array.isArray(o.keepApart)){ o.keepApart=o.keepApart.filter(x=>x!==g.id); } });

  // Handle partner link changes
  const newLinkId=document.getElementById('eg-link')?.value||'';
  if(g.coupleId && g.coupleId!==newLinkId){
    // Unlink old partner
    const oldPartner=STATE.guests.find(x=>x.id===g.coupleId);
    // Keep the group's sent status + method on both, now that they're separate slots.
    _preservePairInvite(g.id, g.coupleId);
    if(oldPartner){ oldPartner.coupleId=null; oldPartner.plusOneId=null; }
    g.coupleId=null; g.plusOneId=null;
  }
  if(newLinkId && newLinkId!==g.coupleId){
    const newPartner=STATE.guests.find(x=>x.id===newLinkId);
    if(newPartner){
      // Unlink new partner's existing link first
      if(newPartner.coupleId){ const old=STATE.guests.find(x=>x.id===newPartner.coupleId); if(old){ old.coupleId=null; old.plusOneId=null; } }
      newPartner.coupleId=g.id; newPartner.relationship='Couple';
      g.coupleId=newPartner.id; g.relationship='Couple';
    }
  }
  saveToStorage();
  // `quiet` = called from the Plus One flow, which closes/navigates itself once
  // the plus-one guest has been created. Returning early keeps the host's edits
  // saved without tearing down the modal mid-flow.
  if(quiet) return;
  closeModalDirect();
  // Return to whichever page opened the modal (rsvp-mgr or guests).
  if(_editGuestReturnPage==='rsvp-mgr') navigate('rsvp-mgr');
  else navigate('guests');
}
function openLinkGuest(id){
  const eligible=STATE.guests.filter(g=>g.id!==id&&!g.coupleId&&!g.plusOneId);
  const g=STATE.guests.find(x=>x.id===id);
  if(!g) return;
  const _curPartner = g.coupleId ? STATE.guests.find(x=>x.id===g.coupleId)
                    : (g.plusOneId ? STATE.guests.find(x=>x.id===g.plusOneId) : null);
  const _curRel = g.coupleId ? (g.relationship||'Couple') : (g.plusOneId ? 'Plus One' : '');
  const _curNote = _curPartner
    ? `<div style="font-size:12px;color:var(--red-deep);margin-bottom:2px;background:rgba(180,60,60,.07);border-radius:6px;padding:8px 11px;line-height:1.4">Currently linked to <strong>${_escHtml(_curPartner.name||'a guest')}</strong>${_curRel?` (${_escHtml(_curRel)})`:''}. Linking to someone new will unlink them.</div>`
    : '';
  openModal('Link Guest',`
  <div style="display:flex;flex-direction:column;gap:14px">
    ${_curNote}
    <div class="form-group"><label class="form-label">Link to</label>
      <select class="form-input" id="link-to" onchange="onLinkToChange(this.value)">
        <option value="">— Select a guest —</option>
        ${eligible.map(g=>`<option value="${g.id}">${g.name}</option>`).join('')}
      </select>
    </div>
    <div id="link-rel-row" class="form-group"><label class="form-label">Relationship</label>
      <select class="form-input" id="link-rel">
        <option value="Couple">Couple</option><option value="Plus One">Plus One</option>
        <option value="Family">Family</option><option value="Household">Household</option>
      </select>
    </div>
    <div style="height:1px;background:var(--border)"></div>
    <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:2px 0" onclick="togglePlusOneNew()">
      <div id="plus-one-new-check" style="width:18px;height:18px;border-radius:4px;border:2px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s"></div>
      <div>
        <div style="font-size:13px;font-weight:500;color:var(--ink)">Add a Plus 1 instead</div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:2px">Creates a new guest linked as ${g.name}'s Plus One</div>
      </div>
    </label>
    <div id="plus-one-new-section" style="display:none;flex-direction:column;gap:10px;background:var(--surface);border-radius:10px;padding:12px;border:1px solid var(--border)">
      <div class="form-group"><label class="form-label">Plus One Name <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <input class="form-input" id="plus-one-name" placeholder="e.g. +1 (${g.name})"/>
      </div>
    </div>
  </div>`,
  `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
   <button class="btn btn-primary" onclick="doLinkGuest('${id}')">Link</button>`);
}

let _plusOneNewMode=false;
function togglePlusOneNew(){
  _plusOneNewMode=!_plusOneNewMode;
  const check=document.getElementById('plus-one-new-check');
  const section=document.getElementById('plus-one-new-section');
  const linkRow=document.getElementById('link-rel-row');
  const linkTo=document.getElementById('link-to')?.closest('.form-group');
  if(check){
    check.style.background=_plusOneNewMode?'var(--gold)':'transparent';
    check.style.borderColor=_plusOneNewMode?'var(--gold)':'var(--border)';
    check.innerHTML=_plusOneNewMode?'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':'';
  }
  if(section) section.style.display=_plusOneNewMode?'flex':'none';
  if(linkRow) linkRow.style.display=_plusOneNewMode?'none':'block';
  // Hide the "Link to" row when in plus-one-new mode
  const linkToSelect=document.getElementById('link-to');
  if(linkToSelect) linkToSelect.closest('.form-group').style.display=_plusOneNewMode?'none':'block';
}
function onLinkToChange(val){
  // Could be used for future enhancements
}

/* ── Plus One creation — SINGLE SOURCE OF TRUTH ──────────────────────────────
   Both the Link Guest modal ("Add a Plus 1 instead") and the Edit Guest dialog
   ("Add their Plus One now") build the plus-one guest through this one function,
   so the two entry points can never drift in what they create. Shape is exactly
   what doLinkGuest built before this was extracted: inherits address / tags /
   listType from the host, gets a '+1' tag, relationship 'Plus One',
   coupleId -> host, and the host's plusOneId points back. */
function _createPlusOneFor(hostId, rawName){
  if(_sbSession && typeof _uvGuestLimitReached==='function' && _uvGuestLimitReached()){ _uvRequirePaid('unlimitedGuests'); return null; }
  const g = STATE.guests.find(x=>x.id===hostId);
  if(!g) return null;
  const plusName = (rawName||'').trim() || ('+1 ('+g.name+')');
  const plusTags = [...(g.tags||[])];
  if(!plusTags.includes('+1')) plusTags.unshift('+1');
  const plusId = uid();
  const plusGuest = {
    id:plusId, name:plusName, rsvp:'awaiting', dietary:[], tags:plusTags,
    phone:'', email:'', address:g.address||'', relationship:'Plus One',
    coupleId:g.id, plusOneId:null, plusOne:false, isMain:false,
    notes:'', listType:g.listType||'A'
  };
  g.plusOneId = plusId;
  STATE.guests.push(plusGuest);
  return plusGuest;
}

/* Edit-dialog control. Only rendered when the guest has NO existing link
   (no coupleId, no plusOneId) — see _egPlusOneBlockHtml. Reveals a name field
   the first time it's pressed, creates on the second press, so nothing is made
   without the chance to name it. */
let _egPlusOneOpen = false;
function _egPlusOneToggle(hostId){
  _egPlusOneOpen = !_egPlusOneOpen;
  const sec = document.getElementById('eg-plusone-section');
  const btn = document.getElementById('eg-plusone-btn');
  if(sec) sec.style.display = _egPlusOneOpen ? 'flex' : 'none';
  if(btn) btn.textContent = _egPlusOneOpen ? 'Create Plus One' : 'Add their Plus One now';
  if(_egPlusOneOpen){
    const inp = document.getElementById('eg-plusone-name');
    if(inp) setTimeout(()=>inp.focus(), 30);
    return;
  }
}
/* Second press = commit. Saves the host's edits first so a name typed in the
   form isn't lost, then creates, then re-opens Edit so the new row is visible. */
function _egPlusOneCreate(hostId){
  const nameEl = document.getElementById('eg-plusone-name');
  const raw = nameEl ? nameEl.value : '';
  saveEditGuest(hostId, true);
  const made = _createPlusOneFor(hostId, raw);
  _egPlusOneOpen = false;
  saveToStorage();
  if(typeof _showInfoToast==='function' && made)
    _showInfoToast(made.name+' added as a Plus One.', null, null);
  closeModalDirect();
  navigate('guests');
}
/* Unlink an existing plus one WITHOUT deleting the guest: they stay in the list
   as an independent guest. Deleting is a separate, destructive action. */
function _egUnlinkPlusOne(hostId){
  const g = STATE.guests.find(x=>x.id===hostId);
  if(!g || !g.plusOneId) return;
  const p = STATE.guests.find(x=>x.id===g.plusOneId);
  // Keep the group's sent status + method on both when the plus-one is freed.
  _preservePairInvite(g.id, g.plusOneId);
  if(p){ if(p.coupleId===g.id) p.coupleId=null; if(p.relationship==='Plus One') p.relationship='Guest'; }
  g.plusOneId = null;
  saveToStorage();
  closeModalDirect();
  openEditGuest(hostId);
}

/* Renders one of three states into the Edit dialog:
   (a) plus one exists  -> linked row + Unlink
   (b) linked as couple -> nothing (already linked to someone)
   (c) unlinked         -> the "Add their Plus One now" button */
function _egPlusOneBlockHtml(g){
  if(g.plusOneId){
    const p = STATE.guests.find(x=>x.id===g.plusOneId);
    if(p){
      return `<div style="display:flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:10px 12px">
        <span style="background:rgba(196,168,130,.22);color:var(--gold-deep);font-size:10px;font-weight:700;padding:2px 7px;border-radius:9px;flex-shrink:0">+1</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12.5px;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_escHtml(p.name||'')}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:1px">Linked as ${_escHtml(g.name||'')}'s Plus One</div>
        </div>
        <button type="button" onclick="_egUnlinkPlusOne('${g.id}')" style="background:none;border:none;padding:0;cursor:pointer;font-size:11.5px;color:var(--gold-deep);text-decoration:underline;text-underline-offset:2px;flex-shrink:0">Unlink</button>
      </div>`;
    }
  }
  if(g.coupleId) return '';
  return `<div>
    <button type="button" id="eg-plusone-btn" onclick="_egPlusOneOpen?_egPlusOneCreate('${g.id}'):_egPlusOneToggle('${g.id}')" style="font-family:'Inter',sans-serif;font-size:12px;font-weight:600;border:1px solid var(--sw-idle,#C9B89C);background:var(--sw-bg,#FBF8F3);color:var(--gold-deep,#8B7355);border-radius:7px;padding:7px 13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px">Add their Plus One now</button>
    <div id="eg-plusone-section" style="display:none;flex-direction:column;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:11px 12px;margin-top:8px">
      <label class="form-label" style="margin:0">Plus One name <span style="color:var(--muted);font-weight:400">(optional)</span></label>
      <input class="form-input" id="eg-plusone-name" placeholder="+1 (${_escAttr(g.name||'')})" onkeydown="if(event.key==='Enter'){event.preventDefault();_egPlusOneCreate('${g.id}')}"/>
    </div>
  </div>`;
}

function doLinkGuest(id){
  const g=STATE.guests.find(x=>x.id===id);
  if(!g) return;

  if(_plusOneNewMode){
    // Create a new Plus One guest and link them (shared helper — see _createPlusOneFor)
    const rawName=(document.getElementById('plus-one-name')?.value||'').trim();
    _createPlusOneFor(g.id, rawName);
    _plusOneNewMode=false;
    saveToStorage(); closeModalDirect(); navigate('guests');
    return;
  }

  const toId=document.getElementById('link-to')?.value;
  if(!toId){ alert('Please select a guest to link to.'); return; }
  const rel=document.getElementById('link-rel')?.value||'Couple';
  const linked=STATE.guests.find(x=>x.id===toId);
  if(!linked){ alert('Please select a guest to link to.'); return; }

  // Family / Household create a real group (not a 2-person couple link). Prompt for a name.
  if(rel==='Family' || rel==='Household'){
    _promptGroupNameThenCreate(rel, g.id, linked.id);
    return;
  }

  if(g&&linked){
    // Detach any existing partner on BOTH sides first, so no guest is left orphaned.
    [g,linked].forEach(person=>{
      if(person.coupleId && person.coupleId!==g.id && person.coupleId!==linked.id){
        const old=STATE.guests.find(x=>x.id===person.coupleId);
        _preservePairInvite(person.id, person.coupleId);
        if(old){ if(old.coupleId===person.id) old.coupleId=null; if(old.plusOneId===person.id) old.plusOneId=null; }
      }
      if(person.plusOneId && person.plusOneId!==g.id && person.plusOneId!==linked.id){
        const old=STATE.guests.find(x=>x.id===person.plusOneId);
        _preservePairInvite(person.id, person.plusOneId);
        if(old){ if(old.coupleId===person.id) old.coupleId=null; }
      }
      person.coupleId=null; person.plusOneId=null;
    });
    if(rel==='Plus One'){ g.coupleId=linked.id; linked.plusOneId=g.id; g.relationship='Plus One'; }
    else { g.coupleId=linked.id; linked.coupleId=g.id; g.relationship=rel; linked.relationship=rel; }
  }
  _plusOneNewMode=false;
  saveToStorage(); closeModalDirect(); navigate('guests');
}

// Second-step prompt: ask for a Family/Household group name, then create the group.
function _promptGroupNameThenCreate(kindWord, id1, id2){
  const isHouse = kindWord==='Household';
  const g1=STATE.guests.find(x=>x.id===id1);
  const g2=STATE.guests.find(x=>x.id===id2);
  // Suggest a default name from a shared surname, else "[Name] & [Name]".
  const surname=(nm)=>{ const p=(nm||'').trim().split(/\s+/); return p.length>1?p[p.length-1]:''; };
  const s1=surname(g1&&g1.name), s2=surname(g2&&g2.name);
  const suggested = (s1 && s1===s2) ? `${s1} ${isHouse?'Household':'Family'}`
                   : `${(g1&&g1.name||'').split(/\s+/)[0]} & ${(g2&&g2.name||'').split(/\s+/)[0]}`;
  openModal(isHouse?'Name this Household':'Name this Family',`
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="font-size:12.5px;color:var(--muted);line-height:1.5">${_escHtml(g1&&g1.name||'')} and ${_escHtml(g2&&g2.name||'')} will be grouped as a ${isHouse?'household':'family'}. You can add more members afterwards.</div>
      <div class="form-group"><label class="form-label">${isHouse?'Household':'Family'} name</label>
        <input class="form-input" id="grp-name-input" value="${_escHtml(suggested)}" placeholder="${isHouse?'e.g. Tomlinson Household':'e.g. The Smiths'}"/>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-primary" onclick="_confirmGroupNameCreate('${kindWord}','${id1}','${id2}')">Create ${isHouse?'Household':'Family'}</button>`);
  setTimeout(()=>{ const i=document.getElementById('grp-name-input'); if(i){ i.focus(); i.select(); } },30);
}
function _confirmGroupNameCreate(kindWord, id1, id2){
  const isHouse = kindWord==='Household';
  const ids=[id1,id2];
  const name=(document.getElementById('grp-name-input')?.value||'').trim() || (isHouse?'Household':'Family Group');
  if(!STATE.families) STATE.families=[];
  // Detach any couple/plus-one pair links on these guests (they're joining a group now).
  ids.forEach(id=>{
    const g=STATE.guests.find(x=>x.id===id); if(!g) return;
    if(g.coupleId){ const o=STATE.guests.find(x=>x.id===g.coupleId); _preservePairInvite(id, g.coupleId); if(o){ if(o.coupleId===id)o.coupleId=null; if(o.plusOneId===id)o.plusOneId=null; } }
    if(g.plusOneId){ const o=STATE.guests.find(x=>x.id===g.plusOneId); _preservePairInvite(id, g.plusOneId); if(o){ if(o.coupleId===id)o.coupleId=null; } }
    g.coupleId=null; g.plusOneId=null;
    if(g.relationship==='Couple'||g.relationship==='Plus One'||g.relationship==='Sibling') g.relationship='Guest';
  });
  // Remove from any existing groups first. If a guest is leaving a family that had a
  // sent invite, carry that group's status + method onto their (soon) solo slot.
  ids.forEach(id=>{
    const oldFam=(STATE.families||[]).find(f=>f.memberIds.includes(id));
    if(oldFam) _preserveInviteOnSeparate([id], ['fam:'+oldFam.id]);
  });
  STATE.families.forEach(f=>{ f.memberIds=f.memberIds.filter(id=>!ids.includes(id)); });
  STATE.families=STATE.families.filter(f=>f.memberIds.length>0);
  const grp={ id:'fam'+Date.now()+Math.random().toString(36).slice(2,5), name, memberIds:[...ids] };
  if(isHouse) grp.kind='household';
  STATE.families.push(grp);
  _plusOneNewMode=false;
  saveToStorage(); closeModalDirect(); navigate('guests');
}
function deleteGuest(id){
  const g=STATE.guests.find(x=>x.id===id);
  if(!g) return;
  _confirmDeleteDialog({title:'Remove Guest', question:'Remove this guest?', name:g.name, verb:'Remove', onConfirmJs:`confirmDeleteGuest('${id}')`});
}
function confirmDeleteGuest(id){
  const _g0=STATE.guests.find(x=>x.id===id);
  const _label=_g0?(_g0.name||'guest'):'guest';
  closeModalDirect();
  _undoableDelete(_label, ()=>{
  const idsToDelete=new Set([id]);
  const g=STATE.guests.find(x=>x.id===id);
  if(g){
    // If this guest has a plus-one, delete the plus-one too
    if(g.plusOneId) idsToDelete.add(g.plusOneId);
    // If this guest IS a plus-one, clear the primary's reference
    if(g.coupleId){
      const primary=STATE.guests.find(x=>x.id===g.coupleId);
      if(primary){
        if(primary.plusOneId===id) primary.plusOneId=null;
        if(primary.coupleId===id) primary.coupleId=null;
      }
    }
    // Clear any partner's couple link pointing to this guest
    STATE.guests.forEach(x=>{
      if(x.coupleId===id) x.coupleId=null;
      if(x.plusOneId===id) x.plusOneId=null;
      if(Array.isArray(x.keepApart) && x.keepApart.includes(id)) x.keepApart=x.keepApart.filter(k=>k!==id);
    });
    // Remove from family groups
    (STATE.families||[]).forEach(f=>{
      f.memberIds=f.memberIds.filter(mid=>!idsToDelete.has(mid));
    });
    STATE.families=(STATE.families||[]).filter(f=>f.memberIds.length>0);
  }
  STATE.guests=STATE.guests.filter(x=>!idsToDelete.has(x.id));
  Object.keys(STATE.seating).forEach(tid=>{
    STATE.seating[tid]=(STATE.seating[tid]||[]).map(x=>idsToDelete.has(x)?null:x);
  });
  }, 'guests');
}

// ══════════════════════════════════════════════
