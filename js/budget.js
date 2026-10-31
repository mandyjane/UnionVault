// BUDGET
// ══════════════════════════════════════════════
// Does a budget item match the query? (item name, note, or any sub-item name)
function _budgetItemMatchesSearch(b, q){
  q=_searchNorm(q); if(!q) return true;
  if(_searchNorm(b.name).includes(q)) return true;
  if(_searchNorm(b.note).includes(q)) return true;
  if(b.subItems && b.subItems.some(s=>_searchNorm(s.name).includes(q))) return true;
  return false;
}
// ── Fluid budget top-bar buttons (Invoices + Add Item) ───────────────────────
const _BG_TOP_STAGES={ rep:['Reports','Reports',''], inv:['Invoices','Invoices',''], add:['Add Payment','Payment',''] };
let _bgTopStage=0;
let _budgetOptionsMenuOpen=false;
function _applyBgTopStage(stage){
  const repBtn=document.getElementById('bg-reports-btn');
  const repL=repBtn?repBtn.querySelector('.bg-reports-label'):null;
  const invBtn=document.getElementById('bg-inv-btn');
  const invL=invBtn?invBtn.querySelector('.bg-inv-label'):null;
  const addL=document.getElementById('bg-add-btn')?.querySelector('.bg-add-label');
  if(repL){ const rt=_BG_TOP_STAGES.rep[stage]; repL.textContent=rt; repL.style.display = rt?'inline':'none'; }
  if(invL){ const it=_BG_TOP_STAGES.inv[stage]; invL.textContent=it; invL.style.display = it?'inline':'none'; }
  if(addL){ const t=_BG_TOP_STAGES.add[stage]; addL.textContent=t; addL.style.display = t?'inline':'none'; }
  if(repBtn) repBtn.style.justifyContent = (stage===2)?'center':'flex-start';
  if(invBtn) invBtn.style.justifyContent = (stage===2)?'center':'flex-start';
  // At the icon-only stage, give the three budget buttons a fixed 40px width
  // (via .bg-icon-only) so they match the app-wide icon-button width. The cog
  // (.btn-icon) is separate and stays 30×30.
  [repBtn,invBtn,document.getElementById('bg-add-btn')].forEach(b=>{ if(b) b.classList.toggle('bg-icon-only', stage===2); });
}
function _fitBudgetTopBtns(){
  const actions=document.getElementById('topbar-actions');
  const header=actions?actions.closest('.topbar'):null;
  if(!actions||!header||!document.getElementById('bg-add-btn')) return;
  const cs=getComputedStyle(header);
  const padL=parseFloat(cs.paddingLeft)||0, padR=parseFloat(cs.paddingRight)||0, gap=parseFloat(cs.columnGap||cs.gap)||12;
  const avail=(header.clientWidth-padL-padR) - 150 - gap;
  const acs=getComputedStyle(actions);
  const aGap=parseFloat(acs.columnGap||acs.gap)||8;
  function natural(){ const kids=Array.from(actions.children); let w=0; kids.forEach(k=>w+=k.scrollWidth); return w+aGap*Math.max(0,kids.length-1); }
  let chosen=2;
  for(let s=0;s<3;s++){ _applyBgTopStage(s); if(natural()<=avail){ chosen=s; break; } }
  _bgTopStage=chosen; _applyBgTopStage(chosen);
}
let _bgTopRO=null;
function _ensureBudgetTopObserver(){
  const header=document.querySelector('.topbar');
  if(!header || _bgTopRO) return;
  if(typeof ResizeObserver!=='function') return;
  _bgTopRO=new ResizeObserver(()=>{ if(document.getElementById('bg-add-btn')) requestAnimationFrame(_fitBudgetTopBtns); });
  _bgTopRO.observe(header);
}
window.addEventListener('resize', ()=>{ if(document.getElementById('bg-add-btn')) _fitBudgetTopBtns(); });
// Crossing the mobile/desktop boundary changes the offered text-size options and the
// clamp, so re-apply the zoom and rebuild the segment if it's on screen.
let _budgetTextSizeWasMobile=null;
window.addEventListener('resize', ()=>{
  if(_currentPage!=='budget') return;
  const m=window.innerWidth<=900;
  if(_budgetTextSizeWasMobile===m) { _applyBudgetTextSize(); return; }
  _budgetTextSizeWasMobile=m;
  _applyBudgetTextSize();
  const seg=document.getElementById('budget-textsize-seg');
  if(seg) seg.innerHTML=_budgetTextSizeSegInner();
});
// ── Fluid budget summary row (Hide/Reorder labels + RSVP toggle) ─────────────
// 3 stages: full → RSVP collapses to icon+count → Hide/Reorder become icons too.
let _bgSummaryStage=0;
function _applyBgSummaryStage(stage){
  // The tools row now wraps to a second line on narrow widths (flex-wrap) instead of
  // collapsing the Options/Reorder labels to icons, so keep those labels always shown.
  document.querySelectorAll('#bg-tools-row .bg-tool-label').forEach(l=>{ l.style.display='inline'; });
  ['bg-hide-btn','bg-reorder-btn'].forEach(id=>{ const b=document.getElementById(id); if(b) b.style.gap='5px'; });
  const rsvpWord=document.querySelector('#bg-rsvp-btn .bg-rsvp-word');
  const rsvpIcon=document.querySelector('#bg-rsvp-btn .bg-rsvp-icon');
  if(rsvpWord) rsvpWord.style.display = (stage>=2)?'none':'inline';
  if(rsvpIcon) rsvpIcon.style.display = (stage>=2)?'inline-block':'none';
}
function _fitBudgetSummaryRow(){
  const card=document.querySelector('.budget-total-card');
  const headRow=document.querySelector('.summary-head');
  const search=document.getElementById('budget-search-wrap');
  if(!card||!headRow||!document.getElementById('bg-tools-row')||!search) return;
  // Decide if Total Budget + search + tools fit on one line. Measure the
  // non-search items at natural width + a sensible search minimum; if the row is
  // too narrow, drop the SEARCH to its own full-width line (left-aligned) while
  // Total Budget and the tools stay together on line one. When wide, the search
  // sits in the middle (between Total Budget and the tools).
  const SEARCH_MIN=200;           // px the search wants on line one
  const cs=getComputedStyle(headRow);
  const gap=parseFloat(cs.columnGap||cs.gap)||10;
  let others=0, n=0;
  Array.from(headRow.children).forEach(ch=>{
    if(ch===search) return;
    others+=ch.scrollWidth; n++;
  });
  // total needed on one line = others + gaps(between all items incl search) + search min
  const needed = others + SEARCH_MIN + gap*(n /*gaps incl search*/);
  const fitsOneLine = needed <= headRow.clientWidth + 1;
  if(fitsOneLine){
    // Wide: search in the middle, flexible.
    search.style.order='0';
    search.style.flex='1 1 200px';
    search.style.flexBasis='200px';
    search.style.width='';
    search.style.maxWidth='';
    search.style.marginLeft='0';
  } else {
    // Narrow: search drops to its own line, pinned left at a fixed width (≈300px),
    // not stretched full-width. Total Budget + tools stay together on line one.
    search.style.order='3';
    search.style.flex='0 0 300px';
    search.style.flexBasis='300px';
    search.style.width='300px';
    search.style.maxWidth='100%';
    search.style.marginLeft='0';
    search.style.marginRight='auto';
  }
}
let _bgSumRO=null;
function _ensureBudgetSummaryObserver(){
  const card=document.querySelector('.budget-total-card');
  if(!card || _bgSumRO) return;
  if(typeof ResizeObserver!=='function') return;
  _bgSumRO=new ResizeObserver(()=>{ if(document.getElementById('bg-tools-row')) requestAnimationFrame(_fitBudgetSummaryRow); });
  _bgSumRO.observe(card);
}
window.addEventListener('resize', ()=>{ if(document.getElementById('bg-tools-row')) _fitBudgetSummaryRow(); });
function renderBudget(c,actions){
  if(typeof closeDots==='function') closeDots(); // sweep any portaled ··· menu before rebuilding rows
  // Auto-mark any past-due installments paid (when enabled) before computing figures.
  if(_autoCheckPassedInstallments()) saveToStorage();
  const rsvpCount = _rsvpPerHeadCount();
  const useRsvp = STATE.budget.useRsvpCount||false;
  actions.innerHTML=`
    <span id="budget-reports-wrap" style="position:relative;display:inline-flex">
      <button class="btn btn-outline btn-sm" id="bg-reports-btn" onclick="toggleBudgetReportsMenu(event)" style="display:inline-flex;align-items:center;gap:5px;padding:7px 11px;font-size:12px;white-space:nowrap" title="Reports &amp; payment timeline" aria-haspopup="true">
        <svg class="bg-btn-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        <span class="bg-reports-label">Reports</span>
      </button>${_budgetReportsMenuHtml()}
    </span>
    <button class="btn btn-outline btn-sm" id="bg-inv-btn" onclick="renderAllInvoices()" style="display:inline-flex;align-items:center;gap:5px;padding:7px 12px;font-size:12px;white-space:nowrap" title="View all documents">
      <svg class="bg-btn-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      <span class="bg-inv-label">Invoices</span>
    </button>
    <button class="btn btn-primary btn-sm" id="bg-add-btn" onclick="_calAddPayment(null)" style="padding:7px 12px;font-size:12px;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:5px"><span class="bg-add-plus" style="display:inline-flex">${_plusIcon()}</span><span class="bg-add-label" style="white-space:nowrap">Add Payment</span></button>
    <div id="budget-options-wrap" style="position:relative;display:inline-flex">
      <button class="btn-icon" id="bg-hide-btn" onclick="openBudgetHidePopup(event)" title="Budget options" aria-label="Budget options" aria-haspopup="true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
      ${_budgetOptionsMenuHtml()}
    </div>`;
  // Apply last-known stage immediately (pre-paint) to avoid flash, then re-measure.
  _applyBgTopStage(_bgTopStage);
  _applyBudgetTextSize();
  setTimeout(()=>{ _ensureBudgetTopObserver(); requestAnimationFrame(_fitBudgetTopBtns); }, 0);
  const totalCost=STATE.budget.items.reduce((a,b)=>a+calcBudgetItemTotal(b),0);
  const totalSpent=STATE.budget.items.reduce((a,b)=>a+Number(b.deposit||0),0);
  const budgetTotal=STATE.budget.total||0;
  c.innerHTML=`
  ${useRsvp?`<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 14px;background:var(--parchment);border-radius:8px;border:1px solid var(--border);font-size:13px;color:var(--gold-deep)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    Per-head sub-items are calculated using <strong>${rsvpCount} RSVP'd guests</strong>. Switch to <em>Custom</em> to use per-item guest numbers instead.
  </div>`:''}
  <div class="card budget-total-card fullbleed-banner" style="margin:-32px -28px ${_hasBudgetAlerts()?'4px':'20px'};padding:14px 24px 14px;border-radius:0;border-left:none;border-right:none;border-top:none;position:sticky;top:-32px;z-index:40;box-shadow:0 2px 10px rgba(0,0,0,.05)">
    ${((STATE.settings&&STATE.settings.budgetPanelCollapsed)||!_budgetShown('summary'))?`<div style="display:flex;align-items:center;gap:10px;${(STATE.settings&&STATE.settings.budgetPanelCollapsed)?'':'margin-bottom:10px'}">
      <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gold-deep)">Budget</span>
      ${(()=>{
        const collapsed=(STATE.settings&&STATE.settings.budgetPanelCollapsed);
        const summaryHidden=!_budgetShown('summary');
        // Show the compact "· $X allocated · $Y owing" strip when the panel is
        // collapsed OR when the Budget Summary section is hidden via options.
        if(!collapsed && !summaryHidden) return '';
        const f=_budgetSummaryFigures();
        const _sbOwing=(STATE.budget.items||[]).reduce((s,b)=>s+calcBudgetBalance(b),0);
        const _sbCommitted=(STATE.budget.items||[]).reduce((s,b)=>s+calcBudgetCommitted(b),0);
        const _sbAllocated=f.budgetTotal||f.totalCost;
        const _sbLeft=f.budgetTotal?f.budgetTotal-_sbCommitted:0;
        const _sbOver=f.budgetTotal&&_sbCommitted>f.budgetTotal;
        const _sep=`<span style="display:inline-block;width:.5px;height:11px;background:var(--border);margin:0 11px;vertical-align:middle"></span>`;
        // Paid (green), Owing (gold), Left (green) or Over (red)
        const _sbPaidFig=f.totalPaid>0?`${_sep}<b style="color:var(--green);font-weight:600">${fmt(f.totalPaid)}</b>&nbsp;<span style="color:var(--muted)">paid</span>`:'';
        const _sbOwingFig=_sbOwing>0?`${_sep}<b style="color:var(--gold-deep);font-weight:600">${fmt(_sbOwing)}</b>&nbsp;<span style="color:var(--muted)">owing</span>`:'';
        const _sbLeftFig=f.budgetTotal?(_sbOver?`${_sep}<b style="color:var(--red);font-weight:600">${fmt(_sbCommitted-f.budgetTotal)}</b>&nbsp;<span style="color:var(--muted)">over</span>`:`${_sep}<b style="color:var(--green);font-weight:600">${fmt(_sbLeft)}</b>&nbsp;<span style="color:var(--muted)">left</span>`):'';
        return `<span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11.5px;display:flex;flex:1;align-items:center;flex-wrap:wrap;gap:0"><span style="color:var(--muted)">·</span>&nbsp;<b style="color:var(--ink);font-weight:700">${fmt(_sbAllocated)}</b>&nbsp;<span style="color:var(--muted)">${f.budgetTotal?'allocated':'total'}</span>${_sbPaidFig}${_sbOwingFig}${_sbLeftFig}</span>`;
      })()}
      ${!_budgetShown('summary')?`<button class="budget-report-inline-btn" onclick="openBudgetSummaryReport()" title="View &amp; download full budget summary" aria-label="View and download budget summary" style="flex-shrink:0;margin-left:6px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
        <span class="brib-label">Summary</span>
      </button>`:''}
      <button class="budget-layout-btn" onclick="toggleBudgetPanel()" title="${(STATE.settings&&STATE.settings.budgetPanelCollapsed)?'Expand panel':'Collapse panel'}" aria-label="Collapse budget panel" style="margin-left:auto;flex-shrink:0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${(STATE.settings&&STATE.settings.budgetPanelCollapsed)?'<polyline points="6 9 12 15 18 9"/>':'<polyline points="18 15 12 9 6 15"/>'}</svg>
      </button>
    </div>`:''}
    <div id="budget-panel-body" style="${(STATE.settings&&STATE.settings.budgetPanelCollapsed)?'display:none':''}">
    ${_budgetShown('summary')?`<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
      <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--gold-deep)">Budget summary</span>
      <button class="budget-layout-btn" onclick="toggleBudgetPanel()" title="Collapse panel" aria-label="Collapse budget panel" style="margin-left:auto;flex-shrink:0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
    </div>`:''}
    <div class="summary-head" style="display:flex;align-items:center;justify-content:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:12px">
      <div style="position:relative;display:inline-flex;align-items:center;flex-shrink:0">
        <span style="position:absolute;left:11px;font-size:13.5px;color:var(--gold-deep);pointer-events:none">$</span>
        <input class="form-input budget-total-input${_budgetAmountLocked()?' locked':''}" type="number" value="${budgetTotal||''}" placeholder="Total budget" ${_budgetAmountLocked()?'readonly':''} oninput="STATE.budget.total=Number(this.value);updateBudgetSummary()"/>
        ${_budgetLockBtnHtml()}
      </div>
      <div id="budget-search-wrap" class="budget-search-inline" style="flex:1 1 200px;min-width:180px;margin-left:0">${_searchBarHtml('budget-search', _budgetSearch, 'setBudgetSearch', 'Search budget…')}</div>
    </div>
    <div id="budget-summary-body" style="position:relative">${_budgetShown('summary')?_budgetSummaryWithCorner():''}</div>
    </div>
  </div>
  ${_renderBudgetAlertsBar()}
  ${_budgetJumpBarHtml()}
  <div id="budget-items">${_budgetItemsListHtml()}</div>`;
  // Apply remembered summary-row stage immediately (pre-paint) to avoid flash, then re-measure.
  _applyBgSummaryStage(_bgSummaryStage);
  setTimeout(()=>{ _ensureBudgetSummaryObserver(); requestAnimationFrame(_fitBudgetSummaryRow); }, 0);
  // Width-watch each budget card so sub-item rows reflow their date+amount onto
  // line 2 based on actual content width (independent of sidebar/window).
  setTimeout(()=>{ _ensureBudgetSubReflowObserver(); requestAnimationFrame(_fitAllBudgetSubRows); _positionPinnedAlerts('budget'); }, 0);
  // Decide PAID-IN-FULL vs link-icon ordering per category header (3 wrap modes).
  setTimeout(()=>{ _ensureBudgetPaidLinkObserver(); requestAnimationFrame(_fitAllBudgetPaidLink); }, 0);
  // Position the jump bar under the (variable-height) summary banner.
  setTimeout(()=>{ requestAnimationFrame(_positionBudgetJumpBar); }, 0);
}

// ---- Budget row narrow-width reflow (JS width-watcher) ----
// Drops a row's right-side group onto line 2 when the row is too narrow to show
// it alongside a reasonable amount of the name. Works for sub-item rows
// (.bsub-head → .bsub-rightgrp, flexible name = input/pill) and item rows
// (.bi-head → .bi-total-block, flexible name = .bi-name). Measurement-based so
// it fires on the real content-area width, independent of sidebar/window.
let _bgSubRO=null;
let _bgSubSettling=false;
let _bgSubRoLastW=new WeakMap();
const _ROW_MIN_NAME_PX=56; // keep at least this much for the name on line 1; the
// name truncates/wraps (2-line clamp) before the total is pushed to its own line.
// Genuinely narrow screens still stack via the 560px media query.
function _fitOneBudgetRow(head, nameSel){
  if(!head) return;
  // Capture the current state for hysteresis before we strip it to measure.
  const wasNarrow=head.classList.contains('bsub-narrow');
  // Always measure in the unwrapped state for a stable reading.
  head.classList.remove('bsub-narrow');
  const cs=getComputedStyle(head);
  const padL=parseFloat(cs.paddingLeft||'0');
  const padR=parseFloat(cs.paddingRight||'0');
  const rowInner=head.clientWidth-padL-padR;
  if(rowInner<=0) return;
  const gap=parseFloat(cs.columnGap||cs.gap||'8')||8;
  const nameEl=head.querySelector(nameSel);
  // Sum widths of every child except the flexible name element and any flex
  // spacers (flex-grow>0), which expand to fill free space and would otherwise
  // make nameSpace read as ~0 and wrongly force the narrow/wrapped layout.
  let nonName=0, count=0;
  Array.from(head.children).forEach(ch=>{
    count++;
    if(ch===nameEl) return;
    const fg=parseFloat(getComputedStyle(ch).flexGrow||'0')||0;
    if(fg>0) return; // skip flex spacers
    nonName+=ch.getBoundingClientRect().width;
  });
  const gaps=Math.max(0,count-1)*gap;
  const nameSpace=rowInner-nonName-gaps;
  // Hysteresis: once narrow, require clearly more room before going wide again, so a
  // width sitting within a pixel of the threshold can't flip-flop (the jump glitch).
  const threshold=_ROW_MIN_NAME_PX + (wasNarrow?10:0);
  if(nameSpace < threshold) head.classList.add('bsub-narrow');
}
function _fitBudgetSubRowsFor(card){
  if(!card) return;
  card.querySelectorAll('.bsub-head').forEach(h=>_fitOneBudgetRow(h, 'input, [id^="subname-pill-"]'));
  card.querySelectorAll('.bi-head').forEach(h=>_fitOneBudgetRow(h, '.bi-namewrap'));
}
function _fitAllBudgetSubRows(){
  document.querySelectorAll('.budget-item').forEach(_fitBudgetSubRowsFor);
}
// ── PAID IN FULL vs link-icon ordering fitter ──
// For category headers where BOTH the PAID-IN-FULL badge and the link icon are present,
// pick one of three layouts based on available width:
//   A  name · PAID · link         (all fit on line 1)
//   B  line1: name · link         line2: PAID            (name+link fit, badge doesn't)
//   C  line1: name                line2: PAID · link     (only the name fits on line 1)
// Measured on an offscreen clone so the live row is never mutated mid-measure.
let _bplRO=null, _bplRoLastW=null;
function _fitAllBudgetPaidLink(){
  document.querySelectorAll('.bpl-row').forEach(_fitBudgetPaidLink);
}
function _fitBudgetPaidLink(row){
  if(!row || !row.isConnected) return;
  const name=row.querySelector('.bi-name');
  const badge=row.querySelector('.bpl-badge');
  const link=row.querySelector('.bpl-link');
  if(!name || !badge || !link) return;
  const avail=row.clientWidth - 1; // tolerance
  if(avail<=0) return;
  // Natural element widths (current rendered; name may already be shrunk — that's fine,
  // we only need to know whether the trio/pair fit beside it).
  const icon=row.querySelector('.bi-icon');
  const gap=parseFloat(getComputedStyle(row).columnGap||getComputedStyle(row).gap||'8')||8;
  const wIcon = icon ? icon.getBoundingClientRect().width + gap : 0;
  const wName = Math.max(name.scrollWidth, name.getBoundingClientRect().width);
  const wBadge = badge.getBoundingClientRect().width;
  const wLink = link.getBoundingClientRect().width;
  const line1 = wIcon + wName;
  const fitsAll  = (line1 + gap + wBadge + gap + wLink) <= avail;
  const fitsLink = (line1 + gap + wLink) <= avail;
  let mode = fitsAll ? 'a' : (fitsLink ? 'b' : 'c');
  const cls = 'bpl-'+mode;
  if(!row.classList.contains(cls)){
    row.classList.remove('bpl-a','bpl-b','bpl-c');
    row.classList.add(cls);
  }
}
function _ensureBudgetPaidLinkObserver(){
  if(typeof ResizeObserver!=='function') return;
  if(_bplRO) _bplRO.disconnect();
  _bplRoLastW=new WeakMap();
  _bplRO=new ResizeObserver(entries=>{
    const changed=[];
    for(const e of entries){
      const w=e.contentRect.width;
      const prev=_bplRoLastW.get(e.target);
      if(prev===undefined || Math.abs(w-prev)>=6) changed.push(e.target);
      _bplRoLastW.set(e.target, w);
    }
    if(!changed.length) return;
    requestAnimationFrame(()=>changed.forEach(_fitBudgetPaidLink));
  });
  document.querySelectorAll('.bpl-row').forEach(r=>{ _bplRO.observe(r); _bplRoLastW.set(r, r.clientWidth); });
}
function _ensureBudgetSubReflowObserver(){
  if(typeof ResizeObserver!=='function') return; // graceful fallback: mobile media query still applies
  if(_bgSubRO) _bgSubRO.disconnect();
  _bgSubRoLastW=new WeakMap();
  _bgSubRO=new ResizeObserver(entries=>{
    // Same flicker class as the guest button fitter: _fitBudgetSubRowsFor toggles
    // .bsub-narrow, which reflows the header the observer watches → re-fit → jump.
    // Ignore (a) resizes during our own settle window and (b) sub-pixel flex jitter
    // below a real threshold, so the header can't oscillate at the wrap boundary.
    if(_bgSubSettling) return;
    const meaningful=[];
    for(const e of entries){
      const w=e.contentRect.width;
      const prev=_bgSubRoLastW.get(e.target);
      if(prev===undefined || Math.abs(w-prev)>=6) meaningful.push(e.target);
      _bgSubRoLastW.set(e.target, w);
    }
    if(!meaningful.length) return;
    _bgSubSettling=true;
    requestAnimationFrame(()=>{
      meaningful.forEach(t=>_fitBudgetSubRowsFor(t));
      // Release after this frame's RO callback (next task), not before, so the
      // reflow our class write causes isn't mistaken for an external resize.
      setTimeout(()=>{ _bgSubSettling=false; }, 0);
    });
  });
  document.querySelectorAll('.budget-item').forEach(card=>_bgSubRO.observe(card));
  // Backstop: also recompute on window resize (covers sidebar collapse/expand
  // and any case the per-card observer might miss). Attach once.
  if(!_bgSubResizeBound){
    _bgSubResizeBound=true;
    window.addEventListener('resize',()=>{ requestAnimationFrame(_fitAllBudgetSubRows); });
  }
}
let _bgSubResizeBound=false;

function _collectBudgetAlerts(b){
  const today = new Date(); today.setHours(0,0,0,0);
  const out = [];
  const depPaid = b.depositPaid||false;
  const balPaid = b.paid||false;
  if(!b.depositFromSubs && b.depositDueDate && !depPaid){
    const diff = (new Date(b.depositDueDate+'T00:00:00')-today)/86400000;
    if(diff<0) out.push({label:`"${b.name||'Item'}" deposit overdue`,date:b.depositDueDate,overdue:true,itemId:b.id,subId:'',kind:'deposit'});
    else if(diff<=_budgetDueWindow()) out.push({label:`"${b.name||'Item'}" deposit due`,date:b.depositDueDate,overdue:false,itemId:b.id,subId:'',kind:'deposit'});
  }
  if(b.balanceDueDate && !balPaid){
    const diff = (new Date(b.balanceDueDate+'T00:00:00')-today)/86400000;
    if(diff<0) out.push({label:`"${b.name||'Item'}" balance overdue`,date:b.balanceDueDate,overdue:true,itemId:b.id,subId:'',kind:'balance'});
    else if(diff<=_budgetDueWindow()) out.push({label:`"${b.name||'Item'}" balance due`,date:b.balanceDueDate,overdue:false,itemId:b.id,subId:'',kind:'balance'});
  }
  if(b.subItems) b.subItems.forEach(s=>{
    if(s.depositDueDate && !s.depositPaid){
      const diff = (new Date(s.depositDueDate+'T00:00:00')-today)/86400000;
      if(diff<0) out.push({label:`"${s.name}" deposit overdue`,date:s.depositDueDate,overdue:true,itemId:b.id,subId:s.id,kind:'deposit'});
      else if(diff<=_budgetDueWindow()) out.push({label:`"${s.name}" deposit due`,date:s.depositDueDate,overdue:false,itemId:b.id,subId:s.id,kind:'deposit'});
    }
    if(s.balanceDueDate && !s.paid){
      const diff = (new Date(s.balanceDueDate+'T00:00:00')-today)/86400000;
      if(diff<0) out.push({label:`"${s.name}" balance overdue`,date:s.balanceDueDate,overdue:true,itemId:b.id,subId:s.id,kind:'balance'});
      else if(diff<=_budgetDueWindow()) out.push({label:`"${s.name}" balance due`,date:s.balanceDueDate,overdue:false,itemId:b.id,subId:s.id,kind:'balance'});
    }
  });
  return out;
}

// Side-menu Budget status icon: red triangle if anything is overdue, else an
// amber "due soon" info-circle if anything falls inside the due window.
// Only one icon shows at a time, overdue taking precedence. Gated by the
// "Show Budget alert icon in menu" setting (on by default).
const _NAV_BUDGET_OVERDUE_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const _NAV_BUDGET_SOON_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
// ── Unseated-guest nudge (v135) ────────────────────────────────────────────
// Guests who have said YES and have no chair. Deliberately ATTENDING-ONLY and
// independent of the `seatingAttendingOnly` display toggle: you cannot seat
// someone who has not replied, so an awaiting guest is not a thing to act on.
// List type A only, matching every other seating reader.
function _unseatedAttending(){
  const seated=new Set();
  if(STATE.seating&&typeof STATE.seating==='object'){
    Object.keys(STATE.seating).forEach(tid=>{ (STATE.seating[tid]||[]).forEach(id=>{ if(id) seated.add(id); }); });
  }
  return (STATE.guests||[]).filter(g=>g&&g.rsvp==='attending'&&(g.listType||'A')==='A'&&!seated.has(g.id));
}
const _NAV_SEAT_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.8"/><path d="M5 20v-1.5a4.5 4.5 0 0 1 4.5-4.5h5a4.5 4.5 0 0 1 4.5 4.5V20"/></svg>`;
// Side-menu Seating icon + count. Gated by "Show Seating alert icon in menu"
// (on by default), like the Budget and Checklist badges.
function _updateSeatingNavBadge(){
  const el = document.getElementById('nav-seating-badge');
  if(!el) return;
  const on = !(STATE.settings && STATE.settings.hideSeatingNavIcon);
  const n = on ? _unseatedAttending().length : 0;
  if(!n){ el.style.display='none'; el.innerHTML=''; el.removeAttribute('title'); return; }
  el.innerHTML = _NAV_SEAT_SVG + '<span class="nav-seat-count">'+n+'</span>';
  el.style.color = 'var(--gold-deep)';
  el.title = n+' attending guest'+(n!==1?'s aren\u2019t':' isn\u2019t')+' seated';
  el.style.display = 'inline-flex';
}
// The banner on the Seating page. Rendered in BOTH views (list and floorplan),
// directly under the sticky bar, because the thing it is about lives on this
// page. It is not a third entry in the global alerts stack.
function _unseatedBannerHtml(){
  const u=_unseatedAttending();
  if(!u.length) return '';
  const names=u.slice(0,3).map(g=>_escHtml(g.name||'Guest'));
  const more=u.length-names.length;
  let sub=names.join(', ');
  if(names.length>1) sub=names.slice(0,-1).join(', ')+' and '+names[names.length-1];
  if(more>0) sub=names.join(', ')+' and '+more+' more';
  return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:11px 13px;background:var(--parchment);border:.5px solid var(--gold);border-radius:9px">
    <span style="color:var(--gold-deep);flex-shrink:0;display:inline-flex">${_NAV_SEAT_SVG.replace('width="14" height="14"','width="17" height="17"')}</span>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;color:var(--ink)">${u.length} attending guest${u.length!==1?'s aren\u2019t':' isn\u2019t'} seated</div>
      <div style="font-size:11.5px;color:var(--muted);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sub}</div>
    </div>
    <button class="btn btn-outline btn-sm" onclick="_focusUnseatedPool()" style="flex-shrink:0;white-space:nowrap">Seat them</button>
  </div>`;
}
// "Seat them" scrolls to the Unassigned pool on THIS page. It does not navigate:
// you are already where the work happens.
function _focusUnseatedPool(){
  const el=document.getElementById('seating-pool');
  if(!el) return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  el.classList.add('pool-drop-active');
  setTimeout(()=>{ el.classList.remove('pool-drop-active'); },1400);
}
function _updateBudgetNavBadge(){
  const el = document.getElementById('nav-budget-badge');
  if(!el) return;
  const on = !(STATE.settings && STATE.settings.hideBudgetNavIcon);
  if(!on){ el.style.display='none'; el.innerHTML=''; el.removeAttribute('title'); return; }
  const all = [];
  (STATE.budget && STATE.budget.items || []).forEach(b=>{ _collectBudgetAlerts(b).forEach(a=>all.push(a)); });
  const hasOverdue = all.some(a=>a.overdue);
  const hasSoon = all.length>0;
  const dark = document.body.classList.contains('dark');
  if(hasOverdue){
    el.innerHTML = _NAV_BUDGET_OVERDUE_SVG;
    el.style.color = dark ? '#E08080' : 'var(--red-deep)';
    el.title = 'A budget payment is overdue';
    el.style.display = 'inline-flex';
  } else if(hasSoon){
    el.innerHTML = _NAV_BUDGET_SOON_SVG;
    el.style.color = '#C9A14A';
    el.title = 'A budget payment is due soon';
    el.style.display = 'inline-flex';
  } else {
    el.style.display = 'none';
    el.innerHTML = '';
    el.removeAttribute('title');
  }
}

// Side-menu Checklist status icon: red triangle if any active task is overdue,
// else an amber "due soon" info-circle if any falls inside the due window.
// Same precedence and treatment as the budget badge. Counts only un-done,
// non-archived tasks that have a due date. Gated by the "Show Checklist alert
// icon in menu" setting (on by default).
function _updateChecklistNavBadge(){
  const el = document.getElementById('nav-checklist-badge');
  if(!el) return;
  const on = !(STATE.settings && STATE.settings.hideChecklistNavIcon);
  if(!on){ el.style.display='none'; el.innerHTML=''; el.removeAttribute('title'); return; }
  const today = new Date(); today.setHours(0,0,0,0);
  const win = _clDueWindow();
  let hasOverdue=false, hasSoon=false;
  (STATE.checklist||[]).forEach(t=>{
    if(!t || t.done || t.archived || !t.dueDate) return;
    const diff = (new Date(t.dueDate+'T00:00:00')-today)/86400000;
    if(diff<0) hasOverdue=true;
    else if(diff<=win) hasSoon=true;
  });
  const dark = document.body.classList.contains('dark');
  if(hasOverdue){
    el.innerHTML = _NAV_BUDGET_OVERDUE_SVG;
    el.style.color = dark ? '#E08080' : 'var(--red-deep)';
    el.title = 'A checklist task is overdue';
    el.style.display = 'inline-flex';
  } else if(hasSoon){
    el.innerHTML = _NAV_BUDGET_SOON_SVG;
    el.style.color = '#C9A14A';
    el.title = 'A checklist task is due soon';
    el.style.display = 'inline-flex';
  } else {
    el.style.display = 'none';
    el.innerHTML = '';
    el.removeAttribute('title');
  }
}

var _rsvpBadgeCount=0;
function _updateRsvpNavBadge(){
  var el=document.getElementById('nav-rsvp-badge');
  if(!el) return;
  if(!_rsvpBadgeCount){el.style.display='none';el.innerHTML='';el.removeAttribute('title');return;}
  el.innerHTML='<span style="background:var(--green);color:#fff;border-radius:9px;padding:1px 6px;font-size:10.5px;font-weight:700;line-height:1.5">'+_rsvpBadgeCount+'</span>';
  el.title=_rsvpBadgeCount+' new RSVP'+(_rsvpBadgeCount!==1?'s':'');
  el.style.display='inline-flex';
}
function _markRsvpViewed(){
  try{localStorage.setItem('rsvp_last_viewed',new Date().toISOString());}catch(e){}
  _rsvpBadgeCount=0;
  _updateRsvpNavBadge();
}
async function _fetchRsvpBadgeCount(){
  if(!_sbSession) return;
  try{
    var uid=_sbSession.user.id;
    var lastViewed='';
    try{lastViewed=localStorage.getItem('rsvp_last_viewed')||'';}catch(e){}
    var url=_SB_URL+'/rest/v1/rsvp_responses?couple_id=eq.'+encodeURIComponent(uid)+'&select=id';
    if(lastViewed) url+='&created_at=gt.'+encodeURIComponent(lastViewed);
    var res=await fetch(url,{headers:{'apikey':_SB_KEY,'Authorization':_sbAuthHdr(),'Accept':'application/json','Prefer':'count=exact','Range-Unit':'items','Range':'0-0'}});
    if(!res.ok) return;
    var cr=res.headers.get('content-range')||'';
    var match=cr.match(/\/(\d+)$/);
    _rsvpBadgeCount=match?parseInt(match[1],10):0;
    _updateRsvpNavBadge();
  }catch(e){}
}

function _hasBudgetAlerts(){
  if(STATE.settings && STATE.settings.hidePaymentAlerts) return false;
  for(const b of (STATE.budget.items||[])){ if(_collectBudgetAlerts(b).length) return true; }
  return false;
}
function _renderBudgetAlertsBar(){
  if(STATE.settings && STATE.settings.hidePaymentAlerts) return '';
  const all = [];
  (STATE.budget.items||[]).forEach(b=>{ _collectBudgetAlerts(b).forEach(a=>all.push(a)); });
  if(!all.length) return '';
  // Overdue first, then by date
  all.sort((x,y)=>{
    if(x.overdue!==y.overdue) return x.overdue?-1:1;
    return (x.date||'')<(y.date||'')?-1:(x.date||'')>(y.date||'')?1:0;
  });
  const collapsed = !!(STATE.settings && STATE.settings.budgetAlertsCollapsed);
  const hasOverdue = all.some(a=>a.overdue);
  const rows = all.map(a=>`<div role="button" tabindex="0" onclick="focusBudgetAlert('${a.itemId}','${a.subId}','${a.kind}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();focusBudgetAlert('${a.itemId}','${a.subId}','${a.kind}')}" title="Go to this item" class="${a.overdue?'budget-alert alert-overdue':'budget-alert alert-soon'}" style="display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:500;padding:2px 10px;border-radius:6px;cursor:pointer">
      ${a.overdue
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`}
      <span>${a.label}${a.overdue?'':` — ${fmtBudgetDate(a.date)}`}${a.overdue?` (${fmtBudgetDate(a.date)})`:''}</span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-left:auto;opacity:.6"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`).join('');
  const pinned = !!(STATE.settings && STATE.settings.budgetAlertsPinned);
  // Header: collapsed shows an alert icon next to the chevron; count badge always shown.
  const alertIcon = `<span style="color:${hasOverdue?'var(--red-deep)':'var(--red)'};display:inline-flex;flex-shrink:0"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>`;
  const countBadge = `<span style="font-size:10px;color:${hasOverdue?'var(--red-deep)':'var(--red)'};background:${hasOverdue?'rgba(139,0,0,.08)':'rgba(192,57,43,.08)'};border-radius:9px;padding:1px 7px;flex-shrink:0">${all.length}</span>`;
  const pinBtn=_alertPinBtnHtml(pinned, '_toggleBudgetAlertsPin');
  const chevron = collapsed
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;flex-shrink:0;color:var(--muted)"><polyline points="9 18 15 12 9 6"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;flex-shrink:0;color:var(--muted)"><polyline points="6 9 12 15 18 9"/></svg>`;
  const header = `<div role="button" tabindex="0" onclick="_toggleBudgetAlerts()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();_toggleBudgetAlerts()}" title="${collapsed?'Show payment alerts':'Hide payment alerts'}" style="display:flex;align-items:center;gap:6px;cursor:pointer;${collapsed?'':'padding-bottom:5px;border-bottom:1px solid var(--border);margin-bottom:5px'}">
      ${pinBtn}
      ${collapsed?alertIcon:''}
      <span style="font-size:11.5px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Payment alerts</span>
      ${countBadge}
      ${chevron}
    </div>`;
  const stickyStyle = pinned ? 'position:sticky;top:var(--alert-pin-top, 44px);z-index:39;' : '';
  const topMargin = pinned ? '4px' : '0';
  return `<div class="card${pinned?' alert-pinned':''}" style="margin:${topMargin} 0 12px;padding:10px 12px;${stickyStyle}">
    ${header}
    ${collapsed?'':`<div style="display:flex;flex-direction:column;gap:2px">${rows}</div>`}
  </div>`;
}
function _toggleBudgetAlerts(){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.budgetAlertsCollapsed = !STATE.settings.budgetAlertsCollapsed;
  saveToStorage();
  navigate('budget');
}
function _toggleBudgetAlertsPin(){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.budgetAlertsPinned=!STATE.settings.budgetAlertsPinned;
  saveToStorage();
  navigate('budget');
}
// ── Checklist task alerts ────────────────────────────────────────────────────
// Collect incomplete tasks that are overdue / due-soon by their OWN due date,
// and (for linked tasks) whether the linked payment is overdue / due-soon.
function _collectTaskAlerts(){
  const today=new Date(); today.setHours(0,0,0,0);
  const clWin=_clDueWindow(), bWin=_budgetDueWindow();
  const out=[];
  (STATE.checklist||[]).forEach(t=>{
    if(t.done) return;
    let taskState=null, taskDate=t.dueDate||'';
    if(t.dueDate){
      const diff=(new Date(t.dueDate+'T00:00:00')-today)/86400000;
      if(diff<0) taskState='overdue'; else if(diff<=clWin) taskState='soon';
    }
    // Linked payment state (balance due of linked sub-item or item) + deposit due.
    let payState=null, payDate='', payLabel='', payKind='balance', linkBudgetId='', linkBudgetSubId='';
    if(t.budgetId){
      const b=STATE.budget.items.find(x=>x.id===t.budgetId);
      if(b){
        linkBudgetId=b.id;
        const s=t.budgetSubId?(b.subItems||[]).find(x=>x.id===t.budgetSubId):null;
        if(s) linkBudgetSubId=s.id;
        // Balance due
        const paid = s ? !!s.paid : !!b.paid;
        const due = s ? (s.balanceDueDate||'') : (b.balanceDueDate||'');
        if(due && !paid){
          const diff=(new Date(due+'T00:00:00')-today)/86400000;
          if(diff<0){ payState='overdue'; payDate=due; payLabel='Payment overdue'; payKind='balance'; }
          else if(diff<=bWin){ payState='soon'; payDate=due; payLabel='Payment due'; payKind='balance'; }
        }
        // Deposit due (separate alert entry below, when applicable)
        const depPaid = s ? !!s.depositPaid : !!b.depositPaid;
        const depDue = s ? (s.depositDueDate||'') : (b.depositDueDate||'');
        const hasDep = s ? (s.showDeposit||Number(s.deposit||0)>0||s.depositDueDate) : (Number(b.deposit||0)>0||b.depositDueDate);
        if(depDue && !depPaid && hasDep){
          const ddiff=(new Date(depDue+'T00:00:00')-today)/86400000;
          let depState=null, depLabel='';
          if(ddiff<0){ depState='overdue'; depLabel='Deposit overdue'; }
          else if(ddiff<=bWin){ depState='soon'; depLabel='Deposit due'; }
          if(depState){
            // Emit a deposit alert tied to this same task.
            out.push({id:t.id, text:t.text, taskState:null, taskDate:'', payState:depState, payDate:depDue, payLabel:depLabel, payKind:'deposit', budgetId:b.id, budgetSubId:linkBudgetSubId});
          }
        }
      }
    }
    // Include the entry if the task itself is due/overdue OR its (balance) payment is.
    if(taskState || payState){
      out.push({id:t.id, text:t.text, taskState, taskDate, payState, payDate, payLabel, payKind, budgetId:linkBudgetId, budgetSubId:linkBudgetSubId, appt:(_taskApptList(t)[0]||null)});
    }
  });
  // Sort: overdue (task or payment) first, then by the earliest relevant date.
  const rank=a=>(a.taskState==='overdue'||a.payState==='overdue')?0:1;
  out.sort((x,y)=>{
    if(rank(x)!==rank(y)) return rank(x)-rank(y);
    const dx=x.taskDate||x.payDate||'', dy=y.taskDate||y.payDate||'';
    return dx<dy?-1:dx>dy?1:0;
  });
  return out;
}
// ── Payment alert badges (user-selectable in Settings) ──────────────────────
// 5 styles shared by Balance and Deposit alert rows. Colour is applied by the
// caller (payment red vs deposit gold); these return just the inner glyph.
function _badgeGlyph(kind){
  switch(kind){
    case 'coins': return `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/></svg>`;
    case 'wallet': return `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`;
    case 'banknote': return `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`;
    case 'receipt': return `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/></svg>`;
    case 'dollar':
    default: return '$';
  }
}
const _BADGE_CHOICES=[['dollar','Dollar'],['coins','Coins'],['wallet','Wallet'],['banknote','Banknote'],['receipt','Receipt']];
function _balanceBadgeKind(){ return (STATE.settings && STATE.settings.balanceBadge) || 'dollar'; }
function _depositBadgeKind(){ return (STATE.settings && STATE.settings.depositBadge) || 'receipt'; }
// Compact single-line picker row for a payment badge. type='balance'|'deposit'
// (colour follows type). Label/subtitle sit left, the icon choices right.
// Icons keep their full 26px size; only surrounding chrome is trimmed.
function _badgePickerRowHtml(type, divider){
  const isDep = type==='deposit';
  const current = isDep ? _depositBadgeKind() : _balanceBadgeKind();
  const setter = isDep ? 'setDepositBadge' : 'setBalanceBadge';
  const title = isDep ? 'Deposit badge' : 'Balance payment badge';
  const sub = isDep ? 'Symbol on deposit-due alerts (deposit colour)' : 'Symbol on balance-due alerts (payment colour)';
  // Badge cell uses CSS classes for dark/light instead of hardcoded rgba bg
  const cellClass = isDep ? 'badge-cell-dep' : 'badge-cell-bal';
  const cells = _BADGE_CHOICES.map(([k,label])=>{
    const sel = current===k;
    return `<button type="button" title="${label}" aria-label="${label}" onclick="${setter}('${k}')" class="badge-pick-btn${sel?' sel':''}" style="padding:0;border:2px solid ${sel?'var(--gold)':'transparent'};background:transparent;cursor:pointer;border-radius:8px;transition:all .15s;display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <span class="badge-pick-cell ${cellClass}" style="width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${_badgeGlyph(k)}</span>
    </button>`;
  }).join('');
  return `<div class="badge-picker-row" style="display:flex;align-items:center;gap:12px;padding:11px 0;${divider?'border-bottom:1px solid var(--border)':''}">
    <div style="flex:1;min-width:0">
      <div style="font-size:13.5px;font-weight:500">${title}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">${sub}</div>
    </div>
    <div class="badge-picker-cells" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;flex:0 0 auto">${cells}</div>
  </div>`;
}
// Both badge pickers inside one outlined box.
function _badgePickerHtml(){
  return `<div style="margin-bottom:16px;border:1px solid var(--border);border-radius:12px;padding:4px 16px">
    ${_badgePickerRowHtml('balance', true)}
    ${_badgePickerRowHtml('deposit', false)}
  </div>`;
}
function setBalanceBadge(k){ if(!STATE.settings) STATE.settings={}; STATE.settings.balanceBadge=k; saveToStorage(); navigate('settings'); }
function setDepositBadge(k){ if(!STATE.settings) STATE.settings={}; STATE.settings.depositBadge=k; saveToStorage(); navigate('settings'); }
function setVendorBadgeStyle(k){ if(!STATE.settings) STATE.settings={}; STATE.settings.vendorBadgeStyle=k; saveToStorage(); navigate('settings'); }
// Segmented Name / Avatar / Off control for vendor badges on Payments.
function _vendorBadgeStylePickerHtml(){
  const cur=_vendorBadgeStyle();
  const opts=[['name','Name'],['avatar','Avatar'],['off','Off']];
  const seg=opts.map(([k,lbl],idx)=>{
    const active=cur===k;
    const left=idx>0?'border-left:.5px solid var(--border);':'';
    const bg=active?'background:var(--gold-deep);':'background:transparent;';
    const col=active?'color:#fff;':'color:var(--muted);';
    const wt=active?'font-weight:600;':'font-weight:500;';
    return `<button type="button" onclick="setVendorBadgeStyle('${k}')" style="${left}${bg}${col}${wt}border:none;padding:7px 14px;font-size:12px;cursor:pointer;font-family:inherit">${lbl}</button>`;
  }).join('');
  return `<div class="dark-toggle-row settings-stack-row" style="margin-bottom:16px">
    <div>
      <div style="font-size:13.5px;font-weight:500">Vendor Badges on Budget</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">How linked vendors appear on Payments.</div>
    </div>
    <div style="display:inline-flex;border:.5px solid var(--border);border-radius:8px;overflow:hidden;flex-shrink:0">${seg}</div>
  </div>`;
}
function _renderChecklistAlertsBar(){
  if(STATE.settings && STATE.settings.hideTaskAlerts) return '';
  const all=_collectTaskAlerts();
  if(!all.length) return '';
  const collapsed = !!(STATE.settings && STATE.settings.checklistAlertsCollapsed);
  const hasOverdue = all.some(a=>a.taskState==='overdue'||a.payState==='overdue');
  const triSvg=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  const infoSvg=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  const clockSvg=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`;
  const apptCalSvg=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg>`;
  const cls=st=>st==='overdue'?'budget-alert alert-overdue':(st==='soon'?'budget-alert alert-soon':'');
  // Compact appointment descriptor for the label: "Type · " prefix and a ", time" suffix.
  const apptPrefix=a=>a.appt?`${a.appt.type||'Appointment'} · `:'';
  const apptTimeSuffix=a=>(a.appt&&a.appt.time)?`, ${_fmtApptTime(a.appt.time)}`:'';
  const rows=all.map(a=>{
    // Parent task row — colour by its own state; neutral if only the payment is due.
    let parentClass, parentIcon, parentText, parentStyle;
    const isAppt=!!a.appt;
    if(a.taskState==='overdue'){
      parentText=`${apptPrefix(a)}“${a.text}” overdue (${fmtBudgetDate(a.taskDate)}${apptTimeSuffix(a)})`;
      if(isAppt){ parentClass=''; parentIcon=`<span style="color:var(--gold-deep);display:inline-flex">${apptCalSvg}</span>`; parentStyle='color:var(--red-deep);background:rgba(196,168,130,.14);border:1px solid rgba(196,168,130,.42);border-left:3px solid var(--gold);border-radius:6px'; }
      else { parentClass=cls('overdue'); parentIcon=triSvg; parentStyle=''; }
    } else if(a.taskState==='soon'){
      parentText=`${apptPrefix(a)}“${a.text}” due — ${fmtBudgetDate(a.taskDate)}${apptTimeSuffix(a)}`;
      if(isAppt){ parentClass=''; parentIcon=`<span style="color:var(--gold-deep);display:inline-flex">${apptCalSvg}</span>`; parentStyle='color:var(--gold-deep);background:rgba(196,168,130,.11);border:1px solid rgba(196,168,130,.32);border-left:3px solid var(--gold);border-radius:6px'; }
      else { parentClass=cls('soon'); parentIcon=infoSvg; parentStyle=''; }
    } else {
      parentText=`${apptPrefix(a)}“${a.text}”`;
      if(isAppt){ parentClass=''; parentIcon=`<span style="color:var(--gold-deep);display:inline-flex">${apptCalSvg}</span>`; parentStyle='color:var(--muted);background:rgba(196,168,130,.10);border:1px solid rgba(196,168,130,.30);border-left:3px solid var(--gold);border-radius:6px'; }
      else { parentClass=''; parentIcon=clockSvg; parentStyle='color:var(--muted);background:var(--surface);border:1px solid var(--border)'; }
    }
    if(!isAppt && !parentClass) parentStyle='color:var(--muted);background:var(--surface);border:1px solid var(--border)';
    let html=`<div role="button" tabindex="0" onclick="focusChecklistTask('${a.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();focusChecklistTask('${a.id}')}" title="Go to this task" class="${parentClass}" style="display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:500;padding:3px 10px;border-radius:6px;cursor:pointer;${parentStyle}">
      ${parentIcon}<span>${parentText}</span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-left:auto;opacity:.6"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
    // Payment sub-row — full-width background, with the right-angle connector at left.
    if(a.payState){
      const subClass=cls(a.payState), subIcon=a.payState==='overdue'?triSvg:infoSvg;
      const subText=a.payState==='overdue'?`${a.payLabel} (${fmtBudgetDate(a.payDate)})`:`${a.payLabel} — ${fmtBudgetDate(a.payDate)}`;
      const isDeposit = a.payKind==='deposit';
      // Badge: user-chosen glyph; colour scheme follows row type (deposit gold vs payment red).
      const badgeBg = isDeposit
        ? 'rgba(196,168,156,.30)'
        : (a.payState==='overdue' ? 'rgba(139,0,0,.28)' : 'rgba(192,57,43,.16)');
      const badgeColor = isDeposit ? 'var(--gold-deep)' : 'inherit';
      const glyph = isDeposit ? _badgeGlyph(_depositBadgeKind()) : _badgeGlyph(_balanceBadgeKind());
      const payBadge=`<span style="background:${badgeBg};color:${badgeColor};border-radius:4px;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${glyph}</span>`;
      const sid = a.budgetSubId ? `'${a.budgetSubId}'` : 'null';
      const kindArg = isDeposit ? "'deposit'" : "'balance'";
      const goTitle = isDeposit ? 'Go to this deposit on the budget' : 'Go to this item on the budget';
      html+=`<div style="display:flex;align-items:stretch;gap:4px;margin:2px 5% 2px 6px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;align-self:center"><path d="M4 6v8a4 4 0 0 0 4 4h10"/><polyline points="14 14 18 18 14 22"/></svg>
        <div role="button" tabindex="0" onclick="focusBudgetAlert('${a.budgetId}',${sid},${kindArg})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();focusBudgetAlert('${a.budgetId}',${sid},${kindArg})}" title="${goTitle}" class="${subClass}" style="flex:1;display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:500;padding:3px 10px;border-radius:6px;cursor:pointer">${payBadge}${subIcon}<span>${subText}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-left:auto;opacity:.6"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>`;
    }
    return html;
  }).join('');
  const pinned = !!(STATE.settings && STATE.settings.checklistAlertsPinned);
  const alertIcon=`<span style="color:${hasOverdue?'var(--red-deep)':'var(--red)'};display:inline-flex;flex-shrink:0">${triSvg}</span>`;
  const countBadge=`<span style="font-size:10px;color:${hasOverdue?'var(--red-deep)':'var(--red)'};background:${hasOverdue?'rgba(139,0,0,.08)':'rgba(192,57,43,.08)'};border-radius:9px;padding:1px 7px;flex-shrink:0">${all.length}</span>`;
  const pinBtn=_alertPinBtnHtml(pinned, '_toggleChecklistAlertsPin');
  const chevron=collapsed
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;flex-shrink:0;color:var(--muted)"><polyline points="9 18 15 12 9 6"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;flex-shrink:0;color:var(--muted)"><polyline points="6 9 12 15 18 9"/></svg>`;
  const header=`<div role="button" tabindex="0" onclick="_toggleChecklistAlerts()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();_toggleChecklistAlerts()}" title="${collapsed?'Show task alerts':'Hide task alerts'}" style="display:flex;align-items:center;gap:6px;cursor:pointer;${collapsed?'':'padding-bottom:5px;border-bottom:1px solid var(--border);margin-bottom:6px'}">
      ${pinBtn}
      ${collapsed?alertIcon:''}
      <span style="font-size:11.5px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Task alerts</span>
      ${countBadge}
      ${chevron}
    </div>`;
  const stickyStyle = pinned ? 'position:sticky;top:var(--alert-pin-top, 44px);z-index:44;' : '';
  return `<div class="card${pinned?' alert-pinned':''}" style="margin:4px 0 12px;padding:10px 12px;${stickyStyle}">
    ${header}
    ${collapsed?'':`<div style="display:flex;flex-direction:column;gap:2px">${rows}</div>`}
  </div>`;
}
// Shared pin button for the alert banners. Outline when unpinned, gold-filled when pinned.
// stopPropagation so it doesn't also toggle the header's collapse/expand.
function _alertPinBtnHtml(pinned, fnName){
  const fill = pinned ? 'var(--gold)' : 'none';
  const col = pinned ? 'var(--gold-deep)' : 'var(--muted)';
  return `<span role="button" tabindex="0" aria-pressed="${pinned}" onclick="event.stopPropagation();${fnName}()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();${fnName}()}" title="${pinned?'Unpin from top':'Pin to top while scrolling'}" aria-label="${pinned?'Unpin alerts':'Pin alerts to top'}" style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;color:${col};padding:1px;border-radius:4px">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v6l-2 4h10l-2-4V4"/><line x1="12" y1="14" x2="12" y2="21"/><line x1="8" y1="4" x2="16" y2="4"/></svg>
  </span>`;
}
function _toggleChecklistAlertsPin(){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.checklistAlertsPinned=!STATE.settings.checklistAlertsPinned;
  saveToStorage();
  navigate('checklist');
}
function _toggleChecklistAlerts(){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.checklistAlertsCollapsed=!STATE.settings.checklistAlertsCollapsed;
  saveToStorage();
  navigate('checklist');
}
// Set --alert-pin-top so a pinned alerts card sticks flush beneath the sticky bar above it
// (checklist: .page-search-sticky; budget: .budget-total-card). position:sticky measures `top`
// relative to the SCROLL CONTAINER's top edge (.content), not the viewport. The bar above is
// itself sticky at its own negative CSS `top`, so once stuck its bottom edge sits, in container
// space, at: aboveCssTop + aboveHeight. That's the value the pinned card needs as its own `top`.
// (Earlier bug: fed a viewport-relative .bottom as `top`, which is offset by the 60px topbar and
// pushed the bar down.)
function _positionPinnedAlerts(page){
  const pinnedCard=document.querySelector('.alert-pinned');
  if(!pinnedCard) return;
  const above = page==='budget'
    ? document.querySelector('.budget-total-card')
    : document.querySelector('.page-search-sticky');
  if(!above){ pinnedCard.style.setProperty('--alert-pin-top','0px'); return; }
  const apply=()=>{
    const el=document.querySelector('.alert-pinned'); if(!el) return;
    const cs=getComputedStyle(above);
    let aboveCssTop=parseFloat(cs.top); if(isNaN(aboveCssTop)) aboveCssTop=0;
    const aboveH=above.getBoundingClientRect().height;
    const stickTop=Math.max(0, Math.round(aboveCssTop + aboveH));
    el.style.setProperty('--alert-pin-top', stickTop+'px');
  };
  apply();
  // Re-measure once more after layout settles (fonts, reflow) so the offset is exact.
  requestAnimationFrame(apply);
}
window.addEventListener('resize', ()=>{ if(document.querySelector('.alert-pinned')) _positionPinnedAlerts(_currentPage); });
// Scroll to + flash a checklist task row.
function focusChecklistTask(id){
  const el=document.getElementById('cl-'+id);
  if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); _flashHighlight(el); }
}

// ── Deposit pill helpers ────────────────────────────────────────────────────
// Shared receipt symbol used by both the "Deposit" badge and the deposit
// full-title pill. Colour inherits from the parent (currentColor).
function _depositReceiptSvg(sz){
  sz = sz || 11;
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/></svg>`;
}
// Does this name contain the standalone word "deposit"? (case-insensitive)
function _nameHasDeposit(name){ return /\bdeposit\b/i.test(name||''); }
// HTML-escape for safe display inside the pill.
function _escAttr(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// Renders a sub-item's name slot: a full-title deposit pill (receipt symbol +
// whole title) when the name contains "deposit", otherwise the editable input.
// Clicking the pill swaps to the edit input so the name stays editable.
function _subNameSlot(b, s){
  const editId = `subname-edit-${s.id}`;
  const pillId = `subname-pill-${s.id}`;
  if(_nameHasDeposit(s.name)){
    return `<span id="${pillId}" onclick="_editSubName('${b.id}','${s.id}')" title="Click to edit"
      style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;letter-spacing:.03em;color:var(--gold-deep);background:rgba(201,184,156,.18);padding:3px 10px;border-radius:11px;cursor:text;flex:0 1 auto;min-width:0;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">
      ${_depositReceiptSvg(12)}<span style="overflow:hidden;text-overflow:ellipsis">${_highlight(s.name,_budgetSearch)}</span></span>`;
  }
  return `<span id="${pillId}" title="${_escAttr(s.name||'')}"
    style="font-size:12px;font-weight:500;flex:0 1 auto;min-width:32px;max-width:60%;color:var(--ink);font-family:'Inter',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name?_highlight(s.name,_budgetSearch):'<span style="color:var(--muted)">Untitled</span>'}</span>`;
}
// Swap a deposit pill back to an editable input in place.
function _editSubName(pid, sid){
  const pill = document.getElementById(`subname-pill-${sid}`);
  if(!pill) return;
  const b = STATE.budget.items.find(x=>x.id===pid);
  const s = b?.subItems?.find(x=>x.id===sid);
  if(!s) return;
  const input = document.createElement('input');
  input.value = s.name||'';
  input.setAttribute('placeholder','Sub-item name');
  input.style.cssText = "font-size:12px;font-weight:500;flex:1 1 60px;min-width:32px;background:transparent;border:none;border-bottom:1px solid var(--gold);padding:0 2px;color:var(--ink);font-family:'Inter',sans-serif;outline:none";
  const commit = ()=>{ updateSubItemName(pid, sid, input.value); navigate('budget'); };
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); input.blur(); } });
  pill.replaceWith(input);
  input.focus();
}

// Render an item-level deposit as a sub-item-styled row (manual mode only).
// The deposit is a paid portion of the category total: ticking it credits the
// balance (owing = total − deposit), exactly as the data model already computes.
// Visual parity with sub-items: parchment box, checkbox, name, "Deposit" tag,
// amount, and a due/paid-date control. Reuses the existing toggle/date handlers.
function _itemDepositSubRow(b){
  const amt = Number(b.deposit||0);
  const due = b.depositFromSubs ? '' : (b.depositDueDate||'');
  const paid = !!b.depositPaid;
  const paidDate = b.depositPaidDate||'';
  if(!(amt>0 || due)) return '';
  const showDates = _budgetShown('depDate');
  // Link/chain icon — shows only when this deposit is linked to a deposit-keyword
  // task, identical to how a sub-item's deposit shows its link icon (_subChainOnDeposit).
  const badge = ((typeof _itemChainOnDeposit==='function' && _itemChainOnDeposit(b)) ? _chainSpan('budget',11,b.id) : '');
  const amtColor = paid ? 'var(--green)' : 'var(--gold-deep)';
  // Date control (calendar popover) — due date when unpaid, paid date when paid.
  const calIcon = paid
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><path d="M9 15l2 2 4-4"/></svg>`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const calLabel = paid ? (paidDate?'Change paid date':'Set paid date') : (due?'Change due date':'Set due date');
  const calColor = paid ? 'var(--green)' : 'var(--muted)';
  const calInput = paid
    ? `<input type="date" value="${paidDate}" style="position:absolute;top:0;left:0;width:13px;height:13px;opacity:0;cursor:pointer" onchange="updateBudgetDepositPaidDate('${b.id}',this.value)"/>`
    : `<input type="date" value="${due}" style="position:absolute;top:0;left:0;width:13px;height:13px;opacity:0;cursor:pointer" onchange="updateBudgetDepositDate('${b.id}',this.value)"/>`;
  const calCtrl = showDates ? `<label title="${calLabel}" style="cursor:pointer;color:${calColor};display:inline-flex;align-items:center;position:relative;line-height:0;width:13px;height:13px;flex-shrink:0;margin-right:4px">${calIcon}${calInput}</label>` : '';
  // Status text — short, inline next to the amount (no "$X total" clutter).
  const statusText = paid
    ? `Paid${(showDates&&paidDate)?(' '+(paidRelative(paidDate)||fmtBudgetDate(paidDate))):''}`
    : (due ? `Due ${fmtBudgetDate(due)}` : '');
  const statusColor = paid ? 'var(--green)' : 'var(--muted)';
  return `<div class="bi-dep-connect" style="margin:6px 0 2px 6px;display:flex;align-items:stretch;gap:0">
    <div class="bi-dep-elbow" style="width:14px;border-left:1.5px solid var(--connector);border-bottom:1.5px solid var(--connector);border-bottom-left-radius:5px;margin-bottom:9px;flex-shrink:0"></div>
    <div class="budget-subitem-box" id="bsub-itemdep-${b.id}" style="flex:1;margin-left:6px;border-radius:8px;padding:5px 12px">
    <div class="bsub-head" style="display:flex;align-items:center;gap:8px">
      <div class="custom-checkbox ${paid?'checked':''}" onclick="toggleDepositPaid('${b.id}')" style="width:14px;height:14px;min-width:14px;flex-shrink:0" title="Mark deposit as paid"></div>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:2px 8px;border-radius:9px;background:rgba(201,184,156,.18);color:var(--gold-deep);flex-shrink:0">${_depositReceiptSvg(10)}${_escAttr(b.name)} deposit</span>
      ${badge?`<span style="display:inline-flex;align-items:center">${badge}</span>`:''}
      <span style="margin-left:auto;display:inline-flex;align-items:center;flex-shrink:0">
        ${statusText?`<span style="font-size:9px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:${statusColor};margin-right:4px;white-space:nowrap">${statusText}</span>`:''}
        ${calCtrl}
        <span style="font-size:12px;color:${amtColor};font-weight:600;width:10px;text-align:right;flex-shrink:0">${_curSym()}</span>
        <span style="font-size:12px;font-weight:600;color:${amtColor};font-family:'Inter',sans-serif;width:62px;text-align:right;flex-shrink:0;margin-left:-14px">${amt?amt.toLocaleString(_curLocale()):'-'}</span>
      </span>
    </div>
  </div>
  </div>`;
}
// ── Budget jump-to-category bar ──────────────────────────────────────────────
// Renders a sticky strip of chips (one per category) that scroll-to each card.
// Mode from STATE.settings.budgetJumpBar: 'off' (nothing), 'a' (name only),
// 'b' (name + owing/paid sub-line, which collapses to 'a' on mobile via CSS).
// Hidden while a budget search is active — the filtered list makes jumping moot
// and the chips would point at cards that may be filtered out.
function _budgetJumpBarHtml(){
  const mode=(STATE.settings&&STATE.settings.budgetJumpBar)||'off';
  if(mode!=='a'&&mode!=='b') return '';
  if(_budgetSearch) return '';
  const items=STATE.budget.items||[];
  if(items.length<2) return ''; // one (or no) category: nothing to jump between
  // Sticky offset: dock just below the summary banner. The banner is sticky at
  // top:-32px; its rendered height varies (collapsed vs expanded), so we measure
  // at paint time (_positionBudgetJumpBar) rather than hardcode.
  const chips=items.map(b=>{
    const nm=_escHtml(b.name||'Category');
    const subCount=(b.subItems&&b.subItems.length)||0;
    const cntHtml=subCount?`<span class="bjump-cnt">${subCount}</span>`:'';
    // Style B sub-line: prefer owing; if fully paid show "paid"; else the total.
    let sub='';
    if(mode==='b'){
      const owing=calcBudgetBalance(b);
      const paid=calcBudgetPaid(b);
      const total=calcBudgetItemTotal(b);
      if(total>0 && owing<=0 && paid>0) sub='paid';
      else if(owing>0) sub=`${fmt(owing)} owing`;
      else if(total>0) sub=fmt(total);
      else sub='—';
    }
    const subHtml=sub?`<span class="bjump-sub">${sub}</span>`:'';
    return `<button class="bjump-chip" data-bjump="${b.id}" onclick="_budgetJumpTo('${b.id}')" title="Jump to ${nm.replace(/"/g,'&quot;')}">
      <span class="bjump-name">${nm}${cntHtml}</span>${subHtml}
    </button>`;
  }).join('');
  return `<div id="budget-jumpbar" class="bjump-${mode}">${chips}</div>`;
}
// Scroll the named category card into view and flash its chip active.
function _budgetJumpTo(bid){
  const card=document.getElementById('bi-'+bid);
  if(!card) return;
  // If the category is collapsed, the card is short but still scrollable-to.
  const bar=document.getElementById('budget-jumpbar');
  const barH=bar?bar.getBoundingClientRect().height:0;
  const banner=document.querySelector('.budget-total-card');
  const bannerH=banner?banner.getBoundingClientRect().height:0;
  const sc=document.getElementById('main-content')||document.scrollingElement||document.documentElement;
  const y=card.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - barH - Math.max(0,bannerH-32) - 8;
  sc.scrollTo({top:Math.max(0,y),behavior:'smooth'});
  // Re-position the sticky bar after the smooth scroll settles.
  setTimeout(_positionBudgetJumpBar, 350);
  // Mark the tapped chip active (visual confirmation); clear others.
  if(bar){ bar.querySelectorAll('.bjump-chip').forEach(c=>c.classList.remove('act')); }
  const chip=bar&&bar.querySelector(`[data-bjump="${bid}"]`);
  if(chip) chip.classList.add('act');
}
// Position the sticky bar's top offset just under the (variable-height) summary
// banner, and keep the active chip in sync with the category currently in view.
function _positionBudgetJumpBar(){
  const bar=document.getElementById('budget-jumpbar');
  if(!bar) return;
  const banner=document.querySelector('.budget-total-card');
  const bannerBottom=banner?banner.getBoundingClientRect().height:0;
  // Banner is sticky at top:-32px, so its effective stuck height is height-32.
  bar.style.top=Math.max(0,bannerBottom-32)+'px';
}
function _setBudgetJumpBar(mode){
  STATE.settings.budgetJumpBar=(mode==='a'||mode==='b')?mode:'off';
  saveToStorage();
  if(_currentPage==='settings') navigate('settings');
  else if(_currentPage==='budget') navigate('budget');
}
function _budgetItemsListHtml(){
  const _bItems = STATE.budget.items.filter(b=>_budgetItemMatchesSearch(b,_budgetSearch));
  if(_budgetSearch && !_bItems.length){ return `<div class="empty-state"><div class="empty-state-text">No Payments match “${_escHtml(_budgetSearch)}”</div></div>`; }
  return _bItems.map(b=>{
    if(!budgetReorderMode) return budgetItemHtml(b);
    return `<div class="budget-drag-wrap" data-bid="${b.id}" draggable="true"
      ondragstart="budgetItemDragStart(event,'${b.id}')"
      ondragover="budgetItemDragOver(event,'${b.id}')"
      ondrop="budgetItemDrop(event,'${b.id}')"
      ondragleave="budgetItemDragLeave(event,'${b.id}')"
      ondragend="budgetItemDragEnd(event,'${b.id}')"
      style="position:relative;cursor:grab;margin-bottom:10px;border-radius:12px;border:2px dashed var(--gold);overflow:hidden;transition:background .15s">
      <div style="display:flex;align-items:center;gap:6px;padding:6px 14px 2px;background:rgba(196,168,130,.08)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gold)"><circle cx="9" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="17" r="1.2" fill="currentColor"/><circle cx="15" cy="17" r="1.2" fill="currentColor"/></svg>
        <span style="font-size:10px;color:var(--gold-deep);font-weight:600;letter-spacing:.08em;text-transform:uppercase">drag to reorder</span>
      </div>
      <div style="pointer-events:none">${budgetItemHtml(b)}</div>
    </div>`;
  }).join('');
}

// ── Category header style renderer ───────────────────────────────────────────
// Returns { right, band } for a category header based on STATE.settings.catHeaderStyle.
//   right = content for the right-side total block (in the head row)
//   band  = optional full-width row rendered just under the head row (bar / chips)
// Styles: 'rail' (default), 'columns', 'stack', 'splitbar'.
const _CAT_HEADER_STYLES = ['columns','rail','stack','splitbar'];
function _catHeaderBlocks(b){
  const total=calcBudgetItemTotal(b);
  if(!(total||budgetIsAllocated(b))) return {right:'', band:''};
  const allocMode=budgetIsAllocated(b);
  const headLabel=allocMode?'Allocated':'Total';
  const committed=calcBudgetCommitted(b);
  const remaining=calcBudgetRemaining(b);
  const paid=calcBudgetPaid(b);
  const owing=calcBudgetBalance(b);
  const bigNum=allocMode?calcBudgetAllocated(b):total;
  const showPaidOwing=!(STATE.settings&&STATE.settings.hideBudgetPaidOwing);
  const over=allocMode && remaining<0;
  let style=(STATE.settings&&STATE.settings.catHeaderStyle)||'rail';
  if(!_CAT_HEADER_STYLES.includes(style)) style='rail';
  const gold='var(--gold-deep)', mut='var(--muted)', red='var(--red,#C0392B)', grn='var(--green,#2E7D32)';
  const big=(n,sz)=>`<span class="bi-total-amt" style="font-size:${sz||15}px;font-weight:600;color:${gold};font-family:'Inter',sans-serif;line-height:20px">${fmt(n)}</span>`;
  const klab=(t)=>`<span style="font-size:11px;color:${mut};text-transform:uppercase;letter-spacing:.07em;line-height:20px">${t}</span>`;

  // Shared "committed · over/left" and "paid · owing" lines (classic / minor styles)
  const commitLine=(allocMode&&committed>0)
    ? `<span style="font-size:10.5px;color:${mut};white-space:nowrap">${fmt(committed)} committed · <span style="color:${remaining<0?red:grn}">${remaining<0?fmt(-remaining)+' over':fmt(remaining)+' unallocated'}</span></span>` : '';
  // v182: Paid + Left to pay always shown (even $0); fully paid reads "Paid in full ✓".
  const fullyPaid=owing<=0 && total>0;
  const paidLine=showPaidOwing
    ? `<span style="font-size:10.5px;color:${mut};white-space:nowrap">${fmt(paid)} paid · ${fullyPaid?`<span style="color:${grn};font-weight:600">Paid in full ✓</span>`:fmt(owing)+' left to pay'}</span>` : '';

  // Shared % of total sub-label — shown in all styles when totalMode='%' and toggle is on.
  // When % mode is on but no percentage is entered, auto-calculate from the
  // category total vs the overall budget total.
  const _pctSubVal=(()=>{
    if(b.totalPct) return b.totalPct;
    const budgTotal=STATE.budget&&STATE.budget.total;
    if(budgTotal&&total) return Math.round((total/budgTotal)*100);
    return 0;
  })();
  const _pctSub=(b.totalMode==='%'&&_budgetShown('pctLabel'))?`<span style="font-size:8.5px;color:${mut};text-transform:uppercase;letter-spacing:.08em">${_pctSubVal}% of total</span>`:'';

  // ----- STAT COLUMNS -----
  if(style==='columns'){
    // Allocated sits top-right under the chevron/menu, aligned beside the notes/website rows (head row).
    // Committed + Owing drop to their own clear full-width row below the header (band) — no overlap.
    const cell=(lbl,val,extra)=>`<span style="display:flex;flex-direction:column;align-items:flex-end;gap:0;padding-left:11px;border-left:1px solid var(--border)">
      <span style="font-size:9px;color:${mut};text-transform:uppercase;letter-spacing:.08em">${lbl}</span>
      <span style="font-size:13px;font-weight:700;color:var(--ink);font-family:'Inter',sans-serif;white-space:nowrap">${val}${extra||''}</span></span>`;
    // Allocated renders flush-right inside the dots-menu column (see _catHeaderColAlloc), so 'right' stays empty.
    const c2=allocMode?cell('Committed', fmt(committed), over?` <span style="font-size:9.5px;color:${red};font-weight:600">·${fmt(-remaining)} over</span>`:''):'';
    const c3=showPaidOwing?(cell('Paid', `<span style="color:${grn}">${fmt(paid)}</span>`)+(fullyPaid?cell('Left to pay', `<span style="color:${grn};font-size:11px">Paid in full ✓</span>`):cell('Left to pay', fmt(owing)))):'';
    const _pctBand=_pctSub?`<div style="display:flex;justify-content:flex-end;padding:0 16px 4px">${_pctSub}</div>`:'';
    const band=(c2||c3||_pctBand)?`<div style="display:flex;flex-direction:column">${(c2||c3)?`<div style="display:flex;justify-content:flex-end;gap:11px;padding:0 16px 6px">${c2}${c3}</div>`:''}${_pctBand}</div>`:'';
    return {right:'', band};
  }

  // ----- SPEND SPLIT BAR -----
  // A two-tone bar (paid vs owing) shown as the full-width band under the head, with a
  // slim Allocated figure beside the name and an inline Paid/Owing legend.
  if(style==='splitbar'){
    const denom = allocMode ? bigNum : (paid+owing);
    const paidPct = denom>0 ? Math.max(0,Math.min(100, paid/denom*100)) : 0;
    const owePct  = denom>0 ? Math.max(0,Math.min(100, owing/denom*100)) : 0;
    const restPct = Math.max(0, 100 - paidPct - owePct);
    const sw=(c)=>`<span style="width:7px;height:7px;border-radius:2px;background:${c};display:inline-block;flex-shrink:0"></span>`;
    const legendPaid = showPaidOwing ? `<span style="display:inline-flex;align-items:center;gap:4px">${sw(grn)}<span style="color:${mut}">Paid</span> <span style="font-weight:700;color:var(--ink);font-family:'Inter',sans-serif">${fmt(paid)}</span></span>` : '';
    const legendOwe  = !showPaidOwing ? '' : fullyPaid ? `<span style="color:${grn};font-weight:600">Paid in full ✓</span>` : `<span style="display:inline-flex;align-items:center;gap:4px">${sw('var(--gold)')}<span style="color:${mut}">Left to pay</span> <span style="font-weight:700;color:var(--ink);font-family:'Inter',sans-serif">${fmt(owing)}</span></span>`;
    const legend = (legendPaid||legendOwe) ? `<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:9.5px;margin-top:5px">${legendPaid}${legendOwe}</div>` : '';
    const bar = `<div class="bi-splitbar" style="height:9px;border-radius:5px;overflow:hidden;display:flex;background:var(--surface)">
        <span style="width:${paidPct}%;background:${grn}"></span><span style="width:${owePct}%;background:var(--gold)"></span><span style="width:${restPct}%"></span></div>`;
    const band = `<div style="padding:2px 16px 8px">${bar}${legend}</div>`;
    const right = `<span style="display:flex;flex-direction:column;align-items:flex-end;gap:0">${klab(headLabel)}${big(bigNum,15)}${_pctSub}</span>`;
    return {right, band};
  }

  // ----- RIGHT RAIL -----
  if(style==='rail'){
    // Allocated sits at the right of the head row with a divider; the Committed/Over/
    // Paid/Owing stat list renders under the ··· menu (see _catHeaderRailStats).
    return {right:`<span style="display:flex;flex-direction:column;align-items:flex-end;gap:0;padding-right:13px;border-right:1px solid var(--border);align-self:stretch;justify-content:flex-end">${klab(headLabel)}${big(bigNum,16)}${_pctSub}</span>`, band:''};
  }

  // ----- COMPACT STACK -----
  // A tidy two-line figure block on the right: big Allocated total, lowercase label, and
  // a single "left · owing" meta line. The structured successor to the old minimal line.
  if(style==='stack'){
    const meta=[];
    if(over) meta.push(`<span style="color:${red}">${fmt(-remaining)} over</span>`); else if(allocMode&&committed>0) meta.push(`<span style="color:${grn}">${fmt(remaining)} unallocated</span>`);
    const metaLine=(meta.length?`<span style="font-size:10px;color:${mut};white-space:nowrap">${meta.join(' · ')}</span>`:'')
      +(showPaidOwing?`<span class="bi-stack-paid" style="font-size:10px;color:${mut};text-align:right"><span style="color:${grn};white-space:nowrap">${fmt(paid)} paid</span> · <span style="white-space:nowrap">${fullyPaid?`<span style="color:${grn};font-weight:600">Paid in full ✓</span>`:fmt(owing)+' left to pay'}</span></span>`:'');
    return {right:`<span style="display:inline-flex;flex-direction:column;align-items:flex-end;gap:0">${big(bigNum,17)}<span style="font-size:8.5px;color:${mut};text-transform:uppercase;letter-spacing:.08em">${headLabel.toLowerCase()}</span>${_pctSub}${metaLine}</span>`, band:''};
  }

  return {right:'', band:''};
}

// Committed/Over/Paid/Owing stat list for the 'rail' header style, rendered flush-right under the ··· menu.
function _catHeaderRailStats(b){
  const total=calcBudgetItemTotal(b);
  if(!(total||budgetIsAllocated(b))) return '';
  const allocMode=budgetIsAllocated(b);
  const committed=calcBudgetCommitted(b);
  const remaining=calcBudgetRemaining(b);
  const paid=calcBudgetPaid(b);
  const owing=calcBudgetBalance(b);
  const showPaidOwing=!(STATE.settings&&STATE.settings.hideBudgetPaidOwing);
  const over=allocMode && remaining<0;
  const mut='var(--muted)', red='var(--red,#C0392B)', grn='var(--green,#2E7D32)';
  const line=(l,v,c)=>`<span style="display:flex;justify-content:space-between;gap:10px;font-size:10px"><span style="color:${mut}">${l}</span><span style="font-weight:700;color:${c||'var(--ink)'};font-family:'Inter',sans-serif">${v}</span></span>`;
  const rows=[
    allocMode?line('Committed',fmt(committed)):'',
    over?line('Over',fmt(-remaining),red):(allocMode?line('Unallocated',fmt(remaining),grn):''),
    showPaidOwing?line('Paid',fmt(paid),grn):'',
    showPaidOwing?((owing<=0&&total>0)?`<span style="display:flex;justify-content:flex-end;font-size:10px;font-weight:700;color:${grn}">Paid in full ✓</span>`:line('Left to pay',fmt(owing))):''
  ].join('');
  if(!rows) return '';
  // Mobile-only Allocated figure that nestles atop the stat column (Option C). The
  // desktop layout keeps the Allocated figure beside the name (.bi-total-block); on
  // mobile that block is hidden (CSS) and this figure shows instead — no stranded line.
  const headLabel=allocMode?'Allocated':'Total';
  const bigNum=allocMode?calcBudgetAllocated(b):total;
  const railFig=`<span class="bi-rail-allocfig" style="display:none;flex-direction:column;align-items:flex-end;border-bottom:1px solid var(--border);padding-bottom:3px;margin-bottom:3px">
      <span style="font-size:9px;color:${mut};text-transform:uppercase;letter-spacing:.07em;line-height:1.2">${headLabel}</span>
      <span style="font-size:15px;font-weight:600;color:var(--gold-deep);font-family:'Inter',sans-serif;line-height:1.1">${fmt(bigNum)}</span></span>`;
  return `<span class="bi-railstats" style="display:flex;flex-direction:column;gap:1px;min-width:120px;margin-top:auto;padding-top:2px">${railFig}${rows}</span>`;
}

// Allocated/Total block for the 'columns' header style, rendered flush-right under the chevron/··· menu.
function _catHeaderColAlloc(b){
  const total=calcBudgetItemTotal(b);
  if(!(total||budgetIsAllocated(b))) return '';
  const allocMode=budgetIsAllocated(b);
  const headLabel=allocMode?'Allocated':'Total';
  const bigNum=allocMode?calcBudgetAllocated(b):total;
  const gold='var(--gold-deep)', mut='var(--muted)';
  return `<span class="bi-colalloc" style="display:flex;flex-direction:column;align-items:flex-end;gap:0;margin-top:auto;padding-top:2px"><span style="font-size:9px;color:${mut};text-transform:uppercase;letter-spacing:.08em">${headLabel}</span><span style="font-size:14px;font-weight:700;color:${gold};font-family:'Inter',sans-serif;white-space:nowrap">${fmt(bigNum)}</span></span>`;
}

function budgetItemHtml(b){
  const total = calcBudgetItemTotal(b);
  const deposit = calcBudgetDeposit(b);
  const balance = calcBudgetBalance(b);
  // For the 'columns' header style, Allocated renders flush-right inside the dots-menu
  // column (under the chevron/···) instead of the bi-total-block. Compute that here.
  const _hdrStyle = (STATE.settings&&STATE.settings.catHeaderStyle)||'rail';
  const _isCols = (_hdrStyle==='columns');
  const _colAllocHtml = _isCols ? _catHeaderColAlloc(b) : '';
  const _isRail = (_hdrStyle==='rail');
  const _railStatsHtml = _isRail ? _catHeaderRailStats(b) : '';
  const _isSplit = (_hdrStyle==='splitbar');
  const effDepDue = b.depositFromSubs ? '' : b.depositDueDate;
  const depPaid = b.depositPaid||false;
  const balPaid = b.paid||false;
  // A single "paid in full" signal for the WHOLE item: balance owing is zero once
  // every component — item balance, deposit, sub-items and any payment plan — is
  // settled. calcBudgetBalance folds all of those in, so balance===0 means done.
  const fullyPaid = (total>0) && (calcBudgetBalance(b)===0);
  const _bLinkedTask = _itemLinkedTask(b);
  const _bTaskBook = _bLinkedTask ? _taskBookedKeyword(_bLinkedTask.text) : false;
  const _bTaskDeposit = _bLinkedTask ? /\bdeposit\b/i.test(_bLinkedTask.text) : false;
  // PARKED: the "BOOKED" badge is suppressed for now (revisit later).
  // Original: const bShowBooked = _bLinkedTask ? (_bLinkedTask.done && _bTaskBook) : false;
  const bShowBooked = false;
  // PARKED: the non-booking "TASK DONE" badge is suppressed for now (revisit later).
  // Original: const bShowItemDone = _bLinkedTask ? (_bLinkedTask.done && !_bTaskBook) : false;
  const bShowItemDone = false;
  const _bHasDeposit = (deposit>0) || effDepDue || b.depositFromSubs;
  // Badge placement: for a booked task, honour the user's chosen placement;
  // otherwise fall back to the keyword-derived default (deposit if task says "deposit").
  const _bPlacement = (_bLinkedTask && _bTaskBook) ? _resolveBookedPlacement(_bLinkedTask, b, null) : (_bTaskDeposit && _bHasDeposit ? 'deposit' : 'item');
  const bBadgeOnDeposit = (_bLinkedTask && _bTaskBook) ? (_bPlacement==='deposit') : (_bTaskDeposit && _bHasDeposit);
  // For a booked, item-linked task whose placement is a specific sub-item, the
  // badge is rendered on that sub-item row (see sub render below); suppress it here.
  const _bBookedToSub = (_bLinkedTask && _bTaskBook && _bPlacement==='sub');
  const _bBadgeHtml = (bShowBooked||bShowItemDone)?(bShowBooked?`<span style="font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--gold-deep);background:rgba(201,184,156,.18);padding:2px 7px;border-radius:9px;display:inline-flex;align-items:center;gap:3px;box-sizing:content-box;line-height:1;border:none"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>BOOKED</span>`:`<span style="font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);background:var(--surface);padding:2px 7px;border-radius:9px;display:inline-flex;align-items:center;gap:3px;box-sizing:content-box;line-height:1;border:none"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>TASK DONE</span>`):'';

  const calIcon = (paidState)=> paidState
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><path d="M9 15l2 2 4-4"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

  const paymentRow = (label, amount, paid, dueVal, paidVal, onToggle, onDueChange, onPaidChange, colorClass, showCheckbox=true, autoCalc=false, subPaidDate='', note='', showPaidDate=true, badgeHtml='') => {
    const amtColor = paid ? 'var(--green)' : colorClass;
    const effPaidVal = autoCalc ? (subPaidDate||paidVal||'') : paidVal;
    // "PAID [date]" when paid + date shown + a date exists; otherwise just "PAID".
    const showPaidWithDate = paid && showPaidDate && !note && !!effPaidVal;
    const paidInlineText = showPaidWithDate
      ? (paidRelative(effPaidVal) ? `PAID ${paidRelative(effPaidVal)}` : `PAID ${fmtBudgetDate(effPaidVal)}`)
      : 'PAID';
    // The paid label now sits INLINE just left of the calendar/amount (matching sub-items),
    // not on a second line under the label. Hidden when a "note" replaces it.
    const paidInlineLabel = (paid && !note)
      ? `<span style="font-size:9.5px;color:var(--green);text-transform:uppercase;letter-spacing:.02em;font-weight:600;white-space:nowrap;flex-shrink:0;margin-right:4px">${paidInlineText}</span>`
      : '';
    // Due text now sits INLINE (left of the calendar/amount), matching PAID and the
    // sub-item Due text — same 9px uppercase .02em treatment — instead of a 2nd line.
    const dueCls = dueVal ? dueDateClass(dueVal, paid) : '';
    const dueInlineLabel = (!paid && dueVal)
      ? `<span class="${dueCls}" style="font-size:9px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap;flex-shrink:0;margin-right:4px;${dueCls?'':'color:var(--muted)'}">${dueCls==='date-overdue'?'Overdue ':'Due '}${fmtBudgetDate(dueVal)}</span>`
      : '';
    const midDate = '';
    const calLabel = paid ? (paidVal?'Change paid date':'Set paid date') : (dueVal?'Change due date':'Set due date');
    const calColor = paid ? 'var(--green)' : 'var(--muted)';
    const calInput = paid
      ? `<input type="date" value="${paidVal||''}" style="position:absolute;top:0;left:0;width:14px;height:14px;opacity:0;cursor:pointer" onchange="${onPaidChange}"/>`
      : `<input type="date" value="${dueVal||''}" style="position:absolute;top:0;left:0;width:14px;height:14px;opacity:0;cursor:pointer" onchange="${onDueChange}"/>`;
    // When paid but the "Paid on" date is toggled off: show "PAID" (handled above) and hide
    // the calendar icon entirely (no date to set/change).
    const paidDateOff = paid && !showPaidDate && !note;
    const showCal = autoCalc ? false : !paidDateOff;
    return `
    <div class="paymentrow-gentleable${paid?' bi-row-paid':''}" style="display:flex;align-items:center;gap:8px;padding:5px 9px;border-bottom:1px solid var(--border)">
      ${showCheckbox?`<div class="custom-checkbox ${paid?'checked':''}" onclick="${onToggle}" title="Mark ${label} as paid" style="flex-shrink:0"></div>`:`<div style="width:20px;flex-shrink:0"></div>`}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
          <span style="font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.07em">${label}</span>
          ${badgeHtml||''}
        </div>
        ${note?`<div style="font-size:9.5px;color:var(--green);text-transform:uppercase;letter-spacing:.02em;font-weight:600;margin-top:2px;display:flex;align-items:center;gap:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>${note}</div>`:''}
        ${midDate}
      </div>
      ${paidInlineLabel}
      ${dueInlineLabel}
      ${showCal?`<label title="${calLabel}" style="cursor:pointer;color:${calColor};display:inline-flex;align-items:center;position:relative;line-height:0;width:14px;height:14px;flex-shrink:0">
        ${calIcon(paid)}
        ${calInput}
      </label>`:''}
      ${amount>0?`<span style="font-size:13px;font-weight:600;color:${amtColor};font-family:'Inter',sans-serif;flex-shrink:0;min-width:54px;text-align:right">${fmt(amount)}</span>`:'<span style="font-size:11px;color:var(--muted);flex-shrink:0;min-width:54px;text-align:right">—</span>'}
    </div>`;
  };

  const _gentle=(STATE.settings&&STATE.settings.budgetDensity==='gentle');
  return`<div class="budget-item${_gentle?' bg-gentle':''}" id="bi-${b.id}" style="padding:0;overflow:hidden">
    <div class="bi-head cathdr-${_hdrStyle}" style="background:var(--parchment);border-bottom:1px solid var(--border);padding:7px 16px;display:flex;align-items:${(_isCols||_isRail)?'stretch':'flex-start'};gap:12px">
      <div class="bi-namewrap" style="flex:1;min-width:0">
        <div class="bi-namerow${(balPaid && _itemIsLinked(b) && !_itemChainOnDeposit(b))?' bpl-row bpl-a':''}" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"${(balPaid && _itemIsLinked(b) && !_itemChainOnDeposit(b))?` data-bpl="1"`:''}>
          ${b.icon&&_budgetShown('catIcon')?`<svg class="bi-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${(()=>{const iconDefs={'ring':'M9 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm6-1a4 4 0 1 0 0 8 4 4 0 0 0 0-8','diamond':'M6 3h12l4 6-10 12L2 9zm-4 6h20M12 3l4 6m-8 0l4-6','flower':'M12 21v-9M12 12c0-2 1.5-4 3-5-1 2-.5 4.5-3 5M12 12c0-2-1.5-4-3-5 1 2 .5 4.5 3 5M12 12c-1-1-1-3 0-4M10 20h4','camera':'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zm-7-7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z','cake':'M20 21H4V11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2zM4 15h16M12 2v3m-4 0v3m8-3v3','music':'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z','hanger':'M12 3a2 2 0 0 1 2 2c0 1-1 1.5-1 1.5L3 14h18L12 6.5S11 6 11 5a2 2 0 0 1 1-2zM3 14v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1','arch':'M4 21V8M20 21V8M4 8C4 4.7 7.6 2 12 2s8 2.7 8 6M7 21v-5a5 5 0 0 1 10 0v5M7 8h10','cloche':'M2 15h20M12 5a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8zM8 19h8M12 5V3','columns':'M5 21V5m0 0h14v16M5 5l7-3 7 3M9 21v-6h6v6M3 21h18','plane':'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z','car':'M5 17H3v-5l3-6h12l3 6v5h-2m-1 0H7m0 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z','envelope':'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 0l8 8 8-8','lights':'M9 21h6M9 21V10h6v11M12 10V7M11 7h2M12 7C11.2 6 11 5 12 4c1 1 .8 2 0 3','ribbon':'M9 22h6M9 22V12h6v10M9 12l1-8h4l1 8M11 4V2m2 2V2M10 7h4','heart':'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z','wallet':'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm16 5h2m-2 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM2 11h20','bed':'M3 21v-6M21 21v-6M3 15h18M3 15v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2','star':'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'};return iconDefs[b.icon]?`<path d="${iconDefs[b.icon]}"/>`:'';})()}</svg>`:''}
          <span class="bi-name" style="flex:0 1 auto;min-width:0;font-size:13px;font-weight:700;color:#5C3D2E;text-transform:uppercase;letter-spacing:.08em">${_highlight(b.name,_budgetSearch)}</span>
          ${(balPaid && _itemIsLinked(b) && !_itemChainOnDeposit(b))
            ? `<span class="paid-full-badge bpl-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>PAID IN FULL</span>
               <span class="bpl-break" aria-hidden="true" style="flex-basis:100%;height:0;margin:0;padding:0;order:0"></span>
               <span class="bpl-link">${_chainSpan('budget',12,b.id)}</span>`
            : `${(_itemIsLinked(b) && !_itemChainOnDeposit(b))?_chainSpan('budget',12,b.id):''}
               ${balPaid?`<span class="paid-full-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>PAID IN FULL</span>`:''}`}
          ${(!balPaid && !bBadgeOnDeposit && !_bBookedToSub && _bBadgeHtml)?_bBadgeHtml:''}
          ${budgetAttachCount(b)?`<button onclick="event.stopPropagation();openBudgetAttachments('${b.id}')" title="View documents" style="font-size:9px;font-weight:600;letter-spacing:.05em;color:var(--gold-deep);background:rgba(201,184,156,.18);padding:2px 7px;border-radius:9px;display:inline-flex;align-items:center;gap:3px;border:none;cursor:pointer;box-sizing:content-box;line-height:1;font-family:inherit;vertical-align:middle;margin:0;white-space:nowrap"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:-2px 0;flex-shrink:0"><path d="M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/></svg>${attachBadgeLabel(b.attachments)}</button>`:''}
        </div>
        ${_budgetVendorIds(b).length?`<div style="margin-top:5px" onclick="event.stopPropagation()">${_budgetVendorBadges(b, b.id, '')}</div>`:''}
        ${b.note?`<div style="font-size:12px;color:var(--muted);margin-top:2px;font-style:italic">${b.note}</div>`:''}
        ${b.url?`<div style="margin-top:3px" onclick="event.stopPropagation()">${_urlChipHtml(b.url)}</div>`:''}
        ${budgetInspoChip(b)}
      </div>
      ${(_isCols||_isSplit||_hdrStyle==='stack')?'':`<div class="bi-total-block" style="display:flex;align-items:${_isRail?'stretch':'flex-start'};gap:8px;flex-shrink:0">
        ${_catHeaderBlocks(b).right}
      </div>`}
      <div class="dots-menu${(_isCols||_isRail||_isSplit||_hdrStyle==='stack')?' dots-menu-cols':''}" style="display:flex;align-items:center;gap:4px${(_isCols||_isRail||_isSplit||_hdrStyle==='stack')?';flex-direction:column;align-items:flex-end':''}">
        <div style="display:flex;align-items:center;gap:4px">
        <button onclick="toggleBudgetCollapsed('${b.id}')" title="${b.collapsed?'Show category':'Hide category'}"
          style="background:none;border:none;cursor:pointer;padding:4px 6px;color:var(--muted);display:flex;align-items:center;border-radius:6px;transition:all .15s"
          onmouseover="this.style.color='var(--ink)'" onmouseout="this.style.color='var(--muted)'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${b.collapsed?'<polyline points="6 9 12 15 18 9"/>':'<polyline points="18 15 12 9 6 15"/>'}
          </svg>
        </button>
        <button class="dots-btn" onclick="toggleDots(event,'bdots-${b.id}')">···</button>
        </div>
        ${_colAllocHtml}
        ${_railStatsHtml}
        ${(_isSplit||_hdrStyle==='stack')?`<div class="bi-menucol-total" style="display:flex;justify-content:flex-end;margin-top:3px">${_catHeaderBlocks(b).right}</div>`:''}
        <div class="dots-dropdown hidden" id="bdots-${b.id}">
          <button onclick="closeDots();openEditBudgetItem('${b.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
          <button onclick="_itemMenuInstallments('${b.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> ${(b.subItems&&b.subItems.some(s=>s._planHolder))?'Edit payment plan':'Deposit &amp; Plans'}</button>
          ${_itemIsLinked(b)
            ? `<button onclick="closeDots();_openLinkMenu('budget','${b.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Manage link</button>`
            : `<button onclick="closeDots();_openLinkToChecklist('${b.id}','')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Link task</button>`}
          <button onclick="closeDots();_itemMenuAddBalanceTask('${b.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add balance task</button>
          <button onclick="closeDots();openBudgetAttachments('${b.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> Documents${budgetAttachCount(b)?` (${budgetAttachCount(b)})`:''}</button>
          <button onclick="closeDots();_budgetAddVendor('${b.id}','')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h20v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M4 11v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9"/><path d="M9 21v-6h6v6"/></svg> Add vendor${_budgetVendorIds(b).length?` (${_budgetVendorIds(b).length})`:''}</button>
          ${b.subItems&&b.subItems.length>1?`<button onclick="closeDots();toggleSubReorder('${b.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> ${reorderingSubsFor.has(b.id)?'Done Reordering':'Reorder Sub-items'}</button>`:''}
          <button class="danger" onclick="closeDots();deleteBudgetItem('${b.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete</button>
        </div>
      </div>
    </div>
    ${!b.collapsed?`
    ${(()=>{const _bnd=_catHeaderBlocks(b).band; return _bnd?`<div style="background:var(--parchment);border-bottom:1px solid var(--border);padding-top:4px">${_bnd}</div>`:'';})()}
    <div class="bi-cat-body" style="padding:12px 16px">
    ${total||effDepDue||b.balanceDueDate?`
      <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;background:rgba(196,168,130,.10)">
        <div style="border-bottom:none">${paymentRow('Remaining Balance', balance, balPaid, b.balanceDueDate, b.balancePaidDate,
          `toggleBudgetPaid('${b.id}')`,
          `updateBudgetBalanceDate('${b.id}',this.value)`,
          `updateBudgetBalancePaidDate('${b.id}',this.value)`,
          'var(--ink)', true, !!b.totalFromSubs, _latestSubPaidDate(b,'balance'), '', _budgetShown('balDate'))}</div>
      </div>
    `:''}
    ${(Number(b.deposit||0)>0 || (!b.depositFromSubs && b.depositDueDate))?_itemDepositSubRow(b):''}
    ${(b.subItems&&b.subItems.length)?(()=>{const _subsShown=(b.expanded!==false);return `<div class="bi-subs-toggle" onclick="toggleBudgetSubs('${b.id}')" title="${_subsShown?'Hide sub-items':'Show sub-items'}" style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;padding:7px 2px 3px;cursor:pointer;border-top:1px solid var(--border);margin-top:8px">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${_subsShown?'<polyline points="18 15 12 9 6 15"/>':'<polyline points="6 9 12 15 18 9"/>'}</svg>
      ${_subsShown?'Hide sub-items':`Show ${b.subItems.length} sub-item${b.subItems.length>1?'s':''}`}
    </div>`;})():''}
    ${(b.expanded!==false)||reorderingSubsFor.has(b.id)?`<div class="bi-subs-wrap" style="${(Number(b.deposit||0)>0 || (!b.depositFromSubs && b.depositDueDate))?'margin-top:6px':'margin-top:12px;border-top:1px solid var(--border);padding-top:10px'};margin-bottom:-10px">
      ${reorderingSubsFor.has(b.id)?`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:6px 10px;background:rgba(196,168,130,.08);border-radius:6px;border:1px solid var(--border)">
        <span style="font-size:12px;color:var(--gold-deep)">Drag sub-items to reorder</span>
        <button class="btn btn-sm btn-primary" onclick="toggleSubReorder('${b.id}')">Done</button>
      </div>`:''}
      ${b.subItems&&b.subItems.length?(()=>{
        // Per-category amount column width: size it to the widest sub-item amount in THIS
        // category so the $ aligns vertically and the gap between $ and the number shrinks
        // to only what the largest amount needs (mobile reclaims the wasted fixed-62px gap).
        let _maxAmtLen=1;
        b.subItems.forEach(s=>{
          const _a=s.perHead||s.perItem||(Number(s.discountPct||0)>0||Number(s.discountAmt||0)>0||!!s.discountOpen)?getSubItemAmount(s):Number(s.amount||0);
          const _str=_a?_a.toLocaleString(_curLocale()):'-';
          if(_str.length>_maxAmtLen) _maxAmtLen=_str.length;
        });
        // ~7px per char at 12px Inter, +2px breathing; clamped so it never exceeds the old 62px.
        const _catAmtW=Math.min(62, Math.max(16, _maxAmtLen*7+2));
        return b.subItems.map(s=>{
        const sDepPaid=s.depositPaid||false;
        const sBalPaid=s.paid||false;
        const _linkedTask=STATE.checklist.find(ci=>ci.budgetId===b.id&&ci.budgetSubId===s.id);
        const _taskBook=_linkedTask?_taskBookedKeyword(_linkedTask.text):false;
        const _taskDeposit=_linkedTask?/\bdeposit\b/i.test(_linkedTask.text):false;
        // PARKED: the "BOOKED" badge is suppressed for now (revisit later).
        // Original: const sShowBooked=_linkedTask?(_linkedTask.done&&_taskBook):false;
        const sShowBooked=false;
        // PARKED: the non-booking "ITEM DONE" badge is suppressed for now (revisit later).
        // Original: const sShowItemDone=_linkedTask?(_linkedTask.done&&!_taskBook):false;
        const sShowItemDone=false;
        const _sHasDeposit=s.showDeposit||Number(s.deposit||0)>0||s.depositDueDate;
        // Honour a sub-linked booked task's chosen placement (sub vs its deposit).
        const _sPlacement = (_linkedTask && _taskBook) ? _resolveBookedPlacement(_linkedTask, b, s) : (_taskDeposit && _sHasDeposit ? 'deposit' : 'sub');
        let sBadgeOnDeposit = (_linkedTask && _taskBook) ? (_sPlacement==='deposit') : (_taskDeposit && _sHasDeposit);
        // An item-linked booked task may have chosen THIS sub-item as its placement.
        let _sBadgeHtmlEff = (sShowBooked||sShowItemDone) ? null : '';
        if(_bBookedToSub && _bLinkedTask && _bLinkedTask.bookedBadgePlacement==='sub' && (_bLinkedTask.bookedBadgeSubId||(b.subItems&&b.subItems[0]&&b.subItems[0].id))===s.id){
          // Render the item-task's BOOKED badge on this sub's name row.
          _sBadgeHtmlEff = `<span style="font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--gold-deep);background:rgba(201,184,156,.18);padding:2px 7px;border-radius:9px;display:inline-flex;align-items:center;gap:3px;box-sizing:content-box;line-height:1;border:none" title="Booked"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>BOOKED</span>`;
          sBadgeOnDeposit=false;
        }
        const _sBadgeHtml=(sShowBooked||sShowItemDone)?(sShowBooked?`<span style="font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--gold-deep);background:rgba(201,184,156,.18);padding:2px 7px;border-radius:9px;display:inline-flex;align-items:center;gap:3px;box-sizing:content-box;line-height:1;border:none" title="Booked"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>BOOKED</span>`:`<span style="font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);background:var(--surface);padding:2px 7px;border-radius:9px;display:inline-flex;align-items:center;gap:3px;box-sizing:content-box;line-height:1;border:none" title="Item done"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>ITEM DONE</span>`):'';
        // Effective badge: an item-task placed on this sub overrides; else the sub's own.
        const _sBadge = (_sBadgeHtmlEff!==null) ? _sBadgeHtmlEff : _sBadgeHtml;
        const _sBadgeShows = !!_sBadge;
        const sAmt=getSubItemAmount(s);
        const sRawAmt=Number(s.amount||0);
        const sDep=Number(s.deposit||0);
        const hasDeposit=s.showDeposit||sDep>0||s.depositDueDate;
        const hasDueDate=s.showDueDate||s.balanceDueDate;
        const isPerHead=s.perHead;
        const isPerItem=!!s.perItem;
        const hasDiscount=Number(s.discountPct||0)>0||Number(s.discountAmt||0)>0||!!s.discountOpen;
        const discountBadge=(Number(s.discountPct||0)>0||Number(s.discountAmt||0)>0)
          ? (Number(s.discountPct||0)>0
            ? `<span style="font-size:8.5px;font-weight:600;color:var(--green);background:rgba(92,143,114,.12);padding:2px 6px;border-radius:9px;white-space:nowrap;flex-shrink:0">−${Number(s.discountPct)}%</span>`
            : `<span style="font-size:8.5px;font-weight:600;color:var(--green);background:rgba(92,143,114,.12);padding:2px 6px;border-radius:9px;white-space:nowrap;flex-shrink:0">−${_curSym()}${Number(s.discountAmt).toLocaleString(_curLocale())}</span>`)
          : '';
        // An overridden per-head sub uses its own fixed count and editable field,
        // even while the budget is globally in RSVP mode.
        const useRsvp=STATE.budget.useRsvpCount && !s.guestCountOverride;
        const guestCount=useRsvp?_rsvpPerHeadCount():Number(s.guestCount||0);
        const isSubReorder = reorderingSubsFor.has(b.id);
        const hasCollapsible = isPerHead||isPerItem||hasDiscount||subHasInstallments(s);
        const subExpanded = subCalcExpanded.has(s.id);
        const isEditingAmt = subAmountEditing.has(s.id) || !(Number(s.amount)>0);
        const isDepEditing = subDepEditing.has(s.id) || !(Number(s.deposit)>0);
        const balCalLabel = (hasDueDate||sBalPaid) ? (sBalPaid
          ? (_budgetShown('subDate')?`<label title="${s.paidDate?'Change paid date':'Set paid date'}" style="cursor:pointer;color:var(--green);display:inline-flex;align-items:center;position:relative;line-height:0;width:13px;height:13px;flex-shrink:0;overflow:visible">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><path d="M9 15l2 2 4-4"/></svg>
              <input type="date" value="${s.paidDate||''}" style="position:absolute;top:0;left:0;width:13px;height:13px;opacity:0;cursor:pointer" onchange="updateSubBalancePaidDate('${b.id}','${s.id}',this.value)"/>
            </label>`:'')
          : `<label title="${s.balanceDueDate?'Change due date':'Pick due date'}" style="cursor:pointer;color:var(--muted);display:inline-flex;align-items:center;position:relative;line-height:0;width:13px;height:13px;flex-shrink:0;overflow:visible">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input type="date" value="${s.balanceDueDate||''}" style="position:absolute;top:0;left:0;width:13px;height:13px;opacity:0;cursor:pointer" onchange="updateSubBalanceDate('${b.id}','${s.id}',this.value)"/>
            </label>`) : '';
        const balPaidShown = s.paidDate || '';
        const _balCls = dueDateClass(s.balanceDueDate, sBalPaid);
        const _depCls = dueDateClass(s.depositDueDate, sDepPaid);
        const subUrgency = (_balCls==='date-overdue'||_depCls==='date-overdue') ? 'overdue'
          : (_balCls==='date-red'||_depCls==='date-red') ? 'soon' : '';
        const subUrgencyIcon = subUrgency==='overdue'
          ? `<span class="date-overdue" title="Overdue" style="display:inline-flex;align-items:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>`
          : subUrgency==='soon'
          ? `<span class="date-red" title="Due soon" style="display:inline-flex;align-items:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>`
          : '';
        const balDateText = (sBalPaid)
          ? (_budgetShown('subDate')?`<span style="font-size:9px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap;color:var(--green)">${balPaidShown?('Paid '+(paidRelative(balPaidShown)||fmtBudgetDate(balPaidShown))):'Paid'}</span>`:`<span style="font-size:9px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap;color:var(--green)">Paid</span>`)
          : (s.balanceDueDate?`<span class="${dueDateClass(s.balanceDueDate,sBalPaid)}" style="font-size:9px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap">${dueDateClass(s.balanceDueDate,sBalPaid)==='date-overdue'?'Overdue ':'Due '}${fmtBudgetDate(s.balanceDueDate)}</span>`:'');
        const _planProg = subInstallmentProgress(s);
        const _planBadge = _planProg
          ? `<span class="bsub-planbadge" style="font-size:8.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--gold-deep);background:rgba(201,184,156,.22);padding:2px 7px;border-radius:9px;display:inline-flex;align-items:center;gap:3px;line-height:1;flex-shrink:0;white-space:nowrap" title="Payment plan"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-2.82 2.82"/></svg>Plan</span>`
          : '';
        // Progress bar + "next due" line, shown under the header when a plan exists.
        const _planProgressBlock = _planProg
          ? `<div class="bsub-planprog" style="margin-top:6px;padding-left:22px">
               <div style="display:flex;align-items:center;gap:8px">
                 <div style="flex:1;max-width:200px;height:5px;border-radius:4px;background:var(--border);overflow:hidden"><div style="height:100%;width:${_planProg.pct}%;background:var(--gold)"></div></div>
                 <span style="font-size:9.5px;color:var(--muted);white-space:nowrap">${fmt(_planProg.paid)} of ${fmt(_planProg.total)} · ${_planProg.paidCount} of ${_planProg.count} paid</span>
               </div>
               ${_planProg.next?`<div class="bsub-planprog-next" style="font-size:10px;color:var(--muted);margin-top:4px">Next: ${fmt(_planProg.next.amount)}${_planProg.next.dueDate?` due ${fmtBudgetDate(_planProg.next.dueDate)}`:''}</div>`:`<div class="bsub-planprog-next" style="font-size:10px;color:var(--green);margin-top:4px">All installments paid</div>`}
             </div>`
          : '';
        const _planAccent = _planProg ? 'border-left:3px solid var(--gold);' : '';
        const _subPaidDim = sBalPaid && !_planProg && !isSubReorder;
        const inner = `<div class="budget-subitem-box${_subPaidDim?' bi-row-paid':''}" id="bsub-${s.id}" style="border-radius:8px;padding:3px 12px;margin-bottom:7px;--bsub-amt-w:${_catAmtW}px;${_planAccent}">
          <!-- Sub-item header row -->
          <div class="bsub-head" style="display:flex;align-items:center;gap:8px">
            ${isSubReorder?`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gold);flex-shrink:0;cursor:grab" title="Drag to reorder"><circle cx="9" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="17" r="1.2" fill="currentColor"/><circle cx="15" cy="17" r="1.2" fill="currentColor"/></svg>`:''}
            <div class="custom-checkbox ${sBalPaid?'checked':''}" onclick="toggleSubPaid('${b.id}','${s.id}')" style="width:14px;height:14px;min-width:14px;flex-shrink:0" title="Mark paid"></div>
            ${subUrgencyIcon}
            ${_subNameSlot(b,s)}
            ${(_subIsLinked(b,s) && !_subChainOnDeposit(b,s))?`<span style="margin-left:-2px;display:inline-flex;flex-shrink:0">${_chainSpan('budget',11,b.id,s.id)}</span>`:''}
            ${(!(sBalPaid&&((sAmt||sRawAmt)>0)) && !sBadgeOnDeposit && _sBadgeShows)?`<span class="bsub-leftbadge" style="display:inline-flex;flex-shrink:0">${_sBadge}</span>`:''}
            ${subAttachCount(s)?`<button class="bsub-line1-badge" onclick="event.stopPropagation();openSubAttachments('${b.id}','${s.id}')" title="View documents" style="font-size:10px;color:var(--gold-deep);font-weight:600;background:rgba(196,168,130,.15);padding:1px 7px;border-radius:9px;display:inline-flex;align-items:center;gap:3px;border:none;cursor:pointer;flex-shrink:0;white-space:nowrap"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:-2px 0;flex-shrink:0"><path d="M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/></svg>${attachBadgeLabel(s.attachments)}</button>`:''}
            ${_nameHasDeposit(s.name)?`<span style="flex:1 1 auto;min-width:4px"></span>`:'<span style="flex:1 1 auto;min-width:4px"></span>'}
            ${_planBadge?`<span class="bsub-2ndline-badge" style="display:inline-flex;align-items:center;flex-shrink:0">${_planBadge}</span>`:''}
            ${discountBadge?`<span class="bsub-2ndline-badge" style="display:inline-flex;align-items:center;flex-shrink:0">${discountBadge}</span>`:''}
            ${_budgetVendorIds(s).length?`<span class="bsub-2ndline-badge bsub-vendor-inline" style="display:none;align-items:center;flex-shrink:0" onclick="event.stopPropagation()">${_budgetVendorBadges(s, b.id, s.id)}</span>`:''}
            <span class="bsub-rightgrp" style="display:inline-flex;align-items:center;gap:0;flex-shrink:0;margin-left:auto">
            ${balDateText?`<span style="display:inline-flex;align-items:center;flex-shrink:0;margin-right:4px">${balDateText}</span>`:''}
            ${balCalLabel?`<span style="display:inline-flex;align-items:center;margin-right:4px;flex-shrink:0">${balCalLabel}</span>`:''}
            <span class="bsub-amt" style="display:inline-flex;align-items:center;flex-shrink:0">${(isPerHead||isPerItem||hasDiscount)?`<span style="font-size:12px;color:var(--gold-deep);font-weight:600;width:10px;text-align:right;flex-shrink:0">${_curSym()}</span><span class="bsub-amt-num" style="font-size:12px;font-weight:600;color:var(--gold-deep);font-family:'Inter',sans-serif;width:62px;text-align:right;flex-shrink:0;margin-left:-16px">${sAmt?sAmt.toLocaleString(_curLocale()):'-'}</span>`:`
              <span style="font-size:12px;color:var(--gold-deep);font-weight:600;width:10px;text-align:right;flex-shrink:0">${_curSym()}</span>
              ${sBalPaid?`<span class="bsub-amt-num" style="font-size:12px;font-weight:600;color:var(--gold-deep);font-family:'Inter',sans-serif;width:62px;text-align:right;flex-shrink:0;margin-left:-16px">${sRawAmt?sRawAmt.toLocaleString(_curLocale()):'-'}</span>`:(isEditingAmt?`<input type="number" value="${sRawAmt||''}" placeholder="0" min="0" step="0.01" id="subamt-${s.id}"
                style="width:62px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right;flex-shrink:0"
                onchange="updateSubItemAmount('${b.id}','${s.id}',this.value)"
                onblur="commitSubAmount('${b.id}','${s.id}',this.value)"
                onfocus="this.style.borderColor='var(--gold)'"
                onkeydown="if(event.key==='Enter'){this.blur();}"/>`:`<span class="bsub-amt-num" style="font-size:12px;font-weight:600;color:var(--gold-deep);font-family:'Inter',sans-serif;width:62px;text-align:right;flex-shrink:0;margin-left:-16px">${sRawAmt?sRawAmt.toLocaleString(_curLocale()):'-'}</span>`)}`}</span>
            </span>
            <div class="dots-menu">
              <button class="dots-btn" onclick="toggleDots(event,'sdots-${s.id}')" style="font-size:15px;padding:2px 6px">···</button>
              <div class="dots-dropdown hidden" id="sdots-${s.id}">
                <button onclick="closeDots();_editSubItem('${b.id}','${s.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
                <button onclick="closeDots();openPaymentsEditor('${b.id}','${s.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Deposit &amp; Plans
                </button>
                ${!s._planHolder?`<button onclick="closeDots();toggleSubPerHead('${b.id}','${s.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  ${isPerHead?'Remove Per Head':'Per Head Calc'}
                </button>
                <button onclick="closeDots();toggleSubPerItem('${b.id}','${s.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  ${s.perItem?'Remove Per Item':'Per Item Calc'}
                </button>
                <button onclick="closeDots();toggleSubDiscount('${b.id}','${s.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                  ${hasDiscount?'Remove Discount':'Add Discount'}
                </button>`:''}
                ${_subIsLinked(b,s)
                  ? `<button onclick="closeDots();_openLinkMenu('budget','${b.id}','${s.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Manage link</button>`
                  : `<button onclick="closeDots();_openLinkToChecklist('${b.id}','${s.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Link task</button>`}
                <button onclick="closeDots();openSubAttachments('${b.id}','${s.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  Documents${subAttachCount(s)?` (${subAttachCount(s)})`:''}
                </button>
                <button onclick="closeDots();_budgetAddVendor('${b.id}','${s.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h20v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M4 11v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9"/><path d="M9 21v-6h6v6"/></svg>
                  Add vendor${_budgetVendorIds(s).length?` (${_budgetVendorIds(s).length})`:''}
                </button>
                <button class="danger" onclick="closeDots();deleteSubItem('${b.id}','${s.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg> Delete</button>
              </div>
            </div>
            ${hasCollapsible?`<button class="bsub-chevron" onclick="toggleSubCalcExpand('${s.id}')" title="${subExpanded?'Hide details':'Show details'}" style="background:none;border:none;cursor:pointer;padding:2px;color:var(--muted);display:flex;align-items:center;flex-shrink:0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${subExpanded?'<polyline points="18 15 12 9 6 15"/>':'<polyline points="6 9 12 15 18 9"/>'}
              </svg>
            </button>`:`<span class="bsub-chevron" aria-hidden="true" style="padding:2px;color:var(--border);display:flex;align-items:center;flex-shrink:0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.35"><polyline points="6 9 12 15 18 9"/></svg>
            </span>`}
          </div>
          ${_budgetVendorIds(s).length?`<div class="bsub-vendor-line" style="margin-top:4px" onclick="event.stopPropagation()">${_budgetVendorBadges(s, b.id, s.id)}</div>`:''}
          ${_planProgressBlock}
          ${subExpanded?`
          ${isPerHead?`<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;flex:1">Per Head</span>
              <span id="sub-eq-${s.id}" style="font-size:11.5px;color:var(--muted)">${!useRsvp?guestCount:guestCount} × $${Number(s.pricePerHead||0).toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(sAmt)}</strong></span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px">
              ${!useRsvp?`<div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:11.5px;color:var(--muted)">Guests</span>
                <input type="number" value="${s.guestCount||''}" placeholder="0" min="0"
                  style="width:60px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
                  oninput="updateSubGuestCount('${b.id}','${s.id}',this.value)"
                  onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
              </div>`:`<span style="font-size:11.5px;color:var(--muted)">Using <strong>${guestCount}</strong> RSVP guests</span>`}
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:11.5px;color:var(--muted)">×  $</span>
                <input type="number" value="${s.pricePerHead||''}" placeholder="0.00" min="0" step="0.01"
                  style="width:80px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
                  oninput="updateSubPricePerHead('${b.id}','${s.id}',this.value)"
                  onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
                <span style="font-size:11.5px;color:var(--muted)">per head</span>
              </div>
            </div>
          </div>`:''}
          ${isPerItem?`<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;flex:1">Per Item</span>
              <span id="sub-eq-${s.id}" style="font-size:11.5px;color:var(--muted)">${Number(s.itemCount||0)} × $${Number(s.pricePerItem||0).toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(sAmt)}</strong></span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:11.5px;color:var(--muted)">Items</span>
                <input type="number" value="${s.itemCount||''}" placeholder="0" min="0"
                  style="width:60px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
                  oninput="updateSubItemCount('${b.id}','${s.id}',this.value)"
                  onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:11.5px;color:var(--muted)">×  $</span>
                <input type="number" value="${s.pricePerItem||''}" placeholder="0.00" min="0" step="0.01"
                  style="width:80px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
                  oninput="updateSubPricePerItem('${b.id}','${s.id}',this.value)"
                  onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
                <span style="font-size:11.5px;color:var(--muted)">per item</span>
              </div>
            </div>
          </div>`:''}
          ${hasDiscount&&subExpanded?`<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;flex:1">Discount</span>
              <span id="sub-disc-eq-${s.id}" style="font-size:11.5px;color:var(--muted)">${(()=>{
                const base=(()=>{if(s.perHead){const c=useRsvp?guestCount:Number(s.guestCount||0);return c*Number(s.pricePerHead||0);}if(s.perItem){return Number(s.itemCount||0)*Number(s.pricePerItem||0);}return Number(s.amount||0);})();
                if(Number(s.discountPct||0)>0) return `${fmt(base)} &minus; ${Number(s.discountPct)}% = <strong style="color:var(--gold-deep)">${fmt(sAmt)}</strong>`;
                if(Number(s.discountAmt||0)>0) return `${fmt(base)} &minus; ${fmt(Number(s.discountAmt))} = <strong style="color:var(--gold-deep)">${fmt(sAmt)}</strong>`;
                return '';
              })()}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:4px">
                <input type="number" value="${s.discountPct||''}" placeholder="0" min="0" max="100" step="0.01" id="sub-disc-pct-${s.id}"
                  style="width:58px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
                  oninput="updateSubDiscountPct('${b.id}','${s.id}',this.value)"
                  onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
                <span style="font-size:11.5px;color:var(--muted)">%</span>
              </div>
              <span style="font-size:11px;color:var(--muted)">or</span>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:11.5px;color:var(--muted)">$</span>
                <input type="number" value="${s.discountAmt||''}" placeholder="0.00" min="0" step="0.01" id="sub-disc-amt-${s.id}"
                  style="width:72px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
                  oninput="updateSubDiscountAmt('${b.id}','${s.id}',this.value)"
                  onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
                <span style="font-size:11.5px;color:var(--muted)">off</span>
              </div>
            </div>
          </div>`:''}
          ${subHasInstallments(s)?`<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:5px">Installments — tap to mark paid</div>
            ${s.installments.map((inst,ii)=>{
              const ip=!!inst.paid;
              return `<div onclick="toggleSubInstallmentPaid('${b.id}','${s.id}',${ii})" style="display:flex;align-items:center;gap:8px;padding:5px 0;cursor:pointer">
                <span style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${ip?'var(--green)':'var(--gold)'};background:${ip?'var(--green)':'transparent'};flex:none;display:inline-flex;align-items:center;justify-content:center">${ip?'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</span>
                <span style="font-size:11.5px;color:${ip?'var(--muted)':'var(--ink)'};${ip?'text-decoration:line-through':''}">${(inst.label||('Installment '+(ii+1))).replace(/</g,'&lt;')}</span>
                ${ip&&inst.paidDate?`<span style="font-size:10px;color:var(--green)">${paidRelative(inst.paidDate)||('Paid '+fmtBudgetDate(inst.paidDate))}</span>`:(inst.dueDate?`<span style="font-size:10px;color:var(--muted)">Due ${fmtBudgetDate(inst.dueDate)}</span>`:'')}
                <span style="margin-left:auto;font-size:11.5px;font-weight:600;color:${ip?'var(--green)':'var(--gold-deep)'}">${fmt(Number(inst.amount||0))}</span>
              </div>`;
            }).join('')}
          </div>`:''}
          `:''}
          ${hasDeposit?`<div style="margin:5px 0 0 6px;display:flex;align-items:stretch;gap:0">
            <div style="width:14px;border-left:1.5px solid var(--connector);border-bottom:1.5px solid var(--connector);border-bottom-left-radius:5px;margin-bottom:14px;flex-shrink:0"></div>
            <div class="bsub-dep-row" style="flex:1;margin-left:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:rgba(201,184,156,.10);border-radius:8px;padding:5px 9px">
              <div class="custom-checkbox ${sDepPaid?'checked':''}" onclick="toggleSubDepositPaid('${b.id}','${s.id}')" style="width:14px;height:14px;min-width:14px;flex-shrink:0"></div>
              <span style="display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--gold-deep);background:rgba(201,184,156,.18);padding:2px 7px;border-radius:9px;flex-shrink:0">${_depositReceiptSvg(10)}Deposit</span>
              ${_subChainOnDeposit(b,s)?_chainSpan('budget',11,b.id,s.id):''}
              ${(sBadgeOnDeposit && !(sDepPaid) && _sBadgeShows)?`<span style="flex-shrink:0">${_sBadge}</span>`:''}
              <span style="flex:1 1 auto;min-width:4px"></span>
              <div style="display:inline-flex;align-items:center;gap:3px;flex-shrink:0;margin-left:auto">
              <div style="display:inline-flex;align-items:center;gap:3px;flex-shrink:1;min-width:0;margin-right:4px">
                  ${sDepPaid?`${_budgetShown('depDate')?`<span style="font-size:9px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap;color:var(--green)">${s.depositPaidDate?(('Paid '+(paidRelative(s.depositPaidDate)||fmtBudgetDate(s.depositPaidDate)))):'Paid'}</span>
                  <label title="${s.depositPaidDate?'Change deposit paid date':'Set deposit paid date'}" style="cursor:pointer;color:var(--green);display:inline-flex;align-items:center;position:relative;line-height:0;width:13px;height:13px;flex-shrink:0;overflow:visible">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><path d="M9 15l2 2 4-4"/></svg>
                    <input type="date" value="${s.depositPaidDate||''}" style="position:absolute;top:0;left:0;width:13px;height:13px;opacity:0;cursor:pointer" onchange="updateSubDepositPaidDate('${b.id}','${s.id}',this.value)"/>
                  </label>`:`<span style="font-size:9px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap;color:var(--green)">Paid</span>`}`:`
                  ${s.depositDueDate?`<span class="${dueDateClass(s.depositDueDate,sDepPaid)}" style="font-size:9px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap">${dueDateClass(s.depositDueDate,sDepPaid)==='date-overdue'?'Overdue ':'Due '}${fmtBudgetDate(s.depositDueDate)}</span>`:''}
                  <label title="${s.depositDueDate?'Change deposit due date':'Pick deposit due date'}" style="cursor:pointer;color:var(--muted);display:inline-flex;align-items:center;position:relative;line-height:0;width:13px;height:13px;flex-shrink:0;overflow:visible">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <input type="date" value="${s.depositDueDate||''}" style="position:absolute;top:0;left:0;width:13px;height:13px;opacity:0;cursor:pointer" onchange="updateSubDepositDate('${b.id}','${s.id}',this.value)"/>
                  </label>`}
              </div>
              <span class="dep-amt-lt" style="font-size:12px;font-weight:400;width:10px;text-align:right;flex-shrink:0">${_curSym()}</span>
              ${isDepEditing?`<input type="number" value="${sDep||''}" placeholder="0" min="0" step="0.01" id="subdep-${s.id}"
                style="width:62px;margin-left:-20px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right;flex-shrink:0"
                oninput="updateSubDeposit('${b.id}','${s.id}',this.value)"
                onblur="commitSubDeposit('${b.id}','${s.id}',this.value)"
                onfocus="this.style.borderColor='var(--gold)'"
                onkeydown="if(event.key==='Enter'){this.blur();}"/>
              <span style="width:28px;flex-shrink:0"></span>
              <span style="width:6px;flex-shrink:0"></span>`:`<span class="dep-amt-lt bsub-depamt-num" style="font-size:12px;font-weight:400;font-family:'Inter',sans-serif;width:62px;text-align:right;flex-shrink:0;margin-left:-16px">${sDep.toLocaleString(_curLocale())}</span>
              <span style="width:6px;flex-shrink:0"></span>`}
              </div>
            </div>
          </div>`:''}
          ${s.url?`<div class="bsub-url-line" style="margin:1px 0 4px 22px" onclick="event.stopPropagation()">${_urlChipHtml(s.url)}</div>`:''}
        </div>`;
        if(!isSubReorder) return inner;
        return `<div data-sid="${s.id}" data-spid="${b.id}" draggable="true"
          ondragstart="subItemDragStart(event,'${b.id}','${s.id}')"
          ondragover="subItemDragOver(event,'${b.id}','${s.id}')"
          ondrop="subItemDrop(event,'${b.id}','${s.id}')"
          ondragleave="subItemDragLeave(event,'${b.id}','${s.id}')"
          style="cursor:grab;border-radius:8px;border:1.5px dashed rgba(196,168,130,.5);margin-bottom:8px;transition:background .15s">${inner}</div>`;
      }).join('');})():''}
    </div>`:''}
      <button class="btn btn-ghost btn-sm" onclick="addSubItem('${b.id}')" style="color:var(--gold-deep);font-size:11px;padding:2px 6px;display:inline-flex;align-items:center;gap:3px;margin-top:6px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add sub-item
      </button>
    </div>
    `:''}
  </div>`;
}

function toggleSubCalcExpand(sid){
  if(subCalcExpanded.has(sid)) subCalcExpanded.delete(sid);
  else subCalcExpanded.add(sid);
  navigate('budget');
}

function toggleSubReorder(id){
  if(reorderingSubsFor.has(id)){
    reorderingSubsFor.delete(id);
  } else {
    reorderingSubsFor.add(id);
    // Ensure the category is expanded so sub-items are visible
    const b=STATE.budget.items.find(x=>x.id===id);
    if(b) b.expanded=true;
  }
  navigate('budget');
}

function toggleBudgetPaid(id){
  const b=STATE.budget.items.find(x=>x.id===id); if(!b)return;
  _popupOrigin=_currentPage;
  const _snapshot = JSON.parse(JSON.stringify(b)); // for Cancel revert
  const _hadPrevDate = !!b.balancePaidDate;
  b.paid=!b.paid;
  // Gather linked tasks affected, to offer a combined pop-up afterwards
  const _affected=[];
  const _addTask=(t)=>{ if(t) _affected.push(t); };
  if(b.paid){
    // Check all sub-items
    if(b.subItems && b.subItems.length){
      b.subItems.forEach(s=>{
        s.paid=true; _stampSubPaidDate(s);
        // Check each sub-item's deposit
        const subHasDep = s.showDeposit || Number(s.deposit||0)>0 || s.depositDueDate;
        if(subHasDep && !s.depositPaid){ s.depositPaid=true; if(!s.depositPaidDate) s.depositPaidDate=_todayISO(); }
        const st=STATE.checklist.find(ci=>ci.budgetId===b.id&&ci.budgetSubId===s.id);
        _addTask(st);
      });
    }
    // Check the item-level deposit
    const itemHasDep = (calcBudgetDeposit(b)>0) || (!b.depositFromSubs && b.depositDueDate) || b.depositFromSubs;
    if(itemHasDep && !b.depositPaid){ b.depositPaid=true; if(!b.depositPaidDate) b.depositPaidDate=_todayISO(); }
  } else {
    // Unticking: revert sub-items to manually-checked ones (deposits are left as-is, never auto-unchecked)
    if(b.subItems && b.subItems.length){
      b.subItems.forEach(s=>{
        s.paid=!!s.manualPaid;
        const st=STATE.checklist.find(ci=>ci.budgetId===b.id&&ci.budgetSubId===s.id);
        _addTask(st);
      });
    }
  }
  // The item's own linked checklist task — include in the pop-up rather than auto-syncing
  let _itemTask = b.checklistId ? STATE.checklist.find(x=>x.id===b.checklistId) : null;
  if(!_itemTask) _itemTask = STATE.checklist.find(ci=>ci.budgetId===b.id && !ci.budgetSubId);
  if(_itemTask) _affected.unshift(_itemTask);
  _pendingInvoicePrompt = b.paid ? {bid:b.id, sid:''} : null;
  if(b.paid){
    // Merged pop-up: record paid date + offer to mark linked tasks done, in one step.
    if(!b.balancePaidDate) b.balancePaidDate=_todayISO();
    // Nothing linked to this item? Offer to link a matching checklist task first.
    const dateCtx = {
      prevDate: _hadPrevDate ? _snapshot.balancePaidDate : '',
      applyDate:(iso)=>{ b.balancePaidDate=iso; },
      revert:()=>{ Object.keys(b).forEach(k=>{ delete b[k]; }); Object.assign(b, _snapshot); },
      previewB:b, previewS:null, previewKind:''
    };
    saveToStorage(); navigate(_popupReturn());
    _askTaskDoneBatch(_affected, true, b.name, dateCtx);
    return;
  }
  const _revertCtx = {
    revert:()=>{ Object.keys(b).forEach(k=>{ delete b[k]; }); Object.assign(b, _snapshot);
      // Restore any sub-item state captured in the snapshot.
      if(_snapshot.subItems){ (b.subItems||[]).forEach((s,i)=>{ const snap=_snapshot.subItems.find(x=>x.id===s.id); if(snap) Object.assign(s, snap); }); }
    }
  };
  const _finish=()=>{ saveToStorage(); navigate(_popupReturn()); _askTaskDoneBatch(_affected, b.paid, b.name, null, _revertCtx); };
  _finish();
}
function updateBudgetSummary(){
  const body=document.getElementById('budget-summary-body');
  if(body) body.innerHTML=_budgetShown('summary')?_budgetSummaryWithCorner():'';
  saveToStorage();
}
// Summary body plus the corner style-switcher overlay (only when summary is shown).
function _budgetSummaryWithCorner(){
  return `<div>${renderBudgetSummaryBody()}</div>`;
}

// ── Display options popup: budget summary layout + category header style ──────
const _SUMMARY_STYLE_META = [
  {n:1, name:'Cards',     tn:'<i style="left:4px;top:7px;width:6px;height:6px"></i><i class="dop-mut" style="left:16px;top:7px;width:6px;height:6px"></i><i class="dop-mut" style="left:28px;top:7px;width:5px;height:6px"></i><i style="left:4px;top:22px;width:30px;height:3px;border-radius:2px"></i>'},
  {n:2, name:'Meter',     tn:'<i style="left:4px;top:6px;width:33px;height:5px;border-radius:3px;background:var(--border)"></i><i class="dop-grn" style="left:4px;top:6px;width:12px;height:5px;border-radius:3px"></i><i style="left:4px;top:18px;width:8px;height:7px"></i><i class="dop-mut" style="left:16px;top:18px;width:8px;height:7px"></i>'},
  {n:3, name:'Rows',      tn:'<i class="dop-mut" style="left:4px;top:7px;width:4px;height:4px"></i><i style="left:12px;top:8px;width:16px;height:2px"></i><i class="dop-mut" style="left:4px;top:17px;width:4px;height:4px"></i><i style="left:12px;top:18px;width:14px;height:2px"></i><i class="dop-mut" style="left:4px;top:27px;width:4px;height:4px"></i><i style="left:12px;top:28px;width:18px;height:2px"></i>'},
  {n:4, name:'Ring',      tn:'<i style="left:4px;top:5px;width:14px;height:9px"></i><i class="dop-mut" style="left:22px;top:6px;width:13px;height:2px"></i><i class="dop-mut" style="left:22px;top:11px;width:13px;height:2px"></i><i style="left:4px;top:20px;width:31px;height:2px;background:var(--border)"></i>'}
];
const _HEADER_STYLE_META = [
  {k:'rail',     name:'Right rail', tn:'<i style="left:4px;top:7px;width:14px;height:10px"></i><i class="dop-mut" style="left:22px;top:5px;width:11px;height:2px"></i><i class="dop-mut" style="left:22px;top:10px;width:11px;height:2px"></i><i class="dop-mut" style="left:22px;top:15px;width:11px;height:2px"></i>'},
  {k:'columns',  name:'Stat columns', tn:'<i style="left:4px;top:6px;width:7px;height:7px"></i><i class="dop-mut" style="left:15px;top:6px;width:7px;height:7px"></i><i class="dop-mut" style="left:26px;top:6px;width:7px;height:7px"></i>'},
  {k:'stack',    name:'Compact stack', tn:'<i style="left:18px;top:5px;width:15px;height:5px;border-radius:1px"></i><i class="dop-mut" style="left:23px;top:13px;width:10px;height:2px"></i><i class="dop-mut" style="left:20px;top:18px;width:13px;height:2px"></i>'},
  {k:'splitbar', name:'Spend split bar', tn:'<i class="dop-grn" style="left:4px;top:13px;width:11px;height:5px;border-radius:2px"></i><i style="left:15px;top:13px;width:18px;height:5px;border-radius:0 2px 2px 0"></i><i class="dop-mut" style="left:4px;top:6px;width:14px;height:3px"></i>'}
];
function openDisplayOptions(){
  const curSum=STATE.budget.summaryStyle||1;
  let curHdr=(STATE.settings&&STATE.settings.catHeaderStyle)||'rail';
  if(!_CAT_HEADER_STYLES.includes(curHdr)) curHdr='rail';
  const optCard=(selected,tn,name,onclick,dataK)=>`<button type="button" onclick="${onclick}"${dataK?` data-k="${dataK}"`:''} class="dop-opt${selected?' sel':''}" style="font-family:inherit">
      <span class="dop-tn">${tn}</span><span class="dop-name">${name}</span></button>`;
  const sumGrid=_SUMMARY_STYLE_META.map(s=>optCard(curSum===s.n,s.tn,s.name,`setBudgetStyleFromPopup(${s.n})`)).join('');
  const hdrGrid=_HEADER_STYLE_META.map(s=>optCard(curHdr===s.k,s.tn,s.name,`setCatHeaderStyle('${s.k}')`,s.k)).join('');
  const body=`<div style="display:flex;flex-direction:column;gap:18px">
    <div>
      <div class="dop-sec">Budget summary layout</div>
      <div class="dop-grid dop-grid-4" id="dop-sum">${sumGrid}</div>
    </div>
    <div>
      <div class="dop-sec">Category header style</div>
      <div class="dop-grid dop-grid-4" id="dop-hdr">${hdrGrid}</div>
    </div>
  </div>`;
  openModal('Display options', body, `<button class="btn btn-primary" onclick="closeModalDirect()">Done</button>`);
}
function setBudgetStyleFromPopup(n){
  STATE.budget.summaryStyle=n;
  saveToStorage();
  document.querySelectorAll('#dop-sum .dop-opt').forEach((el,i)=>el.classList.toggle('sel',i+1===n));
  const body=document.getElementById('budget-summary-body');
  if(body) body.innerHTML=_budgetShown('summary')?_budgetSummaryWithCorner():'';
}
function setCatHeaderStyle(k){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.catHeaderStyle=k;
  saveToStorage();
  const opts=document.querySelectorAll('#dop-hdr .dop-opt');
  opts.forEach(el=>el.classList.toggle('sel', el.getAttribute('data-k')===k));
  // Re-render the budget list underneath so headers update live.
  const list=document.getElementById('budget-items');
  if(list) list.innerHTML=_budgetItemsListHtml();
}

// Shared figure calc for the budget summary body
function _budgetSummaryFigures(){
  const items=STATE.budget.items||[];
  const totalCost=items.reduce((s,b)=>s+calcBudgetItemTotal(b),0);
  // Deposits-only figure (kept for the breakdown popup's "Deposits" line).
  const totalSpent=items.reduce((s,b)=>s+calcBudgetDeposit(b)+(b.paid&&!b.depositPaid?calcBudgetBalance(b):0),0);
  // Total Paid = every real payment: deposits + paid sub-items + paid installments +
  // fully-paid balances. calcBudgetPaid already folds all of these in via the balance.
  const totalPaid=items.reduce((s,b)=>s+calcBudgetPaid(b),0);
  const budgetTotal=STATE.budget.total||0;
  return { totalCost, totalSpent, totalPaid, budgetTotal };
}

// The breakdown list icon button used in every style
function _budgetBreakdownBtn(onclick, title){
  return `<button onclick="${onclick}" title="${title}" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:inline-flex;align-items:center;border-radius:5px;transition:color .15s" onmouseover="this.style.color='var(--gold-deep)'" onmouseout="this.style.color='var(--muted)'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>`;
}

function renderBudgetSummaryBody(){
  /* v178: four figures — Committed, Paid, Left to pay (committed − paid: still owed for
     what's booked) and Unallocated (budget − committed: money not yet assigned). Every
     style renders two layouts: A (all four side by side, compact) for phones and B
     (grouped by what each figure is measured against) for wider screens; CSS picks one
     at the app's 560px mobile breakpoint (.bsum-a / .bsum-b). */
  const style=STATE.budget.summaryStyle||1;
  const { totalCost, totalPaid, budgetTotal }=_budgetSummaryFigures();
  const F=_budgetFourFigures(totalCost, totalPaid, budgetTotal);
  const allocBtn=_budgetBreakdownBtn('openAllocatedSummary()','View committed breakdown');
  const depBtn=_budgetBreakdownBtn('openPaidSummary()','View payments (incl. deposits)');
  const dueBtn=_budgetBreakdownBtn('openOwedSummary()','View what’s still owed');
  const serif="font-family:'Cormorant Garamond',serif";
  const pct=(a,b)=>b>0?Math.max(0,Math.min(100,a/b*100)):0;
  const base=Math.max(budgetTotal,totalCost);
  const lbl=(t,btn,sw)=>`<span style="font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);white-space:nowrap;display:inline-flex;align-items:center;gap:5px;min-height:18px">${sw?`<span style="width:9px;height:9px;border-radius:2px;background:${sw};flex-shrink:0"></span>`:''}${t}${btn||''}</span>`;
  const val=(v,c,size)=>`<span style="${serif};font-size:${size||18}px;font-weight:600;color:${c};line-height:1.15;white-space:nowrap">${v}</span>`;
  const fig=(t,v,c,btn,sw)=>`<div style="min-width:0;display:flex;flex-direction:column;gap:2px">${lbl(t,btn,sw)}${val(v,c)}</div>`;
  const gTitle=(t,v)=>`<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px"><span style="font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">${t}</span>${val(v,'var(--ink)',15)}</div>`;
  const G1='Your budget', G2='Of what’s committed';
  const meter=(segs)=>`<div style="height:7px;border-radius:5px;background:var(--border);overflow:hidden;display:flex">${segs.map(s=>`<div style="width:${s[0]}%;background:${s[1]}"></div>`).join('')}</div>`;
  const wrapAB=(a,b)=>`<div class="bsum-a">${a}</div><div class="bsum-b">${b}</div>`;

  if(style===2){
    const paidSeg=[pct(totalPaid,base),'var(--green)'], dueSeg=[pct(F.due,base),'var(--gold)'];
    const a=`<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;gap:8px">
        ${lbl(budgetTotal?`Committed ${fmt(totalCost)} of ${fmt(budgetTotal)}`:'Committed')}
        ${val(budgetTotal?Math.round(totalCost/budgetTotal*100)+'%':'—',F.over?'var(--red)':'var(--ink)',14)}</div>
      ${meter([paidSeg,dueSeg])}
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:6px">
        ${fig('Paid',fmt(totalPaid),'var(--green)',depBtn,'var(--green)')}${fig('Left to pay',fmt(F.due),'var(--gold-deep)',dueBtn,'var(--gold)')}${fig(F.remLbl,F.remVal,F.remColor,'')}</div>`;
    const b=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
      <div>${gTitle(G1,fmt(budgetTotal))}${meter([[pct(Math.min(totalCost,budgetTotal||totalCost),base),'var(--gold-deep)']].concat(F.over?[[pct(totalCost-budgetTotal,base),'var(--red)']]:[]))}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px">${fig('Committed',fmt(totalCost),'var(--ink)',allocBtn,'var(--gold-deep)')}${fig(F.remLbl,F.remVal,F.remColor,'')}</div></div>
      <div>${gTitle(G2,fmt(totalCost))}${meter([[pct(totalPaid,totalCost),'var(--green)'],[pct(F.due,totalCost),'var(--gold)']])}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px">${fig('Paid',fmt(totalPaid),'var(--green)',depBtn,'var(--green)')}${fig('Left to pay',fmt(F.due),'var(--gold-deep)',dueBtn,'var(--gold)')}</div></div></div>`;
    return wrapAB(a,b);
  }

  if(style===3){
    const bd='border-bottom:1px solid var(--border)';
    const row=(icon,iconColor,t,v,vc,btn,last,sub)=>`<div style="display:flex;align-items:center;gap:10px;padding:1.5px 0${sub?';padding-left:22px':''};${last?'':bd}">
      <span style="color:${iconColor};display:inline-flex">${icon}</span>
      <span style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);flex:1;display:inline-flex;align-items:center;gap:6px">${t}${btn||''}</span>
      ${val(v,vc)}</div>`;
    const icA='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>';
    const icD='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
    const icO='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>';
    const icR='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
    const rows=(indent)=>`<div class="bsum-rows">`+row(icA,'var(--gold-deep)','Committed',fmt(totalCost),'var(--ink)',allocBtn,false)
      +row(icD,'var(--green)','Paid',fmt(totalPaid),'var(--green)',depBtn,false,indent)
      +row(icO,'var(--gold-deep)','Left to pay',fmt(F.due),'var(--gold-deep)',dueBtn,false,indent)
      +row(icR,'var(--gold-deep)',F.remLbl,F.remVal,F.remColor,'',true)+`</div>`;
    return wrapAB(rows(false),rows(true));
  }

  if(style===4){
    const circ=195, p=base?totalPaid/base:0, d=base?F.due/base:0;
    const pctFree=budgetTotal?Math.max(0,Math.round(F.rem/budgetTotal*100)):0;
    const ring=`<svg width="44" height="44" viewBox="0 0 74 74" style="flex-shrink:0;margin-left:-2px" role="img" aria-label="Paid, left to pay and unallocated">
        <circle cx="37" cy="37" r="31" fill="none" stroke="var(--border)" stroke-width="8"/>
        <circle cx="37" cy="37" r="31" fill="none" stroke="var(--green)" stroke-width="8" stroke-dasharray="${(circ*p).toFixed(1)} ${circ}" transform="rotate(-90 37 37)"/>
        <circle cx="37" cy="37" r="31" fill="none" stroke="${F.over?'var(--red)':'var(--gold)'}" stroke-width="8" stroke-dasharray="${(circ*d).toFixed(1)} ${circ}" stroke-dashoffset="${(-circ*p).toFixed(1)}" transform="rotate(-90 37 37)"/>
        <text x="37" y="35" text-anchor="middle" style="${serif};font-size:15px;font-weight:600;fill:var(--ink)">${F.over?'Over':(budgetTotal?pctFree+'%':'—')}</text>
        <text x="37" y="47" text-anchor="middle" style="font-size:6.5px;fill:var(--muted);letter-spacing:.04em">${F.over?'BUDGET':'UNALLOCATED'}</text>
      </svg>`;
    const a=`<div class="bsum-ring" style="display:flex;align-items:center;gap:12px;min-width:0">${ring}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;flex:1;min-width:0">${fig(F.remLbl,F.remVal,F.remColor)}${fig('Committed',fmt(totalCost),'var(--ink)')}${fig('Paid',fmt(totalPaid),'var(--green)')}${fig('Left to pay',fmt(F.due),'var(--gold-deep)')}</div></div>`;
    const b=`<div class="bsum-ring" style="display:flex;align-items:center;gap:16px;min-width:0">${ring}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;flex:1;min-width:0">
        <div>${gTitle(G1,fmt(budgetTotal))}<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${fig('Committed',fmt(totalCost),'var(--ink)',allocBtn)}${fig(F.remLbl,F.remVal,F.remColor)}</div></div>
        <div>${gTitle(G2,fmt(totalCost))}<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${fig('Paid',fmt(totalPaid),'var(--green)',depBtn)}${fig('Left to pay',fmt(F.due),'var(--gold-deep)',dueBtn)}</div></div></div></div>`;
    return wrapAB(a,b);
  }

  // Style 1 (default): cards
  const card=(t,v,c,btn)=>`<div class="bsum-card" style="background:var(--surface);border-radius:10px;padding:7px 8px;position:relative;min-width:0">
    ${btn?`<span class="bsum-card-btn" style="position:absolute;top:6px;right:8px">${btn}</span>`:''}
    <div class="bsum-card-lbl" style="font-size:9.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.01em;margin-bottom:0;line-height:1.2;white-space:nowrap">${t}</div>
    <div style="${serif};font-size:18px;font-weight:600;color:${c};line-height:1.15;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v}</div></div>`;
  const cC=card('Committed',fmt(totalCost),'var(--ink)',allocBtn), cP=card('Paid',fmt(totalPaid),'var(--green)',depBtn),
        cD=card('Left to pay',fmt(F.due),'var(--gold-deep)',dueBtn), cR=card(F.remLbl,F.remVal,F.remColor,'');
  const a=`<div class="bsum-cards-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px">${cC}${cP}${cD}${cR}</div>`;
  const b=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div>${gTitle(G1,fmt(budgetTotal))}<div class="bsum-cards-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:7px">${cC}${cR}</div></div>
    <div>${gTitle(G2,fmt(totalCost))}<div class="bsum-cards-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:7px">${cP}${cD}</div></div></div>`;
  return wrapAB(a,b);
}

/* The four budget figures, in one place, so the Budget page, both dashboard widgets and the
   summary report can't drift apart again (they had three meanings of "remaining"). */
function _budgetFourFigures(totalCost, totalPaid, budgetTotal){
  const due=Math.max(0,(totalCost||0)-(totalPaid||0));
  const rem=(budgetTotal||0)-(totalCost||0);
  const over=(budgetTotal||0)>0 && rem<0;
  return { due, rem, over,
    remLbl: over?'Over budget':'Unallocated',
    remVal: fmt(over?-rem:rem),
    remColor: over?'var(--red)':'var(--ink)' };
}

/* What's still owed — every unpaid amount, from the same per-item balance as Left to pay
   (calcBudgetBalance), so the list always adds up to the figure that opened it. Each item's
   balance is split into its known payments (unpaid deposit, unpaid instalments, sub-item
   balances) with their due dates; if that split doesn't reconcile to the item's balance —
   e.g. an item-level deposit paid against sub-items — the item falls back to one line. */
function _budgetOwedRows(){
  const rows=[];
  (STATE.budget.items||[]).forEach(b=>{
    const owed=calcBudgetBalance(b); if(owed<=0) return;
    const name=b.name||'Untitled'; const pieces=[];
    const subs=(b.subItems||[]);
    if(!subs.length){
      const dep=(!b.depositFromSubs && !b.depositPaid)?Number(b.deposit||0):0;
      if(dep>0) pieces.push({label:'Deposit',amt:Math.min(dep,owed),date:b.depositDueDate||''});
      const rest=owed-(dep>0?Math.min(dep,owed):0);
      if(rest>0) pieces.push({label:dep>0?'Balance':'Payment',amt:rest,date:b.balanceDueDate||''});
    } else {
      subs.forEach(s=>{
        if(s.paid && !s._planHolder) return;
        const sn=s.name||'Sub-item';
        const insts=(s.installments||[]).filter(i=>i&&!i.paid);
        insts.forEach((i,k)=>pieces.push({label:`${s._planHolder?'':sn+' · '}${i.label||('Instalment '+(k+1))}`,amt:Number(i.amount||0),date:i.dueDate||''}));
        if(s._planHolder) return;
        const amt=getSubItemAmount(s);
        const paidSoFar=(s.depositPaid?Number(s.deposit||0):0)+calcSubInstallmentsPaid(s);
        const unpaidInst=insts.reduce((t,i)=>t+Number(i.amount||0),0);
        let left=Math.max(0,amt-paidSoFar-unpaidInst);
        const dep=(!s.depositPaid)?Number(s.deposit||0):0;
        if(dep>0 && left>0){ const d=Math.min(dep,left); pieces.push({label:`${sn} · deposit`,amt:d,date:s.depositDueDate||''}); left-=d; }
        if(left>0) pieces.push({label:`${sn} · balance`,amt:left,date:s.balanceDueDate||''});
      });
    }
    const sum=pieces.reduce((t,p)=>t+p.amt,0);
    if(Math.abs(sum-owed)>0.005) rows.push({item:name,label:'Balance',amt:owed,date:b.balanceDueDate||''});
    else pieces.forEach(p=>rows.push(Object.assign({item:name},p)));
  });
  return rows;
}
function openOwedSummary(){
  const rows=_budgetOwedRows();
  const today=new Date(); today.setHours(0,0,0,0);
  const isOver=d=>d && new Date(d+'T00:00:00')<today;
  const dated=rows.filter(r=>r.date).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  const undated=rows.filter(r=>!r.date);
  const total=rows.reduce((t,r)=>t+r.amt,0);
  let body;
  if(!rows.length){
    body=`<div style="text-align:center;padding:28px 16px;color:var(--muted)">
      <div style="font-size:14px">Nothing left to pay.</div>
      <div style="font-size:12.5px;margin-top:6px">Everything you've committed has been paid.</div></div>`;
  } else {
    const line=r=>{ const od=isOver(r.date);
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${od?'var(--red)':'var(--gold-deep)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        <div style="flex:1;min-width:0">
          <div style="font-size:13.5px;color:var(--ink);font-weight:500">${_escHtml(r.item)}</div>
          <div style="font-size:11.5px;color:var(--muted)">${_escHtml(r.label)} &middot; ${r.date?(od?`<span style="color:var(--red);font-weight:600">Overdue &middot; was due ${fmtDate(r.date)}</span>`:`Due ${fmtDate(r.date)}`):'No due date'}</div>
        </div>
        <div style="font-size:14px;font-weight:600;color:${od?'var(--red)':'var(--gold-deep)'};font-family:'Inter',sans-serif;flex-shrink:0">${fmt(r.amt)}</div></div>`; };
    body=`<div>
      <div style="font-size:12.5px;color:var(--muted);padding:0 4px 6px">${rows.length} payment${rows.length!==1?'s':''} still owed, soonest first</div>
      ${dated.map(line).join('')}
      ${undated.length?`<div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:14px 4px 4px">No due date</div>${undated.map(line).join('')}`:''}
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 4px 2px;margin-top:2px">
        <span style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600">Total left to pay</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--gold-deep)">${fmt(total)}</span>
      </div></div>`;
  }
  openModal('Left to pay', body, `<button class="btn btn-primary" onclick="closeModalDirect()">Done</button>`);
}

function setBudgetStyle(n){
  STATE.budget.summaryStyle=n;
  const menu=document.getElementById('budget-style-menu');
  if(menu) menu.style.display='none';
  document.querySelectorAll('.budget-style-item').forEach((el,i)=>el.classList.toggle('active',i+1===n));
  const body=document.getElementById('budget-summary-body');
  if(body) body.innerHTML=_budgetShown('summary')?_budgetSummaryWithCorner():'';
  saveToStorage();
}

function toggleBudgetStyleMenu(e){
  e.stopPropagation();
  const menu=document.getElementById('budget-style-menu');
  if(!menu) return;
  const showing=menu.style.display!=='none';
  menu.style.display=showing?'none':'block';
  if(!showing){
    const close=(ev)=>{ if(!menu.contains(ev.target)){ menu.style.display='none'; document.removeEventListener('click',close); } };
    setTimeout(()=>document.addEventListener('click',close),0);
  }
}

function toggleHeroStyleMenu(e){
  e.stopPropagation();
  const menu=document.getElementById('hero-style-menu');
  if(!menu) return;
  const showing=menu.style.display!=='none';
  menu.style.display=showing?'none':'block';
  if(!showing){
    const close=(ev)=>{ if(!menu.contains(ev.target)){ menu.style.display='none'; document.removeEventListener('click',close); } };
    setTimeout(()=>document.addEventListener('click',close),0);
  }
}

function setHeroStyle(n){
  STATE.settings.heroStyle=n;
  saveToStorage();
  navigate('dashboard');
}

function toggleKpiStyleMenu(e){
  e.stopPropagation();
  const menu=document.getElementById('kpi-style-menu');
  if(!menu) return;
  const showing=menu.style.display!=='none';
  menu.style.display=showing?'none':'block';
  if(!showing){
    const close=(ev)=>{ if(!menu.contains(ev.target)){ menu.style.display='none'; document.removeEventListener('click',close); } };
    setTimeout(()=>document.addEventListener('click',close),0);
  }
}

function setKpiStyle(n){
  STATE.settings.kpiStyle=n;
  saveToStorage();
  navigate('dashboard');
}

function toggleDepositPaid(id){
  const b=STATE.budget.items.find(x=>x.id===id); if(!b)return;
  _popupOrigin=_currentPage;
  const _snap=JSON.parse(JSON.stringify(b)); // for Escape revert
  const _hadPrev=!!b.depositPaidDate;
  b.depositPaid=!b.depositPaid;
  const _finish=()=>{
    updateBudgetSummary(); navigate(_popupReturn());
    _armEscapeRevert(()=>{ Object.keys(b).forEach(k=>delete b[k]); Object.assign(b,_snap); saveToStorage(); updateBudgetSummary(); navigate(_popupReturn()); });
    _lkPaymentChanged([_findPayDepositTask(b, null)], !!b.depositPaid, b.name+' deposit', ()=>{ Object.keys(b).forEach(k=>delete b[k]); Object.assign(b,_snap); });
    _escapeRevertArm=false;
    if(document.getElementById('modal-overlay').classList.contains('hidden')) _escapeRevert=null;
  };
  if(b.depositPaid){
    b.depositPaidDate=_todayISO(); // v179: today; change it on the row if needed
  }
  _finish();
}
function updateBudgetDepositDate(id,val){
  const b=STATE.budget.items.find(x=>x.id===id); if(b){b.depositDueDate=val; saveToStorage(); navigate('budget');}
}
function updateBudgetBalancePaidDate(id,val){
  const b=STATE.budget.items.find(x=>x.id===id); if(b){b.balancePaidDate=val; saveToStorage(); navigate('budget');}
}
function updateBudgetDepositPaidDate(id,val){
  const b=STATE.budget.items.find(x=>x.id===id); if(b){b.depositPaidDate=val; saveToStorage(); navigate('budget');}
}
function updateBudgetBalanceDate(id,val){
  const b=STATE.budget.items.find(x=>x.id===id); if(b){b.balanceDueDate=val; saveToStorage(); navigate('budget');}
}
function toggleSubPerHead(pid,sid){
  if(_sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('perHead')) return;
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s)return;
  if(s.perHead){ s.perHead=false; s.guestCount=0; s.pricePerHead=0; subCalcExpanded.delete(sid); }
  else { s.perHead=true; s.perItem=false; s.itemCount=0; s.pricePerItem=0; subCalcExpanded.add(sid); }
  saveToStorage(); navigate('budget');
}
function updateSubGuestCount(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(s){
    s.guestCount=Number(val)||0;
    // Typing a count under RSVP mode marks it as an explicit override that holds;
    // clearing it (0) lets the sub track the live RSVP count again.
    if(STATE.budget.useRsvpCount){ s.guestCountOverride = (Number(val)||0)>0; }
    updateBudgetSummary(); updateSubEq(b,s);
  }
}
function updateSubPricePerHead(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(s){s.pricePerHead=Number(val)||0; updateBudgetSummary(); updateSubEq(b,s);}
}

function toggleSubDueDate(pid,sid){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s)return;
  if(s.showDueDate||s.balanceDueDate){
    s.showDueDate=false; s.balanceDueDate='';
  } else {
    s.showDueDate=true;
  }
  saveToStorage(); navigate('budget');
}

function toggleSubDepositSection(pid,sid){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s)return;
  if(s.showDeposit||s.deposit||s.depositDueDate){
    const linked=_tasksLinkedToSub(pid,sid);
    if(linked.length){
      const n=linked.length;
      openModal('Remove deposit?',
        `<div style="font-size:13px;color:var(--muted);line-height:1.55">${n>1?'<b style="color:var(--ink)">'+n+' checklist tasks are</b> linked':'A checklist task is linked'} to this deposit on <b style="color:var(--ink)">"${_esc(s.name)}"</b>. Keep the link on the sub-item, or remove it entirely?</div>`,
        `<div style="display:flex;flex-direction:column;gap:8px;width:100%">
          <button class="btn btn-primary" onclick="_confirmRemoveSubDeposit('${pid}','${sid}','keep')">Move link to sub-item</button>
          <button class="btn btn-outline" onclick="_confirmRemoveSubDeposit('${pid}','${sid}','unlink')" style="color:var(--gold-deep)">Remove link &amp; deposit</button>
          <button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
        </div>`);
      return;
    }
    _confirmRemoveSubDeposit(pid,sid,'keep');
  } else {
    s.showDeposit=true; subCalcExpanded.add(sid);
    saveToStorage(); navigate('budget');
  }
}
function _confirmRemoveSubDeposit(pid,sid,linkAction){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s)return;
  if(linkAction==='unlink'){ _tasksLinkedToSub(pid,sid).forEach(t=>{ t.budgetId=''; t.budgetSubId=''; }); }
  s.showDeposit=false; s.deposit=0; s.depositDueDate=''; s.depositPaid=false;
  if(!s.perHead && !s.perItem) subCalcExpanded.delete(sid);
  saveToStorage(); closeModalDirect(); navigate('budget');
}

function toggleSubPaid(pid,sid){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s)return;
  _popupOrigin=_currentPage;
  const _snapshot = JSON.parse(JSON.stringify(b)); // for Cancel revert
  const _hadPrevDate = !!s.paidDate; // a previous paid date is remembered
  s.paid=!s.paid;
  // This is a manual toggle — remember it so unticking the category Balance reverts here
  s.manualPaid=s.paid;
  // Cascade to this sub-item's installment plan: ticking the sub-item marks every
  // installment paid; unticking clears them. Stamps/clears each paid date.
  if(s.installments && s.installments.length){
    s.installments.forEach(inst=>{
      if(!inst) return;
      inst.paid=s.paid;
      inst.paidDate = s.paid ? (inst.paidDate||_todayISO()) : '';
      // A full cascade also clears any per-installment manual-untick override so the
      // plan reflects the explicit whole-plan action.
      if(inst._userUnchecked) delete inst._userUnchecked;
    });
  }
  // Auto-check the sub-item's deposit when the sub-item is checked (never auto-uncheck)
  const _subHasDeposit = s.showDeposit || Number(s.deposit||0)>0 || s.depositDueDate;
  if(s.paid && _subHasDeposit && !s.depositPaid){
    s.depositPaid=true; if(!s.depositPaidDate) s.depositPaidDate=_todayISO();
  }
  // Continuation that runs after any date prompt is resolved
  const _finish=()=>{
    if(b.subItems && b.subItems.length){
      const amountBearing = b.subItems.filter(x=>getSubItemAmount(x)>0);
      const balanceZero = amountBearing.length>0 && amountBearing.every(x=>x.paid);
      const wasPaid = b.paid;
      if(balanceZero){
        b.subItems.forEach(x=>{ x.paid=true; _stampSubPaidDate(x); });
        b.paid=true; _stampItemPaidDate(b);
      } else {
        b.paid=false;
      }
      if(b.paid!==wasPaid && b.checklistId){
        const c=STATE.checklist.find(x=>x.id===b.checklistId); if(c)c.done=b.paid;
      }
    }
    updateBudgetSummary(); navigate(_popupReturn());
    const _st=STATE.checklist.find(ci=>ci.budgetId===b.id&&ci.budgetSubId===s.id);
    // Sub-item marked paid with nothing linked? Offer to link a matching task first.
    const _dateCtx = (s.paid) ? {
      prevDate: _hadPrevDate ? _snapshot.subItems.find(x=>x.id===sid)?.paidDate||'' : '',
      applyDate:(iso)=>{ s.paidDate=iso; },
      revert:()=>{ Object.keys(b).forEach(k=>{ delete b[k]; }); Object.assign(b, _snapshot); },
      previewB:b, previewS:s, previewKind:''
    } : null;
    const _revertCtx = (!s.paid) ? {
      revert:()=>{ Object.keys(b).forEach(k=>{ delete b[k]; }); Object.assign(b, _snapshot); }
    } : null;
    _askTaskDoneBatch(_st?[_st]:[], s.paid, `${b.name} › ${s.name}`, _dateCtx, _revertCtx);
  };
  _pendingInvoicePrompt = s.paid ? {bid:b.id, sid:s.id} : null;
  if(s.paid){
    if(!s.paidDate) _stampSubPaidDate(s);
  }
  _finish();
}
function toggleSubDepositPaid(pid,sid){
  const b=STATE.budget.items.find(x=>x.id===pid); const s=b?.subItems?.find(x=>x.id===sid);
  if(!s) return;
  _popupOrigin=_currentPage;
  const _snap=JSON.parse(JSON.stringify(s)); // for Escape revert
  const _hadPrev=!!s.depositPaidDate;
  s.depositPaid=!s.depositPaid;
  const _finish=()=>{
    updateBudgetSummary(); navigate(_popupReturn());
    _armEscapeRevert(()=>{ Object.keys(s).forEach(k=>delete s[k]); Object.assign(s,_snap); saveToStorage(); updateBudgetSummary(); navigate(_popupReturn()); });
    _lkPaymentChanged([_findPayDepositTask(b, s)], !!s.depositPaid, `${b.name} › ${s.name} deposit`, ()=>{ Object.keys(s).forEach(k=>delete s[k]); Object.assign(s,_snap); });
    _escapeRevertArm=false;
    if(document.getElementById('modal-overlay').classList.contains('hidden')) _escapeRevert=null;
  };
  if(s.depositPaid){
    s.depositPaidDate=_todayISO(); // v179: today; change it on the row if needed
  }
  _finish();
}
// Tap an installment (in the expanded sub-item list) to mark it paid/unpaid. Stamps
// today's date when paying; recalculates so Paid/Owing and the summary update live.
function toggleSubInstallmentPaid(pid, sid, idx){
  const b=STATE.budget.items.find(x=>x.id===pid); const s=b?.subItems?.find(x=>x.id===sid);
  if(!s || !s.installments || !s.installments[idx]) return;
  const inst=s.installments[idx];
  inst.paid=!inst.paid;
  inst.paidDate = inst.paid ? _todayISO() : '';
  // If the user unticks a PAST-DUE installment, remember it so auto-check won't re-tick
  // it. Re-ticking (or ticking a not-yet-due one) clears the override.
  if(!inst.paid && inst.dueDate && inst.dueDate <= _todayISO()){ inst._userUnchecked=true; }
  else { if(inst._userUnchecked) delete inst._userUnchecked; }
  // All installments paid → tick the sub-item (and roll up); any unpaid → untick it.
  _reconcileSubFromInstallments(b, s);
  saveToStorage();
  updateBudgetSummary();
  navigate('budget');
}
// After any installment change, reconcile the parent sub-item's paid state: if every
// installment is paid, the sub-item is paid; if any is unpaid, it isn't. Then roll the
// result up to the Payment (all amount-bearing subs paid → item paid). Mirrors the
// cascade logic in toggleSubPaid so both directions stay consistent.
function _reconcileSubFromInstallments(b, s){
  if(!s || !s.installments || !s.installments.length) return;
  const allPaid = s.installments.every(i=>i && i.paid);
  s.paid = allPaid;
  s.manualPaid = allPaid;
  if(allPaid){ if(!s.paidDate) _stampSubPaidDate(s); }
  else { /* leave paidDate; row shows unpaid via s.paid=false */ }
  // Roll up to the item.
  if(b.subItems && b.subItems.length){
    const amountBearing = b.subItems.filter(x=>getSubItemAmount(x)>0);
    const balanceZero = amountBearing.length>0 && amountBearing.every(x=>x.paid);
    const wasPaid = b.paid;
    if(balanceZero){ b.subItems.forEach(x=>{ x.paid=true; _stampSubPaidDate(x); }); b.paid=true; _stampItemPaidDate(b); }
    else { b.paid=false; }
    if(b.paid!==wasPaid && b.checklistId){ const c=STATE.checklist.find(x=>x.id===b.checklistId); if(c) c.done=b.paid; }
  }
}
function updateSubDeposit(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid); const s=b?.subItems?.find(x=>x.id===sid);
  if(s){s.deposit=Number(val)||0; updateBudgetSummary();}
}
function updateSubDepositDate(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid); const s=b?.subItems?.find(x=>x.id===sid);
  if(s){s.depositDueDate=val; saveToStorage(); navigate('budget');}
}
function updateSubBalancePaidDate(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid); const s=b?.subItems?.find(x=>x.id===sid);
  if(s){s.paidDate=val; saveToStorage(); navigate('budget');}
}
function updateSubDepositPaidDate(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid); const s=b?.subItems?.find(x=>x.id===sid);
  if(s){s.depositPaidDate=val; saveToStorage(); navigate('budget');}
}
function updateSubBalanceDate(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid); const s=b?.subItems?.find(x=>x.id===sid);
  if(s){s.balanceDueDate=val; saveToStorage(); navigate('budget');}
}
function toggleBudgetSubs(id){
  const b=STATE.budget.items.find(x=>x.id===id); if(b)b.expanded=!b.expanded; saveToStorage(); navigate('budget');
}
// Header chevron: collapse/expand the whole category body (Remaining Balance, deposit,
// sub-items, Add). Separate from the inner sub-items toggle (b.expanded).
function toggleBudgetCollapsed(id){
  const b=STATE.budget.items.find(x=>x.id===id); if(b)b.collapsed=!b.collapsed; saveToStorage(); navigate('budget');
}

function focusBudgetAlert(itemId, subId, kind){
  const b=STATE.budget.items.find(x=>x.id===itemId); if(!b) return;
  const s=subId?(b.subItems||[]).find(x=>x.id===subId):null;

  // ⚠️ THIS USED TO REDIRECT TO THE LINKED CHECKLIST TASK.
  //
  //     const task = s ? _subLinkedTask(b, s) : _itemLinkedTask(b);
  //     if(task){ _focusChecklistTaskLink(task.id); return; }
  //
  // It was deliberate — the comment said "prefer routing to the linked checklist task" —
  // and it was wrong. A banner that sits ON THE BUDGET PAGE and says "balance overdue"
  // must take you to that balance. Mandy clicked one and landed on a COMPLETED checklist
  // task with the payment nowhere in sight.
  //
  // The reasoning behind the redirect was presumably that the task is where you would act.
  // But it made the two alert banners do the SAME THING — both went to the checklist —
  // and it meant the destination of a click depended on a link the user could not see from
  // the banner. The budget row already shows its task link, so the connection is one click
  // away from where you land; it is not lost.
  //
  // The code below was ALREADY CORRECT. It simply never ran when a task was linked.

  if(subId){
    // Sub-item: expand the parent item, reveal sub-items, and open this sub-item's detail (deposit) view
    b.expanded=true;
    if(s){
      if(kind==='deposit' && !(s.showDeposit||s.deposit||s.depositDueDate)) s.showDeposit=true;
      try{ subCalcExpanded.add(subId); }catch(e){}
    }
  } else {
    // Item-level: just expand the item so its payment rows are visible
    b.expanded=true;
  }
  saveToStorage();
  navigate('budget');
  // Scroll to the target after the view re-renders. When a sub-item is the
  // target, flash the sub-item row itself; otherwise flash the item.
  setTimeout(()=>{
    const el = subId ? document.getElementById('bsub-'+subId) : document.getElementById('bi-'+itemId);
    if(el){
      el.scrollIntoView({behavior:'smooth',block:'center'});
      _flashHighlight(el);
    } else {
      const fb=document.getElementById('bi-'+itemId);
      if(fb){ fb.scrollIntoView({behavior:'smooth',block:'center'}); _flashHighlight(fb); }
    }
  }, 80);
}
// Navigate to the checklist, ensure the task's details (which hold the budget
// link) are expanded, scroll to it, and flash the LINK badge specifically.
// _focusChecklistTaskLink() WAS HERE AND IS DELETED. Its only caller was the payment-alert
// redirect above — the bug. A function with no callers is not harmless: it is a loaded gun
// for the next person who greps for "focus" and finds something that looks like it belongs.
// focusChecklistTask() is the live one, called by the TASK alerts, and it is the right one.
// Pulse a gold outline on an element 3 times.
function _flashHighlight(el){
  if(!el) return;
  const prev=el.style.boxShadow;
  el.style.transition='box-shadow .22s';
  const on='0 0 0 2px var(--gold)', off=prev||'none';
  let n=0;
  const pulse=()=>{
    el.style.boxShadow=on;
    setTimeout(()=>{
      el.style.boxShadow=off;
      n++;
      if(n<4) setTimeout(pulse, 240);
      else setTimeout(()=>{ el.style.boxShadow=prev; }, 260);
    }, 380);
  };
  pulse();
}
// Red flash + focus for a required field that was left blank.
function _flashError(el){
  if(!el) return;
  el.focus();
  const prevShadow=el.style.boxShadow, prevBorder=el.style.borderColor;
  el.style.transition='box-shadow .15s,border-color .15s';
  let n=0;
  const pulse=()=>{
    el.style.boxShadow='0 0 0 2px var(--red)';
    el.style.borderColor='var(--red)';
    setTimeout(()=>{
      el.style.boxShadow=prevShadow; el.style.borderColor=prevBorder;
      n++;
      if(n<3) setTimeout(pulse, 170);
    }, 200);
  };
  pulse();
}
let budgetReorderMode = false;
let dragBudgetId = null;
let dragSubInfo = null;
const reorderingSubsFor = new Set();
const subCalcExpanded = new Set();
const subAmountEditing = new Set();
const subDepEditing = new Set();

function toggleBudgetReorder(){
  budgetReorderMode=!budgetReorderMode;
  navigate('budget');
}
// ── Budget total lock ────────────────────────────────────────────────────────
// Locked = read-only amount field. Default: unlocked only when no amount is set
// yet; otherwise the remembered state. Persisted on STATE.settings.budgetAmountLocked.
function _budgetAmountLocked(){
  if(!STATE.settings) STATE.settings={};
  const set = STATE.settings.budgetAmountLocked;
  if(set===undefined){
    // No remembered state: lock only if an amount already exists.
    return !!(STATE.budget && Number(STATE.budget.total)>0);
  }
  return !!set;
}
function toggleBudgetAmountLock(){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.budgetAmountLocked = !_budgetAmountLocked();
  saveToStorage();
  const inp=document.querySelector('.budget-total-input');
  const wasUnlocked=!STATE.settings.budgetAmountLocked;
  navigate('budget');
  // After re-render, focus the field if we just unlocked it.
  if(wasUnlocked) setTimeout(()=>{ const el=document.querySelector('.budget-total-input'); if(el){ el.focus(); el.select&&el.select(); } },0);
}
function _budgetLockBtnHtml(){
  const locked=_budgetAmountLocked();
  const lockedSvg='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  const openSvg='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
  return `<button type="button" class="budget-lock-btn${locked?'':' open'}" onclick="toggleBudgetAmountLock()" title="${locked?'Amount locked — tap to edit':'Amount unlocked — tap to lock'}" aria-label="${locked?'Unlock budget amount for editing':'Lock budget amount'}" aria-pressed="${locked?'false':'true'}">${locked?lockedSvg:openSvg}</button>`;
}
function toggleBudgetPanel(){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.budgetPanelCollapsed=!STATE.settings.budgetPanelCollapsed;
  saveToStorage();
  navigate('budget');
}
// Budget show/hide visibility flags (default shown). Stored on STATE.settings.budgetHide map.
function _budgetHideMap(){ if(!STATE.settings) STATE.settings={}; if(!STATE.settings.budgetHide) STATE.settings.budgetHide={}; return STATE.settings.budgetHide; }
function _budgetShown(key){ return !_budgetHideMap()[key]; }
const _BUDGET_HIDE_SECTIONS=[
  {key:'summary', label:'Budget Summary', group:'top'},
  {key:'catIcon', label:'Category Icon', group:'top'},
  {key:'pctLabel', label:'Show % of total label', group:'top'},
  {key:'balDate', label:"Remaining Balance", group:'Dates'},
  {key:'depDate', label:"Deposits", group:'Dates'},
  {key:'subDate', label:"Sub-item", group:'Dates'}
];
function toggleBudgetHide(key){
  const m=_budgetHideMap();
  if(m[key]) delete m[key]; else m[key]=true;
  saveToStorage(); navigate('budget');
  // The menu re-renders already-open (display set from _budgetOptionsMenuOpen), so
  // there's no hidden-gap flash; just re-arm the outside-click closer.
  if(_budgetOptionsMenuOpen) _budgetAttachOptionsCloser();
}
function setAllBudgetHide(show){
  const m=_budgetHideMap();
  _BUDGET_HIDE_SECTIONS.forEach(s=>{ if(show) delete m[s.key]; else m[s.key]=true; });
  saveToStorage(); navigate('budget');
  if(_budgetOptionsMenuOpen) _budgetAttachOptionsCloser();
}
function _budgetOptionsReset(){ setAllBudgetHide(true); _budgetSetTextSize('standard'); }
// ── Budget page text size ───────────────────────────────────────────────
// Stored key in STATE.settings.budgetTextSize; default 'standard'. The cog menu
// offers viewport-appropriate options (mobile can only shrink; desktop can also
// enlarge), but the saved value is remembered regardless of viewport. The applied
// zoom is clamped so a value chosen on one device can't blow out the other:
// mobile never enlarges past Standard; desktop never shrinks past Small.
const _BUDGET_TEXT_SIZES={ xsmall:0.78, small:0.88, standard:1, large:1.12, xlarge:1.24 };
function _budgetTextSize(){
  const v=STATE.settings&&STATE.settings.budgetTextSize;
  return (v&&_BUDGET_TEXT_SIZES[v]!==undefined)?v:'standard';
}
function _budgetIsMobile(){ return window.innerWidth<=900; }
// The size keys offered in the menu, per viewport (mobile shrink-only, desktop adds larger).
function _budgetTextSizeOptions(){
  return _budgetIsMobile()
    ? [['xsmall','X Small'],['small','Small'],['standard','Standard']]
    : [['small','Small'],['standard','Standard'],['large','Large'],['xlarge','X Large']];
}
// Resolve the zoom actually applied, clamped to the current viewport's safe range.
function _budgetTextZoom(){
  let z=_BUDGET_TEXT_SIZES[_budgetTextSize()]||1;
  if(_budgetIsMobile()) z=Math.min(z,1);        // never enlarge on mobile
  else z=Math.max(z,_BUDGET_TEXT_SIZES.small);   // never shrink past Small on desktop
  return z;
}
function _applyBudgetTextSize(){
  const c=document.getElementById('main-content');
  if(!c || c.getAttribute('data-page')!=='budget'){ return; }
  c.style.setProperty('--budget-zoom', String(_budgetTextZoom()));
}
function _budgetSetTextSize(v){
  if(_BUDGET_TEXT_SIZES[v]===undefined) v='standard';
  if(!STATE.settings) STATE.settings={};
  STATE.settings.budgetTextSize=v;
  saveToStorage();
  _applyBudgetTextSize();
  // Rebuild the segment so the active pill updates, keeping the menu open.
  const wrap=document.getElementById('budget-textsize-seg');
  if(wrap) wrap.innerHTML=_budgetTextSizeSegInner();
  if(_budgetOptionsMenuOpen) _budgetAttachOptionsCloser();
}
function _budgetTextSizeSegInner(){
  const cur=_budgetTextSize();
  return _budgetTextSizeOptions().map(([key,label])=>
    `<button type="button" onclick="event.stopPropagation();_budgetSetTextSize('${key}')" class="bphd-seg ${cur===key?'on':'off'}">${label}</button>`
  ).join('');
}
// Reusable info icon for the Budget cog menu: shows its text on tap (and hover),
// using the app's global label-tip popover. Works on touch (the old native-title
// "i" showed nothing on mobile).
function _budgetInfoTip(text){
  const t=_escAttr(text);
  return `<button type="button" class="lbl-tip" aria-label="${t}" title="${t}" data-tip="${t}" onclick="_lblToggleTip(event,this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>`;
}
function _budgetCheckRow(s){
  const shown=_budgetShown(s.key);
  return `<label onclick="event.stopPropagation()" style="display:flex;align-items:center;justify-content:space-between;gap:9px;font-size:12.5px;color:${shown?'var(--ink)':'var(--muted)'};padding:6px 2px;cursor:pointer">
    <span>${s.label}</span>
    ${_toggleSwitch(shown, `toggleBudgetHide('${s.key}')`)}
  </label>`;
}
function _budgetOptionsMenuHtml(){
  const heading=g=>`<div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep);margin:9px 0 2px">${g}</div>`;
  const top=_BUDGET_HIDE_SECTIONS.filter(s=>s.group==='top');
  const prompts=_BUDGET_HIDE_SECTIONS.filter(s=>s.group==='Pop ups & Prompts');
  const dates=_BUDGET_HIDE_SECTIONS.filter(s=>s.group==='Dates');
  const useRsvp=STATE.budget.useRsvpCount||false;
  const rsvpCount=_rsvpPerHeadCount();
  const _phbd=_rsvpPerHeadBreakdown();
  const exChild=_perHeadExcludesChildren();
  const segBtn=(on,label,onclick,id)=>`<button type="button" ${id?`id="${id}"`:''} onclick="${onclick}" class="bphd-seg ${on?'on':'off'}">${label}</button>`;
  const _excludeRow = useRsvp ? `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px">
      <label class="form-label" style="margin:0;font-size:12px;color:var(--ink)">Exclude children from per-head</label>
      <button type="button" role="switch" aria-checked="${exChild}" aria-label="Exclude children from per-head count" onclick="_toggleExcludeChildrenPerHead()"
        style="width:32px;height:18px;border-radius:9px;border:none;padding:0;cursor:pointer;position:relative;flex-shrink:0;background:${exChild?'var(--gold)':'var(--border)'};transition:background .2s">
        <span style="position:absolute;width:13px;height:13px;border-radius:50%;background:#fff;top:2.5px;left:${exChild?'16px':'2.5px'};transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
      </button>
    </div>
    <div style="font-size:10.5px;color:var(--muted);margin-top:6px;line-height:1.5">Infants are always excluded.${(_phbd.children||_phbd.infants)?` ${_phbd.attending} attending &rarr; <strong style="color:var(--gold-deep)">${_phbd.counted} counted</strong>${_phbd.children?` (&minus;${_phbd.children} child${_phbd.children!==1?'ren':''}${exChild?'':', kept'}`:''}${_phbd.infants?`${_phbd.children?', ':' ('}&minus;${_phbd.infants} infant${_phbd.infants!==1?'s':''}`:''}${(_phbd.children||_phbd.infants)?')':''}.`:` No children or infants currently attending.`}</div>` : '';
  const perHead=`<div style="display:flex;align-items:center;gap:5px;margin:0 0 6px">
      <div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep)">Per-head count</div>
      ${_budgetInfoTip('Per-head sub-items use a custom count, or your RSVP attending count.')}
    </div>
    <span id="bphd-seg-wrap" style="display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden">
      ${segBtn(!useRsvp,'Custom',"setBudgetGuestModeInPopup(false)",'bphd-custom')}
      ${segBtn(useRsvp,`RSVP (${rsvpCount})`,"setBudgetGuestModeInPopup(true)",'bphd-rsvp')}
    </span>${_excludeRow}
    <div style="height:1px;background:var(--border);margin:12px 0 8px"></div>`;
  return `<div id="budget-options-menu" style="display:${_budgetOptionsMenuOpen?'block':'none'};position:absolute;top:calc(100% + 6px);right:0;z-index:60;width:268px;background:var(--cream);border:1px solid var(--border);border-radius:11px;box-shadow:0 4px 24px rgba(26,26,24,.12);padding:13px 15px;text-align:left">
    <button type="button" onclick="_budgetDisplayOptionsFromMenu()" class="bg-menu-action" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:var(--ink);font-size:12.5px;font-weight:600;cursor:pointer;padding:7px 4px;text-align:left;font-family:inherit;border-radius:6px">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      Display options
    </button>
    <button type="button" onclick="_budgetReorderFromMenu()" class="bg-menu-action" style="display:flex;align-items:center;gap:8px;width:100%;background:${budgetReorderMode?'var(--surface)':'none'};border:none;color:${budgetReorderMode?'var(--gold-deep)':'var(--ink)'};font-size:12.5px;font-weight:600;cursor:pointer;padding:7px 4px;text-align:left;font-family:inherit;border-radius:6px">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="7 4 7 20"/><polyline points="4 7 7 4 10 7"/><polyline points="17 20 17 4"/><polyline points="14 17 17 20 20 17"/></svg>
      ${budgetReorderMode?'Done reordering':'Reorder payment categories'}
    </button>
    <div style="height:1px;background:var(--border);margin:11px 0 9px"></div>
    <div style="display:flex;align-items:center;gap:5px;margin:0 0 6px">
      <div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep)">Text size</div>
      ${_budgetInfoTip('Adjusts text size on the Budget page so more (or less) fits on screen.')}
    </div>
    <span id="budget-textsize-seg" style="display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden;width:100%">${_budgetTextSizeSegInner()}</span>
    <div style="height:1px;background:var(--border);margin:11px 0 9px"></div>
    ${perHead}
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
      <div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep)">Show items</div>
      <button onclick="_budgetOptionsReset()" style="background:none;border:none;color:var(--gold-deep);cursor:pointer;font-size:10px;text-decoration:underline;font-family:inherit;padding:0">Reset</button>
    </div>
    ${top.map(_budgetCheckRow).join('')}
    ${prompts.length?heading('Pop ups & Prompts')+prompts.map(_budgetCheckRow).join(''):''}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:11px 0 4px">
      <div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep)">Dates</div>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep)">Paid
        ${_budgetInfoTip("Display \u2018Paid on\u2019 date")}
      </span>
    </div>
    ${dates.map(_budgetCheckRow).join('')}
    <div style="height:1px;background:var(--border);margin:11px 0 9px"></div>
    <button type="button" onclick="_budgetGoToSettings()" class="bg-menu-action" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:var(--gold-deep);font-size:12.5px;font-weight:600;cursor:pointer;padding:7px 4px;text-align:left;font-family:inherit;border-radius:6px">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      <span style="flex:1">Go to other settings</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    </button>
  </div>`;
}
function _budgetAttachOptionsCloser(){
  const close=(ev)=>{
    const menu=document.getElementById('budget-options-menu');
    const wrap=document.getElementById('budget-options-wrap');
    if(menu && wrap && !wrap.contains(ev.target)){ menu.style.display='none'; _budgetOptionsMenuOpen=false; document.removeEventListener('click',close); }
  };
  setTimeout(()=>document.addEventListener('click',close),0);
}
function openBudgetHidePopup(e){
  // Now a cog-style popover toggled in place (was a modal).
  if(e) e.stopPropagation();
  closeBudgetReportsMenu(); // mutual exclusion
  const m=document.getElementById('budget-options-menu');
  if(!m) return;
  const showing=m.style.display!=='none' && m.style.display!=='';
  m.style.display=showing?'none':'block';
  _budgetOptionsMenuOpen=!showing;
  if(!showing) _budgetAttachOptionsCloser();
}
function _budgetReopenOptionsMenu(){ const m=document.getElementById('budget-options-menu'); if(m){ m.style.display='block'; _budgetOptionsMenuOpen=true; _budgetAttachOptionsCloser(); } }
// Reorder toggled from the cog menu: close the menu, then flip reorder mode.
function _budgetReorderFromMenu(){
  const m=document.getElementById('budget-options-menu'); if(m) m.style.display='none';
  _budgetOptionsMenuOpen=false;
  toggleBudgetReorder();
}
// Display options opened from the cog menu: close the menu, then open the popup.
function _budgetDisplayOptionsFromMenu(){
  const m=document.getElementById('budget-options-menu'); if(m) m.style.display='none';
  _budgetOptionsMenuOpen=false;
  openDisplayOptions();
}
// "Go to other settings →" from the cog menu: close the menu, open Settings in the
// By-page view, and scroll to the Budget page group so the user lands on the budget heading.
function _budgetGoToSettings(){
  const m=document.getElementById('budget-options-menu'); if(m) m.style.display='none';
  _budgetOptionsMenuOpen=false;
  if(!STATE.settings) STATE.settings={};
  STATE.settings.settingsView='page'; // ensure the By-page grouping is active
  saveToStorage();
  navigate('settings');
  // The settings view + page groups are built in a post-render setTimeout(...,0); scroll
  // after that so the Budget group exists. A couple of rAFs give layout time to settle.
  setTimeout(()=>{
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const grp=document.querySelector('.settings-page-group[data-page-group="budget"]');
      const sc=document.getElementById('main-content');
      if(grp && sc){
        const top = grp.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 8;
        sc.scrollTo({top, behavior:'smooth'});
        // brief highlight so the section is easy to spot
        grp.style.transition='background .3s'; const _bg=grp.style.background;
        grp.style.background='rgba(196,168,130,.14)';
        setTimeout(()=>{ grp.style.background=_bg||''; }, 1100);
      } else if(grp){ grp.scrollIntoView({behavior:'smooth',block:'start'}); }
    }));
  }, 60);
}
// Per-head toggle inside the popup: update state and the segment without closing.
function setBudgetGuestModeInPopup(useRsvp){
  STATE.budget.useRsvpCount=useRsvp;
  saveToStorage();
  _budgetRerenderOptionsMenu();
  navigate('budget');
  setTimeout(()=>_budgetReopenOptionsMenu(),0);
}
// Rebuild the options-menu DOM in place (keeps it open) so conditional rows —
// e.g. the "Exclude children" toggle, which only shows under RSVP mode — and
// the live breakdown line refresh after a change.
function _budgetRerenderOptionsMenu(){
  const old=document.getElementById('budget-options-menu');
  if(!old) return;
  const tmp=document.createElement('div');
  tmp.innerHTML=_budgetOptionsMenuHtml().trim();
  const fresh=tmp.firstChild;
  if(fresh && old.parentNode){ old.parentNode.replaceChild(fresh, old); }
}
// Toggle "Exclude children from per-head". Infants are always excluded; this
// controls children only, and only affects the count when RSVP mode is on.
function _toggleExcludeChildrenPerHead(){
  if(!STATE.budget) STATE.budget={};
  STATE.budget.excludeChildrenPerHead=!STATE.budget.excludeChildrenPerHead;
  saveToStorage();
  _budgetRerenderOptionsMenu();
  navigate('budget');
  setTimeout(()=>_budgetReopenOptionsMenu(),0);
}
function setBudgetGuestMode(useRsvp){
  STATE.budget.useRsvpCount=useRsvp;
  saveToStorage();
  navigate('budget');
}

// ── Budget category drag-and-drop ──
function budgetItemDragStart(e,id){
  dragBudgetId=id;
  e.dataTransfer.effectAllowed='move';
  setTimeout(()=>{const el=document.querySelector('[data-bid="'+id+'"]');if(el)el.style.opacity='.4';},0);
}
function budgetItemDragOver(e,id){
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  _dragAutoScroll(e);
  if(id===dragBudgetId)return;
  document.querySelectorAll('.budget-drag-wrap').forEach(el=>el.style.background='');
  const el=document.querySelector('[data-bid="'+id+'"]');
  if(el)el.style.background='rgba(196,168,130,.08)';
}
function budgetItemDragLeave(e,id){
  const el=document.querySelector('[data-bid="'+id+'"]');
  if(el)el.style.background='';
}
function budgetItemDrop(e,targetId){
  e.preventDefault();
  _dragStopAutoScroll();
  if(!dragBudgetId||dragBudgetId===targetId)return;
  const fi=STATE.budget.items.findIndex(x=>x.id===dragBudgetId);
  const ti=STATE.budget.items.findIndex(x=>x.id===targetId);
  if(fi<0||ti<0)return;
  const[moved]=STATE.budget.items.splice(fi,1);
  STATE.budget.items.splice(ti,0,moved);
  dragBudgetId=null; saveToStorage(); navigate('budget');
}
// Budget category reorder auto-scroll is handled by the shared _dragAutoScroll /
// _dragStopAutoScroll helpers below (the same path sub-items, vendors and tables use),
// which clamp the trigger zone to the viewport so the bottom edge stays reachable.
function budgetItemDragEnd(e,id){
  _dragStopAutoScroll();
  const el=document.querySelector('[data-bid="'+id+'"]');
  if(el) el.style.opacity='';
  document.querySelectorAll('.budget-drag-wrap').forEach(w=>w.style.background='');
}

// ── Shared drag auto-scroll ──────────────────────────────────────────────────
// One helper any drag-over handler can call to scroll the page while a drag hovers
// near the top/bottom edge, so off-screen drop targets stay reachable. Auto-detects
// whichever pane actually scrolls (.content, #main-content) and falls back to the
// window. Call _dragAutoScroll(event) on dragover and _dragStopAutoScroll() on
// drop/dragend. Safe to call repeatedly; idempotent RAF.
let _dragScrollRaf=null;
function _dragScrollerEl(){
  const cands=[document.querySelector('.content'), document.getElementById('main-content')];
  for(const el of cands){ if(el && el.scrollHeight>el.clientHeight+4) return el; }
  return null; // window fallback
}
function _dragAutoScroll(e){
  const zone=90, speed=14;
  const scroller=_dragScrollerEl();
  let top, bottom;
  if(scroller){ const r=scroller.getBoundingClientRect(); top=Math.max(r.top,0); bottom=Math.min(r.bottom, window.innerHeight||document.documentElement.clientHeight); }
  else { top=0; bottom=window.innerHeight||document.documentElement.clientHeight; }
  const y=e.clientY;
  const distTop=y-top, distBot=bottom-y;
  if(_dragScrollRaf) cancelAnimationFrame(_dragScrollRaf);
  const by=(dy)=>{ if(scroller) scroller.scrollTop+=dy; else window.scrollBy(0,dy); };
  if(distTop<zone && distTop>0){
    const step=()=>{ by(-speed*(1-(distTop/zone))); _dragScrollRaf=requestAnimationFrame(step); };
    _dragScrollRaf=requestAnimationFrame(step);
  } else if(distBot<zone && distBot>0){
    const step=()=>{ by(speed*(1-(distBot/zone))); _dragScrollRaf=requestAnimationFrame(step); };
    _dragScrollRaf=requestAnimationFrame(step);
  }
}
function _dragStopAutoScroll(){ if(_dragScrollRaf){ cancelAnimationFrame(_dragScrollRaf); _dragScrollRaf=null; } }
// Safety net: any drag ending anywhere (including released over empty space with no
// drop handler) halts the shared auto-scroll so it can't run on after the drag.
document.addEventListener('dragend', _dragStopAutoScroll, true);
document.addEventListener('drop', _dragStopAutoScroll, true);

// ── Sub-item drag-and-drop ──
function subItemDragStart(e,pid,sid){
  dragSubInfo={pid,sid};
  e.dataTransfer.effectAllowed='move';
  e.stopPropagation();
  setTimeout(()=>{const el=document.querySelector('[data-sid="'+sid+'"]');if(el)el.style.opacity='.4';},0);
}
function subItemDragOver(e,pid,sid){
  e.preventDefault(); e.stopPropagation();
  e.dataTransfer.dropEffect='move';
  _dragAutoScroll(e);
  if(dragSubInfo&&dragSubInfo.sid===sid)return;
  document.querySelectorAll('[data-sid]').forEach(el=>el.style.background='');
  const el=document.querySelector('[data-sid="'+sid+'"]');
  if(el)el.style.background='rgba(196,168,130,.08)';
}
function subItemDragLeave(e,pid,sid){
  e.stopPropagation();
  const el=document.querySelector('[data-sid="'+sid+'"]');
  if(el)el.style.background='';
}
function subItemDrop(e,pid,sid){
  e.preventDefault(); e.stopPropagation();
  _dragStopAutoScroll();
  if(!dragSubInfo||dragSubInfo.sid===sid||dragSubInfo.pid!==pid)return;
  const b=STATE.budget.items.find(x=>x.id===pid);
  if(!b||!b.subItems)return;
  const fi=b.subItems.findIndex(x=>x.id===dragSubInfo.sid);
  const ti=b.subItems.findIndex(x=>x.id===sid);
  if(fi<0||ti<0)return;
  const[moved]=b.subItems.splice(fi,1);
  b.subItems.splice(ti,0,moved);
  dragSubInfo=null; saveToStorage(); navigate('budget');
}

function getSubItemAmount(s){
  let base;
  if(s.perHead){
    let count;
    if(s.guestCountOverride){
      count = Number(s.guestCount||0);
    } else if(STATE.budget.useRsvpCount){
      count = _rsvpPerHeadCount();
    } else {
      count = Number(s.guestCount||0);
    }
    base = count * Number(s.pricePerHead||0);
  } else if(s.perItem){
    base = Number(s.itemCount||0) * Number(s.pricePerItem||0);
  } else {
    base = Number(s.amount||0);
  }
  // Apply discount (% or $), whichever is set. % wins if both somehow coexist.
  if(Number(s.discountPct||0)>0){
    base = base * (1 - Math.min(Number(s.discountPct),100) / 100);
  } else if(Number(s.discountAmt||0)>0){
    base = Math.max(0, base - Number(s.discountAmt));
  }
  return base;
}

// Remaining balance on a sub-item: full amount minus any paid deposit.
function _subItemBalance(s){
  const total=getSubItemAmount(s);
  if(s.paid) return 0;
  const depositPaid=s.depositPaid?Number(s.deposit||0):0;
  return Math.max(0, total - depositPaid);
}

function toggleSubPerItem(pid,sid){
  if(_sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('perItem')) return;
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s)return;
  // Only one calc mode at a time
  if(s.perItem){ s.perItem=false; s.itemCount=0; s.pricePerItem=0; subCalcExpanded.delete(sid); }
  else { s.perItem=true; s.perHead=false; s.guestCount=0; s.pricePerHead=0; subCalcExpanded.add(sid); }
  saveToStorage(); navigate('budget');
}
function toggleSubDiscount(pid,sid){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s)return;
  const hasDisc=Number(s.discountPct||0)>0||Number(s.discountAmt||0)>0||s.discountOpen;
  if(hasDisc){ s.discountPct=0; s.discountAmt=0; s.discountOpen=false; }
  else { s.discountOpen=true; subCalcExpanded.add(sid); }
  saveToStorage(); navigate('budget');
}
function updateSubDiscountPct(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s)return;
  s.discountPct=Number(val)||0;
  if(s.discountPct>0){ s.discountAmt=0; s.discountOpen=false; }
  applyAutoFromSubs(b); updateBudgetSummary(); saveToStorage();
  // Live-update equation and badge without full re-render
  const eq=document.getElementById('sub-disc-eq-'+sid);
  if(eq){
    const base=(()=>{if(s.perHead){const c=(STATE.budget.useRsvpCount&&!s.guestCountOverride)?_rsvpPerHeadCount():Number(s.guestCount||0);return c*Number(s.pricePerHead||0);}if(s.perItem){return Number(s.itemCount||0)*Number(s.pricePerItem||0);}return Number(s.amount||0);})();
    const sAmt=getSubItemAmount(s);
    eq.innerHTML=s.discountPct>0?`${fmt(base)} &minus; ${s.discountPct}% = <strong style="color:var(--gold-deep)">${fmt(sAmt)}</strong>`:'';
  }
  const pctInp=document.getElementById('sub-disc-pct-'+sid); const amtInp=document.getElementById('sub-disc-amt-'+sid);
  if(s.discountPct>0 && amtInp) amtInp.value='';
}
function updateSubDiscountAmt(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s)return;
  s.discountAmt=Number(val)||0;
  if(s.discountAmt>0){ s.discountPct=0; s.discountOpen=false; }
  applyAutoFromSubs(b); updateBudgetSummary(); saveToStorage();
  const eq=document.getElementById('sub-disc-eq-'+sid);
  if(eq){
    const base=(()=>{if(s.perHead){const c=(STATE.budget.useRsvpCount&&!s.guestCountOverride)?_rsvpPerHeadCount():Number(s.guestCount||0);return c*Number(s.pricePerHead||0);}if(s.perItem){return Number(s.itemCount||0)*Number(s.pricePerItem||0);}return Number(s.amount||0);})();
    const sAmt=getSubItemAmount(s);
    eq.innerHTML=s.discountAmt>0?`${fmt(base)} &minus; ${fmt(s.discountAmt)} = <strong style="color:var(--gold-deep)">${fmt(sAmt)}</strong>`:'';
  }
  const pctInp=document.getElementById('sub-disc-pct-'+sid);
  if(s.discountAmt>0 && pctInp) pctInp.value='';
}
function updateSubItemCount(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(s){s.itemCount=Number(val)||0; applyAutoFromSubs(b); updateBudgetSummary(); updateSubEq(b,s);}
}
function updateSubPricePerItem(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(s){s.pricePerItem=Number(val)||0; applyAutoFromSubs(b); updateBudgetSummary(); updateSubEq(b,s);}
}

function updateSubEq(b,s){
  const el=document.getElementById('sub-eq-'+s.id);
  if(!el) return;
  const amt=getSubItemAmount(s);
  if(s.perHead){
    const gc = s.guestCountOverride ? Number(s.guestCount||0)
             : (STATE.budget.useRsvpCount ? _rsvpPerHeadCount() : (s.guestCount||0));
    el.innerHTML=`${gc} × $${Number(s.pricePerHead||0).toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(amt)}</strong>`;
  } else if(s.perItem){
    el.innerHTML=`${Number(s.itemCount||0)} × $${Number(s.pricePerItem||0).toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(amt)}</strong>`;
  }
}

// ── Installment helpers (Phase 1: data + calc core) ──────────────────────────
// A sub-item may carry an optional `installments` array of part-payments:
//   { id, label, amount, dueDate, paid, paidDate }
// These are payments AGAINST the sub-item's amount (like a deposit), not additions
// to it. Absent/empty array = no plan (fully backward compatible).
function calcSubInstallmentsPaid(s){
  if(!s || !s.installments || !s.installments.length) return 0;
  return s.installments.reduce((sum,inst)=> sum + (inst && inst.paid ? Number(inst.amount||0) : 0), 0);
}
function subInstallmentTotal(s){
  if(!s || !s.installments || !s.installments.length) return 0;
  return s.installments.reduce((sum,inst)=> sum + Number((inst&&inst.amount)||0), 0);
}
// True when a sub-item has an installment plan with at least one row.
function subHasInstallments(s){ return !!(s && s.installments && s.installments.length); }
// Re-split an auto-mode installment plan when the sub-item amount changes. Paid
// installments keep their amounts; the remaining balance (total − deposit − already-paid
// installments) is spread evenly across the UNPAID rows only. Manual plans and plans
// with no installments are left untouched. Returns true if amounts were updated.
function _resplitSubInstallments(s){
  if(!s || !s.installments || !s.installments.length) return false;
  if(s.installmentSplitMode==='manual') return false; // never touch manual amounts
  const total=Number(getSubItemAmount(s)||0);
  const dep = (s.showDeposit||Number(s.deposit||0)>0) ? Number(s.deposit||0) : 0;
  const paidSum=s.installments.reduce((sum,i)=>sum+((i&&i.paid)?Number(i.amount||0):0),0);
  const unpaid=s.installments.filter(i=>i && !i.paid);
  const n=unpaid.length;
  if(!n) return false; // all paid → nothing to redistribute
  // Balance still to spread across the unpaid rows.
  const rem=Math.max(0, total-dep-paidSum);
  const each=Math.floor((rem/n)*100)/100;
  const last=Math.round((rem-each*(n-1))*100)/100;
  let k=0;
  s.installments.forEach(inst=>{
    if(!inst || inst.paid) return;
    inst.amount = (k===n-1) ? last : each;
    k++;
  });
  return true;
}
// Auto-check installments whose due date has passed, when enabled. Resolution: a
// sub-item's own `autoCheckPassed` flag wins (true/false); otherwise the global
// setting `STATE.settings.autoCheckPassedInstallments`. Never re-ticks an installment
// the user explicitly unticked (`_userUnchecked`). Returns true if anything changed.
function _autoCheckPassedInstallments(){
  const globalOn = !!(STATE.settings && STATE.settings.autoCheckPassedInstallments);
  const today=_todayISO();
  let changed=false;
  (STATE.budget.items||[]).forEach(b=>{
    (b.subItems||[]).forEach(s=>{
      if(!s.installments || !s.installments.length) return;
      const planOn = (s.autoCheckPassed===true) ? true
                   : (s.autoCheckPassed===false) ? false
                   : globalOn;
      if(!planOn) return;
      let touched=false;
      s.installments.forEach(inst=>{
        if(!inst || inst.paid || inst._userUnchecked) return;
        if(inst.dueDate && inst.dueDate <= today){
          inst.paid=true; inst.paidDate=inst.dueDate; changed=true; touched=true;
        }
      });
      // If auto-checking completed the plan, tick the sub-item (and roll up).
      if(touched && s.installments.every(i=>i&&i.paid)) _reconcileSubFromInstallments(b, s);
    });
  });
  return changed;
}
// Progress summary for a sub-item's installment plan, for the row badge/bar.
// Returns null when there's no plan. {count, paidCount, total, paid, pct, next}
// where `next` is the soonest unpaid installment {amount, dueDate} or null.
function subInstallmentProgress(s){
  if(!subHasInstallments(s)) return null;
  const rows=s.installments;
  const count=rows.length;
  const paidCount=rows.filter(i=>i&&i.paid).length;
  const total=subInstallmentTotal(s);
  const paid=calcSubInstallmentsPaid(s);
  const pct=total>0?Math.min(100,Math.round(paid/total*100)):(count?Math.round(paidCount/count*100):0);
  // Next unpaid: earliest by due date, falling back to first unpaid in order.
  const unpaid=rows.filter(i=>i&&!i.paid);
  let next=null;
  if(unpaid.length){
    const dated=unpaid.filter(i=>i.dueDate).sort((a,b)=>a.dueDate<b.dueDate?-1:1);
    next = dated.length ? {amount:Number(dated[0].amount||0), dueDate:dated[0].dueDate}
                        : {amount:Number(unpaid[0].amount||0), dueDate:''};
  }
  return {count, paidCount, total, paid, pct, next};
}

function calcBudgetDeposit(b){
  if(b.depositFromSubs){
    if(b.subItems && b.subItems.length){
      return b.subItems.reduce((sum,s)=>sum+(s.depositPaid?Number(s.deposit||0):0),0);
    }
    return 0;
  }
  return Number(b.deposit||0);
}

function calcBudgetItemTotal(b){
  // The category's actual cost. When sub-items exist, it's their sum. A plan-holder
  // sub-item is a payment vehicle, not a cost line: it only counts toward cost when it
  // is the ONLY sub-item (i.e. the item had no real sub-items and the holder carries
  // the item's own total). When real sub-items exist alongside it, the holder is
  // excluded so it never double-counts.
  if(b.subItems && b.subItems.length){
    const realSubs=b.subItems.filter(s=>!s._planHolder);
    if(realSubs.length){
      return realSubs.reduce((sum,s)=>sum+getSubItemAmount(s),0);
    }
    // Only a plan-holder present → its amount is the item's total.
    return b.subItems.reduce((sum,s)=>sum+getSubItemAmount(s),0);
  }
  if(b.totalMode==='%'){ return Math.round(((b.totalPct||0)/100)*(STATE.budget.total||0)); }
  return Number(b.total||0);
}

function calcBudgetBalance(b){
  const total = calcBudgetItemTotal(b);
  let paid = 0;
  // Category deposit — only if checkbox ticked. In depositFromSubs mode the category
  // deposit is the sum of sub-item deposits, and each paid sub-deposit is credited in
  // the sub-items loop below; crediting calcBudgetDeposit here too would double-count.
  if(b.depositPaid && !b.depositFromSubs) paid += calcBudgetDeposit(b);
  // Balance fully paid
  if(b.paid) return 0;
  // Sub-items — only count paid amounts
  if(b.subItems && b.subItems.length){
    b.subItems.forEach(s=>{
      if(s._planHolder){
        // A plan-holder isn't a cost line, but its paid installments are real payments
        // against the item's total — always credit them.
        paid += calcSubInstallmentsPaid(s);
        return;
      }
      if(s.paid) paid += getSubItemAmount(s);
      else {
        // A paid sub-item deposit is a real payment against the category total, whether
        // or not the deposit rolls up to the category (depositFromSubs). Always credit it.
        if(s.depositPaid) paid += Number(s.deposit||0);
        paid += calcSubInstallmentsPaid(s); // credit any paid installments
      }
    });
  }
  return Math.max(0, total - paid);
}

// ── Allocated envelope helpers ───────────────────────────────────────────────
// "Committed" = the cost tied up in this category: the sum of sub-item costs, or —
// when there are no sub-items — the category's own cost figure. Deposits and
// installments are payments AGAINST these costs, never added on top, so they don't
// affect committed (that would double-count).
function calcBudgetCommitted(b){
  if(b.subItems && b.subItems.length){
    const realSubs=b.subItems.filter(s=>!s._planHolder);
    if(realSubs.length){ return realSubs.reduce((sum,s)=>sum+getSubItemAmount(s),0); }
    return b.subItems.reduce((sum,s)=>sum+getSubItemAmount(s),0);
  }
  return Number(b.total||0);
}
// "Allocated" is the optional budget cap the user sets (b.total). It is now
// independent of sub-items: a category can have both an allocated cap AND sub-items
// that auto-sum into "committed", so over/under-spend shows against the cap.
// A category is "in allocated mode" whenever it has sub-items and a cap is set.
function budgetIsAllocated(b){ return !!(b.subItems && b.subItems.length) && Number(b.total||0)>0; }
function calcBudgetAllocated(b){ if(b.totalMode==='%'){ return Math.round(((b.totalPct||0)/100)*(STATE.budget.total||0)); } return Number(b.total||0); }
// Remaining envelope = allocated − committed (may go negative = over-allocated).
function calcBudgetRemaining(b){ return calcBudgetAllocated(b) - calcBudgetCommitted(b); }
// Paid so far against this category = its total cost minus what's still owing.
function calcBudgetPaid(b){ return Math.max(0, calcBudgetItemTotal(b) - calcBudgetBalance(b)); }

function openEditBudgetItem(id){
  const b=STATE.budget.items.find(x=>x.id===id); if(!b)return;
  _bePendingTaskLinks=[]; _beEditTarget={bid:id, sid:''}; _beSubCtx=null; _beForcedTaskCategory='';
  const hasSubs = b.subItems && b.subItems.length > 0;
  // SVG icon library — each entry: [id, label, path_data]
  const svgIcons = [
    ['ring',      'Rings',         'M9 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm6-1a4 4 0 1 0 0 8 4 4 0 0 0 0-8'],
    ['diamond',   'Jewellery',     'M6 3h12l4 6-10 12L2 9zm-4 6h20M12 3l4 6m-8 0l4-6'],
    ['flower',    'Florals',       'M12 21v-9M12 12c0-2 1.5-4 3-5-1 2-.5 4.5-3 5M12 12c0-2-1.5-4-3-5 1 2 .5 4.5 3 5M12 12c-1-1-1-3 0-4M10 20h4'],
    ['camera',    'Photography',   'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zm-7-7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'],
    ['cake',      'Cake',          'M20 21H4V11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2zM4 15h16M12 2v3m-4 0v3m8-3v3'],
    ['music',     'Music',         'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'],
    ['hanger',    'Attire',        'M12 3a2 2 0 0 1 2 2c0 1-1 1.5-1 1.5L3 14h18L12 6.5S11 6 11 5a2 2 0 0 1 1-2zM3 14v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1'],
    ['arch',      'Ceremony',      'M4 21V8M20 21V8M4 8C4 4.7 7.6 2 12 2s8 2.7 8 6M7 21v-5a5 5 0 0 1 10 0v5M7 8h10'],
    ['cloche',    'Catering',      'M2 15h20M12 5a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8zM8 19h8M12 5V3'],
    ['columns',   'Venue',         'M5 21V5m0 0h14v16M5 5l7-3 7 3M9 21v-6h6v6M3 21h18'],
    ['plane',     'Honeymoon',     'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z'],
    ['car',       'Transport',     'M5 17H3v-5l3-6h12l3 6v5h-2m-1 0H7m0 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z'],
    ['envelope',  'Invitations',   'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 0l8 8 8-8'],
    ['lights',    'Decor',         'M9 21h6M9 21V10h6v11M12 10V7M11 7h2M12 7C11.2 6 11 5 12 4c1 1 .8 2 0 3'],
    ['ribbon',    'Beauty',        'M9 22h6M9 22V12h6v10M9 12l1-8h4l1 8M11 4V2m2 2V2M10 7h4'],
    ['heart',     'Gifts',         'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
    ['wallet',    'Budget',        'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm16 5h2m-2 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM2 11h20'],
    ['bed',       'Accom.', 'M3 21v-6M21 21v-6M3 15h18M3 15v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2'],
    ['star',      'Other',         'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'],
  ];

  const iconPicker = `<div class="form-group"><label class="form-label">Category Icon</label>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:6px;padding:10px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
      <button type="button" onclick="selectBudgetIcon('')" id="icon-none"
        style="height:46px;border-radius:6px;border:1px solid var(--border);background:${!b.icon?'var(--parchment)':'var(--cream)'};cursor:pointer;font-size:10px;color:var(--muted);font-family:Inter,sans-serif">None</button>
      ${svgIcons.map(([id,label,path])=>`<button type="button" onclick="selectBudgetIcon('${id}')" id="icon-${id}" title="${label}"
        style="height:46px;border-radius:6px;border:1px solid ${b.icon===id?'var(--gold)':'var(--border)'};background:${b.icon===id?'var(--parchment)':'var(--cream)'};cursor:pointer;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px">
        <svg class="bip-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>
        <span class="bip-label" style="font-size:8.5px;color:#5C3D2E;font-family:Inter,sans-serif;letter-spacing:.04em">${label}</span>
      </button>`).join('')}
    </div>
  </div>`;
  openModal('Edit: '+b.name,`
  <div style="display:flex;flex-direction:column;gap:14px">
    <div class="form-group"><label class="form-label">Item Name</label><input class="form-input" id="be-name" value="${b.name}" oninput="_beRefreshTaskSuggest()"/></div>
    <div id="be-suggest-host"></div>
    ${_budgetShown('catIcon')?iconPicker:''}
    ${hasSubs?`<div style="font-size:11.5px;color:var(--muted);padding:9px 13px;background:var(--surface);border-radius:8px;border:1px solid var(--border);line-height:1.5">The category total adds up from its sub-items automatically. Set an <strong style="color:var(--ink)">Allocated</strong> amount below to track spending against a cap (optional).</div>`:''}
    <div class="form-row" id="be-total-row" style="display:grid">
      <div class="form-group">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <label class="form-label" id="be-total-lbl" style="margin:0">${b.totalMode==='%'?'Allocated (%)': 'Allocated ($)'}</label>
          <span style="display:inline-flex;border:.5px solid #E3D7C4;border-radius:6px;overflow:hidden">
            <button type="button" id="be-mode-dollar" onclick="_beSwitchTotalMode('$')" style="padding:0 9px;height:24px;font-size:11px;font-weight:600;border:none;cursor:pointer;font-family:inherit;background:${b.totalMode==='%'?'#FBF8F3':'#9A7B2E'};color:${b.totalMode==='%'?'#A2957A':'#fff'}">$</button>
            <button type="button" id="be-mode-pct" onclick="_beSwitchTotalMode('%')" style="padding:0 9px;height:24px;font-size:11px;font-weight:600;border:none;cursor:pointer;font-family:inherit;border-left:.5px solid #E3D7C4;background:${b.totalMode==='%'?'#9A7B2E':'#FBF8F3'};color:${b.totalMode==='%'?'#fff':'#A2957A'}">%</button>
          </span>
        </div>
        <input type="hidden" id="be-total-mode" value="${b.totalMode||'$'}"/>
        <input class="form-input" type="number" id="be-total" value="${b.totalMode==='%'?(b.totalPct||''): (b.total||'')}"/>
        <div id="be-pct-hint" style="font-size:11.5px;color:#9A7B2E;background:rgba(154,123,46,.09);border-radius:6px;padding:5px 9px;margin-top:5px;display:${b.totalMode==='%'?'block':'none'}">
          ${b.totalMode==='%'?((b.totalPct||0)+'% of '+fmt(STATE.budget.total||0)+'  =  '+fmt(Math.round(((b.totalPct||0)/100)*(STATE.budget.total||0)))):''}
        </div>
      </div>
      <div id="be-dep-row" style="display:block">
        <div class="form-group"><label class="form-label">Deposit ($)</label><input class="form-input" type="number" id="be-dep" value="${b.deposit||''}"/></div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" id="be-bal-due-row" style="display:block"><label class="form-label">Balance Due</label><input class="form-input" type="date" id="be-bal-due" value="${b.balanceDueDate||''}" oninput="_beAddTaskDateToggle()"/></div>
      <div class="form-group" id="be-dep-due-row" style="display:block"><label class="form-label">Deposit Due</label><input class="form-input" type="date" id="be-dep-due" value="${b.depositDueDate||''}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="be-note" value="${b.note||''}"/></div>
    ${_urlFieldHtml('be-url', b.url||'')}
    ${_beAddTaskBlockHtml('be-name', {dateField:'be-bal-due', urlField:'be-url'})}
  </div>`,
  `<button class="btn btn-danger btn-sm" onclick="closeModalDirect();deleteBudgetItem('${id}')" style="margin-right:auto;display:inline-flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Delete</button>
   <button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
   <button class="btn btn-primary" onclick="saveBudgetItem('${id}')">Save</button>`);
  if(b.totalFromSubs&&b.depositFromSubs){ /* legacy flag — no longer drives a toggle */ }
  // Pre-filled name → show any matching tasks straight away.
  setTimeout(_beRefreshTaskSuggest, 0);
}

let _pendingBudgetIcon = null;
function selectBudgetIcon(ic){
  _pendingBudgetIcon = ic;
  document.querySelectorAll('[id^="icon-"]').forEach(el=>{
    el.style.border='1px solid var(--border)';
    el.style.background='var(--cream)';
  });
  const target = document.getElementById('icon-'+(ic||'none'));
  if(target){ target.style.border='1px solid var(--gold)'; target.style.background='var(--parchment)'; }
}

function saveBudgetItem(id){
  const b=STATE.budget.items.find(x=>x.id===id); if(!b)return;
  b.name=document.getElementById('be-name').value.trim()||b.name;
  if(_pendingBudgetIcon !== null){ b.icon=_pendingBudgetIcon; _pendingBudgetIcon=null; }
  // Sub-items always auto-sum into the cost. b.total is now the optional Allocated cap.
  const _beMode=(document.getElementById('be-total-mode')?.value)||'$';
  const _beRawVal=Number(document.getElementById('be-total')?.value)||0;
  if(_beMode==='%'){
    b.totalMode='%';
    b.totalPct=_beRawVal;
    b.total=Math.round((_beRawVal/100)*(STATE.budget.total||0));
  } else {
    b.totalMode='$';
    b.totalPct=0;
    b.total=_beRawVal;
  }
  b.deposit=Number(document.getElementById('be-dep')?.value)||0;
  b.depositDueDate=document.getElementById('be-dep-due').value;
  // A category-level deposit entered here is an explicit item deposit, not a sub-item
  // rollup — so it must display and count as such. Keep it out of "from subs" mode
  // whenever a category deposit amount or due date is present.
  if(Number(b.deposit||0)>0 || b.depositDueDate){
    b.depositFromSubs=false;
    b.depositFromSubsManualOff=true; // don't let applyAutoFromSubs re-enable rollup
  }
  b.balanceDueDate=document.getElementById('be-bal-due').value;
  b.note=document.getElementById('be-note').value;
  b.url=_normalizeUrl(document.getElementById('be-url')?.value||'');
  // Create a checklist task if requested (reads the add-task block before teardown),
  // then apply any queued task links — mirrors addNewBudgetItem so task-linking works
  // from the Edit modal too.
  _beCreateTaskIfRequested(id, '', b.balanceDueDate, b.name);
  const hasQueued=_bePendingTaskLinks.length>0;
  closeModalDirect(); updateBudgetSummary();
  if(hasQueued){
    _beApplyQueuedLinks(id, '', ()=>{ navigate('budget'); });
  } else {
    navigate('budget');
  }
}
function _beSwitchTotalMode(mode){
  const btnD=document.getElementById('be-mode-dollar');
  const btnP=document.getElementById('be-mode-pct');
  const lbl=document.getElementById('be-total-lbl');
  const inp=document.getElementById('be-total');
  const hint=document.getElementById('be-pct-hint');
  if(!btnD||!btnP) return;
  const gold='#9A7B2E', offBg='#FBF8F3', offFg='#A2957A';
  const modeHidden=document.getElementById('be-total-mode');
  if(mode==='%'){
    btnD.style.background=offBg; btnD.style.color=offFg;
    btnP.style.background=gold; btnP.style.color='#fff';
    if(modeHidden) modeHidden.value='%';
    if(lbl) lbl.textContent='Allocated (%)';
    if(inp){ inp.placeholder='0'; inp.value=''; }
    if(hint) hint.style.display='none';
  } else {
    btnD.style.background=gold; btnD.style.color='#fff';
    btnP.style.background=offBg; btnP.style.color=offFg;
    if(modeHidden) modeHidden.value='$';
    if(lbl) lbl.textContent='Allocated ($)';
    if(inp){ inp.placeholder='0'; inp.value=''; }
    if(hint) hint.style.display='none';
  }
  // Attach live-update listener to show calculated $ when typing in % mode
  if(inp){
    inp.oninput=function(){
      if(!hint) return;
      const _modeH=document.getElementById('be-total-mode');
      const isPct=_modeH&&_modeH.value==='%';
      if(isPct){
        const pct=parseFloat(this.value)||0;
        const budgetTot=STATE&&STATE.budget?STATE.budget.total||0:0;
        const calc=Math.round(pct/100*budgetTot);
        hint.textContent=pct+'% of '+fmt(budgetTot)+' = '+fmt(calc);
        hint.style.display='block';
      } else {
        hint.style.display='none';
      }
    };
  }
}
function openAddBudgetItem(){
  _pendingBudgetIcon = '';
  _bePendingTaskLinks=[]; _beEditTarget=null; _beSubCtx=null; _beAddTaskInheritDate=''; _beForcedTaskCategory='';
  const svgIcons = [
    ['ring','Rings','M9 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm6-1a4 4 0 1 0 0 8 4 4 0 0 0 0-8'],
    ['diamond','Jewellery','M6 3h12l4 6-10 12L2 9zm-4 6h20M12 3l4 6m-8 0l4-6'],
    ['flower','Florals','M12 21v-9M12 12c-1-1.5-3-2-4-1s0 3 1 4 3 1.5 3 1.5 2 .5 3-1.5 2-3 1-4-3-.5-4 1zM12 12c0-2-.7-4-2-5M12 12c0-2 .7-4 2-5M10 20h4'],
    ['camera','Photography','M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zm-7-7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'],
    ['cake','Cake','M20 21H4V11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2zM4 15h16M12 2v3m-4 0v3m8-3v3'],
    ['music','Music','M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'],
    ['hanger','Attire','M12 3a2 2 0 0 1 2 2c0 1-1 1.5-1 1.5L3 14h18L12 6.5S11 6 11 5a2 2 0 0 1 1-2zM3 14v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1'],
    ['arch','Ceremony','M4 21V8M20 21V8M4 8C4 4.7 7.6 2 12 2s8 2.7 8 6M9 21v-4a3 3 0 0 1 6 0v4'],
    ['cloche','Catering','M2 15h20M12 5a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8zM8 19h8M12 5V3'],
    ['columns','Venue','M5 21V5m0 0h14v16M5 5l7-3 7 3M9 21v-6h6v6M3 21h18'],
    ['plane','Honeymoon','M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z'],
    ['car','Transport','M5 17H3v-5l3-6h12l3 6v5h-2m-1 0H7m0 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z'],
    ['envelope','Invitations','M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 0l8 8 8-8'],
    ['lights','Decor','M9 21h6M9 21V10h6v11M12 10V7M11 7h2M12 7C11.2 6 11 5 12 4c1 1 .8 2 0 3'],
    ['ribbon','Beauty','M9 22h6M9 22V12h6v10M9 12l1-8h4l1 8M11 4V2m2 2V2M10 7h4'],
    ['heart','Gifts','M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
    ['wallet','Budget','M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm16 5h2m-2 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM2 11h20'],
    ['bed','Accom.','M3 21v-6M21 21v-6M3 15h18M3 15v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2'],
    ['star','Other','M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'],
  ];
  const iconPicker = `<div class="form-group"><label class="form-label">Category Icon</label>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:6px;padding:10px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
      <button type="button" onclick="selectBudgetIcon('')" id="icon-none"
        style="height:46px;border-radius:6px;border:1px solid var(--gold);background:var(--parchment);cursor:pointer;font-size:10px;color:var(--muted);font-family:Inter,sans-serif">None</button>
      ${svgIcons.map(([id,label,path])=>`<button type="button" onclick="selectBudgetIcon('${id}')" id="icon-${id}" title="${label}"
        style="height:46px;border-radius:6px;border:1px solid var(--border);background:var(--cream);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px">
        <svg class="bip-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>
        <span class="bip-label" style="font-size:8.5px;color:#5C3D2E;font-family:Inter,sans-serif;letter-spacing:.04em">${label}</span>
      </button>`).join('')}
    </div>
  </div>`;
  openModal('Add Budget Category',`
  <div style="display:flex;flex-direction:column;gap:14px">
    <div class="form-group"><label class="form-label">Category Name</label><input class="form-input" id="be-name" placeholder="e.g. Florals" oninput="_beRefreshTaskSuggest()"/></div>
    <div id="be-suggest-host"></div>
    ${_budgetShown('catIcon')?iconPicker:''}
    <div class="form-row">
      <div class="form-group">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <label class="form-label" id="be-total-lbl" style="margin:0">Allocated ($)</label>
          <span style="display:inline-flex;border:.5px solid #E3D7C4;border-radius:6px;overflow:hidden">
            <button type="button" id="be-mode-dollar" onclick="_beSwitchTotalMode(\'$\')" style="padding:0 9px;height:24px;font-size:11px;font-weight:600;border:none;cursor:pointer;font-family:inherit;background:#9A7B2E;color:#fff">$</button>
            <button type="button" id="be-mode-pct" onclick="_beSwitchTotalMode(\'%\')" style="padding:0 9px;height:24px;font-size:11px;font-weight:600;border:none;cursor:pointer;font-family:inherit;border-left:.5px solid #E3D7C4;background:#FBF8F3;color:#A2957A">%</button>
          </span>
        </div>
        <input type="hidden" id="be-total-mode" value="$"/>
        <input class="form-input" type="number" id="be-total"/>
        <div id="be-pct-hint" style="font-size:11.5px;color:#9A7B2E;background:rgba(154,123,46,.09);border-radius:6px;padding:5px 9px;margin-top:5px;display:none"></div>
      </div>
      <div class="form-group"><label class="form-label">Deposit ($)</label><input class="form-input" type="number" id="be-dep"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Balance Due</label><input class="form-input" type="date" id="be-bal-due" oninput="_beAddTaskDateToggle()"/></div>
      <div class="form-group"><label class="form-label">Deposit Due</label><input class="form-input" type="date" id="be-dep-due"/></div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="be-note" placeholder="Optional notes…"/></div>
    ${_urlFieldHtml('be-url','')}
    ${_beAddTaskBlockHtml('be-name', {dateField:'be-bal-due', urlField:'be-url'})}
  </div>`,
  `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
   <button class="btn btn-primary" onclick="addNewBudgetItem()">Add</button>`);
}
function addNewBudgetItem(){
  const name=document.getElementById('be-name').value.trim(); if(!name)return;
  const icon=(_pendingBudgetIcon!==null?_pendingBudgetIcon:'');
  _pendingBudgetIcon=null;
  const newId='b'+Date.now();
  const balDue=document.getElementById('be-bal-due').value;
  STATE.budget.items.push({
    id:newId, name, icon,
    total:(()=>{const _m=(document.getElementById('be-total-mode')?.value)||'$'; const _v=Number(document.getElementById('be-total').value)||0; return _m==='%'?Math.round((_v/100)*(STATE.budget.total||0)):_v;})(),
    totalMode:(document.getElementById('be-total-mode')?.value)||'$',
    totalPct:((document.getElementById('be-total-mode')?.value)==='%'?Number(document.getElementById('be-total').value)||0:0),
    deposit:Number(document.getElementById('be-dep').value)||0,
    depositDueDate:document.getElementById('be-dep-due').value,
    balanceDueDate:balDue,
    note:document.getElementById('be-note').value,
    url:_normalizeUrl(document.getElementById('be-url')?.value||''),
    paid:false, depositPaid:false,
    expanded:true, subItems:[], checklistId:''
  });
  // Create a checklist task if requested (reads the add-task block before it's torn down).
  _beCreateTaskIfRequested(newId, '', balDue, name);
  const hasQueued=_bePendingTaskLinks.length>0;
  closeModalDirect();
  if(hasQueued){
    // Apply each queued link (date reconciliation may open a conflict modal per task),
    // then refresh the budget view once everything settles.
    _beApplyQueuedLinks(newId, '', ()=>{ navigate('budget'); });
  } else {
    navigate('budget');
  }
}
function deleteBudgetItem(id){
  closeDots();
  const b=STATE.budget.items.find(x=>x.id===id);
  if(!b)return;
  const itemTask=_itemLinkedTask(b);
  const subLinkedCount=(b.subItems||[]).reduce((a,s)=>a+_tasksLinkedToSub(b.id,s.id).length,0);
  if(itemTask||subLinkedCount){
    let msg='<b style="color:var(--ink)">"'+_esc(b.name)+'"</b> has ';
    const parts=[];
    if(itemTask) parts.push('a linked checklist task');
    if(subLinkedCount) parts.push(subLinkedCount+' linked sub-item task'+(subLinkedCount>1?'s':''));
    msg+=parts.join(' and ')+'. Deleting this category will <b style="color:var(--ink)">unlink '+((itemTask&&subLinkedCount)?'them all':(subLinkedCount>1?'them':'it'))+'</b> — the checklist task'+((itemTask?1:0)+subLinkedCount>1?'s':'')+' will remain but no longer linked.';
    openModal('Delete category?',
      `<div style="font-size:13px;color:var(--muted);line-height:1.55">${msg}</div>`,
      `<div style="display:flex;flex-direction:column;gap:8px;width:100%">
        <button class="btn btn-danger" onclick="confirmDeleteBudgetItem('${id}')">Delete &amp; unlink</button>
        <button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
      </div>`);
    return;
  }
  _confirmDeleteDialog({title:'Delete Category', question:'Delete this category?', name:b.name, verb:'Delete', onConfirmJs:`confirmDeleteBudgetItem('${id}')`});
}
function confirmDeleteBudgetItem(id){
  const _b0=STATE.budget.items.find(x=>x.id===id);
  const _label=_b0?(_b0.name||'budget item'):'budget item';
  closeModalDirect();
  _undoableDelete(_label, ()=>{
  const b=STATE.budget.items.find(x=>x.id===id);
  if(b){
    const t=_itemLinkedTask(b); if(t){ t.budgetId=''; t.budgetSubId=''; }
    (b.subItems||[]).forEach(s=>_tasksLinkedToSub(b.id,s.id).forEach(c=>{ c.budgetId=''; c.budgetSubId=''; }));
  }
  STATE.budget.items=STATE.budget.items.filter(x=>x.id!==id);
  }, 'budget');
}
function addSubItem(pid){
  if(_sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('budgetSubItems')) return;
  _bePendingTaskLinks=[]; _beEditTarget=null; _beForcedTaskCategory='';
  _beSubParent=pid;
  const _bp=STATE.budget.items.find(x=>x.id===pid);
  _beSubCtx=_bp?{parentName:_bp.name||'', parentNote:_bp.note||'', subNote:''}:null;
  _beAddTaskInheritDate=_bp?(_bp.balanceDueDate||''):'';
  // Pricing mode state for the popup: 'flat' | 'item' | 'head'. Reset each open.
  _siPricingMode='flat';
  const useRsvp=!!STATE.budget.useRsvpCount;
  const rsvpCount=_rsvpPerHeadCount();
  // Per-head guest count: blank under Custom, prefilled (overridable) under RSVP.
  const headGuestPrefill = useRsvp ? String(rsvpCount) : '';
  openModal('Add Sub-item',`<div style="display:flex;flex-direction:column;gap:14px">
    <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="si-name" placeholder="e.g. Chairs &amp; furniture" oninput="_beRefreshTaskSuggest('si-name')"/></div>
    <!-- FLAT amount (default) -->
    <div class="form-group" id="si-flat-row"><label class="form-label">Amount ($)</label><input class="form-input" type="number" id="si-amt" placeholder="0" oninput="_siUpdateCalc()"/></div>
    <!-- Chip strip: Per item / Per head / Discount -->
    <div class="si-chips">
      <button type="button" id="si-chip-item" class="si-chip" onclick="_siToggleChip('item')">+ Per item</button>
      <button type="button" id="si-chip-head" class="si-chip" onclick="_siToggleChip('head')">+ Per head</button>
      <span class="si-chip-sep"></span>
      <button type="button" id="si-chip-disc" class="si-chip" onclick="_siToggleChip('disc')">+ Discount</button>
    </div>
    <!-- PER ITEM calc (toggled by chip) -->
    <div id="si-item-row" style="display:none;background:var(--surface);border:.5px solid var(--border);border-radius:9px;padding:11px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Per item</span>
        <button type="button" onclick="_siToggleChip('item')" style="border:none;background:none;color:var(--red);font-size:10.5px;cursor:pointer;padding:0;font-family:inherit">− remove</button>
      </div>
      <div id="si-item-eq" style="font-size:11.5px;color:var(--muted);margin-bottom:9px">0 × $0.00 = <strong style="color:var(--gold-deep)">${fmt(0)}</strong></div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:11.5px;color:var(--muted)">Items</span>
        <input type="number" id="si-item-count" placeholder="0" min="0" oninput="_siUpdateCalc()"
          style="width:62px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"/>
        <span style="font-size:11.5px;color:var(--muted)">×  $</span>
        <input type="number" id="si-item-price" placeholder="0.00" min="0" step="0.01" oninput="_siUpdateCalc()"
          style="width:80px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"/>
        <span style="font-size:11.5px;color:var(--muted)">per item</span>
      </div>
    </div>
    <!-- PER HEAD calc (toggled by chip) -->
    <div id="si-head-row" style="display:none;background:var(--surface);border:.5px solid var(--border);border-radius:9px;padding:11px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Per head</span>
        <button type="button" onclick="_siToggleChip('head')" style="border:none;background:none;color:var(--red);font-size:10.5px;cursor:pointer;padding:0;font-family:inherit">− remove</button>
      </div>
      <div id="si-head-eq" style="font-size:11.5px;color:var(--muted);margin-bottom:9px">${useRsvp?rsvpCount:0} × $0.00 = <strong style="color:var(--gold-deep)">${fmt(0)}</strong></div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:11.5px;color:var(--muted)">Guests</span>
        <input type="number" id="si-head-count" value="${headGuestPrefill}" placeholder="0" min="0" oninput="_siUpdateCalc()"
          style="width:62px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"/>
        <span style="font-size:11.5px;color:var(--muted)">×  $</span>
        <input type="number" id="si-head-price" placeholder="0.00" min="0" step="0.01" oninput="_siUpdateCalc()"
          style="width:80px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"/>
        <span style="font-size:11.5px;color:var(--muted)">per head</span>
      </div>
      ${useRsvp?`<div style="font-size:10.5px;color:var(--muted);margin-top:6px">Prefilled from RSVP attending (${rsvpCount}). Type to override.</div>`:''}
    </div>
    <!-- DISCOUNT (toggled by chip) -->
    <div id="si-disc-panel" style="display:none;background:var(--surface);border:.5px solid var(--border);border-radius:9px;padding:11px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Discount</span>
        <button type="button" onclick="_siToggleChip('disc')" style="border:none;background:none;color:var(--red);font-size:10.5px;cursor:pointer;padding:0;font-family:inherit">− remove</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:4px">
          <input type="number" id="si-disc-pct" placeholder="0" min="0" max="100" step="0.01"
            style="width:58px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
            oninput="_siDiscPctInput()"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          <span style="font-size:11.5px;color:var(--muted)">%</span>
        </div>
        <span style="font-size:11px;color:var(--muted)">or</span>
        <div style="display:flex;align-items:center;gap:4px">
          <span style="font-size:11.5px;color:var(--muted)">$</span>
          <input type="number" id="si-disc-amt" placeholder="0.00" min="0" step="0.01"
            style="width:72px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
            oninput="_siDiscAmtInput()"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          <span style="font-size:11.5px;color:var(--muted)">off</span>
        </div>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Due date</label><input class="form-input" type="date" id="si-due" oninput="_beAddTaskDateToggle()"/></div>
    <div id="be-suggest-host"></div>
    ${_urlFieldHtml('si-url','')}
    ${_beAddTaskBlockHtml('si-name', {dateField:'si-due', urlField:'si-url'})}</div>`,
  `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
   <button class="btn btn-primary" onclick="saveNewSubItem('${pid}')">Add</button>`);
}
function _siDiscPctInput(){
  const p=document.getElementById('si-disc-pct');
  const a=document.getElementById('si-disc-amt');
  if(p && Number(p.value)>0 && a) a.value='';
}
function _siDiscAmtInput(){
  const p=document.getElementById('si-disc-pct');
  const a=document.getElementById('si-disc-amt');
  if(a && Number(a.value)>0 && p) p.value='';
}
// Unified chip toggle for Add Sub-item: item | head | disc.
// Toggling item/head also shows/hides the flat Amount row (hidden when either calc is on).
let _siPricingMode='flat'; // kept for saveNewSubItem compat; derived from chip state
function _siToggleChip(type){
  const chipEl=document.getElementById('si-chip-'+type);
  const isOn = chipEl && chipEl.classList.contains('on');
  if(type==='item'||type==='head'){
    const itemChip=document.getElementById('si-chip-item');
    const headChip=document.getElementById('si-chip-head');
    const itemRow=document.getElementById('si-item-row');
    const headRow=document.getElementById('si-head-row');
    const flatRow=document.getElementById('si-flat-row');
    if(type==='item'){
      const nowOn=!isOn;
      if(itemChip) itemChip.classList.toggle('on', nowOn);
      if(itemRow) itemRow.style.display=nowOn?'block':'none';
      // turning item on hides flat unless head is also off
      const headOn=headChip&&headChip.classList.contains('on');
      if(flatRow) flatRow.style.display=(nowOn||headOn)?'none':'block';
      _siPricingMode=nowOn?'item':(headOn?'head':'flat');
    } else {
      const nowOn=!isOn;
      if(headChip) headChip.classList.toggle('on', nowOn);
      if(headRow) headRow.style.display=nowOn?'block':'none';
      const itemOn=itemChip&&itemChip.classList.contains('on');
      if(flatRow) flatRow.style.display=(nowOn||itemOn)?'none':'block';
      _siPricingMode=nowOn?'head':(itemOn?'item':'flat');
    }
  } else if(type==='disc'){
    const nowOn=!isOn;
    if(chipEl) chipEl.classList.toggle('on', nowOn);
    const panel=document.getElementById('si-disc-panel');
    if(panel) panel.style.display=nowOn?'block':'none';
    if(!nowOn){
      const pct=document.getElementById('si-disc-pct'); if(pct) pct.value='';
      const amt=document.getElementById('si-disc-amt'); if(amt) amt.value='';
    }
  }
  _siUpdateCalc();
}
function _siUpdateCalc(){
  const itemRow=document.getElementById('si-item-row');
  const headRow=document.getElementById('si-head-row');
  if(itemRow && itemRow.style.display!=='none'){
    const c=Number(document.getElementById('si-item-count')?.value)||0;
    const p=Number(document.getElementById('si-item-price')?.value)||0;
    const eq=document.getElementById('si-item-eq');
    if(eq) eq.innerHTML=`${c} × $${p.toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(c*p)}</strong>`;
  }
  if(headRow && headRow.style.display!=='none'){
    const c=Number(document.getElementById('si-head-count')?.value)||0;
    const p=Number(document.getElementById('si-head-price')?.value)||0;
    const eq=document.getElementById('si-head-eq');
    if(eq) eq.innerHTML=`${c} × $${p.toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(c*p)}</strong>`;
  }
}
function saveNewSubItem(pid){
  const b=STATE.budget.items.find(x=>x.id===pid); if(!b)return;
  const name=document.getElementById('si-name').value.trim(); if(!name)return;
  const url=_normalizeUrl(document.getElementById('si-url')?.value||'');
  if(!b.subItems)b.subItems=[];
  const newSid='si'+Date.now();
  const dueDate=(document.getElementById('si-due')?.value||'').trim();
  const sub={id:newSid,name,amount:0,url,balanceDueDate:dueDate};
  // Apply the chosen pricing mode. Stored fields mirror the row-level calc so the
  // existing getSubItemAmount() and the ⋯-menu editors keep working unchanged.
  if(_siPricingMode==='item'){
    sub.perItem=true;
    sub.itemCount=Number(document.getElementById('si-item-count')?.value)||0;
    sub.pricePerItem=Number(document.getElementById('si-item-price')?.value)||0;
  } else if(_siPricingMode==='head'){
    sub.perHead=true;
    sub.pricePerHead=Number(document.getElementById('si-head-price')?.value)||0;
    const typed=Number(document.getElementById('si-head-count')?.value)||0;
    const useRsvp=!!STATE.budget.useRsvpCount;
    const rsvpCount=_rsvpPerHeadCount();
    if(useRsvp){
      // RSVP mode: if the typed count matches the live attending count, track live
      // (no override). If it differs, store it as an explicit override that holds.
      if(typed===rsvpCount){ sub.guestCount=0; sub.guestCountOverride=false; }
      else { sub.guestCount=typed; sub.guestCountOverride=true; }
    } else {
      // Custom mode: the typed count is simply the sub's guest count.
      sub.guestCount=typed; sub.guestCountOverride=false;
    }
  } else {
    sub.amount=Number(document.getElementById('si-amt').value)||0;
  }
  // Apply discount if entered (% takes priority over $; clears the other).
  const discPct=Number(document.getElementById('si-disc-pct')?.value)||0;
  const discAmt=Number(document.getElementById('si-disc-amt')?.value)||0;
  if(discPct>0){ sub.discountPct=discPct; sub.discountAmt=0; }
  else if(discAmt>0){ sub.discountAmt=discAmt; sub.discountPct=0; }
  b.subItems.push(sub);
  applyAutoFromSubs(b);
  // Create a checklist task if requested. Sub-items inherit the parent category's
  // Balance Due (stashed in _beAddTaskInheritDate); the task links to this sub-item.
  _beCreateTaskIfRequested(pid, newSid, _beAddTaskInheritDate, name);
  const hasQueued=_bePendingTaskLinks.length>0;
  closeModalDirect();
  _beSubParent=null;
  if(hasQueued){
    _beApplyQueuedLinks(pid, newSid, ()=>{ updateBudgetSummary(); navigate('budget'); });
  } else {
    updateBudgetSummary(); navigate('budget');
  }
}
// "Auto-calculate the total?" prompt, shown after the first sub-item is added.
function _askAutoCalcOnFirstSub(pid){
  const b=STATE.budget.items.find(x=>x.id===pid); if(!b)return;
  const body=`<div style="font-size:13px;color:var(--ink);line-height:1.55">You added a sub-item to <strong>${_escHtml(b.name)}</strong>. Would you like this category’s total and deposit to roll up automatically from its sub-items?</div>`;
  const footer=`<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">No, keep manual</button>
    <button class="btn btn-primary btn-sm" onclick="_applyAutoCalcFromSub('${pid}')">Yes, auto-calc</button>`;
  openModal('Auto-calculate the total?', body, footer);
}
function _applyAutoCalcFromSub(pid){
  const b=STATE.budget.items.find(x=>x.id===pid); if(!b){ closeModalDirect(); return; }
  b.totalFromSubs=true; b.depositFromSubs=true;
  b.totalFromSubsManualOff=false; b.depositFromSubsManualOff=false;
  saveToStorage(); closeModalDirect(); updateBudgetSummary(); navigate('budget');
}
function updateSubItemName(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(s){s.name=val.trim()||s.name; saveToStorage();}
}
// Small popup to rename a sub-item (replaces the old inline name input).
function _editSubTitle(pid, sid){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s) return;
  openModal('Edit title',
    `<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="sub-title-edit" value="${_escAttr(s.name||'')}" placeholder="Sub-item name" onkeydown="if(event.key==='Enter'){event.preventDefault();_saveSubTitle('${pid}','${sid}');}"/></div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-primary" onclick="_saveSubTitle('${pid}','${sid}')">Save</button>`);
  setTimeout(()=>{ const el=document.getElementById('sub-title-edit'); if(el){ el.focus(); el.select(); } },0);
}
function _saveSubTitle(pid, sid){
  const el=document.getElementById('sub-title-edit'); if(!el) return;
  updateSubItemName(pid, sid, el.value);
  closeModalDirect();
  navigate('budget');
}

// Combined "Edit" popup for a sub-item: name, amount (when flat), and
// collapsible Per Item / Per Head / Discount calc panels with + add links
// and − remove buttons. Per Item auto-fills the $/head field when both are open.
function _editSubItem(pid, sid){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s) return;

  // Add-task block context: sub-item matching uses parent name/note + this sub's note;
  // the date inherits the sub's Balance Due, falling back to the parent category's.
  _bePendingTaskLinks=[]; _beEditTarget={bid:pid, sid:sid}; _beForcedTaskCategory='';
  _beSubCtx={parentName:b.name||'', parentNote:b.note||'', subNote:s.note||''};
  _beAddTaskInheritDate = s.balanceDueDate || b.balanceDueDate || '';
  // If this sub is already linked to a checklist task, show that instead of the add checkbox.
  const _existingTask=_subLinkedTask(b, s);

  const showAmount = !s.perHead && !s.perItem && !s._planHolder;
  const hasPerItem = !!s.perItem;
  const hasPerHead = !!s.perHead;
  const hasDiscount = Number(s.discountPct||0)>0 || Number(s.discountAmt||0)>0;

  // Inline style helpers
  const INP = `width:62px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right`;
  const INP_W = `width:80px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right`;
  const CALC = `background:var(--surface);border:.5px solid var(--border);border-radius:9px;padding:11px`;
  const MU = `font-size:11.5px;color:var(--muted)`;
  const focus = `onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"`;

  // − remove link (top-right of each panel)
  const removeLink = (action) =>
    `<button type="button" onclick="${action}" style="border:none;background:none;color:var(--red);font-size:10.5px;cursor:pointer;padding:0;font-family:inherit">− remove</button>`;

  // + add link (shown when panel is hidden)
  const addLink = (id, label) =>
    `<button type="button" id="${id}-link" onclick="_siEditShow('${id}')" style="border:none;background:none;color:var(--gold-deep);font-size:11.5px;cursor:pointer;padding:0;text-align:left;font-family:inherit">+ ${label}</button>`;

  // Per Item panel — shown if sub already has perItem
  const perItemPanel = `<div id="si-edit-item-panel" style="display:${hasPerItem?'block':'none'}">
    <div style="${CALC}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Per Item</span>
        ${removeLink(`_siEditRemove('item','${pid}','${sid}')`)}
      </div>
      <div id="si-edit-item-eq" style="font-size:11.5px;color:var(--muted);margin-bottom:8px">${hasPerItem?`${Number(s.itemCount||0)} × $${Number(s.pricePerItem||0).toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(Number(s.itemCount||0)*Number(s.pricePerItem||0))}</strong>`:''}</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="${MU}">Items</span>
        <input type="number" id="si-edit-icount" value="${s.itemCount||''}" placeholder="0" min="0"
          style="${INP}" oninput="_siEditItemCalc()" ${focus}/>
        <span style="${MU}">×  $</span>
        <input type="number" id="si-edit-ppitem" value="${s.pricePerItem||''}" placeholder="0.00" min="0" step="0.01"
          style="${INP_W}" oninput="_siEditItemCalc()" ${focus}/>
        <span style="${MU}">per item</span>
      </div>
    </div>
  </div>`;
  const perItemLink = `<div id="si-edit-item-link-row" style="display:none"></div>`;

  // Per Head panel — shown if sub already has perHead
  const perHeadPanel = `<div id="si-edit-head-panel" style="display:${hasPerHead?'block':'none'}">
    <div style="${CALC}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Per Head</span>
        ${removeLink(`_siEditRemove('head','${pid}','${sid}')`)}
      </div>
      <div id="si-edit-head-eq" style="font-size:11.5px;color:var(--muted);margin-bottom:8px">${hasPerHead?`${Number(s.guestCount||0)} × $${Number(s.pricePerHead||0).toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(Number(s.guestCount||0)*Number(s.pricePerHead||0))}</strong>`:''}</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="${MU}">Guests</span>
        <input type="number" id="si-edit-gcount" value="${s.guestCount||''}" placeholder="0" min="0"
          style="${INP}" oninput="_siEditHeadCalc()" ${focus}/>
        <span style="${MU}">×  $</span>
        <input type="number" id="si-edit-pphead" value="${s.pricePerHead||''}" placeholder="0.00" min="0" step="0.01"
          style="${INP_W}" oninput="_siEditHeadCalc()" ${focus}/>
        <span style="${MU}">per head</span>
      </div>
      <div id="si-edit-head-hint" style="font-size:10px;color:var(--muted);margin-top:5px;display:${hasPerItem?'block':'none'}">$/head auto-filled from Per Item × price</div>
    </div>
  </div>`;
  const perHeadLink = `<div id="si-edit-head-link-row" style="display:none"></div>`;

  // Discount panel — hidden by default, shown if discount already set
  const discPanel = `<div id="si-edit-disc-panel" style="display:${hasDiscount?'block':'none'}">
    <div style="${CALC}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Discount</span>
        ${removeLink(`_siEditRemove('disc','${pid}','${sid}')`)}
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:4px">
          <input type="number" id="sub-edit-disc-pct" value="${s.discountPct||''}" placeholder="0" min="0" max="100" step="0.01"
            style="width:58px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
            oninput="if(Number(this.value)>0){const a=document.getElementById('sub-edit-disc-amt');if(a)a.value='';}"
            ${focus}/>
          <span style="${MU}">%</span>
        </div>
        <span style="font-size:11px;color:var(--muted)">or</span>
        <div style="display:flex;align-items:center;gap:4px">
          <span style="${MU}">$</span>
          <input type="number" id="sub-edit-disc-amt" value="${s.discountAmt||''}" placeholder="0.00" min="0" step="0.01"
            style="width:72px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--cream);color:var(--ink);text-align:right"
            oninput="if(Number(this.value)>0){const p=document.getElementById('sub-edit-disc-pct');if(p)p.value='';}"
            ${focus}/>
          <span style="${MU}">off</span>
        </div>
      </div>
    </div>
  </div>`;
  const discLink = `<div id="si-edit-disc-link-row" style="display:none"></div>`;

  const amountField = showAmount
    ? `<div class="form-group"><label class="form-label">Amount ($)</label><input class="form-input" type="number" id="sub-edit-amount" value="${s.amount?String(s.amount):''}" placeholder="0" onkeydown="if(event.key==='Enter'){event.preventDefault();_saveSubItemEdit('${pid}','${sid}');}"/></div>`
    : '';
  const dueField = `<div class="form-group"><label class="form-label">Due date</label><input class="form-input" type="date" id="sub-edit-due" value="${_escAttr(s.balanceDueDate||'')}" oninput="_beAddTaskDateToggle()"/></div>`;

  const hasUrl = !!(s.url);
  const chipItem = `<button type="button" id="si-edit-chip-item" class="si-chip${hasPerItem?' on':''}" onclick="_siEditToggleChip('item','${pid}','${sid}')">${hasPerItem?'✓ Per item':'+ Per item'}</button>`;
  const chipHead = `<button type="button" id="si-edit-chip-head" class="si-chip${hasPerHead?' on':''}" onclick="_siEditToggleChip('head','${pid}','${sid}')">${hasPerHead?'✓ Per head':'+ Per head'}</button>`;
  const chipDisc = `<button type="button" id="si-edit-chip-disc" class="si-chip${hasDiscount?' on':''}" onclick="_siEditToggleChip('disc','${pid}','${sid}')">${hasDiscount?'✓ Discount':'+ Discount'}</button>`;
  const chipStrip = `<div class="si-chips">${chipItem}${chipHead}<span class="si-chip-sep"></span>${chipDisc}</div>`;

  const urlField = `<div id="si-edit-url-panel" style="display:${hasUrl?'block':'none'}">${_urlFieldHtml('si-edit-url', s.url||'')}</div>
    <div id="si-edit-url-link" style="display:${hasUrl?'none':'block'}"><button type="button" onclick="document.getElementById('si-edit-url-panel').style.display='block';document.getElementById('si-edit-url-link').style.display='none';document.getElementById('si-edit-url')?.focus()" style="border:none;background:none;color:var(--gold-deep);font-size:11.5px;cursor:pointer;padding:0;font-family:inherit">+ Add URL</button></div>`;

  // Already linked to a task → quiet note (with a View link). Otherwise the standard
  // "Also add a checklist task" block, reusing the same helper as the Add Sub-item modal.
  const taskBlock = _existingTask
    ? `<div style="display:flex;align-items:center;gap:8px;background:rgba(74,124,89,.10);border:.5px solid var(--border);border-radius:9px;padding:9px 11px">
         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
         <span style="font-size:12px;color:var(--ink)">Linked to task <strong>“${_escHtml(_existingTask.text||'Untitled task')}”</strong></span>
         <button type="button" onclick="closeModalDirect();_focusChecklistTask('${_existingTask.id}')" style="margin-left:auto;border:none;background:none;color:var(--gold-deep);font-size:11.5px;cursor:pointer;padding:0;font-family:inherit">View</button>
       </div>`
    : _beAddTaskBlockHtml('sub-title-edit', {dateField:'sub-edit-due', urlField:'si-edit-url'});

  openModal('Edit',
    `<div style="display:flex;flex-direction:column;gap:12px">
      <div class="form-group" style="margin:0"><label class="form-label">Name</label><input class="form-input" id="sub-title-edit" value="${_escAttr(s.name||'')}" placeholder="Sub-item name" onkeydown="if(event.key==='Enter'){event.preventDefault();_saveSubItemEdit('${pid}','${sid}');}"/></div>
      ${amountField}
      ${chipStrip}
      ${perItemPanel}${perItemLink}
      ${perHeadPanel}${perHeadLink}
      ${discPanel}${discLink}
      ${dueField}
      ${urlField}
      ${taskBlock}
    </div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-primary" onclick="_saveSubItemEdit('${pid}','${sid}')">Save</button>`);
  setTimeout(()=>{ const el=document.getElementById('sub-title-edit'); if(el){ el.focus(); el.select(); } },0);
  // If per-item is active on open, prime the auto-fill immediately
  if(hasPerItem) _siEditItemCalc();
}
// Show a calc panel and hide its add-link row.
function _siEditShow(id){
  const panel=document.getElementById(id+'-panel');
  const linkRow=document.getElementById(id+'-link-row');
  if(panel) panel.style.display='block';
  if(linkRow) linkRow.style.display='none';
  // When showing Per Item, also update the auto-fill hint visibility
  if(id==='si-edit-item'){
    const hint=document.getElementById('si-edit-head-hint');
    if(hint) hint.style.display='block';
    _siEditItemCalc();
  }
}
// Remove a calc panel: clear its values, hide the panel, show the add-link.
function _siEditRemove(type, pid, sid){
  const panel=document.getElementById('si-edit-'+type+'-panel');
  const linkRow=document.getElementById('si-edit-'+type+'-link-row');
  if(panel) panel.style.display='none';
  if(linkRow) linkRow.style.display='block';
  if(type==='item'){
    // Unlock the $/head field if per-head is still open
    const ph=document.getElementById('si-edit-pphead');
    if(ph){ ph.readOnly=false; ph.style.color=''; ph.style.fontStyle=''; }
    const hint=document.getElementById('si-edit-head-hint');
    if(hint) hint.style.display='none';
    const eq=document.getElementById('si-edit-item-eq'); if(eq) eq.innerHTML='';
  }
  if(type==='head'){
    const eq=document.getElementById('si-edit-head-eq'); if(eq) eq.innerHTML='';
  }
  if(type==='disc'){
    const dp=document.getElementById('sub-edit-disc-pct'); if(dp) dp.value='';
    const da=document.getElementById('sub-edit-disc-amt'); if(da) da.value='';
  }
}
// Unified chip toggle for Edit Sub-item: item | head | disc.
function _siEditToggleChip(type, pid, sid){
  const chip=document.getElementById('si-edit-chip-'+type);
  const isOn=chip&&chip.classList.contains('on');
  const nowOn=!isOn;
  if(type==='item'||type==='head'){
    const id='si-edit-'+type;
    const panel=document.getElementById(id+'-panel');
    if(panel) panel.style.display=nowOn?'block':'none';
    if(chip){ chip.classList.toggle('on',nowOn); chip.textContent=nowOn?'✓ Per '+(type==='item'?'item':'head'):'+ Per '+(type==='item'?'item':'head'); }
    if(type==='item'){
      if(nowOn){ const hint=document.getElementById('si-edit-head-hint'); if(hint) hint.style.display='block'; _siEditItemCalc(); }
      else {
        const ph=document.getElementById('si-edit-pphead'); if(ph){ ph.readOnly=false; ph.style.color=''; ph.style.fontStyle=''; }
        const hint=document.getElementById('si-edit-head-hint'); if(hint) hint.style.display='none';
        const eq=document.getElementById('si-edit-item-eq'); if(eq) eq.innerHTML='';
      }
    } else {
      if(!nowOn){ const eq=document.getElementById('si-edit-head-eq'); if(eq) eq.innerHTML=''; }
    }
  } else if(type==='disc'){
    const panel=document.getElementById('si-edit-disc-panel');
    if(panel) panel.style.display=nowOn?'block':'none';
    if(chip){ chip.classList.toggle('on',nowOn); chip.textContent=nowOn?'✓ Discount':'+ Discount'; }
    if(!nowOn){ const dp=document.getElementById('sub-edit-disc-pct'); if(dp) dp.value=''; const da=document.getElementById('sub-edit-disc-amt'); if(da) da.value=''; }
  }
}

function _siEditItemCalc(){
  const c=Number(document.getElementById('si-edit-icount')?.value)||0;
  const p=Number(document.getElementById('si-edit-ppitem')?.value)||0;
  const total=c*p;
  const eq=document.getElementById('si-edit-item-eq');
  if(eq) eq.innerHTML=`${c} × $${p.toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(total)}</strong>`;
  // Auto-fill $/head if per-head panel is visible
  const headPanel=document.getElementById('si-edit-head-panel');
  const ph=document.getElementById('si-edit-pphead');
  if(headPanel && headPanel.style.display!=='none' && ph){
    ph.value=total>0?total.toFixed(2):'';
    ph.readOnly=true; ph.style.color='var(--muted)'; ph.style.fontStyle='italic';
    _siEditHeadCalc();
  }
}
// Live calc for Per Head panel.
function _siEditHeadCalc(){
  const g=Number(document.getElementById('si-edit-gcount')?.value)||0;
  const p=Number(document.getElementById('si-edit-pphead')?.value)||0;
  const eq=document.getElementById('si-edit-head-eq');
  if(eq) eq.innerHTML=`${g} × $${p.toFixed(2)} = <strong style="color:var(--gold-deep)">${fmt(g*p)}</strong>`;
}
function _saveSubItemEdit(pid, sid){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s){ closeModalDirect(); return; }
  // Name
  const nameEl=document.getElementById('sub-title-edit');
  if(nameEl) s.name = nameEl.value.trim() || s.name;
  // Amount (flat only — not visible when per-head/per-item active)
  const amtEl=document.getElementById('sub-edit-amount');
  if(amtEl){ s.amount=Number(amtEl.value)||0; _resplitSubInstallments(s); }
  // Per Item — only save if panel is visible
  const itemPanel=document.getElementById('si-edit-item-panel');
  const icEl=document.getElementById('si-edit-icount');
  const ppiEl=document.getElementById('si-edit-ppitem');
  if(itemPanel && itemPanel.style.display!=='none' && icEl && ppiEl){
    s.perItem=true; s.perHead=false;
    s.itemCount=Number(icEl.value)||0;
    s.pricePerItem=Number(ppiEl.value)||0;
  } else if(itemPanel && itemPanel.style.display==='none'){
    // Panel was removed
    s.perItem=false; s.itemCount=0; s.pricePerItem=0;
  }
  // Per Head — save if panel visible; $/head may have been auto-filled from per-item
  const headPanel=document.getElementById('si-edit-head-panel');
  const gcEl=document.getElementById('si-edit-gcount');
  const pphEl=document.getElementById('si-edit-pphead');
  if(headPanel && headPanel.style.display!=='none' && gcEl && pphEl){
    s.perHead=true;
    s.guestCount=Number(gcEl.value)||0;
    s.pricePerHead=Number(pphEl.value)||0;
    // When per-item is also active, store combined mode: perItem drives the $/head calc
    if(itemPanel && itemPanel.style.display!=='none'){
      // Keep both flags so getSubItemAmount uses perHead (which has the combined total)
      s.perItem=false; // perHead now holds the combined calc
    }
  } else if(headPanel && headPanel.style.display==='none'){
    s.perHead=false; s.guestCount=0; s.pricePerHead=0;
  }
  // Discount — read if panel visible, clear if removed
  const discPanel=document.getElementById('si-edit-disc-panel');
  const dPctEl=document.getElementById('sub-edit-disc-pct');
  const dAmtEl=document.getElementById('sub-edit-disc-amt');
  if(discPanel && discPanel.style.display!=='none' && dPctEl && dAmtEl){
    const dp=Number(dPctEl.value)||0;
    const da=Number(dAmtEl.value)||0;
    if(dp>0){ s.discountPct=dp; s.discountAmt=0; }
    else if(da>0){ s.discountAmt=da; s.discountPct=0; }
    else { s.discountPct=0; s.discountAmt=0; }
  } else if(discPanel && discPanel.style.display==='none'){
    s.discountPct=0; s.discountAmt=0;
  }
  // Due date
  const dueEl=document.getElementById('sub-edit-due');
  if(dueEl){
    const v=dueEl.value||'';
    s.balanceDueDate=v;
    s.showDueDate = !!v || s.showDueDate;
    if(!v && !s.showDueDate) s.showDueDate=false;
  }
  // URL — only save if panel was revealed (field exists in DOM)
  const urlEl=document.getElementById('si-edit-url');
  if(urlEl) s.url=_normalizeUrl(urlEl.value||'');
  applyAutoFromSubs(b);
  // "Also add a checklist task" — only present when the sub wasn't already linked.
  _beCreateTaskIfRequested(pid, sid, s.balanceDueDate||b.balanceDueDate||'', s.name);
  saveToStorage();
  closeModalDirect();
  navigate('budget');
}

// Auto-toggle "from subs" on when a sub-item amount is entered, unless manually turned off.
// Resets the manual-off memory when all sub-item amounts are cleared.
function applyAutoFromSubs(b){
  if(!b) return;
  const anyPositive=(b.subItems||[]).some(s=>getSubItemAmount(s)>0);
  if(anyPositive){
    if(!b.totalFromSubsManualOff) b.totalFromSubs=true;
    if(!b.depositFromSubsManualOff) b.depositFromSubs=true;
  } else {
    // No sub-item amounts left → clear the manual-off memory so it can auto-on again later
    b.totalFromSubsManualOff=false;
    b.depositFromSubsManualOff=false;
  }
}
function updateSubItemAmount(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(s){ s.amount=Number(val)||0; _resplitSubInstallments(s); applyAutoFromSubs(b); saveToStorage(); }
}
function commitSubAmount(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s) return;
  s.amount=Number(val)||0;
  // If this sub-item carries an auto-split installment plan, recalculate the unpaid
  // installments to match the new amount (manual plans are left as-is).
  _resplitSubInstallments(s);
  applyAutoFromSubs(b);
  // Only lock to text if a positive amount was entered; otherwise stay in edit mode
  if(Number(s.amount)>0){ subAmountEditing.delete(sid); }
  updateBudgetSummary(); navigate('budget');
}
function editSubAmount(pid,sid){
  closeDots();
  subAmountEditing.add(sid);
  navigate('budget');
  setTimeout(()=>{ const el=document.getElementById('subamt-'+sid); if(el){ el.focus(); el.select(); } },0);
}
function commitSubDeposit(pid,sid,val){
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s) return;
  s.deposit=Number(val)||0;
  if(Number(s.deposit)>0){ subDepEditing.delete(sid); }
  updateBudgetSummary(); navigate('budget');
}
function editSubDeposit(pid,sid){
  subDepEditing.add(sid);
  navigate('budget');
  setTimeout(()=>{ const el=document.getElementById('subdep-'+sid); if(el){ el.focus(); el.select(); } },0);
}
function _esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function _tasksLinkedToSub(bid,sid){ return STATE.checklist.filter(c=>c.budgetId===bid && c.budgetSubId===sid); }
function deleteSubItem(pid,sid){
  const b=STATE.budget.items.find(x=>x.id===pid);
  if(!b||!b.subItems)return;
  const s=b.subItems.find(x=>x.id===sid);
  const linked=_tasksLinkedToSub(pid,sid);
  if(linked.length){
    const n=linked.length;
    openModal('Remove sub-item?',
      `<div style="font-size:13px;color:var(--muted);line-height:1.55">${n>1?'<b style="color:var(--ink)">'+n+' checklist tasks are</b> linked':'A checklist task is linked'} to <b style="color:var(--ink)">"${_esc(s?s.name:'')}"</b>. Move the link up to the category <b style="color:var(--ink)">"${_esc(b.name)}"</b>, or remove the link entirely?</div>`,
      `<div style="display:flex;flex-direction:column;gap:8px;width:100%">
        <button class="btn btn-primary" onclick="confirmDeleteSubItem('${pid}','${sid}','move')">Move link to category</button>
        <button class="btn btn-outline" onclick="confirmDeleteSubItem('${pid}','${sid}','unlink')" style="color:var(--gold-deep)">Remove link &amp; delete</button>
        <button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
      </div>`);
    return;
  }
  _confirmDeleteDialog({title:'Remove Sub-item', question:'Remove this sub-item?', name:s?s.name:'', verb:'Remove', onConfirmJs:`confirmDeleteSubItem('${pid}','${sid}')`});
}
function confirmDeleteSubItem(pid,sid,linkAction){
  const _bp=STATE.budget.items.find(x=>x.id===pid);
  const _s0=_bp&&_bp.subItems?_bp.subItems.find(x=>x.id===sid):null;
  const _label=_s0?(_s0.name||'sub-item'):'sub-item';
  closeModalDirect();
  _undoableDelete(_label, ()=>{
  const b=STATE.budget.items.find(x=>x.id===pid);
  if(!b||!b.subItems)return;
  const linked=_tasksLinkedToSub(pid,sid);
  linked.forEach(t=>{
    if(linkAction==='move'){ t.budgetSubId=''; /* keep budgetId -> link to category */ }
    else { t.budgetId=''; t.budgetSubId=''; }
  });
  b.subItems=b.subItems.filter(x=>x.id!==sid);
  applyAutoFromSubs(b);
  }, 'budget');
}

// ══════════════════════════════════════════════
