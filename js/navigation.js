// NAVIGATION
// ══════════════════════════════════════════════
let _currentPage='dashboard';
function navigate(page){
  // Invitations folded into the RSVP & Invites page.
  if(page==='invitation') page='rsvp-mgr';
  // Paid-page gate: signed-in free users cannot access premium pages
  if(_sbSession && typeof _uvIsPaid==='function' && !_uvIsPaid() && typeof _UV_PAID_PAGES!=='undefined' && _UV_PAID_PAGES.has(page)){
    _uvShowUpgradeModal(page); return;
  }
  // If we're re-rendering the SAME page (e.g. a budget toggle/edit calls navigate('budget')
  // to refresh in place), remember the scroll position so the view doesn't jump to the top.
  // A genuine page change scrolls to top as before. An explicit scrollIntoView that runs
  // after the render (in a setTimeout) still wins, so "jump to item" actions are unaffected.
  const _samePageRefresh = (page===_currentPage);
  let _prevScrollTop = 0;
  if(_samePageRefresh){ const _sc=document.getElementById('main-content'); if(_sc) _prevScrollTop=_sc.scrollTop; }
  // Persist the full state on every navigation
  saveToStorage();
  // Leaving the checklist page closes the Archived sub-page so returning later
  // lands on the normal checklist, not the archive.
  if(page!=='checklist') _clArchivedView=false;
  // The NEW-import badges are a transient post-import highlight; clear them once the
  // user leaves the Guests page (re-imports repopulate the set).
  if(page!=='guests' && _newlyImportedIds.size) _newlyImportedIds=new Set();
  // The suggestion bar now persists for a 5-minute window (owned by its timer),
  // surviving navigation away from and back to Guests. Only the timer, an explicit
  // dismiss, Apply, or Not-now clears it — not a page change. Drag state is still
  // reset on leaving so a half-finished drag never lingers.
  if(page!=='guests' && typeof _grLoose!=='undefined'){ _grLoose=[]; _grDragActive=false; _grDrag=null; }
  // A seat-drag "ghost" pip is appended to <body> and follows the pointer; if a drag is
  // interrupted by a page change (pointerup never reaches our handler), the ghost can be
  // orphaned and appear stuck on screen. Sweep up any stray ghost and reset the floor
  // drag state on every navigation so nothing lingers across pages.
  if(typeof _floorClearStrayGhosts==='function') _floorClearStrayGhosts();
  document.querySelectorAll('.nav-item button').forEach(b=>b.classList.remove('active'));
  _currentPage=page;
  const nb=document.getElementById('nav-'+page);
  if(nb)nb.classList.add('active');
  // In hamburger/drawer mode, close the off-canvas drawer after picking an item.
  // In icon-sidebar mode, leave the sidebar exactly as the user set it —
  // it only collapses when the chevron toggle is clicked.
  if(window.innerWidth<=900 && !document.body.classList.contains('icon-sidebar')){
    document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  }
  const titles={dashboard:'Dashboard',details:'Event Details',timeline:'Day-of Timeline',guests:'Guest List','rsvp-mgr':'RSVP & Invites',
    checklist:'Checklist',calendar:'Calendar',budget:'Budget',vendors:'Vendors',seating:'Seating Plan',inspo:'Inspiration',
    visionboard:'Vision Board',wishingwell:'Wishing Well',invitation:'RSVP & Invites',settings:'Settings',events:'Events',website:'Website'};
  const eyebrows={dashboard:'Overview',details:'Your Event',timeline:'Schedule',guests:'Guests','rsvp-mgr':'Guests',
    checklist:'Planning',calendar:'Planning',budget:'Finances',vendors:'Suppliers',seating:'Layout',inspo:'Create',
    visionboard:'Aesthetic',wishingwell:'Gifts',invitation:'Guests',settings:'Preferences',events:'Celebrations',website:'Guests'};
  document.getElementById('topbar-title').textContent=titles[page]||page;
  const eb=document.getElementById('topbar-eyebrow');
  if(eb) eb.textContent=eyebrows[page]||'';
  updateTopbarSub();
  const c=document.getElementById('main-content');
  if(c) c.setAttribute('data-page', page);
  const actions=document.getElementById('topbar-actions');
  actions.innerHTML='';
  actions.style.flexWrap='';
  actions.style.alignItems='';
  if(page==='dashboard') renderDashboard(c,actions);
  else if(page==='details') renderDetails(c,actions);
  else if(page==='timeline') renderTimeline(c,actions);
  else if(page==='guests') renderGuests(c,actions);
  else if(page==='rsvp-mgr') renderRsvpMgr(c,actions);
  else if(page==='events') renderEvents(c,actions);
  else if(page==='checklist') renderChecklist(c,actions);
  else if(page==='calendar') renderCalendar(c,actions);
  else if(page==='budget') renderBudget(c,actions);
  else if(page==='vendors') renderVendors(c,actions);
  else if(page==='seating') renderSeating(c,actions);
  else if(page==='inspo') renderInspo(c,actions);
  else if(page==='visionboard') renderVisionboard(c,actions);
  else if(page==='wishingwell') renderWishingWell(c,actions);
  else if(page==='website') renderWebsite(c,actions);
  else if(page==='invitation') renderInvitation(c,actions);
  else if(page==='settings') renderSettings(c,actions);
  _updateBudgetNavBadge();
  _updateChecklistNavBadge();
  _updateSeatingNavBadge();
  if(page==='rsvp-mgr'){_markRsvpViewed();}else if(typeof _fetchRsvpBadgeCount==='function'){_fetchRsvpBadgeCount();}
  // Restore the pre-render scroll position on a same-page refresh so an in-place change
  // (budget toggle, amount edit, etc.) keeps the user where they were instead of jumping
  // to the top. Done after the new content is in the DOM so the scroll height exists.
  if(_samePageRefresh && _prevScrollTop){
    const _sc=document.getElementById('main-content');
    if(_sc) _sc.scrollTop=_prevScrollTop;
  }
}

function toggleSidebar(){
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebar-overlay');
  const isIconMode=document.body.classList.contains('icon-sidebar');
  const isMobile=window.innerWidth<=900;

  if(isIconMode){
    sidebar.classList.toggle('collapsed');
    try{localStorage.setItem('uv_sb_desktop',sidebar.classList.contains('collapsed')?'icon':'full');}catch(_){}
  } else {
    sidebar.classList.toggle('collapsed');
    if(isMobile){
      overlay.classList.toggle('visible',!sidebar.classList.contains('collapsed'));
      try{localStorage.setItem('uv_sb_mobile',sidebar.classList.contains('collapsed')?'closed':'open');}catch(_){}
    }
  }
}

function updateTopbarSub(){
  const p1=STATE.event.partner1||'Partner 1';
  const p2=STATE.event.partner2||'Partner 2';
  const el=document.getElementById('topbar-sub');
  if(el) el.textContent='';
  document.getElementById('sidebar-couple-names').textContent=`${p1} & ${p2}`;
}

// ══════════════════════════════════════════════
