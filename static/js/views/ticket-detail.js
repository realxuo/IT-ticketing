// Ticket Detail View
function renderTicketDetailView() {
  return `
    <div class="page-header" style="padding-bottom:20px">
      <div id="ticket-detail-header"></div>
    </div>
    <div class="page-body" id="ticket-detail-body">
      <div class="empty-state"><h3>Loading…</h3></div>
    </div>`;
}

async function initTicketDetailView(navigateTo, params, currentUser) {
  const ticketId = params?.id;
  if (!ticketId) { navigateTo('my-tickets'); return; }
  const isTech = currentUser.role !== 'user';
  let ticket;

  try {
    ticket = await API.getTicket(ticketId);
  } catch (e) {
    Toast.error('Ticket not found'); navigateTo('my-tickets'); return;
  }

  function render() {
    const header = document.getElementById('ticket-detail-header');
    const body = document.getElementById('ticket-detail-body');
    if (!header || !body) return;

    header.innerHTML = `
      <span class="back-btn" id="back-btn">${Icon.arrow_left} Back</span>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div class="page-title">${ticket.title}</div>
        <span style="font-family:var(--mono);font-size:.85rem;color:var(--text-3)">${ticket.ticket_number}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
        ${badge(ticket.status, 'status')}
        ${badge(ticket.urgency, 'urgency')}
        ${badge(ticket.category, 'category')}
      </div>`;

    const attachHtml = ticket.attachments?.length ? `
      <div class="detail-section">
        <div class="detail-section-title">Attachments (${ticket.attachments.length})</div>
        <div class="attachments-grid">
          ${ticket.attachments.map(a => {
            const isImg = /\.(png|jpg|jpeg|gif|webp)$/i.test(a.filename);
            return `<a class="attachment-thumb" href="/api/uploads/${a.filename}" target="_blank" title="${a.original_name}">
              ${isImg
                ? `<img src="/api/uploads/${a.filename}" alt="${a.original_name}" loading="lazy">`
                : `<div class="attach-icon">📄<span>${a.original_name.split('.').pop().toUpperCase()}</span></div>`}
            </a>`;
          }).join('')}
        </div>
      </div>` : '';

    const notesHtml = (ticket.notes || []).map(n => `
      <div class="note-item ${n.is_internal ? 'internal' : ''}">
        <div class="note-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="note-author">${n.author_name}</span>
            ${n.is_internal ? '<span class="note-internal-tag">Technician note</span>' : ''}
          </div>
          <span class="note-time">${timeAgo(n.created_at)}</span>
        </div>
        <div class="note-content">${n.content}</div>
      </div>`).join('');

    const techControls = isTech ? `
      <div class="detail-section">
        <div class="detail-section-title">Actions</div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="status-select" id="status-select" style="width:100%">
            <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
            <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="waiting_for_user" ${ticket.status === 'waiting_for_user' ? 'selected' : ''}>Waiting for User</option>
            <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
            <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Urgency</label>
          <select class="status-select" id="urgency-select" style="width:100%">
            <option value="low" ${ticket.urgency === 'low' ? 'selected' : ''}>Low</option>
            <option value="medium" ${ticket.urgency === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${ticket.urgency === 'high' ? 'selected' : ''}>High</option>
            <option value="urgent" ${ticket.urgency === 'urgent' ? 'selected' : ''}>Urgent</option>
          </select>
        </div>
        ${currentUser.role === 'admin' ? `
          <button class="btn btn-primary btn-sm" id="assign-btn" style="width:100%">
            ${Icon.users} ${ticket.assignee_name ? 'Reassign' : 'Assign Technician'}
          </button>` : `
          <button class="btn btn-secondary btn-sm" id="assign-btn" style="width:100%">
            ${Icon.users} ${ticket.assignee_id === currentUser.id ? 'Unassign Myself' : 'Assign to Myself'}
          </button>`
        }
      </div>` : '';

    const internalToggle = isTech ? `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <input type="checkbox" id="internal-check">
        <label for="internal-check" style="font-size:.8rem;color:var(--text-2);cursor:pointer">Visible to technicians &amp; admins only</label>
      </div>` : '';

    body.innerHTML = `
      <div class="ticket-detail-layout">
        <div class="ticket-detail-body">
          <div class="detail-section">
            <div class="detail-section-title">Description</div>
            <div class="detail-description">${ticket.description}</div>
          </div>
          ${attachHtml}
          <div class="detail-section">
            <div class="detail-section-title">Notes & Updates</div>
            <div class="notes-list" id="notes-list">
              ${notesHtml || '<p style="color:var(--text-3);font-size:.85rem">No notes yet.</p>'}
            </div>
            <div class="note-form">
              ${internalToggle}
              <textarea class="form-control" id="note-input" rows="3" placeholder="Add a note or update…"></textarea>
              <div style="display:flex;justify-content:flex-end">
                <button class="btn btn-primary btn-sm" id="add-note-btn">${Icon.check} Add Note</button>
              </div>
            </div>
          </div>
        </div>
        <div class="ticket-detail-sidebar">
          <div class="detail-section">
            <div class="detail-section-title">Details</div>
            <div class="meta-item">
              <span class="meta-label">Submitted by</span>
              <span class="meta-value">${ticket.submitter_name}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Assigned to</span>
              <span class="meta-value">${ticket.assignee_name || '—'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Created</span>
              <span class="meta-value">${fmtDateTime(ticket.created_at)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Last updated</span>
              <span class="meta-value">${fmtDateTime(ticket.updated_at)}</span>
            </div>
            ${ticket.resolved_at ? `<div class="meta-item">
              <span class="meta-label">Resolved</span>
              <span class="meta-value">${fmtDateTime(ticket.resolved_at)}</span>
            </div>` : ''}
          </div>
          ${techControls}
        </div>
      </div>`;

    // Back button
    document.getElementById('back-btn')?.addEventListener('click', () => {
      const prev = window._prevView || (isTech ? 'all-tickets' : 'my-tickets');
      navigateTo(prev);
    });

    // Add note
    document.getElementById('add-note-btn')?.addEventListener('click', async () => {
      const content = document.getElementById('note-input')?.value.trim();
      if (!content) return Toast.error('Note cannot be empty');
      const isInternal = document.getElementById('internal-check')?.checked || false;
      try {
        await API.addNote(ticket.id, content, isInternal);
        ticket = await API.getTicket(ticketId);
        document.getElementById('note-input').value = '';
        if (document.getElementById('internal-check')) document.getElementById('internal-check').checked = false;
        Toast.success('Note added');
        render();
      } catch (e) { Toast.error(e.message); }
    });

    // Status change
    document.getElementById('status-select')?.addEventListener('change', async (e) => {
      try {
        await API.updateTicket(ticket.id, { status: e.target.value });
        ticket = await API.getTicket(ticketId);
        Toast.success('Status updated');
        render();
      } catch (err) { Toast.error(err.message); }
    });

    // Urgency change
    document.getElementById('urgency-select')?.addEventListener('change', async (e) => {
      try {
        await API.updateTicket(ticket.id, { urgency: e.target.value });
        ticket = await API.getTicket(ticketId);
        Toast.success('Urgency updated');
        render();
      } catch (err) { Toast.error(err.message); }
    });

    // Assign button — admin gets full picker, technician toggles self
    document.getElementById('assign-btn')?.addEventListener('click', async () => {
      if (currentUser.role === 'admin') {
        try {
          const techs = await API.getTechnicians();
          const overlay = openModal(`
            <div class="modal">
              <div class="modal-header">
                <div class="modal-title">Assign Technician</div>
                <button class="modal-close" id="close-modal">×</button>
              </div>
              <div class="tech-select-list">
                <div class="tech-option ${!ticket.assignee_id ? 'selected' : ''}" data-id="">
                  <div><div style="font-size:.9rem;font-weight:500">Unassigned</div></div>
                </div>
                ${techs.map(t => `
                  <div class="tech-option ${ticket.assignee_id === t.id ? 'selected' : ''}" data-id="${t.id}">
                    <div>
                      <div style="font-size:.9rem;font-weight:500">${t.name}</div>
                      <div style="font-size:.75rem;color:var(--text-3)">${capitalize(t.role)}</div>
                    </div>
                  </div>`).join('')}
              </div>
            </div>`);
          overlay.querySelectorAll('.tech-option').forEach(opt => {
            opt.addEventListener('click', async () => {
              const assigneeId = opt.dataset.id ? +opt.dataset.id : null;
              try {
                await API.updateTicket(ticket.id, { assignee_id: assigneeId });
                ticket = await API.getTicket(ticketId);
                Toast.success('Ticket assigned');
                overlay.remove();
                render();
              } catch (e) { Toast.error(e.message); }
            });
          });
          overlay.querySelector('#close-modal')?.addEventListener('click', () => overlay.remove());
        } catch (e) { Toast.error(e.message); }
      } else {
        // Technician: toggle assign self
        const newAssignee = ticket.assignee_id === currentUser.id ? null : currentUser.id;
        try {
          await API.updateTicket(ticket.id, { assignee_id: newAssignee });
          if (newAssignee === null) {
            Toast.success('Unassigned — ticket removed from your list');
            setTimeout(() => navigateTo('all-tickets'), 800);
          } else {
            ticket = await API.getTicket(ticketId);
            Toast.success('Assigned to you');
            render();
          }
        } catch (e) { Toast.error(e.message); }
      }
    });
  }

  render();
}