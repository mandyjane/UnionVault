// PRINT / EXPORT HUB — one place to print or save-as-PDF the four shareable
// documents: Guest List, Seating Plan, Day-of Timeline, Budget. Reuses the
// reliable self-printing-iframe pattern from the seating plan (window.open is
// blocked in sandboxed app views). Launched from a Dashboard hero button.
// ══════════════════════════════════════════════
function _exportSlug(base){
  const ev=STATE.event||{};
  const couple=[ev.partner1,ev.partner2].filter(Boolean).join(' & ');
  const s=(couple?couple+' '+base:base).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return s||base;
}
// Shared light palette + sheet CSS so every export reads well regardless of theme.
const _EXPORT_DOC_CSS=`
  *{box-sizing:border-box}
  body{margin:0;background:#F4EFE8;color:#3A352F;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.5;padding:28px}
  .sheet{max-width:640px;margin:0 auto;background:#fff;border:1px solid #E7DECF;border-radius:16px;padding:22px 34px 30px;box-shadow:0 8px 40px rgba(0,0,0,.08)}
  .x-head{text-align:center;border-bottom:1px solid #E7DECF;padding-bottom:10px;margin-bottom:16px}
  .x-couple{font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:.04em;color:#9A7B2E;margin-bottom:1px}
  .x-title{font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:600;color:#3A352F;margin:2px 0 0}
  .x-meta{font-size:12px;color:#9A9389;margin-top:3px}
  .x-section{font-size:10.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:#9A7B2E;margin:22px 0 9px}
  table{width:100%;border-collapse:collapse}
  td,th{text-align:left;vertical-align:top}
  .x-row td{padding:8px 0;border-bottom:.5px solid #EFE8DC;font-size:13px}
  .x-row:last-child td{border-bottom:none}
  .x-r{text-align:right;color:#9A9389}
  .x-time{white-space:nowrap;font-weight:600;color:#9A7B2E;width:78px}
  .x-foot{text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:#B4AFA4;font-size:12px;margin-top:28px;padding-top:16px;border-top:1px solid #E7DECF}
  @media print{body{background:#fff;padding:0}.sheet{border:none;box-shadow:none;border-radius:0;max-width:none}@page{margin:16mm}}
`;
function _exportDocShell(title, innerHtml, autoPrint){
  const ev=STATE.event||{};
  const couple=[ev.partner1,ev.partner2].filter(Boolean).join(' & ');
  const meta=[ev.date?fmtDate(ev.date):'', ev.venue||''].filter(Boolean).join(' · ');
  const fonts='<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">';
  const printScript=autoPrint?`<script>window.addEventListener('load',function(){setTimeout(function(){try{window.focus();window.print();}catch(e){}},350);});<\/script>`:'';
  const bar=autoPrint?`<div style="max-width:640px;margin:0 auto 14px;display:flex;gap:12px;align-items:center" class="no-print"><button onclick="window.print()" style="font-family:inherit;font-size:13px;font-weight:600;color:#fff;background:#9A7B2E;border:none;border-radius:8px;padding:9px 16px;cursor:pointer">Save as PDF</button><span style="font-size:12px;color:#9A9389">Use your browser's print dialog and choose “Save as PDF”.</span></div><style>@media print{.no-print{display:none!important}}</style>`:'';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}${couple?' — '+couple:''}</title>${fonts}<style>${_EXPORT_DOC_CSS}</style></head><body>${bar}<div class="sheet">
    <div class="x-head">${couple?`<div class="x-couple">${_escHtml(couple)}</div>`:''}<div class="x-title">${title}</div>${meta?`<div class="x-meta">${_escHtml(meta)}</div>`:''}</div>
    ${innerHtml}
    <div class="x-foot">Union Vault</div>
  </div>${printScript}</body></html>`;
}

// ── Per-document inner-HTML builders ──
// Guest List export options (cog popover). Columns are additive; grouping inserts
// sub-headers; sort is attendance-grouped or a single alphabetical list. B-List guests
// always render under their own heading at the bottom.
const _EXPORT_GUEST_DEFAULTS = { cols:{phone:true,email:true,address:true,tags:false,table:false,rsvp:false,invited:false,dietary:false}, emailWrap:false, groupCouples:false, groupFamilies:false, sort:'attendance', includeBList:false };
// Persisted across sessions via STATE.settings.exportGuestOpts; falls back to the
// defaults above on first use (Phone, Email, Address).
let _exportGuestOpts = JSON.parse(JSON.stringify(_EXPORT_GUEST_DEFAULTS));
function _exportGuestLoadOpts(){
  try{
    const saved = STATE && STATE.settings && STATE.settings.exportGuestOpts;
    if(saved){
      _exportGuestOpts = {
        cols: Object.assign({}, _EXPORT_GUEST_DEFAULTS.cols, saved.cols||{}),
        emailWrap: !!saved.emailWrap,
        groupCouples: !!saved.groupCouples,
        groupFamilies: !!saved.groupFamilies,
        sort: saved.sort||_EXPORT_GUEST_DEFAULTS.sort,
        includeBList: !!saved.includeBList
      };
    } else {
      _exportGuestOpts = JSON.parse(JSON.stringify(_EXPORT_GUEST_DEFAULTS));
    }
  }catch(e){ _exportGuestOpts = JSON.parse(JSON.stringify(_EXPORT_GUEST_DEFAULTS)); }
}
function _exportGuestSaveOpts(){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.exportGuestOpts = JSON.parse(JSON.stringify(_exportGuestOpts));
  if(typeof saveToStorage==='function') saveToStorage();
}

function _exportGuestColDefs(){
  return [ ['phone','Phone'], ['email','Email'], ['address','Address'], ['rsvp','RSVP'], ['invited','Invited'], ['dietary','Dietary'], ['tags','Tags'], ['table','Table'] ];
}
function _exportGuestCellValue(g, key, tableOf, invitedIds){
  if(key==='table') return tableOf[g.id]||'';
  if(key==='phone') return g.phone||'';
  if(key==='email') return g.email||'';
  if(key==='address') return g.address||'';
  if(key==='tags') return (g.tags&&g.tags.length)?g.tags.join(', '):'';
  if(key==='dietary') return (g.dietary&&g.dietary.length)?g.dietary.map(d=>(d==='allergy'||d==='other')?_dietWord(g,d,'paren'):d.charAt(0).toUpperCase()+d.slice(1)).join(', '):'';
  if(key==='invited') return invitedIds&&invitedIds.has(g.id)?'Yes':'No';
  if(key==='rsvp'){
    const s=g.rsvp==='attending'?'Attending':g.rsvp==='declined'?'Declined':'Awaiting';
    if(g.rsvpDate&&g.rsvp&&g.rsvp!=='awaiting'){
      try{ const d=new Date(g.rsvpDate); const ds=d.toLocaleDateString('en-AU',{day:'numeric',month:'short'}); return s+' · '+ds; }catch(x){}
    }
    return s;
  }
  return '';
}
// Order a flat array of guests by the active grouping (couples, then families, then
// individuals), inserting labelled sub-header rows. Returns an array of {type,...}.
function _exportGuestGrouped(arr){
  const opts=_exportGuestOpts;
  if(!opts.groupCouples && !opts.groupFamilies){ return arr.map(g=>({type:'guest',g})); }
  const byId={}; arr.forEach(g=>byId[g.id]=g);
  const used=new Set();
  const out=[];
  // Families first if enabled
  if(opts.groupFamilies){
    (STATE.families||[]).forEach(fam=>{
      const members=fam.memberIds.map(id=>byId[id]).filter(Boolean).filter(g=>!used.has(g.id));
      if(members.length){
        out.push({type:'group',label:`Family · ${fam.name} (${members.length})`});
        members.forEach(g=>{ out.push({type:'guest',g}); used.add(g.id); });
      }
    });
  }
  // Couples next if enabled
  if(opts.groupCouples){
    arr.forEach(g=>{
      if(used.has(g.id)||!g.coupleId) return;
      const partner=byId[g.coupleId];
      if(!partner||used.has(partner.id)) return;
      const pair=[g,partner].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
      const nm=pair.map(p=>(p.name||'').split(' ').slice(-1)[0]).filter(Boolean);
      out.push({type:'group',label:`Couple${nm.length?' · '+[...new Set(nm)].join(' & '):''}`});
      pair.forEach(p=>{ out.push({type:'guest',g:p}); used.add(p.id); });
    });
  }
  // Remaining individuals
  const rest=arr.filter(g=>!used.has(g.id));
  if(rest.length){
    if(out.length) out.push({type:'group',label:'Individual guests'});
    rest.forEach(g=>out.push({type:'guest',g}));
  }
  return out;
}
function _exportGuestListInner(){
  const opts=_exportGuestOpts;
  const tableOf={};
  (STATE.tables||[]).forEach(t=>{ _seatIds(t.id).forEach(gid=>{ tableOf[gid]=t.name||('Table '+(t.label||'')); }); });
  const invitedIds=(typeof _invitedGuestIdSet==='function')?_invitedGuestIdSet():new Set();
  const all=(STATE.guests||[]);
  const aList=all.filter(g=>(g.listType||'A')!=='B');
  const bList=all.filter(g=>(g.listType||'A')==='B');

  const activeCols=_exportGuestColDefs().filter(([k])=>opts.cols[k]);
  const colCount=1+activeCols.length;
  const headRow=`<tr>${`<th>Name</th>`}${activeCols.map(([k,lbl])=>`<th>${lbl}</th>`).join('')}</tr>`;
  const cellHtml=(g,k)=>{
    const raw=_exportGuestCellValue(g,k,tableOf,invitedIds);
    const esc=_escHtml(raw);
    if(k==='email' && raw.includes('@')){
      return esc.replace('@','<wbr>@');
    }
    return esc;
  };
  const cellStyle=(k)=>{
    if(k==='phone') return ' style="white-space:nowrap"';
    if(k==='address') return ' style="word-break:break-word;min-width:90px"';
    if(k==='email') return ' class="x-rl x-email-col" style="word-break:break-word"';
    if(k==='rsvp') return ' style="white-space:nowrap"';
    if(k==='invited') return ' style="white-space:nowrap"';
    return '';
  };
  const guestRow=(g)=>`<tr class="x-row"><td>${_escHtml(g.name||'')}</td>${activeCols.map(([k])=>{
    if(k==='email') return `<td class="x-rl x-email-col" style="word-break:break-word">${cellHtml(g,k)}</td>`;
    return `<td class="x-rl"${cellStyle(k)}>${cellHtml(g,k)}</td>`;
  }).join('')}</tr>`;
  const groupRow=(label)=>`<tr class="x-grp"><td colspan="${colCount}" style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:#9A7B2E;font-size:13px;padding-top:9px">${_escHtml(label)}</td></tr>`;
  const renderRows=(arr)=>_exportGuestGrouped(arr).map(r=>r.type==='group'?groupRow(r.label):guestRow(r.g)).join('');
  const tableBlock=(arr)=>`<table>${headRow}${renderRows(arr)}</table>`;

  // Build A-List body by sort mode
  let body='';
  if(opts.sort==='alphabetical'){
    const sorted=[...aList].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    body = sorted.length ? tableBlock(sorted) : '';
  } else {
    const groups={attending:[],awaiting:[],declined:[]};
    aList.forEach(g=>{ const k=g.rsvp==='attending'?'attending':g.rsvp==='declined'?'declined':'awaiting'; groups[k].push(g); });
    const sec=(label,arr)=>arr.length?`<div class="x-section">${label} (${arr.length})</div>${tableBlock(arr)}`:'';
    body = sec('Attending',groups.attending)+sec('Awaiting reply',groups.awaiting)+sec('Declined',groups.declined);
  }

  // B-List at the bottom under its own heading (only when opted in)
  let bBlock='';
  if(opts.includeBList && bList.length){
    const bArr = opts.sort==='alphabetical' ? [...bList].sort((a,b)=>(a.name||'').localeCompare(b.name||'')) : bList;
    bBlock = `<div class="x-section x-blist" style="margin-top:24px;border-top:2px solid #E7DECF;padding-top:12px">B-List (${bList.length})</div>${tableBlock(bArr)}`;
  }

  const total=all.length;
  const gA={attending:all.filter(g=>g.rsvp==='attending').length, declined:all.filter(g=>g.rsvp==='declined').length};
  const awaiting=total-gA.attending-gA.declined;
  const summary=`<div class="x-meta" style="text-align:center;margin-top:-8px">${total} guests · ${gA.attending} attending · ${gA.declined} declined · ${awaiting} awaiting</div>`;
  const inner=(body||bBlock)?(body+bBlock):`<div style="text-align:center;color:#9A9389;padding:24px">No guests added yet.</div>`;
  return summary+inner;
}
// ── Guest List export cog popover ───────────────────────────────────────────
function _exportGuestCogHtml(){
  const o=_exportGuestOpts;
  const chk=(on)=>`<span style="width:15px;height:15px;border-radius:4px;border:1.5px solid ${on?'var(--gold-deep)':'#C0A56A'};background:${on?'var(--gold-deep)':'transparent'};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center">${on?'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</span>`;
  const radio=(on)=>`<span style="width:15px;height:15px;border-radius:50%;border:1.5px solid ${on?'var(--gold-deep)':'#C0A56A'};${on?'box-shadow:inset 0 0 0 3px var(--gold-deep)':''};flex-shrink:0"></span>`;
  const grpLbl=(t)=>`<div style="font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:11px 0 5px">${t}</div>`;
  const chkSm=(on)=>`<span style="width:13px;height:13px;border-radius:4px;border:1.5px solid ${on?'var(--gold-deep)':'#C0A56A'};background:${on?'var(--gold-deep)':'transparent'};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center">${on?'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</span>`;
  const colRow=([k,lbl])=>{
    const main=`<label onclick="_exportGuestToggleCol('${k}')" style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12.5px;cursor:pointer">${chk(o.cols[k])}${lbl}</label>`;
    // Email gets an indented "Wrap at @" sub-option while Email is ticked.
    if(k==='email' && o.cols.email){
      return main+`<label onclick="_exportGuestToggleEmailWrap()" style="display:flex;align-items:center;gap:7px;padding:3px 0 3px 24px;font-size:11.5px;color:var(--muted);cursor:pointer">${chkSm(o.emailWrap)}Wrap at "@"</label>`;
    }
    return main;
  };
  return `<div id="export-guest-cog-pop" style="position:absolute;top:50px;right:14px;width:210px;background:var(--cream);border:1px solid var(--border);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:11px 13px 13px;z-index:30" onclick="event.stopPropagation()">
    <div style="font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:5px">Columns</div>
    ${_exportGuestColDefs().map(colRow).join('')}
    ${grpLbl('Include')}
    <label onclick="_exportGuestToggleInclude('aList')" style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12.5px;cursor:pointer">${chk(true)}A-list guests</label>
    <label onclick="_exportGuestToggleInclude('bList')" style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12.5px;cursor:pointer">${chk(o.includeBList)}B-list guests</label>
    ${grpLbl('Group by')}
    <label onclick="_exportGuestToggleGroup('couples')" style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12.5px;cursor:pointer">${chk(o.groupCouples)}Couples</label>
    <label onclick="_exportGuestToggleGroup('families')" style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12.5px;cursor:pointer">${chk(o.groupFamilies)}Families</label>
    ${grpLbl('Sort by')}
    <label onclick="_exportGuestSetSort('attendance')" style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12.5px;cursor:pointer">${radio(o.sort==='attendance')}Attendance</label>
    <label onclick="_exportGuestSetSort('alphabetical')" style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12.5px;cursor:pointer">${radio(o.sort==='alphabetical')}Alphabetical</label>
  </div>`;
}
let _exportGuestCogOpen=false;
function _exportGuestToggleCog(e){
  if(e) e.stopPropagation();
  _exportGuestCogOpen=!_exportGuestCogOpen;
  const wrap=document.getElementById('export-guest-cog-wrap');
  if(!wrap) return;
  const existing=document.getElementById('export-guest-cog-pop');
  if(_exportGuestCogOpen){
    if(!existing) wrap.insertAdjacentHTML('beforeend', _exportGuestCogHtml());
    setTimeout(()=>{
      const closer=(ev)=>{ const p=document.getElementById('export-guest-cog-pop'); if(p && !p.contains(ev.target)){ _exportGuestCogOpen=false; if(p)p.remove(); document.removeEventListener('click',closer); } };
      document.addEventListener('click',closer);
    },0);
  } else if(existing){ existing.remove(); }
}
function _exportGuestRerender(){
  const b=document.getElementById('export-preview-body');
  if(b) b.innerHTML=_exportPreviewBodyHtml('guests');
  // keep the popover open and in sync
  const p=document.getElementById('export-guest-cog-pop');
  if(p){ p.outerHTML=_exportGuestCogHtml(); }
}
function _exportGuestToggleCol(k){ _exportGuestOpts.cols[k]=!_exportGuestOpts.cols[k]; _exportGuestSaveOpts(); _exportGuestRerender(); }
function _exportGuestToggleEmailWrap(){ _exportGuestOpts.emailWrap=!_exportGuestOpts.emailWrap; _exportGuestSaveOpts(); _exportGuestRerender(); }
function _exportGuestToggleGroup(which){ if(which==='couples') _exportGuestOpts.groupCouples=!_exportGuestOpts.groupCouples; else _exportGuestOpts.groupFamilies=!_exportGuestOpts.groupFamilies; _exportGuestSaveOpts(); _exportGuestRerender(); }
function _exportGuestToggleInclude(which){ if(which==='bList'){ _exportGuestOpts.includeBList=!_exportGuestOpts.includeBList; _exportGuestSaveOpts(); _exportGuestRerender(); } }
function _exportGuestSetSort(s){ _exportGuestOpts.sort=s; _exportGuestSaveOpts(); _exportGuestRerender(); }
function _exportTimelineInner(){
  const items=(typeof tlSorted==='function')?tlSorted():(STATE.timeline||[]);
  if(!items.length) return `<div style="text-align:center;color:#9A9389;padding:24px">No moments added yet.</div>`;
  const rows=items.map(it=>{
    const cat=(typeof TL_CATS!=='undefined'&&TL_CATS[it.cat])?TL_CATS[it.cat]:null;
    const meta=[it.location,it.who].filter(Boolean).join(' · ');
    const t=(typeof tlTo12h==='function')?(tlTo12h(it.time)||'—'):(it.time||'—');
    return `<tr class="x-row"><td class="x-time">${t}</td><td><div style="font-size:14px;font-weight:600">${_escHtml(it.title||'')}${cat?` <span style="font-size:9.5px;font-weight:600;color:${cat.color};text-transform:uppercase;letter-spacing:.05em;margin-left:5px">${cat.label}</span>`:''}</div>${meta?`<div style="font-size:12px;color:#777">${_escHtml(meta)}</div>`:''}${it.notes?`<div style="font-size:12px;color:#999;margin-top:1px">${_escHtml(it.notes)}</div>`:''}</td></tr>`;
  }).join('');
  return `<table>${rows}</table>`;
}
function _exportBudgetInner(){
  const f=(typeof _budgetSummaryFigures==='function')?_budgetSummaryFigures():{totalCost:0,totalPaid:0,budgetTotal:0};
  const remaining=(f.budgetTotal||0)-(f.totalCost||0);
  const money=(typeof fmt==='function')?fmt:(n)=>'$'+Math.round(n||0).toLocaleString();
  const over=f.budgetTotal&&f.totalCost>f.budgetTotal;
  const r=(k,v,col)=>`<tr class="x-row"><td>${k}</td><td class="x-r" style="${col?'color:'+col:''}">${money(v)}</td></tr>`;
  let body=`<table>${r('Total budget',f.budgetTotal)}${r('Committed',f.totalCost)}${r('Paid',f.totalPaid,'#5C8A4E')}${r('Left to pay',Math.max(0,f.totalCost-f.totalPaid))}${r(over?'Over budget by':'Unallocated',Math.abs(remaining),over?'#A23B1E':'')}</table>`;
  // Per-item breakdown
  const items=STATE.budget.items||[];
  if(items.length){
    const itemRows=items.map(b=>{
      const tot=(typeof calcBudgetItemTotal==='function')?calcBudgetItemTotal(b):Number(b.cost||0);
      return `<tr class="x-row"><td>${_escHtml(b.name||'Item')}</td><td class="x-r">${money(tot)}</td></tr>`;
    }).join('');
    body+=`<div class="x-section">Items</div><table>${itemRows}</table>`;
  }
  return body;
}

// The four export definitions.
// Budget preview can show a compact table or the full Budget-page summary report.
let _exportBudgetMode='compact'; // 'compact' | 'full'
const _EXPORT_DOCS={
  guests:   { title:'Guest List',      icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', desc:'Names, RSVP, table & dietary', inner:_exportGuestListInner },
  seating:  { title:'Seating Plan',   icon:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>', desc:'Floor map + who sits where', doc:(autoPrint)=>_seatingPlanDoc(autoPrint), slug:'seating-plan' },
  timeline: { title:'Day-of Timeline', icon:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', desc:'Run sheet for the day', inner:_exportTimelineInner },
  budget:   { title:'Budget',          icon:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', desc:'Allocated, paid & remaining', inner:_exportBudgetInner },
};
function _exportBuildDoc(key, autoPrint){
  const def=_EXPORT_DOCS[key]; if(!def) return '';
  // Budget "Full summary" reuses the Budget-page report document.
  if(key==='budget' && _exportBudgetMode==='full' && typeof _buildBudgetSummaryDoc==='function'){
    return _buildBudgetSummaryDoc(autoPrint).doc;
  }
  if(def.doc) return def.doc(autoPrint);
  return _exportDocShell(def.title, def.inner(), autoPrint);
}
function _exportSlugFor(key){
  const def=_EXPORT_DOCS[key];
  if(key==='budget' && _exportBudgetMode==='full' && typeof _buildBudgetSummaryDoc==='function'){
    return 'budget-summary-'+(_buildBudgetSummaryDoc(false).slug||'budget');
  }
  return _exportSlug(def&&def.slug?def.slug:(def?def.title:'export'));
}

// Print a document via a hidden same-page iframe (popup-free, sandbox-safe).
function _exportPrint(key){
  if(_sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('printExport')) return;
  try{
    const doc=_exportBuildDoc(key, false);
    const old=document.getElementById('export-print-frame'); if(old) old.remove();
    const f=document.createElement('iframe');
    f.id='export-print-frame';
    f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(f);
    const fd=f.contentWindow.document;
    fd.open(); fd.write(doc); fd.close();
    setTimeout(()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ _exportDownload(key); } }, 450);
    setTimeout(()=>{ const fr=document.getElementById('export-print-frame'); if(fr) fr.remove(); }, 60000);
  }catch(e){ _exportDownload(key); }
}
// Download a self-printing HTML file (opens → auto-launches print / Save-as-PDF).
function _exportDownload(key){
  if(_sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('printExport')) return;
  const doc=_exportBuildDoc(key, true);
  const dstr=new Date().toISOString().slice(0,10);
  const blob=new Blob([doc],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`${_exportSlugFor(key)}-${dstr}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

// The hub: a list of the four documents. Picking one opens a print preview.
function openExportHub(){
  if(_sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('printExport')) return;
  const items=Object.keys(_EXPORT_DOCS).map(key=>{
    const d=_EXPORT_DOCS[key];
    return `<div onclick="openExportPreview('${key}')" style="display:flex;align-items:center;gap:11px;padding:11px 12px;border:.5px solid var(--border);border-radius:11px;margin-bottom:8px;cursor:pointer;background:var(--surface);transition:border-color .12s" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'">
      <span style="width:34px;height:34px;border-radius:9px;background:rgba(196,168,130,.16);display:inline-flex;align-items:center;justify-content:center;color:var(--gold-deep);flex-shrink:0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d.icon}</svg></span>
      <div style="flex:1;min-width:0"><div style="font-size:14px;color:var(--ink)">${d.title}</div><div style="font-size:11.5px;color:var(--muted)">${d.desc}</div></div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
  }).join('');
  const body=`<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Clean, printable versions to share with vendors or print for the day. Pick one to preview, then download or print.</div>${items}`;
  openModal('Print / Export', body, `<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Close</button>`);
  const _pho=document.getElementById('modal-overlay'); if(_pho) _pho.classList.add('print-hub-overlay');
}
function _exportPreviewBodyHtml(key){
  const def=_EXPORT_DOCS[key]; if(!def) return '';
  // Budget "Full summary" mode renders the rich Budget-page report inline so the
  // preview matches the file produced by Download / Print.
  if(key==='budget' && _exportBudgetMode==='full'){
    const couple=(typeof _budgetCoupleName==='function')?_budgetCoupleName():'';
    const asOf=(typeof _budgetAsOfDate==='function')?_budgetAsOfDate():'';
    const d=(typeof _gatherBudgetSummary==='function')?_gatherBudgetSummary():null;
    const visual=`<div style="background:var(--surface);border-radius:10px;padding:12px 13px;margin-bottom:14px">${(typeof renderBudgetSummaryBody==='function')?renderBudgetSummaryBody():''}</div>`;
    const totalRow=d?`<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border-radius:9px;padding:9px 12px;margin-bottom:12px"><span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-weight:600">Total Budget</span><span style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--ink)">${fmt(d.budgetTotal)}</span></div>`:'';
    const list=(d && typeof _budgetSummaryListHtml==='function')?_budgetSummaryListHtml(d):'';
    return `<div style="background:#fff;border-radius:12px;padding:4px;max-height:58vh;overflow:auto">
        <div style="max-width:600px;margin:0 auto;background:#fff;border:none;border-radius:14px;padding:14px 10px">
          ${couple?`<div style="font-family:'Inter',sans-serif;font-size:9px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:3px">${couple}</div>`:''}
          <div style="font-family:'Cormorant Garamond',serif;font-size:23px;font-weight:500;line-height:1.05;color:var(--ink)">Budget Summary</div>
          <div style="font-family:'Inter',sans-serif;font-size:11px;color:var(--muted);margin:4px 0 16px">As of ${asOf}</div>
          ${totalRow}${visual}${list}
          <div style="text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:var(--muted);opacity:.85;font-size:12px;margin-top:18px;padding-top:14px;border-top:1px solid var(--border)">Union Vault</div>
        </div>
      </div>`;
  }
  const inner=def.inner?def.inner():'';
  return `<div style="background:#fff;border-radius:12px;padding:4px;max-height:58vh;overflow:auto">
      <div style="all:initial;display:block"><style>#export-prev-scope .sheet{margin:0 auto;background:#fff;border:none;border-radius:14px;padding:14px 10px;font-family:'Inter',sans-serif;color:#3A352F}#export-prev-scope .x-head{text-align:center;border-bottom:1px solid #E7DECF;padding-bottom:8px;margin-bottom:12px}#export-prev-scope .x-couple{font-family:'Cormorant Garamond',Georgia,serif;font-size:13px;color:#9A7B2E;margin-bottom:1px}#export-prev-scope .x-title{font-family:Georgia,serif;font-size:22px;font-weight:600;margin:2px 0 0}#export-prev-scope .x-meta{font-size:11px;color:#9A9389;margin-top:2px}#export-prev-scope .x-section{font-size:10px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:#9A7B2E;margin:18px 0 8px}#export-prev-scope .x-blist{color:#8A7A65}#export-prev-scope table{width:100%;border-collapse:collapse}#export-prev-scope th{font-size:8.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#9A9389;text-align:left;padding:3px 8px 3px 0;border-bottom:1px solid #E7DECF}#export-prev-scope .x-row td{padding:7px 8px 7px 0;border-bottom:.5px solid #EFE8DC;font-size:12.5px;vertical-align:top}#export-prev-scope .x-r{text-align:right;color:#9A9389}#export-prev-scope .x-rl{color:#9A9389}#export-prev-scope .x-grp td{padding-top:9px}#export-prev-scope .x-time{white-space:nowrap;font-weight:600;color:#9A7B2E;width:70px}#export-prev-scope .x-foot{text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:#B4AFA4;font-size:12px;margin-top:22px;padding-top:14px;border-top:1px solid #E7DECF}</style>
      <div id="export-prev-scope"><div class="sheet"><div class="x-head"><div class="x-title">${def.title}</div></div>${inner}<div class="x-foot">Union Vault</div></div></div></div>
    </div>`;
}
// Budget-only segmented toggle: Compact table vs Full summary report.
function _exportBudgetModeToggle(){
  const seg=(mode,label)=>`<button onclick="_exportSetBudgetMode('${mode}')" style="font-size:11.5px;font-weight:600;padding:6px 14px;border:none;background:${_exportBudgetMode===mode?'var(--gold-deep)':'var(--cream)'};color:${_exportBudgetMode===mode?'#fff':'var(--muted)'};cursor:pointer">${label}</button>`;
  return `<div style="display:flex;justify-content:center;margin-bottom:6px"><div style="display:inline-flex;border:1px solid var(--border);border-radius:9px;overflow:hidden">${seg('compact','Compact')}${seg('full','Full summary')}</div></div>`;
}
function _exportSetBudgetMode(mode){
  _exportBudgetMode=mode;
  const t=document.getElementById('export-budget-toggle'); if(t) t.innerHTML=_exportBudgetModeToggle();
  const b=document.getElementById('export-preview-body'); if(b) b.innerHTML=_exportPreviewBodyHtml('budget');
}
function openExportPreview(key){
  const def=_EXPORT_DOCS[key]; if(!def) return;
  // Seating reuses its own richer preview if present.
  if(key==='seating' && typeof openSeatingPrintPreview==='function'){ closeModalDirect(); openSeatingPrintPreview(); return; }
  if(key==='budget') _exportBudgetMode='compact'; // default each time the budget preview opens
  if(key==='guests'){ _exportGuestCogOpen=false; _exportGuestLoadOpts(); }
  const toggle = key==='budget' ? `<div id="export-budget-toggle">${_exportBudgetModeToggle()}</div>` : '';
  const cog = key==='guests' ? `<div id="export-guest-cog-wrap" style="position:absolute;top:13px;right:54px;z-index:25">
      <button onclick="_exportGuestToggleCog(event)" title="List options" aria-label="Guest list options" style="width:32px;height:32px;border-radius:9px;border:.5px solid var(--border);background:var(--surface);color:var(--gold-deep);display:inline-flex;align-items:center;justify-content:center;cursor:pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
    </div>` : '';
  const preview=`${cog}${toggle}<div id="export-preview-body">${_exportPreviewBodyHtml(key)}</div>`;
  openModal(def.title+' — preview', preview,
    `<button class="btn btn-outline btn-sm" onclick="openExportHub()">Back</button>
     <button class="btn btn-outline btn-sm" onclick="_exportDownload('${key}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download</button>
     <button class="btn btn-primary btn-sm" onclick="_exportPrint('${key}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Print</button>`);
  const box=document.getElementById('modal-box'); if(box) box.classList.add('modal-wide');
  const _pho=document.getElementById('modal-overlay');
  if(_pho){
    _pho.classList.add('print-hub-overlay');
    // Per-document marker so desktop can fix the pop-up width to the sheet for the
    // text-only docs (Timeline, Budget) while the wide Guest List keeps full width.
    _pho.classList.remove('export-prev-guests','export-prev-timeline','export-prev-budget','export-prev-seating');
    _pho.classList.add('export-prev-'+key);
  }
}



// ══════════════════════════════════════════════
