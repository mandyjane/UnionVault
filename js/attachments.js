// BUDGET ATTACHMENTS (Documents: invoices, receipts, contracts)
// ══════════════════════════════════════════════
const ATTACH_MAX_BYTES = 4 * 1024 * 1024; // 4MB per file guard

const BUDGET_ICON_DEFS = {'ring':'M9 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm6-1a4 4 0 1 0 0 8 4 4 0 0 0 0-8','diamond':'M6 3h12l4 6-10 12L2 9zm-4 6h20M12 3l4 6m-8 0l4-6','flower':'M12 21v-9M12 12c0-2 1.5-4 3-5-1 2-.5 4.5-3 5M12 12c0-2-1.5-4-3-5 1 2 .5 4.5 3 5M12 12c-1-1-1-3 0-4M10 20h4','camera':'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zm-7-7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z','cake':'M20 21H4V11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2zM4 15h16M12 2v3m-4 0v3m8-3v3','music':'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z','hanger':'M12 3a2 2 0 0 1 2 2c0 1-1 1.5-1 1.5L3 14h18L12 6.5S11 6 11 5a2 2 0 0 1 1-2zM3 14v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1','arch':'M4 21V8M20 21V8M4 8C4 4.7 7.6 2 12 2s8 2.7 8 6M7 21v-5a5 5 0 0 1 10 0v5M7 8h10','cloche':'M2 15h20M12 5a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8zM8 19h8M12 5V3','columns':'M5 21V5m0 0h14v16M5 5l7-3 7 3M9 21v-6h6v6M3 21h18','plane':'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z','car':'M5 17H3v-5l3-6h12l3 6v5h-2m-1 0H7m0 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z','envelope':'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 0l8 8 8-8','lights':'M9 21h6M9 21V10h6v11M12 10V7M11 7h2M12 7C11.2 6 11 5 12 4c1 1 .8 2 0 3','ribbon':'M9 22h6M9 22V12h6v10M9 12l1-8h4l1 8M11 4V2m2 2V2M10 7h4','heart':'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z','wallet':'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm16 5h2m-2 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM2 11h20','bed':'M3 21v-6M21 21v-6M3 15h18M3 15v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2','star':'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'};
function budgetIconSvg(iconId, size){
  size = size || 16;
  const p = BUDGET_ICON_DEFS[iconId];
  if(!p) return '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>`;
}

// Full-page view of every invoice & receipt, grouped by budget item (category) then sub-item
function renderAllInvoices(){
  navigate('budget');
  // Build grouped data
  const groups = [];
  let totalFiles = 0;
  (STATE.budget.items||[]).forEach(b=>{
    const sections = [];
    if(b.attachments && b.attachments.length){
      sections.push({ sid:null, name:null, files:b.attachments });
      totalFiles += b.attachments.length;
    }
    (b.subItems||[]).forEach(s=>{
      if(s.attachments && s.attachments.length){
        sections.push({ sid:s.id, name:s.name, files:s.attachments });
        totalFiles += s.attachments.length;
      }
    });
    if(sections.length) groups.push({ b, sections });
  });

  const fileRow = (bid, sid, f) => {
    const kindCol = f.kind==='invoice' ? 'var(--gold-deep)' : (f.kind==='receipt' ? 'var(--green)' : 'var(--muted)');
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--cream);flex-wrap:wrap">
      <div style="width:34px;height:34px;border-radius:8px;background:var(--surface);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold-deep)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${_fileKindIcon(f)}</svg>
      </div>
      <div style="flex:1;min-width:120px">
        <div style="font-size:13px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
        <div style="font-size:11px;margin-top:1px"><span style="text-transform:capitalize;color:${kindCol};font-weight:600">${f.kind||'file'}</span>${f.size?`<span style="color:var(--muted)"> · ${_fmtBytes(f.size)}</span>`:''}${f.addedAt?`<span style="color:var(--muted)"> · ${fmtDate(f.addedAt.slice(0,10))}</span>`:''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:auto">
        <button onclick="_viewFromAll('${bid}','${sid||''}','${f.id}')" title="View" style="background:none;border:1px solid var(--border);border-radius:7px;cursor:pointer;padding:6px 10px;color:var(--gold-deep);font-size:12px;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View</button>
        <button onclick="_downloadFromAll('${bid}','${sid||''}','${f.id}')" title="Download" style="background:none;border:1px solid var(--border);border-radius:7px;cursor:pointer;padding:6px 10px;color:var(--gold-deep);font-size:12px;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download</button>
      </div>
    </div>`;
  };

  const c = document.getElementById('main-content');
  c.innerHTML = `
  ${!groups.length ? `<div style="text-align:center;padding:60px 20px;border:1px dashed var(--border);border-radius:14px;color:var(--muted)">
      <div style="font-size:40px;opacity:.35;margin-bottom:12px">📄</div>
      <div style="font-size:15px;color:var(--ink);margin-bottom:6px">No invoices or receipts yet</div>
      <div style="font-size:13px">Upload files from any Payment's ··· menu and they'll appear here, grouped by category.</div>
    </div>`
  : `<div style="font-size:13px;color:var(--muted);margin-bottom:20px">${totalFiles} file${totalFiles!==1?'s':''} across ${groups.length} categor${groups.length!==1?'ies':'y'}</div>
    <div style="display:flex;flex-direction:column;gap:24px">
    ${groups.map(g=>`
      <div style="border:1px solid var(--border);border-radius:14px;overflow:hidden;background:var(--surface)">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;background:var(--parchment);border-bottom:1px solid var(--border)">
          ${g.b.icon&&_budgetShown('catIcon')?budgetIconSvg(g.b.icon,18):''}
          <span style="font-size:14px;font-weight:700;color:#5C3D2E;text-transform:uppercase;letter-spacing:.07em">${g.b.name}</span>
          <span style="font-size:11px;color:var(--muted);margin-left:auto">${g.sections.reduce((a,s)=>a+s.files.length,0)} file${g.sections.reduce((a,s)=>a+s.files.length,0)!==1?'s':''}</span>
        </div>
        <div style="padding:14px 18px;display:flex;flex-direction:column;gap:16px">
          ${g.sections.map(sec=>`
            <div>
              ${sec.name?`<div style="font-size:12px;font-weight:600;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>${sec.name}</div>`:`<div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Item level</div>`}
              <div style="display:flex;flex-direction:column;gap:8px">
                ${sec.files.map(f=>fileRow(g.b.id, sec.sid, f)).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
    </div>`}`;
  document.getElementById('topbar-title').textContent = 'Documents';
  const _ebInv=document.getElementById('topbar-eyebrow'); if(_ebInv) _ebInv.textContent='Finances';
  // Replace the budget action buttons (Reorder / Invoices / Add Item) with
  // the invoices-view actions: Back to Budget + Add invoice / receipt.
  const _invActions=document.getElementById('topbar-actions');
  if(_invActions){
    _invActions.innerHTML=`
      <button class="btn btn-outline btn-sm doc-act-btn" onclick="navigate('budget')" style="display:inline-flex;align-items:center;gap:5px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        <span class="doc-act-long">Back to Budget</span><span class="doc-act-short">Back</span>
      </button>
      <button class="btn btn-primary btn-sm doc-act-btn" onclick="openLinkedAttachment()" style="display:inline-flex;align-items:center;gap:5px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span class="doc-act-long">Add document</span><span class="doc-act-short" aria-label="Add document"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
      </button>`;
  }
}

// View/download helpers that set the attach context from the all-invoices view
function _viewFromAll(bid, sid, fid){
  _attachCtx = { bid, sid: sid || null };
  _viewAttach(fid);
}
function _downloadFromAll(bid, sid, fid){
  _attachCtx = { bid, sid: sid || null };
  _downloadAttach(fid);
}

function budgetAttachCount(b){ return (b && b.attachments ? b.attachments.length : 0); }
function subAttachCount(s){ return (s && s.attachments ? s.attachments.length : 0); }

// Badge label reflecting what was uploaded: "1 receipt", "2 invoices", or "3 files" when mixed
function attachBadgeLabel(list){
  if(!list || !list.length) return '';
  const n = list.length;
  const kinds = new Set(list.map(f=>f.kind||'file'));
  let word = 'file'+(n>1?'s':'');
  if(kinds.size===1){
    const kind = [...kinds][0];
    if(kind==='invoice')  word = 'invoice'+(n>1?'s':'');
    else if(kind==='receipt')  word = 'receipt'+(n>1?'s':'');
    else if(kind==='contract') word = 'contract'+(n>1?'s':'');
  }
  // Count always shows; the word collapses out on narrow headers (see .attach-badge-word CSS).
  return `${n}<span class="attach-badge-word">&nbsp;${word}</span>`;
}

// Context for the currently open attachments modal
let _attachCtx = null; // { bid, sid|null }

// The document types a file can be labelled as.
const _ATTACH_KINDS = [
  {kind:'invoice',  label:'Invoice',  desc:'A bill to be paid',  icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'},
  {kind:'receipt',  label:'Receipt',  desc:'Proof of payment',   icon:'<path d="M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>'},
  {kind:'contract', label:'Contract', desc:'Signed agreement',   icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13l2 2 4-4"/>'},
  {kind:'other',    label:'Other',    desc:'Anything else',       icon:'<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16.01"/>'}
];
// Renders the 2×2 grid of type cards. `trigger` is the JS that fires when a card
// is tapped (it receives the kind, e.g. "_triggerAttachUpload('invoice')").
function _attachTypeCards(triggerFn){
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">${_ATTACH_KINDS.map(t=>`
    <button type="button" onclick="${triggerFn}('${t.kind}')" style="text-align:left;font-family:inherit;background:var(--parchment);border:1px solid var(--border);border-radius:11px;padding:13px 12px;display:flex;flex-direction:column;align-items:flex-start;gap:7px;cursor:pointer">
      <span style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(166,134,78,.12);color:var(--gold-deep);flex-shrink:0;pointer-events:none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
      </span>
      <span style="font-size:12.5px;font-weight:600;color:var(--ink);pointer-events:none">${t.label}</span>
      <span style="font-size:9.5px;color:var(--muted);line-height:1.35;pointer-events:none">${t.desc}</span>
    </button>`).join('')}</div>`;
}

function openBudgetAttachments(bid){
  if(_sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('budgetDocs')) return;
  const b = STATE.budget.items.find(x=>x.id===bid); if(!b) return;
  if(!b.attachments) b.attachments = [];
  _attachCtx = { bid, sid:null };
  _renderAttachModal(b.name, b.attachments);
}

function openSubAttachments(bid, sid){
  if(_sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('budgetDocs')) return;
  const b = STATE.budget.items.find(x=>x.id===bid); if(!b) return;
  const s = (b.subItems||[]).find(x=>x.id===sid); if(!s) return;
  if(!s.attachments) s.attachments = [];
  _attachCtx = { bid, sid };
  _renderAttachModal(`${b.name}: ${s.name}`, s.attachments);
}

function _attachTarget(){
  if(!_attachCtx) return null;
  if(_attachCtx.vendorId){
    const v=(STATE.vendors||[]).find(x=>x.id===_attachCtx.vendorId); if(!v) return null;
    if(!v.attachments) v.attachments=[];
    return v;
  }
  const b = STATE.budget.items.find(x=>x.id===_attachCtx.bid); if(!b) return null;
  if(_attachCtx.sid){
    const s = (b.subItems||[]).find(x=>x.id===_attachCtx.sid); if(!s) return null;
    if(!s.attachments) s.attachments = [];
    return s;
  }
  if(!b.attachments) b.attachments = [];
  return b;
}

function _fileIcon(type){
  const isImg = type && type.startsWith('image/');
  const isPdf = type === 'application/pdf';
  if(isImg) return '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>';
  if(isPdf) return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>';
  return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>';
}
// Icon for a file row: prefer the document KIND (invoice/receipt/contract) so the
// row icon matches its labelled type; fall back to the file-type icon for "other"
// or unlabelled files (and always use the image icon for images).
function _fileKindIcon(f){
  if(!f) return _fileIcon('');
  const isImg = f.type && f.type.startsWith('image/');
  if(isImg) return _fileIcon(f.type);
  const k=(_ATTACH_KINDS||[]).find(x=>x.kind===f.kind);
  if(k && f.kind && f.kind!=='other') return k.icon;
  return _fileIcon(f.type);
}

function _renderAttachModal(label, list){
  if(_attachCtx) _attachCtx.label = label;
  const body = `
  <div style="display:flex;flex-direction:column;gap:16px">
    <div style="font-size:12.5px;color:var(--muted);line-height:1.5">Attach invoices, receipts &amp; contracts for <strong style="color:var(--ink)">${label}</strong>. Pick what you're adding — images and PDFs (max 4MB each).</div>
    ${_attachTypeCards('_triggerAttachUpload')}
    <input type="file" id="attach-file-input" accept="image/*,application/pdf" style="display:none" onchange="_handleAttachFile(event)"/>
    <div id="attach-list">${_attachListHtml(list)}</div>
  </div>`;
  openModal('Documents', body, `<button class="btn btn-primary" onclick="closeModalDirect();navigate('budget')">Done</button>`);
}

// Build <option>s for the Category dropdown (Layout 2).
function _linkCategoryOptions(selBid){
  return (STATE.budget.items||[]).map(b=>{
    const sel = b.id===selBid ? ' selected' : '';
    return `<option value="${b.id}"${sel}>${(b.name||'Untitled').replace(/</g,'&lt;')}</option>`;
  }).join('');
}

// Build <option>s for the Sub-item dropdown for a given category (Layout 2).
// First option = whole category (empty value). Disabled if no sub-items.
function _linkSubitemOptions(bid, selSid){
  const b = (STATE.budget.items||[]).find(x=>x.id===bid);
  const wholeSel = !selSid ? ' selected' : '';
  let out = `<option value=""${wholeSel}>\u2014 Whole category \u2014</option>`;
  if(b && b.subItems){
    b.subItems.forEach(s=>{
      const sel = s.id===selSid ? ' selected' : '';
      out += `<option value="${s.id}"${sel}>${(s.name||'Sub-item').replace(/</g,'&lt;')}</option>`;
    });
  }
  return out;
}

// "Add invoice / receipt" pop-up shown from the All Invoices view.
// Same as _renderAttachModal but with a link dropdown that picks the target.
function openLinkedAttachment(){
  if(!STATE.budget.items || !STATE.budget.items.length){
    openModal('Documents', `<div style="text-align:center;padding:24px 12px;color:var(--muted);font-size:13.5px">Add a Payment first, then you can attach invoices, receipts and contracts to it.</div>`,
      `<button class="btn btn-primary" onclick="closeModalDirect();navigate('budget')">Go to Budget</button>`);
    return;
  }
  // Default the link target to the current context, else the first item.
  let bid = _attachCtx && _attachCtx.bid, sid = _attachCtx && _attachCtx.sid;
  if(!bid || !STATE.budget.items.find(x=>x.id===bid)){
    bid = STATE.budget.items[0].id; sid = null;
  }
  _attachCtx = { bid, sid: sid || null };
  const target = _attachTarget();
  const list = target ? (target.attachments||[]) : [];

  const body = `
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="form-row" style="margin:0">
      <div class="form-group" style="margin:0">
        <label class="form-label">Category</label>
        <div style="position:relative">
          <select class="form-input" id="link-attach-cat" onchange="_onLinkCatChange(this.value)" style="appearance:none;-webkit-appearance:none;padding-right:32px">
            ${_linkCategoryOptions(bid)}
          </select>
          
        </div>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Sub-item (optional)</label>
        <div style="position:relative">
          <select class="form-input" id="link-attach-sub" onchange="_onLinkSubChange(this.value)" style="appearance:none;-webkit-appearance:none;padding-right:32px">
            ${_linkSubitemOptions(bid, sid)}
          </select>
          
        </div>
      </div>
    </div>
    <div style="font-size:12.5px;color:var(--muted);line-height:1.5">Pick what you're adding — images and PDFs (max 4MB each).</div>
    ${_attachTypeCards('_triggerAttachUpload')}
    <input type="file" id="attach-file-input" accept="image/*,application/pdf" style="display:none" onchange="_handleLinkedAttachFile(event)"/>
    <div id="attach-list">${_attachListHtml(list)}</div>
  </div>`;
  openModal('Add Document', body, `<button class="btn btn-primary" onclick="closeModalDirect();renderAllInvoices()">Done</button>`);
}

// Category dropdown change: rebuild the sub-item dropdown for the new
// category, reset to whole-category, and refresh the file list.
function _onLinkCatChange(bid){
  _attachCtx = { bid, sid: null };
  const subSel = document.getElementById('link-attach-sub');
  if(subSel) subSel.innerHTML = _linkSubitemOptions(bid, null);
  const target = _attachTarget();
  const listEl = document.getElementById('attach-list');
  if(listEl) listEl.innerHTML = _attachListHtml(target ? (target.attachments||[]) : []);
}

// Sub-item dropdown change: narrow (or widen, if blank) the link target
// within the current category, and refresh the file list.
function _onLinkSubChange(sid){
  const bid = _attachCtx && _attachCtx.bid;
  _attachCtx = { bid, sid: sid || null };
  const target = _attachTarget();
  const listEl = document.getElementById('attach-list');
  if(listEl) listEl.innerHTML = _attachListHtml(target ? (target.attachments||[]) : []);
}

// Upload handler for the linked pop-up: same as _handleAttachFile but keeps
// the All Invoices view underneath in sync after a file is added.
function _handleLinkedAttachFile(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  if(file.size > ATTACH_MAX_BYTES){
    alert(`"${file.name}" is ${_fmtBytes(file.size)}. Please choose a file under 4MB.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = async function(ev){
    const target = _attachTarget();
    if(!target){ return; }
    if(!target.attachments) target.attachments = [];
    const data = await _prepMedia(ev.target.result, file.type);
    const mid  = await _mediaPut(data, file.name, file.type);
    target.attachments.push({
      id: 'att' + Date.now() + Math.floor(Math.random()*1000),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      kind: _attachPendingKind,
      mediaId: mid,
      addedAt: new Date().toISOString()
    });
    saveToStorage();
    const listEl = document.getElementById('attach-list');
    if(listEl) listEl.innerHTML = _attachListHtml(target.attachments);
  };
  reader.readAsDataURL(file);
}

function _attachListHtml(list){
  if(!list || !list.length){
    return `<div style="text-align:center;padding:28px 16px;border:1px dashed var(--border);border-radius:10px;color:var(--muted)">
      <div style="font-size:26px;opacity:.4;margin-bottom:6px">📄</div>
      <div style="font-size:13px">No files yet</div>
    </div>`;
  }
  return `<div style="display:flex;flex-direction:column;gap:8px">${list.map(f=>`
    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--cream);flex-wrap:wrap">
      <div style="width:36px;height:36px;border-radius:8px;background:var(--surface);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold-deep)">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${_fileKindIcon(f)}</svg>
      </div>
      <div style="flex:1;min-width:120px">
        <div style="font-size:13px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:1px"><span style="text-transform:capitalize;color:var(--gold-deep);font-weight:600">${f.kind||'file'}</span>${f.size?` · ${_fmtBytes(f.size)}`:''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:auto">
      <button onclick="_viewAttach('${f.id}')" title="View" style="background:none;border:1px solid var(--border);border-radius:7px;cursor:pointer;padding:6px 10px;color:var(--gold-deep);font-size:12px;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:5px;flex-shrink:0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        View
      </button>
      <button onclick="_downloadAttach('${f.id}')" title="Download" style="background:none;border:1px solid var(--border);border-radius:7px;cursor:pointer;padding:6px 10px;color:var(--gold-deep);font-size:12px;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:5px;flex-shrink:0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </button>
      <button onclick="_confirmDeleteAttach('${f.id}')" title="Remove" style="background:none;border:none;cursor:pointer;padding:6px;color:var(--muted);flex-shrink:0;display:flex" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
      </div>
    </div>`).join('')}</div>`;
}

function _fmtBytes(n){
  if(n < 1024) return n + ' B';
  if(n < 1024*1024) return (n/1024).toFixed(0) + ' KB';
  return (n/1024/1024).toFixed(1) + ' MB';
}

let _attachPendingKind = 'invoice';
function _triggerAttachUpload(kind){
  _attachPendingKind = kind;
  const inp = document.getElementById('attach-file-input');
  if(inp){ inp.value=''; inp.click(); }
}

function _handleAttachFile(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  if(file.size > ATTACH_MAX_BYTES){
    alert(`"${file.name}" is ${_fmtBytes(file.size)}. Please choose a file under 4MB.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = async function(ev){
    const target = _attachTarget();
    if(!target){ return; }
    if(!target.attachments) target.attachments = [];
    const data = await _prepMedia(ev.target.result, file.type);
    const mid  = await _mediaPut(data, file.name, file.type);
    target.attachments.push({
      id: 'att' + Date.now() + Math.floor(Math.random()*1000),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      kind: _attachPendingKind,
      mediaId: mid,
      addedAt: new Date().toISOString()
    });
    saveToStorage();
    // Refresh the list inside the open modal and the budget view underneath
    const listEl = document.getElementById('attach-list');
    if(listEl) listEl.innerHTML = _attachListHtml(target.attachments);
  };
  reader.readAsDataURL(file);
}

function _viewAttach(attId){
  const target = _attachTarget(); if(!target) return;
  const f = (target.attachments||[]).find(x=>x.id===attId); if(!f) return;
  const _fu = _mediaUrl(f.mediaId||f.dataUrl);
  if(!_fu){
    alert(`"${f.name}" couldn't be stored in full because the browser's storage limit was reached, so it can't be reopened. Try removing other large files or uploading a smaller version.`);
    return;
  }
  // Render directly from the base64 data URL. Blob URLs are blocked by the
  // sandboxed iframe's content policy, so data: URLs are used instead.
  const mime = f.type || '';
  const isImg = mime.startsWith('image/');
  const isPdf = mime === 'application/pdf';
  let inner;
  if(isImg){
    inner = `<img src="${_fu}" alt="${f.name}" style="display:block;max-width:100%;height:auto;margin:0 auto;border-radius:8px"/>`;
  } else if(isPdf){
    inner = `<div id="pdf-render-area" style="display:flex;flex-direction:column;gap:12px;align-items:center"><div style="padding:30px;color:var(--muted);font-size:13px">Loading PDF…</div></div>
      <div style="text-align:center;margin-top:10px;font-size:12px;color:var(--muted)">Trouble viewing? <button onclick="_downloadAttach('${f.id}')" style="background:none;border:none;color:var(--gold-deep);font-weight:600;cursor:pointer;font-family:Inter,sans-serif;font-size:12px;text-decoration:underline;padding:0">Download it</button> instead.</div>`;
  } else {
    inner = `<div style="text-align:center;padding:36px 16px;color:var(--muted)">
      <div style="font-size:34px;opacity:.4;margin-bottom:10px">📄</div>
      <div style="font-size:14px;color:var(--ink);margin-bottom:6px">${f.name}</div>
      <div style="font-size:12.5px;margin-bottom:18px">This file type can't be previewed here.</div>
      <button class="btn btn-primary btn-sm" onclick="_downloadAttach('${f.id}')">Download to open</button>
    </div>`;
  }
  document.getElementById('fileview-title').textContent = f.name;
  document.getElementById('fileview-body').innerHTML = inner;
  document.getElementById('fileview-footer').innerHTML =
    `<button class="btn btn-outline" onclick="_downloadAttach('${f.id}')" style="display:inline-flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download</button>
     <button class="btn btn-primary" onclick="closeFileViewDirect()">Close</button>`;
  document.getElementById('fileview-overlay').classList.remove('hidden');
  if(isPdf) _renderPdfInViewer(_fu, f.id);
}

function _renderPdfInViewer(dataUrl, fileId){
  const area = document.getElementById('pdf-render-area');
  if(!area) return;
  if(typeof pdfjsLib === 'undefined'){
    area.innerHTML = `<div style="text-align:center;padding:30px 16px;color:var(--muted)">
      <div style="font-size:13px;color:var(--ink);margin-bottom:8px">PDF preview couldn't load.</div>
      <button class="btn btn-primary btn-sm" onclick="_downloadAttach('${fileId}')">Download to view</button>
    </div>`;
    return;
  }
  // Point PDF.js at its worker on the CDN (same host as the main library, which
  // already loaded via a script tag). Set once.
  try {
    if(!pdfjsLib.GlobalWorkerOptions.workerSrc){
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  } catch(e){}
  _doRenderPdf(dataUrl, fileId, area);
}

function _doRenderPdf(fileUrl, fileId, area){
  /* PDFs now arrive as blob: URLs from IndexedDB. pdf.js takes a URL directly,
     so the old base64 -> Uint8Array dance is gone. */
  pdfjsLib.getDocument(fileUrl).promise.then(pdf=>{
    area.innerHTML='';
    const renderPage = num=>{
      pdf.getPage(num).then(page=>{
        const containerW = area.clientWidth || 680;
        const baseVp = page.getViewport({scale:1});
        const scale = Math.min(3, containerW / baseVp.width);
        const vp = page.getViewport({scale: scale * (window.devicePixelRatio||1)});
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        canvas.style.width = (vp.width/(window.devicePixelRatio||1)) + 'px';
        canvas.style.height = (vp.height/(window.devicePixelRatio||1)) + 'px';
        canvas.style.maxWidth = '100%';
        canvas.style.borderRadius = '6px';
        canvas.style.boxShadow = '0 1px 6px rgba(0,0,0,.12)';
        area.appendChild(canvas);
        page.render({canvasContext: canvas.getContext('2d'), viewport: vp});
      });
    };
    for(let p=1; p<=pdf.numPages; p++) renderPage(p);
  }).catch(err=>{
    area.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px">Couldn't render this PDF. <button onclick="_downloadAttach('${fileId}')" style="background:none;border:none;color:var(--gold-deep);font-weight:600;cursor:pointer;text-decoration:underline">Download it</button> to view.</div>`;
  });
}

function closeFileView(e){ /* Outside-click close disabled — use the × button to close. */ }
function closeFileViewDirect(){
  document.getElementById('fileview-overlay').classList.add('hidden');
  document.getElementById('fileview-body').innerHTML='';
}

function _downloadAttach(attId){
  const target = _attachTarget(); if(!target) return;
  const f = (target.attachments||[]).find(x=>x.id===attId); if(!f) return;
  const _fu = _mediaUrl(f.mediaId||f.dataUrl);
  if(!_fu){
    alert(`"${f.name}" couldn't be stored in full because the browser's storage limit was reached, so it can't be downloaded.`);
    return;
  }
  const a = document.createElement('a');
  a.href = _fu;
  a.download = f.name || 'attachment';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function _escHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// Reusable styled delete confirmation matching the invoice/receipt dialog:
// red warning icon, bold question, "permanently removed / can't be undone" note,
// and a red action button. `verb` is the action label (Delete/Remove/Unlink).
// `onConfirmJs` is the JS string run when the action button is pressed.
function _confirmDeleteDialog(opts){
  const o=opts||{};
  const question=o.question||'Delete this item?';
  const name=o.name||'';
  const verb=o.verb||'Delete';
  const noteVerb=o.noteVerb||'permanently removed';
  const detail = name
    ? `“${_escHtml(name)}” will be ${noteVerb}. This can’t be undone.`
    : `This will be ${noteVerb} and can’t be undone.`;
  const body=`<div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:9px">
      <span style="width:26px;height:26px;border-radius:50%;background:rgba(192,57,43,.14);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--red)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
      <div style="font-size:13.5px;color:var(--ink);font-weight:500">${question}</div>
    </div>
    <div style="font-size:12.5px;color:var(--muted);line-height:1.5">${detail}</div>
  </div>`;
  const footer=`<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Cancel</button>
    <button class="btn btn-sm" onclick="${o.onConfirmJs||''}" style="background:var(--red);color:#fff;border:1px solid var(--red)">${verb}</button>`;
  openModal(o.title||'Confirm', body, footer);
}
// Step 1: warn before deleting. Stacks a confirm dialog ON TOP of the
// attachments pop-up (which stays open underneath).
function _confirmDeleteAttach(attId){
  const target = _attachTarget(); if(!target) return;
  const f = (target.attachments||[]).find(x=>x.id===attId); if(!f) return;
  const body = `<div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:9px">
      <span style="width:26px;height:26px;border-radius:50%;background:rgba(192,57,43,.14);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--red)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
      <div style="font-size:13.5px;color:var(--ink);font-weight:500">Delete this file?</div>
    </div>
    <div style="font-size:12.5px;color:var(--muted);line-height:1.5">“${_escHtml(f.name)}” will be permanently removed. This can’t be undone.</div>
  </div>`;
  const footer = `<button class="btn btn-outline btn-sm" onclick="_closeConfirm2Direct()">Cancel</button>
    <button class="btn btn-sm" onclick="_doDeleteAttach('${attId}')" style="background:var(--red);color:#fff;border:1px solid var(--red)">Delete</button>`;
  openConfirm2('Delete file', body, footer);
}
// Step 2: actually remove, close the confirm, and refresh the list (still open underneath).
function _doDeleteAttach(attId){
  const target = _attachTarget();
  _closeConfirm2Direct();
  if(!target) return;
  const _a0=(target.attachments||[]).find(x=>x.id===attId);
  const _label=_a0?(_a0.name||_a0.filename||'document'):'document';
  _undoableDelete(_label, ()=>{
    const tgt=_attachTarget();
    if(tgt) tgt.attachments = (tgt.attachments||[]).filter(x=>x.id!==attId);
  }, null, ()=>{
    const tgt=_attachTarget();
    const listEl = document.getElementById('attach-list');
    if(listEl && tgt) listEl.innerHTML = _attachListHtml(tgt.attachments);
  });
  const listEl = document.getElementById('attach-list');
  if(listEl) listEl.innerHTML = _attachListHtml(target.attachments);
}

function openAllocatedSummary(){
  const rows=[];
  let total=0;
  (STATE.budget.items||[]).forEach(b=>{
    const amt=calcBudgetItemTotal(b);
    if(amt>0){ total+=amt; rows.push({item:b.name||'Untitled', amt, fromSubs:!!b.totalFromSubs}); }
  });

  let body;
  if(!rows.length){
    body=`<div style="text-align:center;padding:28px 16px;color:var(--muted)">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5;margin-bottom:10px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      <div style="font-size:14px">No budget amounts set yet.</div>
      <div style="font-size:12.5px;margin-top:6px">Add a total to a Payment to see it here.</div>
    </div>`;
  } else {
    const list=rows.map(r=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13.5px;color:var(--ink);font-weight:500">${r.item}</div>
          ${r.fromSubs?`<div style="font-size:11.5px;color:var(--muted)">Total from sub-items</div>`:''}
        </div>
        <div style="font-size:14px;font-weight:600;color:var(--gold-deep);font-family:'Inter',sans-serif;flex-shrink:0">${fmt(r.amt)}</div>
      </div>`).join('');
    body=`<div>
      ${list}
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 4px 2px;margin-top:4px">
        <span style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600">Total Committed</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink)">${fmt(total)}</span>
      </div>
    </div>`;
  }
  openModal('Committed Budget', body, `<button class="btn btn-primary" onclick="closeModalDirect()">Done</button>`);
}

function openDepositsSummary(){
  const paidRows=[];
  const unpaidRows=[];
  let paidTotal=0;
  let unpaidTotal=0;
  const today=new Date(); today.setHours(0,0,0,0);
  const pushRow=(arr,item,label,amt,date,paid)=>{
    let overdue=false;
    if(date && !paid){
      const d=new Date(date+'T00:00:00');
      overdue=(d-today)<0;
    }
    arr.push({item,label,amt,date,overdue});
  };
  (STATE.budget.items||[]).forEach(b=>{
    // Item-level deposit (only when not driven by sub-items)
    if(!b.depositFromSubs && Number(b.deposit||0)>0){
      const amt=Number(b.deposit||0);
      if(b.depositPaid){ paidTotal+=amt; pushRow(paidRows,b.name||'Untitled','Deposit',amt,b.depositDueDate||'',true); }
      else { unpaidTotal+=amt; pushRow(unpaidRows,b.name||'Untitled','Deposit',amt,b.depositDueDate||'',false); }
    }
    // Sub-item deposits
    (b.subItems||[]).forEach(s=>{
      if(Number(s.deposit||0)>0){
        const amt=Number(s.deposit||0);
        if(s.depositPaid){ paidTotal+=amt; pushRow(paidRows,b.name||'Untitled',s.name||'Sub-item',amt,s.depositDueDate||'',true); }
        else { unpaidTotal+=amt; pushRow(unpaidRows,b.name||'Untitled',s.name||'Sub-item',amt,s.depositDueDate||'',false); }
      }
    });
  });
  // Sort unpaid by due date (dated first, soonest first; undated last)
  unpaidRows.sort((a,b)=>{
    if(a.date&&b.date) return a.date<b.date?-1:a.date>b.date?1:0;
    if(a.date) return -1;
    if(b.date) return 1;
    return 0;
  });

  let body;
  if(!paidRows.length && !unpaidRows.length){
    body=`<div style="text-align:center;padding:28px 16px;color:var(--muted)">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5;margin-bottom:10px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      <div style="font-size:14px">No deposits set up yet.</div>
      <div style="font-size:12.5px;margin-top:6px">Add a deposit amount to a Payment to track it here.</div>
    </div>`;
  } else {
    const paidList=paidRows.map(r=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
        <div style="flex:1;min-width:0">
          <div style="font-size:13.5px;color:var(--ink);font-weight:500">${r.item}</div>
          <div style="font-size:11.5px;color:var(--muted)">${r.label}${r.date?` &middot; ${fmtDate(r.date)}`:''}</div>
        </div>
        <div style="font-size:14px;font-weight:600;color:var(--green);font-family:'Inter',sans-serif;flex-shrink:0">${fmt(r.amt)}</div>
      </div>`).join('');

    const unpaidList=unpaidRows.map(r=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${r.overdue?'var(--red)':'var(--gold-deep)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <div style="flex:1;min-width:0">
          <div style="font-size:13.5px;color:var(--ink);font-weight:500">${r.item}</div>
          <div style="font-size:11.5px;color:${r.overdue?'var(--red)':'var(--muted)'}">${r.label}${r.date?` &middot; ${r.overdue?'Overdue · ':'Due '}${fmtDate(r.date)}`:' &middot; No due date'}</div>
        </div>
        <div style="font-size:14px;font-weight:600;color:var(--gold-deep);font-family:'Inter',sans-serif;flex-shrink:0">${fmt(r.amt)}</div>
      </div>`).join('');

    const paidSection = paidRows.length?`
      <div style="font-size:11px;color:var(--green);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin:2px 0 4px">Paid</div>
      ${paidList}
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 4px 2px">
        <span style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600">Total Paid</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--green)">${fmt(paidTotal)}</span>
      </div>`:'';

    const unpaidSection = unpaidRows.length?`
      <div style="font-size:11px;color:var(--gold-deep);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin:${paidRows.length?'18px':'2px'} 0 4px">Outstanding</div>
      ${unpaidList}
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 4px 2px">
        <span style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600">Total Outstanding</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--gold-deep)">${fmt(unpaidTotal)}</span>
      </div>`:'';

    body=`<div>${paidSection}${unpaidSection}</div>`;
  }
  openModal('Deposits', body, `<button class="btn btn-primary" onclick="closeModalDirect()">Done</button>`);
}

// Layout C breakdown: all payments made (deposits, paid sub-items, paid installments),
// with a distinct "Deposits" subtotal so that figure stays visible one tap away.
function openPaidSummary(){
  const rows=[];          // {item, label, amt, date, kind}
  let depositsTotal=0;    // deposits subset
  let grandPaid=0;        // everything paid
  (STATE.budget.items||[]).forEach(b=>{
    // Item-level deposit (only when not driven by sub-items)
    if(!b.depositFromSubs && Number(b.deposit||0)>0 && b.depositPaid){
      const amt=Number(b.deposit||0);
      depositsTotal+=amt; grandPaid+=amt;
      rows.push({item:b.name||'Untitled', label:'Deposit', amt, date:b.depositDueDate||'', kind:'deposit'});
    }
    // Fully-paid item with no sub-items → its balance counts as paid
    if((!b.subItems||!b.subItems.length) && b.paid){
      const bal=calcBudgetItemTotal(b) - (b.depositPaid&&!b.depositFromSubs?Number(b.deposit||0):0);
      if(bal>0){ grandPaid+=bal; rows.push({item:b.name||'Untitled', label:'Paid in full', amt:bal, date:b.balanceDueDate||'', kind:'paid'}); }
    }
    (b.subItems||[]).forEach(s=>{
      // Sub-item deposit
      if(Number(s.deposit||0)>0 && s.depositPaid){
        const amt=Number(s.deposit||0); depositsTotal+=amt; grandPaid+=amt;
        rows.push({item:b.name||'Untitled', label:`${s.name||'Sub-item'} · deposit`, amt, date:s.depositDueDate||'', kind:'deposit'});
      }
      // Paid installments
      if(s.installments && s.installments.length){
        s.installments.forEach((inst,i)=>{
          if(inst && inst.paid){
            const amt=Number(inst.amount||0); grandPaid+=amt;
            rows.push({item:b.name||'Untitled', label:`${s.name||'Sub-item'} · ${inst.label||('installment '+(i+1))}`, amt, date:inst.paidDate||inst.dueDate||'', kind:'installment'});
          }
        });
      }
      // Fully-paid sub-item (its balance beyond deposit)
      if(s.paid){
        const subTot=getSubItemAmount(s);
        const already=(s.depositPaid?Number(s.deposit||0):0)+calcSubInstallmentsPaid(s);
        const rest=Math.max(0, subTot-already);
        if(rest>0){ grandPaid+=rest; rows.push({item:b.name||'Untitled', label:`${s.name||'Sub-item'} · balance`, amt:rest, date:s.balanceDueDate||'', kind:'paid'}); }
      }
    });
  });

  let body;
  if(!rows.length){
    body=`<div style="text-align:center;padding:28px 16px;color:var(--muted)">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5;margin-bottom:10px"><polyline points="20 6 9 17 4 12"/></svg>
      <div style="font-size:14px">No payments made yet.</div>
      <div style="font-size:12.5px;margin-top:6px">Deposits, paid items, and paid installments will appear here.</div>
    </div>`;
  } else {
    const list=rows.map(r=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
        <div style="flex:1;min-width:0">
          <div style="font-size:13.5px;color:var(--ink);font-weight:500">${r.item}</div>
          <div style="font-size:11.5px;color:var(--muted)">${r.label}${r.date?` &middot; ${fmtDate(r.date)}`:''}</div>
        </div>
        <div style="font-size:14px;font-weight:600;color:var(--green);font-family:'Inter',sans-serif;flex-shrink:0">${fmt(r.amt)}</div>
      </div>`).join('');
    // "Of which deposits" line preserves the distinct deposits figure.
    const depLine = depositsTotal>0 ? `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 4px 2px">
        <span style="font-size:11.5px;color:var(--muted)">of which deposits</span>
        <span style="font-size:13px;font-weight:600;color:var(--muted);font-family:'Inter',sans-serif">${fmt(depositsTotal)}</span>
      </div>` : '';
    body=`<div>
      ${list}
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 4px 2px;margin-top:2px">
        <span style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600">Total Paid</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--green)">${fmt(grandPaid)}</span>
      </div>
      ${depLine}
    </div>`;
  }
  openModal('Payments', body, `<button class="btn btn-primary" onclick="closeModalDirect()">Done</button>`);
}
let _budgetReportShowVisual = true;
let _budgetReportShowInstallments = true;
function _budgetHasInstallments(){
  return (STATE.budget.items||[]).some(b=>(b.subItems||[]).some(s=>subHasInstallments(s)));
}

function _budgetCoupleName(){
  const ev=STATE.event||{};
  const p1=(ev.partner1||'').trim();
  const p2=(ev.partner2||'').trim();
  const possess=(name)=>/s$/i.test(name) ? name+"\u2019" : name+"\u2019s";
  if(p1 && p2) return `${p1} & ${possess(p2)} Wedding`;
  if(p1) return `${possess(p1)} Wedding`;
  if(p2) return `${possess(p2)} Wedding`;
  return '';
}

function _budgetAsOfDate(){
  return new Date().toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
}

function _gatherBudgetSummary(){
  const { totalCost, totalSpent, budgetTotal }=_budgetSummaryFigures();
  const remaining=budgetTotal-totalCost;
  const over=budgetTotal&&totalCost>budgetTotal;
  const today=new Date(); today.setHours(0,0,0,0);
  const isOverdue=(date,paid)=> (date && !paid) ? (new Date(date+'T00:00:00')-today)<0 : false;

  // Legacy flat rows (kept for any other callers)
  const allocRows=[];
  const paidRows=[], unpaidRows=[];
  let paidTotal=0, unpaidTotal=0;

  // Hierarchical breakdown
  const items=[];
  let grandAllocated=0, grandPaid=0, grandOutstanding=0;

  (STATE.budget.items||[]).forEach(b=>{
    const itemTotal=calcBudgetItemTotal(b);
    if(itemTotal>0) allocRows.push({item:b.name||'Untitled', amt:itemTotal, fromSubs:!!b.totalFromSubs});

    const subs=(b.subItems||[]);
    const node={ name:b.name||'Untitled', total:itemTotal, fromSubs:!!b.totalFromSubs, note:(b.note||'').trim(), lines:[], subs:[] };

    // Item-level deposit (only when not driven by sub-items)
    if(!b.depositFromSubs && Number(b.deposit||0)>0){
      const amt=Number(b.deposit||0);
      node.lines.push({ kind:'deposit', amt, paid:!!b.depositPaid, paidDate:b.depositPaidDate||'', dueDate:b.depositDueDate||'', overdue:isOverdue(b.depositDueDate, b.depositPaid) });
      if(b.depositPaid){ paidTotal+=amt; paidRows.push({item:b.name||'Untitled',label:'Deposit',amt,date:b.depositDueDate||'',overdue:false}); }
      else { unpaidTotal+=amt; unpaidRows.push({item:b.name||'Untitled',label:'Deposit',amt,date:b.depositDueDate||'',overdue:isOverdue(b.depositDueDate,false)}); }
    }
    // Item-level balance (when no sub-items carry the detail)
    if(!subs.length){
      const dep = (!b.depositFromSubs && b.depositPaid) ? Number(b.deposit||0) : 0;
      const bal = Math.max(0, itemTotal - dep);
      if(itemTotal>0){
        node.lines.push({ kind:'balance', amt:bal, paid:!!b.paid, paidDate:b.paidDate||'', dueDate:b.balanceDueDate||'', overdue:isOverdue(b.balanceDueDate, b.paid) });
      }
    }

    // Sub-items
    subs.forEach(s=>{
      const sAmt=getSubItemAmount(s);
      const sub={ name:s.name||'Sub-item', amt:sAmt, lines:[], plan:null, calc:'' };
      // Per-head / per-item derivation context (shown as a faint line under the sub).
      if(s.perHead){
        const cnt = s.guestCountOverride ? Number(s.guestCount||0)
                  : (STATE.budget.useRsvpCount ? _rsvpPerHeadCount() : Number(s.guestCount||0));
        sub.calc = `${cnt} guest${cnt===1?'':'s'} × ${fmt(Number(s.pricePerHead||0))} per head`;
      } else if(s.perItem){
        const cnt=Number(s.itemCount||0);
        sub.calc = `${cnt} item${cnt===1?'':'s'} × ${fmt(Number(s.pricePerItem||0))} each`;
      }
      if(Number(s.deposit||0)>0){
        const amt=Number(s.deposit||0);
        sub.lines.push({ kind:'deposit', amt, paid:!!s.depositPaid, paidDate:s.depositPaidDate||'', dueDate:s.depositDueDate||'', overdue:isOverdue(s.depositDueDate, s.depositPaid) });
        if(s.depositPaid){ paidTotal+=amt; paidRows.push({item:b.name||'Untitled',label:s.name||'Sub-item',amt,date:s.depositDueDate||'',overdue:false}); }
        else { unpaidTotal+=amt; unpaidRows.push({item:b.name||'Untitled',label:s.name||'Sub-item',amt,date:s.depositDueDate||'',overdue:isOverdue(s.depositDueDate,false)}); }
      }
      // Installment plan: capture the schedule so the report can itemise it. The plan
      // stands in for the single balance line (the plan IS the balance, split up).
      if(subHasInstallments(s)){
        const planTotal=subInstallmentTotal(s);
        const planPaid=calcSubInstallmentsPaid(s);
        sub.plan={
          total:planTotal, paid:planPaid, count:s.installments.length,
          rows:s.installments.map((inst,idx)=>({
            n:idx+1, label:inst.label||'', amt:Number(inst.amount||0),
            paid:!!inst.paid, paidDate:inst.paidDate||'', dueDate:inst.dueDate||'',
            overdue:isOverdue(inst.dueDate, inst.paid)
          }))
        };
      } else {
        // Sub-item balance (amount minus a paid deposit) — only when there's no plan.
        const sDep = s.depositPaid ? Number(s.deposit||0) : 0;
        const sBal = Math.max(0, sAmt - sDep);
        if(sAmt>0){
          sub.lines.push({ kind:'balance', amt:sBal, paid:!!s.paid, paidDate:s.paidDate||'', dueDate:s.balanceDueDate||'', overdue:isOverdue(s.balanceDueDate, s.paid) });
        }
      }
      node.subs.push(sub);
    });

    // Per-item paid / outstanding tallies for grand totals
    const itemPaid = itemTotal - calcBudgetBalance(b);
    grandAllocated += itemTotal;
    grandPaid += Math.max(0, itemPaid);
    grandOutstanding += calcBudgetBalance(b);

    if(itemTotal>0 || node.lines.length || node.subs.length) items.push(node);
  });

  unpaidRows.sort((a,b)=>{
    if(a.date&&b.date) return a.date<b.date?-1:a.date>b.date?1:0;
    if(a.date) return -1; if(b.date) return 1; return 0;
  });

  return { totalCost, totalSpent, budgetTotal, remaining, over,
           allocRows, paidRows, unpaidRows, paidTotal, unpaidTotal,
           items, grandAllocated, grandPaid, grandOutstanding };
}

function _budgetSummaryListHtml(d){
  const serif="font-family:'Cormorant Garamond',serif";
  // Status text for a deposit/balance line: paid-on (green), overdue (red), due (red-ish), or undated.
  const lineStatus=(ln)=>{
    if(ln.paid) return `<span style="color:var(--green);font-weight:600">${ln.paidDate?('Paid '+(paidRelative(ln.paidDate)||('on '+fmtBudgetDate(ln.paidDate)))):'Paid'}</span>`;
    if(ln.dueDate) return `<span style="color:${ln.overdue?'var(--red-deep)':'var(--red)'};font-weight:600">${ln.overdue?'Overdue ':'Due '}${fmtBudgetDate(ln.dueDate)}</span>`;
    return '';
  };
  // Chip for a detail line: Deposit (filled gold), Balance (outlined), or Paid (green) when fully paid.
  const chip=(ln)=>{
    if(ln.kind==='balance' && ln.paid)
      return `<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--green);background:rgba(92,143,114,.16);padding:1px 7px;border-radius:6px;flex-shrink:0">Paid</span>`;
    if(ln.kind==='deposit')
      return `<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gold-deep);background:rgba(201,184,156,.2);padding:1px 7px;border-radius:6px;flex-shrink:0">Deposit</span>`;
    return `<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gold-deep);border:1px solid var(--border);padding:1px 7px;border-radius:6px;flex-shrink:0">Balance</span>`;
  };
  const detailLine=(ln)=>`<div style="display:flex;align-items:center;gap:8px;padding:3px 0">
      ${chip(ln)}
      <span style="font-size:11.5px;flex:1;min-width:0">${lineStatus(ln)}</span>
      <span style="font-size:12px;font-weight:400;color:${ln.paid?'var(--green)':'var(--ink)'};font-family:'Inter',sans-serif;flex-shrink:0;font-variant-numeric:tabular-nums">${fmt(ln.amt)}</span>
    </div>`;
  // Faint 80%-width centered divider between sub-items.
  const subDivider=`<div style="height:1px;width:80%;margin:5px auto;background:var(--border);opacity:.6"></div>`;
  // A balance line just repeats the parent amount when it carries no extra info — skip it.
  const isRedundantBalance=(ln, parentAmt)=> ln.kind==='balance' && !ln.paid && !ln.dueDate && Math.round(ln.amt)===Math.round(parentAmt);

  let h='';
  (d.items||[]).forEach(it=>{
    h+=`<div class="bsum-cat-card" style="border:1px solid var(--border);border-radius:10px;padding:11px 13px;margin-bottom:10px">
      <div style="padding-bottom:8px;border-bottom:1px solid var(--border);margin-bottom:${(it.subs.length||it.lines.length)?'7px':'0'}">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-size:15px;font-weight:600;color:var(--ink)">${it.name}</span>
          <span style="font-size:15px;font-weight:700;color:var(--ink);font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums">${fmt(it.total)}</span>
        </div>
        ${it.note?`<div style="font-size:11.5px;color:var(--muted);font-style:italic;line-height:1.4;margin-top:3px">${_escAttr(it.note)}</div>`:''}
      </div>`;
    // Item-level lines (deposit/balance when no sub-items)
    it.lines.filter(ln=>!isRedundantBalance(ln, it.total)).forEach(ln=>{ h+=detailLine(ln); });
    // Sub-items, each in an indented block with a left rule, divided by a faint line
    if(it.subs.length){
      it.subs.forEach((su,i)=>{
        if(i>0) h+=subDivider;
        h+=`<div style="border-left:2px solid var(--border);padding-left:11px;margin:6px 0">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <span style="font-size:13px;font-weight:500;color:var(--ink)">${su.name}</span>
            <span style="font-size:13px;font-weight:600;color:var(--ink);font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums">${fmt(su.amt)}</span>
          </div>${su.calc?`<div style="font-size:10.5px;color:var(--muted);margin-top:1px">${su.calc}</div>`:''}`;
        su.lines.filter(ln=>!isRedundantBalance(ln, su.amt)).forEach(ln=>{ h+=detailLine(ln); });
        // Installment plan, if present: a "Plan" summary line always, then each
        // instalment when the breakdown toggle is on.
        if(su.plan){
          const p=su.plan;
          h+=`<div style="display:flex;align-items:center;gap:8px;padding:4px 0 2px">
            <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gold-deep);background:rgba(201,184,156,.28);padding:1px 7px;border-radius:6px;flex-shrink:0">Plan</span>
            <span style="font-size:11px;color:var(--muted);flex:1;min-width:0">${p.count} payment${p.count===1?'':'s'} &middot; ${fmt(p.paid)} of ${fmt(p.total)} paid</span>
          </div>`;
          if(_budgetReportShowInstallments){
            p.rows.forEach(r=>{
              const status = r.paid
                ? `<span style="color:var(--green);font-weight:600">${r.paidDate?('Paid '+(paidRelative(r.paidDate)||('on '+fmtBudgetDate(r.paidDate)))):'Paid'}</span>`
                : (r.dueDate?`<span style="color:${r.overdue?'var(--red-deep)':'var(--red)'};font-weight:600">${r.overdue?'Overdue ':'Due '}${fmtBudgetDate(r.dueDate)}</span>`:'');
              const numChip = r.paid
                ? `<span style="font-size:9px;font-weight:700;color:var(--green);background:rgba(92,143,114,.16);padding:1px 6px;border-radius:6px;flex-shrink:0;white-space:nowrap">${r.n} of ${p.count}</span>`
                : `<span style="font-size:9px;font-weight:700;color:var(--muted);border:1px solid var(--border);padding:1px 6px;border-radius:6px;flex-shrink:0;white-space:nowrap">${r.n} of ${p.count}</span>`;
              h+=`<div style="display:flex;align-items:center;gap:8px;padding:2px 0 2px 6px">
                ${numChip}
                <span style="font-size:11px;flex:1;min-width:0">${r.label?_escAttr(r.label)+' &middot; ':''}${status}</span>
                <span style="font-size:11.5px;font-weight:400;color:${r.paid?'var(--green)':'var(--ink)'};font-family:'Inter',sans-serif;flex-shrink:0;font-variant-numeric:tabular-nums">${fmt(r.amt)}</span>
              </div>`;
            });
          }
        }
        h+=`</div>`;
      });
    }
    h+=`</div>`;
  });

  // Grand totals — soft summary card
  h+=`<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-top:12px;display:flex;flex-direction:column;gap:7px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600">Committed</span>
      <span style="${serif};font-size:17px;font-weight:600;color:var(--gold-deep);font-variant-numeric:tabular-nums">${fmt(d.grandAllocated)}</span></div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:11px;color:var(--green);text-transform:uppercase;letter-spacing:.08em;font-weight:600">Paid to date</span>
      <span style="${serif};font-size:17px;font-weight:600;color:var(--green);font-variant-numeric:tabular-nums">${fmt(d.grandPaid)}</span></div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600">Left to pay</span>
      <span style="${serif};font-size:17px;font-weight:600;color:var(--gold-deep);font-variant-numeric:tabular-nums">${fmt(d.grandOutstanding)}</span></div>`;
  if(d.budgetTotal){
    h+=`<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);margin-top:1px;padding-top:8px">
      <span style="font-size:11px;color:var(--ink);text-transform:uppercase;letter-spacing:.08em;font-weight:700">${d.over?'Over budget':'Unallocated'}</span>
      <span style="${serif};font-size:20px;font-weight:700;color:${d.over?'var(--red)':'var(--ink)'};font-variant-numeric:tabular-nums">${fmt(Math.abs(d.remaining))}</span></div>`;
  }
  h+=`</div>`;
  return h;
}

function _renderBudgetReportBody(){
  const d=_gatherBudgetSummary();
  const empty = !d.allocRows.length && !d.paidRows.length && !d.unpaidRows.length && !d.budgetTotal;
  if(empty){
    return `<div style="text-align:center;padding:28px 16px;color:var(--muted)">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5;margin-bottom:10px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <div style="font-size:14px">Nothing to summarise yet.</div>
      <div style="font-size:12.5px;margin-top:6px">Set a total budget and add items to build your summary.</div>
    </div>`;
  }
  const totalBudgetRow = `<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border-radius:9px;padding:9px 12px;margin-bottom:12px">
      <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-weight:600">Total Budget</span>
      <span style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--ink)">${fmt(d.budgetTotal)}</span></div>`;
  const visual = _budgetReportShowVisual ? `<div style="background:var(--surface);border-radius:10px;padding:12px 13px;margin-bottom:12px">${renderBudgetSummaryBody()}</div>` : '';
  const toggle = `<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);margin-bottom:8px;cursor:pointer;user-select:none">
      <input type="checkbox" ${_budgetReportShowVisual?'checked':''} onchange="_budgetReportShowVisual=this.checked;document.getElementById('modal-body').innerHTML=_renderBudgetReportBody()" style="width:15px;height:15px;accent-color:var(--gold);cursor:pointer"/>
      Show visual summary (included in download)
    </label>`;
  const instToggle = _budgetHasInstallments() ? `<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);margin-bottom:12px;cursor:pointer;user-select:none">
      <input type="checkbox" ${_budgetReportShowInstallments?'checked':''} onchange="_budgetReportShowInstallments=this.checked;document.getElementById('modal-body').innerHTML=_renderBudgetReportBody()" style="width:15px;height:15px;accent-color:var(--gold);cursor:pointer"/>
      Itemise payment plans (included in download)
    </label>` : '';
  const footer=`<div style="text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:var(--muted);opacity:.85;font-size:12px;margin-top:18px;padding-top:14px;border-top:1px solid var(--border)">Union Vault</div>`;
  return `<div>${totalBudgetRow}${toggle}${instToggle}${visual}${_budgetSummaryListHtml(d)}${footer}</div>`;
}

// ── Vendor payment timeline view ──────────────────────────────────────────
// Scope: 'due' = only unpaid/dated "what's owed when"; 'full' = whole ledger
// incl. paid. Optional vendorFilter limits to one vendor (used by row pills).
let _vptScope = 'due';
let _vptVendorFilter = '';
function _vptMonthKey(iso){ // 'YYYY-MM' → label
  if(!iso) return 'Undated';
  const d=new Date(iso+'T00:00:00');
  return d.toLocaleDateString(undefined,{month:'long',year:'numeric'});
}
function _vptStatusMeta(s){
  switch(s){
    case 'overdue': return {cls:'over', label:'Overdue'};
    case 'soon':    return {cls:'soon', label:'Due soon'};
    case 'paid':    return {cls:'paid', label:'Paid'};
    case 'undated': return {cls:'up',   label:'No date'};
    default:        return {cls:'up',   label:'Upcoming'};
  }
}
function _vptRowHtml(p){
  const sm=_vptStatusMeta(p.status);
  const dd = p.date ? (()=>{ const d=new Date(p.date+'T00:00:00'); return {d:d.getDate(), mo:d.toLocaleDateString(undefined,{month:'short'}).toUpperCase()}; })() : {d:'·', mo:''};
  const rowCls = p.status==='paid' ? 'vpt-row vpt-paid' : (p.status==='overdue' ? 'vpt-row vpt-over' : 'vpt-row');
  const vendorHtml = p.vendor
    ? `<div class="vpt-who"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 5h20v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M4 11v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9"/></svg>${_escHtml(p.vendor.business||'Vendor')}</div>`
    : `<div class="vpt-who vpt-who-none">No vendor linked</div>`;
  const right = p.status==='paid'
    ? `<div class="vpt-amt"><div class="vpt-n vpt-n-paid">${fmt(p.amount)}</div><span class="vpt-check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></div>`
    : `<div class="vpt-amt"><div class="vpt-n">${fmt(p.amount)}</div><div class="vpt-stat vpt-${sm.cls}">${sm.label}</div></div>`;
  const kindCls = p.kind==='balance' ? 'vpt-kind vpt-kind-bal' : 'vpt-kind';
  const jump = `_vptJump('${p.bid}','${p.sid||''}')`;
  return `<div class="${rowCls}" onclick="${jump}">
    <div class="vpt-date"><div class="vpt-d">${dd.d}</div><div class="vpt-mo">${dd.mo}</div></div>
    <div class="vpt-body">
      <div class="vpt-what">${_escHtml(p.label)}<span class="${kindCls}">${p.kind==='balance'?'Balance':'Deposit'}</span></div>
      ${vendorHtml}
    </div>
    ${right}
  </div>`;
}
function _vptBodyHtml(){
  let list=_collectVendorPayments();
  if(_vptVendorFilter) list=list.filter(p=>p.vendor && p.vendor.id===_vptVendorFilter);
  // Summary figures (always over the full set, not the scoped view)
  const today=new Date(); today.setHours(0,0,0,0);
  let outstanding=0, overdue=0, thisMonth=0, paid=0;
  const curMonth=today.getMonth(), curYear=today.getFullYear();
  list.forEach(p=>{
    if(p.paid){ paid+=p.amount; return; }
    outstanding+=p.amount;
    if(p.status==='overdue') overdue+=p.amount;
    if(p.date){ const d=new Date(p.date+'T00:00:00'); if(d.getMonth()===curMonth && d.getFullYear()===curYear) thisMonth+=p.amount; }
  });
  // Scope filter for the rows
  let rows = _vptScope==='due' ? list.filter(p=>!p.paid && p.amount>0) : list;
  rows = _sortVendorPayments(rows);
  const seg = `<div class="vpt-seg">
      <button class="${_vptScope==='due'?'on':''}" onclick="_vptSetScope('due')">Due only</button>
      <button class="${_vptScope==='full'?'on':''}" onclick="_vptSetScope('full')">Full ledger</button>
    </div>`;
  const chips = `<div class="vpt-sum">
      <div><span>Outstanding</span><b>${fmt(outstanding)}</b></div>
      <div class="over"><span>Overdue</span><b>${fmt(overdue)}</b></div>
      <div class="soon"><span>This month</span><b>${fmt(thisMonth)}</b></div>
      <div class="paid"><span>Paid</span><b>${fmt(paid)}</b></div>
    </div>`;
  let body;
  if(!rows.length){
    body=`<div class="vpt-empty">${_vptScope==='due'?'No payments due — everything with a due date is settled.':'No payments recorded yet.'}</div>`;
  } else {
    // Group by month label (chronological; Undated last via sort)
    const groups=[]; const idx={};
    rows.forEach(p=>{ const k=_vptMonthKey(p.date); if(!(k in idx)){ idx[k]=groups.length; groups.push({k, items:[]}); } groups[idx[k]].items.push(p); });
    body=groups.map(g=>`<div class="vpt-mhdr">${g.k}</div>${g.items.map(_vptRowHtml).join('')}`).join('');
  }
  return `<div class="vpt-wrap">${seg}${chips}<div class="vpt-list">${body}</div></div>`;
}
function _vptRerender(){
  const host=document.getElementById('vpt-host');
  if(host) host.innerHTML=_vptBodyHtml();
}
function _vptSetScope(s){ _vptScope=s; _vptRerender(); }
function _vptJump(bid, sid){
  closeModalDirect();
  navigate('budget');
  setTimeout(()=>{
    const id = sid ? `bsub-${sid}` : `bi-${bid}`;
    const el=document.getElementById(id) || document.getElementById(`bi-${bid}`);
    if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); if(typeof _flashHighlight==='function') _flashHighlight(el); }
  },160);
}
// Total still-owed + next due date for one vendor (for the Vendors page pills).
function _vendorOwedSummary(vendorId){
  const list=_collectVendorPayments().filter(p=>p.vendor && p.vendor.id===vendorId && !p.paid && p.amount>0);
  if(!list.length) return null;
  let owed=0, anyOverdue=false, next=null;
  list.forEach(p=>{
    owed+=p.amount;
    if(p.status==='overdue') anyOverdue=true;
    if(p.date){ if(!next || p.date<next.date) next=p; }
  });
  return {owed, anyOverdue, next};
}
function _vendorOwedPillHtml(vendorId){
  const s=_vendorOwedSummary(vendorId);
  if(!s) return '';
  const nextLabel = s.next
    ? `${s.next.kind==='balance'?'Bal':'Dep'} · ${fmtBudgetDate(s.next.date)}`
    : 'No due date';
  const cls = s.anyOverdue ? 'vpt-owed-pill over' : 'vpt-owed-pill';
  const word = s.anyOverdue ? 'overdue' : 'owing';
  return `<button class="${cls}" onclick="event.stopPropagation();openVendorPaymentTimeline('${vendorId}')" title="View this vendor's payments">${fmt(s.owed)} ${word}<span class="vpt-owed-next">${nextLabel}</span></button>`;
}
function openVendorPaymentTimeline(vendorFilter){
  _vptVendorFilter = vendorFilter||'';
  _vptScope = 'due';
  const v = _vptVendorFilter ? (STATE.vendors||[]).find(x=>x.id===_vptVendorFilter) : null;
  const title = v ? `Payments — ${_escHtml(v.business||'Vendor')}` : 'Payment timeline';
  openModal(title, `<div id="vpt-host">${_vptBodyHtml()}</div>`,
    `<button class="btn btn-primary" onclick="closeModalDirect()">Done</button>`);
}

// ── Budget "reports" dropdown: Budget summary + Payment timeline ──
function _budgetReportsMenuHtml(){
  return `<div class="budget-reports-menu hidden" id="budget-reports-menu" onclick="event.stopPropagation()">
    <button class="brm-item" onclick="closeBudgetReportsMenu();openBudgetSummaryReport()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
      <span class="brm-text">Budget summary<span class="brm-sub">View &amp; download full report</span></span>
    </button>
    <button class="brm-item" onclick="closeBudgetReportsMenu();openVendorPaymentTimeline()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      <span class="brm-text">Payment timeline<span class="brm-sub">What's owed, when, to whom</span></span>
    </button>
  </div>`;
}
function toggleBudgetReportsMenu(ev){
  if(ev) ev.stopPropagation();
  // mutual exclusion: close cog menu if open
  const cogMenu=document.getElementById('budget-options-menu');
  if(cogMenu && cogMenu.style.display==='block'){ cogMenu.style.display='none'; _budgetOptionsMenuOpen=false; }
  const m=document.getElementById('budget-reports-menu');
  if(!m) return;
  const willOpen=m.classList.contains('hidden');
  m.classList.toggle('hidden');
  if(willOpen){
    setTimeout(()=>{ document.addEventListener('click', _budgetReportsCloser); },0);
  }
}
function closeBudgetReportsMenu(){
  const m=document.getElementById('budget-reports-menu');
  if(m) m.classList.add('hidden');
  document.removeEventListener('click', _budgetReportsCloser);
}
function _budgetReportsCloser(e){
  const wrap=document.getElementById('budget-reports-wrap');
  if(wrap && !wrap.contains(e.target)) closeBudgetReportsMenu();
}

function openBudgetSummaryReport(){
  _budgetReportShowVisual = true;
  openModal('Budget Summary', _renderBudgetReportBody(),
    `<button class="btn btn-outline" onclick="downloadBudgetSummaryHTML()" style="display:inline-flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>HTML</button>
     <button class="btn btn-outline" onclick="downloadBudgetSummaryPDF()" style="display:inline-flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>PDF</button>
     <button class="btn btn-primary" onclick="closeModalDirect()">Done</button>`);
  // Tag overlay so mobile-only width rule applies to this popup only.
  const _bso=document.getElementById('modal-overlay'); if(_bso) _bso.classList.add('budget-summary-overlay');
  // Replace the plain title with a stacked header: couple eyebrow / title / as-of date
  const titleEl=document.getElementById('modal-title');
  if(titleEl){
    const couple=_budgetCoupleName();
    titleEl.innerHTML=`${couple?`<div style="font-family:'Inter',sans-serif;font-size:9px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:3px">${couple}</div>`:''}<div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;line-height:1.05">Budget Summary</div><div style="font-family:'Inter',sans-serif;font-size:11px;color:var(--muted);margin-top:4px">As of ${_budgetAsOfDate()}</div>`;
  }
  // Duplicate compact download buttons in the header (top-right, before the close ×).
  const header=titleEl?titleEl.parentElement:null;
  if(header){
    const prev=document.getElementById('budget-report-header-actions');
    if(prev) prev.remove();
    const closeBtn=header.querySelector('.modal-close');
    const wrap=document.createElement('div');
    wrap.id='budget-report-header-actions';
    wrap.style.cssText='display:inline-flex;gap:6px;margin-left:auto;align-items:center';
    const mkBtn=(onclick,label,svg)=>`<button onclick="${onclick}" title="Download ${label}" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--gold-deep);background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:5px 9px;cursor:pointer">${svg}${label}</button>`;
    wrap.innerHTML=
      mkBtn('downloadBudgetSummaryHTML()','HTML','<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>')+
      mkBtn('downloadBudgetSummaryPDF()','PDF','<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>');
    if(closeBtn) header.insertBefore(wrap, closeBtn); else header.appendChild(wrap);
  }
}

function _buildBudgetSummaryDoc(autoPrint){
  const d=_gatherBudgetSummary();
  const ev=STATE.event||{};
  const couple=_budgetCoupleName();
  const asOf=_budgetAsOfDate();
  const docTitle=couple?`Budget Summary — ${couple}`:'Budget Summary';

  const visualHtml = _budgetReportShowVisual ? `<div class="visual">${renderBudgetSummaryBody()}</div>` : '';
  const totalBudgetRow = `<div class="totalbudget"><span class="tb-k">Total Budget</span><span class="tb-v">${fmt(d.budgetTotal)}</span></div>`;
  const listHtml = _budgetSummaryListHtml(d);

  // Force a light palette so the file always reads well, regardless of current theme
  const lightVars=`:root{--ink:#3A352F;--muted:#9A9389;--border:#E0D8CF;--connector:#E7DECF;--surface:#F3EFE9;--gold:#C4A882;--gold-deep:#8B7355;--green:#4A7C59;--red:#C0392B;--red-deep:#8B0000;--sep-ink:#9A4F95;--gt-couple:#9A7B2E;--gt-fam:#5B7BA0;--gt-house:#8A6BA8;--cream:#FFFFFF;}`;

  const slugBase=[ev.partner1,ev.partner2].filter(Boolean).join(' & ')||'budget';
  const slug=slugBase.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'budget';

  // For the "PDF" path: a Save-as-PDF button + auto-open the print dialog on load.
  // (Direct print()/window.open are blocked in some sandboxed views, so the file
  //  is downloaded first, then prints itself reliably when opened.)
  const printBar = autoPrint ? `<div class="printbar no-print"><button onclick="window.print()">Save as PDF</button><span>Use your browser's print dialog and choose “Save as PDF”.</span></div>` : '';
  const printCss = autoPrint ? `.printbar{max-width:620px;margin:0 auto 14px;display:flex;align-items:center;gap:12px}
.printbar button{font-family:inherit;font-size:13px;font-weight:600;color:#fff;background:var(--gold-deep);border:none;border-radius:8px;padding:9px 16px;cursor:pointer}
.printbar span{font-size:12px;color:var(--muted)}
@media print{.no-print{display:none!important}}` : '';
  const printScript = autoPrint ? `<script>window.addEventListener('load',function(){setTimeout(function(){try{window.focus();window.print();}catch(e){}},350);});<\/script>` : '';

  const doc=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${docTitle}</title>
<style>
${lightVars}
*{box-sizing:border-box}
body{margin:0;background:#F4EFE8;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--ink);padding:28px}
.sheet{max-width:620px;margin:0 auto;background:#fff;border:1px solid var(--border);border-radius:16px;padding:30px 32px;box-shadow:0 8px 40px rgba(0,0,0,.08)}
.eyebrow{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-deep);margin:0 0 4px}
h1{font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:600;margin:0 0 4px;color:var(--ink)}
.asof{font-size:12px;color:var(--muted);margin:0 0 22px}
.visual{background:var(--surface);border-radius:10px;padding:14px 15px;margin-bottom:18px}
.totalbudget{display:flex;align-items:center;justify-content:space-between;background:var(--surface);border-radius:9px;padding:11px 14px;margin-bottom:18px}
.tb-k{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-weight:600}
.tb-v{font-family:Georgia,serif;font-size:20px;font-weight:600;color:var(--ink)}
${printCss}
@media print{body{background:#fff;padding:0}.sheet{border:none;box-shadow:none;border-radius:0}}
</style></head>
<body>${printBar}<div class="sheet">
${couple?`<p class="eyebrow">${couple}</p>`:''}
<h1>Budget Summary</h1>
<p class="asof">As of ${asOf}</p>
${totalBudgetRow}
${visualHtml}
${listHtml}
</div>${printScript}</body></html>`;

  return { doc, slug };
}

function downloadBudgetSummaryHTML(){
  const { doc, slug }=_buildBudgetSummaryDoc();
  const blob=new Blob([doc],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const dstr=new Date().toISOString().slice(0,10);
  a.href=url; a.download=`budget-summary-${slug}-${dstr}.html`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

function downloadBudgetSummaryPDF(){
  // Direct print()/window.open are blocked in some sandboxed views, so we download
  // a self-printing file: when opened it auto-launches the print dialog (Save as PDF).
  const { doc, slug }=_buildBudgetSummaryDoc(true);
  const blob=new Blob([doc],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const dstr=new Date().toISOString().slice(0,10);
  a.href=url; a.download=`budget-summary-${slug}-${dstr}-print.html`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

// ══════════════════════════════════════════════
