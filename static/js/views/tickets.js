// My Tickets View (User)
function renderMyTicketsView() {
  return `
    <div class="page-header">
      <div>
        <div class="page-title">My Tickets</div>
        <div class="page-subtitle">Track and manage your support requests</div>
      </div>
      <button class="btn btn-primary" id="new-ticket-btn">
        ${Icon.plus} New Ticket
      </button>
    </div>
    <div class="page-body">
      <div class="filters-bar">
        <div class="search-input-wrap">
          <span class="search-icon">${Icon.search}</span>
          <input type="text" class="search-input" id="ticket-search" placeholder="Search tickets…">
        </div>
        ${buildCustomSelect({ id: 'filter-status', options: [
          {value:'',label:'All Statuses'},{value:'open',label:'Open'},
          {value:'in_progress',label:'In Progress'},{value:'waiting_for_user',label:'Waiting'},
          {value:'resolved',label:'Resolved'},{value:'closed',label:'Closed'}
        ]})}
        ${buildCustomSelect({ id: 'filter-category', options: [
          {value:'',label:'All Categories'},{value:'hardware',label:'Hardware'},
          {value:'software',label:'Software'},{value:'network',label:'Network'},
          {value:'account_access',label:'Account Access'}
        ]})}
      </div>
      <div id="tickets-list">
        <div class="empty-state">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="36" height="36" rx="4"/><path d="M16 18h16M16 24h10"/></svg>
          <h3>Loading tickets…</h3>
        </div>
      </div>
    </div>`;
}

async function initMyTicketsView(navigateTo) {
  let allTickets = [];

  document.getElementById('new-ticket-btn')?.addEventListener('click', () => navigateTo('new-ticket'));

  async function load() {
    const params = {};
    const search = document.getElementById('ticket-search')?.value.trim();
    const status = document.querySelector('#cs-wrap-filter-status .custom-select-option.selected')?.dataset.value || '';
    const category = document.querySelector('#cs-wrap-filter-category .custom-select-option.selected')?.dataset.value || '';
    if (search) params.search = search;
    if (status) params.status = status;
    if (category) params.category = category;
    try {
      allTickets = await API.getTickets(params);
      renderList(allTickets);
    } catch (e) { Toast.error('Failed to load tickets'); }
  }

  function renderList(tickets) {
    const el = document.getElementById('tickets-list');
    if (!el) return;
    if (!tickets.length) {
      el.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="36" height="36" rx="4"/><path d="M16 18h16M16 24h10"/></svg>
        <h3>No tickets found</h3>
        <p>Try adjusting your filters or create a new ticket</p>
      </div>`;
      return;
    }
    el.innerHTML = `<div class="ticket-list">${tickets.map(t => ticketRow(t)).join('')}</div>`;
    el.querySelectorAll('.ticket-row').forEach(row => {
      row.addEventListener('click', () => navigateTo('ticket-detail', { id: row.dataset.id }));
    });
  }

  function ticketRow(t) {
    return `<div class="ticket-row" data-id="${t.id}">
      <span class="ticket-number">${t.ticket_number}</span>
      <div class="ticket-main">
        <div class="ticket-title">${t.title}</div>
        <div class="ticket-meta">
          <span>${fmtDate(t.created_at)}</span>
          <span class="dot">·</span>
          <span>${categoryLabel(t.category)}</span>
          ${t.assignee_name ? `<span class="dot">·</span><span>Assigned to ${t.assignee_name}</span>` : ''}
        </div>
      </div>
      <div class="ticket-badges">
        ${badge(t.urgency, 'urgency')}
        ${badge(t.status, 'status')}
      </div>
    </div>`;
  }

  let debounce;
  document.getElementById('ticket-search')?.addEventListener('input', () => {
    clearTimeout(debounce); debounce = setTimeout(load, 300);
  });
  // Custom select onChange wired via rebuild
  setTimeout(() => {
    const statusWrap = document.getElementById('cs-wrap-filter-status');
    const catWrap = document.getElementById('cs-wrap-filter-category');
    statusWrap?.querySelectorAll('.custom-select-option').forEach(o => o.addEventListener('click', () => setTimeout(load, 50)));
    catWrap?.querySelectorAll('.custom-select-option').forEach(o => o.addEventListener('click', () => setTimeout(load, 50)));
  }, 100);

  await load();
}

// New Ticket View
function renderNewTicketView() {
  return `
    <div class="page-header">
      <div>
        <div class="page-title">Submit a Ticket</div>
        <div class="page-subtitle">Describe your issue and we'll get back to you</div>
      </div>
    </div>
    <div class="page-body">
      <span class="back-btn" id="back-btn">${Icon.arrow_left} Back to tickets</span>
      <div class="card" style="max-width:100%">
        <div id="new-ticket-error" class="auth-error" style="display:none"></div>
        <div class="form-group">
          <label class="form-label">Issue Title *</label>
          <input type="text" class="form-control" id="nt-title" placeholder="Brief summary of the problem" maxlength="120">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Category *</label>
            ${buildCustomSelect({ id: 'nt-category', options: [
              {value:'',label:'Select a category'},{value:'hardware',label:'Hardware'},
              {value:'software',label:'Software'},{value:'network',label:'Network'},
              {value:'account_access',label:'Account Access'}
            ]})}
          </div>
          <div class="form-group">
            <label class="form-label">Urgency *</label>
            <div class="urgency-options">
              <div class="urgency-option u-low" data-val="low">
                <div class="u-label" style="color:var(--text-2)">Low</div>
              </div>
              <div class="urgency-option u-medium selected" data-val="medium">
                <div class="u-label" style="color:var(--accent)">Medium</div>
              </div>
              <div class="urgency-option u-high" data-val="high">
                <div class="u-label" style="color:var(--orange)">High</div>
              </div>
              <div class="urgency-option u-urgent" data-val="urgent">
                <div class="u-label" style="color:var(--red)">Urgent</div>
              </div>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description *</label>
          <textarea class="form-control" id="nt-description" rows="6" placeholder="Please describe the issue in detail. Include steps to reproduce, error messages, or anything relevant…"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Attachments <span style="color:var(--text-3);font-weight:400">(optional)</span></label>
          <div class="upload-zone" id="upload-zone" style="padding:16px;display:flex;align-items:center;gap:12px;text-align:left">
            <input type="file" id="file-input" multiple accept="image/*,.pdf">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" style="flex-shrink:0;opacity:.5"><path d="M15.5 9l-6.5 6.5a4 4 0 01-5.7-5.6L10 3.3a2.5 2.5 0 013.5 3.5L7 13.4a1 1 0 01-1.4-1.4l6.5-6.5"/></svg>
            <div>
              <p style="margin:0">Drop files here or <span>browse</span></p>
              <p style="font-size:.75rem;color:var(--text-3);margin:2px 0 0">PNG, JPG, GIF, PDF · max 10MB each</p>
            </div>
          </div>
          <div class="upload-preview" id="upload-preview"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
          <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="submit-btn">${Icon.plus} Submit Ticket</button>
        </div>
      </div>
    </div>`;
}

function initNewTicketView(navigateTo) {
  document.getElementById('back-btn')?.addEventListener('click', () => navigateTo('my-tickets'));
  document.getElementById('cancel-btn')?.addEventListener('click', () => navigateTo('my-tickets'));

  let selectedUrgency = 'medium';
  let selectedFiles = [];

  document.querySelectorAll('.urgency-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.urgency-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedUrgency = opt.dataset.val;
    });
  });

  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault(); uploadZone.classList.remove('drag-over');
    addFiles(Array.from(e.dataTransfer.files));
  });
  fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files)); fileInput.value = ''; });

  function addFiles(files) {
    files.forEach(f => {
      if (selectedFiles.length >= 5) return Toast.info('Max 5 files');
      if (f.size > 10 * 1024 * 1024) return Toast.error(`${f.name} is too large`);
      selectedFiles.push(f);
    });
    renderPreview();
  }

  function renderPreview() {
    const preview = document.getElementById('upload-preview');
    if (!selectedFiles.length) { preview.innerHTML = ''; return; }
    preview.innerHTML = selectedFiles.map((f, i) => {
      const isImg = f.type.startsWith('image/');
      return `<div class="upload-preview-item">
        ${isImg ? `<img src="${URL.createObjectURL(f)}" alt="">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);font-size:1.5rem">📄</div>`}
        <div class="file-name">${f.name}</div>
        <div class="remove-btn" data-i="${i}">×</div>
      </div>`;
    }).join('');
    preview.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); selectedFiles.splice(+btn.dataset.i, 1); renderPreview(); });
    });
  }

  document.getElementById('submit-btn')?.addEventListener('click', async () => {
    const title = document.getElementById('nt-title').value.trim();
    const catEl = document.getElementById('cs-label-nt-category'); const category = document.querySelector('#cs-wrap-nt-category .custom-select-option.selected')?.dataset.value || '';
    const description = document.getElementById('nt-description').value.trim();
    const errBox = document.getElementById('new-ticket-error');
    errBox.style.display = 'none';

    if (!title) { errBox.textContent = 'Please enter a title'; errBox.style.display = 'block'; return; }
    if (!category) { errBox.textContent = 'Please select a category'; errBox.style.display = 'block'; return; }
    if (!description) { errBox.textContent = 'Please describe the issue'; errBox.style.display = 'block'; return; }

    const btn = document.getElementById('submit-btn');
    btn.textContent = 'Submitting…'; btn.disabled = true;

    const fd = new FormData();
    fd.append('title', title);
    fd.append('category', category);
    fd.append('urgency', selectedUrgency);
    fd.append('description', description);
    selectedFiles.forEach(f => fd.append('attachments', f));

    try {
      const ticket = await API.createTicket(fd);
      Toast.success(`Ticket ${ticket.ticket_number} submitted!`);
      navigateTo('ticket-detail', { id: ticket.id });
    } catch (e) {
      errBox.textContent = e.message; errBox.style.display = 'block';
      btn.innerHTML = `${Icon.plus} Submit Ticket`; btn.disabled = false;
    }
  });
}
