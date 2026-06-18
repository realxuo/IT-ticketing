// Tech All-Tickets View
function renderTechTicketsView(currentUser, mode) {
  return `
    <div class="page-header">
      <div>
        <div class="page-title">${mode === 'mine' ? 'My Tickets' : mode === 'unassigned' ? 'All Tickets' : 'All Tickets'}</div>
        <div class="page-subtitle">${mode === 'mine' ? 'Your assigned tickets' : mode === 'unassigned' ? 'Unassigned tickets available to pick up' : 'Manage and resolve all support requests'}</div>
      </div>

    </div>
    <div class="page-body">
      <div class="filters-bar">
        <div class="search-input-wrap">
          <span class="search-icon">${Icon.search}</span>
          <input type="text" class="search-input" id="tech-search" placeholder="Search tickets…">
        </div>
        ${currentUser.role === 'admin' ? `
        ${buildCustomSelect({ id: 'tech-filter-status', options: [
          {value:'',label:'All Statuses'},{value:'open',label:'Open'},
          {value:'in_progress',label:'In Progress'},{value:'waiting_for_user',label:'Waiting'},
          {value:'resolved',label:'Resolved'},{value:'closed',label:'Closed'}
        ]})}
        ${buildCustomSelect({ id: 'tech-filter-category', options: [
          {value:'',label:'All Categories'},{value:'hardware',label:'Hardware'},
          {value:'software',label:'Software'},{value:'network',label:'Network'},
          {value:'account_access',label:'Account Access'}
        ]})}
        ${buildCustomSelect({ id: 'tech-filter-urgency', options: [
          {value:'',label:'All Urgencies'},{value:'urgent',label:'Urgent'},
          {value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}
        ]})}` : ''}
        <span id="tech-count" style="font-size:.8rem;color:var(--text-3);margin-left:auto"></span>
      </div>
      <div id="tech-tickets-list">
        <div class="empty-state"><h3>Loading…</h3></div>
      </div>
    </div>`;
}

async function initTechTicketsView(navigateTo, currentUser, mode) {
  async function load() {
    const params = {};
    if (mode === 'mine') {
      params.assignee_id = currentUser.id;
    } else if (mode === 'unassigned') {
      params.unassigned = true;
    }
    const search = document.getElementById('tech-search')?.value.trim();
    const status = document.querySelector('#cs-wrap-tech-filter-status .custom-select-option.selected')?.dataset.value || '';
    const category = document.querySelector('#cs-wrap-tech-filter-category .custom-select-option.selected')?.dataset.value || '';
    const urgency = document.querySelector('#cs-wrap-tech-filter-urgency .custom-select-option.selected')?.dataset.value || '';
    if (search) params.search = search;
    if (status) params.status = status;
    if (category) params.category = category;
    if (urgency) params.urgency = urgency;

    try {
      const tickets = await API.getTickets(params);
      const countEl = document.getElementById('tech-count');
      if (countEl) countEl.textContent = `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`;
      renderList(tickets);
    } catch (e) { Toast.error('Failed to load tickets'); }
  }

  function renderList(tickets) {
    const el = document.getElementById('tech-tickets-list');
    if (!el) return;
    if (!tickets.length) {
      el.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="36" height="36" rx="4"/><path d="M16 18h16M16 24h10"/></svg>
        <h3>No tickets match your filters</h3>
      </div>`; return;
    }
    el.innerHTML = `<div class="ticket-list">${tickets.map(t => `
      <div class="ticket-row" data-id="${t.id}">
        <span class="ticket-number">${t.ticket_number}</span>
        <div class="ticket-main">
          <div class="ticket-title">${t.title}</div>
          <div class="ticket-meta">
            <span>${t.submitter_name}</span>
            <span class="dot">·</span>
            <span>${categoryLabel(t.category)}</span>
            <span class="dot">·</span>
            <span>${timeAgo(t.created_at)}</span>
          </div>
        </div>
        <div class="ticket-badges">
          ${badge(t.urgency, 'urgency')}
          ${badge(t.status, 'status')}
        </div>
        ${mode !== 'mine' ? `<div class="ticket-assignee">${t.assignee_name ? t.assignee_name : '<span style="color:var(--text-3)">Unassigned</span>'}</div>` : ''}
      </div>`).join('')}</div>`;

    el.querySelectorAll('.ticket-row').forEach(row => {
      row.addEventListener('click', () => {
        window._prevView = 'all-tickets';
        navigateTo('ticket-detail', { id: row.dataset.id });
      });
    });
  }

  let debounce;
  document.getElementById('tech-search')?.addEventListener('input', () => {
    clearTimeout(debounce); debounce = setTimeout(load, 300);
  });
  setTimeout(() => {
    ['tech-filter-status', 'tech-filter-category', 'tech-filter-urgency'].forEach(id => {
      document.getElementById(`cs-wrap-${id}`)?.querySelectorAll('.custom-select-option')
        .forEach(o => o.addEventListener('click', () => setTimeout(load, 50)));
    });
  }, 100);

  await load();
}