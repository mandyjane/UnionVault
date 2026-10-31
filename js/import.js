// GUEST SPREADSHEET IMPORT
// ══════════════════════════════════════════════
let _importRows = [];
let _importHeaders = [];

function openGuestImport(){
  openModal('Import Guest List',`
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="font-size:13px;color:var(--muted);line-height:1.6">
        Paste your spreadsheet data below. Copy cells directly from Excel, Google Sheets, or Numbers — or paste CSV text. The first row should be column headers.
      </div>
      <div class="form-group">
        <label class="form-label">Paste spreadsheet data</label>
        <textarea id="guest-import-text" class="form-input" rows="8"
          placeholder="Name&#9;Email&#9;Phone&#9;RSVP&#10;Jane Smith&#9;jane@email.com&#9;0400 000 000&#9;attending"
          style="font-family:monospace;font-size:11.5px;resize:vertical"></textarea>
      </div>
      <div style="font-size:11.5px;color:var(--muted)">
        <strong>Tip:</strong> Supported columns (any order, any capitalisation): <em>Name, First Name, Last Name / Surname, Email, Phone (incl. Mobile / Home / Work number), RSVP / Status, Dietary / Diet, Tags / Group, Side (matches your Partner Titles), Address (incl. Mailing address), Relationship, Prefix / Title / Salutation, Instagram handle / Facebook handle</em>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-primary" onclick="parseGuestImport()">Next →</button>`);
}

function parseGuestImport(){
  const raw = (document.getElementById('guest-import-text')?.value||'').trim();
  if(!raw){ alert('Please paste your spreadsheet data first.'); return; }

  const lines = raw.split(/\r?\n/).filter(l=>l.trim());
  const delim = lines[0].includes('\t') ? '\t' : ',';

  function splitLine(line){
    if(delim==='\t') return line.split('\t').map(c=>c.trim());
    const cols=[]; let cur='', inQ=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='"'&&!inQ){ inQ=true; }
      else if(ch==='"'&&inQ&&line[i+1]==='"'){ cur+='"'; i++; }
      else if(ch==='"'&&inQ){ inQ=false; }
      else if(ch===','&&!inQ){ cols.push(cur.trim()); cur=''; }
      else { cur+=ch; }
    }
    cols.push(cur.trim());
    return cols;
  }

  _importHeaders = splitLine(lines[0]);
  _importRows = lines.slice(1).map(l=>splitLine(l));

  if(!_importRows.length){ alert('No data rows found — make sure the first row is headers.'); return; }

  function autoDetect(header){
    const h=header.toLowerCase().replace(/[^a-z0-9]/g,'');
    if(/^(name|fullname|guestname)$/.test(h)) return 'name';
    if(/^(prefix|title|salutation|honorific)$/.test(h)) return 'prefix';
    if(/^(first|firstname|givenname|forename)$/.test(h)) return 'firstName';
    if(/^(last|lastname|surname|familyname)$/.test(h)) return 'lastName';
    if(/^(email|emailaddress|mail|e-mail)$/.test(h)) return 'email';
    if(/^(rsvp|status|response|attending|confirmed)$/.test(h)) return 'rsvp';
    if(/^(diet|dietary|food|allerg|restriction)/.test(h)) return 'dietary';
    if(/^(side|brideorgroom|brideorgroomside)$/.test(h)) return 'side';
    if(/^(tag|group|party|table)/.test(h)) return 'tags';
    if(/(phone|mobile|cell|contact|homenumber|worknumber|homephone|workphone|landline)/.test(h)) return 'phone';
    if(/(address|location|suburb|city|mailing|postal)/.test(h)) return 'address';
    if(/(instagram|^ig$|handle|messenger|socialmedia|^social$|^dm$|username|^insta$|facebook|^fb$)/.test(h)) return 'handle';
    if(/^(relationship|type|role)/.test(h)) return 'relationship';
    return 'skip';
  }

  const fields = [
    {key:'name',label:'Full Name'},{key:'firstName',label:'First Name'},{key:'lastName',label:'Last Name'},
    {key:'prefix',label:'Prefix / Title'},
    {key:'email',label:'Email'},{key:'rsvp',label:'RSVP / Status'},{key:'dietary',label:'Dietary'},
    {key:'tags',label:'Group / Tags'},{key:'side',label:'Side (partner)'},{key:'phone',label:'Phone'},{key:'address',label:'Address'},
    {key:'handle',label:'IG / Messenger handle'},
    {key:'relationship',label:'Relationship'},{key:'skip',label:'— Skip —'},
  ];

  const selects = _importHeaders.map((h,i)=>{
    const detected = autoDetect(h);
    const opts = fields.map(f=>`<option value="${f.key}" ${f.key===detected?'selected':''}>${f.label}</option>`).join('');
    const sample = ((_importRows[0]||[])[i]||'');
    return`<div style="display:grid;grid-template-columns:1fr 1fr 145px;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:12.5px;font-weight:500;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${h}">${h}</div>
      <div style="font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${sample}">${sample}</div>
      <select class="form-input" id="col-map-${i}" style="font-size:12px;padding:4px 28px 4px 8px;appearance:none;-webkit-appearance:none;-moz-appearance:none">${opts}</select>
    </div>`;
  }).join('');

  closeModalDirect();
  openModal('Map Columns',`
    <div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px"><strong>${_importRows.length} rows</strong> found. Confirm how each column maps to guest fields.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 145px;gap:8px;padding:6px 0;border-bottom:2px solid var(--border)">
        <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Column</div>
        <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Sample</div>
        <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Maps to</div>
      </div>
      <div style="max-height:300px;overflow-y:auto">${selects}</div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-primary" onclick="applyGuestImport()">Import ${_importRows.length} Guests</button>`);
}

let _pendingImportGuests = [];
// Tracks guests added via the most recent import so the list can float them to the
// top with a NEW badge. Session/visual only (not saved to STATE); cleared on leaving Guests.
let _newlyImportedIds = new Set();

/* A dietary cell from an import. Split into entries (after "Allergy:" the rest of that
   segment is the allergy list, so its commas stay with it), then normalised to the app's keys
   by _normaliseDiet — recognised words tick their box, unknown words become Other + detail. */
function _importDiet(cell){
  const entries=[];
  String(cell).split(/[;|]/).map(x=>x.trim()).filter(Boolean).forEach(part=>{
    const mm=part.match(/^(.*?)\b(?:allerg(?:y|ies|ic)(?:\s+to)?|anaphyla\w*)\s*:\s*(.+)$/i);
    if(mm){ mm[1].split(',').map(t=>t.trim()).filter(Boolean).forEach(t=>entries.push(t));
            mm[2].split(',').map(t=>t.trim()).filter(Boolean).forEach(t=>entries.push(t+' allergy')); }
    else part.split(',').map(t=>t.trim()).filter(Boolean).forEach(t=>entries.push(t));
  });
  return _normaliseDiet(entries);
}
function applyGuestImport(){
  const mapping = _importHeaders.map((_,i)=>document.getElementById(`col-map-${i}`)?.value||'skip');
  function colVal(row,key){ const idx=mapping.indexOf(key); return idx>=0?(row[idx]||'').trim():''; }
  function handleColPlatform(){ const idx=mapping.indexOf('handle'); if(idx<0)return'instagram'; const h=(_importHeaders[idx]||'').toLowerCase().replace(/[\s_-]/g,''); return/(facebook|^fb$)/.test(h)&&!/(instagram|^ig$|^insta$)/.test(h)?'facebook':'instagram'; }
  function parseRsvp(val){
    const v=val.toLowerCase().replace(/[\s-_]/g,'');
    if(/^(yes|y|attending|confirmed|accepted|coming|1|true)$/.test(v)) return 'attending';
    if(/^(no|n|declined|rejected|notcoming|0|false|regrets|unable|cantmake)$/.test(v)) return 'declined';
    return 'awaiting';
  }
  function normaliseSide(val){
    const raw=(val||'').trim(); if(!raw) return '';
    const norm=s=>String(s||'').toLowerCase().replace(/[\s_'-]/g,'');
    const v=norm(raw);
    const t1=(STATE.settings&&STATE.settings.partner1Title)||'Partner';
    const t2=(STATE.settings&&STATE.settings.partner2Title)||'Partner';
    const n1=(STATE.event&&STATE.event.partner1)||'';
    const n2=(STATE.event&&STATE.event.partner2)||'';
    // Build match-sets for each partner: title (with/without "side"), position, name, fallback.
    const side=(t)=>{const tn=norm(t);return new Set([tn, tn+'side', tn+'sside']);};
    const set1=side(t1), set2=side(t2);
    // Position aliases
    ['1','p1','partner1','partner1side','one','first'].forEach(x=>set1.add(x));
    ['2','p2','partner2','partner2side','two','second'].forEach(x=>set2.add(x));
    // First-name match (first token only)
    if(n1){const f=norm(n1.split(/\s+/)[0]);set1.add(f);set1.add(f+'side');set1.add(f+'sside');}
    if(n2){const f=norm(n2.split(/\s+/)[0]);set2.add(f);set2.add(f+'side');set2.add(f+'sside');}
    // Bride/Groom fallback — attach to whichever partner's TITLE is Bride/Groom so it
    // follows the configured titles (not a fixed position). Only when NEITHER title is
    // Bride/Groom (e.g. custom Husband/Wife) does it fall back to a positional default.
    const t1n=norm(t1), t2n=norm(t2);
    const addFallback=(word, aliases)=>{
      if(t1n===word){ aliases.forEach(a=>set1.add(a)); return; }
      if(t2n===word){ aliases.forEach(a=>set2.add(a)); return; }
      // Neither title matches this word — positional default (bride→partner1, groom→partner2).
      if(word==='bride'){ aliases.forEach(a=>set1.add(a)); }
      else { aliases.forEach(a=>set2.add(a)); }
    };
    addFallback('bride', ['bride','b','brideside','bridesside']);
    addFallback('groom', ['groom','g','groomside','groomsside']);
    if(set1.has(v)) return `${t1}'s Side`;
    if(set2.has(v)) return `${t2}'s Side`;
    return raw; // unrecognised — keep verbatim
  }
  // Normalise a tag for duplicate comparison: lowercase, strip apostrophes/spaces/dashes,
  // and collapse a possessive form ("husbands side" -> "husband side") so apostrophe and
  // non-apostrophe variants of the same side tag match.
  function _tagKey(t){ return String(t||'').toLowerCase().replace(/[\s_'-]/g,'').replace(/s(side)$/,'$1'); }
  _pendingImportGuests=[]; let skipped=0;
  _importRows.forEach(row=>{
    if(!row.length||row.every(c=>!c)){skipped++;return;}
    let name=colVal(row,'name');
    const first=colVal(row,'firstName'),last=colVal(row,'lastName');
    if(!name&&(first||last))name=[first,last].filter(Boolean).join(' ');
    if(!name){skipped++;return;}
    const existingGuest=STATE.guests.find(g=>g.name.toLowerCase().trim()===name.toLowerCase().trim());
    const isDuplicate=!!existingGuest;
    const imported={id:uid(),name,prefix:colVal(row,'prefix')||'',isDuplicate,existingId:existingGuest?.id||null,
      rsvp:parseRsvp(colVal(row,'rsvp')),phone:colVal(row,'phone'),email:colVal(row,'email'),
      address:colVal(row,'address'),handle:colVal(row,'handle')||'',handlePlatform:handleColPlatform(),relationship:colVal(row,'relationship')||'',
      ...(_importDiet(colVal(row,'dietary')||'')),
      tags:(()=>{const base=(colVal(row,'tags')||'').split(/[,;|]/).map(t=>t.trim()).filter(Boolean);const side=normaliseSide(colVal(row,'side'));if(side&&!base.includes(side))base.push(side);return base;})(),
      skip:isDuplicate,action:isDuplicate?'skip':'add',updateFields:{}};
    if(existingGuest){
      ['phone','email','address','handle','relationship'].forEach(f=>{
        const nv=imported[f],ov=existingGuest[f]||'';
        if(nv&&nv!==ov)imported.updateFields[f]={old:ov,new:nv,apply:true};
      });
      const exTagKeys=new Set((existingGuest.tags||[]).map(_tagKey));
      const newTags=imported.tags.filter(t=>!exTagKeys.has(_tagKey(t)));
      if(newTags.length)imported.updateFields.tags={old:(existingGuest.tags||[]).join(', '),new:newTags.join(', '),apply:true,addOnly:true};
    }
    _pendingImportGuests.push(imported);
  });
  const dupes=_pendingImportGuests.filter(g=>g.isDuplicate);
  const clean=_pendingImportGuests.filter(g=>!g.isDuplicate);
  if(!dupes.length){finaliseGuestImport(skipped);return;}
  const fieldLabels={phone:'Phone',email:'Email',address:'Address',handle:'IG / Messenger',relationship:'Relationship',tags:'Tags (new)'};
  const dupeRows=dupes.map((g,i)=>{
    const diffEntries=Object.entries(g.updateFields);
    const hasDiffs=diffEntries.length>0;
    const diffHtml=hasDiffs?`<div id="dup-diffs-${i}" style="display:none;margin-top:8px;padding:8px 10px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
      <div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Fields to update</div>
      ${diffEntries.map(([field,info])=>`<label style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;cursor:pointer">
        <input type="checkbox" id="dup-field-${i}-${field}" checked onchange="setDupFieldApply(${i},'${field}',this.checked)" style="accent-color:var(--gold);margin-top:2px;flex-shrink:0"/>
        <div style="font-size:12px;line-height:1.4"><span style="font-weight:500;color:var(--ink)">${fieldLabels[field]||field}</span>${info.old?` <span style="color:var(--muted)">was: <em>${info.old}</em></span>`:''} <span style="color:var(--green)">→ ${info.addOnly?'+':''}${info.new}</span></div>
      </label>`).join('')}
    </div>`:'';
    return`<div style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--ink)">${g.name}</div>
          ${hasDiffs?`<div style="font-size:11px;color:var(--gold-deep);margin-top:2px">${diffEntries.length} field${diffEntries.length!==1?'s':''} with new info: ${diffEntries.map(([field,info])=>`${fieldLabels[field]||field} <span style="color:var(--green)">→ ${info.addOnly?'+':''}${_escHtml(info.new)}</span>`).join(', ')}</div>`:`<div style="font-size:11px;color:var(--muted);margin-top:2px">No new info detected</div>`}
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0;flex-wrap:wrap">
          <button id="dup-skip-${i}" onclick="setDupAction(${i},'skip')" style="background:var(--red-deep);border:1px solid var(--red-deep);color:#fff;padding:4px 10px;font-size:11.5px;border-radius:8px;cursor:pointer">Skip</button>
          ${hasDiffs?`<button id="dup-update-${i}" onclick="setDupAction(${i},'update')" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:4px 10px;font-size:11.5px;border-radius:8px;cursor:pointer">Update</button>`:''}
          <button id="dup-add-${i}" onclick="setDupAction(${i},'add')" style="background:transparent;border:1px solid var(--border);color:var(--muted);padding:4px 10px;font-size:11.5px;border-radius:8px;cursor:pointer">Add Anyway</button>
        </div>
      </div>
      ${diffHtml}
    </div>`;
  }).join('');
  closeModalDirect();
  openModal(`${dupes.length} Duplicate${dupes.length!==1?'s':''} Found`,`
    <div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px;line-height:1.5">These names already exist. Choose to skip, update their details, or add as a new entry.
        <span style="display:inline-flex;align-items:center;gap:4px;background:var(--parchment);border-radius:6px;padding:2px 8px;font-size:12px;color:var(--gold-deep);margin-left:4px">${clean.length} new · ${dupes.length} duplicate${dupes.length!==1?'s':''}</span>
      </div>
      <div style="max-height:380px;overflow-y:auto">${dupeRows}</div>
    </div>`,
    `<button class="btn btn-outline btn-sm" onclick="setAllDupAction('skip')" style="margin-left:auto">Skip All</button>
     <button class="btn btn-outline btn-sm" onclick="setAllDupAction('update')">Update All</button>
     <button class="btn btn-primary" onclick="finaliseGuestImport(${skipped})">Import</button>`);
}
function setDupAction(idx,action){
  const dupes=_pendingImportGuests.filter(g=>g.isDuplicate);
  if(!dupes[idx])return;
  dupes[idx].action=action; dupes[idx].skip=(action==='skip');
  const s=document.getElementById(`dup-skip-${idx}`),u=document.getElementById(`dup-update-${idx}`),a=document.getElementById(`dup-add-${idx}`);
  const act=(col)=>`background:${col};border:1px solid ${col};color:#fff;padding:4px 10px;font-size:11.5px;border-radius:8px;cursor:pointer`;
  const inact=`background:transparent;border:1px solid var(--border);color:var(--muted);padding:4px 10px;font-size:11.5px;border-radius:8px;cursor:pointer`;
  if(s)s.style.cssText=action==='skip'?act('var(--red-deep)'):inact;
  if(u)u.style.cssText=action==='update'?act('var(--gold)'):inact;
  if(a)a.style.cssText=action==='add'?act('var(--green)'):inact;
  const dp=document.getElementById(`dup-diffs-${idx}`);
  if(dp)dp.style.display=action==='update'?'block':'none';
}
function setDupFieldApply(idx,field,apply){
  const dupes=_pendingImportGuests.filter(g=>g.isDuplicate);
  if(!dupes[idx]||!dupes[idx].updateFields[field])return;
  dupes[idx].updateFields[field].apply=apply;
}
function setAllDupAction(action){
  const dupes=_pendingImportGuests.filter(g=>g.isDuplicate);
  dupes.forEach((_,i)=>setDupAction(i,action));
}
function finaliseGuestImport(skipped=0){
  let added=0,updated=0;
  _newlyImportedIds=new Set();
  const addedIds=[];
  const _freeGuestCap = _sbSession && typeof _uvIsPaid==='function' && !_uvIsPaid();
  let _freeSlots = _freeGuestCap ? Math.max(0, 50 - (STATE.guests||[]).length) : Infinity;
  _pendingImportGuests.forEach(g=>{
    if(g.action==='skip'||g.skip){skipped++;return;}
    if(g.action==='update'&&g.existingId){
      const ex=STATE.guests.find(x=>x.id===g.existingId);
      if(ex){
        Object.entries(g.updateFields).forEach(([field,info])=>{
          if(!info.apply)return;
          if(field==='tags'){const _tk=t=>String(t||'').toLowerCase().replace(/[\s_'-]/g,'').replace(/s(side)$/,'$1');const exKeys=new Set((ex.tags||[]).map(_tk));const nt=info.new.split(',').map(t=>t.trim()).filter(Boolean);nt.forEach(t=>{const k=_tk(t);if(!exKeys.has(k)){if(!ex.tags)ex.tags=[];ex.tags.push(t);exKeys.add(k);}});}
          else{ex[field]=info.new;}
        });
        updated++;
      }
      return;
    }
    if(_freeGuestCap && _freeSlots <= 0){ skipped++; return; }
    const{id,name,prefix,rsvp,phone,email,address,handle,handlePlatform,relationship,dietary,tags,allergens,allergyNote,dietOther}=g;
    STATE.guests.push({id,name,prefix:prefix||'',rsvp,dietary,tags,allergens:allergens||[],allergyNote:allergyNote||'',dietOther:dietOther||'',phone,email,address,handle:handle||'',handlePlatform:(handle||'').trim()?(handlePlatform||'instagram'):undefined,relationship:relationship||'Guest',coupleId:null,plusOneId:null,plusOne:false,isMain:true,notes:'',listType:'A'});
    { const _ng=STATE.guests[STATE.guests.length-1]; const _ab=_ageBandFromTags(tags); if(_ab) _setGuestAgeBand(_ng,_ab); }
    _newlyImportedIds.add(id); addedIds.push(id);
    added++; if(_freeGuestCap) _freeSlots--;
  });
  _pendingImportGuests=[];
  saveToStorage();closeModalDirect();navigate('guests');
  setTimeout(()=>{
    const parts=[];
    if(added)parts.push(`✓ ${added} guest${added!==1?'s':''} added`);
    if(updated)parts.push(`${updated} updated`);
    if(skipped)parts.push(`${skipped} skipped`);
    const t=document.createElement('div');
    t.textContent=parts.join(' · ')||'Import complete';
    t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--cream);padding:10px 22px;border-radius:24px;font-size:13px;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none';
    document.body.appendChild(t);
    requestAnimationFrame(()=>{t.style.opacity='1';setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),400);},3200);});
  },100);
  // After the list paints, offer to group any newly-added guests that share a surname.
  if(addedIds.length){ setTimeout(()=>_promptSurnameGrouping(addedIds), 350); }
}

// ───────────────────────────────────────────────────────────────────────────
// POST-IMPORT GROUP SUGGESTIONS (A+C model — smarter detection, single editable
// review panel reached via a dismissible banner). Replaces the old per-surname
// popup chain (_promptSurnameGrouping / _showNextSurnameCluster / _sg* picker).
// ───────────────────────────────────────────────────────────────────────────

// Surname helper: last whitespace-separated token, lowercased (for comparison keys).
function _surnameOf(name){ const parts=String(name||'').trim().split(/\s+/); return parts.length>1?parts[parts.length-1].toLowerCase():''; }
// Original-case surname (for display, e.g. "The Patel Family").
function _surnameDisp(name){ const parts=String(name||'').trim().split(/\s+/); return parts.length>1?parts[parts.length-1]:''; }
// Normalise an address for loose comparison (lowercase, strip punctuation/spaces).
function _addrKey(a){ return String(a||'').toLowerCase().replace(/[^a-z0-9]/g,''); }
// The "Side" tag on a guest, if any (e.g. "Bride's Side").
function _sideTagOf(g){ return (g.tags||[]).find(t=>/side/i.test(t))||''; }

// ── Plus-one detection helpers ───────────────────────────────────────────────
// A name cell ending in a +1 marker: "Jane Doe +1", "Jane Doe plus one",
// "Jane Doe & guest", "Jane Doe +guest". Returns the host part (marker stripped)
// or '' if no marker. We keep this conservative so real names aren't mangled.
function _plusOneSuffixHost(name){
  const s=String(name||'').trim();
  const m=s.match(/^(.*?)[\s,]*(?:\+\s*1|\+\s*guest|\band\s+guest\b|&\s*guest|\bplus\s*(?:one|1)\b)\s*$/i);
  if(!m) return '';
  const host=m[1].replace(/[\s,&]+$/,'').trim();
  return host && /[A-Za-z]/.test(host) ? host : '';
}
// A standalone placeholder row the app itself creates: "+1 (Jared Ross)".
// Returns the host name inside the parens, or '' if not that shape.
function _plusOnePlaceholderHost(name){
  const m=String(name||'').trim().match(/^\+\s*1\s*\((.+)\)\s*$/i);
  return m ? m[1].trim() : '';
}
// True when a guest's relationship column marks them as a plus-one.
function _isPlusOneRel(g){ return /^(?:\+\s*1|plus\s*(?:one|1))$/i.test(String(g&&g.relationship||'').trim()); }
// Initials for a host name (for the "+1 (Host)" placeholder label).
function _plusOneHostLabel(hostName){ return '+1 ('+String(hostName||'').trim()+')'; }
// A suggestion is "live" (applyable / counts in the banner) when it has ≥2 members,
// or it's an amp-split (one member that becomes two), or it's a plus-one (the +1
// may not exist yet for suffix-detected hosts).
function _grIsLive(s){ return s && (s.memberIds.length>=2 || s.reason==='amp' || s.kind==='plusone'); }

// Module-level suggestion state. Visual/session only — never saved to STATE.
let _groupSuggestions=[];        // array of suggestion groups (see shape below)
let _groupSuggestionsSeeded=false; // true once suggestions have been built for this data set
let _groupBannerDismissed=false; // user ✕'d the banner this session
let _groupBannerExpiry=0;        // epoch ms when the banner auto-clears (5 min window)
let _groupBannerTimer=null;      // setTimeout handle for the auto-clear
const _GROUP_BANNER_MS=5*60*1000;// keep the suggestion bar for at least 5 minutes

// Build suggestion groups from the freshly-imported guest ids.
// Suggestion shape: { id, kind:'couple'|'family'|'plusone', memberIds:[...], looseIds:[...],
//   confidence:'high'|'low', reason:'amp'|'address'|'surname'|'plusone', surname, accepted:bool,
//   plusone?:{ hostId, plusId|null, plusName, hostName, src:'suffix'|'rel'|'placeholder' } }
function _buildGroupSuggestions(addedIds){
  const addedSet=new Set(addedIds);
  const all=STATE.guests;
  const inGroup=new Set();           // ids already claimed by a suggestion
  const out=[];
  const alreadyGrouped=g=>!!g.coupleId || (STATE.families||[]).some(f=>f.memberIds.includes(g.id));
  const byId=id=>all.find(x=>x.id===id);

  // ---- 0. Plus-ones. Detected three ways, each producing a 'plusone' suggestion
  // that (on apply) links a host → a +1 entry (relationship 'Plus One', '+1' tag).
  // Runs first so a +1 is never mis-grouped as a couple/surname match below.
  const pushPlusOne=(host, plusId, plusName, src, high)=>{
    inGroup.add(host.id);
    const members=[host.id]; if(plusId) members.push(plusId);
    out.push({ id:'sug'+out.length, kind:'plusone',
      memberIds:members, looseIds:[],
      confidence:high?'high':'low', reason:'plusone',
      surname:_surnameDisp(host.name)||'',
      accepted:high,
      plusone:{ hostId:host.id, plusId:plusId||null, plusName, hostName:host.name, src } });
  };

  // 0a. Standalone placeholder rows "+1 (Host)" → link to the named host if present.
  all.forEach(g=>{
    if(inGroup.has(g.id)||alreadyGrouped(g)) return;
    const hostName=_plusOnePlaceholderHost(g.name);
    if(!hostName) return;
    if(!addedSet.has(g.id) && !all.some(h=>addedSet.has(h.id))) return;
    // Find an existing/imported host by name (case-insensitive), not itself.
    const host=all.find(h=>h.id!==g.id && !_plusOnePlaceholderHost(h.name) &&
      String(h.name||'').trim().toLowerCase()===hostName.toLowerCase());
    if(host && !inGroup.has(host.id) && !alreadyGrouped(host)){
      pushPlusOne(host, g.id, g.name, 'placeholder', true);
    }
  });

  // 0b. Relationship column == "Plus One"/"+1" → pair with a host by shared address
  // (or, failing that, the immediately preceding imported guest with no +1 marker).
  all.forEach((g,idx)=>{
    if(inGroup.has(g.id)||alreadyGrouped(g)) return;
    if(!_isPlusOneRel(g)) return;
    if(!addedSet.has(g.id)) return;
    let host=null;
    const ak=_addrKey(g.address);
    if(ak && ak.length>=4){
      host=all.find(h=>h.id!==g.id && !inGroup.has(h.id) && !alreadyGrouped(h) &&
        !_isPlusOneRel(h) && _addrKey(h.address)===ak);
    }
    if(!host){
      for(let j=idx-1;j>=0;j--){ const h=all[j];
        if(!h||inGroup.has(h.id)||alreadyGrouped(h)||_isPlusOneRel(h)) continue;
        host=h; break;
      }
    }
    if(host){ pushPlusOne(host, g.id, g.name, 'rel', !!(ak&&ak.length>=4)); }
  });

  // 0c. Suffix marker in the name cell: "Jane Doe +1" / "& guest" / "plus one".
  // The +1 has no real name yet → suggest an unnamed placeholder "+1 (Host)".
  all.forEach(g=>{
    if(inGroup.has(g.id)||alreadyGrouped(g)) return;
    if(!addedSet.has(g.id)) return;
    if(_plusOnePlaceholderHost(g.name)) return; // handled in 0a
    const host=_plusOneSuffixHost(g.name);
    if(!host) return;
    pushPlusOne(g, null, _plusOneHostLabel(host), 'suffix', true);
    // Stash the cleaned host name so apply can rename the cell (strip the marker).
    out[out.length-1].plusone.cleanHostName=host;
  });

  // ---- 1. HIGH confidence: an "&" / "and" inside one imported name cell. ----
  // e.g. "John & Jane Whitfield" → two guests sharing the trailing surname.
  // The raw cell is preserved on g.name; we only split for the SUGGESTION (we do
  // not mutate the imported guest here — the user confirms on the panel).
  all.forEach(g=>{
    if(!addedSet.has(g.id)) return;
    if(inGroup.has(g.id)||alreadyGrouped(g)) return;
    const m=String(g.name||'').match(/^(.*?)\s*(?:&|\band\b)\s*(.*)$/i);
    if(!m) return;
    let a=m[1].trim(), b=m[2].trim();
    if(!a||!b) return;
    // Share the trailing surname onto the first name if it lacks one:
    const bParts=b.split(/\s+/);
    if(bParts.length>1 && a.split(/\s+/).length===1){ a=a+' '+bParts[bParts.length-1]; }
    inGroup.add(g.id);
    out.push({ id:'sug'+out.length, kind:'couple', memberIds:[g.id], looseIds:[],
      splitFrom:{ id:g.id, a, b }, confidence:'high', reason:'amp',
      surname:_surnameOf(b)||_surnameOf(a), accepted:true });
  });

  // ---- 2. HIGH confidence: shared address (≥2 guests, ≥1 newly imported). ----
  const byAddr=new Map();
  all.forEach(g=>{
    if(inGroup.has(g.id)||alreadyGrouped(g)) return;
    const k=_addrKey(g.address); if(!k||k.length<4) return;
    if(!byAddr.has(k)) byAddr.set(k,[]); byAddr.get(k).push(g);
  });
  byAddr.forEach(members=>{
    if(members.length<2) return;
    if(!members.some(m=>addedSet.has(m.id))) return;
    members.forEach(m=>inGroup.add(m.id));
    const ids=members.map(m=>m.id);
    const surname=_surnameDisp(members[0].name)||'';
    out.push({ id:'sug'+out.length, kind:ids.length>2?'family':'couple',
      memberIds:ids, looseIds:[], confidence:'high', reason:'address',
      surname, accepted:true });
  });

  // ---- 3. LOW confidence: shared surname only (the old behaviour), but now ----
  // unticked and clearly flagged. Skipped if already claimed above.
  const byName=new Map();
  all.forEach(g=>{
    const sn=_surnameOf(g.name); if(!sn) return;
    if(inGroup.has(g.id)||alreadyGrouped(g)) return;
    if(!byName.has(sn)) byName.set(sn,[]); byName.get(sn).push(g);
  });
  byName.forEach((members,sn)=>{
    if(members.length<2) return;
    if(!members.some(m=>addedSet.has(m.id))) return;
    members.forEach(m=>inGroup.add(m.id));
    const ids=members.map(m=>m.id);
    out.push({ id:'sug'+out.length, kind:ids.length>2?'family':'couple',
      memberIds:ids, looseIds:[], confidence:'low', reason:'surname',
      surname:members[0].name.split(/\s+/).pop(), accepted:false });
  });

  // Never suggest a couple pairing where any member is marked child or infant.
  for(let i=out.length-1;i>=0;i--){
    const s=out[i];
    if(s.kind==='couple' && s.memberIds.some(id=>{ const m=byId(id); return m&&_guestAgeBand(m)!=='adult'; })){
      out.splice(i,1);
    }
  }

  return out;
}

// Entry point from finaliseGuestImport: build suggestions, start the 5-minute
// window, then (silently) show the sticky banner. No modal auto-opens.
function _promptSurnameGrouping(addedIds){
  _groupSuggestions=_buildGroupSuggestions(addedIds);
  _groupSuggestionsSeeded=true;
  _groupBannerDismissed=false;
  _grLoose=[]; _grDragActive=false; _grDrag=null;
  saveToStorage();
  if(_currentPage==='guests' && typeof renderGuestList==='function') renderGuestList();
}
// Window elapsed: hide the floating bar only. Suggestions are NOT discarded — they
// persist for the session so the user can reopen the review panel from the re-entry
// points. (Apply / Not now / ✕ are what actually end a suggestion set.)
function _expireGroupBanner(){
  _groupBannerExpiry=0;
  _groupBannerDismissed=true; // hide the floating bar; suggestions stay in memory
  if(_groupBannerTimer){ clearTimeout(_groupBannerTimer); _groupBannerTimer=null; }
  if(_currentPage==='guests' && typeof renderGuestList==='function') renderGuestList();
}
// Pause the auto-hide timer while the review panel is open, so it can't hide/refresh
// the page out from under an in-progress edit. Remaining time is banked.
let _groupReviewOpen=false;
let _groupBannerRemaining=0;
function _pauseGroupBannerTimer(){
  if(_groupBannerTimer){ clearTimeout(_groupBannerTimer); _groupBannerTimer=null; }
  _groupBannerRemaining=_groupBannerExpiry?Math.max(0,_groupBannerExpiry-Date.now()):0;
}
function _resumeGroupBannerTimer(){
  // Only resume if there's still a live window and the banner wasn't dismissed.
  if(_groupBannerDismissed || !_groupBannerRemaining){ return; }
  _groupBannerExpiry=Date.now()+_groupBannerRemaining;
  if(_groupBannerTimer) clearTimeout(_groupBannerTimer);
  _groupBannerTimer=setTimeout(_expireGroupBanner, _groupBannerRemaining);
  _groupBannerRemaining=0;
}
// True while the suggestion bar should still be shown.
function _groupBannerActive(){
  if(_groupBannerDismissed) return false;
  if(!_groupSuggestions.length) return false;
  return _groupSuggestions.some(s=>_grIsLive(s));
}

// Sticky suggestion bar — pinned just under the guest sticky panel. Rendered as
// its own sticky element (see renderGuestList), so it floats below the panel
// whether expanded or collapsed, in both normal and bulk mode.
function _groupSuggestBannerHtml(){
  if(!_groupBannerActive()) return '';
  const live=_groupSuggestions.filter(s=>_grIsLive(s));
  if(!live.length) return '';
  const couples=live.filter(s=>s.kind==='couple').length;
  const fams=live.filter(s=>s.kind==='family').length;
  const plusones=live.filter(s=>s.kind==='plusone').length;
  const bits=[];
  if(couples) bits.push(`${couples} likely couple${couples!==1?'s':''}`);
  if(fams) bits.push(`${fams} household${fams!==1?'s':''}`);
  if(plusones) bits.push(`${plusones} plus-one${plusones!==1?'s':''}`);
  // Join with commas, "and" before the last item (e.g. "2 couples, 1 household and 1 plus-one").
  const phrase=bits.length<=1?bits.join(''):bits.slice(0,-1).join(', ')+' and '+bits[bits.length-1];
  const sub=phrase+' — review when you\u2019re ready';
  return `<div id="group-suggest-bar" class="group-suggest-banner" style="position:sticky;z-index:48;display:flex;align-items:center;gap:11px;background:var(--cream);border:.5px solid var(--gold);border-radius:10px;padding:11px 13px;margin:8px 0 4px;box-shadow:0 2px 10px rgba(0,0,0,.06)">
    <span style="position:absolute;inset:0;background:rgba(196,168,130,.14);border-radius:10px;pointer-events:none"></span>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" stroke-width="1.7" stroke-linecap="round" style="flex-shrink:0;position:relative"><circle cx="9" cy="12" r="5.2"/><circle cx="15" cy="12" r="5.2"/></svg>
    <div style="min-width:0;position:relative">
      <div style="font-size:13px;font-weight:600;color:var(--ink)">${live.length} suggested group${live.length!==1?'s':''} from your import</div>
      <div style="font-size:11.5px;color:var(--muted)">${sub}</div>
    </div>
    <button class="btn btn-primary btn-sm" style="margin-left:auto;flex-shrink:0;position:relative" onclick="_openGroupReview()">Review</button>
    <span title="Dismiss" onclick="_dismissGroupBanner()" style="color:var(--muted);cursor:pointer;font-size:15px;line-height:1;flex-shrink:0;padding:0 2px;position:relative">\u2715</span>
  </div>`;
}
function _dismissGroupBanner(){
  _groupBannerDismissed=true;
  if(_groupBannerTimer){ clearTimeout(_groupBannerTimer); _groupBannerTimer=null; }
  saveToStorage();
  if(_currentPage==='guests') renderGuestList();
}
function _showGroupBanner(){
  _groupBannerDismissed=false;
  _guestCloseHideMenu();
  if(_currentPage==='guests') renderGuestList();
}

// ── The single editable review panel ──────────────────────────────────────────
// Opening pauses the auto-hide timer so a long edit can't be interrupted mid-flow.
function _openGroupReview(){ _groupReviewOpen=true; _pauseGroupBannerTimer(); _grRender(); }

// True if any suggestions still exist this session (drives the re-entry points).
function _hasLiveSuggestions(){ return _groupSuggestions.some(s=>_grIsLive(s)); }
// Re-entry: reopen the panel from the cog menu / chip (closes any open menu first).
function _reopenSuggestions(){ _guestHideMenuOpen=false; _openGroupReview(); }

function _grGuest(id){ return STATE.guests.find(g=>g.id===id); }
// Two-letter initials from a plain name (for the "+1 XX" host-initials pill).
function _grInitials(name){ return String(name||'').trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'?'; }

function _grRender(){
  const groups=_groupSuggestions.filter(s=>_grIsLive(s));
  // A group can be emptied below 2 by dragging members out; we still keep it in the
  // list (greyed) so the user can drag people back, but it can't be applied.
  const allGroups=_groupSuggestions;
  if(!allGroups.length){ closeModalDirect(); return; }
  const cards=allGroups.map(s=>_grCardHtml(s)).join('');
  const tray=_grUngroupedTrayHtml();
  const selCount=groups.filter(s=>s.accepted).length;
  // Marked couples inside UNticked families will still be committed on Apply, so the
  // button must enable for them — but they're not counted in the "selected" tally
  // (no household is created). selCount alone drives the visible count.
  const pendingLooseCouples=_groupSuggestions.some(s=>!s.accepted && s.kind==='family' && (s.couples||[]).length>0);
  const canApply=selCount>0 || pendingLooseCouples;
  const body=`<div>
    <div style="font-size:12.5px;color:var(--muted);margin-bottom:12px;line-height:1.5">We found likely couples, households, and plus-ones among your imported guests. Drag a guest between boxes if a suggestion's wrong, mark a couple inside a family, then tick what you'd like to keep and apply.</div>
    <div id="gr-boxes" style="display:flex;flex-direction:column;gap:10px">${cards}${tray}</div>
    <div style="display:flex;gap:7px;font-size:11.5px;color:var(--muted);background:var(--surface);border:.5px solid var(--border);border-radius:8px;padding:8px 10px;margin-top:12px;line-height:1.45">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      Grouped guests appear together on the guest list, and the seating plan flags them if they aren't seated together.
    </div>
  </div>`;
  const footer=`<span style="margin-right:auto;font-size:11.5px;color:var(--muted)">${selCount} of ${groups.length} selected</span>
    <button class="btn btn-outline btn-sm" onclick="_grNotNow()">Not now</button>
    <button class="btn btn-primary btn-sm" style="${canApply?'':'opacity:.45;cursor:not-allowed'}" ${canApply?'':'disabled'} onclick="_grApply()">Apply${selCount?' '+selCount+' group'+(selCount!==1?'s':''):''}</button>`;
  const ov=document.getElementById('modal-overlay');
  const mt=document.getElementById('modal-title');
  if(ov && !ov.classList.contains('hidden') && mt && mt.textContent==='Review suggested groups'){
    document.getElementById('modal-body').innerHTML=body;
    document.getElementById('modal-footer').innerHTML=footer;
  } else {
    openModal('Review suggested groups', body, footer);
  }
}

// A draggable guest row. `where` = {sid, inCouple:boolean} so the drop logic knows
// the origin. Drag is a desktop enhancement; the ✕ / select controls remain for touch.
function _grMemberRow(g, sid, opts){
  opts=opts||{};
  const _grBand=_guestAgeBand(g);
  if(_grBand==='child'||_grBand==='infant') opts.selectable=false;
  const handle=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" style="cursor:grab;flex-shrink:0;opacity:.7"><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/></svg>`;
  // Right-side control: in a family (non-couple member) → couple-select checkbox.
  let right='';
  if(opts.selectable){
    const on=opts.selected;
    right=`<span onclick="event.stopPropagation();_grToggleCoupleSel('${sid}','${g.id}')" title="Select to mark a couple" style="margin-left:auto;width:15px;height:15px;border:2px solid ${on?'var(--gold)':'var(--border)'};background:${on?'var(--gold)':'transparent'};border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer">${on?'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</span>`;
  } else if(opts.removable){
    right=`<span onclick="event.stopPropagation();_grRemoveMember('${sid}','${g.id}')" title="Remove from group" style="margin-left:auto;color:var(--muted);cursor:pointer;font-size:13px;line-height:1;padding:0 2px;flex-shrink:0">\u2715</span>`;
  }
  return `<div draggable="true" ondragstart="_grDragStart(event,'${sid}','${g.id}')" ondragend="_grDragEnd(event)"
    data-gr-guest="${g.id}" style="display:flex;align-items:center;gap:8px;background:var(--cream);border:.5px solid var(--border);border-radius:7px;padding:6px 9px">
    ${handle}<span style="font-size:12.5px;color:var(--ink);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_escHtml(g.name)}</span>${(()=>{const m=_AGE_BAND_META[_grBand]||{label:_grBand};const tint=_grBand==='adult'?'rgba(140,140,140,.1)':m.tint||'rgba(90,123,160,.14)';const ink=_grBand==='adult'?'var(--muted)':m.ink||'var(--muted)';return`<span style="flex-shrink:0;font-size:10px;font-weight:600;padding:1px 7px;border-radius:9px;background:${tint};color:${ink}">${m.label||_grBand}</span>`;})()}${right}
  </div>`;
}

function _grCardHtml(s){
  // ── Plus-one card: distinct +1 styling; host + the +1 (named or placeholder). ──
  if(s.kind==='plusone' && s.plusone){
    const p=s.plusone;
    const acc=s.accepted;
    const tickB=acc?'var(--gold)':'var(--border)';
    const pTick=`<div onclick="_grToggleAccept('${s.id}')" style="width:18px;height:18px;border-radius:5px;border:2px solid ${tickB};background:${acc?'var(--gold)':'transparent'};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">${acc?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</div>`;
    const pIcon=`<span style="width:22px;height:22px;border-radius:50%;background:rgba(196,168,130,.18);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:9.5px;font-weight:700;color:var(--gold-deep)">+1</span>`;
    const why=p.src==='suffix'?'Marked “+1” in the name':p.src==='rel'?'Relationship “Plus One”':'Plus-one entry';
    const high=s.confidence==='high';
    const pBadge=high
      ? `<span style="margin-left:auto;font-size:10px;font-weight:600;color:var(--green);background:rgba(74,124,89,.12);padding:2px 8px;border-radius:9px">${_escHtml(why)}</span>`
      : `<span style="margin-left:auto;font-size:10px;font-weight:600;color:var(--gold-deep);background:rgba(196,168,130,.18);padding:2px 8px;border-radius:9px">Plus-one · unsure</span>`;
    const host=_grGuest(p.hostId);
    const hostName=host?host.name:(p.hostName||'');
    const plusInits=_grInitials(p.cleanHostName||hostName);
    const plusPill=`<span style="background:rgba(196,168,130,.18);color:var(--gold-deep);font-size:10px;font-weight:700;padding:1px 7px;border-radius:9px;flex-shrink:0">+1 ${_escHtml(plusInits)}</span>`;
    const plusDisplay=p.plusId?(_grGuest(p.plusId)?.name||p.plusName):p.plusName;
    const border=acc?'1.5px solid var(--gold)':'1.5px solid var(--border)';
    return `<div style="border:${border};border-radius:11px;padding:11px 13px;background:var(--cream)">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">${pTick}${pIcon}<span style="font-size:13.5px;font-weight:600;color:var(--ink)">${_escHtml(hostName)} <span style="color:var(--muted);font-weight:500">· plus-one</span></span>${pBadge}</div>
      <div style="padding-left:25px;display:flex;flex-direction:column;gap:5px">
        <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink)"><span style="width:6px;height:6px;border-radius:50%;background:var(--sw-idle);flex-shrink:0"></span>${_escHtml(hostName)} <span style="font-size:10px;color:var(--muted)">host</span></div>
        <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink)"><span style="width:6px;height:6px;border-radius:50%;background:var(--sw-idle);flex-shrink:0"></span>${plusPill}<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_escHtml(plusDisplay)}</span>${p.plusId?'<span style="font-size:10px;color:var(--muted)">named +1</span>':'<span style="font-size:10px;color:var(--muted)">new +1</span>'}</div>
      </div>
    </div>`;
  }

  const high=s.confidence==='high';
  const memberCount=s.memberIds.length;
  const tooSmall=memberCount<2 && s.reason!=='amp';
  const tickBorder=s.accepted?'var(--gold)':'var(--border)';
  const tickBg=s.accepted?'var(--gold)':'transparent';
  const tick=`<div onclick="_grToggleAccept('${s.id}')" title="${tooSmall?'Needs at least 2 members':''}" style="width:18px;height:18px;border-radius:5px;border:2px solid ${tickBorder};background:${tickBg};display:flex;align-items:center;justify-content:center;cursor:${tooSmall?'not-allowed':'pointer'};flex-shrink:0;${tooSmall?'opacity:.4':''}">${s.accepted?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</div>`;
  const isCouple=s.kind==='couple';
  const icon=isCouple
    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="12" r="5.2"/><circle cx="15" cy="12" r="5.2"/></svg>`
    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.8" cy="7.5" r="2.7"/><path d="M2.5 20v-2a4 4 0 0 1 4-4 4 4 0 0 1 .6 0"/><circle cx="17.2" cy="7.5" r="2.7"/><path d="M21.5 20v-2a4 4 0 0 0-4-4 4 4 0 0 0-.6 0"/><circle cx="12" cy="11" r="2.1"/><path d="M8.4 20v-1.4a3.6 3.6 0 0 1 7.2 0V20"/></svg>`;
  const title=isCouple?(s.confidence==='low'?'Possible couple':'Couple'):`The ${_escHtml(s.surname||'Family')} Family`;
  const badge=high
    ? `<span style="margin-left:auto;font-size:10px;font-weight:600;color:var(--green);background:rgba(74,124,89,.12);padding:2px 8px;border-radius:9px">${s.reason==='amp'?'Same cell · "&amp;"':'Same address'}</span>`
    : `<span style="margin-left:auto;font-size:10px;font-weight:600;color:var(--gold-deep);background:rgba(196,168,130,.18);padding:2px 8px;border-radius:9px">Surname only · unsure</span>`;

  // ── Body: members. "&" suggestions are a fixed split (not draggable). ──
  let inner;
  if(s.reason==='amp' && s.splitFrom){
    inner=`<div style="padding-left:25px;font-size:12.5px;color:var(--ink)">${_escHtml(s.splitFrom.a)} <span style="color:var(--muted)">&amp;</span> ${_escHtml(s.splitFrom.b)}</div>`;
  } else {
    s.couples=s.couples||[];
    s.selForCouple=s.selForCouple||[];
    const coupledIds=new Set(s.couples.flat());
    // Nested couple blocks (families only — a couple-kind group is just its two members)
    let coupleBlocks='';
    if(s.kind==='family'){
      coupleBlocks=s.couples.map((pair,ci)=>{
        const g1=_grGuest(pair[0]), g2=_grGuest(pair[1]); if(!g1||!g2) return '';
        return `<div style="border:1px solid var(--gold);border-radius:9px;background:rgba(196,168,130,.10);padding:7px 9px">
          <div style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;letter-spacing:.04em;color:var(--gold-deep);margin-bottom:5px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="12" r="5.2"/><circle cx="15" cy="12" r="5.2"/></svg>COUPLE<span onclick="_grUnlinkSubCouple('${s.id}',${ci})" style="margin-left:auto;color:var(--muted);cursor:pointer;font-weight:400;font-size:11px">unlink</span></div>
          <div style="display:flex;flex-direction:column;gap:5px">${_grMemberRow(g1,s.id,{})}${_grMemberRow(g2,s.id,{})}</div>
        </div>`;
      }).join('');
    }
    // Loose members (not in a nested couple)
    const singles=s.memberIds.filter(id=>!coupledIds.has(id)).map(id=>{
      const g=_grGuest(id); if(!g) return '';
      const selectable=(s.kind==='family');
      const selected=(s.selForCouple||[]).includes(id);
      return _grMemberRow(g,s.id,{ removable:!selectable||true, selectable, selected });
    }).join('');
    // "Mark couple" control appears in families when exactly 2 singles are selected.
    let markRow='';
    if(s.kind==='family'){
      const nSel=(s.selForCouple||[]).length;
      const canMark=nSel===2;
      markRow=`<div style="display:flex;align-items:center;gap:8px;margin-top:2px">
        <button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 10px;color:var(--gold-deep);${canMark?'':'opacity:.45;cursor:not-allowed'}" ${canMark?'':'disabled'} onclick="_grMarkCouple('${s.id}')">Mark couple</button>
        <span style="font-size:10.5px;color:var(--muted)">${nSel===0?'Tick two members to nest them as a couple':nSel===1?'Tick one more':'Ready'}</span>
      </div>`;
    }
    inner=`<div data-gr-drop="${s.id}" ondragover="_grDragOver(event)" ondragleave="_grDragLeave(event)" ondrop="_grDrop(event,'${s.id}')" style="padding-left:25px;display:flex;flex-direction:column;gap:6px;border-radius:8px;transition:background .12s">
      ${coupleBlocks}${singles}${markRow}
    </div>`;
  }

  // Actions: amp keep-separate; couple↔family conversions for 2-member groups.
  let actions='';
  if(s.reason==='amp'){
    actions=`<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 9px" onclick="_grSplitAmp('${s.id}')">Not a couple \u2014 keep separate</button>`;
  } else if(isCouple && memberCount===2){
    actions=`<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 9px" onclick="_grPromoteFamily('${s.id}')">Make a family instead</button>`;
  } else if(!isCouple && memberCount===2 && (!s.couples||!s.couples.length)){
    actions=`<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 9px" onclick="_grDemoteCouple('${s.id}')">Make a couple instead</button>`;
  }
  const actionRow=actions?`<div style="padding-left:25px;margin-top:8px">${actions}</div>`:'';
  const dim=tooSmall?'opacity:.6':'';
  const border=s.accepted?'1.5px solid var(--gold)':'1.5px solid var(--border)';
  const note=tooSmall?`<div style="padding-left:25px;font-size:10.5px;color:var(--muted);margin-top:6px">Drag a guest back in \u2014 a group needs at least two people.</div>`:'';
  return `<div style="border:${border};border-radius:11px;padding:11px 13px;background:var(--cream);${dim}">
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">${tick}${icon}<span style="font-size:13.5px;font-weight:600;color:var(--ink)">${title}</span>${badge}</div>
    ${inner}${note}${actionRow}
  </div>`;
}

// Ungrouped tray — only shown once at least one guest is loose. Drop target.
function _grUngroupedTrayHtml(){
  _grLoose=_grLoose||[];
  const chips=_grLoose.map(id=>{ const g=_grGuest(id); if(!g) return '';
    return _grMemberRow(g,'__loose__',{});
  }).join('');
  const empty=!_grLoose.length;
  return `<div data-gr-drop="__loose__" ondragover="_grDragOver(event)" ondragleave="_grDragLeave(event)" ondrop="_grDrop(event,'__loose__')"
    style="border:1.5px dashed var(--sw-idle);border-radius:11px;padding:11px 13px;background:rgba(231,222,207,.20);${empty?'display:'+( _grDragActive?'block':'none'):'block'}">
    <div style="display:flex;align-items:center;gap:7px;font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:${empty?'0':'8px'}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Ungrouped \u2014 drop here to remove from a group
    </div>
    ${empty?'':`<div style="display:flex;flex-direction:column;gap:6px">${chips}</div>`}
  </div>`;
}

function _grFind(sid){ return _groupSuggestions.find(s=>s.id===sid); }
function _grToggleAccept(sid){ const s=_grFind(sid); if(!s) return; if(s.memberIds.length<2 && s.reason!=='amp') return; s.accepted=!s.accepted; _grRender(); }

// Remove a member: into the loose tray (and out of any nested couple).
function _grRemoveMember(sid,id){
  const s=_grFind(sid); if(!s) return;
  _grDetachFromCouple(s,id);
  s.memberIds=s.memberIds.filter(x=>x!==id);
  s.selForCouple=(s.selForCouple||[]).filter(x=>x!==id);
  _grLoose=_grLoose||[]; if(!_grLoose.includes(id)) _grLoose.push(id);
  if(s.memberIds.length<2) s.accepted=false;
  _grSyncKind(s);
  _grRender();
}
// Couple-select toggle inside a family (tick two, then Mark couple).
function _grToggleCoupleSel(sid,id){
  const s=_grFind(sid); if(!s) return;
  s.selForCouple=s.selForCouple||[];
  if(s.selForCouple.includes(id)) s.selForCouple=s.selForCouple.filter(x=>x!==id);
  else if(s.selForCouple.length<2) s.selForCouple.push(id);
  _grRender();
}
function _grMarkCouple(sid){
  const s=_grFind(sid); if(!s) return;
  if((s.selForCouple||[]).length!==2) return;
  s.couples=s.couples||[];
  s.couples.push([s.selForCouple[0], s.selForCouple[1]]);
  s.selForCouple=[];
  // Note: we deliberately do NOT auto-tick the family here. Marking a couple commits
  // that couple on Apply (see _grApply) even if the household stays unticked, so the
  // user's couple is never lost without forcing the whole family to be accepted.
  _grRender();
}
function _grUnlinkSubCouple(sid,ci){
  const s=_grFind(sid); if(!s||!s.couples) return;
  s.couples.splice(ci,1);
  _grRender();
}
// Remove an id from any nested couple of suggestion s.
function _grDetachFromCouple(s,id){
  if(!s.couples) return;
  s.couples=s.couples.map(p=>p.filter(x=>x!==id)).filter(p=>p.length===2);
}
function _grSyncKind(s){
  if(s.reason==='amp') return;
  // A box with a nested couple is necessarily a family; otherwise size decides.
  if((s.couples&&s.couples.length) || s.memberIds.length>2) s.kind='family';
  else s.kind='couple';
}
function _grPromoteFamily(sid){ const s=_grFind(sid); if(s){ s.kind='family'; _grRender(); } }
function _grDemoteCouple(sid){ const s=_grFind(sid); if(s){ s.couples=[]; s.kind='couple'; _grRender(); } }
function _grSplitAmp(sid){ _groupSuggestions=_groupSuggestions.filter(s=>s.id!==sid); _grRender(); }
function _grNotNow(){
  _groupReviewOpen=false;
  _groupBannerDismissed=true; // hide the floating bar...
  _groupBannerRemaining=0;
  if(_groupBannerTimer){ clearTimeout(_groupBannerTimer); _groupBannerTimer=null; }
  closeModalDirect();
  // ...but suggestions stay in memory; the cog/chip re-entry points remain available.
  saveToStorage();
  if(_currentPage==='guests') renderGuestList();
}

// ── Drag and drop ─────────────────────────────────────────────────────────────
let _grLoose=[];            // ids currently in the Ungrouped tray
let _grDragActive=false;    // a drag is in progress (reveals the empty tray)
let _grDrag=null;           // {fromSid, id}
function _grDragStart(ev,sid,id){
  _grDrag={ fromSid:sid, id };
  _grDragActive=true;
  try{ ev.dataTransfer.setData('text/plain',id); ev.dataTransfer.effectAllowed='move'; }catch(e){}
  // Reveal the tray (if empty) without a full re-render that would cancel the drag.
  const tray=document.querySelector('[data-gr-drop="__loose__"]');
  if(tray) tray.style.display='block';
}
function _grDragEnd(ev){
  _grDragActive=false; _grDrag=null;
  // Clear any hover highlight; collapse the empty tray again.
  document.querySelectorAll('[data-gr-drop]').forEach(el=>el.style.background='');
  _grRender();
}
function _grDragOver(ev){ ev.preventDefault(); try{ev.dataTransfer.dropEffect='move';}catch(e){}
  const t=ev.currentTarget; if(t) t.style.background='rgba(196,168,130,.12)';
}
function _grDragLeave(ev){ const t=ev.currentTarget; if(t) t.style.background=''; }
function _grDrop(ev,toSid){
  ev.preventDefault();
  const t=ev.currentTarget; if(t) t.style.background='';
  if(!_grDrag) return;
  const {fromSid,id}=_grDrag;
  if(fromSid===toSid){ _grDrag=null; return; }
  // Detach from origin
  if(fromSid==='__loose__'){ _grLoose=_grLoose.filter(x=>x!==id); }
  else {
    const from=_grFind(fromSid);
    if(from){
      _grDetachFromCouple(from,id);
      from.memberIds=from.memberIds.filter(x=>x!==id);
      from.selForCouple=(from.selForCouple||[]).filter(x=>x!==id);
      if(from.memberIds.length<2) from.accepted=false;
      _grSyncKind(from);
    }
  }
  // Attach to destination
  if(toSid==='__loose__'){ if(!_grLoose.includes(id)) _grLoose.push(id); }
  else {
    const to=_grFind(toSid);
    if(to){ if(!to.memberIds.includes(id)) to.memberIds.push(id); _grSyncKind(to);
      // Dragging someone into a group is grouping intent — keep it ticked.
      if(to.memberIds.length>=2) to.accepted=true; }
  }
  _grDrag=null;
  _grDragActive=false;
  _grRender();
}

// Commit a couple pairing to STATE (reused from the old flow).
function _sgCommitCouple(id1,id2){
  const g1=_grGuest(id1), g2=_grGuest(id2); if(!g1||!g2) return;
  if(g1.coupleId){const o=_grGuest(g1.coupleId);if(o){o.coupleId=null;o.plusOneId=null;}}
  if(g2.coupleId){const o=_grGuest(g2.coupleId);if(o){o.coupleId=null;o.plusOneId=null;}}
  g1.coupleId=g2.id; g1.relationship='Couple';
  g2.coupleId=g1.id; g2.relationship='Couple';
}

// Apply: commit every accepted group at once.
function _grApply(){
  const accepted=_groupSuggestions.filter(s=>s.accepted && _grIsLive(s));
  if(!STATE.families) STATE.families=[];
  // First, honour couples the user marked INSIDE families that they left UNticked.
  // Marking a couple is committed even when the household isn't accepted, so the
  // couple is never lost — but we do NOT create the family in that case.
  _groupSuggestions.forEach(s=>{
    if(s.accepted) return;                       // ticked families are handled below
    if(s.kind!=='family' || !s.couples || !s.couples.length) return;
    const ids=s.memberIds;
    s.couples.forEach(p=>{ if(ids.includes(p[0]) && ids.includes(p[1])) _sgCommitCouple(p[0],p[1]); });
  });
  accepted.forEach(s=>{
    // ── Plus-one: link host → +1 (named existing guest, or a new placeholder). ──
    if(s.kind==='plusone' && s.plusone){
      const p=s.plusone;
      const host=_grGuest(p.hostId); if(!host) return;
      if(host.plusOneId || host.coupleId) return; // host already paired — skip
      if(p.plusId){
        // Existing imported guest (named +1, or a "+1 (Host)" placeholder row).
        const plus=_grGuest(p.plusId); if(!plus) return;
        if(plus.coupleId){ const o=_grGuest(plus.coupleId); if(o){o.coupleId=null;o.plusOneId=null;} }
        const ptags=[...(plus.tags||[])]; if(!ptags.includes('+1')) ptags.unshift('+1');
        plus.tags=ptags; plus.relationship='Plus One'; plus.isMain=false;
        plus.coupleId=host.id; plus.plusOneId=null; plus.plusOne=false;
        plus.listType=host.listType||plus.listType||'A';
        host.plusOneId=plus.id; host.plusOne=true;
      } else {
        // Suffix case ("Jane Doe +1"): strip the marker from the host cell and
        // create an unnamed placeholder "+1 (Host)" entry.
        if(p.cleanHostName) host.name=p.cleanHostName;
        const htags=[...(host.tags||[])];
        const plusTags=htags.slice(); if(!plusTags.includes('+1')) plusTags.unshift('+1');
        const plusId=uid();
        const plusGuest={ id:plusId, name:_plusOneHostLabel(host.name), rsvp:'awaiting',
          dietary:[], tags:plusTags, phone:'', email:'', address:host.address||'',
          relationship:'Plus One', coupleId:host.id, plusOneId:null, plusOne:false,
          isMain:false, notes:'', listType:host.listType||'A' };
        STATE.guests.push(plusGuest);
        if(_newlyImportedIds && _newlyImportedIds.add) _newlyImportedIds.add(plusId);
        host.plusOneId=plusId; host.plusOne=true;
      }
      return;
    }
    if(s.reason==='amp' && s.splitFrom){
      const g=_grGuest(s.splitFrom.id); if(!g) return;
      g.name=s.splitFrom.a;
      const g2={ id:uid(), name:s.splitFrom.b, rsvp:g.rsvp||'awaiting',
        dietary:[], tags:(g.tags||[]).slice(), phone:'', email:'',
        address:g.address||'', coupleId:null, plusOneId:null, plusOne:false,
        relationship:'Couple', isMain:false, notes:'', listType:g.listType||'A' };
      STATE.guests.push(g2);
      if(_newlyImportedIds && _newlyImportedIds.add) _newlyImportedIds.add(g2.id);
      _sgCommitCouple(g.id, g2.id);
      return;
    }
    const ids=s.memberIds.slice();
    if(ids.length<2) return;
    if(s.kind==='couple' && ids.length===2 && (!s.couples||!s.couples.length)){
      _sgCommitCouple(ids[0], ids[1]);
    } else {
      // Family: first commit any nested couples, then create the household.
      (s.couples||[]).forEach(p=>{ if(ids.includes(p[0])&&ids.includes(p[1])) _sgCommitCouple(p[0],p[1]); });
      STATE.families.forEach(f=>{ f.memberIds=f.memberIds.filter(id=>!ids.includes(id)); });
      STATE.families=STATE.families.filter(f=>f.memberIds.length>0);
      STATE.families.push({ id:'fam'+Date.now()+Math.random().toString(36).slice(2,5),
        name:`The ${s.surname||'Family'} Family`, memberIds:ids });
    }
  });
  saveToStorage();
  _groupSuggestions=[]; _grLoose=[]; _grDragActive=false; _grDrag=null;
  _groupBannerDismissed=true;
  _groupReviewOpen=false; _groupBannerRemaining=0;
  if(_groupBannerTimer){ clearTimeout(_groupBannerTimer); _groupBannerTimer=null; }
  closeModalDirect();
  navigate('guests');
}

function bulkLinkFamily(){
  const ids=[...bulkSelected];
  if(ids.length<2){ alert('Please select at least 2 guests to link as a family.'); return; }
  const guests=ids.map(id=>STATE.guests.find(g=>g.id===id)).filter(Boolean);

  // Check if any selected guest is already in a family
  const existingFamilies=(STATE.families||[]).filter(f=>f.memberIds.some(id=>ids.includes(id)));
  const existingNote=existingFamilies.length
    ? `<div style="font-size:12px;color:var(--gold-deep);background:rgba(196,168,130,.1);border-radius:6px;padding:6px 10px;margin-top:8px">Some selected guests are already in a family group. They will be moved to the new group.</div>`
    : '';

  openModal('Link as Family',`
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--ink)">Create Family Group</div>
      <div class="form-group">
        <label class="form-label">Family Group Name</label>
        <input class="form-input" id="fam-name" placeholder="e.g. The Smith Family" value="The ${guests[0]?.name.split(' ').pop()||''} Family"/>
      </div>
      <div>
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:8px">Members (${guests.length})</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:220px;overflow-y:auto">
          ${guests.map(g=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--parchment);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--gold-deep);flex-shrink:0">${initials(g.name)}</div>
            <div style="font-size:13px;color:var(--ink)">${g.name}</div>
            ${(STATE.families||[]).some(f=>f.memberIds.includes(g.id))?`<span style="font-size:10px;color:var(--muted);margin-left:auto">in a family</span>`:''}
          </div>`).join('')}
        </div>
      </div>
      ${existingNote}
    </div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-primary" onclick="confirmBulkLinkFamily(${JSON.stringify(ids).replace(/"/g,"'")})">Create Group</button>`);
}

function confirmBulkLinkFamily(idsJson){
  const ids = typeof idsJson==='string' ? JSON.parse(idsJson.replace(/'/g,'"')) : idsJson;
  const name=(document.getElementById('fam-name')?.value||'').trim()||'Family Group';
  if(!STATE.families) STATE.families=[];

  // Remove selected guests from any existing family groups
  STATE.families.forEach(f=>{ f.memberIds=f.memberIds.filter(id=>!ids.includes(id)); });
  STATE.families=STATE.families.filter(f=>f.memberIds.length>0);

  // Create new family group
  STATE.families.push({ id:'fam'+Date.now(), name, memberIds:[...ids] });

  bulkSelected.clear();
  saveToStorage(); closeModalDirect(); navigate('guests');
}

function openEditCouple(id1, id2){
  const g1=STATE.guests.find(g=>g.id===id1);
  const g2=STATE.guests.find(g=>g.id===id2);
  if(!g1||!g2) return;
  const _rel=(g1.relationship&&g1.relationship!=='Couple'&&g1.relationship!=='Guest'&&g1.relationship!=='Plus One')?g1.relationship:'Couple';
  const _isCouple=_rel==='Couple';
  const _title=_isCouple?'Edit Couple':'Edit link';
  const _unlinkLabel=_isCouple?'Unlink Couple':`Unlink ${_rel.toLowerCase()}`;
  openModal(_title,`
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="flex:1;background:var(--parchment);border-radius:10px;padding:10px 14px">
          <div style="font-size:13px;font-weight:500;color:var(--ink)">${g1.name}</div>
          ${g1.relationship&&g1.relationship!=='Couple'?`<div style="font-size:11px;color:var(--muted)">${g1.relationship}</div>`:''}
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="5.2"/><circle cx="15" cy="12" r="5.2"/></svg>
        <div style="flex:1;background:var(--parchment);border-radius:10px;padding:10px 14px">
          <div style="font-size:13px;font-weight:500;color:var(--ink)">${g2.name}</div>
          ${g2.relationship&&g2.relationship!=='Couple'?`<div style="font-size:11px;color:var(--muted)">${g2.relationship}</div>`:''}
        </div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px">
        <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px;font-weight:500">Member order</div>
        <button class="btn btn-outline btn-sm" onclick="swapCoupleOrder('${id1}','${id2}')" style="display:inline-flex;align-items:center;gap:5px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          Swap order (${g1.name} ↔ ${g2.name})
        </button>
      </div>
      <div style="background:rgba(180,60,60,.06);border:1px solid rgba(180,60,60,.15);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--muted);line-height:1.5">
        Unlinking will separate these two guests into individual entries. They will remain in any shared family groups.
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-danger" onclick="unlinkCouple('${id1}','${id2}')">${_unlinkLabel}</button>`);
}

function swapCoupleOrder(id1, id2){
  const i1=STATE.guests.findIndex(g=>g.id===id1);
  const i2=STATE.guests.findIndex(g=>g.id===id2);
  if(i1<0||i2<0) return;
  [STATE.guests[i1],STATE.guests[i2]]=[STATE.guests[i2],STATE.guests[i1]];
  saveToStorage(); closeModalDirect(); navigate('guests');
}

function unlinkCouple(id1, id2){
  const _clear=g=>{ if(g){ g.coupleId=null; if(g.relationship==='Couple'||g.relationship==='Sibling'||g.relationship==='Plus One') g.relationship='Guest'; } };
  _clear(STATE.guests.find(g=>g.id===id1));
  _clear(STATE.guests.find(g=>g.id===id2));
  saveToStorage(); closeModalDirect(); navigate('guests');
}

function openEditFamily(famId){
  const fam=(STATE.families||[]).find(f=>f.id===famId);
  if(!fam) return;
  const allGuests=STATE.guests;
  const memberSet=new Set(fam.memberIds);
  const memberRows=fam.memberIds.map((id,idx)=>{
    const g=allGuests.find(x=>x.id===id);
    if(!g) return '';
    return`<div id="efam-row-${idx}" style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
      <div style="display:flex;flex-direction:column;gap:1px;flex-shrink:0">
        <button onclick="moveFamilyMember('${famId}',${idx},-1)" ${idx===0?'disabled':''} style="background:none;border:none;cursor:${idx===0?'default':'pointer'};color:${idx===0?'var(--border)':'var(--muted)'};padding:1px;line-height:1;display:flex;align-items:center">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button onclick="moveFamilyMember('${famId}',${idx},1)" ${idx===fam.memberIds.length-1?'disabled':''} style="background:none;border:none;cursor:${idx===fam.memberIds.length-1?'default':'pointer'};color:${idx===fam.memberIds.length-1?'var(--border)':'var(--muted)'};padding:1px;line-height:1;display:flex;align-items:center">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      <div style="width:26px;height:26px;border-radius:50%;background:var(--parchment);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--gold-deep);flex-shrink:0">${initials(g.name)}</div>
      <div style="flex:1;font-size:13px;color:var(--ink)">${g.name}</div>
      <button onclick="removeFamilyMember('${famId}','${id}')" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px 4px;border-radius:4px;display:flex;align-items:center" title="Remove">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
  }).join('');

  const addableGuests=allGuests.filter(g=>!memberSet.has(g.id));
  const addOpts=addableGuests.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');

  const _isHouse=fam.kind==='household';
  openModal(_isHouse?'Edit Household':'Edit Family Group',`
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">Group Name</label>
        <input class="form-input" id="efam-name" value="${fam.name}"/>
      </div>
      <div>
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:8px">Members</div>
        <div id="efam-members" style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto;margin-bottom:10px">${memberRows}</div>
        ${addableGuests.length?`<div style="display:flex;gap:8px;align-items:center">
          <select class="form-input" id="efam-add-select" style="flex:1">
            <option value="">Add a guest…</option>
            ${addOpts}
          </select>
          <button class="btn btn-outline btn-sm" onclick="addFamilyMember('${famId}')">Add</button>
        </div>`:'<div style="font-size:12px;color:var(--muted)">All guests are already in this group.</div>'}
      </div>
    </div>`,
    `<button class="btn btn-danger btn-sm" style="margin-right:auto" onclick="deleteFamilyGroup('${famId}')">Delete Group</button>
     <button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-primary" onclick="saveEditFamily('${famId}')">Save</button>`);
}

function moveFamilyMember(famId, idx, dir){
  const fam=(STATE.families||[]).find(f=>f.id===famId);
  if(!fam) return;
  const newIdx=idx+dir;
  if(newIdx<0||newIdx>=fam.memberIds.length) return;
  [fam.memberIds[idx],fam.memberIds[newIdx]]=[fam.memberIds[newIdx],fam.memberIds[idx]];
  saveToStorage();
  openEditFamily(famId); // refresh modal
}
function saveEditFamily(famId){
  const fam=(STATE.families||[]).find(f=>f.id===famId);
  if(!fam) return;
  const name=(document.getElementById('efam-name')?.value||'').trim();
  if(name) fam.name=name;
  saveToStorage(); closeModalDirect(); navigate('guests');
}

function addFamilyMember(famId){
  const fam=(STATE.families||[]).find(f=>f.id===famId);
  const sel=document.getElementById('efam-add-select');
  if(!fam||!sel||!sel.value) return;
  const newId=sel.value;
  // Remove from any other family first
  STATE.families.forEach(f=>{ if(f.id!==famId) f.memberIds=f.memberIds.filter(id=>id!==newId); });
  if(!fam.memberIds.includes(newId)) fam.memberIds.push(newId);
  saveToStorage();
  openEditFamily(famId); // Refresh modal
}

function removeFamilyMember(famId, memberId){
  const fam=(STATE.families||[]).find(f=>f.id===famId);
  if(!fam) return;
  fam.memberIds=fam.memberIds.filter(id=>id!==memberId);
  if(fam.memberIds.length<1) STATE.families=STATE.families.filter(f=>f.id!==famId);
  saveToStorage();
  if((STATE.families||[]).find(f=>f.id===famId)) openEditFamily(famId);
  else { closeModalDirect(); navigate('guests'); }
}

function deleteFamilyGroup(famId){
  const fam=(STATE.families||[]).find(f=>f.id===famId);
  _confirmDeleteDialog({title:'Remove Family Group', question:'Remove this family group?', name:fam?(fam.name||fam.label||''):'', verb:'Remove', noteVerb:'removed (its members will remain as individual guests)', onConfirmJs:`confirmDeleteFamilyGroup('${famId}')`});
}
function confirmDeleteFamilyGroup(famId){
  const _f0=(STATE.families||[]).find(f=>f.id===famId);
  const _label=_f0?(_f0.name||_f0.label||'family group'):'family group';
  closeModalDirect();
  _undoableDelete(_label, ()=>{
    STATE.families=(STATE.families||[]).filter(f=>f.id!==famId);
  }, 'guests');
}

// ══════════════════════════════════════════════
