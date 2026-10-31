// PAYMENTS EDITOR (Phase 2) — deposit + installments on a sub-item
// Opened from the sub-item ··· menu ("Payments…"). Edits a working copy in
// _payCtx; nothing is written to STATE until Save.
// ═══════════════════════════════════════════════════════════════════════════
let _payCtx=null;
function _payAddDays(iso, days){
  const d = iso ? new Date(iso+'T00:00:00') : new Date();
  d.setDate(d.getDate()+days);
  const o=d.getTimezoneOffset();
  return new Date(d.getTime()-o*60000).toISOString().slice(0,10);
}
function _payParseAmt(v){ return Number(String(v==null?'':v).replace(/[^0-9.-]/g,''))||0; }
function _payNewId(){ return 'in'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
// Add whole months to an ISO date, clamping day-of-month (e.g. Jan 31 +1mo → Feb 28/29).
function _payAddMonths(iso, months){
  const base = iso ? new Date(iso+'T00:00:00') : new Date();
  const y=base.getFullYear(), m=base.getMonth(), d=base.getDate();
  const target=new Date(y, m+months, 1);
  const dim=new Date(target.getFullYear(), target.getMonth()+1, 0).getDate();
  target.setDate(Math.min(d, dim));
  const o=target.getTimezoneOffset();
  return new Date(target.getTime()-o*60000).toISOString().slice(0,10);
}
// Resolve the anchor (first-payment) ISO date from the scheduling controls.
function _payAnchorDate(c){
  const today=_todayISO();
  if(c.firstMode==='today') return today;
  if(c.firstMode==='2w') return _payAddDays(today, 14);
  // custom
  if(c.customKind==='days') return _payAddDays(today, Math.max(0, Math.round(Number(c.firstDays||0))));
  return c.firstDate || today;
}
// Advance an ISO date to the next occurrence of a weekday (0=Mon…6=Sun).
// Always moves at least 1 day forward (never stays on the same day).
function _payNextDow(iso, targetDow){
  const d = new Date((iso||_todayISO())+'T00:00:00');
  const jsDow = d.getDay(); // JS: 0=Sun…6=Sat
  const monBased = (jsDow + 6) % 7; // convert to 0=Mon…6=Sun
  let diff = targetDow - monBased;
  if(diff <= 0) diff += 7; // always at least 1 day ahead
  d.setDate(d.getDate() + diff);
  const o = d.getTimezoneOffset();
  return new Date(d.getTime() - o*60000).toISOString().slice(0,10);
}
// Step from the anchor by index i, using the chosen gap.
// When bnplDowOn is set and i>=1, snap to the chosen weekday after the interval.
function _payDateForIndex(c, i){
  const anchor=_payAnchorDate(c);
  if(i===0) return anchor;
  let base;
  if(c.gapMode==='monthly'){
    base = _payAddMonths(anchor, i);
  } else {
    const gap = c.gapMode==='weekly' ? 7
              : c.gapMode==='custom' ? Math.max(1, Math.round(Number(c.gapDays||14)))
              : 14; // fortnightly
    base = _payAddDays(anchor, gap*i);
  }
  // If day-of-week mode active, snap to chosen weekday on or after the interval date
  if(c.bnplDowOn && typeof c.bnplDow==='number'){
    return _payNextDow(base, c.bnplDow);
  }
  return base;
}
// Recompute every row's dueDate from the scheduling controls (amounts/labels untouched).
function _payRecalcDates(){
  const c=_payCtx; if(!c||!c.rows.length) return;
  c.rows.forEach((r,i)=>{ r.dueDate=_payDateForIndex(c, i); });
}
// Amount left for installments to cover = sub-item total minus the deposit (when on).
function _payRemaining(){
  const c=_payCtx; if(!c) return 0;
  // Base is the editable Full amount; fall back to the sub-item amount or task $amount.
  let sub=Number(c.fullAmount||0);
  if(!(sub>0)) sub=_paySubAmount();
  if(!(sub>0) && Number(c.taskAmount||0)>0) sub=Number(c.taskAmount);
  const dep=c.depOn ? Number(c.depAmount||0) : 0;
  return Math.max(0, sub - dep);
}
// Split the remaining balance evenly across the rows; last row absorbs rounding.
function _payEvenSplit(){
  const c=_payCtx; if(!c||!c.rows.length) return;
  const rem=_payRemaining();
  const n=c.rows.length;
  const each = n>0 ? Math.floor((rem/n)*100)/100 : 0;
  const last = n>0 ? Math.round((rem-each*(n-1))*100)/100 : 0;
  c.rows.forEach((r,i)=>{ r.amount = (i===n-1) ? last : each; });
}

function openPaymentsEditor(pid, sid, prefillDeposit, opts){
  if(_sbSession && typeof _uvRequirePaid==='function' && !_uvRequirePaid('budgetPayments')) return;
  _adoptPopupBack();
  const b=STATE.budget.items.find(x=>x.id===pid);
  const s=b?.subItems?.find(x=>x.id===sid);
  if(!s){ _popupBack=null; return; }
  if(typeof closeDots==='function') closeDots();
  _popupOrigin=_currentPage;
  // "Pay in installments instead" entry points pass forceInstallments — open with
  // installments ON and the deposit toggle OFF (installments replace the deposit).
  const forceInst = !!(opts && opts.forceInstallments);
  const hasDep = !!(s.showDeposit || Number(s.deposit||0)>0 || s.depositDueDate);
  // When invoked with a suggested deposit (e.g. from the "Add a deposit?" prompt)
  // and the sub-item has none yet, seed the deposit toggle + amount.
  const seedDep = (!hasDep && Number(prefillDeposit||0)>0);
  // Auto-fill source for installments: if this sub-item has no amount of its own
  // yet, fall back to a $amount mentioned in the linked checklist task's title or
  // notes (larger of the two). Never overrides an existing sub-item amount.
  let taskAmount=0;
  try{
    const subHasAmount = Number(getSubItemAmount(s)||0) > 0;
    if(!subHasAmount){
      const t=(STATE.checklist||[]).find(x=>x.budgetId===pid && x.budgetSubId===sid);
      if(t){
        const fromTitle=_extractDollarAmount(t.text||'');
        const fromNotes=_extractDollarAmount(t.notes||'');
        taskAmount=Math.max(Number(fromTitle||0), Number(fromNotes||0));
      }
    }
  }catch(e){ taskAmount=0; }
  _payCtx={
    pid, sid,
    depOn: forceInst ? false : (hasDep || seedDep),
    depAmount: seedDep ? Number(prefillDeposit) : Number(s.deposit||0),
    depDue: s.depositDueDate||'',
    taskAmount: taskAmount,
    // The "Full amount" the plan splits: the sub-item's own amount if set, else the
    // seed passed in (the category's committed amount), else a task-derived $amount.
    fullAmount: Number(getSubItemAmount(s)||0) || Number(opts&&opts.seedAmount||0) || Number(taskAmount||0) || 0,
    instOn: forceInst ? true : !!(s.installments && s.installments.length),
    plan: s.installmentPlan||'',
    autoCheckPassed: (s.autoCheckPassed===true?true:(s.autoCheckPassed===false?false:null)),
    rows: (s.installments||[]).map(i=>({id:i.id||_payNewId(), label:i.label||'', amount:Number(i.amount||0), dueDate:i.dueDate||'', paid:!!i.paid, paidDate:i.paidDate||'', ...(i._userUnchecked?{_userUnchecked:true}:{})})),
    // Scheduling controls (first payment + repeat gap)
    firstMode: '2w',         // 'today' | '2w' | 'custom'
    customKind: 'date',      // 'date' | 'days'  (when firstMode === 'custom')
    firstDate: '',           // ISO when customKind==='date'
    firstDays: 0,            // integer when customKind==='days'
    gapMode: 'fortnightly',  // 'weekly' | 'fortnightly' | 'monthly' | 'custom'
    gapDays: 14,             // integer when gapMode==='custom'
    splitMode: (s.installmentSplitMode==='manual'?'manual':'auto'),  // 'auto' | 'manual'
    // BNPL day-of-week scheduling (Pay-in-4 / Afterpay only)
    bnplDowOn: !!(s.bnplDowOn),   // true = snap payments 2-4 to a weekday
    bnplDow:   (typeof s.bnplDow==='number' ? s.bnplDow : 1) // 0=Mon…6=Sun; default Tue
  };
  _renderPaymentsEditor();
}
function _paySubAmount(){
  const b=STATE.budget.items.find(x=>x.id===_payCtx.pid);
  const s=b?.subItems?.find(x=>x.id===_payCtx.sid);
  return s ? getSubItemAmount(s) : 0;
}
function _renderPaymentsEditor(){
  const c=_payCtx; if(!c) return;
  const b=STATE.budget.items.find(x=>x.id===c.pid);
  const s=b?.subItems?.find(x=>x.id===c.sid);
  if(!s){ closeModalDirect(); return; }
  const subAmt=_paySubAmount();
  const path=`${_escHtml(b.name)} › ${_escHtml(s.name)}`;
  const depToggle=_payToggleHtml('pay-dep', c.depOn);
  const depFields = c.depOn ? `
    <div style="padding:2px 2px 0">
      <div style="font-size:11px;color:var(--muted);margin:6px 0 3px">Deposit amount</div>
      <input id="pay-dep-amt" class="form-input" inputmode="decimal" value="${c.depAmount?(_curSym()+c.depAmount):''}" placeholder="${_curSym()}0" style="font-size:12.5px;height:34px;margin-bottom:8px" oninput="_payStash()" onchange="_payDepositChanged()"/>
      <div style="font-size:11px;color:var(--muted);margin:0 0 3px">Due date</div>
      <input id="pay-dep-due" class="form-input" type="date" value="${c.depDue||''}" style="font-size:12.5px;height:34px" onchange="_payStash()"/>
    </div>` : '';
  let instInner='';
  if(c.instOn){
    if(!c.plan && !c.rows.length){
      instInner=`
        <div style="font-size:11px;color:var(--muted);margin:6px 0 7px">Choose a plan</div>
        <div style="display:flex;gap:7px;flex-wrap:wrap">
          ${_payPresetChip('pay-in-4','Pay in 4','grid')}
          ${_payPresetChip('afterpay','Afterpay','clock')}
          ${_payPresetChip('custom','Custom','plus')}
        </div>`;
    } else {
      const rowsHtml=c.rows.map((r,idx)=>_payRowHtml(r,idx)).join('');
      const scheduled = c.rows.reduce((x,r)=>x+Number(r.amount||0),0);
      const dep = c.depOn?Number(c.depAmount||0):0;
      const remaining = _payRemaining();
      // Effective total = sub-item's own amount, or the task $amount fallback when
      // the sub-item has none yet (so the breakdown matches the split rows).
      const effTotal = (subAmt>0) ? subAmt : Number(c.taskAmount||0);
      const totalFromTask = !(subAmt>0) && Number(c.taskAmount||0)>0;
      const over = remaining>0 && scheduled>remaining+0.5;
      const schedBlock = c.rows.length>=2 ? _payScheduleBlock(c) : '';
      // Status line: auto-split vs manual, with a re-split link in manual mode.
      const statusLine = `<div style="display:flex;align-items:center;gap:7px;font-size:10.5px;margin:0 0 7px;padding-left:1px">
        ${c.splitMode==='auto'
          ? `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--green);font-weight:600;text-transform:uppercase;letter-spacing:.05em"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/></svg>Auto-split</span>`
          : `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>Manual amounts</span><span onclick="_payResplit()" style="margin-left:auto;color:var(--gold-deep);text-decoration:underline;cursor:pointer">↺ Re-split evenly</span>`}
      </div>`;
      // Breakdown layout.
      const balanceAfterDep = remaining;            // total − deposit
      const leftToAllocate = balanceAfterDep - scheduled; // total − deposit − scheduled
      const allocColor = leftToAllocate < -0.5 ? '#C57B6A' : 'var(--ink)';
      const schColor = over ? '#C57B6A' : 'var(--gold-deep)';
      const breakdown = `<div style="font-size:11px;color:var(--muted);background:var(--surface);border-radius:8px;padding:8px 10px;margin-top:8px;line-height:1.6">
        <div style="display:flex;justify-content:space-between"><span>Sub-item total${totalFromTask?' <span style="color:var(--gold-deep)">(from task)</span>':''}</span><b style="color:var(--ink);font-weight:600">${fmt(effTotal)}</b></div>
        ${dep>0?`<div style="display:flex;justify-content:space-between"><span>Less deposit</span><b style="color:var(--ink);font-weight:600">− ${fmt(dep)}</b></div>`:''}
        ${dep>0?`<div style="display:flex;justify-content:space-between"><span>Balance after deposit</span><b style="color:var(--ink);font-weight:600">${fmt(balanceAfterDep)}</b></div>`:''}
        <div style="border-top:1px solid var(--border);margin:5px 0"></div>
        ${c.splitMode==='manual'
          ? `<div style="display:flex;justify-content:space-between;color:${schColor}"><span>You've scheduled</span><b id="pay-bd-scheduled" style="color:${schColor};font-weight:600">${fmt(scheduled)}</b></div>
             <div style="display:flex;justify-content:space-between"><span>Remaining to schedule</span><b id="pay-bd-remaining" style="color:${allocColor};font-weight:600">${fmt(leftToAllocate)}</b></div>`
          : `<div style="display:flex;justify-content:space-between"><span>Split across installments</span><b style="color:var(--ink);font-weight:600">${fmt(balanceAfterDep)}</b></div>`}
      </div>`;
      instInner=`
        ${schedBlock}
        ${statusLine}
        <div style="border:.5px solid var(--border);border-radius:10px;overflow:hidden;margin:0 0 8px">${rowsHtml}</div>
        <button type="button" onclick="_payAddRow()" style="font-size:12px;color:var(--gold-deep);background:none;border:none;cursor:pointer;padding:5px 2px;display:inline-flex;align-items:center;gap:5px;font-weight:500;font-family:'Inter'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Add payment</button>
        ${_payAutoCheckRow(c)}
        ${breakdown}
        ${over?`<div style="font-size:10.5px;color:#C57B6A;margin-top:6px">Scheduled payments exceed the remaining balance by ${fmt(scheduled-remaining)}.</div>`:''}`;
    }
  }
  const body=`<div style="padding:2px">
    <div style="font-size:11.5px;color:var(--gold-deep);margin-bottom:12px">${path}${Number(c.fullAmount||0)>0?` · ${fmt(c.fullAmount)}`:''}</div>
    <div style="padding:9px 12px;background:var(--cream);border:.5px solid ${Number(c.fullAmount||0)>0?'var(--gold)':'var(--border)'};border-radius:9px;margin-bottom:12px">
      <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Full amount</div>
      <input id="pay-full-amt" class="form-input" inputmode="decimal" value="${c.fullAmount?(_curSym()+c.fullAmount):''}" placeholder="${_curSym()}0" style="font-size:13px;font-weight:600;height:34px" oninput="_payStash()" onchange="_payFullAmountChanged(this.value)"/>
      <div style="font-size:10.5px;color:var(--muted);margin-top:4px">${_payFullAmountHint(b)}</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--cream);border:.5px solid var(--border);border-radius:9px;margin-bottom:${c.depOn?'8px':'12px'}">
      <span style="font-size:12.5px;color:var(--ink);font-weight:500">Deposit</span>${depToggle}
    </div>
    ${depFields}
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--cream);border:.5px solid var(--border);border-radius:9px;margin:12px 0 ${c.instOn?'4px':'0'}">
      <span style="font-size:12.5px;color:var(--ink);font-weight:500">Installments</span>${_payToggleHtml('pay-inst', c.instOn)}
    </div>
    ${instInner}
  </div>`;
  const footer=`${_popupBackBtnHtml()}<button class="btn btn-outline btn-sm" onclick="_payCancel()">Cancel</button>
    <button class="btn btn-primary btn-sm" onclick="_paySave()">Save</button>`;
  openModal('Payments', body, footer);
}
// Scheduling controls (first payment + repeat gap), shown above the rows when a plan has 2+ rows.
function _payScheduleBlock(c){
  const today=_todayISO();
  const optn=(mode,label,sub)=>{
    const sel=c.firstMode===mode;
    return `<label onclick="_paySetFirstMode('${mode}')" style="display:flex;align-items:center;gap:9px;padding:9px 11px;border:.5px solid ${sel?'var(--gold)':'var(--border)'};border-radius:9px;background:${sel?'rgba(196,168,130,.10)':'var(--cream)'};cursor:pointer;font-size:12px;color:var(--ink)">
      <span style="width:14px;height:14px;border-radius:50%;border:1.5px solid var(--gold);flex-shrink:0;position:relative">${sel?'<span class="pay-radio-dot"></span>':''}</span>
      ${label}${sub?`<span style="margin-left:auto;font-size:10.5px;color:var(--muted)">${sub}</span>`:''}
    </label>`;
  };
  let customBox='';
  if(c.firstMode==='custom'){
    const dateOn=c.customKind==='date';
    customBox=`<div style="padding:9px 11px;border:.5px dashed var(--border);border-radius:9px;margin:7px 0 0;background:var(--surface)">
      <span style="display:inline-flex;border:.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:8px">
        <button type="button" onclick="_paySetCustomKind('date')" style="font-size:11.5px;padding:5px 11px;border:none;cursor:pointer;background:${dateOn?'var(--gold)':'transparent'};color:${dateOn?'#fff':'var(--muted)'}">Pick a date</button>
        <button type="button" onclick="_paySetCustomKind('days')" style="font-size:11.5px;padding:5px 11px;border:none;cursor:pointer;background:${!dateOn?'var(--gold)':'transparent'};color:${!dateOn?'#fff':'var(--muted)'}">Days from today</button>
      </span>
      ${dateOn
        ? `<div style="display:flex;align-items:center;gap:8px"><span style="font-size:11.5px;color:var(--ink)">Date</span><input type="date" value="${c.firstDate||today}" onchange="_paySetFirstDate(this.value)" style="flex:1;font-size:12px;background:var(--cream);border:.5px solid var(--border);border-radius:7px;color:var(--ink);padding:6px 9px;font-family:'Inter'"/></div>`
        : `<div style="display:flex;align-items:center;gap:8px"><span style="font-size:11.5px;color:var(--ink)">First payment in</span><input inputmode="numeric" value="${c.firstDays||0}" onchange="_paySetFirstDays(this.value)" style="width:60px;text-align:right;font-size:12px;background:var(--cream);border:.5px solid var(--border);border-radius:7px;color:var(--ink);padding:6px 9px;font-family:'Inter'"/><span style="font-size:11.5px;color:var(--ink)">days</span></div>`}
    </div>`;
  }
  const gapChip=(mode,label)=>{
    const sel=c.gapMode===mode;
    return `<button type="button" onclick="_paySetGap('${mode}')" style="flex:1;text-align:center;font-size:11.5px;padding:7px 0;border-radius:8px;cursor:pointer;${sel?'background:var(--gold);color:#fff;border:.5px solid var(--gold)':'background:#FBF8F3;border:.5px solid #E3D7C4;color:var(--gold-deep)'}" class="${sel?'':'pay-gap-chip'}">${label}</button>`;
  };
  const gapCustom = c.gapMode==='custom'
    ? `<div style="display:flex;align-items:center;gap:8px;margin-top:7px"><span style="font-size:11.5px;color:var(--ink)">Every</span><input inputmode="numeric" value="${c.gapDays||14}" onchange="_paySetGapDays(this.value)" style="width:60px;text-align:right;font-size:12px;background:var(--cream);border:.5px solid var(--border);border-radius:7px;color:var(--ink);padding:6px 9px;font-family:'Inter'"/><span style="font-size:11.5px;color:var(--ink)">days</span></div>`
    : '';
  // Day-of-week section — only for Pay-in-4 and Afterpay
  const isBnpl = (c.plan==='pay-in-4' || c.plan==='afterpay');
  const DOW_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dowToggle = `<span style="display:inline-flex;align-items:center;gap:6px">
    <span style="font-size:10px;color:var(--muted)">${c.bnplDowOn?'On':'Off'}</span>
    <button type="button" onclick="_payToggleDow()" style="width:30px;height:17px;background:${c.bnplDowOn?'var(--gold)':'var(--border)'};border:none;border-radius:9px;position:relative;cursor:pointer;padding:0">
      <span style="position:absolute;top:2px;left:${c.bnplDowOn?'15px':'2px'};width:13px;height:13px;background:#fff;border-radius:50%;transition:left .15s"></span>
    </button></span>`;
  const dowDays = DOW_LABELS.map((lbl,i)=>{
    const sel = c.bnplDow===i;
    return `<button type="button" onclick="_paySetDow(${i})" style="font-size:9.5px;padding:5px 0;border-radius:6px;cursor:pointer;text-align:center;${sel?'background:var(--gold);border:.5px solid var(--gold);color:#fff':'background:#FBF8F3;border:.5px solid #E3D7C4;color:var(--gold-deep)'}">${lbl}</button>`;
  }).join('');
  // Live result hint — compute the 4 dates using the current state
  let dowHint = '';
  if(c.bnplDowOn && isBnpl && c.rows.length>=2){
    const labels = c.rows.map((r,i)=>{
      const d = _payDateForIndex(c, i);
      const prefix = i>0 ? DOW_LABELS[c.bnplDow]+' ' : '';
      return `Payment ${i+1}: ${prefix}${fmtBudgetDate(d)}`;
    }).join(' · ');
    dowHint = `<div style="font-size:10.5px;color:var(--gold-deep);background:rgba(196,168,130,.1);border-radius:6px;padding:6px 9px;margin-top:7px">${labels}</div>`;
  }
  const dowSection = !isBnpl ? '' : `
    <div style="border-top:.5px dashed var(--border);margin-top:10px;padding-top:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <span style="font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)">Schedule payments 2–4 on a set day</span>
        ${dowToggle}
      </div>
      <div style="font-size:10.5px;color:var(--muted);margin-bottom:${c.bnplDowOn?'8px':'0'}">BNPL providers often deduct on a fixed weekday. Payments 2–4 snap to the next chosen weekday after each interval.</div>
      ${c.bnplDowOn?`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${dowDays}</div>${dowHint}`:''}
    </div>`;
  return `<div style="margin:4px 0 10px">
    <div style="font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:0 0 6px">First payment</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${optn('today','Today', fmtBudgetDate(today))}
      ${optn('2w','In 2 weeks', fmtBudgetDate(_payAddDays(today,14)))}
      ${optn('custom','Custom date / days','')}
    </div>
    ${customBox}
    <div style="font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:11px 0 6px">Repeat every</div>
    <div style="display:flex;gap:6px">
      ${gapChip('weekly','Weekly')}
      ${gapChip('fortnightly','Fortnightly')}
      ${gapChip('monthly','Monthly')}
      ${gapChip('custom','Custom')}
    </div>
    ${gapCustom}
    ${dowSection}
  </div>`;
}
function _paySetFirstMode(m){ const c=_payCtx; if(!c) return; c.firstMode=m; _payRecalcDates(); _renderPaymentsEditor(); }
function _paySetCustomKind(k){ const c=_payCtx; if(!c) return; c.customKind=k; _payRecalcDates(); _renderPaymentsEditor(); }
function _paySetFirstDate(v){ const c=_payCtx; if(!c) return; c.firstDate=v||''; _payRecalcDates(); _renderPaymentsEditor(); }
function _paySetFirstDays(v){ const c=_payCtx; if(!c) return; c.firstDays=Math.max(0,Math.round(Number(v)||0)); _payRecalcDates(); _renderPaymentsEditor(); }
function _paySetGap(m){ const c=_payCtx; if(!c) return; c.gapMode=m; _payRecalcDates(); _renderPaymentsEditor(); }
function _paySetGapDays(v){ const c=_payCtx; if(!c) return; c.gapDays=Math.max(1,Math.round(Number(v)||14)); _payRecalcDates(); _renderPaymentsEditor(); }
function _payToggleDow(){ const c=_payCtx; if(!c) return; c.bnplDowOn=!c.bnplDowOn; _payRecalcDates(); _renderPaymentsEditor(); }
function _paySetDow(d){ const c=_payCtx; if(!c) return; c.bnplDow=d; _payRecalcDates(); _renderPaymentsEditor(); }
function _payToggleHtml(id, on){
  return `<span style="display:inline-flex;align-items:center;gap:8px">
      <span id="${id}-lbl" style="font-size:11px;color:var(--muted)">${on?'Yes':'No'}</span>
      <button type="button" id="${id}-sw" role="switch" aria-checked="${on?'true':'false'}" onclick="_payToggle('${id}')" style="width:34px;height:19px;background:${on?'var(--gold)':'var(--border)'};border:none;border-radius:10px;position:relative;cursor:pointer;padding:0">
        <span style="position:absolute;top:2px;left:${on?'17px':'2px'};width:15px;height:15px;background:#fff;border-radius:50%;transition:left .15s"></span>
      </button>
    </span>`;
}
function _payPresetChip(plan, label, icon){
  const icons={
    grid:'<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 10h18"></path>',
    clock:'<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    plus:'<path d="M12 5v14M5 12h14"></path>'
  };
  const paths=icons[icon]||icons.plus;
  return `<button type="button" onclick="_payPickPreset('${plan}')" class="pay-preset-chip"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>${label}</button>`;
}
function _payRowHtml(r, idx){
  const dateText = r.dueDate
    ? `Due ${fmtBudgetDate(r.dueDate)}`
    : 'No date set';
  const dateColor = r.dueDate ? 'var(--gold-deep)' : 'var(--muted)';
  const paid=!!r.paid;
  return `<div style="display:flex;flex-direction:column;gap:5px;padding:8px 10px;border-bottom:1px solid var(--border);background:var(--surface)">
    <div style="display:flex;align-items:center;gap:7px">
      <span onclick="_payTogglePaid(${idx})" title="${paid?'Mark unpaid':'Mark paid'}" style="width:18px;height:18px;border-radius:5px;border:1.5px solid ${paid?'var(--green)':'var(--gold)'};background:${paid?'var(--green)':'transparent'};flex:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer">${paid?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</span>
      <input value="${_escHtml(r.label)}" placeholder="Label" oninput="_payRowEdit(${idx},'label',this.value)" style="flex:1 1 70px;min-width:0;font-size:11.5px;background:transparent;border:none;border-bottom:1px solid var(--border);color:${paid?'var(--muted)':'var(--ink)'};padding:2px;font-family:'Inter';outline:none;${paid?'text-decoration:line-through':''}"/>
      <input value="${r.amount?(_curSym()+r.amount):''}" placeholder="${_curSym()}0" inputmode="decimal" oninput="_payRowEdit(${idx},'amount',this.value)" onchange="_payAmountCommitted(${idx})" style="width:62px;font-size:12px;background:var(--cream);border:.5px solid var(--border);border-radius:6px;color:var(--ink);padding:4px 6px;text-align:right;font-family:'Inter';outline:none"/>
      <label title="Change date" style="position:relative;width:30px;height:28px;border:.5px solid var(--border);border-radius:6px;background:var(--cream);display:inline-flex;align-items:center;justify-content:center;color:${r.dueDate?'var(--gold-deep)':'var(--muted)'};cursor:pointer;flex-shrink:0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <input type="date" value="${r.dueDate||''}" onchange="_payRowEdit(${idx},'dueDate',this.value)" style="position:absolute;inset:0;opacity:0;cursor:pointer"/>
      </label>
      <button type="button" onclick="_payDelRow(${idx})" title="Remove" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;line-height:1;padding:2px 4px;flex-shrink:0">×</button>
    </div>
    <div style="display:flex;align-items:center;gap:5px;padding-left:2px">
      ${paid
        ? `<span style="font-size:10.5px;color:var(--green);display:inline-flex;align-items:center;gap:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>${r.paidDate?('Paid '+(paidRelative(r.paidDate)||('on '+fmtBudgetDate(r.paidDate)))):'Paid'}</span>`
        : `<span style="font-size:10.5px;color:${dateColor};display:inline-flex;align-items:center;gap:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${dateText}</span>`}
    </div>
  </div>`;
}
// Toggle an installment row's paid state in the editor; stamps/clears the paid date.
function _payTogglePaid(idx){
  const c=_payCtx; if(!c||!c.rows[idx]) return;
  _payStash();
  const r=c.rows[idx];
  r.paid=!r.paid;
  r.paidDate = r.paid ? _todayISO() : '';
  // Mirror the row-level override: unticking a past-due row protects it from auto-check.
  if(!r.paid && r.dueDate && r.dueDate <= _todayISO()){ r._userUnchecked=true; }
  else { if(r._userUnchecked) delete r._userUnchecked; }
  _renderPaymentsEditor();
}
// Per-plan "auto-check passed dates" control: three states — Default (follow global),
// On, Off. Shows what Default currently resolves to.
function _payAutoCheckRow(c){
  const globalOn = !!(STATE.settings && STATE.settings.autoCheckPassedInstallments);
  const cur = (c.autoCheckPassed===true)?'on':(c.autoCheckPassed===false)?'off':'default';
  const seg=(val,label)=>{
    const on=cur===val;
    return `<button type="button" onclick="_paySetAutoCheck('${val}')" class="si-seg ${on?'on':'off'}" style="padding:5px 11px;font-size:11px">${label}</button>`;
  };
  return `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 2px;padding:9px 11px;background:var(--surface);border:.5px solid var(--border);border-radius:9px">
    <div style="flex:1;min-width:120px">
      <div style="font-size:12px;color:var(--ink);font-weight:500">Auto-check instalments as PAID on set payment date</div>
      <div style="font-size:10.5px;color:var(--muted);margin-top:1px">Default follows your setting (currently ${globalOn?'on':'off'}).</div>
    </div>
    <span style="display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden">${seg('default','Default')}${seg('on','On')}${seg('off','Off')}</span>
  </div>`;
}
function _paySetAutoCheck(val){
  const c=_payCtx; if(!c) return;
  _payStash();
  c.autoCheckPassed = val==='on'?true:(val==='off'?false:null);
  _renderPaymentsEditor();
}
function _payStash(){
  const c=_payCtx; if(!c) return;
  const f=document.getElementById('pay-full-amt'); if(f) c.fullAmount=_payParseAmt(f.value);
  const a=document.getElementById('pay-dep-amt'); if(a) c.depAmount=_payParseAmt(a.value);
  const d=document.getElementById('pay-dep-due'); if(d) c.depDue=d.value||'';
}
function _payToggle(id){
  const c=_payCtx; if(!c) return;
  _payStash();
  if(id==='pay-dep') c.depOn=!c.depOn;
  if(id==='pay-inst') c.instOn=!c.instOn;
  // Toggling the deposit changes the remaining balance — re-split if in auto mode.
  if(id==='pay-dep' && c.instOn && c.splitMode==='auto') _payEvenSplit();
  _renderPaymentsEditor();
}
// Deposit amount committed — in auto mode, re-split the installments live.
function _payDepositChanged(){
  const c=_payCtx; if(!c) return;
  _payStash();
  if(c.instOn && c.rows.length && c.splitMode==='auto') _payEvenSplit();
  _renderPaymentsEditor();
}
// Full amount edited — this is the total the plan splits. Re-split an auto plan to match.
function _payFullAmountChanged(val){
  const c=_payCtx; if(!c) return;
  c.fullAmount=_payParseAmt(val);
  if(c.instOn && c.rows.length && c.splitMode==='auto') _payEvenSplit();
  _renderPaymentsEditor();
}
// Hint under the Full amount field: note when it was auto-filled from the committed amount.
function _payFullAmountHint(b){
  const committed = b ? Number(calcBudgetCommitted(b)||0) : 0;
  const c=_payCtx;
  if(c && Number(c.fullAmount||0)>0 && committed>0 && Math.abs(Number(c.fullAmount)-committed)<0.5){
    return `Auto-filled from this category's committed amount — edit if needed.`;
  }
  return `The total this payment plan splits.`;
}
// Restore even auto-splitting (from manual mode, via "Re-split evenly").
function _payResplit(){
  const c=_payCtx; if(!c) return;
  c.splitMode='auto';
  _payEvenSplit();
  _renderPaymentsEditor();
}
function _payPickPreset(plan){
  const c=_payCtx; if(!c) return;
  c.plan=plan;
  if(plan==='pay-in-4' || plan==='afterpay'){
    const n=4;
    const labelBase = plan==='afterpay' ? 'Afterpay' : 'Payment';
    // Default schedule: first payment in 2 weeks, fortnightly thereafter.
    c.firstMode = c.firstMode || '2w';
    c.gapMode = (c.gapMode==='monthly'||c.gapMode==='weekly'||c.gapMode==='custom') ? c.gapMode : 'fortnightly';
    c.splitMode='auto';
    c.rows=[];
    for(let i=0;i<n;i++){
      c.rows.push({id:_payNewId(), label:`${labelBase} ${i+1}`, amount:0, dueDate:'', paid:false, paidDate:''});
    }
    _payEvenSplit();   // splits total − deposit evenly
    _payRecalcDates();
  } else {
    c.splitMode='manual';
    c.rows=[{id:_payNewId(), label:'Payment 1', amount:0, dueDate:'', paid:false, paidDate:''}];
  }
  _renderPaymentsEditor();
}
function _payAddRow(){
  const c=_payCtx; if(!c) return;
  c.rows.push({id:_payNewId(), label:`Payment ${c.rows.length+1}`, amount:0, dueDate:'', paid:false, paidDate:''});
  if(c.splitMode==='auto'){ _payEvenSplit(); }
  _payRecalcDates();
  _renderPaymentsEditor();
}
function _payDelRow(idx){
  const c=_payCtx; if(!c) return;
  c.rows.splice(idx,1);
  if(!c.rows.length){ c.plan=''; c.splitMode='auto'; }
  else { if(c.splitMode==='auto'){ _payEvenSplit(); } _payRecalcDates(); }
  _renderPaymentsEditor();
}
function _payRowEdit(idx, field, val){
  const c=_payCtx; if(!c||!c.rows[idx]) return;
  if(field==='amount'){
    c.rows[idx].amount=_payParseAmt(val);
    // Live-update the breakdown totals without a full re-render (keeps input focus).
    _payUpdateBreakdownLive();
  } else if(field==='dueDate'){
    c.rows[idx].dueDate=val;
    // A date change must refresh the row's "Due …" label and any plan due-date display.
    _renderPaymentsEditor();
  } else {
    c.rows[idx][field]=val;
  }
}
// Recompute and patch just the "Remaining to schedule" / "You've scheduled" values.
function _payUpdateBreakdownLive(){
  const c=_payCtx; if(!c) return;
  const balanceAfterDep=_payRemaining();          // total − deposit
  const scheduled=c.rows.reduce((x,r)=>x+Number(r.amount||0),0);
  const leftToAllocate=balanceAfterDep - scheduled; // total − deposit − scheduled
  const over = balanceAfterDep>0 && scheduled>balanceAfterDep+0.5;
  const schColor = over ? '#C57B6A' : 'var(--gold-deep)';
  const allocColor = leftToAllocate < -0.5 ? '#C57B6A' : 'var(--ink)';
  const schEl=document.getElementById('pay-bd-scheduled');
  if(schEl){
    schEl.textContent=fmt(scheduled);
    schEl.style.color=schColor;
    const parent=schEl.parentElement; if(parent) parent.style.color=schColor;
  }
  const remEl=document.getElementById('pay-bd-remaining');
  if(remEl){
    remEl.textContent=fmt(leftToAllocate);
    remEl.style.color=allocColor;
  }
}
// When the user finishes editing an amount while in auto-split mode, ask whether
// to switch to manual (keeping their custom amounts) or keep auto-splitting evenly.
let _payPendingEditIdx=-1;
function _payAmountCommitted(idx){
  const c=_payCtx; if(!c) return;
  if(c.splitMode!=='auto'){ return; } // already manual — nothing to ask
  _payPendingEditIdx=idx;
  const body=`<div style="font-size:13px;color:var(--muted);line-height:1.5">You changed a payment amount. Keep auto-splitting evenly when the deposit or total changes, or switch to manual and keep your custom amounts?</div>`;
  const footer=`<button class="btn btn-outline btn-sm" onclick="_payKeepAuto()">Keep auto-split</button>
    <button class="btn btn-primary btn-sm" onclick="_payGoManual()">Switch to manual</button>`;
  openConfirm2('Switch to manual amounts?', body, footer);
}
function _payKeepAuto(){
  const c=_payCtx; if(!c){ _closeConfirm2Direct&&_closeConfirm2Direct(); return; }
  // Discard the manual edit by re-splitting evenly.
  _payEvenSplit();
  _payPendingEditIdx=-1;
  if(typeof _closeConfirm2Direct==="function") _closeConfirm2Direct();
  _renderPaymentsEditor();
}
function _payGoManual(){
  const c=_payCtx; if(!c){ _closeConfirm2Direct&&_closeConfirm2Direct(); return; }
  c.splitMode='manual'; // keep the edited amounts as-is
  _payPendingEditIdx=-1;
  if(typeof _closeConfirm2Direct==="function") _closeConfirm2Direct();
  _renderPaymentsEditor();
}
function _payCancel(){ _payCtx=null; closeModalDirect(); navigate(_popupReturn()); }
function _paySave(){
  const c=_payCtx; if(!c){ closeModalDirect(); return; }
  _payStash();
  const b=STATE.budget.items.find(x=>x.id===c.pid);
  const s=b?.subItems?.find(x=>x.id===c.sid);
  if(!s){ _payCtx=null; closeModalDirect(); navigate(_popupReturn()); return; }
  if(c.depOn){
    s.showDeposit=true;
    s.deposit=Number(c.depAmount||0);
    s.depositDueDate=c.depDue||'';
  } else {
    s.showDeposit=false; s.deposit=0; s.depositDueDate=''; s.depositPaid=false; s.depositPaidDate='';
  }
  if(c.instOn && c.rows.length){
    s.installments=c.rows.map(r=>({id:r.id||_payNewId(), label:r.label||'', amount:Number(r.amount||0), dueDate:r.dueDate||'', paid:!!r.paid, paidDate:r.paidDate||'', ...(r._userUnchecked?{_userUnchecked:true}:{})}));
    s.installmentPlan=c.plan||'custom';
    // Remember whether amounts are auto-split or manually set, so editing the sub-item
    // amount later can re-split only auto plans (never overwrite manual amounts).
    s.installmentSplitMode = (c.splitMode==='manual') ? 'manual' : 'auto';
    // Persist BNPL day-of-week scheduling preferences
    if(c.bnplDowOn){ s.bnplDowOn=true; s.bnplDow=Number(c.bnplDow)||1; }
    else { delete s.bnplDowOn; delete s.bnplDow; }
    // Per-plan auto-check override: null = follow global (store nothing), else true/false.
    if(c.autoCheckPassed===true) s.autoCheckPassed=true;
    else if(c.autoCheckPassed===false) s.autoCheckPassed=false;
    else delete s.autoCheckPassed;
    // With exactly one installment, the sub-item's balance due date follows that single
    // payment's date (a one-payment plan is effectively just a dated balance).
    if(s.installments.length===1 && s.installments[0].dueDate){
      s.balanceDueDate=s.installments[0].dueDate;
    }
  } else {
    delete s.installments;
    delete s.installmentPlan;
    delete s.autoCheckPassed;
    delete s.installmentSplitMode;
  }
  // The "Full amount" field is authoritative for the sub-item's total — apply it whether
  // or not installments are on. Only for flat-amount sub-items: per-head / per-item subs
  // derive their total from the calculator, so the Full amount must not overwrite them.
  if(!s.perHead && !s.perItem){
    const instTotal=(s.installments||[]).reduce((sum,i)=>sum+Number(i.amount||0),0);
    if(Number(c.fullAmount||0)>0){
      s.amount=Number(c.fullAmount);
    } else if(!(Number(getSubItemAmount(s)||0)>0)){
      // No Full amount set and the sub is blank: fall back to the installment sum or a
      // task-derived $amount so the figure isn't left at zero.
      if(instTotal>0) s.amount=instTotal;
      else if(Number(c.taskAmount||0)>0) s.amount=Number(c.taskAmount);
    }
    if(typeof applyAutoFromSubs==='function') applyAutoFromSubs(b);
  }
  // Apply auto-check immediately so any already-passed dates reflect on save.
  _autoCheckPassedInstallments();
  // Reconcile the sub-item's paid state from its installments (all paid → sub paid).
  if(s.installments && s.installments.length) _reconcileSubFromInstallments(b, s);
  _payCtx=null;
  saveToStorage();
  closeModalDirect();
  navigate(_popupReturn());
}
// Second-level confirm dialog — stacks on top of any open modal without closing it.
function openConfirm2(title, body, footer){
  document.getElementById('confirm2-title').textContent=title;
  document.getElementById('confirm2-body').innerHTML=body;
  document.getElementById('confirm2-footer').innerHTML=footer||'';
  document.getElementById('confirm2-overlay').classList.remove('hidden');
}
function _closeConfirm2(e){ /* Outside-click close disabled — use the × or a button to close. */ }
function _closeConfirm2Direct(){ document.getElementById('confirm2-overlay').classList.add('hidden'); }
// × on the confirm2 popup (link prompts, etc.): if a tick opened it, undo that tick —
// same revert Escape runs. The plain _closeConfirm2Direct stays revert-free because
// it's also called programmatically after a chosen action (link made, etc.), where
// the tick must be kept. Only the × button routes through here.
function _confirm2CloseX(){
  const snap=_checkSnapshot;
  const pending=_escapeRevert;
  // If an appointment form (auto-host from the calendar) is being dismissed via ×,
  // drop the empty host task so it doesn't linger.
  if(_apptFormCtx && _apptFormCtx.taskId) _cleanupAutoApptHost(_apptFormCtx.taskId);
  _closeConfirm2Direct();
  if(snap){ closeModalDirect(); _checkSnapshot=snap; _restoreCheckSnapshot(); return; }
  if(pending){ _escapeRevert=pending; _revertCheckFromEscape(); }
}

// ══════════════════════════════════════════════

// ═══════════════════════════════════════
