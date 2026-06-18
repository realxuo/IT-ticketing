// Dashboard View
function renderDashboardView() {
  return `
    <div class="page-header">
      <div>
        <div class="page-title" id="dashboard-title">Dashboard</div>
        <div class="page-subtitle" id="dashboard-subtitle">Loading…</div>
      </div>
    </div>
    <div class="page-body" id="dashboard-body">
      <div class="empty-state"><h3>Loading dashboard…</h3></div>
    </div>`;
}

async function initDashboardView(currentUser) {
  let data;
  try {
    data = await API.getDashboard();
  } catch (e) { Toast.error('Failed to load dashboard'); return; }

  const body = document.getElementById('dashboard-body');
  if (!body) return;

  const titleEl = document.getElementById('dashboard-title');
  const subtitleEl = document.getElementById('dashboard-subtitle');
  if (titleEl) titleEl.textContent = data.is_admin ? 'Dashboard' : 'My Dashboard';
  if (subtitleEl) subtitleEl.textContent = data.is_admin ? 'All support operations' : 'Your assigned tickets overview';

  const sc = data.status_counts || {};
  const openCount = sc.open || 0;
  const inProgCount = sc.in_progress || 0;
  const waitingCount = sc.waiting_for_user || 0;
  const resolvedCount = (sc.resolved || 0) + (sc.closed || 0);

  const avgHours = data.avg_resolution_hours || 0;
  const avgDisplay = avgHours < 24
    ? `${avgHours.toFixed(1)}h`
    : `${(avgHours / 24).toFixed(1)}d`;

  const statusColors = {
    open: 'var(--accent)', in_progress: 'var(--yellow)',
    waiting_for_user: 'var(--orange)', resolved: 'var(--green)', closed: 'var(--text-3)'
  };
  const catColors = ['var(--purple)', 'var(--accent)', 'var(--green)', 'var(--yellow)'];

  // Category bar chart
  const maxCat = Math.max(...(data.category_counts || []).map(c => c.count), 1);
  const catBars = (data.category_counts || []).map((c, i) => `
    <div class="bar-row">
      <span class="bar-label">${categoryLabel(c.category)}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(c.count / maxCat * 100).toFixed(1)}%;background:${catColors[i % catColors.length]}"></div>
      </div>
      <span class="bar-count">${c.count}</span>
    </div>`).join('');

  // Status donut
  const statusSegments = Object.entries(sc).filter(([,v]) => v > 0).map(([k, v]) => ({
    value: v, color: statusColors[k] || 'var(--text-3)'
  }));
  const statusLegend = Object.entries(sc).filter(([,v]) => v > 0).map(([k, v]) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${statusColors[k] || 'var(--text-3)'}"></span>
      <span class="legend-label">${statusLabel(k)}</span>
      <span class="legend-count">${v}</span>
    </div>`).join('');

  // Activity bar chart
  const days = data.daily_counts || [];
  const maxDay = Math.max(...days.map(d => d.count), 1);
  const chartHeight = 120;
  const activityBars = days.map(d => {
    const h = Math.max((d.count / maxDay) * chartHeight, 6);
    const label = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1;min-width:0">
      <div style="font-size:.7rem;color:var(--text-3);font-weight:500">${d.count}</div>
      <div style="width:60%;max-width:36px;background:var(--accent);border-radius:4px 4px 2px 2px;height:${h}px;opacity:.85;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.85"></div>
      <div style="font-size:.7rem;color:var(--text-3)">${label}</div>
    </div>`;
  }).join('');

  // Workload
  const maxWork = Math.max(...(data.workload || []).map(w => w.open_tickets), 1);
  const workRows = (data.workload || []).map(w => `
    <div class="workload-row">
      ${data.is_admin ? `<div class="user-avatar" style="width:28px;height:28px;font-size:.75rem;flex-shrink:0">${w.name.charAt(0)}</div>
      <span class="workload-name">${w.name}</span>` : ''}
      <div class="workload-bar-wrap">
        <div class="bar-track">
          <div class="bar-fill" style="width:${(w.open_tickets / maxWork * 100).toFixed(1)}%;background:var(--accent)"></div>
        </div>
      </div>
      <span class="workload-count">${w.open_tickets} open · ${w.total_tickets} total</span>
    </div>`).join('');

  body.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="stat-icon">${Icon.ticket}</div>
        <div class="stat-value">${openCount}</div>
        <div class="stat-label">Open Tickets</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">${Icon.clock}</div>
        <div class="stat-value">${inProgCount}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">${Icon.check}</div>
        <div class="stat-value">${resolvedCount}</div>
        <div class="stat-label">Resolved</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">${Icon.clock}</div>
        <div class="stat-value">${avgDisplay}</div>
        <div class="stat-label">Avg Resolution</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Tickets by Category</div>
        </div>
        <div class="bar-chart">${catBars || '<p style="color:var(--text-3)">No data</p>'}</div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Status Breakdown</div>
        </div>
        <div class="donut-wrap">
          ${donutChart(statusSegments, 130)}
          <div class="donut-legend">${statusLegend}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">${data.is_admin ? 'Technician Workload' : 'My Workload'}</div>
        </div>
        <div class="workload-table">${workRows || '<p style="color:var(--text-3)">No data</p>'}</div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Activity (Last 7 Days)</div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:4px;height:160px;padding:8px 4px 0">
          ${activityBars || '<p style="color:var(--text-3)">No recent activity</p>'}
        </div>
      </div>
    </div>`;
}