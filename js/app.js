// ============================================================
// SPYDEE - Main App Renderer & Utilities
// ============================================================

function renderApp() {
  const root = document.getElementById('app');
  if (!AppState.currentUser) {
    root.innerHTML = renderLanding();
    AppState.currentView = 'landing';
    return;
  }
  AppState.currentView = 'dashboard';
  root.innerHTML = renderDashboardShell();
  renderDashboardContent();
}

function renderDashboardShell() {
  const user = AppState.currentUser;
  const role = user.role;
  const wallet = SPYDEE_DATA.users.find(u => u.id === user.id)?.wallet || 0;

  const tabs = {
    superadmin: [{ id: 'admin', icon: '⚙️', label: 'Admin Panel' }],
    vendor: [
      { id: 'vendor', icon: '🏗', label: 'My Inventory' },
      { id: 'map', icon: '🗺', label: 'Map View' }
    ],
    customer: [
      { id: 'map', icon: '🗺', label: 'Discover Hoardings' }
    ],
    printer: [
      { id: 'printer', icon: '🖨', label: 'Job Pool' }
    ]
  };

  const defaultTab = role === 'superadmin' ? 'admin' : role === 'vendor' ? 'vendor' : role === 'printer' ? 'printer' : 'map';
  if (!AppState.dashboardTab || AppState.dashboardTab === 'landing') {
    AppState.dashboardTab = defaultTab;
  }

  return `
  <div class="dashboard-shell">
    <!-- Top NavBar -->
    <nav class="dash-navbar">
      <div class="dash-logo">
        <span class="logo-spider">🕷</span>
        <span class="logo-text">Spydee</span>
        <span class="role-pill role-${role}">${role}</span>
      </div>
      <div class="dash-tabs">
        ${(tabs[role] || []).map(t => `
          <button class="dash-tab ${AppState.dashboardTab === t.id ? 'active' : ''}"
                  onclick="switchTab('${t.id}')">
            ${t.icon} ${t.label}
          </button>
        `).join('')}
      </div>
      <div class="dash-nav-right">
        ${role !== 'superadmin' ? `
        <div class="wallet-display">
          💳 ${formatCurrency(wallet)}
        </div>` : ''}
        <div class="user-menu" onclick="toggleUserMenu()">
          <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <span class="user-name">${user.name.split(' ')[0]}</span>
          <span class="chevron">▾</span>
          <div class="user-dropdown" id="user-dropdown">
            <div class="dropdown-info">
              <strong>${user.name}</strong>
              <span>${user.email}</span>
              <span>${user.mobile}</span>
            </div>
            ${user.company ? `<div class="dropdown-company">${user.company}</div>` : ''}
            <button onclick="AppState.logout();renderApp()" class="dropdown-logout">Sign Out</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Content Area -->
    <main class="dash-main" id="dash-main">
      <!-- content injected here -->
    </main>
  </div>`;
}

function renderDashboardContent() {
  const main = document.getElementById('dash-main');
  if (!main) return;

  const role = AppState.currentUser?.role;
  const tab = AppState.dashboardTab;

  if (tab === 'admin' && role === 'superadmin') {
    main.innerHTML = renderAdminView();
  } else if (tab === 'vendor' && role === 'vendor') {
    main.innerHTML = renderVendorView();
  } else if (tab === 'printer' && role === 'printer') {
    main.innerHTML = renderPrinterView();
  } else if (tab === 'map') {
    // Only customers and vendors can see map
    if (role === 'customer' || role === 'vendor') {
      main.innerHTML = renderAdvertiserView();
    } else {
      main.innerHTML = `<div class="empty-state">Access restricted.</div>`;
    }
  } else {
    main.innerHTML = `<div class="empty-state">Select a tab.</div>`;
  }
}

function renderDashboard() {
  // Re-render content area without rebuilding shell (preserves navbar)
  const main = document.getElementById('dash-main');
  if (!main) { renderApp(); return; }
  renderDashboardContent();
}

function switchTab(tab) {
  AppState.dashboardTab = tab;
  renderApp();
}

function toggleUserMenu() {
  document.getElementById('user-dropdown')?.classList.toggle('visible');
}

// ── Toast Notifications ───────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Global Click Handler ──────────────────────────────────────
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown && !e.target.closest('.user-menu')) {
    dropdown.classList.remove('visible');
  }
  if (!e.target.closest('.modal-card') && !e.target.closest('button')) {
    // Don't close on outside clicks for this design
  }
});

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  AppState.load();
  renderApp();
});
