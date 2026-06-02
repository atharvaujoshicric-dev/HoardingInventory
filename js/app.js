// ============================================================
// SPYDEE v3 — Main App Shell & Router
// ============================================================

function renderApp() {
  const root=document.getElementById('app');
  if(!AppState.currentUser){ root.innerHTML=renderLanding(); return; }
  root.innerHTML=renderDashboardShell();
  renderDashboardContent();
}

function renderDashboardShell() {
  const user=AppState.currentUser;
  const role=user.role;
  const wallet=SPYDEE_DATA.users.find(u=>u.id===user.id)?.wallet||0;
  const unread=AppState.getUnreadCount();

  const tabs={
    superadmin:[{id:'admin',icon:'⚙️',label:'Admin Panel'}],
    vendor:[{id:'vendor',icon:'🏗',label:'My Inventory'},{id:'map',icon:'🗺',label:'Map View'}],
    customer:[{id:'map',icon:'🗺',label:'Discover Hoardings'}],
    printer:[{id:'printer',icon:'🖨',label:'Job Pool'}]
  };

  if(!AppState.dashboardTab){
    AppState.dashboardTab=role==='superadmin'?'admin':role==='vendor'?'vendor':role==='printer'?'printer':'map';
  }

  return `<div class="dashboard-shell">
    <nav class="dash-navbar">
      <div class="dash-logo">
        <span class="logo-spider">🕷</span>
        <span class="logo-text">Spydee</span>
        <span class="role-pill role-${role}">${role}</span>
      </div>
      <div class="dash-tabs">
        ${(tabs[role]||[]).map(t=>`<button class="dash-tab ${AppState.dashboardTab===t.id?'active':''}" onclick="switchTab('${t.id}')">${t.icon} ${t.label}</button>`).join('')}
      </div>
      <div class="dash-nav-right">
        ${role!=='superadmin'?`<div class="wallet-display">💳 ${formatCurrency(wallet)}</div>`:''}
        <div class="notif-bell" onclick="toggleNotifications()">
          🔔
          ${unread>0?`<span class="notif-badge">${unread}</span>`:''}
          <div class="notif-dropdown" id="notif-dropdown">
            <div class="notif-header">
              <span>Notifications</span>
              ${unread>0?`<button onclick="event.stopPropagation();AppState.markAllNotifRead();renderApp()" class="btn-xs">Mark all read</button>`:''}
            </div>
            <div class="notif-list">
              ${AppState.getMyNotifications().length===0
                ?'<div style="padding:16px;text-align:center;color:var(--text-dim);font-size:13px">No notifications</div>'
                :AppState.getMyNotifications().map(n=>`
                <div class="notif-item ${n.read?'read':''}" onclick="AppState.markNotifRead('${n.id}');renderApp()">
                  <div class="notif-dot" style="background:${n.type==='success'?'var(--green)':n.type==='error'?'var(--red)':'var(--teal)'}"></div>
                  <div class="notif-content">
                    <strong>${n.title}</strong>
                    <p>${n.message}</p>
                    <span class="notif-time">${new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        </div>
        <div class="user-menu" onclick="toggleUserMenu()">
          <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <span class="user-name">${user.name.split(' ')[0]}</span>
          <span class="chevron">▾</span>
          <div class="user-dropdown" id="user-dropdown">
            <div class="dropdown-info">
              <strong>${user.name}</strong>
              <span>📧 ${user.email}</span>
              <span>📱 ${user.mobile}</span>
              ${user.company?`<span>🏢 ${user.company}</span>`:''}
              ${user.gst?`<span>🧾 ${user.gst}</span>`:''}
            </div>
            <div class="dropdown-meta">
              <span>Joined ${user.createdAt}</span>
              <span>${user.loginCount||0} logins</span>
            </div>
            <button onclick="AppState.logout();renderApp()" class="dropdown-logout">Sign Out</button>
          </div>
        </div>
      </div>
    </nav>
    <main class="dash-main" id="dash-main"></main>
  </div>`;
}

function renderDashboardContent() {
  const main=document.getElementById('dash-main');
  if(!main) return;
  const role=AppState.currentUser?.role;
  const tab=AppState.dashboardTab;
  if(tab==='admin'&&role==='superadmin') main.innerHTML=renderAdminView();
  else if(tab==='vendor'&&role==='vendor') main.innerHTML=renderVendorView();
  else if(tab==='printer'&&role==='printer') main.innerHTML=renderPrinterView();
  else if(tab==='map'&&(role==='customer'||role==='vendor')) main.innerHTML=renderAdvertiserView();
  else main.innerHTML=`<div class="empty-state" style="margin:40px auto;max-width:400px">Access restricted for your role.</div>`;
}

function renderDashboard() {
  const main=document.getElementById('dash-main');
  if(!main) renderApp();
  else renderDashboardContent();
}

function switchTab(tab) { AppState.dashboardTab=tab; renderApp(); }

function toggleUserMenu() { document.getElementById('user-dropdown')?.classList.toggle('visible'); }
function toggleNotifications() {
  document.getElementById('notif-dropdown')?.classList.toggle('visible');
  document.getElementById('user-dropdown')?.classList.remove('visible');
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg,type='info') {
  const c=document.getElementById('toast-container');
  const t=document.createElement('div');
  t.className=`toast toast-${type}`; t.textContent=msg;
  c.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('visible'));
  setTimeout(()=>{ t.classList.remove('visible'); setTimeout(()=>t.remove(),300); },4500);
}

// ── Global Click Dismissal ────────────────────────────────────
document.addEventListener('click',e=>{
  if(!e.target.closest('.user-menu')) document.getElementById('user-dropdown')?.classList.remove('visible');
  if(!e.target.closest('.notif-bell')) document.getElementById('notif-dropdown')?.classList.remove('visible');
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape') closeModal();
});

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  AppState.load();
  renderApp();
});
