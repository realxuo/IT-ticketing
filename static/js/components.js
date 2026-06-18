// ── Shared Components & Utilities ────────────────────────────────────────────

// Toast notifications
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    this.init();
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    this.container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = 'all 0.3s'; setTimeout(() => el.remove(), 300); }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  info: (msg) => Toast.show(msg, 'info'),
};

// Format helpers
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso + (iso.endsWith('Z') ? '' : 'Z'));
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd}d ago`;
  return fmtDate(iso);
}

function capitalize(str) {
  return str ? str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
}

function statusLabel(s) {
  const map = { open: 'Open', in_progress: 'In Progress', waiting_for_user: 'Waiting', resolved: 'Resolved', closed: 'Closed' };
  return map[s] || capitalize(s);
}
function categoryLabel(c) {
  const map = { hardware: 'Hardware', software: 'Software', network: 'Network', account_access: 'Account Access' };
  return map[c] || capitalize(c);
}

function badge(value, type = 'status') {
  return `<span class="badge badge-${value}">${type === 'status' ? statusLabel(value) : type === 'category' ? categoryLabel(value) : capitalize(value)}</span>`;
}

function logoSVG(size = 32) {
  return `<svg class="logo-icon" width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="14" height="14" rx="3" fill="var(--accent)"/>
    <rect x="22" y="4" width="14" height="14" rx="3" fill="var(--accent)" opacity="0.7"/>
    <rect x="4" y="22" width="14" height="14" rx="3" fill="var(--accent)" opacity="0.7"/>
    <rect x="22" y="22" width="14" height="14" rx="3" fill="var(--accent)" opacity="0.35"/>
  </svg>`;
}

// Icons (inline SVG helpers)
const Icon = {
  ticket: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1 1 1 0 000 2 1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1 1 1 0 000-2 1 1 0 01-1-1V7z"/></svg>`,
  dashboard: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>`,
  plus: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 4v12M4 10h12"/></svg>`,
  logout: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 3h4a1 1 0 011 1v12a1 1 0 01-1 1h-4M8 14l-4-4 4-4M2 10h10"/></svg>`,
  arrow_left: `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4L5 10l7 6"/></svg>`,
  search: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="5.5"/><path d="M16 16l-3.5-3.5"/></svg>`,
  clip: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15.5 9l-6.5 6.5a4 4 0 01-5.7-5.6L10 3.3a2.5 2.5 0 013.5 3.5L7 13.4a1 1 0 01-1.4-1.4l6.5-6.5"/></svg>`,
  check: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10l5 5 7-8"/></svg>`,
  users: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="7" r="3"/><path d="M2 18c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5c1.7 0 3 1.3 3 3s-1.3 3-3 3"/><path d="M18 18c0-2.4-1.3-4.5-3.2-5.6"/></svg>`,
  clock: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v4l2.5 2.5"/></svg>`,
};

// Render sidebar
function renderSidebar(user) {
  const isTech = user.role !== 'user';
  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        ${logoSVG(28)}
        <div>
          <div class="logo-text">HelpDesk</div>
          <div class="logo-sub">IT Support Portal</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">My Portal</div>
        <div class="nav-item ${!isTech ? 'active' : ''}" data-view="my-tickets" id="nav-my-tickets">
          <span class="nav-icon">${Icon.ticket}</span>
          My Tickets
        </div>
        ${!isTech ? `<div class="nav-item" data-view="new-ticket" id="nav-new-ticket">
          <span class="nav-icon">${Icon.plus}</span>
          New Ticket
        </div>` : ''}
        ${isTech ? `
          <div class="nav-section-label" style="margin-top:8px;">Technician</div>
          <div class="nav-item" data-view="all-tickets" id="nav-all-tickets">
            <span class="nav-icon">${Icon.ticket}</span>
            All Tickets
          </div>
          <div class="nav-item" data-view="dashboard" id="nav-dashboard">
            <span class="nav-icon">${Icon.dashboard}</span>
            Dashboard
          </div>
        ` : ''}
      </nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-role">${capitalize(user.role)}</div>
          </div>
        </div>
        <button id="logout-btn" style="display:flex;align-items:center;gap:6px;margin-top:8px;padding:5px 8px;background:none;border:none;color:var(--text-3);font-size:.78rem;cursor:pointer;font-family:inherit;border-radius:4px;transition:color 0.15s" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--text-3)'">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 3h4a1 1 0 011 1v12a1 1 0 01-1 1h-4M8 14l-4-4 4-4M2 10h10"/></svg>
          Sign out
        </button>
      </div>
    </aside>`;
}

// Modal helper
function openModal(html, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); if (onClose) onClose(); } });
  return overlay;
}

// Simple donut SVG
function donutChart(segments, size = 120) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return '<div style="color:var(--text-3);font-size:.85rem;text-align:center;padding:20px">No data</div>';
  let offset = 0;
  const cx = size / 2, cy = size / 2, r = (size - 20) / 2, inner = r * 0.55;
  const circumference = 2 * Math.PI * r;
  const paths = segments.map(seg => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const path = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${r - inner}" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset * circumference}" transform="rotate(-90 ${cx} ${cy})" opacity="0.85"/>`;
    offset += pct;
    return path;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths.join('')}<circle cx="${cx}" cy="${cy}" r="${inner}" fill="var(--bg-2)"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="var(--text)" font-size="${size * 0.14}" font-weight="700" font-family="var(--font)">${total}</text></svg>`;
}

// ── Custom Select Component ───────────────────────────────────────────────────
function buildCustomSelect({ id, options, value = '', onChange }) {
  const selected = options.find(o => o.value === value) || options[0];
  const chevron = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>`;

  const html = `
    <div class="custom-select" id="cs-wrap-${id}">
      <div class="custom-select-trigger" id="cs-trigger-${id}">
        <span id="cs-label-${id}">${selected.label}</span>
        ${chevron}
      </div>
      <div class="custom-select-menu" id="cs-menu-${id}">
        ${options.map(o => `
          <div class="custom-select-option ${o.value === value ? 'selected' : ''}"
               data-value="${o.value}" data-csid="${id}">${o.label}</div>
        `).join('')}
      </div>
    </div>`;

  // Init after render
  setTimeout(() => {
    const trigger = document.getElementById(`cs-trigger-${id}`);
    const menu = document.getElementById(`cs-menu-${id}`);
    const label = document.getElementById(`cs-label-${id}`);
    if (!trigger || !menu) return;

    let currentVal = value;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      // Close all other menus
      document.querySelectorAll('.custom-select-menu.open').forEach(m => {
        m.classList.remove('open');
        m.previousElementSibling?.classList.remove('open');
      });
      if (!isOpen) { menu.classList.add('open'); trigger.classList.add('open'); }
    });

    menu.querySelectorAll('.custom-select-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        currentVal = opt.dataset.value;
        label.textContent = opt.textContent.trim();
        menu.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        menu.classList.remove('open'); trigger.classList.remove('open');
        if (onChange) onChange(currentVal);
      });
    });

    document.addEventListener('click', () => {
      menu.classList.remove('open'); trigger.classList.remove('open');
    }, { capture: true });
  }, 0);

  return html;
}
