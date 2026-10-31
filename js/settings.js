// SETTINGS
// ══════════════════════════════════════════════
// Report how this copy of the app arrived: straight from the network, or out of the
// service worker's cache (and which cache). The second case is exactly the situation where
// a freshly uploaded build does not appear, so naming the cache turns an invisible problem
// into a readable one.
async function _describeAppSource(){
  const el=document.getElementById('about-sw'); if(!el) return;
  try{
    if(!('serviceWorker' in navigator) || !navigator.serviceWorker.controller){
      el.innerHTML=''; return;
    }
    const keys=await caches.keys();
    const uv=keys.filter(k=>k.indexOf('union-vault-')===0);
    el.innerHTML='<span style="color:var(--muted)">Served from the installed offline copy</span>'
      + (uv.length?' &nbsp;<b>'+_escHtml(uv.join(', '))+'</b>':'');
  }catch(e){ el.innerHTML='<span style="color:var(--muted)">Loaded directly.</span>'; }
}
// Throw away every cached copy of the APP and re-register the worker, then reload. Only
// touches caches; localStorage and IndexedDB — where all the user's data lives — are not
// involved, which is why this is safe to offer as a button.
async function _forceAppUpdate(){
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.update().catch(()=>null)));
    }
    if(window.caches){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
    _showInfoToast('Cleared the stored copy — reloading…', null, null);
    setTimeout(()=>location.reload(true), 700);
  }catch(e){
    _showInfoToast('Could not clear it automatically. Close the app fully and reopen it twice.', null, null);
  }
}

function renderSettings(c, actions){
  const s=STATE.settings;
  // Settings view switcher lives in the hero bar (top-right).
  if(actions){
    actions.innerHTML=`
      <span style="display:inline-flex;align-items:center;gap:3px">
        <span style="font-size:10.5px;font-weight:600;letter-spacing:.04em;color:var(--muted);user-select:none">${APP_BUILD}</span>
        <button type="button" title="Check for update" onclick="_forceAppUpdate()" style="width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;background:none;border:none;border-radius:8px;cursor:pointer;color:var(--gold-deep);padding:0;transition:background .15s" onmouseenter="this.style.background='rgba(154,115,64,.1)'" onmouseleave="this.style.background='none'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg></button>
      </span>
      `;
  }
  const titles=['Partner','Bride','Groom','Spouse','Fiancé','Fiancée','Husband','Wife','Person 1','Person 2'];
  const isDark=document.body.classList.contains('dark');
  const sidebarMode=s.sidebarMode||'hamburger';
  c.innerHTML=`
  <div class="card settings-card layout-cards" style="display:flex;flex-direction:column;gap:8px">
    <div class="settings-switch-row" style="display:flex;align-items:center;gap:12px;margin:0;padding:0;border:none;">
      <div class="settings-search-wrap" style="position:relative;flex:1;min-width:0">
        <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--muted);display:flex;align-items:center">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input class="form-input" type="text" id="settings-search" placeholder="Search settings…" autocomplete="off" oninput="_filterSettings(this.value)" style="padding-left:40px;padding-right:28px" onkeydown="if(event.key==='Escape'){_filterSettings('');this.value=''}"/><button type="button" onclick="_filterSettings('');document.getElementById('settings-search').value=''" title="Clear" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);padding:0;line-height:0;display:flex;align-items:center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
    </div>
    <div id="settings-no-results" style="display:none;font-size:13px;color:var(--muted);text-align:center;padding:8px 0">No settings match your search.</div>
    <div class="settings-sect" data-sect="account cloud save load sync sign in sign out email password">
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)">Account &amp; Cloud</div>
      <div id="cloud-account-panel">${_cloudAccountHtml()}</div>
    </div>
    ${_sbSession?`<div class="settings-sect" data-sect="subscription billing plan tier upgrade downgrade cancel payment stripe">
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)">Subscription</div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div>
            <div style="font-size:13.5px;font-weight:500">${typeof _uvTier!=='undefined'&&_uvTier==='full'?'Full Access':_uvTier==='trial'?'Free Trial'+(typeof _uvTrialDaysLeft!=='undefined'&&_uvTrialDaysLeft>0?' — '+_uvTrialDaysLeft+' day'+(_uvTrialDaysLeft===1?'':'s')+' left':''):'Free Tier'}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">${typeof _uvTier!=='undefined'&&_uvTier==='full'?'You have access to all features.':_uvTier==='trial'?'All features are unlocked during your trial.':'Upgrade for unlimited guests, seating plans, print &amp; more.'}</div>
          </div>
          ${typeof _uvTier!=='undefined'&&(_uvTier==='full'||(_uvTier==='trial'&&typeof _uvSubDetails!=='undefined'&&_uvSubDetails&&_uvSubDetails.subStatus))?`<button class="btn btn-sm btn-outline" onclick="_uvOpenPortal()">Manage billing</button>`:`<button class="btn btn-sm btn-primary" onclick="_uvGoCheckout()">Upgrade to Full Access</button>`}
        </div>
        ${typeof _uvSubDetails!=='undefined'&&_uvSubDetails&&_uvSubDetails.cancelAtPeriodEnd?`<div style="font-size:12.5px;color:var(--red);padding:10px 14px;background:rgba(192,57,43,.06);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>Your subscription will end at the current billing period.</span><button class="btn btn-sm btn-outline" onclick="_uvReactivateSub().then(function(){navigate('settings')})">Reactivate</button></div>`:''}
      </div>
    </div>`:''}
    <div class="settings-sect" data-sect="appearance dark mode vision board dashboard navigation sidebar hamburger icon theme">
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)">Appearance</div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Dark Mode</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Switch to a darker, moodier interface.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${isDark?'checked':''} onchange="toggleDarkMode(this.checked)"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div>
        <div style="font-size:13.5px;font-weight:500;margin-bottom:4px">Navigation Style</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Choose how the sidebar menu behaves.</div>
        <div style="display:flex;gap:10px">
          <button type="button" class="s-opt-btn${sidebarMode==='hamburger'?' sel':''}" onclick="setSidebarMode('hamburger')"
            style="flex:1;min-width:90px;padding:10px 12px;border-radius:10px;border:2px solid ${sidebarMode==='hamburger'?'var(--gold)':'var(--border)'};background:${sidebarMode==='hamburger'?'var(--parchment)':'transparent'};cursor:pointer;text-align:left;transition:all .15s">
            <div style="display:flex;align-items:center;gap:8px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${sidebarMode==='hamburger'?'var(--gold-deep)':'var(--muted)'}" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              <span style="font-size:13px;font-weight:500;color:${sidebarMode==='hamburger'?'var(--gold-deep)':'var(--ink)'}">Hamburger Menu</span>
            </div>
          </button>
          <button type="button" class="s-opt-btn${sidebarMode==='icon'?' sel':''}" onclick="setSidebarMode('icon')"
            style="flex:1;min-width:90px;padding:10px 12px;border-radius:10px;border:2px solid ${sidebarMode==='icon'?'var(--gold)':'var(--border)'};background:${sidebarMode==='icon'?'var(--parchment)':'transparent'};cursor:pointer;text-align:left;transition:all .15s">
            <div style="display:flex;align-items:center;gap:8px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${sidebarMode==='icon'?'var(--gold-deep)':'var(--muted)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              <span style="font-size:13px;font-weight:500;color:${sidebarMode==='icon'?'var(--gold-deep)':'var(--ink)'}">Icon Sidebar</span>
            </div>
          </button>
        </div>
      </div>
    </div>
    <div class="settings-sect" data-sect="display formatting fade completed tasks faded strikethrough dim finished checklist ceremony details event details religion officiant venue budget year budget dates paid owing categories suggest budget links follow-up tasks email appointments auto-mark installments mark paid due soon countdown currency decimals dollars cents currency symbol aud usd gbp eur nzd cad euro pound dollar yen rupee payment badges vendor badges vendor badge style avatar pill name off linked vendors on budget vision board dashboard">
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)">Display &amp; Formatting</div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Show Vision Board on Dashboard</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Display a preview of your pinned inspiration on the dashboard.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-vision-dash" ${STATE.settings.showVisionOnDash?'checked':''} onchange="setVisionOnDash(this.checked)"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Fade Completed Tasks</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Dim finished checklist tasks and use a soft strikethrough. Turn off for a solid line and no fade.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${STATE.settings.checklistCompletedFade!==false?'checked':''} onchange="STATE.settings.checklistCompletedFade=this.checked;document.body.classList.toggle('cl-no-fade',!this.checked);saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div style="margin-bottom:16px;margin-top:28px">
        <div style="font-size:13.5px;font-weight:500;margin-bottom:4px">Countdown Format</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">How the wedding countdown displays on the dashboard.</div>
        <div style="display:flex;gap:10px">
          <button type="button" class="s-opt-btn${(STATE.settings.countdownUnit||'days')==='days'?' sel':''}" onclick="setCountdownUnit('days')"
            style="flex:1;min-width:90px;padding:10px 12px;border-radius:10px;border:2px solid ${(STATE.settings.countdownUnit||'days')==='days'?'var(--gold)':'var(--border)'};background:${(STATE.settings.countdownUnit||'days')==='days'?'var(--parchment)':'transparent'};cursor:pointer;text-align:left;transition:all .15s">
            <div style="font-size:13px;font-weight:500;color:${(STATE.settings.countdownUnit||'days')==='days'?'var(--gold-deep)':'var(--ink)'};margin-bottom:4px">Days</div>
            <div style="font-size:11.5px;color:var(--muted)">e.g. 247 days to go</div>
          </button>
          <button type="button" class="s-opt-btn${STATE.settings.countdownUnit==='monthsdays'?' sel':''}" onclick="setCountdownUnit('monthsdays')"
            style="flex:1;min-width:90px;padding:10px 12px;border-radius:10px;border:2px solid ${STATE.settings.countdownUnit==='monthsdays'?'var(--gold)':'var(--border)'};background:${STATE.settings.countdownUnit==='monthsdays'?'var(--parchment)':'transparent'};cursor:pointer;text-align:left;transition:all .15s">
            <div style="font-size:13px;font-weight:500;color:${STATE.settings.countdownUnit==='monthsdays'?'var(--gold-deep)':'var(--ink)'};margin-bottom:4px">Months &amp; Days</div>
            <div style="font-size:11.5px;color:var(--muted)">e.g. 8 months 7 days to go</div>
          </button>
        </div>
      </div>

      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:600">Category Jump Bar</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Show a strip of category names at the top of the budget page for quick navigation.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${(STATE.settings.budgetJumpBar==='a'||STATE.settings.budgetJumpBar==='b')?'checked':''} onchange="_setBudgetJumpBar(this.checked?'a':'off')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:600">Calmer Category Cards</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Softer category headers, tighter rows, and paid items dimmed.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${(STATE.settings.budgetDensity==='gentle')?'checked':''} onchange="STATE.settings.budgetDensity=this.checked?'gentle':'current';saveToStorage();if(_currentPage==='budget')navigate('budget')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:600">Show Year on Budget Dates</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Include the year in budget due, overdue &amp; paid dates.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.budgetHideYear?'checked':''} onchange="STATE.settings.budgetHideYear=!this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Show Paid / Left to pay on Budget Categories</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Show how much of each category is paid and how much is left to pay.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.hideBudgetPaidOwing?'checked':''} onchange="STATE.settings.hideBudgetPaidOwing=!this.checked;saveToStorage();if(_currentPage==='budget')navigate('budget')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Auto-check instalments as PAID on set payment date</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">When an instalment's due date passes, automatically mark it as paid on that date. You can still untick any by hand.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${STATE.settings.autoCheckPassedInstallments?'checked':''} onchange="STATE.settings.autoCheckPassedInstallments=this.checked;saveToStorage();if(_currentPage==='budget')navigate('budget')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div style="margin-bottom:18px">
        <div style="font-size:13.5px;font-weight:500">When you tick linked checklist and budget items</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">What happens when a task and a payment are linked, or a task sounds like a cost.</div>
        <div class="lk-mode-opts">
          ${[[1,'Automatic + Undo','Linked items update by themselves. A short message says what changed, with Undo. Unlinked money tasks show a small “Add to budget” chip.'],
             [2,'One sheet','One short pop-up lists anything else that could change, with the likely ones ticked. Pick, then Save.'],
             [3,'Automatic, ask about new costs','Linked items update by themselves, with Undo. Ticking an unlinked money task opens one short sheet to add it to your budget.']]
            .map(o=>`<button type="button" class="lk-mode-opt${_linkedMode()===o[0]?' sel':''}" onclick="setLinkedMode(${o[0]})" aria-pressed="${_linkedMode()===o[0]}"><span class="lk-mn">Option ${o[0]}</span><span class="lk-mt">${o[1]}</span><span class="lk-md">${o[2]}</span></button>`).join('')}
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:8px">Balance tasks and invoices are always in the item’s ⋯ menu.</div>
      </div>

      <div style="margin-bottom:8px">
        <div style="font-size:13.5px;font-weight:600;margin-bottom:4px">Set “Due Soon” Alert</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Choose how early upcoming due dates are flagged.</div>
        <div style="background:transparent;border:1px solid var(--border);border-radius:12px;padding:14px 16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">
            <div>
              <div style="font-size:13px;font-weight:500">Checklist tasks</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">Flag tasks due within this window.</div>
            </div>
            <span style="display:inline-flex;align-items:center;gap:9px">
              <span style="font-size:12px;${_clDueWindow()===7?'color:var(--gold-deep);font-weight:600':'color:var(--muted)'}">7d</span>
              <label class="toggle-switch"><input type="checkbox" ${_clDueWindow()===14?'checked':''} onchange="setDueWindow('checklist',this.checked?14:7)"/><div class="toggle-track"></div></label>
              <span style="font-size:12px;${_clDueWindow()===14?'color:var(--gold-deep);font-weight:600':'color:var(--muted)'}">14d</span>
            </span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:13px;font-weight:500">Budget payments</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">Flag payments due within this window.</div>
            </div>
            <span style="display:inline-flex;align-items:center;gap:9px">
              <span style="font-size:12px;${_budgetDueWindow()===7?'color:var(--gold-deep);font-weight:600':'color:var(--muted)'}">7d</span>
              <label class="toggle-switch"><input type="checkbox" ${_budgetDueWindow()===14?'checked':''} onchange="setDueWindow('budget',this.checked?14:7)"/><div class="toggle-track"></div></label>
              <span style="font-size:12px;${_budgetDueWindow()===14?'color:var(--gold-deep);font-weight:600':'color:var(--muted)'}">14d</span>
            </span>
          </div>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:13.5px;font-weight:500;margin-bottom:4px">Currency</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">The symbol and number format used throughout the app.</div>
        <select class="form-input" style="appearance:none;-webkit-appearance:none;padding-right:34px;max-width:340px" onchange="setCurrency(this.value)">
          ${Object.keys(CURRENCIES).map(code=>`<option value="${code}" ${_curCode()===code?'selected':''}>${code} — ${CURRENCIES[code].label} (${CURRENCIES[code].symbol.trim()})</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:13.5px;font-weight:500;margin-bottom:4px">Currency Format</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">How amounts display throughout the app.</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" onclick="setCurrencyDecimals(false)"
            class="curr-fmt-opt${!STATE.settings.currencyDecimals?' sel':''}"
            style="flex:1;min-width:130px;padding:12px 16px;border-radius:10px;border:2px solid ${!STATE.settings.currencyDecimals?'var(--gold)':'var(--border)'};background:${!STATE.settings.currencyDecimals?'var(--parchment)':'transparent'};cursor:pointer;text-align:left;transition:all .15s">
            <div class="curr-fmt-name" style="font-size:13px;font-weight:500;margin-bottom:4px">Whole Dollars</div>
            <div style="font-size:11.5px;color:var(--muted)">e.g. $11 — rounded to nearest dollar</div>
          </button>
          <button type="button" onclick="setCurrencyDecimals(true)"
            class="curr-fmt-opt${STATE.settings.currencyDecimals?' sel':''}"
            style="flex:1;min-width:130px;padding:12px 16px;border-radius:10px;border:2px solid ${STATE.settings.currencyDecimals?'var(--gold)':'var(--border)'};background:${STATE.settings.currencyDecimals?'var(--parchment)':'transparent'};cursor:pointer;text-align:left;transition:all .15s">
            <div class="curr-fmt-name" style="font-size:13px;font-weight:500;margin-bottom:4px">Dollars &amp; Cents</div>
            <div style="font-size:11.5px;color:var(--muted)">e.g. $10.78 or $5.00</div>
          </button>
        </div>
      </div>
      ${_badgePickerHtml()}
      ${_vendorBadgeStylePickerHtml()}
    </div>
    <div class="settings-sect" data-sect="alerts notifications task alerts banner payment alerts banner checklist alert icon menu budget alert icon menu seating alert icon menu banners menu icons overdue due soon warning">
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)">Alerts &amp; Notifications</div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Task Alerts Banner</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Show the alerts bar at the top of the Checklist page for due and overdue tasks.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.hideTaskAlerts?'checked':''} onchange="STATE.settings.hideTaskAlerts=!this.checked;saveToStorage();if(_currentPage==='checklist')navigate('checklist')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Payment Alerts Banner</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Show the alerts bar at the top of the Budget page for due and overdue payments.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.hidePaymentAlerts?'checked':''} onchange="STATE.settings.hidePaymentAlerts=!this.checked;saveToStorage();if(_currentPage==='budget')navigate('budget')"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Checklist Alert Icon in Menu</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Show a warning icon next to "Checklist" in the side menu when a task is overdue or due soon.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.hideChecklistNavIcon?'checked':''} onchange="STATE.settings.hideChecklistNavIcon=!this.checked;saveToStorage();_updateChecklistNavBadge()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Budget Alert Icon in Menu</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Show a warning icon next to "Budget" in the side menu when a payment is overdue or due soon.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.hideBudgetNavIcon?'checked':''} onchange="STATE.settings.hideBudgetNavIcon=!this.checked;saveToStorage();_updateBudgetNavBadge()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Seating Alert Icon in Menu</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Show a count next to "Seating Plan" in the side menu when an attending guest has no seat.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.hideSeatingNavIcon?'checked':''} onchange="STATE.settings.hideSeatingNavIcon=!this.checked;saveToStorage();_updateSeatingNavBadge()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
    </div>
    <div class="settings-sect" data-sect="pop ups popups prompts ask before marking date paid payment date detect appointments offer save drafts suggest budget links budget-link message emailing appointments follow-up tasks uploading invoices suggest deposits add deposit don't ask again">
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)">Pop ups</div>
      <div class="settings-sublabel" data-settings-sub="prompts" data-page-hint="budget" style="font-family:'Inter',sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--gold-deep);margin:0 0 12px">Prompts</div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Ask Before Marking Date Paid</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Show the payment-date pop-up when marking items paid. Turn off to always use today's date.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.alwaysMarkPaidToday?'checked':''} onchange="STATE.settings.alwaysMarkPaidToday=!this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Suggest Budget Links</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">When a task mentions a Payment by name, offer to link them so payments stay in sync.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${STATE.settings.suggestBudgetLinks!==false?'checked':''} onchange="STATE.settings.suggestBudgetLinks=this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Suggest Budget-Link Message</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Show the “link this to a Payment?” message on a completed task.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.hideBuyLinkPrompt?'checked':''} onchange="STATE.settings.hideBuyLinkPrompt=!this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Suggest Uploading Invoices</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Offer to attach an invoice after you add a Payment.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!_budgetHideMap().invoicePrompt?'checked':''} onchange="_budgetHideMap().invoicePrompt=!this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="settings-sublabel" data-settings-sub="other-prompts" data-page-hint="skip" style="font-family:'Inter',sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin:6px 0 12px;padding-top:14px;border-top:1px solid var(--border)">Other prompts</div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Detect Appointments</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Ask to add appointment details when a checklist task looks like one.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.hideApptPrompt?'checked':''} onchange="STATE.settings.hideApptPrompt=!this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Offer to Save Drafts</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">When you close a half-filled checklist task, offer to keep it as a draft.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${!STATE.settings.hideDraftPrompt?'checked':''} onchange="STATE.settings.hideDraftPrompt=!this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Suggest emailing appointments to me</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">If you add an appointment without ticking “email to myself”, ask at save.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${STATE.settings.suggestEmailAppointment!==false?'checked':''} onchange="STATE.settings.suggestEmailAppointment=this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Suggest Follow-up Tasks</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">When you complete a task, offer to create a follow-up task.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${STATE.settings.suggestFollowUp!==false?'checked':''} onchange="STATE.settings.suggestFollowUp=this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Unpin Completed Pinned Tasks</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">When you complete a task pinned to the dashboard, ask whether to unpin it.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${STATE.settings.askUnpinOnComplete!==false?'checked':''} onchange="STATE.settings.askUnpinOnComplete=this.checked;saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
    </div>
    <div class="settings-sect" data-sect="data export json import backup transfer fix guest data start from scratch reset all data storage space full photos files quota backups automatic snapshots restore">
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)">Data</div>
      <div class="dark-toggle-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:13.5px;font-weight:500">Auto-update from cloud (skip prompt)</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">When cloud data is newer, silently update this device without showing a prompt.</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${(function(){try{return localStorage.getItem('uv-suppress-conflict')==='1';}catch(e){return !!STATE.settings.suppressVersionMismatch;}})()?'checked':''} onchange="STATE.settings.suppressVersionMismatch=this.checked;try{this.checked?localStorage.setItem('uv-suppress-conflict','1'):localStorage.removeItem('uv-suppress-conflict');}catch(e){}saveToStorage()"/>
          <div class="toggle-track"></div>
        </label>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="background:var(--surface);border-radius:12px;padding:18px 20px;border:1px solid var(--border)">
          <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:8px">About this build</div>
          <div id="about-build-rows" style="font-size:13px;line-height:1.75">
            <div><span style="color:var(--muted)">Build</span> &nbsp;<b>${APP_BUILD}</b> <span style="color:var(--muted)">· ${APP_BUILD_DATE}</span></div>
            <div id="about-sw" style="color:var(--muted)">Checking how this copy was loaded…</div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
            <button class="btn btn-outline btn-sm" onclick="_forceAppUpdate()" style="display:inline-flex;align-items:center;gap:5px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>
              Check for update
            </button>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:10px">Your guests, budget and seating are never touched by this — it only clears the stored copy of the app itself.</div>
        </div>
        <div style="background:var(--surface);border-radius:12px;padding:18px 20px;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-size:13px;font-weight:600;color:var(--ink)">Export Data</span>
            <span id="backup-age-pill">${_backupAgePillHtml()}</span>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Download all your Union Vault data as a JSON file to back up or transfer to another device.</div>
          <button class="btn btn-outline btn-sm" onclick="exportDataJson()" style="display:inline-flex;align-items:center;gap:6px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export as JSON
          </button>
        </div>
        <div style="background:var(--surface);border-radius:12px;padding:18px 20px;border:1px solid var(--border)">
          <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:4px">Import Data</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Choose your exported <code>.json</code> file to import. <strong>This will overwrite all current data.</strong></div>
          <button class="import-file-btn" onclick="triggerImportJson()" style="display:inline-flex;align-items:center;gap:8px;padding:8px 13px;margin-bottom:10px;text-align:left">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Choose .json file…</span>
          </button>
        </div>
        <div style="padding-top:14px;border-top:1px solid var(--border)">
          <div style="font-size:13.5px;font-weight:600;margin-bottom:4px">Backups</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:10px">A snapshot is saved automatically before each cloud load, so you can always undo.</div>
          <button class="btn btn-outline btn-sm" onclick="_openBackupModal()" style="display:inline-flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>View backups</button>
        </div>
        <div style="padding-top:14px;border-top:1px solid var(--border)">
          <div style="font-size:13.5px;font-weight:600;color:var(--red,#c0392b);margin-bottom:4px">Danger Zone</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:10px">These actions are hard to undo. Export a backup first if you're unsure.</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="cleanGuestData()" style="display:inline-flex;align-items:center;gap:5px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Fix Guest Data
            </button>
            <button class="btn btn-outline btn-sm" onclick="openStartFromScratch()" style="display:inline-flex;align-items:center;gap:5px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Start from scratch
            </button>
            <button class="btn btn-danger btn-sm" onclick="confirmResetData()">Reset All Data</button>
            ${_sbSession?`<button class="btn btn-danger btn-sm" onclick="_openDeleteAccountModal()" style="display:inline-flex;align-items:center;gap:5px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Delete account</button>`:''}
          </div>
        </div>
      </div>
    </div>
    <div id="settings-contact-footer" style="padding-top:24px;text-align:center">
      <button class="btn btn-outline" onclick="_showSupportModal()" style="width:100%;max-width:320px;display:inline-flex;align-items:center;justify-content:center;gap:8px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Contact Us
      </button>
    </div>

  </div>`;
  // Apply the remembered Settings view (category | page) after the DOM is in place.
  setTimeout(()=>{ try{ _applySettingsView(STATE.settings.settingsView==='page'?'page':'category'); }catch(_){} },0);
  // Quota estimate may be stale after uploads — refresh and repaint the meter.
  setTimeout(()=>{ try{ _refreshStorageMeter(); }catch(_){} },0);
  // Async: says whether this copy came from the network or the offline cache.
  setTimeout(()=>{ try{ _describeAppSource(); }catch(_){} },0);
}

// ── Settings: "By category" ↔ "By page" view ─────────────────────────────────
// Page mapping for each setting, keyed by its label text. Anything not listed
// falls into "General & App-wide".
const _SETTINGS_PAGE_MAP={
  'Dark Mode':'general',
  'Show Vision Board on Dashboard':'dashboard',
  'Navigation Style':'general',
  'Task Alerts Banner':'appointments',
  'Payment Alerts Banner':'appointments',
  'Undo Toast on Delete':'general',
  'Fade Completed Tasks':'checklist',
  'Budget Alert Icon in Menu':'appointments',
  'Checklist Alert Icon in Menu':'appointments',
  'Seating Alert Icon in Menu':'appointments',
  'Ceremony Details':'details',
  'Show Year on Budget Dates':'budget',
  'Show Paid / Left to pay on Budget Categories':'budget',
  'Auto-mark passed installments paid':'budget',
  'Set “Due Soon” Alert':'appointments',
  'Category Jump Bar':'budget',
  'Calmer Category Cards':'budget',
  'Countdown Format':'general',
  'Currency':'budget',
  'Currency Format':'budget',
  'Auto-check instalments as PAID on set payment date':'budget',
  'Suggest Deposits':'budget',
  'Ask Before Marking Date Paid':'budget',
  'Detect Appointments':'checklist',
  'Offer to Save Drafts':'checklist',
  'Suggest Budget Links':'budget',
  'Suggest Budget-Link Message':'budget',
  'Suggest emailing appointments to me':'appointments',
  'Suggest Follow-up Tasks':'checklist',
  'Unpin Completed Pinned Tasks':'dashboard',
  'Suggest Uploading Invoices':'budget',
  'Vendor Badges on Budget':'budget'
};
const _SETTINGS_PAGE_ORDER=[
  ['account','Account & Cloud','Cloud & sign-in'],
  ['general','General & App-wide','Applies everywhere'],
  ['dashboard','Dashboard','Affects the Dashboard'],
  ['checklist','Checklist','Affects the Checklist'],
  ['budget','Budget','Affects the Budget page'],
  ['details','Event Details','Affects Event Details'],
  ['appointments','Notify','Appointments, email & alert banners'],
  ['vendors','Vendors','Vendor display'],
  ['datatesting','Data & Testing','Backup, import & tools']
];
// Section-level fallback: whole-section blocks (Data, Testing, badge pickers)
// that have no per-row label go to these pages by their section header text.
const _SETTINGS_SECTION_PAGE={ 'Data':'datatesting', 'Testing':'datatesting', 'Account & Cloud':'account' };

function _settingsBlockPage(block){
  // Explicit page hint wins (used by the Display/Prompts sub-labels).
  const hint=block.getAttribute&&block.getAttribute('data-page-hint');
  if(hint==='skip') return '__skip__';
  if(hint) return hint;
  // Vendor badge pickers render via partials; tag by their text content.
  const txt=(block.textContent||'');
  // Find the block's primary label (first bold 13.5px line) to look up the map.
  const lbls=block.querySelectorAll('div');
  for(const d of lbls){
    const t=(d.textContent||'').trim();
    if(_SETTINGS_PAGE_MAP[t]!==undefined) return _SETTINGS_PAGE_MAP[t];
  }
  if(/vendor badge|linked vendors appear|How linked vendors/i.test(txt)) return 'vendors';
  // Balance/Deposit payment-badge picker box (no per-row label in the map) → Budget.
  if(block.querySelector('.badge-picker-row') || /balance payment badge|deposit badge/i.test(txt)) return 'budget';
  return null;
}

function _applySettingsView(mode){
  const card=document.querySelector('.settings-card.layout-cards'); if(!card) return;
  const catBtn=document.getElementById('setview-cat'), pgBtn=document.getElementById('setview-page');
  if(catBtn) catBtn.classList.toggle('on',mode!=='page');
  if(pgBtn) pgBtn.classList.toggle('on',mode==='page');

  // On first call, snapshot the original category sections AND each setting
  // block's original home (parent + the node it sat before) so page mode can
  // move blocks out and category mode can put them back exactly.
  if(!card._settingsSnapshot){
    card._settingsSnapshot=[...card.querySelectorAll(':scope > .settings-sect')];
    card._settingsBlockHomes=[];
    card._settingsSnapshot.forEach(sec=>{
      const header=sec.querySelector(':scope > div');
      [...sec.children].forEach(block=>{
        if(block===header) return;
        card._settingsBlockHomes.push({block, parent:sec});
      });
    });
    card._settingsPageModeUsed=false;
  }
  const origSects=card._settingsSnapshot;

  // Remove any previously-built page groups.
  card.querySelectorAll(':scope > .settings-page-group').forEach(n=>n.remove());

  if(mode!=='page'){
    // CATEGORY: only restore if page mode was actually used (blocks were moved).
    // Sections are never moved by page mode (only hidden), so we don't need to
    // reorder them — just un-hide and move blocks back to their original sections.
    if(card._settingsPageModeUsed){
      card._settingsBlockHomes.forEach(({block,parent})=>{ block.style.display=''; parent.appendChild(block); });
      origSects.forEach(sec=>{ sec.style.display=''; });
      card._settingsPageModeUsed=false;
    }
    return;
  }
  card._settingsPageModeUsed=true;

  // PAGE: hide original sections, distribute their setting blocks into page groups.
  // Collect blocks (direct children of each section, excluding the header div).
  const buckets={}; _SETTINGS_PAGE_ORDER.forEach(([k])=>buckets[k]=[]);
  origSects.forEach(sec=>{
    const header=sec.querySelector(':scope > div'); // the Cormorant header
    const secName=(header&&header.textContent||'').trim().replace(/\s+/g,' ');
    const children=[...sec.children].filter(ch=>ch!==header);
    children.forEach(block=>{
      let page=_settingsBlockPage(block);
      if(page==='__skip__'){ block.style.display='none'; return; }
      if(!page) page=_SETTINGS_SECTION_PAGE[secName]||'general';
      if(!buckets[page]) buckets[page]=[];
      buckets[page].push(block);
    });
    sec.style.display='none';
  });

  // Intra-budget ordering: Display cluster → Prompts cluster → pickers.
  // Sub-labels carry data-settings-sub; following toggles inherit that cluster.
  // Pickers (budget blocks that are neither sub-labels nor toggle rows) go last.
  // Keeps the accepted preview order even though the Prompts cluster lives in a
  // later source section than the pickers.
  if(buckets.budget && buckets.budget.length){
    let cluster=0; // 0 = Display cluster (first in source)
    buckets.budget.forEach(b=>{
      const sub=b.getAttribute&&b.getAttribute('data-settings-sub');
      const isToggle=b.classList&&b.classList.contains('dark-toggle-row');
      if(sub==='display'){ cluster=0; b._clrank=0; }
      else if(sub==='prompts'){ cluster=2; b._clrank=2; }
      else if(isToggle){ b._clrank=cluster; }      // toggle inherits current cluster
      else { b._clrank=3; }                          // picker → last
    });
    buckets.budget = buckets.budget
      .map((b,i)=>({b,i,r:b._clrank}))
      .sort((x,y)=> x.r!==y.r ? x.r-y.r : x.i-y.i)
      .map(o=>o.b);
  }

  // Build a page group per non-empty bucket, in defined order, after the last orig section.
  _SETTINGS_PAGE_ORDER.forEach(([key,label,eyebrow])=>{
    const blocks=buckets[key]; if(!blocks||!blocks.length) return;
    const group=document.createElement('div');
    group.className='settings-sect settings-page-group';
    group.setAttribute('data-page-group',key);
    const hdr=document.createElement('div');
    hdr.className='settings-page-hdr';
    hdr.innerHTML=`<span class="spg-eyebrow">${eyebrow}</span>${label}`;
    group.appendChild(hdr);
    blocks.forEach(b=>group.appendChild(b)); // moves the live node (handlers preserved)
    card.appendChild(group);
  });
  const ctFoot=document.getElementById('settings-contact-footer');
  if(ctFoot) card.appendChild(ctFoot);
}

function _setSettingsView(mode){
  STATE.settings.settingsView = (mode==='page')?'page':'category';
  saveToStorage();
  _applySettingsView(STATE.settings.settingsView);
  // Re-apply any active search filter so it works within the current view.
  const sb=document.getElementById('settings-search');
  if(sb && sb.value) _filterSettings(sb.value);
}

function _filterSettings(q){
  const term=(q||'').trim().toLowerCase();
  const sects=document.querySelectorAll('.settings-sect');
  let shown=0;
  sects.forEach(sec=>{
    const hay=((sec.getAttribute('data-sect')||'')+' '+(sec.textContent||'')).toLowerCase();
    const match=!term||hay.indexOf(term)!==-1;
    sec.style.display=match?'':'none';
    if(match) shown++;
  });
  const nr=document.getElementById('settings-no-results');
  if(nr) nr.style.display=(term&&shown===0)?'block':'none';
}

/* ── Export ────────────────────────────────────────────────────────────────
   STATE now holds media IDS, not bytes. A JSON file full of ids is worthless
   on another device — the blobs live in THIS browser's IndexedDB.

   So the export INLINES every blob back into the payload as a data: URL. The
   file stays a complete, self-contained backup, which was always the point. */
async function exportDataJson(){
  const btn = document.activeElement;
  const _lbl = (btn && btn.tagName==='BUTTON') ? btn.textContent : null;
  if(_lbl!==null){ btn.disabled = true; btn.textContent = 'Preparing…'; }
  try{ await _exportDataJsonInner(); }
  catch(e){ console.warn('Export failed', e); alert('Export failed: ' + (e.message||e)); }
  finally{ if(_lbl!==null){ btn.disabled = false; btn.textContent = _lbl; } }
}

/* blob: URL -> data: URL, so the bytes travel inside the JSON. */
function _blobUrlToDataUrl(url){
  return fetch(url).then(r=>r.blob()).then(b=>new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=()=>res(fr.result);
    fr.onerror=()=>rej(new Error('read failed'));
    fr.readAsDataURL(b);
  }));
}

async function _exportDataJsonInner(){
  const payload = {
    hasSetup: true,
    event: STATE.event,
    settings: STATE.settings,
    guests: STATE.guests,
    checklist: STATE.checklist,
    vendors: STATE.vendors||[],
    quotes: STATE.quotes||[],
    checklistCategories: STATE.checklistCategories||[],
    checklistDrafts: STATE.checklistDrafts||[],
    checklistCatOrder: STATE.checklistCatOrder||[],
    budget: STATE.budget,
    tables: STATE.tables,
    seating: STATE.seating,
    inspo: STATE.inspo,
    visionboard: STATE.visionboard,
    wishingwell: STATE.wishingwell,
    website: STATE.website,
    timeline: STATE.timeline||[],
    events: STATE.events||[],
    families: STATE.families||[],
    tagDefs: STATE.tagDefs||{},
    invites: STATE.invites||[],
    inviteMeta: STATE.inviteMeta||{},
    invitation: STATE.invitation||{},
    dashWidgetOrder: STATE.dashWidgetOrder,
    dashLayout: STATE.dashLayout,
    dashHiddenWidgets: STATE.dashHiddenWidgets,
    darkMode: document.body.classList.contains('dark'),
    sidebarMode: STATE.settings.sidebarMode||'hamburger',
    exportedAt: new Date().toISOString(),
    mediaFormat: 'inline-v114',
  };

  /* Deep-copy so we never mutate live STATE, then walk every media ref and
     swap the id for the actual bytes. A ref whose blob is gone exports as ''
     — the record survives, the pixels don't, and an import will show that. */
  const out = JSON.parse(JSON.stringify(payload));
  const jobs = [];
  let lost = 0;

  /* A MISSING BLOB LEAVES THE REF ALONE. It used to write '' — and that is how
     a BACKUP TOOL DESTROYED DATA. Export could not resolve a ref, so it blanked
     it; import skipped the blank (not a data: URL); and the reference was gone
     for good. The bytes might have been recoverable. The pointer never was.

     A ref pointing at nothing is a bad state you can SEE ("Image not saved") and
     might repair. A blank is a bad state that looks like an empty field. Keep the
     ref, count the loss, and TELL the user. */
  _mediaRefs(out, 'id').forEach(t=>{
    const url = _mediaUrl(t.get());
    if(!url){ lost++; return; }                 /* keep the ref. say so below. */
    jobs.push(_blobUrlToDataUrl(url).then(d=>t.set(d)).catch(()=>{ lost++; }));
  });

  await Promise.all(jobs);

  const json = JSON.stringify(out, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const mb = (blob.size/1024/1024).toFixed(1);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const _slug=s=>s.replace(/[^a-zA-Z0-9]/g,'');
  const p1 = _slug(STATE.event.partner1||'Partner1');
  const p2 = _slug(STATE.event.partner2||'Partner2');
  const date = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `UnionVault-${p1}-${p2}-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  /* The export SUCCEEDED — the file is on disk. Stamp it, and refresh the pill
     in place if Settings happens to be open. A backup that isn't complete is
     STILL a backup: `lost` refs are counted and reported, everything else is in
     the file, so it resets the clock. Do not withhold the stamp on partial. */
  STATE.settings.lastBackupAt = new Date().toISOString();
  saveToStorage();
  _refreshBackupAgePill();

  /* Do NOT claim "a complete restore" when it isn't one. */
  if(lost){
    alert(`Backup saved — ${mb} MB.\n\n⚠️ ${lost} image${lost===1?'':'s'} could not be included, `
        + `because ${lost===1?'its file is':'their files are'} no longer in this browser. `
        + `Everything else — including every image that IS still stored — is in the file.`);
  } else if(blob.size > 5*1024*1024){
    alert(`Backup saved — ${mb} MB. It includes your photos and files, so it's a complete restore.`);
  }
}

let _pendingImportData = null;
let _importing = false;
let _pendingDateAdjust = null;

function importDataFromText(){
  const text = (document.getElementById('import-json-text')?.value||'').trim();
  if(!text){ alert('Please paste your JSON data into the text box first.'); return; }
  try {
    const data = JSON.parse(text);
    if(!data.hasSetup && !data.event){ alert('This does not appear to be a valid Union Vault backup file.'); return; }
    _pendingImportData = data;
    openModal('Import Data',`
      <div style="text-align:center;padding:8px 0">
        <div style="width:46px;height:46px;border-radius:50%;background:rgba(192,101,62,.12);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;margin-bottom:10px;color:var(--ink)">Replace all data?</div>
        <div style="font-size:13.5px;color:var(--muted);line-height:1.6">This will overwrite everything — guests, budget, checklist and all settings — with the imported data.<br><br>This cannot be undone.</div>
      </div>`,
      `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
       <button class="btn btn-danger" onclick="applyImportedData()">Yes, Import</button>`);
  } catch(e){ alert('Invalid JSON — please make sure you copied the full contents of the exported file.'); }
}

function triggerImportJson(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.position = 'fixed';
  input.style.top = '-9999px';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.addEventListener('change', function(){
    const file = input.files[0];
    document.body.removeChild(input);
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if(!data.hasSetup && !data.event){ alert('This does not appear to be a valid Union Vault backup file.'); return; }
        _pendingImportData = data;
        openModal('Import Data',`
          <div style="text-align:center;padding:8px 0">
            <div style="width:46px;height:46px;border-radius:50%;background:rgba(192,101,62,.12);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;margin-bottom:10px;color:var(--ink)">Replace all data?</div>
            <div style="font-size:13.5px;color:var(--muted);line-height:1.6">This will overwrite everything — guests, budget, checklist and all settings — with the imported file.<br><br>This cannot be undone.</div>
          </div>`,
          `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
           <button class="btn btn-danger" onclick="applyImportedData()">Yes, Import</button>`);
      } catch(e){ alert('Could not read file. Make sure it is a valid Union Vault JSON export.'); }
    };
    reader.readAsText(file);
  });
  input.click();
}

/* ── Import ────────────────────────────────────────────────────────────────
   A backup file carries its media INLINE as data: URLs. We move each one into
   IndexedDB and leave an id behind, which is the shape STATE now expects.

   The old code, when the payload wouldn't fit, stripped the images and saved
   the rest. That can't happen any more: images never enter localStorage in the
   first place, so there is nothing to strip and nothing to lose. */
async function applyImportedData(){
  if(!_pendingImportData){ closeModalDirect(); return; }
  const data = _pendingImportData;

  // Stop any save from clobbering the imported payload during reload.
  _importing = true;
  try { window.removeEventListener('beforeunload', saveToStorage); } catch(e){}

  function tryWrite(payload){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // Verify the write actually landed
    const back = localStorage.getItem(STORAGE_KEY);
    if(!back) throw new Error('write-not-persisted');
    return true;
  }

  /* Pull every inline data: URL out of the payload and into IndexedDB.
     One walk — the SAME walk export used, so the two cannot disagree about
     where media lives. That disagreement is the whole bug this replaces. */
  async function rehydrate(src){
    const targets = _mediaRefs(src, 'data');
    let failed = 0;
    for(const t of targets){
      try{ t.set(await _mediaPut(t.get(), t.name, t.type)); }
      catch(e){
        /* Do NOT blank it. The same rule as export: a ref with no blob shows as
           "Image not saved" and can be re-added; a blank field cannot even be
           seen. Leave the data: URL in place — _mediaUrl() passes data: straight
           through, so the image still RENDERS, it just isn't in the store. */
        failed++;
        console.warn('Import: one file could not be stored', e);
      }
    }
    if(!src.settings) src.settings = {};
    src.settings._mediaMigratedV114 = true;   /* already in the new shape */
    if(failed) console.warn('Import: ' + failed + ' file(s) stayed inline');
    return targets.length;
  }

  try {
    await rehydrate(data);          /* media -> IndexedDB, ids left behind */
    tryWrite(data);                 /* the rest -> localStorage (now small) */
    _pendingImportData = null;
    closeModalDirect();
    // Flag the reload as a post-import boot so auto-sync pushes UP instead of loading down
    try{ sessionStorage.setItem('uv_import_pending', '1'); }catch(_){}
    location.reload();
  } catch(e){
    _importing = false;
    try { window.addEventListener('beforeunload', saveToStorage); } catch(e3){}
    alert('Import failed — the file could not be saved to this browser ('+(e.name||e.message)+'). Your existing data was not changed.');
  }
}

function cleanGuestData(){
  const guestIds=new Set(STATE.guests.map(g=>g.id));
  let fixed=0;
  STATE.guests.forEach(g=>{
    if(g.coupleId&&!guestIds.has(g.coupleId)){ g.coupleId=null; fixed++; }
    if(g.plusOneId&&!guestIds.has(g.plusOneId)){ g.plusOneId=null; fixed++; }
  });
  // Remove orphaned plus-one guests
  const before=STATE.guests.length;
  STATE.guests=STATE.guests.filter(g=>{
    if(g.relationship==='Plus One'&&g.coupleId){
      const primary=STATE.guests.find(x=>x.id===g.coupleId);
      if(!primary) return false;
    }
    return true;
  });
  fixed+=before-STATE.guests.length;
  if(STATE.families){
    STATE.families.forEach(f=>{
      const b=f.memberIds.length;
      f.memberIds=f.memberIds.filter(id=>guestIds.has(id));
      fixed+=b-f.memberIds.length;
    });
    STATE.families=STATE.families.filter(f=>f.memberIds.length>0);
  }
  saveToStorage();
  const msg=fixed>0?`✓ Fixed ${fixed} stale reference${fixed!==1?'s':''}.`:'✓ No issues found — guest data is clean.';
  const t=document.createElement('div');
  t.textContent=msg;
  t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--cream);padding:10px 22px;border-radius:24px;font-size:13px;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none';
  document.body.appendChild(t);
  requestAnimationFrame(()=>{ t.style.opacity='1'; setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),400); },3000); });
}
function confirmResetData(){
  openModal('Reset All Data',`
    <div style="text-align:center;padding:8px 0">
      <div style="font-family:'Cormorant Garamond',serif;font-size:22px;margin-bottom:10px;color:var(--ink)">Reset everything?</div>
      <div style="font-size:13.5px;color:var(--muted);line-height:1.6">All guests, budget, checklist tasks, seating and settings will be permanently deleted. This cannot be undone.</div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-danger" onclick="applyResetData()">Yes, Reset</button>`);
}
function applyResetData(){
  // Stop any save from re-creating storage during reload (same race as import).
  _importing = true;
  try { window.removeEventListener('beforeunload', saveToStorage); } catch(e){}
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(_HIDDEN_KEY);
  } catch(e){}
  closeModalDirect();
  location.reload();
}
// ── Start from scratch: selectively clear data types (distinct from Reset All) ──
// A multi-select dialog. Clearing a type also scrubs its cross-links from the other
// side (connections only, not the records there). Guarded by a typed-CLEAR confirm.
const _SFS_OPTIONS=[
  {key:'budget', label:'Payments', desc:'Deletes every budget category and sub-item. Also removes the budget link from any checklist task — the tasks themselves stay.'},
  {key:'checklist', label:'Checklist tasks', desc:'Deletes every checklist task. Also clears the task link from any Payment — the Payments themselves stay.'},
  {key:'guests', label:'Guest list', desc:'Deletes every guest, and clears their seating-chart assignments.'},
  {key:'timeline', label:'Day-of timeline', desc:'Deletes every event on the day-of schedule.'},
  {key:'inspo', label:'Inspiration', desc:'Deletes saved colours and inspiration images, and clears the vision board.'},
];
function openStartFromScratch(){
  const rows=_SFS_OPTIONS.map(o=>`
    <label style="display:flex;align-items:flex-start;gap:11px;padding:12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer">
      <input type="checkbox" class="sfs-box" data-key="${o.key}" onchange="_sfsUpdate()" style="width:17px;height:17px;cursor:pointer;accent-color:var(--gold);flex-shrink:0;margin-top:1px"/>
      <span style="flex:1">
        <span style="font-size:14px;color:var(--ink);font-weight:500">${o.label}</span>
        <span style="display:block;font-size:12px;color:var(--muted);line-height:1.45;margin-top:3px">${o.desc}</span>
      </span>
    </label>`).join('');
  const body=`<div style="display:flex;flex-direction:column">
    <div style="font-size:13px;color:var(--muted);line-height:1.5;margin-bottom:15px">Tick what you'd like to clear. Selected data is permanently deleted — this can't be undone.</div>
    ${rows}
    <div id="sfs-confirm" style="display:none;margin-top:6px;padding-top:13px;border-top:1px solid var(--border)">
      <div style="font-size:12.5px;color:var(--ink);line-height:1.5;margin-bottom:7px">Type <strong style="color:var(--red,#C0392B);letter-spacing:.05em">CLEAR</strong> to confirm.</div>
      <input class="form-input" id="sfs-confirm-input" placeholder="CLEAR" oninput="_sfsUpdate()" autocomplete="off" style="text-transform:uppercase"/>
    </div>
  </div>`;
  const footer=`<button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Cancel</button>
    <button class="btn btn-danger" id="sfs-go" disabled style="opacity:.5;pointer-events:none" onclick="_applyStartFromScratch()">Clear selected</button>`;
  openModal('Start from scratch', body, footer);
  _sfsUpdate();
}
function _sfsSelectedKeys(){
  return Array.from(document.querySelectorAll('.sfs-box')).filter(b=>b.checked).map(b=>b.dataset.key);
}
// Reveal the typed-CLEAR gate once something is ticked; enable the button only when
// at least one box is ticked AND the confirm text reads CLEAR.
function _sfsUpdate(){
  const keys=_sfsSelectedKeys();
  const any=keys.length>0;
  const confirmWrap=document.getElementById('sfs-confirm');
  if(confirmWrap) confirmWrap.style.display = any ? 'block' : 'none';
  const typed=(document.getElementById('sfs-confirm-input')?.value||'').trim().toUpperCase();
  const ok = any && typed==='CLEAR';
  const go=document.getElementById('sfs-go');
  if(go){ go.disabled=!ok; go.style.opacity=ok?'1':'.5'; go.style.pointerEvents=ok?'auto':'none'; }
}
function _applyStartFromScratch(){
  const keys=_sfsSelectedKeys();
  if(!keys.length) return;
  const sel=new Set(keys);
  if(sel.has('budget')){
    // Drop all budget items + sub-items, and remove their links from checklist tasks.
    STATE.budget.items=[];
    STATE.checklist.forEach(t=>{ t.budgetId=''; t.budgetSubId=''; });
  }
  if(sel.has('checklist')){
    // Drop all checklist tasks, the custom category list, and clear the reverse link
    // from Payments. (Task-derived categories disappear once the tasks are gone.)
    STATE.checklist=[];
    STATE.checklistCategories=[];
    STATE.budget.items.forEach(b=>{ b.checklistId=''; });
  }
  if(sel.has('guests')){
    // Drop all guests, clear seating, and any couple/plus-one/family/invite refs.
    STATE.guests=[];
    STATE.seating={};
    if(Array.isArray(STATE.families)) STATE.families=[];
    if(Array.isArray(STATE.invites)) STATE.invites=[];
  }
  if(sel.has('timeline')){
    STATE.timeline=[];
  }
  if(sel.has('inspo')){
    // Clear inspiration (colours + images) and the vision board that references them.
    STATE.inspo={colors:[], items:[]};
    STATE.visionboard=[];
  }
  saveToStorage();
  closeModalDirect();
  // Re-render whatever page the user is on so the cleared data disappears immediately.
  navigate(_currentPage||'settings');
}
// ══════════════════════════════════════════════
