// GUEST NAME AUTOCOMPLETE (reusable)
// ══════════════════════════════════════════════
function _guestNameList(){
  // Returns sorted array of plain-text names: individuals, couples, families/households
  const names=new Set();

  // Individual guests
  (STATE.guests||[]).forEach(g=>{
    if(!g) return;
    const n=(g.name||'').trim();
    if(n) names.add(n);
  });

  // Couples — plain-text "First1 & First2 Surname" (deduplicated by lower id)
  (STATE.guests||[]).forEach(g=>{
    if(!g||!g.coupleId) return;
    const partner=(STATE.guests||[]).find(x=>x.id===g.coupleId);
    if(!partner) return;
    if(g.id < g.coupleId){
      const n1=(g.name||'').trim(), n2=(partner.name||'').trim();
      if(!n1||!n2){ if(n1||n2) names.add(n1||n2); return; }
      const w1=n1.split(/\s+/), w2=n2.split(/\s+/);
      const minLen=Math.min(w1.length,w2.length);
      let suffixLen=0;
      for(let s=1;s<minLen;s++){
        if(w1.slice(-s).join(' ').toLowerCase()===w2.slice(-s).join(' ').toLowerCase()) suffixLen=s;
      }
      let coupleName;
      if(suffixLen>0){
        const f1=w1.slice(0,-suffixLen).join(' ');
        const f2=w2.slice(0,-suffixLen).join(' ');
        const sur=w1.slice(-suffixLen).join(' ');
        coupleName=f1+' & '+f2+' '+sur;
      } else {
        coupleName=n1+' & '+n2;
      }
      names.add(coupleName.trim());
    }
  });

  // Named +1 pairs — "Host Name & +1 Name" (host→plusOneId link, one-directional)
  (STATE.guests||[]).forEach(g=>{
    if(!g||!g.plusOneId) return;
    const plus=(STATE.guests||[]).find(x=>x.id===g.plusOneId);
    if(!plus) return;
    const n1=(g.name||'').trim(), n2=(plus.name||'').trim();
    if(!n1||!n2) return; // only add pair if +1 has a name
    const w1=n1.split(/\s+/), w2=n2.split(/\s+/);
    const minLen=Math.min(w1.length,w2.length);
    let suffixLen=0;
    for(let s=1;s<minLen;s++){
      if(w1.slice(-s).join(' ').toLowerCase()===w2.slice(-s).join(' ').toLowerCase()) suffixLen=s;
    }
    let pairName;
    if(suffixLen>0){
      const f1=w1.slice(0,-suffixLen).join(' ');
      const f2=w2.slice(0,-suffixLen).join(' ');
      const sur=w1.slice(-suffixLen).join(' ');
      pairName=f1+' & '+f2+' '+sur;
    } else {
      pairName=n1+' & '+n2;
    }
    names.add(pairName.trim());
  });

  // Families / households
  (STATE.families||[]).forEach(f=>{
    const n=(f.name||'').trim();
    if(n) names.add(n);
  });

  return [...names].sort((a,b)=>a.localeCompare(b));
}

function _nameAutocomplete(inputId){
  const inp = document.getElementById(inputId);
  if(!inp) return;
  // Avoid double-wiring
  if(inp._acWired) return;
  inp._acWired = true;

  // Create dropdown element
  let dd = document.getElementById(inputId+'-ac-dd');
  if(!dd){
    dd = document.createElement('div');
    dd.id = inputId+'-ac-dd';
    dd.style.cssText = [
      'position:absolute','z-index:3000',
      'background:var(--cream,#FAFAF8)',
      'border:1px solid var(--border)',
      'border-radius:8px',
      'box-shadow:0 4px 16px rgba(0,0,0,.12)',
      'max-height:180px','overflow-y:auto',
      'display:none','min-width:100%',
      'font-size:13px'
    ].join(';');
    // Position relative to input
    inp.parentElement.style.position='relative';
    inp.parentElement.appendChild(dd);
  }

  function showSuggestions(val){
    const q = val.trim().toLowerCase();
    if(!q){ dd.style.display='none'; return; }
    const names = _guestNameList();
    const matches = names.filter(n=>n.toLowerCase().includes(q));
    if(!matches.length){ dd.style.display='none'; return; }
    dd.innerHTML = matches.map((n,i)=>{
      const esc=n.replace(/"/g,'&quot;');
      const hi=n.replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<b>$1</b>');
      return `<div data-idx="${i}" data-name="${esc}" style="padding:9px 13px;cursor:pointer;border-bottom:.5px solid var(--border);color:var(--ink);transition:background .1s"
        onmouseenter="this.style.background='var(--parchment)'"
        onmouseleave="this.style.background=''"
        onmousedown="event.preventDefault()">${hi}</div>`;
    }).join('');
    dd.querySelectorAll('[data-idx]').forEach(el=>{
      el.addEventListener('click',()=>_acPick(inputId, el.dataset.name));
    });
    const last=dd.lastElementChild;
    if(last) last.style.borderBottom='none';
    dd.style.display='block';
  }

  inp.addEventListener('input', ()=>showSuggestions(inp.value));
  inp.addEventListener('focus', ()=>showSuggestions(inp.value));
  inp.addEventListener('keydown', e=>{
    if(e.key==='Escape'){ dd.style.display='none'; return; }
    if(e.key==='ArrowDown'){
      const items=dd.querySelectorAll('[data-idx]');
      if(items.length){ e.preventDefault(); items[0].focus(); }
    }
  });
  // Arrow-key nav inside dropdown
  dd.addEventListener('keydown', e=>{
    const items=[...dd.querySelectorAll('[data-idx]')];
    const cur=document.activeElement;
    const idx=items.indexOf(cur);
    if(e.key==='ArrowDown'&&idx<items.length-1){ e.preventDefault(); items[idx+1].focus(); }
    if(e.key==='ArrowUp'){ e.preventDefault(); if(idx<=0) inp.focus(); else items[idx-1].focus(); }
    if(e.key==='Escape'){ dd.style.display='none'; inp.focus(); }
    if(e.key==='Enter'&&idx>=0){ e.preventDefault(); items[idx].click(); }
  });
  // Dismiss on outside click
  document.addEventListener('click', function handler(e){
    if(!inp.contains(e.target)&&!dd.contains(e.target)){
      dd.style.display='none';
    }
  });
}

function _acPick(inputId, name){
  const inp=document.getElementById(inputId);
  if(inp){ inp.value=name; inp.dispatchEvent(new Event('change')); }
  const dd=document.getElementById(inputId+'-ac-dd');
  if(dd) dd.style.display='none';
}

// ── Build identity ───────────────────────────────────────────────────────────
// Surfaced in Settings → About this build. This exists because the app is served as a
// PWA with a service worker that deliberately serves a cached copy first, so an update
// can land a launch late — and there was previously NO way to tell which build was
// actually running. Diagnosing "I uploaded it but nothing changed" meant hunting for
// whether a feature happened to appear. Bump this with every release.
const APP_BUILD='v373';
const APP_BUILD_DATE='2026-10-31';
function _seatingPrintHtml(forPreview){
  const ev=STATE.event||{};
  const p1=_escHtml(ev.partner1||'Partner'), p2=_escHtml(ev.partner2||'Partner');
  const venue=_escHtml(ev.venue||'');
  const dateStr=ev.date?_escHtml(fmtDate(ev.date)):'';
  const tables=(STATE.tables||[]).slice();
  const seatedIds=new Set(Object.values(STATE.seating).flat().filter(Boolean));
  const totalSeated=seatedIds.size;
  const _shp={round:'Round',long:'Long',square:'Square',theatre:'Bridal'};

  // ----- Floorplan (rendered to scale, no handles) -----
  // Compute the TIGHT bounding box of the actual content (tables + decor) on all four
  // sides, so empty canvas margins — especially the large blank band to the right of the
  // plan — are cropped out rather than printed. The plan is then scaled to the page width
  // and centred.
  let minL=Infinity, minT=Infinity, maxR=-Infinity, maxB=-Infinity;
  // Track table-only extents separately. Only TABLES carry overhanging guest name
  // pills (below + to the sides); decor zones (stage, photo booth, cake/gift tables)
  // do not. So the side/bottom tag-bands must be reserved against the table extents,
  // not against decor — otherwise an empty reserve band is added past a right-edge
  // decor item, which is exactly the blank strip we're removing.
  let tMinL=Infinity, tMaxR=-Infinity, tMaxB=-Infinity;
  tables.forEach(t=>{ const s=_tableSize(t); const l=t.x||0, top=t.y||0, r=l+s.w, b=top+s.h; minL=Math.min(minL,l); minT=Math.min(minT,top); maxR=Math.max(maxR,r); maxB=Math.max(maxB,b); tMinL=Math.min(tMinL,l); tMaxR=Math.max(tMaxR,r); tMaxB=Math.max(tMaxB,b); });
  (STATE.settings.floorDecor||[]).forEach(d=>{ const def=DECOR_DEFS[d.type]||{w:120,h:56}; const w=d.w||def.w, h=d.h||def.h; minL=Math.min(minL,d.x||0); minT=Math.min(minT,d.y||0); maxR=Math.max(maxR,(d.x||0)+w); maxB=Math.max(maxB,(d.y||0)+h); });
  if(!isFinite(minL)){ minL=0; minT=0; maxR=320; maxB=300; }
  if(!isFinite(tMinL)){ tMinL=minL; tMaxR=maxR; tMaxB=maxB; }
  // Guest name badges hang BELOW the bottom row of chairs (the seat-pip name tags),
  // extending past the table's own height. Reserve room for them so the bottom row
  // isn't clipped. The same name tags also overhang the LEFT and RIGHT edges (chairs
  // sit outside the table body and their name pills are wider still), so reserve a
  // side band too — otherwise the left- and right-most guests get clipped.
  // Reserve only as far as a TABLE actually needs it: extend the crop to cover the
  // table extent + band, but never past where real content (incl. decor) already sits.
  // When names are OFF, no pills hang off the seats, so no side/bottom band is needed.
  const _nameModePrint=_seatNameMode();
  const NAME_TAG_BAND=(_nameModePrint!=='off')?48:10;
  const SIDE_TAG_BAND=(_nameModePrint!=='off')?40:6;
  maxB = Math.max(maxB, tMaxB + NAME_TAG_BAND);
  minL = Math.min(minL, tMinL - SIDE_TAG_BAND);
  maxR = Math.max(maxR, tMaxR + SIDE_TAG_BAND);
  const PAD=20; // small breathing room around the content
  // Offset applied to every element so the cropped box starts at (PAD,PAD).
  const offX=PAD-minL, offY=PAD-minT;
  const cw=(maxR-minL)+PAD*2, ch=(maxB-minT)+PAD*2;
  const twoPage=(_seatingPages===2);
  const PAGE_W=680; // px usable width inside 14mm print margins (portrait, 1-page; A4 210mm − 2×14mm ≈ 688px)
  const PREVIEW_W=1010; // matches the wider preview box's inner box width (~96vw box)
  // Two-page (Landscape) mode: the floorplan is ROTATED 90° to read as landscape on a
  // single portrait sheet. Rotated footprint = (ch*scale) wide by (cw*scale) tall, so it
  // must fit the page: ch*scale<=ROT_W and cw*scale<=ROT_H, where ROT_H is the height
  // BELOW the heading. We then vertically centre the plan in that area and scale it as
  // large as possible to fill the page.
  const ROT_W=forPreview?940:740;   // usable page width (the rotated plan's width)
  const ROT_H=forPreview?700:900;   // usable page height below the heading (the plan's length)
  let scale;
  if(twoPage){
    scale=Math.min(ROT_W/ch, ROT_H/cw, 6.0);
  } else {
    // Scale the cropped plan to FILL the available width (scaling up when narrower than
    // the page). Cap by height so a tall plan can't overflow, and by a max factor.
    const AVAIL_W=forPreview?PREVIEW_W:PAGE_W;
    // PRINT height budget: an A4 portrait page at 96dpi is ~1122px tall; with 14mm @page
    // margins (~106px) the printable area is ~1016px. The heading, the "Floorplan"
    // section label and the wrapper's own padding take ~140px above the plan, so the
    // floorplan itself must stay under ~820px or it spills onto page 2 — which (with the
    // page-break-inside:avoid table cards) pushed the list all the way to page 3, leaving
    // page 2 blank. Capping the height here keeps the plan + list flowing from page 1.
    const AVAIL_H=forPreview?960:820;
    const MAX_UP=forPreview?3.2:4.0;
    scale=Math.min(AVAIL_W/cw, AVAIL_H/ch, MAX_UP);
  }
  // Same body as the editor and the PNG — see _decorGeom. Only the positioning wrapper
  // differs (absolute into the print canvas, with the page offsets applied), and none of
  // the editing chrome is emitted, which is what makes this a print wrapper rather than a
  // second renderer.
  const decorHtml=(STATE.settings.floorDecor||[]).map(d=>{
    const g=_decorGeom(d);
    return `<div style="position:absolute;left:${(d.x||0)+offX}px;top:${(d.y||0)+offY}px;width:${g.w}px;height:${g.h}px">
      <div style="position:absolute;left:0;top:0;width:${g.w}px;height:${g.h}px;transform:rotate(${g.rot}deg);transform-origin:center center">
        ${_decorBody(d,g.def,g.w,g.h,g.icon,g.lblTransform)}
      </div></div>`;
  }).join('');
  const _nameTags=[];
  const tablesHtml=tables.map(t=>{
    const base=_tableBaseSize(t), s=(t.scale||1);
    const w=Math.round(base.w*s), h=Math.round(base.h*s);
    const shape=t.shape||'round';
    const filled=_seatCount(t.id);
    // Activate the name-tag collector for this table, with its canvas origin set so the
    // pills land in the right place once rendered in the overlay (offX/offY already
    // applied here). Scale on the wrapper is `s`; the base-size scale inside _floorPips
    // is folded into the table-local coords, so origin scale is just `s`.
    _seatNameTagSink=_nameTags;
    _seatNameTagOrigin={x:(t.x||0)+offX, y:(t.y||0)+offY, rot:t.rotation||0, w, h, scale:s};
    const inner=_floorPips(t,shape,filled,false);
    _seatNameTagSink=null; _seatNameTagOrigin=null;
    const rot=t.rotation||0;
    return `<div style="position:absolute;left:${(t.x||0)+offX}px;top:${(t.y||0)+offY}px;width:${w}px;height:${h}px">
      <div style="position:absolute;left:0;top:0;width:${w}px;height:${h}px;transform:rotate(${rot}deg);transform-origin:center center">
        <div style="position:absolute;left:0;top:0;width:${base.w}px;height:${base.h}px;transform:scale(${s});transform-origin:0 0">${inner}</div>
      </div>
    </div>`;
  }).join('');
  // All name pills, rendered in a single layer on top of every table.
  const nameOverlay=_nameTags.length?`<div style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:40">${_nameTags.join('')}</div>`:'';
  const floorScaledW=Math.round(cw*scale);
  const floorScaledH=Math.round(ch*scale);
  const planLayer=`${decorHtml}${tablesHtml}${nameOverlay}`;
  let floorBlock;
  if(tables.length && twoPage){
    // Rotated 90° clockwise so the wide plan reads as landscape on one portrait page.
    // Stage footprint = rotated dimensions (width=plan height, height=plan width).
    const stageW=floorScaledH, stageH=floorScaledW;
    const rotInner=`<div class="sp-rot-inner" style="width:${cw}px;height:${ch}px;transform:translateX(${floorScaledH}px) rotate(90deg) scale(${scale})">${planLayer}</div>`;
    floorBlock=`
    <div class="sp-section-label">Floorplan</div>
    <div class="sp-rot-region">
      <div class="sp-rot-stage" style="width:${stageW}px;height:${stageH}px">
        ${rotInner}
      </div>
    </div>`;
  } else if(tables.length){
    floorBlock=forPreview?`
    <div class="sp-section-label">Floorplan</div>
    <div class="sp-floor-center" style="display:flex;justify-content:center">
      <div class="sp-floor-scroll" style="overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid #E7DECF;border-radius:8px;background:#FBF8F3;max-width:100%">
        <div style="position:relative;width:${floorScaledW}px;height:${floorScaledH}px;flex-shrink:0">
          <div style="transform:scale(${scale});transform-origin:top left;width:${cw}px;height:${ch}px;position:absolute;left:0;top:0">
            ${planLayer}
          </div>
        </div>
      </div>
    </div>`:`
    <div class="sp-section-label">Floorplan</div>
    <div class="sp-floor-wrap" style="height:${Math.round(ch*scale)+8}px;display:flex;justify-content:center">
      <div style="position:relative;width:${Math.round(cw*scale)}px;height:${Math.round(ch*scale)}px;flex-shrink:0">
        <div style="transform:scale(${scale});transform-origin:top left;width:${cw}px;height:${ch}px;position:absolute;left:0;top:0">
          ${planLayer}
        </div>
      </div>
    </div>`;
  } else {
    floorBlock='';
  }

  // ----- Table-by-table list -----
  const listCards=tables.map(t=>{
    const ids=_seatIds(t.id);
    const heads=new Set([t.headLeft,t.headRight].filter(Boolean));
    const rows=ids.map((gid,i)=>{
      const g=STATE.guests.find(x=>x.id===gid);
      const nm=g?_escHtml(g.name):'(unknown)';
      const crown=heads.has(gid)?' <span class="sp-crown">♔</span>':'';
      // Allergies print bold capitals as well as red, so they survive the B&W print.
      const _dn=(g&&g.dietary||[]).filter(d=>d!=='allergy');
      const _at=_hasAllergy(g)?_allergyText(g):'';
      const diet=(_dn.length?` <span class="sp-diet">${_escHtml(_dn.map(d=>d==='other'&&_otherText(g)?'other ('+_otherText(g)+')':d).join(', '))}</span>`:'')
        +(_hasAllergy(g)?` <span class="sp-al">ALLERGY${_at?': '+_escHtml(_at.toLowerCase()):''}</span>`:'');
      return `<li>${nm}${crown}${diet}</li>`;
    }).join('');
    const empty=ids.length?'':'<li class="sp-empty">— empty —</li>';
    return `<div class="sp-tcard">
      <div class="sp-tname">${_escHtml(t.name||'Table')}<span class="sp-cnt">${_seatingCounts?`${ids.length}/${t.seats} · `:''}${_shp[t.shape]||'Round'}</span></div>
      <ol>${rows}${empty}</ol>
    </div>`;
  }).join('');

  // Unassigned
  const pool=STATE.guests.filter(g=>g.rsvp!=='declined'&&(g.listType||'A')==='A'&&!seatedIds.has(g.id));
  const unassignedBlock=pool.length?`
    <div class="sp-tcard sp-unassigned">
      <div class="sp-tname">Unassigned<span class="sp-cnt">${pool.length}</span></div>
      <ol>${pool.map(g=>`<li>${_escHtml(g.name)}</li>`).join('')}</ol>
    </div>`:'';

  const sub=[`${totalSeated} guest${totalSeated===1?'':'s'} seated`,`${tables.length} table${tables.length===1?'':'s'}`].join(' · ');
  const metaLine=[venue,dateStr].filter(Boolean).join(' · ');

  const headHtml=`<div class="sp-head">
      <div class="sp-couple">${p1} &amp; ${p2}</div>
      <div class="sp-title">Seating Plan</div>
      ${metaLine?`<div class="sp-meta">${metaLine}</div>`:''}
      <div class="sp-meta sp-sub">${sub}</div>
    </div>`;
  const listHtml=`<div class="sp-section-label">Who sits where</div>
    <div class="sp-list">${listCards}${unassignedBlock}</div>`;
  const footHtml=`<div class="sp-foot">Union Vault</div>`;
  if(twoPage){
    // Page 1: landscape floorplan. Page 2: portrait guest list.
    return `<div class="sp-doc sp-2page${_seatingBW?' bw':''}">
      <div class="sp-page sp-page-floor">
        ${headHtml}
        ${floorBlock}
      </div>
      <div class="sp-page sp-page-list">
        ${listHtml}
        ${footHtml}
      </div>
    </div>`;
  }
  return `<div class="sp-doc${_seatingBW?' bw':''}">
    ${headHtml}
    ${floorBlock}
    ${listHtml}
    ${footHtml}
  </div>`;
}

const _SEATING_PRINT_CSS=`
  *{box-sizing:border-box}
  body{margin:0;background:#fff;color:#3A352F;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;line-height:1.5;--cream:#FFFFFF;--ink:#3A352F;--muted:#9A9389;--border:#E7DECF;--surface:#FBF8F3;--gold:#C9A14A;--gold-deep:#9A7B2E;--parchment:#E8E0D5;--green:#5C8A4E;--red:#C0653E}
  .sp-doc{max-width:760px;margin:0 auto;padding:28px 26px 40px;--cream:#FFFFFF;--ink:#3A352F;--muted:#9A9389;--border:#E7DECF;--surface:#FBF8F3;--gold:#C9A14A;--gold-deep:#9A7B2E;--parchment:#E8E0D5;--green:#5C8A4E;--red:#C0653E}
  .sp-head{text-align:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #E7DECF}
  .sp-couple{font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:600;color:#3A352F;line-height:1.0}
  .sp-title{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:17px;color:#9A7B2E;margin-top:0}
  .sp-meta{font-size:12px;color:#9A9389;margin-top:3px}
  .sp-sub{color:#B4AFA4}
  .sp-section-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9A7B2E;border-bottom:1px solid #E7DECF;padding-bottom:5px;margin:18px 0 10px}
  .sp-floor-wrap{position:relative;width:100%;border:1px solid #E7DECF;border-radius:8px;background:#FBF8F3;overflow:hidden;padding:6px}
  .sp-list{column-count:2;column-gap:18px}
  @media (max-width:560px){.sp-list{column-count:1}}
  .sp-tcard{break-inside:avoid;-webkit-column-break-inside:avoid;page-break-inside:avoid;border:1px solid #E7DECF;border-radius:8px;padding:9px 12px 10px;margin-bottom:9px;background:#fff}
  .sp-tname{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:600;color:#3A352F;display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #F0E9DC;padding-bottom:4px;margin-bottom:5px}
  .sp-cnt{font-family:'Inter',sans-serif;font-size:11px;font-weight:500;color:#9A9389}
  .sp-tcard ol{margin:0;padding-left:20px;font-size:12.5px;color:#3A352F;line-height:1.65}
  .sp-tcard li{padding:1px 0}
  .sp-crown{color:#9A7B2E;font-size:12px}
  .sp-diet{color:#9A9389;font-size:10.5px;font-style:italic}
  .sp-al{color:#A8322A;font-size:10.5px;font-weight:700;letter-spacing:.02em}
  .sp-empty{color:#B4AFA4;font-style:italic;list-style:none;margin-left:-12px}
  .sp-unassigned{border-style:dashed;background:#FBF8F3}
  .sp-foot{text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:#B4AFA4;font-size:12px;margin-top:26px;padding-top:14px;border-top:1px solid #E7DECF}
  @media print{body{padding:0}.sp-doc{max-width:none;padding:0}}
  /* Portrait (1-page) mode: apply page margins via padding on the doc only (NOT via @page,
     which is kept margin:0 so the two-page landscape mode's full-height rotation is
     unaffected). This makes the height budget used to scale the floorplan match the real
     printable area, and keeps the floorplan block from splitting across a page boundary —
     which previously left page 2 blank and pushed the table list onto page 3. */
  @media print{
    .sp-doc:not(.sp-2page){padding:14mm}
    .sp-doc:not(.sp-2page) .sp-floor-wrap{break-inside:avoid;page-break-inside:avoid}
  }
  @page{size:A4 portrait;margin:0}
  /* ── Two-page mode: page 1 = whole floorplan rotated 90° to fit a single
     portrait sheet as landscape (reliable across browsers — no @page needed);
     page 2 = portrait guest list. ── */
  .sp-doc.sp-2page{max-width:none}
  .sp-doc.sp-2page .sp-page{padding:18px 22px}
  .sp-doc.sp-2page .sp-page-floor{page-break-after:always;break-after:page;overflow:hidden}
  .sp-doc.sp-2page .sp-rot-stage{position:relative;margin:0 auto}
  .sp-doc.sp-2page .sp-rot-inner{position:absolute;top:0;left:0;transform-origin:top left}
  /* The floorplan region fills the page below the heading and centres the rotated
     plan vertically, so the enlarged plan sits in the middle of the page. */
  .sp-doc.sp-2page .sp-rot-region{display:flex;align-items:center;justify-content:center}
  .sp-doc.sp-2page .sp-page-floor .sp-section-label{margin-top:0}
  @media print{
    .sp-doc.sp-2page .sp-page-floor{height:100vh;display:flex;flex-direction:column}
    .sp-doc.sp-2page .sp-page-floor .sp-section-label{flex:0 0 auto}
    .sp-doc.sp-2page .sp-rot-region{flex:1 1 auto;min-height:0}
  }
  @media screen{
    .sp-doc.sp-2page .sp-page-floor{border-bottom:2px dashed #E7DECF;margin-bottom:18px}
    .sp-doc.sp-2page .sp-rot-region{padding:8px 0}
  }
  /* ── Black & white render: drain brand colours to a single consistent grey and
     make seat pips outline-only (no fill). Only applies when .sp-doc carries .bw. ── */
  .sp-doc.bw{--gold:#7c7c7c;--gold-deep:#7c7c7c;--green:#7c7c7c;--red:#7c7c7c;--muted:#666;--border:#999;--surface:#fff;--parchment:#f2f2f2}
  .sp-doc.bw .sp-title{color:#555}
  .sp-doc.bw .sp-al{color:#000}
  .sp-doc.bw .sp-section-label{color:#555;border-bottom-color:#bbb}
  .sp-doc.bw .sp-floor-wrap,.sp-doc.bw .sp-floor-scroll{background:transparent!important;border:none!important}
  /* Catch-all: neutralise any hardcoded colours inside the plan (e.g. decor zone
     gold stripes), in every floorplan wrapper incl. the rotated landscape stage. */
  .sp-doc.bw .sp-floor-wrap > div,.sp-doc.bw .sp-floor-scroll > div,.sp-doc.bw .sp-rot-inner{filter:grayscale(1)}
  .sp-doc.bw .sp-crown{color:#7c7c7c}
  /* Seated pips: outline ring + initials in the SAME grey as the rest of the plan
     (matches the grayscaled decor gold, ~#7c7c7c), no fill. */
  .sp-doc.bw [data-pipon="1"]{background:transparent!important;border-color:#7c7c7c!important}
  .sp-doc.bw .sp-pip-init{color:#7c7c7c!important}
  /* ── Decor zones, doors and text labels ────────────────────────────────────
     These live in the main app stylesheet, NOT copied here before. Without them
     the print/download doc showed decor boxes with no hatching, no border colour
     and no label styling. The PNG export works because it clones the live DOM. */
  .decor-zone{position:absolute;inset:0;border-radius:8px;border:2px dashed var(--gold-deep);color:var(--gold-deep);background:repeating-linear-gradient(45deg,rgba(201,161,74,.10),rgba(201,161,74,.10) 6px,transparent 6px,transparent 12px);overflow:hidden}
  .decor-lbl{font-size:9px;letter-spacing:.13em;text-transform:uppercase;font-weight:600;line-height:1.15}
  .fdoor{position:absolute;inset:0;overflow:visible}
  .fdoor svg{width:100%;height:100%;display:block;overflow:visible}
  .ftxt-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;overflow:visible}
  .ftxt{white-space:pre-wrap;line-height:1.15;color:var(--ink)}
  .ftxt-caps{font-family:'Inter',sans-serif;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-deep)}
  .ftxt-heading{font-family:'Cormorant Garamond',serif;font-weight:600;color:var(--ink)}
  .ftxt-note{font-family:'Cormorant Garamond',serif;font-style:italic;color:var(--muted)}
  .ftxt-boxed{font-family:'Inter',sans-serif;background:#fff;border:1px solid var(--border);border-radius:6px;padding:4px 9px;color:var(--ink)}
`;

function openSeatingPrintPreview(){
  if(!(STATE.tables||[]).length){ _showInfoToast('Add a table first.', null, null); return; }
  const _nmPrev=_seatNameMode();
  const inner=_seatingPrintHtml(true);
  const body=`<div style="background:#fff;border:1px solid var(--border);border-radius:8px;max-height:64vh;overflow:auto;padding:0">
      <style>${_SEATING_PRINT_CSS} #modal-box.modal-wide .sp-doc{max-width:1060px}</style>
      ${inner}
    </div>`;
  const footer=`<span class="sp-foot-choices" style="margin-right:auto;display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span class="sp-bw-seg inv-seg" style="display:inline-flex">
        <button class="${!_seatingBW?'active':''}" onclick="_setSeatingBW(false)" title="Full colour">Colour</button>
        <button class="${_seatingBW?'active':''}" onclick="_setSeatingBW(true)" title="Black &amp; white (outline pips)">B&amp;W</button>
      </span>
      <span class="sp-pages-seg inv-seg" style="display:inline-flex">
        <button class="${_seatingPages===1?'active':''}" onclick="_setSeatingPages(1)" title="Floorplan &amp; guest list together (portrait)">Portrait</button>
        <button class="${_seatingPages===2?'active':''}" onclick="_setSeatingPages(2)" title="Enlarged landscape floorplan on page 1, guest list on page 2">Landscape</button>
      </span>
      <span style="display:inline-flex;align-items:center;gap:7px">
        <span style="font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gold-deep)">Names</span>
        <span class="sp-names-seg inv-seg" style="display:inline-flex">
          <button class="${_nmPrev==='off'?'active':''}" onclick="_setSeatingPreviewNameMode('off')" title="Initials only">Off</button>
          <button class="${_nmPrev==='first'?'active':''}" onclick="_setSeatingPreviewNameMode('first')" title="First name only">First</button>
          <button class="${_nmPrev==='firstinitial'?'active':''}" onclick="_setSeatingPreviewNameMode('firstinitial')" title="First name + last initial (e.g. Linden S.)">First #.</button>
          <button class="${_nmPrev==='last'?'active':''}" onclick="_setSeatingPreviewNameMode('last')" title="Full names">Last</button>
        </span>
      </span>
      <span style="display:inline-flex;align-items:center;gap:7px">
        <span style="font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gold-deep)">Counts</span>
        <span class="sp-counts-seg inv-seg" style="display:inline-flex">
          <button class="${_seatingCounts?'active':''}" onclick="_setSeatingCounts(true)" title="Show how many seats are filled on each table">Show</button>
          <button class="${!_seatingCounts?'active':''}" onclick="_setSeatingCounts(false)" title="Hide the seat counts on the floorplan and the guest list">Hide</button>
        </span>
      </span>
    </span>
    <span class="sp-foot-actions" style="display:inline-flex;gap:10px;align-items:center">
    <button class="btn btn-outline" onclick="closeModalDirect()">Close</button>
    <button class="btn btn-outline" onclick="_downloadSeatingPlan()" style="display:inline-flex;align-items:center;gap:6px" title="Download a print-ready copy">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download
    </button>
    <button class="btn btn-outline" onclick="_downloadFloorplanPng()" style="display:inline-flex;align-items:center;gap:6px" title="Save the floorplan on its own as a PNG image (no guest list)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      PNG
    </button>
    <button class="btn btn-outline" onclick="_downloadSeatingCsv()" style="display:inline-flex;align-items:center;gap:6px" title="Download guest names + table numbers as a CSV spreadsheet">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
      CSV
    </button>
    <button class="btn btn-primary" onclick="_printSeatingPlan()" style="display:inline-flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Print
    </button>
    </span>`;
  openModal('Seating Plan Preview', body, footer);
  const mb=document.getElementById('modal-box'); if(mb) mb.classList.add('modal-wide');
  const _spo=document.getElementById('modal-overlay'); if(_spo) _spo.classList.add('seating-preview-overlay');
  // Fit-to-width: the plan is pre-scaled to an assumed preview width, but the real
  // container can be narrower (96vw on smaller screens). If so, shrink the rendered
  // floorplan to the actual available width so it never scrolls horizontally and
  // doesn't leave an empty band on the right.
  _fitSeatingPreviewFloor();
}
// Toggle the preview/print/download between full colour and black & white, then
// re-render the open preview in place (footer toggle reflects the new state).
function _setSeatingCounts(on){
  _seatingCounts=!!on;
  if(document.getElementById('modal-overlay') && !document.getElementById('modal-overlay').classList.contains('hidden')){
    openSeatingPrintPreview();
  }
}
function _setSeatingBW(on){
  _seatingBW=!!on;
  if(document.getElementById('modal-overlay') && !document.getElementById('modal-overlay').classList.contains('hidden')){
    openSeatingPrintPreview();
  }
}
// Toggle between a single combined page and a two-page layout (landscape floorplan
// page + portrait list page), then re-render the open preview in place.
function _setSeatingPages(n){
  _seatingPages=(n===2)?2:1;
  if(document.getElementById('modal-overlay') && !document.getElementById('modal-overlay').classList.contains('hidden')){
    openSeatingPrintPreview();
  }
}
// Set the guest-name display mode FROM the preview footer. Writes the same shared
// setting the editor cog uses (one source of truth), but re-renders the preview in
// place instead of navigating the seating page (which setSeatNameMode does).
function _setSeatingPreviewNameMode(mode){
  if(mode!=='off'&&mode!=='first'&&mode!=='firstinitial'&&mode!=='last') return;
  STATE.settings.seatingNameMode=mode;
  STATE.settings.seatingShowNames=(mode!=='off');
  saveToStorage();
  // Re-render the seating page underneath as well, not just the preview. Name mode is
  // baked into the floorplan's markup at render time — unlike counts and B&W, which are
  // read at export time — so leaving the page un-rendered left two things stale: the PNG
  // (which clones the LIVE floorplan, and so kept the old names) and the editor itself
  // once the preview was closed. Writing STATE without re-rendering the view that state
  // describes is the actual fault; refreshing here fixes both symptoms at the source.
  const wasOpen = document.getElementById('modal-overlay') && !document.getElementById('modal-overlay').classList.contains('hidden');
  navigate('seating');
  if(wasOpen) openSeatingPrintPreview();
}
function _fitSeatingPreviewFloor(){
  requestAnimationFrame(()=>{
    const scroll=document.querySelector('.sp-floor-scroll');
    if(!scroll) return;
    const box=scroll.firstElementChild; // the sized wrapper (width = floorScaledW)
    if(!box) return;
    const inner=box.firstElementChild; // the transform:scale plan
    // The scroll box now shrink-wraps its content, so its own clientWidth equals the
    // plan width and can't tell us the real budget. Measure the centring parent's inner
    // width instead — that's the true space available before horizontal scroll kicks in.
    const parent=scroll.parentElement; // .sp-floor-center (full row width)
    const avail=(parent?parent.clientWidth:scroll.clientWidth)-2; // -2 for the 1px box border each side
    const planW=parseFloat(box.style.width)||box.offsetWidth;
    if(planW>avail && avail>0){
      const k=avail/planW;
      // Compose the extra shrink onto the existing transform and shrink the wrapper
      // box to match, so the centred layout has no leftover width on the right.
      const m=(inner.style.transform||'').match(/scale\(([\d.]+)\)/);
      const base=m?parseFloat(m[1]):1;
      inner.style.transform=`scale(${base*k})`;
      box.style.width=Math.round(planW*k)+'px';
      box.style.height=Math.round((parseFloat(box.style.height)||box.offsetHeight)*k)+'px';
    }
  });
}

// Build the standalone print/download document for the seating plan.
function _seatingPlanDoc(autoPrint){
  const inner=_seatingPrintHtml();
  const fonts='<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">';
  const printScript=autoPrint?`<script>window.addEventListener('load',function(){setTimeout(function(){try{window.focus();window.print();}catch(e){}},350);});<\/script>`:'';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Seating Plan</title>${fonts}<style>${_SEATING_PRINT_CSS}</style></head><body>${inner}${printScript}</body></html>`;
}

function _printSeatingPlan(){
  // window.open is blocked in sandboxed app views (the old "Allow pop-ups" error), so we
  // print through a hidden same-page iframe instead — reliable and popup-free.
  try{
    const doc=_seatingPlanDoc(false);
    const old=document.getElementById('seating-print-frame'); if(old) old.remove();
    const f=document.createElement('iframe');
    f.id='seating-print-frame';
    f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(f);
    const fd=f.contentWindow.document;
    fd.open(); fd.write(doc); fd.close();
    const go=()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ _downloadSeatingPlan(); } };
    // Give fonts/layout a moment, then print.
    setTimeout(go, 450);
    setTimeout(()=>{ const fr=document.getElementById('seating-print-frame'); if(fr) fr.remove(); }, 60000);
  }catch(e){ _downloadSeatingPlan(); }
}

function _downloadSeatingPlan(){
  // Download a self-printing HTML file (opens → auto-launches print / Save-as-PDF).
  const doc=_seatingPlanDoc(true);
  const ev=STATE.event||{};
  const slugBase=[ev.partner1,ev.partner2].filter(Boolean).join(' & ')||'seating-plan';
  const slug=slugBase.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'seating-plan';
  const dstr=new Date().toISOString().slice(0,10);
  const blob=new Blob([doc],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`seating-plan-${slug}-${dstr}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

// ── Floorplan → PNG ──────────────────────────────────────────────────────────
// The floorplan on its own, as a real image, with no guest list. Done with browser-native
// APIs only — the app is offline-first and must not pull a rasterising library over the
// network (v161's rule). The route is: clone the live floorplan, inline the app's CSS and
// the EMBEDDED font faces, wrap it in <foreignObject>, load that SVG as an image and paint
// it to a canvas.
//
// Three things this had to get right, each found by testing rather than guessing:
//  1. The <style> body must be wrapped in CDATA. The SVG is parsed as XML and the app's CSS
//     contains characters XML treats as markup, so without it the image silently fails to
//     load and you get nothing.
//  2. The SVG must be a data: URL, NOT a blob: URL. A blob-URL SVG taints the canvas in
//     Chromium and toDataURL then throws a security error.
//  3. Editing chrome has to be stripped from the clone. Rotate handles, delete crosses and
//     resize grips are tools for arranging; baked into an image sent to a venue they read
//     as part of the plan.
function _floorPngStrip(root){
  root.querySelectorAll('.floor-rotate, .decor-x, .decor-edit, .floor-resize').forEach(n=>n.remove());
  // Seat counts follow the same Show/Hide setting as the printed plan. They cannot be
  // suppressed at render time the way the print pass does it: that branch keys off
  // `_seatNameTagSink`, which is only set while building the print document, whereas this
  // export clones the LIVE editor DOM — where counts are always drawn, because that is
  // where they are wanted. So they are removed from the clone instead, which is also why
  // the count line carries the `.fp-count` class.
  if(!_seatingCounts) root.querySelectorAll('.fp-count').forEach(n=>n.remove());
  // The stalk under each rotate handle is an unclassed span; it is the only 1px-wide
  // absolutely positioned element in the tree, so match it by its inline style.
  root.querySelectorAll('span[style*="width:1px"]').forEach(n=>n.remove());
  return root;
}
async function _floorplanPngDataUrl(scale){
  const src=document.getElementById('floor-canvas');
  if(!src) return null;
  const W=Math.max(1,Math.ceil(src.scrollWidth||src.getBoundingClientRect().width));
  const H=Math.max(1,Math.ceil(src.scrollHeight||src.getBoundingClientRect().height));
  const clone=_floorPngStrip(src.cloneNode(true));
  // The live canvas may be zoomed/panned by the viewport; the export wants the plan at 1:1.
  clone.style.transform='none'; clone.style.width=W+'px'; clone.style.height=H+'px';
  let css='';
  Array.from(document.styleSheets).forEach(sheet=>{
    try{ Array.from(sheet.cssRules).forEach(rule=>{ css+=rule.cssText+'\n'; }); }catch(e){}
  });
  // ALWAYS export in the light palette, whatever theme the app is in. Two reasons. The
  // practical one: this image gets printed or sent to a venue, and a dark plan is wrong for
  // both. The mechanical one: `body.dark` cannot apply inside the SVG, because the wrapper
  // there is a <div>, not the <body> — an early version carried the dark flag through and
  // produced a light-coloured plan sitting on a dark background, the worst of both. Letting
  // the clone resolve against :root gives a correct light plan by construction.
  const ser=new XMLSerializer().serializeToString(clone);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'">'
    +'<style>/*<![CDATA[*/'+css+'/*]]>*/</style>'
    +'<foreignObject width="100%" height="100%">'
    +'<div xmlns="http://www.w3.org/1999/xhtml" class="'+(_seatingBW?'pngbw':'')+'" style="width:'+W+'px;height:'+H+'px">'+ser+'</div>'
    +'</foreignObject></svg>';
  const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  const img=new Image();
  const ok=await new Promise(res=>{ img.onload=()=>res(true); img.onerror=()=>res(false); img.src=url; });
  if(!ok) return null;
  const sc=scale||2;
  const c=document.createElement('canvas'); c.width=Math.round(W*sc); c.height=Math.round(H*sc);
  const ctx=c.getContext('2d'); ctx.scale(sc,sc);
  // Always paint an opaque background. A transparent PNG dropped into a document or a dark
  // chat thread renders the plan's own ink on whatever is behind it, usually unreadably.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0,0,W,H);
  ctx.drawImage(img,0,0,W,H);
  try{ return c.toDataURL('image/png'); }catch(e){ return null; }
}
async function _downloadFloorplanPng(){
  if(!(STATE.tables||[]).length && !((STATE.settings.floorDecor||[]).length)){
    _showInfoToast('Nothing on the floorplan yet.', null, null); return;
  }
  _showInfoToast('Building image…', null, null);
  let data=null;
  try{ data=await _floorplanPngDataUrl(2); }catch(e){ data=null; }
  if(!data){
    // Safari on iOS has long-standing trouble rendering foreignObject to a canvas. Say so
    // plainly and point at the route that does work there, rather than saving a blank file.
    _showInfoToast('Could not build the image on this browser. Try Print Plan → Save as PDF, or export from a desktop browser.', null, null);
    return;
  }
  const ev=STATE.event||{};
  const slugBase=[ev.partner1,ev.partner2].filter(Boolean).join(' & ')||'floorplan';
  const slug=slugBase.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'floorplan';
  const dstr=new Date().toISOString().slice(0,10);
  const a=document.createElement('a');
  a.href=data; a.download='floorplan-'+slug+'-'+dstr+(_seatingBW?'-bw':'')+'.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── Seating → CSV (First name, Last name, Table) ─────────────────────────────
// One row per SEATED guest. Name is split on whitespace: the first token is the
// first name, everything after is the last name (so middle names stay with the
// surname rather than being dropped). Rows are sorted alphabetically by full name.
// Only guests actually placed at a table appear — unseated guests are omitted by
// design (this export answers "who sits where").
function _seatingCsvRows(){
  const rows=[];
  (STATE.tables||[]).forEach(t=>{
    _seatIds(t.id).forEach(gid=>{
      const g=(STATE.guests||[]).find(x=>x.id===gid);
      if(!g||!g.name) return;
      const parts=String(g.name).trim().split(/\s+/);
      const first=parts.shift()||'';
      const last=parts.join(' ');
      rows.push({first, last, table:t.name||'', full:String(g.name).trim()});
    });
  });
  rows.sort((a,b)=>a.full.localeCompare(b.full, undefined, {sensitivity:'base'}));
  return rows;
}
// RFC-4180 field escaping: wrap in quotes if the value has a comma, quote, or
// newline; double any embedded quotes.
function _csvField(v){
  const s=(v==null?'':String(v));
  return /[",\n\r]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
}
function _downloadSeatingCsv(){
  const rows=_seatingCsvRows();
  if(!rows.length){ if(typeof _showInfoToast==='function') _showInfoToast('No seated guests to export yet.', null, null); return; }
  const header=['First name','Last name','Table'];
  const lines=[header.map(_csvField).join(',')]
    .concat(rows.map(r=>[r.first, r.last, r.table].map(_csvField).join(',')));
  // Prepend a UTF-8 BOM so Excel opens accented names correctly.
  const csv='\ufeff'+lines.join('\r\n');
  const ev=STATE.event||{};
  const slugBase=[ev.partner1,ev.partner2].filter(Boolean).join(' & ')||'seating';
  const slug=slugBase.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'seating';
  const dstr=new Date().toISOString().slice(0,10);
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`seating-${slug}-${dstr}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

function filterSeatingPool(val){
  const q=(val||'').toLowerCase().trim();
  document.querySelectorAll('#seating-pool .seat-chip').forEach(chip=>{
    const name=chip.dataset.sname||'';
    chip.style.display=(!q||name.includes(q))?'':'none';
  });
  // Hide a group block if ALL its chips are hidden; show if any match
  document.querySelectorAll('#seating-pool .pool-group').forEach(grp=>{
    const chips=grp.querySelectorAll('.seat-chip');
    if(!chips.length) return;
    const anyVisible=[...chips].some(c=>c.style.display!=='none');
    grp.style.display=anyVisible?'':'none';
  });
}
// Attending-only toggle: flip the flag, clear any active pool search filter (so a
// stale search can't keep a now-eligible guest hidden), then re-render. The full
// re-render rebuilds the unassigned pool from scratch in both list and floorplan views.
function _toggleSeatingAttending(){
  seatingAttendingOnly=!seatingAttendingOnly;
  const s=document.getElementById('seating-search'); if(s) s.value='';
  navigate('seating');
  _seatReopenCog();
}

function toggleArrangeTables(){
  arrangeTablesMode=!arrangeTablesMode;
  navigate('seating');
}

function resetSeating(){
  openModal('Reset Seating',`
    <div style="text-align:center;padding:8px 0">
      <div style="display:inline-flex;align-items:center;gap:9px;margin-bottom:10px">
        <span class="modal-warn-ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--ink)">Reset all seating?</span>
      </div>
      <div style="font-size:13.5px;color:var(--muted);line-height:1.6">All guests will be moved back to the Unassigned pool. Tables will remain.</div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
     <button class="btn btn-danger" onclick="confirmResetSeating()">Reset Seating</button>`);
}

function confirmResetSeating(){
  STATE.seating={};
  saveToStorage(); closeModalDirect(); navigate('seating');
}

// ── Random Fill — seat currently-unassigned attending guests into empty seats.
// Keeps couples/plus-ones together (a pair only lands at a table with ≥2 free
// seats); if no such table exists for a pair, both stay in the pool. Existing
// seating is left untouched. Backed by the undo-snapshot so it can be reverted.
function randomFillSeating(){
  const attendingOnly = seatingAttendingOnly;
  const pool = attendingOnly
    ? STATE.guests.filter(g=>g.rsvp==='attending' && (g.listType||'A')==='A')
    : STATE.guests.filter(g=>g.rsvp!=='declined' && (g.listType||'A')==='A');
  const seatedIds = new Set(Object.values(STATE.seating).flat().filter(Boolean));
  const unseated = pool.filter(g=>!seatedIds.has(g.id));

  if(!unseated.length){ _showInfoToast('Everyone is already seated.', null, null); return; }
  if(!(STATE.tables||[]).length){ _showInfoToast('Add a table first.', null, null); return; }

  // Build seating units: a couple/plus-one pair = one 2-person unit; everyone
  // else is a 1-person unit. Only pair when BOTH partners are in the unseated set.
  const idSet = new Set(unseated.map(g=>g.id));
  const used = new Set();
  const units = [];
  unseated.forEach(g=>{
    if(used.has(g.id)) return;
    const mateId = g.coupleId || g.plusOneId;
    if(mateId && idSet.has(mateId) && !used.has(mateId)){
      units.push([g.id, mateId]); used.add(g.id); used.add(mateId);
    } else {
      units.push([g.id]); used.add(g.id);
    }
  });

  // Fisher–Yates shuffle helper.
  const shuffle = arr=>{ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; };
  shuffle(units);

  const tables = shuffle((STATE.tables||[]).slice());

  const snap = _undoSnapshot();
  let seatedCount = 0, couplesKept = 0, leftover = 0, couplesUnseatable = 0;

  // ⚠️ CAPACITY IS A SHAPE, NOT A NUMBER.
  // A table with two free chairs does not necessarily have room for a COUPLE: on a
  // long 8-seater, chairs 3 and 4 are free but sit at OPPOSITE ENDS. So a single asks
  // "is any chair free?" and a couple asks "are two ADJACENT chairs free?" — a
  // question a count cannot answer. Recomputed per unit, because each placement
  // changes the answer for the next.
  const roomForSingle = tid => _seatFreeIdx(tid).length > 0;
  const roomForCouple = tid => !!_seatFreeAdjacentPair(tid);

  units.forEach(unit=>{
    const need = unit.length;
    if(need===2){
      // Couples: only a table with two chairs SIDE BY SIDE will do.
      const cands = shuffle(tables.filter(t=>roomForCouple(t.id)));
      if(cands.length){
        const tid = cands[0].id;
        const pair = _seatFreeAdjacentPair(tid);   // [i,j], physically adjacent
        _seatAt(tid, pair[0], unit[0]);
        _seatAt(tid, pair[1], unit[1]);
        seatedCount += 2; couplesKept++;
      } else {
        // Free chairs may well exist — just none TOGETHER. Left in the pool, and said
        // so plainly, rather than quietly splitting them across a table.
        leftover += 2;
        if((STATE.tables||[]).some(t=>roomForSingle(t.id))) couplesUnseatable++;
      }
    } else {
      // Singles: fill any gap, oldest chair first. Gaps get used before fresh tables.
      const cands = shuffle(tables.filter(t=>roomForSingle(t.id)));
      if(cands.length){
        _seatFirstFree(cands[0].id, unit[0]);
        seatedCount += 1;
      } else {
        leftover += 1;
      }
    }
  });

  if(seatedCount===0){
    _showInfoToast('No free seats available to fill.', null, null);
    return;
  }

  saveToStorage();
  navigate('seating');

  // Compose a friendly summary.
  let msg = `Seated ${seatedCount} guest${seatedCount!==1?'s':''}`;
  const extras = [];
  if(couplesKept) extras.push(`${couplesKept} couple${couplesKept!==1?'s':''} kept together`);
  if(leftover) extras.push(`${leftover} couldn’t fit, left in pool`);
  // Be explicit about the surprising case: seats ARE free, but not side by side.
  // Without this the user sees empty chairs and a couple in the pool and assumes a bug.
  if(couplesUnseatable) extras.push(`${couplesUnseatable} couple${couplesUnseatable!==1?'s':''} had no two seats together`);
  if(extras.length) msg += ' · ' + extras.join(' · ');
  _showInfoToast(msg, snap, 'seating');
}

// ── Generic info toast (mirrors the undo-delete toast styling). When a snapshot
// is supplied, an Undo button restores it; otherwise it’s a plain notice.
function _showInfoToast(message, snap, navPage){
  _commitUndoToast();
  const wrap=document.getElementById('undo-toast-wrap');
  if(!wrap){ return; }
  const myId=++_undoSeq;
  if(snap){ _undoPending={ id:myId, snap, navPage, rerenderFn:null }; }
  const safe=_escHtml(message||'');
  const el=document.createElement('div');
  el.className='undo-toast';
  el.setAttribute('data-uid', String(myId));
  const undoBtn = snap
    ? '<span class="ut-div"></span><button class="ut-undo" onclick="_undoLastDelete()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>Undo</button>'
    : '';
  el.innerHTML=
    '<span class="ut-ico" style="background:rgba(92,143,114,.14);color:var(--green,#5C8A4E)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>'+
    '<span class="ut-msg" style="max-width:300px">'+safe+'</span>'+
    undoBtn+
    '<button class="ut-x" aria-label="Dismiss" onclick="_dismissUndoToast()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
  wrap.appendChild(el);
  requestAnimationFrame(()=>{ el.classList.add('in'); });
  _undoTimer=setTimeout(()=>{ _commitUndoToast(); }, 6000);
}

// ── Table drag-and-drop reordering ──
function dragTableStart(e,id){
  dragTableId=id;
  e.dataTransfer.effectAllowed='move';
  setTimeout(()=>{ const el=document.getElementById('tcard-'+id); if(el)el.style.opacity='.4'; },0);
}
function dragTableOver(e,id){
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  _dragAutoScroll(e);
  const el=document.getElementById('tcard-'+id);
  if(el&&id!==dragTableId) el.classList.add('drag-over');
}
function dragTableLeave(e,id){
  const el=document.getElementById('tcard-'+id);
  if(el) el.classList.remove('drag-over');
}
function dropTable(e,targetId){
  e.preventDefault();
  _dragStopAutoScroll();
  if(!dragTableId||dragTableId===targetId)return;
  const fi=STATE.tables.findIndex(t=>t.id===dragTableId);
  const ti=STATE.tables.findIndex(t=>t.id===targetId);
  if(fi<0||ti<0)return;
  const [moved]=STATE.tables.splice(fi,1);
  STATE.tables.splice(ti,0,moved);
  dragTableId=null;
  saveToStorage();
  navigate('seating');
}

function dragSeat(e,gid,tableId){
  dragSeatId=gid; dragFromTable=tableId;
  // Wake the empty chairs for the HTML5 drag too — same affordance the pointer drag
  // gets. dragend fires however the drag ends (drop, escape, cancel), so the canvas
  // cannot be left lit.
  const c=document.getElementById('floor-canvas');
  if(c) c.classList.add('seat-dragging');
  if(e&&e.target&&e.target.addEventListener){
    e.target.addEventListener('dragend',function _de(){
      _floorSeatHighlightOff();
      e.target.removeEventListener('dragend',_de);
    });
  }
}
function dropOnTable(e,tableId){
  if(dragGroupIds){
    dragGroupIds.forEach(gid=>{ if(!_seatIds(tableId).includes(gid)) _seatFirstFree(tableId,gid); });
    dragGroupIds=null; dragSeatId=null; dragFromTable=null; saveToStorage(); navigate('seating'); return;
  }
  if(!dragSeatId)return;
  if(dragFromTable&&dragFromTable!==tableId) _seatClear(dragFromTable,dragSeatId);
  // The LIST view has no chairs to aim at, so it takes the first free one — which,
  // with a sparse array, means filling a hole rather than stepping over it.
  if(!_seatIds(tableId).includes(dragSeatId)) _seatFirstFree(tableId,dragSeatId);
  if(dragFromTable) _seatTrim(dragFromTable);
  dragSeatId=null; dragFromTable=null; saveToStorage(); navigate('seating');
}
function returnToPool(){
  if(dragGroupIds){ dragGroupIds=null; dragSeatId=null; dragFromTable=null; _floorSeatHighlightOff(); saveToStorage(); navigate('seating'); return; }
  if(!dragSeatId)return;
  if(dragFromTable){ _seatClear(dragFromTable,dragSeatId); _seatTrim(dragFromTable); }
  dragSeatId=null; dragFromTable=null; saveToStorage(); navigate('seating');
}
function removeSeat(gid,tableId){ _seatClear(tableId,gid); _seatTrim(tableId); saveToStorage(); navigate('seating'); }

// ── Group drag (couple / family pool blocks) ─────────────────────────
function dragGroup(e, idsJson){
  try{ dragGroupIds=JSON.parse(idsJson); } catch(_){ dragGroupIds=null; return; }
  dragSeatId=null; dragFromTable=null;
  const c=document.getElementById('floor-canvas');
  if(c) c.classList.add('seat-dragging');
  if(e&&e.dataTransfer) e.dataTransfer.effectAllowed='move';
  if(e&&e.target){
    e.target.addEventListener('dragend',function _de(){
      _floorSeatHighlightOff();
      e.target.removeEventListener('dragend',_de);
    });
  }
}

// ── Pool-group builder ───────────────────────────────────────────────
// Returns array of { type:'couple'|'family'|'solo', label, ids, members }
function _poolGroups(unseated){
  const byId=Object.fromEntries((unseated||[]).map(g=>[g.id,g]));
  const done=new Set(); const groups=[];
  // 1. STATE.families
  (STATE.families||[]).forEach(fam=>{
    const members=fam.memberIds.map(id=>byId[id]).filter(Boolean);
    if(!members.length) return;
    members.forEach(g=>done.add(g.id));
    if(members.length===1){ groups.push({type:'solo',label:'',ids:[members[0].id],members}); return; }
    groups.push({type:'family',label:fam.name,ids:members.map(g=>g.id),members});
  });
  // 2. coupleId pairs not already in a family
  for(const g of unseated){
    if(done.has(g.id)) continue;
    if(g.coupleId&&byId[g.coupleId]&&!done.has(g.coupleId)){
      const partner=byId[g.coupleId];
      done.add(g.id); done.add(partner.id);
      const label=_couplePoolLabel(g,partner);
      groups.push({type:'couple',label,ids:[g.id,partner.id],members:[g,partner]});
    }
  }
  // 3. Solo guests (no family / couple link in pool)
  for(const g of unseated){
    if(done.has(g.id)) continue;
    done.add(g.id);
    groups.push({type:'solo',label:'',ids:[g.id],members:[g]});
  }
  return groups;
}
function _couplePoolLabel(g,p){
  const fn=n=>n.split(' ')[0];
  const ln1=(g.name||'').split(' ').slice(1).join(' ');
  const ln2=(p.name||'').split(' ').slice(1).join(' ');
  if(ln1&&ln1===ln2) return fn(g.name)+' & '+fn(p.name)+' '+ln1;
  return fn(g.name)+' & '+fn(p.name);
}

// ── Pool HTML with group blocks ───────────────────────────────────────
function _poolGroupsHtml(unseated){
  if(!unseated.length) return '<span style="font-size:13px;color:var(--muted)">All guests assigned ✓</span>';
  const showKids=!(STATE.settings&&STATE.settings.seatHideChildren);
  const visible=showKids?unseated:unseated.filter(g=>_guestAgeBand(g)==='adult');
  if(!visible.length) return '<span style="font-size:13px;color:var(--muted)">All adult guests assigned ✓</span>';
  const useGroups=!(STATE.settings&&STATE.settings.seatFlatPool);
  if(!useGroups){
    return visible.map(g=>`<span class="seat-chip" data-sname="${g.name.toLowerCase()}" data-gid="${g.id}" draggable="true" ondragstart="dragSeat(event,'${g.id}',null)">${dietIcons(g.dietary)}${_ageBandBadge(g)||''} ${g.name}</span>`).join('');
  }
  const groups=_poolGroups(visible);
  return groups.map(grp=>{
    if(grp.type==='solo'){
      const g=grp.members[0];
      return `<span class="seat-chip" data-sname="${g.name.toLowerCase()}" data-gid="${g.id}" draggable="true" ondragstart="dragSeat(event,'${g.id}',null)">${dietIcons(g.dietary)}${_ageBandBadge(g)||''} ${g.name}</span>`;
    }
    const idsJson=JSON.stringify(grp.ids).replace(/"/g,'&quot;');
    const svgCouple='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.5"/><path d="M3 20v-1.5a5 5 0 0 1 5-5h2"/><circle cx="17" cy="7" r="3.5"/><path d="M13 14.5a5 5 0 0 1 5-5h1a5 5 0 0 1 5 5V20"/></svg>';
    const svgFamily='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v9.5h14V10"/></svg>';
    const chipClass=grp.type==='couple'?'pg-couple':'pg-family';
    const icon=grp.type==='couple'?svgCouple:svgFamily;
    const chipHtml=grp.members.map(g=>`<span class="seat-chip" data-sname="${g.name.toLowerCase()}" data-gid="${g.id}" draggable="true" ondragstart="event.stopPropagation();dragSeat(event,'${g.id}',null)">${dietIcons(g.dietary)}${_ageBandBadge(g)||''} ${g.name}</span>`).join('');
    return `<div class="pool-group ${chipClass}" draggable="true" ondragstart="dragGroup(event,'${idsJson}')" ondragover="event.preventDefault();this.classList.add('pg-drag-over')" ondragleave="this.classList.remove('pg-drag-over')" ondrop="this.classList.remove('pg-drag-over')">
      <div class="pool-group-hd">${icon}<span class="pool-group-label">${grp.label||grp.members.map(g=>g.name.split(' ')[0]).join(' & ')}</span><span style="font-size:10px;opacity:.6">${grp.members.length} guests</span></div>
      <div class="pool-group-chips">${chipHtml}</div>
    </div>`;
  }).join('');
}

// Toggle children/infants visibility in the pool
function toggleSeatShowChildren(){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.seatHideChildren=!STATE.settings.seatHideChildren;
  saveToStorage(); navigate('seating'); _seatReopenCog();
}
// Toggle flat vs grouped pool
function toggleSeatFlatPool(){
  if(!STATE.settings) STATE.settings={};
  STATE.settings.seatFlatPool=!STATE.settings.seatFlatPool;
  saveToStorage(); navigate('seating'); _seatReopenCog();
}
function _predictTableName(){
  const used=new Set();
  (STATE.tables||[]).forEach(t=>{
    const m=/^\s*table\s+(\d+)\s*$/i.exec(t.name||'');
    if(m) used.add(Number(m[1]));
  });
  let n=1; while(used.has(n)) n++;
  return 'Table '+n;
}
function _predictTableSeats(){
  const counts={};
  (STATE.tables||[]).forEach(t=>{
    const s=Number(t.seats);
    if(s>0) counts[s]=(counts[s]||0)+1;
  });
  let best=10,bestFreq=0;
  Object.keys(counts).forEach(k=>{
    const s=Number(k),f=counts[k];
    if(f>bestFreq||(f===bestFreq&&s>best)){ best=s; bestFreq=f; }
  });
  return best;
}
function openAddTable(){
  const predicted=_predictTableName();
  const predictedSeats=_predictTableSeats();
  openModal('Add Table',`<div class="form-row">
    <div class="form-group"><label class="form-label">Table Name</label><input class="form-input" id="tb-name" placeholder="e.g. Table 4" value="${predicted}"/></div>
    <div class="form-group"><label class="form-label">Seats</label><input class="form-input" type="number" id="tb-seats" value="${predictedSeats}" min="1"/></div>
  </div>`,
  `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
   <button class="btn btn-primary" onclick="saveTable()">Add Table</button>`);
  const inp=document.getElementById('tb-name');
  if(inp){ try{ inp.focus(); inp.select(); }catch(e){} }
}
function saveTable(){
  STATE.tables.push({id:'t'+Date.now(),name:document.getElementById('tb-name').value.trim()||'Table '+(STATE.tables.length+1),seats:Number(document.getElementById('tb-seats').value)||10});
  closeModalDirect(); navigate('seating');
}
function editTableSeats(id){
  const t=STATE.tables.find(x=>x.id===id); if(!t)return;
  openModal('Edit Seats — '+t.name,`
  <div class="form-group">
    <label class="form-label">Number of Seats</label>
    <input class="form-input" type="number" id="ts-seats" value="${t.seats}" min="1" placeholder="e.g. 10"/>
  </div>`,
  `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
   <button class="btn btn-primary" onclick="saveTableSeats('${id}')">Save</button>`);
}
/* ── Reducing a table's seat count ──────────────────────────────────────────
   Both entry points (the Edit Seats dialog `saveTableSeats`, and the +/- stepper
   in the floorplan manager `_mgrSetSeats`) route through _applySeatCount so the
   two drag/seating systems can never disagree about what "fewer seats" means.

   Order of operations when seats drop:
     1. COMPACT — pull every seated guest down into the lowest free chairs, closing
        gaps. This keeps the most people seated: a gap below the cut line would
        otherwise strand a guest past the new limit for no reason.
     2. TRIM — drop trailing holes (_seatTrim) so empty seats in the removed range
        simply cease to exist.
     3. If guests STILL exceed the new count, the table is genuinely over capacity:
        open the eviction picker so the USER chooses who returns to the pool. The
        app never evicts by chair index.
   `onDone` is how each caller returns to its own view afterwards. */
function _seatCompact(tid){
  const ids=_seatIds(tid);            // occupants, in chair order, holes removed
  STATE.seating[tid]=ids.slice();     // re-seat them densely from chair 0 up
}
/* Returns the number of guests still over capacity after a compact (0 if it fits). */
function _seatOverBy(tid, newSeats){
  return Math.max(0, _seatCount(tid) - newSeats);
}
/* The single place t.seats is lowered/raised with seating kept consistent.
   Returns true if applied, false if it opened the picker (caller should not
   also navigate — the picker owns the flow from there). */
function _applySeatCount(tid, v, onDone){
  const t=(STATE.tables||[]).find(x=>x.id===tid); if(!t) return false;
  v=Math.max(1, Number(v)||1);
  _seatCompact(tid);
  const over=_seatOverBy(tid, v);
  if(over>0){
    // Too many guests for the requested count — let the user pick who leaves.
    _openSeatEvictPicker(tid, v, over, onDone);
    return false;
  }
  t.seats=v;
  _seatTrim(tid);
  saveToStorage();
  if(typeof onDone==='function') onDone();
  return true;
}

let _seatEvictSel = {};   // tid -> Set of gids chosen to unseat
let _seatEvictNeed = {};  // tid -> how many must be unseated
function _openSeatEvictPicker(tid, newSeats, over, onDone){
  const t=(STATE.tables||[]).find(x=>x.id===tid); if(!t) return;
  _seatEvictSel[tid] = new Set();
  _seatEvictNeed[tid] = over;
  const ids=_seatIds(tid);
  // Highest chairs first — the ones "beyond the limit" are the natural default to
  // reach for, but nothing is preselected; the user chooses.
  const rows = ids.map(gid=>{
    const g=(STATE.guests||[]).find(x=>x.id===gid) || {name:'(guest)'};
    const seatNo = _seatArr(tid).indexOf(gid)+1;
    const side = (g.tags||[]).find(x=>/side$/i.test(x)) || '';
    const sub = 'Seat '+seatNo + (side?(' · '+side):'');
    return `<button type="button" class="seat-evict-row" data-gid="${_escAttr(gid)}" onclick="_seatEvictToggle('${_escSQ(tid)}','${_escSQ(gid)}')" style="display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:10px 12px;border:1px solid var(--border);border-radius:9px;margin-bottom:7px;cursor:pointer;background:var(--cream);font-family:inherit">
      <span class="seat-evict-chk" style="width:19px;height:19px;border-radius:5px;border:2px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center"></span>
      <span style="width:30px;height:30px;border-radius:50%;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--gold-deep);flex-shrink:0">${_escHtml(initials(g.name||''))}</span>
      <span style="flex:1;min-width:0"><span style="display:block;font-size:13px;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_escHtml(g.name||'(guest)')}</span><span style="display:block;font-size:11px;color:var(--muted);margin-top:1px">${_escHtml(sub)}</span></span>
    </button>`;
  }).join('');
  const body=`<div>
    <div style="font-size:12.5px;color:var(--muted);line-height:1.6;margin-bottom:12px">${_escHtml(t.name||'Table')} has <b style="color:var(--ink)">${ids.length} guests</b> but you've set it to <b style="color:var(--ink)">${newSeats} seat${newSeats!==1?'s':''}</b>. Choose <b style="color:var(--ink)">${over}</b> to send back to the unassigned pool.</div>
    <div style="max-height:46vh;overflow:auto;margin:0 -2px;padding:0 2px">${rows}</div>
  </div>`;
  const footer=`<span id="seat-evict-count" style="margin-right:auto;font-size:11.5px;font-weight:600;color:var(--red)">0 of ${over} chosen</span>
    <button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
    <button class="btn btn-primary" id="seat-evict-go" disabled onclick="_seatEvictConfirm('${_escSQ(tid)}',${newSeats},${over})">Unseat ${over} guest${over!==1?'s':''}</button>`;
  // Stash the caller's return so confirm can use it.
  _seatEvictOnDone = onDone;
  openModal('Too many guests for '+newSeats+' seat'+(newSeats!==1?'s':''), body, footer);
}
let _seatEvictOnDone = null;
function _seatEvictToggle(tid, gid){
  const sel=_seatEvictSel[tid]; if(!sel) return;
  if(sel.has(gid)) sel.delete(gid); else sel.add(gid);
  // Repaint just this row + the counter/button, no full rebuild.
  const row=document.querySelector('.seat-evict-row[data-gid="'+(window.CSS&&CSS.escape?CSS.escape(gid):gid)+'"]');
  if(row){
    const on=sel.has(gid);
    row.style.borderColor = on ? 'var(--red)' : 'var(--border)';
    row.style.background   = on ? 'rgba(192,57,43,.06)' : 'var(--cream)';
    const chk=row.querySelector('.seat-evict-chk');
    if(chk){
      chk.style.borderColor = on ? 'var(--red)' : 'var(--border)';
      chk.style.background   = on ? 'var(--red)' : 'transparent';
      chk.innerHTML = on ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '';
    }
  }
  // Update the counter and enable Unseat only when exactly `need` are chosen.
  const cEl=document.getElementById('seat-evict-count');
  const gEl=document.getElementById('seat-evict-go');
  const need = _seatEvictNeed[tid] || 0;
  if(cEl) cEl.textContent = sel.size+' of '+need+' chosen';
  if(gEl) gEl.disabled = (sel.size!==need);
}
function _seatEvictConfirm(tid, newSeats, over){
  const sel=_seatEvictSel[tid]; if(!sel || sel.size!==over) return;
  const t=(STATE.tables||[]).find(x=>x.id===tid); if(!t) return;
  sel.forEach(gid=>{
    _seatClear(tid, gid);
    if(t.headLeft===gid) t.headLeft=null;
    if(t.headRight===gid) t.headRight=null;
  });
  _seatCompact(tid);          // close the gaps the evictions just made
  t.seats=newSeats;
  _seatTrim(tid);
  delete _seatEvictSel[tid];
  saveToStorage();
  closeModalDirect();
  const n=sel.size;
  if(typeof _showInfoToast==='function')
    _showInfoToast(n+' guest'+(n!==1?'s':'')+' returned to the pool.', null, null);
  const done=_seatEvictOnDone; _seatEvictOnDone=null;
  if(typeof done==='function') done();
}

function saveTableSeats(id){
  const t=STATE.tables.find(x=>x.id===id); if(!t)return;
  const v=Number(document.getElementById('ts-seats').value);
  if(!(v>0)){ closeModalDirect(); return; }
  // Close THIS dialog first; _applySeatCount may open the eviction picker in its place.
  closeModalDirect();
  _applySeatCount(id, v, ()=>navigate('seating'));
}
function renameTable(id){
  const t=STATE.tables.find(x=>x.id===id);
  openModal('Rename Table',`<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="tr-name" value="${t.name}"/></div>`,
  `<button class="btn btn-outline" onclick="closeModalDirect()">Cancel</button>
   <button class="btn btn-primary" onclick="STATE.tables.find(x=>x.id==='${id}').name=document.getElementById('tr-name').value;closeModalDirect();navigate('seating')">Save</button>`);
}
function deleteTable(id){
  const t=STATE.tables.find(x=>x.id===id);
  _confirmDeleteDialog({title:'Remove Table', question:'Remove this table?', name:t?(t.name||t.label||''):'', verb:'Remove', noteVerb:'removed (its seat assignments will be cleared)', onConfirmJs:`confirmDeleteTable('${id}')`});
}
function confirmDeleteTable(id){
  const _t0=STATE.tables.find(x=>x.id===id);
  const _label=_t0?(_t0.name||_t0.label||'table'):'table';
  closeModalDirect();
  _undoableDelete(_label, ()=>{
    STATE.tables=STATE.tables.filter(x=>x.id!==id); delete STATE.seating[id];
  }, 'seating');
}

// ══════════════════════════════════════════════
