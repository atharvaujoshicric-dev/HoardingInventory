// ============================================================
// SPYDEE v3 — Main App Shell, Router & Wallet Sync
// ============================================================

function renderApp() {
  // Only destroy map when navigating away from map tab
  if (AppState.dashboardTab !== 'map') destroyMap();
  const root = document.getElementById('app');
  if (!AppState.currentUser) { root.innerHTML = renderLanding(); return; }
  root.innerHTML = renderDashboardShell();
  renderDashboardContent();
}

// ── Live wallet update (no full shell re-render) ─────────────
function syncWalletDisplay() {
  const user = SPYDEE_DATA.users.find(u => u.id === AppState.currentUser?.id);
  if (!user) return;
  AppState.currentUser.wallet = user.wallet;
  const el = document.getElementById('wallet-display');
  if (el) {
    el.textContent = '💳 ' + formatCurrency(user.wallet);
    el.classList.add('wallet-flash');
    setTimeout(() => el.classList.remove('wallet-flash'), 600);
  }
}

function renderDashboardShell() {
  const user = AppState.currentUser;
  const role = user.role;
  const wallet = SPYDEE_DATA.users.find(u => u.id === user.id)?.wallet || 0;
  const unread = AppState.getUnreadCount();

  const tabs = {
    superadmin: [{ id:'admin', icon:'⚙️', label:'Admin Panel' }],
    vendor: [{ id:'vendor', icon:'🏗', label:'My Inventory' }, { id:'map', icon:'🗺', label:'Map View' }],
    customer: [{ id:'map', icon:'🗺', label:'Discover Hoardings' }],
    printer: [{ id:'printer', icon:'🖨', label:'Job Pool' }]
  };

  if (!AppState.dashboardTab) {
    AppState.dashboardTab = role === 'superadmin' ? 'admin' : role === 'vendor' ? 'vendor' : role === 'printer' ? 'printer' : 'map';
  }

  return `<div class="dashboard-shell">
    <nav class="dash-navbar">
      <div class="dash-logo">
        <span class="logo-spider">🕷</span>
        <span class="logo-text">Spydee</span>
        <span class="role-pill role-${role}">${role}</span>
      </div>
      <div class="dash-tabs">
        ${(tabs[role] || []).map(t => `
          <button class="dash-tab ${AppState.dashboardTab === t.id ? 'active' : ''}" onclick="switchTab('${t.id}')">
            ${t.icon} ${t.label}
          </button>`).join('')}
      </div>
      <div class="dash-nav-right">
        ${role !== 'superadmin' ? `<div class="wallet-display" id="wallet-display">💳 ${formatCurrency(wallet)}</div>` : ''}
        <!-- Notification Bell -->
        <div class="notif-bell" id="notif-bell" onclick="toggleNotifications()">
          🔔
          ${unread > 0 ? `<span class="notif-badge">${unread}</span>` : ''}
          <div class="notif-dropdown" id="notif-dropdown">
            <div class="notif-header">
              <span>🔔 Notifications</span>
              <button onclick="event.stopPropagation();AppState.markAllNotifRead();updateNotifBell()" class="btn-xs">Mark all read</button>
            </div>
            <div class="notif-list">
              ${AppState.getMyNotifications().length === 0
                ? '<div style="padding:20px;text-align:center;color:#555570;font-size:13px">No notifications yet</div>'
                : AppState.getMyNotifications().map(n => `
                  <div class="notif-item ${n.read ? 'read' : ''}" onclick="AppState.markNotifRead('${n.id}');updateNotifBell()">
                    <div class="notif-dot" style="background:${n.type === 'success' ? 'var(--green)' : n.type === 'error' ? 'var(--red)' : 'var(--teal)'}"></div>
                    <div class="notif-content">
                      <strong>${n.title}</strong>
                      <p>${n.message}</p>
                      <span class="notif-time">${new Date(n.createdAt).toLocaleString('en-IN', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                  </div>`).join('')}
            </div>
          </div>
        </div>
        <!-- User Menu -->
        <div class="user-menu" onclick="toggleUserMenu()">
          <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <span class="user-name">${user.name.split(' ')[0]}</span>
          <span class="chevron">▾</span>
          <div class="user-dropdown" id="user-dropdown">
            <div class="dropdown-info">
              <strong>${user.name}</strong>
              <span>📧 ${user.email}</span>
              <span>📱 ${user.mobile}</span>
              ${user.company ? `<span>🏢 ${user.company}</span>` : ''}
              ${user.gst ? `<span class="gst-code">🧾 ${user.gst}</span>` : ''}
            </div>
            <div class="dropdown-meta">
              <span>Joined ${user.createdAt}</span>
              <span>${user.loginCount || 0} logins</span>
            </div>
            <button onclick="AppState.logout();renderApp()" class="dropdown-logout">↩ Sign Out</button>
          </div>
        </div>
      </div>
    </nav>
    <main class="dash-main" id="dash-main"></main>
  </div>`;
}

function renderDashboardContent() {
  const main = document.getElementById('dash-main');
  if (!main) return;
  const role = AppState.currentUser?.role;
  const tab = AppState.dashboardTab;
  if (tab === 'admin' && role === 'superadmin') main.innerHTML = renderAdminView();
  else if (tab === 'vendor' && role === 'vendor') main.innerHTML = renderVendorView();
  else if (tab === 'printer' && role === 'printer') main.innerHTML = renderPrinterView();
  else if (tab === 'map' && (role === 'customer' || role === 'vendor')) { main.innerHTML = renderAdvertiserView(); afterAdvertiserRender(); }
  else main.innerHTML = `<div class="empty-state">Access restricted.</div>`;
}

// renderDashboard: updates UI without full shell re-render
// On map tab, does smart partial updates to avoid destroying Leaflet
function renderDashboard() {
  const main = document.getElementById('dash-main');
  if (!main) { renderApp(); return; }
  syncWalletDisplay();

  const tab = AppState.dashboardTab;
  const role = AppState.currentUser?.role;

  // On map tab: do partial updates (sidebar cards, holds, bookings)
  // to avoid destroying the live Leaflet map
  if (tab === 'map' && (role === 'customer' || role === 'vendor') && _leafletMap) {
    refreshSidebarCards();
    refreshMapMarkers();
    // Update holds panel
    const holdsEl = document.querySelector('.holds-panel');
    const myHolds = SPYDEE_DATA.hoardings.filter(h => h.holdBy === AppState.currentUser.id && h.status === 'on-hold');
    const sidePane = document.querySelector('.sidebar-pane');
    if (sidePane) {
      // Re-render entire sidebar pane content
      const myBookings = SPYDEE_DATA.bookings.filter(b => b.customerId === AppState.currentUser.id);
      const hoardings = AppState.getFilteredHoardings();
      const holdsHTML = myHolds.length > 0 ? `<div class="holds-panel">
        <h4>⏱ Active Holds (${myHolds.length})</h4>
        ${myHolds.map(h => renderHoldBanner(h)).join('')}
      </div>` : '';
      const bookingsHTML = myBookings.length > 0 ? `<div class="my-bookings">
        <h4>📋 My Campaigns</h4>
        ${myBookings.map(b => renderMyBookingCard(b)).join('')}
      </div>` : '';
      // Just update holds and bookings sections, not filter panel
      const existingHolds = sidePane.querySelector('.holds-panel');
      const filterPanel = sidePane.querySelector('.filter-panel');
      // Remove old holds
      if (existingHolds) existingHolds.remove();
      if (holdsHTML && filterPanel) filterPanel.insertAdjacentHTML('beforebegin', holdsHTML);
      // Update cards
      const cardsEl = document.getElementById('hoarding-cards');
      if (cardsEl) cardsEl.innerHTML = hoardings.length === 0
        ? `<div class="empty-state">No hoardings in range.</div>`
        : hoardings.map(h => renderHoardingCard(h)).join('');
      // Update bookings
      const existingBk = sidePane.querySelector('.my-bookings');
      if (existingBk) existingBk.remove();
      if (bookingsHTML) sidePane.insertAdjacentHTML('beforeend', bookingsHTML);
    }
    return;
  }

  // Full content re-render for non-map tabs
  renderDashboardContent();
}

function switchTab(tab) {
  if (AppState.dashboardTab === 'map' && tab !== 'map') destroyMap();
  AppState.dashboardTab = tab;
  renderApp();
}

// Live notification bell update (no full re-render)
function updateNotifBell() {
  AppState.save();
  const unread = AppState.getUnreadCount();
  const bell = document.getElementById('notif-bell');
  if (!bell) return;
  const badge = bell.querySelector('.notif-badge');
  if (unread > 0) {
    if (badge) badge.textContent = unread;
    else bell.insertAdjacentHTML('beforeend', `<span class="notif-badge">${unread}</span>`);
  } else if (badge) badge.remove();
  // Refresh list inside dropdown
  const list = bell.querySelector('.notif-list');
  if (list) {
    const notifs = AppState.getMyNotifications();
    list.innerHTML = notifs.length === 0
      ? '<div style="padding:20px;text-align:center;color:#555570;font-size:13px">No notifications yet</div>'
      : notifs.map(n => `
        <div class="notif-item ${n.read ? 'read' : ''}" onclick="AppState.markNotifRead('${n.id}');updateNotifBell()">
          <div class="notif-dot" style="background:${n.type === 'success' ? 'var(--green)' : n.type === 'error' ? 'var(--red)' : 'var(--teal)'}"></div>
          <div class="notif-content">
            <strong>${n.title}</strong><p>${n.message}</p>
            <span class="notif-time">${new Date(n.createdAt).toLocaleString('en-IN', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
          </div>
        </div>`).join('');
  }
}

function toggleUserMenu() { document.getElementById('user-dropdown')?.classList.toggle('visible'); }
function toggleNotifications() {
  document.getElementById('notif-dropdown')?.classList.toggle('visible');
  document.getElementById('user-dropdown')?.classList.remove('visible');
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = msg;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 4500);
}

// ── Global Click Dismissal ────────────────────────────────────
document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu')) document.getElementById('user-dropdown')?.classList.remove('visible');
  if (!e.target.closest('.notif-bell')) document.getElementById('notif-dropdown')?.classList.remove('visible');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  AppState.load();
  renderApp();
});
