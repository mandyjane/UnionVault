// DASHBOARD
// ══════════════════════════════════════════════
function buildDashVisionHtml(){
  const allItems=STATE.visionboard.map(id=>STATE.inspo.items.find(i=>i.id===id)).filter(Boolean);
  // How many pinned cards the dashboard widget shows (Edit Layout > Show). Default 12.
  let _dashCount=STATE.settings.vbDashCount;
  if(_dashCount===undefined||_dashCount===null) _dashCount=12;
  // If user has hand-picked ideas, use that curated set; otherwise fall back to first N.
  const _pinnedIds = STATE.settings.vbDashPinned;
  let vbItems;
  if(_pinnedIds && _pinnedIds.length){
    const _idMap=Object.fromEntries(allItems.map(i=>[i.id,i]));
    vbItems=_pinnedIds.map(id=>_idMap[id]).filter(Boolean);
  } else {
    vbItems = _dashCount==='all' ? allItems : allItems.slice(0, _dashCount);
  }
  const _hasPinned = !!(_pinnedIds && _pinnedIds.length);
  const layout=STATE.settings.vbLayout||'scrapbook';
  let vbSize;try{vbSize=localStorage.getItem('uv-vb-size');}catch(e){}
  if(!vbSize)vbSize=STATE.settings.vbSize;
  if(!vbSize){ vbSize = STATE.settings.vbDensity==='2' ? 'medium' : (STATE.settings.vbDensity==='3' ? 'small' : 'small'); }
  if(!['xsmall','small','medium','large'].includes(vbSize)) vbSize='small';
  // Desktop per-row card minimum width by size (mobile counts come from CSS classes).
  const colMin = vbSize==='large' ? '210px' : (vbSize==='medium' ? '150px' : (vbSize==='xsmall' ? '92px' : '120px'));
  // Fixed cards-per-row by size: XS=4, S=3, M=2, L=1 (applies to grid-style layouts).
  const colCount = vbSize==='xsmall' ? 4 : (vbSize==='small' ? 3 : (vbSize==='medium' ? 2 : 1));
  const gridCols = `repeat(${colCount},minmax(0,1fr))`;
  const isDark=document.body.classList.contains('dark');
  const paperBg=isDark?'#16141A':'#F9F4EC';
  const cardBg=isDark?'#1E1B26':'#FFFDF8';
  const cardShadow=isDark?'rgba(0,0,0,.45)':'rgba(60,40,20,.18)';
  const inkColor=isDark?'#C8BFB0':'#3A2E20';
  const mutedInk=isDark?'#6A6070':'#8A7A65';
  const tilts=[-2.5,-1.2,2.1,-1.8,1.5,-2.2];
  const tapeColors=['rgba(196,168,130,.55)','rgba(180,192,168,.55)','rgba(168,180,200,.55)','rgba(210,185,165,.55)','rgba(172,180,162,.55)','rgba(196,168,130,.45)'];

  const emptyHtml=`<div style="text-align:center;padding:32px 20px;background:${paperBg};border-radius:16px;border:1px solid var(--border)"><div style="font-family:'Cormorant Garamond',serif;font-size:17px;color:${mutedInk};font-style:italic">No ideas pinned yet</div></div>`;

  const xs=vbSize==='xsmall', dense=vbSize==='small'||xs, big=vbSize==='large';
  const imagesOnly=!!STATE.settings.vbDashImagesOnly;
  const _titleSz=xs?'11px':(dense?'12px':(big?'15px':'13px'));
  const _catSz=xs?'8.5px':(dense?'9px':'10px');
  const _imgMax=xs?'108px':(dense?'150px':(big?'215px':'170px'));
  // When Images-only is on, drop the caption block and round all image corners (no caption beneath).
  const _imgRadius=imagesOnly?'4px':'4px 4px 0 0';
  // Bare framing when Images-only: no card background, padding or shadow.
  const _cardBg = imagesOnly ? 'transparent' : cardBg;
  const _cardShadowGrid = imagesOnly ? 'none' : `0 2px 8px ${cardShadow}`;
  const _cardShadowEd   = imagesOnly ? 'none' : `0 2px 6px ${cardShadow}`;
  const _cardShadowMood = imagesOnly ? 'none' : `0 2px 6px ${cardShadow}`;
  const _scrapBg     = imagesOnly ? 'transparent' : cardBg;
  const _scrapPad    = imagesOnly ? '0' : '4px 4px 6px';
  const _scrapShadow = imagesOnly ? 'none' : `3px 4px 14px ${cardShadow}`;
  function miniCard(item){ return`${_mediaUrl(item.image)?`<img src="${_mediaUrl(item.image)}" alt="${item.title}" style="width:100%;display:block;object-fit:cover;max-height:${_imgMax};border-radius:${_imgRadius}" onerror="this.style.display='none'"/>`:''}${imagesOnly?'':`<div style="padding:${xs?'4px 6px 6px':'5px 7px 7px'}"><div style="font-family:'Cormorant Garamond',serif;font-size:${_titleSz};color:${inkColor};line-height:1.25">${item.title}</div>${dense?'':`<div style="font-size:${_catSz};color:${mutedInk};font-style:italic;margin-top:2px">${item.category}</div>`}</div>`}`; }
  // In normal (non-edit) mode, clicking a dashboard card opens the enlarged idea
  // preview. stopPropagation keeps the widget-level navigate('visionboard') from
  // also firing. In Edit Layout mode, cards aren't individually clickable.
  const cardClick = item => dashEditMode ? '' : ` onclick="event.stopPropagation();openInspoPreview('${item.id}',event.currentTarget)"`;
  const cardCursor = dashEditMode ? '' : 'cursor:pointer;';

  let gridHtml='';
  if(!vbItems.length){ gridHtml=emptyHtml; }
  else if(layout==='scrapbook'){
    const _dashWall = _vbWallUrl(isDark);
    const _dashTint = _vbTintLayers(isDark);
    const jit=(n,seed)=>{ const x=Math.sin((n+1)*9.73+seed*4.19)*43758.5453; return x-Math.floor(x); };
    const _dashColMin = vbSize==='large' ? '210px' : (vbSize==='medium' ? '150px' : (vbSize==='xsmall' ? '78px' : '104px'));
    gridHtml=`<div style="position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--border);padding:24px 6px 28px;background-image:${_dashTint.grad},url('${_dashWall}');background-size:auto,360px;background-repeat:repeat,repeat;background-blend-mode:${_dashTint.blend},normal">
      <div class="vb-board vb-scrapbook vb-dash vb-size-${vbSize}" style="position:relative;z-index:1;columns:${_dashColMin};column-gap:8px;orphans:1;widows:1">
        ${vbItems.map((item,idx)=>{const tilt=tilts[idx%tilts.length];const tape=tapeColors[idx%tapeColors.length];const nudge=(jit(idx,2.2)*4-2).toFixed(1);const tiltX=(tilt+(jit(idx,6.6)*2.4-1.2)).toFixed(2);const topGap=(6+jit(idx,8.8)*22).toFixed(0);return`<div${cardClick(item)} style="break-inside:avoid;margin:${topGap}px 0 18px;display:inline-block;width:100%;${cardCursor}transform:translateX(${nudge}px)"><div style="position:relative;background:${_scrapBg};border-radius:3px;padding:${_scrapPad};box-shadow:${_scrapShadow};transform:rotate(${tiltX}deg);transform-origin:center top;transition:transform .2s" onmouseover="this.style.transform='rotate(0deg) scale(1.02)'" onmouseout="this.style.transform='rotate(${tiltX}deg)'">${_mediaUrl(item.image)?`<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%) rotate(${(tilt*0.4).toFixed(2)}deg);width:42px;height:16px;background:${tape};border-radius:2px;opacity:.85;z-index:2"></div>`:''}${miniCard(item)}</div></div>`;}).join('')}
      </div>
    </div>`;
  } else if(layout==='grid'){
    gridHtml=`<div class="vb-board vb-grid vb-dash vb-size-${vbSize}" style="display:grid;grid-template-columns:${gridCols};gap:12px">
      ${vbItems.map(item=>`<div${cardClick(item)} style="${cardCursor}background:${_cardBg};border-radius:8px;overflow:hidden;box-shadow:${_cardShadowGrid}">${miniCard(item)}</div>`).join('')}
    </div>`;
  } else if(layout==='editorial'){
    const [first,...rest]=vbItems;
    gridHtml=`<div>
      ${first?`<div${cardClick(first)} style="${cardCursor}background:${_cardBg};border-radius:10px;overflow:hidden;box-shadow:${imagesOnly?'none':`0 2px 10px ${cardShadow}`};margin-bottom:12px">${_mediaUrl(first.image)?`<img src="${_mediaUrl(first.image)}" style="width:100%;max-height:200px;object-fit:cover;display:block" onerror="this.style.display='none'"/>`:''}${imagesOnly?'':`<div style="padding:10px 12px 14px"><div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:${inkColor}">${first.title}</div><div style="font-size:10.5px;color:${mutedInk};font-style:italic;margin-top:2px">${first.category}</div></div>`}</div>`:'' }
      <div class="vb-board vb-editorial-grid vb-dash vb-size-${vbSize}" style="display:grid;grid-template-columns:${gridCols};gap:10px">
        ${rest.map(item=>`<div${cardClick(item)} style="${cardCursor}background:${_cardBg};border-radius:8px;overflow:hidden;box-shadow:${_cardShadowEd}">${miniCard(item)}</div>`).join('')}
      </div>
    </div>`;
  } else if(layout==='mood'){
    const moodCols = vbSize==='large'?1:(vbSize==='medium'?2:(vbSize==='xsmall'?4:3));
    gridHtml=`<div class="vb-board vb-mood vb-size-${vbSize}" style="columns:${moodCols};column-gap:8px">
      ${vbItems.map((item,idx)=>`<div${cardClick(item)} style="${cardCursor}break-inside:avoid;margin-bottom:8px;background:${_cardBg};border-radius:6px;overflow:hidden;box-shadow:${_cardShadowMood}">${_mediaUrl(item.image)?`<img src="${_mediaUrl(item.image)}" style="width:100%;display:block;object-fit:cover;max-height:${100+((idx%3)*40)}px" onerror="this.style.display='none'"/>`:''}${imagesOnly?'':`<div style="padding:5px 7px 7px"><div style="font-family:'Cormorant Garamond',serif;font-size:12px;color:${inkColor}">${item.title}</div></div>`}</div>`).join('')}
    </div>`;
  }

  // In Edit Layout mode, show a compact X-Small / Small / Medium / Large picker
  // that writes through setVbSize so the dashboard and the full board stay in sync.
  const sizePicker = dashEditMode ? `<div onclick="event.stopPropagation()" style="pointer-events:none;display:flex;align-items:center;gap:8px 10px;flex-wrap:wrap;width:100%"><span style="font-size:10px;font-weight:600;letter-spacing:.08em;color:var(--muted)">SHOW</span><div style="pointer-events:none;display:inline-flex;border:.5px solid var(--border);border-radius:8px;overflow:hidden">
    ${[['6','6'],['12','12'],['18','18'],['all','All']].map(([k,lbl],i)=>{
      const active=String(_dashCount)===k;
      return `<button type="button" onclick="setVbDashCount('${k}')" title="Show ${lbl==='All'?'all':lbl} cards" style="${i>0?'border-left:.5px solid var(--border);':''}border:none;${active?'background:var(--gold-deep);color:#fff;font-weight:600;':'background:transparent;color:var(--muted);font-weight:500;'}padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;pointer-events:auto">${lbl}</button>`;
    }).join('')}
  </div><div style="pointer-events:none;display:inline-flex;border:.5px solid var(--border);border-radius:8px;overflow:hidden">
    ${[['xsmall','XS','X-Small'],['small','S','Small'],['medium','M','Medium'],['large','L','Large']].map(([k,lbl,full],i)=>{
      const active=vbSize===k;
      return `<button type="button" onclick="setVbSize('${k}')" title="${full}" style="${i>0?'border-left:.5px solid var(--border);':''}border:none;${active?'background:var(--gold-deep);color:#fff;font-weight:600;':'background:transparent;color:var(--muted);font-weight:500;'}padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;pointer-events:auto">${lbl}</button>`;
    }).join('')}
  </div><div style="pointer-events:none;display:inline-flex;border:.5px solid var(--border);border-radius:8px;overflow:hidden">
    ${[['captions','Captions',false],['images','Images',true]].map(([k,lbl,val],i)=>{
      const active=imagesOnly===val;
      return `<button type="button" onclick="setVbImagesOnly(${val})" title="${val?'Show images only':'Show captions'}" style="${i>0?'border-left:.5px solid var(--border);':''}border:none;${active?'background:var(--gold-deep);color:#fff;font-weight:600;':'background:transparent;color:var(--muted);font-weight:500;'}padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;pointer-events:auto">${lbl}</button>`;
    }).join('')}
  </div><div style="pointer-events:none;display:inline-flex;border:.5px solid var(--border);border-radius:8px;overflow:hidden">
    ${[['original','Original'],['palette','Palette']].map(([k,lbl],i)=>{
      const active=(STATE.settings.vbBgTint||'original')===k;
      return `<button type="button" onclick="setVbBgTint('${k}')" title="${k==='palette'?'Tint the background with your palette colours':'Neutral background'}" style="${i>0?'border-left:.5px solid var(--border);':''}border:none;${active?'background:var(--gold-deep);color:#fff;font-weight:600;':'background:transparent;color:var(--muted);font-weight:500;'}padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;pointer-events:auto">${lbl}</button>`;
    }).join('')}
  </div><button type="button" onclick="event.stopPropagation();openVbDashPicker()" style="pointer-events:auto;border:none;background:${_hasPinned?'var(--gold-deep)':'var(--surface)'};color:${_hasPinned?'#fff':'var(--muted)'};border-radius:8px;padding:5px 13px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;border:.5px solid ${_hasPinned?'var(--gold-deep)':'var(--border)'};display:inline-flex;align-items:center;gap:6px"><svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>${_hasPinned?'Curated':'Pick ideas'}</button></div>` : `<button class="btn btn-outline btn-sm" onclick="navigate('visionboard')">View full board \u2192</button>`;

  // Palette tint colour picker — only in edit mode when Palette tint is active.
  const _tintMode = STATE.settings.vbBgTint || 'original';
  const _palAll = (STATE.inspo && Array.isArray(STATE.inspo.colors)) ? STATE.inspo.colors : [];
  const _tintChosen = _vbTintColorList();
  let tintPicker = '';
  if(dashEditMode && _tintMode==='palette'){
    if(!_palAll.length){
      tintPicker = `<div style="pointer-events:none;width:100%;background:var(--surface);border:.5px solid var(--border);border-radius:10px;padding:11px 13px;font-size:12px;color:var(--muted)">No palette colours selected yet — add some on the Inspiration page to tint the scrapbook.</div>`;
    } else {
      const chip = (hex, chosenIdx) => {
        const on = chosenIdx>=0;
        const ord = on ? (chosenIdx+1) : 0;
        const isLight = isLightColor(hex);
        const arrows = on ? `<span style="display:inline-flex;flex-direction:column;margin-left:2px;line-height:.7">
            <button type="button" onclick="event.stopPropagation();moveVbTintColor('${hex}',-1)" title="Move earlier" style="border:none;background:transparent;color:#C9B89C;cursor:pointer;font-size:9px;padding:0;line-height:1">▲</button>
            <button type="button" onclick="event.stopPropagation();moveVbTintColor('${hex}',1)" title="Move later" style="border:none;background:transparent;color:#C9B89C;cursor:pointer;font-size:9px;padding:0;line-height:1">▼</button>
          </span>` : '';
        return `<div onclick="toggleVbTintColor('${hex}')" title="${on?'Remove from tint':'Add to tint'}" style="pointer-events:auto;display:inline-flex;align-items:center;gap:6px;padding:4px 9px 4px 5px;border:.5px solid ${on?'#C9B89C':'#E3D7C4'};border-radius:20px;background:${on?'#FBF8F3':'#FBF8F3'};${on?'box-shadow:0 0 0 1px #C9B89C inset;':''}font-size:11.5px;color:var(--ink);cursor:pointer;font-family:inherit">
          <span style="width:17px;height:17px;border-radius:50%;background:${hex};border:1.5px solid #fff;box-shadow:0 0 0 .5px rgba(0,0,0,.14)${isLight?',inset 0 0 0 .5px #d8cdbb':''}"></span>
          <span>${hex}</span>${on?`<span style="font-size:8.5px;font-weight:700;color:#C9B89C">${ord}</span>`:''}${arrows}
        </div>`;
      };
      // Chosen first (in order), then the rest of the palette.
      const rest = _palAll.filter(h=>!_tintChosen.includes(h));
      const chips = [..._tintChosen.map((h)=>chip(h,_tintChosen.indexOf(h))), ...rest.map(h=>chip(h,-1))].join('');
      tintPicker = `<div onclick="event.stopPropagation()" style="pointer-events:none;width:100%;background:#FBF8F3;border:.5px solid #E3D7C4;border-radius:11px;padding:11px 13px">
        <div style="font-size:11.5px;color:var(--muted);margin-bottom:9px">Tap colours to tint the scrapbook. Use the arrows to reorder — the first colour is strongest.</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px">${chips}</div>
      </div>`;
    }
  }

  const _headFlex = dashEditMode
    ? 'display:flex;flex-direction:column;align-items:flex-start;gap:12px;margin-bottom:14px'
    : 'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;flex-wrap:wrap';
  return`<div style="margin-top:20px"><div style="${_headFlex}"><div><div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Inspiration</div><div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--ink)">Vision Board</div></div>${sizePicker}${tintPicker}</div>${gridHtml}</div>`;
}

let dashEditMode = false;
let dragDashId = null;

// Expand invite slot keys (solo/couple/plusone/fam) to a Set of invited guest ids.
// Shared by the dashboard counts and the RSVP & Invites table.
function _invitedGuestIdSet(){
  // A guest counts as "invited" if their slot is in STATE.invites (invite sent)
  // OR if their slot's save-the-date has been marked sent.
  const inviteKeys=new Set(STATE.invites||[]);
  if(STATE.inviteMeta){
    Object.entries(STATE.inviteMeta).forEach(([k,m])=>{ if(m&&m.savedate&&m.savedate.sent) inviteKeys.add(k); });
  }
  const invited=new Set();
  const seen=new Set();
  (STATE.guests||[]).forEach(g=>{
    if(seen.has(g.id)) return;
    const fam=(STATE.families||[]).find(f=>f.memberIds.includes(g.id));
    if(fam){
      fam.memberIds.forEach(id=>seen.add(id));
      if(inviteKeys.has('fam:'+fam.id)) fam.memberIds.forEach(id=>{ if(STATE.guests.find(x=>x.id===id)) invited.add(id); });
      return;
    }
    if(g.coupleId){
      const partner=STATE.guests.find(x=>x.id===g.coupleId);
      if(partner&&!seen.has(partner.id)){
        seen.add(g.id); seen.add(partner.id);
        if(inviteKeys.has('couple:'+g.id)||inviteKeys.has('couple:'+partner.id)){ invited.add(g.id); invited.add(partner.id); }
        return;
      }
    }
    if(g.plusOneId){
      const plus=STATE.guests.find(x=>x.id===g.plusOneId);
      if(plus&&!seen.has(plus.id)){
        seen.add(g.id); seen.add(plus.id);
        if(inviteKeys.has('plusone:'+g.id)||inviteKeys.has('plusone:'+plus.id)){ invited.add(g.id); invited.add(plus.id); }
        return;
      }
    }
    seen.add(g.id);
    if(inviteKeys.has('solo:'+g.id)) invited.add(g.id);
  });
  return invited;
}

function renderDashboard(c, actions){
  // Edit layout toggle button
  actions.innerHTML = `
    <button class="btn btn-sm btn-outline" onclick="openExportHub()" title="Print or save shareable documents" style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      <span class="dash-export-label" style="white-space:nowrap">Print / Export</span>
    </button>
    <button class="btn btn-sm ${dashEditMode?'btn-primary':'btn-outline edit-layout-btn'}" onclick="toggleDashEdit()" style="display:inline-flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        ${dashEditMode
          ? '<polyline points="20 6 9 17 4 12"/>'
          : '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'}
      </svg>
      ${dashEditMode ? 'Done' : '<span class="dash-edit-label">Edit </span>Layout'}
    </button>`;

  // Calculate invited guests — expand invite slot keys to individual guest IDs
  const _inviteKeys=new Set(STATE.invites||[]);
  if(STATE.inviteMeta){Object.entries(STATE.inviteMeta).forEach(([k,m])=>{if(m&&m.savedate&&m.savedate.sent)_inviteKeys.add(k);});}
  const _invitedGuestIds=new Set();
  const _seen=new Set();
  STATE.guests.forEach(g=>{
    if(_seen.has(g.id)) return;
    // Family — all members invited together
    const fam=(STATE.families||[]).find(f=>f.memberIds.includes(g.id));
    if(fam){
      fam.memberIds.forEach(id=>_seen.add(id));
      if(_inviteKeys.has('fam:'+fam.id)) fam.memberIds.forEach(id=>{ if(STATE.guests.find(x=>x.id===id)) _invitedGuestIds.add(id); });
      return;
    }
    // Couple (check both lead orderings)
    if(g.coupleId){
      const partner=STATE.guests.find(x=>x.id===g.coupleId);
      if(partner&&!_seen.has(partner.id)){
        _seen.add(g.id); _seen.add(partner.id);
        if(_inviteKeys.has('couple:'+g.id)||_inviteKeys.has('couple:'+partner.id)){
          _invitedGuestIds.add(g.id); _invitedGuestIds.add(partner.id);
        }
        return;
      }
    }
    // Plus-one (check both orderings)
    if(g.plusOneId){
      const plus=STATE.guests.find(x=>x.id===g.plusOneId);
      if(plus&&!_seen.has(plus.id)){
        _seen.add(g.id); _seen.add(plus.id);
        if(_inviteKeys.has('plusone:'+g.id)||_inviteKeys.has('plusone:'+plus.id)){
          _invitedGuestIds.add(g.id); _invitedGuestIds.add(plus.id);
        }
        return;
      }
    }
    // Solo
    _seen.add(g.id);
    if(_inviteKeys.has('solo:'+g.id)) _invitedGuestIds.add(g.id);
  });
  const _allAList=(STATE.guests||[]).filter(g=>(g.listType||'A')!=='B');
  const total=_allAList.length;
  const invitedCount=_allAList.filter(g=>_invitedGuestIds.has(g.id)).length;
  const attending=_allAList.filter(g=>g.rsvp==='attending').length;
  const declined=_allAList.filter(g=>g.rsvp==='declined').length;
  const awaiting=total-attending-declined;
  const _activeCl=STATE.checklist.filter(i=>!i.archived);
  const checkDone=_activeCl.filter(i=>i.done).length;
  const checkTotal=_activeCl.length;
  const pct=Math.round(checkDone/checkTotal*100)||0;
  const budgetTotal=STATE.budget.total||0;
  const pinned=_activeCl.filter(i=>i.pinned&&!i.done);
  // "Next up" list, in priority order, capped at 6 (a JS fitter trims further to fit
  // the card's actual height): 1) dated tasks due within the next month (soonest
  // first); 2) undated tasks (pinned first, then in added order); 3) dated tasks due
  // beyond a month (soonest first).
  const _nuToday=new Date(); _nuToday.setHours(0,0,0,0);
  const _nuMonthEnd=new Date(_nuToday); _nuMonthEnd.setMonth(_nuMonthEnd.getMonth()+1);
  const _nuOpen=_activeCl.filter(i=>!i.done);
  const _byDate=(a,b)=>new Date(a.dueDate)-new Date(b.dueDate);
  const _nuWithin=_nuOpen.filter(i=>i.dueDate && new Date(i.dueDate+'T00:00:00')<=_nuMonthEnd).sort(_byDate);
  const _nuUndated=_nuOpen.filter(i=>!i.dueDate).sort((a,b)=>{
    const ap=a.pinned?0:1, bp=b.pinned?0:1; if(ap!==bp) return ap-bp;
    return _activeCl.indexOf(a)-_activeCl.indexOf(b);
  });
  const _nuFar=_nuOpen.filter(i=>i.dueDate && new Date(i.dueDate+'T00:00:00')>_nuMonthEnd).sort(_byDate);
  const upcoming=[..._nuWithin, ..._nuUndated, ..._nuFar].slice(0,6);
  // Budget payments due within the next month (next 31 days), plus anything overdue and unpaid
  const _budgetToday=new Date();_budgetToday.setHours(0,0,0,0);
  const _budgetDue=[];
  (STATE.budget.items||[]).forEach(b=>{
    const pushIf=(dateVal,paid,label,amount)=>{
      if(!dateVal||paid) return;
      const d=new Date(dateVal+'T00:00:00');
      const diff=(d-_budgetToday)/86400000;
      if(diff<=31) _budgetDue.push({label,date:dateVal,diff,overdue:diff<0,amount:Number(amount||0)});
    };
    pushIf(!b.depositFromSubs&&b.depositDueDate,b.depositPaid,`${b.name} — deposit`,calcBudgetDeposit(b));
    pushIf(b.balanceDueDate,b.paid,`${b.name} — balance`,calcBudgetBalance(b));
    (b.subItems||[]).forEach(s=>{
      const sRemain=Math.max(0, getSubItemAmount(s) - (s.depositPaid?Number(s.deposit||0):0));
      pushIf(s.depositDueDate,s.depositPaid,`${b.name}: ${s.name} — deposit`,Number(s.deposit||0));
      pushIf(s.balanceDueDate,s.paid,`${b.name}: ${s.name} — balance`,sRemain);
    });
  });
  _budgetDue.sort((a,b)=>a.diff-b.diff);
  const budgetDue=_budgetDue.slice(0,4);
  const p1=STATE.event.partner1||'Partner 1';
  const p2=STATE.event.partner2||'Partner 2';
  const totalDays=STATE.event.date?Math.max(0,Math.ceil((new Date(STATE.event.date+'T00:00:00')-new Date())/86400000)):null;
  const countdownMode=STATE.settings.countdownUnit||'days';

  // Build countdown display value and label
  let countdownHtml='';
  if(totalDays!==null){
    if(countdownMode==='monthsdays'){
      const months=Math.floor(totalDays/30.4375);
      const remainDays=Math.round(totalDays-(months*30.4375));
      if(months>0&&remainDays>0){
        countdownHtml=`<div style="margin-top:24px;display:inline-flex;align-items:baseline;gap:6px;background:var(--surface);border:1px solid var(--border);padding:10px 20px;border-radius:40px;flex-wrap:wrap">
          <span style="font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:500;color:var(--gold-deep);line-height:1">${months}</span>
          <span style="font-size:12px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;align-self:center">${months===1?'month':'months'}</span>
          <span style="font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:500;color:var(--gold-deep);line-height:1;margin-left:6px">${remainDays}</span>
          <span style="font-size:12px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;align-self:center">${remainDays===1?'day':'days'} to go</span>
        </div>`;
      }else if(months>0){
        countdownHtml=`<div style="margin-top:24px;display:inline-flex;align-items:baseline;gap:10px;background:var(--surface);border:1px solid var(--border);padding:10px 20px;border-radius:40px">
          <span style="font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:500;color:var(--gold-deep);line-height:1">${months}</span>
          <span style="font-size:12px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase">${months===1?'month':'months'} to go</span>
        </div>`;
      }else{
        countdownHtml=`<div style="margin-top:24px;display:inline-flex;align-items:baseline;gap:10px;background:var(--surface);border:1px solid var(--border);padding:10px 20px;border-radius:40px">
          <span style="font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:500;color:var(--gold-deep);line-height:1">${totalDays}</span>
          <span style="font-size:12px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase">${totalDays===1?'day':'days'} to go</span>
        </div>`;
      }
    }else{
      countdownHtml=`<div style="margin-top:24px;display:inline-flex;align-items:baseline;gap:10px;background:var(--surface);border:1px solid var(--border);padding:10px 20px;border-radius:40px">
        <span style="font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:500;color:var(--gold-deep);line-height:1">${totalDays}</span>
        <span style="font-size:12px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase">${totalDays===1?'day':'days'} to go</span>
      </div>`;
    }
  }


  // ── Hero style variants (Style 1 current / 2 crest / 3 ring) ──
  const heroStyle = STATE.settings.heroStyle || 1;
  const _mono = `${initials(p1)}${initials(p2)}`;
  const _dateLine = STATE.event.date ? `${fmtDate(STATE.event.date)}${STATE.event.venue?' · '+STATE.event.venue:''}` : '';
  // Months & remaining days for the compact crest countdown line
  let _cdMonths=0, _cdDays=0;
  if(totalDays!==null){ _cdMonths=Math.floor(totalDays/30.4375); _cdDays=Math.round(totalDays-(_cdMonths*30.4375)); }
  // Compact inline countdown (months + days, or just days) used by Style 2
  let _cdLine='';
  if(totalDays!==null){
    if(_cdMonths>0&&_cdDays>0){
      _cdLine=`<span style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:var(--gold-deep);line-height:1">${_cdMonths}</span><span style="font-size:11px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase">${_cdMonths===1?'month':'months'}</span><span style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:var(--gold-deep);line-height:1">${_cdDays}</span><span style="font-size:11px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase">${_cdDays===1?'day':'days'} to go</span>`;
    }else{
      _cdLine=`<span style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:var(--gold-deep);line-height:1">${totalDays}</span><span style="font-size:11px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase">${totalDays===1?'day':'days'} to go</span>`;
    }
  }
  // Ring progress for Style 3: fraction through a 365-day runway (fills as the day nears)
  const _ringCirc = 2*Math.PI*58; // r=58
  const _ringPct = totalDays===null ? 0 : Math.max(0, Math.min(1, (365-Math.min(totalDays,365))/365));
  const _ringOffset = _ringCirc*(1-_ringPct);

  // Build each widget's HTML as named functions
  const W = {
    kpis: ()=>{
      const kStyle = STATE.settings.kpiStyle || 1;
      // v178 Budget Used: % of budget committed, with paid / still-to-pay underneath (option C).
      // Was "% · $X deposited", summing every deposit amount whether paid or not.
      const _bf=_budgetSummaryFigures(), _bt=_bf.budgetTotal||0;
      const BU = { p: _bt?Math.round(_bf.totalCost/_bt*100):0,
                   sub: `${fmt(_bf.totalPaid)} paid · ${fmt(Math.max(0,_bf.totalCost-_bf.totalPaid))} to pay` };
      const BUf=Math.min(100,BU.p)/100;
      const attendPct = total?Math.round(attending/total*100):0;
      // Ring geometry (r=31 → circumference ~194.78)
      const RC = 2*Math.PI*31;
      const ringDash = (frac)=>{ const f=Math.max(0,Math.min(1,frac)); return `stroke-dasharray="${RC.toFixed(1)}" stroke-dashoffset="${(RC*(1-f)).toFixed(1)}"`; };
      let cards;
      if(kStyle===2){
        // Style 2 — progress rings
        const ring=(label,valueHtml,sub,frac,color,nav)=>`<div onclick="navigate('${nav}')" style="background:var(--cream);border:1px solid var(--border);border-radius:14px;padding:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px" title="Go to ${label}">
          <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">${label}</div>
          <div style="position:relative;width:72px;height:72px">
            <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="31" fill="none" stroke="var(--surface)" stroke-width="5"/><circle class="${color==='var(--green)'?'green-prog-stroke':'gold-prog-stroke'}" cx="36" cy="36" r="31" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" ${ringDash(frac)} transform="rotate(-90 36 36)"/></svg>
            <div class="${color==='var(--green)'?'green-prog-text':''}" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:Cormorant Garamond,serif;font-size:26px;font-weight:600;line-height:1;color:${color==='var(--green)'?'var(--green)':'var(--ink)'}">${valueHtml}</div>
          </div>
          <div style="font-size:11.5px;color:var(--muted)">${sub}</div>
        </div>`;
        cards = ring('Guests',`${total}`,`${invitedCount} invited`,invitedCount/Math.max(1,total),'var(--gold)','guests')
          + ring('Attending',`${attending}`,`${attendPct}% confirmed`,attendPct/100,'var(--green)','guests')
          + ring('Planning',`${pct}<span style="font-size:14px">%</span>`,`${checkDone} of ${checkTotal} tasks`,pct/100,'var(--gold)','checklist')
          + ring('Budget Used',`${BU.p}<span style="font-size:14px">%</span>`,BU.sub,BUf,'var(--gold)','budget');
      } else if(kStyle===3){
        // Style 3 — progress bars
        const barCard=(label,valueHtml,sub,frac,color,nav)=>`<div onclick="navigate('${nav}')" style="background:var(--cream);border:1px solid var(--border);border-radius:14px;padding:15px 16px 14px;cursor:pointer;display:flex;flex-direction:column" title="Go to ${label}">
          <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">${label}</div>
          <div style="font-family:Cormorant Garamond,serif;font-size:38px;font-weight:600;line-height:1;color:${color==='var(--green)'?'var(--green)':'var(--ink)'}">${valueHtml}</div>
          <div style="font-size:11.5px;color:var(--muted);margin:4px 0 12px">${sub}</div>
          <div style="height:4px;background:var(--surface);border-radius:2px;overflow:hidden;margin-top:auto"><div style="height:100%;width:${Math.max(0,Math.min(100,frac*100))}%;background:${color};border-radius:2px;transition:width .4s"></div></div>
        </div>`;
        cards = barCard('Guests',`${total}`,`${invitedCount} invited`,invitedCount/Math.max(1,total),'var(--gold)','guests')
          + barCard('Attending',`${attending}`,`${attendPct}% confirmed`,attendPct/100,'var(--green)','guests')
          + barCard('Planning',`${pct}<span style="font-size:20px">%</span>`,`${checkDone} of ${checkTotal} tasks`,pct/100,'var(--gold)','checklist')
          + barCard('Budget Used',`${BU.p}<span style="font-size:20px">%</span>`,BU.sub,BUf,'var(--gold)','budget');
      } else if(kStyle===4){
        // Style 4 — icon tiles
        const iconCard=(label,valueHtml,iconSvg,color,nav)=>`<div onclick="navigate('${nav}')" style="background:var(--cream);border:1px solid var(--border);border-radius:14px;padding:14px;cursor:pointer;display:flex;align-items:center;gap:13px" title="Go to ${label}">
          <div style="width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--parchment)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg></div>
          <div style="min-width:0"><div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:3px">${label}</div><div style="font-family:Cormorant Garamond,serif;font-size:30px;font-weight:600;line-height:1;color:${color==='var(--green)'?'var(--green)':'var(--ink)'}">${valueHtml}</div></div>
        </div>`;
        cards = iconCard('Guests',`${total}`,'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>','var(--ink)','guests')
          + iconCard('Attending',`${attending}`,'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>','var(--green)','guests')
          + iconCard('Planning',`${pct}<span style="font-size:17px">%</span>`,'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>','var(--ink)','checklist')
          + iconCard('Budget Used',`${BU.p}<span style="font-size:17px">%</span>`,'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>','var(--ink)','budget');
      } else {
        // Style 1 — framed plaque (letterpress-style inset border, centered serif)
        const plaque=(label,valueHtml,sub,color,nav)=>`<div onclick="navigate('${nav}')" class="kpi-plaque" style="background:var(--cream);border:1px solid var(--border);border-radius:14px;padding:15px 16px;cursor:pointer;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px" title="Go to ${label}">
          <div style="font-family:Cormorant Garamond,serif;font-size:14px;font-style:italic;letter-spacing:.02em;color:var(--gold-deep)">${label}</div>
          <div style="font-family:Cormorant Garamond,serif;font-size:42px;font-weight:600;line-height:1;color:${color==='var(--green)'?'var(--green)':'var(--ink)'};margin:2px 0">${valueHtml}</div>
          <div style="font-size:11px;color:var(--muted)">${sub}</div>
        </div>`;
        cards = plaque('Guests',`${total}`,`${invitedCount} invited`,'var(--ink)','guests')
          + plaque('Attending',`${attending}`,`${attendPct}% confirmed`,'var(--green)','guests')
          + plaque('Planning',`${pct}<span style="font-size:22px">%</span>`,`${checkDone} of ${checkTotal} tasks`,'var(--ink)','checklist')
          + plaque('Budget Used',`${BU.p}<span style="font-size:22px">%</span>`,BU.sub,'var(--ink)','budget');
      }
      return `<div id="db-w-kpis" class="db-widget" style="position:relative">
        <div class="kpi-stat-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">${cards}</div>
      </div>`;
    },

    progress: ()=>`<div id="db-w-progress" class="db-widget" style="background:var(--cream);border:1px solid var(--border);border-radius:16px;padding:20px;cursor:pointer" onclick="navigate('checklist')" title="Go to Checklist">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div>
          <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Checklist</div>
          <div style="font-family:Cormorant Garamond,serif;font-size:20px;font-weight:500;color:var(--ink)">Planning Progress</div>
        </div>
        <div style="font-family:Cormorant Garamond,serif;font-size:32px;font-weight:600;color:var(--ink)">${pct}<span style="font-size:16px;color:var(--muted)">%</span></div>
      </div>
      <div style="height:6px;background:var(--surface);border-radius:3px;overflow:hidden;margin-bottom:14px">
        <div class="gold-prog" style="height:100%;width:${pct}%;background:var(--gold);border-radius:3px;transition:width .4s"></div>
      </div>
      ${upcoming.length?`<div style="border-top:1px solid var(--border);padding-top:16px">
        <div style="font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:12px">Next up</div>
        <div id="db-nextup-list">${upcoming.map((i,idx)=>`<div class="db-nextup-row" style="display:flex;align-items:flex-start;gap:10px;${idx<upcoming.length-1?"padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid var(--border)":""}">
          <div style="width:5px;height:5px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:6px;opacity:.7"></div>
          <div style="flex:1;min-width:0"><div style="font-size:13px;color:var(--ink)">${i.text}</div>${i.dueDate?`<div style="font-size:11px;margin-top:2px">${dueDateLabel(i.dueDate,i.done,'COMPLETE')}</div>`:""}</div>
        </div>`).join("")}</div>
      </div>`:"<div style=\"text-align:center;padding:12px 0;font-size:13px;color:var(--muted)\">All caught up</div>"}
    </div>`,

    rsvp: ()=>`<div id="db-w-rsvp" class="db-widget" style="background:var(--cream);border:1px solid var(--border);border-radius:16px;padding:20px;cursor:pointer" onclick="navigate('guests')" title="Go to Guests">
      <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Responses</div>
      <div style="font-family:Cormorant Garamond,serif;font-size:20px;font-weight:500;color:var(--ink);margin-bottom:14px">RSVP Summary</div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:34px;height:34px;border-radius:8px;background:rgba(92,143,114,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px"><span style="font-size:13px;color:var(--ink)">Attending</span><span><span style="font-size:11.5px;color:var(--muted);margin-right:7px">${total?Math.round(attending/total*100):0}%</span><span style="font-family:Cormorant Garamond,serif;font-size:18px;font-weight:600;color:var(--green)">${attending}</span></span></div><div style="height:3px;background:var(--surface);border-radius:2px"><div class="green-prog" style="height:100%;width:${total?attending/total*100:0}%;background:var(--green);border-radius:2px;opacity:.6"></div></div></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:34px;height:34px;border-radius:8px;background:rgba(194,112,112,.08);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
          <div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px"><span style="font-size:13px;color:var(--ink)">Declined</span><span><span style="font-size:11.5px;color:var(--muted);margin-right:7px">${total?Math.round(declined/total*100):0}%</span><span style="font-family:Cormorant Garamond,serif;font-size:18px;font-weight:600;color:var(--red)">${declined}</span></span></div><div style="height:3px;background:var(--surface);border-radius:2px"><div style="height:100%;width:${total?declined/total*100:0}%;background:var(--red);border-radius:2px;opacity:.5"></div></div></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:34px;height:34px;border-radius:8px;background:var(--surface);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px"><span style="font-size:13px;color:var(--ink)">Awaiting</span><span><span style="font-size:11.5px;color:var(--muted);margin-right:7px">${total?Math.round(awaiting/total*100):0}%</span><span style="font-family:Cormorant Garamond,serif;font-size:18px;font-weight:600;color:var(--muted)">${awaiting}</span></span></div><div style="height:3px;background:var(--surface);border-radius:2px"><div style="height:100%;width:${total?awaiting/total*100:0}%;background:var(--muted);border-radius:2px;opacity:.4"></div></div></div>
        </div>
      </div>
    </div>`,

    budgetGlance: ()=>{
      const f=(typeof _budgetSummaryFigures==='function')?_budgetSummaryFigures():{totalCost:0,totalPaid:0,budgetTotal:0};
      const allocated=f.totalCost||0, spent=f.totalPaid||0, gTotal=f.budgetTotal||0;
      // v178: same four figures and words as the Budget page (was Allocated / Spent / Remaining).
      const F4=_budgetFourFigures(allocated, spent, gTotal);
      const over=F4.over;
      const denom=Math.max(gTotal, allocated, 1);
      const spentPct=Math.max(0,Math.min(100,Math.round(spent/denom*100)));
      const commPct=Math.max(0,Math.min(100,Math.round(allocated/denom*100)));
      const commExtra=Math.max(0,commPct-spentPct);
      const remColor=F4.remColor;
      const remLabel=F4.remLbl;
      const warn=over?`<div style="display:flex;align-items:center;gap:7px;margin-top:11px;background:rgba(192,101,62,.1);border:1px solid rgba(192,101,62,.3);border-radius:8px;padding:7px 11px;font-size:12px;color:var(--red-deep)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Over budget by ${fmt(allocated-gTotal)} — committed exceeds your total.
        </div>`:'';
      return `<div id="db-w-budgetGlance" class="db-widget" style="background:var(--cream);border:1px solid var(--border);border-radius:16px;padding:20px;cursor:pointer" onclick="navigate('budget')" title="Go to Budget">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Finances</div>
            <div style="font-family:Cormorant Garamond,serif;font-size:20px;font-weight:500;color:var(--ink)">Budget at a glance</div>
          </div>
          <button class="budget-glance-btn" onclick="event.stopPropagation();openBudgetSummaryReport()" title="View &amp; download full budget summary" aria-label="View and download budget summary" style="flex-shrink:0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="13" y2="11"/></svg>
          </button>
        </div>
        <div style="display:flex;gap:18px;margin:16px 0 12px;flex-wrap:wrap">
          <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Committed</div><div style="font-family:Cormorant Garamond,serif;font-size:22px;font-weight:600;color:var(--ink)">${fmt(allocated)}</div></div>
          <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Paid</div><div style="font-family:Cormorant Garamond,serif;font-size:22px;font-weight:600;color:var(--green)">${fmt(spent)}</div></div>
          <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Left to pay</div><div style="font-family:Cormorant Garamond,serif;font-size:22px;font-weight:600;color:var(--gold-deep)">${fmt(F4.due)}</div></div>
          <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">${remLabel}</div><div style="font-family:Cormorant Garamond,serif;font-size:22px;font-weight:600;color:${remColor}">${F4.remVal}</div></div>
        </div>
        <div style="height:10px;background:var(--surface);border-radius:5px;overflow:hidden;display:flex">
          <div style="width:${spentPct}%;background:var(--green);opacity:.85"></div>
          <div style="width:${commExtra}%;background:${over?'var(--red)':'var(--gold)'};opacity:.55"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;gap:6px;flex-wrap:wrap">
          <span style="color:var(--green)">Paid ${fmt(spent)}</span>
          <span style="color:var(--gold-deep)">Left to pay ${fmt(F4.due)}</span>
          <span style="color:var(--muted)">of ${fmt(gTotal)}</span>
        </div>
        ${warn}
      </div>`;
    },

    budget: ()=>`<div id="db-w-budget" class="db-widget" style="background:var(--cream);border:1px solid var(--border);border-radius:16px;padding:20px;cursor:pointer" onclick="navigate('budget')" title="Go to Budget">
      <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Finances</div>
      <div style="font-family:Cormorant Garamond,serif;font-size:20px;font-weight:500;color:var(--ink);margin-bottom:12px">Budget</div>
      ${(()=>{ /* v178: everything actually paid (was: the sum of every deposit, paid or not). */
        const f=_budgetSummaryFigures(), F4=_budgetFourFigures(f.totalCost,f.totalPaid,f.budgetTotal);
        const den=Math.max(f.budgetTotal,f.totalCost,1), pw=Math.min(100,f.totalPaid/den*100), dw=Math.min(100-pw,F4.due/den*100);
        return `<div style="font-family:Cormorant Garamond,serif;font-size:36px;font-weight:600;color:var(--green);line-height:1">${fmt(f.totalPaid)}</div>
      <div style="font-size:12.5px;color:var(--muted);margin-top:6px;margin-bottom:12px">paid of <strong style="color:var(--ink)">${fmt(f.budgetTotal)}</strong></div>
      <div style="height:6px;background:var(--surface);border-radius:3px;overflow:hidden;display:flex"><div style="height:100%;width:${pw}%;background:var(--green);opacity:.85"></div><div style="height:100%;width:${dw}%;background:${F4.over?'var(--red)':'var(--gold)'};opacity:.6"></div></div>
      ${f.budgetTotal?`<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;gap:8px;flex-wrap:wrap"><span style="color:var(--gold-deep)">${fmt(F4.due)} left to pay</span><span style="color:${F4.remColor}">${F4.remVal} ${F4.remLbl.toLowerCase()}</span></div>`:''}`; })()}
      ${budgetDue.length?`<div style="border-top:1px solid var(--border);padding-top:16px;margin-top:18px">
        <div style="font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:12px">Coming up</div>
        ${budgetDue.map((p,idx)=>{
          const days=Math.round(p.diff);
          let when;
          if(p.overdue) when=`Overdue · ${fmtDate(p.date)}`;
          else if(days===0) when='Due today';
          else if(days===1) when='Due tomorrow';
          else when=`Due in ${days} days · ${fmtDate(p.date)}`;
          const col=p.overdue?'var(--red)':(days<=7?'var(--gold-deep)':'var(--muted)');
          const amtHtml=p.amount>0?`<div style="font-size:13px;font-weight:600;color:var(--gold-deep);font-variant-numeric:tabular-nums;flex-shrink:0;margin-left:8px">${fmt(p.amount)}</div>`:'';
          return `<div style="display:flex;align-items:flex-start;gap:10px;${idx<budgetDue.length-1?"padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid var(--border)":""}">
            <div style="width:5px;height:5px;border-radius:50%;background:${p.overdue?'var(--red)':'var(--gold)'};flex-shrink:0;margin-top:6px;opacity:.7"></div>
            <div style="flex:1;min-width:0"><div style="font-size:13px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.label}</div><div style="font-size:11px;margin-top:2px;color:${col}">${when}</div></div>
            ${amtHtml}
          </div>`;
        }).join("")}
      </div>`:""}
    </div>`,

    pinned: ()=>`<div id="db-w-pinned" class="db-widget" style="background:var(--cream);border:1px solid var(--border);border-radius:16px;padding:20px;cursor:pointer" onclick="navigate('checklist')" title="Go to Checklist">
      ${pinned.length?`
        <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Pinned</div>
        <div style="font-family:Cormorant Garamond,serif;font-size:20px;font-weight:500;color:var(--ink);margin-bottom:12px">Tasks</div>
        ${pinned.slice(0,4).map(i=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)"><div style="width:2px;min-height:20px;background:var(--gold);border-radius:1px;flex-shrink:0;margin-top:3px;opacity:.6"></div><div style="flex:1;min-width:0"><div style="font-size:13px;color:var(--ink)">${i.text}</div>${i.dueDate?`<div style="font-size:11.5px;margin-top:3px">${dueDateLabel(i.dueDate,i.done,'COMPLETE')}</div>`:''}${i.notes?`<div style="font-size:11.5px;color:var(--muted);margin-top:2px">${i.notes}</div>`:""}</div></div>`).join("")}`
      :(STATE.event.venue||STATE.event.date)?`
        <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">The Event</div>
        <div style="font-family:Cormorant Garamond,serif;font-size:20px;font-weight:500;color:var(--ink);margin-bottom:14px">Details</div>
        ${STATE.event.date?`<div style="margin-bottom:12px"><div style="font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Date</div><div style="font-family:Cormorant Garamond,serif;font-size:22px;color:var(--ink)">${fmtDate(STATE.event.date)}</div></div>`:""}
        ${STATE.event.venue?`<div><div style="font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Venue</div><div style="font-size:14px;color:var(--ink)">${STATE.event.venue}</div>${STATE.event.venueAddress?`<div style="font-size:12px;color:var(--muted);margin-top:3px">${STATE.event.venueAddress}</div>`:""}</div>`:""}`
      :`<div style="text-align:center;padding:20px 0;font-size:13px;color:var(--muted)">Pin checklist tasks to see them here</div>`}
    </div>`
  };

  let order = STATE.dashWidgetOrder && STATE.dashWidgetOrder.length ? [...STATE.dashWidgetOrder] : ['kpis','progress','rsvp','budget','budgetGlance','pinned','vendorlookup','visionboard','wishingwell'];
  // Migration: ensure visionboard is in the order (old saved data won't have it)
  if(!order.includes('visionboard')) order.push('visionboard');
  if(!order.includes('wishingwell')) order.push('wishingwell');
  // Migration: insert the new Budget-at-a-glance widget after the budget widget
  // for existing users whose saved order predates it.
  if(!order.includes('budgetGlance')){
    const bi=order.indexOf('budget');
    if(bi>=0) order.splice(bi+1,0,'budgetGlance'); else order.push('budgetGlance');
  }
  // Migration: Vendor Look Up coverage widget — sits after Pinned, before the
  // full-width solo widgets, so it lands in the 2-column area where it belongs.
  if(!order.includes('vendorlookup')){
    const pi=order.indexOf('pinned');
    if(pi>=0) order.splice(pi+1,0,'vendorlookup');
    else {
      const vi=order.indexOf('visionboard');
      if(vi>=0) order.splice(vi,0,'vendorlookup'); else order.push('vendorlookup');
    }
  }
  // Persist the migrated/normalised order so the drag-drop handler (which reads
  // STATE.dashWidgetOrder directly) sees every widget id — otherwise newly added
  // widgets like Budget-at-a-glance and Vision Board can't be reordered.
  STATE.dashWidgetOrder = [...order];

  // ── Free 2-column layout model ──
  // STATE.dashLayout is an array of rows; each row is an array of 1 or 2 widget ids.
  // It is derived from / kept in sync with the flat STATE.dashWidgetOrder so every
  // other consumer (save payloads, hidden toggles, migrations) keeps working.
  // soloWidgets are always full-width (their own single-id row).
  _dashSyncLayout(order);

  // Add vision board widget (full width, solo)
  W.visionboard = ()=> STATE.settings.showVisionOnDash ? `<div id="db-w-visionboard" class="db-widget"${dashEditMode?'':' style="cursor:pointer" onclick="navigate(\'visionboard\')" title="Go to Vision Board"'}>${buildDashVisionHtml()}</div>` : null;

  // Add wishing well widget (full width, solo)
  if(!order.includes('wishingwell')) order.push('wishingwell');
  W.wishingwell = ()=> STATE.settings.showWishingWellOnDash ? `<div id="db-w-wishingwell" class="db-widget" style="cursor:pointer" onclick="navigate('wishingwell')" title="Go to Wishing Well">${buildDashWishingWellHtml()}</div>` : null;

  // Vendor Look Up — category coverage. Reads STATE.vendors and shows which key
  // categories are filled and which are still open, with a direct route into the
  // directory filtered to that category.
  W.vendorlookup = ()=> `<div id="db-w-vendorlookup" class="db-widget">${buildDashVendorLookupHtml()}</div>`;

  // Switcher control (deep-beige 4-box icon, no label, no checks) — shared across styles
  const heroSwitcher = !dashEditMode ? '' : `<div class="hero-style-switch">
      <button class="hero-style-btn" onclick="toggleHeroStyleMenu(event)" title="Change layout" aria-label="Change hero layout" aria-haspopup="true">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      </button>
      <div class="hero-style-menu" id="hero-style-menu" style="display:none">
        ${[1,2,3].map(n=>`<div class="hero-style-item ${heroStyle===n?'active':''}" onclick="setHeroStyle(${n})">Style ${n}</div>`).join('')}
      </div>
    </div>`;

  let heroHtml;
  if(heroStyle===2){
    // Style 2 — centered crest (compact)
    heroHtml = `<div class="db-hero db-hero-s2" style="position:relative;border-radius:20px;padding:30px 46px;margin-bottom:24px;overflow:hidden;text-align:center">
      ${heroSwitcher}
      <div style="width:52px;height:52px;border:1px solid var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--gold-deep)">${_mono}</div>
      <div style="font-size:10px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:var(--muted)">The Wedding of</div>
      <div style="font-family:Cormorant Garamond,serif;font-size:clamp(26px,4vw,44px);font-weight:300;color:var(--ink);line-height:1.1;margin-top:12px">${p1} <span style="font-style:italic;color:var(--gold-deep)">&amp;</span> ${p2}</div>
      ${_dateLine?`<div style="font-size:13px;color:var(--muted);margin-top:10px;letter-spacing:.05em">${_dateLine}</div>`:''}
      ${totalDays!==null?`<div style="width:50px;height:1px;background:var(--gold);margin:13px auto"></div><div style="display:inline-flex;align-items:baseline;gap:8px">${_cdLine}</div>`:''}
    </div>`;
  } else if(heroStyle===3){
    // Style 3 — progress ring
    heroHtml = `<div class="db-hero db-hero-s3" style="position:relative;border-radius:20px;padding:40px 46px;margin-bottom:24px;overflow:hidden;display:flex;align-items:center;gap:38px;flex-wrap:wrap">
      ${heroSwitcher}
      ${totalDays!==null?`<div style="position:relative;width:128px;height:128px;flex-shrink:0">
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="58" fill="none" stroke="var(--border)" stroke-width="5"/>
          <circle class="gold-prog-stroke" cx="64" cy="64" r="58" fill="none" stroke="var(--gold)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${_ringCirc.toFixed(1)}" stroke-dashoffset="${_ringOffset.toFixed(1)}" transform="rotate(-90 64 64)"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div style="font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:500;color:var(--gold-deep);line-height:1">${totalDays}</div>
          <div style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:3px">${totalDays===1?'day':'days'} to go</div>
        </div>
      </div>`:''}
      <div style="min-width:0">
        <div style="font-size:10px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:var(--muted)">The Wedding of</div>
        <div style="font-family:Cormorant Garamond,serif;font-size:clamp(26px,4vw,44px);font-weight:300;color:var(--ink);line-height:1.1;margin-top:12px">${p1} <span style="font-style:italic;color:var(--gold-deep)">&amp;</span> ${p2}</div>
        ${_dateLine?`<div style="font-size:13px;color:var(--muted);margin-top:10px;letter-spacing:.05em">${_dateLine}</div>`:''}
      </div>
    </div>`;
  } else {
    // Style 1 — current (default)
    heroHtml = `<div class="db-hero" style="position:relative;border-radius:20px;padding:44px 48px;margin-bottom:24px;overflow:hidden">
      ${heroSwitcher}
      <div style="position:absolute;top:-60px;right:-60px;width:280px;height:280px;border-radius:50%;border:1px solid var(--border);pointer-events:none;opacity:.6"></div>
      <div style="position:absolute;top:-30px;right:-30px;width:180px;height:180px;border-radius:50%;border:1px solid var(--border);pointer-events:none;opacity:.4"></div>
      <div style="position:absolute;bottom:-80px;left:-40px;width:200px;height:200px;border-radius:50%;border:1px solid var(--border);pointer-events:none;opacity:.3"></div>
      <div style="position:absolute;right:48px;top:50%;transform:translateY(-50%);opacity:.04;font-family:Cormorant Garamond,serif;font-size:120px;font-weight:600;color:var(--ink);line-height:1;pointer-events:none;user-select:none">${_mono}</div>
      <div style="position:relative">
        <div style="font-size:10px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:var(--muted);margin-bottom:14px">The Wedding of</div>
        <div style="font-family:Cormorant Garamond,serif;font-size:clamp(26px,4vw,44px);font-weight:300;color:var(--ink);line-height:1.1;margin-bottom:6px">${p1} <span style="font-style:italic;color:var(--gold-deep)">&amp;</span> ${p2}</div>
        ${_dateLine?`<div style="font-size:13px;color:var(--muted);margin-top:10px;letter-spacing:.05em">${_dateLine}</div>`:''}
        ${countdownHtml}
      </div>
    </div>`;
  }

  const hidden = STATE.dashHiddenWidgets || [];
  const widgetLabels = {kpis:'Stats',progress:'Planning Progress',rsvp:'RSVP Summary',budget:'Budget',budgetGlance:'Budget at a Glance',pinned:'Pinned / Event',vendorlookup:'Vendors',visionboard:'Vision Board'};

  function wrapWidget(id, html){
    if(!dashEditMode) return html;
    const isHidden = hidden.includes(id);
    return `<div class="db-drag-wrap" data-wid="${id}" draggable="true"
      ondragstart="dashDragStart(event,'${id}')"
      ondragover="dashDragOver(event,'${id}')"
      ondrop="dashDrop(event,'${id}')"
      ondragend="dashDragEnd(event,'${id}')"
      ondragleave="dashDragLeave(event,'${id}')"
      style="position:relative;cursor:grab;border:2px dashed ${isHidden?'var(--border)':'var(--gold)'};border-radius:18px;padding:2px;transition:all .15s;opacity:${isHidden?'.45':'1'}">
      <!-- Widget toolbar -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 10px 2px;gap:8px">
        <div style="display:flex;align-items:center;gap:5px;color:${isHidden?'var(--muted)':'var(--gold-deep)'};font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="17" r="1.2" fill="currentColor"/><circle cx="15" cy="17" r="1.2" fill="currentColor"/></svg>
          ${widgetLabels[id]||id}
        </div>
        ${id==='kpis'&&!isHidden?`<div style="display:flex;align-items:center;gap:8px">
          <div style="position:relative">
            <button class="kpi-style-btn" onclick="toggleKpiStyleMenu(event)" title="Change layout" aria-label="Change stat card layout" aria-haspopup="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </button>
            <div class="kpi-style-menu" id="kpi-style-menu" style="display:none">
              ${[1,2,3,4].map(n=>`<div class="kpi-style-item ${(STATE.settings.kpiStyle||1)===n?'active':''}" onclick="setKpiStyle(${n})">Style ${n}</div>`).join('')}
            </div>
          </div>
          <button onclick="toggleWidgetVisibility('kpis')" title="Hide widget"
            style="background:var(--parchment);border:1px solid var(--border);border-radius:6px;cursor:pointer;padding:3px 8px;display:flex;align-items:center;gap:4px;font-size:10.5px;color:var(--gold-deep);font-family:Inter,sans-serif;pointer-events:auto">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Hide
          </button>
        </div>`:`<button onclick="toggleWidgetVisibility('${id}')" title="${isHidden?'Show widget':'Hide widget'}"
          style="background:${isHidden?'var(--surface)':'var(--parchment)'};border:1px solid var(--border);border-radius:6px;cursor:pointer;padding:3px 8px;display:flex;align-items:center;gap:4px;font-size:10.5px;color:${isHidden?'var(--muted)':'var(--gold-deep)'};font-family:Inter,sans-serif;pointer-events:auto">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${isHidden
              ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
              : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'}
          </svg>
          ${isHidden?'Show':'Hide'}
        </button>`}
      </div>
      <div style="pointer-events:none;${isHidden?'filter:blur(2px)':''}">
        ${isHidden?`<div style="min-height:60px;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted);font-style:italic;padding:12px">Hidden from dashboard</div>`:html}
      </div>
    </div>`;
  }

  const soloWidgets = ['kpis','visionboard','wishingwell'];
  let widgetsHtml = '';

  // Build the live render rows from STATE.dashLayout, filtering to renderable widgets.
  // Hidden widgets are kept in edit mode (shown with a toggle), skipped in normal mode.
  const layout = (STATE.dashLayout && STATE.dashLayout.length) ? STATE.dashLayout : order.map(id=>[id]);

  if(dashEditMode){
    // Edit mode: render real rows with side drop-slots + new-row drop-lines.
    widgetsHtml += _dashRowDropLine(0);
    layout.forEach((row, ri) => {
      const cells = row.filter(id => W[id] && W[id]() !== undefined);
      if(!cells.length){ widgetsHtml += _dashRowDropLine(ri+1); return; }
      const isSolo = cells.some(id=>soloWidgets.includes(id));
      const paired = (cells.length===2 && !isSolo);
      let inner = '';
      cells.forEach(id=>{
        const html = W[id]();
        inner += `<div style="min-width:0">${wrapWidget(id, html||'')}</div>`;
      });
      // Side pair-slot: only for a single, non-solo widget (room to pair).
      if(cells.length===1 && !isSolo){
        inner += `<div class="db-pair-slot" data-row="${ri}"
          ondragover="dashPairOver(event,${ri})" ondragleave="dashPairLeave(event,${ri})" ondrop="dashPairDrop(event,${ri})"
          style="border:1.5px dashed var(--border);border-radius:18px;display:flex;align-items:center;justify-content:center;gap:7px;min-height:80px;color:var(--muted);font-size:12px;background:transparent;transition:all .15s">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          Drop here to pair
        </div>`;
      }
      if(paired){
        widgetsHtml += `<div class="db-edit-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:6px">${inner}</div>`;
      } else if(cells.length===1 && !isSolo){
        widgetsHtml += `<div class="db-edit-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:6px">${inner}</div>`;
      } else {
        widgetsHtml += `<div class="db-edit-row" style="margin-bottom:6px">${inner}</div>`;
      }
      widgetsHtml += _dashRowDropLine(ri+1);
    });
  } else {
    // Normal mode: render the saved rows as full or 2-col grids.
    layout.forEach(row => {
      const cells = row.filter(id => !hidden.includes(id) && W[id] && W[id]());
      if(!cells.length) return;
      const isSolo = cells.some(id=>soloWidgets.includes(id));
      if(cells.length===2 && !isSolo){
        widgetsHtml += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-bottom:20px">${cells.map(id=>W[id]()).join('')}</div>`;
      } else {
        cells.forEach(id=>{
          widgetsHtml += `<div style="margin-bottom:${soloWidgets.includes(id)?'24px':'20px'}">${W[id]()}</div>`;
        });
      }
    });
  }

  const editBarHtml = dashEditMode ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;padding:10px 16px;background:var(--parchment);border-radius:10px;border:1px solid var(--border);font-size:13px;color:var(--gold-deep)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l3-3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
    Drag a widget onto a side slot to place it beside another, or onto a line to start a new row. Click <strong>Done</strong> when finished.
  </div>` : '';

  const visionHtml = '';

  let _subBanner='';
  if(_sbSession && typeof _uvTier!=='undefined'){
    if(_uvTier==='trial' && _uvTrialDaysLeft>0) _subBanner=`<div class="uv-trial-banner"><span><strong>${_uvTrialDaysLeft} day${_uvTrialDaysLeft===1?'':'s'} left</strong> in your free trial</span><button onclick="_uvGoCheckout()">Upgrade now</button></div>`;
    else if(_uvTier==='free') _subBanner=`<div class="uv-upgrade-card-dash"><div class="uv-dash-title">Unlock Full Access</div><div class="uv-dash-sub">Get unlimited guests, seating plans, print &amp; export, and more</div><button onclick="_uvGoCheckout()">Upgrade now</button></div>`;
  }
  c.innerHTML = _subBanner + heroHtml + editBarHtml + `<div id="dash-widgets">` + widgetsHtml + `</div>` + visionHtml;
  setTimeout(()=>{ requestAnimationFrame(_fitDashNextUp); _ensureDashNextUpObserver(); }, 0);
}

// ── "Next up" fitter (Planning Progress widget) ──────────────────────────────
// Show as many of the (already priority-ordered, ≤6) Next-up rows as fit the card.
// When the widget is paired beside a taller sibling, it can grow to fill that
// height; when it would overflow, rows are hidden from the bottom. Solo/full-width
// widgets simply show all loaded rows.
function _fitDashNextUp(){
  const list=document.getElementById('db-nextup-list');
  if(!list) return;
  const card=document.getElementById('db-w-progress');
  if(!card) return;
  const rows=Array.from(list.children);
  if(!rows.length) return;
  const showAll=()=>{
    rows.forEach((r,idx)=>{
      r.style.display='';
      if(idx<rows.length-1){ r.style.paddingBottom='10px'; r.style.marginBottom='10px'; r.style.borderBottom='1px solid var(--border)'; }
      else { r.style.paddingBottom='0'; r.style.marginBottom='0'; r.style.borderBottom='none'; }
    });
  };
  showAll();
  // Only constrain when the widget is genuinely BESIDE a sibling in a 2-col grid row.
  const gridRow=card.closest('[style*="grid-template-columns"]');
  if(!gridRow) return; // solo / full-width → show all (≤6)
  const cell=(card.parentElement && card.parentElement.parentElement===gridRow) ? card.parentElement : card;
  const cellTop=cell.getBoundingClientRect().top;
  const others=Array.from(gridRow.children).filter(el=>el!==cell);
  const sideSiblings=others.filter(el=>Math.abs(el.getBoundingClientRect().top - cellTop) < 24);
  if(!sideSiblings.length) return; // mobile single-column (stacked) → show all
  // Measure the sibling's NATURAL height independent of the grid's equal-height
  // stretch. Temporarily set align-items:start so cells size to their own content,
  // read heights, then restore. This avoids the trim→shrink→re-measure feedback loop.
  const prevAlign=gridRow.style.alignItems;
  gridRow.style.alignItems='start';
  // Force reflow.
  void gridRow.offsetHeight;
  let budget=0;
  sideSiblings.forEach(el=>{ budget=Math.max(budget, el.getBoundingClientRect().height); });
  const cardNatural=cell.getBoundingClientRect().height;
  gridRow.style.alignItems=prevAlign;
  if(!budget) return;
  // If the card already fits within the sibling's natural height, keep all rows.
  if(cardNatural<=budget+0.5) return;
  // Otherwise hide rows from the bottom until the card's natural height fits. Re-measure
  // with align-items:start each step so the reading isn't masked by the stretch.
  for(let i=rows.length-1;i>=1;i--){
    gridRow.style.alignItems='start';
    void gridRow.offsetHeight;
    const h=cell.getBoundingClientRect().height;
    gridRow.style.alignItems=prevAlign;
    if(h<=budget+0.5) break;
    rows[i].style.display='none';
    let lastVisible=-1;
    for(let j=0;j<rows.length;j++){ if(rows[j].style.display!=='none') lastVisible=j; }
    if(lastVisible>=0){ rows[lastVisible].style.paddingBottom='0'; rows[lastVisible].style.marginBottom='0'; rows[lastVisible].style.borderBottom='none'; }
  }
}
let _dashNextUpRO=null;
function _ensureDashNextUpObserver(){
  const wrap=document.getElementById('dash-widgets');
  if(!wrap){ _dashNextUpRO=null; return; }
  if(typeof ResizeObserver!=='function') return;
  if(_dashNextUpRO) _dashNextUpRO.disconnect();
  _dashNextUpRO=new ResizeObserver(()=>{ if(document.getElementById('db-nextup-list')) requestAnimationFrame(_fitDashNextUp); });
  _dashNextUpRO.observe(wrap);
}

function toggleWidgetVisibility(id){
  const i = STATE.dashHiddenWidgets.indexOf(id);
  if(i >= 0) STATE.dashHiddenWidgets.splice(i, 1);
  else STATE.dashHiddenWidgets.push(id);
  saveToStorage();
  navigate('dashboard');
}

function toggleDashEdit(){
  dashEditMode = !dashEditMode;
  navigate('dashboard');
}
function dashDragStart(e, id){
  dragDashId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(()=>{ const el=document.querySelector('[data-wid="'+id+'"]'); if(el)el.style.opacity='.4'; }, 0);
}
function dashDragEnd(e, id){
  _dashStopAutoScroll();
  const el=document.querySelector('[data-wid="'+id+'"]'); if(el) el.style.opacity='';
  document.querySelectorAll('.db-drag-wrap').forEach(el=>el.style.background='');
}
function dashDragOver(e, id){
  e.preventDefault();
  _dashAutoScroll(e);
  if(id === dragDashId) return;
  document.querySelectorAll('.db-drag-wrap').forEach(el=>el.style.background='');
  const el = document.querySelector('[data-wid="'+id+'"]');
  if(el) el.style.background = 'rgba(196,168,130,.08)';
}
// Auto-scroll the dashboard while dragging near the top/bottom edge of the viewport.
let _dashScrollRAF=null, _dashScrollV=0;
function _dashScrollEl(){
  return document.getElementById('main-content') || document.scrollingElement || document.documentElement;
}
function _dashAutoScroll(e){
  const el=_dashScrollEl();
  const y=e.clientY;
  // Measure the edge bands against the scroll container's own rect, not the raw
  // viewport. The fixed 60px topbar sits above the list and is not a drop target,
  // so dragover stops firing there — anchoring the top band to the container's top
  // (which begins below the topbar) keeps the up-scroll zone inside live drop area.
  let top, H;
  if(el && el.getBoundingClientRect){
    const r=el.getBoundingClientRect();
    top=Math.max(r.top, 0);
    const bottom=Math.min(r.bottom, window.innerHeight||document.documentElement.clientHeight);
    H=bottom-top;
  } else {
    top=0; H=window.innerHeight||document.documentElement.clientHeight;
  }
  const zone=Math.min(110, H*0.18); // edge band
  const maxV=22;                    // px per frame
  const dTop=y-top;                 // distance from container's top edge
  const dBot=(top+H)-y;             // distance from container's bottom edge
  let v=0;
  if(dTop < zone)      v = -maxV * (1 - Math.max(dTop,0)/zone);
  else if(dBot < zone) v =  maxV * (1 - Math.max(dBot,0)/zone);
  _dashScrollV=v;
  if(v!==0 && _dashScrollRAF===null){
    const step=()=>{
      const sel=_dashScrollEl();
      if(_dashScrollV!==0 && sel){ sel.scrollTop += _dashScrollV; _dashScrollRAF=requestAnimationFrame(step); }
      else { _dashScrollRAF=null; }
    };
    _dashScrollRAF=requestAnimationFrame(step);
  }
}
function _dashStopAutoScroll(){ _dashScrollV=0; if(_dashScrollRAF!==null){ cancelAnimationFrame(_dashScrollRAF); _dashScrollRAF=null; } }
function dashDragLeave(e, id){
  const el = document.querySelector('[data-wid="'+id+'"]');
  if(el) el.style.background = '';
}
function dashDrop(e, targetId){
  e.preventDefault();
  _dashStopAutoScroll();
  if(!dragDashId || dragDashId === targetId) return;
  // Reorder by moving the dragged widget to the target's position WITHIN the row
  // structure: remove it from its row, insert it just before the target in the
  // target's row (so dropping a widget on top of another swaps neighbourhood).
  const layout = _dashLayoutNow();
  _dashRemoveFromLayout(layout, dragDashId);
  for(let r=0;r<layout.length;r++){
    const ci = layout[r].indexOf(targetId);
    if(ci>=0){
      // If the target row already holds 2, replace into a new single row before it.
      if(layout[r].length>=2){ layout.splice(r,0,[dragDashId]); }
      else { layout[r].splice(ci,0,dragDashId); }
      break;
    }
  }
  _dashCommitLayout(layout);
  dragDashId = null;
  saveToStorage();
  navigate('dashboard');
}

// ── Free 2-column layout model ──────────────────────────────────────────────
// Keep STATE.dashLayout (rows of 1–2 ids) in sync with the flat STATE.dashWidgetOrder.
const _dashSolo = ['kpis','visionboard','wishingwell'];
function _dashSyncLayout(order){
  // Validate any existing layout against the current order; rebuild if missing/stale.
  let layout = STATE.dashLayout;
  const inOrder = new Set(order);
  let valid = Array.isArray(layout) && layout.length && layout.every(row=>Array.isArray(row)&&row.length>=1&&row.length<=2);
  if(valid){
    // Drop ids no longer present; append any new ids as their own rows.
    const seen = new Set();
    layout = layout.map(row=>row.filter(id=>{ if(!inOrder.has(id)||seen.has(id))return false; seen.add(id); return true; }))
                   .filter(row=>row.length);
    order.forEach(id=>{ if(!seen.has(id)){ layout.push([id]); seen.add(id); } });
    // Enforce solo widgets onto their own row.
    layout = _dashEnforceSolo(layout);
  } else {
    // Fresh build from order: solos full-width, others one-per-row (no auto-pairing,
    // preserving the user's existing single-column edit baseline until they pair).
    layout = order.map(id=>[id]);
  }
  STATE.dashLayout = layout;
  _dashSyncOrderFromLayout(layout);
}
function _dashEnforceSolo(layout){
  const out=[];
  layout.forEach(row=>{
    if(row.length===2 && row.some(id=>_dashSolo.includes(id))){
      row.forEach(id=>out.push([id]));
    } else out.push(row);
  });
  return out;
}
function _dashSyncOrderFromLayout(layout){
  STATE.dashWidgetOrder = layout.reduce((a,row)=>a.concat(row),[]);
}
function _dashLayoutNow(){
  // Deep copy of the current layout for mutation.
  return (STATE.dashLayout||STATE.dashWidgetOrder.map(id=>[id])).map(row=>[...row]);
}
function _dashRemoveFromLayout(layout, id){
  for(let r=0;r<layout.length;r++){
    const i=layout[r].indexOf(id);
    if(i>=0){ layout[r].splice(i,1); if(!layout[r].length) layout.splice(r,1); return; }
  }
}
function _dashCommitLayout(layout){
  layout = _dashEnforceSolo(layout.filter(row=>row.length));
  STATE.dashLayout = layout;
  _dashSyncOrderFromLayout(layout);
}

function _dashRowDropLine(idx){
  return `<div class="db-row-line" data-line="${idx}"
    ondragover="dashLineOver(event,${idx})" ondragleave="dashLineLeave(event,${idx})" ondrop="dashLineDrop(event,${idx})"
    style="height:10px;margin:0 0 4px;border-radius:3px;background:transparent;transition:background .12s"></div>`;
}
// Drop onto a side pair-slot: place the dragged widget beside the row's widget.
function dashPairOver(e, ri){ e.preventDefault(); const el=e.currentTarget; el.style.borderColor='var(--gold)'; el.style.background='rgba(196,168,130,.10)'; el.style.color='var(--gold-deep)'; }
function dashPairLeave(e, ri){ const el=e.currentTarget; el.style.borderColor='var(--border)'; el.style.background='transparent'; el.style.color='var(--muted)'; }
function dashPairDrop(e, ri){
  e.preventDefault(); e.stopPropagation(); _dashStopAutoScroll();
  if(!dragDashId) return;
  if(_dashSolo.includes(dragDashId)){ dragDashId=null; navigate('dashboard'); return; } // solos can't pair
  const layout=_dashLayoutNow();
  const targetRow = layout[ri];
  if(!targetRow || targetRow.length!==1){ dragDashId=null; return; }
  const targetId = targetRow[0];
  if(targetId===dragDashId){ dragDashId=null; return; }
  if(_dashSolo.includes(targetId)){ dragDashId=null; return; }
  _dashRemoveFromLayout(layout, dragDashId);
  // re-find the target row (indices may have shifted after removal)
  for(let r=0;r<layout.length;r++){ if(layout[r].length===1 && layout[r][0]===targetId){ layout[r].push(dragDashId); break; } }
  _dashCommitLayout(layout);
  dragDashId=null; saveToStorage(); navigate('dashboard');
}
// Drop onto a between-rows line: start a new full-width row at that position.
function dashLineOver(e, idx){ e.preventDefault(); e.currentTarget.style.background='var(--gold)'; }
function dashLineLeave(e, idx){ e.currentTarget.style.background='transparent'; }
function dashLineDrop(e, idx){
  e.preventDefault(); e.stopPropagation(); _dashStopAutoScroll();
  if(!dragDashId) return;
  const layout=_dashLayoutNow();
  // Find the dragged widget's current row index so insertion index can be adjusted.
  let fromRow=-1; for(let r=0;r<layout.length;r++){ if(layout[r].includes(dragDashId)){ fromRow=r; break; } }
  _dashRemoveFromLayout(layout, dragDashId);
  let insertAt = idx;
  if(fromRow>=0 && fromRow<idx) insertAt = idx-1; // its own row removal shifts later lines up by 1
  insertAt = Math.max(0, Math.min(insertAt, layout.length));
  layout.splice(insertAt, 0, [dragDashId]);
  _dashCommitLayout(layout);
  dragDashId=null; saveToStorage(); navigate('dashboard');
}


// ══════════════════════════════════════════════
