// ── App Router ────────────────────────────────────────────────────────────────
(async function () {
  const app = document.getElementById('app');
  let currentUser = null;

  async function boot() {
    try {
      const res = await API.me();
      if (res?.id) {
        currentUser = res;
        renderApp();
      } else {
        renderLoginPage();
      }
    } catch {
      renderLoginPage();
    }
  }

  function renderLoginPage() {
    app.innerHTML = renderAuthView();
    initAuthView((user) => {
      currentUser = user;
      renderApp();
    });
  }

  function renderApp(view = null, params = {}) {
    if (!currentUser) { renderLoginPage(); return; }
    const isTech = currentUser.role !== 'user';
    const defaultView = isTech ? 'all-tickets' : 'my-tickets';
    const activeView = view || defaultView;

    app.innerHTML = `
      ${renderSidebar(currentUser)}
      <div class="main-content" id="main-content">
        <div id="view-container"></div>
      </div>`;

    // Sidebar nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => navigateTo(item.dataset.view));
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await API.logout();
      currentUser = null;
      renderLoginPage();
    });

    navigateTo(activeView, params);
  }

  function navigateTo(view, params = {}) {
    const container = document.getElementById('view-container');
    if (!container) return;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    // Render view HTML
    const isTech = currentUser?.role !== 'user';
    switch (view) {
      case 'new-ticket':
        if (isTech) { navigateTo('all-tickets'); return; }
        container.innerHTML = renderNewTicketView();
        initNewTicketView(navigateTo);
        break;
      case 'ticket-detail':
        container.innerHTML = renderTicketDetailView();
        initTicketDetailView(navigateTo, params, currentUser);
        break;
      case 'my-tickets':
        if (isTech) {
          container.innerHTML = renderTechTicketsView(currentUser, 'mine');
          initTechTicketsView(navigateTo, currentUser, 'mine');
          break;
        }
        container.innerHTML = renderMyTicketsView();
        initMyTicketsView(navigateTo);
        break;
      case 'all-tickets':
        if (!isTech) { navigateTo('my-tickets'); return; }
        const mode = currentUser.role === 'admin' ? 'admin' : 'unassigned';
        container.innerHTML = renderTechTicketsView(currentUser, mode);
        initTechTicketsView(navigateTo, currentUser, mode);
        break;
      case 'dashboard':
        if (!isTech) { navigateTo('my-tickets'); return; }
        container.innerHTML = renderDashboardView();
        initDashboardView(currentUser);
        break;
      default:
        navigateTo(isTech ? 'all-tickets' : 'my-tickets');
    }
  }

  await boot();
})();